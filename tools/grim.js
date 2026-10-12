#!/usr/bin/env node
/*
 * grim — content toolchain for Lumenhold.
 *
 *   node tools/grim.js build            bundle content/**\/*.grim -> build/content.bundle.js (run after every content edit)
 *   node tools/grim.js lint             parse + cross-reference check (errors fail; warnings are advisory)
 *   node tools/grim.js sim [N] [--seed S] [--policy random|cautious|social] [--verbose] [--log DIR]
 *                                       auto-play N games, report coverage, endings, deaths, balance
 *                                       (--log writes every game's full run log to DIR as JSON)
 *   node tools/grim.js stats            count blocks by kind / trigger / tag
 *   node tools/grim.js show <id>        print a block's source and everything that references it
 *   node tools/grim.js ids [kind]       list ids (event|state|npc|ending|resource|skill|flag|var)
 *   node tools/grim.js check            build + lint + sim 200 (what agents should run before finishing)
 *   node tools/grim.js fmt [FILE…] [--check]
 *                                       rewrite .grim files in canonical layout (lossless; refuses any change in meaning).
 *                                       --check only lists files that are not canonical (exit 1 if any)
 *   node tools/grim.js query NODE [WHERE] [--file S] [--grep RE] [--group FIELD] [--json] [--fields]
 *                                       find blocks / options / statements, e.g.  query check "dc < 12 and not scales"
 *   node tools/grim.js rename KIND OLD NEW [--dry-run]
 *                                       rename an event/state/npc/flag/var/ending id in content and translations (verified)
 *   node tools/grim.js migrate [--dry-run]
 *                                       run new scripts in tools/migrations/ (recorded in content/.migrations.json)
 *   node tools/grim.js balance [--quick] [--games N]
 *                                       play every play style; invariants fail (exit 1), alarms warn
 *   node tools/grim.js snapshot [NAME] [--out FILE]
 *                                       play the golden seeds and save endings, choices, final values, coverage
 *   node tools/grim.js diff [A] [B]     compare two snapshots (default: test/golden/baseline.json vs a fresh one);
 *                                       a pure refactor shows "no gameplay change" (exit 1 otherwise)
 *   node tools/grim.js feedback [PATH…] [--event ID] [--json]
 *                                       summarise playtest feedback from exported run logs (default: feedback/)
 *   node tools/grim.js i18n [lang]      no lang: translation coverage per language.
 *                                       with lang (e.g. zh-CN): create/update locales/<lang>/*.lang — adds new
 *                                       keys (empty), stamps [hash]es, flags stale entries, moves obsolete ones
 *                                       to _obsolete.lang. Run after any content change, then translate the gaps.
 *   node tools/grim.js sim ... --lang zh-CN   play with a translation applied (catches broken {tokens})
 */
'use strict';
const fs = require('fs');
const path = require('path');
const G = require('../src/grimoire.js');
const Engine = require('../src/engine.js');
const Art = require('../src/art.js');
const I18n = require('../src/i18n.js');
const Fmt = require('./format.js');
const Query = require('./query.js');
const Policies = require('./policies.js');

const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const BUNDLE = path.join(ROOT, 'build', 'content.bundle.js');
const LOCALES = path.join(ROOT, 'locales');

const P = require('./project.js').project(ROOT);
const { listFiles, rel, localeLangs, loadLocaleSources, loadSources, compileAll } = P;

const C = process.stdout.isTTY ? { r: '\x1b[31m', y: '\x1b[33m', g: '\x1b[32m', d: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m' } : { r: '', y: '', g: '', d: '', b: '', x: '' };

/* ------------------------------------------------------------------ build */
function build() {
  const { sources, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(C.r + 'error ' + C.x + e.message)); console.error(C.r + 'build failed' + C.x); process.exit(1); }
  fs.mkdirSync(path.dirname(BUNDLE), { recursive: true });
  const { text, locales } = P.bundleText(sources);
  fs.writeFileSync(BUNDLE, text);
  const nLoc = Object.values(locales).reduce((n, a) => n + a.length, 0);
  console.log(C.g + 'built ' + C.x + path.relative(ROOT, BUNDLE) + ' (' + sources.length + ' content files, ' + nLoc + ' locale files in ' + Object.keys(locales).length + ' language(s), ' + (text.length / 1024).toFixed(0) + ' KB)');
}

/* ------------------------------------------------------------------ lint */
const KNOWN_BONDS = new Set(['none', 'friend', 'close', 'rival', 'nemesis', 'partner', 'ex']);
const SPECIAL_IDS = new Set(['npc', 'turn', 'month', 'year', 'turns_left', 'max_turns', 'cards_this_month']);
const PRONOUN_KEYS = new Set(['they', 'them', 'their', 'theirs', 'are', 's', 'name', 'fullname', 'title', 'house']);

function analyze(content) {
  // Collect everything that is set / referenced, with locations.
  const A = { flagsSet: {}, flagsRead: {}, varsSet: {}, varsRead: {}, queued: {}, statesRef: {}, npcsRef: {}, endingsRef: {}, eventsRef: {}, problems: [] };
  const add = (map, k, where) => { (map[k] = map[k] || []).push(where); };
  const P = (level, where, msg) => A.problems.push({ level, where, msg });

  function scanExpr(ex, where, hasActor) {
    if (!ex) return;
    G.walkAst(ex.ast, (n) => {
      if (n.t === 'id') {
        if (n.n === 'npc' && !hasActor) P('error', where, '"npc" used but this block has no actor: ' + ex.src);
        if (!SPECIAL_IDS.has(n.n) && !content.resources[n.n] && !content.skills[n.n]) add(A.varsRead, n.n, where);
      }
      if (n.t === 'call') {
        const refs = G.FUNC_REFS[n.n] || [];
        n.args.forEach((a, i) => {
          const kind = refs[i];
          if (a.t !== 'sym') return;
          if (kind === 'flagOrState') { if (!content.states[a.v]) add(A.flagsRead, a.v, where); }
          else if (kind === 'flag') add(A.flagsRead, a.v, where);
          else if (kind === 'state') add(A.statesRef, a.v, where);
          else if (kind === 'npc') add(A.npcsRef, a.v, where);
          else if (kind === 'event') add(A.eventsRef, a.v, where);
          if (n.n === 'bonds' && !KNOWN_BONDS.has(a.v)) P('warn', where, 'unknown bond status "' + a.v + '"');
        });
        if (n.n === 'chosen' && n.args[0] && n.args[0].t === 'sym' && n.args[1] && n.args[1].t === 'sym') {
          const ev = content.events[n.args[0].v];
          if (ev && !ev.options.some((o) => o.key === n.args[1].v)) P('error', where, 'chosen(' + n.args[0].v + ', ' + n.args[1].v + '): event has no such option');
        }
      }
      if (n.t === 'str' && /^(friend|close|rival|nemesis|partner|ex|none)$/.test(n.v) === false && ex.src.includes('bond(')) {
        // bond comparisons with unknown status
        if (/^[a-z]+$/.test(n.v)) P('warn', where, 'bond compared with unknown status "' + n.v + '"');
      }
    });
  }
  function scanText(text, where, hasActor) {
    if (!text) return;
    for (const m of text.matchAll(/\{([^{}]+)\}/g)) {
      const k = m[1].trim();
      if (['player', 'month', 'year'].includes(k)) continue;
      if (k[0] === '=') { try { const ex = G.expr(k.slice(1)); scanExpr(ex, where, hasActor); } catch (e) { P('error', where, 'bad {=expr}: ' + e.message); } continue; }
      if (content.npcs[k]) { add(A.npcsRef, k, where); continue; }
      const [head, key] = k.includes('.') ? k.split('.') : [null, k];
      if (head && head !== 'npc' && !content.npcs[head]) { P('error', where, 'unknown npc in {' + k + '}'); continue; }
      if (!PRONOUN_KEYS.has(key.toLowerCase()) && key !== 'npc') { P('error', where, 'unknown text token {' + k + '}'); continue; }
      if (!head && !hasActor) P('error', where, '{' + k + '} needs an actor (this block has none)');
    }
  }
  function scanEffects(effects, where, hasActor) {
    G.walkEffects(effects, (st) => {
      const w = where.replace(/:\d+$/, '') + ':' + st.line;
      switch (st.t) {
        case 'delta': case 'assign':
          if (!content.resources[st.name] && !content.skills[st.name]) add(A.varsSet, st.name, w);
          if (st.expr) scanExpr(st.expr, w, hasActor);
          if (SPECIAL_IDS.has(st.name)) P('error', w, 'cannot assign to built-in "' + st.name + '"');
          break;
        case 'say': scanText(st.text, w, hasActor); if (st.text.length > 320) P('warn', w, 'say text is long (' + st.text.length + ' chars)'); break;
        case 'flag': st.names.forEach((n) => add(A.flagsSet, n, w)); break;
        case 'unflag': break;
        case 'gain': case 'lose': if (!content.states[st.state]) P('error', w, st.t + ': unknown state "' + st.state + '"'); add(A.statesRef, st.state, w); if (st.dur) scanExpr(st.dur, w, hasActor); break;
        case 'queue':
          if (!content.events[st.event]) P('error', w, 'queue: unknown event "' + st.event + '"');
          add(A.queued, st.event, w);
          if (st.with === 'npc' && !hasActor) P('error', w, 'queue ... with npc: block has no actor');
          else if (st.with && st.with !== 'npc' && !content.npcs[st.with]) P('error', w, 'queue ... with: unknown npc "' + st.with + '"');
          if (st.delay) scanExpr(st.delay, w, hasActor);
          break;
        case 'rel': case 'love': case 'bond': case 'meet':
          if (st.npc === 'npc') { if (!hasActor) P('error', w, st.t + ' npc: block has no actor'); }
          else if (!content.npcs[st.npc]) P('error', w, st.t + ': unknown npc "' + st.npc + '"');
          else add(A.npcsRef, st.npc, w);
          if (st.t === 'bond' && !KNOWN_BONDS.has(st.status)) P('warn', w, 'unknown bond status "' + st.status + '" (known: ' + [...KNOWN_BONDS].join(', ') + ')');
          if (st.t === 'love') { const id = st.npc === 'npc' ? null : st.npc; if (id && content.npcs[id] && !content.npcs[id].romance) P('warn', w, 'love change on non-romanceable npc "' + id + '"'); }
          break;
        case 'end': if (!content.endings[st.ending]) P('error', w, 'end: unknown ending "' + st.ending + '"'); add(A.endingsRef, st.ending, w); break;
        case 'if': st.branches.forEach((b) => scanExpr(b.cond, w, hasActor)); break;
        case 'chance': scanExpr(st.p, w, hasActor); break;
        case 'check': if (!content.skills[st.skill]) P('error', w, 'check: unknown skill "' + st.skill + '"'); scanExpr(st.dc, w, hasActor); break;
      }
    });
  }

  const loc = (d) => d.file + ':' + d.line;
  for (const e of Object.values(content.events)) {
    const hasActor = !!e.actor;
    const w = loc(e);
    if (e.actor && !['any', 'npc'].includes(e.actor) && !content.npcs[e.actor]) P('error', w, 'actor: unknown npc "' + e.actor + '"');
    if (e.trigger === 'social' && !e.actor) P('warn', w, 'social event without actor');
    if (e.art && !Art.has(e.art)) P('warn', w, 'unknown art "' + e.art + '" (see src/art.js; available: ' + Art.list().join(' ') + ')');
    if (!e.art) P('info', w, 'event has no art');
    scanExpr(e.when, w, hasActor); scanExpr(e.weight, w, hasActor);
    scanText(e.title, w, hasActor); scanText(e.text, w, hasActor); scanText(e.scene, w, hasActor);
    if (e.text && e.text.length > 480) P('warn', w, 'card text is long (' + e.text.length + ' chars; aim for < 400)');
    scanEffects(e.on_show, w, hasActor);
    for (const o of e.options) {
      const ow = e.file + ':' + o.line;
      scanText(o.label, ow, hasActor); scanText(o.hint, ow, hasActor); scanExpr(o.when, ow, hasActor);
      if (o.label.length > 42) P('warn', ow, 'option label is long (' + o.label.length + ' chars; aim for < 36)');
      scanEffects(o.effects, ow, hasActor);
    }
    if (e.options.length > 1 && e.options.every((o) => o.when)) P('warn', w, 'every option has a "when" — the card can soft-lock if none are available');
  }
  for (const s of Object.values(content.states)) ['tick', 'on_add', 'on_expire', 'on_remove'].forEach((k) => scanEffects(s[k], loc(s), false));
  for (const h of Object.values(content.hooks)) { scanExpr(h.when, loc(h), false); scanEffects(h.do, loc(h), false); if (!['game_start', 'month_start', 'month_end'].includes(h.on)) P('error', loc(h), 'hook "on" must be game_start, month_start or month_end'); }
  for (const r of Object.values(content.resources)) scanEffects(r.on_zero, loc(r), false);
  for (const en of Object.values(content.endings)) { scanExpr(en.when, loc(en), false); scanText(en.text, loc(en), false); }
  for (const n of Object.values(content.npcs)) { if (!n.name) P('error', loc(n), 'npc needs a name'); if (n.pronouns && !/^(she|he|they)\b/.test(n.pronouns)) P('warn', loc(n), 'pronouns should start with she/he/they'); }

  // Cross-reference results
  for (const [f, ws] of Object.entries(A.flagsRead)) if (!A.flagsSet[f]) P('warn', ws[0], 'flag "' + f + '" is read but never set (typo?)' + (ws.length > 1 ? ' [+' + (ws.length - 1) + ' more]' : ''));
  for (const [v, ws] of Object.entries(A.varsRead)) if (!A.varsSet[v]) P('warn', ws[0], 'identifier "' + v + '" is not a resource/skill and is never assigned (typo?)');
  for (const [s, ws] of Object.entries(A.statesRef)) if (!content.states[s]) P('error', ws[0], 'unknown state "' + s + '"');
  for (const [n, ws] of Object.entries(A.npcsRef)) if (!content.npcs[n]) P('error', ws[0], 'unknown npc "' + n + '"');
  for (const [ev, ws] of Object.entries(A.eventsRef)) if (!content.events[ev]) P('error', ws[0], 'unknown event "' + ev + '"');
  for (const e of Object.values(content.events)) if (e.trigger === 'queued' && !A.queued[e.id]) P('warn', loc(e), 'queued-only event "' + e.id + '" is never queued (orphan)');
  for (const st of Object.values(content.states)) if (!A.statesRef[st.id]) P('info', loc(st), 'state "' + st.id + '" is never gained');
  if (!Object.keys(content.endings).length) P('error', '-', 'no @ending defined');
  return A;
}

function lint(opts = {}) {
  const { content, errors } = compileAll();
  errors.forEach((e) => console.error(C.r + 'error ' + C.x + e.message));
  if (errors.length) { console.error(C.r + errors.length + ' parse error(s)' + C.x); if (!opts.noExit) process.exit(1); return false; }
  const A = analyze(content);
  for (const lang of localeLangs()) lintLocale(content, lang, A.problems, opts);
  const by = { error: [], warn: [], info: [] };
  A.problems.forEach((p) => by[p.level].push(p));
  by.error.forEach((p) => console.error(C.r + 'error ' + C.x + p.where + ': ' + p.msg));
  by.warn.forEach((p) => console.error(C.y + 'warn  ' + C.x + p.where + ': ' + p.msg));
  if (opts.verbose) by.info.forEach((p) => console.error(C.d + 'info  ' + p.where + ': ' + p.msg + C.x));
  console.log((by.error.length ? C.r : C.g) + 'lint: ' + by.error.length + ' error(s), ' + by.warn.length + ' warning(s), ' + by.info.length + ' info' + C.x + ' — ' + Object.keys(content.events).length + ' events, ' + Object.keys(content.states).length + ' states, ' + Object.keys(content.npcs).length + ' npcs, ' + Object.keys(content.endings).length + ' endings');
  if (by.error.length && !opts.noExit) process.exit(1);
  return !by.error.length;
}

/* ------------------------------------------------------------------ i18n */
const PRONOUN_TOKENS = new Set(['they', 'them', 'their', 'theirs', 'are', 's']);
function tokensOf(s) { return [...String(s).matchAll(/\{([^{}]+)\}/g)].map((m) => m[1].trim()); }
// A token is "named" if it carries information the translation must keep (names, values).
function namedTokens(s) { return tokensOf(s).filter((k) => !PRONOUN_TOKENS.has(k.toLowerCase()) && !(k.includes('.') && PRONOUN_TOKENS.has(k.split('.')[1].toLowerCase()))).map((k) => (k[0] === '=' ? '{=…}' : '{' + k + '}')).sort(); }
function badToken(content, k) {
  if (['player', 'month', 'year', 'npc'].includes(k)) return null;
  if (k[0] === '=') { try { G.expr(k.slice(1)); return null; } catch (e) { return 'bad {=expr}: ' + e.message; } }
  if (content.npcs[k]) return null;
  const [head, key] = k.includes('.') ? k.split('.') : [null, k];
  if (head && head !== 'npc' && !content.npcs[head]) return 'unknown npc in {' + k + '}';
  if (!PRONOUN_KEYS.has(key.toLowerCase())) return 'unknown token {' + k + '}';
  return null;
}
function lintLocale(content, lang, problems, opts = {}) {
  const P = (level, where, msg) => problems.push({ level, where, msg });
  const loc = I18n.loadLocale(lang, loadLocaleSources(lang).filter((s) => !s.path.endsWith('/_obsolete.lang')));
  loc.errors.forEach((e) => P('error', e.split(': ')[0], e.split(': ').slice(1).join(': ')));
  const strings = I18n.extract(content);
  const known = new Set(strings.map((s) => s.block + ' ' + s.key));
  let missing = 0, stale = 0;
  const where = (block, key) => { for (const [f, p] of Object.entries(loc.files)) if (p.blocks[block] && p.blocks[block][key]) return f + ':' + p.blocks[block][key].line; return 'locales/' + lang; };
  for (const s of strings) {
    const e = loc.blocks[s.block] && loc.blocks[s.block][s.key];
    if (!e || e.text === '') { missing++; continue; }
    const w = where(s.block, s.key);
    if (e.hash && e.hash !== s.hash) { stale++; if (opts.verbose) P('info', w, 'stale translation (English changed): ' + s.block + ' ' + s.key); }
    for (const k of tokensOf(e.text)) { const b = badToken(content, k); if (b) P('error', w, '[' + lang + '] ' + b); }
    const a = namedTokens(s.text).join(' '), b = namedTokens(e.text).join(' ');
    if (a !== b) P('warn', w, '[' + lang + '] tokens differ from English (' + (a || 'none') + ' vs ' + (b || 'none') + ')');
  }
  for (const [block, keys] of Object.entries(loc.blocks)) for (const key of Object.keys(keys)) if (!known.has(block + ' ' + key)) P('warn', where(block, key), '[' + lang + '] obsolete key ' + block + ' ' + key + ' (run: node tools/grim.js i18n ' + lang + ')');
  const uiMissing = Object.keys(I18n.UI_EN).filter((k) => loc.ui[k] == null).length;
  for (const [k, v] of Object.entries(loc.ui)) {
    if (I18n.UI_EN[k] == null) { P('warn', 'locales/' + lang + '/ui.lang', '[' + lang + '] unknown ui key ' + k); continue; }
    const need = [...I18n.UI_EN[k].matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    const have = [...v.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    if (need !== have) P('warn', 'locales/' + lang + '/ui.lang', '[' + lang + '] ui key ' + k + ' placeholders differ ({' + need + '} vs {' + have + '})');
  }
  if (missing || uiMissing) P('warn', 'locales/' + lang, missing + ' content string(s) and ' + uiMissing + ' ui string(s) untranslated (they fall back to English). Run: node tools/grim.js i18n ' + lang);
  if (stale) P('warn', 'locales/' + lang, stale + ' translation(s) are stale — the English changed since they were written (lint --verbose lists them)');
  return { missing, stale, uiMissing, total: strings.length };
}

function i18nStatus() {
  const { content, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
  const langs = localeLangs();
  if (!langs.length) { console.log('No translations yet. Create one with: node tools/grim.js i18n <lang>   (e.g. zh-CN)'); return; }
  for (const lang of langs) {
    const r = lintLocale(content, lang, [], {});
    const pct = (100 * (r.total - r.missing) / r.total).toFixed(1);
    console.log(lang.padEnd(8) + pct.padStart(6) + '% content (' + (r.total - r.missing) + '/' + r.total + '), ' + r.stale + ' stale, ' + r.uiMissing + ' ui strings missing');
  }
}

function i18nSync(lang) {
  if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(lang)) { console.error('bad language code "' + lang + '" (use e.g. zh-CN, fr, pt-BR)'); process.exit(1); }
  const { content, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
  const dir = path.join(LOCALES, lang);
  const sources = loadLocaleSources(lang);
  const loc = I18n.loadLocale(lang, sources);
  if (loc.errors.length) { loc.errors.forEach((e) => console.error(C.r + 'error ' + C.x + e)); console.error('fix the locale files first'); process.exit(1); }
  const langName = loc.ui['lang.name'] || lang;
  const used = new Set();
  const byFile = {};
  for (const s of I18n.extract(content)) (byFile[s.file] = byFile[s.file] || []).push(s);
  const report = [];
  const written = new Set();
  for (const [file, list] of Object.entries(byFile)) {
    const out = path.join(dir, file.replace(/^content\//, '').replace(/\.grim$/, '.lang'));
    const lines = ['# Lumenhold Academy — ' + langName + ' (' + lang + ') translation of ' + file,
      '# Maintained by `node tools/grim.js i18n ' + lang + '`. Translate the text after "="; keep {tokens}.',
      '# "# en:" shows the English source. [hash] marks the English version a line was translated from;',
      '# lines marked STALE need updating — after fixing the text, delete the [hash] and re-run the tool.', ''];
    let cur = null, n = 0, done = 0, st = 0;
    for (const s of list) {
      if (s.block !== cur) { cur = s.block; lines.push('', '@' + s.block.replace(':', ' ')); }
      const e = loc.blocks[s.block] && loc.blocks[s.block][s.key];
      used.add(s.block + ' ' + s.key);
      n++;
      const tr = e ? e.text : '';
      let h = s.hash;
      if (e && tr !== '' && e.hash && e.hash !== s.hash) { h = e.hash; st++; lines.push('# STALE — English changed since this was translated'); }
      if (tr !== '') done++;
      lines.push('# en: ' + I18n.enc(s.text));
      lines.push(s.key + ' [' + h + '] = ' + I18n.enc(tr));
    }
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, lines.join('\n') + '\n');
    written.add(rel(out));
    report.push([rel(out), done, n, st]);
  }
  // UI strings
  {
    const out = path.join(dir, 'ui.lang');
    const lines = ['# Lumenhold Academy — ' + langName + ' (' + lang + ') interface strings.',
      '# Keys come from UI_EN in src/i18n.js. Keep {placeholders}; "_html" keys may contain <b> tags.',
      '# pronoun.* keys fill {they} {them} {their} {theirs} {are} {s} in content text (empty is allowed).', '', '@ui'];
    let n = 0, done = 0;
    for (const [k, en] of Object.entries(I18n.UI_EN)) {
      n++;
      const tr = loc.ui[k];
      if (tr != null && (tr !== '' || k.startsWith('pronoun.'))) done++;
      lines.push('# en: ' + I18n.enc(en));
      lines.push(k + ' = ' + I18n.enc(tr == null ? '' : tr));
    }
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(out, lines.join('\n') + '\n');
    written.add(rel(out));
    report.push([rel(out), done, n, 0]);
  }
  // Obsolete entries: keep the work, out of the way.
  const obs = ['# Translations whose source no longer exists. Kept for reference; not loaded by the game.', ''];
  let nObs = 0;
  for (const [block, keys] of Object.entries(loc.blocks)) {
    const rows = Object.entries(keys).filter(([k, v]) => !used.has(block + ' ' + k) && v.text !== '');
    if (!rows.length) continue;
    obs.push('@' + block.replace(':', ' '));
    for (const [k, v] of rows) { obs.push(k + (v.hash ? ' [' + v.hash + ']' : '') + ' = ' + I18n.enc(v.text)); nObs++; }
  }
  const obsPath = path.join(dir, '_obsolete.lang');
  if (nObs) { fs.writeFileSync(obsPath, obs.join('\n') + '\n'); written.add(rel(obsPath)); }
  // Remove .lang files that no longer correspond to a content file
  for (const s of sources) if (!written.has(s.path) && !s.path.endsWith('/_obsolete.lang')) { fs.unlinkSync(path.join(ROOT, s.path)); console.log(C.d + 'removed ' + s.path + C.x); }
  let T = 0, D = 0, S = 0;
  for (const [f, d, n, st] of report) { T += n; D += d; S += st; console.log((d === n ? C.g : C.y) + String(d).padStart(5) + '/' + String(n).padEnd(5) + C.x + ' ' + f + (st ? C.y + '  ' + st + ' stale' + C.x : '')); }
  console.log(C.b + lang + ': ' + D + '/' + T + ' translated (' + (100 * D / T).toFixed(1) + '%), ' + S + ' stale' + (nObs ? ', ' + nObs + ' obsolete moved to _obsolete.lang' : '') + C.x);
}

/* ------------------------------------------------------------------ sim */
// Play one game to its ending with a play style (tools/policies.js). Everything that happened is in
// eng.s.hist. Throws on a soft-lock (a card with no available option) or a game that never ends.
function playGame(content, { seed, style, runId, name = 'Sim', onLog = null }) {
  const eng = new Engine(content);
  let r = eng.newGame({ seed, name, runId });
  let steps = 0;
  try {
    while (steps++ < 4000) {
      if (r.kind === 'ending') break;
      if (r.kind === 'month') { r = eng.advance(); continue; }
      const v = r.view;
      if (!v.options.some((o) => !o.disabled)) throw new Error('soft-lock: no available options on ' + v.id);
      eng.choose(style.pick(eng, v));
      r = eng.advance();
    }
  } finally { if (onLog) onLog(eng); }
  if (r.kind !== 'ending') throw new Error('did not finish after 4000 steps');
  return { eng, r };
}

function sim(n = 300, opts = {}) {
  const { content, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
  if (opts.lang && opts.lang !== 'en') {
    const loc = I18n.loadLocale(opts.lang, loadLocaleSources(opts.lang));
    const st = I18n.applyContent(content, loc);
    console.log('sim with ' + opts.lang + ' applied: ' + st.translated + '/' + st.total + ' strings translated');
  }
  const warnings = {};
  const origWarn = console.warn; console.warn = (...a) => { const k = a.join(' '); warnings[k] = (warnings[k] || 0) + 1; };
  const seen = {}, endings = {}, endTurns = [], finals = {}, cardsPerMonth = [], menus = {};
  const resSum = {}; const skillSum = {}; let games = 0; let crashes = 0;
  const seed0 = opts.seed != null ? opts.seed : 12345;
  const meta = { game: content.game.title, contentHash: contentHash(), lang: opts.lang || 'en', sim: opts.policy || 'random' };
  if (opts.log) fs.mkdirSync(opts.log, { recursive: true });
  const style = Policies.get(opts.policy);
  for (let g = 0; g < n; g++) {
    try {
      const seed = seed0 + g * 7919;
      const { eng, r } = playGame(content, { seed, style, runId: 'sim-' + style.name + '-' + seed, onLog: opts.log ? (e) => fs.writeFileSync(path.join(opts.log, e.s.runId + '.json'), JSON.stringify(e.exportRun(meta))) : null });
      let monthCards = 0;
      for (const h of eng.s.hist) {
        if (h.t === 'month') { if (h.turn > 1) cardsPerMonth.push(monthCards); monthCards = 0; }
        if (h.t !== 'card' || h.choice == null) continue;
        monthCards++; seen[h.id] = (seen[h.id] || 0) + 1;
        if (h.type === 'menu') { menus[h.id] = menus[h.id] || {}; menus[h.id][h.choice] = (menus[h.id][h.choice] || 0) + 1; }
      }
      endings[r.id] = (endings[r.id] || 0) + 1; endTurns.push(r.turn);
      if (!r.early) finals[r.id] = (finals[r.id] || 0) + 1;
      for (const id of content.order.resources) resSum[id] = (resSum[id] || 0) + eng.s.vals[id];
      for (const id of content.order.skills) skillSum[id] = (skillSum[id] || 0) + eng.s.vals[id];
      games++;
    } catch (e) { crashes++; if (crashes < 5) console.error(C.r + 'game ' + g + ' crashed: ' + C.x + e.stack); }
  }
  console.warn = origWarn;
  const allEvents = Object.keys(content.events);
  const never = allEvents.filter((id) => !seen[id]);
  const avg = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  const maxT = new Engine(content).maxTurns;
  console.log(C.b + '\n=== sim: ' + games + ' games (' + (opts.policy || 'random') + ' policy), ' + crashes + ' crashed ===' + C.x);
  console.log('avg length: ' + avg(endTurns).toFixed(1) + ' / ' + maxT + ' months; reached graduation: ' + (100 * endTurns.filter((t) => t >= maxT).length / Math.max(1, games)).toFixed(0) + '%');
  console.log('avg cards per month: ' + avg(cardsPerMonth).toFixed(2));
  console.log('\nendings:');
  Object.entries(endings).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('  ' + (100 * v / games).toFixed(1).padStart(5) + '%  ' + k + (content.endings[k] && content.endings[k].kind === 'early' ? C.d + ' (early)' + C.x : '')));
  const unreached = Object.keys(content.endings).filter((k) => !endings[k]);
  if (unreached.length) console.log(C.y + '  never reached: ' + unreached.join(', ') + C.x);
  console.log('\nfinal resources (avg): ' + content.order.resources.map((id) => id + ' ' + (resSum[id] / games).toFixed(0)).join(', '));
  console.log('final skills (avg):    ' + content.order.skills.map((id) => id + ' ' + (skillSum[id] / games).toFixed(0)).join(', '));
  console.log('\ncoverage: ' + (allEvents.length - never.length) + ' / ' + allEvents.length + ' events seen at least once');
  if (never.length) console.log(C.y + 'never seen (' + never.length + '): ' + C.x + never.join(', '));
  const rare = allEvents.filter((id) => seen[id] && seen[id] / games < 0.03);
  if (rare.length) console.log(C.d + 'rare (<3% of games): ' + rare.map((id) => id + '(' + seen[id] + ')').join(', ') + C.x);
  if (opts.verbose) {
    console.log('\nmenu picks:'); for (const [m, o] of Object.entries(menus)) console.log('  ' + m + ': ' + Object.entries(o).map(([k, v]) => k + '=' + v).join(' '));
    console.log('\nmost frequent:'); Object.entries(seen).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log('  ' + (v / games).toFixed(2) + ' per game  ' + k));
  }
  const wk = Object.entries(warnings);
  if (wk.length) { console.log(C.y + '\nruntime warnings:' + C.x); wk.slice(0, 20).forEach(([k, v]) => console.log('  ' + v + '×  ' + k)); }
  if (opts.log) console.log('\nrun logs: ' + games + ' file(s) in ' + path.relative(process.cwd(), opts.log));
  return crashes === 0;
}

/* ------------------------------------------------------------------ balance */
// Design §8.8: invariants fail the run, alarms warn. Checks for systems that don't exist yet (XP curve,
// mana, obligations, previews) are added in the phase that builds them.
function balance(opts = {}) {
  const { content, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
  const games = opts.games || (opts.quick ? 30 : 100);
  const styles = opts.quick ? ['random', 'balanced', 'social', 'aggressive'] : ['random', 'cautious', 'social', 'balanced', 'aggressive', 'moneymaxx', 'focused:arcana', 'focused:lore', 'social:lyra'];
  const report = { format: 'lumenhold-balance', v: 1, contentHash: contentHash(), createdAt: new Date().toISOString(), games, styles: {}, invariants: [], alarms: [] };
  const fail = (msg) => report.invariants.push(msg), alarm = (msg) => report.alarms.push(msg);
  // Static invariants
  for (const e of Object.values(content.events)) {
    if (e.type === 'menu' && e.options.every((o) => o.when)) fail('menu ' + e.id + ' (' + e.file + ':' + e.line + '): every option has a "when", so it can be empty');
  }
  const seenAll = {};
  const origWarn = console.warn; const warns = {}; console.warn = (...a) => { const k = a.join(' '); warns[k] = (warns[k] || 0) + 1; };
  for (const name of styles) {
    const style = Policies.get(name);
    const st = report.styles[name] = { games: 0, crashed: 0, endings: {}, early: 0, zero: { health: 0, mood: 0 }, final: {} };
    for (let g = 0; g < games; g++) {
      const seed = 777 + g * 7919;
      try {
        const { eng, r } = playGame(content, { seed, style, runId: 'balance' });
        st.games++;
        st.endings[r.id] = (st.endings[r.id] || 0) + 1;
        if (r.early) st.early++;
        let hz = false, mz = false;
        for (const h of eng.s.hist) {
          if (h.vals) { if (h.vals.health <= 0) hz = true; if (h.vals.mood <= 0) mz = true; }
          if (h.t === 'card' && h.choice != null) seenAll[h.id] = (seenAll[h.id] || 0) + 1;
        }
        if (hz) st.zero.health++; if (mz) st.zero.mood++;
        for (const [k, v] of Object.entries(eng.s.vals)) st.final[k] = (st.final[k] || 0) + v / games;
      } catch (e) { st.crashed++; fail(name + ' seed ' + seed + ': ' + e.message); }
    }
    for (const k of Object.keys(st.final)) st.final[k] = Math.round(st.final[k]);
    const top = Object.entries(st.endings).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] / st.games > 0.35) alarm(name + ': ' + top[0] + ' is ' + Math.round(100 * top[1] / st.games) + '% of endings (> 35%)');
    if (name === 'balanced') for (const k of ['health', 'mood']) if (st.zero[k] / st.games > 0.15) alarm('balanced: ' + k + ' hits 0 in ' + Math.round(100 * st.zero[k] / st.games) + '% of runs (> 15%)');
  }
  console.warn = origWarn;
  for (const [k, v] of Object.entries(warns)) alarm('runtime warning ×' + v + ': ' + k);
  const never = Object.keys(content.events).filter((id) => !seenAll[id]);
  report.neverSeen = never;
  if (never.length) alarm(never.length + ' event(s) never seen by any play style: ' + never.join(', '));
  fs.mkdirSync(path.join(ROOT, 'build'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'build', 'balance-report.json'), JSON.stringify(report, null, 1) + '\n');
  console.log(C.b + 'balance: ' + styles.length + ' play styles × ' + games + ' games' + C.x);
  for (const [name, st] of Object.entries(report.styles)) {
    const top = Object.entries(st.endings).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => k.replace(/^ending_/, '') + ' ' + Math.round(100 * v / Math.max(1, st.games)) + '%').join(', ');
    console.log('  ' + name.padEnd(15) + ' early ' + String(Math.round(100 * st.early / Math.max(1, st.games))).padStart(3) + '%  ' + C.d + top + C.x);
  }
  report.invariants.forEach((m) => console.log(C.r + 'INVARIANT ' + C.x + m));
  report.alarms.forEach((m) => console.log(C.y + 'alarm     ' + C.x + m));
  console.log((report.invariants.length ? C.r : C.g) + report.invariants.length + ' invariant failure(s)' + C.x + ', ' + report.alarms.length + ' alarm(s) — build/balance-report.json');
  return report.invariants.length === 0;
}

/* ------------------------------------------------------------------ snapshot / diff */
// Golden seeds: the same games every time. A pure refactor must reproduce them exactly.
const GOLDEN = { styles: ['random', 'social', 'cautious'], games: 40, seed: 424242 };
function snapshot(out, opts = {}) {
  const { content, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
  const games = opts.games || GOLDEN.games;
  const snap = { format: 'lumenhold-snapshot', v: 1, contentHash: contentHash(), createdAt: new Date().toISOString(), games: [], seen: {} };
  for (const name of GOLDEN.styles) {
    const style = Policies.get(name);
    const seen = snap.seen[name] = {};
    for (let g = 0; g < games; g++) {
      const seed = GOLDEN.seed + g * 7919;
      try {
        const { eng, r } = playGame(content, { seed, style, runId: 'golden' });
        const picks = eng.s.hist.filter((h) => h.t === 'card' && h.choice != null);
        picks.forEach((h) => { seen[h.id] = (seen[h.id] || 0) + 1; });
        const vals = {}; for (const [k, v] of Object.entries(eng.s.vals)) vals[k] = Math.round(v * 100) / 100;
        snap.games.push({ style: name, seed, ending: r.id, turn: r.turn, cards: picks.length, choices: I18n.hash(picks.map((h) => h.id + ':' + h.choice).join(' ')), vals });
      } catch (e) { snap.games.push({ style: name, seed, error: e.message }); }
    }
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(snap, null, 1) + '\n');
  console.log('snapshot: ' + snap.games.length + ' games (' + GOLDEN.styles.join(', ') + ' × ' + games + ') → ' + rel(out));
  return snap;
}
function snapDiff(aPath, bPath) {
  const [a, b] = [aPath, bPath].map((p) => JSON.parse(fs.readFileSync(p, 'utf8')));
  const key = (g) => g.style + '@' + g.seed;
  const bm = new Map(b.games.map((g) => [key(g), g]));
  const lines = []; let changed = 0;
  for (const ga of a.games) {
    const gb = bm.get(key(ga));
    if (!gb) { lines.push('missing in B: ' + key(ga)); changed++; continue; }
    const d = [];
    if (ga.error !== gb.error) d.push('error ' + (ga.error || '-') + ' → ' + (gb.error || '-'));
    if (ga.ending !== gb.ending) d.push('ending ' + ga.ending + ' → ' + gb.ending);
    if (ga.turn !== gb.turn) d.push('turn ' + ga.turn + ' → ' + gb.turn);
    if (ga.choices !== gb.choices) d.push('choices differ (' + ga.cards + ' → ' + gb.cards + ' cards)');
    const vd = Object.keys({ ...ga.vals, ...gb.vals }).filter((k) => (ga.vals || {})[k] !== (gb.vals || {})[k]);
    if (vd.length) d.push('final ' + vd.slice(0, 6).map((k) => k + ' ' + (ga.vals || {})[k] + '→' + (gb.vals || {})[k]).join(', ') + (vd.length > 6 ? ' …' : ''));
    if (d.length) { changed++; if (lines.length < 25) lines.push(key(ga) + ': ' + d.join('; ')); }
  }
  const dist = (s) => { const m = {}; s.games.forEach((g) => { const k = g.style + ' ' + (g.ending || 'ERROR'); m[k] = (m[k] || 0) + 1; }); return m; };
  const da = dist(a), db = dist(b);
  const distLines = Object.keys({ ...da, ...db }).sort().filter((k) => da[k] !== db[k]).map((k) => '  ' + k + ': ' + (da[k] || 0) + ' → ' + (db[k] || 0));
  const seenLines = [];
  for (const st of Object.keys({ ...a.seen, ...b.seen })) {
    const sa = a.seen[st] || {}, sb = b.seen[st] || {};
    const lost = Object.keys(sa).filter((id) => !sb[id]), gained = Object.keys(sb).filter((id) => !sa[id]);
    if (lost.length) seenLines.push('  ' + st + ': no longer seen: ' + lost.join(', '));
    if (gained.length) seenLines.push('  ' + st + ': newly seen: ' + gained.join(', '));
  }
  if (a.contentHash !== b.contentHash) console.log(C.d + 'content ' + a.contentHash + ' → ' + b.contentHash + C.x);
  if (!changed && !seenLines.length) { console.log(C.g + 'diff: no gameplay change' + C.x + ' (' + a.games.length + ' golden games)'); return true; }
  console.log(C.y + 'diff: ' + changed + ' of ' + a.games.length + ' golden games changed' + C.x);
  lines.forEach((l) => console.log('  ' + l));
  if (distLines.length) { console.log('endings:'); distLines.forEach((l) => console.log(l)); }
  if (seenLines.length) { console.log('coverage:'); seenLines.forEach((l) => console.log(l)); }
  return false;
}

/* ------------------------------------------------------------------ fmt */
function fmt(paths, opts = {}) {
  const files = paths.length ? paths.map((p) => path.resolve(p)).flatMap((p) => (fs.existsSync(p) && fs.statSync(p).isDirectory() ? listFiles(p) : [p])) : listFiles(CONTENT);
  let changed = 0, errors = 0;
  for (const f of files) {
    if (!fs.existsSync(f)) { console.error(C.r + 'not found: ' + C.x + f); errors++; continue; }
    const r = Fmt.formatChecked(fs.readFileSync(f, 'utf8'), rel(f));
    if (r.error) { console.error(C.r + rel(f) + ': ' + C.x + r.error); errors++; continue; }
    if (!r.changed) continue;
    changed++;
    if (opts.check) console.log(C.y + 'not canonical: ' + C.x + rel(f));
    else { fs.writeFileSync(f, r.text); console.log('formatted ' + rel(f)); }
  }
  if (!opts.quiet || changed || errors) console.log('fmt: ' + files.length + ' file(s), ' + changed + (opts.check ? ' not canonical' : ' rewritten') + (errors ? ', ' + errors + ' error(s)' : '') + (opts.check && changed ? C.d + ' — run node tools/grim.js fmt' + C.x : ''));
  return errors === 0 && !(opts.check && changed);
}

/* ------------------------------------------------------------------ query */
function query(args, opts = {}) {
  if (opts.fields) { for (const [k, v] of Object.entries(Query.FIELDS)) console.log(C.b + k.padEnd(16) + C.x + v); return; }
  const [node, ...rest] = args;
  if (!node) { console.log('usage: node tools/grim.js query NODE [WHERE]   (NODE: ' + Query.BLOCKS.concat(['option'], Query.STATEMENTS, ['stmt', 'any']).join(' ') + '; --fields lists what WHERE can use)'); return; }
  const { content, sources, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
  let hits;
  try { hits = Query.select(content, { node, where: rest.join(' ').trim() || null }); } catch (e) { console.error(C.r + 'query: ' + C.x + e.message); process.exit(1); }
  const lines = {}; for (const src of sources) lines[src.path] = src.text.split('\n');
  const srcLine = (h) => ((lines[h.file] || [])[h.line - 1] || '').trim();
  if (opts.file) hits = hits.filter((h) => h.file.includes(opts.file));
  if (opts.grep) { const re = new RegExp(opts.grep, 'i'); hits = hits.filter((h) => re.test(srcLine(h)) || re.test(h.text || h.title || h.label || '')); }
  if (opts.json) { console.log(JSON.stringify(hits.map((h) => ({ ...h, src: srcLine(h) })), null, 2)); return; }
  if (opts.group) {
    const g = {}; for (const h of hits) { const k = String(h[opts.group]); g[k] = (g[k] || 0) + 1; }
    Object.entries(g).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(String(v).padStart(5) + '  ' + k));
  } else {
    for (const h of hits) console.log(C.d + h.file + ':' + h.line + C.x + '  ' + C.b + h.block + (h.option ? '/' + h.option : '') + C.x + '  ' + srcLine(h));
  }
  console.log(C.d + hits.length + ' match(es)' + C.x);
}

/* ------------------------------------------------------------------ feedback */
// Same fingerprint the browser stamps on exported runs (src/ui.js runMeta), so logs from older content stand out.
const contentHash = () => P.contentHash();
function feedback(paths, opts = {}) {
  const files = [];
  for (const p of paths.length ? paths : [path.join(ROOT, 'feedback')]) {
    if (!fs.existsSync(p)) { console.error('not found: ' + p); continue; }
    if (fs.statSync(p).isDirectory()) files.push(...listFiles(p, '.json')); else files.push(p);
  }
  // A file holds one run ({format:'lumenhold-run'}) or an export ({format:'lumenhold-runs', runs:[…]}).
  // The same run can appear in several exports; keep the latest copy.
  const runs = {};
  for (const f of files) {
    let data; try { data = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.error(C.y + 'skipped ' + f + ': ' + e.message + C.x); continue; }
    for (const r of data.format === 'lumenhold-runs' ? data.runs || [] : [data]) {
      if (!r || !Array.isArray(r.hist)) continue;
      if (!runs[r.runId] || (r.updatedAt || 0) > (runs[r.runId].updatedAt || 0)) runs[r.runId] = r;
    }
  }
  const { content } = compileAll();
  const now = contentHash();
  const months = content.game.months || [];
  const byEvent = {};
  let total = 0;
  for (const r of Object.values(runs)) for (const h of r.hist) {
    if (!h.fb) continue;
    const key = h.t === 'end' ? h.id + ' (ending)' : h.id;
    if (opts.event && h.id !== opts.event) continue;
    const b = byEvent[key] = byEvent[key] || { id: h.id, up: 0, down: 0, notes: [] };
    if (h.fb.rating === 'up') b.up++; else if (h.fb.rating === 'down') b.down++;
    b.notes.push({ rating: h.fb.rating, comment: h.fb.comment, choice: h.label || null, actor: h.actor || null, turn: h.turn, run: r.runId, lang: r.lang, stale: !!r.contentHash && r.contentHash !== now, title: h.title });
    total++;
  }
  const rows = Object.entries(byEvent).sort((a, b) => (b[1].down - b[1].up) - (a[1].down - a[1].up) || b[1].notes.length - a[1].notes.length);
  if (opts.json) { console.log(JSON.stringify({ runs: Object.keys(runs).length, feedback: total, contentHash: now, events: Object.fromEntries(rows) }, null, 2)); return; }
  console.log(C.b + 'feedback: ' + total + ' note(s) on ' + rows.length + ' event(s) from ' + Object.keys(runs).length + ' run(s) in ' + files.length + ' file(s)' + C.x);
  if (!files.length) console.log(C.d + 'Export logs from the title screen (or an ending) and put the JSON files in feedback/.' + C.x);
  for (const [key, b] of rows) {
    const missing = !content.events[b.id] && !content.endings[b.id];
    console.log('\n' + C.b + key + C.x + '  ' + C.g + '+' + b.up + C.x + ' ' + C.r + '-' + b.down + C.x + (missing ? C.y + '  (no longer exists)' + C.x : ''));
    for (const n of b.notes) {
      const when = (months[((n.turn - 1) % (months.length || 12))] || 'month ' + n.turn) + ' Y' + Math.ceil(n.turn / (months.length || 12));
      const mark = n.rating === 'up' ? C.g + '+' + C.x : n.rating === 'down' ? C.r + '-' + C.x : ' ';
      console.log('  ' + mark + ' ' + C.d + when + (n.actor ? ' @' + n.actor : '') + (n.choice ? ' → ' + n.choice : '') + ' · ' + n.lang + ' · ' + n.run + (n.stale ? ' · older content' : '') + C.x);
      if (n.comment) console.log('    ' + n.comment.replace(/\n/g, '\n    '));
    }
  }
}

/* ------------------------------------------------------------------ stats / show / ids */
function stats() {
  const { content, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
  const ev = Object.values(content.events);
  const count = (arr, f) => arr.reduce((m, x) => { [].concat(f(x)).forEach((k) => { m[k] = (m[k] || 0) + 1; }); return m; }, {});
  console.log('events: ' + ev.length);
  console.log('  by trigger: ' + JSON.stringify(count(ev, (e) => e.trigger)));
  console.log('  by type:    ' + JSON.stringify(count(ev, (e) => e.type)));
  console.log('  by file:'); Object.entries(count(ev, (e) => e.file)).forEach(([k, v]) => console.log('    ' + String(v).padStart(4) + '  ' + k));
  console.log('  by tag:     ' + Object.entries(count(ev, (e) => e.tags || [])).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ':' + v).join(' '));
  console.log('  by actor:   ' + Object.entries(count(ev.filter((e) => e.actor), (e) => e.actor)).map(([k, v]) => k + ':' + v).join(' '));
  console.log('  chains:     ' + Object.entries(count(ev.filter((e) => e.chain), (e) => e.chain)).map(([k, v]) => k + ':' + v).join(' '));
  for (const k of ['states', 'npcs', 'endings', 'hooks', 'resources', 'skills']) console.log(k + ': ' + Object.keys(content[k]).length);
}
function show(id) {
  const { content, sources } = compileAll();
  let found = false;
  for (const k of ['events', 'states', 'npcs', 'endings', 'hooks', 'resources', 'skills']) {
    const d = content[k][id]; if (!d) continue; found = true;
    const src = sources.find((s) => s.path === d.file).text.split('\n');
    let end = d.line; while (end < src.length && !src[end].startsWith('@')) end++;
    console.log(C.b + d.file + ':' + d.line + C.x + '\n' + src.slice(d.line - 1, end).join('\n').trimEnd());
  }
  if (!found) console.log('(no block with id "' + id + '")');
  const re = new RegExp('\\b' + id + '\\b');
  console.log(C.b + '\nreferences:' + C.x);
  for (const s of sources) s.text.split('\n').forEach((l, i) => { if (re.test(l) && !l.startsWith('@')) console.log('  ' + s.path + ':' + (i + 1) + '  ' + l.trim()); });
}
function ids(kind) {
  const { content } = compileAll();
  const A = analyze(content);
  const map = { event: content.events, state: content.states, npc: content.npcs, ending: content.endings, resource: content.resources, skill: content.skills, hook: content.hooks, flag: A.flagsSet, var: A.varsSet };
  const kinds = kind ? [kind] : Object.keys(map);
  for (const k of kinds) { if (!map[k]) { console.log('unknown kind ' + k); continue; } console.log(C.b + k + C.x + ': ' + Object.keys(map[k]).sort().join(' ')); }
}

/* ------------------------------------------------------------------ main */
const [cmd, ...rest] = process.argv.slice(2);
const flag = (name) => { const i = rest.indexOf('--' + name); return i >= 0 ? (rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[i + 1] : true) : null; };
switch (cmd) {
  case 'build': build(); break;
  case 'lint': lint({ verbose: !!flag('verbose') }); break;
  case 'sim': { const ok = sim(Number(rest.find((x) => /^\d+$/.test(x))) || 300, { seed: flag('seed') != null ? Number(flag('seed')) : undefined, policy: flag('policy'), lang: flag('lang'), verbose: !!flag('verbose'), log: typeof flag('log') === 'string' ? path.resolve(flag('log')) : null }); if (!ok) process.exit(1); break; }
  case 'i18n': if (rest[0]) i18nSync(rest[0]); else i18nStatus(); break;
  case 'stats': stats(); break;
  case 'show': show(rest[0]); break;
  case 'ids': ids(rest[0]); break;
  case 'rename': {
    const [kind, from, to] = rest.filter((x) => !x.startsWith('--'));
    if (!to) { console.log('usage: node tools/grim.js rename KIND OLD NEW [--dry-run]   (KIND: ' + require('./rename.js').KINDS.join(' ') + ')'); process.exit(1); }
    let res;
    try { res = require('./rename.js').rename(ROOT, kind, from, to, { dryRun: !!flag('dry-run') }); } catch (e) { console.error(C.r + 'rename: ' + C.x + e.message); process.exit(1); }
    if (flag('dry-run')) console.log(res.diff);
    console.log((flag('dry-run') ? 'would rename ' : 'renamed ') + kind + ' ' + from + ' → ' + to + ': ' + res.references + ' reference(s), ' + res.files.length + ' file(s)' + (flag('dry-run') ? '' : '. Run: node tools/grim.js build'));
    if (res.comments) console.log(C.d + res.comments + ' comment line(s) mention "' + from + '" (left as written)' + C.x);
    if (res.elsewhere.length) console.log(C.y + 'not rewritten, check by hand: ' + C.x + res.elsewhere.join(', '));
    break;
  }
  case 'migrate': {
    let ran;
    try { ran = require('./migrate.js').migrate(ROOT, { dryRun: !!flag('dry-run') }); } catch (e) { console.error(C.r + 'migrate: ' + C.x + e.message); process.exit(1); }
    if (ran.length && !flag('dry-run')) console.log('Next: node tools/grim.js build && node tools/grim.js lint && node tools/grim.js diff');
    break;
  }
  case 'balance': if (!balance({ quick: !!flag('quick'), games: Number(flag('games')) || 0 })) process.exit(1); break;
  case 'snapshot': snapshot(path.resolve(flag('out') || path.join(ROOT, 'build', 'snapshots', (rest.find((x) => !x.startsWith('--') && rest[rest.indexOf(x) - 1] !== '--out') || 'latest') + '.json'))); break;
  case 'diff': {
    const files = rest.filter((x) => !x.startsWith('--'));
    const a = files[0] || path.join(ROOT, 'test', 'golden', 'baseline.json');
    let b = files[1];
    if (!b) { b = path.join(ROOT, 'build', 'snapshots', 'latest.json'); snapshot(b); }
    if (!snapDiff(a, b)) process.exit(1);
    break;
  }
  case 'fmt': if (!fmt(rest.filter((x) => !x.startsWith('--')), { check: !!flag('check') })) process.exit(1); break;
  case 'query': { const valued = ['file', 'grep', 'group']; query(rest.filter((x, i) => !x.startsWith('--') && !valued.includes((rest[i - 1] || '').slice(2))), { json: !!flag('json'), fields: !!flag('fields'), file: flag('file'), grep: flag('grep'), group: flag('group') }); break; }
  case 'feedback': feedback(rest.filter((x, i) => !x.startsWith('--') && rest[i - 1] !== '--event'), { event: flag('event'), json: !!flag('json') }); break;
  case 'check': { build(); const ok = lint({ noExit: true }); fmt([], { check: true, quiet: true }); const ok2 = sim(200, {}); process.exit(ok && ok2 ? 0 : 1); break; }
  default: console.log(fs.readFileSync(__filename, 'utf8').split(' */')[0].split('\n').slice(2).map((l) => l.replace(/^ \*\s?/, '')).join('\n'));
}
