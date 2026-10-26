// Investigation helper: the Hollow Star funnel and alignment per play style.
//   node tools/hs-funnel.js [games=60] [styles=random,balanced,social,lumen,hollow,plot] [--no-fights|--lose-fights]
// Per style: alignment p10/p50/p90 and how often ±30/±60 were crossed; clues(hollowstar); how many reached the Night and
// what they chose there and beneath the lake; the yearbook (headline, mystery, personal lines). Not part of verify.
// v2 (docs/plots/hollowstar-v2.md): the month each act opened (p50, clock 4 / 7 / 10 / 12), the early descent, who came
// down, and how the Night's scenes went. --no-fights never picks an option with a fight while another is open;
// --lose-fights loses every fight: the plot must stay reachable either way (decision 2026-10-26).
'use strict';
const path = require('path');
const R = path.join(__dirname, '..');
const Engine = require(R + '/src/engine.js'), Policies = require(R + '/tools/policies.js'), { project } = require(R + '/tools/project.js');
const { content } = project(R).compileAll();
console.warn = () => {};
const args = process.argv.slice(2).filter((a) => !a.startsWith('--')), flags = process.argv.slice(2).filter((a) => a.startsWith('--'));
const NO_FIGHTS = flags.includes('--no-fights'), LOSE = flags.includes('--lose-fights');
const N = +args[0] || 60, styles = (args[1] || 'random,balanced,social,lumen,hollow,plot').split(',');
const G = require(R + '/src/grimoire.js');
const fights = (eng, v, key) => { const def = eng.optionsOf(eng.c.events[v.id]).find((o) => o.key === key); let f = false; if (def) G.walkEffects(def.effects, (st) => { if (st.t === 'challenge' && (st.kind === 'combat' || st.kind === 'duel')) f = true; }); return f; };
const noFights = (b) => Object.assign({}, b, { pick: (eng, v) => { const ok = v.options.filter((o) => !o.disabled && !fights(eng, v, o.key)); return ok.length ? b.pick(eng, Object.assign({}, v, { options: ok })) : b.pick(eng, v); } });
const pct = (n) => Math.round(100 * n / N) + '%';
const q = (a, p) => { const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(p * b.length))]; };
const fmt = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => k.replace(/^ending_/, '') + ' ' + pct(v)).join(', ');
function play(seed, style) {
  const picks = {}, opened = {}; let lo = 0, hi = 0;
  const e0 = new Engine(content);
  if (LOSE) e0.fights = (req) => ({ outcome: 'lose', request: req.id, deltas: {} });
  const { eng, r } = Policies.play(e0, NO_FIGHTS ? noFights(style) : style, { seed, name: 'H', after: (e, v, k) => {
    if (/^(hs_|align_|ilse_grey)/.test(v.id)) picks[v.id] = k;
    const a = e.s.vals.alignment; lo = Math.min(lo, a); hi = Math.max(hi, a);
    const c = (e.s.arcs.hollowstar || {}).clock || 0;
    for (const t of [4, 7, 10, 12]) if (c >= t && opened[t] == null) opened[t] = e.s.turn;
  } });
  return { eng, r, picks, lo, hi, opened };
}
for (const sn of styles) {
  const st = Policies.get(sn); const T = { al: [], clues: [], m30: 0, m60: 0, p30: 0, p60: 0, night: {}, beneath: {}, head: {}, myst: {}, pers: {}, rel: {}, early: {}, align: 0, opened: { 4: [], 7: [], 10: [], 12: [] }, v2: {} };
  for (let g = 0; g < N; g++) {
    const { eng, r, picks, lo, hi, opened } = play(1000 + g * 7, st); const s = eng.s;
    for (const t of [4, 7, 10, 12]) if (opened[t] != null) T.opened[t].push(opened[t]);
    const tick = (k) => { T.v2[k] = (T.v2[k] || 0) + 1; };
    for (const f of ['hs_early', 'night_kael', 'night_ilse', 'night_maud', 'night_isolde', 'cult_broken', 'shadow_beaten', 'key_taken', 'ilse_taken', 'ilse_saved', 'star_key', 'gave_star_key']) if (s.flags[f]) tick(f);
    if (picks.hs_night_company === 'alone') tick('night_alone');
    if (picks.hs_the_night_above) tick('night_above');
    if ((s.arcs.hollowstar || {}).closed != null) tick('closed');
    T.al.push(s.vals.alignment); T.clues.push(((content.arcs.hollowstar || {}).clues || []).filter((k) => (s.clues || {})[k] != null).length);
    if (lo <= -30) T.m30++; if (lo <= -60) T.m60++; if (hi >= 30) T.p30++; if (hi >= 60) T.p60++;
    if (Object.keys(picks).some((k) => k.startsWith('align_'))) T.align++;
    if (picks.hs_the_night) T.night[picks.hs_the_night] = (T.night[picks.hs_the_night] || 0) + 1;
    if (picks.hs_beneath) { const k = picks.hs_beneath + (picks.hs_beneath === 'seal' ? (s.flags.hollow_failed ? ':failed' : ':held') : ''); T.beneath[k] = (T.beneath[k] || 0) + 1; }
    for (const k of ['hs_tunnel', 'hs_threshold']) if (picks[k]) T.beneath[k + ':' + picks[k] + (s.flags[k === 'hs_tunnel' ? 'hs_tunnel_clear' : 'hs_threshold_read'] ? '+' : '-')] = (T.beneath[k + ':' + picks[k] + (s.flags[k === 'hs_tunnel' ? 'hs_tunnel_clear' : 'hs_threshold_read'] ? '+' : '-')] || 0) + 1;
    if (r.early) T.early[r.id] = (T.early[r.id] || 0) + 1; else T.head[r.id] = (T.head[r.id] || 0) + 1;
    for (const y of r.yearbook || []) { const b = y.slot === 'mystery' ? T.myst : y.slot === 'personal' ? T.pers : T.rel; if (b) b[y.id] = (b[y.id] || 0) + 1; }
  }
  console.log('\n' + sn + ': alignment p10/p50/p90 ' + q(T.al, 0.1) + '/' + q(T.al, 0.5) + '/' + q(T.al, 0.9) + ' · reached ≤−30 ' + pct(T.m30) + ' ≤−60 ' + pct(T.m60) + ' ≥30 ' + pct(T.p30) + ' ≥60 ' + pct(T.p60) + ' · saw align_ events ' + pct(T.align) + ' · clues p50 ' + q(T.clues, 0.5));
  console.log('  acts opened (turn p50, reached): ' + [4, 7, 10, 12].map((t) => 'clock ' + t + ' ' + (T.opened[t].length ? q(T.opened[t], 0.5) : '-') + ' (' + pct(T.opened[t].length) + ')').join(', '));
  console.log('  v2: ' + (fmt(T.v2) || '-'));
  console.log('  night ' + JSON.stringify(T.night) + ' beneath ' + JSON.stringify(T.beneath) + ' · early: ' + (fmt(T.early) || '-'));
  console.log('  headline: ' + fmt(T.head));
  console.log('  bonds: ' + (fmt(T.rel) || '-'));
  console.log('  mystery:  ' + fmt(T.myst) + ' · personal: ' + (fmt(T.pers) || '-'));
}
