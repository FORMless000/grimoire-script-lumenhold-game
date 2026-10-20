import test from 'node:test';import assert from 'node:assert/strict';
import {createState,cloneState,applyChoice,actorToMove,legalActions,basicBundles} from './engine.mjs';
import {searchAction,chooseAIAction,evaluate,exhaustiveValue,plausibleMistake} from './ai.mjs';
const play=(s,a,b)=>{const pair=[a,b];applyChoice(s,pair[actorToMove(s)]);applyChoice(s,pair[actorToMove(s)]);};
const stripped=firstLeader=>{const s=createState({firstLeader});for(const a of s.actors)a.kit={...a.kit,spells:{}};return s;};
const stable=({elapsedMs,...rest})=>rest;
test('alpha-beta and exact root ranking match exhaustive minimax for both owners',()=>{
 for(const leader of [0,1]){
  const s=stripped(leader),a=searchAction(s,{maxDepth:2,nodeBudget:100000,rankActions:true});assert.equal(a.completedDepth,2);assert.equal(a.value,exhaustiveValue(s,2));
  for(const row of a.rankedActions){const c=cloneState(s),step=applyChoice(c,row.id);assert.equal(row.value,exhaustiveValue(c,2-Number(step.resolved)));}
 }
});
test('public channel, Haste bundle and forced initiative trees use actual decision ownership',()=>{
 for(const kind of ['channel','haste','foresight']){
  const s=stripped(0);
  if(kind==='channel')s.actors[0].channel={id:'moonwell',holds:1,bank:10,total:0};
  if(kind==='haste')s.actors[0].effects.haste={value:3,from:1,until:1,born:0};
  if(kind==='foresight'){s.earlyCommit[0]=3;s.leader=0;}
  const before=JSON.stringify(s),a=searchAction(s,{maxDepth:2,nodeBudget:100000});assert.equal(a.completedDepth,2);assert.equal(a.value,exhaustiveValue(s,2));assert.equal(JSON.stringify(s),before);
 }
});
test('mutual-knockout utility uses the telegraphed winner and draws have zero terminal utility',()=>{
 for(const leader of [0,1]){const s=stripped(leader);s.actors.forEach(a=>a.hp=1);play(s,'strike','strike');assert.equal(evaluate(s),leader===0?10000:-10000);}
});
test('degradation is independently shallow, reproducible, bounded and legal',()=>{
 const s=createState({playerLoadout:'Prefect',opponentLoadout:'Duellist'}),before=JSON.stringify(s);
 const options={maxDepth:1,mistakeChance:1,seed:77};const a=chooseAIAction(s,options),b=chooseAIAction(s,options);assert.deepEqual(stable(a),stable(b));assert.equal(a.completedDepth,1);
 if(a.degraded){assert(a.regret>0&&a.regret<=35);assert(plausibleMistake(s,a.id));assert.notEqual(a.id,a.bestId);}
 assert.equal(JSON.stringify(s),before);
 const full=chooseAIAction(s,{profile:'full'}),normal=searchAction(s);for(const k of ['id','value','nodes','completedDepth'])assert.equal(full[k],normal[k]);
 const capped=chooseAIAction(s,{nodeBudget:1,mistakeChance:1});assert.equal(capped.completedDepth,0);assert(!capped.degraded);assert(legalActions(s).includes(capped.id));
});
test('fallibility never proposes resource-empty or combat-irrelevant actions',()=>{
 const s=createState({spellAccess:'all'});
 for(const id of ['reclaim','candour','quickquill','index','toll','glamour','rapport','mend','seal','extraction'])assert(!plausibleMistake(s,id),id);
});
test('all-roster and bundle searches stay inside node ceilings and do not mutate state',()=>{
 const s=createState({spellAccess:'all'}),before=JSON.stringify(s),a=chooseAIAction(s,{mistakeChance:1,seed:4});assert(a.totalNodes<=10000);assert(a.completedDepth>=1);assert(legalActions(s).includes(a.id));assert.equal(JSON.stringify(s),before);
 s.actors[0].effects.haste={value:3,from:1,until:1,born:0};s.leader=0;const b=chooseAIAction(s);assert(basicBundles(3).includes(b.id));
});

test('fallibility respects settlement caps and permits an unheld Lodestar release',()=>{const s=createState({spellAccess:'all',observers:true});s.actors[0].glamourAwarded=4;s.actors[0].rapportCrowns=10;s.leader=0;assert(!plausibleMistake(s,'glamour'));assert(!plausibleMistake(s,'rapport'));s.actors[0].channel={id:'lodestar',holds:0,bank:0,total:0};assert(plausibleMistake(s,'release'));});
