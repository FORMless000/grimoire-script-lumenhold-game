// Playtest 2, M43 (with B13, B15, B16, B23, C25, C26, M8): social and world cards are dealt across the whole day,
// so cards whose text names a time of day say so. `slot:` requires the slot (the scene can't happen otherwise);
// `time:` favours its slots. Worklist: the world and social events whose text names a time, and the pushed
// festivals and scenes that belong to an hour (pushed cards go to the morning without one). Scenes set at
// midnight use `time: night` until the midnight turn exists (M41). Place events keep their place's hours.
'use strict';
const TAGS = {
  // world
  carto_invite: 'time: evening night', donate_greenhouse_glass: 'time: morning', ghost_socks: 'time: morning',
  grisk_smuggling: 'time: afternoon evening', hs_dreams_begin: 'time: morning', hs_grey_invitation: 'time: evening night',
  hs_grey_stranger: 'time: night', inc_fever_bill: 'time: morning', inc_hiccuping_robe: 'time: morning',
  isolde_intro: 'time: evening', life_bell_tower: 'time: night', life_brownies: 'time: morning', life_card_game: 'time: night',
  life_exam_dream: 'time: night', life_food_poisoning: 'time: evening night', life_insomnia: 'time: night',
  life_invent_spell: 'time: night', life_midnight_snack: 'time: night', life_mirror_talks: 'time: morning',
  life_morning_run: 'time: morning', life_mystery_stew: 'time: evening', life_quiet_afternoon: 'slot: afternoon',
  life_shady_offer: 'time: afternoon evening', life_sleepwalking: 'time: night', life_timeloop_1: 'slot: morning',
  slice_late_lamps: 'time: evening night', sum_midsummer_fair: 'time: afternoon', sum_night_market: 'time: evening night',
  xchg_farewell: 'time: morning', y3_last_duel: 'time: morning', y3_last_lanterns: 'time: evening night',
  core_flying_lesson: 'slot: morning',
  // social
  amaranth_rounds: 'time: evening night', brask_night_owl: 'time: evening', brask_trust: 'time: evening',
  corvin_kitchen_raid: 'time: night', corvin_rooftop: 'time: night', corvin_runaway: 'time: night', ilse_grey_returns: 'time: night',
  kael_cold_hands: 'time: evening night', kael_northern_lights: 'time: night', lyra_burnout: 'time: morning',
  lyra_study_rivalry: 'time: morning noon', marisol_cold_water: 'time: morning', nessa_burnout: 'time: evening night',
  nessa_typo: 'time: morning', soc_become_close: 'time: night', soc_make_peace: 'time: noon afternoon',
  soc_rival_taunt: 'time: evening', thorne_office_hours: 'time: noon afternoon', thorne_roses: 'time: morning',
  thorne_shaking_hands: 'time: noon afternoon', tobias_storm_greenhouse: 'time: night', vey_pop_quiz: 'time: morning',
  vey_trust: 'time: noon afternoon',
  // pushed scenes
  starfall: 'slot: night', life_harvest_festival: 'slot: evening', graduation_eve: 'slot: night',
};
module.exports = {
  id: '0021-time-of-day',
  description: 'cards that name a time of day carry slot: or time: (M43)',
  TAGS,
  run(ctx) {
    const files = ctx.project.compileAll().sources.map((s) => s.path).filter((f) => f.endsWith('.grim'));
    const left = new Set(Object.keys(TAGS));
    for (const file of files) {
      const L = ctx.lines(file);
      L.forEach((l, i) => {
        const m = l.match(/^@event ([a-z0-9_]+)$/);
        if (!m || !TAGS[m[1]]) return;
        let end = i + 1; while (end < L.length && !/^(@|>)/.test(L[end])) end++;
        const head = L.slice(i + 1, end);
        if (head.some((x) => /^(slot|time):/.test(x))) throw new Error(m[1] + ' already has a slot or time');
        ctx.insertAfter({ file, line: i + 1 }, TAGS[m[1]]);
        left.delete(m[1]);
      });
    }
    if (left.size) throw new Error('not found: ' + [...left].join(', '));
    ctx.report(Object.keys(TAGS).length + ' events tagged');
  },
};
