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
  return quiet(() => Policies.play(new Engine(content), Policies.get(styleName), { seed, name: 'T', maxSteps: 6000, stop, setup }));
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
  assert.equal(tuition && tuition.deltas.gold, -16, 'every origin pays the full tuition (origin design 2026-10-16; was half for the scholarship, B32, L24)');
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

test('spells v2: every spell outside a pool has a live source; ids match the combat roster', async () => {
  const live = new Set();
  const walk = (effs) => { for (const f of effs || []) { if (f.t === 'learn_spell') live.add(f.spell); for (const k of ['then', 'else', 'win', 'lose', 'partial', 'effects']) if (Array.isArray(f[k])) walk(f[k]); } };
  for (const e of Object.values(content.events)) if (!(e.tags || []).includes('retired')) { walk(e.on_show); for (const o of e.options || []) walk(o.effects); }
  for (const t of Object.values(content.tracks)) for (const x of t.teaches || []) live.add(x.spell);
  const missing = Object.values(content.spells).filter((d) => !d.pool && !live.has(d.id)).map((d) => d.id);
  assert.deepEqual(missing, [], 'spells with no source');
  for (const id of live) assert.ok(content.spells[id], 'taught spell exists: ' + id);
  const roster = path.join(ROOT, 'experiments/combat-f5/setup/roster.mjs');
  if (!fs.existsSync(roster)) return;
  const { SPELLS } = await import(roster);
  // Creature-only spells (`group: creature`, for monsters in fights) are the minigame's own; content has the rest.
  assert.deepEqual(Object.keys(content.spells).sort(), Object.keys(SPELLS).filter((id) => SPELLS[id].group !== 'creature').sort());
});

test('spells v2: a course\'s spell is taught in the month the level starts (track start: card)', () => {
  let total = 0;
  for (const [style, seed] of [['balanced', 3], ['scholar', 5], ['random', 8]]) {
    const { eng } = play(seed, style, (e) => e.s.turn >= 14);
    const learned = {};   // spell@level -> the month it was first known at that level
    for (const h of eng.s.hist) if (h.t === 'card') for (const n of (h.out && h.out.notes) || []) if (n.kind === 'spell') for (let l = 1; l <= n.level; l++) if (!(n.spell + '@' + l in learned)) learned[n.spell + '@' + l] = h.turn;
    for (const h of eng.s.hist) if (h.t === 'card') for (const n of (h.out && h.out.notes) || []) if (n.kind === 'enrol') {
      const t = content.tracks[n.track]; const x = (t.teaches || []).find((y) => y.level === n.level); if (!x || h.turn > 13) continue;
      total++;
      assert.ok(learned[x.spell + '@' + n.level] <= h.turn, style + ' ' + seed + ': ' + n.track + '@' + n.level + ' teaches ' + x.spell + ' by month ' + h.turn);
      if (n.level > 1) assert.ok(!(learned[x.spell + '@' + n.level] < h.turn), 'not taught ahead of the level: ' + n.track + '@' + n.level);
    }
  }
  assert.ok(total >= 4, 'enough enrolments checked');
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
  // The first term ends in month 4: every course enrolled then gets one exam card that month, and a grade from it.
  let enrolled = null;
  const { eng } = play(9, 'balanced', (e) => {
    if (e.s.turn === 4 && enrolled === null) enrolled = Object.entries(e.s.tracks).filter(([id, t]) => t.status === 'enrolled' && content.tracks[id].kind === 'course').map(([id]) => id);
    return e.s.turn === 5;
  });
  assert.ok(enrolled && enrolled.length > 0, 'enrolled in month 4');
  assert.equal(eng.s.seen.course_exam, enrolled.length, 'one exam card per enrolled course');
  assert.ok(enrolled.every((id) => eng.s.tracks[id].grades.length === 1), 'each graded once, on its own card');
  // the outlook on the enrolment menu
  const o = eng.courseOutlook('evocation', 1);
  assert.ok(o && o.skills.length && o.exam === eng.examTier(1) && o.pass >= 5);
  assert.equal(eng.examTier(1), (content.balance.exam_tiers || ['medium'])[0], '@balance exam_tiers sets the tier by level');
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

test('off campus: spark fades at half the pace, a letter each night; milestones ramp; spark follows friendship (M13, M37, M38)', () => {
  const eng = new Engine(content);
  quiet(() => { eng.newGame({ seed: 12, name: 'T' }); });
  const ctx = eng.newCtx(null, null);
  eng.s.turn = 11; eng.run([{ t: 'gain', state: 'plan_home' }], ctx);
  assert.ok(eng.offCampus(), 'home is off campus');
  const ix = eng.directorIndex();
  assert.ok(ix.letter.length >= 3 && ix.ramp.length >= 10);
  eng.s.npcs.lyra = Object.assign(eng.s.npcs.lyra || {}, { met: true, rel: 40, spark: 20, touched: 0 });
  const sum = []; eng.relationshipDrift(sum);
  assert.equal(eng.s.npcs.lyra.rel, 40, 'friendship never fades (feedback 2026-10-15b)');
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
  // the morning after being noticed: watched first, a lockout the second time
  eng.s.cur = { id: 'night_suspicion', actor: null }; quiet(() => eng.choose('right'));
  assert.ok(eng.s.states.watched && !eng.s.states.locked_out);
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

test('queue … chance N: rolled when due, dropped on a miss, two copies give one card (I4)', () => {
  const G = require('../src/grimoire.js');
  const st = G.parseFile('@event x\ntitle: X\ntext: x\n> left: A\n  queue night_suspicion chance 33\n> right: B\n  say: b\n', 't.grim')[0];
  const q = JSON.stringify(st).match(/"chance":33/);
  assert.ok(q, 'the parser keeps the odds');
  const eng = new Engine(content);
  quiet(() => { eng.newGame({ seed: 8, name: 'T' }); });
  const ctx = eng.newCtx(null, null), stmt = { t: 'queue', event: 'night_suspicion', now: false, delay: null, with: null, chance: 50 };
  eng.run([stmt, stmt], ctx);
  assert.equal(eng.s.queue.filter((x) => x.id === 'night_suspicion').length, 2);
  eng.s.turn++; eng.rand = () => 0.1; eng.startDay();
  assert.equal(eng.s.day.pushed.filter((x) => x.id === 'night_suspicion').length, 1, 'at most one a morning');
  assert.ok(!eng.s.queue.some((x) => x.id === 'night_suspicion'), 'both copies are spent');
  const eng2 = new Engine(content);
  quiet(() => { eng2.newGame({ seed: 8, name: 'T' }); });
  eng2.run([stmt], eng2.newCtx(null, null));
  eng2.s.turn++; eng2.rand = () => 0.9; eng2.startDay();
  assert.ok(!eng2.s.day.pushed.some((x) => x.id === 'night_suspicion'), 'a miss drops it');
  assert.ok(!eng2.s.states.spotted && !content.states.spotted, 'no hidden spotted state');
});

test('fixed shifts: off shift a job visit is ordinary, the hint comes once, one visit per place a day (I1–I3)', () => {
  const eng = new Engine(content);
  quiet(() => { eng.newGame({ seed: 9, name: 'T' }); });
  const ctx = eng.newCtx(null, null);
  eng.trackOp({ t: 'join', track: 'library_assistant' }, ctx);
  const t = eng.s.tracks.library_assistant; t.due = 1; t.visits = 0;
  assert.equal(eng.attend('library_assistant', ctx), 'on');
  const perf = t.perf, gold = eng.s.vals.gold;
  assert.equal(eng.attend('library_assistant', ctx), 'off', 'after the last shift');
  assert.equal(t.visits, 1); assert.equal(t.perf, perf); assert.equal(eng.s.vals.gold, gold);
  eng.s.places.library = { found: 1 };
  assert.ok(eng.mapView().places.find((p) => p.id === 'library').track.done, 'the map says all shifts done');
  assert.ok(eng.snapshot().tracks.find((x) => x.id === 'library_assistant').done, 'so does the side panel');
  const phase = eng.phaseOf; eng.phaseOf = () => 'break'; t.visits = 0;
  assert.equal(eng.attend('library_assistant', ctx), 'off', 'no shifts on a break'); assert.equal(t.visits, 0);
  eng.phaseOf = phase; t.visits = 1;
  eng.startDay();
  let r = quiet(() => eng.advance()), maps = 0, threw = false;
  const cards = [];
  for (let i = 0; i < 200 && eng.s.turn === 1; i++) {
    if (r.kind === 'month') break;
    if (r.kind === 'map') {
      const lib = r.view.places.find((p) => p.id === 'library');
      if (maps === 1) { assert.ok(lib.visited && lib.state !== 'open', 'visited today'); try { eng.pickPlaces(['library']); } catch (e) { threw = true; } eng.pickPlaces([null]); }
      else eng.pickPlaces([maps === 0 && lib.state === 'open' ? 'library' : null]);
      maps++; r = quiet(() => eng.advance()); continue;
    }
    cards.push(r.view.id);
    const k = r.view.options.find((o) => !o.disabled).key;
    quiet(() => eng.choose(r.view.pick > 1 ? [k] : k)); r = quiet(() => eng.advance());
  }
  assert.ok(threw, 'the same place can\'t be picked twice a day');
  assert.ok(cards.includes('job_off_shift'), 'the off-shift hint');
  assert.ok(!cards.some((id) => content.events[id] && content.events[id].track === 'library_assistant'), 'no shift card off shift');
  assert.equal(eng.eligible(content.events.job_off_shift, new Set()), false, 'once a run');
});

// Drive one month with simple choices; `onMap(view, k)` returns a place id or null for each map.
function driveMonth(eng, onMap, onCard = () => {}) {
  let r = quiet(() => eng.advance()), maps = 0;
  const turn = eng.s.turn;
  for (let i = 0; i < 300 && eng.s.turn === turn && r.kind !== 'month' && r.kind !== 'ending'; i++) {
    if (r.kind === 'map') { eng.pickPlaces([onMap(r.view, maps++)]); r = quiet(() => eng.advance()); continue; }
    const open = r.view.options.filter((o) => !o.disabled), k = onCard(r.view) || open[0].key;
    quiet(() => eng.choose(r.view.pick > 1 ? [k] : k)); r = quiet(() => eng.advance());
  }
}

test('a festival place is closed until its festival (I5)', () => {
  const eng = new Engine(content);
  quiet(() => { eng.newGame({ seed: 10, name: 'T' }); });
  eng.s.turn = 2; eng.s.deck = []; eng.s.places.lakeshore = { found: 1 }; eng.startDay();
  const seen = [];
  driveMonth(eng, (view) => { seen.push(view.places.find((p) => p.id === 'lakeshore')); return null; });
  assert.ok(seen.length >= 2, 'two visits');
  assert.equal(seen[0].festLater, 'evening'); assert.notEqual(seen[0].state, 'open');
  assert.ok(seen[1].state === 'open' && !seen[1].festLater && seen[1].festival.length, 'open for the festival');
});

test('defer: a suspicion card waits until you are back on campus (I6)', () => {
  const eng = new Engine(content);
  quiet(() => { eng.newGame({ seed: 11, name: 'T' }); });
  eng.s.turn = 5; eng.s.cur = null; eng.s.states.plan_home = { left: null };
  eng.s.deck = [{ id: 'night_suspicion', actor: null, src: 'queued' }];
  const r = quiet(() => eng.advance());
  assert.ok(!(r.kind === 'card' && r.view.id === 'night_suspicion'), 'not shown while away');
  assert.ok(eng.s.queue.some((q) => q.id === 'night_suspicion' && q.due === eng.s.turn + 1), 'back in the queue for next month');
  delete eng.s.states.plan_home; eng.s.cur = null;
  eng.s.deck = [{ id: 'night_suspicion', actor: null, src: 'queued' }];
  assert.equal(quiet(() => eng.advance()).view.id, 'night_suspicion', 'shown on campus');
});

// The holiday versions of term jobs (X15) need a job's top rank and a working break, which simulated players
// rarely combine; this deals each one directly so they can't silently stop working.
test('holiday gigs at a job\'s top rank deal their own cards (X15)', () => {
  // The gig's cards share the morning with the plan's other cards, so one seed may deal none in the two break months:
  // a few seeds each, and at least one must deal one.
  for (const [job, gig] of [['library_assistant', 'library'], ['tavern', 'newt'], ['apothecary_clerk', 'pell'], ['broom_courier', 'post']]) {
    let dealt = false;
    for (let seed = 13; seed < 18 && !dealt; seed++) dealt = dealGig(job, gig, seed);
    assert.ok(dealt, job + ': a ' + gig + ' gig card');
  }
});
function dealGig(job, gig, seed) {
  {
    const eng = new Engine(content);
    quiet(() => { eng.newGame({ seed, name: 'T' }); });
    const ctx = eng.newCtx(null, null);
    eng.trackOp({ t: 'join', track: job }, ctx);
    eng.trackState(job).rank = content.tracks[job].ranks.length - 1;
    eng.s.turn = 5; eng.s.deck = []; eng.s.queue = []; eng.s.cur = null;
    eng.startDay();
    const cards = [];
    const any = (view) => { const p = view.places.find((x) => x.state === 'open' && x.open[0]); return p ? p.id : null; };
    const pick = (v) => { cards.push(v.id); return { break_plan: 'work', holiday_gigs: gig }[v.id]; };
    driveMonth(eng, any, pick);
    assert.ok(eng.s.states['gig_' + gig], job + ': its holiday gig was offered and taken');
    // The plan's cards deal in the morning, which the first month spends choosing the plan.
    for (let m = 0; m < 3 && eng.phaseOf() === 'break' && !cards.some((id) => id.startsWith('gig_' + gig + '_')); m++) driveMonth(eng, any, pick);
    return cards.some((id) => id.startsWith('gig_' + gig + '_'));
  }
}

test('break work: term jobs pay nothing on a break, the holiday gigs still do (I9)', () => {
  // One break month's draws are random, so a gig card is asked of the seeds together; the rest holds for each.
  let gigs = 0;
  for (let seed = 12; seed < 18; seed++) {
    const eng = new Engine(content);
    quiet(() => { eng.newGame({ seed, name: 'T' }); });
    const ctx = eng.newCtx(null, null);
    eng.trackOp({ t: 'join', track: 'library_assistant' }, ctx);
    eng.s.places.library = { found: 1 };
    eng.s.turn = 5; eng.s.deck = []; eng.s.queue = []; eng.s.cur = null;
    assert.equal(eng.phaseOf(), 'break');
    eng.startDay();
    const cards = [], gold = [];
    driveMonth(eng, (view) => (view.places.find((p) => p.id === 'library' && p.state === 'open' && p.open[0]) ? 'library' : null),
      (v) => { cards.push(v.id); gold.push(eng.s.vals.gold); return { break_plan: 'work', holiday_gigs: 'grounds' }[v.id]; });
    assert.ok(eng.s.states.plan_work && eng.s.states.gig_grounds, 'working on campus, on the grounds');
    if (cards.some((id) => /^gig_grounds_/.test(id))) gigs++;
    assert.ok(!cards.some((id) => content.events[id] && content.events[id].track === 'library_assistant'), 'no shift card on a break');
    assert.ok(!eng.s.hist.some((h) => h.t === 'pick' && h.deltas && h.deltas.gold > 0), 'no job pay for the visit');
  }
  assert.ok(gigs > 0, 'a gig card');
  assert.ok(Object.values(content.events).filter((e) => (e.track || '').startsWith('intern_')).every((e) => e.options.every((o) => JSON.stringify(o.effects).includes('"wage"'))), 'internships still pay through their host cards');
});

test('enrolment: no "take no courses"; a fallback only when nothing is offered (I10)', () => {
  const eng = new Engine(content);
  quiet(() => { eng.newGame({ seed: 13, name: 'T' }); });
  eng.s.cur = { id: 'enrolment', actor: null };
  const keys = eng.view(eng.s.cur).options.map((o) => o.key);
  assert.ok(keys.length >= 2 && !keys.includes('none'), 'only courses');
  assert.ok(eng.test(G.parseFile('@event x\ntitle: X\ntext: x\nwhen: offered(courses) > 0\n> left: A\n  say: a\n> right: B\n  say: b\n', 't.grim')[0].when, null));
  eng.offered = () => [];
  assert.deepEqual(eng.view(eng.s.cur).options.map((o) => o.key), ['none'], 'the fallback, so the menu never soft-locks');
});

test('a simulated game replays exactly through the engine, as the UI would drive it (A1)', () => {
  const strip = (s) => JSON.stringify({ vals: s.vals, flags: s.flags, states: s.states, tracks: s.tracks, npcs: s.npcs, turn: s.turn, ended: s.ended,
    hist: s.hist.map((h) => Object.assign({}, h, { at: 0, chosenAt: 0 })) });
  for (const [style, seed0] of [['balanced', 21], ['random', 22], ['social', 23]]) {
    // A random player may leave early (a valid ending); the first of a few seeds that plays a whole game is replayed.
    let a = null;
    for (let seed = seed0; seed < seed0 + 50 * 5 && !(a && a.record.steps.length > 400); seed += 50) a = quiet(() => Policies.play(new Engine(content), Policies.get(style), { seed, name: 'R', record: true }));
    assert.ok(a.record.steps.length > 400, style + ' played a whole game');
    const b = quiet(() => Policies.replay(new Engine(content), a.record));
    assert.equal(strip(b.eng.s), strip(a.eng.s), style + ': same history and final state');
  }
});

test('previewing an option never changes the game (A1: a previewed `visit midnight` opened the slot)', () => {
  const eng = new Engine(content);
  quiet(() => { eng.newGame({ seed: 24, name: 'T' }); });
  eng.s.flags.night_unlocked = true; eng.startDay();
  let r = quiet(() => eng.advance()), checked = 0;
  for (let i = 0; i < 300 && eng.s.turn === 1 && r.kind !== 'month'; i++) {
    if (r.kind === 'map') { eng.pickPlaces([null]); r = quiet(() => eng.advance()); continue; }
    const before = JSON.stringify(eng.s);
    for (const o of r.view.options) quiet(() => { try { eng.preview(r.view.id, o.key, r.view.actor ? r.view.actor.id : null); } catch (e) { /* menus with generated options */ } });
    assert.equal(JSON.stringify(eng.s), before, 'previewing ' + r.view.id + ' changed the game');
    checked++;
    const k = r.view.id === 'night_out' ? 'left' : r.view.options.find((o) => !o.disabled).key;
    quiet(() => eng.choose(r.view.pick > 1 ? [k] : k)); r = quiet(() => eng.advance());
  }
  assert.ok(checked > 3);
  assert.ok(eng.s.hist.some((h) => h.id === 'night_out'), 'the night card came');
  assert.ok(!eng.s.hist.some((h) => h.t === 'pick' && h.slot === 'midnight'), 'Sleep opens no midnight pick');
});

// Review fixes: an option that charges crowns up front locks when you can't pay (`@game afford: gold`), unless every
// option on the card would lock (never soft-lock: an incident then takes what you have).
test('options you can\'t afford are locked, never every option', () => {
  const eng = new Engine(content);
  quiet(() => { eng.newGame({ seed: 14, name: 'T' }); });
  eng.s.npcs.lyra = Object.assign(eng.s.npcs.lyra || {}, { met: true, rel: 30 });
  eng.s.vals.gold = 0;
  let v = eng.view({ id: 'lyra_family_gala', actor: 'lyra' });
  const right = v.options.find((o) => o.key === 'right');
  assert.ok(right.disabled && right.poor > 0, 'the gala clothes are locked at an empty purse');
  assert.ok(!v.options.find((o) => o.key === 'left').disabled, 'declining stays open');
  eng.s.cur = { id: 'lyra_family_gala', actor: 'lyra' };
  assert.throws(() => eng.choose('right'), /costs more than you have/);
  eng.s.vals.gold = 100;
  v = eng.view({ id: 'lyra_family_gala', actor: 'lyra' });
  assert.ok(!v.options.find((o) => o.key === 'right').disabled, 'open once you can pay');
  // An incident whose every option charges crowns keeps them all open at an empty purse.
  const both = Object.values(content.events).find((e) => e.class === 'incident' && !e.actor && !e.cast && e.options.length >= 2 && e.options.every((o) => !o.when && eng.priceOf(o) > 0));
  if (both) {
    eng.s.vals.gold = 0;
    assert.ok(eng.view({ id: both.id }).options.every((o) => !o.disabled), both.id + ': nothing locked when everything would be');
  }
});

// Review fixes, batch 24–40: around(n) is false while n is away for the break or gone; apart(n) counts months since
// the last card with n, per person.
test('around() and apart() read presence and per-person contact', () => {
  const eng = new Engine(content);
  quiet(() => { eng.newGame({ seed: 15, name: 'T' }); });
  const ex = (src, actor) => eng.test(G.expr(src), actor || null);
  eng.s.npcs.tobias.met = true;
  assert.ok(ex('around(tobias)'), 'Tobias is around in term');
  eng.s.flags.tobias_went_home = true; eng.s.last.tobias_bad_harvest = eng.s.turn; eng.s.seen.tobias_bad_harvest = 1;
  assert.ok(!ex('around(tobias)'), 'gone home after a failed harvest appeal');
  assert.equal(eng.c.npcs.tobias.gone_when ? true : false, true);
  eng.s.npcs.lyra.touched = 0;
  assert.equal(ex('apart(lyra) == 999'), true, 'never in contact');
  eng.s.npcs.lyra.touched = eng.s.turn;
  assert.equal(ex('apart(lyra) == 0'), true, 'in contact this month');
});

// Review fixes, batch 41–159: bonds_around(status) counts the bond only among those who are around.
test('bonds_around() counts only partners who are around', () => {
  const eng = new Engine(content);
  quiet(() => { eng.newGame({ seed: 15, name: 'T' }); });
  const ex = (src) => eng.test(G.expr(src), null);
  eng.s.npcs.tobias.met = true; eng.s.npcs.tobias.bond = 'partner';
  assert.equal(ex('bonds(partner) == 1 and bonds_around(partner) == 1'), true, 'a partner in term is around');
  eng.s.flags.tobias_went_home = true; eng.s.last.tobias_bad_harvest = eng.s.turn; eng.s.seen.tobias_bad_harvest = 1;
  assert.equal(ex('bonds(partner) == 1 and bonds_around(partner) == 0'), true, 'a partner who has gone home is not');
});
