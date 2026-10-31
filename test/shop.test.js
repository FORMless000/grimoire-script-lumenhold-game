// Threads 2 (docs/threads-2-plan.md): a shop (`type: shop`) is a menu whose wares go in one basket. Each option's role
// is read from what it does; a basket is bought whole, in shelf order, if it fits the purse; `chosen` sees inside it.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/grimoire.js');
const Engine = require('../src/engine.js');
const { sources, quiet } = require('./helpers.js');

const EXTRA = `
@event t_shop
title: A Test Counter
type: shop
text: Wares on a counter.
> bread: Bread
  gold -small
  health +tiny
  say: Bread.
> cake: Cake
  gold -medium
  mood +small
  say: Cake.
> coat: A coat
  gold -large
  flag t_coat
  say: A coat.
> sell: Sell a spoon
  gold +tiny
  say: Sold.
> haggle: Haggle for the lot
  gold -small
  challenge negotiate journeyman:
    win:
      say: Won.
    lose:
      say: Lost.
> back: The back room
  queue t_back now
  say: In you go.
> look: Just looking
  say: You look.

@event t_back
title: The Back Room
trigger: queued
text: Dust.
> ok: Leave
  say: Out.

@event t_after
title: After
text: Later.
when: chosen(t_shop, cake)
> ok: Fine
  say: Fine.
`;
const compiled = G.compile(sources.concat([{ path: 't.grim', text: EXTRA }]));
const content = compiled.content;
const fresh = (gold) => { const eng = new Engine(content); quiet(() => eng.newGame({ seed: 5, name: 'T', origin: 'street' })); eng.s.vals.gold = gold; return eng; };
const show = (eng, id) => { eng.s.cur = null; eng.s.day = null; eng.s.deck.unshift({ id, actor: null, src: 'test', force: true }); const r = quiet(() => eng.advance()); assert.equal(r.view.id, id); return r.view; };
const price = (eng, tier) => eng.tierAmount('gold', tier);

test('shop: type: shop compiles to a menu that is a shop', () => {
  assert.deepEqual(compiled.errors.map(String), []);
  assert.equal(content.events.t_shop.type, 'menu');
  assert.equal(content.events.t_shop.shop, true);
  assert.ok(!content.events.t_back.shop);
});

test('shop: each option\'s role comes from what it does', () => {
  const eng = fresh(200), v = show(eng, 't_shop');
  const role = Object.fromEntries(v.options.map((o) => [o.key, o.role]));
  assert.deepEqual(role, { bread: 'ware', cake: 'ware', coat: 'ware', sell: 'ware', haggle: 'alone', back: 'alone', look: 'leave' });
  assert.equal(v.shop.purse, 200);
  assert.equal(v.options.find((o) => o.key === 'cake').price, price(eng, 'medium'));
  assert.equal(v.options.find((o) => o.key === 'sell').income, price(eng, 'tiny'));
});

test('shop: a basket is bought whole, in shelf order, and recorded with its keys', () => {
  const eng = fresh(200); show(eng, 't_shop');
  const before = eng.s.vals.gold;
  const out = quiet(() => eng.choose(['cake', 'bread', 'sell']));
  assert.equal(eng.s.vals.gold, before - price(eng, 'small') - price(eng, 'medium') + price(eng, 'tiny'));
  assert.equal(eng.s.choices.t_shop, 'bread+cake+sell');
  assert.match(out.say, /Bread[\s\S]*Cake[\s\S]*Sold/);
});

test('shop: a basket that costs more than the purse is refused, and so is anything but wares', () => {
  const eng = fresh(price(fresh(0), 'large'));
  show(eng, 't_shop');
  assert.throws(() => eng.choose(['coat', 'bread']), /more than you have/);
  assert.throws(() => eng.choose(['bread', 'back']), /only wares/);
  assert.throws(() => eng.choose(['bread', 'look']), /only wares/);
  quiet(() => eng.choose('coat'));   // one ware alone is an ordinary choice
  assert.ok(eng.s.flags.t_coat);
  assert.equal(eng.s.choices.t_shop, 'coat');
});

test('shop: chosen() sees a ware inside a basket; a plain menu still needs the exact key', () => {
  const eng = fresh(200); show(eng, 't_shop');
  quiet(() => eng.choose(['bread', 'cake']));
  assert.ok(eng.test(content.events.t_after.when, null));
  eng.s.choices.t_back = 'ok+x';
  assert.ok(!eng.test(G.expr('chosen(t_back, ok)'), null));
});

test('shop: the six village counters are shops with a way out, and their wares cost tier words', () => {
  const ids = ['shop_square', 'shop_pawn', 'shop_mabels', 'shop_grimsbys', 'shop_pell', 'shop_newt'];
  const eng = fresh(500);
  for (const id of ids) {
    const e = content.events[id];
    assert.ok(e.shop, id + ' is a shop');
    const roles = e.options.map((o) => eng.shopRole(o));
    assert.equal(roles.filter((r) => r === 'leave').length, 1, id + ' has one way out');
    assert.ok(roles.includes('ware'), id + ' sells something');
  }
  assert.equal(eng.shopRole(content.events.shop_square.options.find((o) => o.key === 'pawn')), 'alone');
});

test('shop: a basket survives a save and load mid-shop', () => {
  const eng = fresh(200); show(eng, 't_shop');
  const eng2 = new Engine(content); quiet(() => eng2.load(eng.save()));
  quiet(() => eng2.choose(['bread', 'cake']));
  assert.equal(eng2.s.choices.t_shop, 'bread+cake');
});
