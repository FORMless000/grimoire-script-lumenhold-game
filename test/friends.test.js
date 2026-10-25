// Two tracks for people (design §5.5): you find them (shared pools, and encounters where they are) and they find you
// (each character's own monthly roll, driven by warmth = recent, chosen contact). These run against the real content.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../src/engine.js');
const { content, quiet } = require('./helpers.js');

// The start of a term month (its day not yet played), with the given characters met.
function atMap(seed, met, setup) {
  const eng = new Engine(content);
  quiet(() => {
    let r = eng.newGame({ seed, name: 'T' });
    for (let i = 0; i < 400 && !(r.kind === 'month' && eng.s.turn >= 3 && eng.phaseOf() === 'term'); i++) {
      if (r.kind === 'map') { eng.pickPlaces([]); r = eng.advance(); continue; }
      if (r.kind === 'card') { if (r.view.pick > 1) eng.chooseMany([r.view.options[0].key]); else eng.choose(r.view.options[0].key); }
      r = eng.advance();
    }
  });
  for (const id of met) eng.s.npcs[id].met = true;
  if (setup) setup(eng.s, eng);
  return eng;
}
// The day is filled slot by slot (M1): fill all of today's slots (visiting `place` at the first visit it's open for,
// else staying in) to see all its cards.
function finishDay(eng, place) {
  quiet(() => {
    for (let i = 0; i < 30 && eng.s.day && !eng.s.day.done; i++) {
      if (eng.s.day.phase === 'pick' || eng.stepDay() === 'pick') {
        const v = eng.mapView(), p = place && v.places.find((x) => x.id === place && x.state === 'open' && x.open[0]);
        eng.pickPlaces([p ? place : null]); if (p) place = null;
      }
    }
  });
  return eng;
}
const fromFriends = (eng) => finishDay(eng).s.deck.filter((d) => d.src === 'friend');

test('friends: a warm character finds you on their own roll, a cold one rarely does', () => {
  let warm = 0, cold = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const a = atMap(seed, ['tobias'], (s) => { s.npcs.tobias.warmth = 100; s.npcs.tobias.rel = 40; });
    finishDay(a);
    if (fromFriends(a).some((d) => d.actor === 'tobias')) warm++;
    const b = atMap(seed, ['tobias'], (s) => { s.npcs.tobias.warmth = 0; s.npcs.tobias.rel = 0; });
    finishDay(b);
    if (fromFriends(b).some((d) => d.actor === 'tobias')) cold++;
  }
  assert.ok(warm >= 18, 'warm: ' + warm + '/30');
  assert.ok(cold <= 6, 'cold: ' + cold + '/30');
});

test('friends: at most `cap` friend cards a month, one per character', () => {
  const all = Object.keys(content.npcs);
  for (let seed = 1; seed <= 10; seed++) {
    const eng = atMap(seed, all, (s) => { for (const id of all) { s.npcs[id].warmth = 100; s.npcs[id].rel = 50; } });
    const f = fromFriends(eng);
    assert.ok(f.length <= eng.FRIENDS.cap);
    assert.equal(new Set(f.map((d) => d.actor)).size, f.length);
  }
});

test('friends: engaging warms, brushing off cools, and warmth fades monthly', () => {
  const eng = atMap(1, ['tobias']);
  eng.s.npcs.tobias.warmth = 50;
  eng.noteContact({ actor: 'tobias' }, { tobias: 1 });
  assert.equal(eng.s.npcs.tobias.warmth, 50 + eng.FRIENDS.engage);
  eng.noteContact({ actor: 'tobias' }, {});
  assert.equal(eng.s.npcs.tobias.warmth, 50 + eng.FRIENDS.engage - eng.FRIENDS.cool);
  // a gain at the rel cap still counts as engaging
  eng.s.npcs.tobias.rel = 100;
  quiet(() => eng.run([{ t: 'rel', npc: 'tobias', tier: 'small', sign: 1 }], Object.assign(eng.newCtx(null, null), {})));
  const before = eng.s.npcs.tobias.warmth;
  quiet(() => eng.startDay());   // a new day: warmth fades
  assert.ok(eng.s.npcs.tobias.warmth <= Math.floor(before * eng.FRIENDS.fade) + eng.FRIENDS.presence * 2);
});

test('friends: visiting where someone is warms them (track 1)', () => {
  const place = Object.values(content.places).find((p) => (content.npcs.tobias.schedule || []).some((x) => x.place === p.id && x.slots.includes('afternoon')));
  assert.ok(place, 'tobias has an afternoon place');
  let warmed = 0;
  for (let seed = 1; seed <= 10; seed++) {
    const eng = atMap(seed, ['tobias'], (s) => { s.npcs.tobias.warmth = 0; s.places[place.id] = { found: 1 }; });
    finishDay(eng, place.id);
    if (eng.s.npcs.tobias.warmth >= eng.FRIENDS.presence) warmed++;
  }
  assert.ok(warmed > 0);
});

test('friends: `seeks: rarely` comes only once you have been coming to them', () => {
  const eng = atMap(1, ['vey', 'tobias']);
  for (const id of ['vey', 'tobias']) { eng.s.npcs[id].warmth = 20; eng.s.npcs[id].rel = 40; }
  assert.equal(eng.pull('vey'), 0, 'below the rarely threshold');
  assert.ok(eng.pull('tobias') > 0);
  eng.s.npcs.vey.warmth = 60;
  assert.ok(eng.pull('vey') > 0 && eng.pull('vey') < eng.pull('tobias') + 40 * 0.6, 'scaled down');
});

test('tracks: enrolling pushes the lead\'s intro (N1), or meets an already-met lead; the lead\'s regard is the advisor modifier (±15)', () => {
  const eng = atMap(2, []);
  eng.s.npcs.brask.met = false;
  quiet(() => eng.run([{ t: 'enrol', track: 'beastcraft' }], eng.newCtx(null, null)));
  assert.ok(!eng.s.npcs.brask.met, 'met on the intro card, not at enrolment');
  const q = eng.s.deck.find((x) => x.id === 'brask_intro');
  assert.ok(q && q.actor === 'brask' && q.track === 'beastcraft', 'the intro is pushed with the lead, in the track\'s context');
  quiet(() => eng.run([{ t: 'enrol', track: 'beastcraft' }], eng.newCtx(null, null)));
  assert.equal(eng.s.deck.concat(eng.s.queue).filter((x) => x.id === 'brask_intro').length, 1, 'pushed once');
  eng.s.npcs.brask.met = true;
  eng.s.npcs.brask.rel = 50; assert.equal(eng.advisorBonus('beastcraft'), 10);
  eng.s.npcs.brask.rel = 100; assert.equal(eng.advisorBonus('beastcraft'), 15);
  eng.s.npcs.brask.rel = -40; assert.equal(eng.advisorBonus('beastcraft'), -8);
  assert.equal(eng.advisorBonus('astromancy'), 0, 'no lead');
});

// A zh-CN playtest (2026-10-20): Vey taught the start card and a routine Illusion card before her own intro.
test('tracks: the lead\'s intro plays before the course\'s start card and its routine cards; one that can\'t play yet waits in the queue', () => {
  const eng = atMap(2, []);
  eng.s.npcs.vey.met = false;
  quiet(() => eng.run([{ t: 'enrol', track: 'illusion' }], eng.newCtx(null, null)));
  finishDay(eng);
  const ids = eng.s.deck.map((x) => x.id), intro = ids.indexOf('vey_intro');
  assert.ok(intro >= 0, 'the intro is in today\'s deck');
  assert.ok(intro < ids.indexOf('illu_first_glamour'), 'before the start card: ' + ids.join(' '));
  eng.s.deck.forEach((x, i) => { if (x.track === 'illusion' && x.id !== 'vey_intro') assert.ok(i > intro, x.id + ' comes after the intro'); });
  // tobias_intro's `when` needs turn >= 2: joining in month 1 queues it for later instead of dropping it.
  const early = atMap(3, []);
  early.s.npcs.tobias.met = false; early.s.turn = 1;
  quiet(() => early.run([{ t: 'join', track: 'verdant' }], early.newCtx(null, null)));
  assert.ok(!early.s.deck.some((x) => x.id === 'tobias_intro') && early.s.queue.some((x) => x.id === 'tobias_intro'), 'queued');
});

test('appeals (N4): a failed course pushes @game appeal in its context; regrade turns the F into a C and teaches the level', () => {
  const eng = atMap(2, []);
  quiet(() => eng.run([{ t: 'enrol', track: 'evocation' }], eng.newCtx(null, null)));
  eng.s.spells = {};
  eng.examOdds = () => ({ skills: ['arcana'], value: 0, bar: 99, pass: 0, top: 0, probs: [0, 0, 0, 100] });
  const ctx = eng.newCtx(null, null);
  quiet(() => eng.sitExam('evocation', null, ctx));
  const t = eng.trackState('evocation');
  assert.equal(t.status, 'failed');
  assert.ok(!(eng.s.spells.flame > 0), 'an F teaches nothing');
  const q = eng.s.queue.find((x) => x.id === content.game.appeal);
  assert.ok(q && q.track === 'evocation', 'the appeal is queued in the course\'s context');
  const ctx2 = eng.newCtx(null, null); ctx2.track = 'evocation';
  quiet(() => eng.run([{ t: 'regrade', track: 'track', grade: 'C' }], ctx2));
  assert.equal(t.grades[t.grades.length - 1], 'C');
  assert.equal(t.status, 'done');
  assert.ok(eng.s.spells.flame >= 1, 'a pass on appeal teaches the level\'s spells');
  assert.ok(ctx2.notes.some((n) => n.kind === 'regrade' && n.from === 'F' && n.grade === 'C'));
});

test('course standing (step 5): an enrolled course shows preparation, months to the exam and today\'s odds', () => {
  const eng = atMap(2, []);
  quiet(() => eng.run([{ t: 'enrol', track: 'evocation' }], eng.newCtx(null, null)));
  eng.trackState('evocation').study = 40;
  const tr = eng.snapshot().tracks.find((x) => x.id === 'evocation');
  assert.equal(tr.studyCap, eng.studyRule().cap);
  assert.equal(tr.study, tr.studyCap, 'capped like the exam counts it');
  const o = eng.examOdds('evocation', null);
  assert.equal(tr.pass, o.pass); assert.equal(tr.top, o.top);
  let n = 0; for (let k = eng.s.turn; eng.phaseOf(k) === 'term' && !eng.isTermEnd(k); k++) n++;
  assert.equal(tr.examIn, n);
  assert.ok(eng.isTermEnd(eng.s.turn + tr.examIn), 'counts to the term\'s last month');
});

test('casting: peer-only premises never cast faculty or villagers', () => {
  const { content: c } = { content };
  const eng = atMap(3, Object.keys(c.npcs), (s) => { for (const n of Object.values(s.npcs)) { n.rel = 60; n.bond = 'friend'; } });
  for (const id of ['soc_secret', 'soc_village_trip', 'soc_become_close', 'soc_borrow_money', 'soc_gift_given']) {
    for (let k = 0; k < 20; k++) {
      const cast = eng.fillCast(c.events[id]);
      if (!cast) continue;
      for (const who of Object.values(cast)) assert.ok((c.npcs[who].tags || []).includes('peer'), id + ' cast ' + who);
    }
  }
});
