'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const C = require('../src/catalog.js');
const R = require('../src/retrieve.js');
const U = require('../src/util.js');
const B = require('../src/backends.js');
const { openRouterKey } = require('../src/credentials.js');
const Setup = require('../setup.js');
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
  fs.appendFileSync(path.join(root, '.env.local'), 'OPENROUTER_API_KEY=second\n');
  assert.throws(() => openRouterKey(root, {}), /Duplicate/);
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

function auditFixture() {
  const run = { id: 'run1', backend: 'grim', profile: 'no-dense', components: {lexical:true,dense:false,rerank:true,graph:true,descriptions:true}, corpusHash: 'source', promptHash: 'prompt', commonHash: 'common', workflowHash: 'workflow', sourceHash: 'snapshot', model: 'model', harnessVersion: 'v1', settingsHash: U.hash({}) };
  const attestation = { by: 'human', freshSession: true, complete: true, ...Object.fromEntries(['promptHash', 'commonHash', 'workflowHash', 'sourceHash', 'model', 'harnessVersion', 'settingsHash'].map((k) => [k, run[k]])) };
  const result = { ids: ['event:a'] };
  const tool = { run: 'run1', backend: 'grim', profile: 'no-dense', corpusHash: 'source', operation: 'search', indexHash: 'index', indexIdentity: 'identity', components: run.components, indexComponents: run.components,
    result, resultHash: U.hash(result), stages: [{ stage: 'dense', enabled: false }, { stage: 'rerank', enabled: true }] };
  const trace = [{ type: 'thread.started', thread_id: 'fresh-id' }, { type: 'item.completed', item: { type: 'command_execution', command: 'node tools/grim.js retrieve search example --json', aggregated_output: JSON.stringify(result) } }, { type: 'turn.completed', usage: { input_tokens: 100 } }].map(JSON.stringify).join('\n');
  return { run, imported: { text: trace, format: 'codex', attestation }, tool };
}
test('missing backends and indexes fail explicitly, without changing schemes', async () => {
  const root = fixture();
  await assert.rejects(R.create(root, R.config({value:{}})).search('question'), /Index unbuilt/);
  await assert.rejects(B.run(path.join(root, 'uninstalled-qmd'), []), /Backend executable unavailable/);
  assert.throws(() => R.config({backend:'qmd'}), /Only LightRAG/);
  assert.throws(() => R.config({backend:'grim'}), /Only LightRAG/);
  assert.throws(() => R.config({value:{},profile:'lexical'}), /Only the full/);
});

test('setup selects supported Python without downloading alternative runtimes', () => {
  assert.equal(Setup.pythonExecutable(null, bin => { if (bin === 'python3.12') throw new Error('Missing'); return '[3,11]'; }), 'python3.11');
});
