import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readSpellIcons,readActionIcons} from './icon-source.mjs';
import {SPELLS} from '../setup/roster.mjs';
test('all 35 player spells receive their supplied SVG artwork, retaining fills, opacity and dashes',()=>{
 const icons=readSpellIcons();assert.deepEqual(Object.keys(icons),Object.keys(SPELLS).filter(id=>SPELLS[id].group!=='creature'));
 for(const [id,svg]of Object.entries(icons)){
  assert.match(svg,/viewBox="0 0 64 64"/);assert.match(svg,/stroke="currentColor"/);assert(!svg.includes('#2b2f4a'));
  const source=fs.readFileSync(new URL(`../../../docs/spell-icons/${id==='purify'?'distil':id}.svg`,import.meta.url),'utf8');
  assert.equal(svg.slice(svg.indexOf('>')+1,-6),source.slice(source.indexOf('>')+1,source.lastIndexOf('</svg>')),id);
 }
 assert.match(icons.eclipse,/fill="currentColor"/);assert.match(icons.heartprice,/fill="currentColor"/);
 assert.match(icons.shadowstep,/stroke-dasharray/);assert.match(icons.brace,/opacity=/);assert(icons.purify);assert(!icons.distil);
});
test('combat basics, controls and all five channel pairs retain their supplied action artwork',()=>{
 const icons=readActionIcons();assert.equal(Object.keys(icons).length,15);
 for(const [id,svg]of Object.entries(icons)){
  const source=fs.readFileSync(new URL(`../../../docs/action-icons/${id}.svg`,import.meta.url),'utf8');
  assert.match(svg,/stroke="currentColor"/);assert(!svg.includes('#2b2f4a'));
  assert.equal(svg.slice(svg.indexOf('>')+1,-6),source.slice(source.indexOf('>')+1,source.lastIndexOf('</svg>')),id);
 }
 for(const id of Object.keys(SPELLS).filter(id=>SPELLS[id].channel)){
  assert.match(icons[id+'_hold'],/stroke-dasharray="5 6"/);assert.match(icons[id+'_release'],/M32 2v8/);
  assert.match(icons[id+'_hold'],/scale\(0\.55\)/);assert.notEqual(icons[id+'_hold'],icons[id+'_release']);
 }
});
