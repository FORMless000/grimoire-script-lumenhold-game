// Phase 3 (design §7.3): GPA replaces Standing. The `grades` resource had become write-only: five statements
// moved it and nothing read it. Exam work becomes `study` on the course; the thesis defence keeps its flags
// and renown; owning up costs a little mood instead. Then the resource, its term hook and its balance row go.
'use strict';
const EDITS = [
  // [file, event, exact old line (trimmed), new line or null to delete]
  ['content/events/slice_2b.grim', 'evo_final_practical', 'grades +medium', 'study evocation +medium'],
  ['content/events/slice_2b.grim', 'evo_final_practical', 'grades -small', 'mood -small'],
  ['content/events/slice_2b.grim', 'ref_food_fight', 'grades -tiny', 'mood -tiny'],
  ['content/events/calendar_2b.grim', 'thesis_defence', 'grades +large', null],
  ['content/events/calendar_2b.grim', 'thesis_defence', 'grades +medium', 'renown +small'],
];
module.exports = {
  id: '0012-retire-standing',
  description: 'GPA replaces Standing: the grades resource, its hook and its five remaining effects',
  run(ctx) {
    for (const [file, ev, from, to] of EDITS) {
      const lines = ctx.lines(file);
      const start = lines.findIndex((l) => l.trim() === '@event ' + ev);
      const i = lines.findIndex((l, k) => k > start && l.trim() === from);
      if (start < 0 || i < 0) throw new Error('not found: ' + ev + ' / ' + from);
      if (to == null) ctx.remove({ file, line: i + 1 });
      else ctx.edit({ file, line: i + 1 }, lines[i].replace(from, to));
    }
    // rules.grim: the resource block and the term_marks hook (with the comment line above each)
    const rules = 'content/core/rules.grim', R = ctx.lines(rules);
    const block = (head) => {
      const a = R.findIndex((l) => l.trim() === head); if (a < 0) throw new Error('not found: ' + head);
      let b = a + 1; while (b < R.length && !/^@/.test(R[b]) && !/^# /.test(R[b])) b++;
      while (b > a + 1 && R[b - 1].trim() === '') b--;
      const from = a > 0 && /^# /.test(R[a - 1]) && /Standing|GPA/.test(R[a - 1]) ? a - 1 : a;
      for (let k = from; k < b; k++) ctx.remove({ file: rules, line: k + 1 });
    };
    block('@resource grades'); block('@hook term_marks');
    // balance.grim: the grades row and weight
    const bal = 'content/core/balance.grim';
    ctx.lines(bal).forEach((l, i) => {
      if (/\| grades [\d .]+\|/.test(l)) ctx.edit({ file: bal, line: i + 1 }, l.replace(/ \| grades [\d .]+?(?= \|)/, ''));
      if (/^weights:.* grades \d/.test(l)) ctx.edit({ file: bal, line: i + 1 }, l.replace(/ grades [\d.]+/, ''));
    });
    ctx.report(EDITS.length + ' effect(s) rewritten; @resource grades and @hook term_marks removed');
  },
};
