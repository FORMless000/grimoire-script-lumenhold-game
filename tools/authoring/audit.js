'use strict';
const { hash } = require('./util.js');

function normalize(text, format) {
  const events = [], unknown = [], outputs = new Map();
  for (const [i, line] of text.split('\n').entries()) {
    if (!line.trim()) continue;
    let row;
    try { row = JSON.parse(line); } catch { unknown.push('Malformed JSONL line ' + (i + 1)); continue; }
    if (format === 'codex') {
      if (row.type === 'thread.started') events.push({ type: 'start', session: row.thread_id });
      if (row.type === 'turn.completed' || row.type === 'turn.failed') events.push({ type: 'end', failed: row.type === 'turn.failed', usage: row.usage });
      if (row.type === 'item.completed') {
        const item = row.item || {};
        if (item.type === 'command_execution') events.push({ type: 'command', command: item.command, output: typeof item.aggregated_output === 'string' ? item.aggregated_output : null, id: item.id });
        else if (item.type === 'mcp_tool_call') events.push({ type: 'tool', tool: item.server + '/' + item.tool, input: item.arguments, output: item.result == null ? null : JSON.stringify(item.result), id: item.id });
        else if (item.type === 'web_search') events.push({ type: 'external-access', id: item.id });
        else if (item.type === 'file_change') events.push({ type: 'write', changes: item.changes, id: item.id });
        else if (!['agent_message', 'reasoning', 'plan_update'].includes(item.type)) unknown.push('Unsupported Codex item: ' + item.type);
      }
    } else if (format === 'claude') {
      if (row.type === 'system' && row.subtype === 'init') events.push({ type: 'start', session: row.session_id, model: row.model });
      if (row.type === 'result') events.push({ type: 'end', failed: !!row.is_error, usage: row.usage, cost: row.total_cost_usd });
      for (const block of row.message?.content || []) if (block.type === 'tool_use') {
        if (block.name === 'Bash') events.push({ type: 'command', command: block.input?.command, id: block.id });
        else if (block.name === 'Read' || block.name === 'Grep' || block.name === 'Glob') events.push({ type: 'read', input: block.input, id: block.id });
        else if (['Edit', 'Write', 'MultiEdit'].includes(block.name)) events.push({ type: 'write', input: block.input, id: block.id });
        else events.push({ type: 'tool', tool: block.name, input: block.input, id: block.id });
      }
      for (const block of row.message?.content || []) if (block.type === 'tool_result') outputs.set(block.tool_use_id, typeof block.content === 'string' ? block.content : (block.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n'));
    } else if (format === 'normalized') {
      if (['start', 'end', 'command', 'read', 'write', 'tool', 'external-access'].includes(row.type)) events.push(row);
      else unknown.push('Unsupported normalized event at line ' + (i + 1));
    } else throw new Error('Trace format must be codex, claude, or normalized');
  }
  for (const event of events) if (outputs.has(event.id)) event.output = outputs.get(event.id);
  return { events, unknown };
}
function audit(run, imported, toolLog, integrity = []) {
  const violations = integrity.slice(), missing = [], observations = [];
  const native = normalize(imported.text, imported.format), att = imported.attestation || {};
  for (const field of ['promptHash', 'commonHash', 'workflowHash', 'sourceHash', 'model', 'harnessVersion', 'settingsHash']) {
    if (!att[field]) missing.push('Missing human invocation attestation: ' + field);
    else if (att[field] !== run[field]) violations.push('Invocation differs: ' + field);
  }
  if (att.freshSession !== true || att.complete !== true || att.by !== 'human') missing.push('Human confirmation of a fresh session and complete export is required');
  if (run.environmentHash && att.environmentHash !== run.environmentHash) missing.push('Shared environment invocation attestation missing or different');
  const starts = native.events.filter((e) => e.type === 'start'), ends = native.events.filter((e) => e.type === 'end');
  if (starts.length !== 1 || !ends.length) missing.push('Expected one session start and a terminal event');
  if (starts[0]?.model && starts[0].model !== run.model) violations.push('Observed author model differs');
  if (att.session && starts[0]?.session !== att.session) violations.push('Session identity differs');
  missing.push(...native.unknown);
  const resolutions = imported.resolutions || {};
  for (const event of native.events) {
    const serialized = JSON.stringify({ command: event.command, input: event.input, tool: event.tool, changes: event.changes }), key = hash(event);
    const resolution = resolutions[key];
    if (resolution && (resolution.by !== 'human' || !resolution.reason || typeof resolution.allowed !== 'boolean')) missing.push('Resolution needs human provenance and an explicit decision: ' + key);
    if (resolution?.allowed === false) violations.push('Human rejected access: ' + key);
    if (/\b(?:codex|claude)\b.*(?:--resume|--continue|--fork-session|\bexec\s+(?:resume|fork)\b)/.test(event.command || '')) violations.push('Resumed/forked author context');
    if (/author-eval\s+(?:critic|critic-packet|review|report|lock)\b/.test(event.command || '')) violations.push('Outside critique or evaluation access before artifact freeze');
    if (/https?:\/\/|\bcurl\b|\bwget\b/.test(event.command || '') || event.type === 'external-access') violations.push('Unregistered external source access');
    if (/\.critic\.json|review-state|private\.json|heldout/i.test(serialized)) violations.push('Possible evaluation-label access');
    for (const match of serialized.matchAll(/[\/]trials[\/]([^\s"'\\/]+)[\/]/g)) if (match[1] !== run.id) violations.push('Cross-trial access');
    if (event.type === 'command') {
      const command = event.command || '';
      const recognized = /^\s*(?:node\s+tools\/grim\.js\s+(?:retrieve|author-eval|brief|query|show|graph|lint|check|build|fmt\s+--check|reach|ids)(?:\s+[^;&|<>`$()]+)?|(?:cat|sed|rg|head|tail)\s+[^;&|<>`$()]+|pwd|ls(?:\s+[^;&|<>`$()]+)?)\s*$/.test(command);
      if (!recognized && !resolutions[key]) missing.push('Resolve command ' + key + ': ' + command);
      if (!recognized && resolution && !Number.isInteger(resolution.returnedChars)) missing.push('Resolve additional source-output size (zero if none): ' + key);
      if (run.backend !== 'baseline' && /grim\.js\s+(?:brief|query|show|graph)\b/.test(command)) violations.push('Unassigned legacy retrieval bypass');
      if (run.backend === 'baseline' && /grim\.js\s+retrieve\b/.test(command)) violations.push('Unassigned new retrieval in the baseline');
      if (run.profile === 'no-graph' && /\bneighbors\b/.test(command)) violations.push('Graph operation during graph ablation');
      if (/^\s*(?:cat|sed|rg|head|tail)\b/.test(command) && event.output == null && !Number.isInteger(resolutions[key]?.returnedChars)) missing.push('Native source command output/size unavailable: ' + key);
    } else if (event.type === 'tool') {
      if (!resolution) missing.push('Resolve tool access ' + key + ': ' + event.tool);
      if (resolution && !Number.isInteger(resolution.returnedChars)) missing.push('Resolve additional tool source-output size: ' + key);
    }
    if (event.type === 'write') {
      const files = event.input?.file_path ? [event.input.file_path] : (event.changes || []).map((c) => c.path);
      if (!files.length && !resolution) missing.push('Resolve write target: ' + key);
      for (const file of files) if (!/(?:^|\/)content\/(?:events\/trial|world\/lore\/soft\/trial)\.grim$/.test(file)) violations.push('Write outside the registered output contract: ' + file);
    }
    if (event.type === 'read') {
      const file = event.input?.file_path || event.input?.path;
      if (!file || /\.bundle\.js$|[\/]\.git[\/]|\.env/.test(file)) missing.push('Resolve native read ' + key);
      if (file && file.startsWith('/') && run.allowedReadRoots && !run.allowedReadRoots.some((root) => file.startsWith(root + '/')) && !resolutions[key]) missing.push('Resolve source outside trial inputs: ' + key);
      if (event.output == null && !Number.isInteger(resolutions[key]?.returnedChars)) missing.push('Native read output/size unavailable: ' + key);
    }
    const sourceAccess = event.type === 'read' || event.type === 'command' && /^\s*(?:cat|sed|rg|head|tail)\b/.test(event.command || '');
    if (sourceAccess && /(?:^|[\/"\s])(?:cache|receipts|critics|judge-packets|panel-results|artifacts|imports)[\/]/.test(serialized)) violations.push('Read of excluded retrieval cache or evaluator records');
  }
  let tools;
  try { tools = toolLog.split('\n').filter(Boolean).map((l) => JSON.parse(l)); } catch { tools = []; missing.push('Malformed retrieval tool log'); }
  const effective = [];
  for (const e of tools) {
    if (e.run !== run.id || e.corpusHash !== run.corpusHash) violations.push('Tool run/corpus identity differs');
    if (e.backend !== run.backend || e.profile !== run.profile) violations.push('Tool backend/profile differs');
    if (e.error) observations.push('Tool error retained: ' + e.error);
    if (e.resultHash && hash(e.result) !== e.resultHash) violations.push('Tool result digest differs');
    if (e.indexHash) {
      if (!e.indexIdentity || !e.components) missing.push('Index identity/components missing');
      if (run.indexIdentity && e.indexIdentity !== run.indexIdentity) violations.push('Wrong index configuration');
      if (run.backend === 'grim') {
        for (const [component, on] of Object.entries(run.components)) if (e.components?.[component] !== on) violations.push('Ablation component mismatch: ' + component);
        if (e.indexComponents && hash(e.indexComponents) !== hash(run.components)) violations.push('Ablation index component mismatch');
      }
    }
    for (const stage of e.stages || []) {
      effective.push(stage);
      if (stage.enabled && run.components?.[stage.stage] === false) violations.push('Ablated stage executed: ' + stage.stage);
    }
  }
  const searches = tools.filter((e) => ['search', 'brief', 'related'].includes(e.operation) && !e.error);
  if (run.backend !== 'baseline' && !searches.length) missing.push('No successful assigned-backend retrieval');
  if (run.backend === 'baseline' && !native.events.some((e) => /grim\.js\s+(?:brief|query|show|graph)\b/.test(e.command || ''))) missing.push('No baseline retrieval observed');
  if (run.backend === 'grim') {
    for (const name of ['dense', 'rerank']) if (searches.length && !effective.some((e) => e.stage === name && e.enabled === run.components[name])) missing.push('Actual stage state not observed: ' + name);
    if (searches.length && !tools.some((e) => e.indexComponents && hash(e.indexComponents) === hash(run.components))) missing.push('Index component provenance missing');
  }
  // Tool logs alone do not prove exposure: require a matching native invocation for each logged operation.
  const commands = native.events.filter((e) => e.type === 'command');
  for (const e of tools) {
    const candidates = commands.filter((c) => (c.command || '').includes('retrieve ' + e.operation));
    if (!candidates.length) missing.push('No native invocation for tool receipt ' + e.operation);
    else if (!e.error && !candidates.some((c) => {
      if (c.output == null) return false;
      if (e.outputHash && hash(c.output.trimEnd()) === e.outputHash) return true;
      try { return hash(JSON.parse(c.output)) === e.resultHash; } catch { return !!e.result?.text && c.output.includes(e.result.text); }
    })) missing.push('Native output does not bind tool result: ' + e.operation);
  }
  for (const e of commands) if (/grim\.js\s+(?:brief|query|show|graph)\b/.test(e.command || '') && e.output == null) missing.push('Baseline output unavailable');
  function commonRead(event) {
    const paths = event.type === 'read' ? [event.input?.file_path || event.input?.path].filter(Boolean) : (event.command || '').match(/[\w./-]+\.(?:md|grim|js|json|lang)\b/g) || [];
    return paths.length > 0 && paths.every((file) => (run.ruleFiles || []).some((rule) => file === rule || file.endsWith('/' + rule)));
  }
  let commonRuleChars = 0;
  const sourceChars = tools.reduce((n, e) => n + (e.returnedChars || e.result?.chars || JSON.stringify(e.result || {}).length), 0) + native.events.reduce((n, e) => {
    const measured = e.type === 'command' && /^(?:cat|sed|rg|head|tail)\b|grim\.js\s+(?:brief|query|show|graph)\b/.test((e.command || '').trim()) || e.type === 'read';
    const chars = measured ? e.output?.length ?? resolutions[hash(e)]?.returnedChars ?? 0 : resolutions[hash(e)]?.returnedChars || 0;
    if (commonRead(e)) { commonRuleChars += chars; return n; }
    return n + chars;
  }, 0);
  if (run.budget && sourceChars > run.budget.returnedChars) violations.push('Returned evidence budget exceeded');
  const toolCallCount = native.events.filter((e) => ['command', 'read', 'write', 'tool', 'external-access'].includes(e.type)).length;
  if (run.budget?.maxToolCalls && toolCallCount > run.budget.maxToolCalls) violations.push('Tool-call stopping limit exceeded');
  const sourceIds = [...new Set([...tools.flatMap((e) => [...(e.result?.ids || []), ...(e.result?.results || []).map((r) => r.key)]), ...Object.values(resolutions).filter((r) => r.by === 'human' && r.allowed).flatMap((r) => r.sourceIds || [])])];
  return { status: violations.length ? 'violated' : missing.length ? 'unverifiable' : 'verified', violations: [...new Set(violations)], missing: [...new Set(missing)], observations,
    qualification: 'Observed trace plus explicit human invocation attestations; hidden provider state is not observable.', session: starts[0]?.session || null,
    usage: ends.map((e) => e.usage || null), cost: ends.some((e) => Number.isFinite(e.cost)) ? ends.reduce((n, e) => n + (e.cost || 0), 0) : null,
    toolCalls: toolCallCount, retrievalCalls: tools.length, sourceIds, sourceChars, commonRuleChars, observedContextChars: sourceChars + commonRuleChars, retrievalElapsedMs: tools.reduce((n, e) => n + (e.elapsedMs || 0), 0),
    retrievalUsage: tools.flatMap((e) => [...(e.calls || []), ...(e.stages || []).filter((s) => s.stage === 'external').flatMap((s) => s.calls || [])]).map((c) => ({ model: c.model, provider: c.provider, usage: c.usage })) };
}
module.exports = { normalize, audit };
