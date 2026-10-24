'use strict';
const fs = require('fs');
const path = require('path');
const E = require('./experiments.js');
const U = require('./util.js');

const quote = (s) => "'" + String(s).replaceAll("'", "'\\''") + "'";
function prepare(directory, id, options = {}) {
  const study = path.resolve(directory), m = E.load(study), run = E.trial(m, id);
  if (!['codex', 'claude'].includes(run.harness)) throw new Error('Generated handoffs support codex or claude; import equivalent interactive traces for other harnesses.');
  if (Object.keys(run.settings).some(k => k !== 'reasoningEffort')) throw new Error('Custom harness settings need a manually reviewed invocation; handoff supports only reasoningEffort.');
  const problems = E.integrity(study, m, run); if (problems.length) throw new Error(problems.join('\n'));
  if (run.state !== 'prepared') throw new Error('Handoff requires an unstarted trial');
  const out = path.join(study, 'handoffs', id);
  if (fs.existsSync(out)) throw new Error('Handoff already exists; retain it rather than overwrite logs.');
  const workspace = path.join(study, 'trials', id), promptFile = path.join(workspace, 'authoring-input/prompt.md');
  if (U.hash(fs.readFileSync(promptFile, 'utf8')) !== run.promptHash) throw new Error('Prompt fingerprint differs');
  if (U.hash(run.settings) !== run.settingsHash) throw new Error('Registered settings fingerprint differs');
  const input = U.readJSON(path.join(workspace, 'authoring-input/run.json'));
  for (const field of ['model', 'harness', 'harnessVersion', 'settingsHash', 'backend', 'profile', 'indexIdentity']) if (input[field] !== run[field]) throw new Error('Frozen run input differs: ' + field);
  const localKeyFile = path.join(workspace, 'rag/.env.local');
  const key = options.withLocalKey && !fs.existsSync(localKeyFile) ? (options.keyProvider || require('./credentials.js').openRouterKey)() : null;
  if (options.withLocalKey && !fs.existsSync(localKeyFile) && !key) throw new Error('Local OpenRouter key missing; no credential was copied.');
  const args = run.harness === 'codex'
    ? ['exec', '--json', '--skip-git-repo-check', '--sandbox', 'workspace-write', '--ignore-user-config', '--config', 'sandbox_workspace_write.network_access=true', '--config', 'web_search="disabled"', '--model', run.model]
    : ['--print', '--verbose', '--output-format', 'stream-json', '--safe-mode', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--tools', 'Bash,Read,Edit,Write,Grep,Glob', '--allowedTools', 'Read,Edit,Write,Grep,Glob,Bash(node tools/grim.js *)', '--permission-mode', 'dontAsk', '--model', run.model];
  // All conditions receive identical access needed by backend internals. Direct
  // author access to these shared caches/receipts remains a protocol violation.
  for (const name of ['cache', 'receipts']) args.push('--add-dir', path.join(study, name));
  if (run.settings.reasoningEffort) {
    if (run.harness === 'codex') args.push('--config', 'model_reasoning_effort=' + JSON.stringify(run.settings.reasoningEffort));
    else args.push('--effort', run.settings.reasoningEffort);
  }
  if (run.harness === 'codex') args.push('-');
  const native = path.join(out, 'native.jsonl'), stderr = path.join(out, 'stderr.log');
  const policy = { workflow: run.backend, profile: run.profile,
    retrieval: run.backend === 'baseline' ? ['brief', 'query', 'show', 'graph'] : ['retrieve search', 'retrieve read', 'retrieve neighbors', 'retrieve brief', 'retrieve related', 'retrieve status'].filter(x => x !== 'retrieve neighbors' || run.components.graph),
    outputs: ['content/events/trial.grim', 'content/world/lore/soft/trial.grim'],
    nativeReads: 'Targeted frozen sources and common rules are permitted and counted. Do not dump the corpus.',
    forbidden: ['unassigned retrieval mechanisms', 'index rebuilds', 'validation before the first operator checkpoint', 'direct backend/cache/credential access', 'web or external corpus reads', 'sibling trials and evaluator records', 'delegation', 'writes outside the two trial output files'],
    qualification: 'Declared workflow plus native-trace audit. Shell availability is not hard filesystem confinement.' };
  const attestation = { by: 'human', freshSession: false, complete: false };
  for (const field of ['promptHash', 'commonHash', 'workflowHash', 'sourceHash', 'model', 'harnessVersion', 'settingsHash', 'environmentHash']) attestation[field] = run[field];
  const command = [run.harness, ...args].map(quote).join(' ') + ' < ' + quote(promptFile) + ' > ' + quote(native) + ' 2> ' + quote(stderr);
  fs.mkdirSync(out, { recursive: true, mode: 0o700 });
  for (const name of ['cache', 'receipts']) fs.mkdirSync(path.join(study, name), { recursive: true });
  if (key) { fs.mkdirSync(path.dirname(localKeyFile), { recursive: true }); fs.writeFileSync(localKeyFile, '# Private runtime credential, excluded from frozen inputs.\nOPENROUTER_API_KEY=' + JSON.stringify(key) + '\n', { flag: 'wx', mode: 0o600 }); }
  U.writeJSON(path.join(out, 'tool-policy.json'), policy, true);
  U.writeJSON(path.join(out, 'attestation.template.json'), attestation, true);
  const info = { id, workspace, promptFile, promptHash: run.promptHash, harness: run.harness, expectedVersion: run.harnessVersion, model: run.model,
    program: run.harness, args, stdin: promptFile, stdout: native, stderr, command, policyFile: path.join(out, 'tool-policy.json'), localCredentialFile: options.withLocalKey ? localKeyFile : null };
  U.writeJSON(path.join(out, 'handoff.json'), info, true);
  const versionFile = path.join(out, 'harness-version.txt');
  fs.writeFileSync(path.join(out, 'run.sh'), '#!/bin/sh\n# The human starts one fresh author session. Existing logs cannot be overwritten.\nset -euC\numask 077\ncd ' + quote(workspace) + '\n' + quote(run.harness) + ' --version > ' + quote(versionFile) + '\nif [ "$(cat ' + quote(versionFile) + ')" != ' + quote(run.harnessVersion) + ' ]; then\n  echo "Harness version differs from study registration; author not started." >&2\n  exit 1\nfi\nif ' + command + '; then\n  printf "0\\n" > ' + quote(path.join(out, 'exit-code.txt')) + '\nelse\n  launch_exit=$?\n  printf "%s\\n" "$launch_exit" > ' + quote(path.join(out, 'exit-code.txt')) + '\n  exit "$launch_exit"\nfi\n', { flag: 'wx', mode: 0o700 });
  fs.writeFileSync(path.join(out, 'README.md'), '# Trial handoff\n\nOpen a fresh session in `' + workspace + '` and send `authoring-input/prompt.md` verbatim, or manually run the generated `run.sh` from a terminal. No model has been started by preparation. The script records native JSONL and stderr outside author context. It refuses to overwrite logs.\n\nConfirm Node 24, the exact harness version/model, settings and the registered environment before running. Inherit OPENROUTER_API_KEY through the environment for paid retrieval; do not put it in the packet or logs. Managed settings still apply. Keep the same invocation flags across all conditions.\n\nFor other operating systems, `handoff.json` specifies the native executable, argument array, working directory and stdin/stdout files; capture UTF-8 JSONL without adding banners or merging stderr.\n\nRecord the first draft externally before validator feedback. Do not let an author silently repair before its first checkpoint. Preserve interrupted/failed attempts. Review actual invocation and complete trace, then copy the attestation template and set freshSession/complete only when you can confirm them. The prefilled hashes are expected values, not an automatic human attestation. Import and audit the native trace before using the trial as evidence.\n', { flag: 'wx' });
  return { directory: out, ...info, note: 'Prepared only. The human starts the harness; this is not hard tool confinement.' };
}
module.exports = { prepare };
