'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const hash = (x) => crypto.createHash('sha256').update(typeof x === 'string' || Buffer.isBuffer(x) ? x : JSON.stringify(x)).digest('hex');
const readJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
function writeJSON(f, value, exclusive = false) {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  if (exclusive && fs.existsSync(f)) throw new Error('Refusing to overwrite ' + f);
  const tmp = f + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(tmp, f);
}
function appendJSON(f, value) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.appendFileSync(f, JSON.stringify(value) + '\n', { mode: 0o600 }); }
function inside(root, relative) {
  const target = path.resolve(root, relative);
  if (target !== path.resolve(root) && !target.startsWith(path.resolve(root) + path.sep)) throw new Error('Path leaves workspace: ' + relative);
  return target;
}
function args(argv) {
  const opts = {}, positional = [];
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) { positional.push(argv[i]); continue; }
    const key = argv[i].slice(2);
    if (key.startsWith('no-')) opts[key.slice(3)] = false;
    else opts[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return { opts, positional };
}
function positive(value, fallback) {
  const n = value == null ? fallback : Number(value);
  if (!Number.isInteger(n) || n < 1) throw new Error('Expected a positive integer, got ' + value);
  return n;
}
function rng(seed) { let n = parseInt(hash(String(seed)).slice(0, 8), 16); return () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(values, random) { const out = values.slice(); for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; }
module.exports = { hash, readJSON, writeJSON, appendJSON, inside, args, positive, rng, shuffle };
