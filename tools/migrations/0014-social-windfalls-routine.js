// Phase 3 (design §8.7–8.8): windfalls should come 1–4 times a year, but 40 relationship events were classed
// windfall and recur once per character, so a balanced run saw ~10 a year. Ordinary bonding is routine, not a
// lucky break: social windfalls (trigger: social, or a per: cast) become `class: routine`. Migration 0015 then
// gives any option that is now a free gain the routine budget's tiny cost.
'use strict';
module.exports = {
  id: '0014-social-windfalls-routine',
  description: 'social windfall events → routine (they recur per character)',
  run(ctx) {
    let n = 0;
    for (const e of Object.values(ctx.content.events)) {
      if (e.class !== 'windfall' || !(e.trigger === 'social' || e.per)) continue;
      const L = ctx.lines(e.file), a = L.findIndex((l) => l.trim() === '@event ' + e.id);
      const i = L.findIndex((l, k) => k > a && /^class:\s*windfall\s*$/.test(l));
      if (a < 0 || i < 0) throw new Error('class line not found: ' + e.id);
      ctx.edit({ file: e.file, line: i + 1 }, 'class: routine'); n++;
    }
    ctx.report(n + ' social windfall(s) → routine');
  },
};
