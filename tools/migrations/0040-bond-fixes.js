// Bond fixes (world expansion 1, plan §2b), now that Lyra and Bram have their own rivalry cards (content/events/bonds/):
//   - the generic truce (soc_make_peace) no longer casts them, so it can't pre-empt lyra_rival_respect or bram_turns;
//   - the generic friendship (soc_become_friends) casts Bram only once he has softened (bram_crying, bram_steps_in);
//   - bram_turns no longer fires for a close friend (its right option would have downgraded close to friend);
//   - the generic letter no longer casts Tamsin, who writes her own (chain_thornwick.grim); a character can have
//     only one version of a generic card, and Tamsin has seven letters.
'use strict';
const CAST = {
  soc_make_peace: (l) => l + ' and not npc_is(lyra) and not npc_is(bram)',
  soc_become_friends: (l) => l + ' and not (npc_is(bram) and not flag(bram_softened))',
  letter_from_a_friend: (l) => l + ' and not npc_is(tamsin)',
};
const WHEN = { bram_turns: (l) => l.replace('bond(bram) != "friend"', '(bond(bram) == "none" or bond(bram) == "rival" or bond(bram) == "nemesis")') };
module.exports = {
  id: '0040-bond-fixes',
  description: 'The generic truce, friendship and letter stop pre-empting written bonds',
  run(ctx) {
    const ids = new Set([...Object.keys(CAST), ...Object.keys(WHEN)]);
    for (const file of new Set([...ids].map((id) => ctx.content.events[id].file))) {
      const L = ctx.lines(file);
      let ev = null, cast = false;
      for (let k = 0; k < L.length; k++) {
        const m = /^@event\s+(\S+)/.exec(L[k]);
        if (m) { ev = ids.has(m[1]) ? m[1] : null; cast = false; continue; }
        if (!ev) continue;
        const line = { file, line: k + 1 };
        if (/^cast:/.test(L[k])) { cast = true; continue; }
        if (cast && CAST[ev] && /^  [a-z_]+: any where /.test(L[k])) { cast = false; ctx.edit(line, CAST[ev]); ctx.report(ev + ': cast'); }
        if (WHEN[ev] && /^when:/.test(L[k])) { ctx.edit(line, WHEN[ev]); ctx.report(ev + ': when'); }
      }
    }
  },
};
