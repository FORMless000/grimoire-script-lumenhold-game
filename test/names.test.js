// The title screen's random name (2026-10-17): pools by pronouns plus world pools, none of them a name the game already
// uses, and the randomizer keeps to the chosen pronouns. The chosen pronouns are kept on the run.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const I18n = require('../src/i18n.js');
const Engine = require('../src/engine.js');
const { project } = require('../tools/project.js');
const { ROOT } = require('./helpers.js');

const P = project(ROOT);
const { content } = P.compileAll();
const POOLS = ['she', 'he', 'they', 'world_she', 'world_he', 'world_they'];
const split = (s) => s.split(/\s*[,，、]\s*/).filter(Boolean);
const pools = () => Object.fromEntries(POOLS.map((k) => [k, split(I18n.t('title.names.' + k))]));
// A seeded stand-in for Math.random, so the draws are the same every run.
const rng = (seed) => () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };

// Every capitalised word the content uses (names of characters, places, lore), and each character's names.
function contentWords() {
  const words = new Set();
  const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.grim')) for (const m of fs.readFileSync(p, 'utf8').matchAll(/\b[A-Z][a-zà-ÿ]+\b/g)) words.add(m[0]); } };
  walk(path.join(ROOT, 'content'));
  return words;
}

test('names: the English pools are full, distinct, and use no name the game already has', () => {
  I18n.use(null);
  const p = pools(), all = Object.values(p).flat(), words = contentWords();
  for (const k of POOLS) assert.ok(p[k].length >= (k.startsWith('world') ? 20 : 40), k + ' has ' + p[k].length);
  assert.deepEqual(all.filter((n, i) => all.indexOf(n) !== i), [], 'no name in two pools');
  assert.deepEqual(all.filter((n) => words.has(n)), [], 'no name the content uses');
  const npcNames = Object.values(content.npcs).flatMap((n) => [n.short, ...String(n.name).split(/[\s·]+/)]).filter(Boolean);
  assert.deepEqual(all.filter((n) => npcNames.includes(n)), [], 'no character\'s name');
});

test('names: the randomizer keeps to the chosen pronouns, mixes in the world pools, and never repeats the last', () => {
  I18n.use(null);
  const p = pools(), r = rng(7);
  const allowed = { she: ['she', 'they', 'world_she', 'world_they'], he: ['he', 'they', 'world_he', 'world_they'], they: ['they', 'world_they'] };
  for (const pron of ['she', 'he', 'they']) {
    const ok = new Set(allowed[pron].flatMap((k) => p[k])), seen = {};
    let last = null;
    for (let i = 0; i < 2000; i++) {
      const n = I18n.randomName(pron, r, last);
      assert.ok(ok.has(n), pron + ' drew ' + n);
      assert.notEqual(n, last);
      const pool = POOLS.find((k) => p[k].includes(n)); seen[pool] = (seen[pool] || 0) + 1;
      last = n;
    }
    const world = Object.entries(seen).filter(([k]) => k.startsWith('world')).reduce((a, [, v]) => a + v, 0) / 2000;
    assert.ok(world > 0.12 && world < 0.28, pron + ': world names ' + world);
    if (pron !== 'they') assert.ok((seen[pron] || 0) > (seen.they || 0), pron + ': mostly its own pool');
  }
  assert.ok(p.they.includes(I18n.randomName('xe', r)), 'unknown pronouns read as they/them');
});

test('names: the zh-CN pools match the English ones, name for name, and avoid the cast\'s Chinese names', () => {
  const loc = I18n.loadLocale('zh-CN', P.loadLocaleSources('zh-CN').filter((x) => !x.path.endsWith('/_obsolete.lang')));
  I18n.use(null);
  const en = pools();
  I18n.use(loc);
  try {
    const zh = pools(), all = Object.values(zh).flat();
    for (const k of POOLS) assert.equal(zh[k].length, en[k].length, k);
    assert.deepEqual(all.filter((n, i) => all.indexOf(n) !== i), [], 'no zh name in two pools');
    const cast = Object.entries(loc.blocks).filter(([k, b]) => k.startsWith('npc:') && b.name).flatMap(([, b]) => [b.name.text, ...b.name.text.split('·')]);
    assert.ok(cast.includes('莱拉'), 'the cast\'s Chinese names were read');
    assert.deepEqual(all.filter((n) => cast.includes(n)), [], 'no zh character name');
    const he = new Set([...zh.he, ...zh.they, ...zh.world_he, ...zh.world_they]), r = rng(5);
    for (let i = 0; i < 300; i++) assert.ok(he.has(I18n.randomName('he', r)), 'zh he/him names');
  } finally { I18n.use(null); }
});

test('names: the chosen pronouns are kept on the run', () => {
  const eng = new Engine(content);
  const w = console.warn; console.warn = () => {};
  try { eng.newGame({ seed: 1, name: 'Sabine', pronouns: 'she' }); } finally { console.warn = w; }
  assert.equal(eng.s.pronouns, 'she');
  assert.equal(new Engine(content).load(eng.save()).s.pronouns, 'she');
  const e2 = new Engine(content); console.warn = () => {};
  try { e2.newGame({ seed: 1 }); } finally { console.warn = w; }
  assert.equal(e2.s.pronouns, 'they');
});
