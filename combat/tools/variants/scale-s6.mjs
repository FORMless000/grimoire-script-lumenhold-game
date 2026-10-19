// Slope probe: main skills .006 a point, minor .0025, HP (Vigor) .004; otherwise V3.
import v3 from './v3-compel.mjs';
export default R=>{v3(R);Object.assign(R.COMBAT_TUNING.skill,{mainPerPoint:.006,minorPerPoint:.0025});R.COMBAT_TUNING.hp.perPoint=.004;};
