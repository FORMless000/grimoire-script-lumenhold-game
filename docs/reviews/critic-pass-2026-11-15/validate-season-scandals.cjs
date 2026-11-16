'use strict';
// Small isolated checks of queue delivery and option consequences.
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
const Engine = require(root + '/src/engine.js');
assert.equal(errors.length, 0);
const e = new Engine(content);
e.newGame({ seed: 7, name: 'Critic fixture' });
e.s.turn = 8;
e.s.flags.season_begun = true;
for (const npc of Object.values(e.s.npcs)) {
  npc.met = true;
  npc.rel = 10;
}
assert.equal(e.candidates(content.events.season_friends).length, 0);
e.s.cur = null;
e.s.prologue = false;
e.s.deck = [{ id: 'season_friends', src: 'queued' }, { id: 'season_end', src: 'queued' }];
const advance = e.advance();
assert.equal(advance.view.id, 'season_end');
assert.equal(e.s.seen.season_friends, undefined);
assert.equal(e.s.queue.some(card => card.id === 'season_friends' || card.id === 'season_price'), false);
const skipped = {
  attempted: 'season_friends',
  nextSentinelCard: advance.view.id,
  friendStepSeen: e.s.seen.season_friends || 0,
  friendStepQueued: false,
  priceStepQueued: false,
  begun: !!e.s.flags.season_begun,
  resolved: !!(e.s.flags.season_in || e.s.flags.season_out),
};
e.s.cur = { id: 'scandal_curfew_column', actor: null };
const curfew = e.choose('own');
assert(!e.s.states.detention);
assert.match(curfew.say, /detention/);
e.s.vals.gold = 50;
const cash = {
  sponsorship: e.preview('season_lady_vaneshade', 'left', null).deltas.gold,
  ball: e.preview('season_ball', 'left', null).deltas.gold,
  ending: e.preview('season_end', 'left', null).deltas.gold,
};
assert(cash.sponsorship[0] > 0 && cash.ball[1] < 0 && cash.ending[0] > 0);
console.log(JSON.stringify({ skipped, curfew: { say: curfew.say, detention: false }, cash }, null, 2));
