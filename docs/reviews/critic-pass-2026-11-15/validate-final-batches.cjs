'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
const Engine = require(root + '/src/engine.js');
const G = require(root + '/src/grimoire.js');
assert.equal(errors.length, 0);
function game(seed = 7, turn = 8) {
  const e = new Engine(content);
  e.newGame({ seed, name: 'Critic fixture' });
  e.s.turn = turn;
  return e;
}
function show(e, id) {
  e.s.cur = null;
  e.s.deck = [{ id, src: 'queued', force: true }];
  const result = e.advance();
  assert.equal(result.view.id, id);
  return result.view;
}
let pronouns;
for (let seed = 1; seed <= 30; seed++) {
  const e = game(seed);
  const view = show(e, 'nm_thornwick_shopper');
  if (/She raises a toffee apple/.test(view.text)) {
    const say = e.choose('left').say;
    assert.match(say, /^He tells you/);
    pronouns = { seed, text: view.text, say };
    break;
  }
}
assert(pronouns);

const ghostFriend = game(7, 20);
ghostFriend.s.npcs.ilse.met = true;
ghostFriend.s.npcs.ilse.rel = 30;
ghostFriend.run([{ t: 'gain', state: 'in_debt' }], ghostFriend.newCtx(null, 'fixture'));
ghostFriend.s.vals.debt_missed = 0;
assert(ghostFriend.test(content.appointments.grisk_dunning.when));
const boundFriend = ghostFriend.candidates(content.events.grisk_regards_friend)[0];
assert.equal(boundFriend.cast.friend, 'ilse');
// A higher-priority story can change the world after monthly casting and before
// the already-bound pusher plays. Use an ordinary queued item, with no debug force.
ghostFriend.s.flags.ilse_taken = true;
assert.equal(ghostFriend.test(G.expr('around(ilse)')), false);
assert.equal(ghostFriend.candidates(content.events.grisk_regards_friend).length, 0);
ghostFriend.s.cur = null;
ghostFriend.s.deck = [{ id: 'grisk_regards_friend', actor: boundFriend.actor, cast: boundFriend.cast, src: 'queued' }];
const friendView = ghostFriend.advance().view;
assert.equal(friendView.id, 'grisk_regards_friend');
assert.match(friendView.text, /Ilse/);
const absentConversation = ghostFriend.choose('left').say;
assert.match(absentConversation, /Pay him off/);

const refund = game();
refund.s.vals.gold = 50;
refund.s.vals.debt_paid = 1;
refund.run([{ t: 'gain', state: 'in_debt' }], refund.newCtx(null, 'fixture'));
refund.run(content.states.in_debt.tick, refund.newCtx(null, 'fixture'));
assert.equal(refund.s.vals.gold, 38);
show(refund, 'grisk_kind_month');
const refundSay = refund.choose('left').say;
assert.equal(refund.s.vals.gold, 49);

const office = game(7, 12);
office.run([{ t: 'gain', state: 'plan_home_city' }], office.newCtx(null, 'fixture'));
office._slot = 'noon';
const officeFit = office.timeFit(content.events.capital_counting_house_quiet_hour);
assert(officeFit > 0);
assert(office.eligible(content.events.capital_counting_house_quiet_hour, new Set()));
const officeText = show(office, 'capital_counting_house_quiet_hour').text;
assert.match(officeText, /After hours/);

// Opened midnight visits receive the fixed shop and one ambient draw, not another
// market encounter after the terminal packing card. Exercise that exact fill path.
const market = game();
market.s.flags.night_market_known = true;
market.s.places.night_market = { found: 1 };
market.startDay();
Object.assign(market.s.day, { at: 0, picks: ['night_market'],
  used: Object.values(content.events).filter(e => e.place === 'night_market' &&
    !['nm_dawn_packing','night_market_stalls'].includes(e.id)).map(e => e.id),
  withToday: [], items: [], spread: {} });
const dawnVisit = market.fillSlot({ source: 'visit', slot: 'midnight', min: 2, max: 2, opened: true });
assert.deepEqual(dawnVisit.map(it => it.id), ['night_market_stalls','nm_dawn_packing']);

console.log(JSON.stringify({ pronouns, absentFriend: { text: friendView.text, say: absentConversation },
  monthlyRefund: { beforePayment: 50, afterPayment: 38, afterMonthOff: refund.s.vals.gold, say: refundSay },
  noonOffice: { fit: officeFit, text: officeText },
  excludedDawnOrderingFinding: dawnVisit.map(it => it.id) }, null, 2));
