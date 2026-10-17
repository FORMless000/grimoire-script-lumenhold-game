// V5 = V4 plus: Illusionist's stat offsets softened (it fell to 0–19% at L40–50 when Arcana and Vigor started to matter);
// still Charm-first, still summing to zero. Reflect 8 Mana (it is Ward against spells only, plus the return).
import v4 from './v4-kits.mjs';
export default R=>{
 v4(R);
 R.LOADOUTS.Illusionist.offsets=[3,-3,-5,5,-3,3];  // arcana, lore, alchemy, charm, vigor, guile (was 0,0,-8,8,-6,6)
 R.SPELLS.reflect.cost=[8];
};
