#!/usr/bin/env node
/*
 * Trajectory analysis: how runs unfold over time, per play style (tools/policies.js).
 *
 *   node tools/analyze.js [--styles all|quick|a,b,…] [--games N] [--seed S] [--workers N] [--out DIR]
 *                         [--baseline FILE] [--name NAME] [--quiet]
 *   node tools/analyze.js --from FILE [--baseline FILE] [--name NAME]     re-render a saved analysis (findings, the
 *                                                                          comparison and the reports) without playing
 *   (also `node tools/grim.js analyze …`)
 *
 * Plays N games per style (the same seeds for every style, so styles compare pairwise) in worker threads, and writes
 * to DIR (default build/analysis/):
 *   NAME.json   every aggregate below, to compare later runs against (--baseline)
 *   NAME.md     the summary tables and the findings
 *   NAME.html   the same with charts (opens from file://; no dependencies)
 * What it measures, per style:
 *   curves      every resource and skill, the mean skill (against @balance curve E(turn)) and the cumulative GPA at the
 *               start of each month: p10 / p25 / p50 / p75 / p90 over the runs still playing that month
 *   survival    the share of runs still playing at each month, and the early endings with the month they happen
 *   pace        cards per term month and per break month, cards and months per run, wall-clock ms per run and per card
 *   milestones  the month something first happens (meet, join, job, spell, clue, lead, friend, partner, rival,
 *               night out, promotion, skill 50 / 75, 100 crowns) and the share of runs that get there
 *   checks      challenges taken, the mean previewed odds against the share won (calibration)
 *   flows       crowns, health and mood gained and lost per run (cards and month hooks; tools/economy.js splits them)
 *   endings     headlines and yearbook lines
 * The findings are rules over these numbers (early endings, bars stuck at a cap or the floor, the skill curve against
 * E(turn), odds calibration, outliers between styles, rare milestones, slow bots); with --baseline, every change past
 * a threshold against an earlier NAME.json. Findings describe; `grim balance` is the pass/fail gate.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const ROOT = path.join(__dirname, '..');
const QUICK = ['random', 'cautious', 'social', 'balanced', 'aggressive', 'truant', 'scholar', 'nightlife', 'sleuth', 'romantic', 'homebody', 'explorer'];
const ALL = ['random', 'cautious', 'social', 'balanced', 'aggressive', 'moneymaxx', 'caster', 'truant', 'nojob', 'nightowl',
  'focused:arcana', 'focused:lore', 'focused:alchemy', 'focused:charm', 'focused:vigor', 'focused:guile', 'social:lyra', 'social:corvin',
  'lumen', 'hollow', 'plot', 'scholar', 'nightlife', 'sleuth', 'romantic', 'homebody', 'explorer', 'celebrity'];
const PCT = [10, 25, 50, 75, 90];
const MILESTONES = ['meet', 'join', 'job', 'spell', 'clue', 'lead', 'friend', 'partner', 'rival', 'night_out', 'promote', 'skill50', 'skill75', 'gold100'];
const FLOW_KEYS = ['gold', 'health', 'mood'];

/* ------------------------------------------------------------------ one game */
const keysOf = (content) => Object.keys(content.resources).concat(content.order.skills);
const r1 = (x) => Math.round(x * 10) / 10;

// A compact record of one finished game: everything the aggregates need, nothing else.
function summarize(content, eng, meta) {
  const s = eng.s, h = s.hist, T = eng.maxTurns, keys = keysOf(content), skills = content.order.skills;
  const series = {}; for (const k of keys.concat(['skill', 'gpa'])) series[k] = new Array(T).fill(null);
  const pts = { A: 4, B: 3, C: 2, F: 0 }, grades = [];
  const first = {}, hit = (k, turn) => { if (first[k] == null) first[k] = turn; };
  const cardsByTurn = new Array(T).fill(0), cls = {}, flows = {};
  for (const k of FLOW_KEYS) flows[k] = { in: 0, out: 0 };
  const flow = (d) => { for (const k of FLOW_KEYS) if (d && d[k]) flows[k][d[k] > 0 ? 'in' : 'out'] += Math.abs(d[k]); };
  let checks = 0, checkP = 0, checkWon = 0, nightsOut = 0;
  // Where the cards come from (the day recipe's draws, or pushed: auto, queued, friend, encounter, arc…), per phase.
  const sources = { term: {}, break: {} }, phaseMonths = { term: 0, break: 0 };
  for (let t = 1; t < Math.min(s.turn, T); t++) { const ph = eng.phaseOf(t); if (ph in phaseMonths) phaseMonths[ph]++; }
  const note = (n, turn) => {
    switch (n.kind) {
      case 'meet': hit('meet', turn); break;
      case 'join': hit('join', turn); if (((content.tracks[n.track] || {}).kind) === 'job') hit('job', turn); break;
      case 'spell': hit('spell', turn); break;
      case 'clue': { const c = content.clues[n.clue]; hit(c && c.kind === 'lead' ? 'lead' : 'clue', turn); break; }
      case 'bond': if (n.status === 'partner') hit('partner', turn); else if (n.status === 'friend' || n.status === 'close') hit('friend', turn); else if (n.status === 'rival' || n.status === 'nemesis') hit('rival', turn); break;
      case 'promote': hit('promote', turn); break;
      case 'grade': grades.push(pts[n.grade] ?? 0); break;
    }
  };
  for (const x of h) {
    if (x.t === 'month') {
      if (x.vals && x.turn >= 1 && x.turn <= T) {
        const i = x.turn - 1;
        for (const k of keys) series[k][i] = r1(x.vals[k] || 0);
        series.skill[i] = r1(skills.reduce((a, k) => a + (x.vals[k] || 0), 0) / skills.length);
        series.gpa[i] = grades.length ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 100) / 100 : null;
        const top = Math.max(...skills.map((k) => x.vals[k] || 0));
        if (top >= 50) hit('skill50', x.turn); if (top >= 75) hit('skill75', x.turn);
        if ((x.vals.gold || 0) >= 100) hit('gold100', x.turn);
      }
      for (const it of x.summary || []) { flow(it.deltas); for (const n of it.notes || []) note(n, x.turn); }
    } else if (x.t === 'card') {
      if (x.turn >= 1 && x.turn <= T) cardsByTurn[x.turn - 1]++;
      cls[x.class || 'none'] = (cls[x.class || 'none'] || 0) + 1;
      const ph = x.turn < Math.min(s.turn, T) ? eng.phaseOf(x.turn) : null;
      if (ph in sources) { const k = x.src || 'drawn'; sources[ph][k] = (sources[ph][k] || 0) + 1; }
      if (x.id === 'night_out' && x.choice === 'right') { nightsOut++; hit('night_out', x.turn); }
      const o = x.out || {};
      flow(o.deltas);
      for (const n of o.notes || []) note(n, x.turn);
      for (const c of o.checks || []) if (c.p != null) { checks++; checkP += c.p; if (c.ok) checkWon++; }
    }
  }
  const end = h.find((x) => x.t === 'end') || {};
  const ended = s.ended || {};
  return {
    style: meta.style, seed: meta.seed, ms: meta.ms, origin: s.origin || null,
    turns: Math.min(s.turn, T), early: !!(ended.id && end.early), ending: ended.id || null,
    yearbook: (end.yearbook || []).map((y) => (typeof y === 'string' ? y.split(':').pop() : y.id)),
    cards: h.filter((x) => x.t === 'card').length, cardsByTurn, cls,
    distinct: new Set(h.filter((x) => x.t === 'card').map((x) => x.id)).size,
    places: Object.keys(s.visitsTo || {}).length,
    series, final: Object.fromEntries(keys.map((k) => [k, r1(s.vals[k] || 0)]).concat([['skill', r1(skills.reduce((a, k) => a + (s.vals[k] || 0), 0) / skills.length)], ['gpa', eng.gpa()]])),
    first, flows, checks, checkP, checkWon, nightsOut, sources, phaseMonths,
    partners: Object.values(s.npcs || {}).filter((n) => n.bond === 'partner').length,
    friends: Object.values(s.npcs || {}).filter((n) => n.bond === 'friend' || n.bond === 'close').length,
  };
}

function playOne(content, Engine, Policies, style, seed) {
  const t0 = process.hrtime.bigint();
  const w = console.warn; console.warn = () => {};
  let eng;
  try { eng = Policies.play(new Engine(content), Policies.get(style), { seed, name: 'An', maxSteps: 12000 }).eng; } finally { console.warn = w; }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  return summarize(content, eng, { style, seed, ms });
}

if (!isMainThread && workerData && workerData.analyzeWorker) {
  const Engine = require('../src/engine.js'), Policies = require('./policies.js');
  const { content } = require('./project.js').project(ROOT).compileAll();
  for (const [style, seed] of workerData.jobs) {
    let rec; try { rec = playOne(content, Engine, Policies, style, seed); } catch (e) { rec = { style, seed, crash: String(e && e.stack || e) }; }
    parentPort.postMessage(rec);
  }
}

/* ------------------------------------------------------------------ aggregates */
function quantiles(xs) {
  const a = xs.filter((x) => x != null && !Number.isNaN(x)).sort((p, q) => p - q);
  if (!a.length) return null;
  const q = (p) => { const i = (a.length - 1) * p / 100, lo = Math.floor(i), hi = Math.ceil(i); return r1(a[lo] + (a[hi] - a[lo]) * (i - lo)); };
  const out = { n: a.length, mean: r1(a.reduce((x, y) => x + y, 0) / a.length) }; for (const p of PCT) out['p' + p] = q(p);
  return out;
}
const median = (xs) => { const q = quantiles(xs); return q ? q.p50 : null; };

function aggregate(records, content, meta = {}) {
  const Engine = require('../src/engine.js'); const probe = new Engine(content);
  const T = content.game.max_turns || 48, keys = keysOf(content).concat(['skill', 'gpa']);
  const phase = Array.from({ length: T }, (_, i) => probe.phaseOf(i + 1));
  const styles = {};
  const byStyle = {}; for (const r of records) (byStyle[r.style] = byStyle[r.style] || []).push(r);
  for (const [name, all] of Object.entries(byStyle)) {
    const runs = all.filter((r) => !r.crash), n = runs.length;
    const st = styles[name] = { games: n, crashed: all.length - n, crashes: all.filter((r) => r.crash).slice(0, 3).map((r) => r.seed + ': ' + r.crash.split('\n')[0]) };
    if (!n) continue;
    st.curves = {};
    for (const k of keys) st.curves[k] = Array.from({ length: T }, (_, i) => quantiles(runs.map((r) => r.series[k][i])));
    st.final = Object.fromEntries(keys.map((k) => [k, quantiles(runs.map((r) => r.final[k]))]));
    // The runs themselves, for compare()'s significance tests (left out of the HTML page).
    st.samples = { final: Object.fromEntries(keys.map((k) => [k, runs.map((r) => r.final[k])])), first: Object.fromEntries(MILESTONES.map((m) => [m, runs.map((r) => r.first[m] ?? null)])), cards: runs.map((r) => r.cards), early: runs.filter((r) => r.early).length, endings: {} };
    for (const r of runs) if (r.ending) st.samples.endings[r.ending] = (st.samples.endings[r.ending] || 0) + 1;
    st.alive = Array.from({ length: T }, (_, i) => r1(runs.filter((r) => r.series.health[i] != null).length / n * 100) / 100);
    const early = runs.filter((r) => r.early);
    st.early = { share: early.length / n, byEnding: {} };
    for (const r of early) { const e = st.early.byEnding[r.ending] = st.early.byEnding[r.ending] || { n: 0, turns: [] }; e.n++; e.turns.push(r.turns); }
    for (const e of Object.values(st.early.byEnding)) { e.medianTurn = median(e.turns); delete e.turns; }
    const termTurns = phase.map((p, i) => (p === 'term' ? i : -1)).filter((i) => i >= 0), breakTurns = phase.map((p, i) => (p === 'break' ? i : -1)).filter((i) => i >= 0);
    const perMonth = (idx) => median(runs.map((r) => { const live = idx.filter((i) => r.series.health[i] != null && i < r.turns - 1); return live.length ? live.reduce((a, i) => a + r.cardsByTurn[i], 0) / live.length : null; }));
    st.pace = {
      msPerGame: quantiles(runs.map((r) => r.ms)), msPerCard: r1(runs.reduce((a, r) => a + r.ms, 0) / Math.max(1, runs.reduce((a, r) => a + r.cards, 0)) * 100) / 100,
      cards: quantiles(runs.map((r) => r.cards)), months: quantiles(runs.map((r) => r.turns)),
      termMonth: perMonth(termTurns), breakMonth: perMonth(breakTurns),
      cardsByTurn: Array.from({ length: T }, (_, i) => r1(runs.reduce((a, r) => a + r.cardsByTurn[i], 0) / Math.max(1, runs.filter((r) => r.series.health[i] != null).length))),
      distinct: quantiles(runs.map((r) => r.distinct)), places: quantiles(runs.map((r) => r.places)),
    };
    const clsTot = {}; for (const r of runs) for (const [c, v] of Object.entries(r.cls)) clsTot[c] = (clsTot[c] || 0) + v / n;
    st.classes = Object.fromEntries(Object.entries(clsTot).sort((a, b) => b[1] - a[1]).map(([c, v]) => [c, r1(v)]));
    st.milestones = Object.fromEntries(MILESTONES.map((m) => { const t = runs.map((r) => r.first[m]).filter((x) => x != null); return [m, { reached: t.length / n, medianTurn: median(t) }]; }));
    const ck = runs.reduce((a, r) => a + r.checks, 0);
    st.checks = { perRun: r1(ck / n), meanP: ck ? r1(runs.reduce((a, r) => a + r.checkP, 0) / ck) : null, won: ck ? r1(100 * runs.reduce((a, r) => a + r.checkWon, 0) / ck) : null };
    st.flows = Object.fromEntries(FLOW_KEYS.map((k) => [k, { in: r1(runs.reduce((a, r) => a + r.flows[k].in, 0) / n), out: r1(runs.reduce((a, r) => a + r.flows[k].out, 0) / n) }]));
    const tally = (list) => { const o = {}; for (const x of list) if (x) o[x] = (o[x] || 0) + 1; return Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, r1(v / n * 100) / 100])); };
    st.endings = tally(runs.map((r) => r.ending)); st.yearbook = tally(runs.flatMap((r) => r.yearbook));
    st.origins = tally(runs.map((r) => r.origin));
    st.sources = {};
    for (const ph of ['term', 'break']) {
      const months = runs.reduce((x, r) => x + (r.phaseMonths ? r.phaseMonths[ph] : 0), 0), tot = {};
      for (const r of runs) for (const [k, v] of Object.entries((r.sources || {})[ph] || {})) tot[k] = (tot[k] || 0) + v;
      st.sources[ph] = Object.fromEntries(Object.entries(tot).sort((x, y) => y[1] - x[1]).map(([k, v]) => [k, months ? Math.round(v / months * 100) / 100 : 0]));
    }
    st.byOrigin = {};
    for (const o of Object.keys(st.origins)) {
      const rs = runs.filter((r) => r.origin === o);
      st.byOrigin[o] = { n: rs.length, early: rs.filter((r) => r.early).length / rs.length, gold: median(rs.map((r) => r.final.gold)), skill: median(rs.map((r) => r.final.skill)), gpa: median(rs.map((r) => r.final.gpa)), renown: median(rs.map((r) => r.final.renown)) };
    }
    st.people = { partners: quantiles(runs.map((r) => r.partners)), friends: quantiles(runs.map((r) => r.friends)) };
    st.nightsOut = quantiles(runs.map((r) => r.nightsOut));
    // Time at the bars' ends: the share of term months a bar starts at ≥ 95 or ≤ 10.
    st.bars = {};
    for (const k of ['health', 'mood']) {
      let top = 0, low = 0, all = 0;
      for (const r of runs) for (const i of termTurns) { const v = r.series[k][i]; if (v == null) continue; all++; if (v >= 95) top++; if (v <= 10) low++; }
      st.bars[k] = { top: all ? r1(top / all * 100) / 100 : 0, low: all ? r1(low / all * 100) / 100 : 0 };
    }
  }
  return { format: 'lumenhold-analysis', v: 1, createdAt: new Date().toISOString(), ...meta, turns: T, phase, curveE: ((content.balance || {}).curve || []).slice(0, T), keys, milestones: MILESTONES, styles };
}

/* ------------------------------------------------------------------ findings */
const pct = (x) => Math.round(x * 100) + '%';
function findings(a) {
  const out = [], groups = {}, names = Object.keys(a.styles).filter((n) => a.styles[n].games);
  // `group`: the same finding for many styles is one line (with the range of its value) instead of one per style.
  const add = (level, style, text, group, value) => { if (group) (groups[group] = groups[group] || { level, text, list: [] }).list.push({ style, value, line: text }); else out.push({ level, style, text }); };
  const crossMed = (f) => median(names.map((n) => f(a.styles[n])).filter((x) => x != null));
  for (const n of names) {
    const st = a.styles[n];
    if (st.crashed) add('error', n, st.crashed + ' game(s) crashed: ' + st.crashes.join('; '));
    if (st.early.share >= 0.2) {
      const top = Object.entries(st.early.byEnding).sort((x, y) => y[1].n - x[1].n)[0];
      add('warn', n, pct(st.early.share) + ' of runs end early, most often ' + top[0] + ' (median month ' + top[1].medianTurn + ')');
    }
    for (const k of ['health', 'mood']) {
      if (st.bars[k].top >= 0.6) add('info', n, k + ' starts ' + pct(st.bars[k].top) + ' of term months at 95 or more (a bar at its cap stops mattering)', k + '-top', st.bars[k].top);
      if (st.bars[k].low >= 0.15) add('warn', n, k + ' starts ' + pct(st.bars[k].low) + ' of term months at 10 or less', k + '-low', st.bars[k].low);
    }
    if (st.checks.meanP != null && st.checks.perRun * st.games >= 300 && Math.abs(st.checks.won - st.checks.meanP) > 4) add('warn', n, 'checks: previewed odds average ' + st.checks.meanP + '% but ' + st.checks.won + '% are won (calibration)');
  }
  if (a.styles.balanced && a.styles.balanced.games && a.curveE.length) {
    const c = a.styles.balanced.curves.skill; let worst = null;
    c.forEach((q, i) => { if (!q || q.n < a.styles.balanced.games / 2) return; const e = a.curveE[i], d = (q.p50 - e) / e; if (!worst || Math.abs(d) > Math.abs(worst.d)) worst = { d, i, p: q.p50, e }; });
    if (worst && Math.abs(worst.d) > 0.15) add('warn', 'balanced', 'mean skill ' + worst.p + ' at month ' + (worst.i + 1) + ' against E(turn) ' + worst.e + ' (' + (worst.d > 0 ? '+' : '') + pct(worst.d) + '): `grim curve --write` refits it');
  }
  // Outliers between styles, on the run's end.
  for (const k of ['gold', 'renown']) {
    const m = crossMed((st) => st.final[k] && st.final[k].p50);
    if (!m) continue;
    for (const n of names) { const v = a.styles[n].final[k] && a.styles[n].final[k].p50; if (v != null && v > 3 * m && v - m > 50) add('info', n, k + ' ends at ' + v + ', over 3× the median style (' + m + ')'); }
  }
  const msMed = crossMed((st) => st.pace.msPerGame.p50);
  for (const n of names) { const v = a.styles[n].pace.msPerGame.p50; if (v > 2.5 * msMed) add('info', n, 'slow bot: ' + Math.round(v) + ' ms a game against a median of ' + Math.round(msMed)); }
  for (const m of a.milestones) {
    const best = Math.max(...names.map((n) => a.styles[n].milestones[m].reached));
    if (best < 0.1) add('warn', '*', 'milestone "' + m + '" is reached in under 10% of runs by every style');
  }
  const wording = { 'health-top': 'health starts at 95 or more in', 'mood-top': 'mood starts at 95 or more in', 'health-low': 'health starts at 10 or less in', 'mood-low': 'mood starts at 10 or less in' };
  for (const [g, x] of Object.entries(groups)) {
    if (x.list.length < Math.max(3, names.length / 2)) { for (const y of x.list) out.push({ level: x.level, style: y.style, text: y.line }); continue; }
    const vs = x.list.map((y) => y.value), missing = names.filter((n) => !x.list.some((y) => y.style === n));
    out.push({ level: x.level, style: '*', text: wording[g] + ' ' + pct(Math.min(...vs)) + '–' + pct(Math.max(...vs)) + ' of term months for ' + x.list.length + ' of ' + names.length + ' styles' + (missing.length ? ' (not ' + missing.join(', ') + ')' : '') + (/top/.test(g) ? ': a bar at its cap stops mattering' : '') });
  }
  return out;
}

/* ------------------------------------------------------------------ significance */
// Two-sided p of a standard normal z (Abramowitz–Stegun 7.1.26 for erfc).
function pNormal(z) {
  const x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x);
  const erfc = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-x * x);
  return Math.min(1, erfc);
}
// Mann–Whitney U (normal approximation with the tie correction): do two samples come from the same distribution?
function mannWhitney(x, y) {
  const a = x.filter((v) => v != null), b = y.filter((v) => v != null), n1 = a.length, n2 = b.length, n = n1 + n2;
  if (n1 < 5 || n2 < 5) return 1;
  const all = a.map((v) => [v, 0]).concat(b.map((v) => [v, 1])).sort((p, q) => p[0] - q[0]);
  let r1 = 0, ties = 0;
  for (let i = 0; i < n;) { let j = i; while (j + 1 < n && all[j + 1][0] === all[i][0]) j++; const rank = (i + j) / 2 + 1, t = j - i + 1; ties += t * t * t - t; for (let k = i; k <= j; k++) if (!all[k][1]) r1 += rank; i = j + 1; }
  const u = r1 - n1 * (n1 + 1) / 2, sd = Math.sqrt(n1 * n2 / 12 * ((n + 1) - ties / (n * (n - 1))));
  return sd ? pNormal((u - n1 * n2 / 2) / sd) : 1;
}
// Two shares (k1 of n1 against k2 of n2): the pooled two-proportion z-test.
function twoProp(k1, n1, k2, n2) {
  if (!n1 || !n2) return 1;
  const p = (k1 + k2) / (n1 + n2), se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  return se ? pNormal((k1 / n1 - k2 / n2) / se) : 1;
}

// Changes against an earlier analysis. A change is reported when it is both large enough to matter (the thresholds)
// and unlikely to be the seeds alone: p < ALPHA by Mann–Whitney (values, milestone months) or a two-proportion test
// (shares). Two runs of the same content on different seeds, 100 games a style, differ past the thresholds about a
// hundred times; ALPHA keeps those out. A baseline without samples (an older file) falls back to the thresholds.
const ALPHA = 0.001;
function compare(a, b, alpha = ALPHA) {
  const out = [], add = (style, text, p) => out.push({ level: 'diff', style, text: text + (p != null ? ' (p ' + (p < 0.0001 ? '< 0.0001' : '= ' + p.toFixed(4)) + ')' : '') });
  for (const n of Object.keys(a.styles)) {
    const x = a.styles[n], y = b.styles[n];
    if (!y || !x.games || !y.games) continue;
    const xs = x.samples, ys = y.samples, tested = !!(xs && ys);
    const sig = (p) => !tested || p < alpha;
    let p = tested ? twoProp(xs.early, x.games, ys.early, y.games) : null;
    if (Math.abs(x.early.share - y.early.share) >= 0.05 && sig(p)) add(n, 'early endings ' + pct(y.early.share) + ' → ' + pct(x.early.share), p);
    for (const k of a.keys) {
      const v1 = x.final[k] && x.final[k].p50, v0 = y.final[k] && y.final[k].p50;
      if (v1 == null || v0 == null) continue;
      const thr = k === 'gpa' ? 0.15 : Math.max(5, Math.abs(v0) * 0.1);
      if (Math.abs(v1 - v0) < thr) continue;
      p = tested ? mannWhitney(xs.final[k], ys.final[k]) : null;
      if (sig(p)) add(n, k + ' at the end (p50) ' + v0 + ' → ' + v1, p);
    }
    const c1 = x.pace.cards.p50, c0 = y.pace.cards.p50;
    p = tested ? mannWhitney(xs.cards, ys.cards) : null;
    if (Math.abs(c1 - c0) >= 0.05 * c0 && sig(p)) add(n, 'cards a run ' + c0 + ' → ' + c1, p);
    for (const e of new Set(Object.keys(x.endings).concat(Object.keys(y.endings)))) {
      const s1 = x.endings[e] || 0, s0 = y.endings[e] || 0;
      if (Math.abs(s1 - s0) < 0.1) continue;
      p = tested ? twoProp(xs.endings[e] || 0, x.games, ys.endings[e] || 0, y.games) : null;
      if (sig(p)) add(n, e + ' ' + pct(s0) + ' → ' + pct(s1), p);
    }
    for (const m of a.milestones) {
      const m1 = x.milestones[m], m0 = (y.milestones || {})[m]; if (!m0) continue;
      if (Math.abs(m1.reached - m0.reached) >= 0.15) {
        p = tested ? twoProp(xs.first[m].filter((t) => t != null).length, x.games, ys.first[m].filter((t) => t != null).length, y.games) : null;
        if (sig(p)) add(n, 'milestone ' + m + ' reached ' + pct(m0.reached) + ' → ' + pct(m1.reached), p);
      } else if (m1.medianTurn != null && m0.medianTurn != null && Math.abs(m1.medianTurn - m0.medianTurn) >= 3) {
        p = tested ? mannWhitney(xs.first[m], ys.first[m]) : null;
        if (sig(p)) add(n, 'milestone ' + m + ' at month ' + m0.medianTurn + ' → ' + m1.medianTurn, p);
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ reports */
function markdown(a) {
  const L = [], names = Object.keys(a.styles).filter((n) => a.styles[n].games), v = (q, k = 'p50') => (q ? q[k] : '–');
  L.push('# Trajectory analysis', '', a.games + ' games a style, seeds from ' + a.seed + ', ' + a.createdAt.slice(0, 16).replace('T', ' ') + (a.contentHash ? ', content ' + a.contentHash : '') + '. Generated by `tools/analyze.js`. Times are wall-clock in ' + a.workers + ' worker(s): compare them within a run, or between runs with the same --workers.', '');
  L.push('## Runs', '', '| style | early | months | cards | term / break month | ms a game | distinct cards | places | GPA | mean skill | gold | renown | alignment |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const n of names) { const s = a.styles[n]; L.push('| ' + [n, pct(s.early.share), v(s.pace.months), v(s.pace.cards), s.pace.termMonth + ' / ' + s.pace.breakMonth, Math.round(s.pace.msPerGame.p50), v(s.pace.distinct), v(s.pace.places), v(s.final.gpa), v(s.final.skill), v(s.final.gold), v(s.final.renown), v(s.final.alignment)].join(' | ') + ' |'); }
  L.push('', '## End of run (p10 · p50 · p90)', '', '| style | ' + a.keys.filter((k) => !['skill', 'gpa'].includes(k)).join(' | ') + ' |', '|---|' + a.keys.filter((k) => !['skill', 'gpa'].includes(k)).map(() => '---').join('|') + '|');
  for (const n of names) L.push('| ' + n + ' | ' + a.keys.filter((k) => !['skill', 'gpa'].includes(k)).map((k) => { const q = a.styles[n].final[k]; return q ? q.p10 + ' · **' + q.p50 + '** · ' + q.p90 : '–'; }).join(' | ') + ' |');
  L.push('', '## Milestones (median month · share of runs)', '', '| style | ' + a.milestones.join(' | ') + ' |', '|---|' + a.milestones.map(() => '---').join('|') + '|');
  for (const n of names) L.push('| ' + n + ' | ' + a.milestones.map((m) => { const x = a.styles[n].milestones[m]; return x.reached ? (x.medianTurn + ' · ' + pct(x.reached)) : '–'; }).join(' | ') + ' |');
  L.push('', '## Checks, people, nights, flows', '', '| style | checks a run | odds shown | won | partners | friends | nights out | crowns in / out | health in / out | mood in / out |', '|---|---|---|---|---|---|---|---|---|---|');
  for (const n of names) { const s = a.styles[n]; L.push('| ' + [n, s.checks.perRun, s.checks.meanP + '%', s.checks.won + '%', v(s.people.partners), v(s.people.friends), v(s.nightsOut), s.flows.gold.in + ' / ' + s.flows.gold.out, s.flows.health.in + ' / ' + s.flows.health.out, s.flows.mood.in + ' / ' + s.flows.mood.out].join(' | ') + ' |'); }
  L.push('', '## Where a month\'s cards come from (cards a month, by source)', '', '`drawn` is the day recipe (§4.2); the rest are pushed: `auto` (scheduled and bedtime), `queued` (follow-ups), `friend` (characters who come looking for you), `encounter`, `arc`, `festival`, `ramp` (milestones), `letter`.', '');
  for (const n of names) { const so = a.styles[n].sources; if (!so) continue; const line = (ph) => Object.entries(so[ph]).filter(([, x]) => x >= 0.05).map(([k, x]) => k + ' ' + x).join(' · '); const sum = (ph) => Math.round(Object.values(so[ph]).reduce((x, y) => x + y, 0) * 10) / 10; L.push('- **' + n + '**: term ' + sum('term') + ' (' + line('term') + '); break ' + sum('break') + ' (' + line('break') + ')'); }
  const origins = [...new Set(names.flatMap((n) => Object.keys(a.styles[n].byOrigin || {})))];
  if (origins.length) {
    L.push('', '## By origin (every style together; medians)', '', '| origin | runs | early | crowns | mean skill | GPA | renown |', '|---|---|---|---|---|---|---|');
    for (const o of origins) {
      const rows = names.map((n) => (a.styles[n].byOrigin || {})[o]).filter(Boolean), runs = rows.reduce((x, r) => x + r.n, 0);
      const w = (k) => Math.round(rows.reduce((x, r) => x + (r[k] || 0) * r.n, 0) / Math.max(1, runs) * 100) / 100;
      L.push('| ' + [o, runs, pct(w('early')), w('gold'), w('skill'), w('gpa'), w('renown')].join(' | ') + ' |');
    }
    L.push('', '(each style\'s median, weighted by its runs; per style in the JSON, `styles.<name>.byOrigin`)');
  }
  L.push('', '## Endings', '');
  for (const n of names) { const s = a.styles[n]; L.push('- **' + n + '**: ' + Object.entries(s.endings).slice(0, 4).map(([e, x]) => e.replace(/^ending_/, '') + ' ' + pct(x)).join(', ') + (s.early.share ? ' · early: ' + Object.entries(s.early.byEnding).map(([e, x]) => e.replace(/^ending_/, '') + ' ' + x.n + ' (month ' + x.medianTurn + ')').join(', ') : '')); }
  const f = (a.findings || []).concat(a.diff || []);
  L.push('', '## Findings', '', ...(f.length ? f.map((x) => '- *' + x.level + '* **' + x.style + '**: ' + x.text) : ['None.']), '');
  return L.join('\n');
}

function html(a) {
  const data = JSON.stringify(a, (k, v) => (k === 'samples' ? undefined : v)).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trajectory Analysis</title>
<style>
:root { --bg:#f7f6f2; --fg:#1d1c22; --muted:#6b6875; --line:#dedbd2; --panel:#ffffff; --accent:#8a5a00; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#121320; --fg:#ecebf3; --muted:#9a98ad; --line:#2b2d44; --panel:#1a1c2e; --accent:#f0c869; } }
:root[data-theme="dark"] { --bg:#121320; --fg:#ecebf3; --muted:#9a98ad; --line:#2b2d44; --panel:#1a1c2e; --accent:#f0c869; }
* { box-sizing:border-box; } body { margin:0; background:var(--bg); color:var(--fg); font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif; }
main { max-width:1180px; margin:0 auto; padding:20px 16px 60px; } h1 { font-size:24px; margin:0 0 4px; } h2 { font-size:17px; margin:28px 0 8px; }
.sub { color:var(--muted); margin:0 0 16px; } .panel { background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:12px; }
.controls { display:flex; flex-wrap:wrap; gap:8px 14px; align-items:center; margin-bottom:10px; } select { font:inherit; padding:4px 6px; background:var(--panel); color:var(--fg); border:1px solid var(--line); border-radius:6px; }
.chips { display:flex; flex-wrap:wrap; gap:6px; } .chip { border:1px solid var(--line); border-radius:999px; padding:2px 10px; cursor:pointer; user-select:none; font-size:12.5px; display:inline-flex; gap:6px; align-items:center; }
.chip.off { opacity:.4; } .chip i { width:10px; height:10px; border-radius:50%; display:inline-block; }
svg { width:100%; height:auto; display:block; } .axis { stroke:var(--line); } .lbl { fill:var(--muted); font-size:11px; }
.grid2 { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,520px),1fr)); gap:14px; }
.tablewrap { overflow-x:auto; } table { border-collapse:collapse; width:100%; font-size:12.5px; } th,td { padding:4px 8px; border-bottom:1px solid var(--line); text-align:right; white-space:nowrap; } th:first-child,td:first-child { text-align:left; }
th { color:var(--muted); font-weight:600; position:sticky; top:0; background:var(--panel); } ul.find { padding-left:18px; } .warn { color:#c2410c; } .error { color:#dc2626; } .diff { color:var(--accent); }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .warn { color:#fb923c; } }
</style></head><body><main>
<h1>Trajectory analysis</h1><p class="sub" id="sub"></p>
<div class="panel"><div class="controls"><label>Metric <select id="metric"></select></label><label>Band <select id="band"><option value="p25-p75">p25–p75</option><option value="p10-p90">p10–p90</option><option value="none">none</option></select></label></div>
<div class="chips" id="chips"></div><div id="traj"></div></div>
<div class="grid2" style="margin-top:14px"><div class="panel"><b>Runs still playing</b><div id="alive"></div></div><div class="panel"><b>Cards a month</b><div id="pace"></div></div></div>
<h2>Runs</h2><div class="panel tablewrap" id="tRuns"></div>
<h2>Milestones <span class="sub">(median month · share of runs)</span></h2><div class="panel tablewrap" id="tMile"></div>
<h2>Cards a month, by source <span class="sub">(drawn = the day recipe; the rest are pushed)</span></h2><div class="panel tablewrap" id="tSrc"></div>
<h2>By origin <span class="sub">(early · crowns · mean skill · GPA, medians)</span></h2><div class="panel tablewrap" id="tOrig"></div>
<h2>Findings</h2><div class="panel"><ul class="find" id="find"></ul></div>
</main><script>
const A = ${data};
const names = Object.keys(A.styles).filter((n) => A.styles[n].games);
const PAL = ['#2563eb','#dc2626','#16a34a','#9333ea','#ea580c','#0891b2','#ca8a04','#db2777','#475569','#65a30d','#7c3aed','#b45309'];
// Distinct colours for the styles on show (in the table's order), grey for the rest.
const color = (n) => { const shown = names.filter((x) => on.has(x)), i = shown.indexOf(n); return i < 0 ? '#9a98ad' : PAL[i % PAL.length]; };
let on = new Set(names.filter((n) => ['balanced','random','social','scholar','nightlife','homebody'].includes(n))); if (!on.size) on = new Set(names.slice(0, 6));
try { const s = JSON.parse(localStorage.getItem('traj-on') || 'null'); if (s && s.length) on = new Set(s.filter((n) => names.includes(n))); } catch (e) {}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
document.getElementById('sub').textContent = A.games + ' games a style · seeds from ' + A.seed + ' · ' + A.createdAt.slice(0, 16).replace('T', ' ') + (A.contentHash ? ' · content ' + A.contentHash : '');
const msel = document.getElementById('metric'); A.keys.forEach((k) => { const o = document.createElement('option'); o.value = k; o.textContent = k === 'skill' ? 'mean skill (vs E(turn))' : k === 'gpa' ? 'GPA (cumulative)' : k; msel.appendChild(o); }); msel.value = 'skill';
function chart(el, series, opts) {
  const W = 760, H = opts.h || 300, L = 44, R = 10, Tp = 10, B = 26, T = A.turns;
  let lo = Infinity, hi = -Infinity; for (const s of series) for (const p of s.pts.concat(s.band ? s.band.flat() : [])) if (p != null) { lo = Math.min(lo, p); hi = Math.max(hi, p); }
  if (opts.min != null) lo = Math.min(lo, opts.min); if (opts.max != null) hi = Math.max(hi, opts.max); if (!isFinite(lo)) { lo = 0; hi = 1; } if (hi === lo) hi = lo + 1;
  const x = (i) => L + (W - L - R) * i / (T - 1), y = (v) => Tp + (H - Tp - B) * (1 - (v - lo) / (hi - lo));
  let g = '';
  for (let k = 0; k <= 4; k++) { const v = lo + (hi - lo) * k / 4; g += '<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="lbl" x="' + (L - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + (Math.abs(hi - lo) < 5 ? v.toFixed(1) : Math.round(v)) + '</text>'; }
  for (let t = 0; t < T; t += 6) g += '<text class="lbl" x="' + x(t) + '" y="' + (H - 8) + '" text-anchor="middle">' + (t + 1) + '</text>';
  for (let t = 0; t < T; t++) if (A.phase[t] === 'break') g += '<rect x="' + (x(t) - (W - L - R) / (T - 1) / 2) + '" y="' + Tp + '" width="' + (W - L - R) / (T - 1) + '" height="' + (H - Tp - B) + '" fill="var(--fg)" opacity=".035"/>';
  const path = (pts) => { let d = '', pen = false; pts.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); pen = true; }); return d; };
  for (const s of series) if (s.band) { const up = [], dn = []; s.band.forEach((b, i) => { if (b && b[0] != null) { up.push(x(i).toFixed(1) + ' ' + y(b[1]).toFixed(1)); dn.unshift(x(i).toFixed(1) + ' ' + y(b[0]).toFixed(1)); } }); if (up.length) g += '<path d="M' + up.join('L') + 'L' + dn.join('L') + 'Z" fill="' + s.color + '" opacity=".12"/>'; }
  for (const s of series) g += '<path d="' + path(s.pts) + '" fill="none" stroke="' + s.color + '" stroke-width="' + (s.w || 2) + '"' + (s.dash ? ' stroke-dasharray="5 4"' : '') + '><title>' + esc(s.name) + '</title></path>';
  el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opts.label || '') + '">' + g + '</svg>';
}
function draw() {
  const k = msel.value, band = document.getElementById('band').value, [bl, bh] = band === 'none' ? [] : band.split('-');
  const ser = [...on].map((n) => { const c = A.styles[n].curves[k]; return { name: n, color: color(n), pts: c.map((q) => (q ? q.p50 : null)), band: bl ? c.map((q) => (q ? [q[bl], q[bh]] : null)) : null }; });
  if (k === 'skill' && A.curveE.length) ser.push({ name: 'E(turn)', color: 'var(--fg)', pts: A.curveE, dash: true, w: 1.5 });
  chart(document.getElementById('traj'), ser, { label: k + ' by month' });
  chart(document.getElementById('alive'), [...on].map((n) => ({ name: n, color: color(n), pts: A.styles[n].alive.map((v) => v * 100) })), { min: 0, max: 100, h: 220, label: 'runs still playing' });
  chart(document.getElementById('pace'), [...on].map((n) => ({ name: n, color: color(n), pts: A.styles[n].pace.cardsByTurn })), { min: 0, h: 220, label: 'cards a month' });
  document.getElementById('chips').innerHTML = names.map((n) => '<span class="chip' + (on.has(n) ? '' : ' off') + '" data-n="' + esc(n) + '"><i style="background:' + color(n) + '"></i>' + esc(n) + '</span>').join('');
}
document.getElementById('chips').onclick = (e) => { const c = e.target.closest('.chip'); if (!c) return; const n = c.dataset.n; on.has(n) ? on.delete(n) : on.add(n); try { localStorage.setItem('traj-on', JSON.stringify([...on])); } catch (err) {} draw(); };
msel.onchange = draw; document.getElementById('band').onchange = draw; draw();
const pc = (x) => Math.round(x * 100) + '%', p50 = (q) => (q ? q.p50 : '–');
const row = (cells, th) => '<tr>' + cells.map((c) => (th ? '<th>' : '<td>') + c + (th ? '</th>' : '</td>')).join('') + '</tr>';
document.getElementById('tRuns').innerHTML = '<table>' + row(['style','early','months','cards','term / break month','ms a game','distinct','places','GPA','skill','gold','renown','alignment','checks shown / won','nights out','partners'], true) +
  names.map((n) => { const s = A.styles[n]; return row([esc(n), pc(s.early.share), p50(s.pace.months), p50(s.pace.cards), s.pace.termMonth + ' / ' + s.pace.breakMonth, Math.round(s.pace.msPerGame.p50), p50(s.pace.distinct), p50(s.pace.places), p50(s.final.gpa), p50(s.final.skill), p50(s.final.gold), p50(s.final.renown), p50(s.final.alignment), s.checks.meanP + '% / ' + s.checks.won + '%', p50(s.nightsOut), p50(s.people.partners)]); }).join('') + '</table>';
document.getElementById('tMile').innerHTML = '<table>' + row(['style'].concat(A.milestones), true) + names.map((n) => row([esc(n)].concat(A.milestones.map((m) => { const x = A.styles[n].milestones[m]; return x.reached ? x.medianTurn + ' · ' + pc(x.reached) : '–'; })))).join('') + '</table>';
const SRC = ['drawn','auto','friend','queued','encounter','arc','festival','ramp','letter'];
document.getElementById('tSrc').innerHTML = '<table>' + row(['style','phase','total'].concat(SRC), true) + names.flatMap((n) => ['term','break'].map((ph) => { const so = (A.styles[n].sources || {})[ph] || {}; return row([ph === 'term' ? esc(n) : '', ph, Object.values(so).reduce((x, y) => x + y, 0).toFixed(1)].concat(SRC.map((k) => so[k] != null ? so[k] : '–'))); })).join('') + '</table>';
const ORIG = [...new Set(names.flatMap((n) => Object.keys(A.styles[n].byOrigin || {})))].sort();
document.getElementById('tOrig').innerHTML = '<table>' + row(['style'].concat(ORIG), true) + names.map((n) => row([esc(n)].concat(ORIG.map((o) => { const x = (A.styles[n].byOrigin || {})[o]; return x ? pc(x.early) + ' · ' + x.gold + ' · ' + x.skill + ' · ' + x.gpa : '–'; })))).join('') + '</table>';
document.getElementById('find').innerHTML = (A.findings || []).concat(A.diff || []).map((f) => '<li class="' + f.level + '"><b>' + esc(f.style) + '</b>: ' + esc(f.text) + '</li>').join('') || '<li>None.</li>';
</script></body></html>`;
}

/* ------------------------------------------------------------------ run */
async function run(opts = {}) {
  const styles = opts.styles || QUICK, games = opts.games || 40, seed = opts.seed || 5101;
  const jobs = []; for (const s of styles) for (let g = 0; g < games; g++) jobs.push([s, seed + g * 7919]);
  const workers = Math.max(1, Math.min(opts.workers || Math.max(1, os.cpus().length - 1), jobs.length));
  const records = [], t0 = Date.now();
  const progress = (opts.progress || (() => {}));
  if (workers === 1) {
    const Engine = require('../src/engine.js'), Policies = require('./policies.js');
    const { content } = require('./project.js').project(ROOT).compileAll();
    for (const [st, sd] of jobs) { records.push(playOne(content, Engine, Policies, st, sd)); progress(records.length, jobs.length); }
  } else {
    const chunks = Array.from({ length: workers }, () => []); jobs.forEach((j, i) => chunks[i % workers].push(j));
    await Promise.all(chunks.map((chunk) => new Promise((res, rej) => {
      const w = new Worker(__filename, { workerData: { analyzeWorker: true, jobs: chunk } });
      w.on('message', (r) => { records.push(r); progress(records.length, jobs.length); });
      w.on('error', rej); w.on('exit', (code) => (code ? rej(new Error('worker exited ' + code)) : res()));
    })));
  }
  const { content } = require('./project.js').project(ROOT).compileAll();
  let hash = null; try { hash = require('child_process').execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { /* not a checkout */ }
  const a = aggregate(records, content, { games, seed, styles, contentHash: hash, seconds: Math.round((Date.now() - t0) / 100) / 10, workers });
  a.findings = findings(a);
  if (opts.baseline) a.diff = compare(a, opts.baseline);
  return a;
}

async function main() {
  const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
  const sel = arg('styles', 'quick');
  const styles = sel === 'all' ? ALL : sel === 'quick' ? QUICK : sel.split(',');
  const out = path.resolve(ROOT, arg('out', 'build/analysis')), name = arg('name', 'analysis');
  const baseline = arg('baseline', null) ? JSON.parse(fs.readFileSync(path.resolve(arg('baseline')), 'utf8')) : null;
  const quiet = argv.includes('--quiet');
  const a = arg('from') ? JSON.parse(fs.readFileSync(path.resolve(arg('from')), 'utf8')) : await run({ styles, games: +arg('games', 40), seed: +arg('seed', 5101), workers: arg('workers') ? +arg('workers') : 0, baseline,
    progress: quiet ? null : (i, n) => { if (i % 50 === 0 || i === n) process.stderr.write('\r' + i + '/' + n + ' games'); } });
  if (arg('from')) { a.findings = findings(a); a.diff = baseline ? compare(a, baseline) : undefined; }
  else if (!quiet) process.stderr.write('\n');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, name + '.json'), JSON.stringify(a));
  fs.writeFileSync(path.join(out, name + '.md'), markdown(a));
  fs.writeFileSync(path.join(out, name + '.html'), html(a));
  const f = a.findings.concat(a.diff || []);
  console.log(Object.keys(a.styles).length + ' styles × ' + a.games + ' games in ' + a.seconds + ' s (' + a.workers + ' workers) → ' + path.relative(ROOT, path.join(out, name)) + '.{json,md,html}');
  for (const x of f) console.log('  ' + x.level.padEnd(5) + ' ' + x.style + ': ' + x.text);
  if (Object.values(a.styles).some((s) => s.crashed)) process.exitCode = 1;
}

module.exports = { summarize, aggregate, findings, compare, markdown, html, run, quantiles, mannWhitney, twoProp, ALPHA, QUICK, ALL, MILESTONES };
if (isMainThread && require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
