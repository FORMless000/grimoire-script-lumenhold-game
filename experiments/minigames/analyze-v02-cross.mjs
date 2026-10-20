#!/usr/bin/env node
// Deterministic scenario analysis. No statistical replications or confidence intervals.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const run = path.resolve(process.argv[2] ?? '');
if (!process.argv[2]) throw Error('Usage: node analyze-v02-cross.mjs <cross run directory>');
const json = name => JSON.parse(fs.readFileSync(path.join(run, name)));
const manifest = json('manifest.json'), matches = json('matches.json');
assert.equal(manifest.suite, 'cross');
assert.equal(matches.length, manifest.cases.length);
for (const [file, hash] of Object.entries(manifest.sourceHashes)) {
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(run, 'sources', file))).digest('hex'), hash);
}
const key = m => [m.config.playerLevel, m.config.playerArchetype, m.config.opponentArchetype].join('|');
const caseKey = m => [key(m), m.skillShift, m.config.firstLeader].join('|');
assert.equal(new Set(matches.map(caseKey)).size, matches.length);
for (const [i, m] of matches.entries()) {
  assert.equal(m.caseId, i);
  assert.deepEqual(m.config, manifest.cases[i].config);
  assert.equal(m.skillShift, manifest.cases[i].skillShift);
  assert.equal(m.commands.length, m.rounds);
  for (const ledger of m.ledgers) for (const r of Object.values(ledger)) {
    assert(r.final >= -1e-8 && r.final <= r.entry + 1e-8);
    assert(Math.abs(r.netLoss - (r.entry - r.final)) < 1e-8);
    assert(Math.abs(r.final - (r.before + r.refund)) < 1e-8);
  }
}
const gaps = [-10, -5, 0, 5, 10], levels = [20, 50, 80];
const archetypes = [...new Set(matches.map(m => m.config.playerArchetype))];
const panels = new Map();
for (const m of matches) {const p = panels.get(key(m)) ?? []; p.push(m); panels.set(key(m), p);}
// Only compare skill shifts on matchups with all ten gap/order combinations.
const completeKeys = new Set([...panels].filter(([, rows]) => rows.length === gaps.length * 2).map(([k]) => k));
const paired = matches.filter(m => completeKeys.has(key(m)));
const baseline = matches.filter(m => m.skillShift === 0);
const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
function tally(rows) {
  const r = {n: rows.length, win: 0, partial: 0, lose: 0, timeouts: 0, mutualKO: 0, noWinner: 0, actions: {}};
  for (const m of rows) {
    r[m.outcomes[0]]++;
    r.timeouts += Number(m.timeout);
    r.mutualKO += Number(!m.timeout && m.outcomes.every(o => o === 'partial'));
    r.noWinner += Number(m.noWinner);
    for (const pair of m.commands) for (const c of pair) r.actions[c.id] = (r.actions[c.id] ?? 0) + 1;
  }
  return {...r, winRate: r.win / r.n, partialRate: r.partial / r.n, lossRate: r.lose / r.n,
    timeoutRate: r.timeouts / r.n, meanRounds: mean(rows.map(m => m.rounds)),
    meanFocalManaGross: mean(rows.map(m => m.ledgers[0].mana.spent)),
    meanFocalManaNet: mean(rows.map(m => m.ledgers[0].mana.netLoss)),
    meanFocalHealthNet: mean(rows.map(m => m.ledgers[0].health.netLoss))};
}
const pairedSkills = levels.flatMap(level => gaps.map(gap => ({level, gap,
  ...tally(paired.filter(m => m.config.playerLevel === level && m.skillShift === gap))})));
const mirroredSkills = levels.flatMap(level => gaps.map(gap => ({level, gap,
  ...tally(paired.filter(m => m.config.playerLevel === level && m.skillShift === gap && m.config.playerArchetype === m.config.opponentArchetype))})));
const matrices = levels.map(level => ({level, cells: archetypes.flatMap(a => archetypes.map(b => ({a, b,
  ...tally(baseline.filter(m => m.config.playerLevel === level && m.config.playerArchetype === a && m.config.opponentArchetype === b))})))}));
const index = new Map(matches.map(m => [caseKey(m), m]));
const ordinal = {lose: 0, partial: 1, win: 2};
const leaderPairs = matches.filter(m => m.config.firstLeader === 0).map(m => {
  const other = index.get([key(m), m.skillShift, 1].join('|'));
  assert(other);
  return {level: m.config.playerLevel, gap: m.skillShift, a: m.config.playerArchetype, b: m.config.opponentArchetype,
    outcomes: [m.outcomes[0], other.outcomes[0]], rounds: [m.rounds, other.rounds]};
});
const seat = {pairs: leaderPairs.length, sameOutcome: leaderPairs.filter(p => p.outcomes[0] === p.outcomes[1]).length,
  firstBetter: leaderPairs.filter(p => ordinal[p.outcomes[0]] > ordinal[p.outcomes[1]]).length,
  secondBetter: leaderPairs.filter(p => ordinal[p.outcomes[1]] > ordinal[p.outcomes[0]]).length,
  first: tally(matches.filter(m => m.config.firstLeader === 0)),
  second: tally(matches.filter(m => m.config.firstLeader === 1)),
  changed: leaderPairs.filter(p => p.outcomes[0] !== p.outcomes[1])};
const trajectories = [...completeKeys].flatMap(k => [0, 1].map(firstLeader => {
  const rows = gaps.map(gap => index.get([k, gap, firstLeader].join('|')));
  const labels = rows.map(m => m.outcomes[0]);
  return {key: k, firstLeader, labels,
    nonmonotonic: labels.some((label, i) => i && ordinal[label] < ordinal[labels[i - 1]])};
}));
const dominantPairs = levels.flatMap(level => archetypes.flatMap(a => archetypes.filter(b => b !== a).flatMap(b => {
  const rows = paired.filter(m => m.config.playerLevel === level && m.config.playerArchetype === a && m.config.opponentArchetype === b);
  return rows.length && rows.every(m => m.outcomes[0] === 'win') ? [{level, a, b}] : [];
})));
const analysis = {schema: 'v02-cross-analysis-1',sourceHashes: manifest.sourceHashes,
  analysisSourceHash: crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'),
  audit: {matches: matches.length, excluded: manifest.excludedCases.length, pairedMatches: paired.length,
    sourceHashesVerified: true, caseCoverageVerified: true, ledgersVerified: true},
  overall: tally(matches), baseline: tally(baseline), pairedSkills, mirroredSkills, matrices, seat,
  dominantPairs, nonmonotonicTrajectories: trajectories.filter(t => t.nonmonotonic),
  baselineByKit: levels.flatMap(level => archetypes.map(a => ({level, archetype: a,
    ...tally(baseline.filter(m => m.config.playerLevel === level && m.config.playerArchetype === a))}))),
  excludedCases: manifest.excludedCases};
const pct = x => (100 * x).toFixed(1) + '%';
let report = `# Cross-kit × skill sweep, v02\n\n${matches.length} deterministic alpha-beta versus alpha-beta matches; levels 20/50/80, six kits, five focal skill shifts and both initial commitment orders. ${manifest.excludedCases.length} invalid cases excluded; ${paired.length} cases form a complete paired panel. No rule or AI tuning during this run.\n\nSkills alone shift: ranks, kit seeds, capacity and entry budgets stay fixed. These are finite-panel outcome fractions, not probabilities or independent random trials. Partial outcomes remain separate from full wins.\n\n## Skill differences, complete paired panel\n\nLevel 20 excludes the focal Evoker from **every gap** in this table to keep the compared matchups identical. The equal-skill matrices below include it.\n\n| Level | Gap | Matches | Full win | Partial | Loss | Timeout | Rounds | Gross mana | Net mana | Net Health |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n`;
for (const r of pairedSkills) report += `| ${r.level} | ${r.gap > 0 ? '+' : ''}${r.gap} | ${r.n} | ${pct(r.winRate)} | ${pct(r.partialRate)} | ${pct(r.lossRate)} | ${pct(r.timeoutRate)} | ${r.meanRounds.toFixed(2)} | ${r.meanFocalManaGross.toFixed(2)} | ${r.meanFocalManaNet.toFixed(2)} | ${r.meanFocalHealthNet.toFixed(2)} |\n`;
report += '\n## Equal-skill matchup matrices\n\nRows are the focal kit, columns the opponent. Each cell lists **full wins / partial outcomes / losses**, out of two initial commitment orders. Gap 0 means no skill adjustment; archetypes retain their different generated stats.\n';
for (const matrix of matrices) {
  report += `\n### Level ${matrix.level}\n\n| Focal / opponent | ${archetypes.join(' | ')} |\n|---|${archetypes.map(() => '---:').join('|')}|\n`;
  for (const a of archetypes) report += `| ${a} | ${archetypes.map(b => {const c = matrix.cells.find(c => c.a === a && c.b === b); return `${c.win}/${c.partial}/${c.lose}`;}).join(' | ')} |\n`;
}
report += '\n## Mirrored kits, complete paired panel\n\n| Level | Gap | Matches | Full win | Partial | Loss |\n|---|---:|---:|---:|---:|---:|\n';
for (const r of mirroredSkills) report += `| ${r.level} | ${r.gap} | ${r.n} | ${pct(r.winRate)} | ${pct(r.partialRate)} | ${pct(r.lossRate)} |\n`;
report += `\n## Initial commitment order\n\nOf ${seat.pairs} order pairs, ${seat.sameOutcome} have the same focal label, ${seat.firstBetter} favor committing first, and ${seat.secondBetter} favor responding first. “Better” orders the recorded labels loss < partial < full win; it does not value a mutual knockout as a desirable result.\n\n${analysis.nonmonotonicTrajectories.length} of ${trajectories.length} complete skill trajectories have a worse label somewhere as skills increase; exact cases are in cross-summary.json.\n\n## Commands and economy\n\nCounts include both actors over the entire sweep.\n\n| Action | Count |\n|---|---:|\n`;
for (const [id, n] of Object.entries(analysis.overall.actions).sort((a, b) => b[1] - a[1])) report += `| ${id} | ${n} |\n`;
report += `\n${analysis.overall.mutualKO} mutual knockouts; ${analysis.overall.timeouts} eight-exchange timeouts; ${analysis.overall.noWinner} cases in which both actors receive a loss. Full-win labels can include timeout adjudication. Resource values use the unchanged practice-duel rebates and residual-flux collection.\n\n## Validation and limitations\n\nSource snapshot hashes, exact case coverage, unique cases, round counts and every settlement ledger were checked. Exclusions are explicit in manifest.json and cross-summary.json. Skill deltas change all six skills; this panel isolates skills, not actual level differences (which also change seeded stats, ranks and mana capacity). Only these three seeds, fixed default Health, default mana costs and the current search heuristic are covered.\n`;
for (const [name, content] of [['cross-summary.json', JSON.stringify(analysis, null, 2)], ['CROSS-REPORT.md', report]]) {
  fs.writeFileSync(path.join(run, name), content, {flag: 'wx'});
}
console.log(JSON.stringify({audit: analysis.audit,baseline: analysis.baseline,seat: {...seat,first: undefined,second: undefined,changed: undefined},nonmonotonic: analysis.nonmonotonicTrajectories.length}, null, 2));
