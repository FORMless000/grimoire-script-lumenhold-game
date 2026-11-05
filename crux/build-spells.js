// node crux/build-spells.js [--check]
// Also copies the icons Crux shows for what an argument tests or asks (src/art.js).
// Copies the spells' Mana costs and the Mana capacity curve from the combat minigame (combat/setup/roster.mjs), which
// the main game shares (content/core/rules.grim `@resource mana`), into spells.js, so Crux spends the same Mana at the
// same prices, with the duels' own icons (docs/spell-icons via combat/web/icon-source.mjs). Only the costs, ranks, names,
// sources and icons are copied; what a spell does at the table is Crux's own (rust/core/src/rules.rs).
'use strict';
const fs = require('fs');
const path = require('path');

const USED = ['foresight', 'glamour', 'haste', 'shadowstep', 'ward', 'starlight', 'seal', 'omen', 'sleight', 'candour',
  'brace', 'quickquill', 'index', 'rapport', 'reflect', 'lodestar', 'compel', 'flame'];
// Kits are built at every level, as the duels build them (generateLoadout: the course, capstone and hidden spells each
// learned at its level gate, the course ranks by the loadout's weighted-random curriculum, the skills jittered by level).
const LEVELS = Array.from({ length: 100 }, (_, i) => i + 1);

(async () => {
  const roster = await import(path.join(__dirname, '../combat/setup/roster.mjs'));
  const icons = (await import(path.join(__dirname, '../combat/web/icon-source.mjs'))).readSpellIcons();
  const spells = {};
  for (const id of USED) {
    const s = roster.SPELLS[id];
    if (!s) throw Error(`combat has no spell ${id}`);
    spells[id] = { name: s.name, source: s.source, cost: s.cost, group: s.group, ...(s.alignment ? { alignment: s.alignment } : {}), icon: icons[id] };
  }
  // A player whose skills all sit at their level: the capacity the game's own formula gives them.
  const even = (k) => ({ arcana: k, lore: k, alchemy: k, charm: k, vigor: k, guile: k });
  const capacity = Object.fromEntries([20, 50, 80].map((l) => [l, roster.manaCapacity(even(l))]));
  // The table's own actions wear the duels' action icons (docs/action-icons), drawn the way icon-source.mjs draws them.
  const actionIcon = (file) => {
    const svg = fs.readFileSync(path.join(__dirname, '../docs/action-icons', file + '.svg'), 'utf8').trim().match(/^<svg\b[^>]*>([\s\S]*)<\/svg>$/)[1];
    return `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${svg}</svg>`;
  };
  const actions = { confront: actionIcon('confront'), deflect: actionIcon('deflect'), press: actionIcon('strike'), leave: actionIcon('withdraw') };
  // What a card tests or asks wears the game's own icon for it (src/art.js; the skills' `icon:` in content/core/rules.grim,
  // crowns' coin, Health's heart, Renown's star); standing, bond and record take the nearest ones.
  const ART = require('../src/art.js').ICONS;
  const SIGN = { charm: 'mask', lore: 'book', guile: 'eye', arcana: 'wand', alchemy: 'potion', vigor: 'sword', standing: 'crown', bond: 'ring', record: 'scroll', crowns: 'coin', health: 'heart', renown: 'star' };
  const signs = Object.fromEntries(Object.entries(SIGN).map(([k, art]) => [k, `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ART[art]}</svg>`]));
  // The player's kit, as the duels build it (combat/setup/loadouts.mjs via generateLoadout): each class's skills, Mana
  // capacity and spells with their ranks at each level. Crux keeps the spells it has a use for, the negotiation-only ones
  // the duels leave out (COMBAT_EXCLUDED) included.
  // The duels drop those when picking a kit (setup/roster.mjs spellUnlocks): Glamour as a course, and Index, Quickquill,
  // Rapport and Sleight as capstones, which play as the class's stand-in. Here the same picks run with them allowed, so a
  // class gets back the negotiation spells it would have learned, at the same levels, in place of the stand-in.
  const T = roster.COMBAT_TUNING.kits;
  function talks(def) {
    const at = {}, dropped = [];
    const order = roster.COURSE_PICKS.map((id, i) => [id, def.course[i]]).filter(([, w]) => w > 0).sort((a, b) => b[1] - a[1]).map(([id]) => id);
    const starter = order.find((id) => !['haste', 'shadowstep'].includes(id));
    const courses = [starter, ...order.filter((id) => id !== starter)].slice(0, 4);
    if (courses.includes('glamour')) at.glamour = Math.max(T.courses[courses.indexOf('glamour')], T.courseMin.glamour || 1);
    const lists = { ...def.hidden, ...def.extras };
    const caps = [...new Set([...(def.iconic || []), def.place, ...Object.entries(lists).filter(([, w]) => w > 0).sort((a, b) => b[1] - a[1]).map(([id]) => id)])].filter((id) => id && roster.SPELLS[id].capstone);
    const chosen = caps.slice(0, 1);
    for (let i = 1; i < T.capstones.length && chosen.length < caps.length; i++) chosen.push((i === 1 && caps.find((id) => !chosen.includes(id) && roster.SPELLS[id].capstone !== roster.SPELLS[chosen[0]].capstone)) || caps.find((id) => !chosen.includes(id)));
    chosen.forEach((id, i) => { if (roster.COMBAT_EXCLUDED.has(id)) { at[id] = T.capstones[i]; if (def.standIn && def.standIn[id]) dropped.push([def.standIn[id], T.capstones[i]]); } });
    return { at, dropped };
  }
  const kits = {};
  for (const name of Object.keys(roster.LOADOUTS)) {
    kits[name] = {};
    const { at, dropped } = talks(roster.LOADOUTS[name]);
    for (const l of LEVELS) {
      const k = roster.generateLoadout(name, l), spells = { ...k.spells };
      for (const [id, lv] of dropped) if (lv <= l) delete spells[id];
      for (const [id, lv] of Object.entries(at)) if (lv <= l) spells[id] = roster.SPELLS[id].levels === 3 ? roster.courseRank(l) : 1;
      kits[name][l] = { skills: k.skills, capacity: k.capacity, spells: Object.fromEntries(USED.filter((id) => spells[id]).map((id) => [id, spells[id]])) };
    }
    // Compact: the skills and capacity at each level (index = level − 1), and each spell as the levels it reaches each rank.
    const by = kits[name], skillKeys = Object.keys(by[1].skills), spellsAt = {};
    for (const l of LEVELS) for (const [id, r] of Object.entries(by[l].spells)) {
      const steps = (spellsAt[id] ||= []);
      if (!steps.length || steps.at(-1)[1] !== r) steps.push([l, r]);
    }
    kits[name] = { skills: skillKeys, levels: LEVELS.map((l) => skillKeys.map((k) => by[l].skills[k])), capacity: LEVELS.map((l) => by[l].capacity), spells: Object.fromEntries(USED.filter((id) => spellsAt[id]).map((id) => [id, spellsAt[id]])) };
  }
  const body = JSON.stringify({ spells, capacity, kits, actions, signs }, null, 1);
  const out = `/* Generated by crux/build-spells.js from combat/setup/roster.mjs. Do not edit. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CruxSpells = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return ${body};
});
`;
  const target = path.join(__dirname, 'spells.js');
  if (process.argv.includes('--check')) {
    const same = fs.existsSync(target) && fs.readFileSync(target, 'utf8') === out;
    console.log(same ? 'spells.js is current' : 'spells.js is stale: run node crux/build-spells.js');
    process.exit(same ? 0 : 1);
  }
  fs.writeFileSync(target, out);
  console.log(`wrote ${target}`);
})();
