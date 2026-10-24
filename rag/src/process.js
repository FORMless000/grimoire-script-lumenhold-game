'use strict';
const { spawn } = require('child_process');
function run(command, argv, input, options = {}) {
  return new Promise((resolve, reject) => {
    const script = command.endsWith('.cjs');
    const child = spawn(script ? process.execPath : command, script ? [command, ...argv] : argv, { cwd: options.cwd, env: { ...process.env, ...options.env }, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.on('error', () => reject(new Error('Backend executable unavailable: ' + command)));
    child.stdout.on('data', (b) => { out += b; });
    child.stderr.on('data', (b) => { err = (err + b).slice(-4000); });
    child.on('close', (code) => code === 0 ? resolve(out) : reject(new Error('Backend command failed (' + command + ', exit ' + code + '). Check the isolated installation; no fallback.')));
    child.stdin.on('error', () => {});
    child.stdin.end(input == null ? '' : JSON.stringify(input));
  });
}
module.exports = { run };
