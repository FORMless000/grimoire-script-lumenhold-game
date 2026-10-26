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
