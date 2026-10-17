// G3b = G3a plus a dry stalemate is called on points after 5 quiet exchanges (was 10).
import g3a from './g3a.mjs';
export default R=>{ g3a(R); R.COMBAT_TUNING.decision={quietExchanges:5}; };
