import test from 'node:test';import assert from 'node:assert/strict';
import {createState,cloneState,applyChoice,actorToMove,legalActions,cost,wardBlock} from './engine.mjs';
import {searchAction,chooseAIAction,plausibleMistake,exhaustiveValue} from './ai.mjs';
import * as adapter from './adapter.mjs';import {runMatch} from '../../harness.mjs';
const stable=({elapsedMs,...r})=>r;
test('ranked root alternatives are exact minimax values for both decision owners',()=>{
 for(const firstLeader of [0,1]){const s=createState({firstLeader,playerResources:{mana:0},opponentResources:{mana:0}}),r=searchAction(s,{maxDepth:2,nodeBudget:100000,rankActions:true});assert.equal(r.completedDepth,2);
  for(const action of r.rankedActions){const c=cloneState(s),step=applyChoice(c,action.id);assert.equal(action.value,exhaustiveValue(c,2-Number(step.resolved)));}
 }
});
test('zero mistake chance preserves normal search and depth can be lowered independently',()=>{
 const s=createState(),normal=searchAction(s,{maxDepth:2}),full=chooseAIAction(s,{maxDepth:2,mistakeChance:0,seed:7});
 for(const key of ['id','value','nodes','completedDepth'])assert.equal(full[key],normal[key]);
 const shallow=chooseAIAction(s,{profile:'shallow',seed:7});assert.equal(shallow.completedDepth,1);assert.equal(shallow.mistakeChance,0);
});
test('seeded mistakes are reproducible, strictly bounded, legal and do not mutate state',()=>{
 const s=createState({playerArchetype:'Warden',opponentArchetype:'Evoker'}),before=JSON.stringify(s),options={maxDepth:2,mistakeChance:1,maxRegret:35,seed:77};
 const a=chooseAIAction(s,options),b=chooseAIAction(s,options);assert.deepEqual(stable(a),stable(b));assert.equal(JSON.stringify(s),before);
 assert(a.degraded);assert(a.regret>0&&a.regret<=35);assert.notEqual(a.id,a.bestId);assert(legalActions(s).includes(a.id));assert(plausibleMistake(s,a.id));assert.equal(a.rankingDepth,a.completedDepth);assert(a.totalNodes<=10000);
});
test('obvious waste, hostile social casts, paid exits and visible immediate defeats are excluded',()=>{
 const s=createState({mode:'negotiation',spellAccess:'all',fixture:'formal_petition',firstLeader:0});
 for(const id of ['flame','tide','shadowstep','reclaim','ward','shape','hush','attune'])assert.equal(plausibleMistake(s,id),false,id);
 const audience=createState({mode:'negotiation',spellAccess:'all',firstLeader:1});assert.equal(plausibleMistake(audience,'guard'),false);assert.equal(plausibleMistake(audience,'restoration'),false);
 const combat=createState({playerArchetype:'Warden',opponentArchetype:'Evoker',playerResources:{health:10},firstLeader:1});applyChoice(combat,'flame');assert.equal(plausibleMistake(combat,'strike'),false);assert.equal(plausibleMistake(combat,'guard'),false);assert.equal(plausibleMistake(combat,'ward'),true);
 const healthy=createState({playerArchetype:'Restorer',firstLeader:0});assert.equal(plausibleMistake(healthy,'restoration'),false);
});
test('early commitment leaves choices free, and insufficient budget declines a mistake',()=>{
 const s=createState({playerArchetype:'Seer',opponentArchetype:'Seer',firstLeader:0});
 applyChoice(s,'foresight');applyChoice(s,'guard');assert.equal(actorToMove(s),1);assert(legalActions(s).length>3);
 const before=JSON.stringify(s),a=chooseAIAction(s,{mistakeChance:1,seed:1});assert(legalActions(s).includes(a.id));assert.equal(JSON.stringify(s),before);
 const constrained=chooseAIAction(createState(),{mistakeChance:1,nodeBudget:1,seed:2});assert.equal(constrained.degraded,false);assert.equal(constrained.completedDepth,0);
});
test('AI seeds vary policy decisions while leaving level-seeded kits and bounded ledgers intact',()=>{
 const commands=[];
 for(const seed of [1,2,3,4]){const config={playerArchetype:'Warden',opponentArchetype:'Evoker',ai:[{profile:'fallible',seed},{profile:'shallow_fallible',seed}]};
  const a=runMatch(adapter,{config,leftPolicy:'alpha',rightPolicy:'alpha'}),b=runMatch(adapter,{config,leftPolicy:'alpha',rightPolicy:'alpha'});assert.deepEqual(a.commands,b.commands);assert.deepEqual(a.ledgers,b.ledgers);commands.push(JSON.stringify(a.commands));
  for(const ledger of a.ledgers)for(const r of Object.values(ledger))assert(r.final>=0&&r.final<=r.entry);
  assert.deepEqual(adapter.create(config).actors.map(a=>a.kit),adapter.create({...config,ai:undefined}).actors.map(a=>a.kit));
 }
 assert(new Set(commands).size>1);
});
test('Ward is cheaper and blocks the new rank-scaled amount without changing flux accounting',()=>{
 for(const [i,level]of [20,50,80].entries()){const s=createState({playerArchetype:'Warden',opponentArchetype:'Evoker',playerLevel:level,opponentLevel:level,firstLeader:1});
  assert.equal(cost(s,0,'ward'),[20,16,12][i]);assert.equal(wardBlock(s,0),[30,36,42][i]);const mana=s.actors[0].resources.mana,hp=s.actors[0].hp;
  applyChoice(s,'flame');applyChoice(s,'ward');assert.equal(s.actors[0].hp,hp);assert.equal(s.actors[0].resources.mana,mana-[20,16,12][i]);assert.equal(s.actors[0].flux,.8*[20,16,12][i]);
 }
});
