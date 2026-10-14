// Playtest 2, A3: the "no option obviously best" rule (docs/authoring/costs.md). Every routine option whose only
// cost was one `-tiny` was read one by one (414 options; 273 kept as they were, their cost shown by the scene):
//   drop    — the scene doesn't show the cost, and the other option is the trade (or a risk): a free option is honest;
//   swap    — a cost the scene does show: `study -tiny` for skipped work, `perform track -tiny` for slack at a job,
//             `health` for a cold or a burn, `alignment -tiny` for taking what isn't yours;
//   add     — alignment at stake where the option is a theft, a lie or a kindness at a real cost, or a gain
//             the scene shows where the option was obviously worse;
//   remove  — a skill used as a cost (skills never are);
//   set     — a size changed so neither option is obviously best (or to keep the ±1.5 budget);
//   say     — the line now shows the cost (appended, so translation keys keep their order).
'use strict';

// event.option → operations, in order. A `drop`/`swap` names the token line ('null': the option's one `-tiny`).
const OPS = {
  "align_northern_parcel.right": [["drop","mood -tiny"]],
  "align_asked_for_help.right": [["drop","alignment -tiny"]],
  "align_warm_regard.right": [["drop","mood -tiny"]],
  "alch_unstable_cauldron.left": [["drop","health -tiny"]],
  "beast_manticore.left": [["drop","mood -tiny"]],
  "astro_sleepless.left": [["swap","mood -tiny",["study track -tiny"]]],
  "umbral_whisper.left": [["drop","mood -tiny"]],
  "thorne_old_rival.left": [["swap","health -tiny",["mood -tiny"]],["say","The duel lasts four seconds.","The duel lasts four seconds, the longest of your life."]],
  "thorne_roses.left": [["drop","mood -tiny"]],
  "maud_recipe.left": [["drop","mood -tiny"]],
  "isolde_judgement.left": [["drop","mood -tiny"]],
  "isolde_judgement.right": [["drop","mood -tiny"]],
  "seraphine_lost_day.left": [["drop","mood -tiny"]],
  "seraphine_painting.right": [["drop","mood -tiny"]],
  "corvin_cards.left": [["drop","health -tiny"]],
  "mira_ornithopter.right": [["drop","health -tiny"]],
  "nessa_headmistress_interview.right": [["drop","mood -tiny"]],
  "kael_letter_home.left": [["drop","mood -tiny"]],
  "soc_lost_notes.left": [["drop","mood -tiny"]],
  "soc_jealous_friend.left": [["drop","mood -tiny"]],
  "soc_teach_spell.right": [["drop","health -tiny"]],
  "soc_rival_decency.left": [["drop","mood -tiny"]],
  "sum_rain_week.right": [["drop","mood -tiny"]],
  "amaranth_rounds.left": [["swap","health -tiny",["study -tiny"]]],
  "vey_pop_quiz.right": [["drop","mood -tiny"]],
  "marisol_intro.left": [["swap","mood -tiny",["health -tiny"]],["say","for almost a minute.","for almost a minute, and then it remembers you."]],
  "marisol_intro.right": [["drop","health -tiny"]],
  "mabel_intro.right": [["add",["health +tiny"]]],
  "pell_intro.left": [["add",["mood -tiny"]]],
  "grisk_pleasantries.left": [["swap","gold -tiny",["renown -tiny"]]],
  "xchg_arrival.right": [["drop","mood -tiny"]],
  "tavern_brawl.left": [["drop","mood -tiny"]],
  "stables_hippogriff.left": [["drop","mood -tiny"]],
  "stables_night_shift.left": [["add",["health +tiny","alignment -tiny"]]],
  "tutor_prodigy.left": [["add",["alignment -tiny"]]],
  "tutor_prodigy.right": [["drop","health -tiny"]],
  "life_portrait_gossip.right": [["drop","mood -tiny"]],
  "life_stray_cat.left": [["drop","mood -tiny"]],
  "life_stray_cat.right": [["swap","gold -tiny",["study -tiny"]]],
  "life_prank_war.left": [["swap","mood -tiny",["study -tiny"]]],
  "life_new_robes.left": [["drop","mood -tiny"]],
  "life_injury_stairs.left": [["drop","mood -tiny"]],
  "life_spring_cleaning.right": [["drop","health -tiny"]],
  "midnight_newt_cards.right": [["drop","mood -tiny"]],
  "midnight_restricted_stacks.right": [["drop","mood -tiny"]],
  "midnight_passage_mapping.right": [["drop","mood -tiny"]],
  "kael_snowball.left": [["drop","mood -tiny"]],
  "bram_intro.left": [["drop","mood -tiny"]],
  "bram_crying.left": [["drop","mood -tiny"]],
  "thorne_storm_story.left": [["drop","mood -tiny"]],
  "maud_honey.left": [["drop","mood -tiny"]],
  "maud_honey.right": [["drop","mood -tiny"],["set","rel maud +medium","rel maud +small"]],
  "maud_ill.left": [["drop","mood -tiny"]],
  "isolde_tea.right": [["drop","mood -tiny"]],
  "lyra_letter.left": [["drop","mood -tiny"]],
  "corvin_rooftop.left": [["drop","health -tiny"]],
  "corvin_rooftop.right": [["drop","health -tiny"]],
  "mira_family_business.right": [["drop","mood -tiny"]],
  "library_shared_table.left": [["drop",null]],
  "refectory_late_supper.right": [["drop","mood -tiny"]],
  "refectory_house_tables.left": [["drop","health -tiny"]],
  "lecture_tower_old_board.left": [["drop","mood -tiny"]],
  "lecture_tower_scorched_room.right": [["drop","mood -tiny"]],
  "great_hall_tomorrow_sky.right": [["drop","mood -tiny"]],
  "infirmary_spare_bed.right": [["drop","mood -tiny"]],
  "alchemy_lab_third_floor.right": [["drop","mood -tiny"]],
  "alchemy_lab_unlabelled_jar.right": [["drop","mood -tiny"]],
  "job_board_lost_familiars.right": [["drop","mood -tiny"]],
  "observatory_roof_ledge.right": [["drop","mood -tiny"]],
  "observatory_scraped_word.right": [["drop","mood -tiny"]],
  "workshop_volunteer.right": [["drop","mood -tiny"]],
  "workshop_stirring_cauldron.right": [["drop","mood -tiny"]],
  "workshop_glass_cabinet.left": [["drop","mood -tiny"]],
  "workshop_glass_cabinet.right": [["add",["alignment -tiny"]]],
  "headmistress_tower_window_seat.left": [["drop","mood -tiny"]],
  "gargoyle_passage_offering_dish.right": [["add",["alignment -tiny"]]],
  "verdant_repotting_day.right": [["swap","mood -tiny",["health -tiny"]]],
  "broom_courier_broom_scramble.left": [["swap","mood -tiny",["alignment -tiny"]]],
  "evo_snuffing_drill.left": [["swap","mood -tiny",["health -tiny"]]],
  "evo_bucket_duty.left": [["drop","mood -tiny"]],
  "evo_steady_cup.right": [["drop","mood -tiny"]],
  "evo_signature_flame.right": [["drop","mood -tiny"]],
  "astro_tea_rota.right": [["drop","mood -tiny"]],
  "astro_starlight_jars.right": [["drop","mood -tiny"]],
  "alch_stir_count.left": [["swap","mood -tiny",["health -tiny"]]],
  "alch_bandage_round.left": [["drop","mood -tiny"]],
  "illu_one_small_change.left": [["drop","mood -tiny"]],
  "illu_spot_the_coin.left": [["drop","mood -tiny"]],
  "illu_bread_smell.left": [["drop","mood -tiny"]],
  "illu_courtyard_hour.right": [["drop","mood -tiny"]],
  "beast_feeding_round.right": [["drop","mood -tiny"]],
  "beast_hare_paddock.right": [["drop","mood -tiny"]],
  "beast_lake_flight.right": [["drop","mood -tiny"]],
  "beast_manticore_rounds.right": [["drop","mood -tiny"]],
  "umbral_dim_lamps.left": [["drop","mood -tiny"]],
  "umbral_chalk_ward.right": [["drop","mood -tiny"]],
  "umbral_short_distances.right": [["drop","mood -tiny"]],
  "umbral_hidden_object.right": [["drop","mood -tiny"]],
  "star_thread_of_light.right": [["drop","mood -tiny"]],
  "astro_sealed_forecast.right": [["drop","mood -tiny"]],
  "illu_good_news.right": [["drop","mood -tiny"]],
  "beast_hedge_run.right": [["drop","mood -tiny"]],
  "umbral_dark_roll.left": [["drop","mood -tiny"]],
  "duel_hall_gallery.right": [["drop","mood -tiny"]],
  "duel_hall_humming_circle.right": [["drop","mood -tiny"]],
  "greenhouses_warm_glass.left": [["drop","health -tiny"]],
  "flight_field_long_grass.right": [["drop","mood -tiny"]],
  "stables_owl_loft.left": [["drop","health -tiny"]],
  "stables_owl_loft.right": [["drop","mood -tiny"]],
  "stables_brask_rounds.left": [["drop","mood -tiny"]],
  "stables_griffon_sulk.right": [["drop","mood -tiny"]],
  "maud_cottage_top_shelf.right": [["drop","mood -tiny"]],
  "secret_garden_humming_pear.left": [["drop","mood -tiny"]],
  "secret_garden_glowing_ferns.right": [["drop","mood -tiny"]],
  "courier_loft_broom_rack.right": [["drop","mood -tiny"]],
  "courier_loft_broom_rack.left": [["add",["alignment -tiny"]]],
  "whisperwood_sleeptalk.right": [["drop","health -tiny"]],
  "whisperwood_off_path.right": [["drop","mood -tiny"]],
  "gig_grounds_storm_damage.right": [["drop","mood -tiny"]],
  "gig_kitchens_onions.right": [["drop","mood -tiny"]],
  "break_home_mending_chair.right": [["drop","mood -tiny"]],
  "break_work_half_hour.right": [["drop","mood -tiny"]],
  "break_castle_post_day.left": [["remove","lore -tiny"]],
  "break_home_kitchen_table.right": [["drop","gold -tiny"]],
  "break_home_the_box.left": [["drop","health -tiny"]],
  "break_home_family_debate.right": [["drop","mood -tiny"]],
  "break_home_village_children.right": [["drop","mood -tiny"]],
  "thesis_lab_footnote_war.right": [["drop","mood -tiny"]],
  "thesis_lab_borrowed_candle.left": [["add",["alignment -tiny"]]],
  "gilded_newt_fireside.right": [["drop","mood -tiny"]],
  "pell_apothecary_drawers.right": [["drop","mood -tiny"]],
  "pell_apothecary_queue.right": [["drop","mood -tiny"]],
  "bakery_oldest_baker.left": [["drop","mood -tiny"]],
  "home_cottage_old_room.right": [["drop","health -tiny"]],
  "home_fields_pond.right": [["drop","mood -tiny"]],
  "home_market_post_office.right": [["drop","mood -tiny"]],
  "slice_market_haggle.right": [["swap","mood -tiny",["health -tiny"]]],
  "evo_first_spark.left": [["drop","mood -tiny"]],
  "evo_tide_wall.right": [["drop","mood -tiny"]],
  "court_fountain_freeze.right": [["drop","mood -tiny"]],
  "court_rumour_mill.left": [["remove","guile -tiny"]],
  "obs_comet_watch.right": [["drop","health -tiny"]],
  "green_mandrake_choir.right": [["drop","gold -tiny"]],
  "work_double_shift.right": [["drop","gold -tiny"]],
  "pell_intro.right": [["add",["health +tiny"]],["say","You are back within a month.","The headache is gone before the quay, and you are back within a month."]],
  "lib_biting_book.left": [["add",["vigor +small"]]],
  "lib_biting_book.right": [["add",["perform track -tiny"]]],
  "kael_cold_hands.left": [["add",["alignment +tiny"]]],
  "kael_cold_hands.right": [["remove","health -tiny"]],
  "thorne_disappointed.left": [["add",["guile +tiny","alignment -tiny"]]],
  "thorne_disappointed.right": [["set","mood -tiny","mood -small"],["say","we'll stay until it's right.\"","we'll stay until it's right.\" You stay until midnight."]],
  "lyra_family_gala.right": [["set","charm +small","charm +tiny"]],
  "cartographers_inking_night.left": [["add",["alignment +tiny"]]],
  "cartographers_inking_night.right": [["add",["perform track -tiny"]]],
  "soc_partner_date.left": [["set","mood +medium","mood +small"]],
  "life_homework_mountain.right": [["swap","renown -tiny",["study -tiny"]]],
  "gargoyle_passage_old_marks.right": [["drop","mood -tiny"]],
  "broom_courier_morning_crossing.right": [["swap","mood -tiny",["perform track -tiny"]]],
  "umbral_corridor_step.right": [["drop","mood -tiny"]],
};

function locate(ctx, id) {
  const files = locate.files = locate.files || ctx.project.compileAll().sources.map((s) => s.path).filter((f) => f.endsWith('.grim'));
  for (const file of files) {
    const L = ctx.lines(file);
    const i = L.findIndex((l) => l === '@event ' + id);
    if (i >= 0) { let end = i + 1; while (end < L.length && !/^@/.test(L[end])) end++; return { file, L, start: i, end }; }
  }
  throw new Error('event not found: ' + id);
}

function option(ev, key) {
  const i = ev.L.findIndex((l, k) => k > ev.start && k < ev.end && new RegExp('^>\\s*' + key + '\\s*:').test(l));
  if (i < 0) throw new Error('option not found: ' + key);
  let end = i + 1; while (end < ev.end && !/^(> |@|\s*$)/.test(ev.L[end])) end++;
  return { i, end };
}

// The token line at the option's top level: exact, else the same statement with `track` for the track's id, else
// the option's only top-level `-tiny`.
function tokenLine(body, token, ref) {
  const top = body.map((l, k) => [l, k]).filter(([l]) => /^  \S/.test(l));
  let hit = token && top.filter(([l]) => l === '  ' + token);
  if (token && !hit.length) { const w = token.split(' '); hit = top.filter(([l]) => l.startsWith('  ' + w[0] + ' ') && l.endsWith(' -tiny')); }
  if (!token) hit = top.filter(([l]) => /^  [a-z_]+( [a-z_]+)? -tiny$/.test(l));
  if (hit.length !== 1) throw new Error(ref + ': token "' + token + '" matched ' + hit.length + ' lines');
  return hit[0][1];
}

module.exports = {
  id: '0029-no-best-option',
  description: 'routine costs read one by one under the "no option obviously best" rule (A3)',
  OPS,
  run(ctx) {
    const counts = {};
    for (const [ref, ops] of Object.entries(OPS)) {
      const [id, key] = ref.split('.');
      const ev = locate(ctx, id);
      const { i, end } = option(ev, key);
      const body = ev.L.slice(i + 1, end);
      for (const op of ops) {
        counts[op[0]] = (counts[op[0]] || 0) + 1;
        if (op[0] === 'drop') body.splice(tokenLine(body, op[1], ref), 1);
        else if (op[0] === 'swap') body.splice(tokenLine(body, op[1], ref), 1, ...op[2].map((x) => '  ' + x));
        else if (op[0] === 'add') {
          // Before the first say, branch or check at the top level, so effects stay above the lines.
          let k = body.findIndex((l) => /^  (say|say\[|chance |challenge |if |else|elif )/.test(l));
          if (k < 0) k = body.length;
          body.splice(k, 0, ...op[1].map((x) => '  ' + x));
        } else if (op[0] === 'remove' || op[0] === 'set') {
          const k = body.findIndex((l) => /^  \S/.test(l) && l.trim() === op[1]);
          if (k < 0) throw new Error(ref + ': "' + op[1] + '" not found');
          if (op[0] === 'remove') body.splice(k, 1); else body[k] = '  ' + op[2];
        } else if (op[0] === 'say') {
          const k = body.findIndex((l) => /^\s*say(\[[a-z_]+\])?:/.test(l) && l.includes(op[1]));
          if (k < 0) throw new Error(ref + ': say text "' + op[1] + '" not found');
          body[k] = body[k].replace(op[1], op[2]);
        }
      }
      ctx.edit({ file: ev.file, line: i + 2 }, body.join('\n'));
      for (let k = i + 2; k < end; k++) ctx.remove({ file: ev.file, line: k + 1 });
    }
    ctx.report(Object.keys(OPS).length + ' options: ' + Object.entries(counts).map(([k, n]) => n + ' ' + k).join(', '));
  },
};
