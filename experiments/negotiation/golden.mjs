// Short deterministic equivalence suite against the independently retained JS.
import assert from 'node:assert/strict';import fs from 'node:fs';
import * as js from './reference-engine.mjs';import * as wasm from './engine.mjs';import {evaluate as jsEval,searchAction as jsSearch} from './reference-ai.mjs';import {evaluate as rustEval,searchAction} from './ai.mjs';
let transitions=0,spells=0;
function equal(a,b,path='root'){
 if(typeof a==='number'&&typeof b==='number'){assert(Math.abs(a-b)<1e-11,`${path}: ${a} != ${b}`);return;}
 if(a&&b&&typeof a==='object'&&typeof b==='object'){assert.deepEqual(Object.keys(a).filter(k=>a[k]!==undefined).sort(),Object.keys(b).filter(k=>b[k]!==undefined).sort(),path);for(const k of Object.keys(a).filter(k=>a[k]!==undefined))equal(a[k],b[k],path+'.'+k);return;}
 assert.deepEqual(a,b,path);
}
for(const level of [20,50,80])for(const seed of [1,20,123,4294967295]){
 const config={level,seed,allSpells:true,requests:[{type:'flag',key:'invitation'},{type:'spell',key:'seal'},{type:'gold',amount:8},{type:'health',amount:8}]};
 let a=js.createState(config),b=wasm.createState(config);
 for(let turn=0;!a.result&&turn<30;turn++){
  equal(wasm.legalActions(b),js.legalActions(a));equal(wasm.chance(b),js.chance(a));equal(rustEval(b),jsEval(a));
  const id=turn%3===0&&js.legalActions(a).includes('candour')?'candour':turn%4===0&&js.legalActions(a).includes('deflect')?'deflect':'face';
  js.applyAction(a,id);wasm.applyAction(b,id);equal(b,a);transitions++;
 }
}
for(const [id,spell]of Object.entries(js.SPELLS))if(spell.castable!==false){
 for(const level of [20,50,80]){
  const a=js.createState({level,allSpells:true,underground:true}),b=wasm.createState({level,allSpells:true,underground:true});
  a.suspicion=b.suspicion=2;a.agreement=b.agreement=2;
  js.applyAction(a,id);wasm.applyAction(b,id);equal(b,a,id);spells++;
  if(!a.result)for(const outcome of [true,false])equal(wasm.project(b,'face',outcome),js.project(a,'face',outcome),id+' response');
 }
}
// Every card, both outcomes, nonuniform signals, low Resolve, and paired spell.
const a=js.createState({level:50,allSpells:true,player:{skills:{charm:80,lore:35,guile:60,alchemy:20},renown:-10,relationship:5,alignment:40},requests:[{type:'flag',key:'no'},{type:'spell',key:'seal'},{type:'gold',amount:99},{type:'health',amount:8}]});
for(const card of a.pool)for(const fraction of [1,.3,0])for(const spell of [null,'index','glamour','reflect','quickquill']){
 let s=structuredClone(a);s.card=card.id;s.resolve=s.resolveMax*fraction;
 if(spell){const j=js.project(s,spell);equal(wasm.project(s,spell),j);s=j;}
 equal(wasm.chance(s),js.chance(s));for(const event of [true,false]){equal(wasm.project(s,'face',event),js.project(s,'face',event));transitions++;}
}
const decision=searchAction(wasm.createState(),{depth:2,nodeBudget:2000,budgetMs:50});assert(Number.isFinite(decision.value));assert(decision.scores.length===wasm.legalActions(wasm.createState()).length);
console.log(JSON.stringify({passed:true,transitions,spellRankCases:spells,rootActions:decision.scores.length,wasmBytes:fs.statSync(new URL('./negotiation.wasm',import.meta.url)).size}));

let searches=0;for(const level of [20,50,80])for(const seed of [1,20]){const s=js.createState({level,seed});for(const spell of [null,'glamour']){const t=spell?js.project(s,spell):s;const options={depth:1,nodeBudget:100000,fixedNodes:true};const a=jsSearch(t,options),b=searchAction(t,options);assert.equal(b.id,a.id);equal(b.value,a.value,'search value');for(const score of b.scores)equal(score.value,a.scores.find(x=>x.id===score.id).value,'root '+score.id);searches++;}}console.log(JSON.stringify({searchGoldens:searches,passed:true}));
