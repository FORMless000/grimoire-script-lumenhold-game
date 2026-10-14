// Playtest #2, B35: migrations 0013, 0015 and 0016 gave 124 routine options a mechanical cost (skill gain →
// health -tiny, rel/spark/mood gain → gold -tiny, else mood -tiny), and many read as nonsense (gold for a
// kind word, health for a chess game). Each one is rerouted by hand (triage W39):
//   mood    — the default for effort, awkwardness, worry and heavy conversations;
//   health  — only for physical, cold, dangerous or sleepless scenes;
//   gold    — only for clear spending (the prose says what was bought);
//   chance  — where nothing fits, the gain becomes likely, with a sensible failure (a new say line, added
//             after the existing ones so translation keys keep their order);
//   free    — the safe choice beside a costly or risky one, its gains trimmed to the lint's ≤ 0.5.
// Options not listed kept a cost that already fits. Plus the B35 extras noted in the triage.
'use strict';

const C = (to, more = {}) => ({ cost: to, ...more });
const FREE = (set = {}, more = {}) => ({ cost: null, set, ...more });
const CHANCE = (p, otherwise, more = {}) => ({ cost: null, chance: { p, otherwise }, ...more });

// event.option → what happens to the inserted cost (`from`: the line, when it isn't the 0013 cost)
const ROUTE = {
  'div_tea_leaves.right': C('mood'),
  'duel_lyra_training.right': C('health'),
  'garden_moonflower.right': C('health'),
  'art_golem_helper.right': CHANCE(70, ['renown -tiny', 'say: It also delivers a Restricted Section book to a first-year. The librarian follows the clay smudges straight to your door.']),
  'thorne_roses.left': C('mood'),
  'thorne_shaking_hands.left': C('mood'),
  'maud_recipe.left': C('mood'),
  'maud_recipe.right': FREE({ 'health +small': 'health +tiny', 'mood +small': null, 'rel maud +small': 'rel maud +tiny' }),
  'isolde_chess.right': C('mood'),
  'isolde_portrait.left': CHANCE(60, ['mood -tiny', 'say: The portrait pretends to be asleep, loudly. By the time you give up, the corridor has rearranged itself, and it takes you half the evening to find your way out.']),
  'isolde_portrait.right': FREE({ 'rel isolde +medium': 'rel isolde +small' }),
  'isolde_judgement.left': C('mood'),
  'isolde_judgement.right': C('mood'),
  'life_portrait_escape.right': FREE({ 'mood +small': 'mood +tiny' }),
  'life_exam_dream.right': FREE({ 'mood +tiny': null }),
  'lyra_toast.left': FREE(),
  'lyra_toast.right': C('mood'),
  'lyra_mother_visit.right': C('mood'),
  'tobias_scarecrow.right': FREE({ 'mood +small': null }),
  'tobias_dance_lessons.right': FREE({ 'rel tobias +small': 'rel tobias +tiny', 'mood +small': 'mood +tiny' }),
  'tobias_storm_greenhouse.right': C('health'),
  'seraphine_lost_day.left': C('mood'),
  'seraphine_painting.left': CHANCE(70, ['rel seraphine +small', 'mood -tiny', 'say: You hang it over your bed. Some mornings the door is a different colour, and you lie there wondering which one you chose.']),
  'seraphine_painting.right': C('mood'),
  'seraphine_mother.left': C('mood', { set: { 'mood +small': null }, say: [["For a whole day she's terrified.", "For a whole day she's terrified, and so are you."]] }),
  'corvin_cards.right': CHANCE(60, ['gold -tiny', 'lore +tiny', 'rel corvin +small', 'say: He teaches you odds and nerve instead. That weekend the odds take three crowns off you. "Also a lesson," says Corvin.']),
  'nessa_headmistress_interview.right': C('mood'),
  'nessa_typo.right': C('mood'),
  'nessa_burnout.left': C('health'),
  'nessa_burnout.right': C('mood'),
  'kael_northern_lights.left': C('health'),
  'kael_letter_home.left': C('mood'),
  'bram_father_visit.right': C('mood'),
  'soc_lost_notes.left': C('mood'),
  'soc_lost_notes.right': FREE(),
  'soc_stargazing.left': C('health'),
  'soc_stargazing.right': C('health'),
  'soc_jealous_friend.left': C('mood'),
  'soc_jealous_friend.right': FREE(),
  'soc_teach_spell.left': CHANCE(75, ['health -tiny', 'rel npc +small', 'say: The first attempt freezes your tea solid, and your eyebrows with it. The second works. Your eyebrows take a day to thaw.']),
  'soc_rival_decency.left': C('mood'),
  'soc_rival_decency.right': FREE(),
  'soc_partner_anniversary.left': C('gold', { say: [['You carry it everywhere.', 'You carry it everywhere, and spend the next day hunting for something half as good to give back.']] }),
  'sum_empty_castle.right': FREE({ 'mood +small': null }),
  'sum_letter_from_friend.left': FREE(),
  'sum_letter_from_friend.right': C('health'),
  'sum_rain_week.left': C('gold', { say: [['You read eight hundred pages about a family of sea-witches and cry', 'You buy an eight-hundred-page novel about a family of sea-witches, read every word and cry']] }),
  'y3_letter_to_self.left': CHANCE(75, ['mood -tiny', 'say: You try to write something comforting, and it keeps coming out as a list of warnings. You seal it anyway. The next morning it is gone.']),
  'y3_last_duel.right': C('mood'),
  'life_homework_mountain.right': C('renown'),
  'life_found_purse.left': FREE({ 'renown +small': null, 'rel thorne +medium': 'rel thorne +small' }),
  'life_summer_heat.right': FREE({ 'mood +small': 'mood +tiny' }),
  'life_rival_academy.left': C('mood'),
  'kael_cold_hands.left': C('health', { say: [["They're far too small. He doesn't care.", "They're far too small. He doesn't care. Your own fingers go numb on the walk back."]] }),
  'kael_cold_hands.right': C('health'),
  'bram_crying.left': C('mood'),
  'bram_crying.right': C('mood'),
  'thorne_storm_story.left': C('mood'),
  'thorne_storm_story.right': FREE(),
  'thorne_recommendation.left': FREE({ 'mood +medium': 'mood +tiny', 'rel thorne +small': 'rel thorne +tiny' }),
  'thorne_recommendation.right': C('mood', { set: { 'rel thorne +small': 'rel thorne +medium' }, say: [['"Most students don\'t. Go."', '"Most students don\'t. Go." You leave unsure whether you were praised or dismissed.']] }),
  'thorne_disappointed.right': C('mood'),
  'maud_honey.left': C('mood', { say: [["By morning you're cured", "You sneeze sparks for the rest of the day. By morning you're cured"]] }),
  'maud_honey.right': C('mood'),
  'maud_bees.right': FREE({ 'mood +small': 'mood +tiny' }),
  'maud_ill.left': C('mood'),
  'maud_ill.right': C('health'),
  'isolde_tea.right': C('mood'),
  'lyra_letter.right': C('mood'),
  'lyra_study_rivalry.left': C('mood'),
  'lyra_rival_sabotage.right': C('mood'),
  'lyra_burnout.right': C('health'),
  'tobias_homesick.left': FREE(),
  'tobias_homesick.right': C('gold', { say: [['By the end of the week', 'You buy seeds and a stack of pots. By the end of the week']] }),
  'tobias_picnic.left': FREE(),
  'tobias_picnic.right': FREE(),
  'seraphine_future.right': C('mood', { set: { 'mood +small': null }, say: [['Nobody ever gives the right answer."', 'Nobody ever gives the right answer." Not knowing nags at you for days.']] }),
  'corvin_intro.right': C('gold', { say: [['He lets you win. Probably.', 'He lets you win. Probably. Later, you are three crowns short. Probably a coincidence.']] }),
  'corvin_rooftop.left': C('health'),
  'corvin_rooftop.right': C('health'),
  'mira_owl_gift.left': FREE(),
  'mira_owl_gift.right': C('mood', { say: [['Mira pretends to have something in their eye.', 'Mira pretends to have something in their eye. At six the next morning, the owl says "HOMEWORK." It says it every morning for the rest of the year.']] }),
  'mira_fair.left': FREE({ 'mood +small': 'mood +tiny' }),
  'mira_dance_machine.left': FREE({ 'rel mira +small': 'rel mira -tiny' }, { say: [['across the room.', 'across the room. It kicks them twice; Mira gives you a look.']] }),
  'mira_family_business.right': C('mood'),
  'nessa_gossip_column.right': CHANCE(70, ['renown +tiny', 'mood -small', 'say: The column runs for six more weeks. By the fourth it has decided you are haunting the library, and people move tables when you sit down.']),
  'soc_study_session.left': FREE(),
  'soc_study_session.right': C('mood'),
  'soc_secret.left': FREE(),
  'soc_secret.right': C('mood'),
  'soc_gift_given.left': FREE({ 'mood +small': 'mood +tiny' }),
  'soc_drift.left': FREE(),
  'soc_drift.right': CHANCE(70, ['rel npc +tiny', 'mood -tiny', 'say: You go over. It is friendly, and short, and you both say "we should catch up" in a way that means you won\'t.']),
  'soc_faculty_advice.left': FREE(),
  'soc_faculty_advice.right': C('mood'),
  'soc_spark.left': FREE(),
  'soc_spark.right': CHANCE(70, ['rel npc +tiny', 'mood -tiny', 'say: {npc} pulls back as if burned, and the rest of the lesson is very, very awkward.']),
  'ledger_pie_scoop.left': FREE({ 'rel nessa +tiny': null }),
  // B35 extras (not from 0013–0016)
  'slice_late_lamps.right': FREE({ rest: 'health +small' }, { from: 'gold -tiny', say: [['You buy a cocoa on the way and sleep like a stone.', 'You sleep like a stone.']] }),
  'fox_injured.right': FREE({}, { from: 'gold -tiny' }),
  'duel_hall_dummies.right': C('health', { from: 'gold -tiny', say: [['You buy a bale of straw from the stables', 'You haul a bale of straw over from the stables']] }),
  'ledger_office_unprintable.left': FREE({ 'mood +small': 'mood +tiny' }, { from: 'health -tiny' }),
  'ledger_office_unprintable.right': FREE({}, { from: 'gold -tiny' }),
  'life_lost_wand.right': { set: { 'health -tiny': 'mana -tiny' } },
  'inc_stolen_purse.left': { set: { 'gold -small': 'gold -tiny', 'health -small': ['health -small', 'mood -small'] } },
  // Wage day always pays, more or less (it never deducts).
  'break_work_short_wages.left': { set: { 'mood -small': ['gold +tiny', 'mood -small'] } },
  'break_work_short_wages.right': { set: { 'gold -tiny': ['gold +tiny', 'mood -tiny'] } },
};
// Event text: the bill at Mabel's is split, so both options pay.
const TEXT = { soc_partner_date: [['"I\'m paying," {they} say{s}.', '"We\'re splitting the bill," {they} say{s}.']] };

// The cost 0013/0015/0016 inserted, per option (their worklists, mapped to event ids through git history).
const INSERTED = {
  // health -tiny
  "pyro_ember_heart.left": "health -tiny", "div_tea_leaves.right": "health -tiny",
  "carto_invite.right": "health -tiny", "carto_thursday_stairs.left": "health -tiny",
  "thorne_old_rival.left": "health -tiny", "maud_goat.right": "health -tiny", "maud_recipe.left": "health -tiny",
  "isolde_chess.right": "health -tiny", "isolde_portrait.left": "health -tiny",
  "isolde_judgement.left": "health -tiny", "isolde_judgement.right": "health -tiny",
  "lyra_toast.right": "health -tiny", "tobias_dance_lessons.left": "health -tiny",
  "seraphine_lost_day.left": "health -tiny", "corvin_cards.left": "health -tiny",
  "corvin_cards.right": "health -tiny", "mira_ornithopter.right": "health -tiny",
  "nessa_headmistress_interview.right": "health -tiny", "kael_northern_lights.right": "health -tiny",
  "kael_letter_home.right": "health -tiny", "soc_jealous_friend.left": "health -tiny",
  "soc_jealous_friend.right": "health -tiny", "soc_teach_spell.left": "health -tiny",
  "soc_teach_spell.right": "health -tiny", "soc_rival_decency.right": "health -tiny",
  "sum_home_chores.right": "health -tiny", "sum_rain_week.left": "health -tiny",
  "sum_night_market.right": "health -tiny", "tutor_prodigy.right": "health -tiny",
  "life_spring_cleaning.right": "health -tiny", "life_rival_academy.left": "health -tiny",
  "kael_snowball.right": "health -tiny", "thorne_disappointed.right": "health -tiny",
  "isolde_tea.right": "health -tiny", "lyra_study_rivalry.left": "health -tiny",
  "tobias_homesick.right": "health -tiny", "tobias_godparent.right": "health -tiny",
  "tobias_picnic.left": "health -tiny", "corvin_intro.right": "health -tiny",
  "mira_family_business.right": "health -tiny", "soc_study_session.left": "health -tiny",
  "soc_study_session.right": "health -tiny", "soc_secret.right": "health -tiny",
  "soc_faculty_advice.right": "health -tiny", "ledger_pie_scoop.left": "health -tiny",
  // mood -tiny
  "astro_sleepless.left": "mood -tiny", "kael_snowball.left": "mood -tiny", "lyra_letter.left": "mood -tiny",
  // gold -tiny
  "duel_lyra_training.right": "gold -tiny", "garden_moonflower.right": "gold -tiny",
  "art_golem_helper.right": "gold -tiny", "thorne_roses.left": "gold -tiny",
  "thorne_shaking_hands.left": "gold -tiny", "maud_recipe.right": "gold -tiny",
  "isolde_portrait.right": "gold -tiny", "life_portrait_escape.right": "gold -tiny",
  "life_exam_dream.right": "gold -tiny", "lyra_toast.left": "gold -tiny", "lyra_mother_visit.right": "gold -tiny",
  "tobias_scarecrow.right": "gold -tiny", "tobias_dance_lessons.right": "gold -tiny",
  "tobias_storm_greenhouse.right": "gold -tiny", "seraphine_painting.left": "gold -tiny",
  "seraphine_painting.right": "gold -tiny", "seraphine_mother.left": "gold -tiny",
  "mira_name_day.right": "gold -tiny", "nessa_typo.right": "gold -tiny", "nessa_burnout.left": "gold -tiny",
  "nessa_burnout.right": "gold -tiny", "kael_northern_lights.left": "gold -tiny",
  "kael_letter_home.left": "gold -tiny", "bram_father_visit.right": "gold -tiny",
  "soc_lost_notes.left": "gold -tiny", "soc_lost_notes.right": "gold -tiny", "soc_stargazing.left": "gold -tiny",
  "soc_stargazing.right": "gold -tiny", "soc_rival_decency.left": "gold -tiny",
  "soc_partner_anniversary.left": "gold -tiny", "sum_empty_castle.right": "gold -tiny",
  "sum_letter_from_friend.left": "gold -tiny", "sum_letter_from_friend.right": "gold -tiny",
  "y3_letter_to_self.left": "gold -tiny", "y3_last_duel.right": "gold -tiny", "life_insomnia.right": "gold -tiny",
  "life_homework_mountain.right": "gold -tiny", "life_found_purse.left": "gold -tiny",
  "life_first_snow.right": "gold -tiny", "life_summer_heat.right": "gold -tiny",
  "kael_cold_hands.left": "gold -tiny", "kael_cold_hands.right": "gold -tiny", "bram_crying.left": "gold -tiny",
  "bram_crying.right": "gold -tiny", "thorne_storm_story.left": "gold -tiny",
  "thorne_storm_story.right": "gold -tiny", "thorne_recommendation.left": "gold -tiny",
  "thorne_recommendation.right": "gold -tiny", "maud_honey.left": "gold -tiny", "maud_honey.right": "gold -tiny",
  "maud_bees.right": "gold -tiny", "maud_ill.left": "gold -tiny", "maud_ill.right": "gold -tiny",
  "lyra_letter.right": "gold -tiny", "lyra_rival_sabotage.right": "gold -tiny", "lyra_burnout.right": "gold -tiny",
  "tobias_homesick.left": "gold -tiny", "tobias_picnic.right": "gold -tiny", "seraphine_future.right": "gold -tiny",
  "corvin_rooftop.left": "gold -tiny", "corvin_rooftop.right": "gold -tiny", "mira_owl_gift.left": "gold -tiny",
  "mira_owl_gift.right": "gold -tiny", "mira_fair.left": "gold -tiny", "mira_dance_machine.left": "gold -tiny",
  "nessa_gossip_column.right": "gold -tiny", "soc_secret.left": "gold -tiny", "soc_gift_given.left": "gold -tiny",
  "soc_drift.left": "gold -tiny", "soc_drift.right": "gold -tiny", "soc_faculty_advice.left": "gold -tiny",
  "soc_spark.left": "gold -tiny", "soc_spark.right": "gold -tiny", "soc_date.left": "gold -tiny",
  "soc_partner_date.left": "gold -tiny", "soc_partner_date.right": "gold -tiny",
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

module.exports = {
  id: '0019-sensible-costs',
  description: 'routine costs that read as nonsense rerouted by hand (B35)',
  ROUTE, TEXT,
  run(ctx) {
    const counts = {};
    for (const [ref, r] of Object.entries(ROUTE)) {
      const [id, key] = ref.split('.');
      const ev = locate(ctx, id);
      const { i, end } = option(ev, key);
      let body = ev.L.slice(i + 1, end);
      const from = r.from || INSERTED[ref];
      if ('cost' in r) {
        const k = body.findIndex((l) => l === '  ' + from);
        if (k < 0) throw new Error(ref + ': cost line "' + from + '" not found');
        if (r.cost === null) body.splice(k, 1);
        else if (r.cost !== from.split(' ')[0]) body[k] = '  ' + r.cost + ' -tiny';
      }
      for (const [was, now] of Object.entries(r.set || {})) {
        const k = body.findIndex((l) => l.trim() === was);
        if (k < 0) throw new Error(ref + ': "' + was + '" not found');
        const ind = body[k].match(/^\s*/)[0];
        if (now === null) body.splice(k, 1);
        else body.splice(k, 1, ...[].concat(now).map((x) => ind + x));
      }
      for (const [was, now] of r.say || []) {
        const k = body.findIndex((l) => /^\s*say:/.test(l) && l.includes(was));
        if (k < 0) throw new Error(ref + ': say text "' + was + '" not found');
        body[k] = body[k].replace(was, now);
      }
      if (r.chance) {
        const keep = body.filter((l) => /^  (hint|when|cost|spell):/.test(l));
        const rest = body.filter((l) => !keep.includes(l));
        body = [...keep, '  chance ' + r.chance.p + ':', ...rest.map((l) => '  ' + l), '  else:', ...r.chance.otherwise.map((l) => '    ' + l)];
      }
      ctx.edit({ file: ev.file, line: i + 2 }, body.join('\n'));
      for (let k = i + 2; k < end; k++) ctx.remove({ file: ev.file, line: k + 1 });
      const kind = r.chance ? 'chance' : r.cost === null ? 'free' : r.cost || 'extra';
      counts[kind] = (counts[kind] || 0) + 1;
    }
    for (const [id, pairs] of Object.entries(TEXT)) {
      const ev = locate(ctx, id);
      const k = ev.L.findIndex((l, n) => n > ev.start && n < ev.end && /^text:/.test(l));
      ctx.edit({ file: ev.file, line: k + 1 }, pairs.reduce((t, [a, b]) => { if (!t.includes(a)) throw new Error(id + ': text "' + a + '" not found'); return t.replace(a, b); }, ev.L[k]));
    }
    ctx.report(Object.entries(counts).map(([k, n]) => n + ' ' + k).join(', ') + '; ' + Object.keys(TEXT).length + ' event text(s)');
  },
};
