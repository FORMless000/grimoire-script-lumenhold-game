'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const ledger = JSON.parse(fs.readFileSync(path.join(__dirname, 'progress.json')));
const { content, errors } = require(root + '/tools/project.js').project(root).compileAll();
assert.equal(errors.length, 0);
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), ledger.head);
function scrub(value) {
  if (typeof value === 'function') return undefined;
  if (Array.isArray(value)) return value.map(scrub);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().filter(k => !['file','line'].includes(k))
    .map(k => [k, scrub(value[k])]).filter(([,v]) => v !== undefined));
}
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(scrub(value))).digest('hex'); }
assert.equal(ledger.queue.length, 644);
assert.equal(ledger.reviewed.length, 644);
assert.equal(new Set(ledger.reviewed).size, 644);
assert.equal(ledger.remaining.length, 0);
assert.equal(ledger.finalizedCardCount, 644);
assert.equal(ledger.completedBatches.length, ledger.verdictsWritten.length);
assert.equal(new Set(ledger.verdictsWritten).size, ledger.verdictsWritten.length);
const reviewed = new Map();
let findings = 0, accepted = 0, evidenceReferences = 0;
const affected = new Set();
for (const file of ledger.verdictsWritten) {
  const report = JSON.parse(fs.readFileSync(path.join(root, file)));
  assert.equal(report.reviewComplete, true, file);
  assert.equal(report.scope.head, ledger.head, file);
  assert.equal(report.scope.contentHash, ledger.contentHash, file);
  assert(report.reviewer.includes('Codex'), file);
  if (report.accept) accepted++;
  findings += report.issues.length;
  const scope = new Set(report.scope.reviewedEventIds);
  for (const id of scope) {
    assert(!reviewed.has(id), 'duplicate report scope: ' + id);
    reviewed.set(id, file);
    const row = ledger.queue.find(r => r.id === id);
    assert(row && row.status.startsWith('reviewed:'), id);
    assert.equal(row.report, file, id);
    assert.equal(hash(content.events[id]), row.compiledDefinitionHash, id);
    assert.equal(report.scope.compiledDefinitionHashes[id], row.compiledDefinitionHash, id);
  }
  for (const issue of report.issues) {
    assert(scope.has(issue.event), file + ': ' + issue.event);
    assert(issue.problem && issue.fix);
    for (const id of [issue.event, ...(issue.affectedEvents || [])]) {
      assert(scope.has(id), file + ': affected ' + id);
      affected.add(id);
    }
  }
  for (const file of report.evidence || []) {
    assert.equal(typeof file, 'string');
    assert(fs.existsSync(path.resolve(root, file)), 'missing evidence: ' + file);
    evidenceReferences++;
  }
}
assert.equal(reviewed.size, 644);
assert(ledger.queue.every(row => reviewed.has(row.id)));
const definitions = Object.values(content.events);
const disabled = definitions.filter(e => (e.tags || []).includes('retired') || e.when?.src?.trim() === 'false').length;
assert.equal(definitions.length, 2187);
assert.equal(disabled, 40);
console.log(JSON.stringify({ head: ledger.head, contentHash: ledger.contentHash,
  totalDefinitions: definitions.length, activeDefinitions: definitions.length - disabled,
  disabledDefinitions: disabled, reviewedCards: reviewed.size, remainingCards: ledger.remaining.length,
  matchingScopedDefinitionHashes: reviewed.size, completedBatches: ledger.verdictsWritten.length,
  acceptedBatches: accepted, rejectedBatches: ledger.verdictsWritten.length - accepted,
  findings, affectedScopedCards: affected.size, evidenceReferencesValidated: evidenceReferences }, null, 2));
