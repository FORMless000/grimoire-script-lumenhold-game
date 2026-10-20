import {actorToMove,applyChoice,cloneState,legalActions,attackPower,cost,has,wardBlock,SPELLS} from './engine.mjs';
export const DEFAULT_SEARCH={maxDepth:3,nodeBudget:5000}; // Depth counts resolved exchanges, not commitments.
const ABORT=Symbol('node budget');
const round=x=>Math.round(x*1000)/1000;
function influence(s,side){
  const a=s.actors[side];let v=0;
  for(const [k,e]of Object.entries(a.effects))if(e.until>=s.round)v+=({ward:.7,barricade:.3,decoy:.65,evasion:.65,rhythm:.35,foreAim:.5,attuneAim:.4,haste:6,presentation:3,connection:3,authority:3,quiet:1,materials:1}[k]??0)*e.value;
  v-=has(s,side,'suppressed')?a.effects.suppressed.value*.5:0;
  return v;
}
export function evaluate(s){
  const [a,b]=s.actors,liquidity=(a.resources.mana-b.resources.mana)*.10+(a.flux-b.flux)*.05;
  if(s.config.mode==='negotiation'){
    if(s.result)return s.result.outcome==='win'?10000:s.result.outcome==='lose'?-10000:0;
    const claimCredit=s.claims.reduce((n,c)=>n+c.credit,0);
    return s.agreement*15-s.suspicion*16-claimCredit*7+(s.agreement>=10?8:0)+liquidity+influence(s,0)-influence(s,1);
  }
  if(s.result?.winner!==undefined)return s.result.winner===0?10000:-10000;
  if(a.hp<=0||b.hp<=0)return a.hp<=0&&b.hp<=0?0:a.hp<=0?-10000:10000;
  const lead=a.hp/a.maxHP-b.hp/b.maxHP;
  // Symmetric utility: a timeout with no decisive lead is not an NPC victory.
  const terminal=s.result?(lead>=.25?5000:lead<=-.25?-5000:0):0;
  return terminal+lead*250+(a.hp-b.hp)*.5+liquidity+influence(s,0)-influence(s,1);
}
export function moveValue(s,side,id){
  const a=s.actors[side],b=(a.kit.spells[id]??1)-1,k=s.config.combatScale;
  if(id==='reclaim')return a.flux*.28-3;
  if(s.config.mode==='negotiation'){
    if(id==='strike')return side===0?5-(s.config.approach==='bluff'?s.suspicion*2:0):s.claims.length?12:5;
    if(id==='guard')return side===0?s.suspicion*2:0;
    if(id==='foresight')return 3;
    if(id==='glamour'||id==='attune')return 2;
    if(id==='shape'||id==='ward')return side===0&&s.round<=3&&!s.materialsSecured?2:0;
    if(id==='hush')return side===0&&s.round<=5?1:0;
    if(id==='flame'||id==='tide')return s.config.fixture==='formal_petition'?-1000:side===0&&!s.demonstrationUsed?4:0;
    if(id==='shadowstep')return -1000;
    return -1;
  }
  const damage=attackPower(s,side,id);if(damage)return damage-cost(s,side,id)*.12;
  if(id==='restoration')return Math.min(a.maxHP-a.hp,(6+b)*k)*.85-cost(s,side,id)*.12;
  return ({guard:4*k*.4,ward:wardBlock(s,side)*.6,shape:(8+b)*k*.3,glamour:(4+b)*k*.6,hush:(4+b)*k*.5,attune:(3+b)*k*.4,shadowstep:(3+b)*k*.6,foresight:9,haste:5}[id]??0)-cost(s,side,id)*.12;
}
function ordered(s){
  const side=actorToMove(s),actions=legalActions(s),kit=s.actors[side].kit;
  // Tiny level-seeded ordering breaks equal-valued choices reproducibly, without gameplay rolls.
  const tie=id=>{let n=kit.level*97+s.round;for(const c of id)n=(Math.imul(n,31)+c.charCodeAt(0))>>>0;return n%997;};
  return actions.sort((a,b)=>moveValue(s,side,b)-moveValue(s,side,a)||tie(a)-tie(b));
}
function key(s,depth){return JSON.stringify([depth,s.round,s.normalLeader,s.leader,s.pending,s.earlyCommit,s.agreement,s.patience,s.suspicion,s.claims,s.materialsSecured,s.demonstrationUsed,s.range,s.actors.map(a=>[round(a.hp),a.resources,round(a.flux),a.effects])]);}
export function searchAction(state,options={}){
  const {maxDepth,nodeBudget,rankActions=false}={...DEFAULT_SEARCH,...options};
  if(!Number.isInteger(maxDepth)||maxDepth<1||!Number.isInteger(nodeBudget)||nodeBudget<1)throw Error('Invalid search budget');
  const start=performance.now(),side=actorToMove(state),moves=ordered(state);if(!moves.length)throw Error('No legal decision');
  let nodes=0,cutoffs=0,hits=0,completedDepth=0,best=moves[0],value=evaluate(state),rankedActions=[];const table=new Map();
  function visit(s,depth,alpha,beta){
    if(++nodes>nodeBudget)throw ABORT;
    if(s.result||depth<=0)return evaluate(s);
    const cacheKey=key(s,depth),cached=table.get(cacheKey),originalAlpha=alpha,originalBeta=beta;
    if(cached){hits++;if(cached.flag==='exact')return cached.value;if(cached.flag==='lower')alpha=Math.max(alpha,cached.value);else beta=Math.min(beta,cached.value);if(alpha>=beta)return cached.value;}
    const who=actorToMove(s),max=who===0;let v=max?-Infinity:Infinity;
    for(const id of ordered(s)){
      const child=cloneState(s),result=applyChoice(child,id),score=visit(child,depth-Number(result.resolved),alpha,beta);
      v=max?Math.max(v,score):Math.min(v,score);if(max)alpha=Math.max(alpha,v);else beta=Math.min(beta,v);
      if(alpha>=beta){cutoffs++;break;}
    }
    table.set(cacheKey,{value:v,flag:v<=originalAlpha?'upper':v>=originalBeta?'lower':'exact'});return v;
  }
  // Retain only the last fully completed iteration; an interrupted tree has no reliable root value.
  for(let depth=1;depth<=maxDepth;depth++){
    let chosen=best,v=side===0?-Infinity:Infinity,alpha=-Infinity,beta=Infinity;const scores=[];
    try{
      const rootMoves=[best,...moves.filter(id=>id!==best)];
      // Shared root windows can return bounds for worse moves. Ranking needs exact
      // full-window scores before a supposedly small mistake can be called safe.
      for(const id of rootMoves){const child=cloneState(state),r=applyChoice(child,id),n=visit(child,depth-Number(r.resolved),rankActions?-Infinity:alpha,rankActions?Infinity:beta);scores.push({id,value:n});if(side===0?n>v:n<v){v=n;chosen=id;}if(side===0)alpha=Math.max(alpha,v);else beta=Math.min(beta,v);}
      best=chosen;value=v;completedDepth=depth;rankedActions=scores;
    }catch(e){if(e!==ABORT)throw e;break;}
  }
  return {id:best,value,completedDepth,nodes:Math.min(nodes,nodeBudget),cutoffs,cacheHits:hits,elapsedMs:performance.now()-start,planning:false,...(rankActions?{rankedActions}: {})};
}
// Unpruned reference is intentionally limited to tiny validation trees.
export function exhaustiveValue(s,depth){if(s.result||depth<=0)return evaluate(s);const values=legalActions(s).map(id=>{const c=cloneState(s),r=applyChoice(c,id);return exhaustiveValue(c,depth-Number(r.resolved));});return actorToMove(s)===0?Math.max(...values):Math.min(...values);}
export function greedyAction(s){const side=actorToMove(s);let best=ordered(s)[0],value=side===0?-Infinity:Infinity;
  for(const id of legalActions(s)){const c=cloneState(s);applyChoice(c,id);const n=c.lastPair!==s.lastPair?evaluate(c):moveValue(s,side,id)*(side===0?1:-1);if(side===0?n>value:n<value){best=id;value=n;}}return best;
}

export const AI_PROFILES={
  full:{maxDepth:3,mistakeChance:0},
  shallow:{maxDepth:1,mistakeChance:0},
  fallible:{maxDepth:3,mistakeChance:.30},
  shallow_fallible:{maxDepth:1,mistakeChance:.30}
};
// Stateless policy draws: previewing/searching never advances a random stream.
// Round and actor identify an actual decision; slots are
// independent draws for attempting a mistake and selecting its candidate.
function policyDraw(seed,s,slot){
  const side=actorToMove(s),phase=0;
  let n=(seed^Math.imul(s.round,0x9e3779b9)^Math.imul(side+1,0x85ebca6b)^Math.imul(phase+1,0xc2b2ae35)^Math.imul(slot+1,0x27d4eb2f))>>>0;
  n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);
  return ((n^(n>>>16))>>>0)/4294967296;
}
export function plausibleMistake(s,id){
  const side=actorToMove(s),a=s.actors[side],actionRound=s.round,incoming=s.pending[1-side];
  if(id==='reclaim'&&a.flux<=1e-9)return false;
  if(id==='foresight'&&actionRound>=8)return false;
  if(id==='haste'&&actionRound>=8)return false;
  if(s.config.mode==='combat'){
    if(id==='haste'&&a.hp<=2*s.config.combatScale)return false;
    if(id==='restoration'&&a.hp>=a.maxHP)return false;
    if(id==='guard'&&['flame','tide','starlight'].includes(incoming))return false;
  }else{
    const workshop=s.config.fixture==='workshop_request';
    if(id==='shadowstep'||id==='guard'&&side===1)return false;
    if(['flame','tide'].includes(id)&&(!workshop||side===1||s.demonstrationUsed))return false;
    if(id==='restoration'&&(side===0?(!workshop||s.demonstrationUsed):a.resources.health>=a.entry.health))return false;
    if(['shape','ward','hush','attune'].includes(id)&&!workshop)return false;
    if(['shape','ward','hush'].includes(id)&&side===1)return false;
    if(['shape','ward'].includes(id)&&(s.materialsSecured||actionRound>3))return false;
    if(id==='ward'&&actionRound<2)return false;
    if(id==='hush'&&(actionRound<4||actionRound>5))return false;
    if(id==='glamour'&&(side===0?(s.config.approach==='reason'||s.suspicion>=5):s.config.approach!=='appeal'))return false;
    if(id==='starlight'&&!has(s,1-side,side===0?'authority':'presentation'))return false;
  }
  // A visible responder must not immediately defeat itself as a random error.
  if(incoming!==null){const c=cloneState(s);applyChoice(c,id);
    if(c.result){const lost=s.config.mode==='combat'?(c.result.winner!==undefined?c.result.winner!==side:c.actors[side].hp<=0):side===0?c.result.outcome==='lose':c.result.outcome==='win';if(lost)return false;}}
  return true;
}
export function chooseAIAction(state,overrides={}){
  const start=performance.now(),side=actorToMove(state),settings=state.config.ai?.[side]??{};
  const profile=overrides.profile??settings.profile;
  if(profile!==undefined&&!AI_PROFILES[profile])throw Error('Unknown AI profile');
  const options={...DEFAULT_SEARCH,mistakeChance:0,maxRegret:35,...state.config.search,...(AI_PROFILES[profile]??{}),...settings,...overrides};
  const {mistakeChance,maxRegret,nodeBudget}=options,seed=options.seed??state.actors[side].kit.level;
  if(!Number.isFinite(mistakeChance)||mistakeChance<0||mistakeChance>1||!Number.isFinite(maxRegret)||maxRegret<0||!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid AI degradation settings');
  const best=searchAction(state,options),result={...best,bestId:best.id,degraded:false,mistakeAttempted:false,regret:0,eligible:0,rankingDepth:0,rankingNodes:0,totalNodes:best.nodes,seed,mistakeChance,maxDepth:options.maxDepth};
  if(mistakeChance===0||legalActions(state).length<2)return result;
  const roll=policyDraw(seed,state,0);result.mistakeRoll=roll;
  if(roll>=mistakeChance)return result;
  result.mistakeAttempted=true;
  if(best.completedDepth===0){result.degradationSkipped='no completed search';return result;}
  const ranked=searchAction(state,{maxDepth:best.completedDepth,nodeBudget,rankActions:true});
  result.rankingDepth=ranked.completedDepth;result.rankingNodes=ranked.nodes;result.totalNodes+=ranked.nodes;
  result.elapsedMs=performance.now()-start;
  if(ranked.completedDepth!==best.completedDepth){result.degradationSkipped='ranking budget';return result;}
  const sign=side===0?1:-1,bestUtility=sign*ranked.value;
  if(Math.abs(bestUtility-sign*best.value)>1e-6){result.degradationSkipped='ranking disagreement';return result;}
  const alternatives=ranked.rankedActions.map(a=>({...a,regret:bestUtility-sign*a.value})).filter(a=>a.id!==best.id&&a.regret>1e-6&&a.regret<=maxRegret&&plausibleMistake(state,a.id));
  result.eligible=alternatives.length;
  if(!alternatives.length){result.degradationSkipped='no plausible weaker move';return result;}
  const selected=alternatives[Math.floor(policyDraw(seed,state,1)*alternatives.length)];
  return {...result,id:selected.id,value:selected.value,degraded:true,regret:selected.regret,elapsedMs:performance.now()-start};
}
