// Phase 3: `actor: any` (legacy in schema v1) becomes a one-role cast named `npc`, so `{npc}`, `rel npc …`
// and the translations stay as they are. `per: npc` keeps the old bookkeeping (once / repeat per character,
// a short rest for the event as a whole). Conditions about `npc` move from `when:` into the role's `where`;
// the rest of `when:` stays. Events that relied on the default trigger of `actor: any` get `trigger: social`.
'use strict';

// Split an expression on top-level `and` (outside parentheses and strings).
function conjuncts(src) {
  const out = []; let depth = 0, quote = null, start = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (depth === 0 && /\s/.test(c) && src.slice(i).match(/^\s+and\s+/)) {
      const m = src.slice(i).match(/^\s+and\s+/)[0];
      out.push(src.slice(start, i).trim()); i += m.length - 1; start = i + 1;
    }
  }
  out.push(src.slice(start).trim());
  return out.filter(Boolean);
}
const topLevelOr = (src) => conjuncts(src.replace(/\bor\b/g, 'and')).length !== conjuncts(src).length;

module.exports = {
  id: '0002-actor-any-to-cast',
  description: 'actor: any → cast: npc: any where … + per: npc',
  conjuncts,
  run(ctx) {
    for (const row of ctx.query('event', 'actor == "any"')) {
      const lines = ctx.lines(row.file);
      const block = [];
      for (let i = row.line; i < lines.length && (i === row.line || !lines[i].startsWith('@')); i++) block.push({ n: i + 1, text: lines[i] });
      const props = block.filter((l) => /^[a-z_]+:/.test(l.text));
      const actor = props.find((l) => /^actor:\s*any\s*$/.test(l.text));
      const when = props.find((l) => /^when:/.test(l.text));
      const trigger = props.find((l) => /^trigger:/.test(l.text));
      let where = [], keep = [];
      if (when) {
        const src = when.text.replace(/^when:\s*/, '');
        if (topLevelOr(src) && /\bnpc\b/.test(src)) where = [src];
        else for (const c of conjuncts(src)) (/\bnpc\b/.test(c) ? where : keep).push(c);
      }
      const wrap = (c) => (topLevelOr(c) ? '(' + c + ')' : c);
      const role = '  npc: any' + (where.length ? ' where ' + where.map(wrap).join(' and ') : '');
      ctx.edit({ file: row.file, line: actor.n }, ['cast:', role, 'per: npc'].concat(trigger ? [] : ['trigger: social']).join('\n'));
      if (when && where.length) {
        if (keep.length) ctx.edit({ file: row.file, line: when.n }, 'when: ' + keep.map(wrap).join(' and '));
        else ctx.remove({ file: row.file, line: when.n });
      }
      ctx.report(row.id + (where.length ? ': where ' + where.join(' and ') : ''));
    }
  },
};
