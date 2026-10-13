// Phase 2b: the world loop — calendar, director days, the map, tracks and exams, cast, arcs, push windows.
// These run against the real content (content/), so they also guard the slice wiring.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const G = require('../src/grimoire.js');
const Engine = require('../src/engine.js');
const Policies = require('../tools/policies.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');

const { content, errors } = project(ROOT).compileAll();
const quiet = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };

// Play with a style until `stop(eng, r)` is true or the game ends. Returns { eng, r }.
function play(seed, styleName, stop = () => false, setup = null) {
  const eng = new Engine(content);
  const style = Policies.get(styleName);
  return quiet(() => {
    let r = eng.newGame({ seed, name: 'T' });
    if (setup) setup(eng);
    for (let i = 0; i < 6000 && r.kind !== 'ending'; i++) {
      if (stop(eng, r)) break;
      if (r.kind === 'month') { r = eng.advance(); continue; }
      if (r.kind === 'map') { eng.pickPlaces((style.pickPlaces || Policies.pickPlaces)(eng, r.view)); r = eng.advance(); continue; }
      const v = r.view;
      if (v.pick > 1) {
        const opts = v.options.filter((o) => !o.disabled && o.key !== 'none');
        const keys = Policies.pickMany(eng, v, opts);
        eng.choose(keys.length ? keys : [v.options.find((o) => !o.disabled).key]);
      } else eng.choose(style.pick(eng, v));
      r = eng.advance();
    }
    return { eng, r };
  });
}

test('the real content compiles', () => assert.deepEqual(errors.map((e) => e.message), []));

test('calendar: four years, 47 turns, terms and breaks', () => {
  const eng = new Engine(content);
  assert.equal(eng.maxTurns, 47);
  assert.equal(eng.phaseOf(1), 'term');
  assert.equal(eng.phaseOf(5), 'break');            // Deepwinter: winter break
  assert.equal(eng.phaseOf(11), 'break');           // Goldenhaze: summer break
  assert.ok(eng.isTermStart(1) && eng.isTermStart(7));
  assert.ok(eng.isTermEnd(4) && !eng.isTermEnd(3));
  assert.equal(eng.termIndex(1), 1);
  assert.equal(eng.termIndex(7), 2);
  assert.equal(eng.termIndex(13), 3);
  assert.equal(eng.yearOf(37), 4);
  assert.equal(eng.seasonOf(1), 'autumn');
});

test('a month is a day: map first, then a slot-ordered deck within the card cap', () => {
  const eng = new Engine(content);
  const r = quiet(() => eng.newGame({ seed: 7, name: 'T' }));
  const m = r.kind === 'month' ? quiet(() => eng.advance()) : r;
  assert.equal(m.kind, 'map');
  const v = m.view;
  assert.deepEqual(v.slots, ['afternoon', 'evening']);
  assert.equal(v.map, 'campus');
  assert.ok(v.places.some((p) => p.state === 'open'), 'some place is open');
  const closed = v.places.find((p) => p.state === 'closed');
  if (closed) assert.throws(() => eng.pickPlaces([closed.id, null]), /not open/);
  quiet(() => eng.pickPlaces(Policies.pickPlaces(eng, v)));
  const order = ['morning', 'noon', 'afternoon', 'evening', 'night', 'midnight'];
  const slots = eng.s.deck.map((c) => order.indexOf(c.slot || 'morning'));
  assert.deepEqual(slots, slots.slice().sort((a, b) => a - b), 'cards come in slot order');
  assert.ok(eng.s.deck.length <= content.game.max_cards_per_day, 'within max_cards_per_day');
  assert.equal(eng.s.hist.filter((h) => h.t === 'pick').length, 1);
});

test('enrolment: pick two of the first-term courses; later courses open later', () => {
  let seen = null;
  const { eng } = play(11, 'balanced', (e, r) => { if (r.kind === 'card' && r.view && r.view.id === 'enrolment') { seen = r.view; return true; } return false; });
  assert.ok(seen, 'the enrolment menu appears in the first month');
  assert.equal(seen.pick, 2);
  const keys = seen.options.map((o) => o.key);
  assert.ok(keys.includes('evocation') && !keys.includes('umbral') && !keys.includes('beastcraft'), 'opens: 2 courses wait for term 2');
  quiet(() => eng.choose(['evocation', 'astromancy']));
  assert.equal(eng.s.tracks.evocation.status, 'enrolled');
  assert.equal(eng.s.tracks.astromancy.level, 1);
  assert.ok(eng.s.states.class_pyromancy, 'legacy: enrolling grants the old elective state');
});

test('term end: exams give grades, a GPA, and passing teaches spells', () => {
  const { eng } = play(23, 'balanced', (e) => e.s.turn >= 5);
  const courses = Object.entries(eng.s.tracks).filter(([id, t]) => t.kind === 'course' && t.grades.length);
  assert.ok(courses.length >= 1, 'at least one course was examined');
  for (const [, t] of courses) assert.match(t.grades[0], /^[ABCF]$/);
  const gpa = eng.gpa();
  assert.ok(gpa >= 0 && gpa <= 4);
  for (const [id, t] of courses) if (t.passed[1] && t.passed[1] !== 'F') {
    for (const x of content.tracks[id].teaches.filter((x) => x.level === 1)) assert.ok(eng.s.spells[x.spell], id + ' level 1 teaches ' + x.spell);
  }
});

test('obligations: a truant loses performance; a dutiful member keeps it', () => {
  // Both join the Duelling Circle and the library job on day one, then play two terms.
  const join = (eng) => { const ctx = eng.newCtx(null, null); eng.trackOp({ t: 'join', track: 'duelling' }, ctx); eng.trackOp({ t: 'join', track: 'library_assistant' }, ctx); };
  const run = (style) => play(31, style, (e) => e.s.turn >= 8, join).eng.s.tracks;
  const dutiful = run('balanced'), truant = run('truant');
  for (const id of ['duelling', 'library_assistant']) {
    if (truant[id].status === 'left') continue;   // quit at the Job Board: no obligations left to miss
    assert.ok(truant[id].perf < dutiful[id].perf, id + ': truant ' + truant[id].perf + ' vs balanced ' + dutiful[id].perf);
    assert.ok(truant[id].perf < 50 || truant[id].status === 'dropped', id + ' truant perf ' + truant[id].perf);
  }
});

test('attending a member place counts a visit and pays a job', () => {
  const eng = new Engine(content);
  quiet(() => { eng.newGame({ seed: 3, name: 'T' }); });
  const ctx = eng.newCtx(null, null);
  eng.trackOp({ t: 'join', track: 'library_assistant' }, ctx);
  const gold = eng.s.vals.gold;
  eng.attend('library_assistant', ctx);
  const t = eng.s.tracks.library_assistant;
  assert.equal(t.visits, 1);
  assert.equal(eng.s.vals.gold, gold + content.tracks.library_assistant.pay[0]);
  eng.trackOp({ t: 'join', track: 'tavern' }, ctx);
  assert.equal(t.status, 'left', 'one job at a time');
});

test('cast roles fill from met characters and resolve in text', () => {
  const { eng } = play(5, 'social', (e) => e.s.turn >= 6);
  const withCast = Object.values(content.events).filter((e) => (e.cast || []).some((r) => r.pool !== 'fixed'));
  assert.ok(withCast.length >= 3, 'the slice uses cast roles');
  const filled = quiet(() => withCast.map((ev) => [ev, eng.fillCast(ev)]).filter(([, c]) => c));
  assert.ok(filled.length >= 1, 'some cast event can be cast by turn 6');
  for (const [ev, cast] of filled) {
    for (const r of ev.cast) if (cast[r.role]) assert.ok(content.npcs[cast[r.role]], ev.id + ' ' + r.role + ' is a character');
    const role = ev.cast.find((r) => cast[r.role]).role;
    const text = eng.interp('{' + role + '} waves.', null, null, cast);
    assert.ok(!text.includes('{'), text);
    assert.ok(text.startsWith(content.npcs[cast[role]].name.split(' ')[0]), text);
  }
});

test('arcs: a clock advances on its beats whatever the player does', () => {
  const bell = content.arcs.the_bell;
  const first = bell.beats[0];
  const { eng } = play(9, 'random', (e) => e.s.turn > first.turn);
  assert.ok((eng.s.arcs.the_bell || {}).clock >= first.clock, JSON.stringify(eng.s.arcs.the_bell));
});

test('queue windows: within A..B and by month M schedule into the right turns', () => {
  const src = `@game
title: T
years: 1
months: A, B, C, D, E, F, G, H, I, J, K, L

@resource mood
name: Mood
start: 50

@event start
trigger: auto
when: turn == 1
title: S
text: s
> ok: Go
  queue later within 2..3
  queue deadline by month 6
  mood +1

@event later
trigger: queued
title: L
text: l
> ok: Ok
  mood +1

@event deadline
trigger: queued
title: D
text: d
> ok: Ok
  unqueue later
  mood +1
`;
  const { content: c, errors: errs } = G.compile([{ path: 'content/q.grim', text: src }]);
  assert.deepEqual(errs.map((e) => e.message), []);
  const eng = new Engine(c);
  let r = quiet(() => eng.newGame({ seed: 1, name: 'T' }));
  while (r.kind !== 'card') r = eng.advance();
  quiet(() => eng.choose('ok'));
  const later = eng.s.queue.find((q) => q.id === 'later'), dl = eng.s.queue.find((q) => q.id === 'deadline');
  assert.ok(later.due >= 2 && later.due <= 4, 'within 2..3 months: ' + JSON.stringify(later));
  assert.ok(dl.due <= 6, 'by month 6: ' + JSON.stringify(dl));
});

test('a full four-year game ends under every quick style', () => {
  for (const style of ['random', 'balanced', 'truant']) {
    const { eng, r } = play(101, style);
    assert.equal(r.kind, 'ending', style);
    assert.ok(eng.s.turn >= 40 || content.endings[r.ending.id].early, style + ' ended at turn ' + eng.s.turn);
  }
});

test('the v0.2 calendar migration is recorded as applied', () => {
  const applied = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', '.migrations.json'), 'utf8'));
  const ids = (applied.applied || applied).map((a) => (typeof a === 'string' ? a : a.id));
  assert.ok(ids.some((id) => /^0001/.test(id)), JSON.stringify(applied));
});
