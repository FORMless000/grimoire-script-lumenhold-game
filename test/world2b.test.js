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

test('calendar: four years, 48 turns, terms and breaks', () => {
  const eng = new Engine(content);
  assert.equal(eng.maxTurns, 48);
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

test('wrap-up (M21): year 4\'s last break has no plan or board, and the last day only resolves the run', () => {
  const eng = new Engine(content); eng.newGame({ seed: 7, origin: 'noble' });
  assert.ok(eng.isWrapUp(47) && eng.isWrapUp(48) && !eng.isWrapUp(46) && !eng.isWrapUp(11));
  // jump to Goldenhaze of year 4
  eng.s.turn = 46; eng.s.deck = []; eng.s.queue = []; eng.s.day = null;
  const m = eng.beginMonth();
  assert.ok(!m.summary.some((x) => /board/i.test(x.label || '')), 'no board in the wrap-up');
  assert.equal(eng.mapView().phase, 'wrapup');
  eng.stepDay();   // the morning's pushed cards
  assert.ok(eng.s.deck.some((d) => d.id === 'wrapup_begins'));
  assert.ok(!eng.s.deck.some((d) => d.id === 'break_plan'), 'no break plan in the wrap-up');
  // the last day: no map, only pushed cards
  eng.s.turn = 47; eng.s.deck = []; eng.s.queue = []; eng.s.day = null;
  eng.beginMonth();
  const steps = []; for (let i = 0; i < 20 && !eng.s.day.done; i++) steps.push(eng.stepDay());
  assert.ok(!steps.includes('pick'), 'no map on the last day');
  assert.deepEqual(eng.s.deck.map((d) => d.id).filter((id) => content.events[id].trigger !== 'auto' && content.events[id].trigger !== 'queued'), []);
  assert.ok(eng.s.deck.some((d) => d.id === 'graduation_eve'));
});

test('origin screen (M32): the origin applies before month 1\'s charges; the mirror only reflects it', () => {
  const choices = new Engine(content).originChoices();
  assert.deepEqual(choices.map((o) => o.key), ['noble', 'scholar', 'hedge', 'street', 'merchant']);
  assert.ok(choices.every((o) => o.state && o.money), 'every origin has a state and a money line');
  assert.ok(choices.find((o) => o.key === 'street').poor && !choices.find((o) => o.key === 'noble').poor);
  const eng = new Engine(content); const r = eng.newGame({ seed: 3, origin: 'scholar' });
  const tuition = r.summary.find((x) => x.label === 'Tuition');
  assert.equal(tuition && tuition.deltas.gold, -8, 'the scholarship halves the first tuition (B32, L24)');
  assert.ok(eng.s.deck.some((d) => d.id === 'sorting_mirror') && !eng.s.deck.some((d) => d.id === 'choose_origin'));
  // without an origin (old callers), the mirror asks as before
  const old = new Engine(content); old.newGame({ seed: 3 });
  assert.ok(old.s.deck.some((d) => d.id === 'choose_origin'));
});

// Plays the current month to its end: cards with their first enabled option, maps with the policy. Returns what was seen.
function playMonth(eng, pick) {
  const seen = [], turn = eng.s.turn;
  let r = eng.s.cur ? { kind: 'card', view: eng.view(eng.s.cur) } : quiet(() => eng.advance());
  for (let i = 0; i < 200 && eng.s.turn === turn && r.kind !== 'ending'; i++) {
    if (r.kind === 'month') break;
    if (r.kind === 'map') { seen.push({ map: r.view.slots }); quiet(() => eng.pickPlaces((pick || Policies.pickPlaces)(eng, r.view))); }
    else if (r.kind === 'card') {
      seen.push({ card: r.view.id, slot: r.view.slot });
      const v = r.view, open = v.options.filter((o) => !o.disabled);
      quiet(() => (v.pick > 1 ? eng.choose(open.filter((o) => o.key !== 'none').slice(0, v.pick).map((o) => o.key)) : eng.choose(open[0].key)));
    }
    r = quiet(() => eng.advance());
  }
  return seen;
}

test('a month is a day (M1): slot by slot, with a map before each visit', () => {
  const eng = new Engine(content);
  quiet(() => eng.newGame({ seed: 7, name: 'T', origin: 'noble' }));
  const seen = playMonth(eng);
  const maps = seen.filter((x) => x.map);
  assert.deepEqual(maps.map((x) => x.map), [['afternoon'], ['evening']], 'one map per visit, in order');
  const order = ['morning', 'noon', 'afternoon', 'evening', 'night', 'midnight'];
  const at = seen.map((x) => (x.map ? order.indexOf(x.map[0]) : order.indexOf(x.card && x.slot || 'morning')));
  assert.deepEqual(at, at.slice().sort((a, b) => a - b), 'cards and maps come in slot order');
  assert.ok(seen.findIndex((x) => x.card === 'enrolment') < seen.findIndex((x) => x.map), 'the morning plays before the first map');
  assert.equal(content.game.max_cards_per_day, undefined, 'no daily card cap (playtest 2, B36)');
  assert.equal(eng.s.hist.filter((h) => h.t === 'pick' && h.turn === 1).length, 2);
  // a closed place can't be picked
  const e2 = new Engine(content); quiet(() => e2.newGame({ seed: 7, origin: 'noble' }));
  let r = quiet(() => e2.advance()); for (let i = 0; i < 50 && r.kind !== 'map'; i++) { if (r.kind === 'card') quiet(() => e2.choose(r.view.pick > 1 ? r.view.options.filter((o) => !o.disabled && o.key !== 'none').slice(0, r.view.pick).map((o) => o.key) : r.view.options.find((o) => !o.disabled).key)); r = quiet(() => e2.advance()); }
  const closed = r.view.places.find((p) => p.state === 'closed');
  if (closed) assert.throws(() => e2.pickPlaces([closed.id]), /not open/);
});

test('max_cards_per_day, when a game sets one, still caps the day', () => {
  const capped = Object.assign({}, content, { game: Object.assign({}, content.game, { max_cards_per_day: 3 }) });
  const eng = new Engine(capped);
  quiet(() => eng.newGame({ seed: 7, name: 'T', origin: 'noble' }));
  const seen = playMonth(eng);
  assert.ok(seen.filter((x) => x.card).length <= 3, 'the day is within the cap: ' + seen.filter((x) => x.card).length);
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
  assert.ok(!eng.s.states.class_pyromancy, 'phase 3: enrolling no longer grants the v0.2 elective state');
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

test('attending a member place counts a visit; a job pays through its shift cards (M10)', () => {
  const eng = new Engine(content);
  quiet(() => { eng.newGame({ seed: 3, name: 'T' }); });
  const ctx = eng.newCtx(null, null);
  const gold = eng.s.vals.gold, pay = content.tracks.library_assistant.pay[0];
  eng.trackOp({ t: 'join', track: 'library_assistant' }, ctx);
  assert.ok(eng.hasShift('library_assistant'), 'a shift card is there to draw');
  eng.attend('library_assistant', ctx);
  const t = eng.s.tracks.library_assistant;
  assert.equal(t.visits, 1);
  assert.equal(eng.s.vals.gold, gold, 'the visit itself pays nothing');
  ctx.track = 'library_assistant';
  eng.run([{ t: 'wage', size: null }, { t: 'wage', size: 'short' }], ctx);
  assert.equal(eng.s.vals.gold, gold + pay + Math.round(pay / 2), 'wage, then a short wage');
  eng.hasShift = () => false;   // no shift card left: the visit pays the flat wage
  eng.attend('library_assistant', ctx);
  assert.equal(eng.s.vals.gold, gold + 2 * pay + Math.round(pay / 2));
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
    assert.ok(eng.s.turn >= 40 || content.endings[r.id].kind === 'early', style + ' ended at turn ' + eng.s.turn);
  }
});

test('the v0.2 calendar migration is recorded as applied', () => {
  const applied = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', '.migrations.json'), 'utf8'));
  const ids = (applied.applied || applied).map((a) => (typeof a === 'string' ? a : a.id));
  assert.ok(ids.some((id) => /^0001/.test(id)), JSON.stringify(applied));
});

test('combat stub (M39, M5): reads condition and spells, costs mana to enter, previews it', () => {
  const eng = new Engine(content); eng.newGame({ seed: 4, origin: 'noble' });
  const st = { t: 'challenge', kind: 'combat', tier: 'medium', win: [], lose: [] };
  for (const k of ['arcana', 'vigor', 'guile']) eng.s.vals[k] = 30;
  eng.s.vals.health = eng.s.vals.mood = eng.s.vals.mana = 50;
  const base = eng.challengeOdds(st).value;
  eng.s.vals.health = eng.s.vals.mood = eng.s.vals.mana = 100;
  assert.ok(eng.challengeOdds(st).value > base, 'a fresh fighter does better');
  eng.s.spells = { flame: 2, ward: 1 };
  assert.ok(eng.challengeOdds(st).value > base + 10, 'spell levels count');
  eng.s.vals.mana = 40;
  const ctx = eng.newCtx(null, null); const mana = eng.s.vals.mana;
  eng.run([st], ctx);
  assert.equal(eng.s.vals.mana, mana - eng.combatCost(), 'entering a fight spends mana');
  const pv = eng.preview('bram_duel', 'right', 'bram');
  assert.ok(pv.paths.every((p) => p.deltas.mana && p.deltas.mana[0] < 0), 'the preview shows the mana');
});

test('swing (M14): wild checks flatten the odds, steady ones sharpen them', () => {
  const eng = new Engine(content); eng.newGame({ seed: 4 });
  eng.s.vals.charm = eng.expectedSkill() + 10;
  const p = (swing) => eng.challengeOdds({ kind: 'negotiate', tier: 'medium', swing }).win;
  assert.ok(p('wild') < p(null) && p(null) < p('steady'), p('wild') + ' < ' + p(null) + ' < ' + p('steady'));
});

test('exams are cards (M4): one per enrolled course in a term\'s last month, graded on the card', () => {
  const { eng } = play(9, 'balanced', (e) => e.s.turn === 4 && e.s.deck.length > 0);
  const exams = eng.s.deck.filter((d) => d.id === 'course_exam');
  const enrolled = Object.entries(eng.s.tracks).filter(([id, t]) => t.status === 'enrolled' && content.tracks[id].kind === 'course');
  assert.equal(exams.length, enrolled.length, 'one exam card per enrolled course');
  assert.ok(exams.every((x) => x.track), 'in its course\'s context');
  // the outlook on the enrolment menu
  const o = eng.courseOutlook('evocation', 1);
  assert.ok(o && o.skills.length && o.exam === 'medium' && o.pass >= 8);
});

test('jobs and clubs: prorated dues, the term-end review, promotions and switching (M12, M33, M34, M35)', () => {
  const eng = new Engine(content);
  quiet(() => { eng.newGame({ seed: 7, name: 'T' }); });
  const ctx = eng.newCtx(null, null);
  eng.s.turn = 3;   // the term's third month of four: two months left, this one included
  eng.trackOp({ t: 'join', track: 'tavern' }, ctx);
  const t = eng.s.tracks.tavern;
  assert.equal(t.due, Math.min(content.tracks.tavern.due, 2), 'at most one visit due per month left');
  t.perf = 90; t.rankXp = 99;
  eng.trackOp({ t: 'promote', track: 'tavern' }, ctx);
  assert.equal(t.rank, 1); assert.equal(t.perf, 50, 'a new rank starts its performance afresh');
  eng.s.turn = 4; eng.s.queue = [];
  quiet(() => eng.endTerm([]));
  assert.ok(eng.s.queue.some((q) => q.id === 'job_term_review' && q.track === 'tavern'), 'keep or resign, every term end');
  eng.trackOp({ t: 'join', track: 'duelling' }, ctx);
  const fair = eng.offered('clubs').find((o) => o.key === 'verdant');
  assert.equal(fair.switching.from, 'duelling', 'switching names what you leave');
  assert.equal(eng.test(G.expr('member(club) and member(job)'), null), true, 'member(kind): any of that kind');
});

test('menus hide options gated by what you cannot see; a stated prerequisite shows locked (M24)', () => {
  const eng = new Engine(content);
  quiet(() => { eng.newGame({ seed: 8, name: 'T' }); });
  eng.s.turn = 19; eng.s.vals.gold = 0;
  const ball = eng.view({ id: 'midwinter_ball', actor: null });
  assert.ok(!ball.options.some((o) => o.key === 'lyra'), 'an unmet relationship gate is hidden');
  assert.ok(ball.options.some((o) => o.key === 'friends'));
  const apps = eng.view({ id: 'intern_application', actor: null });
  const royal = apps.options.find((o) => o.key === 'royal');
  assert.ok(royal && royal.disabled && /Astromancy II/.test(royal.locked), 'a course prerequisite shows, locked, with the reason');
  eng.trackOp({ t: 'apply', track: 'intern_royal_library' }, eng.newCtx(null, null));
  assert.equal(eng.test(G.expr('applied(internship)'), null), true);
  eng.trackOp({ t: 'leave', track: 'intern_royal_library' }, eng.newCtx(null, null));
  assert.equal(eng.s.tracks.intern_royal_library.status, 'none', 'leave withdraws an application');
});

test('schedules: a chance per entry, decided per day without the RNG; break schedules can send someone away (M42)', () => {
  const c2 = JSON.parse(JSON.stringify(content));
  c2.npcs.corvin.schedule_break = { away: true, entries: [] };
  const eng = new Engine(c2);
  quiet(() => { eng.newGame({ seed: 11, name: 'T' }); });
  eng.s.npcs.corvin = Object.assign(eng.s.npcs.corvin || {}, { met: true });
  let there = 0;
  for (let t = 1; t <= 40; t++) {
    eng.s.turn = t; if (eng.phaseOf() !== 'term') continue;
    const rng = eng.s.rng, a = eng.presentAt('gargoyle_passage', 'midnight').includes('corvin');
    assert.equal(eng.s.rng, rng, 'no RNG drawn');
    assert.equal(eng.presentAt('gargoyle_passage', 'midnight').includes('corvin'), a, 'the same all day');
    if (a) there++;
  }
  assert.ok(there > 0 && there < 30, 'some nights, not every night (' + there + ')');
  eng.s.turn = 5;
  assert.ok(eng.isAway('corvin') && !eng.presentAt('courtyard', 'noon').includes('corvin'), 'away for the break');
});

test('off campus: halved drift, a letter each night; milestones ramp; spark follows friendship (M13, M37, M38)', () => {
  const eng = new Engine(content);
  quiet(() => { eng.newGame({ seed: 12, name: 'T' }); });
  const ctx = eng.newCtx(null, null);
  eng.s.turn = 11; eng.run([{ t: 'gain', state: 'plan_home' }], ctx);
  assert.ok(eng.offCampus(), 'home is off campus');
  const ix = eng.directorIndex();
  assert.ok(ix.letter.length >= 3 && ix.ramp.length >= 10);
  eng.s.npcs.lyra = Object.assign(eng.s.npcs.lyra || {}, { met: true, rel: 40, spark: 20, touched: 0 });
  const sum = []; eng.relationshipDrift(sum);
  assert.equal(eng.s.npcs.lyra.rel, 39, 'friendship fades by 1 off campus, not 2');
  // spark follows a friendship gain, in proportion to the spark already there
  const n = eng.s.npcs.lyra; n.spark = 28; n.bond = 'none';
  const c2 = eng.newCtx(null, null);
  eng.run([{ t: 'rel', npc: 'lyra', tier: 'small', sign: 1 }], c2);
  assert.ok(n.spark > 28, 'spark carried along');
  assert.ok(eng.s.queue.some((q) => q.id === 'spark_cooldown' && q.actor === 'lyra'), 'crossing the cooldown mark asks');
  eng.run([{ t: 'cool', npc: 'lyra' }], c2);
  assert.equal(n.spark, 0, 'cool clears spark');
  n.rel = 100; const c3 = eng.newCtx(null, null);
  eng.run([{ t: 'rel', npc: 'lyra', tier: 'small', sign: 1 }], c3);
  assert.ok(eng.outcome(c3).capped['rel:lyra'] > 0, 'a gain at the cap still shows');
});

test('the midnight turn: going out opens a midnight pick; suspicion is the only way to a lockout (M41)', () => {
  const eng = new Engine(content);
  quiet(() => { eng.newGame({ seed: 5, name: 'T' }); });
  eng.s.flags.night_unlocked = true; eng.s.places.boathouse = { found: 1 }; eng.startDay();
  let r = quiet(() => eng.advance()), sawNight = false, midnight = null;
  for (let i = 0; i < 400 && eng.s.turn === 1; i++) {
    if (r.kind === 'month') break;
    if (r.kind === 'map') {
      if (r.view.slots[0] === 'midnight') { midnight = r.view; eng.pickPlaces(['boathouse']); } else eng.pickPlaces([null]);
      r = quiet(() => eng.advance()); continue;
    }
    const k = r.view.id === 'night_out' ? (sawNight = true, 'right') : r.view.options.find((o) => !o.disabled).key;
    quiet(() => eng.choose(r.view.pick > 1 ? [k] : k)); r = quiet(() => eng.advance());
  }
  assert.ok(sawNight, 'the night card comes');
  assert.ok(midnight, 'going out opens the midnight map');
  assert.ok(midnight.places.filter((p) => p.state === 'open' && p.open[0]).every((p) => (eng.directorIndex().byPlace[p.id] || []).concat(eng.directorIndex().byTrack[content.places[p.id].track] || []).some((e) => e.slot === 'midnight')), 'only places with a midnight card are open');
  assert.ok(eng.s.hist.some((h) => h.t === 'card' && /^midnight_/.test(h.id)), 'a midnight card at the place');
  // the morning after being spotted: watched first, a lockout the second time
  const ctx = eng.newCtx(null, null);
  eng.run([{ t: 'gain', state: 'spotted' }], ctx);
  eng.s.cur = { id: 'night_suspicion', actor: null }; quiet(() => eng.choose('right'));
  assert.ok(eng.s.states.watched && !eng.s.states.locked_out);
  eng.run([{ t: 'gain', state: 'spotted' }], ctx);
  eng.s.cur = { id: 'night_suspicion', actor: null }; quiet(() => eng.choose('left'));
  assert.ok(eng.s.states.locked_out && !eng.s.states.watched, 'watched twice: locked out');
  assert.equal(eng.test(content.events.night_out.when, null), false, 'no night card while locked out');
});

test('a society keeps no dues, performance or ranks, and doesn\'t take the club slot (M40)', () => {
  const eng = new Engine(content);
  quiet(() => { eng.newGame({ seed: 6, name: 'T' }); });
  const ctx = eng.newCtx(null, null);
  eng.trackOp({ t: 'join', track: 'duelling' }, ctx);
  eng.trackOp({ t: 'join', track: 'cartographers' }, ctx);
  assert.equal(eng.s.tracks.duelling.status, 'member', 'the club stays');
  const t = eng.s.tracks.cartographers, perf = t.perf;
  eng.attend('cartographers', ctx); eng.trackOp({ t: 'perform', track: 'cartographers', tier: 'large', sign: 1 }, ctx);
  assert.equal(t.perf, perf); assert.equal(t.visits, 0);
});
