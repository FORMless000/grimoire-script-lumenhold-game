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
  const SYMBOLIC = new Set(['has', 'flag', 'left', 'rel', 'love', 'bond', 'met', 'seen', 'since', 'chosen', 'bonds', 'npc_is', 'romanceable', 'tagged']);
  const FUNCS = new Set([...SYMBOLIC, 'rand', 'min', 'max', 'abs', 'floor', 'round', 'clamp', 'known', 'chance_of']);
  // Reference kinds for linting: which argument of which function refers to what.
  const FUNC_REFS = {
    has: ['flagOrState'], flag: ['flag'], left: ['state'], rel: ['npc'], love: ['npc'], bond: ['npc'],
    met: ['npc'], seen: ['event'], since: ['event'], chosen: ['event', null], npc_is: ['npc'], bonds: [null], romanceable: ['npc'], tagged: ['npc', null]
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
    game: { noId: true, props: ['title', 'subtitle', 'years', 'months', 'cards_per_month', 'max_cards_per_month', 'social_per_month', 'min_random_per_month', 'intro', 'summer_months'], effects: [] },
    resource: { props: ['name', 'icon', 'min', 'max', 'start', 'color', 'desc'], effects: ['on_zero'] },
    skill: { props: ['name', 'icon', 'start', 'max', 'desc', 'color'], effects: [] },
    npc: { props: ['name', 'short', 'title', 'pronouns', 'house', 'desc', 'color', 'romance', 'tags', 'look', 'start_rel'], effects: [] },
    state: { props: ['name', 'desc', 'art', 'tags', 'group', 'duration', 'hidden', 'kind'], effects: ['tick', 'on_add', 'on_expire', 'on_remove'] },
    event: { props: ['title', 'text', 'art', 'scene', 'tags', 'when', 'weight', 'trigger', 'actor', 'repeat', 'priority', 'type', 'chain'], effects: ['on_show'], options: true },
    ending: { props: ['title', 'text', 'art', 'scene', 'when', 'priority', 'tags', 'kind'], effects: [] },
    hook: { props: ['on', 'when', 'desc', 'label'], effects: ['do'] },
  };
  const EXPR_PROPS = new Set(['when', 'weight']);
  const NUM_PROPS = new Set(['years', 'cards_per_month', 'max_cards_per_month', 'social_per_month', 'min_random_per_month', 'min', 'max', 'start', 'duration', 'repeat', 'priority', 'start_rel']);
  const LIST_PROPS = new Set(['tags', 'months', 'summer_months']);
  const BOOL_PROPS = new Set(['romance', 'hidden']);
  const OPTION_PROPS = new Set(['when', 'hint']);

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
    flag: new RegExp('^flag\\s+(' + ID + '(?:\\s+' + ID + ')*)$'),
    unflag: new RegExp('^unflag\\s+(' + ID + '(?:\\s+' + ID + ')*)$'),
    gain: new RegExp('^gain\\s+(' + ID + ')(?:\\s+(.+))?$'),
    lose: new RegExp('^lose\\s+(' + ID + ')$'),
    queue: new RegExp('^queue\\s+(' + ID + ')(?:\\s+(now|in\\s+.+?))?(?:\\s+with\\s+(' + ID + '))?$'),
    social: new RegExp('^(rel|love)\\s+(' + ID + ')\\s*([+-])\\s*(\\d+)(?:\\s*~\\s*(\\d+))?$'),
    bond: new RegExp('^bond\\s+(' + ID + ')\\s+(' + ID + ')$'),
    meet: new RegExp('^meet\\s+(' + ID + ')$'),
    end: new RegExp('^end\\s+(' + ID + ')$'),
    delta: new RegExp('^(' + ID + ')\\s*([+-])\\s*(\\d+)(?:\\s*~\\s*(\\d+))?$'),
    assign: new RegExp('^(?:set\\s+)?(' + ID + ')\\s*(\\+=|-=|=(?!=))\\s*(.+)$'),
  };

  function parseStatement(content, file, line) {
    let m;
    const E = (s) => expr(s, file, line);
    if ((m = content.match(RE.say))) return { t: 'say', text: m[1].trim(), line };
    if ((m = content.match(RE.if))) return { t: 'if', branches: [{ cond: E(m[1]), body: [] }], else: null, line, block: true };
    if ((m = content.match(RE.elif))) return { t: 'elif', cond: E(m[1]), line, block: true };
    if ((m = content.match(RE.else))) return { t: 'else', line, block: true };
    if ((m = content.match(RE.chance))) return { t: 'chance', p: E(m[1]), body: [], else: null, line, block: true };
    if ((m = content.match(RE.check))) return { t: 'check', skill: m[1], dc: E(m[2]), body: [], else: null, line, block: true };
    if (content.endsWith(':')) throw new GrimError('unknown block statement "' + content + '" (expected if/elif/else/chance/check)', file, line);
    if ((m = content.match(RE.flag))) return { t: 'flag', names: m[1].split(/\s+/), line };
    if ((m = content.match(RE.unflag))) return { t: 'unflag', names: m[1].split(/\s+/), line };
    if ((m = content.match(RE.gain))) return { t: 'gain', state: m[1], dur: m[2] ? E(m[2]) : null, line };
    if ((m = content.match(RE.lose))) return { t: 'lose', state: m[1], line };
    if ((m = content.match(RE.queue))) {
      const st = { t: 'queue', event: m[1], now: false, delay: null, with: m[3] || null, line };
      if (m[2] === 'now') st.now = true;
      else if (m[2]) st.delay = E(m[2].replace(/^in\s+/, ''));
      return st;
    }
    if ((m = content.match(RE.social))) {
      const a = +m[4], b = m[5] != null ? +m[5] : a, s = m[3] === '-' ? -1 : 1;
      return { t: m[1], npc: m[2], min: Math.min(a, b) * s, max: Math.max(a, b) * s, line };
    }
    if ((m = content.match(RE.bond))) return { t: 'bond', npc: m[1], status: m[2], line };
    if ((m = content.match(RE.meet))) return { t: 'meet', npc: m[1], line };
    if ((m = content.match(RE.end))) return { t: 'end', ending: m[1], line };
    if ((m = content.match(RE.delta))) {
      const a = +m[3], b = m[4] != null ? +m[4] : a, s = m[2] === '-' ? -1 : 1;
      return { t: 'delta', name: m[1], min: Math.min(a, b) * s, max: Math.max(a, b) * s, line };
    }
    if ((m = content.match(RE.assign))) return { t: 'assign', name: m[1], op: m[2], expr: E(m[3]), line };
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
        let body = [];
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
        const m = L.content.match(/^@([a-z]+)(?:\s+([a-z_][a-z0-9_]*))?\s*$/);
        if (!m) throw new GrimError('bad block header "' + L.content + '" (expected "@kind id", ids are lower_snake_case)', file, L.line);
        const kind = m[1];
        if (!SCHEMA[kind]) throw new GrimError('unknown block kind "@' + kind + '"', file, L.line);
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
        const m = L.content.match(/^>\s*([a-z_][a-z0-9_]*)\s*:\s*(.*)$/);
        if (!m) throw new GrimError('bad option header "' + L.content + '" (expected "> key: Label")', file, L.line);
        const opt = { key: m[1], label: m[2].trim(), when: null, hint: null, effects: [], line: L.line };
        if (def.options.some((o) => o.key === opt.key)) throw new GrimError('duplicate option key "' + opt.key + '"', file, L.line);
        const sub = takeIndented().filter((x) => !x.blank);
        const eff = [];
        const base = sub.length ? sub[0].indent : 0;
        for (const S of sub) {
          const pm = S.indent === base && S.content.match(/^([a-z_]+)\s*:\s*(.*)$/);
          if (pm && OPTION_PROPS.has(pm[1])) {
            if (pm[1] === 'when') opt.when = expr(pm[2], file, S.line);
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
      if (EXPR_PROPS.has(key)) def[key] = expr(text, file, L.line);
      else if (NUM_PROPS.has(key)) {
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

  const COLLECTION = { resource: 'resources', skill: 'skills', npc: 'npcs', state: 'states', event: 'events', ending: 'endings', hook: 'hooks' };

  // sources: [{path, text}] -> {content, errors}
  function compile(sources) {
    const content = { game: {}, resources: {}, skills: {}, npcs: {}, states: {}, events: {}, endings: {}, hooks: {}, order: { resources: [], skills: [], npcs: [] }, files: [] };
    const errors = [];
    for (const src of sources) {
      let defs;
      try { defs = parseFile(src.text, src.path); } catch (e) { errors.push(e); continue; }
      content.files.push(src.path);
      for (const d of defs) {
        if (d.block === 'game') { Object.assign(content.game, d); continue; }
        const col = content[COLLECTION[d.block]];
        if (col[d.id]) { errors.push(new GrimError('duplicate @' + d.block + ' id "' + d.id + '" (first defined in ' + col[d.id].file + ':' + col[d.id].line + ')', d.file, d.line)); continue; }
        col[d.id] = d;
        if (content.order[COLLECTION[d.block]]) content.order[COLLECTION[d.block]].push(d.id);
        if (d.block === 'event') finalizeEvent(d, errors);
      }
    }
    return { content, errors };
  }

  function finalizeEvent(e, errors) {
    if (!e.type) {
      if (e.options.length === 0) e.options.push({ key: 'ok', label: 'Continue', effects: [], when: null, hint: null, line: e.line });
      e.type = e.options.length === 1 ? 'story' : (e.options.length === 2 && e.options.some((o) => o.key === 'left') ? 'card' : 'menu');
    }
    if (!['card', 'story', 'menu'].includes(e.type)) errors.push(new GrimError('type must be card, story or menu', e.file, e.line));
    if (e.type === 'card') {
      const keys = e.options.map((o) => o.key).sort().join(',');
      if (keys !== 'left,right') errors.push(new GrimError('card events need exactly "> left:" and "> right:" options (got ' + keys + ')', e.file, e.line));
    }
    if (!e.trigger) e.trigger = e.actor === 'any' ? 'social' : 'random';
    if (!['random', 'auto', 'social', 'queued'].includes(e.trigger)) errors.push(new GrimError('trigger must be random, auto, social or queued', e.file, e.line));
    if (!e.title) errors.push(new GrimError('event needs a title', e.file, e.line));
    if (!e.text) errors.push(new GrimError('event needs text', e.file, e.line));
  }

  return { parseFile, compile, expr, parseExprAst, walkAst, walkEffects, GrimError, SCHEMA, FUNCS, FUNC_REFS, SYMBOLIC };
});
