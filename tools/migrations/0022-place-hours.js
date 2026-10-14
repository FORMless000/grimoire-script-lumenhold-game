// Playtest 2, M2: most places are open for both visits (afternoon and evening), so the map offers real choices in
// either slot. The bakery keeps its baker's hours and internship hosts their own. Place events whose text names
// a time now favour it (`time:`, M43), since their place is open at more hours.
'use strict';
const ADD = {
  alchemy_lab: 'evening', greenhouses: 'evening', flight_field: 'evening', job_board: 'evening', lecture_tower: 'evening',
  mabels: 'evening', orchard: 'evening', grimsbys_books: 'evening', pell_apothecary: 'evening',
  gargoyle_passage: 'afternoon', restricted_section: 'afternoon', seventh_tower: 'afternoon', observatory: 'afternoon',
  refectory: 'afternoon', great_hall: 'afternoon', gilded_newt: 'afternoon',
};
const ORDER = ['morning', 'noon', 'afternoon', 'evening', 'night', 'midnight'];
const TAGS = {
  obs_comet_watch: 'time: evening night', stars_cocoa_night: 'time: evening night', stars_meteor_bet: 'time: evening night',
  observatory_night_log: 'time: evening night', observatory_one_star_each: 'time: evening night', observatory_scraped_word: 'time: evening night',
  gilded_newt_card_game: 'time: evening night', gilded_newt_corner_table: 'time: evening night',
  restricted_section_chained_book: 'time: evening', restricted_section_handleless_door: 'time: evening',
  gargoyle_passage_offering_dish: 'time: evening', seventh_tower_dust_room: 'time: evening',
  refectory_late_supper: 'time: evening', refectory_pudding_tax: 'time: evening', refectory_house_tables: 'time: evening',
  great_hall_choir_rehearsal: 'time: evening', courtyard_sundial_bench: 'time: afternoon', courtyard_saved_seat: 'time: afternoon',
  duel_hall_humming_circle: 'time: evening', thesis_lab_borrowed_candle: 'time: evening', headmistress_tower_stone_owl: 'time: evening',
};
module.exports = {
  id: '0022-place-hours',
  description: 'most places open for both visits; place events naming a time favour it (M2, M43)',
  ADD, TAGS,
  run(ctx) {
    const files = ctx.project.compileAll().sources.map((s) => s.path).filter((f) => f.endsWith('.grim'));
    const places = new Set(Object.keys(ADD)), events = new Set(Object.keys(TAGS));
    for (const file of files) {
      const L = ctx.lines(file);
      let place = null;
      L.forEach((l, i) => {
        let m;
        if ((m = l.match(/^@place ([a-z0-9_]+)$/))) place = m[1];
        else if (/^@/.test(l)) place = null;
        if (place && ADD[place] && /^open:/.test(l)) {
          const open = l.replace(/^open:\s*/, '').split(/\s+/).filter(Boolean);
          if (!open.includes(ADD[place])) open.push(ADD[place]);
          open.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
          ctx.edit({ file, line: i + 1 }, 'open: ' + open.join(' '));
          places.delete(place);
        }
        if ((m = l.match(/^@event ([a-z0-9_]+)$/)) && TAGS[m[1]]) {
          let end = i + 1; while (end < L.length && !/^(@|>)/.test(L[end])) end++;
          if (L.slice(i + 1, end).some((x) => /^(slot|time):/.test(x))) throw new Error(m[1] + ' already has a slot or time');
          ctx.insertAfter({ file, line: i + 1 }, TAGS[m[1]]); events.delete(m[1]);
        }
      });
    }
    if (places.size || events.size) throw new Error('not found: ' + [...places, ...events].join(', '));
    ctx.report(Object.keys(ADD).length + ' places opened for a second visit; ' + Object.keys(TAGS).length + ' place events tagged');
  },
};
