// G4 = G2 plus Mend breaks your own Shadowstep (no healing in safety), and a dry stalemate is called after 5 quiet exchanges.
import g2 from './g2-classes.mjs';
export default R=>{ g2(R); R.SPELLS.mend.exposes=true; R.COMBAT_TUNING.decision={quietExchanges:5}; };
