// Repeated condition shapes -> named @conds (tools/convert/conds.js; report in build/convert/conds.json).
const C = require('../convert/conds.js');
const L = require('../convert/lib.js');

module.exports = {
  id: '0046-conds',
  description: 'repeated bond conditions -> courting(x), partner_here(x)',
  run(ctx) {
    const P = C.plan(ctx.content);
    L.writeReport(ctx.project.root, 'conds', { conds: P.conds.map((c) => ({ id: c.id, is: c.shape, uses: c.uses.length, cards: [...new Set(c.uses.map((u) => u.ch.e.id))] })), unnamed: P.unnamed });
    C.apply(ctx, P);
    ctx.report(P.conds.map((c) => c.id + ': ' + c.uses.length + ' use(s)').join(', ') + '; ' + P.unnamed.length + ' unnamed shape(s) in the report');
  },
};
