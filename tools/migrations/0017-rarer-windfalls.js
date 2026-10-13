// Phase 3 retune (design §8.7–8.8): windfalls should come 1–4 times a year; a balanced run saw ~6. Most are
// one-shot random events at the default weight, so the random ones (no place, track or plan) at weight ≤ 16 are
// made niche: weight 5. Place, track and plan windfalls stay as they are: you went there for them.
'use strict';
module.exports = {
  id: '0017-rarer-windfalls',
  description: 'random windfall events → weight 5 (niche)',
  run(ctx) {
    let n = 0;
    for (const e of Object.values(ctx.content.events)) {
      if (e.class !== 'windfall' || e.retired || e.place || e.track || e.plan || e.arc) continue;
      const L = ctx.lines(e.file), a = L.findIndex((l) => l.trim() === '@event ' + e.id);
      if (a < 0) throw new Error('event not found: ' + e.id);
      let end = a + 1; while (end < L.length && !/^(> |@)/.test(L[end])) end++;
      const w = L.findIndex((l, k) => k > a && k < end && /^weight:/.test(l));
      if (w >= 0) {
        const v = Number(L[w].replace(/^weight:\s*/, ''));
        if (!(v <= 16)) continue;
        ctx.edit({ file: e.file, line: w + 1 }, 'weight: 5');
      } else {
        let at = a; for (let k = a + 1; k < end; k++) if (/^(class|tone|trigger|when|actor|cast):/.test(L[k])) at = k;
        ctx.insertAfter({ file: e.file, line: at + 1 }, 'weight: 5');
      }
      n++;
    }
    ctx.report(n + ' random windfall(s) → weight 5');
  },
};
