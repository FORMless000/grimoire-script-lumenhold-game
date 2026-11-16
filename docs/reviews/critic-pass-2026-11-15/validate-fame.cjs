'use strict';
// Small fixtures for the referenced consequences. No encounter probabilities are inferred.
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
const Engine = require(root + '/src/engine.js');
assert.equal(errors.length, 0);
const fresh = seed => {
  const e = new Engine(content);
  e.newGame({ seed, name: 'Critic fixture' });
  e.s.turn = 8;
  return e;
};
let badParty;
for (let seed = 1; seed <= 50 && !badParty; seed++) {
  const e = fresh(seed);
  e.s.cur = { id: 'spot_party_host', actor: null };
  const result = e.choose('left');
  if (/detention polishing/.test(result.say)) {
    assert(!e.s.states.detention);
    badParty = { seed, say: result.say, detention: false };
  }
}
assert(badParty, 'Expected a failed party branch in the bounded fixture');
const e = fresh(7);
e.s.turn = 4;
e.s.vals.renown = 70;
for (const npc of Object.values(e.s.npcs)) assert.notEqual(npc.bond, 'partner');
const opening = content.events.spot_ball_opening;
assert(e.test(opening.when));
assert(!opening.cast);
assert.equal(content.events.midwinter_ball.options.some(o => o.key === 'skip'), true);
assert(!content.places.library.open.includes('midnight'));
console.log(JSON.stringify({
  badParty,
  ball: { turn: 4, partners: 0, eligible: true, castsPartner: false, separateSkipOption: true },
  library: { open: content.places.library.open, midnightOpen: false }
}, null, 2));
