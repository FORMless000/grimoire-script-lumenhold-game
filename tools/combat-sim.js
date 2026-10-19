// Fights for the simulated players (2026-10-18): every combat and duel challenge is played by the combat minigame's AI on
// both sides, synchronously in Node (build/combat.bundle.js), instead of the old dice roll. tools/policies.js installs it in
// play(), so balance, analyze, economy, sim and the golden games all fight.
//   eng.fights = CombatSim.resolver({style: 'balanced'})
// The player's side plays at a preset by style (a careful player at Hard, the random style at Easy); the foe plays at Easy,
// the main game's default difficulty. Both search a fixed depth on a node budget with a fresh search context per fight, so
// a fight replays exactly from its seed (the engine's fightRequest seed: run seed, month, card, option, challenge).
'use strict';
const Bridge = require('../src/combat.js');

// The player's preset by play style; a style not listed plays at Hard.
const PLAYER_PRESET = { random: 'easy', cautious: 'hard', social: 'medium', truant: 'medium', homebody: 'medium', romantic: 'medium', combatmaxx: 'hard' };
const SEARCH = { maxDepth: 3, nodeBudget: 2e5, mistakeChance: 0 };

let started = false;
function start() { if (!started) { Bridge.combat().initSync(); started = true; } }

function resolver({ style = 'balanced', content = null, difficulty = 'easy', depth = SEARCH.maxDepth, nodeBudget = SEARCH.nodeBudget } = {}) {
  start();
  const preset = PLAYER_PRESET[String(style).split(':')[0]] || 'hard';
  const search = { maxDepth: depth, nodeBudget, mistakeChance: 0 };
  return (req) => Bridge.autoplay(Bridge.createFight(req, { content, difficulty, ai: { player: Object.assign({ preset }, search), foe: search } }));
}

module.exports = { resolver, PLAYER_PRESET, SEARCH };
