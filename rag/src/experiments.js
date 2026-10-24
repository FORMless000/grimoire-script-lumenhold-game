'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const G = require('../../src/grimoire.js');
const U = require('./util.js');
const C = require('./catalog.js');
const R = require('./retrieve.js');
const Audit = require('./audit.js');

const FRAMEWORKS = ['baseline', 'lightrag'];
const RULES = ['docs/authoring/README.md', 'docs/authoring/style.md', 'docs/authoring/checklist.md', 'docs/authoring/checks.md', 'docs/authoring/costs.md', 'docs/authoring/classes.md', 'docs/authoring/presets.md', 'docs/authoring/pools.md', 'docs/authoring/schema.md', 'docs/authoring/retrieval.md', 'rag/README.md', 'docs/grimoire-script.md', 'AGENTS.md'];
function load(dir) { return U.readJSON(path.join(dir, 'private.json')); }
function save(dir, manifest) { U.writeJSON(path.join(dir, 'private.json'), manifest); }
function filesAt(root) {
  // Include non-ignored uncommitted files, not just HEAD. Fixture projects need no Git repository.
  let files;
  try { files = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n'); }
  catch {
    files = [];
    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const f = path.join(dir, entry.name), relative = path.relative(root, f);
        if (entry.name.startsWith('.') && relative !== 'rag/.gitignore' || entry.name === 'node_modules') continue;
        if (/^rag\/(?:cache|envs|runs|dependencies)(?:\/|$)/.test(relative)) continue;
        if (entry.isDirectory()) walk(f); else files.push(relative);
      }
    }
    walk(root);
  }
  return [...new Set(files)].filter((f) => fs.existsSync(path.join(root, f)) && fs.statSync(path.join(root, f)).isFile() && !fs.lstatSync(path.join(root, f)).isSymbolicLink())
    .filter((f) => /^(?:content\/|locales\/|src\/|tools\/|test\/|combat\/|server\/|rag\/src\/|rag\/skills\/authoring-retrieval\/|docs\/authoring\/examples\/|skills\/(?:write-academy-events|distill-lore|authoring-retrieval)\/|build\/(?:content|combat)\.bundle\.js$|index\.html$|package(?:-lock)?\.json$)/.test(f) || RULES.includes(f) || f === 'docs/design-v0.3.md' || ['rag/.gitignore','rag/authoring.json','rag/AUTHORING.md'].includes(f))
    .filter((f) => !/^test\/(?:authoring|rag-workspaces|rag-batch-review|rag-lifecycle)\.test\.js$/.test(f) && !/(?:^|\/)\.env(?:\.|$)|\.critic\.json$|(?:^|\/)node_modules\/|(?:^|\/)target\//.test(f)).sort();
}
function copyFiles(from, to, files) {
  for (const f of files) { const target = U.inside(to, f); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(U.inside(from, f), target); }
}
function inputs(root, files) { return Object.fromEntries(files.map((f) => [f, U.hash(fs.readFileSync(path.join(root, f)))])); }
function payload(common, workflow, task) { return common + '\n\n<workflow>\n' + workflow + '\n</workflow>\n\n<task>\n' + task + '\n</task>\n'; }
function prepare(root, out, opts = {}) {
  if (fs.existsSync(out)) throw new Error('Experiment directory already exists; use a new output path.');
  if (!opts.model || !opts.harness || !opts.harnessVersion) throw new Error('Specify --model, --harness, and --harness-version; no model identity is guessed.');
  if (opts.environment && opts.environment.configHash !== U.hash(R.config({ value: opts.retrievalConfig }))) throw new Error('Shared environment was registered with a different retrieval configuration');
  const templateRoot = path.join(__dirname, '../evaluation');
  const tasks = opts.tasks || U.readJSON(path.join(templateRoot, 'tasks.json'));
  const phase = opts.phase || (opts.factor ? 'ablation' : 'screening'), profiles = ['full'];
  if (opts.factor) throw new Error('Legacy component ablations are retired; prepare a baseline/LightRAG comparison.');
  const frameworks = phase === 'confirmation' ? String(opts.finalists || '').split(',') : FRAMEWORKS;
  if (frameworks.some((x) => !FRAMEWORKS.includes(x)) || phase === 'confirmation' && (frameworks.length !== 2 || new Set(frameworks).size !== 2)) throw new Error('Confirmation requires two distinct --finalists from the registered workflows.');
  if (!['screening', 'confirmation', 'ablation'].includes(phase) || phase === 'ablation' && !opts.factor) throw new Error('Invalid experiment phase/factor');
  const split = phase === 'confirmation' ? 'heldout' : 'development';
  const selected = tasks.filter((t) => t.split === split);
  if (selected.length !== 6 || new Set(selected.map((t) => t.category)).size !== 6) throw new Error('Each split must contain exactly six tasks, one per category.');
  const seed = String(opts.seed || '20261021'), random = U.rng(seed), files = filesAt(root), fingerprint = inputs(root, files);
  const common = fs.readFileSync(path.join(templateRoot, 'common.md'), 'utf8');
  const rubric = fs.readFileSync(path.join(templateRoot, 'critic.md'), 'utf8'), rubricHash = U.hash(rubric);
  fingerprint['rag/evaluation/critic.md'] = rubricHash;
  const sourceHash = U.hash(fingerprint), snapshot = path.join(out, 'snapshot');
  fs.mkdirSync(out, { recursive: true }); copyFiles(root, snapshot, files);
  fs.mkdirSync(path.join(snapshot, 'rag/evaluation'), { recursive: true });
  fs.copyFileSync(path.join(templateRoot, 'critic.md'), path.join(snapshot, 'rag/evaluation/critic.md'));
  const cat = C.catalog(snapshot), trials = [];
  const requiredSources = opts.requiredSources || {};
  for (const [taskId, keys] of Object.entries(requiredSources)) {
    if (!selected.some((t) => t.id === taskId) || !Array.isArray(keys)) throw new Error('Required sources must map selected task IDs to source-ID arrays');
    requiredSources[taskId] = keys.map((key) => C.resolve(cat, key).key);
  }
  for (const task of selected) for (const backend of frameworks) for (const profile of profiles) for (let repeat = 1; repeat <= (phase === 'screening' ? 1 : 2); repeat++) {
    const workflow = fs.readFileSync(path.join(templateRoot, 'workflows', backend + '.md'), 'utf8') + (profile !== 'full' ? '\nComponent ablation: use profile `' + profile + '` for every retrieval call. The omitted component may not be substituted through legacy helpers.\n' : '');
    const id = 'trial-' + U.hash([seed, phase, task.id, backend, profile, repeat]).slice(0, 12);
    const workspace = path.join(out, 'trials', id), packet = payload(common, workflow, task.prompt);
    copyFiles(snapshot, workspace, files);
    fs.mkdirSync(path.join(workspace, 'rag/evaluation'), { recursive: true });
    fs.copyFileSync(path.join(templateRoot, 'critic.md'), path.join(workspace, 'rag/evaluation/critic.md'));
    const cfg = R.config({ value: opts.retrievalConfig, backend: backend === 'baseline' ? 'lightrag' : backend, profile });
    const run = { id, task: task.id, category: task.category, prompt: task.prompt, taskHash: U.hash(task.prompt), expectedCards: task.cards, backend, profile, repeat,
      commonHash: U.hash(common), workflowHash: U.hash(workflow), promptHash: U.hash(packet), sourceHash, corpusHash: cat.corpusHash,
      model: opts.model, harness: opts.harness, harnessVersion: opts.harnessVersion, settings: opts.settings || {}, settingsHash: U.hash(opts.settings || {}), components: cfg.components, environmentHash: opts.environment?.hash || null,
      ruleFiles: files.filter((f) => RULES.includes(f) || f.startsWith('docs/authoring/examples/') || f.startsWith('skills/')),
      retrievalConfig: cfg, indexIdentity: R.identity(cfg), maxRepairs: 2, budget: { briefChars: 24000, returnedChars: 96000, maxToolCalls: 120 }, state: 'prepared' };
    const inputDir = path.join(workspace, 'authoring-input'); fs.mkdirSync(inputDir, { recursive: true });
    fs.writeFileSync(path.join(inputDir, 'task.md'), task.prompt);
    fs.writeFileSync(path.join(inputDir, 'common.md'), common);
    fs.writeFileSync(path.join(inputDir, 'workflow.md'), workflow);
    fs.writeFileSync(path.join(inputDir, 'prompt.md'), packet);
    U.writeJSON(path.join(inputDir, 'run.json'), { ...run, sourceRoot: snapshot, cache: path.join(out, 'cache'), log: path.join(out, 'receipts', id + '.jsonl') });
    run.runInputHash = U.hash(fs.readFileSync(path.join(inputDir, 'run.json')));
    trials.push(run);
  }
  const ordered = U.shuffle(trials, random);
  // Repeated presentations are concealed aliases, never additional generations.
  const repeatSample = U.shuffle(trials, random).slice(0, Math.max(1, Math.round(trials.length * 0.1)));
  const mapping = Object.fromEntries(U.shuffle([...trials, ...repeatSample], random).map((r, i) => ['Card ' + String(i + 1).padStart(3, '0'), r.id]));
  const manifest = { version: 1, at: new Date().toISOString(), phase, factor: opts.factor || null, seed, split, fingerprint, sourceHash, corpusHash: cat.corpusHash,
    tasks: selected, environment: opts.environment || null, requiredSources, common, rubric, rubricHash, trials: ordered, mapping, judgments: {}, pairs: {}, findings: {}, imports: {}, draftStages: {}, locked: false, adoption: null };
  save(out, manifest); U.writeJSON(path.join(out, 'source-manifest.json'), fingerprint, true);
  fs.writeFileSync(path.join(out, 'schedule.md'), '# Manual trial schedule\n\n' + ordered.map((r) => '- ' + r.id + ': ' + r.backend + '/' + r.profile + '; task ' + r.task + '; repetition ' + r.repeat).join('\n') + '\n');
  return { directory: out, phase, trials: trials.length, sourceHash, corpusHash: cat.corpusHash, note: 'Prepared only. Build indexes explicitly; start fresh harness sessions manually.' };
}
function trial(manifest, id) { const r = manifest.trials.find((r) => r.id === id); if (!r) throw new Error('Unknown trial: ' + id); return r; }
function integrity(dir, manifest, run) {
  const root = path.join(dir, 'trials', run.id), problems = [];
  for (const [file, digest] of Object.entries(manifest.fingerprint)) {
    if (file.startsWith('build/')) continue; // Deterministic validation rebuilds the quarantined bundles.
    const target = path.join(root, file);
    if (!fs.existsSync(target) || U.hash(fs.readFileSync(target)) !== digest) problems.push('Frozen source changed: ' + file);
  }
  for (const [name, digest] of [['prompt.md', run.promptHash], ['task.md', run.taskHash], ['common.md', run.commonHash], ['workflow.md', run.workflowHash]]) {
    const file = path.join(root, 'authoring-input', name);
    if (!fs.existsSync(file) || U.hash(fs.readFileSync(file, 'utf8')) !== digest) problems.push('Frozen instruction changed: ' + name);
  }
  if (U.hash(fs.readFileSync(path.join(root, 'authoring-input/run.json'))) !== run.runInputHash) problems.push('Frozen run configuration changed');
  return problems;
}
function draft(dir, id, paths, stage) {
  const m = load(dir), r = trial(m, id), previous = m.draftStages[id] || [];
  const expected = ['first', 'repair1', 'repair2'][previous.length];
  if (stage !== expected || r.state === 'frozen') throw new Error('Draft stages must be first, repair1, repair2, at most once each and before freeze.');
  if (!paths.length || new Set(paths).size !== paths.length) throw new Error('Provide a nonempty, unique output file list');
  if (previous.length && r.validation?.draftHash !== previous.at(-1).hash) throw new Error('A repair requires deterministic validation feedback for the previous draft');
  const root = path.join(dir, 'trials', id), sources = paths.map((f) => {
    if (!/^content\/(?:events|world\/lore\/soft)\/[^]*\.grim$/.test(f) || m.fingerprint[f]) throw new Error('Trial output must be a new event or soft-lore file: ' + f);
    const text = fs.readFileSync(U.inside(root, f), 'utf8');
    let parseError = null, scopeViolations = [];
    try { const defs = G.parseFile(text, f); scopeViolations = defs.filter((d) => !['event', 'lore'].includes(d.block) || d.block === 'lore' && d.canon !== 'soft').map((d) => 'Out-of-scope block: ' + d.block + ':' + d.id); }
    catch (error) { parseError = error.message; }
    return { path: f, text, hash: U.hash(text), parseError, scopeViolations };
  });
  const record = { stage, at: new Date().toISOString(), sources, hash: U.hash(sources) };
  previous.push(record); m.draftStages[id] = previous;
  U.writeJSON(path.join(dir, 'artifacts', id, stage + '.json'), record, true); save(dir, m);
  return { id, stage, hash: record.hash };
}
function freeze(dir, id) {
  const m = load(dir), r = trial(m, id), records = m.draftStages[id];
  if (r.state === 'frozen' || !records?.length) throw new Error('Freeze requires a recorded draft and cannot overwrite an artifact.');
  const problems = integrity(dir, m, r); if (problems.length) throw new Error(problems.join('\n'));
  const last = records[records.length - 1];
  if (r.validation?.draftHash !== last.hash) throw new Error('Validate the last recorded draft before freezing (failed validation is retained too).');
  for (const s of last.sources) if (U.hash(fs.readFileSync(path.join(dir, 'trials', id, s.path), 'utf8')) !== s.hash) throw new Error('Unrecorded edits after the last draft');
  const project = require('../../tools/project.js').project(path.join(dir, 'trials', id));
  const recorded = new Set(last.sources.map((s) => s.path));
  for (const s of project.loadSources()) if (!m.fingerprint[s.path] && !recorded.has(s.path)) throw new Error('Unrecorded content addition: ' + s.path);
  const structure = last.sources.flatMap((s) => [s.parseError, ...s.scopeViolations].filter(Boolean));
  if (!structure.length) {
    const cards = last.sources.flatMap((s) => G.parseFile(s.text, s.path)).filter((d) => d.block === 'event');
    if (cards.length !== r.expectedCards) structure.push('Expected ' + r.expectedCards + ' cards, got ' + cards.length);
    structure.push(...project.compileAll().errors.map((e) => e.message));
  }
  // Invalid outputs are still frozen for blind human review; they are never promoted.
  r.validation.structuralIssues = structure;
  r.artifactHash = last.hash; r.state = 'frozen'; r.repairs = records.length - 1;
  U.writeJSON(path.join(dir, 'artifacts', id, 'frozen.json'), last, true); save(dir, m);
  return { id, artifactHash: r.artifactHash, repairs: r.repairs };
}
function fail(dir, id, reason) {
  const m = load(dir), r = trial(m, id);
  if (r.state === 'frozen' || m.draftStages[id]?.length || !reason) throw new Error('No-output failure requires a reason and no recorded draft; freeze a partial draft instead');
  const root = path.join(dir, 'trials', id);
  if (['content/events/trial.grim', 'content/world/lore/soft/trial.grim'].some((f) => fs.existsSync(path.join(root, f)))) throw new Error('Preserve the existing partial output with draft/validate/freeze');
  const problems = integrity(dir, m, r); if (problems.length) throw new Error(problems.join('\n'));
  const artifact = { stage: 'no-output', sources: [], reason: String(reason), at: new Date().toISOString() };
  artifact.hash = U.hash(artifact); r.failure = artifact.reason; r.artifactHash = artifact.hash; r.state = 'frozen'; r.repairs = 0;
  r.validation = { exitCode: 1, structuralIssues: ['No generated artifact: ' + reason] };
  U.writeJSON(path.join(dir, 'artifacts', id, 'frozen.json'), artifact, true); save(dir, m);
  return { id, artifactHash: r.artifactHash, failure: reason };
}
function importTrace(dir, id, format, text, attestation, resolutions = {}) {
  const m = load(dir), r = trial(m, id);
  const digest = U.hash({ text, attestation, resolutions, format });
  const importFile = path.join(dir, 'imports', id, digest + '.json');
  if (!fs.existsSync(importFile)) U.writeJSON(importFile, { text, attestation, resolutions, format }, true);
  m.imports[id] = { digest, file: path.join('imports', id, digest + '.json') };
  const receiptFile = path.join(dir, 'receipts', id + '.jsonl');
  const result = Audit.audit({ ...r, allowedReadRoots: [path.join(dir, 'trials', id), path.join(dir, 'snapshot')] }, { format, text, attestation, resolutions }, fs.existsSync(receiptFile) ? fs.readFileSync(receiptFile, 'utf8') : '', integrity(dir, m, r));
  const reused = m.trials.some((other) => other.id !== id && other.audit?.session && other.audit.session === result.session);
  if (!m.environment) { result.status = result.status === 'violated' ? 'violated' : 'unverifiable'; result.missing.push('Shared candidate installation manifest not registered at preparation'); }
  if (reused) { result.status = 'violated'; result.violations.push('Session reused across trials'); }
  if (!r.artifactHash) { result.status = result.status === 'violated' ? 'violated' : 'unverifiable'; result.missing.push('Artifact not frozen'); }
  r.audit = result; save(dir, m); return result;
}
function validateFinding(f, cat, generated) {
  if (!generated.has(f.event) || !f.branch || !f.problem || !f.rule || !f.fix || !['serious', 'minor', 'insufficient-evidence'].includes(f.severity)) throw new Error('Finding needs an event, branch, problem, rule, severity and concrete fix');
  if (!Array.isArray(f.evidence)) throw new Error('Finding needs an evidence array');
  if (!f.evidence.length && f.severity !== 'insufficient-evidence') throw new Error('Substantive findings require evidence');
  for (const e of f.evidence) { const r = C.resolve(cat, e.key); if (e.sourceHash !== r.sourceHash) throw new Error('Finding cites stale evidence: ' + e.key); }
}
function importCritic(dir, id, verdict) {
  const m = load(dir), r = trial(m, id);
  if (m.locked) throw new Error('Review is locked; critic imports cannot change it');
  if (r.state !== 'frozen') throw new Error('Critics require frozen artifacts');
  if (!verdict.model || !verdict.family || !verdict.harness || !verdict.rubricHash || verdict.artifactHash !== r.artifactHash || !Array.isArray(verdict.findings)) throw new Error('Critic identity, rubric hash and exact artifact binding are required');
  const frozen = U.readJSON(path.join(dir, 'artifacts', id, 'frozen.json'));
  const generated = new Set(frozen.sources.flatMap((s) => G.parseFile(s.text, s.path)).map((d) => d.id));
  const cat = C.catalog(path.join(dir, 'trials', id));
  if (verdict.rubricHash !== m.rubricHash) throw new Error('Critic rubric differs from the frozen rubric');
  verdict.findings.forEach((f) => validateFinding(f, cat, generated));
  const digest = U.hash(verdict); U.writeJSON(path.join(dir, 'critics', id, digest + '.json'), verdict, true);
  m.findings[id] = m.findings[id] || [];
  m.findings[id].push({ digest, verdict }); save(dir, m);
  return { id, digest, findings: verdict.findings.length };
}
function groups(m, id) {
  const all = new Map();
  for (const entry of m.findings[id] || []) for (const f of entry.verdict.findings) {
    // Critics may provide a shared issue key. Otherwise preserve differences for human grouping.
    const key = U.hash([f.event, f.branch, f.rule, f.issueKey || f.problem.trim().toLowerCase()]);
    const group = all.get(key) || { key, event: f.event, branch: f.branch, findings: [] };
    group.findings.push({ ...f, judge: entry.digest, origin: entry.verdict.family === 'human' ? 'human' : 'critic' }); all.set(key, group);
  }
  return [...all.values()];
}
function report(dir) {
  const m = load(dir), summary = {};
  for (const r of m.trials) {
    const key = r.backend + '/' + r.profile;
    const row = summary[key] || { attempted: 0, frozen: 0, reviewed: 0, accept: 0, revise: 0, reject: 0, uncertain: 0, serious: 0, audit: { verified: 0, violated: 0, unverifiable: 0 }, repairs: 0, sourceChars: 0 };
    row.attempted++; row.frozen += r.state === 'frozen' ? 1 : 0; row.repairs += r.repairs || 0;
    row.audit[r.audit?.status || 'unverifiable']++; row.sourceChars += r.audit?.sourceChars || 0;
    const label = Object.keys(m.mapping).find((l) => m.mapping[l] === r.id), j = m.judgments[label];
    if (j?.initial) { row.reviewed++; row[(j.final || j.initial).decision]++; }
    row.serious += Object.values(j?.adjudications || {}).filter((a) => a.status === 'valid' && a.severity === 'serious').length;
    summary[key] = row;
  }
  const repeats = [];
  for (const r of m.trials) {
    const votes = Object.entries(m.mapping).filter(([, id]) => id === r.id).map(([l]) => m.judgments[l]?.initial).filter(Boolean);
    if (votes.length > 1) repeats.push({ same: votes.every((v) => v.decision === votes[0].decision), count: votes.length, ratingDifference: Object.fromEntries(['voice', 'choices', 'novelty', 'continuity'].map((key) => [key, Math.abs(votes[0].ratings[key] - votes[1].ratings[key])])) });
  }
  const paired = {};
  for (const p of Object.values(m.pairs)) {
    const runs = p.labels.map((label) => ERun(label)), keys = runs.map((r) => r.backend + '/' + r.profile).sort();
    const name = keys.join(' vs '), row = paired[name] || { workflows: keys, wins: [0, 0], ties: 0, bothUnacceptable: 0, uncertain: 0, byTask: {}, verifiedPairs: 0 };
    if (runs.every((r) => r.audit?.status === 'verified')) row.verifiedPairs++;
    if (p.preference === 'tie') row.ties++;
    else if (p.preference === 'both-unacceptable') row.bothUnacceptable++;
    else if (p.preference === 'uncertain') row.uncertain++;
    else {
      const winner = ERun(p.preference), which = keys.indexOf(winner.backend + '/' + winner.profile); row.wins[which]++;
      (row.byTask[winner.task] ||= []).push(which === 0 ? 1 : 0);
    }
    if (p.preference === 'tie') (row.byTask[runs[0].task] ||= []).push(0.5);
    paired[name] = row;
  }
  function ERun(label) { return trial(m, m.mapping[label]); }
  for (const row of Object.values(paired)) {
    const taskMeans = Object.values(row.byTask).map((a) => a.reduce((n, x) => n + x, 0) / a.length);
    row.taskCount = taskMeans.length;
    row.firstWorkflowPreference = taskMeans.length ? taskMeans.reduce((n, x) => n + x, 0) / taskMeans.length : null;
    row.taskBootstrap95 = null;
    if (taskMeans.length > 1) {
      const random = U.rng(m.seed + ':paired-bootstrap'), samples = [];
      for (let i = 0; i < 10000; i++) { let total = 0; for (let j = 0; j < taskMeans.length; j++) total += taskMeans[Math.floor(random() * taskMeans.length)]; samples.push(total / taskMeans.length); }
      samples.sort((a, b) => a - b); row.taskBootstrap95 = [samples[250], samples[9749]];
    }
    delete row.byTask;
  }
  const critics = { findings: 0, adjudicated: 0, valid: 0, invalid: 0, unresolved: 0, duplicates: 0, preferences: 0 };
  let humanConfirmed = 0, criticCovered = 0;
  for (const r of m.trials) {
    const label = Object.keys(m.mapping).find((l) => m.mapping[l] === r.id), j = m.judgments[label];
    for (const group of groups(m, r.id)) {
      const a = j?.adjudications?.[group.key];
      if (a?.status === 'valid') { humanConfirmed++; if (group.findings.some((f) => f.origin === 'critic')) criticCovered++; }
      if (!group.findings.some((f) => f.origin === 'critic')) continue;
      critics.findings++; if (!a) continue;
      critics.adjudicated++; if (a.status === 'duplicate') critics.duplicates++; else if (a.status === 'preference') critics.preferences++; else critics[a.status]++;
    }
  }
  const panel = {};
  for (const packet of m.panelPackets || []) {
    const key = packet.member.model + '/' + packet.workflowHash;
    const row = panel[key] ||= { model: packet.member.model, family: packet.member.family, workflowHash: packet.workflowHash, expected: 0, imported: 0, votes: [], orderPairs: {} };
    row.expected++;
    const vote = (m.panelResults || []).find((r) => r.packet === packet.id);
    if (vote) { row.imported++; row.votes.push(vote); (row.orderPairs[packet.pair] ||= []).push(vote.preference); }
  }
  for (const row of Object.values(panel)) {
    const complete = Object.values(row.orderPairs).filter((p) => p.length === 2);
    row.orderConsistency = { completedPairs: complete.length, samePreference: complete.filter((p) => p[0] === p[1]).length };
    delete row.orderPairs;
  }
  const runs = m.trials.map((r) => {
    const known = m.requiredSources?.[r.task], seen = new Set(r.audit?.sourceIds || []);
    return { id: r.id, task: r.task, workflow: r.backend, profile: r.profile, repeat: r.repeat, state: r.state, artifactHash: r.artifactHash || null, repairs: r.repairs ?? null,
      audit: r.audit || null, validation: r.validation || null,
      retrievalCoverage: known ? { required: known, observed: known.filter((id) => seen.has(id)), missing: known.filter((id) => !seen.has(id)), qualification: 'Observed returned IDs and human-resolved source reads; absence is not proof a source was never seen.' } : null };
  });
  const indexes = [];
  const cache = path.join(dir, 'cache');
  if (fs.existsSync(cache)) for (const backend of fs.readdirSync(cache)) for (const config of fs.readdirSync(path.join(cache, backend))) {
    const file = path.join(cache, backend, config, 'index.json');
    if (fs.existsSync(file)) {
      const index = U.readJSON(file), history = path.join(cache, backend, config, 'builds.jsonl');
      indexes.push({ backend, identity: index.identity, corpusHash: index.corpusHash, dimensions: index.dimensions, calls: index.calls, backendIdentity: index.backendIdentity, at: index.at,
        builds: fs.existsSync(history) ? fs.readFileSync(history, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [] });
    }
  }
  return { phase: m.phase, factor: m.factor, summary, paired, pairedPreferences: m.pairs, critics,
    runs, indexes, panel,
    criticPrecision: critics.valid + critics.invalid ? critics.valid / (critics.valid + critics.invalid) : null,
    criticCoverage: humanConfirmed ? { confirmedDefects: humanConfirmed, foundByCritic: criticCovered, fraction: criticCovered / humanConfirmed } : null,
    coverageQualification: 'Coverage is relative to human-enumerated findings, not an exhaustive count of all true defects.',
    withinReviewerConsistency: { repeats: repeats.length, consistent: repeats.filter((x) => x.same).length, ratingMeanAbsoluteDifference: repeats.length ? Object.fromEntries(['voice', 'choices', 'novelty', 'continuity'].map((key) => [key, repeats.reduce((n, r) => n + r.ratingDifference[key], 0) / repeats.length])) : null },
    adoption: m.adoption, qualification: 'All attempted runs retained. Package comparisons are not component effects. Small samples and incomplete reviews are inconclusive.', locked: m.locked };
}
module.exports = { FRAMEWORKS, RULES, prepare, load, save, trial, integrity, draft, freeze, fail, importTrace, importCritic, validateFinding, groups, report, filesAt, payload };
