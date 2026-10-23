// Combat balance after F5.11-plan.1 (feedback 2026-10-21): Bramble costs 12 Mana (was 10), with 4 damage (was 10), so its
// Bind isn't cheap. The worldbook's cost follows the combat roster (combat/setup/roster.mjs; test/combat-bridge.test.js
// keeps them equal).
'use strict';
module.exports = {
  id: '0042-bramble-cost',
  description: 'Bramble costs 12 Mana, as in the combat roster',
  run(ctx) {
    const file = 'content/world/spells.grim';
    const L = ctx.lines(file);
    let id = null;
    for (let k = 0; k < L.length; k++) {
      const m = /^@spell\s+(\S+)/.exec(L[k]);
      if (m) { id = m[1]; continue; }
      if (id === 'bramble' && /^cost:/.test(L[k])) { ctx.edit({ file, line: k + 1 }, () => 'cost: 12'); ctx.report('bramble: cost 12'); }
    }
  },
};
