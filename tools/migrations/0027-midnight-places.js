// Playtest 2, M41: six places are open at midnight, for the midnight turn's pick (`visit midnight`).
'use strict';
const PLACES = ['gilded_newt', 'boathouse', 'refectory', 'restricted_section', 'observatory', 'gargoyle_passage'];
module.exports = {
  id: '0027-midnight-places',
  description: 'six places open at midnight (M41)',
  run(ctx) {
    const files = ctx.project.compileAll().sources.map((s) => s.path).filter((f) => f.endsWith('.grim'));
    const left = new Set(PLACES);
    for (const file of files) {
      let place = null;
      ctx.lines(file).forEach((l, i) => {
        const m = l.match(/^@place ([a-z0-9_]+)$/);
        if (m) place = m[1]; else if (/^@/.test(l)) place = null;
        if (place && left.has(place) && /^open:/.test(l)) {
          if (!/\bmidnight\b/.test(l)) ctx.edit({ file, line: i + 1 }, l.trimEnd() + ' midnight');
          left.delete(place);
        }
      });
    }
    if (left.size) throw new Error('not found: ' + [...left].join(', '));
    ctx.report(PLACES.length + ' places open at midnight');
  },
};
