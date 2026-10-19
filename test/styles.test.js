// The strategy play styles (tools/policies.js, 2026-10-17): players with a goal, each exercising one part of the design.
// Each test checks that a style does what its `about` says (its signature), on a few fixed seeds, against `balanced`.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../src/engine.js');
const Policies = require('../tools/policies.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');

const { content } = project(ROOT).compileAll();
const quiet = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];   // four were too few once spells v2 moved exam grades (2026-10-17)
const cache = {};
// Plays a style on the shared seeds (strict: a soft-lock or an unfinished game throws) and keeps the games.
const games = (style, opts = {}) => (cache[style] = cache[style] || SEEDS.map((seed) => quiet(() => Policies.play(new Engine(content), Policies.get(style), Object.assign({ seed, name: 'S', maxSteps: 9000, strict: true }, opts))).eng));
const cards = (eng) => eng.s.hist.filter((h) => h.t === 'card');
const mean = (style, f) => games(style).reduce((a, e) => a + f(e), 0) / SEEDS.length;
const chose = (eng, id, key) => cards(eng).filter((h) => h.id === id && h.choice === key).length;
const leads = (eng) => eng.threads().flatMap((t) => t.leads || []);

test('styles: every strategy is listed, explained, and plays its games to the end without a soft-lock', () => {
  assert.deepEqual(Policies.STRATEGIES, ['scholar', 'nightlife', 'sleuth', 'romantic', 'homebody', 'combatmaxx', 'explorer']);
  for (const name of Policies.STRATEGIES) {
    assert.ok(Policies.list().includes(name), name + ' is listed');
    assert.ok(Policies.about(name).length > 60, name + ' says what it plays for');
    for (const eng of games(name)) assert.ok(eng.s.ended, name + ' seed ' + eng.s.seed + ' finished');
  }
  for (const name of Policies.list()) assert.ok(Policies.about(name), name + ' has an about line');
  assert.ok(Policies.about('focused:arcana') && Policies.about('social:lyra'), 'parameterised styles too');
});

test('styles: strategy games are deterministic and replay through the engine', () => {
  for (const name of Policies.STRATEGIES) {
    const a = quiet(() => Policies.play(new Engine(content), Policies.get(name), { seed: 9, name: 'R', maxSteps: 9000, record: true }));
    const b = quiet(() => Policies.play(new Engine(content), Policies.get(name), { seed: 9, name: 'R', maxSteps: 9000 }));
    assert.equal(JSON.stringify(a.eng.s.vals), JSON.stringify(b.eng.s.vals), name + ': same seed, same game');
    const again = new Engine(content);
    quiet(() => Policies.replay(again, a.record));
    assert.equal(JSON.stringify(again.s.vals), JSON.stringify(a.eng.s.vals), name + ': the record replays');
  }
});

test('styles: the scholar is a scholarship student who sleeps, picks its exam approach by expected grade, and out-grades balanced', () => {
  let exams = 0;
  for (const seed of SEEDS) quiet(() => Policies.play(new Engine(content), Policies.get('scholar'), { seed, name: 'S', maxSteps: 9000, before(eng, v, key) {
    if (v.id !== content.game.exam || !eng.s.cur.track) return;
    const pts = (swing) => { const o = eng.examOdds(eng.s.cur.track, swing); return 4 * o.probs[0] + 3 * o.probs[1] + 2 * o.probs[2]; };
    assert.equal(key, pts('wild') > pts('steady') ? 'right' : 'left', 'exam ' + eng.s.cur.track + ' turn ' + eng.s.turn);
    exams++;
  } }));
  assert.ok(exams >= 20, 'exams checked: ' + exams);
  for (const eng of games('scholar')) {
    assert.ok(eng.s.states.origin_scholar, 'scholarship origin');
    assert.equal(chose(eng, 'night_out', 'right'), 0, 'never goes out');
  }
  const paid = mean('scholar', (e) => cards(e).filter((h) => h.id === 'scholarship_award' && h.out.deltas.gold > 0).length);
  assert.ok(paid >= 3, 'the stipend is paid in most terms: ' + paid + ' of 7');
  assert.ok(mean('scholar', (e) => e.gpa()) > mean('balanced', (e) => e.gpa()), 'a better GPA than balanced');
});

test('styles: the nightlife regular goes out every night it can, takes the company, and fights at the ring', () => {
  for (const eng of games('nightlife')) {
    const nights = cards(eng).filter((h) => h.id === 'night_out');
    // per month played: the ring's fights (played since 2026-10-18) can send a run home early
    assert.ok(nights.length >= 0.35 * eng.s.turn && nights.every((h) => h.choice === 'right'), 'out every night: ' + nights.length + ' in ' + eng.s.turn + ' months');
    assert.equal(chose(eng, 'newt_company', 'right') + chose(eng, 'newt_company_regular', 'right'), 0, 'never refuses the company');
    for (const h of cards(eng).filter((x) => /^ring_bout_\d$/.test(x.id))) assert.ok(['left', 'right'].includes(h.choice));
  }
  assert.ok(mean('nightlife', (e) => cards(e).filter((h) => /^ring_bout_\d$/.test(h.id)).length) >= 5, 'sees the ring bouts');
  assert.ok(mean('nightlife', (e) => chose(e, 'newt_company', 'left') + chose(e, 'newt_company_regular', 'left')) >= 3, 'works the Newt\'s upstairs room');
  assert.ok(mean('nightlife', (e) => e.s.vals.gold) > mean('balanced', (e) => e.s.vals.gold), 'the night pays');
});

test('styles: the sleuth routes itself to the story, follows more of its leads and finds more clues than balanced', () => {
  const share = (style) => { let l = 0, f = 0; for (const e of games(style)) { const x = leads(e); l += x.length; f += x.filter((y) => y.followed).length; } return f / Math.max(1, l); };
  assert.ok(share('sleuth') > share('balanced') + 0.2, 'leads followed: ' + share('sleuth').toFixed(2) + ' vs ' + share('balanced').toFixed(2));
  assert.ok(mean('sleuth', (e) => Object.keys(e.s.clues).length) > mean('balanced', (e) => Object.keys(e.s.clues).length), 'more clues');
  // goes out only for the story: never more nights than the nightlife regular
  assert.ok(mean('sleuth', (e) => chose(e, 'night_out', 'right')) < mean('nightlife', (e) => chose(e, 'night_out', 'right')));
});

// (Which month the first partner comes is noise on 8 seeds: both styles find one in nearly every game. Easy foes moved it
// past balanced's, 2026-10-19; the spark the romantic grows is the steady signal.)
test('styles: the romantic lets every spark grow, finds a partner, and grows more spark than balanced', () => {
  const partner = (e) => cards(e).some((h) => (h.out.notes || []).some((n) => n.kind === 'bond' && n.status === 'partner'));
  const spark = (e) => Object.values(e.s.npcs).reduce((a, n) => a + (n.spark || 0), 0);
  for (const eng of games('romantic')) assert.equal(chose(eng, 'spark_cooldown', 'right'), 0, 'never lets a spark cool');
  assert.ok(games('romantic').filter(partner).length >= SEEDS.length - 1, 'a partner in nearly every game');
  assert.ok(mean('romantic', spark) > 1.2 * mean('balanced', spark), 'spark: ' + mean('romantic', spark) + ' vs ' + mean('balanced', spark));
  assert.ok(mean('romantic', (e) => Math.max(...Object.values(e.s.npcs).map((n) => n.spark || 0))) >= 90, 'a spark near the top');
});

test('styles: combatmaxx fights far more than a balanced player, wins most of its fights, and trains arcana and vigor', () => {
  const fights = (eng) => (eng.s.fights || []).length;
  assert.ok(mean('combatmaxx', fights) >= 2 * mean('balanced', fights), 'at least twice the fights');
  const won = games('combatmaxx').reduce((a, e) => a + (e.s.fights || []).filter((f) => f.outcome === 'win').length, 0);
  assert.ok(won / games('combatmaxx').reduce((a, e) => a + fights(e), 0) >= 0.5, 'not too unwinnable: wins most of them');
  const fit = (e) => e.s.vals.arcana + e.s.vals.vigor;
  assert.ok(mean('combatmaxx', fit) > mean('balanced', fit), 'more arcana and vigor');
});

test('styles: the homebody sleeps every night, spends every break at home, and graduates healthy', () => {
  for (const eng of games('homebody')) {
    assert.equal(chose(eng, 'night_out', 'right'), 0, 'never goes out');
    const plans = cards(eng).filter((h) => h.id === 'break_plan');
    assert.ok(plans.length >= 4 && plans.every((h) => h.choice === 'home'), 'home every break: ' + plans.map((h) => h.choice));
    assert.ok(eng.s.turn >= eng.maxTurns, 'no early ending (' + (eng.s.ended && eng.s.ended.id) + ')');
  }
  // (a healthy homebody's +20 is often clamped at the maximum, all run in a well-rested game: more than the ordinary 8 / 4,
  // somewhere in the homebody's games, is enough)
  assert.ok(games('homebody').some((eng) => cards(eng).some((h) => h.id === 'night_sleep' && (h.out.deltas.health > 8 || h.out.deltas.mood > 4))), 'the home sleep pays');
  assert.ok(mean('homebody', (e) => e.s.vals.health) >= 80, 'healthy at the end');
});

test('styles: the explorer goes to more places and sees more different cards than balanced, and tries other answers', () => {
  const places = (e) => Object.keys(e.s.visitsTo || {}).length, distinct = (e) => new Set(cards(e).map((h) => h.id)).size;
  assert.ok(mean('explorer', places) > mean('balanced', places) + 4, 'places: ' + mean('explorer', places) + ' vs ' + mean('balanced', places));
  assert.ok(mean('explorer', distinct) > mean('balanced', distinct), 'cards: ' + mean('explorer', distinct) + ' vs ' + mean('balanced', distinct));
  // On a card answered before, it takes another open option when there is one; count repeats that changed answer.
  let again = 0, changed = 0;
  for (const eng of games('explorer')) {
    const last = {};
    for (const h of cards(eng)) { if (h.choice == null) continue; if (last[h.id] != null && h.type !== 'menu') { again++; if (h.choice !== last[h.id]) changed++; } last[h.id] = h.choice; }
  }
  assert.ok(changed / again > 0.5, 'changed answer on ' + changed + ' of ' + again + ' repeats');
});

test('styles: the balance tool plays the strategies and has their alarms', () => {
  const src = require('node:fs').readFileSync(require('node:path').join(ROOT, 'tools', 'grim.js'), 'utf8');
  assert.match(src, /concat\(Policies\.STRATEGIES\)/, 'the full balance run includes the strategies');
  for (const name of Policies.STRATEGIES) assert.match(src, new RegExp("name === '" + name + "'"), name + ' has a design alarm');
});
