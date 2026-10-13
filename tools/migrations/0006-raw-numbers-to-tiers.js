// Phase 3: raw amounts in events become size tiers (design §8.4), taking the nearest tier of each row in
// `@balance sizes` (ties favour the player: a gain rounds up, a cost rounds down; a range a~b uses its midpoint). Resources use their own
// row, skills the xp row, rel/spark/npc_rel theirs. Custom counters (`hollow +1`) and hooks, states and
// resources keep raw numbers: they are rules, not card outcomes.
'use strict';
const TIERS = ['tiny', 'small', 'medium', 'large', 'huge'];
function nearest(row, n, gain = false) { let best = 0; row.forEach((v, i) => { const d = Math.abs(v - n) - Math.abs(row[best] - n); if (d < 0 || (d === 0 && gain)) best = i; }); return TIERS[best]; }
module.exports = {
  id: '0006-raw-numbers-to-tiers',
  description: 'raw amounts in events → nearest size tier',
  nearest,
  run(ctx) {
    const c = ctx.content, sizes = (c.balance && c.balance.sizes) || {};
    const by = {};
    let n = 0;
    for (const kind of ['delta', 'rel', 'spark']) {
      for (const r of ctx.query(kind, 'block_kind == "event"')) {
        if (r.tier || r.min == null) continue;
        const name = r.name;
        const row = kind === 'delta' ? (c.skills[name] ? 'xp' : c.resources[name] ? name : null) : kind;
        if (!row || !sizes[row]) continue;
        const lines = ctx.lines(r.file);
        const text = lines[r.line - 1];
        const m = text.match(/^(\s*)(.*?)\s*([+-])\s*(\d+)(?:\s*~\s*(\d+))?\s*$/);
        if (!m) { ctx.report('skipped (unexpected form) ' + r.file + ':' + r.line + ' ' + text.trim()); continue; }
        const amt = m[5] ? (+m[4] + +m[5]) / 2 : +m[4];
        const tier = nearest(sizes[row], amt, m[3] === '+');
        ctx.edit({ file: r.file, line: r.line }, m[1] + m[2] + ' ' + m[3] + tier);
        by[row] = (by[row] || 0) + 1; n++;
      }
    }
    ctx.report(n + ' amount(s): ' + Object.entries(by).map(([k, v]) => k + ' ' + v).join(', '));
  },
};
