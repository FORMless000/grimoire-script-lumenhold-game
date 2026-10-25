// The fighting strategy styles (tools/policies.js): their games take longest, so they play in parallel with
// styles.test.js. Each test checks that a style does what its `about` says, on a few fixed seeds, against `balanced`.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { games, cards, mean, chose, playsAndReplays } = require('./style-games.js');

test('styles: the nightlife regular and combatmaxx play to the end, deterministically, and replay', () => {
  playsAndReplays(assert, ['nightlife', 'combatmaxx']);
});

test('styles: the nightlife regular goes out every night it can, takes the company, and fights at the ring', () => {
  for (const eng of games('nightlife')) {
    const nights = cards(eng).filter((h) => h.id === 'night_out');
    // per month played: the ring's fights (played since 2026-10-18) can send a run home early
    assert.ok(nights.length >= 0.35 * eng.s.turn && nights.every((h) => h.choice === 'right'), 'out every night: ' + nights.length + ' in ' + eng.s.turn + ' months');
    assert.equal(chose(eng, 'newt_company', 'right') + chose(eng, 'newt_company_regular', 'right'), 0, 'never refuses the company');
    for (const h of cards(eng).filter((x) => /^ring_bout_\d$/.test(x.id))) assert.ok(['left', 'right'].includes(h.choice));
  }
  assert.ok(mean('nightlife', (e) => cards(e).filter((h) => /^ring_bout_\d$/.test(h.id)).length) >= 5, 'sees the ring bouts');
  assert.ok(mean('nightlife', (e) => chose(e, 'newt_company', 'left') + chose(e, 'newt_company_regular', 'left')) >= 3, 'works the Newt\'s upstairs room');
  assert.ok(mean('nightlife', (e) => e.s.vals.gold) > mean('balanced', (e) => e.s.vals.gold), 'the night pays');
});

test('styles: combatmaxx fights far more than a balanced player, wins most of its fights, and trains arcana and vigor', () => {
  const fights = (eng) => (eng.s.fights || []).length;
  assert.ok(mean('combatmaxx', fights) >= 2 * mean('balanced', fights), 'at least twice the fights');
  const won = games('combatmaxx').reduce((a, e) => a + (e.s.fights || []).filter((f) => f.outcome === 'win').length, 0);
  assert.ok(won / games('combatmaxx').reduce((a, e) => a + fights(e), 0) >= 0.5, 'not too unwinnable: wins most of them');
  const fit = (e) => e.s.vals.arcana + e.s.vals.vigor;
  assert.ok(mean('combatmaxx', fit) > mean('balanced', fit), 'more arcana and vigor');
});
