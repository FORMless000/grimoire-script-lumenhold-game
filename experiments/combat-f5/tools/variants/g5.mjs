// G5 = G4 plus class retune for the shorter fights: Duellist's main-skill edge trimmed again, Hollow adept less frail,
// Mend heals 27/28/29 (it now has to be timed, not sheltered).
import g4 from './g4.mjs';
export default R=>{
 g4(R);
 R.LOADOUTS.Duellist.offsets=[4,0,-7,0,4,-1];
 R.LOADOUTS['Hollow adept'].offsets=[6,4,-2,-6,-4,2];   // was 6,6,-4,-6,-6,4
 R.SPELLS.mend.healing=[27,28,29];
};
