'use strict';
// Isolated state checks against the current compiler and engine.
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
const Engine = require(root + '/src/engine.js');
assert.equal(errors.length, 0);
const e = new Engine(content);
e.newGame({ seed: 7, name: 'Critic fixture' });
const facts = Object.keys(content.facts);
const omitted = {};
for (const id of ['lyra', 'corvin', 'tobias', 'seraphine', 'mir', 'bram', 'maud', 'thorne', 'brask']) {
  const event = content.events['picture_' + id];
  const required = [...event.when.src.matchAll(/knows\(([^)]+)\)/g)].map(match => match[1]);
  e.s.facts = Object.fromEntries(required.map(fact => [fact, 1]));
  assert(e.test(event.when, id));
  const missing = facts.filter(fact => fact.startsWith(id + '.') && !required.includes(fact));
  if (missing.length) omitted[id] = missing;
}
assert.deepEqual(Object.keys(omitted), ['lyra', 'corvin', 'tobias', 'seraphine', 'mir', 'bram']);
const recaps = [];
for (const [turn, suffix] of [[12, 'one'], [24, 'two'], [36, 'three']]) {
  e.s.turn = turn;
  const id = 'recap_year_' + suffix;
  assert.equal(e.phaseOf(), 'break');
  for (const track of Object.values(e.s.tracks)) assert.notEqual(track.status, 'enrolled');
  const left = e.preview(id, 'left', null).deltas;
  const right = e.preview(id, 'right', null).deltas;
  assert.deepEqual(Object.keys(left), ['mood']);
  assert.deepEqual(Object.keys(right), ['mood']);
  assert(left.mood[0] > right.mood[1]);
  recaps.push({ id, turn, phase: e.phaseOf(), left, right });
}
const nudge = content.events.nudge_red_ink;
e.s.turn = 21;
e.s.seen[nudge.id] = 1;
e.s.last[nudge.id] = 20;
e.s.last.lecture_tower_red_ink = 15;
e.s.clues.lead_red_ink = 15;
assert(e.test(nudge.when));
assert(e.eligible(nudge, new Set()));
console.log(JSON.stringify({ omitted, recaps, redInkEligibleOnRepeat: true }, null, 2));
