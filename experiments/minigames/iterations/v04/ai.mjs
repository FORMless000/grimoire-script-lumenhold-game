import {ECONOMY} from './roster.mjs';
import {actorToMove,applyChoice,applySearchChoice,compileSearchKits,cloneState,legalActions,attackPower,cost,has,actionParts,amount,damagePower,healingPower,SPELLS} from './engine.mjs';
import {searchChild} from './search-state.mjs';
import {createSearchContext,prepareSearchContext,searchPositionKey,probeSearchCache,storeSearchCache} from './search-cache.mjs';
export {createSearchContext};
export const POLICY_VERSION='alpha-beta-2';
export const COMPUTE_PROFILES={
 live_fast:{budgetMs:100,maxDepth:8,nodeBudget:1000000,tableLimit:4096,horizonMode:'tactical'},
 live_deep:{budgetMs:500,maxDepth:8,nodeBudget:5000000,tableLimit:16384,horizonMode:'tactical'},
 analyst:{maxDepth:6,nodeBudget:200000,tableLimit:65536,horizonMode:'tactical'}
};
export const DEFAULT_SEARCH={maxDepth:3,nodeBudget:5000,horizonMode:'fixed'}; // Depth counts resolved exchanges, not commitments.
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
function moveTie(s,id){let n=s.actors[actorToMove(s)].kit.level*97+s.round;for(const c of id)n=(Math.imul(n,31)+c.charCodeAt(0))>>>0;return n%997;}
function ordered(s,actions=legalActions(s),context=null,preferred=null,ply=0,stats=null){
 const side=actorToMove(s),killers=context?.killers[ply]??[];
 const rows=actions.map((id,index)=>{if(stats)stats.orderingEvaluations++;return {id,index,score:moveValue(s,side,id),tie:moveTie(s,id),preferred:Number(id===preferred),killer:killers.includes(id)?2-killers.indexOf(id):0,history:context?.history.get(side+':'+id)??0};});
 rows.sort((a,b)=>b.preferred-a.preferred||b.killer-a.killer||b.history-a.history||b.score-a.score||a.tie-b.tie||a.index-b.index);return rows.map(r=>r.id);
}
export function tacticalThreat(s){return s.actors.some(a=>a.channel||a.omens.some(o=>o.due===s.round)||a.constructs.some(c=>c.expires===s.round));}
// Adjacent representable scores make PVS windows valid for this floating-point evaluator.
const scoreBits=new DataView(new ArrayBuffer(8));
export function nextSearchScore(x,direction=1){
 if(Number.isNaN(x)||x===(direction>0?Infinity:-Infinity))return x;
 if(x===0)return direction>0?Number.MIN_VALUE:-Number.MIN_VALUE;
 scoreBits.setFloat64(0,x);let hi=scoreBits.getUint32(0),lo=scoreBits.getUint32(4);
 if((x>0)===(direction>0)){lo=(lo+1)>>>0;if(lo===0)hi=(hi+1)>>>0;}else{if(lo===0)hi=(hi-1)>>>0;lo=(lo-1)>>>0;}
 scoreBits.setUint32(0,hi);scoreBits.setUint32(4,lo);return scoreBits.getFloat64(0);
}
export function searchAction(state,options={},suppliedContext){
 const {maxDepth,nodeBudget,rankActions=false,horizonMode='fixed',pvs=true,aspiration=true,now=()=>performance.now()}={...DEFAULT_SEARCH,...options};
 if(!Number.isInteger(maxDepth)||maxDepth<1||!Number.isInteger(nodeBudget)||nodeBudget<1||!['fixed','tactical'].includes(horizonMode)||(options.budgetMs!==undefined&&(!Number.isFinite(options.budgetMs)||options.budgetMs<0)))throw Error('Invalid search budget');
 const start=now(),deadline=options.deadline??(options.budgetMs===undefined?Infinity:start+options.budgetMs),context=prepareSearchContext(suppliedContext??createSearchContext({tableLimit:options.tableLimit??4096}),state,POLICY_VERSION);
 context.searchKits??=compileSearchKits({...state,searchKits:undefined});
 const root={...state,searching:true,searchKits:context.searchKits},side=actorToMove(root);
 let nodes=0,cutoffs=0,hits=0,completedDepth=0,stoppingReason='depth',extensionNodes=0,extensions=0,pvsResearches=0,aspirationResearches=0;
 const stats={legalGenerations:1,stateCopies:0,commitmentViews:0,orderingEvaluations:0};
 const rootPosition=searchPositionKey(context,root),rootEntry=probeSearchCache(context,rootPosition);
 const moves=ordered(root,legalActions(root),context,rootEntry?.bestId,0,stats);if(!moves.length)throw Error('No legal decision');
 let best=moves[0],value=evaluate(root),rankedActions=[];
 function check(){if(nodes>=nodeBudget){stoppingReason='nodes';throw ABORT;}if(deadline!==Infinity&&now()>=deadline){stoppingReason='deadline';throw ABORT;}}
 function childScore(s,id,depth,extension,alpha,beta,ply,inExtension){
  check();const child=searchChild(s,ply,context,stats),r=applySearchChoice(child,id);return visit(child,depth-Number(r.resolved),extension,alpha,beta,ply+1,inExtension);
 }
 function visit(s,depth,extension,alpha,beta,ply,inExtension){
  check();nodes++;if(inExtension)extensionNodes++;
  if(s.result)return evaluate(s);
  if(depth<=0){if(horizonMode==='tactical'&&extension&&tacticalThreat(s)){depth=1;extension=0;inExtension=true;extensions++;}else return evaluate(s);}
  const position=searchPositionKey(context,s),entry=probeSearchCache(context,position),horizon=depth+':'+extension+':'+horizonMode,cached=entry?.scores.get(horizon),originalAlpha=alpha,originalBeta=beta;
  if(cached){hits++;if(cached.flag==='exact')return cached.value;if(cached.flag==='lower')alpha=Math.max(alpha,cached.value);else beta=Math.min(beta,cached.value);if(alpha>=beta)return cached.value;}
  const who=actorToMove(s),max=who===0;let v=max?-Infinity:Infinity,bestId=null;
  stats.legalGenerations++;const actions=ordered(s,legalActions(s),context,entry?.bestId,ply,stats);
  for(let i=0;i<actions.length;i++){
   const id=actions[i];let score;
   if(pvs&&i>0&&Number.isFinite(max?alpha:beta)){
    score=childScore(s,id,depth,extension,max?alpha:nextSearchScore(beta,-1),max?nextSearchScore(alpha):beta,ply,inExtension);
    if(score>alpha&&score<beta){pvsResearches++;score=childScore(s,id,depth,extension,alpha,beta,ply,inExtension);}
   }else score=childScore(s,id,depth,extension,alpha,beta,ply,inExtension);
   if(bestId===null||(max?score>v:score<v)){v=score;bestId=id;}
   if(max)alpha=Math.max(alpha,v);else beta=Math.min(beta,v);
   if(alpha>=beta){cutoffs++;context.history.set(who+':'+id,Math.min(1000000,(context.history.get(who+':'+id)??0)+depth*depth));const k=context.killers[ply]??[];context.killers[ply]=[id,...k.filter(x=>x!==id)].slice(0,2);break;}
  }
  storeSearchCache(context,position,{horizon,depth,bestId,value:v,flag:v<=originalAlpha?'upper':v>=originalBeta?'lower':'exact'});return v;
 }
 function iteration(depth,low,high){
  let chosen=best,v=side===0?-Infinity:Infinity,alpha=low,beta=high;const scores=[];
  for(const id of [best,...moves.filter(id=>id!==best)]){
   const n=childScore(root,id,depth,1,rankActions?-Infinity:alpha,rankActions?Infinity:beta,0,false);scores.push({id,value:n});
   if(side===0?n>v:n<v){v=n;chosen=id;}
   if(side===0)alpha=Math.max(alpha,v);else beta=Math.min(beta,v);if(!rankActions&&alpha>=beta)break;
  }
  return {chosen,v,scores};
 }
 for(let depth=1;depth<=maxDepth;depth++){
  try{
   let low=-Infinity,high=Infinity,width=8,r;
   if(aspiration&&!rankActions&&completedDepth){low=value-width;high=value+width;}
   for(;;){r=iteration(depth,low,high);if(r.v>low&&r.v<high)break;aspirationResearches++;width*=4;if(width>=32768){low=-Infinity;high=Infinity;}else{low=value-width;high=value+width;}}
   best=r.chosen;value=r.v;rankedActions=r.scores;completedDepth=depth;
   storeSearchCache(context,rootPosition,{horizon:depth+':1:'+horizonMode,depth,bestId:best,value,flag:'exact'});
  }catch(e){if(e!==ABORT)throw e;break;}
 }
 return {id:best,value,completedDepth,nodes,cutoffs,cacheHits:hits,elapsedMs:now()-start,planning:false,stoppingReason,horizonMode,extensionNodes,extensions,pvsResearches,aspirationResearches,policyVersion:POLICY_VERSION,tableEntries:context.size,tableLimit:context.tableLimit,...stats,...(rankActions?{rankedActions}:{})};
}
// Deliberately unpruned, small-tree reference, including the same one-exchange horizon rule.
export function exhaustiveValue(s,depth,options={}){
 const horizonMode=options.horizonMode??'fixed',extension=options.extension??1;
 if(s.result)return evaluate(s);
 if(depth<=0){if(horizonMode==='tactical'&&extension&&tacticalThreat(s)){depth=1;options={...options,extension:0};}else return evaluate(s);}
 const values=legalActions(s).map(id=>{const c=cloneState(s),r=applyChoice(c,id);return exhaustiveValue(c,depth-Number(r.resolved),options);});return actorToMove(s)===0?Math.max(...values):Math.min(...values);
}
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
export function chooseAIAction(state,overrides={},context){
 const now=overrides.now??(()=>performance.now()),start=now(),side=actorToMove(state),settings=state.config.ai?.[side]??{},profile=overrides.profile??settings.profile;
 if(profile!==undefined&&!AI_PROFILES[profile])throw Error('Unknown AI profile');
 const computeProfile=overrides.computeProfile??settings.computeProfile??state.config.search?.computeProfile??state.config.computeProfile;
 if(computeProfile!==undefined&&!COMPUTE_PROFILES[computeProfile])throw Error('Unknown compute profile');
 const behavior={...(AI_PROFILES[profile]??{})};if(computeProfile&&['full','fallible'].includes(profile))delete behavior.maxDepth;
 const options={...DEFAULT_SEARCH,mistakeChance:0,maxRegret:35,...(COMPUTE_PROFILES[computeProfile]??{}),...state.config.search,...behavior,...settings,...overrides,now};
 if(options.budgetMs!==undefined)options.deadline=Math.min(options.deadline??Infinity,start+options.budgetMs);
 const {mistakeChance,maxRegret,nodeBudget}=options,seed=options.seed??state.actors[side].kit.level;
 if(!Number.isFinite(mistakeChance)||mistakeChance<0||mistakeChance>1||!Number.isFinite(maxRegret)||maxRegret<0||!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid AI degradation settings');
 const sharedContext=context??createSearchContext({tableLimit:options.tableLimit??4096});
 // Reserve half the compute budget on seeded mistake attempts. Otherwise a
 // deep main search would consume every timed turn and disable fallibility.
 const mistakeRoll=mistakeChance>0?policyDraw(seed,state,0):null,wantsRanking=mistakeRoll!==null&&mistakeRoll<mistakeChance&&legalActions(state).length>1;
 const mainOptions=computeProfile&&wantsRanking?{...options,nodeBudget:Math.max(1,Math.floor(nodeBudget/2)),...(options.deadline!==undefined?{deadline:start+(options.deadline-start)/2}:{})}:options;
 const best=searchAction(state,mainOptions,sharedContext),result={...best,bestId:best.id,degraded:false,mistakeAttempted:false,regret:0,eligible:0,rankingDepth:0,rankingNodes:0,totalNodes:best.nodes,seed,mistakeChance,maxDepth:options.maxDepth,computeProfile:computeProfile??'legacy',budgetMs:options.budgetMs??null,nodeBudget,elapsedMs:now()-start};
 if(mistakeChance===0||legalActions(state).length<2)return result;
 const roll=mistakeRoll;result.mistakeRoll=roll;
 if(roll>=mistakeChance)return result;
 result.mistakeAttempted=true;
 if(best.completedDepth===0){result.degradationSkipped='no completed search';return result;}
 if(now()>=(options.deadline??Infinity)){result.degradationSkipped='ranking deadline';result.elapsedMs=now()-start;return result;}
 const rankingBudget=computeProfile?nodeBudget-best.nodes:nodeBudget;
 if(rankingBudget<1){result.degradationSkipped='ranking nodes';return result;}
 const ranked=searchAction(state,{...options,nodeBudget:rankingBudget,maxDepth:best.completedDepth,rankActions:true},sharedContext);
 result.rankingStoppingReason=ranked.stoppingReason;
 result.rankingDepth=ranked.completedDepth;result.rankingNodes=ranked.nodes;result.totalNodes+=ranked.nodes;result.extensionNodes+=ranked.extensionNodes;result.extensions+=ranked.extensions;result.elapsedMs=now()-start;
 if(ranked.completedDepth!==best.completedDepth){result.degradationSkipped='ranking '+ranked.stoppingReason;return result;}
 const sign=side===0?1:-1,bestUtility=sign*ranked.value;
 if(Math.abs(bestUtility-sign*best.value)>1e-6){result.degradationSkipped='ranking disagreement';return result;}
 const alternatives=[];
 for(const a of ranked.rankedActions){
  if(now()>=(options.deadline??Infinity)){result.degradationSkipped='ranking deadline';result.elapsedMs=now()-start;return result;}
  const regret=bestUtility-sign*a.value;if(a.id!==best.id&&regret>1e-6&&regret<=maxRegret&&plausibleMistake(state,a.id))alternatives.push({...a,regret});
 }
 result.eligible=alternatives.length;
 if(!alternatives.length){result.degradationSkipped='no plausible weaker move';result.elapsedMs=now()-start;return result;}
 const selected=alternatives[Math.floor(policyDraw(seed,state,1)*alternatives.length)];
 return {...result,id:selected.id,value:selected.value,degraded:true,regret:selected.regret,elapsedMs:now()-start};
}
