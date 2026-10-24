#!/usr/bin/env node
/*
 * Lumenhold server (design §1): serves the game, stores players' saves and run logs, and hosts /admin.
 * Online hosting and deploys: docs/hosting.md.
 *
 *   npm start                        http://127.0.0.1:4173 (admin open, content compiled live on reload)
 *   HOST=0.0.0.0 ADMIN_TOKEN=… npm start   other machines may connect; /admin needs the token
 *   PUBLIC=1                         behind a reverse proxy on 127.0.0.1: still require ADMIN_TOKEN
 *   INVITE_CODE=…                    new players need ?invite=… (else anyone may get a player code)
 *   TRUST_PROXY=1                    client IPs (for rate limits) from X-Forwarded-For
 *   NODE_ENV=production              serve the committed build/content.bundle.js, compiled nothing at runtime
 *   PORT=0 …                         any free port (printed); DATA_DIR=… stores data elsewhere (default data/)
 *   node server/index.js --selftest  boot on a free port, check /api/health and the bundle, exit 0 or 1
 *
 * No dependencies: node:http + zlib + files. The game also still runs without the server (open index.html).
 */
'use strict';
const http = require('http');
const fs = require('fs');
const { pathToFileURL } = require('url');
const path = require('path');
const zlib = require('zlib');
const { project } = require('../tools/project.js');
const { createStore, httpError } = require('./store.js');
const { createAuth } = require('./auth.js');
const { createApi } = require('./routes.js');

const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.wasm': 'application/wasm', '.md': 'text/plain; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
// Only these paths are served as static files.
const STATIC = [/^\/index\.html$/, /^\/src\/[\w./-]+$/, /^\/build\/content\.bundle\.js$/, /^\/build\/combat\.bundle\.js$/, /^\/content\/world\/maps\/[\w.-]+\.svg$/, /^\/docs\/[\w.-]+\.(svg|png)$/, /^\/server\/admin\.html$/];
const LOOPBACK = /^(127\.\d+\.\d+\.\d+|::1|localhost)$/;
const COMPRESSIBLE = /^(text\/|application\/json|image\/svg)/;

// opts: root, dataDir, token, requireToken, invite, trustProxy, production
function createServer({ root = ROOT, dataDir = path.join(root, 'data'), token = null, requireToken = false, invite = null, trustProxy = false, production = false, limits = {} } = {}) {
  const P = project(root);
  const store = createStore(dataDir);
  const auth = createAuth(Object.assign({ token, requireToken, invite, trustProxy }, limits));

  // The content bundle. In production it is the committed file, read once; in development it is compiled
  // from content/ and locales/ whenever one of them changed, so edits show up on reload without `grim build`.
  let bundleCache = { key: null, text: null, hash: null, gz: null };
  function bundle() {
    if (production) {
      if (!bundleCache.text) bundleCache = { key: 'prod', text: fs.readFileSync(path.join(root, 'build', 'content.bundle.js'), 'utf8'), hash: P.contentHash(P.loadSources()), gz: null };
      return bundleCache;
    }
    const files = P.contentFiles().concat(P.listFiles(P.LOCALES, '.lang'));
    const key = files.map((f) => f + ':' + fs.statSync(f).mtimeMs).join('|');
    if (key !== bundleCache.key) {
      const sources = P.loadSources();
      bundleCache = { key, text: P.bundleText(sources).text, hash: P.contentHash(sources), gz: null };
    }
    return bundleCache;
  }

  // The combat test bench at /bench/ (the title screen's "Combat bench"): its site built in memory from combat/
  // (combat/tools/site.mjs) on the first visit; in development, again whenever one of its sources changed.
  let benchCache = { key: null, files: null };
  async function bench() {
    const site = await import(pathToFileURL(path.join(root, 'combat', 'tools', 'site.mjs')).href);
    const key = production ? 'prod' : site.siteSources().map((f) => f + ':' + fs.statSync(f).mtimeMs).join('|');
    if (key !== benchCache.key || !benchCache.files) benchCache = { key, files: await site.siteFiles() };
    return benchCache.files;
  }

  const HEADERS = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY' };
  // Text bodies are gzipped when the client accepts it; `gz` passes an already compressed body.
  function send(res, status, body, type = 'application/json; charset=utf-8', extra = {}, gz = null) {
    let data = type.startsWith('application/json') ? JSON.stringify(body) : body;
    const headers = Object.assign({ 'Content-Type': type }, HEADERS, extra);
    if (COMPRESSIBLE.test(type) && /\bgzip\b/.test(res.req.headers['accept-encoding'] || '') && (gz || Buffer.byteLength(data) > 1024)) {
      data = gz || zlib.gzipSync(data);
      headers['Content-Encoding'] = 'gzip'; headers.Vary = 'Accept-Encoding';
    }
    res.writeHead(status, headers);
    res.end(res.req.method === 'HEAD' ? undefined : data);
  }
  const handleApi = createApi({ root, store, auth, bundle, P });

  async function handle(req, res) {
    const url = new URL(req.url, 'http://local');
    const p = decodeURIComponent(url.pathname);
    if (await handleApi(req, res, url, p, send) !== false) return;

    // ---- Pages and static files
    if (req.method !== 'GET' && req.method !== 'HEAD') throw httpError(405, 'method not allowed');
    if (p === '/') return sendFile(res, path.join(root, 'index.html'));
    if (p === '/favicon.ico') { res.writeHead(204); return res.end(); }
    if (p === '/admin' || p === '/admin/' || p === '/server/admin.html') {
      if (!auth.isAdmin(req, url)) throw httpError(401, 'admin token required');
      return sendFile(res, path.join(__dirname, 'admin.html'));
    }
    if (p === '/bench') { res.writeHead(302, { Location: '/bench/' }); return res.end(); }
    if (p.startsWith('/bench/')) {
      const name = p.slice('/bench/'.length) || 'index.html', files = await bench();
      if (name === 'server.mjs' || !Object.prototype.hasOwnProperty.call(files, name)) throw httpError(404, 'not found');
      return send(res, 200, files[name], MIME[path.extname(name)] || 'application/octet-stream');
    }
    if (p === '/build/content.bundle.js') {
      const b = bundle();
      if (!b.gz) b.gz = zlib.gzipSync(b.text);
      return send(res, 200, b.text, MIME['.js'], {}, b.gz);
    }
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

// Settings from the environment (see the header).
function fromEnv(env = process.env) {
  const host = env.HOST || '127.0.0.1';
  return {
    host,
    port: env.PORT != null ? Number(env.PORT) : 4173,
    token: env.ADMIN_TOKEN || null,
    requireToken: !LOOPBACK.test(host) || env.PUBLIC === '1',
    invite: env.INVITE_CODE || null,
    trustProxy: env.TRUST_PROXY === '1',
    production: env.NODE_ENV === 'production',
    dataDir: path.resolve(env.DATA_DIR || path.join(ROOT, 'data')),
  };
}

// Boot on a free loopback port with a throwaway data dir, fetch health, the page and the bundle, then exit.
async function selftest() {
  const os = require('os');
  const cfg = fromEnv();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumenhold-selftest-'));
  const { server } = createServer(Object.assign({}, cfg, { dataDir, requireToken: true, token: 'selftest' }));
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const base = 'http://127.0.0.1:' + server.address().port;
    const health = await (await fetch(base + '/api/health')).json();
    if (health.server !== 'lumenhold' || !health.contentHash) throw new Error('health: ' + JSON.stringify(health));
    if (!/<div id="app">/.test(await (await fetch(base + '/')).text())) throw new Error('game page missing');
    if (!/^\/\/ GENERATED/.test(await (await fetch(base + '/build/content.bundle.js')).text())) throw new Error('content bundle missing');
    if ((await fetch(base + '/admin')).status !== 401) throw new Error('admin is not protected');
    console.log('selftest ok: content ' + health.contentHash);
    return 0;
  } catch (e) { console.error('selftest FAILED: ' + e.message); return 1; } finally { server.close(); fs.rmSync(dataDir, { recursive: true, force: true }); }
}

if (require.main === module) {
  if (process.argv.includes('--selftest')) selftest().then((code) => process.exit(code));
  else {
    const cfg = fromEnv();
    if (cfg.requireToken && !cfg.token) { console.error((cfg.host === '127.0.0.1' ? 'PUBLIC=1' : 'HOST=' + cfg.host) + ': the server is reachable from other machines; set ADMIN_TOKEN to protect /admin.'); process.exit(1); }
    const { server } = createServer(cfg);
    server.listen(cfg.port, cfg.host, () => {
      const a = server.address();
      console.log('Lumenhold on http://' + (a.family === 'IPv6' ? '[' + a.address + ']' : a.address) + ':' + a.port + '/   (admin: /admin' + (cfg.requireToken ? '?token=…' : '') +
        ', invite: ' + (cfg.invite ? 'required' : 'open') + (cfg.production ? ', production' : '') + ', data: ' + path.relative(process.cwd(), cfg.dataDir) + ')');
    });
    // systemd stops with SIGTERM: finish in-flight requests, then exit.
    const stop = () => { server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 5000).unref(); };
    process.on('SIGTERM', stop); process.on('SIGINT', stop);
  }
}

module.exports = { createServer, fromEnv };
