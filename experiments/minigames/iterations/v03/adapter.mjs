import {createState,applyAction,publicState,legalActions,SPELLS} from './engine.mjs';
import {searchAction,greedyAction} from './ai.mjs';
export const id='v03-negotiation-pressure',decisions=true,archetypes=['Balanced','Evoker','Seer','Restorer','Illusionist','Envoy','Warden'];
export function create(config,{episodeSeed,skillShift=0,skillShiftSide=0,checkShift=0}={}){
 if(checkShift||skillShiftSide)throw Error('Unsupported adjustment');
 const s=createState({...config,...(episodeSeed===undefined?{}:{seed:episodeSeed})});
 if(skillShift){s.kit=structuredClone(s.kit);for(const k of Object.keys(s.kit.skills)){const v=s.kit.skills[k]+skillShift;if(v<1||v>100)throw Error('Skill shift clips');s.kit.skills[k]=v;}}
 s.searchStats=[];return s;
}
export const actorToMove=s=>s.result?null:0;
export const ended=s=>!!s.result;
export function choose(s,side,policy){
 if(side!==0)throw Error('Only the player searches');const legal=legalActions(s);
 if(policy==='search')return searchAction(publicState(s),s.config.search);
 if(policy==='greedy')return {id:greedyAction(publicState(s))};
 if(policy==='confront'||policy==='reason')return {id:legal.includes('confront')?'confront':'withdraw'};
 if(policy==='rhythm')return {id:legal.includes(s.pressure>=2?'deflect':'confront')?(s.pressure>=2?'deflect':'confront'):'withdraw'};
 throw Error('Unknown policy: '+policy);
}
export function advance(s,d){const stats=s.searchStats,round=s.round;applyAction(s,d.id);s.searchStats=stats;if(d.nodes!==undefined)s.searchStats.push({...d,round});}
export function metrics(s){return {outcomes:[s.result.outcome,s.result.outcome==='win'?'lose':s.result.outcome==='lose'?'win':'partial'],rounds:s.history.filter(h=>!SPELLS[h.action]).length,timeout:s.result.reason==='Patience ran out',noWinner:false,ledgers:[s.settlement],commands:s.history.map(h=>[{id:h.action},{id:h.intent}]),searchStats:s.searchStats,terminationReason:s.result.reason,history:s.history};}
export const trace=s=>({config:s.config,kit:s.kit,history:s.history,result:s.result,settlement:s.settlement,searchStats:s.searchStats});
