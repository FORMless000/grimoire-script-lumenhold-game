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

test('dupes: a copied event is flagged, the real content has no near-duplicates', () => {
  const D = require('../tools/dupes.js');
  assert.deepEqual(D.dupes(content), []);
  const c2 = Object.assign({}, content, { events: Object.assign({}, content.events, { copy: Object.assign({}, content.events.evo_first_spark, { id: 'copy' }) }) });
  const d = D.dupes(c2, { only: new Set(['copy']) });
  assert.equal(d.length, 1);
  assert.ok(d[0].score > 0.9);
});

test('report --gaps: a row for every draw source, and usage from run histories', () => {
  const R = require('../tools/report.js');
  const rows = R.pools(content);
  for (const p of Object.values(content.places)) if (p.kind !== 'internship') assert.ok(rows.find((r) => r.kind === 'place' && r.id === p.id), p.id);
  for (const t of Object.values(content.tracks)) if (t.kind === 'club' || t.kind === 'job') assert.ok(rows.find((r) => r.id === t.id), t.id);
  assert.ok(rows.find((r) => r.kind === 'plan' && r.id === 'castle'));
  const run = { hist: [{ t: 'pick', turn: 3, picks: ['courtyard', 'library'] }, { t: 'card', turn: 3, month: 3, id: 'x', slot: 'afternoon', place: 'courtyard' }] };
  const u = R.usage(content, [run]);
  assert.equal(u.visits, 2);
  assert.equal(u.empty, 1);
  assert.equal(u.places.library.empty, 1);
});

test('text variation: a colon inside {~…} or {&…} is text, not a condition', () => {
  const eng = new Engine(content); quiet(() => eng.newGame({ seed: 2 }));
  const out = eng.interp('{~Note: it hums.|Note: it hums.}', null, 'x');
  assert.equal(out, 'Note: it hums.');
  assert.deepEqual(G.textTokens('{~Note: a|b}').conds, []);
  assert.deepEqual(G.textTokens('{final_year: a|b}').conds, ['final_year']);
});

test('slot: a when on slot sees the slot being drawn, not the previous card', () => {
  const eng = new Engine(content); quiet(() => eng.newGame({ seed: 4 }));
  eng.s.cur = { id: 'x', slot: 'morning' };
  eng._slot = 'evening';
  assert.equal(eng.env().ident('slot'), 'evening');
  eng._slot = null;
  assert.equal(eng.env().ident('slot'), 'morning');
});

// grim reach: a static fixpoint over producible facts. The real content is fully reachable; breaking a link
// (an unset flag, a queue nobody sends, a track nobody joins) is reported with the missing fact.
test('reach: the content is fully reachable, and broken links are caught', () => {
  const { reach } = require('../tools/reach.js');
  const r = reach(content);
  assert.deepEqual(r.unreachable.map((u) => u.id), []);
  assert.deepEqual(r.endings, []);
  const c2 = project(ROOT).compileAll().content;
  for (const e of Object.values(c2.events)) for (const o of e.options) G.walkEffects(o.effects, (st) => { if (st.t === 'queue' && st.event === 'fox_returns') st.event = 'fox_injured'; });
  c2.events.duel_fixture.when = { src: 'flag(never_set_anywhere)', ast: G.parseExprAst('flag(never_set_anywhere)') };
  c2.events.duel_first_practice.track = 'no_such_track';
  const r2 = reach(c2), by = Object.fromEntries(r2.unreachable.map((u) => [u.id, u.why]));
  assert.match(by.fox_returns, /queued by nothing/);
  assert.match(by.duel_fixture, /flag\(never_set_anywhere\)/);
  assert.match(by.duel_first_practice, /no_such_track never joined/);
});
