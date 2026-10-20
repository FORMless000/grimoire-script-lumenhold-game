import {ECONOMY} from './roster.mjs';
import {actorToMove,applyChoice,cloneState,legalActions,attackPower,cost,has,actionParts,amount,damagePower,healingPower,SPELLS} from './engine.mjs';
export const DEFAULT_SEARCH={maxDepth:3,nodeBudget:5000}; // Depth counts resolved exchanges, not commitments.
const ABORT=Symbol('node budget');
// Values are in HP units. Only some stored Mana can be spent within the short
// horizon; discount inventory rather than confusing it with permanent MP burn.
function influence(s,side){
 const a=s.actors[side];let value=0;
 if(has(s,side,'shadowstep'))value+=6;
 if(has(s,side,'haste'))value+=12;
 if(has(s,side,'tailwind')){const remaining=Math.max(0,a.effects.tailwind.until-s.round+1),start=a.effects.tailwind.value;for(let i=0;i<remaining;i++)value+=amount(s,side,'tailwind',ECONOMY.spells.tailwind.strikeBonuses[Math.min(2,start+i)])*.35;}
 if(has(s,side,'brace'))value+=a.effects.brace.value*.6;
 if(a.effects.lodestar)value+=Math.min(a.effects.lodestar.value,30)*.5;
 if(has(s,side,'heartprice'))value+=3;
 if(a.rimeReady&&!a.rimeUsed)value+=6;
 value+=s.earlyCommit[1-side]*1.5;
 for(const c of a.constructs){const ticks=Math.max(0,(c.expires??s.round+1)-s.round+1);value+=(c.power*(c.id==='animate'?.55:.8)+c.reduction)*ticks*Math.max(.15,1-c.taken/c.threshold);}
 for(const o of a.omens)value+=o.power*.5/Math.max(1,o.due-s.round+1);
 if(a.channel){const c=a.channel;value+=(c.id==='moonwell'?Math.min(c.bank,a.kit.capacity-a.resources.mana)*.6:c.id==='lodestar'?Math.min(c.bank+ECONOMY.spells.lodestar.initialAbsorb,40)*.35:0)+c.total*.6+(c.id==='starlight'&&c.holds?8:0);}
 return value;
}
export function evaluate(s){
 if(s.result)return s.result.winner===0?10000:s.result.winner===1?-10000:0;
 const [a,b]=s.actors,lead=a.hp/a.maxHP-b.hp/b.maxHP;
 const inventory=a=>Math.min(36,a.resources.mana)*.6+Math.max(0,a.resources.mana-36)*.15+Math.min(24,a.flux)*.35+Math.max(0,a.flux-24)*.08;
 return lead*18+(a.hp-b.hp)+inventory(a)-inventory(b)+
  (a.resources.crowns-b.resources.crowns)*.1+(a.pendingRenown-b.pendingRenown)*.2+influence(s,0)-influence(s,1);
}
export function moveValue(s,side,id){
 const a=s.actors[side],other=s.actors[1-side],incoming=s.pending[1-side];
 if(id.startsWith('bundle:'))return actionParts(id).reduce((sum,part)=>sum+moveValue(s,side,part),0);
 if(id==='strike')return attackPower(s,side,id);
 if(id==='guard')return incoming&&actionParts(incoming).includes('strike')?25:incoming?5:1;
 if(id==='reclaim')return a.flux*.28-3;
 if(id==='frozen')return 0;
 if(id==='hold')return ({moonwell:6,lodestar:5,starlight:a.channel.holds?0:15,wildfire:damagePower(s,side,'wildfire',ECONOMY.spells.wildfire.holdDamage),siphon:damagePower(s,side,'siphon',ECONOMY.spells.siphon.damagePerHold)}[a.channel.id]??0);
 if(id==='release')return ({moonwell:Math.min(a.channel.bank,a.kit.capacity-a.resources.mana)*.3,lodestar:a.channel.bank*.5,starlight:damagePower(s,side,'starlight',a.channel.holds?ECONOMY.spells.starlight.releaseDamageAfterHold:ECONOMY.spells.starlight.releaseDamage),wildfire:damagePower(s,side,'wildfire',ECONOMY.spells.wildfire.releaseDamage),siphon:Math.min(a.channel.total,a.maxHP-a.hp)*.85}[a.channel.id]??0);
 const attack=attackPower(s,side,id);if(attack)return attack-cost(s,side,id)*.12;
 if(id==='mend')return Math.min(a.maxHP-a.hp,healingPower(s,side,id,ECONOMY.spells.mend.damageEquivalentBudgets[a.kit.spells[id]-1]))*.9-cost(s,side,id)*.12;
 if(id==='purify')return Math.min(Math.floor(amount(s,side,id,ECONOMY.spells.purify.manaGain,false)),a.kit.capacity-a.resources.mana)*.3-amount(s,side,id,ECONOMY.spells.purify.hpCost)*.65;
 return ({ward:incoming?25:3,brace:incoming?27:9,shadowstep:incoming?23:8,foresight:7,haste:10,animate:12,heartwood:12,bramble:11,contraption:17,omen:damagePower(s,side,id,ECONOMY.spells.omen.damage)*.4,starlight:15,wildfire:14,siphon:13,moonwell:2,lodestar:3,rime:a.hp<a.maxHP*.5?10:3,reflect:incoming?21:1,seal:other.flux*.3,extraction:Math.min(other.resources.mana,a.kit.capacity-a.resources.mana)*.4,torment:13,compel:10,eclipse:incoming?7:0,heartprice:a.resources.mana<10?6:-3,tailwind:8,glamour:s.config.observers?2:-2,rapport:s.config.observers&&a.resources.crowns>=2?1:-3,sleight:other.resources.crowns>0?1:-2}[id]??-3)-cost(s,side,id)*.12;
}
function ordered(s){
  const side=actorToMove(s),actions=legalActions(s),kit=s.actors[side].kit;
  // Tiny level-seeded ordering breaks equal-valued choices reproducibly, without gameplay rolls.
  const tie=id=>{let n=kit.level*97+s.round;for(const c of id)n=(Math.imul(n,31)+c.charCodeAt(0))>>>0;return n%997;};
  return actions.sort((a,b)=>moveValue(s,side,b)-moveValue(s,side,a)||tie(a)-tie(b));
}
function key(s,depth){return JSON.stringify([depth,s.round,s.normalLeader,s.leader,s.pending,s.earlyCommit,s.actors.map(a=>[a.hp,a.resources,a.flux,a.effects,a.channel,a.constructs,a.omens,a.lastAction,a.rimeReady,a.rimeUsed,a.freezeUntil,a.pendingRenown,a.glamourAwarded,a.rapportCrowns])]);}
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
 const side=actorToMove(s),a=s.actors[side],other=s.actors[1-side];
 if(['candour','quickquill','index','toll'].includes(id))return false;
 if(id==='reclaim'&&a.flux<=1e-9)return false;
 if(id==='mend'&&a.hp>=a.maxHP)return false;
 if(id==='seal'&&other.flux<=1e-9)return false;
 if(id==='extraction'&&(other.resources.mana<=0||a.resources.mana>=a.kit.capacity))return false;
 if(id==='glamour'&&(!s.config.observers||a.glamourAwarded>=SPELLS.glamour.renown[a.kit.spells.glamour-1]))return false;
 if(id==='rapport'&&(!s.config.observers||a.resources.crowns<2||a.rapportCrowns>=ECONOMY.spells.rapport.maxCrownsPerFight))return false;
 if(id==='sleight'&&other.resources.crowns<=0)return false;
 if(id==='rime'&&(a.rimeUsed||a.rimeReady))return false;
 if(id==='heartprice'&&has(s,side,'heartprice'))return false;
 if(id==='purify'&&(a.resources.mana>=a.kit.capacity||a.hp<=amount(s,side,id,ECONOMY.spells.purify.hpCost)))return false;
 if(id==='release'&&a.channel?.id==='moonwell'&&a.channel.bank===0)return false;
 if(s.pending[1-side]!==null){const child=cloneState(s);applyChoice(child,id);if(child.result?.winner===1-side)return false;}
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
