// A forbidden spell's cast costs `@balance forbidden_cast: alignment 2` (feedback 2026-10-19: a third of its `small` tier),
// on a card as in a fight; other spells that move alignment keep their tier.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../src/engine.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');
const LC = require('../build/combat.bundle.js');

const { content } = project(ROOT).compileAll();
test('a forbidden cast costs 2 alignment on a card and in a fight; Sleight keeps its tier', () => {
  const eng = new Engine(content);
  const w = console.log; console.log = () => {}; try { eng.newGame({ seed: 3, name: 'T', origin: 'street' }); } finally { console.log = w; }
  const cast = (id) => { eng.s.vals.alignment = 0; const ctx = eng.newCtx(null); eng.chargeCast(id, 0, ctx); return eng.s.vals.alignment; };
  assert.equal(content.balance.forbidden_cast.alignment, 2);
  for (const id of Object.keys(content.spells).filter((k) => content.spells[k].pool === 'forbidden')) assert.equal(cast(id), -2, id);
  assert.equal(cast('sleight'), -eng.tierAmount('alignment', 'tiny'));
  assert.equal(LC.ALIGNMENT_COST.forbidden, content.balance.forbidden_cast.alignment, 'the fight charges the same');
});
