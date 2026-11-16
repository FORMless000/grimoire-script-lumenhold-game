'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
const Engine = require(root + '/src/engine.js');
assert.equal(errors.length, 0);
function game(country = false) {
  const e = new Engine(content);
  e.newGame({ seed: 7, name: 'Critic fixture' });
  e.s.turn = 12;
  e.s.vals.gold = 70;
  e.run([{ t: 'gain', state: country ? 'plan_travel_country' : 'plan_home_city' }], e.newCtx(null, 'fixture'));
  return e;
}
function show(e, id) {
  e.s.cur = null;
  e.s.deck = [{ id, src: 'queued', force: true }];
  const result = e.advance();
  assert.equal(result.view.id, id);
  return result.view;
}
const omnibus = ['left','right'].map(key => {
  const e = game();
  const text = show(e, 'streets_omnibus').text;
  assert.match(text, /for a penny/);
  const before = e.s.vals.gold;
  const result = e.choose(key);
  assert.equal(e.s.vals.gold, before);
  return { key, before, after: e.s.vals.gold, text, say: result.say };
});
const automaton = game();
automaton._slot = 'night';
assert(automaton.timeFit(content.events.streets_automaton) > 0);
assert(automaton.eligible(content.events.streets_automaton, new Set()));
show(automaton, 'streets_automaton');
const nightGreeting = automaton.choose('left').say;
assert.match(nightGreeting, /Good afternoon/);
const owl = game(true);
owl._slot = 'noon';
const owlFit = owl.timeFit(content.events.lanes_barn_owl);
assert(owlFit > 0);
assert(owl.eligible(content.events.lanes_barn_owl, new Set()));
show(owl, 'lanes_barn_owl');
const noonOwl = owl.choose('left').say;
assert.match(noonOwl, /half-dark/);
const empty = game();
empty.run([{ t: 'gain', state: 'plan_travel_city' }, { t: 'gain', state: 'lodging_city_decent' }], empty.newCtx(null, 'fixture'));
empty.s.vals.gold = 0;
assert(empty.eligible(content.events.lodging_sailors_inn_night, new Set()));
assert(empty.candidates(content.events.lodging_sailors_inn_night).length);
const pick = empty.pick.bind(empty);
empty.pick = (kind, ...args) => kind === 'challenge' ? 2 : pick(kind, ...args);
show(empty, 'lodging_sailors_inn_night');
const bet = empty.choose('right');
assert.equal(bet.checks[0].result, 'lose');
assert.equal(empty.s.vals.gold, 0);
assert.match(bet.say, /You pay up/);
console.log(JSON.stringify({ omnibus, nightGreeting, noonOwl: { fit: owlFit, say: noonOwl },
  unfundedBet: { result: bet.checks[0].result, gold: empty.s.vals.gold, say: bet.say } }, null, 2));
