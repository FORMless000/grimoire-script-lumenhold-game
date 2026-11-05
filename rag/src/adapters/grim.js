'use strict';
const C = require('../catalog.js');
const OR = require('../openrouter.js');
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
async function search(eligible, records, query, cfg, service, stage, indexHash) {
let hits;
      const lex = bm25(eligible, query).slice(0, 20); stage('lexical', { enabled: true, ids: lex.map((r) => r.key) });
      let dense = [];
      if (cfg.components.dense) { const [vector] = await service.embed([query]); dense = eligible.map((r) => ({ key: r.key, score: cosine(vector, r.vector), reason: 'Dense similarity' })).sort((a, b) => b.score - a.score || a.key.localeCompare(b.key)).slice(0, 20); }
      stage('dense', { enabled: cfg.components.dense, ids: dense.map((r) => r.key), indexHash: indexHash });
      hits = fuse([lex, dense]).slice(0, 40);
      if (cfg.components.rerank && hits.length) {
        hits = (await service.rerank(query, hits.map((h) => ({ ...h, searchText: records.find((r) => r.key === h.key).searchText })))).map(({ searchText, ...r }) => r);
      }
      stage('rerank', { enabled: cfg.components.rerank, ids: hits.map((r) => r.key) });

return hits;
}
async function description(r, context, cfg, service) { return cfg.components.descriptions && r.kind === 'event' ? service.describe(r, context) : ''; }
async function vectors(records, cfg, service, checkpoint) {
 if (!cfg.components.dense) return;
 for (let i=0; i<records.length; i+=32) {
  const batch=records.slice(i,i+32).filter(r=>!r.vector); if (!batch.length) continue;
  const vectors=await service.embed(batch.map(r=>r.searchText));
  batch.forEach((r,j)=>{r.vector=vectors[j]; checkpoint(r);});
 }
}
module.exports = { local: true, description, vectors, files: ['adapters/grim.js', 'openrouter.js', 'credentials.js', 'model-aliases.json'], service: OR.client, bm25, cosine, fuse, search };
