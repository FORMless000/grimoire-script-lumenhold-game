// G7 = G6 plus the charm classes nudged toward the main combat skills (still Charm-first, offsets still sum to zero).
import g6 from './g6.mjs';
export default R=>{
 g6(R);
 R.LOADOUTS.Illusionist.offsets=[4,-4,-3,4,-2,1];   // was 3,-3,-5,5,-3,3
 R.LOADOUTS.Showman.offsets=[3,-4,-6,10,3,-6];      // was 2,-4,-8,12,2,-4
};
