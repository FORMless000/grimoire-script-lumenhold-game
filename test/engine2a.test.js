// Phase 2a engine semantics: tiers, presets, challenges, spells, variation, decay, facts, previews.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/grimoire.js');
const Engine = require('../src/engine.js');
const Fmt = require('../tools/format.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');
const Policies = require('../tools/policies.js');

const BASE = `@game
title: T
years: 1
months: A, B, C, D, E, F, G, H, I, J, K, L

@resource health
name: Health
start: 50

@resource mood
name: Mood
start: 50

@resource gold
name: Crowns
max: 99999
start: 20

@resource mana
name: Mana
max: 40 + arcana / 2
start: 10

@resource alignment
name: Alignment
min: -100
max: 100
start: -60
drag: -50 0.5

@skill arcana
name: Arcana
start: 20

@skill charm
name: Charm
start: 20

@npc lyra
name: Lyra Vane
age: 19
pronouns: she/her
romance: true
stats: arcana 40 charm 10
relations: kael:-20

@npc kael
name: Kael Dumont
age: 20
pronouns: he/him

@fact lyra.toast
tier: surface
text: Can't make toast.

@fact lyra.mother
tier: personal
unlock: rel(lyra) >= 30
text: Her mother never says well done.

@spell ward
name: Ward
cost: 8, 6, 5
power: 1, 2, 3

@balance
sizes: health 2 4 7 12 20 | mood 2 4 7 12 20 | gold 3 8 15 30 60 | mana 3 6 10 16 25 | alignment 2 4 7 12 20 | xp 1 2 4 7 12 | rel 2 4 7 12 20 | spark 3 6 10 15 25
difficulty: trivial -15 easy -7 medium 0 hard 8 heroic 16
curve: 20 20 20 20 20 20 20 20 20 20 20 20

@preset grind
params: skill
do:
  $skill +medium
  mood -small

@ending ending_x
title: X
text: X.
`;

function engineWith(events, seed = 1) {
  const { content, errors } = G.compile([{ path: 'c.grim', text: BASE + '\n' + events }]);
  assert.deepEqual(errors.map((e) => e.message), []);
  const eng = new Engine(content);
  eng.newGame({ seed, name: 'T' });
  return eng;
}
// Put an event on screen right now.
function show(eng, id, actor) { eng.s.cur = null; eng.s.deck.unshift({ id, actor: actor || null, src: 'test', force: true }); const r = eng.advance(); assert.equal(r.kind, 'card'); return r.view; }

test('tiers and presets resolve to @balance sizes', () => {
  const eng = engineWith(`@event e
title: E
text: t
> left: L
  grind arcana
  gold +large
> right: R
  health -tiny
`);
  show(eng, 'e');
  const out = eng.choose('left');
  assert.equal(out.deltas.arcana, 4);   // xp medium
  assert.equal(out.deltas.mood, -4);    // small
  assert.equal(out.deltas.gold, 30);    // large
});

test('presets: wrong arguments and unknown names are compile errors', () => {
  const bad = G.compile([{ path: 'c.grim', text: BASE + '\n@event e\ntitle: E\ntext: t\n> ok: Go\n  grind\n  fly away\n' }]);
  const msgs = bad.errors.map((e) => e.message).join('\n');
  assert.match(msgs, /preset grind takes skill/);
  assert.match(msgs, /unknown statement or preset "fly away"/);
});

test('challenge odds: curve, tiers, vs modifier, partial band', () => {
  const eng = engineWith(`@event duel
title: D
actor: lyra
text: t
> ok: Go
  challenge duel vs lyra.charm easy:
    win:
      health +small
    partial:
      health +tiny
    lose:
      health -small
`);
  const st = eng.c.events.duel.options[0].effects[0];
  const o = eng.challengeOdds(st, 'lyra');
  // skill (vigor 0 + arcana 20)/2 = 10; DC = curve 20 + easy −7 + (lyra's charm 10 − 20) = 3
  assert.equal(o.dc, 3);
  assert.equal(o.win, 55);                // win needs DC + 5: 50 + 2.5·(10 − 8)
  assert.equal(o.atLeastPartial, 80);     // partial or better: DC − 5
  const pv = eng.preview('duel', 'ok', 'lyra');
  assert.equal(pv.paths.length, 3);
  assert.ok(Math.abs(pv.paths.reduce((a, p) => a + p.p, 0) - 1) < 1e-9);
});

test('odds range: 5–95 by default, no forced fail on a milestone, @balance odds and spell_check (L-3)', () => {
  const ev = (id, cls, tier = 'trivial') => `@event ${id}
title: E
class: ${cls}
text: t
> ok: Go
  challenge negotiate ${tier}:
    win:
      health +small
    lose:
      health -small
`;
  const eng = engineWith(ev('plain', 'routine') + '\n' + ev('big', 'milestone') + '\n' + ev('far', 'routine', 'heroic'));
  eng.s.vals.charm = 90;   // far above the curve: odds hit the top of the range
  const st = (id) => eng.c.events[id].options[0].effects[0];
  assert.equal(eng.challengeOdds(st('plain'), null, 'plain').win, 95);
  assert.equal(eng.challengeOdds(st('big'), null, 'big').win, 100);
  eng.s.vals.charm = 0;    // far below a heroic check: the forced success is all that's left
  assert.equal(eng.challengeOdds(st('far'), null, 'far').win, 5);
  eng.c.balance.odds = { min: 10, max: 80 };
  eng.s.vals.charm = 90;
  assert.equal(eng.challengeOdds(st('plain'), null, 'plain').win, 80);
  assert.deepEqual(eng.spellCheck(), { per: 3, cap: 15 });   // the defaults when @balance says nothing
  eng.c.balance.spell_check = { per: 2, cap: 6 };
  assert.deepEqual(eng.spellCheck(), { per: 2, cap: 6 });
});

test('spells: hidden until known, disabled without mana, cost paid on choose', () => {
  const eng = engineWith(`@event cold
title: C
text: t
> left: L
  health -small
> right: R
  learn_spell ward
> up[ward]: Ward it
  mood +small
`);
  let v = show(eng, 'cold');
  assert.ok(!v.options.some((o) => o.key === 'up'), 'hidden before learning');
  eng.choose('right');
  assert.equal(eng.s.spells.ward, 1);
  eng.s.vals.mana = 5;
  v = show(eng, 'cold');
  assert.equal(v.options.find((o) => o.key === 'up').disabled, true, 'mana 5 < cost 8');
  eng.s.vals.mana = 30;
  v = show(eng, 'cold');
  const up = v.options.find((o) => o.key === 'up');
  assert.equal(up.disabled, false);
  assert.equal(up.spell.cost, 8);
  const out = eng.choose('up');
  assert.equal(out.deltas.mana, -8);
  assert.equal(out.deltas.mood, 4);
});

test('inline variation: deterministic, cycle, sequence, conditional, nested tokens', () => {
  const eng = engineWith(`@event v
title: V
actor: lyra
text: {~a|b|c} {&x|y} {first|last} {gold > 10: rich {npc}|poor}
> ok: Go
  mood +tiny
`);
  const text = eng.c.events.v.text;
  eng.s.seen.v = 1;
  const t1 = eng.interp(text, 'lyra', 'v');
  assert.equal(eng.interp(text, 'lyra', 'v'), t1, 'same seed, turn and event: same text');
  assert.match(t1, /^[abc] x first rich Lyra$/);
  eng.s.seen.v = 2;
  assert.match(eng.interp(text, 'lyra', 'v'), / y last rich Lyra$/);
  eng.s.vals.gold = 0;
  assert.match(eng.interp(text, 'lyra', 'v'), / poor$/);
  const rng = eng.s.rng; eng.interp(text, 'lyra', 'v'); assert.equal(eng.s.rng, rng, 'no RNG use');
  assert.deepEqual(G.textTokens(text), { tokens: ['npc'], conds: ['gold > 10'] });
});

test('resources: expression max and drag', () => {
  const eng = engineWith('@event e\ntitle: E\ntext: t\n> ok: Go\n  mana +200\n  alignment +10\n');
  show(eng, 'e');
  const out = eng.choose('ok');
  assert.equal(eng.s.vals.mana, 50);          // max 40 + arcana 20 / 2
  assert.equal(out.deltas.alignment, 5);      // below −50: increases halved
});

test('facts, memories and relations between characters', () => {
  const eng = engineWith(`@event meet
title: M
actor: lyra
text: t
> ok: Go
  memory: helped npc
  rel lyra +40
  npc_rel lyra kael +small
  learn lyra.mother
`);
  assert.equal(eng.npcRel('lyra', 'kael'), -20, 'seeded from relations');
  show(eng, 'meet', 'lyra');
  eng.choose('ok');
  assert.ok(eng.s.facts['lyra.toast'], 'surface fact known on meeting');
  assert.ok(eng.s.facts['lyra.mother']);
  assert.equal(eng.test(G.expr('knows(lyra.mother)'), null), true);
  assert.equal(eng.npcRel('lyra', 'kael'), -16);
  assert.equal(eng.npcRel('kael', 'lyra'), 4, 'both directions change');
  assert.deepEqual(eng.s.memories[0], { npc: 'lyra', event: 'meet', kind: 'helped', turn: 1 });
});

test('spark fades and partnerships end; friendships fade after 6 months', () => {
  const eng = engineWith('@event e\ntitle: E\ntext: t\n> ok: Go\n  mood +tiny\n');
  const n = eng.s.npcs.lyra;
  Object.assign(n, { met: true, rel: 30, spark: 25, bond: 'partner', touched: 1, sparked: 1 });
  for (let i = 0; i < 9; i++) { eng.s.deck = []; eng.s.cur = null; eng.endMonth(); }
  assert.equal(n.bond, 'ex', 'two months below spark 20 ends it');
  assert.ok(n.spark < 10);
  assert.ok(n.rel < 30, 'no contact for more than 6 months');
});

test('variant hard: one tier harder, rewards ×1.5', () => {
  const eng = engineWith(`@event h
title: H
text: t
variant: hard
> ok: Go
  gold +medium
  challenge exam using arcana medium:
    win:
      mood +tiny
    lose:
      mood -tiny
`);
  eng.s.deck.unshift({ id: 'h', src: 'test', force: true, variant: 'hard' });
  eng.advance();
  const out = eng.choose('ok');
  assert.equal(out.deltas.gold, 22.5);
});

test('older saves are refused', () => {
  const eng = engineWith('@event e\ntitle: E\ntext: t\n> ok: Go\n  mood +tiny\n');
  const old = JSON.parse(eng.save()); old.version = 2;
  assert.throws(() => new Engine(eng.c).load(old), (e) => e.code === 'SAVE_VERSION');
});

test('previews contain real outcomes and never touch the RNG (real content)', () => {
  const { content } = project(ROOT).compileAll();
  let checked = 0;
  for (let g = 0; g < 8; g++) {
    const eng = new Engine(content);
    let r = eng.newGame({ seed: 4242 + g * 31, name: 'T' });
    for (let k = 0; k < 6000 && r.kind !== 'ending'; k++) {
      if (r.kind === 'month') { r = eng.advance(); continue; }
      if (r.kind === 'map') { eng.pickPlaces(Policies.pickPlaces(eng, r.view)); r = eng.advance(); continue; }
      if (r.view.pick > 1) { const some = r.view.options.filter((o) => !o.disabled && o.key !== 'none'); eng.choose(some.length ? Policies.pickMany(eng, r.view, some) : ['none']); r = eng.advance(); continue; }
      const opts = r.view.options.filter((o) => !o.disabled);
      const key = opts[(k + g) % opts.length].key;
      const rng = eng.s.rng;
      const pv = eng.preview(r.view.id, key, r.view.actor ? r.view.actor.id : null);
      assert.equal(eng.s.rng, rng);
      const out = eng.choose(key);
      assert.ok(Engine.fits(pv, out.deltas), r.view.id + '/' + key + ': ' + JSON.stringify(out.deltas));
      checked++;
      r = eng.advance();
    }
  }
  assert.ok(checked > 500);
});

test('fmt keeps preset bodies (raw effects) intact', () => {
  const text = '@preset risk\nparams: res\ndo:\n  chance 50:\n    $res +large\n  else:\n    $res -medium\n';
  const r = Fmt.formatChecked(text, 'p.grim');
  assert.equal(r.error, null);
  assert.equal(r.changed, false);
});
