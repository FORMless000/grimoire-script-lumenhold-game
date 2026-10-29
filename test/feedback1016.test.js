// The 2026-10-16 feedback round (docs/feedback-2026-10-16-plan.md): a pushed card rechecks its cast, midnight is never
// a shift, `@place always:` lists with groups and slots, and `queue any tagged`.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/grimoire.js');
const Engine = require('../src/engine.js');
const { reach } = require('../tools/reach.js');
const { content, sources, quiet } = require('./helpers.js');

const fresh = (c = content, seed = 5) => { const eng = new Engine(c); quiet(() => eng.newGame({ seed, name: 'T', origin: 'street' })); return eng; };

// Fills one visit slot at `place` directly (the director's own fill), as the day would after the pick.
function visit(eng, place, slot) {
  const rec = eng.recipe(), at = rec.findIndex((r) => r.slot === slot), opened = rec[at].source !== 'visit';
  eng.s.day = { v: 2, phase: 'slots', at, stage: 1, picks: [], nextPicks: [], used: [], items: [], withToday: [], pushed: [], spread: {}, count: 0, extraVisit: opened ? slot : undefined };
  eng.s.day.picks = Array(eng.visitIndex(at)).fill(null).concat([place]);
  const r = opened ? Object.assign({}, rec[at], { source: 'visit', min: 1, max: 1, opened: true }) : rec[at];
  return quiet(() => eng.fillSlot(r));
}

test('1.1 a pushed card rechecks its cast: cooling the spark drops a confession pushed for tonight', () => {
  const tryShow = (spark) => {
    const eng = fresh();
    const n = eng.s.npcs.kael; n.met = 1; n.rel = 30; n.spark = 38;
    const cast = eng.fillCast(content.events.soc_confess_generic, { npc: 'kael' });
    assert.ok(cast, 'Kael can be cast while the spark is up');
    n.spark = spark;   // the morning's "Let it cool"
    eng.s.day = null; eng.s.cur = null;
    eng.s.deck = [{ id: 'soc_confess_generic', actor: 'kael', cast, src: 'pushed' }];
    const r = quiet(() => eng.advance());
    return r.kind === 'card' && r.view.id === 'soc_confess_generic';
  };
  assert.equal(tryShow(38), true, 'still warm: the confession shows');
  assert.equal(tryShow(0), false, 'cooled: the confession is dropped');
});

test('1.2 a midnight visit to your own job place is not a shift and brings no off-shift hint', () => {
  const eng = fresh();
  eng.s.flags.night_unlocked = true; eng.s.places.gilded_newt = { found: 1 };
  quiet(() => eng.run([{ t: 'join', track: 'tavern' }], eng.newCtx(null, null)));
  const t = eng.s.tracks.tavern; t.visits = t.due || 3;   // this term's shifts are done
  const before = JSON.stringify(t);
  const rec = eng.recipe(), at = rec.findIndex((r) => r.slot === 'midnight');
  eng.s.day = { v: 2, phase: 'pick', at, stage: 1, picks: [null, null], nextPicks: [], used: [], items: [], withToday: [], pushed: [], spread: {}, count: 0, extraVisit: 'midnight' };
  const out = quiet(() => eng.pickPlaces(['gilded_newt']));
  assert.equal(JSON.stringify(eng.s.tracks.tavern), before, 'no attendance, pay or rank at midnight');
  assert.ok(!out.deltas.gold, 'no shift pay');
  assert.ok(!(eng.s.day.offDuty || []).length, 'not off duty either: it is no shift at all');
  const items = quiet(() => eng.fillSlot(Object.assign({}, rec[at], { source: 'visit', min: 1, max: 1, opened: true })));
  assert.ok(!items.some((x) => x.id === content.game.off_shift), 'no off-shift hint');
});

const EXTRA = `
@place t_inn
name: Test Inn
map: campus 10,10
open: afternoon midnight
always: t_day t_mid t_ga|t_gb t_late

@event t_day
place: t_inn
title: Day
text: d
> ok: Go
  mood +tiny

@event t_mid
place: t_inn
slot: midnight
title: Mid
when: not flag(t_mid_off)
text: m
> ok: Go
  mood +tiny

@event t_ga
place: t_inn
slot: midnight
title: A
when: not flag(t_ga_off)
text: a
> ok: Go
  mood +tiny

@event t_gb
place: t_inn
slot: midnight
title: B
when: not flag(t_gb_off)
text: b
> ok: Go
  mood +tiny

@event t_late
place: t_inn
slot: midnight
title: Late
text: l
> ok: Go
  queue any tagged t_pool now

@event t_drawn
place: t_inn
slot: midnight
title: Drawn
text: x
> ok: Go
  queue any tagged t_pool in 2

@event t_pa
trigger: queued
tags: t_pool
title: PA
when: not flag(t_pa_off)
text: pa
> ok: Go
  mood +tiny

@event t_pb
trigger: queued
tags: t_pool
title: PB
when: not flag(t_pb_off)
text: pb
> ok: Go
  mood +tiny
`;
const compiled = G.compile(sources.concat([{ path: 't.grim', text: EXTRA }]));

test('2.1 @place always: listed cards in order, a group plays one, slots filter, one drawn card follows', () => {
  assert.deepEqual(compiled.errors.map((e) => e.message), []);
  const c2 = compiled.content;
  const eng = fresh(c2); eng.s.places.t_inn = { found: 1 };
  const night = visit(eng, 't_inn', 'midnight').map((x) => x.id);
  assert.deepEqual(night.slice(0, 3).map((id) => id.replace(/t_g[ab]/, 't_g?')), ['t_mid', 't_g?', 't_late'], 'in order; t_day has no slot, so not at midnight');
  assert.equal(night.length, 4, 'one drawn card after the fixed ones');
  assert.equal(night[3], 't_drawn');
  const seen = new Set();
  for (let seed = 1; seed < 30; seed++) { const e = fresh(c2, seed); e.s.places.t_inn = { found: 1 }; seen.add(visit(e, 't_inn', 'midnight')[1].id); }
  assert.deepEqual([...seen].sort(), ['t_ga', 't_gb'], 'the group draws either member');
  eng.s.flags.t_ga_off = true; eng.s.flags.t_mid_off = true;
  assert.deepEqual(visit(eng, 't_inn', 'midnight').map((x) => x.id).slice(0, 2), ['t_gb', 't_late'], 'a failed `when` is skipped; the group falls to its eligible member');
  const day = visit(eng, 't_inn', 'afternoon').map((x) => x.id);
  assert.equal(day[0], 't_day', 'by day only the slotless card');
  assert.ok(!day.some((id) => ['t_mid', 't_ga', 't_gb', 't_late'].includes(id)), 'midnight cards stay at midnight');
  // The Job Board's single entry keeps its meaning: its menu first, then one gig.
  const jb = fresh(); jb.s.places.job_board = { found: 1 };
  const board = visit(jb, 'job_board', 'afternoon').filter((x) => x.prio !== 'social').map((x) => x.id);
  assert.equal(board[0], 'job_board_visit'); assert.ok(board.length <= 2);
});

test('2.2 queue any tagged: draws one eligible pool card now, later when due, nothing from an empty pool', () => {
  const c2 = compiled.content;
  const run = (eng, id) => { eng.s.cur = { id, actor: null }; quiet(() => eng.choose('ok')); };
  const eng = fresh(c2); eng.s.day = null; eng.s.deck = [];
  run(eng, 't_late');
  assert.equal(eng.s.deck.length, 1); assert.ok(['t_pa', 't_pb'].includes(eng.s.deck[0].id), 'now: a pool card is next');
  eng.s.deck = []; eng.s.flags.t_pa_off = true;
  run(eng, 't_late'); assert.equal(eng.s.deck[0].id, 't_pb', 'only the eligible one');
  eng.s.deck = []; eng.s.flags.t_pb_off = true;
  run(eng, 't_late'); assert.equal(eng.s.deck.length, 0, 'empty pool: nothing queued');
  // later: the item waits with no id and is drawn when it falls due
  delete eng.s.flags.t_pb_off; eng.s.queue = [];
  run(eng, 't_drawn');
  const q = eng.s.queue.find((x) => x.tagged === 't_pool');
  assert.ok(q && q.id == null && q.due === eng.s.turn + 2);
  eng.s.flags.t_pa_off = true; eng.s.turn += 2; eng.s.deck = [];
  quiet(() => eng.startDay());
  assert.ok(eng.s.day.pushed.some((p) => p.id === 't_pb'), 'drawn when due, from what is eligible then');
  // reach and lint see the pool
  const R = reach(c2);
  assert.ok(!R.unreachable.some((u) => ['t_pa', 't_pb'].includes(u.id)), 'the pool is reachable through the queue');
  assert.equal(G.compile(sources.concat([{ path: 't.grim', text: '@event t_x\ntitle: X\ntext: x\n> ok: Go\n  queue any tagged no_such_pool now\n' }])).errors.length, 0, 'parses; lint reports the empty pool');
});

test('3.1 a Newt night: the company offer, then the high table; accepting deals a company night next', () => {
  const eng = fresh(); eng.s.flags.night_unlocked = true; eng.s.places.gilded_newt = { found: 1 };
  const ids = visit(eng, 'gilded_newt', 'midnight').map((x) => x.id);
  assert.deepEqual(ids.slice(0, 2), ['newt_company', 'newt_high_table']);
  assert.ok(!ids.includes('midnight_newt_cards'), 'the stub is retired');
  eng.s.day = null; eng.s.deck = []; eng.s.cur = { id: 'newt_company', actor: null };
  quiet(() => eng.choose('left'));
  assert.ok(eng.s.flags.newt_regular);
  assert.ok((content.events[eng.s.deck[0].id].tags || []).includes('company_night'), 'a company night is next: ' + eng.s.deck[0].id);
  const again = visit(eng, 'gilded_newt', 'midnight').map((x) => x.id);
  assert.deepEqual(again.slice(0, 2), ['newt_company_regular', 'newt_high_table'], 'a regular gets the regular offer');
  // refusing rests the offer for a few months
  eng.s.cur = { id: 'newt_company_regular', actor: null }; eng.s.last.newt_company_regular = eng.s.turn; quiet(() => eng.choose('right'));
  assert.equal(visit(eng, 'gilded_newt', 'midnight')[0].id, 'newt_high_table', 'refused: straight to the table');
  eng.s.turn += 3;
  assert.equal(visit(eng, 'gilded_newt', 'midnight')[0].id, 'newt_company_regular', 'back after the rest');
});

test('3.2 a boathouse night: a ring card first, then one drawn card; wins lead on, last-standing nights cost a forfeit to leave', () => {
  const eng = fresh(); eng.s.flags.night_unlocked = true; eng.s.places.boathouse = { found: 1 };
  eng.s.flags.grisk_contact = true;
  for (let seed = 1; seed < 8; seed++) {
    const e = fresh(undefined, seed); e.s.flags.night_unlocked = true; e.s.places.boathouse = { found: 1 }; e.s.flags.grisk_contact = true;
    const ids = visit(e, 'boathouse', 'midnight').map((x) => x.id);
    assert.ok(['midnight_boathouse_ring', 'ring_on_yourself'].includes(ids[0]), 'the ring first: ' + ids.join(','));
    assert.ok(!ids.slice(1).some((id) => ['midnight_boathouse_ring', 'ring_on_yourself'].includes(id)), 'only one ring card');
  }
  // not tonight: the side bets; on a last-standing night walking out costs a forfeit
  eng.s.day = null; eng.s.deck = []; eng.s.cur = { id: 'midnight_boathouse_ring', actor: null };
  quiet(() => eng.choose('right'));
  assert.equal(eng.s.deck[0].id, 'ring_side_bets');
  eng.s.flags.ring_last_standing = true;
  eng.s.cur = { id: 'ring_bout_2', actor: null };
  assert.deepEqual(eng.view(eng.s.cur).options.filter((o) => !o.disabled).map((o) => o.key), ['left', 'right'], 'never soft-locked');
  const gold = eng.s.vals.gold;
  quiet(() => eng.choose('right'));
  assert.ok(!eng.s.flags.ring_last_standing, 'the forfeit ends the last-standing night');
  assert.ok(eng.s.vals.gold < gold, 'and costs gold');
  eng.s.cur = { id: 'ring_bout_2', actor: null };
  assert.deepEqual(eng.view(eng.s.cur).options.filter((o) => !o.disabled).map((o) => o.key), ['left', 'right']);
});
