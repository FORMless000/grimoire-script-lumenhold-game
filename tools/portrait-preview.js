#!/usr/bin/env node
// Local art review only. node tools/portrait-preview.js [--port 4174]
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ART = path.resolve(__dirname, '../art/characters/minimal');
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.md': 'text/plain; charset=utf-8' };
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const fail = (status, message) => Object.assign(new Error(message), { status });
const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

function pngSize(bytes) {
  if (bytes.length < 45 || !bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) || bytes.toString('ascii', 12, 16) !== 'IHDR' || bytes.toString('ascii', bytes.length - 8, bytes.length - 4) !== 'IEND') throw fail(400, 'A complete PNG is required.');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function createPortraitServer({ artDir = ART, rootDir = ROOT } = {}) {
  const manifestFile = path.join(artDir, 'portrait-manifest.json');
  const originals = readJSON(path.join(artDir, 'initial-portrait-manifest.json'));
  const baselineFile = path.join(artDir, 'concept-portrait-baseline.json');
  const conceptBaseline = fs.existsSync(baselineFile) ? readJSON(baselineFile) : [];
  // Paths come only from the checked-in roster, never from the HTTP payload.
  const allowed = new Map(originals.map((p) => [p.id, p]));
  for (const p of originals) {
    if (!/^[a-z]+$/.test(p.id) || p.file !== 'portraits/' + p.id + '.png' || !/^images\/batch-\d{2}\.png$/.test(p.source)) throw Error('Unexpected portrait path in initial manifest.');
  }
  const runtimeFile = id => 'src/portraits/minimal/' + id + '.png';
  const topLevel = new Set(['index.html', 'review.js', 'review.css', 'README.md', 'DESIGNS.md', 'designs.json', 'portrait-manifest.json', 'initial-portrait-manifest.json', 'concept-portrait-baseline.json', 'concept-manifest.json', 'concept-crop-layout.json', 'background-palette.json', 'background-manifest.json', 'source-hashes.json', 'prompts.json', 'generation-records.json', 'style-reference.png', 'concepts/index.html']);
  const staticFiles = new Set([...topLevel, ...originals.flatMap((p) => [p.file, p.source, runtimeFile(p.id), ...['concepts', 'colored', 'cutouts', 'masks'].map(folder => folder + '/' + p.id + '.png')])]);
  const version = (entry) => sha(JSON.stringify(entry));
  const validateSource = (entry) => {
    const original = allowed.get(entry.id);
    if (!original || entry.file !== runtimeFile(entry.id) || ![original.source, 'concepts/' + entry.id + '.png', 'colored/' + entry.id + '.png'].includes(entry.source)) throw fail(400, 'Unexpected portrait source.');
    return entry;
  };
  const entries = () => readJSON(manifestFile).map((entry) => ({ ...validateSource(entry), version: version(entry) }));
  // Reset coordinates must belong to the same source image as the current crop.
  const resetEntries = (portraits) => portraits.map((p) => {
    const baseline = [...conceptBaseline, ...originals].find((b) => b.id === p.id && b.source === p.source);
    if (!baseline) throw fail(409, 'No initial alignment exists for this portrait source.');
    return baseline;
  });
  const send = (res, status, body, type = 'application/json; charset=utf-8') => {
    res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
  };
  const readBody = async (req) => {
    if (req.headers['content-type'] !== 'application/json') throw fail(415, 'Send application/json.');
    return new Promise((resolve, reject) => {
      const chunks = []; let total = 0, tooLarge = false;
      req.on('data', (chunk) => {
        total += chunk.length;
        if (total > 1024 * 1024) {
          if (!tooLarge) { tooLarge = true; chunks.length = 0; reject(fail(413, 'Portrait payload is too large.')); }
          // Keep draining the request so the client can receive the 413 response.
        } else if (!tooLarge) chunks.push(chunk);
      });
      req.on('end', () => {
        if (tooLarge) return;
        try { resolve(JSON.parse(Buffer.concat(chunks))); } catch { reject(fail(400, 'Invalid JSON.')); }
      });
      req.on('error', reject);
    });
  };

  async function handle(req, res) {
    const host = req.headers.host || '';
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) throw fail(403, 'Use this preview through localhost.');
    if (req.headers.origin && req.headers.origin !== 'http://' + host) throw fail(403, 'Cross-origin access is not allowed.');
    const url = new URL(req.url, 'http://' + host);
    const route = decodeURIComponent(url.pathname);
    if (req.method === 'GET' && route === '/api/data') {
      const portraits = entries();
      return send(res, 200, { designs: readJSON(path.join(artDir, 'designs.json')), portraits, originals: resetEntries(portraits), batches: readJSON(path.join(artDir, 'generation-records.json')) });
    }
    const match = route.match(/^\/api\/portraits\/([a-z]+)$/);
    if (req.method === 'POST' && match) {
      const original = allowed.get(match[1]);
      if (!original) throw fail(404, 'Unknown character.');
      const body = await readBody(req);
      const all = readJSON(manifestFile), index = all.findIndex((p) => p.id === original.id), current = all[index];
      if (!current || body?.version !== version(current)) throw fail(409, 'This portrait changed elsewhere. Reload before saving.');
      validateSource(current);
      const sourceBytes = fs.readFileSync(path.join(artDir, current.source));
      if (sha(sourceBytes) !== current.sourceSha256) throw fail(409, 'The concept master changed. Review its crop first.');
      const dimensions = pngSize(sourceBytes), crop = body.crop;
      if (!crop || !['left', 'top', 'width', 'height'].every((k) => Number.isSafeInteger(crop[k])) || crop.left < 0 || crop.top < 0 || crop.width < 32 || crop.width !== crop.height || crop.left + crop.width > dimensions.width || crop.top + crop.height > dimensions.height) throw fail(400, 'Crop must be a square within the concept master.');
      if (typeof body.png !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(body.png)) throw fail(400, 'A PNG crop is required.');
      const png = Buffer.from(body.png.split(',')[1], 'base64'), size = pngSize(png);
      if (size.width !== 256 || size.height !== 256) throw fail(400, 'Portrait must be 256 by 256 pixels.');
      const portraitFile = path.join(rootDir, current.file), oldPNG = fs.readFileSync(portraitFile), oldManifest = fs.readFileSync(manifestFile);
      if (sha(oldPNG) !== current.sha256) throw fail(409, 'The PNG changed outside this editor. Reload and reconcile it first.');
      const backup = path.join(artDir, '.crop-backups', new Date().toISOString().replace(/[:.]/g, '-') + '-' + original.id + '-' + crypto.randomBytes(3).toString('hex'));
      fs.mkdirSync(backup, { recursive: true });
      fs.writeFileSync(path.join(backup, original.id + '.png'), oldPNG);
      fs.writeFileSync(path.join(backup, 'portrait-manifest.json'), oldManifest);
      const next = { ...current, crop: { left: crop.left, top: crop.top, width: crop.width, height: crop.height }, sha256: sha(png) };
      all[index] = next;
      // Small local files; synchronous writes serialize saves in this process.
      // Replace each file atomically and restore both if the second replacement fails.
      const pngTemp = portraitFile + '.tmp', manifestTemp = manifestFile + '.tmp';
      try {
        fs.writeFileSync(pngTemp, png); fs.writeFileSync(manifestTemp, JSON.stringify(all, null, 2) + '\n');
        fs.renameSync(pngTemp, portraitFile); fs.renameSync(manifestTemp, manifestFile);
      } catch (error) {
        fs.writeFileSync(portraitFile, oldPNG); fs.writeFileSync(manifestFile, oldManifest);
        throw error;
      } finally {
        fs.rmSync(pngTemp, { force: true }); fs.rmSync(manifestTemp, { force: true });
      }
      return send(res, 200, { portrait: { ...next, version: version(next) }, backup: path.relative(artDir, backup).split(path.sep).join('/') });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') throw fail(405, 'Method not allowed.');
    const file = route === '/' ? 'index.html' : route.slice(1);
    if (!staticFiles.has(file)) throw fail(404, 'Not found.');
    // Old review URLs remain aliases, but all current exports come from the live assets.
    const legacy = originals.find(p => p.file === file);
    const bytes = fs.readFileSync(legacy ? path.join(rootDir, runtimeFile(legacy.id)) : path.join(file.startsWith('src/') ? rootDir : artDir, file));
    send(res, 200, req.method === 'HEAD' ? '' : bytes, MIME[path.extname(file)] || 'application/octet-stream');
  }
  return http.createServer((req, res) => handle(req, res).catch((error) => send(res, error.status || 500, { error: error.status ? error.message : 'Unable to save or load portrait files.' })));
}

if (require.main === module) {
  const args = process.argv.slice(2), at = args.indexOf('--port');
  const port = at === -1 ? 4174 : Number(args[at + 1]);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('Invalid --port.');
  const server = createPortraitServer();
  server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log('Portrait review: http://127.0.0.1:' + server.address().port + '/'));
}
module.exports = { createPortraitServer };
