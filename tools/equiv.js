/*
 * Compile-level equivalence: `node tools/grim.js equiv [--against REF] [--json]`.
 *
 * Compiles the content at a git ref (default HEAD) with that ref's own src/grimoire.js, and the working tree with the
 * working compiler, then compares every block's compiled meaning. A refactor of the format or of the content (pools,
 * conds, threads, templates, presets) must come out empty. Normalised away:
 *   - positions and provenance (file, line, from, own_when, preset markers) and the framework's own metadata (pool,
 *     thread, role); expression source text (the AST is compared instead);
 *   - the order of an AND chain (conditions are pure and an error makes a test false, so reordering can't change a
 *     result), except where it calls rand();
 *   - `else:` holding a single `if` (the same as `elif`);
 *   - `queue any tagged T` / `queue any in P`: compared as the set of cards each can draw;
 *   - a card's chain/thread unless it names an arc (only an arc's cards play differently: they are plot cards).
 * Collections the old side doesn't have (pools, conds, threads, appointments) are reported, not compared.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const G = require('../src/grimoire.js');

const DROP = new Set(['file', 'line', 'fn', 'preset', 'src']);
// The framework's own metadata on a compiled event (where its properties came from; its pools, thread and role).
const EVENT_META = new Set(['from', 'pool', 'pools', 'thread', 'role', 'own_when']);

function gitShow(root, ref, p) { return execFileSync('git', ['show', ref + ':' + p], { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20 }); }

function sourcesAt(root, ref) {
  const files = execFileSync('git', ['ls-tree', '-r', '--name-only', ref, 'content'], { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20 })
    .split('\n').filter((f) => f.endsWith('.grim'));
  files.sort((a, b) => {
    const ca = a.includes('/core/') ? 0 : 1, cb = b.includes('/core/') ? 0 : 1;
    return ca - cb || path.join(root, a).localeCompare(path.join(root, b));
  });
  return files.map((f) => ({ path: f, text: gitShow(root, ref, f) }));
}

function compilerAt(root, ref) {
  const dir = path.join(root, 'build', 'equiv');
  fs.mkdirSync(dir, { recursive: true });
  const sha = execFileSync('git', ['rev-parse', ref], { cwd: root, encoding: 'utf8' }).trim();
  const file = path.join(dir, 'grimoire-' + sha.slice(0, 12) + '.js');
  if (!fs.existsSync(file)) fs.writeFileSync(file, gitShow(root, sha, 'src/grimoire.js'));
  return require(file);
}

const hasRand = (n) => { let r = false; (function w(x) { if (!x || typeof x !== 'object') return; if (x.t === 'call' && x.n === 'rand') r = true; for (const k of ['a', 'b']) w(x[k]); (x.args || []).forEach(w); })(n); return r; };
function normAst(n) {
  if (!n || typeof n !== 'object') return n;
  if (n.t === 'bin' && n.op === '&&' && !hasRand(n)) {
    const parts = [];
    (function flat(x) { if (x.t === 'bin' && x.op === '&&') { flat(x.a); flat(x.b); } else parts.push(normAst(x)); })(n);
    return { and: parts.map((p) => JSON.stringify(p)).sort() };
  }
  const o = { t: n.t };
  for (const k of Object.keys(n)) if (k !== 't') o[k] = k === 'a' || k === 'b' ? normAst(n[k]) : k === 'args' ? n.args.map(normAst) : n[k];
  return o;
}

// The cards `queue any tagged T` / `queue any in P` can draw, by the content's own definition of each.
function candidates(content, st) {
  return st.tagged || st.pool ? G.deckOf(content, st).map((e) => e.id).sort() : null;
}

function norm(v, content) {
  if (Array.isArray(v)) return v.map((x) => norm(x, content));
  if (!v || typeof v !== 'object') return v;
  if (v.ast && 'src' in v) return { expr: normAst(v.ast) };
  let o = v;
  if (o.t === 'if') {
    o = Object.assign({}, o, { branches: o.branches.slice() });
    while (o.else && o.else.length === 1 && o.else[0].t === 'if') { const inner = o.else[0]; o.branches = o.branches.concat(inner.branches); o.else = inner.else; }
  }
  if (o.t === 'queue' && (o.tagged || o.pool)) { o = Object.assign({}, o, { cand: candidates(content, o) }); delete o.tagged; delete o.pool; }
  // A card's chain/thread changes play only by making it a plot card (one of an arc's); otherwise it is bookkeeping.
  if (o.block === 'event' && o.chain && !(content.arcs || {})[o.chain]) { o = Object.assign({}, o); delete o.chain; }
  const out = {};
  for (const k of Object.keys(o).sort()) {
    if (DROP.has(k) || o[k] === undefined || (o.block === 'event' && EVENT_META.has(k))) continue;
    out[k] = norm(o[k], content);
  }
  return out;
}

function firstDiff(a, b, at) {
  if (JSON.stringify(a) === JSON.stringify(b)) return null;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const d = firstDiff(a[k], b[k], at + (Array.isArray(a) ? '[' + k + ']' : '.' + k)); if (d) return d; }
  }
  return { at, before: JSON.stringify(a), after: JSON.stringify(b) };
}

// Block-by-block comparison of two compiled contents (the same normalisation as equiv): [{block, at, before, after}].
function compare(A, B, cols) {
  const diffs = [];
  for (const col of ['game', 'balance']) { const d = firstDiff(norm(A[col], A), norm(B[col], B), col); if (d) diffs.push(Object.assign({ block: col }, d)); }
  for (const col of cols) {
    const X = A[col] || {}, Y = B[col] || {};
    for (const id of new Set([...Object.keys(X), ...Object.keys(Y)])) {
      if (!X[id]) { diffs.push({ block: col + ':' + id, at: '', before: '(absent)', after: '(added)' }); continue; }
      if (!Y[id]) { diffs.push({ block: col + ':' + id, at: '', before: '(present)', after: '(removed)' }); continue; }
      const d = firstDiff(norm(X[id], A), norm(Y[id], B), '');
      if (d) diffs.push(Object.assign({ block: col + ':' + id }, d));
    }
  }
  return diffs;
}

function equiv(root, { against = 'HEAD' } = {}) {
  const Gold = compilerAt(root, against);
  const old = Gold.compile(sourcesAt(root, against));
  const { project } = require('./project.js');
  const P = project(root);
  const cur = P.compileAll();
  const errors = cur.errors.map((e) => e.message);
  // Presets, pools, conds and threads are compared where they're used: merged and expanded into the cards.
  const cols = MEANING.filter((c) => c !== 'presets');
  const diffs = compare(old.content, cur.content, cols), extra = [];
  const compared = 2 + cols.reduce((n, c) => n + new Set([...Object.keys(old.content[c] || {}), ...Object.keys(cur.content[c] || {})]).size, 0);
  for (const col of Object.keys(cur.content)) if (!(col in old.content) && cur.content[col] && typeof cur.content[col] === 'object') extra.push(col + ' (' + Object.keys(cur.content[col]).length + ')');
  return { against, compared, diffs, extra, errors: errors.concat(old.errors.map((e) => 'at ' + against + ': ' + e.message)) };
}

// The collections a format-or-content refactor must leave as they were (the framework's own blocks are new).
const MEANING = ['presets', 'resources', 'skills', 'npcs', 'states', 'events', 'endings', 'hooks', 'vocab', 'places', 'tracks', 'spells', 'facts', 'archetypes', 'factions', 'arcs', 'clues', 'lore', 'timeline', 'items'];

module.exports = { equiv, compare, norm, normAst, MEANING };
