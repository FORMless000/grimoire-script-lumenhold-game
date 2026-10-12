// Phase 3: the run is four years now. Where `year == 3` meant "the last year" (careers, farewells,
// graduation, the end of a chain) it becomes `final_year`. Each site was judged by hand; the others
// keep `year == 3` (the Hollow Star moves in step 5; the thesis topic is chosen in year 3 by design).
'use strict';
const FINAL = ['corvin_runaway', 'ilse_northern_letter', 'ilse_farewell', 'thorne_recommendation', 'y3_career_fair', 'y3_first_year_mentee', 'y3_last_lanterns',
  'y3_thesis', 'y3_portrait', 'y3_letter_to_self', 'y3_maud_seeds', 'y3_last_duel', 'y3_time_capsule', 'y3_speech'];
module.exports = {
  id: '0004-final-year',
  description: 'year == 3 → final_year where it means the last year (14 judged sites)',
  FINAL,
  run(ctx) {
    for (const id of FINAL) {
      const row = ctx.query('event', 'id == "' + id + '"')[0];
      if (!row) { ctx.report('not found: ' + id); continue; }
      const lines = ctx.lines(row.file);
      let n = row.line;
      while (n < lines.length && !/^when:/.test(lines[n]) && !lines[n].startsWith('@')) n++;
      if (!/^when:.*\byear == 3\b/.test(lines[n] || '')) { ctx.report('no "year == 3" in ' + id); continue; }
      ctx.edit({ file: row.file, line: n + 1 }, (l) => l.replace(/\byear == 3\b/, 'final_year'));
    }
  },
};
