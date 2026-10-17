// Bedtime (2026-10-17): every ordinary month ends with one night's sleep, the steady source of Health and Mood.
// night_out's "Sleep" on campus once the night is open; night_sleep everywhere else. No passive month-start rest.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../src/engine.js');
const Policies = require('../tools/policies.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');

const { content } = project(ROOT).compileAll();
const quiet = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };
const BED = new Set(['night_out', 'night_sleep']);
const fresh = (seed = 5, origin = 'street') => { const eng = new Engine(content); quiet(() => eng.newGame({ seed, name: 'T', origin })); return eng; };

// Plays a card already set as current and returns the outcome.
const play = (eng, id, key, extra) => { eng.s.cur = Object.assign({ id, actor: null }, extra || {}); eng.s.last[id] = eng.s.turn; return quiet(() => eng.choose(key)); };

test('bedtime: exactly one bedtime card in every completed ordinary month, for every style, and none on the last day', () => {
  const styles = ['balanced', 'random', 'social', 'nightowl', 'truant', 'cautious'];
  let months = 0, home = 0, away = 0;
  for (const style of styles) for (let seed = 41; seed < 44; seed++) {
    const { eng } = quiet(() => Policies.play(new Engine(content), Policies.get(style), { seed, name: 'B', maxSteps: 8000 }));
    const cards = eng.s.hist.filter((h) => h.t === 'card');
    const last = eng.s.ended ? Math.max(...cards.map((h) => h.turn)) : eng.s.turn;
    for (let t = 1; t < Math.min(last, eng.maxTurns); t++) {
      const bed = cards.filter((h) => h.turn === t && BED.has(h.id));
      assert.equal(bed.length, 1, style + ' seed ' + seed + ' turn ' + t + ': ' + bed.map((h) => h.id).join(',') + ' (ended ' + (eng.s.ended && eng.s.ended.id) + ')');
      months++;
      const h = bed[0], d = (h.out && h.out.deltas) || {};
      if (h.id === 'night_out' && h.choice === 'right') { assert.ok(!(d.health > 0) && !(d.mood > 0), 'going out gives no rest: ' + JSON.stringify(d)); }
    }
    assert.ok(!cards.some((h) => h.turn >= eng.maxTurns && BED.has(h.id)), 'no bedtime on the final day');
    home += cards.filter((h) => h.id === 'night_sleep' && h.out && h.out.deltas && (h.out.deltas.health === 20 || h.out.deltas.mood === 10)).length;
    away += cards.filter((h) => h.id === 'night_sleep').length;
  }
  assert.ok(months > 400, 'months checked: ' + months);
  assert.ok(away > 0 && home > 0, 'night_sleep shows, home sleep pays more somewhere: ' + away + ' / ' + home);
});

test('bedtime: the sleep amounts, at home and elsewhere, clamped at the maximum, and sickness or injury don\'t block them', () => {
  const eng = fresh();
  eng.s.turn = 2; eng.s.vals.health = 50; eng.s.vals.mood = 50;
  let out = play(eng, 'night_sleep', 'ok');
  assert.equal(out.deltas.health, 8); assert.equal(out.deltas.mood, 4);
  eng.s.vals.health = 50; eng.s.vals.mood = 50;
  out = play(eng, 'night_out', 'left');
  assert.equal(out.deltas.health, 8, 'night_out\'s Sleep is the same preset'); assert.equal(out.deltas.mood, 4);
  eng.s.turn = 5; assert.equal(eng.phaseOf(), 'break');
  quiet(() => eng.run([{ t: 'gain', state: 'plan_home', dur: null }], eng.newCtx(null, null)));
  eng.s.vals.health = 50; eng.s.vals.mood = 50;
  out = play(eng, 'night_sleep', 'ok');
  assert.equal(out.deltas.health, 20, 'home'); assert.equal(out.deltas.mood, 10);
  eng.s.vals.health = 95; eng.s.vals.mood = 97;
  out = play(eng, 'night_sleep', 'ok');
  assert.equal(eng.s.vals.health, 100); assert.equal(eng.s.vals.mood, 100); assert.equal(out.deltas.health, 5); assert.equal(out.deltas.mood, 3);
  // an internship break: the ordinary amount
  const intern = fresh(); intern.s.turn = 11;
  quiet(() => intern.run([{ t: 'gain', state: 'plan_internship', dur: null }], intern.newCtx(null, null)));
  intern.s.vals.health = 40; intern.s.vals.mood = 40;
  out = play(intern, 'night_sleep', 'ok');
  assert.equal(out.deltas.health, 8); assert.equal(out.deltas.mood, 4);
  // sick and injured still rest; the conditions stay
  const ill = fresh(); ill.s.turn = 3;
  quiet(() => ill.run([{ t: 'gain', state: 'sick', dur: null }, { t: 'gain', state: 'injured', dur: null }], ill.newCtx(null, null)));
  ill.s.vals.health = 30; ill.s.vals.mood = 30;
  out = play(ill, 'night_sleep', 'ok');
  assert.equal(out.deltas.health, 8); assert.equal(out.deltas.mood, 4);
  assert.ok(ill.s.states.sick && ill.s.states.injured, 'sleep cures nothing');
});

test('bedtime: going out costs nothing at the door and rests nothing; the fallback steps aside that night', () => {
  const eng = fresh(); eng.s.turn = 8; eng.s.flags.night_unlocked = true; eng.s.vals.health = 50; eng.s.vals.mood = 50;
  eng.s.day = null; eng.s.deck = [{ id: 'night_sleep', actor: null, src: 'auto' }];
  eng.s.cur = { id: 'night_out', actor: null, src: 'auto' }; eng.s.seen.night_out = 1; eng.s.last.night_out = eng.s.turn;
  const out = quiet(() => eng.choose('right'));
  assert.ok(!out.deltas.health && !out.deltas.mood, 'no entrance cost: ' + JSON.stringify(out.deltas));
  const r = quiet(() => eng.advance());
  assert.ok(!(r.kind === 'card' && r.view.id === 'night_sleep'), 'no sleep after going out');
  assert.ok(!eng.s.hist.some((h) => h.t === 'card' && h.id === 'night_sleep' && h.turn === 8), 'the fallback never showed');
});

test('bedtime: a lockout earlier in the day drops the night card, and the fallback puts you to bed instead', () => {
  const eng = fresh(); eng.s.turn = 8; eng.s.flags.night_unlocked = true;
  eng.s.day = null; eng.s.deck = [{ id: 'night_out', actor: null, src: 'auto' }, { id: 'night_sleep', actor: null, src: 'auto' }];
  quiet(() => eng.run([{ t: 'gain', state: 'locked_out', dur: null }], eng.newCtx(null, null)));
  const r = quiet(() => eng.advance());
  assert.equal(r.kind, 'card'); assert.equal(r.view.id, 'night_sleep');
  assert.match(r.view.text, /lock|Bram|Locked/i, 'the lockout line');
  const e2 = fresh(); e2.s.turn = 8; e2.s.flags.night_unlocked = true;
  e2.s.day = null; e2.s.deck = [{ id: 'night_out', actor: null, src: 'auto' }, { id: 'night_sleep', actor: null, src: 'auto' }];
  const r2 = quiet(() => e2.advance());
  assert.equal(r2.view.id, 'night_out', 'not locked out: the night card first');
  quiet(() => e2.choose('left'));
  const r3 = quiet(() => e2.advance());
  assert.ok(!(r3.kind === 'card' && r3.view.id === 'night_sleep'), 'one bedtime only');
});

test('bedtime: no passive rest at month start, in summaries or forecasts', () => {
  assert.ok(!content.hooks.natural_recovery, 'the natural_recovery hook is gone');
  for (const h of Object.values(content.hooks)) if (h.on === 'month_start') {
    let partner = false; require('../src/grimoire.js').walkAst((h.when && h.when.ast) || null, (n) => { if (n.t === 'call' && /bond/.test(n.n)) partner = true; });
    assert.ok(!partner, h.id + ': no standing mood from a partner');
  }
  const eng = fresh(); eng.s.turn = 3; eng.s.vals.health = 40;
  assert.ok(!eng.upcoming().some((x) => x.label === 'Rest'), 'no Rest in the forecast');
  const { eng: played } = quiet(() => Policies.play(new Engine(content), Policies.get('balanced'), { seed: 3, name: 'S', maxSteps: 3000 }));
  assert.ok(!played.s.hist.some((h) => h.t === 'month' && (h.summary || []).some((x) => x.label === 'Rest')), 'no Rest line in month summaries');
});

test('bedtime: previewing the sleep option changes nothing, and a save before bedtime rests exactly once after reload', () => {
  const eng = fresh(); eng.s.turn = 2; eng.s.vals.health = 50; eng.s.vals.mood = 50;
  eng.s.day = null; eng.s.deck = [{ id: 'night_sleep', actor: null, src: 'auto' }];
  const r = quiet(() => eng.advance());
  assert.equal(r.view.id, 'night_sleep');
  const opt = r.view.options[0];
  assert.ok(JSON.stringify(opt.affects || opt.preview || {}).includes('health'), 'the preview shows the rest');
  assert.equal(eng.s.vals.health, 50, 'preview applies nothing');
  const again = new Engine(content); again.load(eng.save());
  assert.equal(again.s.cur.id, 'night_sleep'); assert.equal(again.s.vals.health, 50);
  const out = quiet(() => again.choose('ok'));
  assert.equal(out.deltas.health, 8); assert.equal(again.s.vals.health, 58);
  const next = quiet(() => again.advance());
  assert.ok(!(next.kind === 'card' && next.view.id === 'night_sleep'), 'no second rest');
});
