'use strict';
// Read-only by default. Building, syncing or resuming requires an explicit flag.
const fs = require('fs');
const path = require('path');
const R = require('./src/retrieve.js');
const U = require('./src/util.js');
const E = require('./src/environment.js');
const { setup } = require('./setup.js');
const ROOT = path.resolve(__dirname, '..');

function options(argv) {
  const { opts, positional } = U.args(argv);
  if (positional.length) throw new Error('Unexpected argument: ' + positional[0]);
  for (const key of Object.keys(opts)) {
    if (!['check', 'build', 'sync', 'resume', 'python-bin', 'help'].includes(key)) throw new Error('Unknown option: --' + key);
    if (key !== 'python-bin' && opts[key] !== true) throw new Error('Expected a flag: --' + key);
  }
  const modes = ['check', 'build', 'sync', 'resume'].filter(key => opts[key]);
  if (modes.length > 1) throw new Error('Choose only one of --check, --build, --sync or --resume');
  if (opts['python-bin'] && typeof opts['python-bin'] !== 'string') throw new Error('--python-bin needs a path');
  if (opts['python-bin'] && (!modes.length || opts.check)) throw new Error('--python-bin requires --build, --sync or --resume');
  return { ...opts, mode: modes[0] || 'check' };
}

// Check native on-disk coverage as well as the source/config/manifest fingerprints.
// No LightRAG initialization, embedding, query, or remote request is made here.
function verifyStorage(engine) {
  const manifest = engine.load();
  const storage = U.inside(engine.dir, manifest.storage);
  for (const name of ['graph_chunk_entity_relation.graphml', 'vdb_chunks.json', 'vdb_entities.json', 'vdb_relationships.json']) {
    if (!fs.statSync(path.join(storage, name)).size) throw new Error('Empty native storage: ' + name);
  }
  const docs = U.readJSON(path.join(storage, 'kv_store_full_docs.json'));
  const chunks = U.readJSON(path.join(storage, 'kv_store_text_chunks.json'));
  const statuses = U.readJSON(path.join(storage, 'kv_store_doc_status.json'));
  const vectors = U.readJSON(path.join(storage, 'vdb_chunks.json'));
  if (vectors.embedding_dim !== manifest.dimensions || !Array.isArray(vectors.data)
    || U.hash(vectors.data.map(record => record.__id__).sort()) !== U.hash(Object.keys(chunks).sort())) {
    throw new Error('Native chunk vector coverage or dimensions differ from the manifest');
  }
  const expected = manifest.records.map(record => record.key).sort();
  if (U.hash(Object.keys(docs).sort()) !== U.hash(expected) || U.hash(Object.keys(statuses).sort()) !== U.hash(expected)) {
    throw new Error('Native document coverage differs from the manifest');
  }
  for (const key of expected) {
    const record = statuses[key];
    if (record.status !== 'processed' || !record.chunks_list?.length || record.chunks_list.some(id => !chunks[id])) {
      throw new Error('Incomplete native document: ' + key);
    }
  }
  return { documents: expected.length, chunks: Object.keys(chunks).length, revision: manifest.revision };
}

async function prepare(opts, dependencies = {}) {
  const install = dependencies.setup || setup;
  const inspect = dependencies.inspect || E.inspect;
  const config = dependencies.config || R.config;
  const create = dependencies.create || (cfg => R.create(ROOT, cfg));
  const verify = dependencies.verify || verifyStorage;
  if (opts.mode !== 'check') install(opts['python-bin'] ? { 'python-bin': opts['python-bin'] } : {});
  const cfg = config();
  const environment = await inspect(cfg);
  if (environment.light.lightrag !== '1.5.7') throw new Error('Expected lightrag-hku==1.5.7; run ./rag/setup.sh');
  let engine = create(cfg);
  let status = engine.status();
  if (opts.mode !== 'check' && !status.ready) {
    // Never discard pending work or a dead writer lock by implicitly rebuilding.
    if (['updating', 'failed/resumable'].includes(status.state) && opts.mode !== 'resume') {
      throw new Error('Pending work exists. Stop any active writer, then use --resume with the original inputs.');
    }
    await engine.index(opts.mode === 'build' ? { rebuild: status.state === 'unbuilt', mode: 'sync' }
      : opts.mode === 'resume' ? { resume: true } : {});
    engine = create(cfg);
    status = engine.status();
  }
  if (!status.ready) throw new Error(status.state + ': ' + status.reason + '. Use --build for an initial build, --sync for source edits, or --resume for interrupted work.');
  return { ready: true, mode: opts.mode, ...verify(engine), corpusHash: status.corpusHash, indexHash: status.indexHash,
    lightrag: environment.light.lightrag, verification: 'local fingerprints and native storage coverage; no live retrieval probe' };
}

if (require.main === module) {
  Promise.resolve().then(() => {
    const opts = options(process.argv.slice(2));
    if (opts.help) return { usage: './rag/prepare.sh [--check | --build | --sync | --resume] [--python-bin PATH]',
      check: 'Default: read-only, no network or model calls.',
      write: 'Other modes install dependencies and may incur indexing API charges. Build initializes only an unbuilt index; existing indexes are synchronized.' };
    return prepare(opts);
  }).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { options, prepare, verifyStorage };
