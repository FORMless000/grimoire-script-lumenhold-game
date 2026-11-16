'use strict';
// Isolated states for bottle availability, purchase and confiscation.
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const {content, errors} = require(root + '/tools/project.js').project(root).compileAll();
const Engine = require(root + '/src/engine.js');
assert.equal(errors.length, 0);
const e = new Engine(content);
e.newGame({ seed: 7, name: 'Critic fixture' });
e.s.turn = 8;
e.s.vals.gold = 50;
const gain = id => e.run([{ t: 'gain', state: id }], e.newCtx(null, 'fixture'));
gain('brightwater');
gain('brightwater_bottle');
assert(e.s.states.brightwater);
assert(e.s.states.brightwater_bottle);
const trunk = content.events.elixir_trunk;
assert.equal(e.test(trunk.when), false);
assert(e.test(trunk.options.find(o => o.key === 'pour_bright').when));
const beforeGold = e.s.vals.gold;
const first = content.events.elixir_first_year;
assert(e.test(first.when));
e.s.cur = { id: first.id, actor: null };
e.choose('left');
assert(e.s.vals.gold < beforeGold);
assert.equal(Object.keys(e.s.states).filter(id => id === 'brightwater_bottle').length, 1);
const goldAfter = e.s.vals.gold;
gain('owls_ink_bottle');
e.s.cur = { id: 'contraband_caught', actor: null };
const confess = e.choose('right');
assert.equal(e.s.states.brightwater_bottle, undefined);
assert.equal(e.s.states.owls_ink_bottle, undefined);
assert(e.s.flags.confiscated_brightwater && e.s.flags.confiscated_owls_ink);
console.log(JSON.stringify({
  trunk: { bottleHeldWhileDosed: true, pourGate: true, trunkGate: false },
  duplicatePurchase: { beforeGold, goldAfter, brightwaterBottlesAfter: 1 },
  confiscation: { bothBottlesTaken: true, say: confess.say }
}, null, 2));
