// Fights for the simulated players (2026-10-18): every combat and duel challenge is played by the combat minigame's AI on
// both sides, synchronously in Node (build/combat.bundle.js), instead of the old dice roll. tools/policies.js installs it in
// play(), so balance, analyze, economy, sim and the golden games all fight.
//   eng.fights = CombatSim.resolver({style: 'balanced'})
// The player's side plays at a skill by style (a careful player, the random style loose); the foe plays at Easy, the main
// game's default difficulty. Both search a fixed depth on a node budget with a fresh search context per fight, so
// a fight replays exactly from its seed (the engine's fightRequest seed: run seed, month, card, option, challenge).
'use strict';
const Bridge = require('../src/combat.js');

// The player's skill: F5.9's Easy, Medium and Hard presets, kept by value since F5.10 gave the names to new opponents.
const SKILL = {
  loose: { slack: 40, maxRegret: 100, tiltScale: 2, persona: true },
  fair: { slack: 24, maxRegret: 60, tiltScale: 1.5, persona: true },
  careful: { slack: 10, maxRegret: 24, tiltScale: 1, persona: true },
};
// The player's skill by play style; a style not listed plays careful.
const PLAYER_SKILL = { random: 'loose', cautious: 'careful', social: 'fair', truant: 'fair', homebody: 'fair', romantic: 'fair', combatmaxx: 'careful' };
const SEARCH = { maxDepth: 3, nodeBudget: 2e5, mistakeChance: 0 };

let started = false;
function start() { if (!started) { Bridge.combat().initSync(); started = true; } }

function resolver({ style = 'balanced', content = null, difficulty = 'easy', depth = SEARCH.maxDepth, nodeBudget = SEARCH.nodeBudget } = {}) {
  start();
  const skill = SKILL[PLAYER_SKILL[String(style).split(':')[0]] || 'careful'];
  const search = { maxDepth: depth, nodeBudget, mistakeChance: 0 };
  return (req) => Bridge.autoplay(Bridge.createFight(req, { content, difficulty, ai: { player: Object.assign({}, skill, search), foe: search } }));
}

module.exports = { resolver, PLAYER_SKILL, SKILL, SEARCH };
