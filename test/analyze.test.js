// tools/analyze.js: trajectory analysis per play style (curves, survival, pace, milestones, findings, comparisons).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const An = require('../tools/analyze.js');

let cached = null;
const small = async () => (cached = cached || await An.run({ styles: ['balanced', 'random'], games: 3, workers: 1, seed: 777 }));
const clone = (x) => JSON.parse(JSON.stringify(x));

test('analyze: quantiles', () => {
  const q = An.quantiles([5, 1, 3, null, 2, 4]);
  assert.equal(q.n, 5); assert.equal(q.p50, 3); assert.equal(q.p10, 1.4); assert.equal(q.p90, 4.6); assert.equal(q.mean, 3);
  assert.equal(An.quantiles([null]), null);
});

test('analyze: a small run gives ordered curves, a falling survival line, milestones and pace for every style', async () => {
  const a = await small();
  assert.equal(a.format, 'lumenhold-analysis');
  assert.equal(a.phase.length, a.turns); assert.equal(a.curveE.length, a.turns);
  for (const name of ['balanced', 'random']) {
    const st = a.styles[name];
    assert.equal(st.games, 3); assert.equal(st.crashed, 0);
    for (const k of a.keys) {
      assert.equal(st.curves[k].length, a.turns, k);
      for (const q of st.curves[k]) if (q) assert.ok(q.p10 <= q.p25 && q.p25 <= q.p50 && q.p50 <= q.p75 && q.p75 <= q.p90, k + ' quantiles in order');
    }
    assert.equal(st.alive[0], 1, 'everyone plays month 1');
    for (let i = 1; i < a.turns; i++) assert.ok(st.alive[i] <= st.alive[i - 1], 'survival never rises');
    for (const q of st.curves.health) if (q) assert.ok(q.p10 >= 0 && q.p90 <= 100, 'health within its bar');
    assert.ok(st.pace.cards.p50 > 100 && st.pace.termMonth > st.pace.breakMonth, 'term days hold more cards than break days');
    assert.ok(st.pace.msPerGame.p50 > 0 && st.pace.msPerCard > 0);
    assert.deepEqual(Object.keys(st.milestones), An.MILESTONES);
    assert.equal(st.milestones.meet.reached, 1, 'everyone meets someone');
    assert.ok(st.milestones.meet.medianTurn <= st.milestones.partner.medianTurn || st.milestones.partner.reached === 0);
    assert.ok(st.checks.perRun > 0 && st.checks.meanP > 0 && st.checks.won >= 0);
    assert.ok(Math.abs(Object.values(st.endings).reduce((x, y) => x + y, 0) - 1) < 0.02, 'endings add up to every run');
  }
});

test('analyze: findings fire on the patterns they describe', async () => {
  const a = clone(await small());
  a.styles.balanced.bars.health.top = 0.9;
  a.styles.random.early = { share: 0.5, byEnding: { ending_sent_home: { n: 2, medianTurn: 30 } } };
  a.styles.random.checks = { perRun: 200, meanP: 60, won: 40 };
  const f = An.findings(a), has = (style, re) => f.some((x) => x.style === style && re.test(x.text));
  assert.ok(has('balanced', /health starts 90% of term months at 95/));
  assert.ok(has('random', /50% of runs end early, most often ending_sent_home \(median month 30\)/));
  assert.ok(has('random', /previewed odds average 60% but 40% are won/));
});

test('analyze: significance tests', () => {
  const wave = (n, m, sd) => Array.from({ length: n }, (_, i) => m + sd * Math.sin(i * 12.9898) * 1.7);
  assert.ok(An.mannWhitney(wave(100, 10, 5), wave(100, 10, 5)) > 0.5, 'the same sample');
  assert.ok(An.mannWhitney(wave(100, 10, 5), wave(100, 14, 5)) < 0.001, 'a shift');
  assert.equal(An.mannWhitney([1, 2], [3, 4]), 1, 'too few runs to say');
  assert.ok(An.twoProp(40, 100, 30, 100) > 0.1, '40% against 30% of 100 runs is noise');
  assert.ok(An.twoProp(50, 100, 15, 100) < 0.001);
});

test('analyze: compare is silent on itself, ignores seed noise, and reports real changes', async () => {
  const a = await small();
  assert.deepEqual(An.compare(a, a), []);
  // Without samples (an older baseline) the thresholds alone decide.
  const b = clone(a);
  for (const st of Object.values(b.styles)) delete st.samples;
  b.styles.balanced.early.share += 0.2;
  b.styles.balanced.final.gold.p50 = a.styles.balanced.final.gold.p50 * 2 + 100;
  const d = An.compare(a, b).map((x) => x.text).join('\n');
  assert.match(d, /early endings/); assert.match(d, /gold at the end/);
  // With samples: a large move made of noise stays out, a real one is reported with its p.
  const wave = (n, m, sd) => Array.from({ length: n }, (_, i) => Math.round(m + sd * Math.sin(i * 12.9898 + m) * 1.7));
  const mk = (gold) => { const x = clone(a); const st = x.styles.balanced; st.games = 80; st.samples.final.gold = gold; st.final.gold = An.quantiles(gold); return x; };
  const noisy0 = mk(wave(80, 100, 120)), noisy1 = mk(wave(80, 125, 120));
  assert.ok(Math.abs(noisy1.styles.balanced.final.gold.p50 - noisy0.styles.balanced.final.gold.p50) >= 10, 'past the threshold');
  assert.ok(!An.compare(noisy1, noisy0).some((x) => /gold/.test(x.text)), 'but not significant');
  const real = An.compare(mk(wave(80, 300, 40)), mk(wave(80, 100, 40)));
  assert.ok(real.some((x) => /gold at the end .*\(p < 0\.0001\)/.test(x.text)), JSON.stringify(real));
});

test('analyze: the Markdown and HTML reports carry every style and are safe to open', async () => {
  const a = await small();
  const md = An.markdown(a), page = An.html(a);
  for (const n of ['balanced', 'random']) { assert.ok(md.includes('| ' + n + ' |')); assert.ok(page.includes('"' + n + '"')); }
  assert.match(page, /<title>Trajectory Analysis<\/title>/);
  const data = page.slice(page.indexOf('const A = '), page.indexOf('const names'));
  assert.ok(!/<\/script/i.test(data), 'the embedded data cannot close the script');
  assert.match(page, /prefers-color-scheme: dark/);
});
