// The connection between the main game and the combat minigame (combat/, wired in 2026-10-18): one Mana scale and one
// price per spell in both games.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const Engine = require('../src/engine.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');

const { content } = project(ROOT).compileAll();
const roster = () => import(path.join(ROOT, 'combat/setup/roster.mjs'));
const SKILLS = ['arcana', 'lore', 'alchemy', 'charm', 'vigor', 'guile'];

test('combat: a spell costs the same Mana on a card as in a fight', async () => {
  const { SPELLS } = await roster();
  for (const [id, d] of Object.entries(content.spells)) assert.deepEqual(d.cost, SPELLS[id].cost, id);
});

test('combat: the main game\'s max Mana is the fight\'s capacity, at any skills', async () => {
  const { manaCapacity } = await roster();
  const eng = new Engine(content);
  const w = console.warn; console.warn = () => {};
  try { eng.newGame({ seed: 1 }); } finally { console.warn = w; }
  for (const lv of [[12, 12, 12, 12, 12, 12], [30, 6, 6, 8, 8, 6], [50, 50, 50, 50, 50, 50], [80, 70, 40, 20, 60, 30], [100, 100, 100, 100, 100, 100]]) {
    const skills = Object.fromEntries(SKILLS.map((k, i) => [k, lv[i]]));
    Object.assign(eng.s.vals, skills);
    assert.equal(eng.resMax(content.resources.mana), manaCapacity(skills), JSON.stringify(skills));
  }
});

test('combat: build/combat.bundle.js is current and starts the core in Node', () => {
  const H = require('../combat/tools/bundle-hash.cjs');
  assert.equal(H.staleReason(), null);
  const C = require('../build/combat.bundle.js');
  C.initSync();
  assert.equal(C.RULES_VERSION, H.bundleHeader().rules);
  for (const k of ['createState', 'fightOptions', 'settle', 'fightSetting', 'foeLevel', 'EVENTS', 'FOES', 'chooseAIAction', 'applyChoice', 'describe', 'createAI']) assert.ok(C[k], k);
});

// ---- Fights instead of dice: the engine's side (src/engine.js fightRequest / playFight / fightAhead) and the bridge (src/combat.js)
const Bridge = require('../src/combat.js');
const CombatSim = require('../tools/combat-sim.js');
const Policies = require('../tools/policies.js');
const G = require('../src/grimoire.js');
const quiet = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };
function fresh(seed = 3) { const eng = new Engine(content); quiet(() => eng.newGame({ seed, name: 'Test' })); return eng; }
function show(eng, id, actor) { eng.s.cur = null; eng.s.deck.unshift({ id, actor: actor || null, src: 'test', force: true }); const r = eng.advance(); assert.equal(r.kind, 'card'); assert.equal(r.view.id, id); return r.view; }
const result = (req, outcome, reason, deltas = {}) => ({ request: req.id, outcome, reason, deltas, followUps: [], foe: { id: 'x', level: 3 }, exchanges: 4, rules: 'test' });
// Every played challenge (combat, duel) in content: [event, option, index on the option].
const PLAYED = [];
for (const e of Object.values(content.events)) for (const o of e.options || []) {
  let i = 0; G.walkEffects(o.effects || [], (x) => { if (x.t === 'challenge' && (x.kind === 'combat' || x.kind === 'duel')) PLAYED.push([e.id, o.key, i++]); });
}

test('combat: fightAhead names the fight choose() then plays, and a handed result settles it', () => {
  const eng = fresh();
  show(eng, 'duel_fixture');
  const req = eng.fightAhead('left');
  assert.equal(req.id, 'duel_fixture/left#0');
  assert.equal(req.kind, 'combat');
  assert.ok(req.dc > 0 && req.player.skills.arcana >= 0 && req.player.maxMana > 0);
  assert.equal(eng.s.cur.id, 'duel_fixture', 'the dry run leaves the card where it was');
  assert.equal(eng.fightAhead('right'), null, 'no fight on the other side');
  const before = eng.s.vals.health;
  const out = eng.choose('left', { fights: [result(req, 'win', 'knockout', { health: -7, mana: -10 })] });
  assert.equal(eng.s.vals.health, before - 7, 'the fight\'s own Health only');
  assert.ok(out.checks.some((c) => c.fight && c.result === 'win'));
  assert.equal(eng.s.fights.length, 1);
  assert.equal(eng.s.fights[0].id, 'duel_fixture/left#0');
});

test('combat: a result for another fight is refused', () => {
  const eng = fresh();
  show(eng, 'duel_fixture');
  assert.throws(() => eng.choose('left', { fights: [Object.assign(result({ id: 'other/left#0' }, 'win', 'knockout'))] }), /handed to duel_fixture/);
});

test('combat: outcomes map onto the card (win; draw or points loss → partial where there is one; knockout → lose), and the outcome\'s Health lines are skipped', () => {
  const cases = [
    ['duel_fixture', 'win', 'decision', 'win'], ['duel_fixture', 'draw', 'stalemate', 'partial'], ['duel_fixture', 'lose', 'decision', 'partial'], ['duel_fixture', 'lose', 'knockout', 'lose'],
    ['duel_practice_bout', 'draw', 'decision', 'lose'], ['duel_practice_bout', 'lose', 'decision', 'lose'], ['duel_practice_bout', 'win', 'knockout', 'win'],
  ];
  for (const [id, outcome, reason, want] of cases) {
    const eng = fresh();
    show(eng, id);
    const req = eng.fightAhead('left');
    const h = eng.s.vals.health, mood = eng.s.vals.mood;
    const out = eng.choose('left', { fights: [result(req, outcome, reason)] });
    assert.equal(out.checks.find((c) => c.fight).result, want, id + ' ' + outcome + '/' + reason);
    assert.equal(eng.s.vals.health, h, id + ': the lose branch\'s Health is the fight\'s, not the card\'s');
    if (id === 'duel_fixture' && want === 'lose') assert.ok(eng.s.vals.mood < mood, 'the rest of the outcome still runs');
  }
});

test('combat: with real content no fight is ever rolled (every combat and duel check is a played fight)', () => {
  for (const style of ['balanced', 'aggressive', 'random']) {
    const { eng } = quiet(() => Policies.play(new Engine(content), Policies.get(style), { seed: 11, name: 'F', maxSteps: 9000 }));
    const checks = eng.s.hist.filter((h) => h.t === 'card' && h.out).flatMap((h) => h.out.checks || []);
    const fights = checks.filter((c) => c.challenge === 'combat' || c.challenge === 'duel');
    assert.ok(fights.length > 0, style + ' met a fight');
    for (const c of fights) assert.ok(c.fight, style + ': a rolled ' + c.challenge);
    assert.equal(eng.s.fights.length, fights.length);
  }
});

test('combat: every played card yields a foe, a level and a setting in the minigame, at any year', () => {
  CombatSim.resolver();   // starts the core
  const C = Bridge.combat();
  for (const turn of [1, 20, 40]) {
    const eng = fresh(5);
    eng.s.turn = turn;
    for (const [id, key, index] of PLAYED) {
      const e = content.events[id];
      const req = { id: id + '/' + key + '#' + index, event: id, option: key, index, kind: 'combat', dc: 1.5 + turn / 20, odds: 'even', vs: null, variantHash: eng.variantHash(id), seed: 1234 + turn, met: [], player: eng.fightPlayer() };
      const f = Bridge.createFight(req, { content });
      if (id === 'duel_hall_gallery') {
        assert.equal(f.foe.id, 'club_partner', 'a peer card with no peer falls back to a sparring partner');
        const g = Bridge.createFight(Object.assign({}, req, { vs: { npc: 'lyra', stat: 'arcana' } }), { content });
        assert.equal(g.foe.npc, 'lyra'); assert.equal(g.foe.name, content.npcs.lyra.short || content.npcs.lyra.name.split(' ')[0]);
      }
      assert.ok(f.foe.loadout && f.foe.level >= 1, req.id + ': foe');
      assert.ok(C.CONTEXTS[f.setting.context], req.id + ': context ' + f.setting.context);
      assert.ok(f.state && !f.state.result, req.id + ': a fight to play');
      assert.ok(e, id);
    }
  }
});

test('combat: a bot fight is deterministic and its result is the engine\'s shape', () => {
  const eng = fresh();
  show(eng, 'duel_fixture');
  const req = eng.fightAhead('left');
  const fight = CombatSim.resolver({ style: 'balanced', content });
  const a = fight(req), b = fight(req);
  assert.deepEqual(a, b);
  assert.equal(a.request, req.id);
  assert.ok(['win', 'lose', 'draw'].includes(a.outcome) && a.deltas && typeof a.exchanges === 'number');
});
