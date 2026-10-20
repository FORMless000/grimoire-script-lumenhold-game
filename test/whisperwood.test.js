'use strict';
// The Whisperwood delve (world expansion 1, plan §1): content/events/whisperwood/. Each depth draws its own band, the
// Hush (band 4 and the bosses) only on a midnight delve, every delve card can turn back, falls cost grace, and the
// way home pays by what you carry.
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/grimoire.js');
const Engine = require('../src/engine.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');

const { content } = project(ROOT).compileAll();
const fresh = () => { const e = new Engine(content); e.newGame({ seed: 7, name: 'T' }); return e; };
const delve = Object.values(content.events).filter((e) => (e.tags || []).includes('ww'));

// What `queue any tagged ww now` can draw at a depth (many draws, nothing used yet).
const pool = (depth, hush, flags = {}) => {
  const e = fresh();
  Object.assign(e.s.vals, { ww_depth: depth, ww_hush: hush });
  Object.assign(e.s.flags, flags);
  const ids = new Set();
  for (let i = 0; i < 80; i++) { const id = e.drawTagged('ww', new Set()); if (id) ids.add(id); }
  return [...ids];
};

test('whisperwood: every delve card is queued, gated on the depth, and can turn back', () => {
  assert.ok(delve.length >= 40, delve.length + ' delve cards');
  for (const e of delve) {
    assert.equal(e.trigger, 'queued', e.id);
    assert.match(G.exprText ? G.exprText(e.when) : JSON.stringify(e.when), /ww_depth/, e.id + ' reads the depth');
    if (e.id === 'ww_hush_heart') continue;   // the end of the wood: one way, home
    const left = e.options.find((o) => o.key === 'left');
    assert.ok(left && !left.when, e.id + ' has an unconditional left');
    let home = false;
    G.walkEffects(left.effects, (st) => { if (st.t === 'queue' && st.event === 'ww_way_home') home = true; });
    assert.ok(home, e.id + ': left turns back');
  }
});

test('whisperwood: each depth draws its band; dusk by day and the gate at midnight; the Hush only at midnight', () => {
  const band = (ids, re) => ids.every((id) => re.test(id));
  const b1 = pool(1, 0), b2 = pool(3, 0), b3 = pool(6, 0);
  assert.ok(b1.length >= 6 && band(b1, /^ww1_/), 'band 1: ' + b1);
  assert.ok(b2.length >= 6 && band(b2, /^ww2_|^ww_tree_/), 'band 2: ' + b2);
  assert.ok(b3.length >= 5 && band(b3, /^ww3_|^ww_tree_/), 'band 3: ' + b3);
  assert.deepEqual(pool(7, 0), ['ww_dusk']);
  assert.deepEqual(pool(7, 1), ['ww_hush_gate']);
  assert.ok(!pool(8, 0).some((id) => /^ww4_|^ww_spinner|^ww_outcast/.test(id)), 'no band 4 by day');
  const b4 = pool(8, 1);
  assert.ok(b4.length >= 4 && band(b4, /^ww4_/), 'band 4: ' + b4);
  assert.deepEqual(pool(10, 1), ['ww_spinner_meet']);
  assert.deepEqual(pool(10, 1, { ww_spinner_beaten: true }), ['ww_outcast_meet']);
  assert.deepEqual(pool(10, 1, { ww_spinner_beaten: true, outcast_beaten: true }), ['ww_hush_heart']);
});

test('whisperwood: a fall costs grace, health and a find; the way home pays by the haul and remembers the depth', () => {
  const e = fresh();
  Object.assign(e.s.vals, { ww_depth: 4, ww_haul: 2, ww_grace: 1 });
  const h = e.s.vals.health;
  e.s.deck = [{ id: 'ww_stumble', src: 'queued', force: true }]; e.s.cur = null;
  assert.equal(e.advance().view.id, 'ww_stumble');
  assert.deepEqual([e.s.vals.ww_grace, e.s.vals.ww_haul], [0, 1]);
  assert.ok(e.s.vals.health < h);
  const pay = (haul) => {
    const x = fresh();
    Object.assign(x.s.vals, { ww_depth: 6, ww_haul: haul, ww_deepest: 3 });
    x.s.deck = [{ id: 'ww_way_home', src: 'queued', force: true }]; x.s.cur = null; x.advance();
    const out = x.choose('left');
    assert.deepEqual([x.s.vals.ww_depth, x.s.vals.ww_haul, x.s.vals.ww_deepest], [0, 0, 6]);
    return (out.deltas || {}).gold || 0;
  };
  const none = pay(0), light = pay(1), heavy = pay(5), huge = pay(8);
  assert.ok(none === 0 && light > 0 && heavy > light && huge > heavy, [none, light, heavy, huge].join(' '));
});

test('whisperwood: the Spinner is bargained with first, and her fight follows the bargain', () => {
  const meet = content.events.ww_spinner_meet;
  const right = meet.options.find((o) => o.key === 'right');
  const queued = [];
  G.walkEffects(right.effects, (st) => { if (st.t === 'queue') queued.push(st.event); });
  assert.deepEqual([...new Set(queued)].sort(), ['ww_spinner_fight', 'ww_spinner_fight_weak']);
  // Offended, she won't let you yield; otherwise you may.
  const yieldOpt = content.events.ww_spinner_fight.options.find((o) => o.key === 'left');
  assert.ok(yieldOpt.when, 'yield has a condition');
  assert.ok(content.events.ww_spinner_fight.options.some((o) => o.key === 'right' && !o.when), 'fighting is always there');
});

// Feedback 2026-10-20: picking the wood at midnight before the Hush was known played nothing, and the empty
// midnight slot ended the month. The first midnight visit has its own card now, and a place opens in an opened
// slot only if one of its cards there can play.
const midnight = (e, place) => {
  const rec = e.recipe(), at = rec.findIndex((r) => r.slot === 'midnight');
  e.s.deck = []; e.s.cur = null;
  e.s.day = { v: 2, phase: 'pick', at, stage: 1, picks: Array(e.visitIndex(at)).fill(null), nextPicks: [], used: [], items: [], withToday: [], pushed: [], spread: {}, count: 0, extraVisit: 'midnight' };
  const open = (e.mapView().places.find((p) => p.id === place) || {}).open;
  if (!open || !open[0]) return null;
  e.pickPlaces([place]);
  const turn = e.s.turn, ids = [];
  for (let i = 0; i < 6 && e.s.turn === turn; i++) {
    const r = e.advance();
    if (r.kind !== 'card') break;
    ids.push(r.view.id);
    e.choose(r.view.options.some((o) => o.key === 'right' && !o.disabled) ? 'right' : r.view.options[0].key);
  }
  return ids;
};

test('whisperwood: a first midnight visit finds the silence and can go straight down; later ones offer the descent', () => {
  const quiet = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };
  const e = fresh(); e.s.places.whisperwood = { found: 1 };
  const first = quiet(() => midnight(e, 'whisperwood'));
  assert.equal(first[0], 'ww_night_first');
  assert.equal(first[1], 'ww_edge_night', 'going towards the silence offers the descent at once');
  assert.ok(first.length >= 3 && /^ww/.test(first[2]), 'and the delve follows: ' + first);
  assert.ok(e.s.flags.ww_midnight_known);
  const x = fresh(); x.s.places.whisperwood = { found: 1 }; x.s.flags.ww_midnight_known = true;
  assert.equal(quiet(() => midnight(x, 'whisperwood'))[0], 'ww_edge_night');
});

test('whisperwood: an opened slot never offers a place with nothing to play there', () => {
  const quiet = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };
  // Without the first-midnight card the wood's only midnight card waits for the clue: the map keeps the wood shut.
  const c = Object.assign({}, content, { places: Object.assign({}, content.places, { whisperwood: Object.assign({}, content.places.whisperwood, { always: 'ww_edge ww_edge_night' }) }),
    events: Object.fromEntries(Object.entries(content.events).filter(([id]) => id !== 'ww_night_first')) });
  const e = new Engine(c); quiet(() => e.newGame({ seed: 7, name: 'T' })); e.s.places.whisperwood = { found: 1 };
  assert.equal(quiet(() => midnight(e, 'whisperwood')), null, 'closed while nothing can play');
  e.s.flags.ww_midnight_known = true;
  assert.equal(quiet(() => midnight(e, 'whisperwood'))[0], 'ww_edge_night', 'open once the edge card can');
});
