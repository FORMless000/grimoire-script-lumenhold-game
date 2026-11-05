'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '../..'), CRUX = path.join(ROOT, 'crux'), BUNDLE = path.join(ROOT, 'build/crux.bundle.js');
const MODULES = ['cards.js', 'voices.js', 'spells.js', 'encounters.js', 'setup.js', 'crux-wasm.js', 'core.js', 'messages.js', 'text.js', 'ui.js'];
function sourcesHash() {
  const h = crypto.createHash('sha256');
  for (const file of MODULES.concat(['tools/bundle.js', 'tools/messages.js', 'rust/Cargo.toml', 'rust/Cargo.lock', 'rust/core/Cargo.toml', 'rust/wasm/Cargo.toml'])) h.update(file).update(fs.readFileSync(path.join(CRUX, file)));
  const walk = (dir) => { for (const name of fs.readdirSync(dir).sort()) { const file = path.join(dir, name); if (fs.statSync(file).isDirectory()) walk(file); else h.update(path.relative(CRUX, file)).update(fs.readFileSync(file)); } };
  for (const dir of ['rust/core/src', 'rust/core/data', 'rust/wasm/src']) walk(path.join(CRUX, dir));
  return h.digest('hex').slice(0, 16);
}
function staleReason() {
  const have = fs.existsSync(BUNDLE) && (fs.readFileSync(BUNDLE, 'utf8').match(/Crux sources ([a-f0-9]+)/) || [])[1];
  return have === sourcesHash() ? null : 'build/crux.bundle.js is stale — run node crux/tools/bundle.js';
}
module.exports = { ROOT, CRUX, BUNDLE, MODULES, sourcesHash, staleReason };
