'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { reranked } = require('../src/cli.js');

// A fake service whose rerank stage fails with the given HTTP status (or a substitution error) for some models.
function harness(failures) {
  const opened = [];
  const open = (cfg) => { const service = { model: cfg.models.reranker, service: { calls: [] } }; opened.push(service.model); return service; };
  const run = async (service) => {
    const f = failures[service.model]?.shift();
    if (f === undefined) return { hits: [service.model] };
    service.service.calls.push({ stage: 'rerank', status: 'failed', model: service.model, httpStatus: f || null, error: f ? 'OpenRouterHTTPError' : 'RuntimeError' });
    throw new Error('LightRAG bridge failed');
  };
  return { opened, open, run };
}
const cfg = { models: { reranker: 'a', rerankerFallbacks: ['b', 'c'] } };
const quiet = { log: () => {}, wait: 0 };

test('a working reranker answers without retries', async () => {
  const h = harness({});
  const { result } = await reranked(cfg, h.open, h.run, quiet);
  assert.deepEqual(result.hits, ['a']); assert.equal(result.reranker, undefined); assert.deepEqual(h.opened, ['a']);
});
test('a busy reranker is retried once, then the next fallback is used and recorded', async () => {
  const h = harness({ a: [503, 429] });
  const { result } = await reranked(cfg, h.open, h.run, quiet);
  assert.deepEqual(h.opened, ['a', 'a', 'b']);
  assert.equal(result.reranker.model, 'b'); assert.deepEqual(result.reranker.attempts.map((x) => x.httpStatus), [503, 429]);
});
test('a non-transient failure (model substitution) switches at once', async () => {
  const h = harness({ a: [null] });
  await reranked(cfg, h.open, h.run, quiet);
  assert.deepEqual(h.opened, ['a', 'b']);
});
test('failures outside the rerank stage are not swallowed', async () => {
  const open = () => ({ service: { calls: [] } });
  await assert.rejects(reranked(cfg, open, async () => { throw new Error('index unbuilt'); }, quiet), /index unbuilt/);
});
test('when every reranker fails the error names them all', async () => {
  const h = harness({ a: [400], b: [400], c: [400] });
  await assert.rejects(reranked(cfg, h.open, h.run, quiet), /every reranker failed: a 400, b 400, c 400/);
});
