// The generic audit (world expansion 1, plan §2a): generic social cards stop casting characters they don't fit, now that
// those characters have their own cards (content/events/romance/) or their own version of the card (`specializes:`).
//   - a generic card's first cast role gains `and not npc_is(<x>)` for each character it no longer casts;
//   - `soc_rival_taunt` casts only the two written rivals, Lyra and Bram;
//   - `align_saint_jibe` also casts Corvin, who says it fondly (`corvin_saint_jibe` specializes it);
//   - each character's confession no longer fires for an ex (a reconciliation goes through their ex card first).
// Confessions stay possible while you have a partner: `soc_two_timing` is the designed consequence (PROGRESS.md).
'use strict';
const EXCLUDE = {
  soc_drift: ['lyra', 'kael'], soc_homework_help: ['lyra', 'mir'], soc_lost_notes: ['lyra'], soc_confess_generic: ['lyra'],
  soc_argument: ['tobias', 'seraphine', 'kael'], date_rainy_afternoon: ['tobias'], soc_injured_friend: ['seraphine'],
  soc_two_timing: ['seraphine'], soc_bad_news: ['kael'], soc_friend_sick: ['kael'], soc_rumour: ['nessa'],
};
const ONLY = { soc_rival_taunt: ['lyra', 'bram'] };
const ALSO = { align_saint_jibe: { role: 'other', test: 'tagged(other, ruthless)', npc: 'corvin' } };
const CONFESS = ['lyra', 'tobias', 'seraphine', 'corvin', 'mir', 'kael', 'nessa'];
module.exports = {
  id: '0039-romance-generic-audit',
  description: 'Generic social cards stop casting characters with their own cards',
  run(ctx) {
    const ids = new Set([...Object.keys(EXCLUDE), ...Object.keys(ONLY), ...Object.keys(ALSO), ...CONFESS.map((x) => x + '_confession')]);
    for (const file of new Set([...ids].map((id) => ctx.content.events[id].file))) {
      const L = ctx.lines(file);
      let ev = null, cast = false;
      for (let k = 0; k < L.length; k++) {
        const m = /^@event\s+(\S+)/.exec(L[k]);
        if (m) { ev = ids.has(m[1]) ? m[1] : null; cast = false; continue; }
        if (!ev) continue;
        const line = { file, line: k + 1 };
        if (/^cast:/.test(L[k])) { cast = true; continue; }
        const role = cast && /^  ([a-z_]+): any where /.exec(L[k]);
        if (role) {
          cast = false;   // the first role only
          if (EXCLUDE[ev]) { ctx.edit(line, (l) => l + EXCLUDE[ev].map((x) => ' and not npc_is(' + x + ')').join('')); ctx.report(ev + ': not ' + EXCLUDE[ev].join(', ')); }
          if (ONLY[ev]) { ctx.edit(line, (l) => l + ' and (' + ONLY[ev].map((x) => 'npc_is(' + x + ')').join(' or ') + ')'); ctx.report(ev + ': only ' + ONLY[ev].join(', ')); }
          if (ALSO[ev]) { const a = ALSO[ev]; ctx.edit(line, (l) => l.replace(a.test, '(' + a.test + ' or npc_is(' + a.npc + '))')); ctx.report(ev + ': also ' + a.npc); }
        }
        const who = /^(\w+)_confession$/.exec(ev);
        if (who && /^when:/.test(L[k]) && !/"ex"/.test(L[k])) { ctx.edit(line, (l) => l + ' and bond(' + who[1] + ') != "ex"'); ctx.report(ev + ': not an ex'); }
      }
    }
  },
};
