// Phase 3 retune (bigger tier rows in @balance): the rows grew by different factors, so a few routine options
// crossed the budget again. Same rules and code as 0013 (free → a tiny cost; over → one tier off a gain).
// The worklist is the lint output at the time (file, event line, option key, kind).
'use strict';
const base = require('./0013-routine-budget.js');
const WORK = [["content/events/classes.grim",615,"right","over"],["content/events/clubs.grim",234,"left","free"],["content/events/people_others.grim",8,"right","over"]];
module.exports = {
  id: '0016-retune-budget',
  description: 'routine options back within budget after the tier-row retune',
  WORK,
  run(ctx) { return base.run(ctx, WORK); },
};
