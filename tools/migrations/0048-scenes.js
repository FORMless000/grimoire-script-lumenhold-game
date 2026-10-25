// Decks drawn by `queue any tagged` (the Whisperwood delve, the night upstairs) -> threads from the scene template
// (tools/convert/scenes.js; report in build/convert/scenes.json).
const fs = require('fs');
const path = require('path');
const S = require('../convert/scenes.js');
const L = require('../convert/lib.js');

module.exports = {
  id: '0048-scenes',
  description: 'queue any tagged decks -> @thread from: scene',
  run(ctx) {
    const root = ctx.project.root;
    const { sources } = ctx.project.compileAll();
    const P = S.plan(ctx.content, (f) => fs.readFileSync(path.join(root, f), 'utf8').split('\n'), sources);
    L.writeReport(root, 'scenes', { scenes: P.scenes.map(({ edits, ...s }) => s), rejected: P.rejected, report: P.report });
    if (P.rejected.length) throw new Error('scenes: the conversion would change ' + P.rejected.length + ' card(s), e.g. ' + JSON.stringify(P.rejected[0]));
    S.apply(ctx, P);
    ctx.report(P.scenes.map((s) => s.id + ' (' + s.cards + ' cards, ' + s.entries.length + ' entries)').join(', '));
  },
};
