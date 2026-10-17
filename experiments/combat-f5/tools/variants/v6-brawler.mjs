// V6 = V5 plus the Strike tools: Tailwind adds 4/8/12 to consecutive Strikes (was 3/6/9), and Haste gives three-action
// bundles at rank 3 (2/2/3, as the spell list first had it).
import v5 from './v5-illusionist.mjs';
export default R=>{
 v5(R);
 R.SPELLS.tailwind.damage=[4];
 R.SPELLS.haste.actions=[2,2,3];
};
