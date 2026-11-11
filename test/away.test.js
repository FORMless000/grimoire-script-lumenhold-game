// Away is away (new maps, round 2, 2026-11-11): off campus, only cards that belong where you are are dealt (a letter, a
// card at a place on this map or of its region, a card of your plan, one tagged `abroad`), and a campus card waits for
// your return. People are where their break schedule puts them on the map you're on, and write when they're elsewhere.
// A home pin reads as Home.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../src/engine.js');
const P = require('../tools/policies.js');
const { content, quiet } = require('./helpers.js');

const fresh = (origin, seed = 5) => { const eng = new Engine(content); quiet(() => eng.newGame({ seed, name: 'T', origin })); return eng; };
const play = (eng, id, key) => { eng.s.cur = { id, actor: null }; eng.s.last[id] = eng.s.turn; return quiet(() => eng.choose(key)); };
const onBreak = (origin, key) => { const eng = fresh(origin); eng.s.turn = 5; eng.s.vals.gold = 200; play(eng, 'break_plan', key); return eng; };

test('away: a campus card is held while away and plays on return; a letter, a region card and an abroad card belong', () => {
  const eng = onBreak('scholar', 'city');
  assert.equal(eng.currentMap(), 'city');
  const ev = (id) => content.events[id];
  assert.equal(eng.belongsHere(ev('maud_tea_tells')), false, 'a campus scene waits');
  assert.equal(eng.belongsHere(ev('night_sleep')), true, 'sleep happens anywhere');
  assert.equal(eng.belongsHere(ev('capital_docks_quiet_hour')), true, 'a card at a place on this map');
  assert.equal(eng.belongsHere(ev('fennick_farm_quiet_hour')), false, 'not a card on the other map');
  const letter = Object.values(content.events).find((e) => e.trigger === 'letter');
  assert.equal(eng.belongsHere(letter), true, 'letters reach you anywhere');
  // A queued campus card goes back to the queue instead of showing.
  eng.s.deck = [{ id: 'maud_tea_tells', actor: 'maud', src: 'queued' }, { id: 'night_sleep', src: 'auto' }]; eng.s.cur = null; eng.s.day = null;
  assert.equal(quiet(() => eng.advance()).view.id, 'night_sleep', 'the campus card is passed over');
  assert.ok(eng.s.queue.some((q) => q.id === 'maud_tea_tells' && q.due === eng.s.turn + 1), 'it waits for next month');
  // On campus it belongs again.
  const home = fresh('scholar'); home.s.turn = 5; play(home, 'break_plan', 'castle');
  assert.equal(home.belongsHere(ev('maud_tea_tells')), true);
  assert.equal(home.belongsHere(ev('capital_docks_quiet_hour')), false, 'a capital card never plays on campus');
});

test('away: Lyra stays at the castle if you do, is at Vaneshade House if you go to the capital, and writes from the countryside', () => {
  const at = (origin, key) => { const eng = onBreak(origin, key); eng.s.npcs.lyra.met = true; return eng; };
  const castle = at('scholar', 'castle');
  assert.equal(castle.isAway('lyra'), false);
  assert.ok(castle.presentAt('duel_hall', 'afternoon').includes('lyra'));
  const capital = at('scholar', 'city');
  assert.equal(capital.isAway('lyra'), false);
  assert.ok(capital.presentAt('vaneshade_house', 'afternoon').includes('lyra'));
  assert.ok(!capital.presentAt('duel_hall', 'afternoon').includes('lyra'));
  const country = at('noble', 'country');
  assert.equal(country.isAway('lyra'), true, 'from the countryside she is a letter away');
  assert.equal(country.isAway('tobias'), false, 'Tobias is home on the countryside map');
  assert.equal(at('scholar', 'city').isAway('tobias'), true, 'and not in the capital');
});

test('away: the arrival screen names your home and who is here; the map labels the home pin Home', () => {
  const eng = onBreak('noble', 'home');
  eng.s.npcs.lyra.met = true;
  const a = eng.arrival();
  assert.equal(a.home && a.home.id, 'capital_townhouse');
  assert.ok(a.people.some((p) => p.id === 'lyra'), 'Lyra is in the capital too');
  quiet(() => eng.confirmArrival(null));
  const v = eng.mapView();
  const pin = v.places.find((p) => p.id === 'capital_townhouse');
  assert.ok(pin && pin.home, 'the townhouse reads as Home');
  assert.ok(!v.places.find((p) => p.id === 'capital_docks').home);
});

test('away: bots on their breaks are shown no campus-bound card while away', () => {
  let awayCards = 0;
  for (const style of ['explorer', 'social', 'homebody']) for (const origin of ['noble', 'scholar', 'street']) {
    const eng = fresh(origin, 11);
    const bad = [];
    quiet(() => P.play(eng, P.get(style), {
      fights: false, parleys: false, maxSteps: 1500,
      // a card queued `now` by the one just played (a delve's next step) is a consequence, and plays anywhere
      before: (e, v) => (e.offCampus() && content.events[v.id] ? { away: true, bad: !e.belongsHere(content.events[v.id]) && !(e.s.cur || {}).now } : null),
      after: (e, v, key, out, st) => { if (st && st.away) awayCards++; if (st && st.bad) bad.push(v.id); },
      stop: (e) => e.s.turn > 13,
    }));
    assert.deepEqual(bad, [], style + '/' + origin + ': ' + bad.join(', '));
  }
  assert.ok(awayCards > 20, awayCards + ' cards seen away');
});
