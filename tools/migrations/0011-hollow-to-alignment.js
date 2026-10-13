// Phase 3: the v0.2 `hollow` counter is discarded (design §8.2, §10.6). It did two jobs badly: a plot-progress
// counter that ~50 statements raised (half in everyday events, so every run reached the finale) and a stand-in
// for the dark side. Now:
//   - plot gates read the arc: `clock(hollowstar)` (scheduled: the world moves without you) and
//     `clues(hollowstar)` / side flags (what you engaged with);
//   - moral weight goes on `alignment` (−100 Hollow … +100 Lumen): dark choices −, selfless ones +;
//   - every other `hollow +1` is dropped (an option left with no effect gets `lore +tiny`, it was a discovery).
// Also adds alignment to moral choices in everyday events that never had any (MORAL below).
'use strict';

// `hollow` gates → arc gates (exact substrings, per file).
const GATES = [
  ['content/world/places.grim', 'discover: hollow >= 3', 'discover: clues(hollowstar) >= 3'],
  ['content/world/places.grim', 'hinted_when: hollow >= 1', 'hinted_when: clock(hollowstar) >= 1'],
  ['content/events/people_students.grim', 'when: hollow >= 2 and rel(nessa) >= 6', 'when: clues(hollowstar) >= 1 and rel(nessa) >= 6'],
  ['content/events/chain_ilse.grim', '(met(kael) and hollow >= 2)', '(met(kael) and clues(hollowstar) >= 2)'],
  ['content/events/slice_2a.grim', 'when: turn >= 5 and hollow >= 0', 'when: turn >= 5'],
  ['content/events/people_others.grim', 'when: rel(maud) >= 9 and hollow >= 1', 'when: rel(maud) >= 9 and clock(hollowstar) >= 1'],
  ['content/events/chain_hollowstar.grim', 'when: turn >= 5 and hollow >= 1 and not has(hollow_dreams)', 'when: turn >= 5 and clock(hollowstar) >= 1 and not has(hollow_dreams)'],
  ['content/events/chain_hollowstar.grim', 'when: turn >= 8 and met(kael) and hollow >= 1', 'when: turn >= 8 and met(kael) and clock(hollowstar) >= 1'],
  ['content/events/chain_hollowstar.grim', 'when: hollow >= 1 and not flag(knows_founders_seal)', 'when: clues(hollowstar) >= 1 and not flag(knows_founders_seal)'],
  ['content/events/chain_hollowstar.grim', 'when: hollow >= 2 and rel(kael) >= 15 and not flag(kael_told)', 'when: clues(hollowstar) >= 1 and rel(kael) >= 15 and not flag(kael_told)'],
  ['content/events/chain_hollowstar.grim', 'when: turn >= 18 and hollow >= 2 and not flag(grey_offer_seen)', 'when: turn >= 18 and (clues(hollowstar) >= 2 or alignment <= -30) and not flag(grey_offer_seen)'],
  ['content/events/chain_hollowstar.grim', 'when: hollow >= 3 and not flag(star_key)', 'when: clues(hollowstar) >= 3 and not flag(star_key)'],
  ['content/events/chain_hollowstar.grim', 'when: final_year and month >= 3 and month <= 7 and hollow >= 3', 'when: final_year and month >= 3 and month <= 7 and (clues(hollowstar) >= 3 or flag(kael_ally) or flag(sided_wardens) or flag(sided_dumonts) or flag(sided_self))'],
  // The Night comes for whoever engaged with the plot (or whom the Star has noticed); the rest are bystanders.
  ['content/events/chain_hollowstar.grim', 'when: final_year and month == 9 and hollow >= 3', 'when: final_year and month == 9 and not flag(hollow_out) and (clues(hollowstar) >= 3 or flag(warden_trial) or flag(kael_ally) or flag(sided_wardens) or flag(sided_dumonts) or flag(sided_self) or alignment <= -60)'],
  ['content/events/chain_hollowstar_acts.grim', 'when: hollow >= 2 or flag(kael_told) or flag(warden_trial)', 'when: clues(hollowstar) >= 2 or flag(kael_told) or flag(warden_trial)'],
  ['content/events/chain_hollowstar_acts.grim', 'when: hollow >= 2 or flag(sided_wardens) or flag(sided_dumonts) or flag(sided_self)', 'when: clues(hollowstar) >= 2 or flag(sided_wardens) or flag(sided_dumonts) or flag(sided_self)'],
];

// event|option → alignment change replacing (or added beside) the option's effects.
const MORAL = {
  // the Hollow Star chain: power from the Star is the Hollow; refusing it, protecting others is the Lumen
  'hs_star_mark|right': '-medium', 'hs_star_mark|left': '+medium',
  'hs_grey_offer|right': '-medium', 'hs_grey_offer|left': '+small',
  'hs_kael_truth|left': '+small',
  'hs_isolde_summons|right': '+small',
  'hs_the_night|right': '+small',
  'ilse_grey_returns|left': '+small',
  'court_fountain_freeze|left': '+small',
  'seraphine_lake_vision|right': '+small',
  'lantern_night|left': '-small', 'lantern_night|right': '+tiny',
  'tavern_star_coin|right': '-small',
  'courier_whispering_parcel|right': '-tiny',
  'carto_lake_tunnel|right': '-small',
  'forbidden_section_2|right': '-tiny',
  'grisk_favour|right': '-small', 'grisk_favour|left': '+tiny',
  'obs_star_chart|right': '+tiny',
  'umbral_forbidden_notes|right': '-tiny',
  // everyday conscience
  'life_found_purse|left': '+small', 'life_found_purse|right': '-small',
  'life_charity|left': '+small', 'life_charity|right': '-tiny',
  'life_stolen_answers|right': '-small', 'life_stolen_answers|left': '+tiny',
  'apoth_poor_mother|left': '-small', 'apoth_poor_mother|right': '+small',
  'alch_love_potion|right': '-small',
  'xchg_ink_cuffs|right': '-tiny',
  'life_mail_owl|right': '-tiny',
  'intern_unseen_office_wrong_file|left': '-tiny', 'intern_unseen_office_wrong_file|right': '+tiny',
  'evo_puddle_drill|right': '-tiny',
  'soc_homework_help|right': '-tiny',
  'cartographers_survey_run|right': '-tiny',
  'life_timeloop_2|left': '-tiny',
  'life_brownies|right': '-tiny',
  'bram_cheating|right': '-tiny',
  'tobias_bullied|right': '+small',
  'slice_quarrel|left': '+tiny',
  'corvin_brother|left': '+small',
  'forbidden_section_3|left': '+small',
  'library_overdue|left': '+tiny',
  'ref_food_fight|left': '+tiny',
  'life_cursed_umbrella|right': '+tiny',
  'soc_injured_friend|right': '+tiny',
  'stables_dragon_egg|right': '-tiny',
};

module.exports = {
  id: '0011-hollow-to-alignment',
  description: 'discard the hollow counter: plot gates → clock()/clues(); dark and selfless choices → alignment',
  GATES, MORAL,
  run(ctx) {
    let gates = 0, swapped = 0, dropped = 0, filled = 0, added = 0;
    for (const [file, from, to] of GATES) {
      const i = ctx.lines(file).findIndex((l) => l.includes(from));
      if (i < 0) throw new Error('gate not found in ' + file + ': ' + from);
      ctx.edit({ file, line: i + 1 }, (l) => l.replace(from, to)); gates++;
    }
    const G = require('../../src/grimoire.js');
    const files = [...new Set(Object.values(ctx.content.events).map((e) => e.file))];
    const done = new Set();
    for (const file of files) {
      const lines = ctx.lines(file);
      let ev = null, opt = null;
      lines.forEach((l, i) => {
        const me = /^@event\s+(\S+)/.exec(l); if (me) { ev = me[1]; opt = null; return; }
        if (/^@/.test(l)) { ev = null; opt = null; return; }
        const mo = /^>\s*([a-z0-9_]+)\s*:/.exec(l); if (mo) { opt = mo[1]; return; }
        const mh = /^(\s+)hollow\s*\+\s*1\s*$/.exec(l); if (!mh || !ev) return;
        const key = ev + '|' + opt, tier = MORAL[key];
        if (tier) { ctx.edit({ file, line: i + 1 }, mh[1] + 'alignment ' + tier); done.add(key); swapped++; return; }
        // an option whose only effect was hollow keeps one: it was a discovery
        const o = ctx.content.events[ev].options.find((x) => x.key === opt); let other = 0;
        if (o) G.walkEffects(o.effects, (st) => { if (!['say'].includes(st.t) && !(st.t === 'delta' && st.name === 'hollow')) other++; });
        if (!other) { ctx.edit({ file, line: i + 1 }, mh[1] + 'lore +tiny'); filled++; } else { ctx.remove({ file, line: i + 1 }); dropped++; }
      });
    }
    // moral choices with no hollow line: add alignment after the option header and its properties
    for (const [key, tier] of Object.entries(MORAL)) {
      if (done.has(key)) continue;
      const [ev, opt] = key.split('|'); const e = ctx.content.events[ev];
      if (!e) throw new Error('MORAL: unknown event ' + ev);
      const lines = ctx.lines(e.file);
      let i = lines.findIndex((l) => l.trim() === '@event ' + ev);
      if (i < 0) throw new Error('MORAL: event not found ' + ev);
      i = lines.findIndex((l, k) => k > i && new RegExp('^>\\s*' + opt + '\\s*:').test(l));
      if (i < 0) throw new Error('MORAL: option not found ' + key);
      let j = i; while (j + 1 < lines.length && /^  (hint|when|spell|cost|tone|memory|lesson):/.test(lines[j + 1])) j++;
      ctx.insertAfter({ file: e.file, line: j + 1 }, '  alignment ' + tier); added++;
    }
    ctx.report(gates + ' gate(s) rewritten; hollow +1: ' + swapped + ' → alignment, ' + dropped + ' dropped, ' + filled + ' → lore +tiny; ' + added + ' alignment line(s) added to moral choices');
  },
};
