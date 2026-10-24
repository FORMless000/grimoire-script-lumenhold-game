'use strict';
// The first world-expansion plan, format foundations: plain charm kinds (E9), the negotiation stub and its routing (E8),
// flags before the game (E7), plan day shapes (E2), on_shift (E6), specializations (E1), deprecated places and states
// (E11) and the cast_as fix.
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/grimoire.js');
const Engine = require('../src/engine.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');

const { content } = project(ROOT).compileAll();
const fresh = (c = content, opts = {}) => { const e = new Engine(c); e.newGame(Object.assign({ seed: 7, name: 'T' }, opts)); return e; };
const parseEvents = (src) => G.parseFile(src, 't.grim');

test('appeal, perform and soothe are plain charm checks', () => {
  const e = fresh();
  for (const k of ['appeal', 'perform', 'soothe']) {
    assert.deepEqual(G.CHALLENGE_KINDS[k], ['charm']);
    assert.equal(e.checkValue({ kind: k }).value, e.checkValue({ kind: 'deceive', using: 'charm' }).value);
  }
  assert.equal(G.MINIGAME_KINDS.negotiate, 'parley');
  assert.equal(G.MINIGAME_KINDS.combat, 'fight');
});

test('the negotiation stub mixes charm, lore and guile; using doubles one; mood and renown count from their start', () => {
  const e = fresh(); e.s.spells = {};
  Object.assign(e.s.vals, { charm: 30, lore: 10, guile: 20 });
  const start = (k) => content.resources[k].start;
  e.s.vals.mood = start('mood'); e.s.vals.renown = start('renown');
  assert.equal(Math.round(e.parleyValue() * 100) / 100, 20);
  assert.equal(Math.round(e.parleyValue('charm') * 100) / 100, Math.round(100 * (60 + 10 + 20) / 4) / 100);
  e.s.vals.renown = start('renown') + 20;   // +20 % of max at weight 0.15
  assert.equal(Math.round((e.parleyValue() - 20) * 100) / 100, 3);
  assert.deepEqual(e.checkValue({ kind: 'negotiate' }).skills, ['charm', 'lore', 'guile']);
});

test('a negotiation is played when a resolver is there, else the stub rolls', () => {
  const [ev] = parseEvents('@event t_parley\nclass: story\ntext: x\n> right: Talk\n  challenge negotiate journeyman:\n    win:\n      flag t_won\n    lose:\n      flag t_lost\n> left: Leave\n  mood +tiny\n');
  const c = Object.assign({}, content, { events: Object.assign({}, content.events, { t_parley: ev }) });
  const e = fresh(c);
  let req = null; e.parleys = (r) => { req = r; return { outcome: 'win', deltas: { mood: -3 } }; };
  e.s.deck = []; e.s.cur = null; e.s.deck.unshift({ id: 't_parley', src: 'queued', force: true });
  const v = e.advance(); assert.equal(v.kind, 'card'); assert.equal(v.view.id, 't_parley');
  const r = v.view.options.find((o) => o.key === 'right');
  assert.equal(r.check.parley, true);
  e.choose('right');
  assert.equal(req.id, 't_parley/right#0'); assert.equal(req.kind, 'negotiate');
  assert.ok(e.s.flags.t_won);
  // No resolver: the stub rolls, and its check says so.
  const e2 = fresh(c); e2.s.deck = [{ id: 't_parley', src: 'queued', force: true }]; e2.s.cur = null; e2.advance();
  const out = e2.choose('right');
  assert.ok(e2.s.flags.t_won || e2.s.flags.t_lost);
  assert.ok((out.checks || []).some((x) => x.parley && !x.played));
});

test('flags chosen before the game are set before it starts', () => {
  assert.equal(fresh(content, { flags: ['skip_intros'] }).s.flags.skip_intros, true);
  assert.equal(!!fresh().s.flags.skip_intros, false);
});

test('cast_as reads its role by name', () => {
  const e = fresh(); e._cast = { friend: 'lyra' };
  assert.equal(e.test(G.expr('cast_as(friend, lyra)', 't', 1), null), true);
  assert.equal(e.test(G.expr('cast_as(friend, tobias)', 't', 1), null), false);
});

test('a plan\'s day: shapes the break: four visits at the castle, three around a gig, two on an internship', () => {
  const visits = (plan) => {
    const e = fresh(); e.s.states = {}; if (plan) e.s.states[plan] = { left: 2, since: 0 };
    e.phaseOf = () => 'break';
    return e.visitSlots().length;
  };
  assert.equal(visits('plan_castle'), 4);
  assert.equal(visits('plan_home'), 4);
  assert.equal(visits('plan_work'), 3);
  assert.equal(visits('plan_internship'), 2);
  assert.equal(visits(null), 2);
});

test('on_shift() is what the director says about the visit', () => {
  const e = fresh(), x = G.expr('on_shift()', 't', 1);
  assert.equal(e.test(x, null), false);
  e._shift = true; assert.equal(e.test(x, null), true);
});

test('a specialization plays in place of its generic card for its character, and shares its bookkeeping', () => {
  const [gen, spec] = parseEvents([
    '@event t_gen\nclass: routine\ntrigger: social\nper: friend\ncast:\n  friend: any where met(friend)\ntext: generic\n> left: A\n  mood +tiny\n> right: B\n  mood -tiny\n',
    '@event t_spec\nclass: routine\ntrigger: social\nactor: lyra\nspecializes: t_gen\ntext: Lyra\'s own\n> left: A\n  mood +tiny\n> right: B\n  mood -tiny\n'].join('\n'));
  const c = Object.assign({}, content, { events: Object.assign({}, content.events, { t_gen: gen, t_spec: spec }) });
  const e = fresh(c);
  const ix = e.directorIndex();
  assert.equal(ix.special.t_gen.lyra, spec);
  assert.ok(!ix.social.includes(spec), 'a specialization is never drawn by itself');
  const used = new Set();
  const it = e.specialize({ id: 't_gen', actor: null, cast: { friend: 'lyra' } }, used);
  assert.equal(it.id, 't_spec'); assert.equal(it.actor, 'lyra'); assert.ok(used.has('t_spec'));
  assert.equal(e.specialize({ id: 't_gen', actor: null, cast: { friend: 'tobias' } }, new Set()).id, 't_gen');
  // Shown, it counts as the generic card for Lyra too.
  e.s.npcs.lyra.met = true; e.s.deck = [it]; e.s.cur = null;
  assert.equal(e.advance().view.id, 't_spec');
  assert.equal(e.s.seen.t_gen, 1); assert.equal(e.s.lastBy['t_gen@lyra'], e.s.turn);
});

test('a deprecated place is hidden, and an old save\'s discoveries, visits and picks move to its survivor', () => {
  const host = Object.values(content.places).find((p) => p.map && !p.discover && !p.deprecated && !p.track);
  const other = Object.values(content.places).find((p) => p.map && !p.discover && !p.deprecated && p.id !== host.id && p.map.map === host.map.map);
  const old = Object.assign({}, other, { id: 't_old', deprecated: host.id, discover: null, always: '' });
  const c = Object.assign({}, content, { places: Object.assign({}, content.places, { t_old: old }) });
  const e = fresh(c);
  assert.ok(!e.s.places.t_old, 'never discovered in a new game');
  assert.ok(!e.mapView(host.map.map).places.some((p) => p.id === 't_old'));
  const save = JSON.parse(e.save());
  save.places.t_old = { found: 3 }; save.visitsTo = { t_old: 4, [host.id]: 1 };
  if (save.day) { save.day.picks = ['t_old']; save.day.nextPicks = []; }
  const e2 = new Engine(c).load(save);
  assert.ok(!e2.s.places.t_old && e2.s.places[host.id]);
  assert.equal(e2.s.visitsTo[host.id], 5);
  assert.equal(e2.value(G.expr('visits_to(t_old)', 't', 1), null), 5);
  assert.equal(e2.test(G.expr('discovered(t_old)', 't', 1), null), true);
  if (e2.s.day) assert.deepEqual(e2.s.day.picks, [host.id]);
  assert.equal(e2.placeAlias('t_old'), host.id);
});

test('a deprecated state stays in the save but never ticks or shows', () => {
  const st = Object.values(content.states).find((d) => d.tick && d.tick.length && d.kind !== 'plan' && !d.duration);
  const c = Object.assign({}, content, { states: Object.assign({}, content.states, { [st.id]: Object.assign({}, st, { deprecated: 'true' }) }) });
  const e = fresh(c); e.s.states[st.id] = { left: null, since: 0 };
  const before = JSON.stringify(e.s.vals), summary = [];
  e.tickStates(summary);
  assert.equal(JSON.stringify(e.s.vals), before);
  assert.ok(e.s.states[st.id]);
  assert.equal(e.test(G.expr('has(' + st.id + ')', 't', 1), null), true);
});

// ---------------- E4: the kit ----------------
test('items: start kit worn, give and take, has_item and worn, legacy and bound grants', () => {
  const e = fresh();
  assert.ok(e.hasItem('borrowed_wand') && e.hasItem('school_robes'));
  assert.deepEqual(e.s.worn, { wand: 'borrowed_wand', robe: 'school_robes' });
  const ctx = e.newCtx(null, null, null);
  e.run(G.parseFile('@event t\ntext: x\n> ok: ok\n  give duelling_coat\n  give hazel_wand\n', 't.grim')[0].options[0].effects, ctx);
  assert.ok(e.hasItem('duelling_coat'));
  assert.equal(e.s.worn.robe, 'school_robes', 'a new item is worn only in an empty slot');
  e.equip('robe', 'duelling_coat');
  assert.equal(e.test(G.expr('worn(duelling_coat) and has_item(hazel_wand)', 't', 1), null), true);
  const m = e.fightPlayer().mods; assert.equal(m.hp, 3); assert.equal(m.cost.brace, -1);
  assert.throws(() => e.equip('wand', 'duelling_coat'));
  e.takeItem('duelling_coat', ctx);
  assert.equal(e.s.worn.robe, 'school_robes', 'taking a worn item goes back to the start item');
  // legacy: once; bound: follows its condition
  e.s.flags.edmunds_wand = true; e.s.flags.star_coin = true; e.grantLegacyItems(null);
  assert.ok(e.hasItem('edmunds_silver_wand') && e.hasItem('black_star_coin'));
  e.takeItem('edmunds_silver_wand', null); e.grantLegacyItems(null);
  assert.ok(!e.hasItem('edmunds_silver_wand'), 'a legacy grant comes once');
  delete e.s.flags.star_coin; e.grantLegacyItems(null);
  assert.ok(!e.hasItem('black_star_coin'), 'a bound item follows its condition');
  e.s.fightInProgress = { at: 1 };
  assert.throws(() => e.equip('wand', 'hazel_wand'), /locked/);
});

test('items: an old save gets the start kit and its legacy items; the frost-ward state ticks no more, the item does', () => {
  const e = fresh(); e.s.states.frost_ward = { left: null, since: 0 };
  const save = JSON.parse(e.save()); delete save.items; delete save.worn; delete save.itemsHad;
  const e2 = new Engine(content).load(save);
  assert.ok(e2.hasItem('borrowed_wand') && e2.hasItem('ilse_frost_ward'));
  const before = e2.s.vals.arcana, summary = [];
  e2.s.turn++; e2.tickStates(summary); e2.tickItems(summary);
  assert.ok(e2.s.vals.arcana > before);
  assert.equal(summary.filter((x) => /frost/.test(x.src)).length, 1);
});

test('items: an up[item:x] option shows only while you own it', () => {
  const [ev] = parseEvents('@event t_item\nclass: routine\ntext: x\n> left: A\n  mood +tiny\n> right: B\n  mood -tiny\n> up[item:lodestone_pendant]: Follow the lodestone\n  mood +tiny\n');
  assert.equal(ev.options[2].item, 'lodestone_pendant'); assert.equal(ev.options[2].spell, null);
  const c = Object.assign({}, content, { events: Object.assign({}, content.events, { t_item: ev }) });
  const e = fresh(c); e.s.deck = [{ id: 't_item', src: 'queued', force: true }]; e.s.cur = null;
  assert.ok(!e.advance().view.options.some((o) => o.key === 'up'));
  e.giveItem('lodestone_pendant', null);
  assert.ok(e.view(e.s.cur).options.some((o) => o.key === 'up'));
});

test('a save from before the expansion (no kit) loads, remaps the merged places and plays a month', () => {
  // test/fixtures/save-before-expansion1.json: a game at month 14 saved by the engine before world expansion 1 (social
  // style, seed 4242); it had visited the infirmary and the orchard and discovered the refectory, the bakery and the
  // flight field.
  const Pol = require('../tools/policies.js');
  const json = require('fs').readFileSync(require('path').join(__dirname, 'fixtures', 'save-before-expansion1.json'), 'utf8');
  const before = JSON.parse(json);
  assert.ok(before.visitsTo.infirmary && before.places.refectory && !before.items, 'the fixture is pre-expansion');
  const eng = new Engine(content).load(json);
  // The orchard and the bakery are still merged; the refectory, infirmary and flight field are their own places again
  // (migration 0043), so they keep their discoveries and visits.
  for (const old of ['orchard', 'bakery']) assert.ok(!eng.s.places[old] && !(eng.s.visitsTo || {})[old], old + ' remapped');
  for (const back of ['refectory', 'infirmary', 'flight_field']) assert.ok(eng.s.places[back], back + ' kept');
  assert.equal(eng.s.visitsTo.infirmary, before.visitsTo.infirmary);
  assert.equal(eng.s.visitsTo.maud_cottage, (before.visitsTo.maud_cottage || 0) + before.visitsTo.orchard);
  assert.ok(eng.s.places.great_hall && eng.s.places.village && eng.s.places.stables);
  assert.equal(eng.s.worn.wand, 'borrowed_wand'); assert.equal(eng.s.worn.robe, 'school_robes');
  assert.ok(!eng.mapView().places.some((p) => content.places[p.id].deprecated), 'no merged place on the map');
  const style = Pol.get('social'), turn = eng.s.turn;
  eng.fights = require('../tools/combat-sim.js').resolver({ style: 'social', content });
  let r = eng.advance(), steps = 0;
  const quiet = console.warn; console.warn = () => {};
  try {
    while (eng.s.turn <= turn && r.kind !== 'ending' && steps++ < 400) {
      if (r.kind === 'month') { r = eng.advance(); continue; }
      if (r.kind === 'map') { eng.pickPlaces(Pol.pickPlaces(eng, r.view)); r = eng.advance(); continue; }
      eng.choose(Pol.choiceFor(eng, style, r.view)); r = eng.advance();
    }
  } finally { console.warn = quiet; }
  assert.ok(eng.s.turn > turn, 'a month played');
  assert.ok(!Object.keys(eng.s.visitsTo).some((id) => content.places[id].deprecated), 'new visits go to the survivors');
});

test('a save made while three places were merged gains them back on load', () => {
  const e = fresh(content), s = JSON.parse(e.save());
  for (const id of ['refectory', 'infirmary', 'flight_field']) delete s.places[id];
  s.visitsTo = { great_hall: 4 };
  const eng = new Engine(content).load(JSON.stringify(s));
  for (const id of ['refectory', 'infirmary', 'flight_field']) assert.ok(eng.s.places[id], id + ' back');
  assert.equal(eng.s.visitsTo.great_hall, 4);
  assert.ok(eng.mapView().places.some((p) => p.id === 'refectory'), 'on the map');
});

test('a tonic makes the plain checks it names one rung easier, never a fight, a negotiation or another kind', () => {
  const e = fresh(), b = content.balance.tonic;
  assert.ok(b > 0);
  const v = (kind) => e.checkValue({ kind }).value;
  const before = { appeal: v('appeal'), perform: v('perform'), research: v('research'), negotiate: v('negotiate'), exam: e.examOdds(Object.keys(content.tracks).find((id) => content.tracks[id].kind === 'course')).value };
  const ctx = e.newCtx(null, null);
  e.run([{ t: 'gain', state: 'courage_blend' }], ctx);
  assert.equal(v('appeal'), before.appeal + b); assert.equal(v('perform'), before.perform + b);
  assert.equal(v('research'), before.research); assert.equal(v('negotiate'), before.negotiate);
  e.run([{ t: 'gain', state: 'steadying_draught' }], ctx);
  assert.ok(!e.s.states.courage_blend, 'one tonic at a time');
  assert.equal(v('research'), before.research + b); assert.equal(v('appeal'), before.appeal);
});

test('items: previewing an option that gives or takes an item changes nothing', () => {
  const e = fresh();
  e.s.vals.gold = 500; e.s.cur = { id: 'shop_square', actor: null };
  const before = JSON.stringify([e.s.items, e.s.worn, e.s.itemsHad]);
  for (const key of ['robes', 'coat', 'hazel_swap']) if (e.optionsOf(content.events.shop_square).some((o) => o.key === key)) { try { e.preview('shop_square', key, null); } catch (err) { /* hidden here */ } }
  assert.equal(JSON.stringify([e.s.items, e.s.worn, e.s.itemsHad]), before);
});

test('intro cards: left is only a line; right is at most a line, a fact or a lead, a tiny warm-up or a lesson; a lesson risks only a tiny Mood', () => {
  const intro = Object.values(content.events).filter((e) => (e.tags || []).includes('intro'));
  assert.ok(intro.length >= 20, intro.length + ' intro cards');
  // (a lead is a fact the Clues panel keeps: `flag` + `find`, as Maud's Warning names the Hush; meeting someone is free)
  const allowed = new Set(['say', 'learn', 'queue', 'challenge', 'meet', 'flag', 'find']);
  // A lesson's check (feedback 2026-10-20) wins or loses a tiny Mood, and nothing else.
  const engages = (e, effects) => G.walkEffects(effects, (st) => {
    if (st.t === 'rel') assert.equal(st.tier, 'tiny', e.id + ': a warm-up is tiny');
    else if (st.t === 'delta') assert.ok(st.name === 'mood' && st.tier === 'tiny', e.id + ': only a tiny Mood, got ' + st.name + ' ' + st.tier);
    else assert.ok(allowed.has(st.t), e.id + ' right: ' + st.t);
  });
  for (const e of intro) {
    assert.equal(e.class, 'story', e.id + ' is a story card');
    if (e.type === 'menu') { for (const o of e.options) engages(e, o.effects); continue; }   // Marrow's question: answers, none a cost
    const left = e.options.find((o) => o.key === 'left'), right = e.options.find((o) => o.key === 'right');
    assert.ok(left && right, e.id + ' has left and right');
    G.walkEffects(left.effects, (st) => assert.ok(st.t === 'say' || st.t === 'queue' || st.t === 'meet', e.id + ' left: ' + st.t));
    engages(e, right.effects);
  }
});

test('skip_intros: the just-in-time cards stay away; the core ones still come', () => {
  const Pol = require('../tools/policies.js');
  const seen = (flags) => { const ids = new Set(); const eng = new Engine(content); const q = console.warn; console.warn = () => {};
    try { Pol.play(eng, Pol.get('balanced'), { seed: 77, flags, fights: false, stop: (x) => x.s.turn >= 4, after: (x, v) => ids.add(v.id) }); } finally { console.warn = q; }
    return ids; };
  const on = seen(undefined), off = seen(['skip_intros']);
  assert.ok(on.has('jit_after_curfew') && !off.has('jit_after_curfew'));
  assert.ok(off.has('intro_welcome'), 'the welcome still asks');
});

// Feedback 2026-10-20: the orientation is one run of cards at the start, before course selection. The Welcome asks:
// left skips it, right plays it through in order. Ward is never skipped.
test('the orientation: the Welcome skips it or plays it through before the registrar; Ward either way', () => {
  const play = (first) => {
    const e = fresh(content), ids = [];
    const q = console.warn; console.warn = () => {};
    try {
      for (let i = 0; i < 40 && e.s.turn === 1; i++) {
        const r = e.advance();
        if (r.kind === 'map') { e.pickPlaces(null); continue; }
        if (r.kind !== 'card') continue;
        ids.push(r.view.id);
        const keys = r.view.options.filter((o) => !o.disabled).map((o) => o.key);
        e.choose(r.view.id === 'intro_welcome' ? first : keys[0]);
        if (r.view.id === 'enrolment') break;
      }
      for (let i = 0; i < 40 && e.s.turn === 1 && !(e.s.spells || {}).ward; i++) {
        const r = e.advance();
        if (r.kind === 'map') { e.pickPlaces(null); continue; }
        if (r.kind === 'card') { ids.push(r.view.id); e.choose(r.view.options.filter((o) => !o.disabled)[0].key); }
      }
    } finally { console.warn = q; }
    return { ids, ward: (e.s.spells || {}).ward };
  };
  const along = play('right'), skip = play('left');
  const seq = ['intro_welcome', 'intro_what_is_just', 'intro_tour', 'intro_wrong_tower', /^intro_lunch/, 'intro_vey_tea', 'intro_room', 'slice_ward_lesson', 'intro_practice_circle', 'intro_kit', 'registrar_list'];
  const at = along.ids.indexOf('intro_welcome');
  seq.forEach((x, k) => { const id = along.ids[at + k]; assert.ok(x instanceof RegExp ? x.test(id) : id === x, 'step ' + k + ': ' + along.ids.slice(at).join(' ')); });
  assert.equal(along.ids.filter((id) => /^intro_lunch/.test(id)).length, 1, 'one lunch card');
  assert.equal(skip.ids[skip.ids.indexOf('intro_welcome') + 1], 'registrar_list', 'skipping goes straight to the registrar');
  assert.ok(!skip.ids.some((id) => /^intro_(tour|room|practice_circle|kit)$/.test(id)));
  assert.ok(along.ward && skip.ward, 'Ward is learned either way');
});

// Feedback 2026-10-20: the lunch beat needed someone to sit with, so a player who had met no fellow student never saw
// it. intro_lunch_alone covers them; both are queued and exactly one plays.
test('the intro\'s lunch card comes whether or not you have met anyone', () => {
  const lunch = (meet) => {
    const e = fresh(); e.s.turn = 2;
    for (const id of Object.keys(e.s.npcs)) e.s.npcs[id].met = false;
    if (meet) e.s.npcs[meet].met = true;
    return ['intro_lunch', 'intro_lunch_alone'].filter((id) => e.candidates(content.events[id]).length);
  };
  assert.deepEqual(lunch(null), ['intro_lunch_alone']);
  assert.deepEqual(lunch('tobias'), ['intro_lunch']);
  // every peer the lunch could seat is named in the alone card's condition
  const peers = Object.keys(content.npcs).filter((id) => (content.npcs[id].tags || []).includes('peer') && id !== 'bram');
  for (const id of peers) assert.deepEqual(lunch(id), ['intro_lunch'], id);
  assert.deepEqual(lunch('bram'), ['intro_lunch_alone'], 'Bram, met on the tour, is no one to sit with');
});

// Feedback 2026-10-20: Marrow's question is its own card; the tour meets Bram on sight (no warm-up), and following him
// shows the places that matter before the wrong tower; on the eve of graduation Marrow asks again, for those who answered.
test('the orientation: Marrow asks what is just; the tour meets Bram; following him names the places; she asks again at the end', () => {
  const e = fresh(content), ids = [];
  const pick = { intro_welcome: 'right', intro_what_is_just: 'fair', intro_tour: 'right' };
  const q = console.warn; console.warn = () => {};
  let relAtTour = null;
  try {
    for (let i = 0; i < 30 && e.s.turn === 1 && !ids.includes('intro_wrong_tower'); i++) {
      const r = e.advance();
      if (r.kind === 'map') { e.pickPlaces(null); continue; }
      if (r.kind !== 'card') continue;
      ids.push(r.view.id);
      if (r.view.id === 'intro_tour') { assert.ok(e.s.npcs.bram.met, 'Bram is met as the tour shows'); relAtTour = e.s.npcs.bram.rel; }
      e.choose(pick[r.view.id] || r.view.options.filter((o) => !o.disabled)[0].key);
    }
  } finally { console.warn = q; }
  const at = ids.indexOf('intro_welcome');
  assert.deepEqual(ids.slice(at, at + 5), ['intro_welcome', 'intro_what_is_just', 'intro_tour', 'intro_places', 'intro_wrong_tower']);
  assert.equal(e.s.npcs.bram.rel, relAtTour, 'the tour changes nothing with Bram but meeting him');
  assert.ok(e.s.flags.just_fair);
  const asks = content.events.isolde_asks_again;
  e.s.turn = e.maxTurns;
  assert.ok(e.test(asks.when, null), 'asked again at the end');
  delete e.s.flags.just_fair;
  assert.ok(!e.test(asks.when, null), 'not for someone who never answered');
});
