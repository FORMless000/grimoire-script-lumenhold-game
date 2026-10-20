#!/usr/bin/env node
// Analyse frozen action histories, then run paired diagnostic policies/kit ablations.
// Removing learned spells is an experiment only; the browser and game rules are untouched.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const combatDir=path.resolve(arg('combat','experiments/minigames/results/v02-20261014-cross-skill-direct'));
const negotiationDir=path.resolve(arg('negotiation','experiments/minigames/results/v02-20261014-negotiation-skill-direct'));
const out=path.resolve(arg('out','experiments/minigames/results/v02-20261014-strategy-analysis'));
fs.mkdirSync(out);fs.mkdirSync(path.join(out,'sources'));
const read=(dir,name)=>JSON.parse(fs.readFileSync(path.join(dir,name)));
const inputs=[combatDir,negotiationDir].map(dir=>({dir,manifest:read(dir,'manifest.json'),matches:read(dir,'matches.json')}));
for(const input of inputs)for(const [f,hash]of Object.entries(input.manifest.sourceHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(input.dir,'sources',f))).digest('hex'),hash);
const sourceFiles=['harness.mjs','policies.mjs','iterations/v02/roster.mjs','iterations/v02/engine.mjs','iterations/v02/ai.mjs','iterations/v02/adapter.mjs'];
for(const f of sourceFiles){assert.equal(inputs[0].manifest.sourceHashes[f],inputs[1].manifest.sourceHashes[f]);const target=path.join(out,'sources',f);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(combatDir,'sources',f),target);}
const scriptPath=fileURLToPath(import.meta.url);fs.copyFileSync(scriptPath,path.join(out,'sources','run-v02-strategy.mjs'));
const adapter=await import(pathToFileURL(path.join(out,'sources/iterations/v02/adapter.mjs')));
const engine=await import(pathToFileURL(path.join(out,'sources/iterations/v02/engine.mjs')));
const {runMatch}=await import(pathToFileURL(path.join(out,'sources/harness.mjs')));
const mode=m=>m.config.mode??'combat';
const sources=inputs.flatMap(input=>input.matches.map(m=>({...m,panel:input.manifest.suite})));
const baseline=sources.filter(m=>m.skillShift===0);
const observations=[];
for(const m of sources){
 const g=adapter.create(m.config,{skillShift:m.skillShift});
 for(const d of m.searchStats){
  assert.equal(engine.actorToMove(g),d.side);assert.equal(g.round,d.round);
  const side=d.side,a=g.actors[side],planning=engine.planningSide(g)!==null;
  assert.equal(planning,d.planning);assert(engine.legalActions(g).includes(d.id));
  observations.push({panel:m.panel,caseId:m.caseId,mode:mode(m),level:a.kit.level,archetype:a.kit.archetype,side,
   role:mode(m)==='combat'?'combatant':side===0?'persuader':'audience',gap:m.skillShift,approach:m.config.approach,
   round:g.round,id:d.id,phase:planning?'planning':a.queue.length?'forced':g.pending[1-side]===null?'first':'response',
   incoming:g.pending[1-side],legal:engine.legalActions(g),hpFraction:a.hp/a.maxHP,mana:a.resources.mana,flux:a.flux});
  adapter.advance(g,d.id);
 }
 assert(g.result);assert.deepEqual(adapter.metrics(g).commands,m.commands);assert.deepEqual(adapter.metrics(g).outcomes,m.outcomes);
}
const counts=xs=>{const c={};for(const id of xs)c[id]=(c[id]??0)+1;return c;};
const top=c=>Object.entries(c).sort((a,b)=>b[1]-a[1]);
function profile(rows,matches){
 const ordinary=rows.filter(r=>r.phase!=='planning'),free=ordinary.filter(r=>r.phase!=='forced');
 const actions=counts(ordinary.map(r=>r.id)),choices=counts(free.map(r=>r.id)),opportunities=counts(free.flatMap(r=>r.legal));
 const n=free.length,entropy=-Object.values(choices).reduce((sum,count)=>sum+(count/n)*Math.log(count/n),0);
 const trajectories=matches.map(({m,side})=>{const seq=m.commands.map(pair=>pair[side].id);let streak=0,max=0;
  for(const id of seq){streak=id==='strike'?streak+1:0;max=Math.max(max,streak);}
  return {sequence:seq.join(' → '),allStrike:seq.every(id=>id==='strike'),maxStrikeStreak:max,outcome:m.outcomes[side],spellTypes:new Set(seq.filter(id=>!engine.BASICS.includes(id))).size};});
 const seqCounts=counts(trajectories.map(t=>t.sequence)),bigrams=counts(matches.flatMap(({m,side})=>m.commands.slice(1).map((pair,i)=>m.commands[i][side].id+' → '+pair[side].id)));
 const openers=counts(matches.map(({m,side})=>m.commands[0][side].id));
 const responses={};for(const r of free.filter(r=>r.phase==='response')){responses[r.incoming]??={};responses[r.incoming][r.id]=(responses[r.incoming][r.id]??0)+1;}
 return {actualCommands:ordinary.length,discretionaryChoices:n,forcedCommands:ordinary.length-n,planningChoices:rows.length-ordinary.length,
  actions,choices,affordableChoiceRate:Object.fromEntries(Object.entries(opportunities).map(([id,opportunities])=>[id,{chosen:choices[id]??0,opportunities,rate:(choices[id]??0)/opportunities}])),
  effectiveActions:Math.exp(entropy),largestChoiceShare:n?Math.max(...Object.values(choices))/n:0,
  trajectories:trajectories.length,allStrikeTrajectories:trajectories.filter(t=>t.allStrike).length,
  strikeStreakAtLeast3:trajectories.filter(t=>t.maxStrikeStreak>=3).length,
  noSpellTrajectories:trajectories.filter(t=>t.spellTypes===0).length,
  meanSpellTypes:trajectories.reduce((s,t)=>s+t.spellTypes,0)/Math.max(1,trajectories.length),
  openers,mostCommonSequences:top(seqCounts).slice(0,8),mostCommonBigrams:top(bigrams).slice(0,10),responses};
}
const profiles=[];
for(const level of [20,50,80])for(const role of ['combatant','persuader','audience'])for(const archetype of adapter.archetypes){
 const rows=observations.filter(r=>r.gap===0&&r.level===level&&r.role===role&&r.archetype===archetype);if(!rows.length)continue;
 const matches=baseline.flatMap(m=>[0,1].filter(side=>m.config.playerLevel===level&&(side===0?m.config.playerArchetype:m.config.opponentArchetype)===archetype&&(mode(m)==='combat'?'combatant':side===0?'persuader':'audience')===role).map(side=>({m,side})));
 profiles.push({level,role,archetype,...profile(rows,matches)});
}
const globalProfiles=[];
for(const panel of ['cross','negotiation'])for(const scope of ['baseline','all'])for(const side of [0,1]){
 const matches=sources.filter(m=>m.panel===panel&&(scope==='all'||m.skillShift===0));
 globalProfiles.push({panel,scope,side,...profile(observations.filter(r=>r.panel===panel&&r.side===side&&(scope==='all'||r.gap===0)),matches.map(m=>({m,side})))});
}
fs.writeFileSync(path.join(out,'observations.json'),JSON.stringify({profiles,globalProfiles},null,2));
fs.writeFileSync(path.join(out,'decision-states.json'),JSON.stringify(observations));
const cases=[];
const add=(m,variant)=>cases.push({reference:{panel:m.panel,caseId:m.caseId},config:m.config,skillShift:0,leftPolicy:variant==='strike-only'?'rush':'alpha',rightPolicy:'alpha',variant});
for(const m of baseline){add(m,'strike-only');add(m,'basics-only');
 if(mode(m)==='combat'&&m.config.playerArchetype==='Evoker')add(m,'no-flame');
 if(mode(m)==='combat'&&['Restorer','Envoy'].includes(m.config.playerArchetype))add(m,'no-restoration');
 if(mode(m)==='negotiation'&&[m.config.playerArchetype,m.config.opponentArchetype].some(a=>['Seer','Illusionist'].includes(a)))add(m,'no-foresight-both');
 if(mode(m)==='combat'&&m.config.playerLevel===80&&['Evoker','Seer','Restorer'].includes(m.config.playerArchetype)||
   mode(m)==='negotiation'&&[50,80].includes(m.config.playerLevel)&&m.config.playerArchetype==='Illusionist'&&m.config.approach==='bluff'&&['Evoker','Seer','Envoy'].includes(m.config.opponentArchetype))add(m,'deeper-both');
}
const manifest={schema:'v02-strategy-diagnostic-1',createdUTC:new Date().toISOString(),node:process.version,inputs:inputs.map(i=>({dir:i.dir,sourceHashes:i.manifest.sourceHashes,matches:i.matches.length})),
 analysisSourceHash:crypto.createHash('sha256').update(fs.readFileSync(scriptPath)).digest('hex'),cases,
 semantics:'No gameplay randomness. Equal imposed-skill-adjustment controls only. Strike-only changes focal policy with its full kit still visible to the opponent. Spell-removal ablations change learned spells of the indicated actor(s), visible to both searches; skills, ranks of retained spells, resources and capacity remain fixed. Deeper-both uses maxDepth 5 and nodeBudget 25000 on both sides in a targeted 60-case panel. All other search settings are preserved. Outcome labels and resource costs are reported separately; no confidence intervals.'};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
const lookup=new Map(sources.map(m=>[m.panel+'|'+m.caseId,m]));
const results=[];
for(const [caseId,c]of cases.entries()){
 const diagnostic={...adapter,create(config,options){const g=adapter.create(config,options);
  if(c.variant==='deeper-both')g.config={...g.config,search:{maxDepth:5,nodeBudget:25000}};
  const remove=(side,predicate)=>{g.actors[side].kit={...g.actors[side].kit,spells:Object.fromEntries(Object.entries(g.actors[side].kit.spells).filter(([id])=>!predicate(id)))};};
  if(c.variant==='basics-only')remove(0,()=>true);
  if(c.variant==='no-flame')remove(0,id=>id==='flame');
  if(c.variant==='no-restoration')remove(0,id=>id==='restoration');
  if(c.variant==='no-foresight-both')for(const side of [0,1])remove(side,id=>id==='foresight');
  return g;}};
 const m=runMatch(diagnostic,{...c,keepTrace:caseId%48===0}),ref=lookup.get(c.reference.panel+'|'+c.reference.caseId);
 for(const ledger of m.ledgers)for(const r of Object.values(ledger))assert(r.final>=0&&r.final<=r.entry+1e-8);
 results.push({caseId,...c,...m,terminationReason:m.trace?.result.reason,referenceOutcomes:ref.outcomes,referenceRounds:ref.rounds});
 if(caseId%48===0)console.log(`strategy: ${caseId+1}/${cases.length}`);
}
fs.writeFileSync(path.join(out,'matches.json'),JSON.stringify(results,null,2));
function tally(rows){return {n:rows.length,win:rows.filter(m=>m.outcomes[0]==='win').length,partial:rows.filter(m=>m.outcomes[0]==='partial').length,lose:rows.filter(m=>m.outcomes[0]==='lose').length,
 unchanged:rows.filter(m=>m.outcomes[0]===m.referenceOutcomes[0]).length,
 lostFullWin:rows.filter(m=>m.referenceOutcomes[0]==='win'&&m.outcomes[0]!=='win').length,
 gainedFullWin:rows.filter(m=>m.referenceOutcomes[0]!=='win'&&m.outcomes[0]==='win').length,
 referenceWin:rows.filter(m=>m.referenceOutcomes[0]==='win').length,referencePartial:rows.filter(m=>m.referenceOutcomes[0]==='partial').length,referenceLose:rows.filter(m=>m.referenceOutcomes[0]==='lose').length,
 meanManaNet:rows.reduce((s,m)=>s+m.ledgers[0].mana.netLoss,0)/rows.length,
 meanHealthNet:rows.reduce((s,m)=>s+m.ledgers[0].health.netLoss,0)/rows.length,
 meanRounds:rows.reduce((s,m)=>s+m.rounds,0)/rows.length,
 actions:counts(rows.flatMap(m=>m.commands.flatMap(pair=>pair.map(c=>c.id)))),
 searchDepths:counts(rows.flatMap(m=>m.searchStats.map(s=>String(s.completedDepth))))};}
const groups=[];
for(const variant of [...new Set(cases.map(c=>c.variant))])for(const game of ['combat','negotiation'])for(const level of [20,50,80]){
 const rows=results.filter(m=>m.variant===variant&&mode(m)===game&&m.config.playerLevel===level);if(rows.length)groups.push({variant,mode:game,level,...tally(rows)});
}
const byKit=[];
for(const variant of ['strike-only','basics-only'])for(const game of ['combat','negotiation'])for(const level of [20,50,80])for(const archetype of adapter.archetypes){
 const rows=results.filter(m=>m.variant===variant&&mode(m)===game&&m.config.playerLevel===level&&m.config.playerArchetype===archetype);if(rows.length)byKit.push({variant,mode:game,level,archetype,...tally(rows)});
}
const summary={diagnosticMatches:results.length,originalMatchesReconstructed:sources.length,originalDecisionsReconstructed:observations.length,groups,byKit};
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2));
console.log('RESULTS='+out);console.log(JSON.stringify({diagnosticMatches:results.length,groups:groups.map(({actions,searchDepths,...r})=>r)},null,2));
