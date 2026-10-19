// P6 = P5 with Brawler halfway back: Vigor +11 (P5 had +10, F5.6 +12).
import p5 from './p5-costs.mjs';
export default R=>{ p5(R); R.LOADOUTS.Brawler.offsets=[-4,-8,-6,2,11,5]; };
