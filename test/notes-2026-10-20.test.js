// Feedback notes 2026-10-20, the engine side: spark carried by friendship starts only from a romantic spark and stays out
// of sight until the card asking about it; rivalry bottoms out at −50; jobs ask one day less than the months left and close
// in a term's last month.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../src/engine.js');
const { content, silent } = require('./helpers.js');

function fresh() { const eng = new Engine(content); silent(() => eng.newGame({ seed: 11, name: 'T', origin: 'street' })); return eng; }
const romantic = Object.keys(content.npcs).find((id) => content.npcs[id].romance);
const relUp = (eng, id, n) => { const ctx = eng.newCtx(null); eng.run([{ t: 'rel', npc: id, min: n, max: n }], ctx); return ctx; };

test('friendship carries no spark below the threshold', () => {
  const eng = fresh(), n = eng.s.npcs[romantic];
  Object.assign(n, { met: true, rel: 20, spark: eng.sparkFollow().from - 1 });
  relUp(eng, romantic, 5);
  assert.equal(n.spark, eng.sparkFollow().from - 1);
});

test('carried spark is applied but hidden until the card asking about it, then shown', () => {
  const eng = fresh(), n = eng.s.npcs[romantic];
  Object.assign(n, { met: true, rel: 20, spark: eng.sparkFollow().from });
  const before = n.spark;
  const ctx = relUp(eng, romantic, 5);
  assert.ok(n.spark > before, 'applied');
  assert.equal(ctx.deltas['spark:' + romantic], undefined, 'not shown in the outcome');
  const shown = eng.snapshot().npcs.find((x) => x.id === romantic);
  assert.equal(shown.spark, before, 'not shown in the People panel');
  n.sparkAsked = true;
  const ctx2 = relUp(eng, romantic, 5);
  assert.ok(ctx2.deltas['spark:' + romantic] > 0);
  assert.equal(eng.snapshot().npcs.find((x) => x.id === romantic).spark, n.spark);
});

test('rivalry bottoms out at −50; friendship still reaches 100', () => {
  const eng = fresh(), id = Object.keys(content.npcs)[0], n = eng.s.npcs[id];
  Object.assign(n, { met: true, rel: -40 });
  relUp(eng, id, -30);
  assert.equal(n.rel, -50);
  n.rel = 95; relUp(eng, id, 30);
  assert.equal(n.rel, 100);
});

test('the map button lists the term map, and another map once you have visited a place on it', () => {
  const eng = fresh();
  let maps = eng.atlas();
  assert.deepEqual(maps.map((v) => v.map), [content.game.map_id || 'campus']);
  assert.ok(maps[0].now && maps[0].places.every((p) => p.state !== 'closed'));
  const home = Object.values(content.places).find((p) => p.map && p.map.map === 'home');
  eng.s.places[home.id] = eng.s.places[home.id] || { found: 1 };
  eng.s.visitsTo = { [home.id]: 1 };
  maps = eng.atlas();
  assert.deepEqual(maps.map((v) => v.map), [content.game.map_id || 'campus', 'home']);
});

test('a purse won at the high table leads to the next hand, and a company night can run late', () => {
  const win = content.events.newt_high_table.options.find((o) => o.key === 'purse');
  assert.ok(JSON.stringify(win.effects).includes('newt_high_table_raise'));
  assert.ok(JSON.stringify(content.events.newt_high_table_raise.options).includes('newt_high_table_last'));
  for (const id of ['newt_company', 'newt_company_regular']) assert.ok(JSON.stringify(content.events[id].options).includes('company_late_hour'));
});
