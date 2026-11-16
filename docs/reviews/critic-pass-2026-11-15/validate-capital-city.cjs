'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
const Engine = require(root + '/src/engine.js');
assert.equal(errors.length, 0);

function game() {
  const e = new Engine(content);
  e.newGame({ seed: 7, name: 'Critic fixture' });
  e.s.turn = 12;
  e.s.vals.gold = 70;
  e.run([{ t: 'gain', state: 'plan_home_city' }], e.newCtx(null, 'fixture'));
  return e;
}

function show(e, id) {
  e.s.cur = null;
  e.s.deck = [{ id, src: 'queued', force: true }];
  const result = e.advance();
  assert.equal(result.view.id, id);
  return result.view;
}

const hours = game();
assert.equal(hours.currentMap(), 'city');
assert.deepEqual(hours.visitSlots(), ['noon', 'afternoon', 'evening', 'night']);
const morningOnly = ['gardens_dawn_duel', 'fish_market_auction'].map(id => {
  const event = content.events[id];
  assert.equal(event.slot, 'morning');
  const fits = hours.visitSlots().map(slot => {
    hours._slot = slot;
    return { slot, fit: hours.timeFit(event) };
  });
  assert(fits.every(row => row.fit === 0));
  return { id, fits };
});
hours._slot = 'afternoon';
assert(hours.timeFit(content.events.gardens_promenade) > 0);
const latePromenade = { fit: hours.timeFit(content.events.gardens_promenade), text: show(hours, 'gardens_promenade').text };
assert.match(latePromenade.text, /before luncheon/);

const workshop = game();
Object.assign(workshop.s.npcs.mir, { met: true, rel: 20 });
show(workshop, 'clockworks_long_bench');
workshop.choose('left');
workshop.s.turn += 3;
show(workshop, 'clockworks_long_bench');
const cupboard = workshop.choose('right');
assert.match(cupboard.say, /Back in the cupboard.*again/);

const portrait = game();
Object.assign(portrait.s.npcs.seraphine, { met: true, rel: 20 });
show(portrait, 'oracle_window_seat');
portrait.choose('left');
portrait.s.turn += 3;
show(portrait, 'oracle_window_seat');
const painting = portrait.choose('right');
assert.match(painting.say, /this time, slightly better/);

const auction = game();
auction.s.vals.gold = 0;
const pick = auction.pick.bind(auction);
auction.pick = (kind, ...args) => kind === 'challenge' ? 2 : pick(kind, ...args);
show(auction, 'fish_market_auction');
const emptyPurse = auction.choose('left');
assert.equal(emptyPurse.checks[0].result, 'lose');
assert.equal(auction.s.vals.gold, 0);
assert.match(emptyPurse.say, /less than you paid/);

console.log(JSON.stringify({ morningOnly, latePromenade, firstCupboardVisit: cupboard.say,
  firstPaintingAttempt: painting.say, forcedAuctionWithEmptyPurse: { say: emptyPurse.say, goldPaid: 0 } }, null, 2));
