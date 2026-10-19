// V7 = V6 plus Compel no longer rewrites the action the opponent has already committed: it locks the next two exchanges.
// (It was the pick 29–56% of the time it was legal with every spell available, as a counter to anything telegraphed.)
import v6 from './v6-brawler.mjs';
export default R=>{
 v6(R);
 R.SPELLS.compel.immediate=false;
 R.SPELLS.compel.duration=[2];
 R.SPELLS.compel.cost=[16];
};
