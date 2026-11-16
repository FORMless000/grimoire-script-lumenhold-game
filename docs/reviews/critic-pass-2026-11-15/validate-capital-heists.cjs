'use strict';
// Specific branches against the frozen content, independent of their frequency.
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
const Engine = require(root + '/src/engine.js');
assert.equal(errors.length, 0);

function game() {
  const engine = new Engine(content);
  engine.newGame({ seed: 7, name: 'Critic fixture' });
  engine.s.turn = 12;
  engine.s.vals.gold = 70;
  engine.s.vals.health = 70;
  engine.s.deck = [];
  return engine;
}

function play(engine, id, key) {
  engine.s.cur = null;
  engine.s.deck = [{ id, src: 'queued', force: true }];
  const { view } = engine.advance();
  assert.equal(view.id, id);
  return { text: view.text, outcome: engine.choose(key) };
}

const chase = game();
Object.assign(chase.s.vals, { job_depth: 3, job_where: 1, job_loot: 2 });
const pick = chase.pick.bind(chase);
chase.pick = (kind, ...args) => kind === 'challenge' ? 0 : pick(kind, ...args);
const escape = play(chase, 'job_caught', 'right');
assert.equal(escape.outcome.checks[0].result, 'win');
assert.match(escape.text, /they take it all back/);
assert.match(escape.outcome.say, /drop the lot and run/);
chase.s.turn++;
const surrender = play(chase, 'job_caught', 'left');
assert.match(surrender.outcome.say, /cells again.*the same magistrate/);

function transition(where, from, to) {
  const engine = game();
  Object.assign(engine.s.vals, { job_depth: 1, job_where: where });
  const pickWeighted = engine.pickWeighted.bind(engine);
  engine.pickWeighted = candidates => candidates.find(candidate => candidate.e.id === to) || pickWeighted(candidates);
  const step = play(engine, from, 'right');
  assert.equal(engine.s.vals.job_depth, 2);
  assert.equal(engine.s.deck[0].id, to);
  const next = engine.s.deck[0];
  const opening = engine.withContext(next, () => engine.view(next).text);
  return { outcome: step.outcome.say, next: { id: next.id, opening } };
}

const yard = transition(1, 'bonded1_loading_door', 'bonded1_clerk_window');
assert.match(yard.outcome, /slip through the gap/);
assert.match(yard.next.opening, /Across the yard/);
const ballroom = transition(2, 'crescent1_conservatory', 'crescent1_quadrille');
assert.match(ballroom.outcome, /upper floor/);
assert.match(ballroom.next.opening, /quadrille/);

const gala = game();
Object.assign(gala.s.flags, { crescent_servants_hour: true });
const pickGala = gala.pickWeighted.bind(gala);
gala.pickWeighted = candidates => candidates.find(candidate => candidate.e.id === 'crescent1_footman') || pickGala(candidates);
const entry = play(gala, 'crescent_enter', 'right');
assert.match(entry.outcome.say, /At eleven/);
assert.equal(gala.s.deck[0].id, 'crescent1_footman');

console.log(JSON.stringify({ carryingLoot: { opening: escape.text, outcome: escape.outcome.say },
  firstSurrenderAfterEscape: surrender.outcome.say, yard, ballroom,
  mewsEntry: { outcome: entry.outcome.say, nextId: gala.s.deck[0].id } }, null, 2));
