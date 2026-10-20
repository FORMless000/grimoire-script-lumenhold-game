import {SPELLS,legalActions,project,distribution,chance,deflectRisk,cardOf,signal,observation,clone,clamp,spellCost} from './reference-engine.mjs';
export function candidates(s){return legalActions(s).filter(id=>{
 if(!SPELLS[id])return true;
 if(id==='candour')return s.suspicion>0||!!s.player.spells.quickquill;
 if(id==='glamour')return cardOf(s).type==='check'&&['charm','guile'].includes(signal(s).skill)&&chance(s)<.94;
 if(id==='foresight')return !s.effects.foresight&&s.patience>1;
 if(id==='index')return cardOf(s).type==='check'&&s.player.skills.lore>signal(s).value+2;
 if(id==='rapport')return s.resolve>0;
 if(id==='quickquill')return cardOf(s).type==='check'||s.effects.candourAt===s.round-1;
 if(id==='reflect')return cardOf(s).type==='check'&&chance(s)>.2;
 if(id==='haste')return s.resolve>=4&&s.patience<=6;
 if(id==='starlight')return s.patience<s.config.patience+2;
 if(id==='shadowstep')return s.agreement>=s.config.target/2;
 if(id==='compel')return s.config.underground;
 if(id==='sleight')return s.pool.some(c=>c.type==='gold'&&c.amount>s.resources.gold)&&s.opponentGold>0;
 return false;
});}
export function race(p,w,f){if(w<=0)return 1;if(f<=0)return 0;let value=0,coefficient=1;for(let k=0;k<f;k++){if(k)coefficient*= (w+k-1)/k;value+=coefficient*p**w*(1-p)**k;}return clamp(value,0,1);}
export function evaluate(s){
 const expense=(s.entry.mana-s.resources.mana)*.00004+(s.entry.gold-s.resources.gold)*.00004+(s.entry.health-s.resources.health)*.00008;
 if(s.result)return (s.result.outcome==='win'?1:s.result.outcome==='partial'?.1:0)-expense;
 // Approximate a race in units of successful leads, accounting for their
 // different rewards and rejection costs. Search itself branches exact outcomes.
 const d=distribution(s),stats=d.reduce((n,c)=>{const t={...s,card:c.id},card=cardOf(t),p=chance(t);n.p+=c.p*p;n.reward+=c.p*p*card.agreement;n.suspicion+=c.p*(1-p)*card.suspicionHit;n.patience+=c.p*(1-p)*card.patienceHit;return n;},{p:0,reward:0,suspicion:0,patience:0});
 const current=s.card?cardOf(s):null,cp=current?chance(s):stats.p,p=current ? .55*cp+.45*stats.p:stats.p;
 const avgReward=stats.reward/Math.max(.001,stats.p),avgSuspicion=stats.suspicion/Math.max(.001,1-stats.p),avgPatience=stats.patience/Math.max(.001,1-stats.p);
 const reward=current ? .55*(current.agreement)+.45*avgReward:avgReward;
 const failures=Math.max(0,Math.min(Math.ceil(s.patience/Math.max(1,avgPatience)),Math.ceil((s.config.suspicionLimit-s.suspicion)/Math.max(1,avgSuspicion))));
 return Math.max(.000001,.94*race(p,Math.ceil((s.config.target-s.agreement)/reward),failures)+.012*s.resolve/s.resolveMax-.014*s.suspicion/s.config.suspicionLimit)-expense;
}
function immediate(s,id){const p=id==='face'?chance(s):id==='deflect'?deflectRisk(s):1;return p*evaluate(project(s,id,true))+(1-p)*evaluate(project(s,id,false));}
const fingerprint=(s,d)=>JSON.stringify([d,s.card,s.pending,s.agreement,s.patience,s.resolve,s.suspicion,s.bypasses,s.round,s.castUsed,s.effects,s.resources,s.opponentGold]);
function hash(str){let h=2166136261;for(const c of str)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function sampled(d,n,seed){const out=new Map(),shift=(seed%997)/997;for(let i=0;i<n;i++){let u=((i+.5)/n+shift)%1,id=d.at(-1).id;for(const c of d){u-=c.p;if(u<=0){id=c.id;break;}}out.set(id,(out.get(id)??0)+1/n);}return [...out].map(([id,p])=>({id,p}));}
export function* branches(s,id,depth,samples=3){
 const p=id==='face'?chance(s):id==='deflect'?deflectRisk(s):1;
 for(const [event,weight]of [[true,p],[false,1-p]]){
   if(weight<=0)continue;const t=project(s,id,event);
   if(t.result){yield {state:t,p:weight};continue;}
   // Common public samples across spell alternatives prevent card-sampling bias.
   const seed=hash(JSON.stringify([s.round,s.card,s.config.pool,s.config.difficulty]));
   if(SPELLS[id]){
     if(id==='foresight'&&!s.pending){for(const c of sampled(distribution(s),samples,seed)){const b=clone(t);b.pending=c.id;yield {state:b,p:weight*c.p};}}
     else yield {state:t,p:weight};continue;
   }
   if(depth===1){delete t.pending;yield {state:t,p:weight};continue;}
   const next=s.pending?[{id:s.pending,p:1}]:sampled(distribution(s),samples,seed);
   for(const c of next){const b=clone(t);b.card=c.id;
     if(b.effects.foresight){for(const peek of sampled(distribution(b),samples,seed+7)){const v=clone(b);v.pending=peek.id;yield {state:v,p:weight*c.p*peek.p};}}
     else{delete b.pending;yield {state:b,p:weight*c.p};}
   }
 }
}
export function searchAction(input,options={}){
 const s=observation(input),now=options.now??(()=>performance.now()),started=now(),budgetMs=Math.min(50,options.budgetMs??50),deadline=options.fixedNodes?Infinity:started+Math.max(.5,budgetMs-3),limit=options.nodeBudget??250000,STOP=Symbol('budget');let nodes=0,depthDone=0,cacheHits=0;
 const fallback=legalActions(s).map(id=>{const t=project(s,id,true);return {id,value:SPELLS[id]&&!t.result?Math.max(...legalActions(t).map(a=>immediate(t,a))):immediate(s,id)};}).sort((a,b)=>b.value-a.value||a.id.localeCompare(b.id));let best=fallback[0],scores=fallback;const table=new Map();
 function check(){if(nodes>=limit||now()>=deadline)throw STOP;nodes++;}
 function order(t){return candidates(t).map(id=>{check();return {id,value:immediate(t,id)};}).sort((a,b)=>b.value-a.value||a.id.localeCompare(b.id));}
 function actionValue(t,id,d){check();let v=0;for(const b of branches(t,id,d,options.samples??3)){check();v+=b.p*value(b.state,d-(SPELLS[id]?0:1));}return v;}
 function value(t,d){check();if(t.result||d===0)return evaluate(t);const k=fingerprint(t,d);if(table.has(k)){cacheHits++;return table.get(k);}let v=-Infinity;for(const a of order(t))v=Math.max(v,actionValue(t,a.id,d));table.set(k,v);return v;}
 for(let d=1;d<=(options.depth??3);d++){
  try{const iteration=[];for(const a of scores.slice().sort((a,b)=>a.id===best.id?-1:b.id===best.id?1:0))iteration.push({id:a.id,value:actionValue(s,a.id,d)});iteration.sort((a,b)=>b.value-a.value||a.id.localeCompare(b.id));best=iteration[0];scores=iteration;depthDone=d;}catch(e){if(e!==STOP)throw e;break;}
 }

 return {...best,algorithm:'sampled expectimax',nodes,cacheHits,depth:depthDone,elapsedMs:now()-started,budgetMs,scores:scores.map(s=>({...s,depth:depthDone}))};
}
