// UI pass (feedback 2026-10-19), the engine side: previews past a cap, journal entries that name people, the month's
// fading sparks in one line, club and job spell chains that play two beats a visit, and luck rolls on the button.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../src/engine.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');

const { content } = project(ROOT).compileAll();
const quiet = (fn) => { const w = console.warn, l = console.log; console.warn = console.log = () => {}; try { return fn(); } finally { console.warn = w; console.log = l; } };
function fresh() { const eng = new Engine(content); quiet(() => eng.newGame({ seed: 11, name: 'T', origin: 'street' })); return eng; }
const opt = (id, key) => content.events[id].options.find((o) => o.key === key);

test('a preview shows a gain at the cap; the outcome changes nothing and still fits it', () => {
  const eng = fresh();
  eng.s.vals.mood = eng.resMax(content.resources.mood);
  // A real outcome cut short by the cap fits a preview that recorded it.
  assert.ok(Engine.fits({ paths: [{ p: 1, deltas: { mood: [5, 5] }, over: ['mood'] }] }, {}));
  assert.ok(!Engine.fits({ paths: [{ p: 1, deltas: { mood: [5, 5] }, over: [] }] }, {}));
  // Through change(): a gain at the cap is shown in a preview, and not outside one.
  const ctx = eng.newCtx(null);
  eng._oracle = { branch: () => 0, amount: (a) => a };
  eng.change('mood', 5, ctx);
  eng._oracle = null;
  assert.equal(ctx.deltas.mood, 5);
  assert.ok(ctx.over.mood);
  const real = eng.newCtx(null);
  eng.change('mood', 5, real);
  assert.equal(real.deltas.mood, undefined);
});

test('the journal names the people a card was cast with', () => {
  const eng = fresh();
  eng.s.npcs.lyra.met = true; eng.s.npcs.lyra.rel = 20;
  eng.s.deck.unshift({ id: 'letter_from_a_friend', cast: { friend: 'lyra' }, src: 'debug', force: true });
  let r = quiet(() => eng.advance());
  for (let i = 0; i < 20 && !(r.kind === 'card' && r.view.id === 'letter_from_a_friend'); i++) { if (r.kind === 'card') eng.choose(r.view.options.find((o) => !o.disabled).key); r = quiet(() => eng.advance()); }
  assert.equal(r.view.id, 'letter_from_a_friend');
  eng.choose(r.view.options.find((o) => !o.disabled).key);
  const l = eng.s.log[eng.s.log.length - 1];
  assert.ok(!/\{friend\}/.test(l.title) && /Lyra/.test(l.title), l.title);
  assert.deepEqual(l.cast, { friend: 'lyra' });
  assert.ok(!/\{friend\}/.test(eng.interpLogged(content.events.letter_from_a_friend.title, l)));
});

test('the month sums up fading sparks in one line, and a partnership that ends in its own', () => {
  const eng = fresh();
  for (const id of ['lyra', 'corvin']) Object.assign(eng.s.npcs[id], { met: true, spark: 40, sparked: -5 });
  Object.assign(eng.s.npcs.mir || {}, {});
  const summary = [];
  eng.relationshipDrift(summary);
  const fade = summary.filter((x) => x.src === 'spark fade');
  assert.equal(fade.length, 1);
  assert.ok(fade[0].deltas['spark:lyra'] < 0 && fade[0].deltas['spark:corvin'] < 0);
  Object.assign(eng.s.npcs.lyra, { bond: 'partner', spark: 5, lowSpark: 1 });
  const s2 = []; eng.relationshipDrift(s2);
  const ended = s2.filter((x) => x.src === 'relationship drift');
  assert.equal(ended.length, 1); assert.equal(ended[0].npc, 'lyra');
});

test('a club spell chain plays two beats a visit, and the final comes once two are done', () => {
  const eng = fresh();
  eng.s.turn = 5;
  const ctx = () => eng.newCtx(null, null, null);
  eng.s.deck = [];
  eng.run(opt('duel_dummy_hexes', 'left').effects, ctx());
  assert.equal(eng.s.deck[0] && eng.s.deck[0].id, 'duel_captains_notes', 'the start pulls the first preparation into the visit');
  assert.equal(eng.s.vals.chain_beat, 5);
  // The queued preparation, played in the same visit, pulls nothing more.
  eng.s.deck = [];
  eng.s.flags.brace_notes = true;
  eng.run(opt('duel_bram_barrage', 'left').effects.filter((st) => st.t === 'if'), ctx());
  assert.equal(eng.s.deck.length, 0, 'one extra beat a visit');
  // Next visit: a preparation done there brings the final when two are done.
  eng.s.turn = 7; eng.s.last.duel_dummy_hexes = 5; eng.s.seen.duel_dummy_hexes = 1; eng.s.flags.brace_circle = true;
  eng.run(opt('duel_bram_barrage', 'left').effects.filter((st) => st.t === 'if'), ctx());
  assert.equal(eng.s.deck[0] && eng.s.deck[0].id, 'duel_brace_final');
  assert.ok(/since\(duel_dummy_hexes\) >= 1/.test(content.events.duel_brace_final.when.src));
});

test('a roll of pure luck shows on its button as a roll, with no skill', () => {
  const eng = fresh();
  const id = Object.keys(content.events).find((k) => content.events[k].options.some((o) => o.firstCheck && o.firstCheck.t === 'chance' && o.firstCheck.word));
  assert.ok(id);
  const o = content.events[id].options.find((x) => x.firstCheck && x.firstCheck.t === 'chance');
  const c = eng.checkView(o.firstCheck, null, { id });
  assert.equal(c.luck, true);
  assert.ok(c.p > 0 && c.p < 100);
  assert.equal(c.skill, undefined);
});
