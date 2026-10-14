// Playtest 2, M24: in a menu, an option whose `when` fails is now hidden unless it states its prerequisite with
// `locked:`. Prerequisites the player can see (a skill, crowns, a year) get one; relationship, plot and state
// gates stay hidden. Internship offers are reworked separately (M36).
'use strict';
const LOCKED = {
  'choose_elective.umbral': 'Needs Lore 20, or your second year.',
  'job_board.apothecary': 'Needs Alchemy 12.',
  'job_board.tutor': 'Needs Lore 18.',
  'job_board.courier': 'Needs Vigor 14.',
  'summer_plans.travel': 'Needs 40 crowns.',
  'y3_career_fair.conclave': 'Needs Arcana 30.',
  'y3_career_fair.library': 'Needs Lore 30.',
  'y3_career_fair.guild': 'Needs Alchemy 28.',
  'y3_career_fair.unseen': 'Needs Guile 25.',
  'y3_career_fair.circus': 'Needs Charm 22.',
};
module.exports = {
  id: '0024-locked-reasons',
  description: 'menu options gated by a visible prerequisite say so (`locked:`, M24)',
  LOCKED,
  run(ctx) {
    const files = ctx.project.compileAll().sources.map((s) => s.path).filter((f) => f.endsWith('.grim'));
    const left = new Set(Object.keys(LOCKED));
    for (const file of files) {
      const L = ctx.lines(file);
      let id = null, key = null;
      L.forEach((l, i) => {
        let m;
        if ((m = l.match(/^@event ([a-z0-9_]+)$/))) { id = m[1]; key = null; return; }
        if (/^@/.test(l)) { id = null; return; }
        if (id && (m = l.match(/^> ([a-z0-9_]+)(?:\[[a-z_]+\])?:/))) { key = m[1]; return; }
        const k = id + '.' + key;
        if (key && LOCKED[k] && /^  when: /.test(l)) { ctx.insertAfter({ file, line: i + 1 }, '  locked: ' + LOCKED[k]); left.delete(k); }
      });
    }
    if (left.size) throw new Error('not found: ' + [...left].join(', '));
    ctx.report(Object.keys(LOCKED).length + ' options name their prerequisite');
  },
};
