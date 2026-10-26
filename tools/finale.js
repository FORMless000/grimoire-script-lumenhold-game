// The last day's replay guarantee (feedback 2026-10-25, design §4.1): from the start of month 48, every choice on its
// cards is tried (a menu's every pick, up to its `pick:`), and the yearbooks it can end in are collected. Each line of
// the yearbook that the run has earned (an offer held, a partner, the friends who stayed, a personal line it qualifies
// for) must be reachable by choosing differently on the last day; `missing` lists any that aren't.
//   const F = require('./finale.js'); F.explore(eng) → { leaves, reachable: {slot: Set}, expected: [ids], missing: [ids] }
'use strict';

// Every way to pick from a menu card: one option, or (with `pick: N`) any set of up to N enabled options.
function picksOf(eng, view) {
  const keys = view.options.filter((o) => !o.disabled).map((o) => o.key);
  const n = Math.min((eng.c.events[view.id] || {}).pick || 1, keys.length);
  if (n <= 1) return keys;
  const out = [];
  const walk = (from, cur) => { if (cur.length) out.push(cur.slice()); if (cur.length === n) return; for (let i = from; i < keys.length; i++) { cur.push(keys[i]); walk(i + 1, cur); cur.pop(); } };
  walk(0, []);
  return out;
}

// What the run has earned on the last day, before any of its choices: the endings some choice should reach.
function expected(eng) {
  const s = eng.s, f = (x) => !!s.flags[x], out = [];
  const c = eng.c, quiet = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };
  const holds = (expr) => quiet(() => eng.test(expr, null));
  // Careers: each offer held is a headline some choice signs (the ending whose `when` reads its took_ flag).
  for (const k of Object.keys(s.flags)) {
    if (!/^offer_/.test(k) || !s.flags[k]) continue;
    const took = 'took_' + k.slice(6), e = Object.values(c.endings).find((d) => d.when && new RegExp('flag\\(' + took + '\\)').test(d.when.src));
    if (e) out.push(e.id);
  }
  // The two endings without a post: one of them is always reachable ("keep looking").
  const had = s.flags.took_none; s.flags.took_none = true;
  const looking = ['ending_still_searching', 'ending_back_home'].find((id) => c.endings[id] && holds(c.endings[id].when));
  if (had == null) delete s.flags.took_none; else s.flags.took_none = had;
  if (looking) out.push(looking);
  // Partners: each one's line (or the generic one, for a partner without their own).
  for (const [id, n] of Object.entries(s.npcs)) if (n.bond === 'partner') out.push(c.endings['ending_beloved_' + id] ? 'ending_beloved_' + id : 'ending_beloved');
  if (Object.values(s.npcs).filter((n) => n.met && (n.bond === 'friend' || n.bond === 'close')).length >= 3) out.push('ending_beloved_friends');
  if (f('dumont_reunited') && s.npcs.kael && s.npcs.kael.met) out.push('ending_dumonts_reunited');
  if (f('ilse_taken') && !f('dumont_reunited') && s.npcs.kael && s.npcs.kael.met) out.push('ending_ilse_taken');
  if (f('tamsin_friends') && (s.npcs.tamsin || {}).rel >= 15) out.push('ending_tamsin_friends');
  // Personal lines the yearbook may keep.
  const v = s.vals;
  if (v.renown >= 45) out.push('ending_celebrity');
  if (v.alignment >= 60) out.push('ending_lumen');
  if (v.alignment <= -60) out.push('ending_hollow_touched');
  if (f('thesis_hollowstar')) out.push('ending_thesis_hollowstar');
  return [...new Set(out)];
}

// Explores the last day from the engine's current state (at or before month 48's first card), playing each branch to
// its ending. Stops after `max` endings.
function explore(eng, { max = 20000 } = {}) {
  const start = eng.save(), reachable = {}, all = new Set();
  let leaves = 0, truncated = false;
  const want = expected(eng);
  const quiet = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };
  const visit = (state) => {
    if (leaves >= max) { truncated = true; return; }
    eng.load(JSON.parse(state));
    let r = quiet(() => eng.advance());
    while (r.kind === 'month' || r.kind === 'map') r = quiet(() => (r.kind === 'map' ? (eng.pickPlaces(null), eng.advance()) : eng.advance()));
    if (r.kind === 'ending') {
      leaves++;
      for (const b of (eng.s.ended && eng.s.ended.book) || []) { const slot = (eng.c.endings[b.id] || {}).slot || 'headline'; (reachable[slot] = reachable[slot] || new Set()).add(b.id); all.add(b.id); }
      return;
    }
    const here = eng.save();
    for (const key of picksOf(eng, r.view)) {
      eng.load(JSON.parse(here)); quiet(() => eng.advance());
      quiet(() => eng.choose(key));
      visit(eng.save());
    }
  };
  visit(start);
  eng.load(JSON.parse(start));
  return { leaves, truncated, reachable, expected: want, missing: want.filter((id) => !all.has(id)) };
}

module.exports = { explore, expected, picksOf };
