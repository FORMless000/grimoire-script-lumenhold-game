// F5.9 candidate B: spells and Strike 2/3 + skill/150, Mana capacity likewise; HP gentler, 0.8 + skill/250 (+50% from 0 to 100).
export default R=>{const t=R.COMBAT_TUNING,k=1/150;
 t.skill.mainPerPoint=k;t.skill.minorPerPoint=k;t.strike.perPoint=k;
 t.hp.perPoint=1/250;t.hp.pivot=50;delete t.hp.min;
 t.capacity.slope=t.capacity.base/150;delete t.capacity.min;};
