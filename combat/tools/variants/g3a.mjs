// G3a = G2 plus casting any spell but Ward breaks your own Shadowstep.
import g2 from './g2-classes.mjs';
export default R=>{ g2(R); R.COMBAT_TUNING.shadowstep={breakOnCast:true}; };
