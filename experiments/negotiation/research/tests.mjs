import test from 'node:test';import assert from 'node:assert/strict';import {createResearchState,researchAction,researchSearch,simulateResearch,EFFECTS} from './model.mjs';import {core} from '../core.mjs';import {SPELLS} from '../reference-engine.mjs';import {nativeCore} from './native.mjs';
const card=(s,base,frame='open')=>{s.card=s.pool.find(c=>c.baseId===base&&c.frame===frame).id;return s;};
test('presentation variants keep one check and one-point awards; Charm does not blend',()=>{let s=createResearchState();assert.equal(s.pool.length,270);assert(s.pool.every(c=>c.agreement===1&&c.type==='check'&&c.source));card(s,'precedent');const p=core('chance',s);s.player.skills.charm+=20;assert.equal(core('chance',s),p);s.player.skills.lore+=10;assert(Math.abs(core('chance',s)-p-.12*s.config.tune.levelGapScale)<1e-10);});
test('public failures spend Renown; on-record successes calm suspicion',()=>{let s=card(createResearchState(),'objection','public');let t=core('project',s,{id:'face',event:false});assert.equal(t.resources.renown,s.resources.renown-4);s=card(createResearchState(),'objection','record');s.suspicion=3;t=core('project',s,{id:'face',event:true});assert.equal(t.suspicion,2);assert.equal(t.agreement,1);});
test('every castable spell has an explicit adaptation; only Flame forces a funny failure',()=>{for(const[id,spell]of Object.entries(SPELLS)){if(spell.castable===false)continue;assert(EFFECTS[id],id);const s=createResearchState({allSpells:true});researchAction(s,id);if(id==='flame'){assert.equal(s.result.outcome,'lose');assert.match(s.result.reason,/you should leave/);}else assert(!s.result,id);assert.equal(s.round,1);assert(s.spent.mana>=0);}});
test('Candour/Quickquill cannot create free Agreement; recovering resources is bounded',()=>{let s=createResearchState({allSpells:true});researchAction(s,'candour');assert.equal(s.agreement,0);researchAction(s,'face');if(!s.result){const n=s.agreement;researchAction(s,'quickquill');assert.equal(s.agreement,n);}for(const id of ['purify','siphon','moonwell','heartprice','mend','heartwood']){s=createResearchState({allSpells:true,mana:25});researchAction(s,id);assert(s.resources.mana<=s.player.capacity);assert(s.resolve<=s.resolveMax);assert(s.resources.health<=s.entry.health);assert(s.resources.health>=0);}});
test('forcing payment still requires funds; Sleight discounts actual gold',()=>{let s=createResearchState({allSpells:true,gold:4,requests:[{type:'gold',amount:8}]});card(s,'event_0');assert.equal(core('chance',s),0);researchAction(s,'sleight');assert.equal(core('chance',s),1);let t=core('project',s,{id:'face',event:true});assert.equal(t.resources.gold,0);s=createResearchState({allSpells:true,gold:0,requests:[{type:'gold',amount:8}]});card(s,'event_0');researchAction(s,'compel');assert.equal(core('chance',s),0);});
test('same seeds and tapes replay research outcomes, costs and durations',()=>{const a=createResearchState({allSpells:true}),run=simulateResearch(a,{depth:1,fixedNodes:true,nodeBudget:2000,beam:6,trace:true});assert(run.terminated);const b=createResearchState({allSpells:true});for(const h of run.state.history)researchAction(b,h.action);assert.deepEqual(b.history,run.state.history);assert.deepEqual(b.settlement,run.state.settlement);});
test('search cannot see unrevealed future cards/RNG and exposes resource objectives',()=>{const a=createResearchState(),b=structuredClone(a);b.pending=b.pool.at(-1).id;b.cardRng=1;b.checkRng=2;b.config.seed=3;const o={depth:1,fixedNodes:true,nodeBudget:10000};const da=researchSearch(a,o),db=researchSearch(b,o);delete da.elapsedMs;delete db.elapsedMs;assert.deepEqual(da,db);assert(da.scores.every(x=>Number.isFinite(x.winEstimate)&&x.netCostFractions));assert.equal(da.objective,'prudent');});
test('native and Wasm execute the same seeded research game',async()=>{const n=nativeCore();try{const state=createResearchState({level:50,allSpells:true}),options={depth:1,fixedNodes:true,nodeBudget:2000,beam:6,trace:true};const a=simulateResearch(state,options),b=await n.request({op:'simulate',state,options});assert.deepEqual(a.state,b.state);for(let i=0;i<a.decisions.length;i++){delete a.decisions[i].choice.elapsedMs;delete b.decisions[i].choice.elapsedMs;}assert.deepEqual(a.decisions,b.decisions);}finally{n.close();}});

test('casting cannot waive an unpaid Resolve cost',()=>{for(const id of ['candour','moonwell','purify']){const s=createResearchState({allSpells:true});s.resolve=0;assert(!core('legal',s).includes(id));assert.throws(()=>researchAction(s,id));}});

test('exact reduced endgame matches its closed-form full-win probability',()=>{const s=createResearchState({objective:'allout',target:2,player:{spells:{}}});s.pool=s.pool.filter(c=>['common_ground','honest_appeal'].includes(c.baseId)&&c.frame==='open');s.card=s.pool[0].id;s.pending=s.pool[1].id;s.patience=1;s.suspicion=5;const p=core('chance',s),q=core('chance',{...s,card:s.pending});const d=researchSearch(s,{depth:4,exact:true,fixedNodes:true,nodeBudget:100000});assert.equal(d.id,'face');assert.equal(d.depth,4);assert.equal(d.heuristicLeaves,0);assert(Math.abs(d.winEstimate-p*q)<1e-12);});
test('exact three-card endgames match an independent exhaustive JavaScript solver',()=>{
 const root=createResearchState({objective:'allout',target:2,player:{spells:{}},tune:{skipPatience:1}});root.pool=root.pool.filter(c=>['common_ground','honest_appeal','objection'].includes(c.baseId)&&c.frame==='open');root.card=root.pool[0].id;root.pending=root.pool[1].id;
 for(const patience of [1,2])for(const suspicion of [0,4,5])for(const resolve of [0,root.resolveMax]){
  const state={...structuredClone(root),patience,suspicion,resolve},memo=new Map();
  function oracle(s){if(s.result)return Number(s.result.outcome==='win');const key=JSON.stringify([s.card,s.agreement,s.patience,s.resolve,s.suspicion,s.bypasses]);if(memo.has(key))return memo.get(key);const moves=core('legal',s);let best=0;
   for(const id of moves){if(id==='withdraw')continue;const p=id==='face'?core('chance',s):Math.min(.9,s.config.tune.skipRiskBase+s.config.tune.skipRiskStep*s.bypasses);let v=0;
    for(const[event,w]of[[true,p],[false,1-p]]){if(!w)continue;const next=core('project',s,{id,event});if(next.result){v+=w*Number(next.result.outcome==='win');continue;}const previous=s.pool.find(c=>c.id===s.card).baseId,deck=s.pool.filter(c=>c.baseId!==previous),total=deck.reduce((n,c)=>n+c.weight,0);for(const c of deck)v+=w*c.weight/total*oracle({...next,card:c.id});}
    best=Math.max(best,v);
   }memo.set(key,best);return best;
  }
  const expected=oracle(state),actual=researchSearch(state,{depth:5,exact:true,fixedNodes:true,nodeBudget:100000});assert.equal(actual.depth,5);assert.equal(actual.heuristicLeaves,0);assert(Math.abs(actual.winEstimate-expected)<1e-11,`${patience}/${suspicion}/${resolve}: ${actual.winEstimate} vs ${expected}`);
 }
});

test('Ward has no negotiation benefit, including with stale overrides or imported state',()=>{
 const oldWard={mana:1,suspicion:-3,suspicionShield:99,resolveShield:99,restoreResolve:99,restoreMana:99,restorePatience:99,chance:1,force:true,foresight:true,duration:3};
 for(const effectOverrides of [{},{ward:oldWard}])for(const imported of [false,true]){
  const s=card(createResearchState({allSpells:true,effectOverrides}),'objection');s.resolve-=5;s.patience=4;s.suspicion=1;
  if(imported)s.config.spellEffects.ward={...oldWard,mana:4};
  const plain=core('project',s,{id:'face',event:false}),cast=core('project',s,{id:'ward'}),after=core('project',cast,{id:'face',event:false});
  assert.equal(cast.resolve,s.resolve);assert.equal(cast.resources.mana,s.resources.mana-s.config.spellEffects.ward.mana);assert.equal(cast.patience,s.patience);assert.equal(cast.suspicion,s.suspicion+1);assert.equal(core('chance',cast),core('chance',s));assert(!cast.effects.foresight);
  assert.equal(after.resolve,plain.resolve);assert.equal(after.suspicion,plain.suspicion+1);assert.equal(after.patience,plain.patience);assert.equal(after.agreement,plain.agreement);
 }
});
test('Sleight saves actual crowns at the same total Suspicion as an openly paid concession',()=>{const s=createResearchState({allSpells:true,requests:[{type:'gold',amount:8}],tune:{goldTrace:1}});s.card=s.pool.find(c=>c.baseId==='event_0'&&c.frame==='open').id;const plain=core('project',s,{id:'face',event:true}),cast=core('project',s,{id:'sleight'}),hidden=core('project',cast,{id:'face',event:true});assert.equal(hidden.suspicion,plain.suspicion);assert.equal(plain.resources.gold,22);assert.equal(hidden.resources.gold,26);});
test('negative Renown does not fund payments, create refunds or block cost-free spells',()=>{const s=card(createResearchState({allSpells:true,player:{renown:-10}}),'objection','public');assert(core('legal',s).includes('ward'));assert(!core('legal',s).includes('starlight'));const t=core('project',s,{id:'face',event:false});assert.equal(t.resources.renown,-10);assert.equal(t.spent.renown,0);const end=core('project',t,{id:'withdraw'});assert.equal(end.resources.renown,-10);assert.equal(end.settlement.resources.renown.rebate,0);});
test('Mana recovery cannot farm above entry, but can repay encounter spending',()=>{for(const id of ['purify','siphon','moonwell']){const s=createResearchState({allSpells:true,mana:28});researchAction(s,'ward');researchAction(s,'face');if(s.result)continue;const before=s.resources.mana;researchAction(s,id);assert.equal(s.resources.mana,Math.min(s.entry.mana,before-s.config.spellEffects[id].mana+s.config.spellEffects[id].restoreMana));assert(s.resources.mana<=s.entry.mana);researchAction(s,'withdraw');assert(s.resources.mana<=s.entry.mana);}});
test('exact endgame search with free-action spells matches exhaustive legal play',()=>{
 const s=createResearchState({objective:'allout',target:2,player:{spells:{glamour:1,candour:1}}});
 s.pool=s.pool.filter(c=>['common_ground','objection'].includes(c.baseId)&&c.frame==='open');s.card=s.pool[0].id;s.pending=s.pool[1].id;s.patience=2;s.suspicion=4;s.resolve=9;
 const memo=new Map();
 function oracle(t){
  if(t.result)return Number(t.result.outcome==='win');
  const key=JSON.stringify([t.card,t.agreement,t.patience,t.suspicion,t.resolve,t.resources,t.castUsed,t.researchState,t.bypasses]);
  if(memo.has(key))return memo.get(key);
  let best=0;
  for(const id of core('legal',t)){
   if(id==='withdraw')continue;
   const spell=!!SPELLS[id],p=spell?1:id==='face'?core('chance',t):Math.min(.9,t.config.tune.skipRiskBase+t.config.tune.skipRiskStep*t.bypasses);
   let value=0;
   for(const[event,weight]of[[true,p],[false,1-p]]){
    if(!weight)continue;
    const next=core('project',t,{id,event});
    if(next.result||spell){value+=weight*oracle(next);continue;}
    const previous=t.pool.find(c=>c.id===t.card).baseId,deck=t.pool.filter(c=>c.baseId!==previous),total=deck.reduce((n,c)=>n+c.weight,0);
    for(const c of deck)value+=weight*c.weight/total*oracle({...next,card:c.id});
   }
   best=Math.max(best,value);
  }
  memo.set(key,best);return best;
 }
 const expected=oracle(s),actual=researchSearch(s,{depth:4,exact:true,fixedNodes:true,nodeBudget:500000});
 assert.equal(actual.depth,4);assert.equal(actual.heuristicLeaves,0);assert(Math.abs(actual.winEstimate-expected)<1e-11);
});
test('Foresight peeks affect a two-response horizon but not a one-response race leaf',()=>{
 const a=card(createResearchState({objective:'allout',target:2,player:{spells:{foresight:1}}}),'precedent');
 researchAction(a,'foresight');a.patience=1;a.suspicion=5;
 a.pending=a.pool.find(c=>c.baseId==='common_ground'&&c.frame==='open').id;
 const b=structuredClone(a);b.pending=b.pool.find(c=>c.baseId==='bold_pitch'&&c.frame==='demonstration').id;
 const options={fixedNodes:true,nodeBudget:100000};
 const shallowA=researchSearch(a,{...options,depth:1}),shallowB=researchSearch(b,{...options,depth:1});
 for(const x of shallowA.scores)assert(Math.abs(x.value-shallowB.scores.find(y=>y.id===x.id).value)<1e-12);
 const deepA=researchSearch(a,{...options,depth:2}),deepB=researchSearch(b,{...options,depth:2}),p=core('chance',a);
 assert.equal(deepA.heuristicLeaves,0);assert.equal(deepB.heuristicLeaves,0);
 assert(Math.abs(deepA.winEstimate-p*core('chance',{...a,card:a.pending}))<1e-12);
 assert(Math.abs(deepB.winEstimate-p*core('chance',{...b,card:b.pending}))<1e-12);
 assert(deepA.winEstimate>deepB.winEstimate+.05);
});
