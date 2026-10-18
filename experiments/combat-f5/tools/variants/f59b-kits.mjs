// F5.9b candidate: f59b-vigor, plus forbidden gates 28/58 only, Healer without Animate, Brawler and Sailor with Distil.
export default R=>{const L=R.LOADOUTS;L.Brawler.offsets=[-8,-19,-15,4,28,10];L.Sailor.offsets=[-4,-15,-7,8,22,-4];
 R.COMBAT_TUNING.kits.forbidden=[28,58];
 L.Healer.hidden={moonwell:1};L.Brawler.hidden={rime:1,purify:1.5};L.Sailor.hidden={lodestar:1,purify:1.5};};
