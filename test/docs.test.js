// The writing guide's example cards stay current (step 5): every example event in docs/authoring/ and the
// language reference uses the current format (no legacy `check`, `love`, `actor: any`, raw amounts or missing
// `class:`), and the annotated exemplars in docs/authoring/examples/ match the live cards they were taken from.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const G = require('../src/grimoire.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');

const TIERED = new Set(['health', 'mood', 'mana', 'renown', 'alignment', 'gold', 'arcana', 'lore', 'alchemy', 'charm', 'vigor', 'guile']);

// Every example event: the exemplar files, and fenced blocks that start with `@event` in the authoring docs.
function exampleSources() {
  const out = [];
  const dir = path.join(ROOT, 'docs', 'authoring', 'examples');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.grim'))) out.push({ path: 'docs/authoring/examples/' + f, text: fs.readFileSync(path.join(dir, f), 'utf8') });
  for (const rel of ['docs/authoring/schema.md', 'docs/authoring/pools.md', 'docs/grimoire-script.md']) {
    const md = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    let k = 0;
    // Fragments that elide part of a card (a `...` line) and `.lang` translation snippets are skipped.
    for (const m of md.matchAll(/```(?:grim)?\n(@event [\s\S]*?)```/g)) { k++; if (!/^\s*(\.\.\.|…)\s*$/m.test(m[1]) && !/^\S+ (\[[0-9a-f]+\] )?= /m.test(m[1])) out.push({ path: rel + '#' + k, text: m[1] }); }
  }
  return out;
}

function legacyIn(e) {
  const found = [];
  if (!e.class) found.push('no class:');
  if (e.actor === 'any') found.push('actor: any');
  for (const o of e.options || []) {
    G.walkEffects(o.effects, (st) => {
      if (st.t === 'check') found.push(o.key + ': check');
      if (st.legacy) found.push(o.key + ': love');
      if (['rel', 'spark'].includes(st.t) && !st.tier) found.push(o.key + ': raw ' + st.t);
      if (st.t === 'delta' && TIERED.has(st.name) && !st.tier && !st.preset) found.push(o.key + ': raw ' + st.name);
      if (st.t === 'delta' && st.name === 'grades') found.push(o.key + ': grades');
    });
  }
  return found;
}

test('docs: example events use the current format, not legacy forms', () => {
  const srcs = exampleSources();
  assert.ok(srcs.length >= 5, 'found the examples (' + srcs.length + ')');
  let events = 0;
  for (const s of srcs) {
    const blocks = G.parseFile(s.text, s.path).filter((b) => b.block === 'event');
    for (const e of blocks) { events++; assert.deepEqual(legacyIn(e), [], s.path + ' @event ' + e.id); }
  }
  assert.ok(events >= 6, 'checked ' + events + ' example events');
});

test('docs: annotated exemplars match the live cards they were taken from', () => {
  const { sources } = project(ROOT).compileAll();
  const body = (text, id) => {
    const L = text.split('\n'); const i = L.indexOf('@event ' + id); if (i < 0) return null;
    let j = i + 1; while (j < L.length && !L[j].startsWith('@')) j++;
    return L.slice(i, j).filter((l) => l.trim() && !l.startsWith('#')).join('\n');
  };
  const dir = path.join(ROOT, 'docs', 'authoring', 'examples');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.grim'))) {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const b of G.parseFile(text, f).filter((x) => x.block === 'event')) {
      const live = sources.map((s) => body(s.text, b.id)).find(Boolean);
      assert.ok(live, f + ': ' + b.id + ' still exists in content');
      assert.equal(body(text, b.id), live, f + ': ' + b.id + ' matches content (copy the live card when it changes)');
    }
  }
});
