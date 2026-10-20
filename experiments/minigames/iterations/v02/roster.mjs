// Standalone implementation of prototype-0.1. All tunable defaults live here.
export const RESOURCES = ['health', 'mood', 'renown', 'mana', 'crowns'];
export const ARCHETYPES = {
  Evoker: { offsets: [8,0,0,-4], signature:['flame','tide'], support:['ward','haste'], cycle:['attack','attack','prepare'], attacks:['flame','strike','tide','feint'], prepares:['ward','haste','observe'], audience:['objection','hurry','listen'], preference:'reason' },
  Seer: { offsets:[2,-3,8,-4], signature:['foresight','starlight'], support:['glamour','shadowstep'], cycle:['prepare','attack','attack'], attacks:['starlight','feint','strike'], prepares:['foresight','glamour','shadowstep:far'], audience:['scrutinize','anticipate','objection'], preference:'reason' },
  Restorer: { offsets:[-3,3,0,8], signature:['restoration','shape'], support:['ward','attune'], cycle:['prepare','attack','attack'], attacks:['strike','feint'], prepares:['restoration','shape','attune','ward'], audience:['objection','listen','listen'], preference:'reason' },
  Illusionist: { offsets:[-4,-6,-2,-4], signature:['glamour','hush'], support:['foresight','shadowstep'], cycle:['prepare','attack','attack'], attacks:['feint','strike'], prepares:['glamour','hush','foresight','shadowstep:far'], audience:['authority','scrutinize','objection'], preference:'appeal' },
  Envoy: { offsets:[0,8,3,0], signature:['attune','glamour'], support:['haste','restoration'], cycle:['prepare','attack','attack'], attacks:['strike','feint'], prepares:['attune','glamour','haste','restoration'], audience:['objection','listen','hurry'], preference:'appeal' },
  Warden: { offsets:[0,-2,5,0], signature:['ward','shadowstep'], support:['hush','shape'], cycle:['prepare','attack','attack'], attacks:['strike','feint'], prepares:['ward','shape','hush','shadowstep:near'], audience:['scrutinize','objection','listen'], preference:'offer' }
};
export const SPELLS = {
  flame:{name:'Flame',cost:[10,9,7],school:'Evocation'},
  tide:{name:'Tide',cost:[14,10,9],school:'Evocation'},
  foresight:{name:'Foresight',cost:[10,9,7],school:'Astromancy'},
  starlight:{name:'Starlight',cost:[18,14,10],school:'Astromancy'},
  restoration:{name:'Restoration',cost:[14,10,9],school:'Alchemy'},
  shape:{name:'Shape',cost:[14,10,9],school:'Alchemy'},
  glamour:{name:'Glamour',cost:[14,10,9],school:'Illusion'},
  hush:{name:'Hush',cost:[10,9,7],school:'Illusion'},
  haste:{name:'Haste',cost:[10,9,7],school:'Beastcraft'},
  attune:{name:'Attune',cost:[10,9,7],school:'Beastcraft'},
  ward:{name:'Ward',cost:[10,8,6],school:'Umbral'},
  shadowstep:{name:'Shadowstep',cost:[18,14,10],school:'Umbral'}
};
export const CONTEXTS = {
  practice_duel:{health:.8,mood:.8,renown:.8,mana:.8,crowns:0},
  real_conflict:{health:.5,mood:.5,renown:.5,mana:.5,crowns:0},
  public_duel:{health:.8,mood:.8,renown:.2,mana:.8,crowns:0},
  rehearsal:{health:.8,mood:.8,renown:.8,mana:.8,crowns:1}
};
export const cap=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const copy=x=>structuredClone(x);
export function levelRng(level) {
  let state=level|0;
  return ()=>{let a=(state=(state+0x6D2B79F5)|0);let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};
}
export function generateKit(archetype,level,access='kit') {
  if(!ARCHETYPES[archetype] || !Number.isInteger(level) || level<1 || level>100) throw Error('Choose an archetype and an integer level from 1 to 100.');
  const a=ARCHETYPES[archetype],rng=levelRng(level),draws=Array.from({length:7},()=>rng()),j=draws.slice(0,4).map(u=>Math.floor(7*u)-3),bound=Math.min(level-1,100-level);
  const dA=cap(a.offsets[0]+j[0],-bound,bound),dC=cap(a.offsets[1]+j[1],-bound,bound),rank=1+Math.floor((level-1)/35);
  const skills={arcana:level+dA,vigor:level-dA,charm:level+dC,guile:level-dC,lore:cap(level+a.offsets[2]+j[2],1,100),alchemy:cap(level+a.offsets[3]+j[3],1,100)};
  const spells=Object.fromEntries(a.signature.map(s=>[s,rank]));
  a.support.forEach((s,i)=>spells[s]=i===Math.floor(2*draws[4])?rank:Math.max(1,rank-1));
  if(access==='all') for(const s of Object.keys(SPELLS)) spells[s]??=Math.max(1,rank-1);
  return {archetype,level,skills,spells,capacity:Math.floor(40+skills.arcana/2),cycleOffset:Math.floor(3*draws[5]),temperament:Math.floor(3*draws[6]),draws};
}
