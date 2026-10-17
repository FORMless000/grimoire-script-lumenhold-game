// G2 = G1 plus class levers: Starlight hits harder (Release 36, or 60 after a Hold; was 30/48), Reflect is a two-exchange
// stance (the counter to spell-heavy foes), Duellist's Arcana edge trimmed and Scholar's Arcana raised.
import g1 from './g1-guard.mjs';
export default R=>{
 g1(R);
 R.SPELLS.starlight.release=[36,60];
 R.SPELLS.reflect.duration=[2];
 R.LOADOUTS.Duellist.offsets=[6,-1,-8,-1,5,-1];   // was 8,-2,-8,-2,6,-2
 R.LOADOUTS.Scholar.offsets=[5,7,0,-2,-6,-4];     // was 2,10,0,-2,-8,-2
};
