'use strict';
// The capital's heists (new maps, round 2, C5): content/events/maps/capital_heists.grim, on the castle heists' pattern.
// The bonded warehouses: each depth draws its band (or the rare way shut), every step can slip away, cover reads a Port
// Calder childhood and the watchman's round, the tide caves' culvert starts on the floor, the watch fines harder the
// second time, the way out pays by the loot, and the foreman's ledger frees Jory or buys the foreman's silence.
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/grimoire.js');
const Engine = require('../src/engine.js');
const { content, quiet } = require('./helpers.js');

const fresh = () => { const e = new Engine(content); quiet(() => e.newGame({ seed: 7, name: 'T' })); return e; };
const steps = Object.values(content.events).filter((e) => e.thread === 'job_bonded');

const pool = (depth, flags = {}) => {
  const e = fresh();
  Object.assign(e.s.vals, { job_depth: depth });
  Object.assign(e.s.flags, flags);
  const ids = new Set();
  for (let i = 0; i < 120; i++) { const id = e.drawTagged('heist', new Set()); if (id && content.events[id].thread === 'job_bonded') ids.add(id); }
  return [...ids];
};
const play = (e, id, key) => {
  e.s.deck = [{ id, src: 'queued', force: true }]; e.s.cur = null;
  assert.equal(quiet(() => e.advance()).view.id, id);
  return quiet(() => e.choose(key));
};

test('bonded warehouses: a night place on the capital map, found at the docks, by the crew, or from the tide caves', () => {
  const p = content.places.capital_bonded_warehouses;
  assert.ok(p && p.map && p.map.map === 'city');
  assert.deepEqual([...p.open], ['night']);
  assert.ok(content.events.docks_bonded_talk && content.events.bonded_enter);
});

test('bonded warehouses: every step is in the heist, reads the depth, and can slip away', () => {
  assert.ok(steps.length >= 11, steps.length + ' steps');
  for (const e of steps) {
    assert.match(G.exprText ? G.exprText(e.when) : JSON.stringify(e.when), /job_depth/, e.id + ' reads the depth');
    const left = e.options.find((o) => o.key === 'left');
    assert.ok(left && !left.when, e.id + ' has an unconditional left');
    let out = false;
    G.walkEffects(left.effects, (st) => { if (st.t === 'queue' && st.event === 'job_way_out') out = true; });
    assert.ok(out, e.id + ': left slips away');
  }
});

test('bonded warehouses: each depth draws its band, and depth 5 is the strongroom', () => {
  const b1 = pool(1).filter((id) => id !== 'bonded_dead_end'), b2 = pool(3).filter((id) => id !== 'bonded_dead_end');
  assert.ok(b1.length >= 4 && b1.every((id) => /^bonded1_/.test(id)), 'band 1: ' + b1);
  assert.ok(b2.length >= 5 && b2.every((id) => /^bonded2_/.test(id)), 'band 2: ' + b2);
  assert.ok(pool(1).includes('bonded_dead_end'), 'the way shut is always there');
  assert.deepEqual(pool(5), ['bonded_strongroom']);
});

test('bonded warehouses: cover reads Port Calder and the round, and the culvert starts on the floor', () => {
  const enter = (flags, street) => {
    const e = fresh();
    Object.assign(e.s.flags, flags);
    if (street) e.s.states.origin_street = { left: 0, since: 0 };
    play(e, 'bonded_enter', 'right');
    return [e.s.vals.job_cover, e.s.vals.job_depth, e.s.vals.job_where];
  };
  assert.deepEqual(enter({}, false), [1, 1, 1]);
  assert.deepEqual(enter({ bonded_round_counted: true }, true), [3, 1, 1]);
  assert.deepEqual(enter({ tide_bonded_drain: true }, false), [1, 3, 1]);
  assert.deepEqual(enter({ tide_bonded_drain: true, bonded_round_counted: true }, false), [2, 3, 1]);
});

test('bonded warehouses: the watch fines, and fines harder a face it knows', () => {
  const fine = (record) => {
    const e = fresh();
    e.s.vals.gold = 500;
    Object.assign(e.s.vals, { job_where: 1, job_depth: 3, job_loot: 2 });
    if (record) e.s.flags.job_watch_record = true;
    play(e, 'job_caught', 'left');
    assert.equal(e.s.vals.job_loot, 0);
    assert.ok(e.s.flags.job_watch_record);
    return 500 - e.s.vals.gold;
  };
  const first = fine(false), again = fine(true);
  assert.ok(first > 0 && again > first, first + ' then ' + again);
});

test('bonded warehouses: the way out pays by the loot, or gives it away for renown', () => {
  const out = (loot, key) => {
    const e = fresh();
    Object.assign(e.s.vals, { job_where: 1, job_depth: 4, job_loot: loot, job_bonded_deepest: 1 });
    const r = play(e, 'job_way_out', key);
    assert.deepEqual([e.s.vals.job_depth, e.s.vals.job_loot, e.s.vals.job_bonded_deepest], [0, 0, 4]);
    return r.deltas || {};
  };
  const g = [0, 1, 2, 4, 6].map((n) => out(n, 'left').gold || 0);
  assert.ok(g[0] === 0 && g.every((x, i) => !i || x > g[i - 1]), g.join(' '));
  assert.ok((out(3, 'right').renown || 0) > 0 && !(out(3, 'right').gold));
});

test('bonded warehouses: the ledger frees Jory or buys the foreman\'s silence', () => {
  const e = fresh();
  play(e, 'bonded_ledger', 'left');
  assert.ok(e.s.flags.bonded_ledger && e.s.flags.jory_freed);
  const x = fresh();
  play(x, 'bonded_ledger', 'right');
  assert.ok(x.s.flags.bonded_ledger && !x.s.flags.jory_freed);
});
