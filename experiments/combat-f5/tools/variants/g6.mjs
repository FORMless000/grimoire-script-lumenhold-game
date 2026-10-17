// G6 = G2 plus a dry stalemate is called on points after 5 quiet exchanges (was 10).
import g2 from './g2-classes.mjs';
export default R=>{ g2(R); R.COMBAT_TUNING.decision={quietExchanges:5}; };
