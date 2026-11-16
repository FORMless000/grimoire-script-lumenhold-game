'use strict';
// Isolated transition checks. Direct state setup is explicit; these are not run-frequency estimates.
const fs = require('fs'), assert = require('assert'), path = require('path');
const root = path.resolve(__dirname, '../../..');
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
assert.equal(errors.length, 0);
const Engine = require(root + '/src/engine.js');
function fresh(turn, flags) {
  const e = new Engine(content);
  e.newGame({ seed: 7, name: 'Critic fixture' });
  e.s.turn = turn;
  Object.assign(e.s.flags, flags);
  e.stampJournal();
  return e;
}
function presentQueued(e, id) {
  e.s.deck = [{ id, src: 'queued' }, { id: 'night_sleep', src: 'auto', force: true }];
  e.s.cur = null;
  e.s.day = null;
  return e.advance();
}
const circle = fresh(5, { circle_begun: true });
assert.equal(circle.phaseOf(), 'break');
assert.equal(presentQueued(circle, 'circle_newcomer').view.id, 'night_sleep');
assert.equal(circle.s.queue.length, 0);
const circleStory = circle.journal().stories.find(t => t.id === 'study_circle');
assert.equal(circleStory.status, 'ongoing');

const match = fresh(11, { tm_begun: true });
assert.equal(match.seasonOf(), 'summer'); // Avoid the invitation's legitimate winter deferral.
match.s.npcs.mir.bond = 'partner';
assert.equal(presentQueued(match, 'tm_invitation').view.id, 'night_sleep');
assert.equal(match.s.queue.length, 0);
const matchStory = match.journal().stories.find(t => t.id === 'tobias_mir');
assert.equal(matchStory.status, 'ongoing');

const vault = fresh(7, { feud_begun: true });
vault.s.vals.guile = -100; // Force the failure path at the normal minimum odds.
vault.s.cur = { id: 'feud_vault', actor: null };
const vaultResult = vault.choose('left');
assert.equal(vaultResult.checks[0].result, 'lose');
assert(vaultResult.say.includes('before you'));
assert.equal(vault.s.flags.feud_locked_in, true);
const vaultStory = vault.journal().stories.find(t => t.id === 'bram_corvin_feud');
assert(vaultStory.entries.some(e => e.text.includes('for an hour')));

const picnic = fresh(11, { tm_begun: true });
assert.equal(picnic.phaseOf(), 'break');
assert.equal(picnic.seasonOf(), 'summer');
assert.equal(picnic.test(content.events.tm_end.defer, null), false);
picnic.s.vals.mood = 50;
for (const id of ['tobias', 'mir']) picnic.s.npcs[id].rel = 10;
const left = picnic.preview('tm_end', 'left', null), right = picnic.preview('tm_end', 'right', null);
assert.deepEqual(left.deltas, { mood: [8, 8], 'rel:tobias': [2, 2], 'rel:mir': [2, 2] });
assert.deepEqual(right.deltas, { 'rel:tobias': [1, 1], 'rel:mir': [1, 1] });
fs.writeFileSync(__dirname + '/between-stories-validation.json', JSON.stringify({ seed: 7,
  circle: { turn: 5, queue: circle.s.queue, journal: circleStory },
  match: { turn: 11, override: { mirBond: 'partner' }, queue: match.s.queue, journal: matchStory },
  vault: { turn: 7, override: { guile: -100 }, result: vaultResult, journal: vaultStory },
  picnic: { turn: 11, enrolledCourses: picnic.s.tracks, left, right } }, null, 2) + '\n');
console.log('Four isolated story-transition/choice checks passed.');
