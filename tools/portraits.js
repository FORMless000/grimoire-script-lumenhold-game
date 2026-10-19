#!/usr/bin/env node
/*
 * NPC portrait output validation (docs/portrait-integration-handoff.md).
 *
 *   node tools/portraits.js sync      legacy copy migration; validates without copying when outputs are already live
 *   node tools/portraits.js check     validate live PNGs, crop source hashes and Art.PORTRAITS (also run by the tests)
 *   node tools/portraits.js archive   write the procedural ("Original") SVG portrait of every NPC to art/characters/original-svg/
 *
 * Current generation and crop saves write directly to src/portraits/minimal/. No sync step is needed.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const ART = path.join(ROOT, 'art/characters/minimal');
const MANIFEST = path.join(ART, 'portrait-manifest.json');
const RUNTIME = path.join(ROOT, 'src/portraits/minimal');
const ARCHIVE = path.join(ROOT, 'art/characters/original-svg');

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
function pngSize(buf) {
  if (buf.length < 24 || buf.toString('latin1', 1, 4) !== 'PNG' || buf.toString('latin1', 12, 16) !== 'IHDR') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
function manifest() { return JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); }

// Problems with one manifest entry's output PNG and crop source.
function sourceProblems(m) {
  const live = 'src/portraits/minimal/' + m.id + '.png';
  if (m.file !== live && m.file !== 'portraits/' + m.id + '.png') return [m.id + ': unexpected output path'];
  if (!['concepts/' + m.id + '.png', 'colored/' + m.id + '.png'].includes(m.source)) return [m.id + ': unexpected crop source'];
  const f = path.join(m.file === live ? ROOT : ART, m.file);
  if (!fs.existsSync(f)) return [m.id + ': missing ' + path.relative(ROOT, f)];
  const buf = fs.readFileSync(f), out = [], dim = pngSize(buf);
  if (sha(buf) !== m.sha256) out.push(m.id + ': output hash differs from the manifest');
  if (!dim || dim.width !== 256 || dim.height !== 256 || m.width !== 256 || m.height !== 256) out.push(m.id + ': not a 256x256 PNG');
  const source = path.join(ART, m.source);
  if (!fs.existsSync(source) || sha(fs.readFileSync(source)) !== m.sourceSha256) out.push(m.id + ': crop source hash differs from the manifest');
  return out;
}

function check() {
  const Art = require('../src/art.js');
  const list = manifest(), problems = [];
  const ids = list.map((m) => m.id).sort(), known = Object.keys(Art.PORTRAITS).sort();
  if (ids.join() !== known.join()) problems.push('Art.PORTRAITS (' + known.join(' ') + ') differs from the manifest (' + ids.join(' ') + ')');
  for (const m of list) {
    problems.push(...sourceProblems(m));
    if (Art.PORTRAITS[m.id] !== m.id + '.png') problems.push(m.id + ': Art.PORTRAITS maps it to ' + Art.PORTRAITS[m.id]);
    const dest = path.join(RUNTIME, m.id + '.png');
    if (!fs.existsSync(dest)) problems.push(m.id + ': missing live portrait');
    else if (sha(fs.readFileSync(dest)) !== m.sha256) problems.push(m.id + ': live PNG differs from the manifest; reconcile the edit before regenerating');
  }
  const extra = fs.existsSync(RUNTIME) ? fs.readdirSync(RUNTIME).filter((f) => !list.some((m) => m.id + '.png' === f)) : [];
  if (extra.length) problems.push('unexpected files in src/portraits/minimal: ' + extra.join(' '));
  return problems;
}

function sync() {
  const list = manifest();
  if (list.every(m => m.file === 'src/portraits/minimal/' + m.id + '.png')) {
    const problems = check();
    if (problems.length) { console.error(problems.join('\n')); process.exitCode = 1; }
    else console.log('Live portraits validated; no copying needed. Generation and crop saves write directly to these files.');
    return;
  }
  const bad = list.flatMap(sourceProblems);
  if (bad.length) { console.error(bad.join('\n') + '\nNothing copied.'); process.exit(1); }
  fs.mkdirSync(RUNTIME, { recursive: true });
  let total = 0;
  for (const m of list) {
    const dest = path.join(RUNTIME, m.id + '.png');
    fs.copyFileSync(path.join(ART, m.file), dest);
    const buf = fs.readFileSync(dest);
    if (sha(buf) !== m.sha256) { console.error(m.id + ': copied bytes differ'); process.exit(1); }
    total += buf.length;
  }
  console.log('Copied ' + list.length + ' portraits (' + total + ' bytes) to ' + path.relative(ROOT, RUNTIME) + '/, hashes verified.');
}

function archive() {
  const Art = require('../src/art.js');
  const { project } = require('./project.js');
  const { content, errors } = project(ROOT).compileAll();
  if (errors.length) { console.error(errors.map((e) => e.message).join('\n')); process.exit(1); }
  fs.mkdirSync(ARCHIVE, { recursive: true });
  const npcs = Object.values(content.npcs);
  for (const n of npcs) {
    // Standalone file: the procedural layer alone, without the in-game hooks (class, data-npc, the layer group).
    const inner = Art.avatar(n, 256, { style: 'original' }).match(/<g class="av-orig">([\s\S]*)<\/g><\/svg>$/)[1];
    fs.writeFileSync(path.join(ARCHIVE, n.id + '.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="256" height="256">' + inner + '</svg>\n');
  }
  console.log('Wrote ' + npcs.length + ' procedural portraits to ' + path.relative(ROOT, ARCHIVE) + '/.');
}

if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === 'sync') sync();
  else if (cmd === 'archive') archive();
  else if (cmd === 'check') { const p = check(); if (p.length) { console.error(p.join('\n')); process.exit(1); } console.log('Portraits in sync.'); }
  else { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]); process.exit(cmd ? 1 : 0); }
}
module.exports = { check, pngSize };
