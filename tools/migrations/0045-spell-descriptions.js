// Combat F5.11-plan.1 and balance (2026-10-24): four worldbook descriptions still told the old rules. Haste no longer makes
// you act first (it slips an Impulse in with a spell and a Parry in with anything else); Brace softens blows for two exchanges;
// Torment's toll comes from the Mana its victim pays; Compel holds its victim to the move it caught for three exchanges.
'use strict';
const DESC = {
  haste: 'Speed borrowed from hares and hawks: a blow slipped in between your spells, a parry in between everything else. It wears off quickly.',
  brace: 'Plant your feet and hold. For a breath or two, blows that should fell you land soft.',
  torment: 'Every spell your opponent pays for hurts them. It is forbidden for good reason.',
  compel: 'Make someone do what they just did again, and again, whether they want to or not. Forbidden.',
};
module.exports = {
  id: '0045-spell-descriptions',
  description: 'Haste, Brace, Torment and Compel descriptions follow the combat rules',
  run(ctx) {
    const file = 'content/world/spells.grim';
    const L = ctx.lines(file);
    let id = null;
    for (let k = 0; k < L.length; k++) {
      const m = /^@spell\s+(\S+)/.exec(L[k]);
      if (m) { id = m[1]; continue; }
      if (DESC[id] && /^desc:/.test(L[k])) { ctx.edit({ file, line: k + 1 }, () => 'desc: ' + DESC[id]); ctx.report(id + ': desc'); }
    }
  },
};
