'use strict';
// The tide caves (new maps, round 2, C4): content/events/maps/tide_caves.grim, on the moors' pattern. Each depth draws
// its own band, depth 7 is the sea's door, every delve card can turn back, each band holds enough cards for its passes
// and falls, falls cost grace, the way out pays by what you carry, and the mouth's grace and start depth read a Port
// Calder childhood, the courier's oilskin and the tide ladder.
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/grimoire.js');
const Engine = require('../src/engine.js');
const { content, quiet } = require('./helpers.js');

const fresh = () => { const e = new Engine(content); quiet(() => e.newGame({ seed: 7, name: 'T' })); return e; };
const delve = Object.values(content.events).filter((e) => (e.tags || []).includes('tide'));

const pool = (depth, flags = {}) => {
  const e = fresh();
  Object.assign(e.s.vals, { tide_depth: depth });
  Object.assign(e.s.flags, flags);
  const ids = new Set();
  for (let i = 0; i < 80; i++) { const id = e.drawTagged('tide', new Set()); if (id) ids.add(id); }
  return [...ids];
};
const play = (e, id, key) => {
  e.s.deck = [{ id, src: 'queued', force: true }]; e.s.cur = null;
  assert.equal(quiet(() => e.advance()).view.id, id);
  return quiet(() => e.choose(key));
};

test('tide caves: the place opens at low water and is found at the docks or by a Port Calder childhood', () => {
  const p = content.places.capital_tide_caves;
  assert.ok(p && p.map && p.map.map === 'city', 'on the capital map');
  assert.deepEqual([...p.open].sort(), ['afternoon', 'noon']);
  assert.ok(content.events.docks_sea_back_door, 'the docks card that finds it');
});

test('tide caves: every delve card is in the scene, gated on the depth, and can turn back', () => {
  assert.ok(delve.length >= 15, delve.length + ' delve cards');
  for (const e of delve) {
    assert.equal(e.thread, 'tide_delve', e.id);
    assert.match(G.exprText ? G.exprText(e.when) : JSON.stringify(e.when), /tide_depth/, e.id + ' reads the depth');
    const left = e.options.find((o) => o.key === 'left');
    assert.ok(left && !left.when, e.id + ' has an unconditional left');
    let out = false;
    G.walkEffects(left.effects, (st) => { if (st.t === 'queue' && st.event === 'tide_way_out') out = true; });
    assert.ok(out, e.id + ': left turns back');
  }
});

test('tide caves: each depth draws its band, each band outlasts its passes and falls, and depth 7 is the sea\'s door', () => {
  const band = (ids, re) => ids.every((id) => re.test(id));
  const b1 = pool(1), b2 = pool(3), b3 = pool(6);
  assert.ok(b1.length >= 4 && band(b1, /^tide1_/), 'band 1: ' + b1);
  assert.ok(b2.length >= 5 && band(b2, /^tide2_/), 'band 2: ' + b2);
  assert.ok(b3.length >= 5 && band(b3, /^tide3_/), 'band 3: ' + b3);
  assert.deepEqual(pool(7), ['tide_sea_door']);
  // Two passes plus a fall on every card with a check, per band (the K3 critic's rule): the ladder is read once.
  assert.ok(pool(1, { tide_calder_run: true }).length >= 3, 'band 1 after the ladder');
  assert.ok(!pool(1, { tide_calder_run: true }).includes('tide1_tide_ladder'), 'the ladder is read once');
});

test('tide caves: the mouth gives grace for Port Calder and the oilskin, and the ladder starts deeper', () => {
  const enter = (flags, origin, oilskin) => {
    const e = fresh();
    Object.assign(e.s.flags, flags);
    if (origin) e.s.states.origin_street = { left: 0, since: 0 };
    if (oilskin) { e.s.items = e.s.items || {}; e.s.items.oilskin_coat = 1; }
    play(e, 'tide_cave_mouth', 'right');
    return [e.s.vals.tide_grace, e.s.vals.tide_depth, e.s.vals.tide_haul];
  };
  assert.deepEqual(enter({}, false, false), [1, 1, 0]);
  assert.deepEqual(enter({}, true, false), [2, 1, 0]);
  assert.deepEqual(enter({}, true, true), [3, 1, 0]);
  assert.equal(enter({ tide_calder_run: true }, false, false)[1], 3);
});

test('tide caves: a fall costs grace, health and a find; the way out pays by the haul and remembers the depth', () => {
  const e = fresh();
  Object.assign(e.s.vals, { tide_depth: 4, tide_haul: 2, tide_grace: 1 });
  const h = e.s.vals.health;
  e.s.deck = [{ id: 'tide_soaked', src: 'queued', force: true }]; e.s.cur = null;
  assert.equal(quiet(() => e.advance()).view.id, 'tide_soaked');
  assert.deepEqual([e.s.vals.tide_grace, e.s.vals.tide_haul], [0, 1]);
  assert.ok(e.s.vals.health < h);
  const pay = (haul) => {
    const x = fresh();
    Object.assign(x.s.vals, { tide_depth: 6, tide_haul: haul, tide_deepest: 3 });
    const out = play(x, 'tide_way_out', 'left');
    assert.deepEqual([x.s.vals.tide_depth, x.s.vals.tide_haul, x.s.vals.tide_deepest], [0, 0, 6]);
    return (out.deltas || {}).gold || 0;
  };
  const none = pay(0), light = pay(1), mid = pay(3), heavy = pay(5);
  assert.ok(none === 0 && light > 0 && mid > light && heavy > mid, [none, light, mid, heavy].join(' '));
});

test('tide caves: the two fights have their own foes', () => {
  const { EVENTS, FOES } = require('../build/combat.bundle.js');
  for (const [key, foe] of [['tide2_lookout/right', 'cave_lookout'], ['tide3_conger/right', 'conger']]) {
    assert.equal(EVENTS[key] && EVENTS[key].play, foe, key);
    if (FOES) assert.ok(FOES[foe], foe);
  }
});
