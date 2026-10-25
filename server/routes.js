/*
 * The server's API (design §1.2). `handleApi` answers /api/* requests and returns false for anything else.
 *
 *   public   GET  /api/health            {server, contentHash, invite, admin}   lets the client detect the server
 *            GET  /api/content?lang=     the content sources
 *            POST /api/player            {invite?} → {code}             mint a player code (= sync code)
 *   player   GET  /api/player            {pid, createdAt}               is my code valid?
 *            GET  /api/saves, GET|PUT|DELETE /api/saves/:slot           my saves (PUT may carry ?device=)
 *            POST /api/log               {run, entries}                 my run history, feedback, errors
 *            GET|POST /api/seen                                         my cross-run "seen" counters
 *   admin    GET  /api/runs, /api/runs/:id, /api/report, /api/batches, /api/players, /api/export
 *            POST /api/players/:pid      {revoked}
 */
'use strict';
const fs = require('fs');
const path = require('path');
const RunLog = require('../tools/runlog.js');
const { httpError } = require('./store.js');
const { newCode, normalizeCode, pidOf } = require('./auth.js');

function createApi({ root, store, auth, bundle, P }) {
  const readBody = (req, limit = 4 * 1024 * 1024) => new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(httpError(413, 'body too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : null); } catch (e) { reject(httpError(400, 'invalid JSON')); } });
    req.on('error', reject);
  });
  // The calling player's id, or a 401.
  function player(req) {
    const code = auth.playerCode(req);
    if (!code) throw httpError(401, 'player code required');
    const pid = pidOf(code);
    const p = store.getPlayer(pid);
    if (!p || p.revoked) throw httpError(401, 'unknown or revoked player code');
    store.touchPlayer(pid);
    return pid;
  }
  function admin(req, url) { if (!auth.isAdmin(req, url)) throw httpError(401, 'admin token required'); }

  return async function handleApi(req, res, url, p, send) {
    if (!p.startsWith('/api/')) return false;
    const write = req.method !== 'GET' && req.method !== 'HEAD';
    if (write && !auth.allowWrite(req)) throw httpError(429, 'too many requests');
    let m;

    // ---- public
    if (p === '/api/health') return send(res, 200, { ok: true, server: 'lumenhold', contentHash: bundle().hash, invite: auth.inviteRequired, admin: auth.isAdmin(req, url) });
    if (p === '/api/content' && req.method === 'GET') {
      const lang = url.searchParams.get('lang');
      return send(res, 200, { contentHash: bundle().hash, sources: P.loadSources(), locale: lang && lang !== 'en' ? P.liveLocaleSources(lang) : [] });
    }
    if (p === '/api/player' && req.method === 'POST') {
      const body = await readBody(req, 4096) || {};
      const refused = auth.checkMint(req, body, store.playerCount());
      if (refused) throw httpError(refused[0], refused[1]);
      const code = newCode();
      store.createPlayer(pidOf(normalizeCode(code)));
      return send(res, 200, { code });
    }

    // ---- player
    if (p === '/api/player' && req.method === 'GET') { const pid = player(req); return send(res, 200, { pid, createdAt: store.getPlayer(pid).createdAt }); }
    if (p === '/api/saves' && req.method === 'GET') return send(res, 200, store.forPlayer(player(req)).listSaves());
    if ((m = p.match(/^\/api\/saves\/(\w+)$/))) {
      const saves = store.forPlayer(player(req));
      if (req.method === 'GET') return send(res, 200, saves.getSave(m[1], url.searchParams.get('meta') === '1'));   // null = empty slot
      if (req.method === 'PUT') { saves.putSave(m[1], await readBody(req), url.searchParams.get('device')); return send(res, 200, { ok: true }); }
      if (req.method === 'DELETE') { saves.deleteSave(m[1]); return send(res, 200, { ok: true }); }
    }
    if (p === '/api/log' && req.method === 'POST') {
      const pid = player(req);
      const body = await readBody(req);
      if (!body) throw httpError(400, 'empty body');
      return send(res, 200, { ok: true, received: store.appendRun(body.run, body.entries || [], pid) });
    }
    if (p === '/api/seen') {
      const saves = store.forPlayer(player(req));
      if (req.method === 'GET') return send(res, 200, saves.getSeen());
      if (req.method === 'POST') { const b = await readBody(req) || {}; saves.addSeen(b.runId, b.events); return send(res, 200, { ok: true }); }
    }

    // ---- admin
    admin(req, url);
    if (p === '/api/runs' && req.method === 'GET') return send(res, 200, store.listRuns().map(RunLog.summarize));
    if ((m = p.match(/^\/api\/runs\/([^/]+)$/)) && req.method === 'GET') { const r = store.readRun(m[1]); return r ? send(res, 200, r) : send(res, 404, { error: 'no such run' }); }
    if (p === '/api/report' && req.method === 'GET') {
      const runs = store.listRuns().filter((r) => url.searchParams.get('sim') === '1' || !r.sim);
      const { total, rows } = RunLog.aggregateFeedback(runs, { contentHash: bundle().hash });
      return send(res, 200, { runs: runs.length, feedback: total, contentHash: bundle().hash, events: rows });
    }
    // Every run in the format `grim feedback` reads.
    if (p === '/api/export' && req.method === 'GET') {
      return send(res, 200, { format: 'lumenhold-runs', v: 1, exportedAt: new Date().toISOString(), runs: store.listRuns() }, undefined, { 'Content-Disposition': 'attachment; filename="lumenhold-runs.json"' });
    }
    if (p === '/api/players' && req.method === 'GET') {
      const runs = store.listRuns();
      return send(res, 200, store.listPlayers().map((pl) => {
        const mine = runs.filter((r) => r.player === pl.pid);
        return Object.assign(pl, { runs: mine.length, feedback: mine.reduce((a, r) => a + (r.feedback || 0), 0), errors: mine.reduce((a, r) => a + r.hist.filter((h) => h.t === 'error').length, 0) });
      }).sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0)));
    }
    if ((m = p.match(/^\/api\/players\/([0-9a-f]+)$/)) && req.method === 'POST') { const b = await readBody(req) || {}; store.setRevoked(m[1], b.revoked); return send(res, 200, { ok: true }); }
    // Authoring batches (design §11.1): the reports `grim batch` writes to build/batches/.
    if (p === '/api/batches' && req.method === 'GET') {
      const dir = path.join(root, 'build', 'batches');
      const list = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.endsWith('.critic.json')) : [];
      const out = [];
      for (const f of list) { try { out.push(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))); } catch (e) { /* skip a torn file */ } }
      return send(res, 200, out.sort((a, b) => (b.at || 0) - (a.at || 0)));
    }
    throw httpError(404, 'no such API');
  };
}

module.exports = { createApi };
