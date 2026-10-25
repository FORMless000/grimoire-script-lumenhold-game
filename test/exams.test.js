// Exams made manageable (2026-10-19): class preparation each month before the exam (+3, or +5 with a check won in that
// class, once a month per course), the library's revision card (+3 a term), and preparation floors on the exam's odds
// (12 a sure pass, 15 a sure B), so two won class checks or one library afternoon always pass.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../src/engine.js');
const { content, silent } = require('./helpers.js');

const COURSE = 'evocation';
// A new game on turn `turn` (1–3: term months before the exam; 4: the exam month), enrolled in Evocation I.
function fresh(turn = 1) {
  const eng = new Engine(content);
  silent(() => eng.newGame({ seed: 7, name: 'T', origin: 'street' }));
  eng.s.turn = turn;
  eng.s.tracks[COURSE] = { kind: 'course', status: 'enrolled', level: 1, study: 0, passed: {}, grades: [], rank: 0, perf: 50, rankXp: 0, visits: 0, due: 0, progress: 0 };
  return eng;
}
const study = (eng) => eng.s.tracks[COURSE].study;

test('class preparation: +3 a month before the exam, once however many cards, none in the exam month', () => {
  const eng = fresh(1);
  for (let i = 0; i < 3; i++) eng.courseworkFor(COURSE, eng.newCtx(null, null, null));
  assert.equal(study(eng), 3);
  const exam = fresh(4);
  exam.courseworkFor(COURSE, exam.newCtx(null, null, null));
  assert.equal(study(exam), 0, 'the exam month adds no class preparation');
});

test('a check won in class makes that month +5, once a month per course', () => {
  const eng = fresh(2), ctx = eng.newCtx(null, null, null);
  eng.courseworkFor(COURSE, ctx);
  ctx.checks.push({ challenge: 'research', result: 'win', ok: true });
  eng.classCheckPrep(COURSE, ctx); eng.classCheckPrep(COURSE, ctx);
  assert.equal(study(eng), 5);
  const lost = fresh(2), c2 = lost.newCtx(null, null, null);
  lost.courseworkFor(COURSE, c2); c2.checks.push({ challenge: 'research', result: 'lose', ok: false }); lost.classCheckPrep(COURSE, c2);
  assert.equal(study(lost), 3, 'a failed check keeps the guaranteed 3');
});

test('exam floors: 12 prepared is a sure pass and 15 a sure B, however weak the skill; the odds rise smoothly', () => {
  const eng = fresh(4);
  eng.s.vals.arcana = 1;
  const at = (p) => { eng.s.tracks[COURSE].study = p; return eng.examOdds(COURSE, 'steady'); };
  assert.equal(at(12).pass, 100);
  assert.equal(at(15).top, 100);
  let prev = -1;
  for (let p = 0; p <= 15; p++) { const o = at(p); assert.ok(o.pass >= prev, 'pass rises with preparation at ' + p); assert.ok(o.pass - prev <= 30 || prev < 0, 'no cliff at ' + p); prev = o.pass; }
  assert.ok(at(9).pass < 100, 'the guaranteed 9 alone is not a sure pass');
});

test('two won class checks, or one library afternoon, on top of the class months make a sure pass', () => {
  const months = (eng, wins) => {
    for (let turn = 1; turn <= 3; turn++) {
      eng.s.turn = turn;
      const ctx = eng.newCtx(null, null, null);
      eng.courseworkFor(COURSE, ctx);
      if (turn <= wins) { ctx.checks.push({ challenge: 'research', result: 'win', ok: true }); eng.classCheckPrep(COURSE, ctx); }
    }
    eng.s.turn = 4; eng.s.vals.arcana = 1;
    return eng.examOdds(COURSE, 'steady').pass;
  };
  assert.equal(months(fresh(1), 2), 100);
  const lib = fresh(1);
  lib.s.turn = 2;
  lib.run(content.events.library_revision.options.find((o) => o.key === 'left').effects, lib.newCtx(null, null, null));
  assert.equal(study(lib), 3, 'the revision card adds 3 to every enrolled course');
  assert.equal(months(lib, 0), 100);
});

test('the library revision card: first on a term visit before exam month, once a term', () => {
  assert.ok(String(content.places.library.always).split(/[\s|]+/).includes('library_revision'));
  const eng = fresh(2), ev = content.events.library_revision;
  assert.ok(eng.test(ev.when), 'open in a term month before the exam');
  eng.run(ev.options.find((o) => o.key === 'right').effects, eng.newCtx(null, null, null));
  assert.ok(!eng.test(ev.when), 'once a term, whichever option');
  assert.ok(!fresh(4).test(ev.when), 'not in the exam month');
});
