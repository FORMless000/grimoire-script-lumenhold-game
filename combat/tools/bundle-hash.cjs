// What build/combat.bundle.js is made from, and whether it is current. Shared by combat/tools/bundle.mjs (which writes the
// bundle) and `node tools/grim.js build --check` / the main game's tests (which only read it; CommonJS, so the game's
// synchronous tools can call it).
//   sourcesHash: the bundled JS, the Rust that becomes core.wasm (with the rules data it embeds from setup/roster.mjs), and
//   the bundler; core.wasm itself is a build output (gitignored), so a stale wasm shows as a sources change.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const COMBAT = path.join(__dirname, '..');
const ROOT = path.join(COMBAT, '..');
const BUNDLE = path.join(ROOT, 'build', 'combat.bundle.js');
// The modules in the bundle, in load order (no two share a top-level name; checked when bundling).
const MODULES = ['setup/cast-stats.mjs', 'setup/loadouts.mjs', 'setup/roster.mjs', 'setup/foes.mjs', 'setup/setup.mjs', 'setup/flavor.mjs', 'setup/campaign.mjs', 'web/core.mjs', 'web/brief.mjs'];

function walk(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).sort().flatMap((f) => {
    const p = path.join(dir, f);
    return fs.statSync(p).isDirectory() ? walk(p, ext) : ext.some((e) => f.endsWith(e)) ? [p] : [];
  });
}
function sourceFiles() {
  const rust = ['rust/core/src', 'rust/wasm/src'].flatMap((d) => walk(path.join(COMBAT, d), ['.rs']));
  const manifests = ['rust/Cargo.toml', 'rust/core/Cargo.toml', 'rust/wasm/Cargo.toml', 'tools/export-data.mjs', 'tools/bundle.mjs', 'tools/bundle-hash.cjs', 'web/icon-source.mjs'].map((f) => path.join(COMBAT, f));
  return MODULES.map((f) => path.join(COMBAT, f)).concat(rust, manifests).filter((f) => fs.existsSync(f));
}
function sourcesHash() {
  const h = crypto.createHash('sha256');
  for (const f of sourceFiles()) { h.update(path.relative(COMBAT, f).replace(/\\/g, '/')); h.update('\0'); h.update(fs.readFileSync(f)); h.update('\0'); }
  // The action icons the bundle inlines.
  for (const f of walk(path.join(ROOT, 'docs', 'action-icons'), ['.svg'])) { h.update(path.basename(f)); h.update(fs.readFileSync(f)); }
  return h.digest('hex');
}
// The header line the bundler writes: {rules, sources, wasm}.
function bundleHeader(file = BUNDLE) {
  if (!fs.existsSync(file)) return null;
  const head = fs.readFileSync(file, 'utf8').slice(0, 600).match(/^\/\/ combat-bundle (\{.*\})$/m);
  return head ? JSON.parse(head[1]) : null;
}
// null when current, else why not.
function staleReason() {
  const h = bundleHeader();
  if (!h) return 'build/combat.bundle.js is missing: run node combat/tools/bundle.mjs';
  if (h.sources !== sourcesHash()) return 'build/combat.bundle.js is stale (combat/ sources changed): rebuild core.wasm (node combat/tools/build.mjs) and run node combat/tools/bundle.mjs';
  return null;
}
module.exports = { COMBAT, ROOT, BUNDLE, MODULES, sourceFiles, sourcesHash, bundleHeader, staleReason };
