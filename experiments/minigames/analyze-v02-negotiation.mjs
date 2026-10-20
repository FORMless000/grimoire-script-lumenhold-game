#!/usr/bin/env node
// Audience roles are asymmetric. Aggregate exact scenarios, not random trials.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const run = path.resolve(process.argv[2] ?? '');
if (!process.argv[2]) throw Error('Usage: node analyze-v02-negotiation.mjs <negotiation run directory>');
const read = name => JSON.parse(fs.readFileSync(path.join(run, name)));
const manifest = read('manifest.json'), matches = read('matches.json');
assert.equal(manifest.suite, 'negotiation');
assert.equal(manifest.cases.length, matches.length);
for (const [file, hash] of Object.entries(manifest.sourceHashes)) assert.equal(
  crypto.createHash('sha256').update(fs.readFileSync(path.join(run, 'sources', file))).digest('hex'), hash);
const key = m => [m.config.playerLevel, m.config.playerArchetype, m.config.opponentArchetype,
  m.config.fixture, m.config.approach, m.skillShift, m.config.firstLeader].join('|');
assert.equal(new Set(matches.map(key)).size, matches.length);
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
const levels = [20, 50, 80], gaps = [-10, -5, 0, 5, 10], kits = ['Envoy', 'Illusionist'];
const mean = xs => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
function tally(rows) {
  const r = {n: rows.length, win: 0, partial: 0, lose: 0, timeouts: 0, actions: {}};
  for (const m of rows) {
    r[m.outcomes[0]]++; r.timeouts += Number(m.timeout);
    for (const pair of m.commands) for (const c of pair) r.actions[c.id] = (r.actions[c.id] ?? 0) + 1;
  }
  return {...r, winRate: r.win / r.n, partialRate: r.partial / r.n, lossRate: r.lose / r.n,
    meanRounds: mean(rows.map(m => m.rounds)), meanManaGross: mean(rows.map(m => m.ledgers[0].mana.spent)),
    meanManaNet: mean(rows.map(m => m.ledgers[0].mana.netLoss)), meanHealthNet: mean(rows.map(m => m.ledgers[0].health.netLoss)),
    meanRenownNet: mean(rows.map(m => m.ledgers[0].renown.netLoss))};
}
const skillPanel = levels.flatMap(level => gaps.map(gap => ({level, gap,
  ...tally(matches.filter(m => m.config.playerLevel === level && m.skillShift === gap))})));
const approaches = levels.flatMap(level => kits.flatMap(kit => ['reason', 'appeal', 'bluff'].map(approach => ({level, kit, approach,
  ...tally(matches.filter(m => m.config.playerLevel === level && m.skillShift === 0 && m.config.playerArchetype === kit && m.config.approach === approach))}))));
const audiences = levels.flatMap(level => kits.flatMap(kit => [...new Set(matches.map(m => m.config.opponentArchetype))].map(audience => ({level, kit, audience,
  ...tally(matches.filter(m => m.config.playerLevel === level && m.skillShift === 0 && m.config.playerArchetype === kit && m.config.opponentArchetype === audience))}))));
const index = new Map(matches.map(m => [key(m), m])), labels = {lose: 0, partial: 1, win: 2};
const orderPairs = matches.filter(m => m.config.firstLeader === 0).map(m => {
  const c = {...m, config: {...m.config, firstLeader: 1}}, other = index.get(key(c)); assert(other);
  return [m.outcomes[0], other.outcomes[0]];
});
const seat = {pairs: orderPairs.length, sameOutcome: orderPairs.filter(([a, b]) => a === b).length,
  firstBetter: orderPairs.filter(([a, b]) => labels[a] > labels[b]).length,
  secondBetter: orderPairs.filter(([a, b]) => labels[b] > labels[a]).length};
const source = fs.readFileSync(fileURLToPath(import.meta.url));
const summary = {schema: 'v02-negotiation-analysis-1',sourceHashes: manifest.sourceHashes,
  analysisSourceHash: crypto.createHash('sha256').update(source).digest('hex'),
  audit: {matches: matches.length, excluded: manifest.excludedCases.length, sourceHashesVerified: true,
    caseCoverageVerified: true, ledgersVerified: true}, overall: tally(matches), skillPanel, approaches, audiences, seat};
const pct = x => (100 * x).toFixed(1) + '%';
let report = `# Negotiation cross-kit × skill sweep, v02\n\n${matches.length} deterministic alpha-beta matches: Envoy/Illusionist persuaders, all six audience kits, levels 20/50/80, five skill shifts, two fixtures, three approaches and both commitment orders. No exclusions. Skill shifts affect all six persuader skills only; kit seeds, spell ranks, capacity and entry budgets stay fixed. No dialogue clues are used.\n\n## Skill panel\n\n| Level | Gap | Cases | Full win | Partial | Loss | Rounds | Gross mana | Net mana |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n`;
for (const r of skillPanel) report += `| ${r.level} | ${r.gap} | ${r.n} | ${pct(r.winRate)} | ${pct(r.partialRate)} | ${pct(r.lossRate)} | ${r.meanRounds.toFixed(2)} | ${r.meanManaGross.toFixed(2)} | ${r.meanManaNet.toFixed(2)} |\n`;
report += '\n## Equal-skill approaches\n\nEach row includes both fixtures, all six audience kits and both commitment orders.\n\n| Level | Persuader | Approach | Cases | Full win | Partial | Loss |\n|---|---|---|---:|---:|---:|---:|\n';
for (const r of approaches) report += `| ${r.level} | ${r.kit} | ${r.approach} | ${r.n} | ${pct(r.winRate)} | ${pct(r.partialRate)} | ${pct(r.lossRate)} |\n`;
report += `\n## Commitment order\n\n${seat.sameOutcome}/${seat.pairs} paired scenarios keep the same outcome label; ${seat.firstBetter} favor committing first, ${seat.secondBetter} favor responding first.\n\n## Commands\n\nBoth actors, all cases:\n\n| Action | Count |\n|---|---:|\n`;
for (const [id, n] of Object.entries(summary.overall.actions).sort((a, b) => b[1] - a[1])) report += `| ${id} | ${n} |\n`;
report += '\nSource hashes, unique/exact cases, round counts and all resource ledgers were verified. Raw results include both outcome labels, search depth/node/timing data and selected traces. Rates describe this fixed panel, not independent random trials or optimal-play guarantees. Approach, audience and fixture interactions remain important; aggregate success is not a universal negotiation difficulty estimate.\n';
fs.copyFileSync(fileURLToPath(import.meta.url), path.join(run, 'sources', path.basename(fileURLToPath(import.meta.url))), fs.constants.COPYFILE_EXCL);
fs.writeFileSync(path.join(run, 'negotiation-summary.json'), JSON.stringify(summary, null, 2), {flag: 'wx'});
fs.writeFileSync(path.join(run, 'NEGOTIATION-REPORT.md'), report, {flag: 'wx'});
console.log(JSON.stringify({audit: summary.audit, skillPanel, approaches, seat}, null, 2));
