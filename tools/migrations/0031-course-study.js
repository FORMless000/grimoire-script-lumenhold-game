// Review fixes (B): bare `study +x` prepares for every enrolled course. In a course's own card (`track:` a course)
// the scene is one subject's lesson, so its study effect becomes `study <that course> +x`. Bare study elsewhere
// (social scenes, crises, library work) is left as it is; non-study scenes that used it are fixed by hand.
'use strict';
module.exports = {
  id: '0031-course-study',
  description: 'bare study in a course card prepares for that course only',
  run(ctx) {
    const course = new Set(Object.values(ctx.content.tracks).filter((t) => t.kind === 'course').map((t) => t.id));
    const files = ctx.project.compileAll().sources.map((s) => s.path).filter((f) => f.endsWith('.grim'));
    let n = 0; const cards = new Set();
    for (const file of files) {
      const L = ctx.lines(file);
      let track = null, id = null, start = -1;
      const flush = (end) => {
        if (!id || !track || !course.has(track)) return;
        for (let k = start; k < end; k++) {
          const m = /^(\s+)study ([+-]\S+)$/.exec(L[k]);
          if (!m) continue;
          const t = track;
          ctx.edit({ file, line: k + 1 }, (l) => l.replace(/study ([+-]\S+)$/, 'study ' + t + ' $1'));
          n++; cards.add(id);
        }
      };
      for (let k = 0; k <= L.length; k++) {
        if (k === L.length || /^@/.test(L[k])) {
          flush(k);
          const m = k < L.length && /^@event (\S+)/.exec(L[k]);
          id = m ? m[1] : null; track = null; start = k + 1;
        } else if (id) {
          const m = /^track:\s*(\S+)\s*$/.exec(L[k]);
          if (m) track = m[1];
        }
      }
    }
    ctx.report(n + ' study effects in ' + cards.size + ' course cards');
  },
};
