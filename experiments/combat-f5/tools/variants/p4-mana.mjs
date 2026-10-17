// P4 = P3 with gentler HP growth (0.6% a point) and a bigger Mana pool (0.4 a point).
import p3 from './p3-hpfloor.mjs';
export default R=>{ p3(R); R.COMBAT_TUNING.hp.perPoint=.006; R.COMBAT_TUNING.capacity.slope=.4; };
