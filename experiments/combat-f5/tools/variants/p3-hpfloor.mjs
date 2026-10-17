// P3 = P1 but combat HP only grows: 70 up to skill 40, then +0.8% a point (Vigor counted twice), about 92 at level 80.
// Keeps early fights as they were and makes late ones longer without steepening level gaps as much.
import p1 from './p1-scaling.mjs';
export default R=>{ p1(R); Object.assign(R.COMBAT_TUNING.hp,{perPoint:.008,pivot:40,min:1}); };
