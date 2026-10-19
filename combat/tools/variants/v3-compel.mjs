// V3 = V2 plus Compel tamed: it was the pick 56% of the time it was legal with every spell available, because it also rewrites
// an action the opponent already committed in the open. Now 16 Mana (was 12) and one locked exchange after this one (was two).
import v2 from './v2-fixes.mjs';
export default R=>{
 v2(R);
 R.SPELLS.compel.cost=[16];
 R.SPELLS.compel.duration=[1];
};
