/*
 * Converter: hand-wired quests -> threads `from: quest` (migration 0047; the template is in content/core/templates.grim).
 *
 * Detection is structural (compiled conditions and effects, and where each property is written), never the prose:
 *   - start: a card whose `when` has `not flag(B)` and one of whose options sets B (B is the quest's $begun);
 *   - final: a card whose `when` has `flag(B)`, `since(<start>) >= A` and `(flag(F1) + … >= N or since(<start>) >= G)`;
 *     F1… are the parts' flags, in that order (it's the order count() and `first part` expand in);
 *   - parts: cards whose `when` has `flag(B)` and `not flag(Fi)`, and which set Fi;
 *   - thread `when`: the conjuncts every member writes (spell_level(x) == 0); thread properties: where-properties
 *     (track, rank, …) every member writes alike.
 * Each card then drops what its role's pool and the thread give it (equal values only: a card's own value wins
 * anyway), says `thread: <id>`, and a part's routing block (`if <beat> != turn: …`) becomes `next`.
 * Every quest is tried alone first (applied in memory, compiled, its cards compared with tools/equiv.js): one whose
 * cards would compile differently falls back to a plain thread (members say `thread:`, nothing else changes), and
 * one that fails even that is left alone. All of it goes in the report.
 */
'use strict';
const G = require('../../src/grimoire.js');
const Eq = require('../equiv.js');
const L = require('./lib.js');
const { splitAnd } = require('./conds.js');

const WHERE = ['track', 'rank', 'level', 'place', 'plan', 'slot', 'time', 'actor'];
const key = (n) => JSON.stringify(n);
const astOf = (src) => key(G.parseExprAst(src));
const isFlag = (n, name) => n && n.t === 'call' && n.n === 'flag' && n.args[0] && n.args[0].t === 'sym' && (name == null || n.args[0].v === name);
const flagsSet = (effects) => { const out = new Set(); G.walkEffects(effects, (st) => { if (st.t === 'flag') st.names.forEach((n) => out.add(n)); }); return out; };
const partsOf = (e) => { const w = e.own_when || e.when; return w ? splitAnd(w.src) : []; };

function detect(content) {
  const evs = Object.values(content.events).filter((e) => !e.thread && !e.chain && !e.arc && !e.pool && !e.specializes);
  const quests = [];
  for (const start of evs) {
    const conj = partsOf(start).map((s) => ({ s, n: G.parseExprAst(s) }));
    const sets = new Set(start.options.flatMap((o) => [...flagsSet(o.effects)]));
    const begunC = conj.find((c) => c.n.t === 'un' && c.n.op === '!' && isFlag(c.n.a) && sets.has(c.n.a.args[0].v));
    if (!begunC) continue;
    const begun = begunC.n.a.args[0].v;
    const final = evs.find((e) => e !== start && partsOf(e).some((s) => s === 'flag(' + begun + ')') && partsOf(e).some((s) => new RegExp('^since\\(' + start.id + '\\) >= \\d+$').test(s)));
    if (!final) continue;
    let after = null, need = null, giveup = null, order = null;
    for (const s of partsOf(final)) {
      let m;
      if ((m = s.match(new RegExp('^since\\(' + start.id + '\\) >= (\\d+)$')))) after = +m[1];
      else if ((m = s.match(new RegExp('^\\((.+) >= (\\d+) or since\\(' + start.id + '\\) >= (\\d+)\\)$')))) {
        const terms = m[1].split(' + ').map((t) => t.match(/^flag\((\w+)\)$/));
        if (terms.every(Boolean)) { order = terms.map((t) => t[1]); need = +m[2]; giveup = +m[3]; }
      }
    }
    if (after == null || !order) continue;
    // (a part may wait on another part instead of the start: the trial then keeps it a plain thread)
    const waits = (e) => [begun].concat(order).some((g) => partsOf(e).includes('flag(' + g + ')'));
    const parts = order.map((f) => evs.find((e) => e !== start && e !== final && waits(e) && partsOf(e).includes('not flag(' + f + ')')
      && e.options.some((o) => flagsSet(o.effects).has(f))));
    if (parts.some((p) => !p) || new Set(parts).size !== parts.length) continue;
    quests.push({ begun, start, final, parts: parts.map((e, i) => ({ e, flag: order[i] })), after, need, giveup });
  }
  return quests;
}

// The edits (in original line numbers) that turn one detected quest into a thread; mode 'quest' or 'plain'.
function editsFor(content, linesOf, q, id, mode) {
  const members = [{ e: q.start, role: 'start' }].concat(q.parts.map((p) => ({ e: p.e, role: 'part', flag: p.flag })), [{ e: q.final, role: 'final' }]);
  const src = (e) => L.blockSource(linesOf(e.file), e.line);
  const written = (e, k) => { const p = src(e).props[k]; return p && !p.multi ? p.text : null; };
  const tpl = content.threads.quest, pools = content.pools;
  const edits = [];
  const lift = [];
  let threadWhen = [];
  const withs = ['begun=' + q.begun];
  if (mode === 'quest') {
    const def = Object.fromEntries((tpl.params || []).map((p) => p.split('=')).filter((p) => p.length === 2));
    for (const [k, v] of [['need', q.need], ['after', q.after], ['giveup', q.giveup]]) if (String(v) !== def[k]) withs.push(k + '=' + v);
    for (const k of WHERE) { const v = written(members[0].e, k); if (v != null && members.every((m) => written(m.e, k) === v)) lift.push([k, v]); }
    const common = partsOf(members[0].e).filter((s) => !s.includes(q.begun) && members.every((m) => partsOf(m.e).map(astOf).includes(astOf(s))));
    threadWhen = common;
  }
  const beats = new Set();
  for (const m of members) {
    const lines = linesOf(m.e.file), S = src(m.e);
    const given = new Map(lift);
    if (mode === 'quest') {
      const pool = pools['quest.' + m.role];
      for (const [k, p] of Object.entries(pool.props || {})) if (k !== 'when') given.set(k, p.text);
    }
    const drop = Object.keys(S.props).filter((k) => k !== 'when' && given.has(k) && written(m.e, k) === given.get(k)).map((k) => S.props[k]);
    // `thread:` goes where the first dropped line was, else after the header's title.
    drop.sort((a, b) => a.line - b.line);
    if (drop.length) { edits.push({ file: m.e.file, line: drop[0].line, edit: 'thread: ' + id }); drop.slice(1).forEach((p) => edits.push({ file: m.e.file, line: p.line, remove: true })); }
    else edits.push({ file: m.e.file, line: (S.props.title || { line: m.e.line }).line, after: 'thread: ' + id });
    if (mode !== 'quest') continue;
    // Its `when:` keeps what neither the role's pool nor the thread gives.
    const gone = new Set(threadWhen.map(astOf));
    if (m.role === 'start') gone.add(astOf('not flag(' + q.begun + ')'));
    else gone.add(astOf('flag(' + q.begun + ')'));
    if (m.role === 'part') gone.add(astOf('not flag(' + m.flag + ')'));
    if (m.role === 'final') partsOf(m.e).filter((s) => s.startsWith('since(' + q.start.id + ')') || s.startsWith('(')).forEach((s) => gone.add(astOf(s)));
    const keep = partsOf(m.e).filter((s) => !gone.has(astOf(s)));
    if (S.props.when) edits.push(keep.length ? { file: m.e.file, line: S.props.when.line, edit: 'when: ' + keep.join(' and ') } : { file: m.e.file, line: S.props.when.line, remove: true });
    // A part's routing blocks become `next`.
    if (m.role === 'part') {
      for (let n = S.header + 1; n < S.end; n++) {
        const r = lines[n - 1].match(/^(\s+)if (\w+) != turn:\s*$/);
        if (!r) continue;
        beats.add(r[2]);
        edits.push({ file: m.e.file, line: n, edit: r[1] + 'next' });
        let k = n + 1;
        while (k < S.end && (lines[k - 1].trim() === '' || lines[k - 1].match(/^\s*/)[0].length > r[1].length)) { if (lines[k - 1].trim() !== '') edits.push({ file: m.e.file, line: k, remove: true }); k++; }
        n = k - 1;
      }
    }
  }
  if (beats.size > 1) return null;
  const beat = [...beats][0];
  if (mode === 'quest' && beat && beat !== 'chain_beat') withs.push('beat=' + beat);
  const clues = [...new Set(q.start.options.flatMap((o) => { const f = []; G.walkEffects(o.effects, (st) => { if (st.t === 'find') f.push(st.clue || st.id || st.name); }); return f; }).filter(Boolean))];
  const block = ['@thread ' + id]
    .concat(mode === 'quest' ? ['from: quest', 'with: ' + withs.join(' ')] : [], threadWhen.length ? ['when: ' + threadWhen.join(' and ')] : [], lift.map(([k, v]) => k + ': ' + v),
      clues.length ? ['clues: ' + clues.join(' ')] : [], ['members:'], members.map((m) => '  ' + m.role + ' ' + m.e.id + (m.flag ? ' flag=' + m.flag : '')));
  if (mode !== 'quest') block.splice(block.indexOf('members:'));
  const lines = linesOf(q.start.file);
  edits.push({ file: q.start.file, line: L.insertionPoint(lines, q.start.line), after: block.join('\n') + '\n' });
  return edits;
}

// Applies edits to copies of the files' lines (as tools/rewrite.js would) and returns the changed texts.
function applyInMemory(linesOf, edits) {
  const byFile = new Map();
  for (const x of edits) { if (!byFile.has(x.file)) byFile.set(x.file, []); byFile.get(x.file).push(x); }
  const out = {};
  for (const [file, list] of byFile) {
    const lines = linesOf(file).slice(), res = [];
    const at = new Map();
    for (const x of list) { if (!at.has(x.line)) at.set(x.line, []); at.get(x.line).push(x); }
    for (const x of at.get(0) || []) if (x.after) res.push(...x.after.split('\n'));
    lines.forEach((l, i) => {
      const xs = at.get(i + 1) || [];
      const ed = xs.find((x) => x.edit != null), rm = xs.some((x) => x.remove);
      if (!rm) res.push(ed ? ed.edit : l);
      for (const x of xs) if (x.after) res.push(...x.after.split('\n'));
    });
    out[file] = res.join('\n');
  }
  return out;
}

function plan(content, linesOf, sources) {
  const taken = new Set([].concat(...['threads', 'pools', 'spells', 'arcs', 'tracks', 'places', 'npcs', 'events', 'items'].map((c) => Object.keys(content[c] || {}))));
  const found = detect(content), quests = [], report = [];
  for (const q of found) {
    const id = L.uniqueId(taken, q.begun.replace(/_chain$/, ''), 'quest');
    const ids = [q.start, ...q.parts.map((p) => p.e), q.final].map((e) => e.id);
    let chosen = null;
    for (const mode of ['quest', 'plain']) {
      const edits = editsFor(content, linesOf, q, id, mode);
      if (!edits) continue;
      const changed = applyInMemory(linesOf, edits);
      const r = G.compile(sources.map((s) => (changed[s.path] != null ? { path: s.path, text: changed[s.path] } : s)));
      const A = { events: Object.fromEntries(ids.map((i) => [i, content.events[i]])) }, B = { events: Object.fromEntries(ids.map((i) => [i, r.content.events[i]])) };
      const diffs = r.errors.length ? r.errors.map((e) => ({ at: 'error', after: e.message })) : Eq.compare(Object.assign({}, content, A), Object.assign({}, r.content, B), ['events']).filter((d) => ids.includes(d.block.split(':')[1]));
      if (!diffs.length) { chosen = { mode, edits }; break; }
      report.push({ id, mode, rejected: diffs.slice(0, 3) });
    }
    if (!chosen) { report.push({ id, left: 'as is' }); continue; }
    quests.push({ id, mode: chosen.mode, begun: q.begun, start: q.start.id, parts: q.parts.map((p) => p.e.id + ' ' + p.flag), final: q.final.id, edits: chosen.edits });
  }
  return { quests, report };
}

function apply(ctx, P) {
  for (const q of P.quests) for (const x of q.edits) {
    if (x.edit != null) ctx.edit({ file: x.file, line: x.line }, x.edit);
    else if (x.remove) ctx.remove({ file: x.file, line: x.line });
    else ctx.insertAfter({ file: x.file, line: x.line }, x.after);
  }
}

module.exports = { detect, plan, apply, applyInMemory };
