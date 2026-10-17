// G1 = F5.4 plus Guard fatigue: a Guard straight after a Guard (or a bundle with Guard) stops only half of each Strike.
// Ends the no-Mana endgame where one side Guards every exchange and the fight runs out on points.
export default R=>{ R.COMBAT_TUNING.guard={repeatLeak:.5}; };
