// G10 = F5.5 plus the low-level course picks evened out: rank-1 Shadowstep is a fair dodge (8/10/12 Mana, was 12 at every rank)
// and rank-1 Haste lasts two exchanges (2/3/4, was 3/3/4).
export default R=>{ R.SPELLS.shadowstep.cost=[8,10,12]; R.SPELLS.haste.duration=[2,3,4]; };
