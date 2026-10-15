/*
 * Rename an id everywhere it is referenced: `node tools/grim.js rename <kind> <old> <new> [--dry-run]`.
 *
 * Kinds: event, state, npc, flag, var, ending, place, track, spell, arc. Content (.grim) and translation
 * (.lang) files are rewritten line by line:
 *   - block headers `@kind old`, and `.lang` block headers;
 *   - code: statements, `actor:`, `when:` / `weight:`, conditions, delays (whole words, not in strings);
 *   - text: only inside {tokens} ({old}, {old.their}, {=… old …}); prose is never touched;
 *   - `.lang` [hash]es are re-stamped when the English they were translated from only changed by the rename,
 *     so the rename doesn't make translations look stale.
 * Verification is independent of the rewrite: references to <old> of that kind are counted in the compiled
 * content before; afterwards <new> must have exactly as many and <old> none, and everything must compile.
 * Saves are not migrated (saves may break until 1.0). Mentions outside content/ and locales/ are reported.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const G = require('../src/grimoire.js');
const I18n = require('../src/i18n.js');
const { project } = require('./project.js');
const { Rewriter } = require('./rewrite.js');

const KINDS = ['event', 'state', 'npc', 'flag', 'var', 'ending', 'place', 'track', 'spell', 'arc'];
const HEADER_KINDS = { event: 'events', state: 'states', npc: 'npcs', ending: 'endings', place: 'places', track: 'tracks', spell: 'spells', arc: 'arcs' };
const SPECIAL = new Set(['npc', 'turn', 'month', 'year', 'turns_left', 'max_turns', 'cards_this_month', 'term', 'break', 'season', 'final_year', 'slot', 'term_index', 'gpa']);
// Properties whose values are ids or expressions (renamed as whole words); everything else is text.
const CODE_PROPS = new Set(['actor', 'when', 'weight', 'defer', 'ramp', 'track', 'place', 'teaches', 'discipline', 'schedule', 'relations', 'members', 'lead', 'npc', 'cast', 'event', 'discover', 'closed_when', 'hinted_when', 'unlock', 'prereq', 'clues', 'key_clues']);
const PRONOUNS = new Set(['they', 'them', 'their', 'theirs', 'are', 's', 'name', 'fullname', 'title', 'house']);

// Every reference in compiled content, as [kind, id] pairs (definitions included).
function references(content) {
  const out = [];
  const add = (k, id) => out.push([k, id]);
  const isVar = (n) => !SPECIAL.has(n) && !content.resources[n] && !content.skills[n];
  const scanExpr = (ex) => {
    if (!ex) return;
    G.walkAst(ex.ast, (n) => {
      if (n.t === 'id' && isVar(n.n)) add('var', n.n);
      if (n.t !== 'call') return;
      const kinds = G.FUNC_REFS[n.n] || [];
      n.args.forEach((a, i) => {
        if (a.t !== 'sym') return;
        const k = kinds[i];
        if (k === 'flagOrState') add(content.states[a.v] ? 'state' : 'flag', a.v);
        else if (k === 'flag' || k === 'state' || k === 'npc' || k === 'event' || k === 'track' || k === 'spell') add(k, a.v);
        else if (k === 'fact') add('npc', a.v.split('.')[0]);
      });
    });
  };
  const scanText = (text) => {
    if (!text) return;
    for (const m of String(text).matchAll(/\{([^{}]+)\}/g)) {
      const k = m[1].trim();
      if (k[0] === '=') { try { scanExpr(G.expr(k.slice(1))); } catch (e) { /* lint reports it */ } continue; }
      const head = k.includes('.') ? k.split('.')[0] : k;
      if (content.npcs[head]) add('npc', head);
    }
  };
  const scanEffects = (effects) => G.walkEffects(effects, (st) => {
    switch (st.t) {
      case 'say': scanText(st.text); break;
      case 'delta': if (isVar(st.name)) add('var', st.name); break;
      case 'assign': if (isVar(st.name)) add('var', st.name); scanExpr(st.expr); break;
      case 'flag': case 'unflag': st.names.forEach((n) => add('flag', n)); break;
      case 'gain': add('state', st.state); scanExpr(st.dur); break;
      case 'lose': add('state', st.state); break;
      case 'queue': add('event', st.event); if (st.with && st.with !== 'npc') add('npc', st.with); scanExpr(st.delay); break;
      case 'rel': case 'spark': case 'bond': case 'meet': if (st.npc !== 'npc') add('npc', st.npc); break;
      case 'end': add('ending', st.ending); break;
      case 'learn_spell': add('spell', st.spell); break;
      case 'learn': add('npc', st.fact.split('.')[0]); break;
      case 'npc_rel': for (const x of [st.a, st.b]) if (x !== 'npc') add('npc', x); break;
      case 'challenge': if (st.vs && st.vs.who !== 'npc') add('npc', st.vs.who); for (const x of st.steps || []) scanExpr(x.cond); break;
      case 'if': st.branches.forEach((b) => scanExpr(b.cond)); break;
      case 'chance': if (st.p) scanExpr(st.p); for (const x of st.steps || []) scanExpr(x.cond); break;
      case 'check': scanExpr(st.dc); break;
    }
  });
  for (const [kind, col] of Object.entries(HEADER_KINDS)) for (const id of Object.keys(content[col])) add(kind, id);
  // Worldbook references in data properties
  for (const d of Object.values(content.places || {})) { if (d.track) add('track', d.track); }
  for (const d of Object.values(content.tracks || {})) { if (d.place) add('place', d.place); if (d.lead) add('npc', d.lead); (d.teaches || []).forEach((x) => add('spell', x.spell)); scanExpr(d.prereq); }
  for (const d of Object.values(content.spells || {})) if (d.discipline) add('track', d.discipline);
  for (const d of Object.values(content.facts || {})) { add('npc', d.npc || d.id.split('.')[0]); scanExpr(d.unlock); }
  for (const d of Object.values(content.factions || {})) (d.members || []).forEach((m) => add('npc', m));
  for (const d of Object.values(content.arcs || {})) (d.cast || []).forEach((m) => add('npc', m));
  for (const d of Object.values(content.timeline || {})) if (d.event) add('event', d.event);
  for (const d of Object.values(content.places || {})) { scanExpr(d.discover); scanExpr(d.closed_when); scanExpr(d.hinted_when); }
  for (const n of Object.values(content.npcs)) {
    (n.schedule || []).forEach((x) => add('place', x.place));
    Object.keys(n.relations || {}).forEach((id) => add('npc', id));
  }
  for (const col of ['events', 'states', 'npcs', 'endings', 'hooks', 'resources']) {
    for (const d of Object.values(content[col])) {
      for (const f of ['title', 'text', 'scene', 'desc', 'name', 'label']) if (typeof d[f] === 'string') scanText(d[f]);
      scanExpr(d.when); scanExpr(d.weight); scanExpr(d.defer); if (d.ramp) scanExpr(d.ramp.expr);
      if (d.actor && !['any', 'npc'].includes(d.actor)) add('npc', d.actor);
      for (const f of ['on_show', 'tick', 'on_add', 'on_expire', 'on_remove', 'do', 'on_zero']) scanEffects(d[f]);
      for (const o of d.options || []) {
        scanText(o.label); scanText(o.hint); scanExpr(o.when); scanEffects(o.effects);
        if (o.spell) add('spell', o.spell);
        if (o.memory && o.memory.who !== 'npc') add('npc', o.memory.who);
      }
    }
  }
  return out;
}
const count = (refs, kind, id) => refs.filter(([k, i]) => k === kind && i === id).length;
const idSpaces = (refs) => { const m = {}; for (const [k, i] of refs) (m[i] = m[i] || new Set()).add(k); return m; };

// Replace whole-word `from` with `to` outside "string literals".
function replaceCode(line, from, to) {
  const re = new RegExp('\\b' + from + '\\b', 'g');
  return line.split(/("[^"]*"|'[^']*')/).map((part, i) => (i % 2 ? part : part.replace(re, to))).join('');
}
// Replace only inside {tokens}: {from}, {from.x}, and whole words inside {=expressions}.
function replaceTokens(text, from, to) {
  return text.replace(/\{([^{}]+)\}/g, (m, inner) => {
    const k = inner.trim();
    if (k[0] === '=') return '{' + replaceCode(inner, from, to) + '}';
    const [head, ...rest] = k.split('.');
    if (head === from && (!rest.length || PRONOUNS.has(rest[0].toLowerCase()))) return '{' + [to, ...rest].join('.') + '}';
    return m;
  });
}

// Rewrites one .grim file's lines; returns {edits: [[line, text]], comments: n}.
function planGrim(text, kind, from, to) {
  const edits = []; let comments = 0, blockKind = null, region = null, optionBase = null;
  const lines = text.split('\n');
  lines.forEach((raw, i) => {
    const c = raw.trim();
    if (!c) return;
    if (c.startsWith('#') || c.startsWith('//')) { if (new RegExp('\\b' + from + '\\b').test(c)) comments++; return; }
    const indent = raw.length - raw.trimStart().length;
    let next = raw;
    if (indent === 0) {
      region = null; optionBase = null;
      let m;
      if ((m = c.match(/^@([a-z]+)(\s+)([a-z_][a-z0-9_.]*)\s*$/))) { blockKind = m[1]; if (m[1] === kind && m[3] === from) next = '@' + m[1] + m[2] + to; else if (kind === 'npc' && m[1] === 'fact' && m[3].startsWith(from + '.')) next = '@fact' + m[2] + to + m[3].slice(from.length); }
      else if (c[0] === '>') { region = 'option'; next = raw.replace(/^(>\s*[a-z_][a-z0-9_]*)(\[[a-z_][a-z0-9_]*\])?(\s*:)(.*)$/, (x, head, sp, colon, label) => head + (sp ? replaceCode(sp, from, to) : '') + colon + replaceTokens(label, from, to)); }
      else if ((m = raw.match(/^([a-z_][a-z0-9_]*)(\s*:)(.*)$/))) {
        const schema = G.SCHEMA[blockKind];
        if (schema && schema.effects.includes(m[1])) { region = 'effects'; next = m[1] + m[2] + statement(m[3]); }
        else if (CODE_PROPS.has(m[1])) { region = 'code'; next = m[1] + m[2] + replaceCode(m[3], from, to); }
        else { region = 'text'; next = m[1] + m[2] + replaceTokens(m[3], from, to); }
      }
    } else if (region === 'text' || !region) next = replaceTokens(raw, from, to);
    else if (region === 'code') next = replaceCode(raw, from, to);
    else {
      if (region === 'option' && optionBase == null) optionBase = indent;
      const pm = region === 'option' && indent === optionBase && c.match(/^(when|hint|memory)\s*:/);
      if (pm && pm[1] === 'hint') next = replaceTokens(raw, from, to);
      else if (pm && pm[1] === 'memory') next = replaceCode(raw, from, to);
      else next = statement(raw);
    }
    if (next !== raw) edits.push([i + 1, next]);
  });
  return { edits, comments };
  function statement(s) {
    const m = s.match(/^(\s*say\s*:)(.*)$/);
    return m ? m[1] + replaceTokens(m[2], from, to) : replaceCode(s, from, to);
  }
}

function rename(root, kind, from, to, { dryRun = false } = {}) {
  if (!KINDS.includes(kind)) throw new Error('kind must be one of ' + KINDS.join(', '));
  if (!/^[a-z_][a-z0-9_]*$/.test(to)) throw new Error('"' + to + '" is not a valid id (lower_snake_case)');
  const P = project(root);
  const before = P.compileAll();
  if (before.errors.length) throw new Error('content does not compile: ' + before.errors[0].message);
  const refs0 = references(before.content);
  const n0 = count(refs0, kind, from);
  if (!n0) throw new Error('no ' + kind + ' "' + from + '" in the content');
  const spaces = idSpaces(refs0);
  if (spaces[to] || before.content.resources[to] || before.content.skills[to] || SPECIAL.has(to)) throw new Error('"' + to + '" is already used (' + [...(spaces[to] || ['built-in/resource/skill'])].join(', ') + ')');
  const other = [...spaces[from]].filter((k) => k !== kind);
  if (other.length) throw new Error('"' + from + '" is also used as a ' + other.join(', ') + '; rename would be ambiguous');

  const rw = new Rewriter(P.root);
  let comments = 0;
  for (const src of before.sources) {
    const plan = planGrim(src.text, kind, from, to);
    comments += plan.comments;
    for (const [line, text] of plan.edits) rw.edit(src.path, line, text);
  }
  // Compile the rewritten content in memory and verify before touching translations.
  const grimDry = rw.apply({ dryRun: true });
  const afterSources = before.sources.map((s) => { const r = grimDry.files.find((f) => f.file === s.path); return r ? { path: s.path, text: r.after } : s; });
  const after = G.compile(afterSources);
  if (after.errors.length) throw new Error('rewrite does not compile: ' + after.errors[0].message);
  const refs1 = references(after.content);
  const n1 = count(refs1, kind, to), left = count(refs1, kind, from);
  if (n1 !== n0 || left) throw new Error('verification failed: ' + n0 + ' reference(s) to ' + from + ' before; after: ' + n1 + ' to ' + to + ', ' + left + ' to ' + from + '. Nothing written.');

  // Translations: block headers, {tokens}, and hashes of English that only changed by this rename.
  const hashes = (content) => { const m = {}; for (const s of I18n.extract(content)) m[s.block + ' ' + s.key] = s.hash; return m; };
  const h0 = hashes(before.content), h1 = hashes(after.content);
  const blockOld = HEADER_KINDS[kind] ? kind + ':' + from : null;
  for (const lang of P.localeLangs()) {
    for (const src of P.loadLocaleSources(lang)) {
      let block = null;
      src.text.split('\n').forEach((raw, i) => {
        const c = raw.trim();
        let next = raw, m;
        if ((m = c.match(/^@([a-z]+)(?:\s+([a-z_][a-z0-9_.]*))?$/))) {
          block = m[1] + (m[2] ? ':' + m[2] : '');
          if (blockOld && block === blockOld) { next = raw.replace(new RegExp('(@' + kind + '\\s+)' + from + '\\b'), '$1' + to); block = kind + ':' + to; }
          else if (kind === 'npc' && m[1] === 'fact' && m[2] && m[2].startsWith(from + '.')) { const nid = to + m[2].slice(from.length); next = raw.replace('@fact ' + m[2], '@fact ' + nid); block = 'fact:' + nid; }
        } else if (c.startsWith('# en:')) next = replaceTokens(raw, from, to);
        else if ((m = raw.match(/^(\s*)([A-Za-z0-9_.@-]+)(\s+\[([0-9a-f]{6})\])?(\s*=\s?)(.*)$/))) {
          let key = m[2];
          if (kind === 'npc') key = key.replace(new RegExp('@' + from + '$'), '@' + to);
          const oldKey = (blockOld && block === kind + ':' + to ? blockOld : block) + ' ' + m[2];
          let hash = m[4];
          if (hash && h0[oldKey] === hash && h1[block + ' ' + key] && h1[block + ' ' + key] !== hash) hash = h1[block + ' ' + key];
          next = m[1] + key + (hash ? ' [' + hash + ']' : '') + m[5] + replaceTokens(m[6], from, to);
        }
        if (next !== raw) rw.edit(src.path, i + 1, next);
      });
    }
  }
  const res = rw.apply({ dryRun });
  // Mentions the tool doesn't rewrite: code, docs, tests.
  const elsewhere = [];
  const re = new RegExp('\\b' + from + '\\b');
  for (const dir of ['src', 'tools', 'docs', 'test', 'server', 'skills']) {
    for (const ext of ['.js', '.md', '.html', '.json']) {
      for (const f of require('./project.js').listFiles(path.join(P.root, dir), ext)) {
        if (/\/golden\//.test(f)) continue;
        fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => { if (re.test(l)) elsewhere.push(P.rel(f) + ':' + (i + 1)); });
      }
    }
  }
  return { ...res, references: n0, comments, elsewhere };
}

module.exports = { rename, references, KINDS, replaceTokens, replaceCode };
