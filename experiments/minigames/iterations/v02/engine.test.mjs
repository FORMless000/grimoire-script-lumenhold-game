import test from 'node:test';import assert from 'node:assert/strict';
import {createState,cloneState,applyChoice,actorToMove,legalActions,cost,finish,SPELLS,ARCHETYPES} from './engine.mjs';
import {searchAction,exhaustiveValue,evaluate} from './ai.mjs';
import * as adapter from './adapter.mjs';import {runMatch} from '../../harness.mjs';
const play=(s,p,o)=>{const pair=[p,o];applyChoice(s,pair[actorToMove(s)]);return applyChoice(s,pair[actorToMove(s)]);};
test('simultaneous lethal spells both land; the telegraphed actor wins in both seats',()=>{
 for(const firstLeader of [0,1]){
  const s=adapter.create({firstLeader,spellAccess:'all',playerResources:{health:10}});
  const entries=s.actors.map(a=>a.entry.mana),casts=s.actors.map((_,side)=>cost(s,side,'flame'));
  adapter.advance(s,'flame');adapter.advance(s,'flame');
  assert.deepEqual(s.actors.map(a=>a.hp),[0,0]);assert.equal(s.result.winner,firstLeader);
  assert.equal(s.result.tiebreak,'telegraphed initiative');assert.equal(s.result.outcome,firstLeader===0?'win':'lose');
  assert.deepEqual(adapter.metrics(s).outcomes,firstLeader===0?['win','lose']:['lose','win']);
  assert.equal(evaluate(s),firstLeader===0?10000:-10000);
  assert.equal(s.history[0].leader,firstLeader);
  for(const [i,a]of s.actors.entries()){assert.equal(a.spent.mana,casts[i]);assert.equal(a.spent.health,10);assert(a.resources.mana<=entries[i]);}
 }
});
test('a Foresight-forced leader gets the lethal tie even against normal alternation',()=>{
 const s=createState({firstLeader:0,spellAccess:'all',playerResources:{health:10}});
 play(s,'foresight','guard');play(s,'guard','guard');
 assert.equal(s.normalLeader,0);assert.equal(s.leader,1);
 play(s,'flame','flame');assert.equal(s.result.winner,1);assert.equal(evaluate(s),-10000);
});
test('initiative changes only simultaneous defeat, preserving ordinary partial results',()=>{
 for(const firstLeader of [0,1]){
  const s=createState({firstLeader});s.round=8;s.actors.forEach(a=>a.hp=35);
  play(s,'guard','guard');assert.equal(s.result.outcome,'partial');assert.equal(s.result.winner,undefined);
  const n=createState({mode:'negotiation',firstLeader});n.agreement=12;n.patience=1;
  play(n,'guard','guard');assert.equal(n.result.outcome,'partial');assert.equal(n.result.winner,undefined);
 }
});
test('Foresight forces the following three exchanges first, with one freely chosen action each time',()=>{
 for(const mode of ['combat','negotiation'])for(const firstLeader of [0,1])for(const caster of [0,1]){
  const s=createState({mode,firstLeader,spellAccess:'all'}),pair=['guard','guard'],target=1-caster;
  pair[caster]='foresight';play(s,...pair);
  assert.equal(s.round,2);assert.equal(s.earlyCommit[target],3);
  for(let n=3;n>0;n--){
   assert.equal(actorToMove(s),target);assert.equal(s.earlyCommit[target],n);
   assert(legalActions(s).includes('strike'));assert(legalActions(s).includes('guard'));
   assert.equal(applyChoice(s,'guard').resolved,false);assert.equal(actorToMove(s),caster);
   assert.equal(s.pending[target],'guard');assert.equal(applyChoice(s,'guard').resolved,true);
  }
  assert.deepEqual(s.earlyCommit,[0,0]);assert.equal(s.round,5);assert.equal(s.leader,firstLeader);
  assert(!('queue' in s.actors[0]));
 }
});
test('both Foresights use background alternation, consume durations, and never deadlock',()=>{
 for(const firstLeader of [0,1]){
  const s=createState({firstLeader,spellAccess:'all'});play(s,'foresight','foresight');
  assert.deepEqual(s.earlyCommit,[3,3]);
  for(let n=3;n>0;n--){assert.equal(s.leader,s.normalLeader);assert.equal(s.earlyCommit[0],n);play(s,'guard','guard');}
  assert.deepEqual(s.earlyCommit,[0,0]);assert.equal(s.round,5);assert.equal(s.leader,firstLeader);
 }
});
test('Foresight refreshes without stacking; overlapping expiry and late casts use remaining exchanges',()=>{
 const s=createState({spellAccess:'all',playerLevel:80,firstLeader:0});
 play(s,'foresight','guard');play(s,'guard','guard');assert.deepEqual(s.earlyCommit,[0,2]);
 play(s,'foresight','guard');assert.deepEqual(s.earlyCommit,[0,3]);
 play(s,'guard','foresight');assert.deepEqual(s.earlyCommit,[3,2]);assert.equal(s.leader,s.normalLeader);
 play(s,'guard','guard');play(s,'guard','guard');assert.deepEqual(s.earlyCommit,[1,0]);assert.equal(s.leader,0);
 const late=createState({spellAccess:'all'});late.round=7;play(late,'foresight','guard');
 assert.equal(late.round,8);assert.deepEqual(late.earlyCommit,[0,1]);play(late,'guard','guard');assert(late.result);
});
test('alpha-beta follows forced early commitment and agrees with exhaustive minimax',()=>{
 for(const firstLeader of [0,1])for(const target of [0,1]){
  const s=createState({firstLeader,playerResources:{mana:0},opponentResources:{mana:0}});
  s.earlyCommit[target]=3;s.leader=target;
  const before=JSON.stringify(s),wanted=exhaustiveValue(s,2),a=searchAction(s,{maxDepth:2,nodeBudget:100000});
  assert.equal(a.value,wanted);assert.equal(a.completedDepth,2);assert.equal(JSON.stringify(s),before);
 }
});
test('commitments alternate; resources and damage wait for both commitments',()=>{const s=createState({firstLeader:0});applyChoice(s,'strike');assert.equal(s.actors[1].hp,70);assert.equal(actorToMove(s),1);applyChoice(s,'strike');assert.equal(s.round,2);assert.equal(actorToMove(s),1);assert(s.actors[0].hp<70);});
test('80% flux accounting conserves mana and reclaim is a zero-cost action',()=>{const s=createState();const initial=s.actors[0].entry.mana;play(s,'flame','guard');const c=cost(s,0,'flame');assert.equal(s.actors[0].resources.mana,initial-c);assert.equal(s.actors[0].flux,.8*c);play(s,'reclaim','guard');assert(Math.abs(s.actors[0].resources.mana-(initial-.2*c))<1e-8);assert.equal(s.actors[0].flux,0);assert.deepEqual(legalActions(createState({playerResources:{mana:0},opponentResources:{mana:0}})),['strike','guard','reclaim']);});
test('settlement collects residual flux once, rebates only net loss, never exceeds entry',()=>{const s=createState();play(s,'flame','guard');finish(s,'partial','test');const mana=s.settlement[0].mana;assert(mana.final<=mana.entry);assert.equal(mana.before,mana.entry-.2*mana.spent);const saved=JSON.stringify(s.settlement);finish(s,'win','again');assert.equal(JSON.stringify(s.settlement),saved);});
test('all twelve spells have a fixed cast in either mode and either role',()=>{for(const mode of ['combat','negotiation'])for(const side of [0,1]){const s=createState({mode,spellAccess:'all',firstLeader:side});for(const id of Object.keys(SPELLS)){assert(legalActions(s).includes(id));const t=cloneState(s);play(t,side===0?id:'guard',side===1?id:'guard');for(const a of t.actors){assert(Number.isFinite(a.hp));assert(Number.isFinite(a.resources.mana));assert(a.resources.mana+a.flux<=a.entry.mana+1e-8);}}}});
test('skill-based HP remains available at zero Health when requested',()=>{const s=createState({healthModel:'offset',playerResources:{health:0}});assert.equal(s.actors[0].hp,65);assert(legalActions(s,0).includes('strike'));});
test('alpha-beta matches exhaustive minimax with consecutive owners and both initial seats',()=>{for(const firstLeader of [0,1]){const s=createState({firstLeader,playerResources:{mana:0},opponentResources:{mana:0}});const before=JSON.stringify(s),wanted=exhaustiveValue(s,2),ai=searchAction(s,{maxDepth:2,nodeBudget:100000});assert.equal(ai.completedDepth,2);assert.equal(ai.value,wanted);assert.equal(JSON.stringify(s),before);}});
test('search is deterministic, budgeted, and simulations use the inherited harness',()=>{const s=createState(),a=searchAction(s,{nodeBudget:100}),b=searchAction(s,{nodeBudget:100});assert.equal(a.id,b.id);assert.equal(a.nodes,b.nodes);assert(a.nodes<=100);const config={playerArchetype:'Seer',opponentArchetype:'Seer',search:{maxDepth:2,nodeBudget:1000}};for(const mode of ['combat','negotiation']){const m=runMatch(adapter,{config:{...config,mode},leftPolicy:'alpha',rightPolicy:'greedy',keepTrace:true});assert(m.rounds<=8);for(const ledger of m.ledgers)for(const row of Object.values(ledger))assert(row.final>=0&&row.final<=row.entry);}});

test('Haste preempts only the next exchange; ordinary attacks otherwise remain simultaneous',()=>{const s=createState({playerArchetype:'Evoker',opponentArchetype:'Evoker',playerResources:{health:22}});play(s,'haste','guard');assert.equal(s.actors[0].hp,16);play(s,'strike','strike');assert.equal(s.actors[1].hp,5);assert.equal(s.actors[0].hp,0);const t=createState({playerArchetype:'Evoker',opponentArchetype:'Evoker',playerResources:{health:17}});play(t,'haste','guard');play(t,'strike','strike');assert.equal(t.result.outcome,'win');assert(t.actors[0].hp>0);});
test('Guard has no side spends and deterministic skill changes affect damage',()=>{const a=createState(),b=createState();b.actors[0].kit=structuredClone(b.actors[0].kit);b.actors[0].kit.skills.vigor+=10;play(a,'strike','guard');play(b,'strike','guard');assert(b.actors[1].hp<a.actors[1].hp);assert.equal(a.actors[1].resources.mood,a.actors[1].entry.mood);assert.equal(a.actors[0].resources.mana,a.actors[0].entry.mana);});

test('skill-only simulation shifts preserve kits, entry budgets and opposing skills; clipping is rejected',()=>{
  const config={playerLevel:50,opponentLevel:50,playerArchetype:'Evoker',opponentArchetype:'Restorer'};
  const base=adapter.create(config),shifted=adapter.create(config,{skillShift:5});
  for(const skill of Object.keys(base.actors[0].kit.skills))assert.equal(shifted.actors[0].kit.skills[skill],base.actors[0].kit.skills[skill]+5);
  assert.deepEqual(shifted.actors[1],base.actors[1]);
  for(const key of ['level','spells','capacity','draws'])assert.deepEqual(shifted.actors[0].kit[key],base.actors[0].kit[key]);
  for(const key of ['entry','resources','hp','maxHP'])assert.deepEqual(shifted.actors[0][key],base.actors[0][key]);
  assert.throws(()=>adapter.create({...config,playerLevel:20},{skillShift:-10}),/Skill shift clips/);
});
