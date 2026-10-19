#!/usr/bin/env node
/*
 * Lumenhold server (design §1): serves the game, stores saves and run logs, and hosts /admin.
 *
 *   npm start                     http://127.0.0.1:4173
 *   HOST=0.0.0.0 ADMIN_TOKEN=… npm start   other machines may connect; /admin and writes need the token
 *   PORT=0 …                      any free port (printed); DATA_DIR=… stores data elsewhere (default data/)
 *
 * No dependencies: node:http + files. The game also still runs without the server (open index.html).
 * While served, build/content.bundle.js is compiled live from content/ and locales/, so edits show up
 * on reload without `grim build`.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { project } = require('../tools/project.js');
const RunLog = require('../tools/runlog.js');
const { createStore, httpError } = require('./store.js');

const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
// Only these paths are served as static files.
const STATIC = [/^\/index\.html$/, /^\/src\/[\w./-]+$/, /^\/build\/content\.bundle\.js$/, /^\/build\/combat\.bundle\.js$/, /^\/content\/world\/maps\/[\w.-]+\.svg$/, /^\/docs\/[\w.-]+\.(svg|png)$/, /^\/server\/admin\.html$/];
const LOOPBACK = /^(127\.\d+\.\d+\.\d+|::1|localhost)$/;

function createServer({ root = ROOT, dataDir = path.join(root, 'data'), token = null, requireToken = false } = {}) {
  const P = project(root);
  const store = createStore(dataDir);
  let bundleCache = { key: null, text: null, hash: null };
  // Recompile the bundle only when a content or locale file changed.
  function bundle() {
    const files = P.contentFiles().concat(P.listFiles(P.LOCALES, '.lang'));
    const key = files.map((f) => f + ':' + fs.statSync(f).mtimeMs).join('|');
    if (key !== bundleCache.key) {
      const sources = P.loadSources();
      bundleCache = { key, text: P.bundleText(sources).text, hash: P.contentHash(sources) };
    }
    return bundleCache;
  }

  const send = (res, status, body, type = 'application/json; charset=utf-8', extra = {}) => {
    res.writeHead(status, Object.assign({ 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, extra));
    res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
  };
  const readBody = (req, limit = 8 * 1024 * 1024) => new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(httpError(413, 'body too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : null); } catch (e) { reject(httpError(400, 'invalid JSON')); } });
    req.on('error', reject);
  });
  const authorized = (req, url) => !requireToken || (token && (req.headers['x-admin-token'] === token || url.searchParams.get('token') === token));

  async function handle(req, res) {
    const url = new URL(req.url, 'http://local');
    const p = decodeURIComponent(url.pathname);
    const write = req.method !== 'GET' && req.method !== 'HEAD';
    if ((write || p.startsWith('/admin') || p.startsWith('/api/runs') || p === '/api/report') && !authorized(req, url)) throw httpError(401, 'admin token required');

    // ---- API
    if (p === '/api/health') return send(res, 200, { ok: true, server: 'lumenhold', contentHash: bundle().hash });
    if (p === '/api/content' && req.method === 'GET') {
      const lang = url.searchParams.get('lang');
      return send(res, 200, { contentHash: bundle().hash, sources: P.loadSources(), locale: lang && lang !== 'en' ? P.loadLocaleSources(lang).filter((s) => !s.path.endsWith('/_obsolete.lang')) : [] });
    }
    if (p === '/api/saves' && req.method === 'GET') return send(res, 200, store.listSaves());
    let m;
    if ((m = p.match(/^\/api\/saves\/([\w]+)$/))) {
      if (req.method === 'GET') return send(res, 200, store.getSave(m[1]) || null);   // null = empty slot
      if (req.method === 'PUT') { store.putSave(m[1], await readBody(req)); return send(res, 200, { ok: true }); }
      if (req.method === 'DELETE') { store.deleteSave(m[1]); return send(res, 200, { ok: true }); }
    }
    if (p === '/api/log' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body) throw httpError(400, 'empty body');
      return send(res, 200, { ok: true, received: store.appendRun(body.run, body.entries || []) });
    }
    if (p === '/api/seen') {
      if (req.method === 'GET') return send(res, 200, store.getSeen());
      if (req.method === 'POST') { const b = await readBody(req) || {}; store.addSeen(b.runId, b.events); return send(res, 200, { ok: true }); }
    }
    if (p === '/api/runs' && req.method === 'GET') return send(res, 200, store.listRuns().map(RunLog.summarize));
    if ((m = p.match(/^\/api\/runs\/([^/]+)$/)) && req.method === 'GET') { const r = store.readRun(m[1]); return r ? send(res, 200, r) : send(res, 404, { error: 'no such run' }); }
    if (p === '/api/report' && req.method === 'GET') {
      const runs = store.listRuns().filter((r) => url.searchParams.get('sim') === '1' || !r.sim);
      const { total, rows } = RunLog.aggregateFeedback(runs, { contentHash: bundle().hash });
      return send(res, 200, { runs: runs.length, feedback: total, contentHash: bundle().hash, events: rows });
    }
    // Authoring batches (design §11.1): the reports `grim batch` writes to build/batches/.
    if (p === '/api/batches' && req.method === 'GET') {
      const dir = path.join(root, 'build', 'batches');
      const list = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.endsWith('.critic.json')) : [];
      const out = [];
      for (const f of list) { try { out.push(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))); } catch (e) { /* skip a torn file */ } }
      return send(res, 200, out.sort((a, b) => (b.at || 0) - (a.at || 0)));
    }
    if (p.startsWith('/api/')) throw httpError(404, 'no such API');

    // ---- Pages and static files
    if (req.method !== 'GET' && req.method !== 'HEAD') throw httpError(405, 'method not allowed');
    if (p === '/') return sendFile(res, path.join(root, 'index.html'));
    if (p === '/favicon.ico') { res.writeHead(204); return res.end(); }
    if (p === '/admin' || p === '/admin/') return sendFile(res, path.join(__dirname, 'admin.html'));
    if (p === '/build/content.bundle.js') return send(res, 200, bundle().text, MIME['.js']);
    if (!STATIC.some((re) => re.test(p))) throw httpError(404, 'not found');
    const file = path.join(root, p);
    if (!file.startsWith(root + path.sep)) throw httpError(404, 'not found');
    return sendFile(res, file);
  }
  function sendFile(res, file) {
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw httpError(404, 'not found');
    send(res, 200, fs.readFileSync(file), MIME[path.extname(file)] || 'application/octet-stream');
  }

  const server = http.createServer((req, res) => {
    handle(req, res).catch((e) => {
      const status = e.status || 500;
      if (status === 500) console.error(e);
      if (!res.headersSent) send(res, status, { error: e.message });
      else res.end();
    });
  });
  return { server, store };
}

if (require.main === module) {
  const host = process.env.HOST || '127.0.0.1';
  const port = process.env.PORT != null ? Number(process.env.PORT) : 4173;
  const token = process.env.ADMIN_TOKEN || null;
  const requireToken = !LOOPBACK.test(host);
  if (requireToken && !token) { console.error('HOST=' + host + ' is reachable from other machines: set ADMIN_TOKEN to protect /admin and the write APIs.'); process.exit(1); }
  const dataDir = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
  const { server } = createServer({ dataDir, token, requireToken });
  server.listen(port, host, () => {
    const a = server.address();
    console.log('Lumenhold on http://' + (a.family === 'IPv6' ? '[' + a.address + ']' : a.address) + ':' + a.port + '/   (admin: /admin' + (requireToken ? '?token=…' : '') + ', data: ' + path.relative(process.cwd(), dataDir) + ')');
  });
}

module.exports = { createServer };
