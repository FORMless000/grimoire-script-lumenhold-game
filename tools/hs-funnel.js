// Investigation helper: the Hollow Star funnel and alignment per play style.
//   node tools/hs-funnel.js [games=60] [styles=random,balanced,social,lumen,hollow,plot]
// Per style: alignment p10/p50/p90 and how often ±30/±60 were crossed; clues; how many reached the Night and
// what they chose there and beneath the lake; the yearbook (headline, mystery, personal lines). Not part of verify.
'use strict';
const path = require('path');
const R = path.join(__dirname, '..');
const Engine = require(R + '/src/engine.js'), Policies = require(R + '/tools/policies.js'), { project } = require(R + '/tools/project.js');
const { content } = project(R).compileAll();
console.warn = () => {};
const N = +process.argv[2] || 60, styles = (process.argv[3] || 'random,balanced,social,lumen,hollow,plot').split(',');
const pct = (n) => Math.round(100 * n / N) + '%';
const q = (a, p) => { const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(p * b.length))]; };
const fmt = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => k.replace(/^ending_/, '') + ' ' + pct(v)).join(', ');
function play(seed, style) {
  const eng = new Engine(content); let r = Policies.newGame(eng, style, { seed, name: 'H' }); const picks = {}; let lo = 0, hi = 0;
  for (let i = 0; i < 8000 && r.kind !== 'ending'; i++) {
    if (r.kind === 'month') { r = eng.advance(); continue; }
    if (r.kind === 'map') { eng.pickPlaces((style.pickPlaces || Policies.pickPlaces)(eng, r.view)); r = eng.advance(); continue; }
    const v = r.view; let k;
    if (v.pick > 1) { const o = v.options.filter((x) => !x.disabled && x.key !== 'none'); k = (style.pickMany || Policies.pickMany)(eng, v, o); } else k = style.pick(eng, v);
    if (/^(hs_|align_)/.test(v.id)) picks[v.id] = k;
    eng.choose(k); r = eng.advance();
    const a = eng.s.vals.alignment; lo = Math.min(lo, a); hi = Math.max(hi, a);
  }
  return { eng, r, picks, lo, hi };
}
for (const sn of styles) {
  const st = Policies.get(sn); const T = { al: [], clues: [], m30: 0, m60: 0, p30: 0, p60: 0, night: {}, beneath: {}, head: {}, myst: {}, pers: {}, rel: {}, early: {}, align: 0 };
  for (let g = 0; g < N; g++) {
    const { eng, r, picks, lo, hi } = play(1000 + g * 7, st); const s = eng.s;
    T.al.push(s.vals.alignment); T.clues.push(Object.keys(s.clues || {}).length);
    if (lo <= -30) T.m30++; if (lo <= -60) T.m60++; if (hi >= 30) T.p30++; if (hi >= 60) T.p60++;
    if (Object.keys(picks).some((k) => k.startsWith('align_'))) T.align++;
    if (picks.hs_the_night) T.night[picks.hs_the_night] = (T.night[picks.hs_the_night] || 0) + 1;
    if (picks.hs_beneath) T.beneath[picks.hs_beneath] = (T.beneath[picks.hs_beneath] || 0) + 1;
    if (r.early) T.early[r.id] = (T.early[r.id] || 0) + 1; else T.head[r.id] = (T.head[r.id] || 0) + 1;
    for (const y of r.yearbook || []) { const b = y.slot === 'mystery' ? T.myst : y.slot === 'personal' ? T.pers : T.rel; if (b) b[y.id] = (b[y.id] || 0) + 1; }
  }
  console.log('\n' + sn + ': alignment p10/p50/p90 ' + q(T.al, 0.1) + '/' + q(T.al, 0.5) + '/' + q(T.al, 0.9) + ' · reached ≤−30 ' + pct(T.m30) + ' ≤−60 ' + pct(T.m60) + ' ≥30 ' + pct(T.p30) + ' ≥60 ' + pct(T.p60) + ' · saw align_ events ' + pct(T.align) + ' · clues p50 ' + q(T.clues, 0.5));
  console.log('  night ' + JSON.stringify(T.night) + ' beneath ' + JSON.stringify(T.beneath) + ' · early: ' + (fmt(T.early) || '-'));
  console.log('  headline: ' + fmt(T.head));
  console.log('  bonds: ' + (fmt(T.rel) || '-'));
  console.log('  mystery:  ' + fmt(T.myst) + ' · personal: ' + (fmt(T.pers) || '-'));
}
