/*
 * Canonical formatter for Grimoire Script (.grim). Used by `node tools/grim.js fmt`.
 *
 * Lossless: comments and blank-line grouping are kept; only layout changes. The canonical form is:
 *   - LF line endings, no trailing whitespace, tabs expanded, one final newline
 *   - at most one blank line in a row, none at the start of a file or right after a block header
 *   - a blank line before every `@block` header (before its leading comments, if any)
 *   - `@kind id`, `key: value`, `> key: Label` spacing
 *   - effect bodies indented 2 spaces per nesting level; text continuation lines indented 2 spaces
 *   - `say: …`, `else:`, `gold -10`, `gold +5~8`, `rel npc +4` spacing
 * Expressions and text are never rewritten. formatChecked() refuses any result that does not
 * compile to exactly the same content as the input.
 */
'use strict';
const G = require('../src/grimoire.js');

const ID = '[a-z_][a-z0-9_]*';
const RE_HEADER = /^@([a-z]+)(?:\s+([a-z_][a-z0-9_]*(?:\.[a-z_][a-z0-9_]*)?))?\s*$/;
const RE_OPTION = /^>\s*([a-z_][a-z0-9_]*)\s*:\s*(.*)$/;
const RE_PROP = /^([a-z_][a-z0-9_]*)\s*:\s*(.*)$/;
const RE_AMOUNT = new RegExp('^(?:(rel|love)\\s+)?(' + ID + ')\\s*([+-])\\s*(\\d+)(?:\\s*~\\s*(\\d+))?$');
const isComment = (c) => c.startsWith('#') || c.startsWith('//');

// One effect statement, spacing only.
function normStatement(c) {
  let m;
  if ((m = c.match(/^say\s*:\s*(.*)$/))) return 'say: ' + m[1];
  if (/^else\s*:$/.test(c)) return 'else:';
  if ((m = c.match(RE_AMOUNT))) return (m[1] ? m[1] + ' ' : '') + m[2] + ' ' + m[3] + m[4] + (m[5] != null ? '~' + m[5] : '');
  return c;
}

function format(text) {
  const src = String(text).replace(/\r\n?/g, '\n').split('\n').map((l) => l.replace(/\t/g, '  ').replace(/\s+$/, ''));
  const rows = [];   // {kind: 'blank'|'comment'|'code', indent, text}
  let blockKind = null, region = null, stack = [], optionBase = null;
  for (const raw of src) {
    const c = raw.trim();
    const indent = raw.length - raw.trimStart().length;
    if (!c) { rows.push({ kind: 'blank' }); continue; }
    if (isComment(c)) { rows.push({ kind: 'comment', indent, text: c }); continue; }
    if (indent === 0) {
      let m, out = c;
      region = null; stack = []; optionBase = null;
      if ((m = c.match(RE_HEADER))) { blockKind = m[1]; out = '@' + m[1] + (m[2] ? ' ' + m[2] : ''); rows.push({ kind: 'code', indent: 0, text: out, header: true }); continue; }
      if ((m = c.match(RE_OPTION))) { region = 'option'; out = '> ' + m[1] + ': ' + m[2].trim(); }
      else if ((m = c.match(RE_PROP))) {
        const schema = G.SCHEMA[blockKind];
        const effects = !!schema && schema.effects.includes(m[1]);
        region = effects ? 'effects' : 'text';
        const v = m[2].trim();
        out = m[1] + ':' + (v ? ' ' + (effects ? normStatement(v) : v) : '');
      }
      rows.push({ kind: 'code', indent: 0, text: out });
      continue;
    }
    if (region === 'text' || !region) { rows.push({ kind: 'code', indent: 2, text: c }); continue; }
    // Effect bodies: re-indent by nesting depth (2 spaces per level).
    while (stack.length && stack[stack.length - 1] > indent) stack.pop();
    if (!stack.length || stack[stack.length - 1] < indent) stack.push(indent);
    let out = c;
    if (region === 'option' && optionBase == null) optionBase = indent;
    const pm = region === 'option' && indent === optionBase && c.match(RE_PROP);
    if (pm && (pm[1] === 'when' || pm[1] === 'hint')) out = pm[1] + ': ' + pm[2].trim();
    else out = normStatement(c);
    rows.push({ kind: 'code', indent: 2 * stack.length, text: out });
  }
  // Comments take the indentation of the next code line (column 0 stays column 0).
  for (let i = rows.length - 1, next = 0; i >= 0; i--) {
    const r = rows[i];
    if (r.kind === 'code') next = r.indent;
    else if (r.kind === 'comment' && r.indent > 0) r.indent = next || 2;
  }
  // Blank lines: collapse runs, none at the start, none right after a header, one before each header group.
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.kind === 'blank') {
      const prev = out[out.length - 1];
      if (!prev || prev.kind === 'blank' || prev.header) continue;
      out.push(r); continue;
    }
    if (r.header && out.length) {
      let j = out.length;
      while (j > 0 && out[j - 1].kind === 'comment' && out[j - 1].indent === 0) j--;
      if (j > 0 && out[j - 1].kind !== 'blank') out.splice(j, 0, { kind: 'blank' });
    }
    out.push(r);
  }
  while (out.length && out[out.length - 1].kind === 'blank') out.pop();
  return out.map((r) => (r.kind === 'blank' ? '' : ' '.repeat(r.indent) + r.text)).join('\n') + '\n';
}

// Compiled form without source positions, for comparing input and output.
function shape(text, file) {
  return JSON.stringify(G.parseFile(text, file), (k, v) => (k === 'line' || typeof v === 'function' ? undefined : v));
}

// -> {text, changed, error}. Never returns text that compiles differently from the input.
function formatChecked(text, file) {
  let before;
  try { before = shape(text, file); } catch (e) { return { text, changed: false, error: 'does not parse, not formatted: ' + e.message }; }
  const out = format(text);
  let after;
  try { after = shape(out, file); } catch (e) { return { text, changed: false, error: 'formatter bug (output does not parse), file left unchanged: ' + e.message }; }
  if (before !== after) return { text, changed: false, error: 'formatter bug (output compiles differently), file left unchanged' };
  return { text: out, changed: out !== text, error: null };
}

module.exports = { format, formatChecked, normStatement };
