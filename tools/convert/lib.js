/*
 * Shared helpers for the converters in tools/convert/ (the framework migrations, 0046+). They read structure only:
 * compiled content for meaning, and a block's source lines for where its properties are written.
 */
'use strict';
const fs = require('fs');
const path = require('path');

// A block's source: its header line (1-based), the line after its last, and each column-0 property as written
// ({ line, text, multi }: multi when continuation lines follow). Options and their bodies are skipped.
function blockSource(lines, header) {
  let end = lines.length + 1;
  for (let i = header; i < lines.length; i++) if (/^@[a-z]/.test(lines[i])) { end = i + 1; break; }
  const props = {};
  for (let n = header + 1; n < end; n++) {
    const L = lines[n - 1];
    const m = L.match(/^([a-z_][a-z0-9_]*)\s*:\s*(.*)$/);
    if (!m) continue;
    const next = lines[n] || '';
    props[m[1]] = { line: n, text: m[2].trim(), multi: /^\s+\S/.test(next) && !/^\s*>/.test(next) && !/^[a-z_]+\s*:/.test(next) && n + 1 < end };
  }
  return { header, end, props };
}

// Where a new block goes before a card: above the comment lines that sit right on top of its header.
function insertionPoint(lines, header) {
  let n = header - 1;
  while (n >= 1 && /^\s*(#|\/\/)/.test(lines[n - 1])) n--;
  return n;   // insertAfter(n): 0 is the top of the file
}

// A unique id built from parts.
function uniqueId(taken, ...parts) {
  const base = parts.filter(Boolean).join('_').replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  let id = base, k = 2;
  while (taken.has(id)) id = base + '_' + k++;
  taken.add(id);
  return id;
}

function writeReport(root, name, data) {
  const dir = path.join(root, 'build', 'convert');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name + '.json'), JSON.stringify(data, null, 1) + '\n');
}

const stem = (file) => path.basename(file, '.grim');

module.exports = { blockSource, insertionPoint, uniqueId, writeReport, stem };
