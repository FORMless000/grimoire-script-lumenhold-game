// Playtest 2, M13: relationship milestones are pushed outside the pools, on a ramp: from the threshold their
// gate already names (40% a month) to certain at a second, higher mark. Becoming friends no longer waits on
// winning a draw against every other social card (L13).
'use strict';
const RAMP = {
  soc_become_friends: 'rel(npc) 18..30', soc_become_close: 'rel(npc) 36..50', soc_make_peace: 'rel(npc) 3..15',
  soc_confess_generic: 'spark(npc) 30..45', bram_turns: 'rel(bram) 6..15',
};
for (const n of ['lyra', 'tobias', 'seraphine', 'corvin', 'mira', 'nessa', 'kael']) RAMP[n + '_confession'] = 'spark(' + n + ') 25..40';
module.exports = {
  id: '0025-milestone-ramps',
  description: 'relationship milestones pushed on a ramp (`ramp:`, M13)',
  RAMP,
  run(ctx) {
    const files = ctx.project.compileAll().sources.map((s) => s.path).filter((f) => f.endsWith('.grim'));
    const left = new Set(Object.keys(RAMP));
    for (const file of files) {
      ctx.lines(file).forEach((l, i) => {
        const m = l.match(/^@event ([a-z0-9_]+)$/);
        if (m && RAMP[m[1]]) { ctx.insertAfter({ file, line: i + 1 }, 'ramp: ' + RAMP[m[1]]); left.delete(m[1]); }
      });
    }
    if (left.size) throw new Error('not found: ' + [...left].join(', '));
    ctx.report(Object.keys(RAMP).length + ' milestones on a ramp');
  },
};
