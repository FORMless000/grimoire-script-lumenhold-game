#!/usr/bin/env node
// Helper for scripts/host.{sh,ps1,cmd}: prints the admin token (creating and keeping one in DATA_DIR/.host-token
// on first use), or the addresses other machines can reach this one on. No dependencies.
//   node scripts/host-info.js token     → the token
//   node scripts/host-info.js urls PORT TOKEN
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const [cmd, port, token] = process.argv.slice(2);
if (cmd === 'token') {
  const dir = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));
  const file = path.join(dir, '.host-token');
  let t = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : '';
  if (!t) { fs.mkdirSync(dir, { recursive: true }); t = crypto.randomBytes(12).toString('hex'); fs.writeFileSync(file, t + '\n', { mode: 0o600 }); }
  process.stdout.write(t);
} else if (cmd === 'urls') {
  const q = token ? '?token=' + token : '';
  const lan = Object.values(os.networkInterfaces()).flat().filter((a) => a && a.family === 'IPv4' && !a.internal).map((a) => a.address);
  console.log('  This machine:   http://localhost:' + port + '/' + q);
  for (const ip of lan) console.log('  Local network:  http://' + ip + ':' + port + '/' + q);
  if (!lan.length) console.log('  (no network address found: is this machine connected to a network?)');
  console.log('  Admin:          http://localhost:' + port + '/admin' + q);
  console.log('');
  console.log('  Players need the link with ?token=… for saves and run logs. The same token opens /admin:');
  console.log('  share it only with people you trust. Saves (autosave + 3 slots) are shared by everyone on this server.');
} else { console.error('usage: host-info.js token | urls PORT TOKEN'); process.exit(2); }
