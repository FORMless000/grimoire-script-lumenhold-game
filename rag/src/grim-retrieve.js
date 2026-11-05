'use strict';
const fs = require('fs'), path = require('path');
const C = require('./catalog.js'), U = require('./util.js');
const A = require('./adapters/grim.js');
const FULL = { dense: true, rerank: true, graph: true, descriptions: true };
function config(opts = {}) {
  const file = opts.value || {}, preset = file.preset || require('../authoring.json').preset || 'gemini';
  function noSecrets(value) { for (const [k, v] of Object.entries(value || {})) { if (/api[_-]?key|authorization|password|secret/i.test(k)) throw new Error('Keep credentials in rag/.env.local'); if (v && typeof v === 'object') noSecrets(v); } }
  noSecrets(file);
  if ((opts.profile || file.profile || 'full') !== 'full') throw new Error('Only the full Grim profile is supported');
  if (!['gemini', 'qwen'].includes(preset)) throw new Error('Unknown Grim preset');
  return { backend: 'grim', profile: 'full', preset, components: { ...FULL }, preprocessing: 'grim-contextual-v2',
    models: { ...require('./models.json'), helper: preset === 'qwen' ? 'qwen/qwen3.8-flash' : require('./models.json').helper, ...file.models },
    baseURL: file.baseURL, provider: file.provider, indexConcurrency: U.positive(file.indexConcurrency, 8), test: file.test };
}
function identity(cfg) {
  return U.hash({ preprocessing: cfg.preprocessing, helper: cfg.models.helper, embedding: cfg.models.embedding,
    endpoint: cfg.baseURL || 'https://openrouter.ai/api/v1', provider: cfg.provider || null,
    implementation: ['grim-retrieve.js', 'catalog.js', 'adapters/grim.js', 'openrouter.js'].map(f => U.hash(fs.readFileSync(path.join(__dirname, f)))) });
}
const queryIdentity = cfg => U.hash({ build: identity(cfg), reranker: cfg.models.reranker });
function contextFor(cat, record) {
  const ids = new Set(cat.edges.filter(e => e.from === record.key).map(e => e.to));
  for (const r of cat.records) if (r.kind === 'fact' && ids.has('npc:' + r.metadata.npc)) ids.add(r.key);
  return cat.records.filter(r => r.kind !== 'event' && !r.retired && r.key !== record.key && ids.has(r.key)).sort((a, b) => a.key.localeCompare(b.key));
}
function noLocations(value) {
  if (Array.isArray(value)) return value.map(noLocations);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([k]) => !['file', 'line', 'endLine'].includes(k)).map(([k, v]) => [k, noLocations(v)]));
  return value;
}
function inputs(cat) {
  return cat.records.filter(r => !r.retired).map(r => {
    const context = contextFor(cat, r);
    const metadata = JSON.stringify(noLocations({ key: r.key, title: r.title, ...r.metadata, branches: r.branches }));
    const dependencies = context.map(x => [x.key, U.hash(x.text.trim())]);
    return { key: r.key, kind: r.kind, file: r.file, line: r.line, metadata: r.metadata, sourceHash: r.sourceHash,
      inputKey: U.hash({ metadata, text: r.text.trim(), dependencies }), metadataText: metadata, dependencies, context, original: r };
  });
}
function changes(before, records) {
  const old = new Map((before?.records || []).map(r => [r.key, r])), now = new Map(records.map(r => [r.key, r]));
  return { added: records.filter(r => !old.has(r.key)).map(r => r.key), modified: records.filter(r => old.has(r.key) && old.get(r.key).inputKey !== r.inputKey).map(r => r.key),
    deleted: [...old.keys()].filter(k => !now.has(k)), moved: records.filter(r => old.get(r.key)?.inputKey === r.inputKey && (old.get(r.key).file !== r.file || old.get(r.key).line !== r.line)).map(r => r.key),
    reused: records.filter(r => old.get(r.key)?.inputKey === r.inputKey).length };
}
const digest = m => U.hash({ identity: m.identity, corpusHash: m.corpusHash, records: m.records, dimensions: m.dimensions });
function validate(m) {
  if (m.version !== 1 || m.indexHash !== digest(m)) throw new Error('Modified or unsupported Grim index manifest');
  if (!m.records.length || !Number.isInteger(m.dimensions) || m.dimensions <= 0 || new Set(m.records.map(r => r.key)).size !== m.records.length ||
    m.records.some(r => !Array.isArray(r.vector) || r.vector.length !== m.dimensions || r.vector.some(x => !Number.isFinite(x)))) throw new Error('Incomplete Grim vector coverage');
  return m;
}
function create(root, cfg, options = {}) {
  const cat = options.catalog || C.catalog(root), id = identity(cfg), cache = path.resolve(options.cache || path.join(root, 'rag/cache'));
  const dir = path.join(cache, 'grim', id), manifestFile = path.join(dir, 'index.json'), pendingFile = path.join(dir, 'pending.json'), lock = path.join(dir, 'writer.lock');
  const service = options.service || A.service({ ...cfg, requestCache: path.join(cache, 'grim/requests'), receiptFile: path.join(dir, 'api-calls.jsonl') });
  const stages = [], byKey = new Map(cat.records.map(r => [r.key, r]));
  const stage = (name, data) => stages.push({ stage: name, ...data });
  const prior = () => fs.existsSync(manifestFile) ? validate(U.readJSON(manifestFile)) : null;
  function status() {
    const m = prior(), delta = changes(m, inputs(cat));
    const state = fs.existsSync(lock) ? 'updating' : fs.existsSync(pendingFile) ? 'failed/resumable' : !m ? 'unbuilt' : m.identity !== id || m.corpusHash !== cat.corpusHash ? 'stale' : 'ready';
    return { backend: 'grim', profile: 'full', state, ready: state === 'ready', corpusHash: cat.corpusHash, indexHash: m?.indexHash || null, records: m?.records.length || 0, changes: delta,
      reason: state === 'ready' ? null : !m ? 'Initial Grim index required: retrieve index --rebuild' : 'Run retrieve index' + (fs.existsSync(pendingFile) ? ' --resume' : ''), queryIdentity: queryIdentity(cfg) };
  }
  async function index(opts = {}) {
    const before = prior(), prepared = inputs(cat), delta = changes(before, prepared);
    if (opts['dry-run']) return { dryRun: true, ...status(), rebuildRequired: !before, paidCalls: 0 };
    if (!before && !opts.rebuild && !opts.resume) throw new Error('Index unbuilt. Run retrieve index --rebuild.');
    if (opts.mode && opts.mode !== 'sync') throw new Error('Grim indexing supports --mode sync');
    fs.mkdirSync(dir, { recursive: true });
    let fd;
    try { fd = fs.openSync(lock, 'wx', 0o600); fs.writeFileSync(fd, JSON.stringify({ pid: process.pid })); }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const owner = U.readJSON(lock); let alive = true;
      try { process.kill(owner.pid, 0); } catch (e) { if (e.code === 'ESRCH') alive = false; }
      if (!alive && opts.resume) { fs.unlinkSync(lock); return index(opts); }
      throw new Error('Index writer is locked; resume after the writer exits.');
    }
    try {
      const target = U.hash({ id, corpusHash: cat.corpusHash, records: prepared.map(r => [r.key, r.inputKey]) });
      if (fs.existsSync(pendingFile)) {
        if (!opts.resume) throw new Error('Unfinished update exists; use --resume.');
        if (U.readJSON(pendingFile).target !== target) throw new Error('Resume refused: source or build configuration changed.');
      } else {
        if (opts.resume) throw new Error('No unfinished update to resume');
        U.writeJSON(pendingFile, { target, at: new Date().toISOString() });
      }
      const old = new Map((before?.records || []).map(r => [r.key, r])), records = new Array(prepared.length);
      let next = 0;
      const checkpoint = r => path.join(dir, 'progress', r.inputKey + '.json');
      async function worker() {
        while (next < prepared.length) {
          const slot = next++, r = prepared[slot], saved = old.get(r.key);
          let value = saved?.inputKey === r.inputKey ? saved : fs.existsSync(checkpoint(r)) ? U.readJSON(checkpoint(r)) : null;
          if (value && (value.inputKey !== r.inputKey || value.key !== r.key || value.checkpointHash !== U.hash({ ...value, checkpointHash: undefined }))) throw new Error('Modified Grim checkpoint');
          if (!value) {
            const description = await A.description(r.original, r.context, cfg, service);
            value = { key: r.key, inputKey: r.inputKey, description,
              searchText: r.metadataText + '\n' + (description ? 'Derived search description: ' + description + '\n' : '') + r.original.text };
          }
          records[slot] = { ...value, kind: r.kind, file: r.file, line: r.line, metadata: r.metadata, sourceHash: r.sourceHash, dependencies: r.dependencies };
          const entry = records[slot]; delete entry.checkpointHash;
          entry.checkpointHash = U.hash(entry); U.writeJSON(checkpoint(r), entry);
        }
      }
      const workers = await Promise.allSettled(Array.from({ length: Math.min(cfg.indexConcurrency, prepared.length) }, worker));
      const failure = workers.find(x => x.status === 'rejected'); if (failure) throw failure.reason;
      // Only changed/new search documents need embeddings; completed batches survive interruption.
      await A.vectors(records, cfg, service, r => { delete r.checkpointHash; r.checkpointHash = U.hash(r); U.writeJSON(checkpoint(r), r); });
      if (U.hash(options.catalog || C.catalog(root)) !== U.hash(cat)) throw new Error('Source changed during indexing; revision not published.');
      const m = { version: 1, identity: id, corpusHash: cat.corpusHash, config: cfg, dimensions: records.find(r => r.vector)?.vector.length, records, at: new Date().toISOString() };
      m.indexHash = digest(m); validate(m); U.writeJSON(manifestFile, m); fs.unlinkSync(pendingFile);
      U.appendJSON(path.join(dir, 'builds.jsonl'), { at: m.at, indexHash: m.indexHash, changes: delta });
      stage('index', { ...delta, records: records.length });
      return { ...m, records: records.length, changes: delta, calls: service.calls };
    } finally { if (fd !== undefined) fs.closeSync(fd); fs.rmSync(lock, { force: true }); }
  }
  function load() {
    const m = prior(); if (!m) throw new Error('Index unbuilt. Run retrieve index --rebuild.');
    if (m.identity !== id || m.corpusHash !== cat.corpusHash) throw new Error('Stale index; run retrieve index.');
    return m;
  }
  async function search(query, opts = {}) {
    if (!query?.trim()) throw new Error('A nonempty query is required');
    const m = load(), eligible = m.records.filter(r => { const x = byKey.get(r.key); return x && !x.retired && (!opts.kind || x.kind === opts.kind) && (!opts.place || x.metadata.place === opts.place) &&
      (!opts.cast || opts.cast.split(',').some(k => x.key === 'npc:' + k || x.metadata.npc === k || cat.edges.some(e => e.from === x.key && e.to === 'npc:' + k))); });
    const hits = await A.search(eligible, m.records, query, cfg, service, stage, m.indexHash);
    return { query, backend: 'grim', profile: 'full', corpusHash: cat.corpusHash, indexHash: m.indexHash, total: hits.length,
      results: hits.slice(0, U.positive(opts.limit, 10)).map(h => { const r = byKey.get(h.key); return { ...h, title: r.title, file: r.file, line: r.line, sourceHash: r.sourceHash, authority: r.authority, metadata: r.metadata, excerpt: r.prose.slice(0, 280) }; }), stages: stages.slice(), calls: service.calls };
  }
  const read = (keys, budget) => C.pack(keys.map(k => C.resolve(cat, k)), budget, keys.map(k => C.resolve(cat, k).key));
  async function brief(query, opts = {}) {
    const found = await search(query, opts), required = (opts.required || '').split(',').filter(Boolean).map(k => C.resolve(cat, k).key);
    for (const k of (opts.cast || '').split(',').filter(Boolean)) { required.push(C.resolve(cat, 'npc:' + k).key); required.push(...cat.records.filter(r => r.kind === 'fact' && r.metadata.npc === k).map(r => r.key)); }
    for (const kind of ['place', 'track', 'arc']) if (opts[kind]) required.push(C.resolve(cat, kind + ':' + opts[kind]).key);
    const roots = [...required, ...found.results.map(r => r.key)], expanded = [], truncated = [];
    for (const key of roots) { const n = C.neighbors(cat, key, 20); if (n.omitted) truncated.push({ key, omittedEdges: n.omitted }); for (const e of n.edges) expanded.push(e.from === key ? e.to : e.from); }
    stage('graph', { enabled: true, roots, ids: [...new Set(expanded)] });
    const packed = C.pack([...required, ...expanded, ...roots].map(k => byKey.get(k)).filter(r => r && !r.retired), opts.budget, required);
    return { ...packed, dependenciesTruncated: truncated, backend: 'grim', profile: 'full', corpusHash: cat.corpusHash, indexHash: found.indexHash, stages: stages.slice(), calls: service.calls };
  }
  return { cat, cfg, dir, service, stages, status, index, load, search, read, brief, neighbors: (key, limit) => C.neighbors(cat, key, limit) };
}
function prunePlan(cache, cfg) {
  const dir = path.join(cache, 'grim', identity(cfg)), file = path.join(dir, 'index.json');
  if (!fs.existsSync(file) || fs.existsSync(path.join(dir, 'pending.json')) || fs.existsSync(path.join(dir, 'writer.lock'))) return [];
  const m = validate(U.readJSON(file)), keep = new Set(m.records.map(r => r.inputKey + '.json')), progress = path.join(dir, 'progress');
  return fs.existsSync(progress) ? fs.readdirSync(progress).filter(f => !keep.has(f)).map(f => ({ path: path.join(progress, f), why: 'obsolete Grim block checkpoint' })) : [];
}
module.exports = { config, identity, extractionIdentity: identity, queryIdentity, create, digest, inputs, changes, prunePlan };
