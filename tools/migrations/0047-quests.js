// Hand-wired quests (the club and job spell chains) -> threads from the quest template (tools/convert/quests.js;
// report in build/convert/quests.json).
const fs = require('fs');
const path = require('path');
const Q = require('../convert/quests.js');
const L = require('../convert/lib.js');

module.exports = {
  id: '0047-quests',
  description: 'club and job spell chains -> @thread from: quest',
  run(ctx) {
    const root = ctx.project.root;
    const { sources } = ctx.project.compileAll();
    const P = Q.plan(ctx.content, (f) => fs.readFileSync(path.join(root, f), 'utf8').split('\n'), sources);
    L.writeReport(root, 'quests', { quests: P.quests.map(({ edits, ...q }) => q), rejected: P.report });
    Q.apply(ctx, P);
    ctx.report(P.quests.map((q) => q.id + (q.mode === 'quest' ? '' : ' (' + q.mode + ')')).join(', '));
  },
};
