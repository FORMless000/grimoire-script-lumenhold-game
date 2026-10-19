// P5 = P3 plus late spells get cheaper by rank (Flame and Mend 9/8/7, Foresight 7/6/5), Brawler's Vigor edge trimmed and
// Prefect leaning a little more on Arcana.
import p3 from './p3-hpfloor.mjs';
export default R=>{
 p3(R);
 R.SPELLS.flame.cost=[9,8,7];R.SPELLS.mend.cost=[9,8,7];R.SPELLS.foresight.cost=[7,6,5];
 R.LOADOUTS.Brawler.offsets=[-4,-7,-6,3,10,4];     // was -4,-8,-6,2,12,4
 R.LOADOUTS.Prefect.offsets=[5,3,-4,-4,4,-4];      // was 4,4,-6,-4,4,-2
};
