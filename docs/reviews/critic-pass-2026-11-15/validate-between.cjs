'use strict';
// Forced outcome isolates the promised consequence; it does not estimate normal failure frequency.
const fs = require('fs'), assert = require('assert'), path = require('path');
const root = path.resolve(__dirname, '../../..');
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
assert.equal(errors.length, 0);
const Engine = require(root + '/src/engine.js');
const eng = new Engine(content);
eng.newGame({ seed: 7, name: 'Critic fixture' });
eng.s.vals.guile = -100; // Deliberately below normal play to isolate a failed impersonation.
eng.s.cur = { id: 'between_cover_roll', actor: 'tobias', cast: { a: 'tobias', b: 'mir' } };
const result = eng.choose('left');
assert.equal(result.checks[0].result, 'lose');
assert(result.say.includes("It's a detention for you"));
assert.equal(eng.s.states.detention, undefined);
fs.writeFileSync(__dirname + '/between-validation.json', JSON.stringify({ seed: 7,
  override: { guile: -100 }, purpose: 'Forced failure consequence only; not a run-frequency estimate',
  result, states: eng.s.states }, null, 2) + '\n');
console.log('Roll-call failure reproduced: detention promised in prose, no detention state applied.');
