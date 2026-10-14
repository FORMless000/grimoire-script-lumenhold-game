#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {runMatch,episodeSeed,seededRng} from './harness.mjs';
import {policies} from './policies.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const args=process.argv.slice(2),get=(name,fallback)=>{const i=args.indexOf('--'+name);return i<0?fallback:args[i+1];};
const iteration=get('iteration','v01'),episodes=Number(get('episodes','32')),baseSeed=Number(get('seed','20261014'));
if(!/^[a-z0-9_-]+$/.test(iteration)||!Number.isInteger(episodes)||episodes<2||!Number.isInteger(baseSeed))throw Error('Use a valid iteration, at least two episodes and an integer seed.');
const adapterPath=path.join(root,'iterations',iteration,'adapter.mjs');
const adapter=await import(pathToFileURL(adapterPath));
const out=path.resolve(get('out',path.join(root,'results',iteration+'-'+new Date().toISOString().replace(/[:.]/g,'-'))));
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.mkdirSync(out); // Intentionally refuses to overwrite an existing run.
const schema='minigame-benchmark-1',cases=[];
const combatPolicies=['scripted','rush','greedy','reactive'],gaps=[-15,-10,-5,0,5,10,15];
const add=c=>cases.push({caseId:cases.length,...c});
for(const a of adapter.archetypes)for(const p of combatPolicies)for(const q of combatPolicies)
  add({suite:'policy',mode:'combat',level:50,archA:a,archB:a,policyA:p,policyB:q,paired:true});
for(const level of [20,50,80])for(const a of adapter.archetypes)for(const b of adapter.archetypes)
  add({suite:'archetype',mode:'combat',level,archA:a,archB:b,policyA:'greedy',policyB:'greedy',paired:true});
for(const gap of gaps)for(const a of adapter.archetypes)for(const p of ['rush','greedy'])
  add({suite:'skill_only',mode:'combat',level:50,gap,archA:a,archB:a,policyA:p,policyB:p,skillShift:gap,paired:true});
for(const gap of gaps)for(const a of adapter.archetypes)for(const p of ['rush','greedy'])
  add({suite:'accuracy_only',mode:'combat',level:50,gap,archA:a,archB:a,policyA:p,policyB:p,checkShift:gap,paired:true});
for(const level of [20,50,80])for(const gap of gaps)for(const a of adapter.archetypes)
  add({suite:'level_gap',mode:'combat',level,opponentLevel:level-gap,gap,archA:a,archB:a,policyA:'greedy',policyB:'greedy',paired:true});
for(const level of [20,50,80])for(const a of ['Envoy','Illusionist'])for(const b of adapter.archetypes)for(const fixture of ['workshop_request','formal_petition'])
  for(const p of ['honest','deceiver','opportunist'])for(const q of ['scripted','skeptic','impatient'])
    add({suite:'negotiation',mode:'negotiation',level,archA:a,archB:b,fixture,policyA:p,policyB:q,paired:false});
for(const a of adapter.archetypes)for(const p of combatPolicies)for(const information of ['blind','native','exact'])
  add({suite:'information',mode:'combat',level:50,archA:a,archB:a,policyA:p,policyB:'scripted',information,paired:false});

const hashes={};
for(const f of ['harness.mjs','policies.mjs','run.mjs','iterations/'+iteration+'/adapter.mjs','iterations/'+iteration+'/engine.mjs']){
  hashes[f]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
  const target=path.join(out,'sources',f);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,f),target);
}
const manifest={schema,iteration,createdAtUTC:new Date().toISOString(),nodeVersion:process.version,episodes,baseSeed,sourceHashes:hashes,cases,
  definitions:{episode:'Fresh check rolls only; level-seeded kit and AI candidate draws unchanged.',seatPair:'Combat case is played in both engine seats with the focal policy/kit moved together.',skillOnly:'All six focal skills shifted (including Vigor initiative); ranks, entry balances, kit seed and tape held fixed; no clipping allowed.',accuracyOnly:'Virtual comparison skills shifted in checks only, leaving initiative and all actual kit values fixed.',native:'Left sees native tells/Forecast, right sees prior public state only.',blind:'Neither policy sees the current committed command; Foresight still gives its numerical bonus.',exact:'Left sees the committed command, not future rolls.',win:'Full focal win; partial and loss reported separately. Timeout rules can produce two failures.',interval:'95% percentile bootstrap over episode-index clusters; cases and seat swaps sharing check draws are resampled together; intervals describe this finite scenario panel, not human play.'},
  policyNames:Object.keys(policies)};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
const fd=fs.openSync(path.join(out,'matches.csv'),'wx');
fs.writeSync(fd,'case_id,episode,episode_seed,focal_seat,outcome,other_outcome,rounds,timeout,no_winner,health_gross,health_net,mood_gross,mood_net,renown_gross,renown_net,mana_gross,mana_net,crowns_gross,crowns_net\n');
const groups=new Map(),traceList=[];let buffer='',matchCount=0;
function groupKey(c){
  if(c.suite==='policy')return [c.suite,c.policyA,c.policyB].join('|');
  if(c.suite==='archetype')return [c.suite,c.level,c.archA,c.archB].join('|');
  if(['skill_only','accuracy_only','level_gap'].includes(c.suite))return [c.suite,c.level,c.gap,c.policyA].join('|');
  if(c.suite==='negotiation')return [c.suite,c.level,c.fixture,c.policyA,c.policyB].join('|');
  return [c.suite,c.policyA,c.information].join('|');
}
function collect(c,episode,seat,m){
  const key=groupKey(c),g=groups.get(key)??{key,suite:c.suite,n:0,win:0,partial:0,lose:0,rounds:0,timeouts:0,noWinner:0,costs:{},actions:{},clusters:new Map()};
  const outcome=m.outcomes[seat],other=m.outcomes[1-seat],ledger=m.ledgers[seat];
  g.n++;g[outcome]++;g.rounds+=m.rounds;g.timeouts+=Number(m.timeout);g.noWinner+=Number(m.noWinner);
  const cluster=g.clusters.get(episode)??{n:0,win:0};cluster.n++;cluster.win+=Number(outcome==='win');g.clusters.set(episode,cluster);
  for(const [k,row]of Object.entries(ledger)){g.costs[k]??={gross:0,net:0};g.costs[k].gross+=row.spent;g.costs[k].net+=row.netLoss;}
  for(const pair of m.commands){const cmd=pair[seat],k=cmd.id+(cmd.application?':'+cmd.application:'');g.actions[k]=(g.actions[k]??0)+1;}
  groups.set(key,g);
  const numbers=['health','mood','renown','mana','crowns'].flatMap(k=>[ledger[k].spent,ledger[k].netLoss]);
  buffer+=[c.caseId,episode,episodeSeed(baseSeed,episode),seat,outcome,other,m.rounds,Number(m.timeout),Number(m.noWinner),...numbers].join(',')+'\n';
  if(buffer.length>100000){fs.writeSync(fd,buffer);buffer='';}
}
for(const c of cases){
  for(let ep=0;ep<episodes;ep++)for(const seat of c.paired?[0,1]:[0]){
    const flip=seat===1;
    const config={mode:c.mode,playerArchetype:flip?c.archB:c.archA,opponentArchetype:flip?c.archA:c.archB,
      playerLevel:flip?(c.opponentLevel??c.level):c.level,opponentLevel:flip?c.level:(c.opponentLevel??c.level),...(c.fixture?{fixture:c.fixture}:{})};
    const keepTrace=ep===0&&seat===0&&c.caseId%20===0;
    const m=runMatch(adapter,{config,episodeSeed:episodeSeed(baseSeed,ep),skillShift:c.skillShift??0,skillShiftSide:seat,checkShift:c.checkShift??0,
      leftPolicy:flip?c.policyB:c.policyA,rightPolicy:flip?c.policyA:c.policyB,information:c.information??'native',keepTrace});
    collect(c,ep,seat,m);if(keepTrace)traceList.push({caseId:c.caseId,...m.trace});matchCount++;
  }
  if(c.caseId%100===0)console.log('Completed '+matchCount+' matches; '+c.suite+' case '+c.caseId+'/'+cases.length);
}
if(buffer)fs.writeSync(fd,buffer);fs.closeSync(fd);
function interval(clusters) {
  const rng=seededRng(baseSeed),values=[...clusters.values()],samples=[];
  for(let b=0;b<1000;b++){let n=0,w=0;for(let i=0;i<values.length;i++){const c=values[Math.floor(rng()*values.length)];n+=c.n;w+=c.win;}samples.push(w/n);}
  samples.sort((a,b)=>a-b);return [samples[25],samples[974]];
}
const summary=[...groups.values()].map(g=>({
  key:g.key,suite:g.suite,n:g.n,winRate:g.win/g.n,partialRate:g.partial/g.n,lossRate:g.lose/g.n,winRate95:interval(g.clusters),meanRounds:g.rounds/g.n,timeoutRate:g.timeouts/g.n,noWinnerRate:g.noWinner/g.n,
  meanCosts:Object.fromEntries(Object.entries(g.costs).map(([k,v])=>[k,{gross:v.gross/g.n,net:v.net/g.n}])),actions:g.actions,
  actionEntropyBits:(()=>{const n=Object.values(g.actions).reduce((a,b)=>a+b,0);return Object.values(g.actions).reduce((h,v)=>h-v/n*Math.log2(v/n),0);})()
}));
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({schema,matchCount,groups:summary},null,2));
fs.writeFileSync(path.join(out,'traces.json'),JSON.stringify(traceList,null,2));
const pct=x=>(100*x).toFixed(1)+'%';
let report='# Prototype '+iteration+' simulation results\n\n'+matchCount+' matches; '+episodes+' episode seeds per configuration; paired combat seats.\n\n';
for(const suite of ['policy','skill_only','accuracy_only','level_gap','information','negotiation']){
  report+='## '+suite+'\n\n| Group | Full win | Partial | Timeout | 95% episode-cluster interval | Net Mana |\n|---|---:|---:|---:|---|---:|\n';
  for(const g of summary.filter(g=>g.suite===suite))report+='| '+g.key+' | '+pct(g.winRate)+' | '+pct(g.partialRate)+' | '+pct(g.timeoutRate)+' | '+g.winRate95.map(pct).join('–')+' | '+g.meanCosts.mana.net.toFixed(1)+' |\n';
  report+='\n';
}
report+='Raw matches are in matches.csv; every case and source hash is in manifest.json. Archetype matrices are in summary.json. See the benchmark README for limitations. Intervals resample shared episode clusters, not individual dependent matches. These are bounded simple policies, not optimal players or human enjoyment tests.\n';
fs.writeFileSync(path.join(out,'REPORT.md'),report);
console.log('RESULTS='+out+'\nMATCHES='+matchCount);
