// Phase 3: Standing (`grades`) gives way to the GPA (design §7.3). In events, states and endings:
//   grades ±n (or a~b)  → study ±tier   (exam preparation for every enrolled course; nearest tier of 1 3 5 8 12)
//   grades >= N         → gpa >= X      (≥85 → 3.5, ≥70 → 3.0, ≥50 → 2.5, ≥30 → 2.0, else 1.5)
//   grades < N          → (turn > 4 and gpa < X)   (there is no GPA before the first term ends)
// core/rules.grim (the Standing resource and its hooks) is left for step 8, when the resource goes.
'use strict';
const STUDY = [1, 3, 5, 8, 12], TIERS = ['tiny', 'small', 'medium', 'large', 'huge'];
const tierOf = (n) => { let best = 0; STUDY.forEach((v, i) => { if (Math.abs(v - n) < Math.abs(STUDY[best] - n)) best = i; }); return TIERS[best]; };
const gpaOf = (n) => (n >= 85 ? 3.5 : n >= 70 ? 3.0 : n >= 50 ? 2.5 : n >= 30 ? 2.0 : 1.5).toFixed(1);
const EFFECT = /^(\s*)grades\s*([+-])\s*(\d+)(?:\s*~\s*(\d+))?\s*$/;
const COND = /\bgrades\s*(>=|>|<=|<)\s*(\d+)/g;
module.exports = {
  id: '0005-grades-to-study',
  description: 'grades effects → study tiers; grades conditions → gpa',
  tierOf, gpaOf,
  run(ctx) {
    let eff = 0, cond = 0;
    for (const file of ctx.project.contentFiles()) {
      const rel = ctx.project.rel(file);
      if (rel === 'content/core/rules.grim' || rel === 'content/core/balance.grim') continue;
      ctx.lines(file).forEach((text, i) => {
        if (/^\s*#/.test(text)) return;
        let m, next = text;
        if ((m = text.match(EFFECT))) { const n = m[4] ? (+m[3] + +m[4]) / 2 : +m[3]; next = m[1] + 'study ' + m[2] + tierOf(n); eff++; }
        else if (!/^\s*(text|title|scene|say(\[[a-z_]+\])?|> [a-z]+(\[[a-z_]+\])?)\s*:/.test(text) && COND.test(text)) {
          COND.lastIndex = 0;
          next = text.replace(COND, (all, op, n) => { cond++; const x = gpaOf(+n); return op[0] === '>' ? 'gpa >= ' + x : '(turn > 4 and gpa < ' + x + ')'; });
        }
        COND.lastIndex = 0;
        if (/\bgrades\s*(\+=|-=|=)/.test(text) && !/^\s*(text|say)/.test(text)) ctx.report('left as is (assignment): ' + rel + ':' + (i + 1) + ' ' + text.trim());
        if (next !== text) ctx.edit({ file, line: i + 1 }, next);
      });
    }
    ctx.report(eff + ' effect(s), ' + cond + ' condition(s)');
  },
};
