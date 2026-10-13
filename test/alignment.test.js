// Phase 3: alignment (Lumen ↔ Hollow, design §8.2), the Hollow Star finale it gates (§10.6) and yearbook
// endings (§10.5). These run against the real content.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Engine = require('../src/engine.js');
const Policies = require('../tools/policies.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');

const { content } = project(ROOT).compileAll();
const quiet = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };

// A fresh game showing one event now (as ?event=<id> does in the browser).
function show(id, setup) {
  const eng = new Engine(content);
  eng.newGame({ seed: 1, name: 'T' });
  if (setup) setup(eng.s, eng);
  eng.s.deck.unshift({ id, actor: null, src: 'preview', force: true });
  let r = eng.advance();
  for (let i = 0; i < 20 && !(r.kind === 'card' && r.view.id === id); i++) {
    if (r.kind === 'map') { eng.pickPlaces(Policies.pickPlaces(eng, r.view)); r = eng.advance(); } else r = eng.advance();
  }
  assert.equal(r.view && r.view.id, id, 'showing ' + id);
  return { eng, r };
}
const keys = (r) => r.view.options.filter((o) => !o.disabled).map((o) => o.key);

test('alignment: the hollow counter is gone, everywhere', () => {
  const grim = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? grim(path.join(dir, d.name)) : d.name.endsWith('.grim') ? [path.join(dir, d.name)] : []));
  for (const f of grim(path.join(ROOT, 'content'))) {
    const src = fs.readFileSync(f, 'utf8').split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
    assert.doesNotMatch(src, /\bhollow\s*(\+|-|>=|<=|>|<|==|=)\s*\d/, f + ' still uses the hollow counter');
  }
});

test('alignment: deep in the Hollow, the way back is slow (drag below −50)', () => {
  const eng = new Engine(content); eng.newGame({ seed: 2, name: 'T' });
  eng.s.vals.alignment = -70; eng.run([{ t: 'delta', name: 'alignment', tier: 'medium', sign: 1 }], { deltas: {}, notes: [], say: [], checks: [] });
  assert.equal(eng.s.vals.alignment, -70 + 7 * 0.5);
  eng.s.vals.alignment = -20; eng.run([{ t: 'delta', name: 'alignment', tier: 'medium', sign: 1 }], { deltas: {}, notes: [], say: [], checks: [] });
  assert.equal(eng.s.vals.alignment, -13);
});

test('finale: the Star sides with those deep in the Hollow (freed), claims the merely tempted', () => {
  const night = (s) => { s.flags.star_key = 1; };
  // Lumen: no bargain, no open
  let { r } = show('hs_beneath', (s) => { night(s); s.vals.alignment = 40; });
  assert.deepEqual(keys(r).sort(), ['flee', 'seal']);
  // Deep Hollow: the door opens, and the run goes on to a mystery line instead of a game over
  ({ r } = show('hs_beneath', (s) => { night(s); s.vals.alignment = -70; }));
  assert.ok(keys(r).includes('open') && keys(r).includes('bargain'));
  let x = show('hs_beneath', (s) => { night(s); s.vals.alignment = -70; });
  quiet(() => x.eng.choose('open'));
  assert.ok(x.eng.s.flags.hollow_freed); assert.ok(!x.eng.s.ended);
  // Tempted but not deep: opening it is the end of you
  x = show('hs_beneath', (s) => { night(s); s.flags.hollow_tempted = 1; s.vals.alignment = -10; });
  quiet(() => x.eng.choose('open'));
  assert.equal(x.eng.s.ended && x.eng.s.ended.id, 'ending_hollow_claimed');
});

test('yearbook: headline, mystery, relationships and personal lines; the Hollow Star no longer takes the headline', () => {
  const eng = new Engine(content); eng.newGame({ seed: 3, name: 'T' });
  const s = eng.s;
  s.flags.hollow_sealed = 1; s.vals.alignment = 75; s.vals.alchemy = 60; s.vals.mood = 80;
  s.npcs.lyra.met = true; s.npcs.lyra.bond = 'partner';
  const book = eng.yearbook();
  const by = (slot) => book.filter((x) => x.slot === slot).map((x) => x.id);
  assert.deepEqual(by('headline'), ['ending_alchemist']);
  assert.deepEqual(by('mystery'), ['ending_hollow_hero']);
  assert.ok(by('relationships').includes('ending_beloved'));
  assert.ok(by('personal').includes('ending_lumen'));
  // nobody special: the fallback headline and the bystander line
  const e2 = new Engine(content); e2.newGame({ seed: 4, name: 'T' });
  const b2 = e2.yearbook();
  assert.deepEqual(b2.filter((x) => x.slot === 'headline').map((x) => x.id), ['ending_graduate']);
  assert.deepEqual(b2.filter((x) => x.slot === 'mystery').map((x) => x.id), ['ending_bystander']);
  // every slot respects its cap
  for (const [slot, max] of [['headline', 1], ['mystery', 1], ['relationships', 3], ['personal', 2]]) assert.ok(book.filter((x) => x.slot === slot).length <= max);
});

test('alignment gates: Lumen and Hollow events open at ±30, plot scenes at ±60', () => {
  const ok = (id, a, extra) => { const e = content.events[id]; const eng = new Engine(content); eng.newGame({ seed: 5, name: 'T' }); eng.s.vals.alignment = a; eng.s.turn = 20; if (extra) extra(eng.s); return eng.test(e.when, null); };
  assert.ok(ok('align_asked_for_help', 35)); assert.ok(!ok('align_asked_for_help', 20));
  assert.ok(ok('align_northern_parcel', -35)); assert.ok(!ok('align_northern_parcel', -20));
  assert.ok(ok('hs_wardens_notice', 65)); assert.ok(!ok('hs_wardens_notice', 50));
  assert.ok(ok('hs_grey_invitation', -65)); assert.ok(!ok('hs_grey_invitation', -50));
});

test('corvin_runaway: the proposal comes to a partner in the final year, and the run can end there', () => {
  const { eng } = show('corvin_runaway', (s) => { s.npcs.corvin.met = true; s.npcs.corvin.bond = 'partner'; });
  quiet(() => eng.choose('right'));
  assert.equal(eng.s.ended && eng.s.ended.id, 'ending_runaway');
  const e = new Engine(content); e.newGame({ seed: 6, name: 'T' }); e.s.npcs.corvin.bond = 'partner'; e.s.turn = e.maxTurns - 3;
  assert.ok(e.test(content.events.corvin_runaway.when, 'corvin'));
});

test('play styles steer alignment: lumen climbs past +30, hollow sinks past −30', () => {
  const run = (name, seed) => quiet(() => {
    const eng = new Engine(content), st = Policies.get(name); let r = eng.newGame({ seed, name: 'T' });
    for (let i = 0; i < 8000 && r.kind !== 'ending'; i++) {
      if (r.kind === 'month') { r = eng.advance(); continue; }
      if (r.kind === 'map') { eng.pickPlaces(Policies.pickPlaces(eng, r.view)); r = eng.advance(); continue; }
      const v = r.view; eng.choose(v.pick > 1 ? Policies.pickMany(eng, v, v.options.filter((x) => !x.disabled && x.key !== 'none')) : st.pick(eng, v)); r = eng.advance();
    }
    return eng.s.vals.alignment;
  });
  assert.ok(run('lumen', 11) >= 30);
  assert.ok(run('hollow', 11) <= -30);
});

test('game-over endings: each is reachable from the event that grants it', () => {
  // the Disciplinary Board: a second hearing expels
  let x = show('crisis_probation', (s) => { s.flags.board_reprieve = 1; });
  quiet(() => x.eng.choose('right'));
  assert.equal(x.eng.s.ended && x.eng.s.ended.id, 'ending_expelled');
  // the first hearing grants a reprieve instead
  x = show('crisis_probation');
  quiet(() => x.eng.choose('right'));
  assert.ok(!x.eng.s.ended && x.eng.s.flags.board_reprieve);
  // every early ending has an `end` somewhere reachable (grim reach)
  const { reach } = require('../tools/reach.js');
  assert.deepEqual(reach(content).endings, []);
  for (const d of Object.values(content.endings)) if (d.kind === 'early') assert.ok(reach(content).facts.ending.has(d.id), d.id);
});
