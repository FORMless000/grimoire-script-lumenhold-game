#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
import * as adapter from './iterations/v02/adapter.mjs';import {runMatch} from './harness.mjs';
import {createState,applyChoice,generateKit} from './iterations/v02/engine.mjs';import {searchAction} from './iterations/v02/ai.mjs';
const args=process.argv.slice(2),get=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const suite=get('suite','policy'),out=path.resolve(get('out','experiments/minigames/results/v02-'+suite+'-'+new Date().toISOString().replace(/[:.]/g,'-'))),healthModel=get('health-model','direct');
const search={maxDepth:Number(get('depth','3')),nodeBudget:Number(get('nodes','5000'))},root=path.dirname(fileURLToPath(import.meta.url));
if(!['policy','balance','cross','negotiation','latency'].includes(suite))throw Error('Choose policy, balance, cross, negotiation or latency');
fs.mkdirSync(path.dirname(out),{recursive:true});fs.mkdirSync(out);const cases=[],excludedCases=[];
if(suite==='policy')for(const level of [20,50,80])for(const a of adapter.archetypes)for(const opponent of ['alpha','greedy','rush','defender'])for(const firstLeader of [0,1])cases.push({group:`policy|${opponent}|${level}`,config:{playerLevel:level,opponentLevel:level,playerArchetype:a,opponentArchetype:a,firstLeader,healthModel,search},leftPolicy:'alpha',rightPolicy:opponent});
if(suite==='balance'){
 for(const gap of [-10,-5,0,5,10])for(const a of adapter.archetypes)for(const firstLeader of [0,1])cases.push({group:`skill|${gap}`,skillShift:gap,config:{playerLevel:50,opponentLevel:50,playerArchetype:a,opponentArchetype:a,firstLeader,healthModel,search},leftPolicy:'alpha',rightPolicy:'alpha'});
 for(const a of adapter.archetypes)for(const b of adapter.archetypes)for(const firstLeader of [0,1])cases.push({group:`kit|${a}|${b}`,config:{playerLevel:50,opponentLevel:50,playerArchetype:a,opponentArchetype:b,firstLeader,healthModel,search},leftPolicy:'alpha',rightPolicy:'alpha'});
 for(const playerArchetype of ['Envoy','Illusionist'])for(const fixture of ['workshop_request','formal_petition'])for(const approach of ['reason','appeal','bluff'])for(const b of adapter.archetypes)for(const firstLeader of [0,1])cases.push({group:`negotiation|${playerArchetype}|${fixture}|${approach}`,config:{mode:'negotiation',playerArchetype,opponentArchetype:b,fixture,approach,firstLeader,search},leftPolicy:'alpha',rightPolicy:'alpha'});
}
// Change skills alone: preserve the level seed, spell ranks, capacity and entry resources.
// Invalid shifts are recorded, never clipped; the analysis uses a complete paired subset.
if(suite==='cross')for(const level of [20,50,80])for(const a of adapter.archetypes)for(const b of adapter.archetypes)for(const gap of [-10,-5,0,5,10])for(const firstLeader of [0,1]){
 const c={group:`cross|${level}|${gap}|${a}|${b}`,skillShift:gap,config:{playerLevel:level,opponentLevel:level,playerArchetype:a,opponentArchetype:b,firstLeader,healthModel,search},leftPolicy:'alpha',rightPolicy:'alpha'};
 const invalid=Object.entries(generateKit(a,level).skills).filter(([,v])=>v+gap<1||v+gap>100);
 if(invalid.length)excludedCases.push({...c,reason:'Skill shift outside 1–100',invalidSkills:invalid.map(([skill,base])=>({skill,base,shifted:base+gap}))});else cases.push(c);
}
if(suite==='negotiation')for(const level of [20,50,80])for(const a of ['Envoy','Illusionist'])for(const b of adapter.archetypes)for(const fixture of ['workshop_request','formal_petition'])for(const approach of ['reason','appeal','bluff'])for(const gap of [-10,-5,0,5,10])for(const firstLeader of [0,1]){
 const c={group:`negotiation|${level}|${gap}|${a}|${fixture}|${approach}`,skillShift:gap,config:{mode:'negotiation',playerLevel:level,opponentLevel:level,playerArchetype:a,opponentArchetype:b,fixture,approach,firstLeader,healthModel,search},leftPolicy:'alpha',rightPolicy:'alpha'};
 const invalid=Object.entries(generateKit(a,level).skills).filter(([,v])=>v+gap<1||v+gap>100);
 if(invalid.length)excludedCases.push({...c,reason:'Skill shift outside 1–100',invalidSkills:invalid.map(([skill,base])=>({skill,base,shifted:base+gap}))});else cases.push(c);
}
const hashes={};for(const f of ['harness.mjs','policies.mjs','run-v02.mjs','iterations/v02/roster.mjs','iterations/v02/engine.mjs','iterations/v02/ai.mjs','iterations/v02/adapter.mjs']){const source=fs.readFileSync(path.join(root,f));hashes[f]=crypto.createHash('sha256').update(source).digest('hex');const p=path.join(out,'sources',f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,source);}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({schema:'minigame-benchmark-2',rulesVersion:adapter.RULES_VERSION,createdUTC:new Date().toISOString(),node:process.version,suite,healthModel,search,cases,excludedCases,skillShiftSemantics:'Add to all six focal skills only; keep kit level/seed, spell ranks, capacity, HP and entry budgets fixed. Reject values outside 1–100.',sourceHashes:hashes,randomness:'None in gameplay or policies. Levels seed kits and deterministic move ordering. Cases are scenario sweeps, not independent random trials; no binomial confidence intervals.'},null,2));
const quantile=(xs,p)=>{const a=[...xs].sort((a,b)=>a-b);return a.length?a[Math.min(a.length-1,Math.ceil(p*a.length)-1)]:0;};
if(suite==='latency'){
 const rows=[];
 for(const access of ['kit','all'])for(const a of adapter.archetypes){const s=createState({playerArchetype:a,opponentArchetype:a,spellAccess:access});for(const [depth,nodes]of [[2,1500],[3,3500],[3,5000]]){searchAction(s,{maxDepth:depth,nodeBudget:nodes});const runs=Array.from({length:3},()=>searchAction(s,{maxDepth:depth,nodeBudget:nodes}));rows.push({archetype:a,access,phase:'normal',depth,nodes,runs});}
 if(s.actors[0].kit.spells.foresight){applyChoice(s,'guard');applyChoice(s,'foresight');const result=searchAction(s,search);rows.push({archetype:a,access,phase:'foresight early commitment',...result});}}
 fs.writeFileSync(path.join(out,'latency.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows.map(r=>({...r,runs:r.runs?.map(x=>({ms:x.elapsedMs,depth:x.completedDepth,nodes:x.nodes}))})),null,2));process.exit(0);
}
const raw=[],groups=new Map(),times=[],depths=[];
for(const [caseId,c]of cases.entries()){
 const m=runMatch(adapter,{...c,keepTrace:caseId%24===0}),record={caseId,...c,...m};raw.push(record);const g=groups.get(c.group)??{key:c.group,n:0,win:0,partial:0,lose:0,timeouts:0,rounds:0,manaGross:0,manaNet:0,healthNet:0,actions:{}};
 g.n++;g[m.outcomes[0]]++;g.timeouts+=Number(m.timeout);g.rounds+=m.rounds;g.manaGross+=m.ledgers[0].mana.spent;g.manaNet+=m.ledgers[0].mana.netLoss;g.healthNet+=m.ledgers[0].health.netLoss;
 for(const pair of m.commands){const id=pair[0].id;g.actions[id]=(g.actions[id]??0)+1;}for(const s of m.searchStats){times.push(s.elapsedMs);depths.push(s.completedDepth);}groups.set(c.group,g);
 if(caseId%24===0)console.log(`${suite}: ${caseId+1}/${cases.length} cases`);
}
const summary=[...groups.values()].map(g=>({...g,winRate:g.win/g.n,partialRate:g.partial/g.n,timeoutRate:g.timeouts/g.n,meanRounds:g.rounds/g.n,manaGross:g.manaGross/g.n,manaNet:g.manaNet/g.n,healthNet:g.healthNet/g.n}));
const performanceSummary={decisions:times.length,p50Ms:quantile(times,.5),p95Ms:quantile(times,.95),p99Ms:quantile(times,.99),maxMs:Math.max(0,...times),noCompletedIteration:depths.filter(d=>d===0).length,meanCompletedDepth:depths.reduce((a,b)=>a+b,0)/Math.max(1,depths.length)};
fs.writeFileSync(path.join(out,'matches.json'),JSON.stringify(raw,null,2));fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({matches:cases.length,groups:summary,performance:performanceSummary},null,2));
let report=`# v02 ${suite} scenario sweep\n\n${cases.length} deterministic matches; both initial commitment orders. Health model: ${healthModel}. Rates describe this finite scenario panel, not stochastic win probabilities.\n\n| Case group | Full win | Partial | Timeout | Rounds | Gross mana | Net mana |\n|---|---:|---:|---:|---:|---:|---:|\n`;
for(const g of summary)report+=`| ${g.key} | ${(g.winRate*100).toFixed(1)}% | ${(g.partialRate*100).toFixed(1)}% | ${(g.timeoutRate*100).toFixed(1)}% | ${g.meanRounds.toFixed(1)} | ${g.manaGross.toFixed(1)} | ${g.manaNet.toFixed(1)} |\n`;
report+='\nSearch measurements on this machine:\n\n```json\n'+JSON.stringify(performanceSummary,null,2)+'\n```\n';fs.writeFileSync(path.join(out,'REPORT.md'),report);console.log('RESULTS='+out+'\n'+JSON.stringify(performanceSummary));
