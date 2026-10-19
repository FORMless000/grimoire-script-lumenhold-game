// Slope probe: main skills .008 a point, minor .003, HP (Vigor) .004; otherwise V3.
import v3 from './v3-compel.mjs';
export default R=>{v3(R);Object.assign(R.COMBAT_TUNING.skill,{mainPerPoint:.008,minorPerPoint:.003});R.COMBAT_TUNING.hp.perPoint=.004;};
