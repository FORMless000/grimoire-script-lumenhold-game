// Phase 3 rough balance: the rel tiers shrank to about 0.6× (rel 1 2 4 6 10, decay −1), so relationship
// gates in conditions scale the same way: rel(x) >= 30 → rel(x) >= 18. Every comparison of rel(…) with a
// number literal, in when:/where:/hinted_when:/discover:/unlock: lines and inline {cond: …} text conditions.
'use strict';
const FACTOR = 0.6;
const RE = /(\brel\([a-z_]+\)\s*(?:>=|<=|>|<|==)\s*)(-?\d+)/g;
module.exports = {
  id: '0010-rel-thresholds',
  description: 'rel(x) thresholds × 0.6 (the rel tiers shrank)',
  FACTOR,
  run(ctx) {
    const files = new Set();
    for (const kind of ['event', 'place', 'fact', 'npc', 'state', 'ending']) for (const r of ctx.query(kind)) if (r.file) files.add(r.file);
    let n = 0;
    for (const f of files) {
      if (!f.endsWith('.grim')) continue;
      ctx.lines(f).forEach((l, i) => {
        if (!/\brel\([a-z_]+\)\s*(>=|<=|>|<|==)\s*-?\d/.test(l)) return;
        const out = l.replace(RE, (m0, pre, num) => { const v = Math.round(+num * FACTOR); n++; return pre + v; });
        if (out !== l) ctx.edit({ file: f, line: i + 1 }, out);
      });
    }
    ctx.report(n + ' threshold(s) scaled');
  },
};
