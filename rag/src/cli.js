'use strict';
const fs = require('fs');
const path = require('path');
const U = require('./util.js');
const R = require('./retrieval.js');
const Authoring = require('./authoring.js');
const Snapshot = require('./snapshot.js');
const Prune = require('./prune.js');

const { render } = require('./presentation.js');
// Reranking is query-only: it never touches the built graph, so a busy or rate-limited reranker is retried,
// then replaced by the next one in models.json's rerankerFallbacks (announced on stderr and in the receipt).
const TRANSIENT = new Set([408, 425, 429, 500, 502, 503, 504]);
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
// The bridge logs a failed rerank twice: the HTTP call (with its status) and its own summary (without): prefer the first.
function rerankFailure(service) { const f = (service.service.calls || []).filter((x) => x.stage === 'rerank' && x.status === 'failed'); return f.find((x) => x.httpStatus) || f[f.length - 1] || null; }
async function reranked(cfg, open, ask, { first = null, log = (line) => process.stderr.write(line + '\n'), wait = 8000 } = {}) {
  const models = [cfg.models.reranker, ...(cfg.models.rerankerFallbacks || []).filter((m) => m !== cfg.models.reranker)], attempts = [];
  for (let i = 0; i < models.length; i++) {
    for (let tries = 1; ; tries++) {
      const service = i === 0 && first ? first : open({ ...cfg, models: { ...cfg.models, reranker: models[i] } });
      try { const result = await ask(service); if (i || tries > 1) result.reranker = { model: models[i], attempts }; return { service, result }; }
      catch (error) {
        const failed = rerankFailure(service);
        if (!failed) throw error;
        attempts.push({ model: models[i], httpStatus: failed.httpStatus || null, error: failed.error, detail: failed.detail || null });
        if (TRANSIENT.has(failed.httpStatus) && tries < 2) { log('reranker ' + models[i] + ' busy (HTTP ' + failed.httpStatus + '); retrying'); await sleep(wait); continue; }
        if (i + 1 >= models.length) { error.service = service; error.message += ' (every reranker failed: ' + attempts.map((a) => a.model + ' ' + (a.httpStatus || a.error)).join(', ') + ')'; throw error; }
        log('reranker ' + models[i] + ' failed (' + (failed.httpStatus || failed.error) + '); switching to ' + models[i + 1]);
        break;
      }
    }
  }
}
async function retrieve(root, argv) {
  const { opts, positional } = U.args(argv), [operation, ...rest] = positional;
  const allowed=new Set(['backend','profile','config','root','cache','log','out','json','limit','budget','kind','place','cast','track','arc','required','draft','dry-run','resume','rebuild','mode','keep-old']);
  for(const key of Object.keys(opts))if(!allowed.has(key))throw new Error('Unsupported retrieval option: --'+key);
  // Explicit diagnostic/config choices never inherit the everyday default.
  const selected = !opts.backend && !opts.profile && !opts.config ? Authoring.selection() : null;
  const cfg = R.config({ ...opts, backend: opts.backend || selected?.backend, profile: opts.profile || selected?.profile });
  const query = ['search', 'brief', 'related'].includes(operation), base = path.resolve(opts.root || root);
  // A stale index (sources edited since the last sync) still answers everyday queries from its last snapshot.
  let snap = null;
  const open = (c) => { const s = R.create(base, c, { cache: opts.cache }); if (!query) return s; snap = Snapshot.fallback(base, c, { cache: opts.cache, catalog: s.cat }); return snap ? snap.service : s; };
  let service = open(cfg);
  const cache = path.resolve(opts.cache || path.join(base, 'rag/cache'));
  const summary = (p) => ({ dryRun: p.dryRun, removed: p.removed.map((x) => ({ path: path.relative(root, x.path), why: x.why, bytes: x.bytes })), bytes: p.bytes });
  if (snap) process.stderr.write(snap.notice + '\n');
  const start = Date.now(); let result;
  try {
    if (operation === 'status') result = Authoring.status(service, 'authoring');
    else if (operation === 'index') {
      result = await service.index(opts);
      // A fresh index is out: delete what it no longer needs (rag/src/prune.js), unless --keep-old.
      if (!opts['dry-run'] && !opts['keep-old']) result.pruned = summary(Prune.prune(cache, cfg));
    } else if (operation === 'prune') result = summary(Prune.prune(cache, cfg, { dryRun: !!opts['dry-run'] }));
    else if (operation === 'read') result = service.read(rest.join(',').split(',').filter(Boolean), opts.budget);
    else if (operation === 'neighbors') result = service.neighbors(rest[0], U.positive(opts.limit, 20));
    else if (query) {
      let ask;
      if (operation === 'search') ask = (s) => s.search(rest.join(' '), opts);
      else if (operation === 'brief') ask = (s) => s.brief(rest.join(' '), opts);
      else {
        if (!opts.draft) throw new Error('related requires --draft FILE');
        const G = require('../../src/grimoire.js'), text = fs.readFileSync(path.resolve(root, opts.draft), 'utf8');
        const defs = G.parseFile(text, opts.draft), parts = [];
        for (const d of defs) { parts.push(d.title, d.text); for (const o of d.options || []) { parts.push(o.label); G.walkEffects(o.effects, (st) => { if (st.t === 'say') parts.push(st.text); }); } }
        ask = async (s) => { const r = await s.search(parts.filter(Boolean).join(' '), { ...opts, kind: 'event' }); r.warning = 'Similar premises to inspect, not a duplicate verdict.'; return r; };
      }
      try { ({ service, result } = await reranked(cfg, open, ask, { first: service })); } catch (error) { if (error.service) service = error.service; throw error; }
    } else throw new Error('retrieve status|index|prune|search QUERY|read ID…|neighbors ID|brief QUERY|related --draft FILE [index: --dry-run|--resume|--rebuild --mode batch|sync|--keep-old] [prune: --dry-run] [--config FILE] [--json]');
    if (snap) { result.notice = snap.notice; result.snapshot = snap.snapshot; }
  } catch (error) {
    U.appendJSON(path.join(root,'rag/receipts/retrieval.jsonl'), { run: null, backend: cfg.backend, profile: cfg.profile, corpusHash: service.cat.corpusHash, at:new Date(start).toISOString(), argv, operation, error: error.message, stages: service.stages, calls: service.service.calls, elapsedMs: Date.now() - start });
    throw error;
  }
  const output = render(result, operation, opts.json);
  const receipt = { at:new Date(start).toISOString(), argv, run: null, backend: cfg.backend, profile: cfg.profile, components: cfg.components, indexComponents: cfg.components, indexIdentity: R.identity(cfg), corpusHash: service.cat.corpusHash,
    operation, query: rest.join(' '), indexHash: result.indexHash || null, stages: service.stages, calls: service.service.calls, elapsedMs: Date.now() - start, resultHash: U.hash(result), outputHash: U.hash(output.trimEnd()), returnedChars: output.length, returnedBytes: Buffer.byteLength(output), result };
  U.appendJSON((opts.log ? path.resolve(opts.log) : path.join(root,'rag/receipts/retrieval.jsonl')), receipt);
  if (opts.out) U.writeJSON(path.resolve(opts.out), result, true);
  else process.stdout.write(output);
  if (result.incomplete) process.exitCode = 2;
  if (operation === 'status' && !result.ready) process.exitCode = 1;
  return result;
}
// The RAG authoring experiments (author-eval) are retired: see PROGRESS.md.
async function evaluation() { throw new Error('author-eval is retired: the RAG authoring experiments ended (see PROGRESS.md)'); }
async function main(root, command, argv) { try { return command === 'retrieve' ? await retrieve(root, argv) : await evaluation(root, argv); } catch (error) { console.error(command + ': ' + error.message); process.exitCode = 1; } }
module.exports = { main, retrieve, evaluation, render, reranked };
