'use strict';
// Isolated checks of the Master Map finale and its Journal resolution.
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
const Engine = require(root + '/src/engine.js');
assert.equal(errors.length, 0);
const e = new Engine(content);
e.newGame({ seed: 7, name: 'Critic fixture' });
e.s.turn = 12;
e.s.flags.carto_map_chain = true;
e.s.seen.carto_map_blanks = 1;
e.s.last.carto_map_blanks = 8;
Object.assign(e.s.npcs.corvin, { met: true, rel: 20 });
const final = content.events.carto_map_keeper;
assert(e.test(final.when, 'corvin'));
const earlyFallback = e.withContext({ id: final.id, actor: 'corvin' },
  () => e.view({ id: final.id, actor: 'corvin' }));
assert.match(earlyFallback.text, /mostly blank/);
e.s.cur = { id: final.id, actor: 'corvin' };
e.choose('right');
assert(e.s.flags.carto_map_done);
e.s.turn = 14;
e.s.last.carto_map_keeper = 12;
e.s.seen.carto_map_keeper = 1;
assert(e.test(final.when, 'corvin'));
assert(e.eligible(final, new Set()));
assert(e.candidates(final).length > 0);
console.log(JSON.stringify({
  startedOn: 8, declinedOn: 12, replayEligibleOn: 14,
  resolvedFlag: !!e.s.flags.carto_map_done,
  replayCandidateCount: e.candidates(final).length,
  inheritedWhen: final.when.src
}, null, 2));
