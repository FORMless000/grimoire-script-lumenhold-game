import fs from 'node:fs';import crypto from 'node:crypto';
import test from 'node:test';import assert from 'node:assert/strict';
import * as engine from './engine.mjs';
import * as referenceEngine from '../../reference/v04-search-046/engine.mjs';
import * as referenceAI from '../../reference/v04-search-046/ai.mjs';
import {searchAction,chooseAIAction,createSearchContext,exhaustiveValue,evaluate,nextSearchScore,tacticalThreat,COMPUTE_PROFILES} from './ai.mjs';
import {copySearchState} from './search-state.mjs';
import {prepareSearchContext,searchPositionKey,probeSearchCache,storeSearchCache} from './search-cache.mjs';
import {searchFixtures} from '../../search-fixtures.mjs';
const {createState,cloneState,applyChoice,applySearchChoice,legalActions,actorToMove}=engine;
const publicState=s=>{const r=structuredClone(s);delete r.searching;delete r.searchKits;delete r.history;delete r.searchStats;r.lastEvents=[];return r;};
const pair=(s,a,b)=>{const ids=[a,b];applyChoice(s,ids[actorToMove(s)]);applyChoice(s,ids[actorToMove(s)]);};
function randomStream(seed){let n=seed;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
const fixtures=searchFixtures(engine);
test('48 legal replay fixtures match frozen engine and fixed-depth optimal values',()=>{
 assert.equal(fixtures.length,48);
 for(const f of fixtures){
  const original=referenceEngine.createState(f.config);for(const id of f.commands)referenceEngine.applyChoice(original,id);assert.deepEqual(f.state,original,f.id);
  const before=JSON.stringify(f.state),a=searchAction(f.state,{maxDepth:1,nodeBudget:1000000}),b=referenceAI.searchAction(original,{maxDepth:1,nodeBudget:1000000});
  assert.equal(a.completedDepth,1,f.id);assert.equal(a.value,b.value,f.id);
  const child=cloneState(f.state),r=applyChoice(child,a.id);assert.equal(referenceAI.exhaustiveValue(child,1-Number(r.resolved)),b.value,f.id);assert.equal(JSON.stringify(f.state),before);
 }
});
test('pooled copies and unchecked legal moves match full reference transitions and ledgers',()=>{
 const rng=randomStream(20261016);let buffer;
 for(const f of fixtures){
  for(const id of legalActions(f.state)){
   const before=JSON.stringify(f.state),a=cloneState(f.state),b=buffer=copySearchState(f.state,buffer),c=referenceEngine.cloneState(f.state);
   applyChoice(a,id);applySearchChoice(b,id);referenceEngine.applyChoice(c,id);
   assert.deepEqual(publicState(b),publicState(a),f.id+':'+id);assert.deepEqual(publicState(b),publicState(c),f.id+':'+id);assert.equal(JSON.stringify(f.state),before);
  }
 }
 for(let seed=0;seed<10;seed++){
  const a=createState({spellAccess:'all',observers:true,firstLeader:seed%2,healthModel:'direct'}),b=referenceEngine.createState(a.config);
  for(let i=0;i<60&&!a.result;i++){const actions=legalActions(a),id=actions[Math.floor(rng()*actions.length)];applyChoice(a,id);referenceEngine.applyChoice(b,id);assert.deepEqual(a,b,'seed '+seed+' decision '+i);}
 }
});
test('PVS, aspiration, collision-checked tables and exact ranking agree with exhaustive minimax',()=>{
 const rng=randomStream(19),context=createSearchContext({tableLimit:8,hashPosition:()=>[0,0,0,0]});
 for(let i=0;i<30;i++){
  const s=createState({firstLeader:i%2,spellAccess:'all',healthModel:'direct'});
  for(const a of s.actors)a.kit={...a.kit,spells:Object.fromEntries((i%3===0?['ward','flame','omen']:i%3===1?['foresight','haste','starlight']:['shadowstep','mend','compel']).map(id=>[id,1]))};
  for(let n=0;n<i%5&&!s.result;n++){const ids=legalActions(s);applyChoice(s,ids[Math.floor(rng()*ids.length)]);}
  if(s.result)continue;const before=JSON.stringify(s),expected=exhaustiveValue(s,2);
  for(const pvs of [false,true])for(const aspiration of [false,true]){
   const a=searchAction(s,{maxDepth:2,nodeBudget:1000000,pvs,aspiration},context);assert.equal(a.completedDepth,2);assert.equal(a.value,expected,`case ${i}, PVS ${pvs}, aspiration ${aspiration}`);
   const child=cloneState(s),r=applyChoice(child,a.id);assert.equal(exhaustiveValue(child,2-Number(r.resolved)),expected);assert.equal(JSON.stringify(s),before);
  }
  if(i<6){const a=searchAction(s,{maxDepth:2,nodeBudget:1000000,rankActions:true},context);for(const row of a.rankedActions){const child=cloneState(s),r=applyChoice(child,row.id);assert.equal(row.value,exhaustiveValue(child,2-Number(r.resolved)));}}
 }
});
test('tactical extensions agree with an exhaustive full-exchange reference and are bounded',()=>{
 for(const kind of ['omen','construct','channel'])for(const leader of [0,1]){
  const s=createState({firstLeader:leader,spellAccess:'all'});for(const a of s.actors)a.kit={...a.kit,spells:{}};
  if(kind==='channel')s.actors[0].channel={id:'moonwell',holds:1,bank:6,total:0};
  if(kind==='omen')s.actors[0].omens=[{due:s.round+1,power:30}];
  if(kind==='construct')s.actors[0].constructs=[{id:'contraption',power:6,reduction:0,threshold:14,taken:0,expires:s.round+1}];
  const a=searchAction(s,{maxDepth:1,nodeBudget:1000000,horizonMode:'tactical'});assert.equal(a.value,exhaustiveValue(s,1,{horizonMode:'tactical'}));assert(a.extensions>0);assert(a.extensionNodes>0);assert(a.nodes<300);
  assert.equal(searchAction(s,{maxDepth:1,nodeBudget:1000000,horizonMode:'fixed'}).value,exhaustiveValue(s,1));
 }
 const s=createState();assert(!tacticalThreat(s));
});
test('numeric keys include history, accounting and effects; collisions cannot return a wrong score',()=>{
 const s=createState(),context=createSearchContext({tableLimit:2,hashPosition:()=>[0,0,0,0]});prepareSearchContext(context,s,'test');
 const key=searchPositionKey(context,s);storeSearchCache(context,key,{depth:2,horizon:'2:1:fixed',bestId:'strike',value:999,flag:'exact'});assert(probeSearchCache(context,searchPositionKey(context,s)));
 for(const mutate of [x=>x.pending[0]='guard',x=>x.actors[0].spent.mana++,x=>x.actors[0].lastAction='ward',x=>x.actors[0].effects.ward={value:1,from:1,until:1,born:1},x=>x.reports.push({side:0,spell:'compel',round:1})]){const x=cloneState(s);mutate(x);assert.equal(probeSearchCache(context,searchPositionKey(context,x)),null);}
 const x=cloneState(s);x.actors[0].resources.mana--;storeSearchCache(context,searchPositionKey(context,x),{depth:3,horizon:'3:1:fixed',bestId:'guard',value:1,flag:'lower'});assert(context.size<=2);assert.equal(probeSearchCache(context,key),null);
 prepareSearchContext(context,{...s,config:{...s.config,damageMultiplier:2}},'test');assert.equal(context.size,0);assert.equal(context.invalidations,1);
 const y=cloneState(s);y.actors[0].kit={...y.actors[0].kit,skills:{...y.actors[0].kit.skills,vigor:1}};prepareSearchContext(context,y,'test');assert.equal(context.invalidations,2);
});
test('fake-clock deadlines share the entire decision budget and preserve the last finished iteration',()=>{
 for(const computeProfile of ['live_fast','live_deep']){
  let tick=0;const now=()=>tick+=.05,s=createState({spellAccess:'all'}),before=JSON.stringify(s),d=chooseAIAction(s,{computeProfile,mistakeChance:1,now});
  assert(d.elapsedMs<COMPUTE_PROFILES[computeProfile].budgetMs+2);assert(legalActions(s).includes(d.id));assert.equal(JSON.stringify(s),before);assert.equal(d.horizonMode,'tactical');assert.equal(d.tableLimit,COMPUTE_PROFILES[computeProfile].tableLimit);
  if(d.degraded)assert.equal(d.rankingDepth,d.completedDepth);
 }
 let tick=0;const s=createState(),d=searchAction(s,{maxDepth:8,nodeBudget:1000000,budgetMs:1,now:()=>tick+=.1});assert.equal(d.stoppingReason,'deadline');assert(legalActions(s).includes(d.id));
 const c=createSearchContext();searchAction(s,{maxDepth:1,nodeBudget:100000},c);const q=searchAction(s,{maxDepth:8,nodeBudget:1},c);assert.equal(q.completedDepth,0);assert.equal(q.nodes,1);
});
test('persistent contexts preserve completed-depth values and never mutate encounter state',()=>{
 const s=createState({playerLoadout:'Prefect'}),context=createSearchContext({tableLimit:32});
 for(let i=0;i<5&&!s.result;i++){const before=JSON.stringify(s),a=searchAction(s,{maxDepth:2,nodeBudget:100000},context),b=searchAction(s,{maxDepth:a.completedDepth,nodeBudget:100000});assert.equal(a.value,b.value);assert.equal(JSON.stringify(s),before);applyChoice(s,a.id);}
 assert(context.size<=32);
});
test('floating null windows handle zero, signs, infinities and adjacent doubles',()=>{
 for(const x of [-10000,-1,-Number.MIN_VALUE,0,Number.MIN_VALUE,1,10000]){assert(nextSearchScore(x)>x);assert(nextSearchScore(x,-1)<x);}
 assert.equal(nextSearchScore(Infinity),Infinity);assert.equal(nextSearchScore(-Infinity,-1),-Infinity);assert.equal(nextSearchScore(nextSearchScore(1),-1),1);
});
test('compute profiles preserve bounded fallibility with a shared node/deadline budget',()=>{
 const s=createState({playerLoadout:'Prefect',opponentLoadout:'Duellist'});let found=false;
 for(let seed=0;seed<8;seed++){
  const d=chooseAIAction(s,{computeProfile:'live_fast',maxDepth:1,mistakeChance:1,seed,budgetMs:1000});
  assert(d.totalNodes<=d.nodeBudget);if(d.degraded){found=true;assert(d.regret>0&&d.regret<=35);assert.equal(d.rankingDepth,d.completedDepth);break;}
 }
 assert(found,'At least one reproducible bounded mistake should remain possible');
});

test('the durable pre-optimization reference has not been edited',()=>{
 const root=new URL('../../reference/v04-search-046/',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root)));
 for(const [file,hash]of Object.entries(manifest.files))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(file,root))).digest('hex'),hash,file);
});
test('pooled-copy flat-record assumptions cover every current mutable actor record',()=>{
 for(const f of fixtures)for(const a of f.state.actors){
  const mutable=new Set(['resources','spent','restored','effects','channel','constructs','omens']);
  for(const [key,value]of Object.entries(a))if(value&&typeof value==='object'&&!['kit','entry'].includes(key))assert(mutable.has(key),'New mutable actor record needs a copy path: '+key);
  for(const record of [a.resources,a.spent,a.restored,...Object.values(a.effects),a.channel,...a.constructs,...a.omens].filter(Boolean))for(const value of Object.values(record))assert(value===null||typeof value!=='object','Nested mutable record needs deep copying');
 }
});
