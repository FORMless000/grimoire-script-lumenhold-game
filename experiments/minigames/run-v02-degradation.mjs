#!/usr/bin/env node
// Paired Ward/AI experiment: explicit scenario seeds, unchanged level-seeded kits.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
import * as adapter from './iterations/v02/adapter.mjs';import {runMatch} from './harness.mjs';
const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const out=path.resolve(arg('out','experiments/minigames/results/v02-20261014-ward-degradation'));
const episodes=Number(arg('episodes','4')),baseSeed=Number(arg('seed','20261014')),chance=Number(arg('chance','.30'));
if(!Number.isInteger(episodes)||episodes<1||!Number.isInteger(baseSeed)||baseSeed<0||baseSeed>0xffffffff||!Number.isFinite(chance)||chance<0||chance>1)throw Error('Invalid benchmark parameters');
fs.mkdirSync(out);const root=path.dirname(fileURLToPath(import.meta.url));
const sourceHashes={};for(const f of ['harness.mjs','policies.mjs','run-v02-degradation.mjs','iterations/v02/roster.mjs','iterations/v02/engine.mjs','iterations/v02/ai.mjs','iterations/v02/adapter.mjs']){
 const b=fs.readFileSync(path.join(root,f)),target=path.join(out,'sources',f);sourceHashes[f]=crypto.createHash('sha256').update(b).digest('hex');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,b);
}
const scenarios=[];
for(const level of [20,50,80])for(const a of adapter.archetypes)for(const b of adapter.archetypes)for(const firstLeader of [0,1])scenarios.push({panel:'cross-kit',skillShift:0,config:{playerLevel:level,opponentLevel:level,playerArchetype:a,opponentArchetype:b,firstLeader}});
for(const gap of [-5,5])for(const a of adapter.archetypes)for(const firstLeader of [0,1])scenarios.push({panel:'skill-gap',skillShift:gap,config:{playerLevel:50,opponentLevel:50,playerArchetype:a,opponentArchetype:a,firstLeader}});
for(const level of [20,50,80])for(const a of ['Envoy','Illusionist'])for(const b of adapter.archetypes)for(const fixture of ['workshop_request','formal_petition'])for(const approach of ['reason','appeal','bluff'])for(const firstLeader of [0,1])scenarios.push({panel:'negotiation',skillShift:0,config:{mode:'negotiation',playerLevel:level,opponentLevel:level,playerArchetype:a,opponentArchetype:b,fixture,approach,firstLeader}});
function seedFor(s,episode){
 // Exclude commitment order/profile: paired conditions share policy draws at a
 // matching actor/round/forecast slot. Other encounters have separate streams.
 const {firstLeader,search,ai,...identity}=s.config;let n=(baseSeed+Math.imul(episode+1,0x9e3779b9))>>>0;
 for(const ch of JSON.stringify([identity,s.skillShift]))n=Math.imul(n^ch.charCodeAt(0),16777619)>>>0;return n;
}
const presets={full:{maxDepth:3,mistakeChance:0},shallow:{maxDepth:1,mistakeChance:0},fallible:{maxDepth:3,mistakeChance:chance},shallow_fallible:{maxDepth:1,mistakeChance:chance}};
const pairings=[['full','full'],['full','shallow'],['full','fallible'],['fallible','fallible'],['full','shallow_fallible']];
const cases=[];
for(const [scenarioId,s]of scenarios.entries())for(const [left,right]of pairings){
 // Combined degradation is a smaller exploratory panel: mirrored combat, plus
 // matched-kit level-50 negotiation. The independent controls cover every kit pair.
 if(right==='shallow_fallible'&&!(s.panel==='cross-kit'&&s.config.playerArchetype===s.config.opponentArchetype||s.panel==='negotiation'&&s.config.playerLevel===50&&s.config.playerArchetype===s.config.opponentArchetype))continue;
 const stochastic=presets[left].mistakeChance>0||presets[right].mistakeChance>0;
 for(let episode=0;episode<(stochastic?episodes:1);episode++){
  const seed=seedFor(s,episode);cases.push({scenarioId,panel:s.panel,pairing:left+'/'+right,episode,skillShift:s.skillShift,config:{healthModel:'direct',...s.config,search:{maxDepth:3,nodeBudget:5000},ai:[{...presets[left],seed,maxRegret:35},{...presets[right],seed,maxRegret:35}]},leftPolicy:'alpha',rightPolicy:'alpha'});
 }
}
const manifest={schema:'v02-degradation-benchmark-1',rulesVersion:adapter.RULES_VERSION,createdUTC:new Date().toISOString(),node:process.version,baseSeed,episodes,chance,sourceHashes,scenarios,cases,
 ward:{rankCostsAtScale2:[20,16,12],rankBlocksAtScale3:[30,36,42]},
 semantics:'Only AI choices are random; kits stay seeded by level. Skill-gap cases shift all focal skills only. Four episode seeds per stochastic condition by default, with common policy draws across pairings and commitment orders. Rates are finite scenario/AI-seed fractions; seed ranges are descriptive, no independent-human or binomial claims. Combined degradation is exploratory on a smaller mirrored panel. Main search: 5000 nodes; attempted errors may spend 5000 more nodes obtaining exact root scores at the same completed depth, otherwise they are declined.'};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
const raw=[];
for(const [caseId,c]of cases.entries()){
 const m=runMatch(adapter,{...c,keepTrace:caseId%128===0});
 for(const ledger of m.ledgers)for(const r of Object.values(ledger))assert(r.final>=-1e-8&&r.final<=r.entry+1e-8);
 for(const s of m.searchStats)if(s.degraded){assert(s.regret>0&&s.regret<=35);assert.equal(s.rankingDepth,s.completedDepth);assert.notEqual(s.id,s.bestId);}
 raw.push({caseId,...c,...m});if(caseId%128===0)console.log(`Ward/degradation: ${caseId+1}/${cases.length}`);
}
fs.writeFileSync(path.join(out,'matches.json'),JSON.stringify(raw,null,2));
const counts=ids=>{const c={};for(const id of ids)c[id]=(c[id]??0)+1;return c;};
const mean=xs=>xs.reduce((s,x)=>s+x,0)/Math.max(1,xs.length),q=(xs,p)=>{const sorted=[...xs].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.ceil(p*sorted.length)-1)]??0;};
function tally(rows){const stats=rows.flatMap(m=>m.searchStats),win=rows.filter(m=>m.outcomes[0]==='win').length,partial=rows.filter(m=>m.outcomes[0]==='partial').length;
 const byEpisode=[...new Set(rows.map(m=>m.episode))].map(episode=>{const rs=rows.filter(m=>m.episode===episode);return {episode,n:rs.length,winRate:rs.filter(m=>m.outcomes[0]==='win').length/rs.length};});
 return {n:rows.length,win,partial,lose:rows.length-win-partial,winRate:win/rows.length,partialRate:partial/rows.length,
  timeouts:rows.filter(m=>m.timeout).length,mutualKO:rows.filter(m=>m.initiativeTie||m.terminationReason==='defeat'&&m.outcomes.every(o=>o==='partial')).length,
  meanRounds:mean(rows.map(m=>m.rounds)),manaGross:mean(rows.map(m=>m.ledgers[0].mana.spent)),manaNet:mean(rows.map(m=>m.ledgers[0].mana.netLoss)),healthNet:mean(rows.map(m=>m.ledgers[0].health.netLoss)),renownNet:mean(rows.map(m=>m.ledgers[0].renown.netLoss)),
  actions:[0,1].map(side=>counts(rows.flatMap(m=>m.commands.map(pair=>pair[side].id)))),
  allStrike:[0,1].map(side=>rows.filter(m=>m.commands.every(pair=>pair[side].id==='strike')).length),
  decisions:stats.length,attempts:stats.filter(s=>s.mistakeAttempted).length,accepted:stats.filter(s=>s.degraded).length,
  skips:counts(stats.filter(s=>s.degradationSkipped).map(s=>s.degradationSkipped)),
  meanDepth:mean(stats.map(s=>s.completedDepth)),p95Ms:q(stats.map(s=>s.elapsedMs),.95),p99Ms:q(stats.map(s=>s.elapsedMs),.99),maxMs:stats.reduce((v,s)=>Math.max(v,s.elapsedMs),0),byEpisode};
}
const groups=[];
for(const panel of ['cross-kit','skill-gap','negotiation'])for(const level of [20,50,80])for(const pairing of pairings.map(p=>p.join('/')))for(const gap of (panel==='skill-gap'?[-5,5]:[0])){
 const rows=raw.filter(m=>m.panel===panel&&m.config.playerLevel===level&&m.pairing===pairing&&m.skillShift===gap);if(rows.length)groups.push({panel,level,pairing,gap,...tally(rows)});
}
const byKit=[];
for(const level of [20,50,80])for(const pairing of pairings.map(p=>p.join('/')))for(const archetype of adapter.archetypes){const rows=raw.filter(m=>m.panel==='cross-kit'&&m.config.playerLevel===level&&m.pairing===pairing&&m.config.playerArchetype===archetype);if(rows.length)byKit.push({level,pairing,archetype,...tally(rows)});}
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({matches:raw.length,scenarios:scenarios.length,groups,byKit},null,2));
let report='# Ward rebalance and degraded AI benchmark\n\n'+raw.length+' matches; '+scenarios.length+' controlled scenarios. AI randomness only. See manifest for exact seeds, policy parameters, panel coverage and frozen sources.\n\n| Panel | Level | Gap | Focal / opponent | Cases | Full win | Partial | Loss | Timeout | Opponent Strike-only | Opponent Ward casts | Accepted errors (both sides) |\n|---|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|\n';
const pct=(n,d)=>(100*n/d).toFixed(1)+'%';
for(const g of groups)report+=`| ${g.panel} | ${g.level} | ${g.gap} | ${g.pairing} | ${g.n} | ${pct(g.win,g.n)} | ${pct(g.partial,g.n)} | ${pct(g.lose,g.n)} | ${pct(g.timeouts,g.n)} | ${pct(g.allStrike[1],g.n)} | ${g.actions[1].ward??0} | ${g.accepted}/${g.attempts} |\n`;
report+='\nA 30% configured chance is an attempt chance, not a guaranteed error fraction. No safe weaker candidate, a forced command or insufficient exact-ranking depth can prevent an error. Four seed results are preserved separately in summary.json; do not interpret pooled cases as independent human trials.\n';
fs.writeFileSync(path.join(out,'REPORT.md'),report);console.log('RESULTS='+out+'\n'+JSON.stringify({matches:raw.length,groups:groups.length}));
