/*
 * Structural search over compiled Grimoire content. Used by `node tools/grim.js query`.
 *
 *   rows(content)        -> one row per block, option and effect statement, each with file:line
 *   select(content, q)   -> the rows of kind q.node that match q.where (a Grimoire expression)
 *
 * `where` uses the content language's own expression syntax, evaluated against the row's fields
 * (see FIELDS). has(x) is true when the row (or its block) is tagged x. Fields that do not apply to a
 * row are null, so comparisons with them are simply false.
 */
'use strict';
const G = require('../src/grimoire.js');

const BLOCKS = ['event', 'state', 'npc', 'ending', 'hook', 'resource', 'skill', 'place', 'track', 'spell', 'fact', 'archetype', 'faction', 'arc', 'clue', 'lore', 'timeline', 'vocab', 'item', 'pool', 'thread', 'cond', 'appointment'];
const STATEMENTS = ['say', 'if', 'chance', 'challenge', 'sit_exam', 'wage', 'coursework', 'flag', 'unflag', 'gain', 'lose', 'queue', 'rel', 'spark', 'npc_rel', 'cool', 'visit', 'learn', 'learn_spell', 'give', 'take', 'regrade', 'bond', 'meet', 'end', 'delta', 'assign'];
const COLLECTIONS = { event: 'events', state: 'states', npc: 'npcs', ending: 'endings', hook: 'hooks', resource: 'resources', skill: 'skills',
  place: 'places', track: 'tracks', spell: 'spells', fact: 'facts', archetype: 'archetypes', faction: 'factions', arc: 'arcs', clue: 'clues', lore: 'lore', timeline: 'timeline', vocab: 'vocab', item: 'items', pool: 'pools', thread: 'threads', cond: 'conds', appointment: 'appointments' };
const EFFECT_SLOTS = ['on_show', 'tick', 'on_add', 'on_expire', 'on_remove', 'do', 'on_zero'];

// Documented per node kind (printed by `grim query --fields`).
const FIELDS = {
  '(every row)': 'node file line block (id of the enclosing block) block_kind tags (use has(x))',
  '(statements)': 'option (key, or "" outside options) slot ("option", "on_show", "tick", "do", …) depth (0 = top level) trigger actor (of the enclosing event)',
  event: 'id title text_len trigger type actor weight weight_src repeat priority chain when_src defer_src options class tone track level rank place plan slot per arc beat specializes',
  state: 'id name kind group duration hidden deprecated day_visits',
  npc: 'id name romance start_rel age role year voice (has(trait) also matches traits and interests)',
  place: 'id name region map x y kind track discover_src deprecated (the survivor, or null)',
  track: 'id name kind skill levels place lead due hidden',
  spell: 'id name skill pool levels',
  fact: 'id npc tier unlock_src text len',
  'lore': 'id canon keys (has(key) matches a key or the id) text len',
  item: 'id name slot price start legacy_src bound worn (has worn effects)',
  'arc, faction, archetype, timeline, vocab': 'id name canon kind date event',
  ending: 'id title kind priority when_src',
  hook: 'id on when_src',
  resource: 'id name min max start',
  skill: 'id name start max',
  option: 'key label label_len when_src statements says checks (challenges)',
  chance: 'p (null unless constant) p_src has_else',
  if: 'branches cond_src has_else',
  'delta, rel, spark': 'name (resource/skill, or npc for rel/spark) npc min max amount (null for tier words) tier',
  challenge: 'kind tier rung standard offset odds drift steps using vs has_partial swing ally',
  sit_exam: 'swing',
  wage: 'size (a wage word, null for full)',
  regrade: 'track grade',
  assign: 'name op expr_src',
  say: 'text len',
  'flag, unflag': 'name (first) count',
  'gain, lose': 'state dur_src',
  queue: 'target now delay_src with',
  'bond, meet, end': 'npc status ending',
};

// Constant value of an expression, or null when it depends on game state.
function constant(ex) {
  if (!ex) return null;
  let pure = true;
  G.walkAst(ex.ast, (n) => { if (n.t === 'id' || n.t === 'call') pure = false; });
  if (!pure) return null;
  try { return ex.fn({ ident: () => 0, fn: () => 0 }); } catch (e) { return null; }
}
function mentions(ex, names) {
  let hit = false;
  if (ex) G.walkAst(ex.ast, (n) => { if (n.t === 'id' && names.includes(n.n)) hit = true; });
  return hit;
}
function countEffects(effects) { const n = { statements: 0, says: 0, checks: 0 }; G.walkEffects(effects, (st) => { n.statements++; if (st.t === 'say') n.says++; if (st.t === 'challenge') n.checks++; }); return n; }

function statementFields(st) {
  switch (st.t) {
    case 'say': return { text: st.text, len: st.text.length };
    case 'chance': return st.word ? { p: null, p_src: st.word, odds: st.word, steps: (st.steps || []).length, has_else: !!st.else } : { p: constant(st.p), p_src: st.p.src, has_else: !!st.else };
    case 'if': return { branches: st.branches.length, cond_src: st.branches[0].cond.src, has_else: !!st.else };
    case 'delta': return { name: st.name, min: st.min, max: st.max, amount: st.tier ? null : (st.min + st.max) / 2, tier: st.tier || null };
    case 'rel': case 'spark': return { name: st.npc, npc: st.npc, min: st.min, max: st.max, amount: st.tier ? null : (st.min + st.max) / 2, tier: st.tier || null };
    case 'challenge': return { kind: st.kind, tier: st.tier, rung: st.rung || null, standard: !!st.standard, offset: st.offset || 0, odds: st.odds || null, drift: st.drift || null, steps: (st.steps || []).length, using: st.using, vs: st.vs ? st.vs.who + '.' + st.vs.stat : null, has_partial: !!st.partial, swing: st.swing || null, ally: st.ally || null };
    case 'sit_exam': return { swing: st.swing || null };
    case 'wage': return { size: st.size || null };
    case 'coursework': return { track: st.track || null };
    case 'npc_rel': return { a: st.a, b: st.b, tier: st.tier || null };
    case 'learn': return { fact: st.fact };
    case 'learn_spell': return { spell: st.spell, level: st.level };
    case 'give': case 'take': return { item: st.item };
    case 'regrade': return { track: st.track, grade: st.grade };
    case 'assign': return { name: st.name, op: st.op, expr_src: st.expr.src };
    case 'flag': case 'unflag': return { name: st.names[0], count: st.names.length };
    case 'gain': return { state: st.state, dur_src: st.dur ? st.dur.src : null };
    case 'lose': return { state: st.state };
    case 'queue': return { target: st.event, tagged: st.tagged || null, pool: st.pool || null, now: st.now, delay_src: st.delay ? st.delay.src : null, with: st.with, chance: st.chance != null ? st.chance : st.chanceWord || null };
    case 'bond': return { npc: st.npc, status: st.status };
    case 'meet': return { npc: st.npc };
    case 'end': return { ending: st.ending };
  }
  return {};
}

function blockFields(kind, d) {
  const base = { id: d.id };
  switch (kind) {
    case 'event': return { ...base, title: d.title, text_len: (d.text || '').length, trigger: d.trigger, type: d.type, actor: d.actor || null, weight: d.weight ? constant(d.weight) : 10, weight_src: d.weight ? d.weight.src : null, repeat: d.repeat || 0, priority: d.priority == null ? null : d.priority, chain: d.chain || null, when_src: d.when ? d.when.src : null, defer_src: d.defer ? d.defer.src : null, options: d.options.length, class: d.class || null, tone: d.tone || null, track: d.track || null, level: d.level || null, rank: d.rank || null, place: d.place || null, plan: d.plan || null, slot: d.slot || null, per: d.per || null, arc: d.arc || null, beat: d.beat == null ? null : d.beat, specializes: d.specializes || null, pool: d.pool || null, pools: (d.pools || []).join(' ') || null, thread: d.thread || null, role: d.role || null, order: d.order || null };
    case 'state': return { ...base, name: d.name, kind: d.kind || null, group: d.group || null, duration: d.duration == null ? null : d.duration, hidden: !!d.hidden, deprecated: !!d.deprecated, day_visits: d.day ? d.day.filter((r) => r.source === 'visit').length : null };
    case 'npc': return { ...base, name: d.name, romance: !!d.romance, start_rel: d.start_rel || 0 };
    case 'ending': return { ...base, title: d.title, kind: d.kind || null, priority: d.priority || 0, when_src: d.when ? d.when.src : null };
    case 'hook': return { ...base, on: d.on, when_src: d.when ? d.when.src : null };
    case 'resource': return { ...base, name: d.name, min: d.min == null ? 0 : d.min, max: d.max == null ? 100 : d.max, start: d.start };
    case 'skill': return { ...base, name: d.name, start: d.start || 0, max: d.max == null ? 100 : d.max };
    case 'place': return { ...base, name: d.name, region: d.region || null, map: d.map ? d.map.map : null, x: d.map ? d.map.x : null, y: d.map ? d.map.y : null, kind: d.kind || 'public', track: d.track || null, discover_src: d.discover ? d.discover.src : null, deprecated: d.deprecated || null };
    case 'track': return { ...base, name: d.name, kind: d.kind, skill: [].concat(d.skill || []).join(' '), levels: d.levels || null, place: d.place || null, lead: d.lead || null, due: d.due || null, hidden: !!d.hidden };
    case 'spell': return { ...base, name: d.name, discipline: d.discipline || null, skill: [].concat(d.skill || []).join(' ') || null, verb: d.verb || null, pool: d.pool || null, levels: (d.cost || []).length, alignment: d.alignment || null };
    case 'fact': return { ...base, npc: d.npc || d.id.split('.')[0], tier: d.tier || null, unlock_src: d.unlock ? d.unlock.src : null, text: d.text, len: (d.text || '').length };
    case 'lore': return { ...base, canon: d.canon || null, keys: (d.keys || []).join(', '), text: d.text, len: (d.text || '').length };
    case 'clue': return { ...base, name: d.name || null, arc: d.arc || null, kind: d.kind || 'clue', text: d.text, len: (d.text || '').length };
    case 'item': return { ...base, name: d.name, slot: d.slot, price: d.price || null, start: !!d.start, legacy_src: d.legacy ? d.legacy.src : null, bound: !!d.bound, worn: !!d.worn };
    case 'pool': return { ...base, from: d.from || null, gives: Object.keys(d.props || {}).join(' ') };
    case 'thread': return { ...base, from: d.from || null, template: !!(d.params || d.roles), members: (d.members || []).length, clues: (d.clues || []).join(' ') || null, clock: !!d.clock };
    case 'cond': return { ...base, params: (d.params || []).join(' '), is: d.is };
    case 'appointment': return { ...base, at: d.at, for: (d.for || []).join(' ') || null, deals: Object.keys(d.deals || {})[0] || null, use: d.use || null, when_src: d.when ? d.when.src : null, builtin: !!d.builtin };
    case 'arc': case 'faction': case 'archetype': case 'timeline': case 'vocab': return { ...base, name: d.name || null, canon: d.canon || null, kind: d.kind || null, date: d.date || null, event: d.event || null };
  }
  return base;
}

function rows(content) {
  const out = [];
  for (const kind of BLOCKS) {
    for (const d of Object.values(content[COLLECTIONS[kind]])) {
      const common = { file: d.file, block: d.id, block_kind: kind, tags: [].concat(d.tags || [], d.traits || [], d.interests || [], kind === 'lore' ? [d.id].concat(d.keys || []) : []) };
      out.push({ node: kind, line: d.line, ...common, ...blockFields(kind, d) });
      const ctx = { ...common, trigger: d.trigger || null, actor: d.actor || null };
      const walk = (effects, slot, option, depth) => {
        for (const st of effects || []) {
          out.push({ node: st.t, line: st.line, ...ctx, option, slot, depth, ...statementFields(st) });
          if (st.t === 'if') { st.branches.forEach((b) => walk(b.body, slot, option, depth + 1)); walk(st.else, slot, option, depth + 1); }
          else if (st.t === 'challenge') { for (const k of ['win', 'partial', 'lose']) walk(st[k], slot, option, depth + 1); }
          else if (st.body) { walk(st.body, slot, option, depth + 1); walk(st.else, slot, option, depth + 1); }
        }
      };
      for (const o of d.options || []) {
        out.push({ node: 'option', line: o.line, ...ctx, option: o.key, key: o.key, label: o.label, label_len: (o.label || '').length, when_src: o.when ? o.when.src : null, ...countEffects(o.effects) });
        walk(o.effects, 'option', o.key, 0);
      }
      for (const slot of EFFECT_SLOTS) if (Array.isArray(d[slot])) walk(d[slot], slot, '', 0);
    }
  }
  return out;
}

// q: {node: 'challenge' | 'event' | … | 'stmt' (any statement) | 'any', where: 'expression' | null}
function select(content, q) {
  const kinds = q.node === 'any' ? null : q.node === 'stmt' ? STATEMENTS : [q.node];
  if (kinds && !kinds.every((k) => BLOCKS.includes(k) || STATEMENTS.includes(k) || k === 'option')) throw new Error('unknown node kind "' + q.node + '" (one of: ' + BLOCKS.concat(['option'], STATEMENTS, ['stmt', 'any']).join(' ') + ')');
  const where = q.where ? G.expr(q.where, '<query>', 1) : null;
  return rows(content).filter((r) => {
    if (kinds && !kinds.includes(r.node)) return false;
    if (!where) return true;
    const env = {
      // Missing / non-applicable fields are NaN: every comparison with them is false (not 0, as in game).
      ident: (n) => (r[n] == null ? NaN : r[n]),
      // has(x): tagged x. Every other function keeps its usual meaning where it makes sense (min, max, abs…).
      fn: (n, a) => {
        switch (n) {
          case 'has': return r.tags.includes(a[0]);
          case 'min': return Math.min(...a);
          case 'max': return Math.max(...a);
          case 'abs': return Math.abs(a[0]);
          case 'floor': return Math.floor(a[0]);
          case 'round': return Math.round(a[0]);
          case 'clamp': return Math.min(Math.max(a[0], a[1]), a[2]);
        }
        throw new Error('function ' + n + '() is not available in queries (use has(tag), min, max, abs, floor, round, clamp)');
      },
    };
    return !!where.fn(env);
  });
}

module.exports = { rows, select, FIELDS, BLOCKS, STATEMENTS };
