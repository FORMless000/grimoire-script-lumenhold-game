// The connection between the main game and the combat minigame (combat/, wired in 2026-10-18): one Mana scale and one
// price per spell in both games.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const Engine = require('../src/engine.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');

const { content } = project(ROOT).compileAll();
const roster = () => import(path.join(ROOT, 'combat/setup/roster.mjs'));
const SKILLS = ['arcana', 'lore', 'alchemy', 'charm', 'vigor', 'guile'];

test('combat: a spell costs the same Mana on a card as in a fight', async () => {
  const { SPELLS } = await roster();
  for (const [id, d] of Object.entries(content.spells)) assert.deepEqual(d.cost, SPELLS[id].cost, id);
});

test('combat: the main game\'s max Mana is the fight\'s capacity, at any skills', async () => {
  const { manaCapacity } = await roster();
  const eng = new Engine(content);
  const w = console.warn; console.warn = () => {};
  try { eng.newGame({ seed: 1 }); } finally { console.warn = w; }
  for (const lv of [[12, 12, 12, 12, 12, 12], [30, 6, 6, 8, 8, 6], [50, 50, 50, 50, 50, 50], [80, 70, 40, 20, 60, 30], [100, 100, 100, 100, 100, 100]]) {
    const skills = Object.fromEntries(SKILLS.map((k, i) => [k, lv[i]]));
    Object.assign(eng.s.vals, skills);
    assert.equal(eng.resMax(content.resources.mana), manaCapacity(skills), JSON.stringify(skills));
  }
});
