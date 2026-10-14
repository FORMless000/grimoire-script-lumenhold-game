// Playtest 2, M40: the Midnight Cartographers are a society (no dues, performance or ranks), so their cards lose
// `perform`, `rank_xp` and `promote` on the track. The cards' other costs and risks stay.
'use strict';
module.exports = {
  id: '0026-society',
  description: 'the Cartographers keep no performance or ranks (M40)',
  run(ctx) {
    const files = ctx.project.compileAll().sources.map((s) => s.path).filter((f) => f.endsWith('.grim'));
    let n = 0, id = null, theirs = false;
    for (const file of files) {
      const L = ctx.lines(file);
      L.forEach((l, i) => {
        let m;
        if ((m = l.match(/^@event ([a-z0-9_]+)$/))) { id = m[1]; theirs = false; return; }
        if (/^@/.test(l)) { id = null; return; }
        if (id && /^track: cartographers$/.test(l)) theirs = true;
        if (/^\s+(perform|rank_xp|promote) cartographers\b/.test(l) || (id && theirs && /^\s+(perform|rank_xp|promote) track\b/.test(l))) { ctx.remove({ file, line: i + 1 }); n++; }
      });
    }
    ctx.report(n + ' performance and rank statements removed');
  },
};
