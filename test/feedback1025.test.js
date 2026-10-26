// The 2026-10-25 feedback round (docs/feedback-2026-10-25-plan.md): closing an arc, a bond's age.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../src/engine.js');
const { content, quiet } = require('./helpers.js');

const fresh = (c = content, seed = 5) => { const eng = new Engine(c); quiet(() => eng.newGame({ seed, name: 'T', origin: 'street' })); return eng; };
const run = (eng, src) => quiet(() => eng.run(src, eng.newCtx(null, null)));

test('1.1 a closed arc deals none of its cards, drops its queued ones and gives no clue', () => {
  const eng = fresh();
  const arcCard = Object.values(content.events).find((e) => e.arc === 'hollowstar' || e.chain === 'hollowstar');
  assert.ok(arcCard, 'the content has a Hollow Star card');
  assert.equal(eng.env(null).fn('closed', ['hollowstar']), false);
  assert.equal(eng.arcClosed(arcCard), false);
  run(eng, [{ t: 'close', arc: 'hollowstar' }]);
  assert.equal(eng.s.arcs.hollowstar.closed, eng.s.turn, 'the arc records when it closed');
  assert.equal(eng.arcClosed(arcCard), true);
  assert.equal(eng.eligible(arcCard, new Set()), false, 'no card of a closed arc is dealt');
  // A follow-up already in the deck never shows.
  eng.s.day = null; eng.s.cur = null;
  eng.s.deck = [{ id: arcCard.id, actor: null, src: 'queued' }];
  const r = quiet(() => eng.advance());
  assert.ok(!(r.kind === 'card' && r.view.id === arcCard.id), 'the queued card of a closed arc is dropped');
  // And none of its clues is found any more.
  run(eng, [{ t: 'find', clue: 'star_key' }]);
  assert.ok(!eng.s.clues.star_key, 'no clue of a closed arc');
});

test('1.1 the lint keeps every clue source inside its arc or behind closed()', () => {
  for (const e of Object.values(content.events)) {
    const own = e.arc || (e.chain && content.arcs[e.chain] ? e.chain : null);
    const guarded = (x) => !!x && /\bclosed\(/.test(x.src || '');
    const effs = [[e.on_show, null], ...e.options.map((o) => [o.effects, o.when])];
    for (const [list, ow] of effs) require('../src/grimoire.js').walkEffects(list || [], (st) => {
      if (st.t !== 'find') return;
      const c = content.clues[st.clue], a = c && c.arc;
      if (a) assert.ok(a === own || guarded(e.when) || guarded(ow), e.id + ' finds ' + st.clue + ' outside its arc');
    });
  }
});

test('1.2 bond_months counts from the month the bond was set', () => {
  const eng = fresh();
  const months = () => eng.env(null).fn('bond_months', ['mir']);
  eng.s.npcs.mir.met = 1;
  assert.equal(months(), -1, 'no bond yet');
  run(eng, [{ t: 'bond', npc: 'mir', status: 'partner' }]);
  assert.equal(months(), 0);
  eng.s.turn += 12;
  assert.equal(months(), 12);
  delete eng.s.npcs.mir.bondAt;   // an old save
  assert.equal(months(), -1);
});

// ---- 2. Allies in fights: `challenge combat … with <who>` → the ally throws in a spell now and then (an assist)
const G = require('../src/grimoire.js');
const Bridge = require('../src/combat.js');
const CombatSim = require('../tools/combat-sim.js');

test('2 `with <who>` parses on a fight, and the request names the ally', () => {
  const st = G.parseFile('@event t_ally\ntitle: T\ntext: T\n> left: Go\n  challenge combat adept with kael:\n    win:\n      mood +tiny\n    lose:\n      mood -tiny\n', 't.grim')[0].options[0].effects[0];
  assert.equal(st.ally, 'kael');
  assert.throws(() => G.parseFile('@event t_b\ntitle: T\ntext: T\n> left: Go\n  challenge combat adept with:\n    win:\n      mood +tiny\n    lose:\n      mood -tiny\n', 't.grim'));
});

test('2 an ally beside you throws their spell in on scheduled exchanges, and the fight text says so', () => {
  CombatSim.resolver();   // starts the core
  const C = Bridge.combat();
  const eng = fresh(content, 7); eng.s.turn = 40; eng.s.npcs.kael.met = 1;
  const base = { id: 'hs_tunnel/fight#0', event: 'hs_tunnel', option: 'fight', index: 0, kind: 'combat', dc: 60, odds: 'even', vs: null, variantHash: 1, seed: 4242, met: ['kael'], player: eng.fightPlayer() };
  const alone = Bridge.createFight(base, { content }), beside = Bridge.createFight(Object.assign({}, base, { allies: ['kael'] }), { content });
  assert.ok(!alone.setting.allies, 'no ally without `with`');
  assert.deepEqual(beside.setting.allies.map((a) => [a.npc, a.spell]), [['kael', 'hoarfrost']], 'Kael throws Hoarfrost, his iconic spell');
  assert.ok(beside.state.config.assists[0].rounds.length > 5, 'every few exchanges');
  // Play both sides by AI and look for the assist in the log.
  const s = beside.state, ctx = C.createSearchContext(); let seen = 0, told = 0;
  try {
    for (let n = 0; !s.result && n < 400; n++) {
      const side = C.actorToMove(s); if (side == null) break;
      const before = C.cloneState(s), r = C.applyChoice(s, C.chooseAIAction(s, Object.assign({}, s.config.ai[1], { preset: 'easy' }), ctx).id);
      if (!r.resolved) continue;
      const ev = r.eventData || [];
      if (ev.some((e) => e.type === 'assist')) {
        seen++;
        assert.ok(ev.some((e) => e.type === 'hit' && e.source === 0 && e.id === 'hoarfrost'), 'the assist lands as the player side\'s Hoarfrost');
        const lines = C.resolvedLines(before, s, Object.assign({}, r, { channels: [null, null] }), beside.names);
        if ((lines[0] || '').includes('Kael')) told++;
      }
    }
  } finally { C.freeSearchContext(ctx); }
  assert.ok(seen >= 1, 'Kael cast at least once');
  assert.ok(told >= 1, 'the fight text names Kael');
});

// ---- 3. Careers and the last day
const { slow } = require('./helpers.js');
const show = (eng, id, actor) => { eng.s.cur = null; eng.s.day = null; eng.s.deck.unshift({ id, actor: actor || null, src: 'test' }); return quiet(() => eng.advance()); };
const atTurn = (eng, turn) => { eng.s.turn = turn; };

test('3.1 "not yet" at the career fair brings its second week the next month', () => {
  const eng = fresh(content, 9);
  atTurn(eng, 38);   // final year, month 2
  assert.ok(eng.test(content.events.y3_career_fair.when, null), 'the fair in month 2');
  run(eng, content.events.y3_career_fair.options.find((o) => o.key === 'none').effects);
  atTurn(eng, 39);
  assert.ok(eng.test(content.events.y3_career_fair.when, null), 'its second week in month 3');
  atTurn(eng, 40);
  assert.ok(!eng.test(content.events.y3_career_fair.when, null), 'and not after');
});

test('3.3 with no offer by the wrap-up, the last call comes and always holds a sure post', () => {
  const eng = fresh(content, 9);
  atTurn(eng, 47);
  const e = content.events.career_last_call;
  assert.ok(eng.test(e.when, null), 'no offer: the last call comes');
  const r = show(eng, 'career_last_call');
  assert.equal(r.kind, 'card');
  const reg = r.view.options.find((o) => o.key === 'registrar');
  assert.ok(reg && !reg.disabled, 'the registrar\'s list is always open');
  eng.s.flags.offer_newt = true;
  assert.ok(!eng.test(e.when, null), 'an offer held: no last call');
});

test('3.4 the last day signs one held offer, or none', () => {
  const eng = fresh(content, 9);
  atTurn(eng, 48);
  eng.s.flags.offer_conclave = true; eng.s.flags.offer_newt = true;
  const r = show(eng, 'last_career');
  const open = r.view.options.filter((o) => !o.disabled).map((o) => o.key).sort();
  assert.deepEqual(open, ['conclave', 'look', 'newt'], 'one option per offer, and keep looking');
});

test('3.5 every earned yearbook line is reachable on the last day (two simulated runs)', slow, () => {
  const F = require('../tools/finale.js');
  const Policies = require('../tools/policies.js');
  for (const [style, seed] of [['social', 7], ['balanced', 3]]) {
    const eng = new Engine(content);
    const { r } = quiet(() => Policies.play(eng, Policies.get(style), { seed, name: 'F', maxSteps: 9000, stop: (e, x) => e.s.turn >= e.maxTurns && x.kind === 'card' }));
    if (r.kind === 'ending') continue;   // ended early: no last day
    const res = F.explore(eng);
    assert.ok(res.leaves > 1, style + ': the last day has choices');
    assert.deepEqual(res.missing, [], style + ': every earned line is reachable');
  }
});
