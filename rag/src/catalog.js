'use strict';
const G = require('../../src/grimoire.js');
const { project } = require('../../tools/project.js');
const { hash, positive } = require('./util.js');

const KINDS = ['event', 'npc', 'fact', 'place', 'track', 'spell', 'faction', 'arc', 'clue', 'lore', 'timeline', 'item', 'archetype', 'vocab', 'state', 'hook'];
const SLOTS = ['on_show', 'tick', 'on_add', 'on_expire', 'on_remove', 'do'];
const words = (s) => String(s || '').toLowerCase().match(/[\p{L}\p{N}_]+(?:[.'’][\p{L}\p{N}_]+)*/gu) || [];

function catalog(root) {
  const { content, sources, errors } = project(root).compileAll();
  if (errors.length) throw new Error(errors.map((e) => e.message).join('\n'));
  return fromCompiled(content, sources);
}
function fromCompiled(content, sources) {
  const records = [], defs = new Map();
  for (const source of sources) {
    if (!source.path.startsWith('content/')) continue;
    const lines = source.text.split('\n');
    const blocks = G.parseFile(source.text, source.path);
    for (let i = 0; i < blocks.length; i++) {
      const raw = blocks[i], kind = raw.block;
      if (!KINDS.includes(kind)) continue;
      const d = (content[G.COLLECTION[kind]] || {})[raw.id] || raw;
      const end = blocks[i + 1] ? blocks[i + 1].line - 1 : lines.length;
      const text = lines.slice(raw.line - 1, end).join('\n');
      const branches = [], prose = [d.title, d.name, d.text, d.desc, d.voice];
      const expr = (e) => e && e.src || null;
      function walk(effects, location, guards) {
        for (const st of effects || []) {
          if (st.t === 'say') prose.push(st.text);
          branches.push({ statement: st.t, line: st.line, location, guards: guards.slice(), text: st.t === 'say' ? st.text : undefined });
          if (st.t === 'if') {
            const previous = [];
            for (const b of st.branches) { walk(b.body, location + '/if', guards.concat(previous.map((x) => 'not (' + x + ')'), b.cond.src)); previous.push(b.cond.src); }
            walk(st.else, location + '/else', guards.concat(previous.map((x) => 'not (' + x + ')')));
          } else if (st.t === 'challenge') {
            for (const result of ['win', 'partial', 'lose']) walk(st[result], location + '/' + result, guards.concat('challenge outcome=' + result));
          } else if (st.body) {
            walk(st.body, location + '/success', guards.concat(st.t + ' success'));
            walk(st.else, location + '/failure', guards.concat(st.t + ' failure'));
          }
        }
      }
      for (const o of d.options || []) { prose.push(o.label); walk(o.effects, 'option:' + o.key, [expr(d.when), expr(o.when)].filter(Boolean)); }
      for (const slot of SLOTS) walk(d[slot], slot, [expr(d.when)].filter(Boolean));
      const metadata = {};
      for (const field of ['canon', 'tier', 'actor', 'place', 'track', 'arc', 'chain', 'class', 'trigger', 'slot', 'plan', 'level', 'rank', 'specializes', 'tags', 'keys', 'voice', 'age', 'traits', 'interests', 'schedule', 'relations']) if (d[field] != null) metadata[field] = d[field];
      for (const field of ['when', 'unlock', 'defer', 'followed', 'discover']) if (d[field]) metadata[field] = expr(d[field]);
      if (kind === 'fact') metadata.npc = d.npc || d.id.split('.')[0];
      if (kind !== 'event') metadata.canon = d.canon || 'hard';
      records.push({ key: kind + ':' + d.id, id: d.id, kind, title: d.title || d.name || d.id, file: d.file, line: d.line, endLine: end,
        sourceHash: hash(text), text, prose: prose.filter(Boolean).join('\n'), metadata, branches,
        authority: kind === 'event' ? 'conditional-event' : 'worldbook', retired: (d.tags || []).includes('retired') });
      defs.set(kind + ':' + d.id, d);
    }
  }
  const byKey = new Map(records.map((r) => [r.key, r]));
  const edges = [], tokens = [];
  function add(from, kind, id, relation, location, guards = [], access = 'reference', detail = undefined) {
    if (!id || id === 'npc') return;
    if (kind === 'flagOrState') kind = content.states[id] ? 'state' : 'flag';
    const to = kind + ':' + id;
    const edge = { from, to, relation, location, guards, access, static: true, ...(detail ? { detail } : {}) };
    if (kind === 'flag') tokens.push(edge);
    else if (byKey.has(to)) edges.push(edge);
  }
  function scanExpr(from, ex, location, guards) {
    if (!ex || !ex.ast) return;
    G.walkAst(ex.ast, (n) => {
      if (n.t !== 'call') return;
      (G.FUNC_REFS[n.n] || []).forEach((kind, i) => { const a = n.args[i]; if (kind && a && a.t === 'sym') add(from, kind, a.v, n.n, location, guards, 'read'); });
    });
  }
  function scanEffects(from, effects, location, guards) {
    for (const st of effects || []) {
      const loc = location + ':' + st.line;
      if (st.t === 'flag' || st.t === 'unflag') for (const n of st.names) add(from, 'flag', n, st.t, loc, guards, st.t === 'flag' ? 'write' : 'clear');
      if (st.t === 'queue') {
        const detail = { delay: st.delay?.src || st.delay, now: !!st.now, with: st.with, chance: st.chance };
        if (st.tagged || st.pool) for (const e of G.deckOf(content, st)) add(from, 'event', e.id, st.pool ? 'queue-pool:' + st.pool : 'queue-tag:' + st.tagged, loc, guards, 'write', detail);
        else add(from, 'event', st.event, 'queue', loc, guards, 'write', detail);
      }
      const refs = { learn: ['fact', st.fact], find: ['clue', st.clue], advance: ['arc', st.arc], gain: ['state', st.state], lose: ['state', st.state], give: ['item', st.item], take: ['item', st.item], learn_spell: ['spell', st.spell], discover: ['place', st.place], meet: ['npc', st.npc], enrol: ['track', st.track], join: ['track', st.track], apply: ['track', st.track], rel: ['npc', st.npc], spark: ['npc', st.npc], npc_rel: ['npc', st.a] };
      if (refs[st.t]) add(from, ...refs[st.t], st.t, loc, guards, 'write');
      if (st.t === 'npc_rel') add(from, 'npc', st.b, st.t, loc, guards, 'write');
      if (st.t === 'say') for (const token of G.textTokens(st.text).tokens) add(from, 'npc', token.split('.')[0], 'text-token', loc, guards);
      if (st.t === 'if') {
        const previous = [];
        for (const b of st.branches) { scanExpr(from, b.cond, loc, guards); scanEffects(from, b.body, loc + '/if', guards.concat(previous.map((x) => 'not (' + x + ')'), b.cond.src)); previous.push(b.cond.src); }
        scanEffects(from, st.else, loc + '/else', guards.concat(previous.map((x) => 'not (' + x + ')')));
      } else if (st.t === 'challenge') {
        for (const outcome of ['win', 'partial', 'lose']) scanEffects(from, st[outcome], loc + '/' + outcome, guards.concat('challenge outcome=' + outcome));
      } else if (st.body) {
        scanEffects(from, st.body, loc + '/success', guards.concat(st.t + ' success'));
        scanEffects(from, st.else, loc + '/failure', guards.concat(st.t + ' failure'));
      }
    }
  }
  for (const r of records) {
    const d = defs.get(r.key), guards = d.when ? [d.when.src] : [];
    for (const f of ['when', 'unlock', 'defer', 'followed', 'discover']) scanExpr(r.key, d[f], f, guards);
    for (const [field, kind] of Object.entries({ actor: 'npc', place: 'place', track: 'track', arc: 'arc', specializes: 'event', lead: 'npc' })) add(r.key, kind, d[field], field, field);
    if (r.kind === 'fact') add(r.key, 'npc', r.metadata.npc, 'about', 'npc');
    for (const id of Object.keys(d.relations || {})) add(r.key, 'npc', id, 'relation', 'relations');
    for (const entry of d.schedule || []) add(r.key, 'place', entry.place, 'schedule', 'schedule');
    for (const id of d.clues || []) add(r.key, 'clue', id, 'clue-list', 'clues');
    for (const entry of d.teaches || []) add(r.key, 'spell', entry.spell, 'teaches', 'teaches');
    for (const role of d.cast || []) { add(r.key, 'npc', role.npc, 'cast:' + role.role, 'cast'); add(r.key, 'place', role.place, 'cast-place', 'cast'); scanExpr(r.key, role.where, 'cast:' + role.role, guards); }
    for (const o of d.options || []) { scanExpr(r.key, o.when, 'option:' + o.key, guards); scanEffects(r.key, o.effects, 'option:' + o.key, guards.concat(o.when ? [o.when.src] : [])); }
    for (const slot of SLOTS) scanEffects(r.key, d[slot], slot, guards);
    for (const token of G.textTokens(r.prose).tokens) add(r.key, 'npc', token.split('.')[0], 'text-token', 'prose');
    // Cast role selectors contain expressions rather than fixed NPC ids.
    if (d.cast && !Array.isArray(d.cast)) for (const role of Object.values(d.cast)) { if (role && typeof role === 'object') { scanExpr(r.key, role.where, 'cast', guards); add(r.key, 'npc', role.fixed || role.npc, 'cast', 'cast'); } }
  }
  return { version: 1, corpusHash: hash(sources.map((s) => [s.path, hash(s.text)])), records, edges, tokens };
}
function resolve(cat, key) {
  const found = cat.records.filter((r) => r.key === key || r.id === key);
  if (found.length !== 1) throw new Error(found.length ? 'Ambiguous id; use kind:id: ' + key : 'Unknown record: ' + key);
  return found[0];
}
function neighbors(cat, key, limit = 20) {
  const r = resolve(cat, key), all = cat.edges.filter((e) => e.from === r.key || e.to === r.key);
  for (const t of cat.tokens.filter((e) => e.from === r.key)) for (const other of cat.tokens.filter((e) => e.to === t.to && e.from !== r.key && (e.access === 'write' && t.access === 'read' || e.access === 'read' && t.access === 'write'))) {
    all.push({ from: t.access === 'write' ? r.key : other.from, to: t.access === 'write' ? other.from : r.key, relation: t.to, guards: t.guards.concat(other.guards), location: t.location + ' ↔ ' + other.location, static: true });
  }
  const unique = [...new Map(all.map((e) => [JSON.stringify(e), e])).values()];
  return { key: r.key, warning: 'Static references, not proof of reachability or unconditional facts.', edges: unique.slice(0, positive(limit, 20)), omitted: Math.max(0, unique.length - limit) };
}
function sourceSection(r) { return '## ' + r.key + '\n' + r.file + ':' + r.line + ' · ' + r.authority + '\nMetadata: ' + JSON.stringify(r.metadata) + '\n```grim\n' + r.text + '\n```\n'; }
function pack(records, budget = 24000, required = []) {
  budget = positive(budget, 24000);
  const kept = [], omitted = [], must = new Set(required), unique = [...new Map(records.map((r) => [r.key, r])).values()];
  unique.sort((a, b) => Number(must.has(b.key)) - Number(must.has(a.key)));
  let text = '';
  for (const r of unique) { const part = sourceSection(r); if (text.length + part.length <= budget) { text += part; kept.push(r.key); } else omitted.push(r.key); }
  return { text, chars: text.length, budget, ids: kept, omitted, incomplete: omitted.some((id) => must.has(id)), requiredOmitted: omitted.filter((id) => must.has(id)) };
}
module.exports = { catalog, fromCompiled, resolve, neighbors, pack, words, sourceSection };
