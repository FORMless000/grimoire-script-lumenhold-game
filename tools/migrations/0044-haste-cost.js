// Combat balance (feedback 2026-10-24): Haste gives a free Parry to every action that doesn't throw its Impulse, and costs 7
// Mana at every rank (was 5) to pay for it. The worldbook's cost follows the combat roster (combat/setup/roster.mjs;
// test/combat-bridge.test.js keeps them equal).
'use strict';
module.exports = {
  id: '0044-haste-cost',
  description: 'Haste costs 7 Mana at every rank, as in the combat roster',
  run(ctx) {
    const file = 'content/world/spells.grim';
    const L = ctx.lines(file);
    let id = null;
    for (let k = 0; k < L.length; k++) {
      const m = /^@spell\s+(\S+)/.exec(L[k]);
      if (m) { id = m[1]; continue; }
      if (id === 'haste' && /^cost:/.test(L[k])) { ctx.edit({ file, line: k + 1 }, () => 'cost: 7, 7, 7'); ctx.report('haste: cost 7, 7, 7'); }
    }
  },
};
