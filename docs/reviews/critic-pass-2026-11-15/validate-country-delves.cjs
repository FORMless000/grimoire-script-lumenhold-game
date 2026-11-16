'use strict';
// Bounded critic evidence: selected state transitions, not simulated delivery rates.
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
const Engine = require(root + '/src/engine.js');
assert.equal(errors.length, 0);

function game(city = false) {
  const e = new Engine(content);
  e.newGame({ seed: 7, name: 'Critic fixture' });
  e.s.turn = 12;
  e.s.vals.gold = 70;
  e.run([{ t: 'gain', state: city ? 'plan_home_city' : 'plan_travel_country' }], e.newCtx(null, 'fixture'));
  return e;
}
function show(e, id) {
  e.s.cur = null;
  e.s.deck = [{ id, src: 'queued', force: true }];
  const result = e.advance();
  assert.equal(result.view.id, id);
  return result.view;
}

const emptyFalls = [ ['moor_stumble', 'moor'], ['tide_soaked', 'tide'] ].map(([id, prefix]) => {
  const e = game(prefix === 'tide');
  Object.assign(e.s.vals, { [prefix + '_haul']: 0, [prefix + '_grace']: 2, [prefix + '_depth']: 1 });
  const view = show(e, id);
  assert.equal(e.s.vals[prefix + '_haul'], 0);
  assert.match(view.text, /something rolls|something spills|something.*bag|lighter bag|what you carried/);
  return { id, haul: e.s.vals[prefix + '_haul'], text: view.text };
});

const rescuedLoot = [ ['moor_lost', 'moor'], ['tide_fished_out', 'tide'] ].map(([id, prefix]) => {
  const e = game(prefix === 'tide');
  Object.assign(e.s.vals, { [prefix + '_haul']: 3, [prefix + '_depth']: 4 });
  const view = show(e, id);
  assert.equal(e.s.vals[prefix + '_haul'], 0);
  return { id, before: 3, after: e.s.vals[prefix + '_haul'], text: view.text,
    say: e.choose('left').say };
});

const endingLoot = ['gy_after_broken', 'gy_after_renewed', 'gy_after_sold'].map(id => {
  const e = game();
  Object.assign(e.s.vals, { moor_haul: 3, moor_depth: 7 });
  const view = show(e, id);
  assert.equal(e.s.vals.moor_haul, 0);
  return { id, before: 3, after: e.s.vals.moor_haul, text: view.text };
});

const broken = game();
Object.assign(broken.s.flags, { gy_begun: true, gy_done: true, gy_broken: true });
broken.s.vals.moor_depth = 5;
const warm = content.events.moor3_warm_turf;
assert(broken.eligible(warm, new Set()));
assert(broken.candidates(warm).length);
const warmAfterBreaking = show(broken, warm.id).text;
assert.match(warmAfterBreaking, /warm|breath/);
broken.s.vals.moor_depth = 7;
const coldAfterBreaking = show(broken, 'gy_hill_turf').text;
assert.match(coldAfterBreaking, /cold under your hand/);

const daytime = ['gy_scarecrow_names', 'gy_agent_drovers', 'gy_ottilie_gone', 'gy_witch_truth'].map(id => {
  const e = game();
  Object.assign(e.s.flags, { gy_begun: true, gy_met_ottilie: true });
  if (id === 'gy_witch_truth') e.s.flags.gy_ottilie_gone = true;
  e.s.vals.gy_clues = 2;
  e.s.seen.gy_fern_hunter = 1;
  e.s.last.gy_fern_hunter = e.s.turn - 1;
  e._slot = 'afternoon';
  const event = content.events[id];
  assert(e.eligible(event, new Set()), id);
  assert(e.candidates(event).length, id);
  const fit = e.timeFit(event);
  assert(fit > 0, id);
  const view = show(e, id);
  return { id, slot: 'afternoon', fit, text: view.text,
    ...(id === 'gy_agent_drovers' ? { say: e.choose('left').say } : {}),
    ...(id === 'gy_ottilie_gone' ? { say: e.choose('right').say } : {}) };
});

const mill = game();
mill.s.flags.gy_begun = true;
mill._slot = 'evening';
assert(mill.eligible(content.events.gy_miller_tally, new Set()));
assert.equal(mill.s.seen.mill_dry_wheel || 0, 0);
assert.equal(mill.s.seen.gy_guest_book || 0, 0);
const firstMillClue = show(mill, 'gy_miller_tally').text;
assert.match(firstMillClue, /dry race again/);

const fern = game();
fern.s.flags.gy_begun = true;
fern._slot = 'evening';
assert(fern.timeFit(content.events.gy_fern_hunter) > 0);
assert(fern.eligible(content.events.gy_fern_hunter, new Set()));
show(fern, 'gy_fern_hunter');
const eveningFernHunt = fern.choose('left').say;
assert.match(eveningFernHunt, /spend the afternoon/);

const bargaining = game();
bargaining.s.flags.gy_guest_book = true;
assert(!bargaining.s.flags.gy_coats);
const pick = bargaining.pick.bind(bargaining);
bargaining.pick = (kind, ...args) => kind === 'challenge' ? 0 : pick(kind, ...args);
show(bargaining, 'gy_tenant_hall');
const singleClueBargain = bargaining.choose('bargain');
assert.equal(singleClueBargain.checks[0].result, 'win');
assert.match(singleClueBargain.say, /from the book and the collars/);

// A suspected coat callback is NOT a finding: its prerequisite card's second opening
// reveals the tailor's label, before either option is chosen.
const coats = game();
const coatOpenings = [];
for (let i = 0; i < 2; i++) {
  coatOpenings.push(show(coats, 'fields_scarecrow_coats').text);
  coats.choose('right');
  coats.s.turn += 4;
}
assert.match(coatOpenings[1], /label inside its collar/);
const coatCallback = show(coats, 'gy_scarecrow_names').text;
assert.match(coatCallback, /found a tailor's label/);

console.log(JSON.stringify({ emptyFalls, rescuedLoot, endingLoot,
  warmAfterBreaking, coldAfterBreaking, daytime, firstMillClue,
  eveningFernHunt, singleClueBargain: singleClueBargain.say,
  excludedCoatFinding: { coatOpenings, coatCallback } }, null, 2));
