// Simulated players, as tools/lab.mjs's `human` study defines them: the game's own search with slack, no persona.
// novice: one exchange ahead, loose; decent: two ahead, a little loose. Used by human-study.mjs and creature-study.mjs.
export const PLAYER_MODELS={
 novice:{maxDepth:1,nodeBudget:3e6,mistakeChance:0,tiltScale:0,slack:15,maxRegret:40},
 decent:{maxDepth:2,nodeBudget:3e6,mistakeChance:0,tiltScale:0,slack:5,maxRegret:20},
};
