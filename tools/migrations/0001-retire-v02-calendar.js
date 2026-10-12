// Phase 2b: the four-year loop replaces the v0.2 calendar menus and exams (content/events/calendar_2b.grim
// and the engine's term-end exams). Retired events keep their text and translations; their `when:` becomes
// `false` (the old condition is kept in a comment) and they get the tag `retired`. The turn-dated beats move
// to the four-year calendar.
'use strict';
const RETIRE = {
  choose_elective: 'enrolment (offers: courses, pick: 2)',
  club_fair: 'club_fair_v3 (offers: clubs)',
  job_board: 'job_board_visit (the Job Board place)',
  summer_plans: 'break_plan',
  winter_trials: 'term-end exams (engine, design §7.3)',
  grand_exams: 'term-end exams (engine, design §7.3)',
  lantern_night: 'lantern_night_v3 (a festival at the lakeshore)',
};
const REDATE = {
  graduation_eve: ['turn == 36', 'turn == 47'],
  starfall: ['year < 3', 'year < 4'],
};
module.exports = {
  id: '0001-retire-v02-calendar',
  description: 'Retire the v0.2 calendar menus and exams; re-date graduation eve and Starfall for four years',
  run(ctx) {
    const blockLines = (row) => {
      const lines = ctx.lines(row.file), out = [];
      for (let i = row.line; i < lines.length && (i === row.line || !lines[i].startsWith('@')); i++) out.push({ n: i + 1, text: lines[i] });
      return out;
    };
    for (const [id, by] of Object.entries(RETIRE)) {
      const row = ctx.query('event', 'id == "' + id + '"')[0];
      if (!row) { ctx.report('not found: ' + id); continue; }
      const lines = blockLines(row);
      const when = lines.find((l) => /^when:/.test(l.text));
      const tags = lines.find((l) => /^tags:/.test(l.text));
      if (!when || /^when:\s*false/.test(when.text)) { ctx.report('already retired: ' + id); continue; }
      ctx.insertAfter({ file: row.file, line: row.line }, '# retired in phase 2b (was "' + when.text.replace(/^when:\s*/, '') + '"); replaced by ' + by);
      ctx.edit({ file: row.file, line: when.n }, 'when: false');
      if (tags) ctx.edit({ file: row.file, line: tags.n }, (l) => (/\bretired\b/.test(l) ? l : l + ' retired'));
      ctx.report('retired ' + id);
    }
    for (const [id, [from, to]] of Object.entries(REDATE)) {
      const row = ctx.query('event', 'id == "' + id + '"')[0];
      const when = row && blockLines(row).find((l) => /^when:/.test(l.text) && l.text.includes(from));
      if (!when) { ctx.report('no "' + from + '" in ' + id); continue; }
      ctx.edit({ file: row.file, line: when.n }, (l) => l.replace(from, to));
      ctx.report('re-dated ' + id + ': ' + from + ' → ' + to);
    }
  },
};
