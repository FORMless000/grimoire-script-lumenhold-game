// The check ladder (docs/authoring/checks.md, design §8.6): rungs, odds by nature, luck, drift, circumstance steps,
// course standards, `chance <word>`, and the legacy tiers left as they were.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/grimoire.js');
const Engine = require('../src/engine.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');

const { content } = project(ROOT).compileAll();

// The statements of one option, parsed from source.
function stmts(body) {
  const src = '@event t_checks\nclass: routine\ntext: x\n> left: A\n' + body.split('\n').map((l) => '  ' + l).join('\n') + '\n';
  const ev = G.parseFile(src, 't.grim')[0];
  const out = []; G.walkEffects(ev.options[0].effects, (st) => out.push(st));
  return out;
}
const one = (line) => stmts(line + '\n  win:\n    mood +tiny\n  lose:\n    mood -tiny')[0];
function eng(turn, skill) {
  const e = new Engine(content); e.newGame({ seed: 3, name: 'T' }); e.s.turn = turn;
  for (const k of Object.keys(content.skills)) e.s.vals[k] = skill;
  e.s.spells = {};
  return e;
}

test('ladder challenges parse; legacy ones parse as before', () => {
  const a = one('challenge negotiate using charm master- unlikely wild drift low +1 if renown >= 60 -1 if season == "winter":');
  assert.equal(a.ladder, true); assert.equal(a.rung, 'master-'); assert.equal(a.odds, 'unlikely'); assert.equal(a.swing, 'wild'); assert.equal(a.drift, 'low');
  assert.deepEqual(a.steps.map((x) => [x.n, x.cond.src]), [[1, 'renown >= 60'], [-1, 'season == "winter"']]);
  const b = one('challenge duel vs lyra.arcana +2 luck:');
  assert.deepEqual(b.vs, { who: 'lyra', stat: 'arcana' }); assert.equal(b.offset, 2); assert.equal(b.swing, 'luck'); assert.equal(b.rung, null);
  const c = one('challenge brew standard-1 normal:');
  assert.equal(c.standard, true); assert.equal(c.offset, -1); assert.equal(c.swing, null);
  const d = one('challenge spell using arcana hard wild:');
  assert.equal(d.ladder, undefined); assert.equal(d.tier, 'hard'); assert.equal(d.swing, 'wild');
  assert.throws(() => one('challenge spell adept sideways:'), /unexpected "sideways"/);
  assert.throws(() => one('challenge spell:'), /expected a difficulty/);
  const ch = stmts('chance likely +1 if spark(lyra) >= 30:\n  mood +tiny\nqueue t_checks in 2 chance slim')
  assert.equal(ch[0].word, 'likely'); assert.equal(ch[0].steps.length, 1);
  assert.equal(ch.find((x) => x.t === 'queue').chanceWord, 'slim');
  assert.equal(stmts('chance 40:\n  mood +tiny')[0].p.src, '40');
});

test('the bell: odds by nature at matched skill, luck words as σ, floor and ceiling', () => {
  const story = 'bell_drowned';   // class story: drift none, so the DC is the rung
  const e = eng(24, 40);           // adept = 40
  assert.equal(e.challengeOdds(one('challenge research adept:'), null, story).win, 50);
  assert.equal(e.challengeOdds(one('challenge research adept likely:'), null, story).win, 69);   // 2 + 96 × .70
  assert.equal(e.challengeOdds(one('challenge research adept freak:'), null, story).win, 3);
  e.s.vals.lore = 80;                                                                             // +40 over the DC
  assert.equal(e.challengeOdds(one('challenge research adept luck:'), null, story).win, 68);     // Φ(40/80) = .69
  assert.equal(e.challengeOdds(one('challenge research adept steady:'), null, story).win, 98);   // the ceiling
  e.s.vals.lore = 0;
  assert.equal(e.challengeOdds(one('challenge research adept steady:'), null, story).win, 2);    // the floor
  assert.equal(e.challengeOdds(one('challenge negotiate using lore adept steady:'), null, 'thesis_defence').win, 0);   // a milestone runs 0–100
});

test('drift pulls the DC toward the expected skill, by significance', () => {
  const e = eng(48, 30), E = e.expectedSkill(48), m = 64;   // master
  assert.equal(e.challengeOdds(one('challenge research master:'), null, 'bell_drowned').dc, m);                      // story: none
  assert.equal(e.challengeOdds(one('challenge research master:'), null, 'life_injury_stairs').dc, m + 0.5 * (E - m)); // routine: high
  assert.equal(e.challengeOdds(one('challenge research master:'), null, 'thesis_defence').dc, m + 0.15 * (E - m));   // milestone: low
  assert.equal(e.challengeOdds(one('challenge research master drift mid:'), null, 'bell_drowned').dc, m + 0.3 * (E - m));
  // A hard check with high drift is never worse than the same check with none (the DC moves toward the player).
  const hi = e.challengeOdds(one('challenge research grandmaster+ drift high:'), null, 'bell_drowned').win;
  const no = e.challengeOdds(one('challenge research grandmaster+:'), null, 'bell_drowned').win;
  assert.ok(hi > no);
});

test('vs reads the character; course cards read the standard and step up above their level', () => {
  const e = eng(12, 20);
  const lyra = content.npcs.lyra.stats.arcana;
  assert.equal(e.challengeOdds(one('challenge duel using arcana vs lyra.arcana +2:'), null, 'bell_drowned').dc, lyra + 8);
  // illu_spot_the_coin is an Illusion card at level 1: the standard there is apprentice+ (20); in level III, +6 rungs.
  e.s.tracks.illusion = { kind: 'course', status: 'enrolled', level: 1, study: 0, grades: [], passed: {} };
  e._ctxTrack = 'illusion';
  const st = one('challenge deceive standard:');
  const at1 = e.challengeOdds(st, null, 'illu_spot_the_coin').dc;
  e.s.tracks.illusion.level = 3;
  const at3 = e.challengeOdds(st, null, 'illu_spot_the_coin').dc;
  assert.equal(at1, 20 + 0.5 * (e.expectedSkill() - 20));
  assert.equal(at3, 44 + 0.5 * (e.expectedSkill() - 44));
  // A track's own standard overrides the default.
  assert.equal(e.courseStandard('artifice', 1), 52);
});

test('circumstance steps move the odds by nature; chance <word> rolls them', () => {
  const e = eng(24, 40);
  const st = one('challenge research adept +1 if renown >= 0:');
  assert.equal(e.challengeOdds(st, null, 'bell_drowned').win, 68);   // even + one step: 2 + 96 × Φ(0.5)
  assert.equal(e.likelihoodP('likely'), 70);
  assert.equal(e.likelihoodP('likely', [{ n: 1, cond: { fn: () => true } }]), 85);
  assert.equal(e.likelihoodP('slim', [{ n: -1, cond: { fn: () => false } }]), 15);
});

test('legacy tiers keep the old formula', () => {
  const e = eng(24, 50), E = e.expectedSkill(24);
  const r = e.challengeOdds(one('challenge research hard:'), null, 'bell_drowned');
  assert.equal(r.dc, E + 8);
  assert.equal(r.win, Math.max(5, Math.min(95, Math.round(50 + 2.5 * (50 - (E + 8))))));
});

test('exams on the ladder: the course standard with low drift, less study', () => {
  const c2 = Object.assign({}, content, { balance: Object.assign({}, content.balance, { exam_tiers: ['standard+1', 'standard+1', 'standard+1'] }) });
  const e = new Engine(c2); e.newGame({ seed: 3, name: 'T' }); e.s.turn = 10;
  e.s.tracks.illusion = { kind: 'course', status: 'enrolled', level: 1, study: 6, grades: [], passed: {} };
  const bar = e.examBar('illusion', 1), base = 24;   // apprentice+ (20) + 1 rung
  assert.equal(bar, base + 0.15 * (e.expectedSkill() - base));
  const o = e.examOdds('illusion', null);
  assert.equal(o.bar, bar - 6);
  assert.ok(o.pass > 0 && o.pass <= 100);
});

test('the odds tool prints every check and roll', () => {
  const text = require('../tools/odds.js').odds(content, ['midnight_boathouse_ring']);
  assert.match(text, /challenge combat adept-\s+\d+ \d+ \d+ \d+\s+\d+ \d+ \d+ \d+/);
  assert.match(text, /chance even\s+50%/);
});
