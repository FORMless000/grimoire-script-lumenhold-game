// Build-time SVG input. The standalone browser receives an inline markup map,
// preserving currentColor and the deliberate fills/dashes in the supplied art.
import fs from 'node:fs';
import {SPELLS} from '../setup/roster.mjs';
function readIcon(folder,asset){
 const source=fs.readFileSync(`${process.env.LUMENHOLD_DOCS??new URL('../../docs',import.meta.url).pathname}/${folder}/${asset}.svg`,'utf8');
 const match=source.trim().match(/^<svg\b[^>]*>([\s\S]*)<\/svg>$/);
 if(!match||!source.includes('viewBox="0 0 64 64"'))throw Error('Invalid icon: '+asset);
 return `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${match[1]}</svg>`;
}
export function readSpellIcons(){
 // Every spell has its own icon, creature moves included (F5.11, docs/spells-v2-icons.md); the stag beetle's Flame
 // (F5.11-plan.1) wears Flame's.
 const file=id=>id==='purify'?'distil':id==='beetle_flame'?'flame':id;
 return Object.fromEntries(Object.keys(SPELLS).map(id=>[id,readIcon('spell-icons',file(id))]));
}
export function readActionIcons(){
 const ids=['strike','guard','reclaim','break_free','cast','concede',...Object.keys(SPELLS).filter(id=>SPELLS[id].channel).flatMap(id=>[id+'_hold',id+'_release'])];
 return Object.fromEntries(ids.map(id=>[id,readIcon('action-icons',id)]));
}
