// Combat F5.11-plan.1 (docs/minigame-combat-f5.11-plan.1-2026-10-21.md): the spells' Mana costs follow the combat roster
// (combat/setup/roster.mjs; test/combat-bridge.test.js keeps them equal): Flame 10/9/8 and Mend 10/9/8 (were 9/8/7),
// Hoarfrost 8 (was 7), Compel 18 (F5.11, was 16). English Distil becomes Distill (id purify; the Chinese name stays), in the
// worldbook and in the card lines that use the verb.
'use strict';
const COST = { flame: '10, 9, 8', mend: '10, 9, 8', hoarfrost: '8', compel: '18' };
const spell = (l) => l.replace(/\bDistil\b/g, 'Distill').replace(/\bdistils\b/g, 'distills').replace(/\bdistil\b/g, 'distill');
module.exports = {
  id: '0041-f511-plan1-spells',
  description: 'Combat F5.11-plan.1: Flame, Mend, Hoarfrost and Compel costs; Distil → Distill',
  run(ctx) {
    const file = 'content/world/spells.grim';
    const L = ctx.lines(file);
    let id = null;
    for (let k = 0; k < L.length; k++) {
      const m = /^@spell\s+(\S+)/.exec(L[k]);
      if (m) { id = m[1]; continue; }
      const line = { file, line: k + 1 };
      if (COST[id] && /^cost:/.test(L[k])) { ctx.edit(line, () => 'cost: ' + COST[id]); ctx.report(id + ': cost ' + COST[id]); }
      if (id === 'purify' && /^(name|verb): Distil$/.test(L[k])) { ctx.edit(line, spell); ctx.report('purify: ' + L[k].split(':')[0]); }
    }
    // The spell's own uses: the Distill lesson and chain cards (whole events), and each `up[purify]` option with its results.
    const whole = { 'content/events/club_spell_chains.grim': /^# -+ Apothecary Clerk/, 'content/events/pools/spell_lessons.grim': /Pell taught you to Distil/ };
    for (const f of ['content/events/club_spell_chains.grim', 'content/events/pools/spell_lessons.grim', 'content/events/pools/courses_upper.grim', 'content/events/pools/courses_a.grim']) {
      const C = ctx.lines(f);
      let inSpell = false, inOption = false;
      for (let k = 0; k < C.length; k++) {
        if (whole[f]) { if (whole[f].test(C[k])) inSpell = true; else if (/^# -{4,}/.test(C[k]) || (/^@event/.test(C[k]) && f.endsWith('spell_lessons.grim') && inSpell && !/purify|distil/i.test(C[k]))) inSpell = /^# -+ Apothecary Clerk/.test(C[k]); }
        if (/^> /.test(C[k])) inOption = /^> up\[purify\]/.test(C[k]);
        else if (/^@event/.test(C[k])) inOption = false;
        if ((inSpell || inOption) && /\b[Dd]istils?\b/.test(C[k])) { ctx.edit({ file: f, line: k + 1 }, spell); ctx.report(f + ':' + (k + 1) + ' Distill'); }
      }
    }
  },
};
