'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), path = require('path'), os = require('os');
const R = require('../src/retrieval.js'), G = require('../src/grim-retrieve.js'), C = require('../src/catalog.js'), U = require('../src/util.js');
const dirs = [];
test.after(() => { for (const d of dirs) fs.rmSync(d, { recursive: true, force: true }); });
const event = (id = 'a', text = 'A pineapple bargain.') => `@event ${id}\ntitle: ${id}\nactor: shared\ntext: ${text}\n> left: Ask\n  if flag(secret):\n    say: A hedgehog answers.\n  else:\n    say: No reply.\n> right: Leave\n  say: Goodbye.\n`;
function fixture() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'grim-rag-')); dirs.push(d); fs.mkdirSync(path.join(d, 'content'));
  fs.writeFileSync(path.join(d, 'content/a.grim'), event());
  fs.writeFileSync(path.join(d, 'content/world.grim'), '@npc shared\nname: Shared\nvoice: Quiet.\n');
  return d;
}
function fake() {
  const calls = [];
  return { calls, async describe(r, context) { calls.push({ role: 'describe', key: r.key, context: context.map(x => x.key) }); return 'Derived ' + r.key; },
    async embed(texts) { calls.push({ role: 'embed', count: texts.length }); return texts.map(s => [1, s.includes('pineapple') ? 2 : 1, s.length / 1000]); },
    async rerank(q, rows) { calls.push({ role: 'rerank', count: rows.length }); return rows.map((r, i) => ({ ...r, rerankScore: rows.length - i })); } };
}
test('default dispatch selects Grim despite old local LightRAG paths; explicit LightRAG remains available', () => {
  assert.equal(R.config().backend, 'grim');
  assert.equal(R.config({ value: { backend: 'grim', lightrag: { python: '/old/python' } } }).backend, 'grim');
  assert.equal(R.config({ backend: 'lightrag' }).backend, 'lightrag');
  assert.throws(() => R.config({ backend: 'qmd' }), /Supported retrieval/);
  const { setup } = require('../setup.js');
  assert.equal(setup({}, () => { throw new Error('Grim must not install Python'); }).pythonRequired, false);
});
test('hybrid stages, full branches, source mapping and strict evidence budgets survive dispatch', async () => {
  const dir = fixture(), service = fake(), cfg = R.config(), engine = R.create(dir, cfg, { service });
  assert.equal(engine.status().state, 'unbuilt');
  assert.equal((await engine.index({ 'dry-run': true })).paidCalls, 0); assert.equal(service.calls.length, 0);
  await engine.index({ rebuild: true });
  assert.equal(engine.status().ready, true);
  const found = await engine.search('pineapple', { kind: 'event', limit: 1 });
  assert.equal(found.backend, 'grim'); assert.equal(found.results[0].key, 'event:a');
  assert.deepEqual(found.stages.filter(s => s.stage !== 'index').map(s => s.stage), ['lexical', 'dense', 'rerank']);
  assert.match(engine.read(['event:a'], 5000).text, /if flag\(secret\):/);
  assert.equal(engine.read(['event:a'], 10).incomplete, true);
  assert(engine.neighbors('event:a', 20).edges.some(e => e.to === 'npc:shared'));
  const brief = await engine.brief('pineapple', { budget: 10, required: 'event:a' });
  assert.equal(brief.incomplete, true); assert(brief.chars <= 10);
  assert.equal(require('../prepare.js').verifyStorage(engine).documents, 2);
});
test('incremental indexing reuses unchanged vectors/descriptions, follows context edits and handles moves/deletions', async () => {
  const dir = fixture(), cfg = R.config(), service = fake();
  await R.create(dir, cfg, { service }).index({ rebuild: true }); service.calls.length = 0;
  await R.create(dir, cfg, { service }).index(); assert.equal(service.calls.length, 0);
  fs.renameSync(path.join(dir, 'content/a.grim'), path.join(dir, 'content/moved.grim'));
  const moved = await R.create(dir, cfg, { service }).index();
  assert.deepEqual(moved.changes.moved, ['event:a']); assert.equal(service.calls.length, 0);
  fs.writeFileSync(path.join(dir, 'content/world.grim'), '@npc shared\nname: Shared\nvoice: Loud.\n');
  const edited = await R.create(dir, cfg, { service }).index();
  assert.deepEqual(edited.changes.modified.sort(), ['event:a', 'npc:shared']);
  assert.equal(service.calls.filter(c => c.role === 'describe').length, 1);
  assert.equal(service.calls.find(c => c.role === 'embed').count, 2);
  service.calls.length = 0; fs.rmSync(path.join(dir, 'content/moved.grim'));
  const removed = await R.create(dir, cfg, { service }).index(); assert.deepEqual(removed.changes.deleted, ['event:a']); assert.equal(service.calls.length, 0);
  // A query-only reranker change reuses the complete index.
  assert.equal(R.identity({ ...cfg, models: { ...cfg.models, reranker: 'other/reranker' } }), R.identity(cfg));
});
test('interrupted updates retain published evidence, resume checkpoints, and refuse changed inputs', async () => {
  const dir = fixture(), cfg = R.config(), service = fake();
  const engine = R.create(dir, cfg, { service }); await engine.index({ rebuild: true });
  const active = fs.readFileSync(path.join(engine.dir, 'index.json'));
  fs.writeFileSync(path.join(dir, 'content/a.grim'), event('a', 'An edited pineapple.'));
  const failing = { ...fake(), embed: async () => { throw new Error('Provider down'); } };
  await assert.rejects(R.create(dir, cfg, { service: failing }).index(), /Provider down/);
  assert.deepEqual(fs.readFileSync(path.join(engine.dir, 'index.json')), active);
  assert.equal(R.create(dir, cfg, { service }).status().state, 'failed/resumable');
  service.calls.length = 0; await R.create(dir, cfg, { service }).index({ resume: true });
  assert.equal(service.calls.filter(c => c.role === 'describe').length, 0, 'description checkpoint reused');
  fs.writeFileSync(path.join(dir, 'content/a.grim'), event('a', 'Another edit.'));
  await assert.rejects(R.create(dir, cfg, { service: failing }).index(), /Provider down/);
  fs.writeFileSync(path.join(dir, 'content/a.grim'), event('a', 'Changed during interruption.'));
  await assert.rejects(R.create(dir, cfg, { service }).index({ resume: true }), /Resume refused/);
});
test('stale Grim retrieval ranks synced text, hides deleted blocks and excludes new drafts', async () => {
  const dir = fixture(), cfg = R.config(), service = fake();
  fs.writeFileSync(path.join(dir, 'content/gone.grim'), event('gone'));
  await R.create(dir, cfg, { service }).index({ rebuild: true });
  fs.rmSync(path.join(dir, 'content/gone.grim')); fs.writeFileSync(path.join(dir, 'content/b.grim'), event('b'));
  const snapshot = require('../src/snapshot.js').fallback(dir, cfg, { service });
  assert.match(snapshot.notice, /new block.*event:b/);
  const found = await snapshot.service.search('pineapple');
  assert.deepEqual(found.results.map(r => r.key).sort(), ['event:a', 'npc:shared']);
});
test('manifest and checkpoint corruption fail closed', async () => {
  const dir = fixture(), cfg = R.config(), engine = R.create(dir, cfg, { service: fake() }); await engine.index({ rebuild: true });
  const file = path.join(engine.dir, 'index.json'), m = U.readJSON(file); m.records[0].vector = []; U.writeJSON(file, m);
  assert.throws(() => engine.load(), /Modified/);
});
test('OpenRouter adapter caches requests, preserves actual model receipts and does not hide failures', async () => {
  const dir = fixture(), cfg = { ...R.config(), test: true, requestCache: path.join(dir, 'requests') };
  let network = 0;
  const service = require('../src/openrouter.js').client(cfg, async (_url, init) => {
    network++; const body = JSON.parse(init.body);
    return { ok: true, json: async () => ({ model: body.model, data: body.input.map((_, index) => ({ index, embedding: [1, 2] })) }) };
  });
  await service.embed(['pineapple']); await service.embed(['pineapple']); assert.equal(network, 1);
  assert.equal(service.calls.at(-1).status, 'cached');
  const broken = require('../src/openrouter.js').client(cfg, async () => ({ ok: false, status: 402 }));
  await assert.rejects(broken.embed(['uncached']), /HTTP 402/);
  assert.equal(broken.calls.at(-1).httpStatus, 402);
});
