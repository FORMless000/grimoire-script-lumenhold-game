'use strict';
// "The Good Year" (new maps, round 2, K4): content/events/maps/good_year.grim. The start leaves a lead; clues count;
// Ottilie vanishes after two; the hedge-witch's truth opens the door in the hill (the moors delve's depth 7), and the
// shut door comes back once it's done (only turf, if the bargain was broken); the Tenant's table has four ways out, the agent's only with his papers.
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../src/engine.js');
const { content, quiet } = require('./helpers.js');

const fresh = () => { const e = new Engine(content); quiet(() => e.newGame({ seed: 7, name: 'T' })); return e; };
const play = (e, id, key) => {
  e.s.deck = [{ id, src: 'queued', force: true }]; e.s.cur = null;
  const v = quiet(() => e.advance()).view;
  assert.equal(v.id, id);
  return [v, quiet(() => e.choose(key))];
};
const door = (flags) => {
  const e = fresh();
  Object.assign(e.s.vals, { moor_depth: 7 });
  Object.assign(e.s.flags, flags);
  const ids = new Set();
  for (let i = 0; i < 60; i++) { const id = e.drawTagged('moor', new Set()); if (id) ids.add(id); }
  return [...ids];
};

test('good year: the start begins the thread and leaves its lead', () => {
  const e = fresh();
  play(e, 'gy_seventh_year', 'left');
  assert.ok(e.s.flags.gy_begun);
  assert.ok((e.s.clues || {}).lead_good_year != null, 'lead_good_year found');
  assert.ok(content.places.old_hall && content.places.old_hall.map.map === 'home');
});

test('good year: clues count, and Ottilie is gone only after two', () => {
  const ev = content.events.gy_ottilie_gone;
  const e = fresh();
  Object.assign(e.s.flags, { gy_begun: true, gy_met_ottilie: true, gy_guest_book: true });
  assert.ok(!e.test(ev.when), 'not after one clue');
  play(e, 'gy_scarecrow_names', 'left');
  assert.ok(e.s.flags.gy_coats);
  assert.ok(e.test(ev.when), 'after two clues');
});

test('good year: the truth opens the door in the hill, and it shuts again when the story is done', () => {
  assert.deepEqual(door({}), ['moor_hill_door']);
  assert.deepEqual(door({ gy_truth: true }), ['gy_hill_door_open']);
  assert.deepEqual(door({ gy_truth: true, gy_done: true }), ['moor_hill_door']);
  assert.deepEqual(door({ gy_truth: true, gy_done: true, gy_broken: true }), ['gy_hill_turf'], 'broken: only turf');
});

test('good year: the Tenant\'s table offers the agent\'s terms only with his papers, and each ending is recorded', () => {
  const keys = (flags) => {
    const e = fresh();
    Object.assign(e.s.flags, flags);
    e.s.deck = [{ id: 'gy_tenant_hall', src: 'queued', force: true }]; e.s.cur = null;
    return quiet(() => e.advance()).view.options.map((o) => (o[0] || o).key);
  };
  assert.ok(!keys({}).includes('agent'));
  assert.ok(keys({ gy_agent_plan: true }).includes('agent'));
  const e = fresh();
  e.s.flags.gy_agent_plan = true;
  play(e, 'gy_tenant_hall', 'agent');
  assert.ok(e.s.flags.gy_sold && e.s.flags.gy_done);
  const { EVENTS, FOES } = require('../build/combat.bundle.js');
  assert.equal(EVENTS['gy_tenant_hall/fight'].play, 'the_tenant');
  if (FOES) assert.ok(FOES.the_tenant);
});
