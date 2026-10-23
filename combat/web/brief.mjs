// A button-sized summary of an action, read from its description's template (describeData(), rust/core/src/text.rs), so the
// numbers are the core's own: {kind, value, label, turns}. kind colours it: dmg, heal, mana, guard (defence), buff, debuff,
// gold. Presentation only; the description stays the source of truth and shows in full when the action is selected.
// Labels translate by key (brief.<key>, setup/text.mjs); BRIEF_LABELS is their English.
import {tx} from '../setup/text.mjs';
export const BRIEF_LABELS={bank:'Bank',mana:'Mana',heal:'Heal',charge:'Charge',release:'Release',hold:'Hold',
 physical:'Impact',block:'Parry',ward:'Ward',flux:'Flux',ifUnhit:'If unhit',eachTurn:'Each turn',channel:'Channel',in2:'In 2 turns',evade:'Evade',brace:'Brace',reflect:'Reflect',rescue:'Rescue',
 reveal:'Reveal',haste:'Haste',impulses:'+Impulse',snuffFlux:'Snuff flux',steal:'Steal',perAction:'× Mana paid',force:'Force',hurtToMana:'Hurt → Mana',hpForMana:'Mana → HP',renown:'Renown',
 stealCrowns:'Steal Crowns',drain:'Drain',spell:'Spell',noEffect:'No effect',free:'Break free',star:'In {n} turns',chain:'Chain',
 nextTurn:'Next turn',inTurns:'In {n} turns',bind:'Bind',perTurn:'Per turn',hits:'{n} hits',scatter:'Scatter',twice:'Twice'};
const L=k=>tx('brief.'+k,BRIEF_LABELS[k]);
const num=x=>x===undefined||x===null||x===''||typeof x==='object'?null:Math.round(Number(x));
const plus=x=>'+'+num(x);
// A span of exchanges as the core writes it (text.rs span / next_span): a template, 1 when it has no number.
const span=x=>x&&typeof x==='object'?num(x.n)??1:num(x);
export function brief(id,data,channel){
 let d=data&&typeof data==='object'?data:{};
 while(d.k==='d.forbidden'&&d.text&&typeof d.text==='object')d=d.text;
 if(id==='hold'||id==='release'){
  const x=d.text&&typeof d.text==='object'?d.text:{},dmg=num(x.dmg);
  if(channel==='moonwell')return {kind:'mana',value:plus(x.n),label:id==='hold'?L('bank'):L('mana')};
  if(channel==='siphon'&&id==='release')return {kind:'heal',value:plus(x.n),label:L('heal')};
  if(channel==='starlight'&&id==='hold')return {kind:'dmg',value:dmg,label:L('charge')};
  return dmg!==null?{kind:'dmg',value:dmg,label:id==='hold'?L('hold'):L('release')}:{kind:'buff',value:'',label:id==='hold'?L('hold'):L('release')};
 }
 const turns=d.k==='d.shadowstep'||d.k==='d.haste'||d.k==='d.brace'||d.k==='d.eclipse'?span(d.n):null;
 switch(id){
  case 'strike':return {kind:'dmg',value:num(d.dmg),label:L('physical')};
  case 'guard':return {kind:'guard',value:'',label:L('block'),turns:1};
  case 'ward':return {kind:'guard',value:'',label:L('ward'),turns:1};
  case 'reclaim':return {kind:'mana',value:plus(d.n),label:L('flux')};
  case 'break_free':return {kind:'buff',value:'',label:L('free')};
  case 'mend':return {kind:'heal',value:plus(d.n),label:L('ifUnhit')};
  case 'heartwood':return {kind:'heal',value:plus(d.effect?.n),label:L('eachTurn')};
  case 'animate':case 'contraption':return {kind:'dmg',value:num(d.effect?.n),label:L('eachTurn')};
  case 'starlight':return {kind:'dmg',value:num(d.dmg)+'/'+num(d.charged),label:L('channel')};
  case 'wildfire':return {kind:'dmg',value:num(d.hit),label:L('channel')};
  case 'omen':return {kind:'dmg',value:num(d.n)+'×2',label:L('in2')};
  case 'shadowstep':return {kind:'guard',value:'',label:L('evade'),turns};
  case 'reflect':return {kind:'guard',value:'',label:L('reflect'),turns:1};
  case 'rime':return {kind:'guard',value:num(d.n),label:L('rescue')};
  case 'foresight':return {kind:'buff',value:'',label:L('reveal'),turns:span(d.n)};
  case 'haste':return {kind:'buff',value:'',label:L('impulses'),turns};
  case 'tailwind':return {kind:'dmg',value:num(d.dmg),label:L('chain')};
  case 'seal':return {kind:'debuff',value:'',label:L('snuffFlux')};
  case 'purify':return {kind:'mana',value:plus(d.n),label:L('mana')};
  case 'moonwell':return {kind:'mana',value:plus(d.n),label:L('channel')};
  case 'lodestar':return {kind:'heal',value:plus(d.heal),label:L('star').replace('{n}',num(d.n))};
  case 'extraction':return {kind:'mana',value:num(d.n),label:L('steal')};
  case 'torment':return {kind:'debuff',value:num(d.n)+'×',label:L('perAction'),turns:3};
  case 'siphon':return {kind:'dmg',value:num(d.n),label:L('drain')};
  case 'compel':return {kind:'debuff',value:'',label:L('force'),turns:span(d.n)};
  case 'eclipse':return {kind:'mana',value:'',label:L('hurtToMana'),turns};
  case 'heartprice':return {kind:'debuff',value:'',label:L('hpForMana')};
  case 'glamour':return {kind:'gold',value:num(d.n)===null?'':plus(d.n),label:L('renown')};
  case 'rapport':return {kind:'gold',value:num(d.n)===null?'':plus(d.n),label:L('renown')};
  case 'sleight':return {kind:'gold',value:num(d.n)??'',label:L('stealCrowns')};
 }
 // By the template (F5.11): a creature's own copies of Ward, Brace and Shadowstep, delayed blows, constructs and creature mechanics.
 switch(d.k){
  case 'd.shadowstep':return {kind:'guard',value:'',label:L('evade'),turns};
  case 'd.ward':return {kind:'guard',value:'',label:L('ward'),turns:1};
  case 'd.brace':return {kind:'guard',value:'',label:L('brace'),turns};
  case 'd.delayed':case 'd.delayed.both':{const n=num(d.n)+(num(d.m)??0);return {kind:'dmg',value:n,label:d.when?.k==='d.delayed.later'?L('inTurns').replace('{n}',num(d.when.n)):L('nextTurn')};}
  case 'd.construct':return d.effect?.k==='d.construct.heal'?{kind:'heal',value:plus(d.effect?.n),label:L('eachTurn')}:{kind:'dmg',value:num(d.effect?.n),label:L('eachTurn')};
  case 'd.bind':return {kind:'debuff',value:'',label:L('bind'),turns:span(d.n)};
  case 'd.bramble':return {kind:'dmg',value:num(d.dmg),label:L('bind'),turns:span(d.n)};
  case 'd.poison':return {kind:'dmg',value:num(d.dmg),label:L('twice')};
  case 'd.poison.n':return {kind:'dmg',value:num(d.dmg),label:L('perTurn'),turns:span(d.n)};
  case 'd.drain.keep':return {kind:'mana',value:num(d.n),label:L('steal')};
  case 'd.drain':return {kind:'debuff',value:num(d.n),label:L('scatter')};
  case 'd.roar':return {kind:'dmg',value:num(d.dmg),label:L('scatter')};
  case 'd.hits':case 'd.hits.physical':return {kind:'dmg',value:num(d.dmg),label:L('hits').replace('{n}',num(d.n))};
  case 'd.twoHits':return {kind:'dmg',value:num(d.dmg)+'+'+num(d.next),label:L('spell')};
 }
 if(d.dmg!==undefined)return {kind:'dmg',value:num(d.dmg),label:d.k==='d.physicalHit'?L('physical'):L('spell'),turns};
 return {kind:'buff',value:'',label:d.k==='d.noEffect'?L('noEffect'):'',turns};
}
