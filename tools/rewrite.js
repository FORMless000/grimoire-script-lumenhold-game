/*
 * Line-level rewriter for content files (.grim and .lang). Used by `grim rename` and `grim migrate`.
 *
 *   const rw = new Rewriter(root);
 *   rw.edit('content/events/life.grim', 42, (old) => old.replace('gold -10', 'gold -12'));
 *   rw.insertAfter('content/events/life.grim', 42, '  mood -1');
 *   rw.remove('content/events/life.grim', 43);
 *   const res = rw.apply({ dryRun: false });   // -> { files: [{file, before, after}], diff }
 *
 * Lines are 1-based and always refer to the file as it was first read, so edits never shift each
 * other. Each line takes at most one edit or removal; insertions after the same line keep their order.
 * apply() refuses (and writes nothing) if a file changed on disk since it was read, or if a changed
 * .grim / .lang file no longer parses. Formatting and comments outside the touched lines are untouched.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const G = require('../src/grimoire.js');
const I18n = require('../src/i18n.js');

class Rewriter {
  constructor(root) {
    this.root = path.resolve(root);
    this.files = new Map();   // rel path -> {text, lines, ops: Map(line -> {edit, remove, inserts})}
  }
  _rel(file) { return path.isAbsolute(file) ? path.relative(this.root, file).split(path.sep).join('/') : file; }
  read(file) {
    const f = this._rel(file);
    if (!this.files.has(f)) {
      const text = fs.readFileSync(path.join(this.root, f), 'utf8');
      this.files.set(f, { text, lines: text.split('\n'), ops: new Map() });
    }
    return this.files.get(f);
  }
  // A new file (the converters' content/core/templates.grim): written by apply(), refused if it already exists.
  create(file, text) {
    const f = this._rel(file);
    if (this.files.has(f) || fs.existsSync(path.join(this.root, f))) throw new Error(f + ' already exists');
    this.files.set(f, { text: '', lines: [], ops: new Map(), created: String(text) });
  }
  lines(file) { return this.read(file).lines.slice(); }
  line(file, n) { return this.read(file).lines[n - 1]; }
  _op(file, n) {
    const f = this.read(file);
    if (n < 0 || n > f.lines.length) throw new Error(this._rel(file) + ': line ' + n + ' out of range');
    if (!f.ops.has(n)) f.ops.set(n, { inserts: [] });
    return f.ops.get(n);
  }
  // with: a string, or a function(oldLine) -> newLine. Returns false when the line is unchanged.
  edit(file, n, withText) {
    const op = this._op(file, n);
    if (op.remove) throw new Error(this._rel(file) + ':' + n + ': edit of a removed line');
    const cur = op.edit != null ? op.edit : this.line(file, n);
    const next = typeof withText === 'function' ? withText(cur) : withText;
    if (next === this.line(file, n)) { delete op.edit; return false; }
    op.edit = next;
    return true;
  }
  insertAfter(file, n, text) { this._op(file, n).inserts.push(...String(text).split('\n')); }
  remove(file, n) { const op = this._op(file, n); if (op.edit != null) throw new Error(this._rel(file) + ':' + n + ': removal of an edited line'); op.remove = true; }
  pending() { return [...this.files.values()].some((f) => f.ops.size && [...f.ops.values()].some((o) => o.edit != null || o.remove || o.inserts.length)); }

  // Builds every changed file; verifies; writes unless dryRun.
  apply({ dryRun = false } = {}) {
    const out = [];
    for (const [file, f] of this.files) {
      const res = [];
      const top = f.ops.get(0);
      if (top) res.push(...top.inserts);
      f.lines.forEach((line, i) => {
        const op = f.ops.get(i + 1);
        if (!op) { res.push(line); return; }
        if (!op.remove) res.push(op.edit != null ? op.edit : line);
        res.push(...op.inserts);
      });
      const after = f.created != null ? f.created : res.join('\n');
      if (after !== f.text) out.push({ file, before: f.text, after, created: f.created != null });
    }
    for (const r of out) {
      if (r.created) { if (fs.existsSync(path.join(this.root, r.file))) throw new Error(r.file + ' appeared on disk since it was planned; nothing written'); }
      else if (fs.readFileSync(path.join(this.root, r.file), 'utf8') !== r.before) throw new Error(r.file + ' changed on disk since it was read; nothing written');
      if (r.file.endsWith('.grim')) {
        try { G.parseFile(r.after, r.file); } catch (e) { throw new Error('rewrite would break ' + r.file + ': ' + e.message + '; nothing written'); }
      } else if (r.file.endsWith('.lang')) {
        const p = I18n.parseLang(r.after, r.file);
        if (p.errors.length) throw new Error('rewrite would break ' + r.file + ': ' + p.errors[0] + '; nothing written');
      }
    }
    if (!dryRun) for (const r of out) { fs.mkdirSync(path.dirname(path.join(this.root, r.file)), { recursive: true }); fs.writeFileSync(path.join(this.root, r.file), r.after); }
    return { files: out, diff: out.map((r) => lineDiff(r.file, r.before, r.after)).join('\n') };
  }
  // Restore files written by apply() (used when a later verification step fails).
  static restore(root, files) { for (const r of files) { if (r.created) fs.rmSync(path.join(root, r.file), { force: true }); else fs.writeFileSync(path.join(root, r.file), r.before); } }
}

// Minimal line diff for reports: changed hunks with 1-based line numbers of the old file.
function lineDiff(file, a, b) {
  const A = a.split('\n'), B = b.split('\n');
  // LCS table is fine for content files (a few thousand lines at most per changed file).
  const n = A.length, m = B.length;
  if (n * m > 4e7) return '--- ' + file + ' (too large to diff)';
  const L = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const lines = ['--- ' + file];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && A[i] === B[j]) { i++; j++; continue; }
    if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) { lines.push(String(i).padStart(5) + ' + ' + B[j]); j++; }
    else { lines.push(String(i + 1).padStart(5) + ' - ' + A[i]); i++; }
  }
  return lines.join('\n');
}

module.exports = { Rewriter, lineDiff };
