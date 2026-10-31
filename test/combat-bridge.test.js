// The connection between the main game and the combat minigame (combat/, wired in 2026-10-18): one Mana scale and one
// price per spell in both games.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const Engine = require('../src/engine.js');
const { ROOT, content, quiet } = require('./helpers.js');

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
    // up to three seeds, so that a short random game with no fight in it doesn't make the check vacuous (threads 2)
    let eng, fights = [];
    for (const seed of [11, 12, 13]) {
      eng = quiet(() => Policies.play(new Engine(content), Policies.get(style), { seed, name: 'F', maxSteps: 9000 })).eng;
      const checks = eng.s.hist.filter((h) => h.t === 'card' && h.out).flatMap((h) => h.out.checks || []);
      fights = checks.filter((c) => c.challenge === 'combat' || c.challenge === 'duel');
      if (fights.length) break;
    }
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

test('combat: a skill rusted or injured below 1 still fights (the minigame takes 1–100)', () => {
  const eng = fresh();
  eng.s.vals.vigor = 0.8; eng.s.vals.guile = 0;
  show(eng, 'duel_fixture');
  const req = eng.fightAhead('left');
  assert.equal(req.player.skills.vigor, 0.8, 'the request carries the game\'s own value');
  const a = CombatSim.resolver({ style: 'balanced', content })(req);
  assert.ok(['win', 'lose', 'draw'].includes(a.outcome));
});

// ---- The fight in the game's language (combat/setup/text.mjs, locales/<lang>/combat.lang)
const I18n = require('../src/i18n.js');
const fs = require('fs');

test('combat: a fight in progress is found again after a save and load (the fight screen resumes it)', () => {
  const eng = fresh(7);
  show(eng, 'duel_fixture');
  const req = eng.fightAhead('left');
  const again = new Engine(content).load(JSON.parse(eng.save()));
  assert.deepEqual(again.fightAhead('left'), req);
});

test('combat: rendered from its templates, a description is the core\'s English word for word', () => {
  const C = Bridge.combat(); C.initSync();
  const s = C.createState({ playerLoadout: 'Duellist', opponentLoadout: 'Illusionist', playerLevel: 60, opponentLevel: 60, spellAccess: 'all' });
  const ids = ['strike', 'guard', 'reclaim', 'hold', 'release'].concat(Object.keys(C.SPELLS).filter((id) => !C.SPELLS[id].as));   // an alias is its base rule
  try {
    for (let i = 0; i < 25 && !s.result; i++) {
      for (const side of [0, 1]) for (const id of ids.concat(C.legalActions(s, side).filter((a) => a.startsWith('bundle:')))) {
        C.useText(null); const en = C.describe(s, side, id);
        C.useText({ 'not.a.key': 'x' }); assert.equal(C.describe(s, side, id), en, id);
      }
      const l = C.legalActions(s); C.applyChoice(s, l[i % l.length]);
    }
  } finally { C.useText(null); }
});

test('combat: zh-CN translates every fight string, and a fight told in it has no English left', () => {
  const C = Bridge.combat(); C.initSync();
  const dir = path.join(ROOT, 'locales/zh-CN');
  const loc = I18n.loadLocale('zh-CN', [{ path: 'locales/zh-CN/combat.lang', text: fs.readFileSync(path.join(dir, 'combat.lang'), 'utf8') }]);
  const zh = Object.fromEntries(Object.entries(loc.blocks.combat).map(([k, v]) => [k, v.text]));
  for (const k of Object.keys(C.combatTextTable())) if (!(k.startsWith('label.') && content.spells[k.slice(6)])) assert.ok(zh[k], 'untranslated ' + k);
  // Spell names come from content's own translation; here any name without Latin letters stands in for it.
  for (const id of Object.keys(C.SPELLS)) zh['label.' + id] = zh['label.' + id] || '咒' + id.length;
  const english = /[A-Za-z]{3,}/;
  try {
    C.useText(zh);
    const names = C.fighterNames({ opponentName: '莱拉', opponentPronouns: 'she' });
    const loadouts = Object.keys(C.LOADOUTS);
    for (let f = 0; f < 12; f++) {
      const s = C.createState({ playerLoadout: loadouts[f % loadouts.length], opponentLoadout: loadouts[(f * 5 + 1) % loadouts.length], playerLevel: 30 + f * 4, opponentLevel: 40, spellAccess: 'all', firstLeader: f % 2 });
      for (let i = 0; i < 40 && !s.result; i++) {
        for (const side of [0, 1]) for (const id of C.legalActions(s, side)) {
          for (const text of [C.describe(s, side, id), C.label(id), C.flavorLine(id, { channel: s.actors[side].channel && s.actors[side].channel.id, round: s.round, names, side }) || ''])
            assert.ok(!english.test(text), id + ': ' + text);
        }
        const before = JSON.parse(JSON.stringify(s)), channels = s.actors.map((a) => a.channel && a.channel.id);
        const l = C.legalActions(s), r = C.applyChoice(s, l[(i * 3 + f) % l.length]);
        if (r.resolved) for (const text of C.resolvedLines(before, s, Object.assign({}, r, { channels, actionNames: r.pair.map((x) => C.label(x)) }), names).concat(C.finishLines(before, s, r.pair, r.round, names))) assert.ok(!text || !english.test(text), text);
      }
    }
  } finally { C.useText(null); }
});

// Feedback 2026-10-25: the intro's lesson. Its foe once had too little Mana for its scripted Flame (it struck instead, and
// its Refocus took back nothing), and after the script it searched, so a seen Impulse met a Parry until the fight stalled.
// Played as the coach says, every scripted move plays as written, its Refocus takes back flux, and its drill (EVENTS
// `loop`) leaves openings: the fight ends in a knockout well before the quiet rule.
test('combat: the intro lesson plays its script as written, then a drill that ends in a knockout', () => {
  const C = Bridge.combat(); C.initSync();
  const eng = fresh(7);
  let req = null;
  quiet(() => {
    for (let i = 0; i < 80 && !req; i++) {
      const r = eng.advance();
      if (r.kind === 'map') { eng.pickPlaces(null); continue; }
      if (r.kind !== 'card') continue;
      if (r.view.id === 'intro_practice_circle') { req = eng.fightAhead('right'); break; }
      eng.choose(r.view.options.find((o) => o.key === 'right' && !o.disabled) ? 'right' : r.view.options.filter((o) => !o.disabled)[0].key);
    }
  });
  assert.ok(req, 'the lesson card comes');
  const f = Bridge.createFight(req), s = f.state, script = f.setting.script;
  assert.ok(script.length && f.setting.loop.length, 'a script and a drill');
  const coached = ['strike', 'guard', 'ward', 'reclaim', 'strike'], played = [];
  let refocused = 0;
  for (let n = 0; !s.result && n < 200; n++) {
    const side = C.actorToMove(s), r = s.round;
    if (side === 1) {
      const id = Bridge.scriptedMove(f);
      assert.ok(id, 'the foe never searches (exchange ' + r + ')');
      if (r <= script.length) assert.equal(id, script[r - 1] === 'idle' ? 'cancel' : script[r - 1], 'exchange ' + r + ' as scripted');
      if (id === 'reclaim') refocused += s.actors[1].flux;
      played.push(id);
      C.applyChoice(s, id);
    } else {
      const legal = C.legalActions(s), want = coached[r - 1] || (s.pending[1] === 'flame' ? 'ward' : 'strike');
      C.applyChoice(s, legal.includes(want) ? want : 'strike');
    }
  }
  assert.equal(s.result && s.result.reason, 'knockout');
  assert.equal(s.result.winner, 0);
  assert.ok(s.round <= 16, 'over in ' + s.round + ' exchanges');
  assert.ok(played.filter((id) => id === 'flame').length >= 2, 'its Flame comes again in the drill');
  assert.ok(refocused > 0, 'its Refocus takes back flux');
});
