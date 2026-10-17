// P2 = P1 with HP outpacing damage: HP 1.2% a point, amounts 0.8% (Strike 1.1%), so late fights run longer.
import p1 from './p1-scaling.mjs';
export default R=>{ p1(R); const T=R.COMBAT_TUNING; T.hp.perPoint=.012; T.skill.mainPerPoint=T.skill.minorPerPoint=.008; T.strike.perPoint=.011; };
