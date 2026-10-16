// Linked variation (docs/grimoire-script.md § Inline variation): a card uses one variation mode. Cards that mix a
// sequence (their "first time / again / by now" framing) with random groups were written as sequences, so their
// random groups become sequence groups: showing k reads variant k of every field. Translations follow, and a
// translation that was current stays current. Counts are equalized by hand afterwards (`grim lint`, variants).
'use strict';
const fs = require('fs');
const path = require('path');
const I18n = require('../../src/i18n.js');

// The groups of a text: their modes, as the engine reads them (a colon in the first part makes a conditional).
function modes(t) {
  const out = new Set();
  (function scan(s) {
    let i = 0;
    while (i < s.length) {
      if (s[i] !== '{') { i++; continue; }
      let d = 0, j = i;
      for (; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}' && --d === 0) break; }
      if (j >= s.length) return;
      const inner = s.slice(i + 1, j), parts = []; let dd = 0, st = 0;
      for (let k = 0; k < inner.length; k++) { const c = inner[k]; if (c === '{') dd++; else if (c === '}') dd--; else if (c === '|' && !dd) { parts.push(inner.slice(st, k)); st = k + 1; } }
      parts.push(inner.slice(st));
      if (inner[0] === '~') { if (parts.length > 1) out.add('random'); } else if (inner[0] === '&') { if (parts.length > 1) out.add('cycle'); } else if (inner[0] !== '=') {
        let colon = -1; dd = 0;
        for (let k = 0; k < parts[0].length; k++) { const c = parts[0][k]; if (c === '{') dd++; else if (c === '}') dd--; else if (c === ':' && !dd) { colon = k; break; } }
        if (colon < 0 && parts.length > 1) out.add('sequence');
      }
      if (inner[0] !== '=') parts.forEach(scan);
      i = j + 1;
    }
  })(t || '');
  return out;
}
// {~ → { (refuses a group whose first part has a colon: it would read as a condition).
function seqify(t) {
  let out = '', i = 0;
  while (i < t.length) {
    if (t[i] === '{' && t[i + 1] === '~') {
      let dd = 0;
      for (let k = i + 2; k < t.length; k++) { const c = t[k]; if (c === '{') dd++; else if (c === '}') { if (!dd) break; dd--; } else if (c === '|' && !dd) break; else if (c === ':' && !dd) throw new Error('colon in the first variant: ' + t.slice(i, i + 80)); }
      out += '{'; i += 2; continue;
    }
    out += t[i++];
  }
  return out;
}

module.exports = {
  id: '0032-variation-sequence',
  description: 'cards mixing sequence and random variation become full sequence',
  seqify, modes,
  run(ctx) {
    const strings = I18n.extract(ctx.content), by = {};
    for (const x of strings) (by[x.block] = by[x.block] || []).push(x);
    const picked = new Set();
    for (const [block, list] of Object.entries(by)) {
      const m = new Set(); list.forEach((x) => modes(x.text).forEach((k) => m.add(k)));
      if (m.size === 2 && m.has('sequence') && m.has('random') && block.startsWith('event:')) picked.add(block.slice(6));
    }
    // English: every line of a picked card.
    let lines = 0;
    for (const id of picked) {
      const e = ctx.content.events[id], L = ctx.lines(e.file);
      for (let k = e.line; k < L.length && !/^@/.test(L[k]); k++) if (L[k].includes('{~')) { ctx.edit({ file: e.file, line: k + 1 }, seqify(L[k])); lines++; }
    }
    // Translations: the same change; a line translated from the current English is re-stamped.
    const eng = {}; for (const x of strings) eng[x.block + ' ' + x.key] = x.text;
    let tr = 0;
    const root = ctx.project.root, locales = path.join(root, 'locales');
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? walk(path.join(d, f.name)) : f.name.endsWith('.lang') ? [path.join(d, f.name)] : []));
    for (const abs of fs.existsSync(locales) ? walk(locales) : []) {
      const file = path.relative(root, abs), L = ctx.lines(file);
      let cur = null;
      L.forEach((l, k) => {
        const h = /^@(\w+) (\S+)/.exec(l);
        if (h) { cur = h[1] === 'event' && picked.has(h[2]) ? 'event:' + h[2] : null; return; }
        if (!cur || !l.includes('{~')) return;
        if (l.startsWith('# en: ')) { ctx.edit({ file, line: k + 1 }, l.split('{~').join('{')); return; }
        const m = /^(\S+) \[(\w+)\] = (.*)$/.exec(l);
        if (!m) return;
        const en = eng[cur + ' ' + m[1]];
        const hash = en != null && m[2] === I18n.hash(en) ? I18n.hash(seqify(en)) : m[2];
        ctx.edit({ file, line: k + 1 }, m[1] + ' [' + hash + '] = ' + seqify(m[3]));
        tr++;
      });
    }
    ctx.report(picked.size + ' cards, ' + lines + ' English lines, ' + tr + ' translated lines');
  },
};
