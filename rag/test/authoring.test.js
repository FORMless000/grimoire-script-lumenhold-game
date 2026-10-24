'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const G = require('../../src/grimoire.js');
const C = require('../src/catalog.js');
const R = require('../src/retrieve.js');
const U = require('../src/util.js');
const E = require('../src/experiments.js');
const A = require('../src/audit.js');
const V = require('../src/review.js');
const B = require('../src/backends.js');
const { openRouterKey } = require('../src/credentials.js');
const Panel = require('../src/panels.js');
const Setup = require('../setup.js');
const Authoring = require('../src/authoring.js');
const Handoff = require('../src/handoff.js');
const { FIXTURE, write } = require('../../test/helpers.js');
const temporary = [];
function tempDir(prefix) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix)); temporary.push(dir); return dir; }
test.after(() => { for (const dir of temporary) fs.rmSync(dir, { recursive: true, force: true }); });

function fixture() {
  const root = tempDir('authoring-fixture-'); fs.cpSync(FIXTURE, root, { recursive: true });
  write(root, 'content/world/facts.grim', '@fact lyra.secret\ntier: secret\nunlock: flag(lyra_seen)\ntext: She keeps a miniature porcelain hedgehog.\n');
  write(root, 'content/events/conditional.grim', '@event conditional\ntitle: The Hidden Bargain\nactor: lyra\ntext: Someone asks a question.\n> left: Answer\n  if flag(lyra_seen):\n    learn lyra.secret\n    say: The contraband pineapple reveals the bargain.\n  else:\n    say: You leave it unanswered.\n> right: Refuse\n  say: Tomorrow, perhaps.\n');
  return root;
}
function fakeService() {
  const calls = [], vector = (s) => [1, (s.match(/pineapple/g) || []).length + 1, (s.match(/hedgehog/g) || []).length + 1];
  return { calls, async describe(r, context) { calls.push(['describe', r.key]); return 'Derived premise ' + r.id + ' ' + context.map((r) => r.prose).join(' '); },
    async embed(inputs) { calls.push(['embed', inputs.length]); return inputs.map(vector); },
    async rerank(q, records) { calls.push(['rerank', q]); return records.slice().reverse().map((r, i) => ({ ...r, rerankScore: records.length - i })); } };
}
function setupExperiment(options = {}) {
  const root = fixture(), out = path.join(tempDir('author-eval-'), 'study');
  const result = E.prepare(root, out, { model: 'test-model', harness: 'codex', harnessVersion: 'test-v1', ...options });
  const m = E.load(out), run = m.trials.find((r) => r.expectedCards === 1);
  write(path.join(out, 'trials', run.id), 'content/events/trial.grim', '@event trial_card\ntitle: Fixture Card\ntext: A synthetic test decision.\n> left: Stay\n  mood +1\n  say: You stay.\n> right: Leave\n  health +1\n  say: You leave.\n');
  return { root, out, run, result };
}
function checkedFreeze(out, id) {
  const m = E.load(out), r = E.trial(m, id);
  r.validation = { draftHash: m.draftStages[id].at(-1).hash, exitCode: 0, output: 'Synthetic unit-test validator record; no gameplay validation claimed.' };
  E.save(out, m); return E.freeze(out, id);
}

test('one-command Python setup creates an isolated venv and records resolved dependencies without model calls', () => {
  const directory = tempDir('authoring-python-'), commands = [];
  const execute = (bin, args) => {
    commands.push([bin, args]);
    if (args.includes('import sys,json; print(json.dumps(list(sys.version_info[:2])))')) return '[3,12]';
    if (args[0] === '-m' && args[1] === 'venv') { const target = path.join(args[2], 'bin/python'); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, 'fixture'); }
    if (args.includes('freeze')) return 'lightrag-hku==1.5.7\nnumpy==2.0.0';
    return '';
  };
  const result = Setup.setup({ python: true, directory }, execute);
  assert.equal(result.lightrag, true);
  assert.match(U.readJSON(result.configFile).lightrag.python, /lightrag\/bin\/python$/);
  assert.equal(fs.readdirSync(directory).filter((f) => f.startsWith('lightrag-requirements-')).length, 1);
  Setup.setup({ python: true, directory }, execute);
  assert.equal(commands.filter(([, args]) => args[1] === 'venv').length, 1);
  assert.ok(commands.every(([, args]) => !args.includes('retrieve')));
});

test('local OpenRouter key is optional, env takes precedence, and file contents are never executed', () => {
  const root = tempDir('authoring-key-');
  assert.equal(openRouterKey(root, {}), '');
  fs.writeFileSync(path.join(root, '.env.local'), '# Synthetic credential\nOPENROUTER_API_KEY="fixture-key"\n');
  assert.equal(openRouterKey(root, {}), 'fixture-key');
  assert.equal(openRouterKey(root, { OPENROUTER_API_KEY: 'environment-key' }), 'environment-key');
  fs.writeFileSync(path.join(root, '.env.local'), 'OPENROUTER_API_KEY=$(do-not-execute)\n');
  assert.equal(openRouterKey(root, {}), '$(do-not-execute)');
  assert.ok(!E.filesAt(root).includes('.env.local'));
  fs.appendFileSync(path.join(root, '.env.local'), 'OPENROUTER_API_KEY=second\n');
  assert.throws(() => openRouterKey(root, {}), /Duplicate/);
});

test('relocated tooling is available to trial snapshots while runtime data and evaluator inputs are excluded', () => {
  const root = fixture();
  const included = ['rag/src/cli.js', 'rag/src/credentials.js', 'rag/skills/authoring-retrieval/SKILL.md', 'rag/README.md', 'rag/.gitignore'];
  const excluded = ['rag/.env.local', 'rag/cache/index.json', 'rag/envs/retrieval.json', 'rag/dependencies/qmd/package.json',
    'rag/runs/previous/private.json', 'rag/evaluation/tasks.json', 'rag/EVALUATION.md', 'rag/test/authoring.test.js', 'test/authoring.test.js'];
  for (const f of [...included, ...excluded]) write(root, f, 'synthetic fixture');
  const files = E.filesAt(root);
  for (const f of included) assert.ok(files.includes(f), f);
  for (const f of excluded) assert.ok(!files.includes(f), f);
  const liveFiles = E.filesAt(path.resolve(__dirname, '../..'));
  for (const f of included) assert.ok(liveFiles.includes(f), f);
  assert.ok(liveFiles.includes('tools/grim.js'));
  assert.ok(!liveFiles.some((f) => /^rag\/(?:cache|envs|runs|dependencies|evaluation|test)\//.test(f)));
});

test('catalog indexes outcome prose, preserves guards and sources, and resolves qualified IDs', () => {
  const cat = C.catalog(fixture()), r = C.resolve(cat, 'event:conditional');
  assert.match(r.prose, /contraband pineapple/);
  assert.match(r.text, /else:/);
  assert.equal(r.authority, 'conditional-event');
  assert.ok(r.branches.some((b) => b.text?.includes('unanswered') && b.guards.some((g) => g.includes('not (flag(lyra_seen))'))));
  assert.ok(cat.edges.some((e) => e.from === r.key && e.to === 'fact:lyra.secret' && e.guards.includes('flag(lyra_seen)')));
  const fact = C.resolve(cat, 'lyra.secret'); assert.equal(fact.metadata.tier, 'secret'); assert.equal(fact.metadata.unlock, 'flag(lyra_seen)');
  assert.ok(C.neighbors(cat, r.key, 100).edges.some((e) => e.relation === 'flag:lyra_seen'));
  const ambiguous = { ...cat, records: cat.records.concat({ ...r, kind: 'lore', key: 'lore:conditional' }) };
  assert.throws(() => C.resolve(ambiguous, 'conditional'), /Ambiguous/);
});

test('packs keep complete blocks and explicitly report missing mandatory evidence', () => {
  const cat = C.catalog(fixture()), r = C.resolve(cat, 'conditional');
  const packed = C.pack([r], 50, [r.key]);
  assert.equal(packed.text, ''); assert.equal(packed.incomplete, true); assert.deepEqual(packed.requiredOmitted, [r.key]);
  const exact = C.pack([r], 5000, [r.key]); assert.match(exact.text, /contraband pineapple/); assert.ok(exact.chars <= exact.budget);
});

test('LightRAG adapter is retrieval-only and refuses unmapped parents', async () => {
  const root = fixture(), cfg = R.config({ backend: 'lightrag' }), commands = [];
  const execute = async (bin, argv, input) => { commands.push(input); return JSON.stringify(input.action === 'index' ? { backend: 'lightrag', version: 'test', models: cfg.models, dimensions: 3, processedIds:input.expected } : { hits: [{ key: 'event:conditional', score: 1 }], calls: [] }); };
  const engine = R.create(root, cfg, { execute }); await engine.index({rebuild:true,mode:'sync'}); assert.equal((await engine.search('a')).results[0].key, 'event:conditional');
  assert.equal(commands.at(-1).action, 'search'); assert.ok(commands[0].records.every((r) => r.key.includes(':')));
  const bad = R.create(root, cfg, { execute: async () => JSON.stringify({ hits: [{ key: 'event:nonexistent' }] }) });
  await assert.rejects(bad.search('a'), /Unknown parent/);
});

test('preparation snapshots working files and holds task prompts identical across 12 trials', () => {
  const { out, result } = setupExperiment(); assert.equal(result.trials, 12);
  const m = E.load(out);
  for (const task of m.tasks) assert.equal(new Set(m.trials.filter((r) => r.task === task.id).map((r) => r.taskHash)).size, 1);
  assert.ok(fs.existsSync(path.join(out, 'snapshot/content/events/conditional.grim')));
  assert.throws(() => E.prepare(out, out, {}), /already exists/);
  assert.ok(m.trials.every((r) => r.model === 'test-model'));
});

test('confirmation prepares 24 fresh trials', () => {
  const root = fixture(), base = tempDir('authoring-phases-');
  for (const opts of [{ phase: 'confirmation', finalists: 'baseline,lightrag' }]) {
    const out = path.join(base, opts.phase || 'ablation');
    assert.equal(E.prepare(root, out, { ...opts, model: 'test', harness: 'test', harnessVersion: '1' }).trials, 24);
    const m = E.load(out); assert.ok(m.trials.every((r) => r.repeat === 1 || r.repeat === 2));
    if (opts.factor) assert.deepEqual([...new Set(m.trials.map((r) => r.profile))].sort(), ['full', 'no-dense']);
    else assert.ok(m.tasks.every((t) => t.split === 'heldout'));
  }
});

test('first drafts and repairs are immutable and source changes prevent freeze', () => {
  const { out, run } = setupExperiment(); E.draft(out, run.id, ['content/events/trial.grim'], 'first');
  assert.throws(() => E.draft(out, run.id, ['content/events/trial.grim'], 'first'), /Draft stages/);
  write(path.join(out, 'trials', run.id), 'content/events/conditional.grim', '@event modified\ntext: Changed\n');
  assert.throws(() => E.freeze(out, run.id), /Frozen source changed/);
});

test('blinded review hides critic opinions and identities, persists original assessment and serves source safely', async () => {
  const { out, run } = setupExperiment(); E.draft(out, run.id, ['content/events/trial.grim'], 'first'); checkedFreeze(out, run.id);
  const label = Object.keys(E.load(out).mapping).find((l) => E.load(out).mapping[l] === run.id);
  let view = V.state(out).cards.find((c) => c.label === label); assert.equal(view.identity, undefined); assert.equal(view.findings, undefined);
  V.judge(out, label, 'initial', { decision: 'revise', ratings: { voice: 3, choices: 2, novelty: 4, continuity: 3 }, notes: '<script>not executable</script>' });
  V.judge(out, label, 'final', { decision: 'accept', notes: 'After evidence review' });
  view = V.state(out).cards.find((c) => c.label === label); assert.equal(view.judgment.initial.decision, 'revise'); assert.equal(view.judgment.final.decision, 'accept');
  assert.throws(() => V.lock(out), /Every trial/);
  const server = V.serve(out); await new Promise((resolve) => server.once('listening', resolve));
  try {
    const base = 'http://127.0.0.1:' + server.address().port;
    assert.equal((await fetch(base + '/state')).status, 200);
    assert.equal((await fetch(base + '/judge', { method: 'POST', headers: { Origin: 'https://example.com' }, body: '{}' })).status, 403);
    assert.equal((await fetch(base + '/source?key=' + encodeURIComponent('fact:lyra.secret'))).status, 200);
    assert.match(await (await fetch(base + '/client.js')).text(), /textContent/);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

function auditFixture() {
  const run = { id: 'run1', backend: 'grim', profile: 'no-dense', components: {lexical:true,dense:false,rerank:true,graph:true,descriptions:true}, corpusHash: 'source', promptHash: 'prompt', commonHash: 'common', workflowHash: 'workflow', sourceHash: 'snapshot', model: 'model', harnessVersion: 'v1', settingsHash: U.hash({}) };
  const attestation = { by: 'human', freshSession: true, complete: true, ...Object.fromEntries(['promptHash', 'commonHash', 'workflowHash', 'sourceHash', 'model', 'harnessVersion', 'settingsHash'].map((k) => [k, run[k]])) };
  const result = { ids: ['event:a'] };
  const tool = { run: 'run1', backend: 'grim', profile: 'no-dense', corpusHash: 'source', operation: 'search', indexHash: 'index', indexIdentity: 'identity', components: run.components, indexComponents: run.components,
    result, resultHash: U.hash(result), stages: [{ stage: 'dense', enabled: false }, { stage: 'rerank', enabled: true }] };
  const trace = [{ type: 'thread.started', thread_id: 'fresh-id' }, { type: 'item.completed', item: { type: 'command_execution', command: 'node tools/grim.js retrieve search example --json', aggregated_output: JSON.stringify(result) } }, { type: 'turn.completed', usage: { input_tokens: 100 } }].map(JSON.stringify).join('\n');
  return { run, imported: { text: trace, format: 'codex', attestation }, tool };
}
test('handoff preserves exact packets, captures native bytes with a fake harness, and refuses reused logs', () => {
  const { out, run } = setupExperiment(), m = E.load(out);
  const packet = fs.readFileSync(path.join(out, 'trials', run.id, 'authoring-input/prompt.md'));
  const handoff = Handoff.prepare(out, run.id);
  assert.equal(handoff.promptHash, U.hash(packet.toString('utf8')));
  assert.ok(!fs.existsSync(handoff.stdout));
  const template = U.readJSON(path.join(handoff.directory, 'attestation.template.json'));
  assert.equal(template.complete, false); assert.equal(template.freshSession, false);
  const fakeBin = path.join(tempDir('handoff-bin-'), 'codex');
  fs.writeFileSync(fakeBin, '#!/usr/bin/env node\nif(process.argv.includes("--version")){console.log("test-v1");process.exit(0);}\nlet text="";process.stdin.on("data",b=>text+=b);process.stdin.on("end",()=>console.log(JSON.stringify({type:"prompt-received",hash:require("crypto").createHash("sha256").update(text).digest("hex")})));\n', { mode: 0o700 });
  const { execFileSync } = require('child_process');
  const env = { ...process.env, PATH: path.dirname(fakeBin) + path.delimiter + process.env.PATH };
  execFileSync('sh', [path.join(handoff.directory, 'run.sh')], { env });
  assert.equal(U.readJSON(handoff.stdout).hash, run.promptHash);
  const before = fs.readFileSync(handoff.stdout);
  assert.throws(() => execFileSync('sh', [path.join(handoff.directory, 'run.sh')], { env, stdio: 'ignore' }));
  assert.deepEqual(fs.readFileSync(handoff.stdout), before);
  assert.throws(() => Handoff.prepare(out, run.id), /already exists/);
  const second = setupExperiment({ harness: 'claude', settings: { reasoningEffort: 'high' } });
  const claude = Handoff.prepare(second.out, second.run.id, { withLocalKey: true, keyProvider: () => 'fixture-only-key' });
  assert.ok(claude.args.includes('stream-json')); assert.ok(claude.args.includes('--safe-mode')); assert.ok(!claude.args.includes('--bare')); assert.ok(claude.args.includes('--effort'));
  assert.ok(fs.existsSync(claude.localCredentialFile));
  assert.ok(!fs.readFileSync(path.join(claude.directory, 'handoff.json'), 'utf8').includes('fixture-only-key'));
  assert.ok(!Object.keys(E.load(second.out).fingerprint).some(f => f.includes('.env')));
});

test('native wrappers, repeated repair initialization, forbidden backends and truncated followups are audited', () => {
  const { run, imported, tool } = auditFixture();
  const wrapped = imported.text.replace('node tools/grim.js retrieve search example --json', "/bin/zsh -lc 'node tools/grim.js retrieve search example --json'");
  const good = A.audit(run, { ...imported, text: wrapped }, JSON.stringify(tool));
  assert.equal(good.status, 'verified'); assert.ok(good.accesses[0].rawCommand); assert.ok(good.accesses[0].key);
  const sameSession = wrapped + '\n' + JSON.stringify({ type: 'thread.started', thread_id: 'fresh-id' }) + '\n' + JSON.stringify({ type: 'turn.completed' });
  assert.equal(A.audit(run, { ...imported, text: sameSession }, JSON.stringify(tool)).status, 'verified');
  const incomplete = sameSession + '\n' + JSON.stringify({ type: 'item.completed', item: { type: 'command_execution', command: 'pwd', aggregated_output: '/trial' } });
  assert.equal(A.audit(run, { ...imported, text: incomplete }, JSON.stringify(tool)).status, 'unverifiable');
  const wrong = imported.text.replace('search example --json', 'search example --backend lightrag --json');
  assert.equal(A.audit(run, { ...imported, text: wrong }, JSON.stringify(tool)).status, 'violated');
  const earlyCheck = imported.text.replace('retrieve search example --json', 'check');
  assert.ok(A.audit(run, { ...imported, text: earlyCheck }, '').violations.includes('Validation before the first operator checkpoint'));
});

test('audit distinguishes verified, violated and unverifiable, including contaminated ablations', () => {
  const { run, imported, tool } = auditFixture();
  assert.equal(A.audit(run, imported, JSON.stringify(tool)).status, 'verified');
  assert.equal(A.audit(run, { ...imported, attestation: {} }, JSON.stringify(tool)).status, 'unverifiable');
  tool.stages[0].enabled = true;
  assert.equal(A.audit(run, imported, JSON.stringify(tool)).status, 'violated');
  tool.stages[0].enabled = false; tool.indexComponents = R.PROFILES.full;
  assert.equal(A.audit(run, imported, JSON.stringify(tool)).status, 'violated');
  assert.equal(A.audit(run, { ...imported, text: imported.text.split('\n').slice(0, 2).join('\n') }, '').status, 'unverifiable');
});

test('native source scope does not silently verify shell searches or reads outside frozen inputs', () => {
  const { run, imported, tool } = auditFixture();
  run.allowedReadRoots = ['/study/trials/run1', '/study/snapshot'];
  const check = event => A.audit(run, { ...imported, format: 'normalized', text: [
    { type: 'start', session: 'fresh-id' },
    { type: 'command', command: 'node tools/grim.js retrieve search example --json', output: JSON.stringify(tool.result) },
    event, { type: 'end' }
  ].map(JSON.stringify).join('\n') }, JSON.stringify(tool));
  assert.equal(check({ type: 'command', command: 'cat content/events/conditional.grim', output: 'A source card.' }).status, 'verified');
  assert.equal(check({ type: 'command', command: 'cat ../../other-trial/card.grim', output: 'Foreign card.' }).status, 'unverifiable');
  assert.equal(check({ type: 'read', input: { file_path: '../other-trial/card.grim' }, output: 'Foreign card.' }).status, 'unverifiable');
  assert.equal(check({ type: 'command', command: 'rg premise .', output: 'Unscoped search.' }).status, 'unverifiable');
  assert.equal(check({ type: 'command', command: 'node tools/grim.js reach', output: 'Additional analysis.' }).status, 'unverifiable');
  assert.equal(check({ type: 'command', command: 'node tools/grim.js retrieve unknown', output: 'Unknown operation.' }).status, 'unverifiable');
  assert.equal(check({ type: 'command', command: 'cat build/content.bundle.js', output: 'Generated corpus.' }).status, 'violated');
});

test('Claude stream normalization and unknown commands require explicit audit', () => {
  const { run, imported, tool } = auditFixture();
  const text = [{ type: 'system', subtype: 'init', session_id: 'claude1', model: 'model' }, { type: 'assistant', message: { content: [{ type: 'tool_use', id: 't', name: 'Bash', input: { command: 'python custom_reader.py' } }] } }, { type: 'result', total_cost_usd: 0.1 }].map(JSON.stringify).join('\n');
  const result = A.audit(run, { ...imported, text, format: 'claude' }, JSON.stringify(tool));
  assert.equal(result.status, 'unverifiable'); assert.ok(result.missing.some((s) => s.includes('custom_reader'))); assert.equal(result.cost, 0.1);
});

test('critic findings bind the frozen artifact and evidence; opinions stay hidden until initial review', () => {
  const { out, run } = setupExperiment(); E.draft(out, run.id, ['content/events/trial.grim'], 'first'); const frozen = checkedFreeze(out, run.id);
  const fact = C.resolve(C.catalog(path.join(out, 'snapshot')), 'fact:lyra.secret');
  const verdict = { model: 'judge', family: 'independent', harness: 'test', rubricHash: U.hash(fs.readFileSync(path.join(__dirname, '../evaluation/critic.md'), 'utf8')), artifactHash: frozen.artifactHash,
    findings: [{ event: 'trial_card', branch: 'text', problem: 'Synthetic test defect', rule: 'continuity', severity: 'minor', fix: 'A concrete fixture correction', evidence: [{ key: fact.key, sourceHash: fact.sourceHash }] }] };
  assert.throws(() => E.importCritic(out, run.id, { ...verdict, artifactHash: 'wrong' }), /artifact binding/);
  assert.throws(() => E.importCritic(out, run.id, { ...verdict, findings: [{ ...verdict.findings[0], evidence: [{ key: fact.key, sourceHash: 'wrong' }] }] }), /stale evidence/);
  E.importCritic(out, run.id, verdict);
  const label = Object.keys(E.load(out).mapping).find((l) => E.load(out).mapping[l] === run.id);
  assert.equal(V.state(out).cards.find((c) => c.label === label).findings, undefined);
  V.judge(out, label, 'initial', { decision: 'revise', ratings: { voice: 3, choices: 3, novelty: 3, continuity: 3 } });
  const group = V.state(out).cards.find((c) => c.label === label).findings[0];
  V.judge(out, label, 'adjudicate', { group: group.key, status: 'invalid', reason: 'Synthetic negative control', severity: 'minor' });
  assert.equal(E.report(out).critics.invalid, 1);
});

test('invalid drafts remain frozen outcomes and repairs require bound validator feedback', () => {
  const { out, run } = setupExperiment(), trialRoot = path.join(out, 'trials', run.id);
  write(trialRoot, 'content/events/trial.grim', '@event broken\nnot a valid property\n');
  E.draft(out, run.id, ['content/events/trial.grim'], 'first');
  assert.throws(() => E.draft(out, run.id, ['content/events/trial.grim'], 'repair1'), /validation feedback/);
  checkedFreeze(out, run.id);
  assert.ok(E.trial(E.load(out), run.id).validation.structuralIssues.length);
  assert.match(U.readJSON(path.join(out, 'artifacts', run.id, 'first.json')).sources[0].text, /not a valid/);
});

test('panel packets counterbalance order, reuse frozen cards for critic variants, and bind model sessions', () => {
  const { out, run } = setupExperiment();
  const m = E.load(out), other = m.trials.find((r) => r.task === run.task && r.backend !== run.backend);
  m.trials = [run, other]; m.mapping = { 'Card 001': run.id, 'Card 002': other.id, 'Card 003': run.id }; E.save(out, m);
  const text = fs.readFileSync(path.join(out, 'trials', run.id, 'content/events/trial.grim'), 'utf8');
  write(path.join(out, 'trials', other.id), 'content/events/trial.grim', text);
  for (const r of [run, other]) { E.draft(out, r.id, ['content/events/trial.grim'], 'first'); checkedFreeze(out, r.id); }
  const variants = ['critic-a.md', 'critic-b.md'].map((f) => path.join(out, f));
  variants.forEach((file, i) => fs.writeFileSync(file, 'Synthetic critic instructions ' + i));
  const members = ['one', 'two', 'three'].map((family) => ({ model: family + '-model', family, harness: 'test', harnessVersion: '1' }));
  assert.equal(Panel.prepare(out, members, variants).packets, 12);
  const packets = E.load(out).panelPackets, a = packets[0], b = packets[1];
  assert.deepEqual(a.artifactHashes, b.artifactHashes.slice().reverse());
  const result = (p, preference) => ({ packet: p.id, ...p.member, rubricHash: p.rubricHash, artifactHashes: p.artifactHashes, preference, findings: [], invocation: { by: 'human', freshSession: true, session: p.id, promptHash: p.promptHash } });
  assert.throws(() => Panel.importResult(out, { ...result(a, 'A'), model: 'substitution' }), /identity differs/);
  Panel.importResult(out, result(a, 'A')); Panel.importResult(out, result(b, 'B'));
  const panel = Object.values(E.report(out).panel).find((p) => p.imported);
  assert.equal(panel.orderConsistency.samePreference, 1);
  assert.equal(V.state(out).pairs[0].panel.length, 0);
  for (const label of Object.keys(m.mapping)) V.judge(out, label, 'initial', { decision: 'accept', ratings: { voice: 3, choices: 3, novelty: 3, continuity: 3 } });
  assert.equal(V.state(out).pairs[0].panel.length, 2);
  const pair = V.state(out).pairs[0]; V.pair(out, pair.key, { preference: 'tie' });
  V.lock(out); assert.ok(V.state(out).cards.every((c) => c.identity));
  assert.equal(E.report(out).withinReviewerConsistency.consistent, 1);
  assert.throws(() => V.judge(out, 'Card 001', 'final', { decision: 'reject' }), /locked/);
});

test('trace output binding rejects invented receipts and missing native reads', () => {
  const { run, imported, tool } = auditFixture();
  assert.equal(A.audit(run, { ...imported, text: imported.text.replace(JSON.stringify(tool.result).replaceAll('"', '\\"'), 'unrelated output') }, JSON.stringify(tool)).status, 'unverifiable');
  const text = [{ type: 'start', session: '1' }, { type: 'read', input: { file_path: 'content/events/conditional.grim' } }, { type: 'end' }].map(JSON.stringify).join('\n');
  assert.ok(A.audit(run, { ...imported, text, format: 'normalized' }, '').missing.some((s) => s.includes('output/size')));
});

test('missing backends and indexes fail explicitly, without changing schemes', async () => {
  const root = fixture();
  await assert.rejects(R.create(root, R.config()).search('question'), /Index unbuilt/);
  await assert.rejects(B.run(path.join(root, 'uninstalled-qmd'), []), /Backend executable unavailable/);
  assert.throws(() => R.config({backend:'qmd'}), /Only LightRAG/);
  assert.throws(() => R.config({backend:'grim'}), /Only LightRAG/);
  assert.throws(() => R.config({profile:'lexical'}), /Only the full/);
});

test('common rule context is measured separately from source evidence allowance', () => {
  const { run, imported, tool } = auditFixture();
  run.ruleFiles = ['docs/grimoire-script.md']; run.budget = { returnedChars: 100, maxToolCalls: 120 };
  const events = [{ type: 'start', session: 'rules' }, { type: 'command', command: 'cat docs/grimoire-script.md', output: 'x'.repeat(1000) }, { type: 'command', command: 'node tools/grim.js retrieve search example --json', output: JSON.stringify(tool.result) }, { type: 'end' }];
  const result = A.audit(run, { ...imported, text: events.map(JSON.stringify).join('\n'), format: 'normalized' }, JSON.stringify(tool));
  assert.equal(result.status, 'verified'); assert.equal(result.commonRuleChars, 1000); assert.ok(result.sourceChars < 100);
});

test('a no-output failure stays reviewable and cannot erase a partial draft', () => {
  const { out, run } = setupExperiment(), m = E.load(out), other = m.trials.find((r) => r.id !== run.id);
  assert.throws(() => E.fail(out, run.id, 'Stopped'), /partial output/);
  E.fail(out, other.id, 'Synthetic harness failure before output');
  const view = V.state(out).cards.find((c) => c.failure);
  assert.ok(view.frozen); assert.equal(view.sources.length, 0);
  V.judge(out, view.label, 'initial', { decision: 'reject', ratings: { voice: 1, choices: 1, novelty: 1, continuity: 1 } });
  assert.equal(E.report(out).summary[other.backend + '/' + other.profile].reject, 1);
});

test('review browser preserves independent judgments, displays all branches, and reloads persisted state', async () => {
  const { chromium } = require('playwright');
  const { out, run } = setupExperiment(); E.draft(out, run.id, ['content/events/trial.grim'], 'first'); checkedFreeze(out, run.id);
  const label = Object.keys(E.load(out).mapping).find((key) => E.load(out).mapping[key] === run.id);
  const server = V.serve(out); await new Promise((resolve) => server.once('listening', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage(), errors = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.locator('nav button', { hasText: label }).click();
    await page.getByText('Independent initial assessment', { exact: true }).waitFor();
    assert.match(await page.locator('#view').textContent(), /> left: Stay/);
    assert.match(await page.locator('#view').textContent(), /> right: Leave/);
    assert.equal(await page.getByRole('heading', { name: 'Validation', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Save initial assessment', exact: true }).click();
    await page.getByRole('heading', { name: 'Initial assessment (preserved)', exact: true }).waitFor();
    await page.reload(); await page.locator('nav button', { hasText: label }).click();
    await page.getByRole('heading', { name: 'Validation', exact: true }).waitFor();
    assert.deepEqual(errors, []);
  } finally { if (browser) await browser.close(); await new Promise((resolve) => server.close(resolve)); }
});


test('setup selects supported Python without downloading alternative runtimes', () => {
  assert.equal(Setup.pythonExecutable(null, bin => { if (bin === 'python3.12') throw new Error('Missing'); return '[3,11]'; }), 'python3.11');
});
