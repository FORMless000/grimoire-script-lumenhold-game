// The new maps (2026-11-10): the countryside and the capital. Home follows your origin; travelling goes to the other
// map for a fare and a bed; internship hosts sit on the two maps; the arrival screen comes before the map on another
// map, and the return screen when you come back.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../src/engine.js');
const { content, quiet } = require('./helpers.js');

const fresh = (origin, seed = 5) => { const eng = new Engine(content); quiet(() => eng.newGame({ seed, name: 'T', origin })); return eng; };
const run = (eng, effects) => quiet(() => eng.run(effects, eng.newCtx(null, null)));
const gain = (eng, state) => run(eng, [{ t: 'gain', state, dur: null }]);
const play = (eng, id, key) => { eng.s.cur = { id, actor: null }; eng.s.last[id] = eng.s.turn; return quiet(() => eng.choose(key)); };
const onBreak = (origin) => { const eng = fresh(origin); eng.s.turn = 5; eng.s.vals.gold = 100; return eng; };

test('maps: every map a place sits on has a @map, and every @map has its art', () => {
  const used = new Set(Object.values(content.places).filter((p) => p.map && !p.deprecated).map((p) => p.map.map));
  for (const m of used) assert.ok(content.maps[m], 'no @map ' + m);
  assert.deepEqual([...used].sort(), ['campus', 'city', 'home', 'thornwick']);
});

test('maps: going home follows the origin (capital: noble, merchant, street; countryside: scholar, hedge)', () => {
  for (const [origin, map, home] of [['noble', 'city', 'capital_townhouse'], ['merchant', 'city', 'capital_counting_house'], ['street', 'city', 'capital_crew_loft'], ['scholar', 'home', 'home_cottage'], ['hedge', 'home', null]]) {
    const eng = onBreak(origin);
    play(eng, 'break_plan', 'home');
    assert.equal(eng.currentMap(), map, origin);
    if (home) assert.ok(eng.s.places[home], origin + ' finds ' + home);
    for (const other of ['capital_townhouse', 'capital_counting_house', 'capital_crew_loft', 'home_cottage'].filter((p) => p !== home)) assert.ok(!eng.s.places[other], origin + ' does not find ' + other);
  }
});

test('maps: travel goes to the other map for a fare, offered only when it isn\'t home', () => {
  const noble = onBreak('noble'), scholar = onBreak('scholar');
  const keys = (eng) => eng.view({ id: 'break_plan', actor: null }).options.map((o) => o.key);
  assert.ok(keys(noble).includes('country') && !keys(noble).includes('city'));
  assert.ok(keys(scholar).includes('city') && !keys(scholar).includes('country'));
  const g = scholar.s.vals.gold;
  play(scholar, 'break_plan', 'city');
  assert.equal(scholar.currentMap(), 'city');
  assert.ok(scholar.s.vals.gold < g, 'the fare is paid');
});

test('maps: the arrival screen offers lodging to a traveller, and the lodging pays for itself and sets the sleep', () => {
  const eng = onBreak('scholar');
  play(eng, 'break_plan', 'city');
  const a = eng.arrival();
  assert.equal(a.kind, 'arrival'); assert.equal(a.map, 'city'); assert.equal(a.name, 'The Capital');
  assert.deepEqual(a.lodging.map((l) => l.id), ['lodging_city_decent', 'lodging_city_rough', 'lodging_city_fine']);
  assert.equal(a.lodging.find((l) => l.id === 'lodging_city_rough').cost, 0);
  const fine = a.lodging.find((l) => l.id === 'lodging_city_fine');
  assert.ok(fine.cost > 0 && fine.monthly === fine.cost);
  const g = eng.s.vals.gold;
  quiet(() => eng.confirmArrival('lodging_city_fine'));
  assert.ok(eng.s.states.lodging_city_fine);
  assert.equal(eng.s.vals.gold, g - fine.cost);
  assert.equal(eng.arrival(), null, 'confirmed once');
  eng.s.vals.health = 50; eng.s.vals.mood = 50;
  let out = play(eng, 'night_sleep', 'ok');
  assert.equal(out.deltas.health, 20, 'the best room sleeps like home');
  const rough = onBreak('noble');
  play(rough, 'break_plan', 'country');
  quiet(() => rough.confirmArrival('lodging_country_rough'));
  rough.s.vals.health = 50; rough.s.vals.mood = 50;
  out = play(rough, 'night_sleep', 'ok');
  assert.equal(out.deltas.health, 5, 'a hayloft sleeps rough'); assert.equal(out.deltas.mood, 2);
});

test('maps: lodging you can\'t pay for falls back to one you can; going home offers none', () => {
  const eng = onBreak('scholar');
  play(eng, 'break_plan', 'city');
  eng.s.vals.gold = 2;
  quiet(() => eng.confirmArrival('lodging_city_fine'));
  assert.ok(eng.s.states.lodging_city_rough && !eng.s.states.lodging_city_fine);
  const home = onBreak('merchant');
  play(home, 'break_plan', 'home');
  const a = home.arrival();
  assert.equal(a.kind, 'arrival'); assert.equal(a.lodging, null);
  assert.equal(a.stay.id, 'plan_home_city');
});

test('maps: confirming the arrival remembers the map, and the return screen shows once back in term', () => {
  const eng = onBreak('noble');
  play(eng, 'break_plan', 'home');
  assert.ok(eng.arrival());
  quiet(() => eng.confirmArrival(null));
  assert.equal(eng.s.lastMap, 'city');
  assert.ok(eng.s.away && eng.s.away.turn === 5);
  // back in term: the plan has expired
  for (const k of Object.keys(eng.s.states)) if (content.states[k] && content.states[k].kind === 'plan') delete eng.s.states[k];
  eng.s.turn = 7; eng.s.vals.gold = eng.s.away.gold + 12;
  const r = eng.arrival();
  assert.equal(r.kind, 'return'); assert.equal(r.map, 'campus'); assert.equal(r.ledger.gold, 12);
  quiet(() => eng.confirmArrival(null));
  assert.equal(eng.arrival(), null); assert.equal(eng.s.away, undefined);
});

test('maps: an intern\'s map is the host\'s map, the capital or the countryside; the host pin is found only by its interns', () => {
  for (const [track, map, place] of [['intern_royal_library', 'city', 'royal_library_archives'], ['intern_conclave', 'city', 'conclave_laboratory'], ['intern_field_station', 'home', 'field_station'], ['intern_expedition', 'home', 'observatory_camp'], ['intern_thornwick', 'thornwick', 'thornwick_lab']]) {
    const eng = onBreak('scholar'); eng.s.turn = 11;
    quiet(() => eng.trackOp({ t: 'join', track }, eng.newCtx(null, null)));
    gain(eng, 'plan_internship');
    assert.equal(eng.currentMap(), map, track);
    assert.ok(eng.s.places[place], track + ' finds its host');
  }
  const outsider = onBreak('scholar');
  play(outsider, 'break_plan', 'city');
  assert.ok(!outsider.s.places.conclave_laboratory && outsider.s.places.royal_library_archives, 'the reading room is public; the Conclave is not');
});

test('maps: the arrival names the places that offer work, and saves keep what was confirmed', () => {
  const eng = onBreak('noble');
  play(eng, 'break_plan', 'country');
  const a = eng.arrival();
  assert.ok(Array.isArray(a.work));
  quiet(() => eng.confirmArrival('lodging_country_decent'));
  const back = new Engine(content); quiet(() => back.load(eng.save()));
  assert.equal(back.s.lastMap, 'home'); assert.ok(back.s.states.lodging_country_decent);
  assert.equal(back.arrival(), null);
});

test('maps: a card shared by several plans is drawn for each (plan: home home_city)', () => {
  const ix = new Engine(content).directorIndex();
  assert.ok((ix.byPlan.home_city || []).length > 0 && (ix.byPlan.home || []).length >= ix.byPlan.home_city.length);
  assert.ok((ix.byPlan.travel_city || []).length && (ix.byPlan.travel_country || []).length);
});
