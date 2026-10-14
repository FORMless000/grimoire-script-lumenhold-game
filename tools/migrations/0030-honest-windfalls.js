// Playtest 2, L (alarms): about 5 windfalls a year against the design's 1–4 (§8.8). Most "windfalls" were everyday
// cards classed that way only to escape the old routine rule ("every option must cost or risk something"): two
// modest gains to choose between, or a gamble beside a free option. Under A3's rule (no option obviously best) they
// are honest routine cards, so they become routine; the 37 below all pass the routine lint as they are. The 11 left
// are real windfalls (one-sided luck, or the character introductions).
'use strict';
const ROUTINE = [
  'tide_storm_drill',
  'illusion_mirror_self',
  'alch_first_brew',
  'art_clockwork_beetle',
  'beast_familiar_call',
  'choir_concert',
  'garden_maud_secret',
  'stars_cocoa_night',
  'alch_love_potion',
  'heal_triage_drill',
  'life_garden_plot',
  'life_pen_pal',
  'life_moths',
  'sum_old_friend',
  'sum_end_of_summer',
  'y3_first_year_mentee',
  'y3_last_lanterns',
  'y3_portrait',
  'lib_restricted_cart',
  'apoth_nightshade_order',
  'stables_dragon_egg',
  'life_morning_run',
  'life_mirror_talks',
  'life_mail_owl',
  'life_lake_fever',
  'life_lost_firstyear',
  'life_frog_escape',
  'life_volunteer',
  'slice_wager',
  'lake_skimming',
  'lake_reflection_bet',
  'ref_cook_secret',
  'green_moonflower_sprout',
  'castle_empty_halls',
  'castle_skeleton_crew',
  'home_family_supper',
  'home_old_friend',
];
module.exports = {
  id: '0030-honest-windfalls',
  description: 'windfalls that are everyday trades become routine cards (L alarms: 5 windfalls a year against 1–4)',
  ROUTINE,
  run(ctx) {
    for (const id of ROUTINE) {
      const e = ctx.content.events[id];
      if (!e) throw new Error('event not found: ' + id);
      const L = ctx.lines(e.file);
      const start = L.findIndex((l) => l === '@event ' + id);
      let k = start + 1; while (k < L.length && !/^@/.test(L[k]) && L[k] !== 'class: windfall') k++;
      if (L[k] !== 'class: windfall') throw new Error(id + ': no class: windfall');
      ctx.edit({ file: e.file, line: k + 1 }, 'class: routine');
    }
    ctx.report(ROUTINE.length + ' card(s) are routine now');
  },
};
