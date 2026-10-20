// No spark with someone hostile to you (feedback 2026-10-20): a card that raises spark needs friendship of at least 0
// with that person, unless the card itself is the reason (a partner's cards, the confessions, which ask for more).
//   - fixed-character cards gated only by met() or spark(): `rel(<npc>) >= 0` joins the `when:`;
//   - cast cards: `rel(<role>) >= 0` joins the role's `where`;
//   - story cards that keep their scene but gate the spark line (`if spark(x) >= N:`): the `if` gains the friendship.
'use strict';
const WHEN = {
  heal_tobias_sting: 'tobias', garden_moonflower: 'tobias', slice_candle_flame: 'lyra',
  letter_lyra_book: 'lyra', letter_tobias_seeds: 'tobias', letter_seraphine_painting: 'seraphine', letter_corvin_no_jokes: 'corvin',
  letter_mir_ticking: 'mir', letter_kael_star_chart: 'kael', letter_nessa_off_record: 'nessa',
};
const CAST = { soc_secret_admirer: ['npc'], jealousy_two_invitations: ['suitor', 'other'], jealousy_seen_together: ['suitor', 'other'], jealousy_cold_supper: ['suitor', 'other'] };
const IFS = { y3_last_duel: 'lyra', hs_aftermath: 'kael' };
module.exports = {
  id: '0036-no-spark-when-hostile',
  description: 'Spark cards need friendship of at least 0',
  run(ctx) {
    const ids = new Set([...Object.keys(WHEN), ...Object.keys(CAST), ...Object.keys(IFS)]);
    for (const file of new Set([...ids].map((id) => ctx.content.events[id].file))) {
      const L = ctx.lines(file);
      let ev = null;
      for (let k = 0; k < L.length; k++) {
        const m = /^@event\s+(\S+)/.exec(L[k]);
        if (m) { ev = ids.has(m[1]) ? m[1] : null; continue; }
        if (!ev) continue;
        const line = { file, line: k + 1 };
        if (WHEN[ev] && /^when:/.test(L[k]) && !/rel\(/.test(L[k])) { ctx.edit(line, (l) => l + ' and rel(' + WHEN[ev] + ') >= 0'); ctx.report(ev + ': when'); }
        for (const role of CAST[ev] || []) {
          const re = new RegExp('^  ' + role + ': any where ');
          if (re.test(L[k]) && !new RegExp('rel\\(' + role + '\\)').test(L[k])) { ctx.edit(line, (l) => l.replace(/ and around\(/, ' and rel(' + role + ') >= 0 and around(').replace(/(bond\(npc\) != "partner")$/, '$1 and rel(npc) >= 0')); ctx.report(ev + ': ' + role); }
        }
        if (IFS[ev] && new RegExp('^\\s+if spark\\(' + IFS[ev] + '\\) >= \\d+:$').test(L[k])) { ctx.edit(line, (l) => l.replace(/:$/, ' and rel(' + IFS[ev] + ') >= 0:')); ctx.report(ev + ': if'); }
      }
    }
  },
};
