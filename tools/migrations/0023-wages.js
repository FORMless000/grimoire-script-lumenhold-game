// Playtest 2, M10: a job pays through its shift cards, not at the map pick. Every option of a job's events starts
// with `wage` (one shift's pay at your rank); the tips, fines and docked pay the events already hold are the spread.
// `tavern_extra_shifts` pays its extra shifts as `wage overtime` instead of a flat large sum.
'use strict';
const JOBS = new Set(['library_assistant', 'tavern', 'apothecary_clerk', 'broom_courier']);
const SWAP = { 'tavern_extra_shifts.right': [/^(\s*)gold \+large$/, '$1wage overtime'] };
module.exports = {
  id: '0023-wages',
  description: 'job pay moves from the map pick into the shift cards (`wage`, M10)',
  run(ctx) {
    const files = ctx.project.compileAll().sources.map((s) => s.path).filter((f) => f.endsWith('.grim'));
    let n = 0, events = 0, swapped = 0;
    for (const file of files) {
      const L = ctx.lines(file);
      let id = null, job = false, side = null;
      const opts = [];
      L.forEach((l, i) => {
        let m;
        if ((m = l.match(/^@event ([a-z0-9_]+)$/))) { id = m[1]; job = false; side = null; return; }
        if (/^@/.test(l)) { id = null; return; }
        if (id && (m = l.match(/^track: ([a-z_]+)$/)) && JOBS.has(m[1])) { job = true; events++; }
        if (id && job && (m = l.match(/^> (left|right|[a-z0-9_]+):/))) { side = m[1]; opts.push({ line: i + 1 }); }
        const sw = id && job && side && SWAP[id + '.' + side];
        if (sw && sw[0].test(l)) { ctx.edit({ file, line: i + 1 }, l.replace(sw[0], sw[1])); swapped++; }
      });
      for (const o of opts) { ctx.insertAfter({ file, line: o.line }, '  wage'); n++; }
    }
    if (swapped !== Object.keys(SWAP).length) throw new Error('overtime swap not found');
    ctx.report(n + ' job options pay a wage, in ' + events + ' events');
  },
};
