#!/usr/bin/env node
// Audit frozen sources/results and replay selected scenarios using their source snapshot.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {pathToFileURL, fileURLToPath} from 'node:url';
const run = path.resolve(process.argv[2] ?? '');
if (!process.argv[2]) throw Error('Usage: node validate-v02-run.mjs <run directory>');
const read = name => JSON.parse(fs.readFileSync(path.join(run, name)));
const manifest = read('manifest.json'), matches = read('matches.json');
assert.equal(matches.length, manifest.cases.length);
for (const [file, hash] of Object.entries(manifest.sourceHashes)) assert.equal(
  crypto.createHash('sha256').update(fs.readFileSync(path.join(run, 'sources', file))).digest('hex'), hash);
assert.equal(new Set(manifest.cases.map(c => JSON.stringify(c))).size, matches.length);
let ledgers = 0;
for (const [i, m] of matches.entries()) {
  assert.equal(m.caseId, i);
  for (const [k, value] of Object.entries(manifest.cases[i])) assert.deepEqual(m[k], value);
  assert.equal(m.commands.length, m.rounds);
  assert(m.rounds >= 1 && m.rounds <= 8);
  for (const ledger of m.ledgers) for (const r of Object.values(ledger)) {
    ledgers++;
    assert(r.final >= -1e-8 && r.final <= r.entry + 1e-8);
    assert(Math.abs(r.netLoss - (r.entry - r.final)) < 1e-8);
    assert(Math.abs(r.final - (r.before + r.refund)) < 1e-8);
  }
}
const adapter = await import(pathToFileURL(path.join(run, 'sources/iterations/v02/adapter.mjs')));
const engine = await import(pathToFileURL(path.join(run, 'sources/iterations/v02/engine.mjs')));
const ai = await import(pathToFileURL(path.join(run, 'sources/iterations/v02/ai.mjs')));
const {runMatch} = await import(pathToFileURL(path.join(run, 'sources/harness.mjs')));
let reconstructedDecisions = 0, boundedMistakes = 0, fullyReconstructedMatches = 0;
for (const m of matches) {
  // Historical mixed-policy runs record search steps only for alpha-beta actors.
  if(m.leftPolicy!=='alpha'||m.rightPolicy!=='alpha')continue;
  const game = adapter.create(m.config, {skillShift:m.skillShift, skillShiftSide:m.skillShiftSide??0});
  for (const d of m.searchStats) {
    assert.equal(engine.actorToMove(game), d.side);
    assert.equal(game.round, d.round);
    assert(engine.legalActions(game).includes(d.id));
    if (d.degraded) {
      assert(d.mistakeAttempted && d.id !== d.bestId);
      assert(d.regret > 0 && d.regret <= (game.config.ai?.[d.side]?.maxRegret ?? 35));
      assert.equal(d.rankingDepth, d.completedDepth);
      assert(ai.plausibleMistake(game,d.id));
      boundedMistakes++;
    }
    adapter.advance(game,d.id);reconstructedDecisions++;
  }
  assert.deepEqual(adapter.metrics(game).commands,m.commands);
  assert.deepEqual(adapter.metrics(game).ledgers,m.ledgers);
  fullyReconstructedMatches++;
}
const indices = [...new Set(Array.from({length: Math.min(24, matches.length)}, (_, i) =>
  Math.round(i * (matches.length - 1) / Math.max(1, Math.min(24, matches.length) - 1))))];
const resultKeys = ['outcomes', 'rounds', 'timeout', 'noWinner', 'ledgers', 'commands'];
for (const i of indices) {
  const replay = runMatch(adapter, manifest.cases[i]), original = matches[i];
  for (const k of resultKeys) assert.deepEqual(replay[k], original[k], `Replay ${i}: ${k}`);
  if(original.terminationReason!==undefined)assert.equal(replay.terminationReason,original.terminationReason);
  const withoutTiming = stats => stats.map(({elapsedMs, ...decision}) => decision);
  assert.deepEqual(withoutTiming(replay.searchStats), withoutTiming(original.searchStats), `Replay ${i}: search`);
}
const source = fs.readFileSync(fileURLToPath(import.meta.url));
const audit = {schema: 'v02-run-audit-1', matches: matches.length, resourceLedgerRows: ledgers,
  sourceHashesVerified: true, exactUniqueCasesVerified: true, ledgerCapsAndAccountingVerified: true,
  replayIndices: indices, deterministicResultsAndSearchVerified: true,
  excludedCases: manifest.excludedCases?.length ?? 0,
  fullyReconstructedMatches, reconstructedDecisions, boundedMistakesVerified:boundedMistakes,
  validationSourceHash: crypto.createHash('sha256').update(source).digest('hex'),
  note: 'Replays compare commands, outcomes, ledgers and all search data except wall-clock duration.'};
fs.copyFileSync(fileURLToPath(import.meta.url), path.join(run, 'sources', path.basename(fileURLToPath(import.meta.url))), fs.constants.COPYFILE_EXCL);
fs.writeFileSync(path.join(run, 'audit.json'), JSON.stringify(audit, null, 2), {flag: 'wx'});
console.log(JSON.stringify(audit, null, 2));
