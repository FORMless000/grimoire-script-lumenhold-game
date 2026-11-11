'use strict';
// The moors delve (new maps, K3): content/events/maps/moors_delve.grim, on the Whisperwood's pattern. Each depth draws
// its own band, depth 7 is the door in the hill, every delve card can turn back, falls cost grace, the way home pays
// by what you carry, and the edge's grace and start depth read the rue, a valley birth and the drove road.
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/grimoire.js');
const Engine = require('../src/engine.js');
const { content, quiet } = require('./helpers.js');

const fresh = () => { const e = new Engine(content); quiet(() => e.newGame({ seed: 7, name: 'T' })); return e; };
const delve = Object.values(content.events).filter((e) => (e.tags || []).includes('moor'));

const pool = (depth, flags = {}) => {
  const e = fresh();
  Object.assign(e.s.vals, { moor_depth: depth });
  Object.assign(e.s.flags, flags);
  const ids = new Set();
  for (let i = 0; i < 80; i++) { const id = e.drawTagged('moor', new Set()); if (id) ids.add(id); }
  return [...ids];
};
const play = (e, id, key) => {
  e.s.deck = [{ id, src: 'queued', force: true }]; e.s.cur = null;
  assert.equal(quiet(() => e.advance()).view.id, id);
  return quiet(() => e.choose(key));
};

test('moors: every delve card is in the scene, gated on the depth, and can turn back', () => {
  assert.ok(delve.length >= 14, delve.length + ' delve cards');
  for (const e of delve) {
    assert.equal(e.thread, 'moor_delve', e.id);
    assert.match(G.exprText ? G.exprText(e.when) : JSON.stringify(e.when), /moor_depth/, e.id + ' reads the depth');
    const left = e.options.find((o) => o.key === 'left');
    assert.ok(left && !left.when, e.id + ' has an unconditional left');
    let home = false;
    G.walkEffects(left.effects, (st) => { if (st.t === 'queue' && st.event === 'moor_way_home') home = true; });
    assert.ok(home, e.id + ': left turns back');
  }
});

test('moors: each depth draws its band, and depth 7 is the door in the hill', () => {
  const band = (ids, re) => ids.every((id) => re.test(id));
  const b1 = pool(1), b2 = pool(3), b3 = pool(6);
  assert.ok(b1.length >= 4 && band(b1, /^moor1_/), 'band 1: ' + b1);
  assert.ok(b2.length >= 4 && band(b2, /^moor2_/), 'band 2: ' + b2);
  assert.ok(b3.length >= 4 && band(b3, /^moor3_/), 'band 3: ' + b3);
  assert.deepEqual(pool(7), ['moor_hill_door']);
  // Two passes and up to three falls (dog, bog road, fog) are five draws in band 2: it must hold five cards (critic, K3).
  assert.ok(pool(3, { moor_inn_key: true }).length >= 5, 'band 2 after the key: ' + pool(3, { moor_inn_key: true }));
  assert.ok(!pool(1, { moor_drove_road: true }).includes('moor1_lost_ewe'), 'the ewe is rescued once');
});

test('moors: the edge gives grace for the rue and a valley birth, and the drove road starts deeper', () => {
  const enter = (flags, home) => {
    const e = fresh();
    Object.assign(e.s.flags, flags);
    if (home) e.s.states.plan_home = { left: 1, since: 0 };
    play(e, 'moor_edge', 'right');
    return [e.s.vals.moor_grace, e.s.vals.moor_depth, e.s.vals.moor_haul];
  };
  assert.deepEqual(enter({}, false), [1, 1, 0]);
  assert.deepEqual(enter({ marsh_rue: true }, false), [2, 1, 0]);
  assert.deepEqual(enter({ marsh_rue: true }, true), [3, 1, 0]);
  assert.equal(enter({ moor_drove_road: true }, false)[1], 3);
});

test('moors: a fall costs grace, health and a find; the way home pays by the haul and remembers the depth', () => {
  const e = fresh();
  Object.assign(e.s.vals, { moor_depth: 4, moor_haul: 2, moor_grace: 1 });
  const h = e.s.vals.health;
  e.s.deck = [{ id: 'moor_stumble', src: 'queued', force: true }]; e.s.cur = null;
  assert.equal(quiet(() => e.advance()).view.id, 'moor_stumble');
  assert.deepEqual([e.s.vals.moor_grace, e.s.vals.moor_haul], [0, 1]);
  assert.ok(e.s.vals.health < h);
  const pay = (haul) => {
    const x = fresh();
    Object.assign(x.s.vals, { moor_depth: 6, moor_haul: haul, moor_deepest: 3 });
    const out = play(x, 'moor_way_home', 'left');
    assert.deepEqual([x.s.vals.moor_depth, x.s.vals.moor_haul, x.s.vals.moor_deepest], [0, 0, 6]);
    assert.equal(/empty bag/.test([].concat(out.say || []).join(' ')), haul === 0, haul + ': ' + out.say);
    return (out.deltas || {}).gold || 0;
  };
  const none = pay(0), light = pay(1), mid = pay(3), heavy = pay(5);
  assert.ok(none === 0 && light > 0 && mid > light && heavy > mid, [none, light, mid, heavy].join(' '));
});

test('moors: the three fights have their own foes', () => {
  const { EVENTS, FOES } = require('../build/combat.bundle.js');
  for (const [key, foe] of [['moor1_adders/right', 'peat_adders'], ['moor2_black_dog/right', 'bog_hound'], ['moor3_barrow_ram/right', 'barrow_ram']]) {
    assert.equal(EVENTS[key] && EVENTS[key].play, foe, key);
    if (FOES) assert.ok(FOES[foe], foe);
  }
});
