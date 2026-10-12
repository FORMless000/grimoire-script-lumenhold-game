// Tests for the server API and its file storage.  Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createServer } = require('../server/index.js');
const RunLog = require('../tools/runlog.js');

async function start(opts = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumenhold-srv-'));
  const { server } = createServer(Object.assign({ dataDir }, opts));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const call = async (method, p, body, headers = {}) => {
    const r = await fetch(base + p, { method, headers: Object.assign({ 'Content-Type': 'application/json' }, headers), body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
    const text = await r.text();
    let json = null; try { json = JSON.parse(text); } catch (e) { /* html or js */ }
    return { status: r.status, json, text };
  };
  return { base, call, dataDir, close: () => { server.close(); fs.rmSync(dataDir, { recursive: true, force: true }); } };
}

test('health, game page, live bundle, and no files outside the allowlist', async () => {
  const s = await start();
  try {
    assert.equal((await s.call('GET', '/api/health')).json.server, 'lumenhold');
    assert.match((await s.call('GET', '/')).text, /<div id="app">/);
    assert.match((await s.call('GET', '/build/content.bundle.js')).text, /^\/\/ GENERATED/);
    for (const p of ['/package.json', '/HANDOFF.md', '/src/../package.json', '/data/seen.json', '/server/index.js']) assert.equal((await s.call('GET', p)).status, 404, p);
  } finally { s.close(); }
});

test('run log: batches append, re-sent entries replace earlier copies', async () => {
  const s = await start();
  try {
    const run = { runId: 'r1', name: 'T', lang: 'en', contentHash: 'abc' };
    await s.call('POST', '/api/log', { run, entries: [{ t: 'start', at: 1 }, { t: 'month', turn: 1 }, { t: 'card', n: 1, turn: 1, id: 'quiet', at: 5 }] });
    await s.call('POST', '/api/log', { run, entries: [{ t: 'card', n: 1, turn: 1, id: 'quiet', at: 5, choice: 'left', chosenAt: 9, fb: { rating: 'down', comment: 'x' } }, { t: 'end', n: 2, turn: 1, id: 'ending_fine' }] });
    const r = (await s.call('GET', '/api/runs/r1')).json;
    assert.equal(r.hist.length, 4);
    assert.equal(r.hist[2].choice, 'left');
    assert.deepEqual(r.ended, { id: 'ending_fine', turn: 1 });
    const list = (await s.call('GET', '/api/runs')).json;
    assert.equal(list[0].medianDecideMs, 4);
    const rep = (await s.call('GET', '/api/report')).json;
    assert.equal(rep.feedback, 1);
    assert.equal((await s.call('POST', '/api/log', { run: { runId: '../x' }, entries: [] })).status, 400);
    assert.equal((await s.call('POST', '/api/log', 'nope')).status, 400);
    // A torn last line (crash mid-write) is skipped.
    fs.appendFileSync(path.join(s.dataDir, 'runs', 'r1.ndjson'), '{"t":"card","n":3');
    assert.equal((await s.call('GET', '/api/runs/r1')).json.hist.length, 4);
  } finally { s.close(); }
});

test('saves: slots, validation, empty slot is null', async () => {
  const s = await start();
  try {
    assert.equal((await s.call('GET', '/api/saves/2')).json, null);
    assert.equal((await s.call('PUT', '/api/saves/2', { version: 2, vals: { gold: 1 }, name: 'A', turn: 4, runId: 'r' })).status, 200);
    assert.equal((await s.call('GET', '/api/saves/2')).json.name, 'A');
    assert.equal((await s.call('PUT', '/api/saves/9', { version: 2, vals: {} })).status, 404);
    assert.equal((await s.call('PUT', '/api/saves/1', { hello: 1 })).status, 400);
    const list = (await s.call('GET', '/api/saves')).json;
    assert.deepEqual(list.map((x) => x.slot), ['auto', '1', '2', '3']);
    assert.equal(list[2].turn, 4);
    await s.call('DELETE', '/api/saves/2');
    assert.equal((await s.call('GET', '/api/saves/2')).json, null);
  } finally { s.close(); }
});

test('seen: each event counts once per run', async () => {
  const s = await start();
  try {
    await s.call('POST', '/api/seen', { runId: 'a', events: ['x', 'y', 'x'] });
    await s.call('POST', '/api/seen', { runId: 'a', events: ['x'] });
    await s.call('POST', '/api/seen', { runId: 'b', events: ['x'] });
    const seen = (await s.call('GET', '/api/seen')).json;
    assert.equal(seen.x.runs_seen, 2);
    assert.equal(seen.y.runs_seen, 1);
  } finally { s.close(); }
});

test('token: admin and writes need it when required', async () => {
  const s = await start({ token: 't0k', requireToken: true });
  try {
    assert.equal((await s.call('GET', '/admin')).status, 401);
    assert.equal((await s.call('GET', '/admin?token=t0k')).status, 200);
    assert.equal((await s.call('PUT', '/api/saves/1', { version: 2, vals: {} })).status, 401);
    assert.equal((await s.call('PUT', '/api/saves/1', { version: 2, vals: {} }, { 'X-Admin-Token': 't0k' })).status, 200);
    assert.equal((await s.call('GET', '/')).status, 200, 'the game itself stays public');
  } finally { s.close(); }
});

test('feedback aggregation counts inherited feedback of a forked run once', () => {
  const base = [{ t: 'start' }, { t: 'card', n: 1, id: 'e1', turn: 1, fb: { rating: 'down' } }];
  const a = { runId: 'a', hist: base };
  const b = { runId: 'b', hist: base.concat([{ t: 'fork', from: 'a', turn: 1 }, { t: 'card', n: 2, id: 'e2', turn: 2, fb: { rating: 'up' } }]) };
  assert.equal(RunLog.aggregateFeedback([a, b]).total, 2);
  assert.equal(RunLog.aggregateFeedback([b]).total, 2, 'origin missing: inherited feedback counts');
});
