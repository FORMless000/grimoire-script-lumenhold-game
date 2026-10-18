// F5.9b candidate: f59b-vigor, forbidden gates 28/58, and Distil only at the last extra gate (58) for Brawler, Sailor, Healer.
export default R=>{const L=R.LOADOUTS;L.Brawler.offsets=[-8,-19,-15,4,28,10];L.Sailor.offsets=[-4,-15,-7,8,22,-4];
 R.COMBAT_TUNING.kits.forbidden=[28,58];
 L.Healer.extras={bramble:3};L.Healer.hidden={moonwell:1,purify:.5};L.Brawler.hidden={rime:1,purify:.5};L.Sailor.hidden={lodestar:1,purify:.5};};
