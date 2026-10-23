import canon from './combat-canon.mjs';
import {playerPreset,SPELLS} from '../reference-engine.mjs';
// Explicit generous testplay grants, not a claim about campaign unlock timing.
// Keep harmful/irrelevant spells available too. Late game includes forbidden magic.
export const UNLOCKS={
  1:['flame','foresight','mend','glamour','haste','shadowstep','ward'],
  20:['index','rapport','quickquill','sleight','candour'],
  35:['rime','brace','tailwind','bramble','hoarfrost','reflect','purify'],
  50:['starlight','animate','contraption','heartwood','omen'],
  65:['moonwell','lodestar','seal'],
  80:['wildfire','torment','extraction','siphon','compel','eclipse','heartprice']
};
export function combatCapacity(skills){const c=canon.capacity,weights=Object.entries(c.weights),mean=weights.reduce((n,[key,w])=>n+skills[key]*w,0)/weights.reduce((n,[,w])=>n+w,0);return Math.max(c.min??0,Math.round(c.base+c.slope*(mean-50)));}
export function combatSpellCost(id,rank=1){const spell=canon.spells[id];if(!spell||!Number.isInteger(rank)||rank<1||rank>spell.levels)throw Error('Invalid canonical spell/rank: '+id+'/'+rank);return spell.cost[rank-1];}
export function researchPreset(level=20,loadout='Balanced',all=false){
 const p=playerPreset(level,loadout,all),rank=level>=canon.ranks[1]?3:level>=canon.ranks[0]?2:1;
 const learned=new Set(Object.keys(p.spells));
 for(const [threshold,ids]of Object.entries(UNLOCKS))if(all||level>=Number(threshold))for(const id of ids)learned.add(id);
 p.spells=Object.fromEntries([...learned].filter(id=>SPELLS[id].castable!==false).map(id=>[id,Math.min(rank,canon.spells[id].levels)]));p.capacity=combatCapacity(p.skills);return p;
}
export {canon};
