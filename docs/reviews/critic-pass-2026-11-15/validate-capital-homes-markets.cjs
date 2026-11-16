'use strict';
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
  engine.s.vals.gold = 0;
  return engine;
}

function show(engine, id) {
  engine.s.cur = null;
  engine.s.deck = [{ id, src: 'queued', force: true }];
  const { view } = engine.advance();
  assert.equal(view.id, id);
  return view;
}

function alwaysLose(engine) {
  const pick = engine.pick.bind(engine);
  engine.pick = (kind, ...args) => kind === 'challenge' ? 2 : pick(kind, ...args);
}

const unpaid = {};
for (const id of ['crew_loft_long_game', 'bazaar_hat_bet']) {
  const engine = game();
  alwaysLose(engine);
  const card = show(engine, id);
  const out = engine.choose('left');
  assert.equal(out.checks[0].result, 'lose');
  assert.equal(engine.s.vals.gold, 0);
  assert(!out.deltas.gold);
  unpaid[id] = { label: card.options.find(option => option.key === 'left').label, say: out.say, goldPaid: 0 };
}

const market = game();
market.s.vals.gold = 100;
market.s.visitsTo.capital_bazaar = 1;
market.run([{ t: 'give', item: 'clockwork_songbird' }], market.newCtx(null, 'fixture'));
assert(market.hasItem('clockwork_songbird'));
const stall = show(market, 'shop_bazaar');
assert.match(stall.text, /rare thing/);
const availableCurios = stall.options.filter(option => ['songbird', 'dice', 'seaglass'].includes(option.key));
assert.equal(availableCurios.length, 0);

const letters = game();
letters.s.vals.gold = 100;
letters.run([{ t: 'gain', state: 'plan_home_city' }], letters.newCtx(null, 'fixture'));
assert.equal(letters.phaseOf(), 'break');
assert.equal(letters.currentMap(), 'city');
Object.assign(letters.s.npcs.kael, { met: true, rel: 10, touched: 8 });
const scribe = show(letters, 'arcade_scribe');
assert(letters.scheduleOf('kael').every(slot => letters.mapOf(slot.place) === 'campus'));
const reply = letters.choose('kael');
assert.match(reply.say, /the North gets letters/);

console.log(JSON.stringify({ unpaid, curio: { text: stall.text, availableCurios },
  scribeKael: { option: scribe.options.find(option => option.key === 'kael').label, reply: reply.say,
    breakLocations: letters.scheduleOf('kael').map(slot => slot.place) } }, null, 2));
