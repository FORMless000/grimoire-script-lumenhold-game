'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { createPortraitServer } = require('../tools/portrait-preview.js');
const ART = path.resolve(__dirname, '../art/characters/minimal');
const ROOT = path.resolve(__dirname, '..');
const hash = (b) => crypto.createHash('sha256').update(b).digest('hex');

async function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumenhold-portrait-test-'));
  const p = JSON.parse(fs.readFileSync(path.join(ART, 'portrait-manifest.json')))[0];
  // Use a known in-bounds crop even after the user tunes the repository candidates.
  p.crop = { left: 64, top: 64, width: 896, height: 896 };
  for (const file of [p.file, p.source]) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.copyFileSync(path.join(file.startsWith('src/') ? ROOT : ART, file), path.join(dir, file));
  }
  fs.writeFileSync(path.join(dir, 'portrait-manifest.json'), JSON.stringify([p]));
  for (const file of ['initial-portrait-manifest.json', 'concept-portrait-baseline.json']) {
    const baseline = JSON.parse(fs.readFileSync(path.join(ART, file))).filter((entry) => entry.id === p.id);
    fs.writeFileSync(path.join(dir, file), JSON.stringify(baseline));
  }
  fs.copyFileSync(path.join(ART, 'index.html'), path.join(dir, 'index.html'));
  fs.writeFileSync(path.join(dir, 'designs.json'), '{}'); fs.writeFileSync(path.join(dir, 'generation-records.json'), '[]');
  const server = createPortraitServer({ artDir: dir, rootDir: dir });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = 'http://127.0.0.1:' + server.address().port;
  t.after(async () => { await new Promise((r) => server.close(r)); fs.rmSync(dir, { recursive: true, force: true }); });
  const data = await (await fetch(url + '/api/data')).json(), entry = data.portraits[0];
  assert.equal(data.originals[0].source, entry.source, 'reset uses the individual concept source');
  assert.deepEqual(data.originals[0].crop, JSON.parse(fs.readFileSync(path.join(dir, 'concept-portrait-baseline.json')))[0].crop);
  const png = fs.readFileSync(path.join(ROOT, 'src/portraits/minimal/tobias.png'));
  const body = { version: entry.version, crop: { ...entry.crop, top: entry.crop.top + 1 }, png: 'data:image/png;base64,' + png.toString('base64') };
  const post = (payload, headers = {}) => fetch(url + '/api/portraits/' + p.id, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(payload) });
  return { dir, entry, body, png, post, url };
}

test('portrait save persists PNG and crop, backs up previous files, and rejects a stale edit', async (t) => {
  const s = await fixture(t), before = fs.readFileSync(path.join(s.dir, s.entry.file));
  const res = await s.post(s.body); assert.equal(res.status, 200);
  const result = await res.json(), disk = JSON.parse(fs.readFileSync(path.join(s.dir, 'portrait-manifest.json')))[0];
  assert.deepEqual(disk.crop, s.body.crop);
  assert.equal(disk.sha256, hash(s.png));
  assert.deepEqual(fs.readFileSync(path.join(s.dir, s.entry.file)), s.png);
  assert.deepEqual(fs.readFileSync(path.join(s.dir, result.backup, 'lyra.png')), before);
  assert.equal(JSON.parse(fs.readFileSync(path.join(s.dir, result.backup, 'portrait-manifest.json')))[0].sha256, s.entry.sha256);
  assert.notEqual(result.portrait.version, s.entry.version);
  assert.equal((await s.post(s.body)).status, 409);
  const reloaded = (await (await fetch(s.url + '/api/data')).json()).portraits[0];
  assert.deepEqual(reloaded.crop, s.body.crop); assert.equal(reloaded.version, result.portrait.version);
  assert.equal((await fetch(s.url + '/' + s.entry.source)).status, 200);
  assert.deepEqual(Buffer.from(await (await fetch(s.url + '/' + s.entry.file)).arrayBuffer()), s.png, 'serves the same live PNG it saved');
  assert.equal(fs.existsSync(path.join(s.dir, 'portraits/lyra.png')), false, 'does not write an obsolete art-folder copy');
});

test('invalid crops, invalid or oversized PNGs, foreign origins and arbitrary paths cannot modify portraits', async (t) => {
  const s = await fixture(t), before = fs.readFileSync(path.join(s.dir, s.entry.file));
  for (const crop of [{ ...s.body.crop, left: -1 }, { ...s.body.crop, top: 99999 }, { ...s.body.crop, width: 400, height: 399 }, { ...s.body.crop, width: 1, height: 1 }, { ...s.body.crop, left: .5 }]) assert.equal((await s.post({ ...s.body, crop })).status, 400);
  assert.equal((await s.post({ ...s.body, png: 'data:image/png;base64,bm90IHBuZw==' })).status, 400);
  const master = fs.readFileSync(path.join(s.dir, s.entry.source));
  assert.equal((await s.post({ ...s.body, png: 'data:image/png;base64,' + master.toString('base64') })).status, 400, '1024px concept is not a 256px portrait');
  assert.equal((await s.post({ ...s.body, png: 'data:image/png;base64,' + 'A'.repeat(1024 * 1024) })).status, 413, 'oversized payload rejected before decoding');
  assert.equal((await s.post(s.body, { Origin: 'https://example.com' })).status, 403);
  for (const file of ['/../package.json', '/tools/portrait-preview.js', '/.crop-backups/x', '/portraits/unknown.png', '/concepts/unknown.png']) assert.equal((await fetch(s.url + file)).status, 404);
  assert.equal((await fetch(s.url + '/api/portraits/unknown', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s.body) })).status, 404);
  assert.deepEqual(fs.readFileSync(path.join(s.dir, s.entry.file)), before);
  assert.equal(fs.existsSync(path.join(s.dir, '.crop-backups')), false);
});

test('externally changed portraits and source masters are detected before a save', async (t) => {
  const s = await fixture(t);
  const file = path.join(s.dir, s.entry.file), original = fs.readFileSync(file);
  fs.writeFileSync(file, s.png); assert.equal((await s.post(s.body)).status, 409);
  fs.writeFileSync(file, original);
  fs.appendFileSync(path.join(s.dir, s.entry.source), 'changed');
  assert.equal((await s.post(s.body)).status, 409);
  assert.deepEqual(fs.readFileSync(file), original);
});

test('a current manifest cannot redirect a character to another source path', async (t) => {
  const s = await fixture(t), file = path.join(s.dir, 'portrait-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(file));
  for (const source of ['concepts/tobias.png', '../package.json']) {
    manifest[0].source = source; fs.writeFileSync(file, JSON.stringify(manifest));
    assert.equal((await fetch(s.url + '/api/data')).status, 400);
  }
  assert.equal(fs.existsSync(path.join(s.dir, '.crop-backups')), false);
});
