#!/usr/bin/env node
// Economy report (design §8.2): where every attribute comes from and goes to, per play style.
//   node tools/economy.js [--games N] [--styles random,balanced,social] [--keys health,mood,gold] [--top 8] [--origin hedge] [--json]
// Plays N simulated games per style and splits each key's flow into sources: month hooks and states by
// their label, cards by kind (track/place/plan/social/ambient/story/crisis…), per game. Also prints the
// final-value spread (p10/p50/p90) and the share of games ended early, by ending.
'use strict';
const Engine = require('../src/engine.js');
const Policies = require('./policies.js');
const { project } = require('./project.js');
const path = require('path');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const GAMES = +arg('games', 40);
const STYLES = arg('styles', 'random,balanced,social,cautious').split(',');
const TOP = +arg('top', 8);
const ORIGIN = arg('origin', null);   // every game starts from this origin (e.g. --origin hedge)
const ROOT = path.join(__dirname, '..');
const { content } = project(ROOT).compileAll();
const KEYS = arg('keys', null) ? arg('keys').split(',') : [...Object.keys(content.resources), ...Object.keys(content.skills), 'rel', 'spark'];

function play(seed, style) {
  const eng = new Engine(content);
  let r = Policies.newGame(eng, ORIGIN ? Object.assign({}, style, { pickOrigin: () => ORIGIN }) : style, { seed, name: 'Eco' });
  for (let i = 0; i < 8000 && r.kind !== 'ending'; i++) {
    if (r.kind === 'month') { r = eng.advance(); continue; }
    if (r.kind === 'map') { eng.pickPlaces((style.pickPlaces || Policies.pickPlaces)(eng, r.view)); r = eng.advance(); continue; }
    const v = r.view;
    if (v.pick > 1) { const o = v.options.filter((x) => !x.disabled && x.key !== 'none'); eng.choose((style.pickMany || Policies.pickMany)(eng, v, o)); }
    else eng.choose(style.pick(eng, v));
    r = eng.advance();
  }
  return { eng, r };
}
const ix = new Engine(content).directorIndex();
const kindOf = (id) => {
  const e = content.events[id]; if (!e) return 'card:?';
  if (e.class === 'crisis') return 'card:crisis';
  if (e.trigger === 'auto' || e.trigger === 'queued' || e.chain || e.arc) return 'card:story';
  if (e.place) return 'card:place';
  if (e.track || (ix.byTrack && Object.values(ix.byTrack).some((l) => l.includes(e)))) return 'card:track ' + (content.tracks[e.track] ? content.tracks[e.track].kind : 'legacy');
  if (e.plan) return 'card:plan';
  if (e.trigger === 'social') return 'card:social';
  return 'card:ambient';
};
const norm = (k) => (k.startsWith('rel:') ? 'rel' : k.startsWith('spark:') ? 'spark' : k);

const out = {};
const w = console.warn; console.warn = () => {};
for (const name of STYLES) {
  const style = Policies.get(name);
  const flow = {}, finals = {}, ends = {};
  for (let g = 0; g < GAMES; g++) {
    const { eng, r } = play(7001 + g * 7919, style);
    const add = (src, k, v) => { k = norm(k); if (!KEYS.includes(k) || !v) return; const f = flow[k] = flow[k] || {}; const s = f[src] = f[src] || { gain: 0, loss: 0 }; if (v > 0) s.gain += v; else s.loss += v; };
    for (const h of eng.s.hist) {
      if (h.t === 'month') for (const x of h.summary || []) for (const [k, v] of Object.entries(x.deltas || {})) add('month:' + (x.label || '(unlabelled)'), k, v);
      if (h.t === 'pick' && h.deltas) for (const [k, v] of Object.entries(h.deltas)) add('visit:attendance', k, v);
      if (h.t === 'card') for (const part of [h.onShow, h.out]) if (part && part.deltas) for (const [k, v] of Object.entries(part.deltas)) add(kindOf(h.id), k, v);
    }
    for (const k of KEYS) {
      let v;
      if (k === 'rel' || k === 'spark') v = Math.max(0, ...Object.values(eng.s.npcs).map((n) => n[k] || 0));
      else v = eng.s.vals[k];
      (finals[k] = finals[k] || []).push(v || 0);
    }
    const id = r.kind === 'ending' ? r.id : '(none)';
    ends[id] = (ends[id] || 0) + 1;
  }
  out[name] = { flow, finals, ends };
}
console.warn = w;

if (process.argv.includes('--json')) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
for (const [name, { flow, finals, ends }] of Object.entries(out)) {
  console.log('\n=== ' + name + ' (' + GAMES + ' games) ===');
  const early = Object.entries(ends).filter(([id]) => content.endings[id] && content.endings[id].kind === 'early');
  console.log('endings: ' + Object.entries(ends).sort((a, b) => b[1] - a[1]).map(([id, n]) => id.replace('ending_', '') + ' ' + Math.round(100 * n / GAMES) + '%').join(', ') + '  | early ' + Math.round(100 * early.reduce((a, [, n]) => a + n, 0) / GAMES) + '%');
  for (const k of KEYS) {
    const f = flow[k] || {};
    const rows = Object.entries(f).map(([src, s]) => [src, s.gain / GAMES, s.loss / GAMES]);
    const gain = rows.reduce((a, r) => a + r[1], 0), loss = rows.reduce((a, r) => a + r[2], 0);
    const fin = finals[k] || [0];
    console.log(`\n${k.padEnd(10)} final p10/p50/p90 ${q(fin, 0.1).toFixed(0)}/${q(fin, 0.5).toFixed(0)}/${q(fin, 0.9).toFixed(0)}   per game: +${gain.toFixed(0)} ${loss.toFixed(0)} = ${(gain + loss).toFixed(0)}` + (k === 'rel' || k === 'spark' ? ' (all characters; final = best character)' : ''));
    rows.sort((a, b) => Math.abs(b[1]) + Math.abs(b[2]) - Math.abs(a[1]) - Math.abs(a[2]));
    for (const r of rows.slice(0, TOP)) console.log('    ' + r[0].slice(0, 40).padEnd(40) + ('+' + r[1].toFixed(1)).padStart(8) + r[2].toFixed(1).padStart(8));
  }
}
