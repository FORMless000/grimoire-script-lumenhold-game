'use strict';
/*
 * The frozen content format (design §12). After schema v1 the format may only grow:
 * blocks, properties, statements, functions and identifiers can be added, never removed or changed.
 *
 *   manifest()            the current format, read from the parser (src/grimoire.js)
 *   compare(old, cur)     what was removed or changed; legacy entries may be removed (phase 3, step 8)
 *   parseSample(line)     parse one statement inside a throwaway event (for the samples below)
 *
 * test/golden/schema-v1.json is the frozen copy; `grim schema` checks it and `grim schema --update`
 * records additions. test/schema.test.js runs the same check.
 */
const G = require('../src/grimoire.js');

const SCHEMA_VERSION = 1;

// One line per statement kind that must keep parsing to the same statement type.
// A changed regex that still accepts these lines (and more) is an addition.
const SAMPLES = [
  ['say: Hello.', 'say'],
  ['flag a_flag', 'flag'],
  ['unflag a_flag', 'unflag'],
  ['gain hungry 3', 'gain'],
  ['lose hungry', 'lose'],
  ['queue some_event in 2', 'queue'],
  ['queue some_event within 1..3', 'queue'],
  ['queue some_event by month 9', 'queue'],
  ['queue some_event chance 33', 'queue'],
  ['queue any tagged some_tag now', 'queue'],
  ['unqueue some_event', 'unqueue'],
  ['enrol evocation 1', 'enrol'],
  ['join duelling', 'join'],
  ['leave duelling', 'leave'],
  ['promote duelling', 'promote'],
  ['apply royal_library', 'apply'],
  ['perform duelling +small', 'perform'],
  ['rank_xp duelling +2', 'rank_xp'],
  ['progress thesis +medium', 'progress'],
  ['study +small', 'study'],
  ['study evocation -tiny', 'study'],
  ['discover boathouse', 'discover'],
  ['find bell_key', 'find'],
  ['advance hollowstar +1', 'advance'],
  ['close hollowstar', 'close'],
  ['spawn pim from mentee', 'spawn'],
  ['rel lyra +small', 'rel'],
  ['spark lyra +tiny', 'spark'],
  ['npc_rel lyra kael -small', 'npc_rel'],
  ['learn lyra.mother', 'learn'],
  ['learn_spell flame 2', 'learn_spell'],
  ['bond lyra friend', 'bond'],
  ['meet lyra', 'meet'],
  ['end some_ending', 'end'],
  ['mood +small', 'delta'],
  ['gold = gold + 5', 'assign'],
  ['grind arcana', 'preset'],
  // legacy: raw amounts still parse (custom counters use them); `check` and `love` were retired on 2026-10-24
  ['mood +5', 'delta'],
];

// Constructs kept only for old content; the only removals the freeze allows (phase 3, step 8).
const LEGACY = {
  statements: ['check'],
  props: ['event.actor', 'place.draws', 'track.legacy'],
  functions: ['love'],
  samples: ['check arcana 12:', 'love lyra +5', 'mood +5'],
  identifiers: [],
  // Not separate parser entries, recorded for the record: the Standing resource and raw amounts in options.
  notes: ['resource grades (Standing) and its hooks', 'raw numbers in event options (tiers instead)', 'love x ±n (spark)'],
};

function parseSample(line) {
  const indent = line.endsWith(':') ? '\n    mood +tiny' : '';
  const src = '@event schema_probe\ntitle: t\ntext: t\n> left: a\n  ' + line + indent + '\n> right: b\n  mood +tiny\n';
  const defs = G.parseFile(src, '<schema>');
  const body = defs[0].options[0].effects;
  return body[0] ? body[0].t : null;
}

function manifest() {
  const blocks = {};
  for (const [k, v] of Object.entries(G.SCHEMA)) blocks[k] = { props: [...v.props].sort(), effects: [...(v.effects || [])].sort(), options: !!v.options };
  const functions = {};
  for (const f of [...G.FUNCS].sort()) functions[f] = G.FUNC_REFS[f] ? G.FUNC_REFS[f].length : null;
  const samples = {};
  for (const [line, t] of SAMPLES) samples[line] = t;
  return { schema: SCHEMA_VERSION, blocks, statements: [...G.STATEMENTS].sort(), functions, identifiers: [...G.IDENTS].sort(), tiers: G.TIERS, difficulties: G.DIFFICULTIES, classes: G.CLASSES, challengeKinds: Object.keys(G.CHALLENGE_KINDS), samples, legacy: LEGACY };
}

// Returns {removed: [...], changed: [...], added: [...]}. Removals of legacy entries go to `retired`.
function compare(old, cur) {
  const out = { removed: [], changed: [], added: [], retired: [] };
  const leg = old.legacy || { statements: [], props: [], functions: [], samples: [], identifiers: [] };
  const drop = (what, legacy) => (legacy ? out.retired : out.removed).push(what);
  for (const [b, v] of Object.entries(old.blocks)) {
    const c = cur.blocks[b];
    if (!c) { drop('block @' + b, false); continue; }
    for (const p of v.props) if (!c.props.includes(p)) drop('property ' + b + '.' + p, leg.props.includes(b + '.' + p));
    for (const p of v.effects) if (!c.effects.includes(p)) drop('effect block ' + b + '.' + p, false);
    if (v.options && !c.options) drop('options on @' + b, false);
  }
  for (const s of old.statements) if (!cur.statements.includes(s)) drop('statement ' + s, leg.statements.includes(s));
  for (const [f, n] of Object.entries(old.functions)) {
    if (!(f in cur.functions)) drop('function ' + f + '()', leg.functions.includes(f));
    else if (n != null && cur.functions[f] != null && cur.functions[f] < n) out.changed.push('function ' + f + '() takes fewer arguments (' + n + ' → ' + cur.functions[f] + ')');
  }
  for (const i of old.identifiers) if (!cur.identifiers.includes(i)) drop('identifier ' + i, (leg.identifiers || []).includes(i));
  for (const k of ['tiers', 'difficulties', 'classes', 'challengeKinds']) for (const x of old[k] || []) if (!(cur[k] || []).includes(x)) drop(k.slice(0, -1) + ' ' + x, false);
  for (const [line, t] of Object.entries(old.samples || {})) {
    let got; try { got = parseSample(line); } catch (e) { got = 'error: ' + e.message; }
    if (got !== t) (leg.samples.includes(line) ? out.retired : out.changed).push('"' + line + '" parsed as ' + t + ', now ' + got);
  }
  // additions, for `grim schema` to report
  for (const [b, v] of Object.entries(cur.blocks)) {
    const o = old.blocks[b];
    if (!o) { out.added.push('block @' + b); continue; }
    for (const p of v.props) if (!o.props.includes(p)) out.added.push('property ' + b + '.' + p);
  }
  for (const s of cur.statements) if (!old.statements.includes(s)) out.added.push('statement ' + s);
  for (const f of Object.keys(cur.functions)) if (!(f in old.functions)) out.added.push('function ' + f + '()');
  for (const i of cur.identifiers) if (!old.identifiers.includes(i)) out.added.push('identifier ' + i);
  for (const x of cur.challengeKinds || []) if (!(old.challengeKinds || []).includes(x)) out.added.push('challenge kind ' + x);
  for (const line of Object.keys(cur.samples)) if (!(line in (old.samples || {}))) out.added.push('sample "' + line + '"');
  return out;
}

module.exports = { SCHEMA_VERSION, SAMPLES, LEGACY, manifest, compare, parseSample };
