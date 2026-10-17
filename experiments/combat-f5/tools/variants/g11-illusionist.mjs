// G11 = G10 plus Illusionist starts with Mend instead of Foresight (course weights foresight 1, mend 2; was 1, .5), so
// at levels 15–39 it has Mend and Shadowstep: slippery and self-mending.
import g10 from './g10-low.mjs';
export default R=>{ g10(R); R.LOADOUTS.Illusionist.course=[1,2,4,.5,3]; };
