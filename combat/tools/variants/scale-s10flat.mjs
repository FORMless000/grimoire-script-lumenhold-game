// Slope probe: main skills .01 a point, minor .004, HP (Vigor) 0; otherwise V3.
import v3 from './v3-compel.mjs';
export default R=>{v3(R);Object.assign(R.COMBAT_TUNING.skill,{mainPerPoint:.01,minorPerPoint:.004});R.COMBAT_TUNING.hp.perPoint=0;};
