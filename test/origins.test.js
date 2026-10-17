// Origins (docs/origin-design.md, 2026-10-16): starting levels and purses, tuition for all, the funding cards and
// `term_gpa`. These run against the real content.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../src/engine.js');
const Policies = require('../tools/policies.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');

const { content } = project(ROOT).compileAll();
const quiet = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };
const ORIGINS = ['noble', 'scholar', 'hedge', 'street', 'merchant'];
const DESIGN = {
  noble: { levels: { charm: 25, lore: 12 }, purse: 90 },
  scholar: { levels: { lore: 28, arcana: 12 }, purse: 60 },
  hedge: { levels: { alchemy: 30, arcana: 15, lore: 6 }, purse: 45 },
  street: { levels: { guile: 30, vigor: 18 }, purse: 38 },
  merchant: { levels: { charm: 25, guile: 15 }, purse: 150 },
};
const FUNDING = { noble: 'noble_letter', scholar: 'scholarship_award', merchant: 'trading_report' };

// A fresh game's state before any charge, with the origin applied: newGame applies it before month 1's hooks, and
// its own deltas are the summary item it leaves.
function started(origin) {
  const eng = new Engine(content);
  quiet(() => eng.newGame({ seed: 5, name: 'O', origin }));
  return eng;
}

test('origins: starting skill levels and purses, before charges (XP grants calibrated to xp_cost)', () => {
  for (const o of ORIGINS) {
    const eng = started(o), d = DESIGN[o];
    for (const [k, v] of Object.entries(content.skills)) {
      const want = d.levels[k] != null ? d.levels[k] : v.start;
      // Skills only move by XP before the first card, so month 1's charges don't touch them. If xp_cost changes,
      // the grants in balance.grim (origin_*_start) must be recalibrated: this fails first.
      assert.ok(Math.abs(eng.s.vals[k] - want) < 0.01, o + ': ' + k + ' ' + eng.s.vals[k] + ', want ' + want);
      assert.ok(eng.s.vals[k] <= 30, o + ': ' + k + ' above the starting cap of 30');
    }
    // The purse is the base plus the origin's grant: replay the origin on a bare state to read it before charges.
    const bare = new Engine(content);
    quiet(() => bare.newGame({ seed: 5, name: 'O' }));
    bare.s.vals.gold = content.resources.gold.start;
    for (const k of Object.keys(content.skills)) bare.s.vals[k] = content.skills[k].start;
    bare.applyOrigin(o);
    assert.equal(bare.s.vals.gold, d.purse, o + ': purse');
  }
});

test('origins: no monthly origin money, no scholar study at the start, the same tuition for everyone', () => {
  for (const o of ORIGINS) {
    const st = content.states['origin_' + o];
    assert.ok(!st.tick || !st.tick.length, o + ' has no tick');
    const eng = new Engine(content);
    const r = quiet(() => eng.newGame({ seed: 5, name: 'O', origin: o }));
    for (const t of Object.values(eng.s.tracks || {})) assert.ok(!t.study, o + ': no exam preparation before enrolment');
    const tuition = (r.summary || []).find((x) => x && x.label === 'Tuition');
    assert.ok(tuition, o + ': month 1 charges tuition');
    assert.equal(tuition.deltas.gold, -16, o + ': tuition');
  }
  const hook = content.hooks.tuition;
  let golds = []; require('../src/grimoire.js').walkEffects(hook.do, (s) => { if (s.t === 'delta' && s.name === 'gold') golds.push(s.min); });
  assert.deepEqual(golds, [-16]);
});

test('origins: funding cards come in the last break month before terms 2–8, never at graduation', () => {
  const want = [6, 12, 18, 24, 30, 36, 42];
  for (const [o, id] of Object.entries(FUNDING)) {
    const eng = started(o), e = content.events[id];
    const turns = [];
    for (let t = 1; t <= eng.maxTurns; t++) { eng.s.turn = t; if (eng.test(e.when, null)) turns.push(t); }
    assert.deepEqual(turns, want, id);
    assert.ok(e.repeat <= 6, id + ': repeat lets it come every six months');
  }
  for (const o of ['hedge', 'street']) for (const id of Object.values(FUNDING)) {
    const eng = started(o); eng.s.turn = 6; assert.ok(!eng.test(content.events[id].when, null), o + ' gets no ' + id);
  }
});

test('origins: the funding card arrives at home too, at every date, and pays by its roll', () => {
  const home = (base) => Object.assign({}, base, { pick: (eng, v) => (v.id === 'break_plan' && v.options.some((x) => x.key === 'home' && !x.disabled) ? 'home' : base.pick(eng, v)), pickOrigin: () => 'merchant' });
  const pays = new Set();
  for (let seed = 11; seed < 15; seed++) {
    const { eng } = quiet(() => Policies.play(new Engine(content), home(Policies.get('balanced')), { seed, name: 'M', maxSteps: 6000 }));
    const cards = eng.s.hist.filter((h) => h.t === 'card' && h.id === 'trading_report');
    const breaks = eng.s.hist.filter((h) => h.t === 'card' && h.id === 'break_plan').length;
    assert.ok(breaks > 0 && eng.s.choices.break_plan === 'home', 'seed ' + seed + ' spent its breaks at home');
    assert.deepEqual(cards.map((h) => h.turn), [6, 12, 18, 24, 30, 36, 42].filter((t) => t <= eng.s.turn), 'seed ' + seed);
    for (const h of cards) pays.add((h.out && h.out.deltas && h.out.deltas.gold) || 0);
  }
  assert.ok(pays.has(0) && pays.has(78), 'both trading outcomes: ' + [...pays]);
});

test('origins: the noble allowance always pays, with the gift on top sometimes, and costs Mood', () => {
  const seen = new Set();
  for (let seed = 21; seed < 25; seed++) {
    const { eng } = quiet(() => Policies.play(new Engine(content), Object.assign({}, Policies.get('balanced'), { pickOrigin: () => 'noble' }), { seed, name: 'N', maxSteps: 6000 }));
    for (const h of eng.s.hist) if (h.t === 'card' && h.id === 'noble_letter' && h.out) { seen.add(h.out.deltas.gold); assert.ok(h.out.deltas.mood < 0, 'expectations cost mood'); }
  }
  assert.ok(seen.has(38) && seen.has(49) && [...seen].every((g) => g === 38 || g === 49), [...seen].join(','));
});

test('origins: a drawn funding card keeps its roll across save and reload', () => {
  const { eng } = quiet(() => Policies.play(new Engine(content), Object.assign({}, Policies.get('balanced'), { pickOrigin: () => 'merchant' }), { seed: 31, name: 'R', maxSteps: 6000, stop: (e) => !!(e.s.cur && e.s.cur.id === 'trading_report') }));
  assert.equal(eng.s.cur.id, 'trading_report');
  const flag = !!eng.s.flags.trade_good, text = eng.view(eng.s.cur).text;
  const again = new Engine(content); again.load(eng.save());
  assert.equal(!!again.s.flags.trade_good, flag);
  assert.equal(again.view(again.s.cur).text, text);
  const out = again.choose('ok');
  assert.equal(out.deltas.gold || 0, flag ? 78 : 0);
});

test('term_gpa: the latest completed term only, appeals included; no grades is 0; gpa stays cumulative', () => {
  const eng = started('scholar');
  const stipend = () => { const ctx = eng.newCtx(null, null, 'scholarship_award'); eng.run(content.events.scholarship_award.options[0].effects, ctx); return ctx.deltas.gold || 0; };
  eng.s.turn = 6;   // the winter break: term 1 is complete
  const term = (gs) => { eng.s.termGrades = { 1: gs.map((g, i) => ({ track: 'c' + i, level: 1, grade: g })) }; };
  term(['A', 'B']); assert.equal(eng.termGpa(), 3.5); assert.equal(stipend(), 46);
  term(['A', 'A', 'B', 'C']); assert.equal(eng.termGpa(), 3.25); assert.equal(stipend(), 38);
  term(['B', 'B']); assert.equal(eng.termGpa(), 3); assert.equal(stipend(), 38);
  term(['B', 'B', 'C']); assert.equal(eng.termGpa(), 2.67); assert.equal(stipend(), 0);
  term([]); assert.equal(eng.termGpa(), 0); assert.equal(stipend(), 0);
  eng.s.termGrades = {}; assert.equal(eng.termGpa(), 0);
  // An appeal's regrade rewrites the term's record, and only the latest completed term counts.
  eng.s.tracks.evocation = { kind: 'course', status: 'failed', level: 1, grades: ['F'], passed: { 1: 'F' } };
  eng.s.termGrades = { 1: [{ track: 'evocation', level: 1, grade: 'F' }, { track: 'alchemy', level: 1, grade: 'A' }] };
  assert.equal(eng.termGpa(), 2);
  eng.run([{ t: 'regrade', track: 'evocation', grade: 'C' }], eng.newCtx(null, null, 'grade_appeal'));
  assert.equal(eng.termGpa(), 3);
  eng.s.turn = 12; eng.s.termGrades[2] = [{ track: 'alchemy', level: 2, grade: 'A' }];
  assert.equal(eng.termGpa(), 4);
  assert.notEqual(eng.gpa(), eng.termGpa(), 'gpa is cumulative over every course');
  // In the middle of a term, the latest completed term is the one before.
  eng.s.turn = 14; assert.equal(eng.termGpa(), 4);
});
