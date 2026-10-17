// G8 = G7 plus generic presets grow into their specialism: stat offsets × min(1, 0.5 + level/100) (0.7 at level 20, full from 50).
import g7 from './g7.mjs';
export default R=>{ g7(R); R.COMBAT_TUNING.offsetRamp={base:.5,perLevel:.01}; };
