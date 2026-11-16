'use strict';
// Bounded critic evidence, not gameplay-frequency estimates or a source change.
const fs = require('fs'), assert = require('assert');
const root = require('path').resolve(__dirname, '../../..');
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
assert.equal(errors.length, 0);
const Engine = require(root + '/src/engine.js');
const eng = new Engine(content);
eng.newGame({ seed: 7, name: 'Critic fixture' });
eng.s.vals.mood = 50;
eng.s.vals.renown = 50;
const left = eng.preview('vaneshade_house_quiet_hour', 'left', null);
const right = eng.preview('vaneshade_house_quiet_hour', 'right', null);
assert.deepEqual(left.deltas.mood, right.deltas.mood);
assert.deepEqual(left.deltas.renown, [-2, -2]);
assert.equal(right.deltas.renown, undefined);
assert.equal(left.follows, false);
assert.equal(right.follows, false);
const hours = [];
for (const [id, slot] of [['capital_townhouse_quiet_hour', 'night'], ['hollis_house_quiet_hour', 'evening']]) {
  eng._slot = slot;
  const event = content.events[id];
  assert.equal(eng.timeFit(event), 1);
  assert(content.places[event.place].open.includes(slot));
  hours.push({ id, slot, timeFit: eng.timeFit(event), placeOpen: true,
    when: event.when?.src || null });
}
const out = { seed: 7, purpose: 'Check dominated choice and absence of slot restrictions; not a delivery-frequency simulation.',
  vaneshade: { left, right }, hours };
fs.writeFileSync(__dirname + '/fallback-validation.json', JSON.stringify(out, null, 2) + '\n');
console.log('Fallback preview and time-fit assertions passed.');
