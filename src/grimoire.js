/*
 * Grimoire Script — parser & expression compiler for Lumenhold content files (.grim)
 * Works in the browser (window.Grimoire) and in Node (require).
 * Language reference: docs/grimoire-script.md
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Grimoire = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class GrimError extends Error {
    constructor(msg, file, line) {
      super((file ? file + ':' + (line || '?') + ': ' : '') + msg);
      this.file = file; this.line = line; this.raw = msg;
    }
  }

  /* ------------------------------------------------------------------ *
   * Expressions
   * ------------------------------------------------------------------ */

  // Functions whose bare-identifier arguments are names (not variables).
  // `npc` is always resolved to the bound actor's id.
  const SYMBOLIC = new Set(['has', 'flag', 'left', 'rel', 'love', 'spark', 'bond', 'met', 'seen', 'since', 'chosen', 'bonds', 'npc_is', 'romanceable', 'tagged', 'passed', 'clue', 'spell_level', 'knows', 'npc_rel',
    'enrolled', 'member', 'rank', 'performance', 'level', 'progress', 'due', 'visits', 'present', 'act', 'clock', 'discovered', 'applied', 'cast_as', 'plan', 'visits_to', 'clues',
    // `around(x)`: x is on campus and reachable in person (not away for the break, not gone); `apart(x)`: months since
    // the last card with x (999 if never). Review fixes, batch 24–40.
    'around', 'apart',
    // `bonds_around(partner)`: like `bonds()`, counting only those who are `around` (review fixes, batch 41-159).
    'bonds_around',
    // `offered(courses)`: how many options an `offers:` menu of that kind would generate now (playtest 2, I10)
    'offered']);
  // Built-in identifiers the engine answers (env.ident); content can read but never assign them.
  const IDENTS = ['npc', 'turn', 'month', 'year', 'turns_left', 'max_turns', 'cards_this_month', 'term', 'break', 'season', 'final_year', 'slot', 'term_index', 'gpa', 'runs_completed', 'wrapup', 'off_campus', 'term_gpa'];
  const FUNCS = new Set([...SYMBOLIC, 'rand', 'min', 'max', 'abs', 'floor', 'round', 'clamp', 'known', 'chance_of']);
  // Reference kinds for linting: which argument of which function refers to what.
  const FUNC_REFS = {
    has: ['flagOrState'], flag: ['flag'], left: ['state'], rel: ['npc'], love: ['npc'], bond: ['npc'],
    met: ['npc'], seen: ['event'], since: ['event'], chosen: ['event', null], npc_is: ['npc'], bonds: [null], romanceable: ['npc'], tagged: ['npc', null],
    passed: ['track', null], clue: ['clue'], spark: ['npc'], spell_level: ['spell'], knows: ['fact'], npc_rel: ['npc', 'npc'],
    enrolled: ['track'], member: ['track'], rank: ['track'], performance: ['track'], level: ['track'], progress: ['track'], due: ['track'], visits: ['track'], applied: ['track'],
    present: ['place'], act: ['arc'], clock: ['arc'], discovered: ['place'], cast_as: [null, 'npc'], plan: [null], visits_to: ['place'], clues: ['arc'], offered: [null], around: ['npc'], apart: ['npc'], bonds_around: [null],
  };

  function tokenize(s, file, line) {
    const toks = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === ' ' || c === '\t') { i++; continue; }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i + 1] || ''))) {
        let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
        toks.push({ t: 'num', v: parseFloat(s.slice(i, j)) }); i = j; continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        let j = i; while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j++;
        // Dotted names: a fact (lyra.mother) or a character's stat (lyra.charm).
        while (s[j] === '.' && /[A-Za-z_]/.test(s[j + 1] || '')) { j++; while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j++; }
        const w = s.slice(i, j); i = j;
        if (w === 'and') toks.push({ t: 'op', v: '&&' });
        else if (w === 'or') toks.push({ t: 'op', v: '||' });
        else if (w === 'not') toks.push({ t: 'op', v: '!' });
        else if (w === 'true') toks.push({ t: 'bool', v: true });
        else if (w === 'false') toks.push({ t: 'bool', v: false });
        else toks.push({ t: 'id', v: w });
        continue;
      }
      if (c === '"' || c === "'") {
        let j = i + 1; while (j < s.length && s[j] !== c) j++;
        if (j >= s.length) throw new GrimError('unterminated string in expression: ' + s, file, line);
        toks.push({ t: 'str', v: s.slice(i + 1, j) }); i = j + 1; continue;
      }
      const two = s.slice(i, i + 2);
      if (['==', '!=', '<=', '>=', '&&', '||'].includes(two)) { toks.push({ t: 'op', v: two }); i += 2; continue; }
      if ('<>+-*/%(),!'.includes(c)) { toks.push({ t: 'op', v: c }); i++; continue; }
      if (c === '=') throw new GrimError('single "=" in expression (use "==" to compare): ' + s, file, line);
      throw new GrimError('unexpected character "' + c + '" in expression: ' + s, file, line);
    }
    return toks;
  }

  const BP = { '||': 1, '&&': 2, '==': 4, '!=': 4, '<': 5, '>': 5, '<=': 5, '>=': 5, '+': 6, '-': 6, '*': 7, '/': 7, '%': 7 };

  function parseExprAst(src, file, line) {
    const toks = tokenize(src, file, line); let p = 0;
    const peek = () => toks[p];
    const err = (m) => { throw new GrimError(m + ' in expression: ' + src, file, line); };
    function expect(v) { const t = toks[p]; if (!t || t.v !== v) err('expected "' + v + '"'); p++; }
    function nud() {
      const t = toks[p++];
      if (!t) err('unexpected end');
      if (t.t === 'num') return { t: 'num', v: t.v };
      if (t.t === 'str') return { t: 'str', v: t.v };
      if (t.t === 'bool') return { t: 'bool', v: t.v };
      if (t.t === 'id') {
        if (peek() && peek().v === '(') {
          p++; const args = [];
          if (!(peek() && peek().v === ')')) {
            for (;;) { args.push(expr(0)); if (peek() && peek().v === ',') { p++; continue; } break; }
          }
          expect(')');
          if (!FUNCS.has(t.v)) err('unknown function "' + t.v + '"');
          if (SYMBOLIC.has(t.v)) args.forEach((a, i) => { if (a.t === 'id' && a.n !== 'npc') args[i] = { t: 'sym', v: a.n }; });
          return { t: 'call', n: t.v, args };
        }
        return { t: 'id', n: t.v };
      }
      if (t.v === '(') { const e = expr(0); expect(')'); return e; }
      if (t.v === '-') return { t: 'un', op: '-', a: expr(8) };
      if (t.v === '!') return { t: 'un', op: '!', a: expr(3) };
      err('unexpected "' + t.v + '"');
    }
    function expr(rbp) {
      let left = nud();
      for (;;) {
        const t = peek();
        if (!t || t.t !== 'op' || !(t.v in BP) || BP[t.v] <= rbp) break;
        p++; left = { t: 'bin', op: t.v, a: left, b: expr(BP[t.v]) };
      }
      return left;
    }
    if (!toks.length) err('empty');
    const ast = expr(0);
    if (p < toks.length) err('unexpected "' + toks[p].v + '"');
    return ast;
  }

  function compileAst(n) {
    switch (n.t) {
      case 'num': case 'str': case 'bool': { const v = n.v; return () => v; }
      case 'sym': { const v = n.v; return () => v; }
      case 'id': { const k = n.n; return (env) => env.ident(k); }
      case 'un': {
        const a = compileAst(n.a);
        return n.op === '-' ? (e) => -num(a(e)) : (e) => !a(e);
      }
      case 'call': {
        const name = n.n; const args = n.args.map(compileAst);
        return (e) => e.fn(name, args.map((f) => f(e)));
      }
      case 'bin': {
        const a = compileAst(n.a), b = compileAst(n.b);
        switch (n.op) {
          case '&&': return (e) => a(e) && b(e);
          case '||': return (e) => a(e) || b(e);
          case '==': return (e) => a(e) == b(e); // eslint-disable-line eqeqeq
          case '!=': return (e) => a(e) != b(e); // eslint-disable-line eqeqeq
          case '<': return (e) => num(a(e)) < num(b(e));
          case '>': return (e) => num(a(e)) > num(b(e));
          case '<=': return (e) => num(a(e)) <= num(b(e));
          case '>=': return (e) => num(a(e)) >= num(b(e));
          case '+': return (e) => num(a(e)) + num(b(e));
          case '-': return (e) => num(a(e)) - num(b(e));
          case '*': return (e) => num(a(e)) * num(b(e));
          case '/': return (e) => { const d = num(b(e)); return d === 0 ? 0 : num(a(e)) / d; };
          case '%': return (e) => { const d = num(b(e)); return d === 0 ? 0 : num(a(e)) % d; };
        }
      }
    }
    throw new Error('bad ast node ' + n.t);
  }
  function num(v) { return typeof v === 'number' ? v : (v === true ? 1 : (v ? Number(v) || 0 : 0)); }

  function expr(src, file, line) {
    const ast = parseExprAst(String(src).trim(), file, line);
    return { src: String(src).trim(), ast, fn: compileAst(ast), file, line };
  }

  // Walk an expression AST, calling visit(node).
  function walkAst(n, visit) {
    visit(n);
    if (n.a) walkAst(n.a, visit);
    if (n.b) walkAst(n.b, visit);
    if (n.args) n.args.forEach((x) => walkAst(x, visit));
  }

  /* ------------------------------------------------------------------ *
   * Block schema
   * ------------------------------------------------------------------ */

  const SCHEMA = {
    game: { noId: true, props: ['title', 'subtitle', 'years', 'months', 'cards_per_month', 'max_cards_per_month', 'social_per_month', 'min_random_per_month', 'intro', 'summer_months', 'spell_resource',
      'schema', 'last_month', 'calendar', 'seasons', 'day_term', 'day_break', 'max_cards_per_day',
      // the origin menu shown before the game (its options are the origins); the final year's wrap-up months; the last day's recipe
      'origins', 'wrapup', 'day_last',
      // the exam card pushed for each enrolled course in a term's last month (playtest 2, M4)
      'exam',
      // sources whose cards are dealt across the whole day instead of their own slot (playtest 2, M43)
      'spread',
      // the card pushed when spark crosses @balance spark_follow's cooldown mark (M37)
      'spark_cooldown',
      // the hint card on the first visit to a job's place after the term's last shift (playtest 2, I1)
      'off_shift',
      // the card pushed after a failed course, in that course's context (playtest 2, N4)
      'appeal',
      // the resource whose up-front costs lock an option you can't pay (review fixes): `afford: gold`
      'afford',
      // the map shown unless a plan names another (A1; `campus` when absent)
      'map_id'], effects: [] },
    // Numbers (design §8.4): size and difficulty tiers, option-value weights, the expected-skill curve.
    balance: { noId: true, props: ['sizes', 'difficulty', 'weights', 'curve', 'desc', 'xp_cost', 'rank_xp', 'performance',
      // the combat stub's mix and entry cost (playtest 2, M39, M5); odds slopes per swing word (M14)
      'combat', 'combat_cost', 'swing',
      // a shift's pay per wage word (`wage short`), as a share of the job's `pay:` at your rank (M10)
      'wage',
      // coursework: the size tier of a course's monthly skill XP at each course level (feedback 2026-10-15)
      'coursework',
      // an exam's grade bands (margins over the bar for A, B and a pass) and how going for top marks moves them
      'exam_bands',
      // peers grow with the player (feedback 2026-10-15): characters with one of these tags reach `share` of the final E(turn)
      'npc_growth',
      // friendship gains carry spark along (M37): spark / per × the gain, at most cap× (partner× for a partner);
      // crossing `cooldown` spark pushes @game spark_cooldown
      'spark_follow',
      // the range a check's odds are clamped to: forced fail and forced success (L-3); milestones have no forced fail
      'odds',
      // exam preparation: what a course card adds by itself and the most it counts (L-3); a known spell's bonus on
      // checks of its discipline, per spell and at most (L-3)
      'study', 'spell_check',
      // the skill XP a spell gives in its skill when learned, one tier per spell level (L-6); a one-level spell's tier
      'spell_bonus', 'spell_bonus_one',
      // a course exam's difficulty tier at each course level (L alarms); rungs or `standard±N` use the check ladder
      'exam_tiers',
      // the check ladder (docs/authoring/checks.md, design §8.6): each rung's DC, the odds of each odds-by-nature word (%),
      // σ of the bell per luck word, drift per drift word, the z one circumstance step moves, the bell's floor and ceiling,
      // a course's standard rung at each level, and the rungs a course card rises per course level above its own
      'dc_tiers', 'likelihood', 'sigma', 'drift', 'odds_step', 'bell', 'course_standard', 'course_step', 'course_drift'], effects: [] },
    // A named group of effects, used as a statement: `grind arcana`. Its body may use $params.
    preset: { props: ['params', 'desc'], effects: [], raw: ['do'] },
    resource: { props: ['name', 'icon', 'min', 'max', 'start', 'color', 'desc', 'display', 'warn_below', 'drag'], effects: ['on_zero'] },
    skill: { props: ['name', 'icon', 'start', 'max', 'desc', 'color'], effects: [] },
    npc: { props: ['name', 'short', 'title', 'pronouns', 'house', 'desc', 'color', 'romance', 'tags', 'look', 'start_rel', 'age', 'role', 'year', 'traits', 'interests', 'stats', 'schedule', 'schedule_break', 'relations', 'voice', 'seeks', 'gone_when', 'distant'], effects: [] },
    // `map_id:` on a plan (A1): the map shown while it lasts, a map id or a track kind (the place of your track of that kind)
    state: { props: ['name', 'desc', 'art', 'tags', 'group', 'duration', 'hidden', 'kind', 'money', 'map_id'], effects: ['tick', 'on_add', 'on_expire', 'on_remove'] },
    event: { props: ['title', 'text', 'art', 'scene', 'tags', 'when', 'weight', 'trigger', 'actor', 'repeat', 'priority', 'type', 'chain', 'class', 'tone', 'variant',
      // phase 2b: where and when it happens, who is in it, what it belongs to (design §5, §6, §7, §10.6)
      // `time:` the slots it favours (M43), where `slot:` requires one
      'place', 'slot', 'time', 'replaces', 'track', 'level', 'rank', 'lesson', 'arc', 'beat', 'plan', 'cast', 'offers', 'pick', 'scope',
      // `ramp: rel(npc) 18..30`: pushed outside the pools, more likely each month as the value climbs (M13)
      'ramp',
      // `per: <role>`: once / repeat count per character in that cast role (what `actor: any` did)
      'per',
      // `defer: <expr>`: while true, a pushed card waits in the queue a month at a time instead of showing (I6)
      'defer'], effects: ['on_show'], options: true },
    ending: { props: ['title', 'text', 'art', 'scene', 'when', 'priority', 'tags', 'kind', 'slot', 'excludes'], effects: [] },
    hook: { props: ['on', 'when', 'desc', 'label'], effects: ['do'] },
    // Worldbook (design §3): data for briefs, lint and later phases. The engine doesn't play these yet.
    vocab: { props: ['values', 'desc'], effects: [] },
    place: { props: ['name', 'region', 'map', 'kind', 'track', 'open', 'season', 'closed_when', 'discover', 'hint', 'hinted_when', 'desc', 'art', 'draws', 'always'], effects: [] },
    // `intro:` the card where you first meet the track's `lead:` (playtest 2, N1): queued on enrolling or joining, instead of
    // meeting them silently.
    // `standard:` a course's rung at each level (checks.md), else @balance course_standard
    track: { props: ['kind', 'name', 'skill', 'levels', 'level_names', 'place', 'teaches', 'hidden', 'prereq', 'ranks', 'pay', 'due', 'lead', 'desc', 'legacy', 'opens', 'intro', 'standard', 'picked', 'start'], effects: [] },
    // Spells v2 (docs/spells-v2-list.md): `skill:` (one or two skills; none for Ward), `cost:` one value per level (one or
    // three levels), `verb:` the one verb its cards use, `pool: hidden | forbidden` (no source yet), `alignment:` a tier
    // a cast moves alignment by (down: casting it is wrong); `discipline:` and `power:` are optional.
    spell: { props: ['name', 'discipline', 'cost', 'power', 'desc', 'art', 'skill', 'verb', 'pool', 'alignment'], effects: [] },
    fact: { dotted: true, props: ['npc', 'tier', 'unlock', 'text'], effects: [] },
    archetype: { props: ['names', 'age', 'traits', 'pronouns', 'house', 'role', 'desc'], effects: [] },
    faction: { props: ['name', 'desc', 'members', 'alignment', 'stance'], effects: [] },
    // `act_names:` the acts' names as players read them, comma-separated in `acts:` order (playtest 2, X11)
    arc: { props: ['name', 'canon', 'acts', 'act_names', 'clock', 'beats', 'clues', 'key_clues', 'cast', 'desc'], effects: [] },
    // A clue or a lead as the Journal shows it (X11): `kind: clue` (the default) is one of its arc's `clues:`, counted by
    // clues(arc); `kind: lead` points somewhere to look and is never counted; `followed: <expr>` strikes a lead through.
    // A clue may instead name a side `thread:` (feedback 2026-10-15): anything hinted now that the player has to go
    // after later. Such a clue belongs to no arc and clues(arc) never counts it.
    clue: { props: ['arc', 'thread', 'name', 'text', 'kind', 'followed'], effects: [] },
    lore: { props: ['keys', 'canon', 'text'], effects: [] },
    timeline: { props: ['date', 'kind', 'event', 'text'], effects: [] },
  };
  const EXPR_PROPS = new Set(['when', 'weight', 'closed_when', 'gone_when', 'discover', 'hinted_when', 'unlock', 'prereq', 'defer', 'followed']);
  const NUM_PROPS = new Set(['years', 'cards_per_month', 'max_cards_per_month', 'social_per_month', 'min_random_per_month', 'min', 'max', 'start', 'duration', 'repeat', 'priority', 'start_rel', 'year', 'levels', 'due', 'alignment', 'warn_below',
    'schema', 'last_month', 'max_cards_per_day', 'level', 'rank', 'beat', 'pick', 'opens']);
  const LIST_PROPS = new Set(['tags', 'months', 'summer_months', 'traits', 'interests', 'open', 'members', 'clues', 'key_clues', 'params', 'draws', 'legacy', 'excludes', 'replaces', 'time', 'spread']);
  const TIERS = ['tiny', 'small', 'medium', 'large', 'huge'];
  const DIFFICULTIES = ['trivial', 'easy', 'medium', 'hard', 'heroic'];
  // The check ladder (docs/authoring/checks.md): rank words, each with a - and + rung; odds-by-nature, luck and drift words.
  const RANKS = ['novice', 'apprentice', 'journeyman', 'adept', 'expert', 'master', 'grandmaster', 'archmage'];
  const RUNG_RE = new RegExp('^(' + RANKS.join('|') + ')([+-])?$');
  const ODDS_WORDS = ['certain', 'sure', 'likely', 'even', 'unlikely', 'slim', 'long_shot', 'freak'];
  const SWINGS = ['steady', 'normal', 'wild', 'luck'];
  const DRIFTS = ['none', 'low', 'mid', 'high'];
  // A difficulty on the ladder: a rung (`adept+`) or a course's `standard`, `standard+1`.
  const isLadderTier = (x) => RUNG_RE.test(x) || /^standard([+-]\d+)?$/.test(x);
  // Challenge kinds (design §8.3) and the skill each one tests (`using <skill>` overrides).
  // combat (playtest 2, M39): the stub until the combat minigame; its value also reads condition and spells (@balance combat).
  const CHALLENGE_KINDS = { combat: ['arcana', 'vigor', 'guile'], duel: ['vigor', 'arcana'], negotiate: ['charm'], deceive: ['guile'], research: ['lore'], brew: ['alchemy'], enchant: ['alchemy'], exam: ['lore'], feat: ['vigor'], spell: ['arcana'] };
  const CLASSES = ['routine', 'milestone', 'incident', 'windfall', 'story', 'crisis'];
  const BOOL_PROPS = new Set(['romance', 'hidden']);
  // Structured worldbook values, parsed at compile time. Each returns the parsed value or throws a message.
  const ID_RE = /^[a-z_][a-z0-9_]*$/;
  const toNum = (x, what) => { const n = Number(x); if (!isFinite(n) || x === '') throw what + ': "' + x + '" is not a number'; return n; };
  const words = (t) => t.split(/[\s,]+/).filter(Boolean);
  const STRUCT_PROPS = {
    // "arcana 34 lore 22 wealth 5" -> {arcana: 34, lore: 22, wealth: 5}
    stats(t) { const w = words(t), o = {}; if (w.length % 2) throw 'stats: expected "name value" pairs'; for (let i = 0; i < w.length; i += 2) o[w[i]] = toNum(w[i + 1], 'stats ' + w[i]); return o; },
    // "duel_hall@afternoon,evening library@night" -> [{place, slots: [...]}]
    // `place@slot,slot` or `place@slot:30` (there 30% of the days, M42); `schedule_break:` is the same on breaks,
    // or `away` (gone for the break).
    schedule(t) { return t.split(/\s+/).filter(Boolean).map((x) => { const m = x.match(/^([a-z_][a-z0-9_]*)@([a-z,]+)(?::(\d{1,3}))?$/); if (!m) throw 'schedule: expected place@slot,slot or place@slot:N, got "' + x + '"'; return Object.assign({ place: m[1], slots: m[2].split(',').filter(Boolean) }, m[3] != null ? { chance: Math.min(100, +m[3]) } : {}); }); },
    schedule_break(t) { return t.trim() === 'away' ? { away: true, entries: [] } : { away: false, entries: STRUCT_PROPS.schedule(t) }; },
    // "kael:-20 tobias:5" -> {kael: -20, tobias: 5}
    relations(t) { const o = {}; for (const x of words(t)) { const m = x.match(/^([a-z_][a-z0-9_]*):(-?\d+)$/); if (!m) throw 'relations: expected npc:value, got "' + x + '"'; o[m[1]] = +m[2]; } return o; },
    // "flame@1 tide@2" -> [{spell, level}]
    teaches(t) { return words(t).map((x) => { const m = x.match(/^([a-z_][a-z0-9_]*)@(\d+)$/); if (!m) throw 'teaches: expected spell@level, got "' + x + '"'; return { spell: m[1], level: +m[2] }; }); },
    // "campus 660,150" -> {map, x, y}
    map(t) { const m = t.match(/^([a-z_][a-z0-9_]*)\s+(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/); if (!m) throw 'map: expected "<map> x,y", got "' + t + '"'; return { map: m[1], x: +m[2], y: +m[3] }; },
    pay(t) { return words(t).map((x) => toNum(x, 'pay')); },
    cost(t) { return words(t).map((x) => toNum(x, 'cost')); },
    power(t) { return words(t).map((x) => toNum(x, 'power')); },
    // "18..22" -> {min, max}; "19" -> 19
    age(t) { const m = t.match(/^(\d+)\s*\.\.\s*(\d+)$/); return m ? { min: +m[1], max: +m[2] } : toNum(t, 'age'); },
    clock(t) { const m = t.match(/^(-?\d+)\s*\.\.\s*(-?\d+)$/); if (!m) throw 'clock: expected "min..max"'; return { min: +m[1], max: +m[2] }; },
    // "omens@y1 investigation@y2" -> [{name, year}]
    acts(t) { return words(t).map((x) => { const m = x.match(/^([a-z_][a-z0-9_]*)@y(\d+)$/); if (!m) throw 'acts: expected name@yN, got "' + x + '"'; return { name: m[1], year: +m[2] }; }); },
    // "2@y1m3 3@y1m9" -> [{clock, year, month}]
    beats(t) { return words(t).map((x) => { const m = x.match(/^(\d+)@y(\d+)m(\d+)$/); if (!m) throw 'beats: expected clock@yNmM, got "' + x + '"'; return { clock: +m[1], year: +m[2], month: +m[3] }; }); },
    // Comma-separated when commas are present (multi-word values), else whitespace-separated.
    values(t) { return (t.includes(',') ? t.split(/\s*,\s*/) : t.split(/\s+/)).map((x) => x.trim()).filter(Boolean); },
    keys(t) { return t.split(/\s*,\s*/).map((x) => x.trim()).filter(Boolean); },
    // A track's skill: one or more skill ids.
    skill(t) { const w = words(t); return w.length === 1 ? w[0] : w; },
    // "health 2 4 7 12 20 | gold 3 8 15 30 60" -> {health: [2, 4, 7, 12, 20], …}
    sizes(t) { const o = {}; for (const part of t.split('|')) { const w = words(part); if (!w.length) continue; if (w.length !== 6) throw 'sizes: "' + part.trim() + '" needs a name and 5 amounts (tiny small medium large huge)'; o[w[0]] = w.slice(1).map((x) => toNum(x, 'sizes ' + w[0])); } return o; },
    // "trivial -15 easy -7 medium 0 hard 8 heroic 16"
    difficulty(t) { const w = words(t), o = {}; for (let i = 0; i < w.length; i += 2) { if (!DIFFICULTIES.includes(w[i])) throw 'difficulty: unknown tier "' + w[i] + '"'; o[w[i]] = toNum(w[i + 1], 'difficulty ' + w[i]); } return o; },
    weights(t) { const w = words(t), o = {}; if (w.length % 2) throw 'weights: expected "name value" pairs'; for (let i = 0; i < w.length; i += 2) o[w[i]] = toNum(w[i + 1], 'weights ' + w[i]); return o; },
    curve(t) { return words(t).map((x) => toNum(x, 'curve')); },
    // "-50 0.5": below -50, increases are halved
    drag(t) { const w = words(t); if (w.length !== 2) throw 'drag: expected "<below> <factor>"'; return { below: toNum(w[0], 'drag'), factor: toNum(w[1], 'drag') }; },
    // "term=1-4 break=5-6 term=7-10 break=11-12" -> ['term', 'term', …] indexed by month - 1
    calendar(t) { const out = []; for (const x of words(t)) { const m = x.match(/^([a-z_]+)=(\d+)-(\d+)$/); if (!m) throw 'calendar: expected name=from-to, got "' + x + '"'; for (let i = +m[2]; i <= +m[3]; i++) out[i - 1] = m[1]; } return out; },
    seasons(t) { return STRUCT_PROPS.calendar(t); },
    // "morning=courses noon=social:1-2 afternoon=visit night=world:1" -> [{slot, source, min, max}]
    day_term(t) { return words(t).map((x) => { const m = x.match(/^([a-z_]+)=([a-z_]+)(?::(\d+)(?:-(\d+))?)?$/); if (!m) throw 'day recipe: expected slot=source[:min-max], got "' + x + '"'; const min = m[3] != null ? +m[3] : null; return { slot: m[1], source: m[2], min, max: m[4] != null ? +m[4] : min }; }); },
    day_break(t) { return STRUCT_PROPS.day_term(t); },
    day_last(t) { return STRUCT_PROPS.day_term(t); },
    // `wrapup: 11-12` (or `11, 12`): months of the final year that close the run
    wrapup(t) { const out = []; for (const x of t.split(/[\s,]+/).filter(Boolean)) { const m = x.match(/^(\d+)(?:-(\d+))?$/); if (!m) throw 'wrapup: expected months like 11-12, got "' + x + '"'; for (let i = +m[1]; i <= +(m[2] || m[1]); i++) out.push(i); } return out; },
    xp_cost(t) { const w = words(t); if (w.length !== 2) throw 'xp_cost: expected "a b" (cost of the next point = a + b × level)'; return { a: toNum(w[0], 'xp_cost'), b: toNum(w[1], 'xp_cost') }; },
    rank_xp(t) { return words(t).map((x) => toNum(x, 'rank_xp')); },
    performance(t) { return STRUCT_PROPS.weights(t); },
    combat(t) { return STRUCT_PROPS.weights(t); },
    swing(t) { return STRUCT_PROPS.weights(t); },
    wage(t) { return STRUCT_PROPS.weights(t); },
    spark_follow(t) { return STRUCT_PROPS.weights(t); },
    odds(t) { return STRUCT_PROPS.weights(t); },
    study(t) { return STRUCT_PROPS.weights(t); },
    exam_bands(t) { return STRUCT_PROPS.weights(t); },
    npc_growth(t) { const m = t.trim().match(/^share\s+(\S+)\s+tags?\s+(.+)$/); if (!m) throw 'npc_growth: expected "share <0..1> tags <tag> <tag>…"'; return { share: toNum(m[1], 'npc_growth share'), tags: words(m[2]) }; },
    spell_check(t) { return STRUCT_PROPS.weights(t); },
    exam_tiers(t) { const w = words(t); for (const x of w) if (!DIFFICULTIES.includes(x) && !isLadderTier(x)) throw 'exam_tiers: expected a difficulty per course level (trivial … heroic, a rung, or standard±N), got "' + x + '"'; return w; },
    // "novice- 0 novice 4 … archmage+ 92"
    dc_tiers(t) { const o = STRUCT_PROPS.weights(t); for (const k of Object.keys(o)) if (!RUNG_RE.test(k)) throw 'dc_tiers: unknown rung "' + k + '"'; return o; },
    likelihood(t) { const o = STRUCT_PROPS.weights(t); for (const k of Object.keys(o)) if (!ODDS_WORDS.includes(k)) throw 'likelihood: unknown word "' + k + '" (' + ODDS_WORDS.join(', ') + ')'; return o; },
    sigma(t) { const o = STRUCT_PROPS.weights(t); for (const k of Object.keys(o)) if (!SWINGS.includes(k)) throw 'sigma: unknown luck word "' + k + '"'; return o; },
    drift(t) { const o = STRUCT_PROPS.weights(t); for (const k of Object.keys(o)) if (!DRIFTS.includes(k)) throw 'drift: unknown word "' + k + '"'; return o; },
    odds_step(t) { return toNum(t.trim(), 'odds_step'); },
    bell(t) { return STRUCT_PROPS.weights(t); },
    course_standard(t) { const w = words(t); for (const x of w) if (!RUNG_RE.test(x)) throw 'course_standard: expected a rung per course level, got "' + x + '"'; return w; },
    course_step(t) { return toNum(t.trim(), 'course_step'); },
    course_drift(t) { const w = t.trim(); if (!/^[a-z_]+$/.test(w)) throw 'course_drift: expected a drift word (none, low, mid, high)'; return w; },
    standard(t) { const w = words(t); for (const x of w) if (!RUNG_RE.test(x)) throw 'standard: expected a rung per course level, got "' + x + '"'; return w; },
    coursework(t) { const w = words(t); for (const x of w) if (!TIERS.includes(x)) throw 'coursework: expected a size tier per course level (tiny … huge), got "' + x + '"'; return w; },
    spell_bonus_one(t) { const w = words(t); if (w.length !== 1 || !TIERS.includes(w[0])) throw 'spell_bonus_one: expected one size tier (tiny … huge), got "' + t + '"'; return w[0]; },
    spell_bonus(t) { const w = words(t); for (const x of w) if (!TIERS.includes(x)) throw 'spell_bonus: expected a size tier per spell level (tiny … huge), got "' + x + '"'; return w; },
    ramp(t) { const m = t.trim().match(/^(.+?)\s+(-?\d+)\s*\.\.\s*(-?\d+)$/); if (!m || +m[3] <= +m[2]) throw 'ramp: expected "<expression> low..high", e.g. ramp: rel(npc) 18..30'; return { expr: m[1], lo: +m[2], hi: +m[3] }; },
  };
  // `locked:` a menu option whose `when` fails stays visible, disabled, with this reason (M24); others hide.
  const OPTION_PROPS = new Set(['when', 'hint', 'memory', 'locked']);

  /* ------------------------------------------------------------------ *
   * Effects
   * ------------------------------------------------------------------ */

  const ID = '[a-z_][a-z0-9_]*';
  const RE = {
    say: /^say\s*:\s*(.*)$/,
    if: /^if\s+(.+):$/,
    elif: /^elif\s+(.+):$/,
    else: /^else\s*:$/,
    chance: /^chance\s+(.+?)%?\s*:$/,
    check: new RegExp('^check\\s+(' + ID + ')\\s+(.+):$'),
    // gen.* flags are reserved for live generation (design §T3)
    flag: new RegExp('^flag\\s+((?:gen\\.)?' + ID + '(?:\\s+(?:gen\\.)?' + ID + ')*)$'),
    unflag: new RegExp('^unflag\\s+((?:gen\\.)?' + ID + '(?:\\s+(?:gen\\.)?' + ID + ')*)$'),
    gain: new RegExp('^gain\\s+(' + ID + ')(?:\\s+(.+))?$'),
    lose: new RegExp('^lose\\s+(' + ID + ')$'),
    // `chance N` (playtest 2, I4): when due, the card is pushed with probability N%, else dropped.
    queue: new RegExp('^queue\\s+(' + ID + ')(?:\\s+(now|in\\s+.+?|within\\s+\\d+\\s*\\.\\.\\s*\\d+|by\\s+month\\s+\\d+))?(?:\\s+with\\s+(' + ID + '))?(?:\\s+chance\\s+(\\d+|' + ODDS_WORDS.join('|') + '))?$'),
    // `queue any tagged <tag> …` (feedback 2026-10-16): one queued event with the tag, drawn when it falls due.
    queueAny: new RegExp('^queue\\s+any\\s+tagged\\s+(' + ID + ')(?:\\s+(now|in\\s+.+?|within\\s+\\d+\\s*\\.\\.\\s*\\d+|by\\s+month\\s+\\d+))?(?:\\s+with\\s+(' + ID + '))?(?:\\s+chance\\s+(\\d+|' + ODDS_WORDS.join('|') + '))?$'),
    unqueue: new RegExp('^unqueue\\s+(' + ID + ')$'),
    sayAs: new RegExp('^say\\[(' + ID + ')\\]\\s*:\\s*(.*)$'),
    trackOp: new RegExp('^(enrol|join|leave|promote|apply)\\s+(' + ID + ')(?:\\s+(\\d))?$'),
    trackAmount: new RegExp('^(perform|rank_xp|progress)\\s+(' + ID + ')\\s*([+-])\\s*(\\d+|tiny|small|medium|large|huge)$'),
    // study [track] ±n: exam preparation for one enrolled course (or all of them), capped at 15 (design §7.3).
    study: new RegExp('^study(?:\\s+(' + ID + '))?\\s*([+-])\\s*(\\d+|tiny|small|medium|large|huge)$'),
    discover: new RegExp('^discover\\s+(' + ID + ')$'),
    find: new RegExp('^find\\s+(' + ID + ')$'),
    advanceArc: new RegExp('^advance\\s+(' + ID + ')\\s*\\+\\s*(\\d+)$'),
    spawn: new RegExp('^spawn\\s+(' + ID + ')\\s+from\\s+(' + ID + ')$'),
    social: new RegExp('^(rel|love|spark)\\s+(' + ID + ')\\s*([+-])\\s*(\\d+)(?:\\s*~\\s*(\\d+))?$'),
    socialTier: new RegExp('^(rel|love|spark)\\s+(' + ID + ')\\s*([+-])\\s*(tiny|small|medium|large|huge)$'),
    deltaTier: new RegExp('^(' + ID + ')\\s*([+-])\\s*(tiny|small|medium|large|huge)$'),
    npcRel: new RegExp('^npc_rel\\s+(' + ID + ')\\s+(' + ID + ')\\s*([+-])\\s*(\\d+|tiny|small|medium|large|huge)$'),
    learn: new RegExp('^learn\\s+(' + ID + '\\.' + ID + ')$'),
    learnSpell: new RegExp('^learn_spell\\s+(' + ID + ')(?:\\s+([123]))?$'),
    // `regrade track C` (N4): the course's latest grade becomes this one (an appeal won)
    regrade: new RegExp('^regrade\\s+(' + ID + ')\\s+([ABCF])$'),
    challenge: new RegExp('^challenge\\s+(' + ID + ')(?:\\s+using\\s+(' + ID + '))?(?:\\s+vs\\s+(' + ID + ')\\.(' + ID + '))?\\s+(trivial|easy|medium|hard|heroic)(?:\\s+(wild|steady))?\\s*:$'),
    sitExam: /^sit_exam(?:\s+(wild|steady))?$/,
    wage: /^wage(?:\s+([a-z]+))?$/,
    coursework: /^coursework(?:\s+([a-z_]+))?$/,
    cool: /^cool\s+([a-z_][a-z0-9_]*)$/,
    visitSlot: /^visit\s+([a-z]+)$/,
    preset: new RegExp('^(' + ID + ')((?:\\s+' + ID + ')*)$'),
    bond: new RegExp('^bond\\s+(' + ID + ')\\s+(' + ID + ')$'),
    meet: new RegExp('^meet\\s+(' + ID + ')$'),
    end: new RegExp('^end\\s+(' + ID + ')$'),
    delta: new RegExp('^(' + ID + ')\\s*([+-])\\s*(\\d+)(?:\\s*~\\s*(\\d+))?$'),
    assign: new RegExp('^(?:set\\s+)?(' + ID + ')\\s*(\\+=|-=|=(?!=))\\s*(.+)$'),
  };

  // Circumstance steps (checks.md): ` +1 if <cond> -1 if <cond>` at the end of a check's line.
  function parseSteps(text, E) {
    return String(text || '').split(/\s+(?=[+-]\d+\s+if\s)/).map((x) => x.trim()).filter(Boolean).map((x) => { const m = x.match(/^([+-]\d+)\s+if\s+(.+)$/); return { n: +m[1], cond: E(m[2]) }; });
  }
  // A ladder challenge (docs/authoring/checks.md): challenge <kind> [using <skill>] <rung | standard±N | vs <who>.<stat> [±N]>
  // [<odds>] [<luck>] [drift <word>] [±N if <cond>]…  (the legacy form, with trivial … heroic, is matched first by RE.challenge)
  function parseChallenge(body, E, file, line) {
    const bad = (msg) => { throw new GrimError('challenge: ' + msg + ' in "challenge ' + body + ':"', file, line); };
    const cut = body.search(/\s[+-]\d+\s+if\s/);
    const tok = (cut < 0 ? body : body.slice(0, cut)).trim().split(/\s+/);
    const st = { t: 'challenge', ladder: true, kind: tok.shift(), using: null, vs: null, tier: null, rung: null, standard: null, offset: 0, odds: null, swing: null, drift: null,
      steps: parseSteps(cut < 0 ? '' : body.slice(cut), E), win: null, partial: null, lose: null, line, block: true, outcomes: true };
    if (!ID_RE.test(st.kind || '')) bad('expected a kind');
    if (tok[0] === 'using') { tok.shift(); st.using = tok.shift(); if (!ID_RE.test(st.using || '')) bad('expected a skill after using'); }
    let m;
    if (tok[0] === 'vs') { tok.shift(); if (!(m = (tok.shift() || '').match(/^([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)$/))) bad('expected <who>.<stat> after vs'); st.vs = { who: m[1], stat: m[2] }; if (/^[+-]\d+$/.test(tok[0] || '')) st.offset = +tok.shift(); }
    else if (RUNG_RE.test(tok[0] || '')) st.rung = tok.shift();
    else if ((m = (tok[0] || '').match(/^standard([+-]\d+)?$/))) { tok.shift(); st.standard = true; st.offset = m[1] ? +m[1] : 0; }
    else bad('expected a difficulty (a rung such as adept+, standard, or vs <who>.<stat>)');
    if (ODDS_WORDS.includes(tok[0])) st.odds = tok.shift();
    if (SWINGS.includes(tok[0])) { const w = tok.shift(); st.swing = w === 'normal' ? null : w; }
    if (tok[0] === 'drift') { tok.shift(); st.drift = tok.shift(); if (!DRIFTS.includes(st.drift)) bad('expected ' + DRIFTS.join('/') + ' after drift'); }
    if (tok.length) bad('unexpected "' + tok.join(' ') + '"');
    return st;
  }

  function parseStatement(content, file, line) {
    let m;
    const E = (s) => expr(s, file, line);
    if ((m = content.match(RE.say))) return { t: 'say', text: m[1].trim(), line };
    if ((m = content.match(RE.sayAs))) return { t: 'say', who: m[1], text: m[2].trim(), line };
    if ((m = content.match(RE.if))) return { t: 'if', branches: [{ cond: E(m[1]), body: [] }], else: null, line, block: true };
    if ((m = content.match(RE.elif))) return { t: 'elif', cond: E(m[1]), line, block: true };
    if ((m = content.match(RE.else))) return { t: 'else', line, block: true };
    if ((m = content.match(/^chance\s+([a-z_]+)((?:\s+[+-]\d+\s+if\s+.+?)*)\s*:$/)) && ODDS_WORDS.includes(m[1])) return { t: 'chance', word: m[1], steps: parseSteps(m[2], E), p: null, body: [], else: null, line, block: true };
    if ((m = content.match(RE.chance))) return { t: 'chance', p: E(m[1]), body: [], else: null, line, block: true };
    if ((m = content.match(RE.check))) return { t: 'check', skill: m[1], dc: E(m[2]), body: [], else: null, line, block: true };
    if ((m = content.match(RE.challenge))) return { t: 'challenge', kind: m[1], using: m[2] || null, vs: m[3] ? { who: m[3], stat: m[4] } : null, tier: m[5], swing: m[6] || null, win: null, partial: null, lose: null, line, block: true, outcomes: true };
    if (/^challenge\s.*:$/.test(content)) return parseChallenge(content.slice(10, -1), E, file, line);
    if ((m = content.match(RE.sitExam))) return { t: 'sit_exam', swing: m[1] || null, line };
    if ((m = content.match(RE.wage))) return { t: 'wage', size: m[1] || null, line };
    if ((m = content.match(RE.coursework))) return { t: 'coursework', track: m[1] || null, line };
    if ((m = content.match(RE.cool))) return { t: 'cool', npc: m[1], line };
    if ((m = content.match(RE.visitSlot))) return { t: 'visit', slot: m[1], line };
    if (content.endsWith(':')) throw new GrimError('unknown block statement "' + content + '" (expected if/elif/else/chance/check)', file, line);
    if ((m = content.match(RE.flag))) return { t: 'flag', names: m[1].split(/\s+/), line };
    if ((m = content.match(RE.unflag))) return { t: 'unflag', names: m[1].split(/\s+/), line };
    if ((m = content.match(RE.gain))) return { t: 'gain', state: m[1], dur: m[2] ? E(m[2]) : null, line };
    if ((m = content.match(RE.lose))) return { t: 'lose', state: m[1], line };
    if ((m = content.match(RE.queueAny)) || (m = content.match(RE.queue))) {
      const any = RE.queueAny.test(content);
      const st = Object.assign({ t: 'queue', event: any ? null : m[1], now: false, delay: null, with: m[3] || null, line }, any ? { tagged: m[1] } : {});
      if (m[4] != null) { if (/^\d+$/.test(m[4])) st.chance = +m[4]; else st.chanceWord = m[4]; }
      let w;
      if (m[2] === 'now') st.now = true;
      else if (m[2] && (w = m[2].match(/^within\s+(\d+)\s*\.\.\s*(\d+)$/))) st.window = { from: +w[1], to: +w[2] };
      else if (m[2] && (w = m[2].match(/^by\s+month\s+(\d+)$/))) st.byMonth = +w[1];
      else if (m[2]) st.delay = E(m[2].replace(/^in\s+/, ''));
      return st;
    }
    if ((m = content.match(RE.unqueue))) return { t: 'unqueue', event: m[1], line };
    if ((m = content.match(RE.trackOp))) return { t: m[1], track: m[2], level: m[3] ? +m[3] : null, line };
    if ((m = content.match(RE.trackAmount))) {
      const st = { t: m[1], track: m[2], sign: m[3] === '-' ? -1 : 1, line };
      if (TIERS.includes(m[4])) st.tier = m[4]; else st.min = st.max = +m[4] * st.sign;
      return st;
    }
    if ((m = content.match(RE.study))) {
      const st = { t: 'study', track: m[1] || null, sign: m[2] === '-' ? -1 : 1, line };
      if (TIERS.includes(m[3])) st.tier = m[3]; else st.min = st.max = +m[3] * st.sign;
      return st;
    }
    if ((m = content.match(RE.discover))) return { t: 'discover', place: m[1], line };
    if ((m = content.match(RE.find))) return { t: 'find', clue: m[1], line };
    if ((m = content.match(RE.advanceArc))) return { t: 'advance', arc: m[1], n: +m[2], line };
    if ((m = content.match(RE.spawn))) return { t: 'spawn', id: m[1], archetype: m[2], line };
    // `love` is the v0.2 name of spark (kept as a legacy alias until phase 3).
    if ((m = content.match(RE.social))) {
      const a = +m[4], b = m[5] != null ? +m[5] : a, s = m[3] === '-' ? -1 : 1;
      return { t: m[1] === 'rel' ? 'rel' : 'spark', npc: m[2], min: Math.min(a, b) * s, max: Math.max(a, b) * s, line, legacy: m[1] === 'love' || undefined };
    }
    if ((m = content.match(RE.socialTier))) return { t: m[1] === 'rel' ? 'rel' : 'spark', npc: m[2], sign: m[3] === '-' ? -1 : 1, tier: m[4], line, legacy: m[1] === 'love' || undefined };
    if ((m = content.match(RE.npcRel))) {
      const st = { t: 'npc_rel', a: m[1], b: m[2], sign: m[3] === '-' ? -1 : 1, line };
      if (TIERS.includes(m[4])) st.tier = m[4]; else { st.min = st.max = +m[4] * st.sign; }
      return st;
    }
    if ((m = content.match(RE.learn))) return { t: 'learn', fact: m[1], line };
    if ((m = content.match(RE.learnSpell))) return { t: 'learn_spell', spell: m[1], level: m[2] ? +m[2] : null, line };
    if ((m = content.match(RE.regrade))) return { t: 'regrade', track: m[1], grade: m[2], line };
    if ((m = content.match(RE.bond))) return { t: 'bond', npc: m[1], status: m[2], line };
    if ((m = content.match(RE.meet))) return { t: 'meet', npc: m[1], line };
    if ((m = content.match(RE.end))) return { t: 'end', ending: m[1], line };
    if ((m = content.match(RE.delta))) {
      const a = +m[3], b = m[4] != null ? +m[4] : a, s = m[2] === '-' ? -1 : 1;
      return { t: 'delta', name: m[1], min: Math.min(a, b) * s, max: Math.max(a, b) * s, line };
    }
    if ((m = content.match(RE.deltaTier))) return { t: 'delta', name: m[1], sign: m[2] === '-' ? -1 : 1, tier: m[3], line };
    if ((m = content.match(RE.assign))) return { t: 'assign', name: m[1], op: m[2], expr: E(m[3]), line };
    // Anything else shaped like `name arg arg` is a preset use, checked and expanded by compile().
    if ((m = content.match(RE.preset))) return { t: 'preset', name: m[1], args: m[2].trim() ? m[2].trim().split(/\s+/) : [], line };
    throw new GrimError('unknown statement "' + content + '"', file, line);
  }

  // lines: [{indent, content, line}] — nonblank only
  function parseEffectLines(lines, file) {
    let pos = 0;
    function block(indent) {
      const out = [];
      while (pos < lines.length) {
        const L = lines[pos];
        if (L.indent < indent) break;
        if (L.indent > indent) throw new GrimError('unexpected indentation', file, L.line);
        pos++;
        const st = parseStatement(L.content, file, L.line);
        if (st.t === 'say' && st.who) {
          const prev = out[out.length - 1];
          if (!prev || prev.t !== 'say' || prev.who) throw new GrimError('say[' + st.who + ']: must follow the say: line it replaces', file, L.line);
          (prev.overrides = prev.overrides || {})[st.who] = st.text;
          continue;
        }
        let body = [];
        if (st.outcomes) {
          if (!(pos < lines.length && lines[pos].indent > indent)) throw new GrimError('"' + L.content + '" needs win:/lose: outcomes', file, L.line);
          const oi = lines[pos].indent;
          while (pos < lines.length && lines[pos].indent === oi) {
            const O = lines[pos];
            const om = O.content.match(/^(win|partial|lose)\s*:\s*(.*)$/);
            if (!om) throw new GrimError('expected win:, partial: or lose: under challenge, got "' + O.content + '"', file, O.line);
            if (st[om[1]]) throw new GrimError('duplicate ' + om[1] + ': in challenge', file, O.line);
            pos++;
            const first = om[2].trim() ? [parseStatement(om[2].trim(), file, O.line)] : [];
            if (first.length && first[0].block) throw new GrimError('put block statements on their own line under ' + om[1] + ':', file, O.line);
            const rest = pos < lines.length && lines[pos].indent > oi ? block(lines[pos].indent) : [];
            st[om[1]] = first.concat(rest);
          }
          if (!st.win || !st.lose) throw new GrimError('challenge needs both win: and lose:', file, L.line);
          out.push(st);
          continue;
        }
        if (st.block) {
          if (pos < lines.length && lines[pos].indent > indent) body = block(lines[pos].indent);
          else throw new GrimError('"' + L.content + '" needs an indented body', file, L.line);
        }
        if (st.t === 'elif' || st.t === 'else') {
          const prev = out[out.length - 1];
          if (!prev || !['if', 'chance', 'check'].includes(prev.t)) throw new GrimError(st.t + ' without matching if/chance/check', file, L.line);
          if (prev.else) throw new GrimError(st.t + ' after else', file, L.line);
          if (st.t === 'elif') {
            if (prev.t !== 'if') throw new GrimError('elif only follows if', file, L.line);
            prev.branches.push({ cond: st.cond, body });
          } else prev.else = body;
          continue;
        }
        if (st.t === 'if') st.branches[0].body = body;
        else if (st.block) st.body = body;
        out.push(st);
      }
      return out;
    }
    if (!lines.length) return [];
    return block(lines[0].indent);
  }

  // Generic visitor over effect statements (recurses into branches).
  function walkEffects(effects, visit) {
    if (!effects) return;
    for (const st of effects) {
      visit(st);
      if (st.t === 'if') { st.branches.forEach((b) => walkEffects(b.body, visit)); walkEffects(st.else, visit); }
      else if (st.t === 'challenge') { walkEffects(st.win, visit); walkEffects(st.partial, visit); walkEffects(st.lose, visit); }
      else if (st.body) { walkEffects(st.body, visit); walkEffects(st.else, visit); }
    }
  }

  /* ------------------------------------------------------------------ *
   * File parser
   * ------------------------------------------------------------------ */

  function joinText(first, lines) {
    const paras = []; let cur = first ? [first.trim()] : [];
    for (const L of lines) {
      if (L.blank) { if (cur.length) { paras.push(cur.join(' ')); cur = []; } continue; }
      cur.push(L.content);
    }
    if (cur.length) paras.push(cur.join(' '));
    return paras.join('\n\n').trim();
  }

  function parseFile(text, file) {
    file = file || '<input>';
    const raw = String(text).replace(/\r\n?/g, '\n').split('\n');
    const lines = raw.map((l, i) => {
      const s = l.replace(/\t/g, '  ').replace(/\s+$/, '');
      const content = s.trim();
      if (!content) return { blank: true, line: i + 1 };
      if (content.startsWith('#') || content.startsWith('//')) return { comment: true, line: i + 1 };
      return { indent: s.length - s.trimStart().length, content, line: i + 1 };
    }).filter((l) => !l.comment);

    const blocks = []; let cur = null;
    for (const L of lines) {
      if (!L.blank && L.indent === 0 && L.content.startsWith('@')) {
        const m = L.content.match(/^@([a-z]+)(?:\s+([a-z_][a-z0-9_]*(?:\.[a-z_][a-z0-9_]*)?))?\s*$/);
        if (!m) throw new GrimError('bad block header "' + L.content + '" (expected "@kind id", ids are lower_snake_case)', file, L.line);
        const kind = m[1];
        if (!SCHEMA[kind]) throw new GrimError('unknown block kind "@' + kind + '"', file, L.line);
        if (m[2] && m[2].includes('.') && !SCHEMA[kind].dotted) throw new GrimError('ids of @' + kind + ' can\'t contain "." (only @fact ids are npc.key)', file, L.line);
        if (SCHEMA[kind].dotted && m[2] && !m[2].includes('.')) throw new GrimError('@' + kind + ' ids are npc.key (e.g. lyra.mother)', file, L.line);
        if (!SCHEMA[kind].noId && !m[2]) throw new GrimError('@' + kind + ' needs an id', file, L.line);
        cur = { kind, id: m[2] || kind, file, line: L.line, body: [] };
        blocks.push(cur);
        continue;
      }
      if (!cur) { if (!L.blank) throw new GrimError('content before first @block', file, L.line); continue; }
      cur.body.push(L);
    }
    return blocks.map(parseBlock);
  }

  // cast:
  //   friend: any where rel(friend) >= 20
  //   host: present(place)            (or present(<place id>))
  //   stranger: anyone where tagged(stranger, student)
  //   mentor: thorne                   (a fixed character)
  function parseCast(val, lines, file, line) {
    if (val.trim()) throw new GrimError('cast: put one role per line below it ("friend: any where …")', file, line);
    if (!lines.length) throw new GrimError('cast: needs at least one role', file, line);
    return lines.map((L) => {
      const m = L.content.match(/^([a-z_][a-z0-9_]*)\s*:\s*(any|anyone|present\(\s*([a-z_][a-z0-9_]*)\s*\)|[a-z_][a-z0-9_]*)(?:\s+where\s+(.+))?$/);
      if (!m) throw new GrimError('cast role: expected "role: any|anyone|present(place)|<npc> [where <condition>]", got "' + L.content + '"', file, L.line);
      if (['npc', 'player', 'track', 'place'].includes(m[1]) && m[1] !== 'npc') throw new GrimError('"' + m[1] + '" is reserved and can\'t be a role name', file, L.line);
      const pool = m[2].startsWith('present') ? 'present' : (m[2] === 'any' || m[2] === 'anyone') ? m[2] : 'fixed';
      return { role: m[1], pool, place: m[3] || null, npc: pool === 'fixed' ? m[2] : null, where: m[4] ? expr(m[4], file, L.line) : null };
    });
  }

  function parseBlock(b) {
    const schema = SCHEMA[b.kind]; const file = b.file;
    const def = { block: b.kind, id: b.id, file, line: b.line, options: schema.options ? [] : undefined };
    const body = b.body; let i = 0;
    const takeIndented = () => {
      const out = [];
      while (i < body.length && (body[i].blank || body[i].indent > 0)) out.push(body[i++]);
      while (out.length && out[out.length - 1].blank) out.pop();
      return out;
    };
    while (i < body.length) {
      const L = body[i];
      if (L.blank) { i++; continue; }
      if (L.indent > 0) throw new GrimError('unexpected indentation (properties start at column 0)', file, L.line);
      i++;
      if (L.content.startsWith('>')) {
        if (!schema.options) throw new GrimError('options (">") are only allowed in @event', file, L.line);
        const m = L.content.match(/^>\s*([a-z_][a-z0-9_]*)(?:\[([a-z_][a-z0-9_]*)\])?\s*:\s*(.*)$/);
        if (!m) throw new GrimError('bad option header "' + L.content + '" (expected "> key: Label")', file, L.line);
        if (m[2] && m[1] !== 'up') throw new GrimError('only the "up" option takes a spell: > up[' + m[2] + ']:', file, L.line);
        if (m[1] === 'up' && !m[2]) throw new GrimError('the "up" option needs a spell: > up[ward]: Label', file, L.line);
        const opt = { key: m[1], spell: m[2] || null, label: m[3].trim(), when: null, hint: null, locked: null, memory: null, effects: [], line: L.line };
        if (def.options.some((o) => o.key === opt.key)) throw new GrimError('duplicate option key "' + opt.key + '"', file, L.line);
        const sub = takeIndented().filter((x) => !x.blank);
        const eff = [];
        const base = sub.length ? sub[0].indent : 0;
        for (const S of sub) {
          const pm = S.indent === base && S.content.match(/^([a-z_]+)\s*:\s*(.*)$/);
          if (pm && OPTION_PROPS.has(pm[1])) {
            if (pm[1] === 'when') opt.when = expr(pm[2], file, S.line);
            else if (pm[1] === 'memory') {
              const mm = pm[2].trim().match(/^([a-z_][a-z0-9_]*)\s+([a-z_][a-z0-9_]*)$/);
              if (!mm) throw new GrimError('memory: expected "<kind> <who>", e.g. memory: helped npc', file, S.line);
              opt.memory = { kind: mm[1], who: mm[2] };
            } else if (pm[1] === 'locked') opt.locked = pm[2].trim();
            else opt.hint = pm[2].trim();
          } else eff.push(S);
        }
        if (eff.length && eff[0].indent !== base) throw new GrimError('unexpected indentation', file, eff[0].line);
        opt.effects = parseEffectLines(eff, file);
        def.options.push(opt);
        continue;
      }
      const m = L.content.match(/^([a-z_][a-z0-9_]*)\s*:\s*(.*)$/);
      if (!m) throw new GrimError('expected "key: value", "> option: Label" or "@block", got "' + L.content + '"', file, L.line);
      const key = m[1], val = m[2];
      const sub = takeIndented();
      if (key === 'cast' && b.kind === 'event') { def.cast = parseCast(val, sub.filter((x) => !x.blank), file, L.line); continue; }
      if (key === 'cast' && b.kind === 'arc') { def.cast = words(joinText(val, sub)); continue; }
      if (schema.raw && schema.raw.includes(key)) {
        // Kept as lines; parsed when the preset is used, after $params are substituted.
        def[key] = (val.trim() ? [{ indent: 1000, content: val.trim(), line: L.line }] : []).concat(sub.filter((x) => !x.blank));
        continue;
      }
      if (schema.effects.includes(key)) {
        const effLines = [];
        if (val.trim()) effLines.push({ indent: 1000, content: val.trim(), line: L.line });
        const nb = sub.filter((x) => !x.blank);
        if (effLines.length && nb.length) throw new GrimError('effect block "' + key + ':" has both an inline value and an indented body', file, L.line);
        def[key] = parseEffectLines(effLines.length ? effLines : nb, file);
        continue;
      }
      if (!schema.props.includes(key)) throw new GrimError('unknown property "' + key + '" for @' + b.kind + ' (allowed: ' + schema.props.concat(schema.effects).join(', ') + ')', file, L.line);
      if (key in def && key !== 'options') throw new GrimError('duplicate property "' + key + '"', file, L.line);
      const text = joinText(val, sub);
      if (STRUCT_PROPS[key] && !(key === 'skill' && b.kind !== 'track' && b.kind !== 'spell')) {
        try { def[key] = STRUCT_PROPS[key](text); } catch (e) { throw new GrimError(typeof e === 'string' ? e : e.message, file, L.line); }
        if (key === 'ramp') def.ramp.expr = expr(def.ramp.expr, file, L.line);
      } else if (EXPR_PROPS.has(key) || (key === 'max' && b.kind === 'resource' && !isFinite(Number(text)))) def[key] = expr(text, file, L.line);
      else if (NUM_PROPS.has(key) && !(key === 'alignment' && b.kind === 'spell') && !(key === 'start' && b.kind === 'track')) {
        const n = Number(text);
        if (!isFinite(n)) throw new GrimError('property "' + key + '" must be a number, got "' + text + '"', file, L.line);
        def[key] = n;
      } else if (LIST_PROPS.has(key)) def[key] = text.split(/[\s,]+/).filter(Boolean);
      else if (BOOL_PROPS.has(key)) def[key] = /^(true|yes|1)$/i.test(text);
      else def[key] = text;
    }
    return def;
  }

  /* ------------------------------------------------------------------ *
   * Content assembly
   * ------------------------------------------------------------------ */

  const COLLECTION = { preset: 'presets', resource: 'resources', skill: 'skills', npc: 'npcs', state: 'states', event: 'events', ending: 'endings', hook: 'hooks',
    vocab: 'vocab', place: 'places', track: 'tracks', spell: 'spells', fact: 'facts', archetype: 'archetypes', faction: 'factions', arc: 'arcs', clue: 'clues', lore: 'lore', timeline: 'timeline' };
  const WORLD_COLLECTIONS = ['presets', 'vocab', 'places', 'tracks', 'spells', 'facts', 'archetypes', 'factions', 'arcs', 'clues', 'lore', 'timeline'];

  // sources: [{path, text}] -> {content, errors}
  function compile(sources) {
    const content = { game: {}, resources: {}, skills: {}, npcs: {}, states: {}, events: {}, endings: {}, hooks: {}, order: { resources: [], skills: [], npcs: [] }, files: [] };
    for (const c of WORLD_COLLECTIONS) content[c] = {};
    const errors = [];
    for (const src of sources) {
      let defs;
      try { defs = parseFile(src.text, src.path); } catch (e) { errors.push(e); continue; }
      content.files.push(src.path);
      for (const d of defs) {
        if (d.block === 'game') { Object.assign(content.game, d); continue; }
        if (d.block === 'balance') { content.balance = d; continue; }
        const col = content[COLLECTION[d.block]];
        if (col[d.id]) { errors.push(new GrimError('duplicate @' + d.block + ' id "' + d.id + '" (first defined in ' + col[d.id].file + ':' + col[d.id].line + ')', d.file, d.line)); continue; }
        col[d.id] = d;
        if (content.order[COLLECTION[d.block]]) content.order[COLLECTION[d.block]].push(d.id);
      }
    }
    expandPresets(content, errors);
    for (const e of Object.values(content.events)) finalizeEvent(e, errors);
    if (content.game.calendar && content.game.calendar.length !== (content.game.months || []).length && content.game.months) errors.push(new GrimError('@game calendar must cover every month', 'content/core/rules.grim', 1));
    return { content, errors };
  }

  // Replace every `preset arg …` statement with the preset's body ($params substituted), recursively.
  function expandPresets(content, errors) {
    const expand = (effects, file, depth) => {
      if (!effects) return effects;
      const out = [];
      for (const st of effects) {
        if (st.t === 'preset') {
          const p = content.presets[st.name];
          if (!p) { errors.push(new GrimError('unknown statement or preset "' + st.name + (st.args.length ? ' ' + st.args.join(' ') : '') + '"', file, st.line)); continue; }
          const params = p.params || [];
          if (st.args.length !== params.length) { errors.push(new GrimError('preset ' + st.name + ' takes ' + (params.length ? params.join(', ') : 'no arguments') + ', got ' + (st.args.join(' ') || 'none'), file, st.line)); continue; }
          if (depth > 5) { errors.push(new GrimError('presets nested too deeply (' + st.name + ')', file, st.line)); continue; }
          const lines = (p.do || []).map((L) => ({ indent: L.indent, line: st.line, content: L.content.replace(/\$([a-z_][a-z0-9_]*)/g, (mm, k) => (params.includes(k) ? st.args[params.indexOf(k)] : mm)) }));
          try {
            const body = parseEffectLines(lines, file);
            G_walk(body, (x) => { x.preset = st.name; });
            out.push(...expand(body, file, depth + 1));
          } catch (e) { errors.push(new GrimError('preset ' + st.name + ': ' + (e.raw || e.message), file, st.line)); }
          continue;
        }
        if (st.t === 'if') { st.branches.forEach((b) => { b.body = expand(b.body, file, depth); }); st.else = expand(st.else, file, depth); }
        else if (st.t === 'challenge') { st.win = expand(st.win, file, depth); st.partial = expand(st.partial, file, depth); st.lose = expand(st.lose, file, depth); }
        else if (st.body) { st.body = expand(st.body, file, depth); st.else = expand(st.else, file, depth); }
        out.push(st);
      }
      return out;
    };
    for (const col of ['events', 'states', 'hooks', 'resources']) {
      for (const d of Object.values(content[col])) {
        for (const k of ['on_show', 'tick', 'on_add', 'on_expire', 'on_remove', 'do', 'on_zero']) if (Array.isArray(d[k])) d[k] = expand(d[k], d.file, 0);
        for (const o of d.options || []) o.effects = expand(o.effects, d.file, 0);
      }
    }
  }
  function G_walk(effects, visit) { walkEffects(effects, visit); }

  function finalizeEvent(e, errors) {
    if (!e.type) {
      if (e.options.length === 0) e.options.push({ key: 'ok', label: 'Continue', effects: [], when: null, hint: null, line: e.line });
      const keys = e.options.map((o) => o.key).sort().join(',');
      e.type = e.options.length === 1 ? 'story' : (keys === 'left,right' || keys === 'left,right,up') ? 'card' : 'menu';
    }
    if (!['card', 'story', 'menu'].includes(e.type)) errors.push(new GrimError('type must be card, story or menu', e.file, e.line));
    if (e.type === 'card') {
      const keys = e.options.map((o) => o.key).sort().join(',');
      if (keys !== 'left,right' && keys !== 'left,right,up') errors.push(new GrimError('card events need "> left:" and "> right:" options, and optionally "> up[spell]:" (got ' + keys + ')', e.file, e.line));
    }
    if (!e.trigger) e.trigger = e.actor === 'any' ? 'social' : 'random';
    // `letter` (M38): drawn only off campus, one each night, and for anyone who reaches you while one of you is away.
    if (!['random', 'auto', 'social', 'queued', 'letter'].includes(e.trigger)) errors.push(new GrimError('trigger must be random, auto, social, queued or letter', e.file, e.line));
    if (!e.title) errors.push(new GrimError('event needs a title', e.file, e.line));
    if (!e.text) errors.push(new GrimError('event needs text', e.file, e.line));
    if (e.cast && e.actor) errors.push(new GrimError('use either actor: or cast:, not both', e.file, e.line));
    if (e.offers && !['courses', 'clubs', 'jobs'].includes(e.offers)) errors.push(new GrimError('offers: must be courses, clubs or jobs', e.file, e.line));
    if (e.offers && e.type !== 'menu' && e.options.every((o) => o.key !== 'left')) e.type = 'menu';
    if (e.slot && !['morning', 'noon', 'afternoon', 'evening', 'night', 'midnight'].includes(e.slot)) errors.push(new GrimError('slot: morning, noon, afternoon, evening, night or midnight', e.file, e.line));
    if (e.scope && !['temporary', 'library'].includes(e.scope)) errors.push(new GrimError('scope: temporary or library', e.file, e.line));
    if (e.variant && e.variant !== 'hard') errors.push(new GrimError('variant: the only variant is "hard"', e.file, e.line));
    if (e.class && !CLASSES.includes(e.class)) errors.push(new GrimError('class must be one of ' + CLASSES.join(', '), e.file, e.line));
    if (e.type !== 'card' && e.options.some((o) => o.key === 'up')) errors.push(new GrimError('"> up[spell]:" is only for two-choice cards', e.file, e.line));
  }

  // The {tokens} of a text, looking inside inline variations ({~a|b}, {&a|b}, {a|b}, {cond: a|b}):
  // -> { tokens: ['npc', 'lyra.their', '=gold*2'], conds: ['gold > 10'] }
  function textTokens(text) {
    const tokens = [], conds = [];
    const scan = (t) => {
      let i = 0;
      while (i < t.length) {
        if (t[i] !== '{') { i++; continue; }
        let d = 0, j = i;
        for (; j < t.length; j++) { if (t[j] === '{') d++; else if (t[j] === '}' && --d === 0) break; }
        if (j >= t.length) return;
        const inner = t.slice(i + 1, j);
        const parts = []; let dd = 0, start = 0;
        for (let k = 0; k < inner.length; k++) { const ch = inner[k]; if (ch === '{') dd++; else if (ch === '}') dd--; else if (ch === '|' && !dd) { parts.push(inner.slice(start, k)); start = k + 1; } }
        parts.push(inner.slice(start));
        let colon = -1; dd = 0;
        if (inner[0] !== '=' && inner[0] !== '~' && inner[0] !== '&') for (let k = 0; k < parts[0].length; k++) { const ch = parts[0][k]; if (ch === '{') dd++; else if (ch === '}') dd--; else if (ch === ':' && !dd) { colon = k; break; } }
        if (colon > 0) { conds.push(parts[0].slice(0, colon).trim()); scan(parts[0].slice(colon + 1)); parts.slice(1).forEach(scan); }
        else if (parts.length > 1) { if (inner[0] === '~' || inner[0] === '&') parts[0] = parts[0].slice(1); parts.forEach(scan); }
        else tokens.push(inner.trim());
        i = j + 1;
      }
    };
    scan(String(text || ''));
    return { tokens, conds };
  }

  // `@place always: a b|c` (feedback 2026-10-16): the place's fixed cards in order; `|` makes a group that plays one.
  const alwaysGroups = (t) => String(t || '').split(/\s+/).filter(Boolean).map((g) => g.split('|').filter(Boolean));
  return { alwaysGroups, textTokens, parseFile, compile, expr, parseExprAst, walkAst, walkEffects, GrimError, SCHEMA, FUNCS, FUNC_REFS, SYMBOLIC, IDENTS, STATEMENTS: Object.keys(RE), COLLECTION, WORLD_COLLECTIONS, STRUCT_PROPS, TIERS, DIFFICULTIES, CLASSES, CHALLENGE_KINDS, RANKS, RUNG_RE, ODDS_WORDS, SWINGS, DRIFTS, isLadderTier };
});
