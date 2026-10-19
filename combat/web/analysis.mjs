// The engine's analysis for the player: the bench's engine panel (web/app.mjs) and the main game's "engine analysis"
// setting (src/combat-ui.js, through createAnalyst() in build/combat.bundle.js). Iterative deepening with every root move
// scored; onDepth(analysis) after each completed depth, and the last one is returned:
//   {depth, nodes, ms, best, scores: {action: value}, lines: [{id, value, line: [{side, id, round, channel} | {end}]}]}
// Values are in HP from the side to move (the player): + is good for them. A line follows the best move the search
// stored for each position, each side's best reply as the engine sees it. budgetMs: Infinity (or null) deepens with no
// deadline and no node cap, up to maxDepth (default 64 then): it runs until it ends or its worker is stopped.
import {searchAction,createSearchContext,freeSearchContext,probeSearchCache,searchPositionKey,cloneState,actorToMove,legalActions,applyChoice} from './core.mjs';
const clock=()=>typeof performance!=='undefined'?performance.now():Date.now();
export function principalLine(state,first,ctx,limit=10){
 const s=cloneState(state),line=[];let id=first;
 for(let i=0;i<limit&&id&&!s.result;i++){
  const side=actorToMove(s);if(!legalActions(s).includes(id))break;
  line.push({side,id,round:s.round,channel:s.actors[side].channel?.id??null});applyChoice(s,id);
  if(s.result){line.push({end:s.result.winner===0?'win':s.result.winner===1?'loss':'draw'});break;}
  id=probeSearchCache(ctx,searchPositionKey(ctx,s))?.bestId;
 }
 return line;
}
export function analyzePosition(state,{budgetMs=1500,maxDepth,onDepth=null}={}){
 const unlimited=budgetMs==null||budgetMs===Infinity;if(maxDepth==null)maxDepth=unlimited?64:8;
 const ctx=createSearchContext({tableLimit:unlimited?1<<18:65536}),start=clock();let nodes=0,last=null;
 try{
  for(let depth=1;depth<=maxDepth;depth++){
   const left=unlimited?null:budgetMs-(clock()-start);if(left!==null&&left<=0)break;
   const r=searchAction(state,{maxDepth:depth,nodeBudget:unlimited?1e15:20000000,...(left===null?{}:{budgetMs:left}),rankActions:true,prune:true,horizonMode:'tactical'},ctx);nodes+=r.nodes;
   if(r.completedDepth<depth)break;
   const ranked=[...r.rankedActions].sort((a,b)=>b.value-a.value);
   last={depth,nodes,ms:clock()-start,best:ranked[0].id,scores:Object.fromEntries(ranked.map(a=>[a.id,a.value])),lines:ranked.slice(0,3).map(a=>({id:a.id,value:a.value,line:principalLine(state,a.id,ctx,10)}))};
   if(onDepth)onDepth(last);
   if(Math.abs(ranked[0].value)>=9000)break;
  }
 }finally{freeSearchContext(ctx);}
 return last;
}
