// Phase 3, step 0: the last format additions before the schema v1 freeze (study, visits_to, runs_completed).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/grimoire.js');
const Engine = require('../src/engine.js');
const Policies = require('../tools/policies.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');

const { content } = project(ROOT).compileAll();
const quiet = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };
const runLines = (eng, lines) => { const d = G.parseFile('@hook t\non: month_end\ndo:\n  ' + lines.join('\n  '), 't'); const ctx = eng.newCtx(null); eng.run(d[0].do, ctx); return ctx; };
const expr = (src) => G.expr(src, 'test', 1);

test('study: adds exam preparation to one course or every enrolled course, capped at 15', () => {
  const eng = new Engine(content); quiet(() => eng.newGame({ seed: 3 }));
  runLines(eng, ['enrol evocation 1', 'enrol duelling_theory 1'].filter((l) => content.tracks[l.split(' ')[1]]));
  const ctx = runLines(eng, ['study evocation +3']);
  assert.equal(eng.s.tracks.evocation.study, 3);
  assert.equal(ctx.deltas['study:evocation'], 3);
  runLines(eng, ['study +20']);
  for (const t of Object.values(eng.s.tracks)) if (t.status === 'enrolled') assert.equal(t.study, 15);
  runLines(eng, ['study evocation -small']);
  assert.ok(eng.s.tracks.evocation.study < 15);
});

test('visits_to(place) counts every picked visit; runs_completed comes from newGame', () => {
  const eng = new Engine(content);
  let r = quiet(() => eng.newGame({ seed: 5, runsCompleted: 2 }));
  assert.equal(eng.env().ident('runs_completed'), 2);
  const style = Policies.get('balanced');
  let picked = null;
  quiet(() => { for (let i = 0; i < 400 && !picked; i++) {
    if (r.kind === 'ending') break;
    if (r.kind === 'month') { r = eng.advance(); continue; }
    if (r.kind === 'map') { const ids = (style.pickPlaces || Policies.pickPlaces)(eng, r.view); eng.pickPlaces(ids); picked = ids.filter(Boolean); break; }
    const v = r.view;
    if (v.pick > 1) { const o = v.options.filter((x) => !x.disabled && x.key !== 'none'); const k = Policies.pickMany(eng, v, o); eng.choose(k.length ? k : [v.options.find((x) => !x.disabled).key]); }
    else eng.choose(style.pick(eng, v));
    r = eng.advance();
  } });
  assert.ok(picked && picked.length, 'reached a map');
  const id = picked[0];
  assert.equal(eng.s.visitsTo[id], picked.filter((x) => x === id).length);
  assert.equal(eng.test(expr('visits_to(' + id + ') >= 1'), null), true);
});
