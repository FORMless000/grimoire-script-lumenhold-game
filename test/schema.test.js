'use strict';
// The frozen content format (design §12): schema v1 may only grow.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const M = require('../tools/schema-manifest.js');
const frozen = require(path.join(__dirname, 'golden', 'schema-v1.json'));

test('schema v1: nothing removed or changed (legacy constructs excepted)', () => {
  const d = M.compare(frozen, M.manifest());
  assert.deepStrictEqual(d.removed, [], 'removed from the frozen format');
  assert.deepStrictEqual(d.changed, [], 'changed in the frozen format');
});

test('schema v1: every sample statement parses to its kind', () => {
  for (const [line, t] of Object.entries(frozen.samples)) {
    if (frozen.legacy.samples.includes(line)) continue;
    assert.strictEqual(M.parseSample(line), t, line);
  }
});

test('schema v1: compare() flags a removal and allows a legacy retirement', () => {
  const cur = M.manifest();
  const fake = JSON.parse(JSON.stringify(cur));
  fake.blocks.event.props.push('vanished_prop');
  fake.statements.push('vanished_stmt');
  let d = M.compare(fake, cur);
  assert.ok(d.removed.includes('property event.vanished_prop'));
  assert.ok(d.removed.includes('statement vanished_stmt'));
  // `check` was retired (a legacy entry): a manifest that still had it may lose it.
  const withCheck = JSON.parse(JSON.stringify(cur));
  withCheck.statements.push('check');
  d = M.compare(withCheck, cur);
  assert.deepStrictEqual(d.removed, []);
  assert.ok(d.retired.includes('statement check'));
});

test('schema v1: the content declares a schema the parser knows', () => {
  const { content } = require('../tools/project.js').project(path.join(__dirname, '..')).compileAll();
  assert.ok(content.game.schema >= 1 && content.game.schema <= frozen.schema);
});
