// Phase 3 (design §5.4–5.5): the roster grows past students (faculty, villagers, a goblin moneylender), so
// generic social events cast by premise, not just "not faculty":
//   PEER      tagged(x, peer)                          students, the prefect, Ilse: hanging out, secrets, rivalries
//   CLASSMATE tagged(x, student) or tagged(x, prefect) lecture notes, homework, exams, class pairings
//   teacher   tagged(x, teacher)                       "a word after the lecture"
// Each listed role's `where` is replaced whole; the pool (any, present(place)) is kept.
'use strict';
const PEER = (r) => 'tagged(' + r + ', peer)';
const MATE = (r) => '(tagged(' + r + ', student) or tagged(' + r + ', prefect))';
const FIT = {
  align_saint_jibe: ['other', (r) => 'tagged(' + r + ', ruthless) and ' + PEER(r)],
  soc_lost_notes: ['npc', (r) => MATE(r) + ' and rel(' + r + ') >= 3'],
  soc_birthday: ['npc', (r) => PEER(r) + ' and rel(' + r + ') >= 9'],
  soc_bad_news: ['npc', (r) => MATE(r) + ' and rel(' + r + ') >= 12'],
  soc_jealous_friend: ['npc', (r) => PEER(r) + ' and (bond(' + r + ') == "friend" or bond(' + r + ') == "close")'],
  soc_injured_friend: ['npc', (r) => PEER(r) + ' and rel(' + r + ') >= 6'],
  soc_rival_decency: ['npc', (r) => PEER(r) + ' and (bond(' + r + ') == "rival" or bond(' + r + ') == "nemesis" or rel(' + r + ') <= -9)'],
  sum_letter_from_friend: ['npc', (r) => MATE(r) + ' and rel(' + r + ') >= 12'],
  courtyard_saved_seat: ['here', (r) => PEER(r) + ' and rel(' + r + ') >= 0'],
  library_shared_table: ['here', (r) => PEER(r) + ' and rel(' + r + ') >= 0'],
  observatory_one_star_each: ['here', PEER],
  ledger_office_deadline_night: ['here', PEER],
  gargoyle_passage_parapet_cards: ['here', PEER],
  duel_hall_gallery: ['here', PEER],
  court_rumour_mill: ['gossip', PEER],
  lake_skimming: ['friend', (r) => PEER(r) + ' and rel(' + r + ') >= 6'],
  evo_storm_pairing: ['partner', MATE],
  soc_study_session: ['npc', (r) => MATE(r) + ' and rel(' + r + ') >= 0'],
  soc_homework_help: ['npc', (r) => MATE(r) + ' and rel(' + r + ') >= 0'],
  soc_borrow_money: ['npc', (r) => PEER(r) + ' and rel(' + r + ') >= 3'],
  soc_become_friends: ['npc', (r) => PEER(r) + ' and bond(' + r + ') == "none" and rel(' + r + ') >= 18'],
  soc_become_close: ['npc', (r) => PEER(r) + ' and bond(' + r + ') == "friend" and rel(' + r + ') >= 36'],
  soc_secret: ['npc', (r) => PEER(r) + ' and rel(' + r + ') >= 15'],
  soc_argument: ['npc', (r) => PEER(r) + ' and rel(' + r + ') >= 6 and bond(' + r + ') != "partner"'],
  soc_village_trip: ['npc', (r) => PEER(r) + ' and rel(' + r + ') >= 6'],
  soc_friend_sick: ['npc', (r) => PEER(r) + ' and (bond(' + r + ') == "friend" or bond(' + r + ') == "close" or bond(' + r + ') == "partner")'],
  soc_gift_given: ['npc', (r) => PEER(r) + ' and rel(' + r + ') >= 9'],
  soc_drift: ['npc', (r) => PEER(r) + ' and rel(' + r + ') >= 6 and rel(' + r + ') < 24'],
  soc_rumour: ['npc', (r) => 'rel(' + r + ') >= 9 and not tagged(' + r + ', villager)'],
  soc_faculty_advice: ['npc', (r) => 'tagged(' + r + ', teacher) and rel(' + r + ') >= 6'],
  soc_rival_taunt: ['npc', (r) => PEER(r) + ' and (bond(' + r + ') == "rival" or bond(' + r + ') == "nemesis" or rel(' + r + ') <= -12)'],
  soc_make_peace: ['npc', (r) => PEER(r) + ' and (bond(' + r + ') == "rival" or bond(' + r + ') == "nemesis") and rel(' + r + ') >= 3'],
  soc_rival_bet: ['npc', (r) => MATE(r) + ' and bond(' + r + ') == "rival"'],
};
module.exports = {
  id: '0018-generic-cast-fit',
  description: 'generic social events cast by premise: peers, classmates or teachers',
  FIT,
  run(ctx) {
    let n = 0;
    for (const [id, [role, where]] of Object.entries(FIT)) {
      const e = ctx.content.events[id];
      if (!e) throw new Error('no event ' + id);
      const L = ctx.lines(e.file), a = L.findIndex((l) => l.trim() === '@event ' + id);
      let end = a + 1; while (end < L.length && !/^(> |@)/.test(L[end])) end++;
      const i = L.findIndex((l, k) => k > a && k < end && new RegExp('^  ' + role + ': (any|anyone|present\\([a-z_]*\\))( where .*)?$').test(l));
      if (a < 0 || i < 0) throw new Error('cast role not found: ' + id + '.' + role);
      const pool = L[i].match(/^  [a-z_]+: (any|anyone|present\([a-z_]*\))/)[1];
      ctx.edit({ file: e.file, line: i + 1 }, '  ' + role + ': ' + pool + ' where ' + where(role)); n++;
    }
    ctx.report(n + ' cast role(s) refitted');
  },
};
