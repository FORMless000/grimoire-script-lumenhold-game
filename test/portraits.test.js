'use strict';
// NPC portraits in game: the live PNG layer, procedural fallback and manifest.
const test = require('node:test');
const assert = require('node:assert/strict');
const Art = require('../src/art.js');
const { check } = require('../tools/portraits.js');
const { project } = require('../tools/project.js');

const npcs = Object.values(project(require('node:path').join(__dirname, '..')).compileAll().content.npcs);

test('live PNGs and crop sources match the manifest and Art.PORTRAITS', () => {
  assert.deepEqual(check(), []);
});

test('every NPC has a minimal portrait, keyed by id', () => {
  for (const n of npcs) assert.equal(Art.PORTRAITS[n.id], n.id + '.png', n.id);
});

test('minimal mode layers a circularly clipped PNG over the procedural portrait', () => {
  const svg = Art.avatar(npcs.find((n) => n.id === 'lyra'), 44, { style: 'minimal' });
  assert.match(svg, /^<svg class="avatar" viewBox="0 0 64 64" width="44" height="44" aria-hidden="true" data-npc="lyra">/);
  assert.match(svg, /<g class="av-orig">/);
  assert.match(svg, /<image class="av-img" href="src\/portraits\/minimal\/lyra\.png" x="0" y="0" width="64" height="64"[^>]* clip-path="url\(#(avc[\w-]+)\)"/);
  const [, cid] = svg.match(/clip-path="url\(#([^)]+)\)"/);
  assert.match(svg, new RegExp('<clipPath id="' + cid + '"><circle cx="32" cy="32" r="32"/></clipPath>'));
});

test('repeated avatars of one NPC get distinct clip-path ids', () => {
  const ids = new Set();
  for (let i = 0; i < 5; i++) ids.add(Art.avatar({ id: 'grisk' }, 18, { style: 'minimal' }).match(/<clipPath id="([^"]+)"/)[1]);
  assert.equal(ids.size, 5);
});

test('original mode and unknown ids draw only the procedural portrait; goblins keep their body', () => {
  for (const n of npcs) assert.doesNotMatch(Art.avatar(n, 40, { style: 'original' }), /<image/);
  assert.doesNotMatch(Art.avatar({ id: 'nobody' }, 40, { style: 'minimal' }), /<image/);
  assert.match(Art.avatar(npcs.find((n) => n.id === 'grisk'), 40, { style: 'original' }), /#f2d65a/);   // the goblin's yellow eyes
});

test('the style setter defaults to minimal and the default call follows it', () => {
  try {
    assert.equal(Art.setPortraitStyle('original'), 'original');
    assert.doesNotMatch(Art.avatar({ id: 'lyra' }, 26), /<image/);
    assert.equal(Art.setPortraitStyle('bogus'), 'minimal');
    assert.equal(Art.setPortraitStyle(undefined), 'minimal');
    assert.match(Art.avatar({ id: 'lyra' }, 26), /<image/);
  } finally { Art.setPortraitStyle('minimal'); }
});
