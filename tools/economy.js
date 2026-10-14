#!/usr/bin/env node
// Economy report (design §8.2): where every attribute comes from and goes to, per play style.
//   node tools/economy.js [--games N] [--styles random,balanced,social] [--keys health,mood,gold] [--top 8] [--origin hedge]
//                         [--by kind|event] [--per game|month] [--freq [N]] [--json]
// Plays N simulated games per style and splits each key's flow into sources: month hooks and states by
// their label, cards by kind (track/place/plan/social/ambient/story/crisis…) or, with --by event, by event (with how
// often it is shown), per game or per month played. Also prints the final-value spread (p10/p50/p90), the share of
// games ended early, by ending, and the flow the history doesn't explain ("unaccounted": clamps at a bar's ends and
// anything recorded nowhere; A2). --freq lists the N most and least frequent events per game, with their mean deltas.
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
const BY = arg('by', 'kind'), PER = arg('per', 'game');
const FREQ = process.argv.includes('--freq') ? (+arg('freq', 15) || 15) : 0;
const ROOT = path.join(__dirname, '..');
const { content } = project(ROOT).compileAll();
const KEYS = arg('keys', null) ? arg('keys').split(',') : [...Object.keys(content.resources), ...Object.keys(content.skills), 'rel', 'spark'];

function play(seed, style) {
  return Policies.play(new Engine(content), ORIGIN ? Object.assign({}, style, { pickOrigin: () => ORIGIN }) : style, { seed, name: 'Eco' });
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
  const flow = {}, finals = {}, ends = {}, shown = {}, effect = {};
  let months = 0;
  for (let g = 0; g < GAMES; g++) {
    const { eng, r } = play(7001 + g * 7919, style);
    const add = (src, k, v) => { k = norm(k); if (!KEYS.includes(k) || !v) return; const f = flow[k] = flow[k] || {}; const s = f[src] = f[src] || { gain: 0, loss: 0 }; if (v > 0) s.gain += v; else s.loss += v; };
    const total = {};
    const tally = (src, k, v) => { if (!(k in eng.s.vals)) { add(src, k, v); return; } total[k] = (total[k] || 0) + v; add(src, k, v); };
    for (const h of eng.s.hist) {
      if (h.t === 'month') { months++; for (const x of h.summary || []) for (const [k, v] of Object.entries(x.deltas || {})) tally('month:' + (x.label || x.src || '(unlabelled)'), k, v); }
      if (h.t === 'pick' && h.deltas) for (const [k, v] of Object.entries(h.deltas)) tally('visit:attendance', k, v);
      if (h.t === 'card') {
        shown[h.id] = (shown[h.id] || 0) + 1;
        for (const part of [h.onShow, h.out]) if (part && part.deltas) for (const [k, v] of Object.entries(part.deltas)) {
          tally(BY === 'event' ? h.id : kindOf(h.id), k, v);
          const e = effect[h.id] = effect[h.id] || {}; e[k] = (e[k] || 0) + v;
        }
      }
    }
    // What the history doesn't explain (A2): the change from the first recorded values, minus every recorded delta.
    const first = {}; for (const k of [...Object.keys(content.resources), ...Object.keys(content.skills)]) first[k] = (content.resources[k] || content.skills[k]).start || 0;
    for (const k of KEYS) if (k in eng.s.vals && k in first) { const rest = eng.s.vals[k] - first[k] - (total[k] || 0); if (Math.abs(rest) > 0.01) add('(unaccounted)', k, rest); }
    for (const k of KEYS) {
      let v;
      if (k === 'rel' || k === 'spark') v = Math.max(0, ...Object.values(eng.s.npcs).map((n) => n[k] || 0));
      else v = eng.s.vals[k];
      (finals[k] = finals[k] || []).push(v || 0);
    }
    const id = r.kind === 'ending' ? r.id : '(none)';
    ends[id] = (ends[id] || 0) + 1;
  }
  out[name] = { flow, finals, ends, shown, effect, months };
}
console.warn = w;

if (process.argv.includes('--json')) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
for (const [name, { flow, finals, ends, shown, effect, months }] of Object.entries(out)) {
  const D = PER === 'month' ? months : GAMES;
  console.log('\n=== ' + name + ' (' + GAMES + ' games, ' + (months / GAMES).toFixed(1) + ' months a game; flows per ' + (PER === 'month' ? 'month' : 'game') + ') ===');
  const early = Object.entries(ends).filter(([id]) => content.endings[id] && content.endings[id].kind === 'early');
  console.log('endings: ' + Object.entries(ends).sort((a, b) => b[1] - a[1]).map(([id, n]) => id.replace('ending_', '') + ' ' + Math.round(100 * n / GAMES) + '%').join(', ') + '  | early ' + Math.round(100 * early.reduce((a, [, n]) => a + n, 0) / GAMES) + '%');
  for (const k of KEYS) {
    const f = flow[k] || {};
    const rows = Object.entries(f).map(([src, s]) => [src, s.gain / D, s.loss / D]);
    const gain = rows.reduce((a, r) => a + r[1], 0), loss = rows.reduce((a, r) => a + r[2], 0);
    const fin = finals[k] || [0];
    const dp = PER === 'month' ? 1 : 0;
    console.log(`\n${k.padEnd(10)} final p10/p50/p90 ${q(fin, 0.1).toFixed(0)}/${q(fin, 0.5).toFixed(0)}/${q(fin, 0.9).toFixed(0)}   per ${PER === 'month' ? 'month' : 'game'}: +${gain.toFixed(dp)} ${loss.toFixed(dp)} = ${(gain + loss).toFixed(dp)}` + (k === 'rel' || k === 'spark' ? ' (all characters; final = best character)' : ''));
    rows.sort((a, b) => Math.abs(b[1]) + Math.abs(b[2]) - Math.abs(a[1]) - Math.abs(a[2]));
    for (const r of rows.slice(0, TOP)) console.log('    ' + (r[0] + (BY === 'event' && shown[r[0]] ? ' ×' + (shown[r[0]] / D).toFixed(2) : '')).slice(0, 48).padEnd(48) + ('+' + r[1].toFixed(2)).padStart(9) + r[2].toFixed(2).padStart(9));
  }
  if (FREQ) {
    // Event frequency (A2): shown per game, with the mean change per showing (queued cards at odds are already rolled).
    const ev = Object.entries(shown).sort((a, b) => b[1] - a[1]);
    const line = ([id, n]) => '    ' + (n / GAMES).toFixed(2).padStart(6) + '  ' + id.padEnd(36) + Object.entries(effect[id] || {}).filter(([k]) => KEYS.includes(norm(k))).map(([k, v]) => k + (v >= 0 ? ' +' : ' ') + (v / n).toFixed(1)).join(', ');
    console.log('\n  most frequent (per game):'); ev.slice(0, FREQ).forEach((x) => console.log(line(x)));
    console.log('  least frequent (seen at all):'); ev.slice(-FREQ).forEach((x) => console.log(line(x)));
    const never = Object.keys(content.events).filter((id) => !shown[id]);
    console.log('  never shown: ' + never.length + ' events');
  }
}
