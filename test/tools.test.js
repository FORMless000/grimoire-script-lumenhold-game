// Tests for the content tools: fmt, query, rewrite, rename, migrate.  Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const G = require('../src/grimoire.js');
const I18n = require('../src/i18n.js');
const Fmt = require('../tools/format.js');
const Query = require('../tools/query.js');
const { project } = require('../tools/project.js');
const { Rewriter } = require('../tools/rewrite.js');
const { rename } = require('../tools/rename.js');
const { migrate } = require('../tools/migrate.js');
const { ROOT, tempProject, read, write } = require('./helpers.js');

const quiet = () => {};

test('fmt: every real content file is already canonical (lossless no-op)', () => {
  for (const src of project(ROOT).loadSources()) {
    const r = Fmt.formatChecked(src.text, src.path);
    assert.equal(r.error, null, src.path);
    assert.equal(r.changed, false, src.path);
  }
});

test('fmt: normalises layout, keeps comments, compiles the same', () => {
  const messy = '# head\n@event   e1\ntitle:T\ntext:  a\n      b\n\n\n> left:L\n    gold-5\n    # c\n    if gold > 3:\n          say:x\n    else :\n          say:  y\n>right : R\n\tgold +1\n';
  const r = Fmt.formatChecked(messy, 'm.grim');
  assert.equal(r.error, null);
  assert.equal(r.text, '# head\n@event e1\ntitle: T\ntext: a\n  b\n\n> left: L\n  gold -5\n  # c\n  if gold > 3:\n    say: x\n  else:\n    say: y\n> right: R\n  gold +1\n');
  assert.equal(Fmt.formatChecked(r.text, 'm.grim').changed, false, 'idempotent');
});

test('fmt: refuses files that do not parse', () => {
  const r = Fmt.formatChecked('@event x\ntitle: t\n> left: a\n  frobnicate 3\n', 'bad.grim');
  assert.match(r.error, /does not parse/);
});

test('query: rows, where-expressions, missing fields never match', () => {
  const { content } = project(path.join(__dirname, 'fixtures', 'mini')).compileAll();
  const checks = Query.select(content, { node: 'check', where: null });
  assert.equal(checks.length, 1);
  assert.equal(checks[0].skill, 'lore');
  assert.equal(checks[0].dc, null, 'dc depends on state');
  assert.equal(Query.select(content, { node: 'check', where: 'dc < 100' }).length, 0, 'non-constant dc never compares true');
  assert.equal(Query.select(content, { node: 'delta', where: 'name == "gold" and amount < 0' }).length, 1);
  assert.equal(Query.select(content, { node: 'event', where: 'has(social)' })[0].id, 'lyra_meet');
  assert.throws(() => Query.select(content, { node: 'widget' }), /unknown node kind/);
});

test('rewrite: edit, insert, remove refer to original lines', () => {
  const dir = tempProject();
  write(dir, 'content/x.grim', '@event x\ntitle: T\ntext: a\n> ok: Go\n  gold +1\n');
  const rw = new Rewriter(dir);
  rw.edit('content/x.grim', 5, '  gold +2');
  rw.insertAfter('content/x.grim', 5, '  health +1');
  rw.remove('content/x.grim', 3);
  rw.insertAfter('content/x.grim', 2, 'text: b');
  rw.apply();
  assert.equal(read(dir, 'content/x.grim'), '@event x\ntitle: T\ntext: b\n> ok: Go\n  gold +2\n  health +1\n');
});

test('rewrite: refuses changed files and broken results', () => {
  const dir = tempProject();
  write(dir, 'content/x.grim', '@event x\ntitle: T\ntext: a\n');
  let rw = new Rewriter(dir);
  rw.edit('content/x.grim', 3, 'text: b');
  write(dir, 'content/x.grim', '@event x\ntitle: T\ntext: changed\n');
  assert.throws(() => rw.apply(), /changed on disk/);
  rw = new Rewriter(dir);
  rw.edit('content/x.grim', 3, '> !!! not an option');
  assert.throws(() => rw.apply(), /would break/);
  assert.equal(read(dir, 'content/x.grim'), '@event x\ntitle: T\ntext: changed\n', 'nothing written');
});

test('rename npc: code, tokens, headers and translations; prose untouched', () => {
  const dir = tempProject();
  const res = rename(dir, 'npc', 'lyra', 'lyra_vane');
  const ev = read(dir, 'content/events/a.grim');
  assert.match(ev, /^actor: lyra_vane$/m);
  assert.match(ev, /title: Meeting \{lyra_vane\}/);
  assert.match(ev, /\{=rel\(lyra_vane\)\}/);
  assert.match(ev, /"Lyra" is written/, 'prose kept');
  assert.match(ev, /Ask about lyra$/m, 'label prose kept');
  assert.match(ev, /flag lyra_seen/, 'other ids with the same prefix kept');
  assert.match(ev, /check lore 10 \+ rel\(lyra_vane\) \/ 10:/);
  assert.match(ev, /\{lyra_vane\.their\}/);
  assert.match(ev, /if has\(lyra_seen\) and bond\(lyra_vane\) == "none":/);
  assert.match(read(dir, 'content/core/rules.grim'), /^@npc lyra_vane$/m);
  const lang = read(dir, 'locales/zh-CN/events/a.lang');
  assert.match(lang, /与\{lyra_vane\}相遇/);
  // The hash now matches the renamed English, so the translation is not stale.
  const { content } = project(dir).compileAll();
  const h = I18n.extract(content).find((s) => s.block === 'event:lyra_meet' && s.key === 'title').hash;
  assert.match(lang, new RegExp('title \\[' + h + '\\]'));
  assert.ok(res.references > 10);
});

test('rename: refuses unknown, taken and ambiguous ids', () => {
  const dir = tempProject();
  assert.throws(() => rename(dir, 'npc', 'nobody', 'x'), /no npc/);
  assert.throws(() => rename(dir, 'npc', 'lyra', 'tobias'), /already used/);
  assert.throws(() => rename(dir, 'event', 'quiet', 'lyra_seen'), /already used/);
});

test('rename event and flag', () => {
  const dir = tempProject();
  rename(dir, 'event', 'lyra_later', 'lyra_afterwards');
  rename(dir, 'flag', 'lyra_seen', 'lyra_asked');
  const ev = read(dir, 'content/events/a.grim');
  assert.match(ev, /queue lyra_afterwards in 1/);
  assert.match(ev, /^@event lyra_afterwards$/m);
  assert.match(ev, /flag lyra_asked/);
  assert.match(ev, /has\(lyra_asked\)/);
  assert.equal(project(dir).compileAll().errors.length, 0);
});

test('migrate: runs once, records, formats, and rolls back on failure', () => {
  const dir = tempProject();
  const mig = path.join(dir, 'migrations');
  write(dir, 'migrations/0001-cheaper.js', `module.exports = { id: '0001-cheaper', description: 'gold -1 → -2', run(ctx) {
    for (const r of ctx.query('delta', 'name == "gold" and amount == -1')) ctx.edit(r, (l) => l.replace('gold -1', 'gold   -2'));
    ctx.report('done');
  } };`);
  const notes = [];
  const ran = migrate(dir, { dir: mig, log: (m) => notes.push(m) });
  assert.equal(ran.length, 1);
  assert.match(read(dir, 'content/events/a.grim'), /^  gold -2$/m, 'edited and formatted');
  assert.ok(notes.some((n) => /done/.test(n)));
  assert.equal(JSON.parse(read(dir, 'content/.migrations.json')).applied[0].id, '0001-cheaper');
  assert.equal(migrate(dir, { dir: mig, log: quiet }).length, 0, 'second run is a no-op');

  write(dir, 'migrations/0002-broken.js', `module.exports = { id: '0002-broken', run(ctx) {
    ctx.edit({ file: 'content/events/a.grim', line: 3 }, 'actor: nobody_at_all');
    ctx.insertAfter({ file: 'content/events/a.grim', line: 1 }, 'title: duplicate');
  } };`);
  const before = read(dir, 'content/events/a.grim');
  assert.throws(() => migrate(dir, { dir: mig, log: quiet }), /breaks the content|would break/);
  assert.equal(read(dir, 'content/events/a.grim'), before, 'nothing written');
  assert.equal(JSON.parse(read(dir, 'content/.migrations.json')).applied.length, 1);
});

test('migrate --dry-run writes nothing', () => {
  const dir = tempProject();
  write(dir, 'migrations/0001-x.js', `module.exports = { id: '0001-x', run(ctx) { ctx.edit({ file: 'content/events/a.grim', line: 7 }, (l) => l.replace('lyra', 'lyra')); ctx.insertAfter({ file: 'content/core/rules.grim', line: 2 }, '# note'); } };`);
  const before = read(dir, 'content/core/rules.grim');
  const ran = migrate(dir, { dir: path.join(dir, 'migrations'), dryRun: true, log: quiet });
  assert.equal(ran[0].files, 1);
  assert.equal(read(dir, 'content/core/rules.grim'), before);
  assert.ok(!fs.existsSync(path.join(dir, 'content/.migrations.json')));
});

test('grimoire: fixture compiles cleanly (sanity)', () => {
  assert.equal(G.compile(project(path.join(__dirname, 'fixtures', 'mini')).loadSources()).errors.length, 0);
});

test('graph (A2): who leads to a card, with odds, and what it leads to', () => {
  const { content } = require('../tools/project.js').project(require('./helpers.js').ROOT).compileAll();
  const out = require('../tools/graph.js').describe(content, 'night_suspicion');
  assert.match(out, /event night_out — option right \(chance unlikely\)/);
  assert.match(out, /state:locked_out \[option left\] → event night_out/);
  assert.match(require('../tools/graph.js').describe(content, 'night_out'), /flag:night_unlocked \[when\] ← event night_lead_in/);
});
