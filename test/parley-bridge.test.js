'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const Engine = require('../src/engine.js'), G = require('../src/grimoire.js');
const { content, quiet } = require('./helpers.js');
const B = require('../src/parley.js'), C = require('../build/crux.bundle.js');
const N = require('../src/negotiation.js');
function fresh(id = 'slice_market_haggle', key = 'left') {
  const e = new Engine(content); quiet(() => e.newGame({ seed: 13, name: 'Test' }));
  e.s.vals.gold = 90; e.s.cur = { id, actor: content.events[id].actor || null, track: content.events[id].track || null };
  return { e, req: e.parleyAhead(key) };
}
C.core.initSync();

test('Crux bundle is current and is the same runtime used by the standalone host', () => {
  assert.equal(require('../crux/tools/bundle-hash.cjs').staleReason(), null);
  assert.ok(C.core.newGame && C.ui.open && C.text.table && C.rules);
});

test('localized labels preserve composite names, numeric costs and move identifiers', () => {
  const I = require('../src/i18n.js'), P = require('../tools/project.js').project(require('node:path').resolve(__dirname, '..'));
  const locale = I.loadLocale('zh-CN', P.liveLocaleSources('zh-CN'));
  I.use(locale); const tr = C.text.translator(I.parleyText());
  assert.equal(tr('A DEAL · A BARGAIN'), '交易 · 买卖一场');
  assert.equal(tr('✕ +1 Sus'), '✕ +1 猜疑');
  assert.equal(tr('Sleight: +2.5 crowns (−2 Mana).'), '妙手: +2.5 克朗（−2 法力）。');
  assert.equal(tr('cast:sleight'), 'cast:sleight');
  I.use(null);
});

test('Crux reads campaign skills, supported learned ranks and Mana capacity without preset grants', () => {
  const { e } = fresh(); Object.assign(e.s.vals, { charm: 23.75, renown: 9.5 });
  e.s.spells = { glamour: 2, mend: 1 };
  const req = e.parleyAhead('left'), p = B.createParley(req), v = p.game.view;
  assert.equal(v.signals.charm, 23.75); assert.equal(v.signals.standing, 9.5);
  assert.deepEqual(v.known, ['glamour']); assert.deepEqual(v.ranks, { glamour: 2 });
  assert.equal(v.cap, req.player.maxMana); assert.equal(v.mana, req.player.mana);
});

test('campaign relationships and track progress are direct signals; missing context removes those arguments', () => {
  const { e } = fresh('lyra_not_second'); e.s.npcs.lyra.rel = -17.25;
  assert.equal(B.createParley(e.parleyAhead('left')).game.view.signals.bond, -17.25);
  const thesis = fresh('thesis_margin_notes', 'right');
  thesis.e.s.tracks.thesis = { kind: 'thesis', status: 'member', progress: 73.25, perf: 91 };
  assert.equal(B.createParley(thesis.e.parleyAhead('right')).game.view.signals.record, 73.25);
  const { req } = fresh('bram_father_visit'); const p = B.createParley(req), v = p.game.view;
  assert.equal(B.setupOf(req).campaign.signals.bond, null);
  assert.ok(!v.table.concat(v.deck).some((x) => x.signal === 'bond' || x.signal === 'record'));
  assert.equal(v.crux.signal, 'charm', 'a missing bond uses the circumstance skill lean');
});

test('lookahead respects branches and pre-negotiation spending and leaves the real run untouched', () => {
  const { e } = fresh('tavern_festival_room', 'right'); const before = e.save();
  const req = e.parleyAhead('right');
  assert.ok(req.player.gold < e.s.vals.gold);
  assert.equal(e.save(), before);
  const practical = fresh('y3_interview_practical'); practical.e.s.flags.career_circus = true;
  const circus = practical.e.parleyAhead('left');
  delete practical.e.s.flags.career_circus;
  const teaching = practical.e.parleyAhead('left');
  assert.notEqual(circus.id, teaching.id); assert.equal(circus.using, null); assert.equal(teaching.using, 'lore');
});

test('only satisfied story conditions are playable facts', () => {
  const { e } = fresh('ledger_quill_interview'); e.s.flags.quickquill_ink = true;
  const req = e.parleyAhead('left'), v = B.createParley(req).game.view;
  assert.equal(req.facts.length, 1); assert.equal(v.facts.length, 1);
  assert.equal(v.facts[0].text, N.factLabel('flag(quickquill_ink)'));
  assert.ok(!v.facts.some((f) => /flag\(|clue\(/.test(f.text)));
});

test('scaled non-Mana transfers are paid as shown, preserve fractions, and settle without rebates', () => {
  const { e } = fresh(); e.s.spells = { sleight: 1, flame: 1 };
  const req = e.parleyAhead('left'), p = B.createParley(req), v = p.game.view;
  const cost = v.spells.find((s) => s.id === 'sleight').cost;
  assert.equal(cost, C.spells.spells.sleight.cost[0]);
  p.game.play('cast:sleight'); p.game.play('leave');
  const res = B.parleyResult(p);
  assert.equal(res.deltas.mana, -cost); assert.equal(res.deltas.alignment, -1);
  assert.equal(res.deltas.gold, Math.ceil(C.core.statics.tune.steal[0] * 0.6));
  const before = { ...e.s.vals }; const out = e.choose('left', { parleys: [res] });
  assert.equal(e.s.vals.mana, before.mana - cost);
  assert.equal(e.s.vals.alignment, before.alignment - 1);
  assert.ok(out.checks.some((c) => c.parley && c.played && c.result === 'lose'));
  assert.throws(() => e.choose('left', { parleys: [res] }), /no current card/);
});

test('a result for another request is refused', () => {
  const { e, req } = fresh(); assert.throws(() => e.choose('left', { parleys: [{ request: req.id + 'x', outcome: 'win' }] }), /handed to/);
});

test('a negotiation resumes from setup and moves with identical complete state and settlement', () => {
  const { e } = fresh(); e.s.spells = { foresight: 1 }; const p = B.createParley(e.parleyAhead('left'));
  p.game.play('cast:foresight'); p.game.play('deflect:' + p.game.view.table[0].uid);
  const saved = JSON.parse(JSON.stringify(B.snapshot(p))); const resumed = B.resume(saved);
  assert.deepEqual(resumed.game.view, p.game.view);
  p.game.autoplay(); resumed.game.autoplay();
  assert.deepEqual(resumed.game.view, p.game.view); assert.deepEqual(B.parleyResult(resumed), B.parleyResult(p));
  assert.throws(() => B.resume({ ...saved, rules: 'old' }), /different Crux version/);
});

test('every registered encounter creates and finishes under actual campaign inputs, including alternative challenges', () => {
  const e = fresh().e; let n = 0;
  for (const event of Object.values(content.events)) for (const option of event.options) {
    e.s.cur = { id: event.id, actor: event.actor || null, track: event.track || null };
    e._optKey = option.key; e._optEffects = option.effects;
    G.walkEffects(option.effects, (st) => {
      if (st.t !== 'challenge' || st.kind !== 'negotiate') return;
      const req = e.parleyRequest(st, e.newCtx(event.actor || null, null, event.id));
      const p = B.createParley(req); p.game.autoplay();
      assert.ok(['win', 'partial', 'lose'].includes(B.parleyResult(p).outcome), req.id); n++;
    });
  }
  assert.equal(n, 65);
});
