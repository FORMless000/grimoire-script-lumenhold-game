// Descriptive confirmation report. Never selects or rewrites a candidate.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {rng} from '../reference-engine.mjs';
import {summarize} from './metrics.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const readRun=name=>fs.readFileSync(path.join(root,'results',name,'matches.ndjson'),'utf8').trim().split('\n').map(JSON.parse);
const validation=readRun('variety-validation-no-ward-01');
const policies={search:readRun('variety-gaps-no-ward-01'),shallow:readRun('variety-gaps-shallow-no-ward-01'),face:readRun('variety-gaps-face-no-ward-01')};
const isMain=r=>!['worn','all-spells','resource-access'].includes(r.scenario);
const main=validation.filter(isMain),summary=summarize(main);
const win=r=>Number(r.state.result.outcome==='win');
const mean=(rows,fn)=>rows.reduce((n,r)=>n+fn(r),0)/rows.length;
const pct=x=>(100*x).toFixed(1)+'%';
const bootstrapSeed=871203,replicates=2000;
function interval(rows,fn){
 const groups=new Map();for(const r of rows){const g=groups.get(r.seed)??[];g.push(fn(r));groups.set(r.seed,g);}
 const seeds=[...groups.values()],u=rng(bootstrapSeed),samples=[];
 for(let b=0;b<replicates;b++){
  let total=0,n=0;
  for(let i=0;i<seeds.length;i++){const g=seeds[Math.floor(u()*seeds.length)];for(const x of g){total+=x;n++;}}
  samples.push(total/n);
 }
 samples.sort((a,b)=>a-b);return {mean:mean(rows,fn),low:samples[Math.floor(.025*replicates)],high:samples[Math.floor(.975*replicates)],independentSeeds:seeds.length};
}
const levelRates=Object.fromEntries([20,50,80].map(level=>[level,interval(main.filter(r=>r.level===level),win)]));
const resourceComparison={};
for(const objective of ['frugal','prudent','allout']){
 const rows=main.filter(r=>r.objective===objective);
 resourceComparison[objective]={win:interval(rows,win),net:Object.fromEntries(['mana','gold','health','renown','mood'].map(k=>[k,interval(rows,r=>r.state.settlement.resources[k].netLoss)]))};
}
const matchKey=r=>[r.level,r.scenario,r.gap,r.seed,r.episode].join('|');
const alloutByCase=new Map(main.filter(r=>r.objective==='allout').map(r=>[matchKey(r),r]));
const pairedComparison={};
for(const objective of ['frugal','prudent']){
 const rows=main.filter(r=>r.objective===objective);
 pairedComparison[objective]={winDifference:interval(rows,r=>win(r)-win(alloutByCase.get(matchKey(r)))),netDifferences:Object.fromEntries(['mana','gold','health','renown','mood'].map(k=>[k,interval(rows,r=>r.state.settlement.resources[k].netLoss-alloutByCase.get(matchKey(r)).state.settlement.resources[k].netLoss)]))};
}
const gaps=Object.fromEntries(Object.entries(policies).map(([policy,rows])=>[policy,Object.fromEntries([20,50,80].map(level=>[level,Object.fromEntries([-20,-10,0,10,20].map(gap=>{const r=rows.filter(r=>r.level===level&&r.gap===gap);return [gap,{games:r.length,wins:r.reduce((n,r)=>n+win(r),0),...interval(r,win)}];}))]))]));
const byScenario=Object.fromEntries([...new Set(validation.map(r=>r.scenario))].map(key=>[key,summarize(validation.filter(r=>r.scenario===key))]));
const decisions=main.flatMap(r=>r.decisions.filter(d=>!d.castUsed).map(d=>({...d,level:r.level,objective:r.objective,seed:r.seed})));
const depths={};for(const d of decisions)depths[d.choice.depth]=(depths[d.choice.depth]??0)+1;
// Same named argument, rounded acceptance chance, level and objective, but a
// different public resource state. Such pairs demonstrate a stateful decision,
// not just policy preference or a threshold on the displayed percentage.
const conditioned=new Map();
for(const d of decisions.filter(d=>['face','deflect'].includes(d.choice.id))){const key=[d.card,Math.round(d.chance*100),d.level,d.objective].join('|');const group=conditioned.get(key)??{};group[d.choice.id]??=d;conditioned.set(key,group);}
const examples=[...conditioned.values()].filter(g=>g.face&&g.deflect).slice(0,4);
const audit=JSON.parse(fs.readFileSync(path.join(root,'results/variety-tune-no-ward-01/audit-expanded-06.json')));
const convergence=JSON.parse(fs.readFileSync(path.join(root,'results/variety-tune-no-ward-01/convergence-expanded-06.json')));
const metrics={bootstrapSeed,replicates,method:'Seed-cluster percentile bootstrap; paired policies share seeds. Contexts and levels are fixed fixtures, not a random campaign sample.',summary,levelRates,resourceComparison,pairedComparison,gaps,byScenario,depths,statefulExamples:examples,audit,convergence};
const out=path.join(root,'results/variety-validation-no-ward-01/analysis.json');
fs.writeFileSync(out,JSON.stringify(metrics,null,2),{flag:'wx'});
const spellTotal=Object.values(summary.spells).reduce((a,b)=>a+b,0);
let md=`# No-Ward confirmation · research version 6\n\nCandidate 6 was selected using training only, before these independent seeds were evaluated. The aggregate-fitness leader was candidate 5, but its level-80 training win rate missed the declared lower band. Candidate 6 met all three per-level training bands. Ward has no useful effect, including when imported older tuning tries to restore it. It remains castable, paying Mana and Suspicion.\n\n`;
md+=`The held-out study contains ${validation.length} games on 24 independent seed clusters (base 529371), across three resource objectives and fixed encounter/profile fixtures. Every action tape replayed exactly. These are full wins; partial agreements count as failures.\n\n`;
md+='| Player level = DC | Full wins, ordinary kits | 95% seed-cluster interval |\n| --- | --- | --- |\n';
for(const[level,x]of Object.entries(levelRates))md+=`| ${level} | ${pct(x.mean)} | ${pct(x.low)}–${pct(x.high)} |\n`;
md+='\n| Objective | Full wins | Mean net Mana | Gold | Health | Renown | Mood |\n| --- | --- | --- | --- | --- | --- | --- |\n';
for(const[key,x]of Object.entries(resourceComparison))md+=`| ${key} | ${pct(x.win.mean)} | ${['mana','gold','health','renown','mood'].map(k=>x.net[k].mean.toFixed(2)).join(' | ')} |\n`;
md+='\nGold is never rebated. Other costs above are after their configured 50% rebates. Resource gains cannot earn negative spending utility. Differences in wins are noisy paired-seed estimates; a Frugal win advantage is not evidence that it is globally stronger than All-out.\n\n';
for(const[key,x]of Object.entries(pairedComparison))md+=`${key} minus All-out, paired by encounter/level/seed: win difference ${(100*x.winDifference.mean).toFixed(1)} percentage points (95% seed-cluster interval ${(100*x.winDifference.low).toFixed(1)} to ${(100*x.winDifference.high).toFixed(1)}); Mana difference ${x.netDifferences.mana.mean.toFixed(2)} (interval ${x.netDifferences.mana.low.toFixed(2)} to ${x.netDifferences.mana.high.toFixed(2)}). Negative costs mean savings.\n\n`;
md+=`Responses: Confront ${summary.actions.face??0}, Deflect ${summary.actions.deflect??0}, Withdraw ${summary.actions.withdraw??0}. Deflect share ${pct(summary.deflectShare)}. Ordinary-kit effective spell count ${summary.effectiveSpells.toFixed(2)}; top spell ${pct(summary.topSpellShare)}; top pair ${pct(summary.topPairShare)}. Effective count is exp(Shannon entropy), a concentration statistic, not proof of strategic depth.\n\n`;
md+='| Spell in ordinary-kit games | Casts | Share |\n| --- | --- | --- |\n';
for(const[id,n]of Object.entries(summary.spells).sort((a,b)=>b[1]-a[1]))md+=`| ${id} | ${n} | ${pct(n/spellTotal)} |\n`;
for(const key of ['worn','all-spells','resource-access']){const x=byScenario[key];md+=`\n${key}: ${x.wins}/${x.games} wins (${pct(x.winRate)}), ${Object.keys(x.spells).length} spells used, effective count ${x.effectiveSpells.toFixed(2)}, top spell ${pct(x.topSpellShare)}, top pair ${pct(x.topPairShare)}. All-spell/resource-access explicitly grant the full roster; these are stress tests, not ordinary campaign kits.\n`;}
md+='\n## Difficulty gaps\n\nPrudent policy, General audience, Balanced kit; gap changes encounter DC and its Agreement target. At boundaries, DC is clamped to 1–100. Each cell uses 24 seeds and has substantial uncertainty.\n\n| Player level | DC −20 | −10 | Equal | +10 | +20 |\n| --- | --- | --- | --- | --- | --- |\n';
for(const level of [20,50,80])md+=`| ${level} | ${[-20,-10,0,10,20].map(gap=>pct(gaps.search[level][gap].mean)).join(' | ')} |\n`;
md+='\n| Same-level General audience | Always Confront | One-response search | Two-response screening search |\n| --- | --- | --- | --- |\n';
for(const level of [20,50,80])md+=`| ${level} | ${['face','shallow','search'].map(policy=>pct(gaps[policy][level][0].mean)).join(' | ')} |\n`;
md+=`\n## Search evidence and limits\n\nThe simulator uses vector-valued sampled expectimax, not alpha–beta or reinforcement learning. It branches check outcomes exactly, samples unknown future arguments from the public pool, and tracks temporary spell durations, costs and settlement. Fixed-work screening uses two responses, 16,000 nodes, three argument strata and a continuation beam of eight. All legal root actions are scored. Three objectives compare win estimates and normalized post-rebate losses, with a 6/2/0-percentage-point local win allowance. The browser worker has a 50 ms cooperative budget. Displayed E is heuristic utility, not a calibrated win percentage.\n\n`;
md+=`On ${audit.n} frozen states, one-response versus stronger search changed ${pct(audit.shallowDisagreement)} of decisions; two-response changed ${pct(audit.mediumDisagreement)}. Mean utility regret under the stronger evaluator was ${audit.meanShallowRegret.toFixed(4)} / ${audit.meanMediumRegret.toFixed(4)}. Strong completed depths: ${JSON.stringify(audit.completedStrongDepths)}. In the wider/horizon check (${convergence.n} ordinary-kit states), deeper disagreement ${pct(convergence.deeperDisagreement)}, mean regret ${convergence.meanDeeperRegret.toFixed(4)}; wider disagreement ${pct(convergence.widerDisagreement)}, mean regret ${convergence.meanWiderRegret.toFixed(4)}. Completed depths: deeper ${JSON.stringify(convergence.deeperDepths)}, wider ${JSON.stringify(convergence.widerDepths)}. Incomplete depth attempts do not count as convergence.\n\n`;
md+='Exact reduced endgames, including free-action spell choices, agree with an independently exhaustive JavaScript solver. The original v3 still passes 1,605 transitions, 102 spell/rank cases, 12 search goldens and 28 tests. This validates those mechanics and small searches; it does not certify optimal whole-game play.\n\n';
md+='Common strategies are to confront favorable signals, preserve on-record/personal/public acceptance benefits, use cheap supported checks before spending Suspicion on magic, restore Resolve before fatigue or a large Mood bill, and pay/discount explicit concessions only when their certainty is worth the resources. Deflect becomes less attractive as Patience runs low or its accumulated Suspicion risk rises. Spell recovery cannot farm Mana above entry.\n\n';
md+='Reproduce from the manifests and frozen sources in the result directories. Bootstrap seed 871203, 2,000 seed-cluster replicates. The public states and exact scores for examples where the same argument/chance produces different actions are retained in analysis.json. All work remains inside the negotiation experiment; no main-game commits were made.\n';
fs.writeFileSync(path.join(root,'research/REPORT-no-ward-01.md'),md,{flag:'wx'});
fs.copyFileSync(fileURLToPath(import.meta.url),out+'.source.mjs');
fs.copyFileSync(new URL('./metrics.mjs',import.meta.url),out+'.metrics.mjs');
console.log(md);
