'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE = path.join(__dirname, 'fixtures', 'mini');

// A fresh, writable copy of the fixture project (removed when the process exits).
function tempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumenhold-test-'));
  fs.cpSync(FIXTURE, dir, { recursive: true });
  process.on('exit', () => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* ignore */ } });
  return dir;
}
// The real content, compiled once per test file on first use.
let compiled = null;
const compileContent = () => (compiled = compiled || require('../tools/project.js').project(ROOT).compileAll());
// Runs fn with the engine's warnings muted (`silent` mutes console.log too).
const mute = (keys) => (fn) => { const was = keys.map((k) => console[k]); keys.forEach((k) => { console[k] = () => {}; }); try { return fn(); } finally { keys.forEach((k, i) => { console[k] = was[i]; }); } };
const quiet = mute(['warn']), silent = mute(['warn', 'log']);
const read = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8');
const write = (dir, f, text) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), text); };

// Tests that play whole games per play style run only in `npm run verify:full` (LUMENHOLD_FULL=1); the quick
// `npm run verify` skips them. Pass as test(name, slow, fn).
const slow = process.env.LUMENHOLD_FULL ? {} : { skip: 'slow: npm run verify:full runs it' };

module.exports = {
  ROOT, FIXTURE, tempProject, read, write, quiet, silent, compileContent, slow,
  get content() { return compileContent().content; },
  get sources() { return compileContent().sources; },
};
