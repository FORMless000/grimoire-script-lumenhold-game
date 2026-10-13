// Two tracks for people (design §5.5): you find them (shared pools, and encounters where they are) and they find you
// (each character's own monthly roll, driven by warmth = recent, chosen contact). These run against the real content.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../src/engine.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');

const { content } = project(ROOT).compileAll();
const quiet = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };
// A term month at the map, with the given characters met.
function atMap(seed, met, setup) {
  const eng = new Engine(content);
  quiet(() => {
    eng.newGame({ seed, name: 'T' });
    let r = eng.advance();
    for (let i = 0; i < 400 && !(r.kind === 'map' && eng.s.turn >= 3 && eng.phaseOf() === 'term'); i++) {
      if (r.kind === 'map') { eng.pickPlaces([]); r = eng.advance(); continue; }
      if (r.kind === 'card') { if (r.view.pick > 1) eng.chooseMany([r.view.options[0].key]); else eng.choose(r.view.options[0].key); }
      r = eng.advance();
    }
  });
  for (const id of met) eng.s.npcs[id].met = true;
  if (setup) setup(eng.s, eng);
  return eng;
}
const fromFriends = (eng) => eng.s.deck.filter((d) => d.src === 'friend');

test('friends: a warm character finds you on their own roll, a cold one rarely does', () => {
  let warm = 0, cold = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const a = atMap(seed, ['tobias'], (s) => { s.npcs.tobias.warmth = 100; s.npcs.tobias.rel = 40; });
    quiet(() => a.pickPlaces([]));
    if (fromFriends(a).some((d) => d.actor === 'tobias')) warm++;
    const b = atMap(seed, ['tobias'], (s) => { s.npcs.tobias.warmth = 0; s.npcs.tobias.rel = 0; });
    quiet(() => b.pickPlaces([]));
    if (fromFriends(b).some((d) => d.actor === 'tobias')) cold++;
  }
  assert.ok(warm >= 18, 'warm: ' + warm + '/30');
  assert.ok(cold <= 6, 'cold: ' + cold + '/30');
});

test('friends: at most `cap` friend cards a month, one per character', () => {
  const all = Object.keys(content.npcs);
  for (let seed = 1; seed <= 10; seed++) {
    const eng = atMap(seed, all, (s) => { for (const id of all) { s.npcs[id].warmth = 100; s.npcs[id].rel = 50; } });
    quiet(() => eng.pickPlaces([]));
    const f = fromFriends(eng);
    assert.ok(f.length <= eng.FRIENDS.cap);
    assert.equal(new Set(f.map((d) => d.actor)).size, f.length);
  }
});

test('friends: engaging warms, brushing off cools, and warmth fades monthly', () => {
  const eng = atMap(1, ['tobias']);
  eng.s.npcs.tobias.warmth = 50;
  eng.noteContact({ actor: 'tobias' }, { tobias: 1 });
  assert.equal(eng.s.npcs.tobias.warmth, 50 + eng.FRIENDS.engage);
  eng.noteContact({ actor: 'tobias' }, {});
  assert.equal(eng.s.npcs.tobias.warmth, 50 + eng.FRIENDS.engage - eng.FRIENDS.cool);
  // a gain at the rel cap still counts as engaging
  eng.s.npcs.tobias.rel = 100;
  quiet(() => eng.run([{ t: 'rel', npc: 'tobias', tier: 'small', sign: 1 }], Object.assign(eng.newCtx(null, null), {})));
  const before = eng.s.npcs.tobias.warmth;
  quiet(() => eng.pickPlaces([]));
  assert.ok(eng.s.npcs.tobias.warmth <= Math.floor(before * eng.FRIENDS.fade) + eng.FRIENDS.presence * 2);
});

test('friends: visiting where someone is warms them (track 1)', () => {
  const place = Object.values(content.places).find((p) => (content.npcs.tobias.schedule || []).some((x) => x.place === p.id && x.slots.includes('afternoon')));
  assert.ok(place, 'tobias has an afternoon place');
  let warmed = 0;
  for (let seed = 1; seed <= 10; seed++) {
    const eng = atMap(seed, ['tobias'], (s) => { s.npcs.tobias.warmth = 0; s.places[place.id] = { found: 1 }; });
    const v = eng.mapView(); const p = v.places.find((x) => x.id === place.id);
    if (!p || !p.open[0]) continue;
    quiet(() => eng.pickPlaces([place.id]));
    if (eng.s.npcs.tobias.warmth >= eng.FRIENDS.presence) warmed++;
  }
  assert.ok(warmed > 0);
});
