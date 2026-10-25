#!/usr/bin/env node
'use strict';
// The checks a change passes before it's finished (AGENTS.md, "Checks").
//
//   node tools/verify.js          the quick gate (npm run verify, about a minute): version, bundles, lint, format,
//                                 generated docs; then the unit tests (the slow whole-game style tests skipped) and
//                                 the golden diff, side by side
//   node tools/verify.js --full   everything (npm run verify:full, about ten minutes): the slow tests too, balance
//                                 --quick, then the browser e2e (--server --quick); for engine, UI or balance changes
//
// The fast checks run in order and stop at the first failure; each group after them runs at once, and every step's
// output is printed whole, in order, with its time.
const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const full = process.argv.includes('--full');
const node = (...args) => [process.execPath, ...args];
const FAST = [
  ['version', node('tools/version.js', '--check')],
  ['bundles', node('tools/grim.js', 'build', '--check')],
  ['lint', node('tools/grim.js', 'lint')],
  ['format', node('tools/grim.js', 'fmt', '--check')],
  ['docs', node('tools/grim.js', 'docs', '--check')],
];
const GROUPS = [
  [['tests', ['sh', '-c', '"$0" --test --test-reporter=dot test/*.test.js', process.execPath]], ['golden diff', node('tools/grim.js', 'diff')]]
    .concat(full ? [['balance', node('tools/grim.js', 'balance', '--quick')]] : []),
].concat(full ? [[['browser e2e', node('tools/e2e.js', '--server', '--quick')]]] : []);

function run([name, [cmd, ...args]]) {
  const start = Date.now();
  return new Promise((resolve) => {
    const env = { ...process.env, ...(full ? { LUMENHOLD_FULL: '1' } : {}) };
    const p = spawn(cmd, args, { cwd: ROOT, env }), out = [];
    p.stdout.on('data', (d) => out.push(d)); p.stderr.on('data', (d) => out.push(d));
    p.on('close', (code) => resolve({ name, code, out: Buffer.concat(out).toString(), secs: Math.round((Date.now() - start) / 1000) }));
  });
}
const report = (r) => {
  process.stdout.write(r.out.endsWith('\n') || !r.out ? r.out : r.out + '\n');
  console.log((r.code ? '✖ ' : '✔ ') + r.name + ' (' + r.secs + 's)' + (r.code ? ' failed, exit ' + r.code : '') + '\n');
  return !r.code;
};

(async () => {
  const start = Date.now();
  for (const step of FAST) if (!report(await run(step))) process.exit(1);
  for (const group of GROUPS) {
    const results = await Promise.all(group.map(run));
    if (!results.map(report).every(Boolean)) process.exit(1);
  }
  console.log('verify' + (full ? ' --full' : '') + ': all passed in ' + Math.round((Date.now() - start) / 1000) + 's' + (full ? '' : ' (npm run verify:full adds the slow tests, balance and the browser e2e)'));
})();
