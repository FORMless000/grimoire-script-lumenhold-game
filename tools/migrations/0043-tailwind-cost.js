// Combat balance (feedback 2026-10-24): Tailwind costs 4 Mana (was 5), +2 for each cast already in its chain, and its first hit
// is an Impulse's 9. The worldbook keeps the base cost, as in the combat roster (combat/setup/roster.mjs;
// test/combat-bridge.test.js keeps them equal).
'use strict';
module.exports = {
  id: '0043-tailwind-cost',
  description: 'Tailwind costs 4 Mana, as in the combat roster',
  run(ctx) {
    const file = 'content/world/spells.grim';
    const L = ctx.lines(file);
    let id = null;
    for (let k = 0; k < L.length; k++) {
      const m = /^@spell\s+(\S+)/.exec(L[k]);
      if (m) { id = m[1]; continue; }
      if (id === 'tailwind' && /^cost:/.test(L[k])) { ctx.edit({ file, line: k + 1 }, () => 'cost: 4'); ctx.report('tailwind: cost 4'); }
    }
  },
};
