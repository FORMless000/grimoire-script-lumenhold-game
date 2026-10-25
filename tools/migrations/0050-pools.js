// Card properties repeated across a place's, track's, plan's or file's cards -> @pool, and pool templates for what
// every pool of one track kind shares (tools/convert/pools.js; report in build/convert/pools.json).
const fs = require('fs');
const path = require('path');
const Pools = require('../convert/pools.js');
const L = require('../convert/lib.js');

module.exports = {
  id: '0050-pools',
  description: 'repeated card properties -> @pool (and course/club/job pool templates)',
  run(ctx) {
    const root = ctx.project.root;
    const P = Pools.plan(ctx.content, (f) => fs.readFileSync(path.join(root, f), 'utf8').split('\n'));
    L.writeReport(root, 'pools', {
      pools: P.pools.map((p) => ({ id: p.id, from: p.from || null, file: p.file, gives: Object.fromEntries(p.lift), tag: p.tag, cards: p.members.map((m) => m.id) })),
      templates: P.parents.map((p) => ({ id: p.id, gives: Object.fromEntries(p.lift), tag: p.tag, pools: p.children })),
      skipped: P.skipped,
    });
    Pools.apply(ctx, P);
    ctx.report(P.pools.length + ' pool(s) over ' + P.pools.reduce((n, p) => n + p.members.length, 0) + ' card(s); templates: ' + P.parents.map((p) => p.id).join(', '));
  },
};
