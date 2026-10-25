/*
 * Converter: conditions repeated across cards -> @cond (migration 0046).
 *
 * Detection is structural: every event `when:` and option `when:` that is an AND chain at its top level is split into
 * its conjuncts. A set of 2–3 conjuncts that mention one name (lyra, kael…) and are otherwise identical, found in at
 * least MIN_USES chains across at least MIN_CARDS cards, is a candidate: the name becomes the parameter. Candidates are
 * taken largest first; each chain uses a candidate once. Conjuncts holding a number (a tuning threshold such as
 * rel(x) >= 9) stay on the card. Only patterns with a name in NAMES are applied; the rest are listed in the report.
 */
'use strict';
const G = require('../../src/grimoire.js');
const L = require('./lib.js');

const MIN_USES = 5, MIN_CARDS = 3;
// Pattern shape (the parameter written as ?) -> name and description.
const NAMES = {
  'bond(?) != "partner" and bond(?) != "ex"': ['courting', 'Not together and not exes: a romance with them is still open.'],
  'bond(?) == "partner" and around(?)': ['partner_here', 'Your partner, and around to be met in person now.'],
};

// Split an expression's source at its top-level ` and `s (outside parentheses and strings).
function splitAnd(src) {
  const parts = []; let d = 0, q = null, start = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === '(') d++; else if (c === ')') d--;
    else if (!d && src.slice(i, i + 5) === ' and ' ) { parts.push(src.slice(start, i)); start = i + 5; i += 4; }
  }
  parts.push(src.slice(start));
  return parts.map((x) => x.trim());
}
const flat = (n) => (n.t === 'bin' && n.op === '&&' ? flat(n.a).concat(flat(n.b)) : [n]);
const key = (n) => JSON.stringify(n);
// The symbols a node mentions (name arguments).
// (the bound actor `npc` counts as a name too)
const syms = (n) => { const out = new Set(); G.walkAst(n, (x) => { if (x.t === 'sym') out.add(x.v); if (x.t === 'id' && x.n === 'npc') out.add('npc'); }); return out; };
const abstract = (n, s) => JSON.parse(JSON.stringify(n), (k, v) => (v && ((v.t === 'sym' && v.v === s) || (s === 'npc' && v.t === 'id' && v.n === 'npc')) ? { t: 'sym', v: '?' } : v));
const hasNum = (n) => { let r = false; G.walkAst(n, (x) => { if (x.t === 'num') r = true; }); return r; };
const shape = (src, s) => src.replace(new RegExp('\\b' + s + '\\b', 'g'), '?');

// Every top-level AND chain in the content: { owner, kind, src, parts (texts), asts }
function chains(content) {
  const out = [];
  const add = (e, kind, ex, extra) => {
    if (!ex || !ex.ast) return;
    const asts = flat(ex.ast);
    if (asts.length < 2) return;
    const parts = splitAnd(ex.src);
    if (parts.length !== asts.length) return;
    try { if (!parts.every((p, i) => key(G.parseExprAst(p)) === key(asts[i]))) return; } catch (err) { return; }
    out.push(Object.assign({ e, kind, src: ex.src, parts, asts }, extra));
  };
  for (const e of Object.values(content.events)) {
    add(e, 'when', e.own_when || e.when);
    for (const o of e.options) add(e, 'option', o.when, { option: o.key });
  }
  return out;
}

function plan(content) {
  const all = chains(content);
  const cands = new Map();   // shape -> {shape, size, uses: [{chain, idx, sym}], cards:Set}
  for (const ch of all) {
    const n = ch.asts.length;
    const idxSets = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { idxSets.push([i, j]); for (let k = j + 1; k < n; k++) idxSets.push([i, j, k]); }
    for (const set of idxSets) {
      // Conditions that name a concept (a bond, being around, a flag), not a tuning threshold: no numbers.
      if (set.some((i) => hasNum(ch.asts[i]))) continue;
      const common = [...syms(ch.asts[set[0]])].filter((s) => set.every((i) => syms(ch.asts[i]).has(s)));
      for (const s of common) {
        const shp = set.map((i) => shape(ch.parts[i], s)).join(' and ');
        if (!cands.has(shp)) cands.set(shp, { shape: shp, size: set.length, uses: [], cards: new Set(), asts: set.map((i) => key(abstract(ch.asts[i], s))) });
        const c = cands.get(shp);
        if (set.every((i, k) => key(abstract(ch.asts[i], s)) === c.asts[k])) { c.uses.push({ ch, set, sym: s }); c.cards.add(ch.e.id); }
      }
    }
  }
  const chosen = [], unnamed = [], usedChain = new Map(), taken = new Set([...G.FUNCS, ...Object.keys(content.conds || {})]);
  const list = [...cands.values()].filter((c) => c.uses.length >= MIN_USES && c.cards.size >= MIN_CARDS && new Set(c.uses.map((u) => u.sym)).size >= 2)
    .sort((a, b) => b.size - a.size || b.uses.length - a.uses.length);
  for (const c of list) {
    const uses = c.uses.filter((u) => { const busy = usedChain.get(u.ch) || new Set(); return u.set.every((i) => !busy.has(i)); });
    if (uses.length < MIN_USES || new Set(uses.map((u) => u.ch.e.id)).size < MIN_CARDS) continue;
    const named = NAMES[c.shape];
    if (!named) { unnamed.push({ shape: c.shape, uses: uses.length, cards: new Set(uses.map((u) => u.ch.e.id)).size }); continue; }
    for (const u of uses) { if (!usedChain.has(u.ch)) usedChain.set(u.ch, new Set()); u.set.forEach((i) => usedChain.get(u.ch).add(i)); }
    chosen.push({ id: named[0], desc: named[1], shape: c.shape, param: 'who', uses });
  }
  return { conds: chosen, unnamed, candidates: list.length };
}

// Rewrites each chain's source line: the first conjunct of the set becomes the call, the others go.
function apply(ctx, P) {
  const byChain = new Map();
  for (const c of P.conds) for (const u of c.uses) { if (!byChain.has(u.ch)) byChain.set(u.ch, []); byChain.get(u.ch).push({ c, u }); }
  for (const [ch, list] of byChain) {
    const parts = ch.parts.slice();
    for (const { c, u } of list) { parts[u.set[0]] = c.id + '(' + u.sym + ')'; for (const i of u.set.slice(1)) parts[i] = null; }
    const text = parts.filter((p) => p != null).join(' and ');
    const lines = ctx.lines(ch.e.file);
    const end = L.blockSource(lines, ch.e.line).end;
    let at = null;
    for (let n = ch.e.line + 1; n < end && at == null; n++) {
      const m = lines[n - 1].match(/^(\s*)when:\s*(.*)$/);
      if (m && m[2].trim() === ch.src && (ch.kind === 'when' ? m[1] === '' : m[1] !== '')) at = { n, indent: m[1] };
    }
    if (!at) { ctx.report('cond: ' + ch.e.id + ' (' + ch.kind + '): when: not found on one line, left as is'); continue; }
    ctx.edit({ file: ch.e.file, line: at.n }, at.indent + 'when: ' + text);
  }
  if (P.conds.length) {
    const head = '# ============================================================\n#  Named conditions (docs/grimoire-script.md §9): call them in any expression, e.g. courting(lyra).\n# ============================================================\n';
    const blocks = P.conds.map((c) => ['@cond ' + c.id].concat(c.desc ? ['desc: ' + c.desc] : [], ['params: ' + c.param, 'is: ' + c.shape.replace(/\?/g, c.param)]).join('\n'));
    ctx.create('content/core/conds.grim', head + '\n' + blocks.join('\n\n') + '\n');
  }
}

module.exports = { plan, apply, splitAnd };
