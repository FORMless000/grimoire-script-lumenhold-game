#!/usr/bin/env node
// Fills empty translations whose English is identical to an already-translated string in the same
// .lang file (e.g. a say duplicated into both branches of an `if`). Usage: node tools/i18n-fill-dupes.js zh-CN
'use strict';
const fs = require('fs'), path = require('path');
const lang = process.argv[2] || 'zh-CN';
const root = path.join(__dirname, '..', 'locales', lang);
let filled = 0;
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) { if (f !== '_in') walk(p); continue; }
    if (!f.endsWith('.lang')) continue;
    const lines = fs.readFileSync(p, 'utf8').split('\n');
    const known = {};
    for (let i = 1; i < lines.length; i++) {
      const m = lines[i].match(/^\S+(?: \[[0-9a-f]+\])? = (.+)$/);
      if (m && lines[i - 1].startsWith('# en: ')) known[lines[i - 1].slice(6)] = m[1];
    }
    let changed = false;
    for (let i = 1; i < lines.length; i++) {
      const m = lines[i].match(/^(\S+(?: \[[0-9a-f]+\])?) =\s*$/);
      if (!m || !lines[i - 1].startsWith('# en: ')) continue;
      const tr = known[lines[i - 1].slice(6)];
      if (tr) { lines[i] = m[1] + ' = ' + tr; filled++; changed = true; }
    }
    if (changed) fs.writeFileSync(p, lines.join('\n'));
  }
})(root);
console.log('filled ' + filled + ' duplicate string(s) in ' + lang);
