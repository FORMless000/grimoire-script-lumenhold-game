#!/usr/bin/env node
// Exam grade odds (feedback 2026-10-15): for each margin of skill over an exam's bar, the A/B/C/F chances and the
// expected grade points of answering carefully (`sit_exam steady`) and of going for top marks (`sit_exam wild`), from
// the engine's own examOdds and `@balance exam_bands`.
//   node tools/exam-odds.js [--from -15] [--to 30] [--step 5]
'use strict';
const Engine = require('../src/engine.js');
const { project } = require('./project.js');
const path = require('path');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? +process.argv[i + 1] : d; };
const FROM = arg('from', -15), TO = arg('to', 30), STEP = arg('step', 5);
const { content } = project(path.join(__dirname, '..')).compileAll();
const course = Object.values(content.tracks).find((t) => t.kind === 'course');
const eng = new Engine(content);
const w0 = console.warn; console.warn = () => {};
eng.newGame({ seed: 1, name: 'Exam' });
console.warn = w0;
eng.s.tracks[course.id] = { kind: 'course', status: 'enrolled', level: 1, study: 0, passed: {}, grades: [], rank: 0, perf: 50, rankXp: 0, visits: 0 };
const skills = eng.trackSkills(course.id);
const at = (margin, swing) => {
  for (const k of skills) eng.s.vals[k] = 0;
  const bar = eng.examOdds(course.id, swing).bar;
  for (const k of skills) eng.s.vals[k] = bar + margin;
  return eng.examOdds(course.id, swing).probs;
};
const gp = (p) => (4 * p[0] + 3 * p[1] + 2 * p[2]) / 100;
const cell = (p) => p.map((x) => String(x).padStart(3)).join(' ') + '  ' + gp(p).toFixed(2);
console.log('margin │ careful   A   B   C   F    GP │ top marks  A   B   C   F    GP │ ΔA  ΔF   ΔGP');
for (let m = FROM; m <= TO; m += STEP) {
  const c = at(m, 'steady'), w = at(m, 'wild');
  const d = (i) => (w[i] - c[i] >= 0 ? '+' : '') + (w[i] - c[i]);
  console.log(String(m >= 0 ? '+' + m : m).padStart(6) + ' │        ' + cell(c) + ' │          ' + cell(w) + ' │ ' + d(0).padStart(3) + ' ' + d(3).padStart(3) + ' ' + (gp(w) - gp(c) >= 0 ? '+' : '') + (gp(w) - gp(c)).toFixed(2));
}
