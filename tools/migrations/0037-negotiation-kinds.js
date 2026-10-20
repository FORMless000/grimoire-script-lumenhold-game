// Negotiations sorted (world expansion 1, plan M1): a real negotiation (a person, an argument, stakes) stays
// `challenge negotiate` and becomes the negotiation minigame's (src/negotiation.js PARLEYS); a quick ask, a show or
// calming a creature moves to the plain charm kinds `appeal`, `perform` and `soothe`, which roll as negotiate did.
// Tier, odds, `vs` and `using` are kept.
'use strict';
const G = require('../../src/grimoire.js');
const KIND = {
  appeal: ['soc_date/right', 'soc_confess_generic/right', 'soc_ex_encounter/right', 'midwinter_ball/lyra', 'isolde_tea/left', 'lyra_intro/right',
    'y3_waitlist/left', 'letter_bookshop_bill/right', 'soc_rival_taunt/right', 'job_board_odd_jobs/right', 'break_work_complaint/left',
    'detention_cauldrons/right', 'xchg_arrival/left', 'date_meet_friends/left', 'lumen_ledger_courtyard_quotes/left', 'courier_fisherman_waves/left',
    'soc_rumour/right', 'tutor_hopeless/right', 'life_portrait_gossip/left', 'company_poets/left'],
  perform: ['choir_solo/right', 'great_hall_choir_rehearsal/right', 'life_village_busking/left', 'tavern_eel_story/left', 'life_storm_night/left',
    'renown_village_fair/left', 'renown_rumour/left', 'company_birthday/left', 'mir_fair/right', 'nessa_intro/right', 'company_wedding/left'],
  soothe: ['beast_manticore/right', 'beast_owl_post/left', 'beast_hooves/left', 'beast_night_stable/right', 'stables_griffon_sulk/left',
    'maud_goat/left', 'life_borrowed_broom/right', 'life_spring_cleaning/left', 'sum_sea_serpent/right'],
};
module.exports = {
  id: '0037-negotiation-kinds',
  description: 'Trivial negotiations become appeal, perform or soothe',
  run(ctx) {
    for (const [kind, keys] of Object.entries(KIND)) for (const key of keys) {
      const [id, opt] = key.split('/'), e = ctx.content.events[id];
      const o = e && e.options.find((x) => x.key === opt);
      if (!o) { ctx.report('missing ' + key); continue; }
      G.walkEffects(o.effects, (st) => {
        if (st.t !== 'challenge' || st.kind !== 'negotiate') return;
        ctx.edit({ file: e.file, line: st.line }, (l) => l.replace('challenge negotiate', 'challenge ' + kind));
        ctx.report(key + ' → ' + kind);
      });
    }
  },
};
