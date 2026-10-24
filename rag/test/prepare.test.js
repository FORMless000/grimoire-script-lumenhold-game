'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path'), os = require('os');
const { spawnSync } = require('child_process');
const { options, prepare, verifyStorage } = require('../prepare.js');

test('preparation is read-only by default and rejects ambiguous or unknown modes', () => {
  assert.equal(options([]).mode, 'check');
  assert.equal(options(['--build']).mode, 'build');
  for (const argv of [['--build', '--sync'], ['--check', '--resume'], ['--mode', 'batch'], ['--build', 'false'], ['oops'], ['--python-bin']]) {
    assert.throws(() => options(argv));
  }
});

function harness(state = 'ready') {
  const indexes = [], installs = [];
  const engine = { status: () => ({ ready: state === 'ready', state, corpusHash: 'source', indexHash: 'index', reason: 'Not ready' }),
    index: async opts => { indexes.push(opts); state = 'ready'; } };
  return { indexes, installs, dependencies: { setup: opts => installs.push(opts), inspect: async () => ({ light: { lightrag: '1.5.7' } }),
    config: () => ({}), create: () => engine, verify: () => ({ documents: 2 }) } };
}

test('check never installs or indexes, including unbuilt/stale/failed indexes', async () => {
  for (const state of ['ready', 'unbuilt', 'stale', 'failed/resumable', 'updating']) {
    const h = harness(state);
    if (state === 'ready') assert.equal((await prepare(options([]), h.dependencies)).ready, true);
    else await assert.rejects(prepare(options([]), h.dependencies), /Not ready/);
    assert.deepEqual(h.installs, []); assert.deepEqual(h.indexes, []);
  }
});

test('explicit preparation builds only missing indexes, syncs edits and preserves pending work', async () => {
  for (const [state, mode, expected] of [['unbuilt', 'build', { rebuild: true, mode: 'sync' }],
    ['stale', 'build', { rebuild: false, mode: 'sync' }], ['stale', 'sync', {}], ['failed/resumable', 'resume', { resume: true }]]) {
    const h = harness(state);
    await prepare(options(['--' + mode]), h.dependencies);
    assert.deepEqual(h.indexes, [expected]); assert.equal(h.installs.length, 1);
  }
  const ready = harness(); await prepare(options(['--build']), ready.dependencies); assert.deepEqual(ready.indexes, []);
  const pending = harness('failed/resumable');
  await assert.rejects(prepare(options(['--build']), pending.dependencies), /Pending work/);
  assert.deepEqual(pending.indexes, []);
  const wrong = harness(); wrong.dependencies.inspect = async () => ({ light: { lightrag: '0.0' } });
  await assert.rejects(prepare(options([]), wrong.dependencies), /1.5.7/);
});

test('native storage verification catches missing documents, chunks and incomplete statuses', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rag-prepare-'));
  try {
    const manifest = { storage: 'store', records: [{ key: 'event:a' }], revision: 'r', dimensions: 3 };
    const store = path.join(dir, 'store'); fs.mkdirSync(store);
    for (const file of ['graph_chunk_entity_relation.graphml', 'vdb_chunks.json', 'vdb_entities.json', 'vdb_relationships.json']) fs.writeFileSync(path.join(store, file), '{}');
    const write = (name, value) => fs.writeFileSync(path.join(store, name), JSON.stringify(value));
    write('kv_store_full_docs.json', { 'event:a': {} });
    write('kv_store_text_chunks.json', { chunk: {} });
    write('vdb_chunks.json', { embedding_dim: 3, data: [{ __id__: 'chunk' }] });
    write('kv_store_doc_status.json', { 'event:a': { status: 'processed', chunks_list: ['chunk'] } });
    const engine = { dir, load: () => manifest };
    assert.equal(verifyStorage(engine).documents, 1);
    write('kv_store_text_chunks.json', {}); assert.throws(() => verifyStorage(engine), /coverage/);
    write('kv_store_text_chunks.json', { chunk: {} });
    write('vdb_chunks.json', { embedding_dim: 4, data: [{ __id__: 'chunk' }] });
    assert.throws(() => verifyStorage(engine), /dimensions/);
    write('vdb_chunks.json', { embedding_dim: 3, data: [{ __id__: 'chunk' }] });
    write('kv_store_doc_status.json', { 'event:a': { status: 'failed', chunks_list: ['chunk'] } });
    assert.throws(() => verifyStorage(engine), /Incomplete/);
    write('kv_store_full_docs.json', {}); assert.throws(() => verifyStorage(engine), /coverage/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('Git excludes local artifacts but keeps authoring source, defaults and setup entry points', () => {
  const root = path.resolve(__dirname, '../..');
  const ignored = ['cache/graph/index.json', 'envs/lightrag/bin/python', 'dependencies/library/source.py', 'models/weights.bin',
    'downloads/archive.zip', 'runs/review.json', 'receipts/retrieval.jsonl', '.env.local', '.env.backup', 'src/__pycache__/x.pyc'];
  const shipped = ['src/retrieve.js', 'src/models.json', 'authoring.json', 'requirements-lightrag.txt', 'README.md', '.env.example',
    'setup.sh', 'setup.ps1', 'prepare.js', 'prepare.sh', 'prepare.ps1', 'evaluation/tasks.json', 'test/prepare.test.js'];
  for (const name of [...ignored, ...shipped]) {
    const result = spawnSync('git', ['check-ignore', '--no-index', '-q', 'rag/' + name], { cwd: root });
    assert.equal(result.status, ignored.includes(name) ? 0 : 1, name);
  }
  assert.equal(spawnSync('sh', ['-n', path.join(root, 'rag/prepare.sh')]).status, 0);
  const help = spawnSync('sh', [path.join(root, 'rag/prepare.sh'), '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0, help.stderr); assert.ok(JSON.parse(help.stdout).check.includes('no network'));
  assert.ok(fs.readFileSync(path.join(root, 'rag/prepare.ps1'), 'utf8').includes("'prepare.js'"));
});
