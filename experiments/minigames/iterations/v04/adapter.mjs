import {createState,actorToMove,applyChoice,legalActions,cloneState,SPELLS,LOADOUTS,RULES_VERSION} from './engine.mjs';
export {RULES_VERSION};
import {chooseAIAction,greedyAction,moveValue,createSearchContext,COMPUTE_PROFILES} from './ai.mjs';
const searchContexts=new WeakMap();
export const id='v04',decisions=true,loadouts=Object.keys(LOADOUTS);
export function create(config,{skillShift=0,skillShiftSide=0,checkShift=0}={}){
  if(checkShift)throw Error('v04 has no probabilistic accuracy checks');
  const g=createState(config);if(skillShift){const a=g.actors[skillShiftSide];a.kit=structuredClone(a.kit);for(const k of Object.keys(a.kit.skills)){const n=a.kit.skills[k]+skillShift;if(n<1||n>100)throw Error('Skill shift clips');a.kit.skills[k]=n;}}
  g.history=[];g.searchStats=[];return g;
}
export {actorToMove};
export function observe(g){return structuredClone({...g,history:undefined,searchStats:undefined});}
export function choose(g,side,policy){
  if(actorToMove(g)!==side)throw Error('Wrong actor');
  if(policy==='alpha'){
  let contexts=searchContexts.get(g);if(!contexts){contexts=[];searchContexts.set(g,contexts);}
  const name=g.config.ai?.[side]?.computeProfile??g.config.search?.computeProfile??g.config.computeProfile,limit=COMPUTE_PROFILES[name]?.tableLimit??4096;
  if(!contexts[side]||contexts[side].tableLimit!==limit)contexts[side]=createSearchContext({tableLimit:limit});
  return chooseAIAction(g,{},contexts[side]);
 }
  if(policy==='greedy')return {id:greedyAction(g)};
  const actions=legalActions(g);if(actions.length===1)return {id:actions[0]};
  if(policy==='rush')return {id:actions.includes('strike')?'strike':actions[0]};
  if(policy==='defender'){
    const ready=g.actors[side].resources.mana,pending=g.pending[1-side];
    const choices=pending&&['strike','flame','hoarfrost','release'].includes(pending)?['ward','guard','shadowstep','strike']:g.actors[side].flux>=10?['reclaim','strike']:['strike','ward'];
    return {id:choices.find(id=>actions.includes(id))??actions[0]};
  }
  throw Error('Unknown v02 policy '+policy);
}
export function advance(g,decision){const d=typeof decision==='string'?{id:decision}:decision,beforeRound=g.round,side=actorToMove(g),r=applyChoice(g,d.id);
  if(d.nodes!==undefined)g.searchStats.push({side,round:beforeRound,...d});
  if(r.resolved)g.history.push({round:r.round,leader:r.leader,commands:r.pair,committed:r.committed,events:r.events,hp:g.actors.map(a=>a.hp),ready:g.actors.map(a=>a.resources.mana),flux:g.actors.map(a=>a.flux),result:g.result});return r;
}
export const ended=g=>!!g.result;
export function metrics(g){
  const outcomes=g.result?(g.result.winner===undefined?['draw','draw']:g.result.winner===0?['win','lose']:['lose','win']):[null,null];
  return {outcomes,rounds:g.history.length,timeout:false,terminationReason:g.result?.reason??null,initiativeTie:!!g.result?.tiebreak,noWinner:g.result?.outcome==='draw',ledgers:g.settlement,
    commands:g.history.map(r=>r.committed.map(id=>({id}))),executedCommands:g.history.map(r=>r.commands.map(id=>({id}))),searchStats:g.searchStats,result:g.result};
}
export function trace(g){return {rulesVersion:RULES_VERSION,config:g.config,rebates:g.rebates,kits:g.actors.map(a=>a.kit),log:g.history,result:g.result,settlement:g.settlement,searchStats:g.searchStats};}
