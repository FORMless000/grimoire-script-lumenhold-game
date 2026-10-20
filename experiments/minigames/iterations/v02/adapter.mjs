import {createState,actorToMove,applyChoice,legalActions,cloneState,SPELLS,ARCHETYPES,RULES_VERSION} from './engine.mjs';
export {RULES_VERSION};
import {chooseAIAction,greedyAction,moveValue} from './ai.mjs';
export const id='v02',decisions=true,archetypes=Object.keys(ARCHETYPES);
export function create(config,{skillShift=0,skillShiftSide=0,checkShift=0}={}){
  if(checkShift)throw Error('v02 has no probabilistic accuracy checks');
  const g=createState(config);if(skillShift){const a=g.actors[skillShiftSide];a.kit=structuredClone(a.kit);for(const k of Object.keys(a.kit.skills)){const n=a.kit.skills[k]+skillShift;if(n<1||n>100)throw Error('Skill shift clips');a.kit.skills[k]=n;}}
  g.history=[];g.searchStats=[];return g;
}
export {actorToMove};
export function observe(g){return structuredClone({...g,history:undefined,searchStats:undefined});}
export function choose(g,side,policy){
  if(actorToMove(g)!==side)throw Error('Wrong actor');
  if(policy==='alpha')return chooseAIAction(g);
  if(policy==='greedy')return {id:greedyAction(g)};
  const actions=legalActions(g);if(actions.length===1)return {id:actions[0]};
  if(policy==='rush')return {id:actions.includes('strike')?'strike':actions[0]};
  if(policy==='defender'){
    const ready=g.actors[side].resources.mana,pending=g.pending[1-side];
    const choices=pending&&['strike','flame','tide','starlight'].includes(pending)?['ward','guard','glamour','strike']:g.actors[side].flux>=10?['reclaim','strike']:['strike','ward'];
    return {id:choices.find(id=>actions.includes(id))??actions[0]};
  }
  throw Error('Unknown v02 policy '+policy);
}
export function advance(g,decision){const d=typeof decision==='string'?{id:decision}:decision,beforeRound=g.round,side=actorToMove(g),r=applyChoice(g,d.id);
  if(d.nodes!==undefined)g.searchStats.push({side,round:beforeRound,...d});
  if(r.resolved)g.history.push({round:r.round,leader:r.leader,commands:r.pair,events:r.events,hp:g.actors.map(a=>a.hp),ready:g.actors.map(a=>a.resources.mana),flux:g.actors.map(a=>a.flux),result:g.result});return r;
}
export const ended=g=>!!g.result;
export function metrics(g){
  let other;
  if(g.result.winner!==undefined)other=g.result.winner===1?'win':'lose';
  else if(g.config.mode==='negotiation')other=g.result.outcome==='win'?'lose':g.result.outcome==='lose'?'win':'partial';
  else {const [p,o]=g.actors,lead=o.hp/o.maxHP-p.hp/p.maxHP;other=p.hp<=0||o.hp<=0?(o.hp>0?'win':p.hp>0?'lose':'partial'):lead>=.25?'win':lead>-.25&&p.hp<=.75*p.maxHP?'partial':'lose';}
  return {outcomes:[g.result.outcome,other],rounds:g.history.length,timeout:g.result.reason==='eight-exchange limit',terminationReason:g.result.reason,initiativeTie:!!g.result.tiebreak,noWinner:g.result.outcome==='lose'&&other==='lose',ledgers:g.settlement,commands:g.history.map(r=>r.commands.map(id=>({id}))),searchStats:g.searchStats};
}
export function trace(g){return {rulesVersion:RULES_VERSION,config:g.config,rebates:g.rebates,kits:g.actors.map(a=>a.kit),log:g.history,result:g.result,settlement:g.settlement,searchStats:g.searchStats};}
