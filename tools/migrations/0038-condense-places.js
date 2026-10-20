// The academy condensed (world expansion 1, plan 5a): five places merge into a neighbour they never compete with for a
// visit. The absorbed place keeps its definition with `deprecated: <survivor>` (saves, run logs and translations still
// name it; the engine remaps it on load and in visits_to/discovered/discover); content moves to the survivor:
//   - `place:`, `where:` and `lesson:` lines, place arguments of visits_to/discovered/discover;
//   - characters' schedules (entries for one place with the same chance merge);
//   - the survivor's name, opening hours (the union) and draws (the union); the absorbed place's desc joins its own.
// Prose is untouched: the refectory and the bakery are still there, inside the hall and on the square.
'use strict';
const fs = require('fs');
const path = require('path');
const MERGE = { refectory: 'great_hall', infirmary: 'alchemy_lab', flight_field: 'stables', orchard: 'maud_cottage', bakery: 'village' };
const SURVIVOR = {
  great_hall: { name: 'The Great Hall', desc: 'Floating candles, a vaulted ceiling that shows tomorrow\'s weather, and the stage where the choir rehearses and the Midwinter Ball is held. Under the gallery, the refectory\'s long tables serve soup that tastes faintly of whatever you\'re homesick for.' },
  alchemy_lab: { name: 'The Alchemy Laboratory & Infirmary', desc: 'Long benches, cauldrons in every size and a ventilation charm that has given up on the third floor. Through the far door, clean white beds, a cupboard of tonics and Sister Amaranth, who believes none of the excuses.' },
  stables: { name: 'The Stables & Flight Field', desc: 'Hippogriffs, a sulky griffon chick, owls in the rafters and Professor Brask, who talks to all of them more kindly than to students. Beyond the paddock, a long green field with hoops at either end and a wind that cheats.' },
  maud_cottage: { name: 'Old Maud\'s Cottage & Orchard', desc: 'A thatched cottage with chickens on the doorstep, bees in the eaves, a goat called Bartholomew and a kettle that is always nearly boiling. Behind it, apple and pear trees older than the towers.' },
  village: { name: 'The Village Square', desc: 'A barge ride across the lake: crooked roofs, a market square, a bakery that has fed students for two hundred years and shopkeepers who have seen every kind of student.' },
};
const SLOTS = ['morning', 'noon', 'afternoon', 'evening', 'night', 'midnight'];
const re = (id) => new RegExp('\\b' + id + '\\b', 'g');
function grimFiles(dir) {
  let out = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) out = out.concat(grimFiles(p)); else if (f.name.endsWith('.grim')) out.push(p);
  }
  return out;
}
function mergeSchedule(text) {
  const out = [];
  for (const x of text.trim().split(/\s+/)) {
    const m = x.match(/^([a-z_][a-z0-9_]*)@([a-z,]+)(:\d+)?$/);
    if (!m) { out.push({ raw: x }); continue; }
    const place = MERGE[m[1]] || m[1], chance = m[3] || '';
    const same = out.find((o) => o.place === place && o.chance === chance);
    if (same) for (const s of m[2].split(',')) { if (!same.slots.includes(s)) same.slots.push(s); }
    else out.push({ place, slots: m[2].split(','), chance });
  }
  return out.map((o) => o.raw || o.place + '@' + o.slots.sort((a, b) => SLOTS.indexOf(a) - SLOTS.indexOf(b)).join(',') + o.chance).join(' ');
}
module.exports = {
  id: '0038-condense-places',
  description: 'Five places merge into neighbours (deprecated: markers)',
  run(ctx) {
    const root = ctx.project.ROOT || path.join(__dirname, '..', '..');
    const PLACES = 'content/world/places.grim';
    const P = ctx.content.places;
    // The place definitions.
    const L = ctx.lines(PLACES);
    let cur = null;
    for (let k = 0; k < L.length; k++) {
      const m = /^@place\s+(\S+)/.exec(L[k]);
      if (m) { cur = m[1]; if (MERGE[cur]) { ctx.insertAfter({ file: PLACES, line: k + 1 }, 'deprecated: ' + MERGE[cur]); ctx.report(cur + ' → ' + MERGE[cur]); } continue; }
      if (!cur || !SURVIVOR[cur]) continue;
      const absorbed = Object.keys(MERGE).filter((d) => MERGE[d] === cur).map((d) => P[d]);
      const at = { file: PLACES, line: k + 1 };
      if (/^name:/.test(L[k])) ctx.edit(at, 'name: ' + SURVIVOR[cur].name);
      else if (/^desc:/.test(L[k])) ctx.edit(at, 'desc: ' + SURVIVOR[cur].desc);
      else if (/^open:/.test(L[k])) {
        const open = new Set(L[k].slice(5).trim().split(/\s+/));
        for (const a of absorbed) for (const s of [].concat(a.open || []).join(' ').split(/[\s,]+/).filter(Boolean)) open.add(s);
        ctx.edit(at, 'open: ' + SLOTS.filter((s) => open.has(s)).join(' '));
      } else if (/^draws:/.test(L[k])) {
        const draws = L[k].slice(6).trim().split(/\s+/);
        for (const a of absorbed) for (const d of [].concat(a.draws || []).join(' ').split(/\s+/).filter(Boolean)) if (!draws.includes(d)) draws.push(d);
        ctx.edit(at, 'draws: ' + draws.join(' '));
      }
    }
    // Every other file.
    for (const abs of grimFiles(path.join(root, 'content'))) {
      const file = path.relative(root, abs).split(path.sep).join('/');
      if (file === PLACES) continue;
      const lines = ctx.lines(file);
      lines.forEach((l, k) => {
        const at = { file, line: k + 1 };
        let n = l;
        if (/^(schedule|schedule_break):/.test(l) && Object.keys(MERGE).some((d) => re(d + '@').test(l) || new RegExp('\\b' + d + '@').test(l))) {
          const [key, ...rest] = l.split(':'); n = key + ': ' + mergeSchedule(rest.join(':'));
        } else if (/^(place|where|lesson):/.test(l)) {
          for (const [d, s] of Object.entries(MERGE)) n = n.replace(re(d), s);
        } else if (/\b(visits_to|discovered)\(|^\s*discover\s/.test(l)) {
          for (const [d, s] of Object.entries(MERGE)) n = n.replace(new RegExp('(visits_to|discovered)\\(' + d + '\\)', 'g'), '$1(' + s + ')').replace(new RegExp('^(\\s*discover\\s+)' + d + '\\b'), '$1' + s);
        }
        if (n !== l) { ctx.edit(at, n); ctx.report(file + ':' + (k + 1)); }
      });
    }
  },
};
