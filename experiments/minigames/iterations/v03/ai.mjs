import {legalActions,projectAction,outcomes,sampleOutcome,response,SPELLS,REQUESTS} from './engine.mjs';
import {levelRng} from './roster.mjs';
export function candidates(s){return legalActions(s).filter(id=>{
 if(!SPELLS[id])return true;
 if(id==='shadowstep')return false;
 if(['flame','tide','shape','restoration','ward','hush'].includes(id))return REQUESTS[s.intent].spell===id||s.intent==='disturbance'&&id==='hush';
 if(id==='attune')return s.entry.mood-s.resources.mood>=4;
 if(id==='haste')return s.patience>=2;
 if(id==='glamour')return ['confront','deflect'].some(a=>{const r=response(s,a);return ['charm','guile'].includes(r.skill)&&(r.cost.mood>0||r.cost.renown>0||r.suspicion>0);});
 if(id==='starlight')return s.suspicion>=2;
 if(id==='foresight')return s.forecast.length<Math.min(3,s.patience-1)&&s.agreement<s.config.target-1;
 return true;
});}
export function evaluate(s){
 const loss=k=>s.settlement?s.settlement[k].netLoss:Math.ceil((s.entry[k]-s.resources[k])*(1-s.config.rebates[k])-1e-9);
 const expense=loss('mood')*3+loss('renown')*12+loss('mana')*.65+loss('crowns')*2;
 if(s.result)return (s.result.outcome==='win'?10000:s.result.outcome==='partial'?-1800:-10000)-expense;
 const need=s.config.target-s.agreement;
 if(s.patience<need)return -6500+s.agreement*100-expense;
 return s.agreement*700+s.patience*20-s.pressure*35-s.suspicion*50-expense;
}
function ordering(s,id){const t=projectAction(s,id);if(SPELLS[id]&&!t.result)return Math.max(...legalActions(t).filter(x=>!SPELLS[x]).map(x=>evaluate(projectAction(t,x))));return evaluate(t);}
function ordered(s,check=()=>{}){return candidates(s).map(id=>{check();return {id,value:ordering(s,id)};}).sort((a,b)=>b.value-a.value||a.id.localeCompare(b.id));}
export const greedyAction=s=>ordered(s)[0]?.id??'withdraw';
const key=(s,d)=>JSON.stringify([d,s.agreement,s.patience,s.suspicion,s.pressure,s.intent,s.forecast,s.recent,s.castUsed,s.deceptions,s.buffs,s.resources]);
function hash(text){let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return h>>>0;}
export function searchAction(s,options={}){
 if(s.result)throw Error('Conversation has ended');
 const now=options.now??(()=>performance.now()),started=now(),budgetMs=Math.min(50,Math.max(1,options.budgetMs??50)),deadline=started+Math.max(.5,budgetMs-2),limit=options.nodeBudget??50000;
 let nodes=0,cacheHits=0,completedDepth=0;const table=new Map(),STOP=Symbol('budget');
 const fallback=['confront','deflect','withdraw'].filter(id=>legalActions(s).includes(id)).map(id=>({id,value:evaluate(projectAction(s,id))})).sort((a,b)=>b.value-a.value);
 let best=fallback[0];
 function check(){if(now()>=deadline||nodes>=limit)throw STOP;nodes++;}
 function actionValue(state,id,depth){
   check();if(!SPELLS[id]&&depth===1)return evaluate(projectAction(state,id));
   const nextDepth=depth-(SPELLS[id]?0:1);
   if(id==='foresight'){
     // Public-state samples approximate only the three-request forecast fan-out.
     // Never read the live seed or hidden future. Other chance nodes are exact.
     const rng=levelRng(hash(key(state,0))),samples=options.forecastSamples??8;let total=0;
     for(let i=0;i<samples;i++){check();total+=value(sampleOutcome(state,id,rng),nextDepth);}return total/samples;
   }
   let total=0;for(const b of outcomes(state,id)){check();total+=b.p*value(b.state,nextDepth);}return total;
 }
 function value(state,depth){
   check();if(state.result||depth===0)return evaluate(state);
   const k=key(state,depth);if(table.has(k)){cacheHits++;return table.get(k);}
   let v=-Infinity;for(const a of ordered(state,check))v=Math.max(v,actionValue(state,a.id,depth));table.set(k,v);return v;
 }
 for(let depth=1;depth<=(options.maxDepth??4);depth++){
   try{let iteration={id:best.id,value:-Infinity};const moves=ordered(s,check).sort((a,b)=>(a.id===best.id?-1:b.id===best.id?1:0));
     for(const a of moves){const v=actionValue(s,a.id,depth);if(v>iteration.value+1e-9)iteration={id:a.id,value:v};}
     best=iteration;completedDepth=depth;
   }catch(e){if(e!==STOP)throw e;break;}
 }
 const elapsedMs=now()-started;return {...best,algorithm:'sampled expectimax',budgetMs,elapsedMs,overrunMs:Math.max(0,elapsedMs-budgetMs),nodes,cacheHits,completedDepth,legalMoves:legalActions(s).length};
}
