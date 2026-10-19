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
    return { status: r.status, json, text, headers: r.headers };
  };
  // A new player: {code, call} where call sends the player's code.
  const player = async (invite) => {
    const r = await call('POST', '/api/player', invite ? { invite } : {});
    assert.equal(r.status, 200, 'mint: ' + r.text);
    const code = r.json.code;
    return { code, call: (method, p, body, headers = {}) => call(method, p, body, Object.assign({ 'X-Player': code }, headers)) };
  };
  return { base, call, player, dataDir, close: () => { server.close(); fs.rmSync(dataDir, { recursive: true, force: true }); } };
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
    const me = await s.player();
    const run = { runId: 'r1', name: 'T', lang: 'en', contentHash: 'abc' };
    await me.call('POST', '/api/log', { run, entries: [{ t: 'start', at: 1 }, { t: 'month', turn: 1 }, { t: 'card', n: 1, turn: 1, id: 'quiet', at: 5 }] });
    await me.call('POST', '/api/log', { run, entries: [{ t: 'card', n: 1, turn: 1, id: 'quiet', at: 5, choice: 'left', chosenAt: 9, fb: { rating: 'down', comment: 'x' } }, { t: 'end', n: 2, turn: 1, id: 'ending_fine' }] });
    const r = (await s.call('GET', '/api/runs/r1')).json;
    assert.equal(r.hist.length, 4);
    assert.equal(r.hist[2].choice, 'left');
    assert.deepEqual(r.ended, { id: 'ending_fine', turn: 1 });
    const list = (await s.call('GET', '/api/runs')).json;
    assert.equal(list[0].medianDecideMs, 4);
    const rep = (await s.call('GET', '/api/report')).json;
    assert.equal(rep.feedback, 1);
    assert.equal((await me.call('POST', '/api/log', { run: { runId: '../x' }, entries: [] })).status, 400);
    assert.equal((await me.call('POST', '/api/log', 'nope')).status, 400);
    assert.equal((await s.call('POST', '/api/log', { run, entries: [] })).status, 401, 'logs need a player code');
    // A torn last line (crash mid-write) is skipped.
    fs.appendFileSync(path.join(s.dataDir, 'runs', 'r1.ndjson'), '{"t":"card","n":3');
    assert.equal((await s.call('GET', '/api/runs/r1')).json.hist.length, 4);
  } finally { s.close(); }
});

test('saves: slots, validation, empty slot is null', async () => {
  const s = await start();
  try {
    const me = await s.player();
    assert.equal((await me.call('GET', '/api/saves/2')).json, null);
    assert.equal((await me.call('PUT', '/api/saves/2', { version: 2, vals: { gold: 1 }, name: 'A', turn: 4, runId: 'r' })).status, 200);
    assert.equal((await me.call('GET', '/api/saves/2')).json.name, 'A');
    assert.equal((await me.call('PUT', '/api/saves/9', { version: 2, vals: {} })).status, 404);
    assert.equal((await me.call('PUT', '/api/saves/1', { hello: 1 })).status, 400);
    const list = (await me.call('GET', '/api/saves')).json;
    assert.deepEqual(list.map((x) => x.slot), ['auto', '1', '2', '3']);
    assert.equal(list[2].turn, 4);
    await me.call('DELETE', '/api/saves/2');
    assert.equal((await me.call('GET', '/api/saves/2')).json, null);
  } finally { s.close(); }
});

test('seen: each event counts once per run', async () => {
  const s = await start();
  try {
    const me = await s.player();
    await me.call('POST', '/api/seen', { runId: 'a', events: ['x', 'y', 'x'] });
    await me.call('POST', '/api/seen', { runId: 'a', events: ['x'] });
    await me.call('POST', '/api/seen', { runId: 'b', events: ['x'] });
    const seen = (await me.call('GET', '/api/seen')).json;
    assert.equal(seen.x.runs_seen, 2);
    assert.equal(seen.y.runs_seen, 1);
  } finally { s.close(); }
});

test('token: admin pages and reports need it when required; players need their own code', async () => {
  const s = await start({ token: 't0k', requireToken: true });
  try {
    assert.equal((await s.call('GET', '/admin')).status, 401);
    assert.equal((await s.call('GET', '/server/admin.html')).status, 401);
    assert.equal((await s.call('GET', '/admin?token=t0k')).status, 200);
    assert.equal((await s.call('GET', '/api/runs')).status, 401);
    assert.equal((await s.call('GET', '/api/runs', undefined, { 'X-Admin-Token': 't0k' })).status, 200);
    assert.equal((await s.call('PUT', '/api/saves/1', { version: 2, vals: {} })).status, 401, 'saves need a player code');
    const me = await s.player();
    assert.equal((await me.call('PUT', '/api/saves/1', { version: 2, vals: {} })).status, 200);
    assert.equal((await me.call('GET', '/api/runs')).status, 401, 'a player is not an admin');
    assert.equal((await s.call('GET', '/')).status, 200, 'the game itself stays public');
  } finally { s.close(); }
});

test('players: invite, mint limit, isolation, revocation', async () => {
  const s = await start({ token: 't0k', requireToken: true, invite: 'letmein', limits: { mintsPerHour: 3 } });
  const admin = { 'X-Admin-Token': 't0k' };
  try {
    assert.equal((await s.call('GET', '/api/health')).json.invite, true);
    assert.equal((await s.call('POST', '/api/player', {})).status, 403, 'no invite');
    assert.equal((await s.call('POST', '/api/player', { invite: 'wrong' })).status, 403);
    const a = await s.player('letmein'), b = await s.player('letmein');
    assert.match(a.code, /^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    // Codes are forgiving when typed: lower case, no dashes.
    assert.equal((await s.call('GET', '/api/player', undefined, { 'X-Player': a.code.toLowerCase().replace(/-/g, '') })).status, 200);
    assert.equal((await s.call('GET', '/api/player', undefined, { 'X-Player': 'AAAA-AAAA-AAAA-AAAA' })).status, 401, 'unknown code');
    // Each player has their own saves and seen counters.
    await a.call('PUT', '/api/saves/auto?device=dev1', { version: 2, vals: {}, name: 'A', turn: 1, runId: 'ra' });
    assert.equal((await b.call('GET', '/api/saves/auto')).json, null);
    assert.equal((await a.call('GET', '/api/saves/auto')).json.name, 'A');
    assert.equal((await a.call('GET', '/api/saves/auto?meta=1')).json.device, 'dev1');
    // A run belongs to the player who started it.
    assert.equal((await a.call('POST', '/api/log', { run: { runId: 'ra' }, entries: [{ t: 'start', at: 1 }] })).status, 200);
    assert.equal((await b.call('POST', '/api/log', { run: { runId: 'ra' }, entries: [{ t: 'start', at: 2 }] })).status, 403);
    assert.equal((await a.call('POST', '/api/log', { run: { runId: 'ra', player: 'f'.repeat(24) }, entries: [] })).status, 200);
    const run = (await s.call('GET', '/api/runs/ra', undefined, admin)).json;
    const players = (await s.call('GET', '/api/players', undefined, admin)).json;
    assert.equal(players.length, 2);
    const pa = players.find((x) => x.runs === 1);
    assert.equal(run.player, pa.pid, 'the server sets the player, not the client');
    // Revoked codes are refused; restoring lets them back in.
    assert.equal((await s.call('POST', '/api/players/' + pa.pid, { revoked: true }, admin)).status, 200);
    assert.equal((await a.call('GET', '/api/saves')).status, 401);
    await s.call('POST', '/api/players/' + pa.pid, { revoked: false }, admin);
    assert.equal((await a.call('GET', '/api/saves')).status, 200);
    // Mint limit per address.
    assert.equal((await s.call('POST', '/api/player', { invite: 'letmein' })).status, 200);
    assert.equal((await s.call('POST', '/api/player', { invite: 'letmein' })).status, 429);
  } finally { s.close(); }
});

test('export, gzip and production bundle', async () => {
  const s = await start({ production: true });
  try {
    const me = await s.player();
    await me.call('POST', '/api/log', { run: { runId: 'r9' }, entries: [{ t: 'card', n: 1, turn: 1, id: 'e', fb: { rating: 'up' } }, { t: 'error', msg: 'boom', at: 3 }] });
    const ex = (await s.call('GET', '/api/export')).json;
    assert.equal(ex.format, 'lumenhold-runs');
    assert.equal(ex.runs[0].hist.length, 2);
    const raw = await fetch(s.base + '/build/content.bundle.js', { headers: { 'Accept-Encoding': 'gzip' } });
    assert.equal(raw.headers.get('content-encoding'), 'gzip');
    assert.match(await raw.text(), /^\/\/ GENERATED/);
    assert.equal((await s.call('GET', '/')).headers.get('referrer-policy'), 'no-referrer');
  } finally { s.close(); }
});

test('feedback aggregation counts inherited feedback of a forked run once', () => {
  const base = [{ t: 'start' }, { t: 'card', n: 1, id: 'e1', turn: 1, fb: { rating: 'down' } }];
  const a = { runId: 'a', hist: base };
  const b = { runId: 'b', hist: base.concat([{ t: 'fork', from: 'a', turn: 1 }, { t: 'card', n: 2, id: 'e2', turn: 2, fb: { rating: 'up' } }]) };
  assert.equal(RunLog.aggregateFeedback([a, b]).total, 2);
  assert.equal(RunLog.aggregateFeedback([b]).total, 2, 'origin missing: inherited feedback counts');
});

test('batches: lists the reports grim batch wrote, newest first, without critic files', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lumenhold-root-'));
  const dir = path.join(root, 'build', 'batches');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'a.json'), JSON.stringify({ name: 'a', at: 1, files: [], events: [], validators: {}, spotCheck: [] }));
  fs.writeFileSync(path.join(dir, 'b.json'), JSON.stringify({ name: 'b', at: 2, files: [], events: [], validators: {}, spotCheck: [] }));
  fs.writeFileSync(path.join(dir, 'b.critic.json'), JSON.stringify({ accept: true, issues: [] }));
  const s = await start({ root });
  try {
    const r = await s.call('GET', '/api/batches');
    assert.deepEqual(r.json.map((b) => b.name), ['b', 'a']);
  } finally { s.close(); fs.rmSync(root, { recursive: true, force: true }); }
});
