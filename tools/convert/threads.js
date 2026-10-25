/*
 * Converter: `chain:` storylines -> @thread (migration 0049).
 *
 * Detection is structural (compiled conditions and effects, and where each property is written), never the prose:
 *   - every chain C that isn't yet a @thread becomes `@thread C`, its cards' `chain: C` lines `thread: C`; a chain
 *     naming an arc only renames the line (an arc is a thread already);
 *   - story: when one card sets a flag F that every other card's `when` tests (`flag(F)` at its top level) and its
 *     own doesn't, the thread is `from: story` with `begun=flag(F)` and that card its start; the others drop the test;
 *   - the thread's `when`: the conjuncts every card writes; its properties: where-properties (place, track, …) every
 *     card writes alike;
 *   - `clues:`: the clues the thread's cards find, when most of a clue's finders are in it.
 * Each thread is tried in memory, richest form first (story, then shared, then a bare rename), and the first whose
 * cards compile the same (tools/equiv.js) is kept. Clue leads found outside any storyline are listed in the report.
 */
'use strict';
const G = require('../../src/grimoire.js');
const Eq = require('../equiv.js');
const L = require('./lib.js');
const { splitAnd } = require('./conds.js');
const { applyInMemory } = require('./quests.js');

const WHERE = ['track', 'rank', 'level', 'place', 'plan', 'slot', 'time', 'actor'];
const astOf = (src) => JSON.stringify(G.parseExprAst(src));
const partsOf = (e) => { const w = e.own_when || e.when; return w ? splitAnd(w.src) : []; };
const flagsSet = (e) => { const out = new Set(); for (const o of e.options) G.walkEffects(o.effects, (st) => { if (st.t === 'flag') st.names.forEach((n) => out.add(n)); }); return out; };
const finds = (e) => { const out = []; for (const o of e.options) G.walkEffects(o.effects, (st) => { if (st.t === 'find') out.push(st.clue); }); return out; };

function finders(content) {
  const by = new Map();
  for (const e of Object.values(content.events)) for (const c of finds(e)) { if (!by.has(c)) by.set(c, new Set()); by.get(c).add(e); }
  return by;
}

function editsFor(content, linesOf, id, cards, mode, clueOwn) {
  const src = (e) => L.blockSource(linesOf(e.file), e.line);
  const written = (e, k) => { const p = src(e).props[k]; return p && !p.multi ? p.text : null; };
  const edits = [], head = ['@thread ' + id];
  let start = null, begun = null, common = [], lift = [];
  if (mode === 'story') {
    for (const s of cards) {
      for (const f of flagsSet(s)) {
        const t = astOf('flag(' + f + ')');
        if (partsOf(s).map(astOf).includes(t)) continue;
        if (cards.every((e) => e === s || partsOf(e).map(astOf).includes(t))) { start = s; begun = f; break; }
      }
      if (start) break;
    }
    if (!start) return null;
    head.push('from: story', 'with: begun=flag(' + begun + ')');
  }
  if (mode !== 'bare' && cards.length > 1) {
    common = partsOf(cards[0]).filter((s) => cards.every((e) => partsOf(e).map(astOf).includes(astOf(s))));
    for (const k of WHERE) { const v = written(cards[0], k); if (v != null && cards.every((e) => written(e, k) === v)) lift.push([k, v]); }
    if (mode === 'shared' && !common.length && !lift.length) return null;
  }
  if (common.length) head.push('when: ' + common.join(' and '));
  head.push(...lift.map(([k, v]) => k + ': ' + v));
  if (clueOwn.length) head.push('clues: ' + clueOwn.join(' '));
  if (start) head.push('members:', '  start ' + start.id);
  const gone = new Set(common.map(astOf));
  for (const e of cards) {
    const S = src(e);
    edits.push({ file: e.file, line: S.props.chain.line, edit: 'thread: ' + id });
    for (const [k] of lift) edits.push({ file: e.file, line: S.props[k].line, remove: true });
    const drop = new Set(gone);
    if (begun && e !== start) drop.add(astOf('flag(' + begun + ')'));
    if (!drop.size || !S.props.when) continue;
    const keep = partsOf(e).filter((s) => !drop.has(astOf(s)));
    if (keep.length === partsOf(e).length) continue;
    edits.push(keep.length ? { file: e.file, line: S.props.when.line, edit: 'when: ' + keep.join(' and ') } : { file: e.file, line: S.props.when.line, remove: true });
  }
  const byFile = {};
  for (const e of cards) byFile[e.file] = (byFile[e.file] || 0) + 1;
  const file = Object.keys(byFile).sort((a, b) => byFile[b] - byFile[a] || a.localeCompare(b))[0];
  const first = Math.min(...cards.filter((e) => e.file === file).map((e) => e.line));
  edits.push({ file, line: L.insertionPoint(linesOf(file), first), after: head.join('\n') + '\n' });
  return { edits, start: start && start.id, begun, when: common.join(' and '), lift };
}

function plan(content, linesOf, sources) {
  const chains = new Map();
  for (const e of Object.values(content.events)) {
    if (!e.chain) continue;
    const S = L.blockSource(linesOf(e.file), e.line);
    if (!S.props.chain) continue;   // its storyline comes from `thread:` or a thread's members already
    if (!chains.has(e.chain)) chains.set(e.chain, []);
    chains.get(e.chain).push(e);
  }
  const by = finders(content), threads = [], report = { rejected: [], loose_leads: [] };
  const ownerOf = (clue) => {
    const count = {};
    for (const e of by.get(clue) || []) if (e.chain) count[e.chain] = (count[e.chain] || 0) + 1;
    const total = (by.get(clue) || new Set()).size, best = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
    return best && count[best] * 2 > total ? best : null;
  };
  for (const [id, cards] of chains) {
    if (content.arcs[id] || content.threads[id]) {
      threads.push({ id, mode: 'rename', cards: cards.length, edits: cards.map((e) => ({ file: e.file, line: L.blockSource(linesOf(e.file), e.line).props.chain.line, edit: 'thread: ' + id })) });
      continue;
    }
    const clueOwn = [...new Set(cards.flatMap(finds))].filter((c) => content.clues[c] && !content.clues[c].arc && ownerOf(c) === id).sort();
    const ids = cards.map((e) => e.id);
    let chosen = null;
    for (const mode of ['story', 'shared', 'bare']) {
      const r0 = editsFor(content, linesOf, id, cards, mode, clueOwn);
      if (!r0) continue;
      const changed = applyInMemory(linesOf, r0.edits);
      const r = G.compile(sources.map((s) => (changed[s.path] != null ? { path: s.path, text: changed[s.path] } : s)));
      const diffs = r.errors.length ? r.errors.map((e) => ({ at: 'error', after: e.message })) : Eq.compare(content, r.content, ['events']).filter((d) => ids.includes(d.block.split(':')[1]));
      if (!diffs.length) { chosen = Object.assign({ mode }, r0); break; }
      report.rejected.push({ id, mode, diffs: diffs.slice(0, 3) });
    }
    if (!chosen) { report.rejected.push({ id, left: 'as is' }); continue; }
    threads.push({ id, mode: chosen.mode, cards: cards.length, start: chosen.start, begun: chosen.begun, when: chosen.when, lift: chosen.lift, clues: clueOwn, edits: chosen.edits });
  }
  // Threads made earlier (quests, scenes) that don't list their clues yet.
  for (const t of Object.values(content.threads)) {
    if (t.params || t.roles || t.clues || chains.has(t.id)) continue;
    const cards = Object.values(content.events).filter((e) => e.thread === t.id);
    const own = [...new Set(cards.flatMap(finds))].filter((c) => content.clues[c] && !content.clues[c].arc && ownerOf(c) === t.id).sort();
    if (!own.length) continue;
    const S = L.blockSource(linesOf(t.file), t.line), after = Math.max(t.line, ...Object.values(S.props).map((p) => p.line));
    threads.push({ id: t.id, mode: 'clues', cards: cards.length, clues: own, edits: [{ file: t.file, line: after, after: 'clues: ' + own.join(' ') }] });
  }
  // Leads that belong to no storyline (a single card finds them): left for a writer to place.
  for (const [clue, es] of by) {
    const d = content.clues[clue];
    if (!d || d.arc || ownerOf(clue) || [...es].some((e) => e.thread && content.threads[e.thread])) continue;
    report.loose_leads.push({ clue, title: d.thread || null, found_by: [...es].map((e) => e.id) });
  }
  return { threads, report };
}

function apply(ctx, P) {
  for (const t of P.threads) for (const x of t.edits) {
    if (x.edit != null) ctx.edit({ file: x.file, line: x.line }, x.edit);
    else if (x.remove) ctx.remove({ file: x.file, line: x.line });
    else ctx.insertAfter({ file: x.file, line: x.line }, x.after);
  }
}

module.exports = { plan, apply };
