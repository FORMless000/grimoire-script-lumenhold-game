// G3 = G2 plus: Guard fatigue looks back two exchanges (alternating Guard and Strike no longer stalls a dry endgame), and
// casting any spell but Ward breaks your own Shadowstep (stepping into shadow is a dodge, not a safe room to heal in).
import g2 from './g2-classes.mjs';
export default R=>{
 g2(R);
 R.COMBAT_TUNING.guard.lookback=2;
 R.COMBAT_TUNING.shadowstep={breakOnCast:true};
};
