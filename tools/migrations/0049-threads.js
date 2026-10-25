// `chain:` storylines -> @thread (stories where a start card begins them), clues owned by threads
// (tools/convert/threads.js; report in build/convert/threads.json).
const fs = require('fs');
const path = require('path');
const T = require('../convert/threads.js');
const L = require('../convert/lib.js');

module.exports = {
  id: '0049-threads',
  description: 'chain: -> thread: and @thread, from: story where a start card begins it',
  run(ctx) {
    const root = ctx.project.root;
    const { sources } = ctx.project.compileAll();
    const P = T.plan(ctx.content, (f) => fs.readFileSync(path.join(root, f), 'utf8').split('\n'), sources);
    L.writeReport(root, 'threads', { threads: P.threads.map(({ edits, ...t }) => t), rejected: P.report.rejected, loose_leads: P.report.loose_leads });
    T.apply(ctx, P);
    ctx.report(P.threads.map((t) => t.id + ' (' + t.mode + ')').join(', ') + '; ' + P.report.loose_leads.length + ' lead(s) outside any storyline in the report');
  },
};
