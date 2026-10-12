/*
 * Scripted content migrations: `node tools/grim.js migrate [--dry-run]`.
 *
 * A migration is tools/migrations/NNNN-name.js:
 *
 *   module.exports = {
 *     id: '0001-final-year',
 *     description: 'year == 3 → final_year',
 *     run(ctx) {
 *       for (const row of ctx.query('event', 'when_src != ""')) {           // tools/query.js rows
 *         ctx.edit(row, (line) => line.replace('year == 3', 'final_year'));   // row = {file, line} or a query row
 *       }
 *     },
 *   };
 *
 * ctx: query(node, where) · edit(at, textOrFn) · insertAfter(at, text) · remove(at) · report(msg)
 *      · lines(file) · content (compiled) · project (tools/project.js)
 * Migrations run in id order; applied ids are recorded in content/.migrations.json, so a second run skips
 * them. Each migration is verified before it's recorded: changed files must parse and the whole content
 * must compile; otherwise its writes are rolled back and the run stops. Changed .grim files are put in
 * canonical layout (tools/format.js).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const G = require('../src/grimoire.js');
const { project } = require('./project.js');
const { Rewriter, lineDiff } = require('./rewrite.js');
const Query = require('./query.js');
const Fmt = require('./format.js');

function migrate(root, { dryRun = false, dir = null, log = console.log } = {}) {
  const P = project(root);
  const migDir = dir || path.join(P.root, 'tools', 'migrations');
  const recordPath = path.join(P.CONTENT, '.migrations.json');
  const record = fs.existsSync(recordPath) ? JSON.parse(fs.readFileSync(recordPath, 'utf8')) : { applied: [] };
  const files = fs.existsSync(migDir) ? fs.readdirSync(migDir).filter((f) => /^\d{4}-.*\.js$/.test(f)).sort() : [];
  const ran = [];
  for (const f of files) {
    const m = require(path.join(migDir, f));
    if (!m.id || typeof m.run !== 'function') throw new Error(f + ': a migration exports { id, description, run(ctx) }');
    if (record.applied.some((a) => a.id === m.id)) continue;
    const { content, sources, errors } = P.compileAll();
    if (errors.length) throw new Error('content does not compile before ' + m.id + ': ' + errors[0].message);
    const rw = new Rewriter(P.root);
    const notes = [];
    const at = (x) => (typeof x === 'object' ? [x.file, x.line] : (() => { throw new Error('expected {file, line}'); })());
    const ctx = {
      content, project: P,
      query: (node, where = null) => Query.select(content, { node, where }),
      lines: (file) => rw.lines(file),
      edit: (x, t) => { const [file, line] = at(x); return rw.edit(file, line, t); },
      insertAfter: (x, t) => { const [file, line] = at(x); rw.insertAfter(file, line, t); },
      remove: (x) => { const [file, line] = at(x); rw.remove(file, line); },
      report: (msg) => notes.push(msg),
    };
    m.run(ctx);
    let res = rw.apply({ dryRun: true });
    // Canonical layout for changed .grim files, then verify the whole content still compiles.
    res.files.forEach((r) => { if (r.file.endsWith('.grim')) { const fr = Fmt.formatChecked(r.after, r.file); if (!fr.error) r.after = fr.text; } });
    const next = sources.map((s) => { const r = res.files.find((x) => x.file === s.path); return r ? { path: s.path, text: r.after } : s; });
    const after = G.compile(next);
    if (after.errors.length) throw new Error(m.id + ' breaks the content: ' + after.errors[0].message + ' (nothing written)');
    const diff = res.files.map((r) => lineDiff(r.file, r.before, r.after)).join('\n');
    log('migration ' + m.id + (m.description ? ' — ' + m.description : '') + ': ' + res.files.length + ' file(s)' + (dryRun ? ' (dry run)' : ''));
    notes.forEach((n) => log('  ' + n));
    if (dryRun) { if (diff) log(diff); ran.push({ id: m.id, files: res.files.length, diff }); continue; }
    for (const r of res.files) fs.writeFileSync(path.join(P.root, r.file), r.after);
    record.applied.push({ id: m.id, at: new Date().toISOString(), files: res.files.map((r) => r.file) });
    fs.writeFileSync(recordPath, JSON.stringify(record, null, 2) + '\n');
    ran.push({ id: m.id, files: res.files.length, diff });
  }
  if (!ran.length) log('migrate: nothing to do (' + record.applied.length + ' applied)');
  return ran;
}

module.exports = { migrate };
