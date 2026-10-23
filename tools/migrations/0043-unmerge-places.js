// Three of 0038's merges undone (2026-10-23): the refectory, the infirmary and the flight field are their own places
// again, each with its own pool. The orchard and the bakery stay merged. Every line 0038 rewrote is restored from the
// tree before it (8f01f1f):
//   - the three places lose `deprecated:`; the survivors get back their own name, hours, draws and desc;
//   - each card that lived there goes back (and two break cards written since, which belong there);
//   - the alchemy course's infirmary lessons, the cook's taster gate, and the schedules of Lyra, Tobias, Mir and Amaranth.
// Saves made since the merge gain the places on load (engine.js load); visit counts stay with the survivors.
'use strict';
const PLACES = 'content/world/places.grim';
const UNDEPRECATE = ['refectory', 'infirmary', 'flight_field'];
const SURVIVOR = {
  great_hall: { name: 'The Great Hall', open: 'noon afternoon evening', draws: 'festival social', desc: 'Floating candles, a vaulted ceiling that shows tomorrow\'s weather, and the stage where the choir rehearses and the Midwinter Ball is held.' },
  alchemy_lab: { name: 'The Alchemy Laboratory', open: 'morning afternoon evening', draws: 'class magic', desc: 'Long benches, cauldrons in every size, and a ventilation charm that has given up on the third floor.' },
  stables: { name: 'The Familiar Stables', open: 'morning afternoon evening', draws: 'nature', desc: 'Hippogriffs, a sulky griffon chick, owls in the rafters and Professor Brask, who talks to all of them more kindly than to students.' },
};
const BACK = {
  refectory: ['midnight_kitchen_raid', 'refectory_late_supper', 'refectory_house_tables', 'refectory_pudding_tax', 'kitchen_stores', 'kitchen_night_baker', 'refectory_cooks_taster', 'ref_food_fight', 'ref_cook_secret', 'brk_kitchen_pie'],
  infirmary: ['amaranth_intro', 'infirmary_spare_bed', 'infirmary_visiting_hour', 'infirmary_tonic_cupboard', 'brk_amaranth_restock'],
  flight_field: ['sky_tryouts', 'sky_crash', 'sky_championship', 'flight_field_cheating_wind', 'flight_field_pickup_race', 'flight_field_long_grass', 'flight_field_quiet_hour'],
};
const LESSON = { alch_bandage_round: 'infirmary', alch_original_remedy: 'infirmary', alch_cracked_tray: 'infirmary', alch_lake_fever: 'infirmary' };
const WHEN = { refectory_cooks_taster: (l) => l.replace('visits_to(great_hall)', 'visits_to(refectory)') };
const SCHEDULE = {
  lyra: { schedule: 'duel_hall@afternoon,evening refectory@noon library@night:60' },
  tobias: { schedule: 'greenhouses@morning,afternoon refectory@noon,evening stables@evening:60' },
  mir: { schedule: 'workshop@afternoon,evening,night refectory@noon:50 lecture_tower@morning' },
  amaranth: { schedule: 'alchemy_lab@morning infirmary@afternoon,evening,night great_hall@noon', schedule_break: 'infirmary@afternoon,evening,night' },
};
module.exports = {
  id: '0043-unmerge-places',
  description: 'The refectory, infirmary and flight field are their own places again',
  run(ctx) {
    // The place definitions.
    const L = ctx.lines(PLACES);
    let cur = null;
    for (let k = 0; k < L.length; k++) {
      const m = /^@place\s+(\S+)/.exec(L[k]);
      if (m) { cur = m[1]; continue; }
      const at = { file: PLACES, line: k + 1 };
      if (UNDEPRECATE.includes(cur) && /^deprecated:/.test(L[k])) { ctx.remove(at); ctx.report(cur + ': restored'); continue; }
      const f = /^(name|open|draws|desc):/.exec(L[k]);
      if (f && SURVIVOR[cur]) ctx.edit(at, f[1] + ': ' + SURVIVOR[cur][f[1]]);
    }
    // The cards.
    const PLACE = {};
    for (const [p, ids] of Object.entries(BACK)) for (const id of ids) PLACE[id] = p;
    const ids = new Set([...Object.keys(PLACE), ...Object.keys(LESSON), ...Object.keys(WHEN)]);
    for (const id of ids) if (!ctx.content.events[id]) throw new Error('no event ' + id);
    for (const file of new Set([...ids].map((id) => ctx.content.events[id].file))) {
      const lines = ctx.lines(file);
      let ev = null;
      for (let k = 0; k < lines.length; k++) {
        const m = /^@(\S+)\s+(\S+)/.exec(lines[k]);
        if (m) { ev = m[1] === 'event' && ids.has(m[2]) ? m[2] : null; continue; }
        if (!ev) continue;
        const at = { file, line: k + 1 };
        if (PLACE[ev] && /^place:/.test(lines[k])) { ctx.edit(at, 'place: ' + PLACE[ev]); ctx.report(ev + ' → ' + PLACE[ev]); }
        else if (LESSON[ev] && /^lesson:/.test(lines[k])) { ctx.edit(at, 'lesson: ' + LESSON[ev]); ctx.report(ev + ': lesson'); }
        else if (WHEN[ev] && /^when:/.test(lines[k])) { ctx.edit(at, WHEN[ev]); ctx.report(ev + ': when'); }
      }
    }
    // The schedules.
    const CAST = 'content/world/cast.grim';
    const C = ctx.lines(CAST);
    let npc = null;
    for (let k = 0; k < C.length; k++) {
      const m = /^@(\S+)\s+(\S+)/.exec(C[k]);
      if (m) { npc = m[1] === 'npc' ? m[2] : null; continue; }
      const s = /^(schedule|schedule_break):/.exec(C[k]);
      if (s && npc && SCHEDULE[npc] && SCHEDULE[npc][s[1]]) { ctx.edit({ file: CAST, line: k + 1 }, s[1] + ': ' + SCHEDULE[npc][s[1]]); ctx.report(npc + ': ' + s[1]); }
    }
  },
};
