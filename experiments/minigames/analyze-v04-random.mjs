#!/usr/bin/env node
// Replay frozen sources, summarize the finite panel, then measure sequential AI latency.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const out=path.resolve(process.argv[2]??'');if(!process.argv[2])throw Error('Pass a result directory');
for(const f of ['audit.json','summary.json','latency.json'])if(fs.existsSync(path.join(out,f)))throw Error('Refusing to overwrite '+f);
const read=f=>JSON.parse(fs.readFileSync(path.join(out,f)));
const manifest=read('manifest.json'),rows=read('matches.json');
for(const [f,hash]of Object.entries(manifest.sourceHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(out,'sources',f))).digest('hex'),hash,f);
const adapter=await import(pathToFileURL(path.join(out,'sources/iterations/v04/adapter.mjs')));
const engine=await import(pathToFileURL(path.join(out,'sources/iterations/v04/engine.mjs')));
const {chooseAIAction}=await import(pathToFileURL(path.join(out,'sources/iterations/v04/ai.mjs')));
const {seededRng}=await import(pathToFileURL(path.join(out,'sources/harness.mjs')));
const count=xs=>{const c={};for(const x of xs)c[x]=(c[x]??0)+1;return c;};
const top=c=>Object.entries(c).sort((a,b)=>b[1]-a[1]);
const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
const quantile=(xs,p)=>xs.length?[...xs].sort((a,b)=>a-b)[Math.max(0,Math.ceil(xs.length*p)-1)]:null;
const distribution=xs=>({n:xs.length,mean:mean(xs),p50:quantile(xs,.5),p90:quantile(xs,.9),p95:quantile(xs,.95),p99:quantile(xs,.99),max:xs.length?Math.max(...xs):null});
const obs=[],actorRows=[];let decisions=0,ledgers=0;
assert.equal(rows.length,manifest.cases.length);
for(const row of rows){
 assert.deepEqual(row.config,manifest.cases[row.caseId].config);
 const g=adapter.create(row.config);
 for(const d of row.searchStats){
  const side=engine.actorToMove(g);assert.equal(side,d.side);assert.equal(g.round,d.round);assert(engine.legalActions(g).includes(d.id));const budget=d.nodeBudget??row.config.search.nodeBudget;assert(Number.isInteger(budget));assert(d.nodes<=budget);assert((d.rankingNodes??0)<=budget);assert(d.totalNodes<=(d.computeProfile&&d.computeProfile!=='legacy'?1:2)*budget);
  const a=g.actors[side];obs.push({caseId:row.caseId,panel:row.panel,loadout:a.kit.loadout,level:a.kit.level,side,round:d.round,id:d.id,phase:d.phase,incoming:d.incoming,legal:d.legal,hpFraction:a.hp/a.maxHP,mana:a.resources.mana,flux:a.flux,channel:a.channel?.id??null,ms:d.wallMs,depth:d.completedDepth,nodes:d.totalNodes,late:d.round>row.rounds*.75});
  assert.deepEqual(engine.legalActions(g),d.legal);adapter.advance(g,d);decisions++;
 }
 const actual=adapter.metrics(g);for(const key of ['commands','executedCommands','outcomes','ledgers','result','rounds'])assert.deepEqual(actual[key],row[key],row.caseId+':'+key);
 assert.deepEqual(g.actors.map(a=>a.kit),row.trace.kits);
 if(row.censored){assert.equal(g.result,null);assert.equal(g.settlement,null);assert.equal(row.searchStats.length,row.decisionLimit);}
 else for(const ledger of row.ledgers)for(const [key,r]of Object.entries(ledger)){
  assert(Math.abs(r.before-(r.entry-r.spent+r.restored))<1e-6);assert.equal(r.final,r.before+r.refund);if(r.refund)assert(r.final<=r.entry);if(['crowns','alignment'].includes(key))assert.equal(r.refund,0);ledgers++;
 }
 for(const side of [0,1])actorRows.push({caseId:row.caseId,panel:row.panel,pairId:row.pairId,side,loadout:g.actors[side].kit.loadout,level:g.actors[side].kit.level,band:row.band,focal:side===row.focalSide,outcome:row.outcomes[side],censored:row.censored,rounds:row.rounds,firstCommit:side===row.config.firstLeader,finalHP:g.actors[side].hp,finalMana:g.actors[side].resources.mana,netMana:row.ledgers?.[side]?.mana.netLoss??null,netHealth:row.ledgers?.[side]?.health.netLoss??null,known:Object.keys(g.actors[side].kit.spells),provisional:!!g.actors[side].kit.provisionalSkills});
}
fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify({matches:rows.length,legalDecisionsReplayed:decisions,ledgerRowsChecked:ledgers,frozenSourcesVerified:true,censoringVerified:true},null,2));
function outcome(xs){
 const wins=xs.filter(x=>x.outcome==='win').length,losses=xs.filter(x=>x.outcome==='lose').length,draws=xs.filter(x=>x.outcome==='draw').length,censored=xs.filter(x=>x.censored).length,n=xs.length;
 return {n,pairs:new Set(xs.map(x=>x.pairId)).size,wins,losses,draws,censored,winFractionAll:n?wins/n:null,decisiveWinFraction:wins+losses?wins/(wins+losses):null,unresolvedWinFractionRange:n?[wins/n,(wins+censored)/n]:null,meanRounds:mean(xs.map(x=>x.rounds)),meanSettledManaLoss:mean(xs.map(x=>x.netMana).filter(x=>x!==null)),meanSettledHealthLoss:mean(xs.map(x=>x.netHealth).filter(x=>x!==null))};
}
function actions(xs){
 const counts=count(xs.map(x=>x.id)),opportunities=count(xs.flatMap(x=>x.legal)),n=xs.length;
 return {n,counts,top:top(counts),largestShare:n?Math.max(...Object.values(counts))/n:0,effectiveActions:n?Math.exp(-Object.values(counts).reduce((s,k)=>s+k/n*Math.log(k/n),0)):0,whenLegal:Object.fromEntries(Object.entries(opportunities).map(([id,legal])=>[id,{chosen:counts[id]??0,legal,rate:(counts[id]??0)/legal}])),depths:count(xs.map(x=>x.depth)),latencyMsUnderContention:distribution(xs.map(x=>x.ms)),meanNodes:mean(xs.map(x=>x.nodes))};
}
const generic=Object.keys(engine.LOADOUTS),characters=Object.keys(engine.NAMED_LOADOUTS);
const byLoadout=[];for(const name of generic)for(const level of [20,50,80])byLoadout.push({panel:'generic',loadout:name,level,...outcome(actorRows.filter(a=>a.panel==='generic'&&a.loadout===name&&a.level===level))});
const byCharacter=characters.map(name=>({loadout:name,...outcome(actorRows.filter(a=>a.panel==='character'&&a.focal&&a.loadout===name)),byBand:[20,50,80,'fixed'].map(band=>({band,...outcome(actorRows.filter(a=>a.panel==='character'&&a.focal&&a.loadout===name&&a.band===band))})).filter(x=>x.n)}));
const bySkillGap=generic.map(name=>({loadout:name,...outcome(actorRows.filter(a=>a.panel==='skill-gap'&&a.focal&&a.loadout===name))}));
const byActionLoadout=[...generic,...characters].map(loadout=>({loadout,...actions(obs.filter(o=>o.loadout===loadout&&o.panel!=='skill-gap'))}));
const phaseActions=['commit','respond'].map(phase=>({phase,...actions(obs.filter(o=>o.phase===phase))}));
const pairSummary=[...new Set(rows.map(r=>r.pairId))].map(pairId=>{const xs=rows.filter(r=>r.pairId===pairId),r=xs[0];return {pairId,panel:r.panel,focal:r.focal,opponent:r.config.opponentLoadout,band:r.band,...outcome(actorRows.filter(a=>a.pairId===pairId&&a.focal)),outcomesByCase:xs.map(x=>({caseId:x.caseId,focalSide:x.focalSide,firstLeader:x.config.firstLeader,outcome:x.outcomes[x.focalSide],censored:x.censored,rounds:x.rounds}))};});
const censored=rows.filter(r=>r.censored).map(r=>{
 const tail=r.trace.log.slice(-10),noHitTail=tail.length===10&&!tail.some(x=>x.events.some(e=>e.includes(' dealt ')));
 const sequences=r.trace.log.map(x=>x.commands.join('|'));let period=null;
 for(const p of [1,2,3,4,5,6])if(sequences.length>=p*3&&sequences.slice(-p*3).every((x,i,a)=>i<p||x===a[i-p])){period=p;break;}
 return {caseId:r.caseId,panel:r.panel,loadouts:r.trace.kits.map(k=>k.loadout),levels:r.trace.kits.map(k=>k.level),hp:r.trace.log.at(-1).hp,mana:r.trace.log.at(-1).ready,flux:r.trace.log.at(-1).flux,noHitLast10:noHitTail,actionPeriodLast3Cycles:period,tail:r.trace.log.slice(-6).map(x=>x.commands)};
});
const summary={rulesVersion:manifest.rulesVersion,seed:manifest.seed,runTiming:read('run-timing.json'),matches:rows.length,completed:rows.filter(r=>!r.censored).length,censored:censored.length,draws:rows.filter(r=>r.noWinner).length,knockouts:rows.filter(r=>r.terminationReason==='knockout').length,initiativeTies:rows.filter(r=>r.initiativeTie).length,rounds:distribution(rows.filter(r=>!r.censored).map(r=>r.rounds)),panels:['generic','character','skill-gap'].map(panel=>({panel,...outcome(actorRows.filter(a=>a.panel===panel&&a.focal))})),byLoadout,byCharacter,bySkillGap,pairSummary,byActionLoadout,phaseActions,allActions:actions(obs),lateActions:actions(obs.filter(o=>o.late)),byLevelActions:[20,50,80].map(level=>({level,...actions(obs.filter(o=>o.panel==='generic'&&o.level===level))})),byFirstCommit:[true,false].map(firstCommit=>({firstCommit,...outcome(actorRows.filter(a=>a.firstCommit===firstCommit))})),censoredDiagnostics:censored,noHitLast10Censored:censored.filter(x=>x.noHitLast10).length};
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify({audit:'passed',matches:rows.length,completed:summary.completed,censored:summary.censored,panels:summary.panels}));

if(!process.argv.includes('--no-benchmark')){
 const rng=seededRng(manifest.seed^0x12345678),sample=[];
 // Select balanced representative case IDs without using their observed timings.
 for(const panel of ['generic','character','skill-gap']){
  const candidates=rows.filter(r=>r.panel===panel&&r.caseId%4===0);
  const shuffled=[...candidates].sort((a,b)=>a.caseId-b.caseId);for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  for(const row of shuffled.slice(0,panel==='skill-gap'?4:12)){
   const indexes=new Set([0,1,Math.floor(row.searchStats.length/4)*2,Math.floor(row.searchStats.length/4)*2+1].filter(i=>i<row.searchStats.length));
   const g=adapter.create(row.config);for(let i=0;i<row.searchStats.length;i++){if(indexes.has(i))sample.push({kind:'kit',caseId:row.caseId,decisionIndex:i,state:engine.cloneState(g)});adapter.advance(g,row.searchStats[i].id);}
  }
 }
 // Keep all-spell stress timings separate from the actual learned-kit panel.
 for(const level of [20,50,80]){
  const g=engine.createState({playerLoadout:'Duellist',opponentLoadout:'Duellist',playerLevel:level,opponentLevel:level,spellAccess:'all',firstLeader:0,search:{maxDepth:3,nodeBudget:5000}});
  for(let i=0;i<4;i++){sample.push({kind:'all-spells',decisionIndex:i,state:engine.cloneState(g)});engine.applyChoice(g,chooseAIAction(g).id);}
 }
 // Warm V8 on both actual-kit and full-roster trees. Timing excludes snapshots,
 // replay, disk IO, worker startup, and rendering. Browser/hardware may differ.
 for(const item of [...sample.slice(0,4),...sample.slice(-4)])chooseAIAction(item.state);
 const timings=[];
 for(let repeat=0;repeat<3;repeat++)for(const [stateId,item]of sample.entries()){
  const g=item.state,side=engine.actorToMove(g),start=performance.now(),d=chooseAIAction(g),wallMs=performance.now()-start;
  assert(engine.legalActions(g).includes(d.id));
  timings.push({stateId,kind:item.kind,caseId:item.caseId??null,decisionIndex:item.decisionIndex,repeat,phase:g.pending[1-side]===null?'commit':'respond',loadout:g.actors[side].kit.loadout,level:g.actors[side].kit.level,legal:engine.legalActions(g).length,wallMs,searchMs:d.elapsedMs,depth:d.completedDepth,nodes:d.totalNodes,id:d.id});
 }
 const groups=[];for(const kind of ['kit','all-spells'])for(const phase of ['all','commit','respond']){
  const xs=timings.filter(t=>t.kind===kind&&(phase==='all'||t.phase===phase));groups.push({kind,phase,wallMs:distribution(xs.map(t=>t.wallMs)),depths:count(xs.map(t=>t.depth)),meanNodes:mean(xs.map(t=>t.nodes))});
 }
 const exchangeTimings=[];for(let i=0;i<sample.length-1;i++){
  const a=sample[i],b=sample[i+1];if(a.kind!==b.kind||a.caseId!==b.caseId||a.decisionIndex%2||b.decisionIndex!==a.decisionIndex+1)continue;
  for(let repeat=0;repeat<3;repeat++)exchangeTimings.push({kind:a.kind,caseId:a.caseId??null,decisionIndex:a.decisionIndex,repeat,wallMs:timings.find(t=>t.stateId===i&&t.repeat===repeat).wallMs+timings.find(t=>t.stateId===i+1&&t.repeat===repeat).wallMs});
 }
 const latency={measurement:'Sequential chooseAIAction wall time, performance.now milliseconds, default 3-exchange/5000-node search, no degradation, after warmup; no worker startup/rendering/IO. Three repeats on fixed recorded states are timing repeats, not independent games. Exchange time sums two decisions; a human turn usually waits for one NPC decision.',groups,exchangeGroups:['kit','all-spells'].map(kind=>({kind,wallMs:distribution(exchangeTimings.filter(t=>t.kind===kind).map(t=>t.wallMs))})),timings,exchangeTimings};
 fs.writeFileSync(path.join(out,'latency.json'),JSON.stringify(latency,null,2));console.log(JSON.stringify({latency:groups,exchanges:latency.exchangeGroups}));
}
