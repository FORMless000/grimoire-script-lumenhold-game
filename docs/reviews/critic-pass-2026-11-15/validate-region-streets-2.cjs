'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
const Engine = require(root + '/src/engine.js');
assert.equal(errors.length, 0);
function game() {
  const e = new Engine(content);
  e.newGame({ seed: 7, name: 'Critic fixture' });
  e.s.turn = 12;
  e.run([{ t: 'gain', state: 'plan_home_city' }], e.newCtx(null, 'fixture'));
  e._slot = 'afternoon';
  return e;
}
function show(e, id) {
  e.s.cur = null;
  e.s.deck = [{ id, src: 'queued', force: true }];
  const result = e.advance();
  assert.equal(result.view.id, id);
  return result.view;
}
const unfunded = ['streets_pieman','streets_chess_hustler'].map(id => {
  const e = game();
  e.s.vals.gold = 0;
  assert(e.eligible(content.events[id], new Set()));
  const pick = e.pick.bind(e);
  e.pick = (kind, ...args) => kind === 'chance' ? 1 : kind === 'challenge' ? 2 : pick(kind, ...args);
  const view = show(e, id);
  assert.equal(view.options.find(o => o.key === 'left').disabled, false);
  const result = e.choose('left');
  assert.equal(e.s.vals.gold, 0);
  assert.match(result.say, /You pay double|put your coin in his tin/);
  return { id, gold: e.s.vals.gold, say: result.say };
});
const actor = game();
actor.s.npcs.vey.met = true;
const pick = actor.pick.bind(actor);
actor.pick = (kind, ...args) => kind === 'challenge' ? 0 : pick(kind, ...args);
show(actor, 'theatre_vey_ghost');
const performance = actor.choose('left');
assert.equal(performance.checks[0].result, 'win');
assert.match(performance.say, /At the curtain/);
show(actor, 'streets_mistaken');
const falseTruth = actor.choose('right').say;
assert.match(falseTruth, /never been on a stage/);
const liar = game();
const liarPick = liar.pick.bind(liar);
liar.pick = (kind, ...args) => kind === 'challenge' ? 2 : liarPick(kind, ...args);
show(liar, 'streets_mistaken');
const beforeAlignment = liar.s.vals.alignment;
const failedLie = liar.choose('left');
assert.equal(failedLie.checks[0].result, 'lose');
assert.equal(liar.s.vals.alignment, beforeAlignment);
const monkey = game();
monkey.s.vals.gold = 0;
const monkeyPick = monkey.pick.bind(monkey);
monkey.pick = (kind, ...args) => kind === 'challenge' ? 2 : monkeyPick(kind, ...args);
assert(monkey.eligible(content.events.streets_monkey, new Set()));
show(monkey, 'streets_monkey');
const emptyPurse = monkey.choose('left');
assert.equal(monkey.s.vals.gold, 0);
assert.match(emptyPurse.say, /lighter by a coin/);
console.log(JSON.stringify({ unfunded, performance: performance.say, falseTruth,
  failedLie: { say: failedLie.say, beforeAlignment, afterAlignment: liar.s.vals.alignment },
  emptyPurse: { gold: monkey.s.vals.gold, say: emptyPurse.say } }, null, 2));
