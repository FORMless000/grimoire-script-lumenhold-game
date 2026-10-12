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
const read = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8');
const write = (dir, f, text) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), text); };

module.exports = { ROOT, FIXTURE, tempProject, read, write };
