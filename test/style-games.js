// The strategy play styles' shared games (tools/policies.js): each signature test plays a style on fixed seeds against
// `balanced`. The tests are split over two files (styles.test.js, styles-fights.test.js) so their games play in parallel.
'use strict';
const Engine = require('../src/engine.js');
const Policies = require('../tools/policies.js');
const { content, quiet } = require('./helpers.js');

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];   // four were too few once spells v2 moved exam grades (2026-10-17)
const EXTRA = [9, 10, 11, 12, 13, 14, 15, 16];
const cache = {};
const play = (style, seed, opts = {}) => quiet(() => Policies.play(new Engine(content), Policies.get(style), Object.assign({ seed, name: 'S', maxSteps: 9000, strict: true }, opts)));
// Plays a style on the shared seeds (strict: a soft-lock or an unfinished game throws) and keeps the games.
const games = (style) => (cache[style] = cache[style] || SEEDS.map((seed) => play(style, seed).eng));
const cards = (eng) => eng.s.hist.filter((h) => h.t === 'card');
const mean = (style, f) => games(style).reduce((a, e) => a + f(e), 0) / SEEDS.length;
const chose = (eng, id, key) => cards(eng).filter((h) => h.id === id && h.choice === key).length;
const leads = (eng) => eng.threads().flatMap((t) => t.leads || []);
// Each style plays its games to the end without a soft-lock, and the same seed replays exactly through the engine.
function playsAndReplays(assert, names) {
  for (const name of names) {
    for (const eng of games(name)) assert.ok(eng.s.ended, name + ' seed ' + eng.s.seed + ' finished');
    const a = play(name, 9, { name: 'R', record: true, strict: false }), b = play(name, 9, { name: 'R', strict: false });
    assert.equal(JSON.stringify(a.eng.s.vals), JSON.stringify(b.eng.s.vals), name + ': same seed, same game');
    const again = new Engine(content);
    quiet(() => Policies.replay(again, a.record));
    assert.equal(JSON.stringify(again.s.vals), JSON.stringify(a.eng.s.vals), name + ': the record replays');
  }
}

module.exports = { SEEDS, EXTRA, play, games, cards, mean, chose, leads, playsAndReplays };
