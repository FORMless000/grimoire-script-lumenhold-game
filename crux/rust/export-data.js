// node crux/rust/export-data.js
// Writes the data the Rust core embeds (rust/core/data/*.json) from the JavaScript data files: the cards (cards.js), the
// spells and loadouts (spells.js, from the combat roster), and the bound negotiations (encounters.js). Rerun after
// editing any of them; the core reads only these.
'use strict';
const fs = require('fs'), path = require('path');
const C = require('../cards.js'), S = require('../spells.js'), ENCOUNTERS = require('../encounters.js');
let stale = false;
const out = (name, x) => { const file = path.join(__dirname, 'core/data', name), text = `${JSON.stringify(x)}\n`; if (process.argv.includes('--check')) { if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) { console.error(file + ' is stale'); stale = true; } } else fs.writeFileSync(file, text); };

const card = (c) => ({ id: c.id, title: c.title, text: c.text, signal: c.signal || null, dc: c.dc, sway: c.sway, fail: c.fail, fx: c.fx || null, wait: c.wait || 0, gate: c.gate || null });
out('cards.json', {
  signals: Object.keys(C.SIGNALS),
  signalNames: C.SIGNALS,
  main: C.MAIN,
  common: C.COMMON.map(card),
  circumstances: Object.fromEntries(Object.entries(C.CIRCUMSTANCES).map(([k, c]) => [k, {
    lean: c.lean, crux: c.crux, hexes: c.hexes || null, cards: c.cards.map(card), demands: c.demands.map(card),
  }])),
  hexes: Object.fromEntries(Object.entries(C.HEXES).map(([k, h]) => [k, { ...card({ ...h, fail: 'none' }), hex: k, lands: h.lands }])),
  byEvent: Object.fromEntries(ENCOUNTERS.map((e) => [e.key, C.circumstanceOf(e)])),
  shownSpells: C.SHOWN_SPELLS,
});
out('spells.json', {
  spells: Object.fromEntries(Object.entries(S.spells).map(([k, s]) => [k, { name: s.name, cost: s.cost }])),
  // Each kit at every level 1–100: its skills (named once), capacity, and each spell's [level, rank] steps.
  kits: Object.entries(S.kits).map(([name, k]) => ({ name, skills: k.skills, levels: k.levels, capacity: k.capacity, spells: Object.entries(k.spells) })),
});
const grey = /man in grey/i;
out('encounters.json', ENCOUNTERS.map((e) => ({
  key: e.key, level: e.level, using: e.using || null, partial: e.partial === true, tutorial: !!e.tutorial, steps: e.steps || [],
  room: e.room || null, grey: grey.test(`${e.who || ''} ${e.intro || ''}`), hash: e.key || e.event || '',
})));
if (stale) process.exit(1);
if (!process.argv.includes('--check')) console.log('wrote rust/core/data/{cards,spells,encounters}.json');
