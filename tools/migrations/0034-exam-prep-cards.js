// Exams made manageable (2026-10-19): preparation now comes mostly from routine sources (each class month +3, +5 with a
// check won in class, and the library's revision card +3 a term), so the cards' own study gains drop one size
// (huge → large, large → medium, medium → small, small → tiny; tiny stays). Study costs (`study … -x`) stay as they are,
// so the cards' gains and losses roughly cancel and the routine sources decide the exam. The revision card is the
// routine source itself and keeps its +small.
'use strict';
const DOWN = { huge: 'large', large: 'medium', medium: 'small', small: 'tiny' };
const KEEP = new Set(['library_revision']);
module.exports = {
  id: '0034-exam-prep-cards',
  description: "the cards' study gains drop one size: routine class and library preparation decide exams",
  run(ctx) {
    const files = ctx.project.compileAll().sources.map((s) => s.path).filter((f) => f.endsWith('.grim') && f.startsWith('content/events/'));
    let n = 0; const cards = new Set(), sizes = {};
    for (const file of files) {
      const L = ctx.lines(file);
      let id = null;
      for (let k = 0; k < L.length; k++) {
        const ev = /^@event\s+(\S+)/.exec(L[k]); if (ev) { id = ev[1]; continue; }
        if (/^@/.test(L[k])) { id = null; continue; }
        const m = /^(\s+)study((?: \S+)?) \+(small|medium|large|huge)$/.exec(L[k]);
        if (!m || !id || KEEP.has(id)) continue;
        const to = DOWN[m[3]];
        ctx.edit({ file, line: k + 1 }, m[1] + 'study' + m[2] + ' +' + to);
        n++; cards.add(id); sizes[m[3] + '→' + to] = (sizes[m[3] + '→' + to] || 0) + 1;
      }
    }
    ctx.report(n + ' study gains lowered one size in ' + cards.size + ' cards: ' + Object.entries(sizes).map(([k, v]) => k + ' ' + v).join(', '));
  },
};
