// Static reachability (graph validation): which events, endings, places, tracks, flags, states and clues
// can ever happen. A fixpoint over "producible facts":
//   an event is reachable when its trigger source exists (auto/random/social: always; queued: a reachable
//   event, hook or state queues it; place: the place can be discovered and opens in a visit slot; track:
//   the track can be enrolled/joined; plan: the plan state can be gained; arc beat: within the clock) and
//   its `when` (and cast `where`s) are satisfiable given the facts produced so far.
// Conditions are judged optimistically: anything numeric or negated counts as satisfiable, except numbers
// out of range (year 5, month 13) and custom counters nothing ever raises. So "unreachable" here means
// provably unreachable: some fact the event needs is produced nowhere reachable.
'use strict';
const G = require('../src/grimoire.js');

function reach(content) {
  const c = content, maxYear = Math.ceil((c.game.turns || 47) / 12) || 4;
  const R = new Set();                                   // reachable events
  const F = { flag: new Set(), state: new Set(), clue: new Set(), place: new Set(), track: new Set(), npc: new Set(), queued: new Set(), ending: new Set(), spell: new Set(), raised: new Set() };
  const why = {};                                         // event id → first missing fact (for the report)
  const visitSlots = new Set([...(c.game.day_term || []), ...(c.game.day_break || [])].filter((r) => r.source === 'visit').map((r) => r.slot));
  const recipeSlots = new Set([...(c.game.day_term || []), ...(c.game.day_break || [])].map((r) => r.slot));
  const roles = (e) => new Set((e.cast || []).map((r) => r.role));

  // ---- condition satisfiability (returns null if OK, else the missing fact as a string)
  const sym = (a) => a && (a.t === 'sym' || a.t === 'id') ? (a.v || a.n) : null;
  function need(ast, rl) {
    if (!ast) return null;
    switch (ast.t) {
      case 'bin':
        if (ast.op === '&&') return need(ast.a, rl) || need(ast.b, rl);
        if (ast.op === '||') { const x = need(ast.a, rl); if (!x) return null; const y = need(ast.b, rl); return y ? x + ' | ' + y : null; }
        return cmp(ast, rl);
      case 'un': return null;                            // negation: assume satisfiable
      case 'call': return call(ast, rl, true);
      case 'id': return ast.n === 'false' ? 'false' : null;
      case 'bool': return ast.v ? null : 'false';
      default: return null;
    }
  }
  function call(n, rl, truthy) {
    const a0 = sym(n.args && n.args[0]);
    if (a0 && rl && rl.has(a0)) return null;             // a cast role: filled at runtime
    switch (n.n) {
      case 'flag': return F.flag.has(a0) ? null : 'flag(' + a0 + ')';
      case 'has': return F.state.has(a0) ? null : 'has(' + a0 + ')';
      case 'clue': return F.clue.has(a0) ? null : 'clue(' + a0 + ')';
      case 'met': return F.npc.has(a0) ? null : 'met(' + a0 + ')';
      case 'member': case 'applied': if (!c.tracks[a0] && Object.values(c.tracks).some((d) => d.kind === a0)) return [...F.track].some((id) => c.tracks[id] && c.tracks[id].kind === a0) ? null : n.n + '(' + a0 + ')';   // a kind: any of it; falls through
      case 'enrolled': return F.track.has(a0) ? null : n.n + '(' + a0 + ')';
      case 'passed': return F.track.has(a0) ? null : 'passed(' + a0 + ')';
      case 'discovered': return F.place.has(a0) ? null : 'discovered(' + a0 + ')';
      case 'spell_level': return F.spell.has(a0) ? null : 'spell(' + a0 + ')';
      default: return null;
    }
  }
  function cmp(n, rl) {
    const num = (x) => (x && x.t === 'num' ? x.v : null);
    const L = n.a, Rr = n.b, v = num(Rr);
    if (v == null) return null;
    const pos = ['>', '>='].includes(n.op) ? (n.op === '>' ? v > 0 : v >= 1) : n.op === '==' ? v > 0 : false;   // needs a positive amount
    if (L.t === 'id') {
      if (L.n === 'year') { const ok = n.op === '==' ? v >= 1 && v <= maxYear : n.op === '>=' ? v <= maxYear : n.op === '>' ? v < maxYear : true; return ok ? null : 'year ' + n.op + ' ' + v; }
      if (L.n === 'month') { const ok = n.op === '==' ? v >= 1 && v <= 12 : n.op === '>=' ? v <= 12 : n.op === '>' ? v < 12 : true; return ok ? null : 'month ' + n.op + ' ' + v; }
      const builtin = c.resources[L.n] || c.skills[L.n] || ['turn', 'gpa', 'final_year', 'term', 'break', 'runs_completed', 'slot'].includes(L.n);
      if (!builtin && pos && !F.raised.has(L.n)) return L.n + ' ' + n.op + ' ' + v + ' (nothing raises it)';
      return null;
    }
    if (L.t === 'call') {
      const a0 = sym(L.args && L.args[0]);
      if (rl && a0 && rl.has(a0)) return null;
      if (L.n === 'seen' && pos) return R.has(a0) ? null : 'seen(' + a0 + ')';
      if (['level', 'performance', 'progress', 'visits', 'rank', 'due'].includes(L.n) && pos) return F.track.has(a0) ? null : L.n + '(' + a0 + ')';
      if (L.n === 'clues' && pos) { const d = c.arcs[a0]; const k = d ? (d.clues || []).filter((x) => F.clue.has(x)).length : 0; return k >= v + (n.op === '>' ? 1 : 0) ? null : 'clues(' + a0 + ') ' + n.op + ' ' + v + ' (only ' + k + ' findable)'; }
      if (L.n === 'visits_to' && pos) return F.place.has(a0) ? null : 'visits_to(' + a0 + ')';
      if (['rel', 'spark', 'bond'].includes(L.n) && pos) return F.npc.has(a0) ? null : L.n + '(' + a0 + ') (never met)';
      if (L.n === 'spell_level' && pos) return F.spell.has(a0) ? null : 'spell(' + a0 + ')';
    }
    return null;
  }

  // ---- what reachable effects produce
  function produce(effects, eid) {
    G.walkEffects(effects || [], (st) => {
      switch (st.t) {
        case 'flag': for (const f of [].concat(st.flags || st.names || st.flag || [])) F.flag.add(f); break;
        case 'gain': F.state.add(st.state); { const d = c.states[st.state]; if (d) { produce(d.on_add); produce(d.tick); produce(d.on_expire); produce(d.on_remove); } } break;
        case 'find': F.clue.add(st.clue); break;
        case 'discover': F.place.add(st.place); break;
        case 'meet': case 'rel': case 'spark': case 'bond': if (st.npc && c.npcs[st.npc]) F.npc.add(st.npc); break;
        case 'queue': F.queued.add(st.event || st.target); break;
        case 'end': F.ending.add(st.ending); break;
        case 'learn_spell': F.spell.add(st.spell); break;
        case 'enrol': case 'join': case 'apply': if (st.track && c.tracks[st.track]) { F.track.add(st.track); const p = c.tracks[st.track].place; if (p && st.t === 'join') F.place.add(p); } break;
        case 'delta': case 'assign': if (!c.resources[st.name] && !c.skills[st.name]) F.raised.add(st.name); break;
      }
    });
  }
  // seed: hooks, resource on_zero, origins (the start menu grants them), npcs met on stage
  for (const h of Object.values(c.hooks)) produce(h.do || h.effects);
  for (const r of Object.values(c.resources)) produce(r.on_zero);

  // options whose own gate can't open yet produce nothing; they are re-checked every round
  const opened = new Set();
  function reopen(e, rl) {
    e.options.forEach((o, i) => {
      const k = e.id + '#' + i;
      if (opened.has(k) || (o.when && need(o.when.ast, rl))) return;
      opened.add(k); produce(o.effects, e.id);
    });
  }
  let changed = true, rounds = 0;
  while (changed && rounds++ < 50) {
    const before = opened.size + R.size + Object.values(F).reduce((a, s) => a + s.size, 0);
    // places: no discover → found; else discover satisfiable; must open in a visit slot (internship hosts use their map)
    for (const p of Object.values(c.places)) {
      if (F.place.has(p.id)) continue;
      if (p.kind === 'internship') { if (p.track && F.track.has(p.track)) F.place.add(p.id); continue; }
      if (!p.discover || !need(p.discover.ast)) F.place.add(p.id);
    }
    // courses offered by a reachable enrolment menu (hidden ones need their prereq)
    const offered = new Set([...R].map((id) => c.events[id].offers).filter(Boolean));
    for (const t of Object.values(c.tracks)) if (offered.has(t.kind + 's') && (!t.prereq || !need(t.prereq.ast))) { F.track.add(t.id); if (t.kind === 'club' && t.place) F.place.add(t.place); }
    // the engine pushes track notices at term end for any track
    if (F.track.size) { F.queued.add('track_warning'); F.queued.add('track_promotion'); F.queued.add('job_term_review'); if (c.game.exam) F.queued.add(c.game.exam); }
    for (const e of Object.values(c.events)) {
      const rl = roles(e);
      if (R.has(e.id)) { reopen(e, rl); continue; }
      let miss = null;
      if (e.trigger === 'queued' && !F.queued.has(e.id)) miss = 'queued by nothing reachable';
      else if (e.place && !F.place.has(e.place)) miss = 'place ' + e.place + ' never discovered';
      else if (e.place && c.places[e.place] && c.places[e.place].kind !== 'internship' && c.places[e.place].open && !c.places[e.place].open.some((s) => visitSlots.has(s)) && !e.replaces) miss = 'place ' + e.place + ' never open in a visit slot';
      else if (e.track && !F.track.has(e.track)) miss = 'track ' + e.track + ' never joined';
      else if (e.track && e.level && c.tracks[e.track] && c.tracks[e.track].levels && e.level > c.tracks[e.track].levels) miss = 'level ' + e.level + ' > track levels';
      else if (e.plan && !F.state.has('plan_' + e.plan)) miss = 'plan_' + e.plan + ' never gained';
      else if (e.slot && !recipeSlots.has(e.slot)) miss = 'slot ' + e.slot + ' in no recipe';
      else if (e.arc && e.beat != null && c.arcs[e.arc] && c.arcs[e.arc].clock && e.beat > c.arcs[e.arc].clock.max) miss = 'beat beyond the clock';
      if (!miss) miss = need(e.when && e.when.ast, rl);
      if (!miss) for (const r of e.cast || []) {
        if (r.pool === 'fixed' && !F.npc.has(r.npc)) { miss = 'cast ' + r.role + ': ' + r.npc + ' never met'; break; }
        const m = need(r.where && r.where.ast, rl); if (m) { miss = 'cast ' + r.role + ' where: ' + m; break; }
      }
      if (miss) { why[e.id] = miss; continue; }
      R.add(e.id); delete why[e.id];
      if (e.actor && !['any', 'npc'].includes(e.actor)) F.npc.add(e.actor);
      for (const r of e.cast || []) if (r.pool === 'fixed') F.npc.add(r.npc);
      produce(e.on_show, e.id);
      reopen(e, rl);
    }
    const after = opened.size + R.size + Object.values(F).reduce((a, s) => a + s.size, 0);
    changed = after !== before;
  }
  // endings: early ones by `end`, graduation ones by their when
  const endings = {};
  for (const d of Object.values(c.endings)) {
    if (d.kind === 'early') endings[d.id] = F.ending.has(d.id) ? null : 'no reachable "end ' + d.id + '"';
    else endings[d.id] = need(d.when && d.when.ast);
  }
  const deadOptions = [];
  for (const id of R) {
    const e = c.events[id], rl = roles(e);
    e.options.forEach((o, i) => { const m = o.when && need(o.when.ast, rl); if (m) deadOptions.push({ id, option: o.key, line: o.line, why: m }); });
  }
  // Design §10.6 hard invariant: every key clue has at least 2 reachable sources (events that can grant it).
  const keyClues = [];
  for (const a of Object.values(c.arcs || {})) for (const k of a.key_clues || []) {
    const src = [...R].filter((id) => { let hit = false; G.walkEffects([].concat(c.events[id].on_show || [], ...c.events[id].options.map((o) => o.effects)), (st) => { if (st.t === 'find' && st.clue === k) hit = true; }); return hit; });
    keyClues.push({ arc: a.id, clue: k, sources: src });
  }
  const retired = (e) => (e.tags || []).includes('retired') || (e.when && e.when.src === 'false');
  const unreachable = Object.entries(why).filter(([id]) => !retired(c.events[id])).map(([id, w]) => ({ id, file: c.events[id].file, line: c.events[id].line, why: w }));
  return {
    unreachable, deadOptions, keyClues, retired: Object.keys(why).filter((id) => retired(c.events[id])),
    endings: Object.entries(endings).filter(([, w]) => w).map(([id, w]) => ({ id, why: w })),
    places: Object.keys(c.places).filter((p) => !F.place.has(p)),
    tracks: Object.keys(c.tracks).filter((t) => !F.track.has(t)),
    reachable: R.size, total: Object.keys(c.events).length,
    facts: F,
  };
}
module.exports = { reach };
