'use strict';
const fs = require('fs');
const path = require('path');
const C = require('./catalog.js');
const U = require('./util.js');
const OR = require('./openrouter.js');
const Backends = require('./backends.js');

const PROFILES = {
  full: { dense: true, rerank: true, graph: true, descriptions: true },
  lexical: { dense: false, rerank: false, graph: false, descriptions: false },
  'no-dense': { dense: false, rerank: true, graph: true, descriptions: true },
  'no-rerank': { dense: true, rerank: false, graph: true, descriptions: true },
  'no-graph': { dense: true, rerank: true, graph: false, descriptions: true },
  'no-descriptions': { dense: true, rerank: true, graph: true, descriptions: false }
};
function config(opts = {}) {
  const file = opts.value || (opts.config ? U.readJSON(path.resolve(opts.config)) : {});
  const profile = opts.profile || file.profile || 'full';
  if (!PROFILES[profile]) throw new Error('Unknown profile: ' + profile);
  const out = { ...file, backend: opts.backend || file.backend || 'grim', profile, components: { ...PROFILES[profile] }, models: { ...OR.DEFAULTS, ...file.models }, preprocessing: 'grim-block-prose-v1' };
  if (!['grim', 'qmd', 'lightrag'].includes(out.backend)) throw new Error('Unknown retrieval backend');
  if (out.backend !== 'grim' && profile !== 'full') throw new Error('Component ablations are implemented only for Grim RAG.');
  return out;
}
function identity(cfg) { return U.hash({ backend: cfg.backend, profile: cfg.profile, components: cfg.components, models: cfg.models, preprocessing: cfg.preprocessing, endpoint: cfg.baseURL || 'https://openrouter.ai/api/v1',
  implementation: ['catalog.js', 'retrieve.js', 'openrouter.js', 'backends.js', 'lightrag_bridge.py'].map((f) => U.hash(fs.readFileSync(path.join(__dirname, f)))), provider: cfg.provider || null, qmd: cfg.qmd || null, lightrag: cfg.lightrag || null }); }
function metadata(r) { return JSON.stringify({ key: r.key, title: r.title, ...r.metadata, branches: r.branches }); }
function contextRecords(cat, r) {
  const ids = new Set(cat.edges.filter((e) => e.from === r.key).map((e) => e.to));
  for (const f of cat.records) if (f.kind === 'fact' && ids.has('npc:' + f.metadata.npc)) ids.add(f.key);
  return cat.records.filter((x) => x.kind !== 'event' && ids.has(x.key)).sort((a, b) => a.key.localeCompare(b.key));
}
function bm25(records, query) {
  const terms = [...new Set(C.words(query))], docs = records.map((r) => C.words(r.searchText)), n = docs.length;
  const avg = docs.reduce((s, d) => s + d.length, 0) / Math.max(1, n), df = new Map();
  for (const t of terms) df.set(t, docs.filter((d) => d.includes(t)).length);
  return records.map((r, i) => {
    let score = 0; const matched = [];
    for (const t of terms) { const tf = docs[i].filter((w) => w === t).length; if (!tf) continue; matched.push(t); score += Math.log(1 + (n - df.get(t) + 0.5) / (df.get(t) + 0.5)) * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * docs[i].length / (avg || 1))); }
    return { key: r.key, score, reason: 'BM25: ' + matched.join(', ') };
  }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
}
function cosine(a, b) {
  if (a.length !== b.length) throw new Error('Embedding dimensions differ');
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; aa += a[i] * a[i]; bb += b[i] * b[i]; }
  return aa && bb ? dot / Math.sqrt(aa * bb) : 0;
}
function fuse(lists) {
  const out = new Map();
  for (const list of lists) list.forEach((hit, i) => { const row = out.get(hit.key) || { key: hit.key, score: 0, reasons: [] }; row.score += 1 / (60 + i + 1); row.reasons.push(hit.reason); out.set(hit.key, row); });
  return [...out.values()].sort((a, b) => b.score - a.score || a.key.localeCompare(b.key)).map((r) => ({ ...r, reason: r.reasons.join('; ') }));
}
function create(root, cfg, options = {}) {
  const cat = options.catalog || C.catalog(root), id = identity(cfg);
  const dir = path.resolve(options.cache || path.join(root, 'experiments/authoring/cache'), cfg.backend, id);
  const service = options.service || OR.client(cfg), stages = [], byKey = new Map(cat.records.map((r) => [r.key, r]));
  const manifestFile = path.join(dir, 'index.json');
  const stage = (name, data) => stages.push({ stage: name, ...data });
  async function index() {
    const prior = fs.existsSync(manifestFile) ? U.readJSON(manifestFile) : null, records = [];
    fs.mkdirSync(dir, { recursive: true });
    for (const r of cat.records.filter((x) => !x.retired)) {
      const context = cfg.components.graph ? contextRecords(cat, r) : [];
      const key = U.hash({ block: r.sourceHash, dependencies: context.map((x) => [x.key, x.sourceHash]), id });
      const previous = prior?.records.find((x) => x.key === r.key && x.inputKey === key);
      if (previous) { records.push({ ...previous, file: r.file, line: r.line, metadata: r.metadata }); continue; }
      let description = '';
      if (cfg.backend === 'grim' && cfg.components.descriptions && r.kind === 'event') description = await service.describe(r, context);
      const searchText = metadata(r) + '\n' + (description ? 'Derived search description: ' + description + '\n' : '') + r.text;
      records.push({ key: r.key, kind: r.kind, file: r.file, line: r.line, metadata: r.metadata, inputKey: key, sourceHash: r.sourceHash, searchText, description, dependencies: context.map((x) => [x.key, x.sourceHash]) });
    }
    if (cfg.backend === 'grim' && cfg.components.dense) {
      for (let i = 0; i < records.length; i += 32) {
        const batch = records.slice(i, i + 32).filter((r) => !r.vector);
        if (!batch.length) continue;
        const vectors = await service.embed(batch.map((r) => r.searchText));
        batch.forEach((r, j) => { r.vector = vectors[j]; });
      }
    }
    let backendIdentity = null;
    // External indexes are immutable per corpus/config fingerprint; old versions remain recoverable.
    if (cfg.backend !== 'grim') {
      const externalDir = path.join(dir, cat.corpusHash);
      backendIdentity = await Backends.index(cfg.backend, records, externalDir, cfg, options.execute);
    }
    const dimensions = records.find((r) => r.vector)?.vector.length || backendIdentity?.dimensions || null;
    if (records.some((r) => r.vector && (r.vector.length !== dimensions || r.vector.some((v) => !Number.isFinite(v))))) throw new Error('Inconsistent index vectors');
    const result = { version: 1, identity: id, corpusHash: cat.corpusHash, config: cfg, dimensions, records, backendIdentity, calls: service.calls || [], at: new Date().toISOString() };
    result.indexHash = U.hash({ identity: id, corpusHash: cat.corpusHash, records, backendIdentity });
    U.writeJSON(manifestFile, result);
    U.appendJSON(path.join(dir, 'builds.jsonl'), { at: result.at, identity: id, indexHash: result.indexHash, corpusHash: cat.corpusHash, dimensions, calls: result.calls, backendIdentity });
    stage('index', { indexHash: result.indexHash, components: cfg.components, records: records.length, reused: records.filter((r) => prior?.records.some((x) => x.inputKey === r.inputKey)).length });
    return { ...result, records: result.records.length };
  }
  function load() {
    if (!fs.existsSync(manifestFile)) throw new Error('Index missing. Run retrieve index with this backend/profile first.');
    const m = U.readJSON(manifestFile);
    if (m.identity !== id || m.corpusHash !== cat.corpusHash || U.hash({ identity: m.identity, corpusHash: m.corpusHash, records: m.records, backendIdentity: m.backendIdentity }) !== m.indexHash) throw new Error('Stale or modified index; rebuild before querying.');
    if (!cfg.components.descriptions && m.records.some((r) => r.description)) throw new Error('Ablation contaminated by contextual descriptions');
    if (!cfg.components.dense && m.records.some((r) => r.vector)) throw new Error('Ablation contaminated by vectors');
    return m;
  }
  async function search(query, opts = {}) {
    if (!query || !query.trim()) throw new Error('A nonempty query is required');
    const m = load(); let hits;
    const eligible = m.records.filter((r) => { const x = byKey.get(r.key); return (!opts.kind || x.kind === opts.kind) && (!opts.place || x.metadata.place === opts.place) && (!opts.cast || opts.cast.split(',').some((id) => x.key === 'npc:' + id || x.metadata.npc === id || cat.edges.some((e) => e.from === x.key && e.to === 'npc:' + id))); });
    if (cfg.backend === 'grim') {
      const lex = bm25(eligible, query).slice(0, 20); stage('lexical', { enabled: true, ids: lex.map((r) => r.key) });
      let dense = [];
      if (cfg.components.dense) { const [vector] = await service.embed([query]); dense = eligible.map((r) => ({ key: r.key, score: cosine(vector, r.vector), reason: 'Dense similarity' })).sort((a, b) => b.score - a.score || a.key.localeCompare(b.key)).slice(0, 20); }
      stage('dense', { enabled: cfg.components.dense, ids: dense.map((r) => r.key), indexHash: m.indexHash });
      hits = fuse([lex, dense]).slice(0, 40);
      if (cfg.components.rerank && hits.length) {
        hits = (await service.rerank(query, hits.map((h) => ({ ...h, searchText: m.records.find((r) => r.key === h.key).searchText })))).map(({ searchText, ...r }) => r);
      }
      stage('rerank', { enabled: cfg.components.rerank, ids: hits.map((r) => r.key) });
    } else {
      const result = await Backends.search(cfg.backend, query, path.join(dir, cat.corpusHash), m.backendIdentity, cfg, options.execute);
      const allowed = new Set(eligible.map((r) => r.key));
      for (const h of result.hits) if (!byKey.has(h.key)) throw new Error('Backend returned an unknown parent id: ' + h.key);
      hits = [...new Map(result.hits.filter((r) => allowed.has(r.key)).map((r) => [r.key, r])).values()];
      stage('external', { backend: cfg.backend, identity: m.backendIdentity, calls: result.calls, ids: hits.map((r) => r.key) });
    }
    const limit = U.positive(opts.limit, 10);
    return { query, backend: cfg.backend, profile: cfg.profile, corpusHash: cat.corpusHash, indexHash: m.indexHash, total: hits.length,
      results: hits.slice(0, limit).map((h) => { const r = byKey.get(h.key); return { ...h, title: r.title, file: r.file, line: r.line, sourceHash: r.sourceHash, authority: r.authority, metadata: r.metadata, excerpt: r.prose.slice(0, 280) }; }), stages: stages.slice(), calls: service.calls || [] };
  }
  function read(keys, budget) { return C.pack(keys.map((key) => C.resolve(cat, key)), budget, keys.map((key) => C.resolve(cat, key).key)); }
  async function brief(query, opts = {}) {
    const found = await search(query, opts), required = (opts.required || '').split(',').filter(Boolean).map((key) => C.resolve(cat, key).key);
    for (const id of (opts.cast || '').split(',').filter(Boolean)) {
      required.push(C.resolve(cat, 'npc:' + id).key);
      required.push(...cat.records.filter((r) => r.kind === 'fact' && r.metadata.npc === id).map((r) => r.key));
    }
    for (const kind of ['place', 'track', 'arc']) if (opts[kind]) required.push(C.resolve(cat, kind + ':' + opts[kind]).key);
    const roots = [...required, ...found.results.map((r) => r.key)], expanded = [], truncated = [];
    if (cfg.components.graph) for (const key of roots) {
      const n = C.neighbors(cat, key, 20);
      if (n.omitted) truncated.push({ key, omittedEdges: n.omitted });
      for (const edge of n.edges) expanded.push(edge.from === key ? edge.to : edge.from);
    }
    stage('graph', { enabled: cfg.components.graph, roots, ids: [...new Set(expanded)] });
    const packed = C.pack([...required, ...expanded, ...roots].map((key) => byKey.get(key)).filter(Boolean), opts.budget, required);
    return { ...packed, dependenciesTruncated: truncated, backend: cfg.backend, profile: cfg.profile, corpusHash: cat.corpusHash, indexHash: found.indexHash, stages: stages.slice(), calls: service.calls || [] };
  }
  return { cat, cfg, dir, stages, service, index, search, read, brief, neighbors: (key, limit) => { if (!cfg.components.graph) throw new Error('Graph expansion disabled by profile'); stage('graph', { enabled: true }); return C.neighbors(cat, key, limit); } };
}
module.exports = { PROFILES, config, identity, create, bm25, cosine, fuse };
