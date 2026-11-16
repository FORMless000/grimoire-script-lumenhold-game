'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
const Engine = require(root + '/src/engine.js');
assert.equal(errors.length, 0);

function game(turn = 12) {
  const e = new Engine(content);
  e.newGame({ seed: 7, name: 'Critic fixture' });
  e.s.turn = turn;
  e.s.vals.gold = 70;
  e.run([{ t: 'gain', state: 'plan_travel_country' }], e.newCtx(null, 'fixture'));
  return e;
}

function show(e, id) {
  e.s.cur = null;
  e.s.deck = [{ id, src: 'queued', force: true }];
  const result = e.advance();
  assert.equal(result.view.id, id);
  return result.view;
}

const walker = game();
show(walker, 'marsh_lights_on_the_drovers_road');
walker.choose('right');
walker.s.turn += 4;
show(walker, 'marsh_lights_on_the_drovers_road');
const firstWalk = walker.choose('left');
assert.match(firstWalk.say, /further this time/);

const sketcher = game();
const pick = sketcher.pick.bind(sketcher);
sketcher.pick = (kind, ...args) => kind === 'challenge' ? 0 : pick(kind, ...args);
show(sketcher, 'marsh_drowned_chapel');
sketcher.choose('left');
sketcher.s.turn += 4;
show(sketcher, 'marsh_drowned_chapel');
const firstSketch = sketcher.choose('right');
assert.match(firstSketch.say, /sketch it again/);

const aftermath = game();
Object.assign(aftermath.s.flags, { gy_begun: true, gy_done: true, gy_broken: true });
// The later consequence has already shown its first failed harvest and cold reception.
aftermath.s.seen.gy_thin_harvest = 1;
aftermath.s.last.gy_thin_harvest = aftermath.s.turn;
const lingering = ['market_inn_welcome', 'market_harvest_board', 'mill_dry_wheel'].map(id => {
  const e = content.events[id];
  assert(aftermath.eligible(e, new Set()));
  assert(aftermath.candidates(e).length);
  return { id, text: show(aftermath, id).text };
});
assert.match(lingering[1].text, /Every year is a good one/);
assert.match(lingering[2].text, /millrace is dry/);

const winter = game(6);
Object.assign(winter.s.npcs.tobias, { met: true, rel: 20 });
assert.equal(winter.seasonOf(), 'winter');
const field = content.events.fennick_top_field;
assert(winter.candidates(field).length);
const winterField = show(winter, field.id).text;
assert.match(winterField, /thick and gold/);
console.log(JSON.stringify({ firstWalk: firstWalk.say, firstSketch: firstSketch.say,
  afterBargainBroken: lingering, winterField }, null, 2));
