// New threads 1 (docs/threads-1-plan.md), the engine additions: a state's day in term (detention takes the month's
// visits), a recipe slot that names a @pool, and a sized boost (`boost: exam:large`).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/grimoire.js');
const Engine = require('../src/engine.js');
const { sources, quiet } = require('./helpers.js');

const EXTRA = `
@pool t_punish
class: routine
when: has(t_det)

@event t_pun_a
pool: t_punish
title: Punishment A
text: A punishment.
> ok: Serve it
  say: Served.

@event t_pun_b
pool: t_punish
title: Punishment B
text: Another punishment.
> ok: Serve it
  say: Served.

@state t_det
name: Test Detention
kind: debuff
duration: 1
day: morning=courses noon=social:1-2 afternoon=t_punish evening=t_punish night=world:1-2 midnight=special:0-1

@state t_rung
name: Test Tonic
kind: buff
boost: exam

@state t_big
name: Test Elixir
kind: buff
boost: exam:large research:small
`;
const compiled = G.compile(sources.concat([{ path: 't.grim', text: EXTRA }]));
const content = compiled.content;
const fresh = (seed = 5) => { const eng = new Engine(content); quiet(() => eng.newGame({ seed, name: 'T', origin: 'street' })); return eng; };
// Steps the current day to its end without playing cards; returns what each step said.
const runDay = (eng) => { const out = []; for (let k = 0; k < 40 && !eng.s.day.done; k++) out.push(quiet(() => eng.stepDay())); return out; };

test('the content with a day-shaping state compiles', () => {
  assert.deepEqual(compiled.errors.map(String), []);
  assert.equal(content.states.t_det.day[2].source, 't_punish');
});

test('a state with day: shapes next month, not today: both visits become its pool, with no map', () => {
  const eng = fresh();
  assert.equal(eng.phaseOf(), 'term');
  quiet(() => eng.addState('t_det', null, eng.newCtx(null, 'test')));
  assert.equal(eng.s.day.dayState || null, null, 'today keeps its recipe');
  assert.deepEqual(eng.visitSlots(), ['afternoon', 'evening']);
  quiet(() => eng.beginMonth());
  assert.equal(eng.phaseOf(), 'term');
  assert.ok(eng.s.states.t_det, 'still held on the day it shapes');
  assert.equal(eng.s.day.dayState, 't_det');
  assert.deepEqual(eng.visitSlots(), [], 'no visit slot today');
  const steps = runDay(eng);
  assert.ok(!steps.includes('pick'), 'the map never opens');
  const ids = eng.s.deck.map((d) => d.id);
  assert.ok(ids.includes('t_pun_a') && ids.includes('t_pun_b'), 'both punishments dealt: ' + ids.join(','));
  quiet(() => eng.beginMonth());
  assert.ok(!eng.s.states.t_det, 'served its month: gone');
  assert.equal(eng.s.day.dayState, null);
});

test('a pool named by a recipe is drawn by that slot alone, never as a world card', () => {
  const eng = fresh(), ix = eng.directorIndex();
  assert.deepEqual(ix.byRecipePool.t_punish.map((e) => e.id).sort(), ['t_pun_a', 't_pun_b']);
  for (const k of ['ambient', 'slotBound', 'social']) assert.ok(!ix[k].some((e) => e.id.startsWith('t_pun')), k);
});

test('a break keeps its own day: a day-shaping state shapes no break day', () => {
  const eng = fresh();
  eng.s.turn = 5;
  assert.equal(eng.phaseOf(), 'break');
  eng.s.states.t_det = { left: 1, since: 1 };
  assert.equal(eng.dayStateNow(), null);
  assert.ok(eng.recipeFor('t_det').some((r) => r.source === 'visit'), 'a break day still has its visits');
});

test('a sized boost adds its size; the largest counts; a bare kind stays one rung; minigames never', () => {
  const c2 = Object.assign({}, content, { balance: Object.assign({}, content.balance, { tonic: 4, boost_sizes: { small: 4, large: 12 } }) });
  const eng = new Engine(c2); quiet(() => eng.newGame({ seed: 5, name: 'T', origin: 'street' }));
  assert.equal(eng.boost('exam'), 0);
  eng.s.states.t_rung = { left: null, since: 1 };
  assert.equal(eng.boost('exam'), 4);
  eng.s.states.t_big = { left: null, since: 1 };
  assert.equal(eng.boost('exam'), 12, 'the larger boost wins');
  assert.equal(eng.boost('research'), 4);
  assert.equal(eng.boost('negotiate'), 0);
});
