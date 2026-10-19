// A button-sized summary of an action, read from its description's template (describeData(), rust/core/src/text.rs), so the
// numbers are the core's own: {kind, value, label, turns}. kind colours it: dmg, heal, mana, guard (defence), buff, debuff,
// gold. Presentation only; the description stays the source of truth and shows in full when the action is selected.
// Labels translate by key (brief.<key>, setup/text.mjs); BRIEF_LABELS is their English.
import {tx} from '../setup/text.mjs';
export const BRIEF_LABELS={actions1:'1 action',actions:'{n} actions',bank:'Bank',mana:'Mana',absorb:'Absorb',shield:'Shield',heal:'Heal',charge:'Charge',release:'Release',hold:'Hold',
 physical:'Physical',block:'Block',ward:'Ward',flux:'Flux',ifUnhit:'If unhit',eachTurn:'Each turn',channel:'Channel',in2:'In 2 turns',evade:'Evade',brace:'Brace',reflect:'Reflect',rescue:'Rescue',
 reveal:'Reveal',haste:'Haste',strikes:'Strikes',snuffFlux:'Snuff flux',steal:'Steal',perAction:'Per action',force:'Force',hurtToMana:'Hurt → Mana',hpForMana:'HP for Mana',renown:'Renown',
 crownsToRenown:'Crowns → Renown',stealCrowns:'Steal Crowns',drain:'Drain',spell:'Spell',noEffect:'No effect'};
const L=k=>tx('brief.'+k,BRIEF_LABELS[k]);
const num=x=>x===undefined||x===null||x===''||typeof x==='object'?null:Math.round(Number(x));
const plus=x=>'+'+num(x);
export function brief(id,data,channel){
 let d=data&&typeof data==='object'?data:{};
 while(d.k==='d.forbidden'&&d.text&&typeof d.text==='object')d=d.text;
 if(id.startsWith('bundle:')){const n=id.slice(7).split('+').length;return {kind:'buff',value:'',label:n===1?L('actions1'):L('actions').replace('{n}',n)};}
 if(id==='hold'||id==='release'){
  const x=d.text&&typeof d.text==='object'?d.text:{},dmg=num(x.dmg);
  if(channel==='moonwell')return {kind:'mana',value:plus(x.n),label:id==='hold'?L('bank'):L('mana')};
  if(channel==='lodestar')return id==='hold'?{kind:'guard',value:plus(x.n),label:L('absorb')}:{kind:'guard',value:num(x.n),label:L('shield')};
  if(channel==='siphon'&&id==='release')return {kind:'heal',value:plus(x.n),label:L('heal')};
  if(channel==='starlight'&&id==='hold')return {kind:'dmg',value:dmg,label:L('charge')};
  if(id==='release'&&channel==='wildfire')return {kind:'dmg',value:dmg+(num(x.extra)??0),label:L('release')};
  return dmg!==null?{kind:'dmg',value:dmg,label:id==='hold'?L('hold'):L('release')}:{kind:'buff',value:'',label:id==='hold'?L('hold'):L('release')};
 }
 const turns=d.k==='d.shadowstep'||d.k==='d.haste'?num(d.n):null;
 switch(id){
  case 'strike':return {kind:'dmg',value:num(d.dmg),label:L('physical')};
  case 'guard':return {kind:'guard',value:'',label:L('block'),turns:1};
  case 'ward':return {kind:'guard',value:'',label:L('ward'),turns:1};
  case 'reclaim':return {kind:'mana',value:plus(d.n),label:L('flux')};
  case 'mend':return {kind:'heal',value:plus(d.n),label:L('ifUnhit')};
  case 'heartwood':return {kind:'heal',value:plus(d.effect?.n),label:L('eachTurn')};
  case 'animate':case 'bramble':case 'contraption':return {kind:'dmg',value:num(d.effect?.n),label:L('eachTurn')};
  case 'starlight':return {kind:'dmg',value:num(d.dmg)+'/'+num(d.charged),label:L('channel')};
  case 'wildfire':return {kind:'dmg',value:num(d.ignite?.n)??'',label:L('channel')};
  case 'omen':return {kind:'dmg',value:num(d.n),label:L('in2')};
  case 'shadowstep':return {kind:'guard',value:'',label:L('evade'),turns};
  case 'brace':return {kind:'guard',value:'',label:L('brace'),turns:4};
  case 'reflect':return {kind:'guard',value:'',label:L('reflect'),turns:d.k==='d.reflect.more'&&typeof d.n==='object'?2:1};
  case 'rime':return {kind:'guard',value:num(d.n),label:L('rescue')};
  case 'foresight':return {kind:'buff',value:'',label:L('reveal'),turns:num(d.n)};
  case 'haste':return {kind:'buff',value:num(d.actions)+'×',label:L('haste'),turns};
  case 'tailwind':return {kind:'buff',value:'+'+(d.n??''),label:L('strikes'),turns:3};
  case 'seal':return {kind:'debuff',value:'',label:L('snuffFlux')};
  case 'purify':return {kind:'mana',value:plus(d.n),label:L('mana')};
  case 'moonwell':return {kind:'mana',value:plus(d.n),label:L('channel')};
  case 'lodestar':return {kind:'guard',value:plus(d.n),label:L('absorb')};
  case 'extraction':return {kind:'mana',value:num(d.n),label:L('steal')};
  case 'torment':return {kind:'debuff',value:num(d.n),label:L('perAction'),turns:3};
  case 'siphon':return {kind:'dmg',value:num(d.n),label:L('drain')};
  case 'compel':return {kind:'debuff',value:'',label:L('force'),turns:2};
  case 'eclipse':return {kind:'mana',value:'',label:L('hurtToMana'),turns:2};
  case 'heartprice':return {kind:'debuff',value:'',label:L('hpForMana')};
  case 'glamour':return {kind:'gold',value:plus(d.n),label:L('renown')};
  case 'rapport':return {kind:'gold',value:'',label:L('crownsToRenown')};
  case 'sleight':return {kind:'gold',value:num(d.n),label:L('stealCrowns')};
 }
 if(d.dmg!==undefined)return {kind:'dmg',value:num(d.dmg),label:d.k==='d.physicalHit'?L('physical'):L('spell'),turns};
 return {kind:'buff',value:'',label:d.k==='d.noEffect'?L('noEffect'):'',turns};
}
