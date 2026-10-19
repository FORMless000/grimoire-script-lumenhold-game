// F5.9 candidate: every skill scaling is 2/3 + skill/150 (×1 at 50, doubling from 0 to 100): spells, Strike, HP, Mana capacity.
export default R=>{const t=R.COMBAT_TUNING,k=1/150;
 t.skill.mainPerPoint=k;t.skill.minorPerPoint=k;t.strike.perPoint=k;
 t.hp.perPoint=k;t.hp.pivot=50;delete t.hp.min;
 t.capacity.slope=t.capacity.base/150;delete t.capacity.min;};
