'use strict';
const fs = require('fs');
const path = require('path');

// Read one credential as data; never source/execute a local shell file.
function openRouterKey(root = path.resolve(__dirname, '../..'), env = process.env) {
  if (env.OPENROUTER_API_KEY?.trim()) return env.OPENROUTER_API_KEY.trim();
  const file = path.join(root, '.env.local');
  if (!fs.existsSync(file)) return '';
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const values = lines.filter((line) => /^\s*OPENROUTER_API_KEY\s*=/.test(line));
  if (values.length > 1) throw new Error('Duplicate OPENROUTER_API_KEY entries in .env.local');
  let value = (values[0] || '').replace(/^\s*OPENROUTER_API_KEY\s*=\s*/, '').trim();
  if (value.startsWith('"') || value.startsWith("'")) {
    if (value.at(-1) !== value[0] || value.length < 2) throw new Error('Invalid quoting for OPENROUTER_API_KEY in .env.local');
    value = value.slice(1, -1);
  }
  return value;
}
module.exports = { openRouterKey };
