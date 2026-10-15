// Tests for the worldbook (phase 1): parser, canon lint, lorebook/brief, rename of worldbook ids.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const G = require('../src/grimoire.js');
const Canon = require('../tools/canon.js');
const WB = require('../tools/worldbook.js');
const { rename } = require('../tools/rename.js');
const { project } = require('../tools/project.js');
const { ROOT, tempProject, read, write } = require('./helpers.js');

const compile = (text) => G.compile([{ path: 'content/w.grim', text }]);

test('structured worldbook values parse', () => {
  const { content, errors } = compile(`@npc lyra
name: Lyra Vane
age: 19
traits: proud lonely
stats: arcana 34 lore 22 wealth 5
schedule: duel_hall@afternoon,evening library@night
relations: kael:-20 tobias:5

@place duel_hall
name: The Hall
map: campus 660,150
open: afternoon evening
discover: met(lyra)

@track evocation
kind: course
name: Evocation
skill: arcana
levels: 3
teaches: flame@1 tide@2
pay: 8, 12, 18
prereq: passed(alchemy, 2) and clue(star_key)

@fact lyra.mother
tier: personal
unlock: rel(lyra) >= 30
text: Never "well done".

@arc hollowstar
acts: omens@y1 investigation@y2
clock: 0..12
beats: 2@y1m3 5@y2m2

@archetype student
age: 18..22

@vocab tones
values: light warm tense

@vocab canon_allowlist
values: Magic and Duty, Sleeping Draught
`);
  assert.deepEqual(errors, []);
  const n = content.npcs.lyra;
  assert.equal(n.age, 19);
  assert.deepEqual(n.stats, { arcana: 34, lore: 22, wealth: 5 });
  assert.deepEqual(n.schedule, [{ place: 'duel_hall', slots: ['afternoon', 'evening'] }, { place: 'library', slots: ['night'] }]);
  assert.deepEqual(n.relations, { kael: -20, tobias: 5 });
  assert.deepEqual(content.places.duel_hall.map, { map: 'campus', x: 660, y: 150 });
  assert.equal(content.places.duel_hall.discover.src, 'met(lyra)');
  assert.deepEqual(content.tracks.evocation.teaches, [{ spell: 'flame', level: 1 }, { spell: 'tide', level: 2 }]);
  assert.deepEqual(content.tracks.evocation.pay, [8, 12, 18]);
  assert.equal(content.tracks.evocation.skill, 'arcana');
  assert.equal(content.facts['lyra.mother'].tier, 'personal');
  assert.deepEqual(content.arcs.hollowstar.beats[1], { clock: 5, year: 2, month: 2 });
  assert.deepEqual(content.archetypes.student.age, { min: 18, max: 22 });
  assert.deepEqual(content.vocab.tones.values, ['light', 'warm', 'tense']);
  assert.deepEqual(content.vocab.canon_allowlist.values, ['Magic and Duty', 'Sleeping Draught']);
});

test('structured values report clear errors; dotted ids only for @fact', () => {
  assert.match(compile('@npc x\nname: X\nschedule: library at night\n').errors[0].message, /schedule: expected place@slot/);
  assert.match(compile('@place p\nname: P\nmap: 660,150\n').errors[0].message, /map: expected/);
  assert.match(compile('@npc x\nname: X\nstats: arcana high\n').errors[0].message, /not a number/);
  assert.match(compile('@place a.b\nname: P\n').errors[0].message, /only @fact ids/);
  assert.match(compile('@fact lyra\ntier: surface\ntext: t\n').errors[0].message, /npc\.key/);
});

test('canon: candidates skip ordinary sentence starts and keep multi-word names', () => {
  const c = Canon.candidates('You meet the Duchess of Ambry. Somewhere, Professor Brask sighs. "Fine," says Mabel.');
  const names = c.map((x) => x.name);
  assert.ok(names.includes('Duchess of Ambry'));
  assert.ok(names.includes('Professor Brask'));
  assert.ok(names.includes('Mabel'));
});

test('canon: the real content has no unknown proper nouns', () => {
  const { content } = project(ROOT).compileAll();
  const glossary = fs.readFileSync(path.join(ROOT, 'locales/zh-CN/GLOSSARY.md'), 'utf8');
  assert.deepEqual(Canon.unknownNames(content, glossary), []);
  // …and an invented name is caught.
  content.events.lyra_toast.text += ' Lord Featherby of Glimmerholt watches.';
  const u = Canon.unknownNames(content, glossary).map((x) => x.name);
  assert.ok(u.some((n) => /Featherby/.test(n)), u.join(', '));
});

test('lorebook and brief cover the worldbook', () => {
  const { content, sources } = project(ROOT).compileAll();
  const book = WB.lorebook(content);
  const kinds = new Set(book.map((e) => e.kind));
  for (const k of ['npc', 'fact', 'place', 'track', 'spell', 'lore', 'arc', 'timeline']) assert.ok(kinds.has(k), k);
  const b = WB.brief(content, sources, { cast: ['lyra'], place: 'library', arc: 'hollowstar', topic: 'the founders seal', tier: 'surface' });
  assert.match(b.text, /Lyra Vaneshade/);
  assert.match(b.text, /\[surface\]/);
  assert.doesNotMatch(b.text, /\[personal\]/, 'tier respected');
  assert.match(b.text, /## Lore/);
  assert.ok(b.chars < 24000);
  assert.throws(() => WB.brief(content, sources, { cast: ['nobody'] }), /unknown: npc nobody/);
});

test('brief: cards already at the place or track, examples from there first, --like and --examples (step 5)', () => {
  const { content, sources } = project(ROOT).compileAll();
  const b = WB.brief(content, sources, { place: 'gilded_newt', track: 'tavern', topic: 'a brawl during a night shift' });
  assert.match(b.text, /## Already written here \(\d+\)/);
  assert.match(b.text, /`tavern_brawl` Brawl at the Newt/);
  const ex = [...b.text.matchAll(/```grim\n# \S+\n@event (\w+)/g)].map((m) => m[1]);
  assert.ok(ex.length >= 1);
  for (const id of ex) { const e = content.events[id]; assert.ok(e.place === 'gilded_newt' || e.track === 'tavern', id + ' is from the Newt'); }
  const l = WB.brief(content, sources, { like: ['life_timeloop_2'], examples: 0, topic: 'time loop' });
  assert.match(l.text, /@event life_timeloop_2/);
  assert.throws(() => WB.brief(content, sources, { like: ['no_such_event'] }), /unknown: event no_such_event/);
  const retired = Object.values(content.events).filter((e) => (e.tags || []).includes('retired')).map((e) => e.id);
  const r = WB.brief(content, sources, { like: [], examples: 10, topic: 'enrolment club fair courses' });
  for (const id of retired) assert.doesNotMatch(r.text, new RegExp('@event ' + id + '\\n'), 'retired ' + id + ' is never an example');
});

test('rename place updates schedules and the place header', () => {
  const dir = tempProject();
  write(dir, 'content/world/places.grim', '@place library\nname: The Library\nmap: campus 1,2\n\n@place yard\nname: The Yard\nmap: campus 3,4\n');
  write(dir, 'content/world/people.grim', '@npc mir\nname: Mir Ten\nage: 19\nschedule: library@night yard@noon\n');
  rename(dir, 'place', 'library', 'great_library');
  assert.match(read(dir, 'content/world/places.grim'), /^@place great_library$/m);
  assert.match(read(dir, 'content/world/people.grim'), /schedule: great_library@night yard@noon/);
});

test('authoring examples parse', () => {
  const dir = path.join(ROOT, 'docs', 'authoring', 'examples');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.grim'))) {
    assert.doesNotThrow(() => G.parseFile(fs.readFileSync(path.join(dir, f), 'utf8'), f), f);
  }
});
