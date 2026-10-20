#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const run=path.resolve(arg('run','experiments/minigames/results/v02-20261014-ward-degradation'));
const oldDirs=[path.resolve(arg('old-combat','experiments/minigames/results/v02-20261014-cross-skill-direct')),path.resolve(arg('old-negotiation','experiments/minigames/results/v02-20261014-negotiation-skill-direct'))];
const read=(d,n)=>JSON.parse(fs.readFileSync(path.join(d,n))),raw=read(run,'matches.json'),summary=read(run,'summary.json');
const previous=oldDirs.flatMap(d=>read(d,'matches.json')),mode=m=>m.config.mode??'combat';
const key=m=>[mode(m),m.config.playerLevel??50,m.config.opponentLevel??50,m.config.playerArchetype,m.config.opponentArchetype,m.config.firstLeader,m.config.fixture??'',m.config.approach??'',m.skillShift??0].join('|');
const oldIndex=new Map(previous.map(m=>[key(m),m])),controlIndex=new Map(raw.filter(m=>m.pairing==='full/full').map(m=>[m.scenarioId,m]));
const mean=xs=>xs.reduce((a,b)=>a+b,0)/Math.max(1,xs.length),counts=xs=>{const c={};for(const x of xs)c[x]=(c[x]??0)+1;return c;};
function stats(rows){const n=rows.length;return {n,win:rows.filter(m=>m.outcomes[0]==='win').length,partial:rows.filter(m=>m.outcomes[0]==='partial').length,lose:rows.filter(m=>m.outcomes[0]==='lose').length,
 timeouts:rows.filter(m=>m.timeout).length,noWinner:rows.filter(m=>m.noWinner).length,
 mutualKO:rows.filter(m=>!m.timeout&&mode(m)==='combat'&&m.outcomes.every(o=>o==='partial')).length,
 mana:mean(rows.map(m=>m.ledgers[0].mana.netLoss)),health:mean(rows.map(m=>m.ledgers[0].health.netLoss)),
 actions:[0,1].map(side=>counts(rows.flatMap(m=>m.commands.map(p=>p[side].id)))),
 meanSpellTypes:[0,1].map(side=>mean(rows.map(m=>new Set(m.commands.map(p=>p[side].id).filter(id=>!['strike','guard','reclaim'].includes(id))).size)))};}
const wardComparison=[];
for(const game of ['combat','negotiation'])for(const level of [20,50,80]){
 const rows=raw.filter(m=>m.pairing==='full/full'&&mode(m)===game&&m.config.playerLevel===level&&m.skillShift===0),refs=rows.map(m=>oldIndex.get(key(m)));assert(refs.every(Boolean));wardComparison.push({mode:game,level,before:stats(refs),after:stats(rows)});
}
const errorProfiles=[];
for(const game of ['combat','negotiation'])for(const level of [20,50,80])for(const pairing of ['full/fallible','fallible/fallible','full/shallow_fallible']){
 const rows=raw.filter(m=>mode(m)===game&&m.config.playerLevel===level&&m.pairing===pairing&&m.skillShift===0);if(!rows.length)continue;
 const calls=rows.flatMap(m=>m.searchStats).filter(s=>s.mistakeChance>0),accepted=calls.filter(s=>s.degraded),attempted=calls.filter(s=>s.mistakeAttempted);
 const label={lose:0,partial:1,win:2};
 errorProfiles.push({mode:game,level,pairing,n:rows.length,degradedAICalls:calls.length,attempts:attempted.length,accepted:accepted.length,acceptedRate:accepted.length/calls.length,
 skips:counts(calls.filter(s=>s.degradationSkipped).map(s=>s.degradationSkipped)),regretMean:mean(accepted.map(s=>s.regret)),regretMax:accepted.reduce((v,s)=>Math.max(v,s.regret),0),
 improvedLabel:rows.filter(m=>label[m.outcomes[0]]>label[controlIndex.get(m.scenarioId).outcomes[0]]).length,worsenedLabel:rows.filter(m=>label[m.outcomes[0]]<label[controlIndex.get(m.scenarioId).outcomes[0]]).length,
 actual:stats(rows),control:stats(rows.map(m=>controlIndex.get(m.scenarioId)))});
}
const kitComparison=[];
for(const level of [20,50,80])for(const archetype of ['Evoker','Seer','Restorer','Illusionist','Envoy','Warden']){
 const rows=raw.filter(m=>m.pairing==='full/full'&&m.panel==='cross-kit'&&m.config.playerLevel===level&&m.config.playerArchetype===archetype);
 kitComparison.push({level,archetype,before:stats(rows.map(m=>oldIndex.get(key(m)))),after:stats(rows)});
}
const analysis={schema:'v02-ward-degradation-analysis-1',wardComparison,errorProfiles,kitComparison,sourceComparisons:oldDirs.map(d=>({dir:d,sourceHashes:read(d,'manifest.json').sourceHashes})),
 note:'Before/after Ward uses exact full/full scenario matches; AI weakening comparisons use the new Ward on both sides. Four policy seed streams, common draws across profiles/orders. Label improvement is ordinal only, not half-credit for partials. Combined profiles have smaller coverage; use their matched controls. More action variety under noise is not proof of more viable strategies.'};
const pct=(v,n)=>(100*v/n).toFixed(1)+'%',wpl=s=>[s.win,s.partial,s.lose].map(v=>pct(v,s.n)).join(' / ');
let report='# Ward and degraded-AI interpretation\n\nThe before/after control changes Ward while retaining full-strength AI. Degradation conditions all use the new Ward. W/P/L are full win / partial / loss; partials are never converted to half a win.\n\n## Ward, full/full controls\n\n| Game | Level | Cases | Before W/P/L | After W/P/L | Before timeout | After timeout | After both lose | Ward casts before → after (both sides) |\n|---|---:|---:|---|---|---:|---:|---:|---:|\n';
for(const r of wardComparison)report+=`| ${r.mode} | ${r.level} | ${r.after.n} | ${wpl(r.before)} | ${wpl(r.after)} | ${pct(r.before.timeouts,r.before.n)} | ${pct(r.after.timeouts,r.after.n)} | ${r.after.noWinner} | ${(r.before.actions[0].ward??0)+(r.before.actions[1].ward??0)} → ${(r.after.actions[0].ward??0)+(r.after.actions[1].ward??0)} |\n`;
report+='\n## AI strength panels\n\nCross-kit and skill-gap panels have different coverage; the combined-degradation rows are exploratory mirrored cases. Seed ranges are descriptive, not confidence intervals.\n\n| Panel | Level | Gap | Focal / opponent | Matches | W/P/L | Full-win range by seed | Accepted errors / attempts |\n|---|---:|---:|---|---:|---|---|---:|\n';
for(const g of summary.groups){const rates=g.byEpisode.map(e=>e.winRate*100);report+=`| ${g.panel} | ${g.level} | ${g.gap} | ${g.pairing} | ${g.n} | ${[g.win,g.partial,g.lose].map(v=>pct(v,g.n)).join(' / ')} | ${Math.min(...rates).toFixed(1)}–${Math.max(...rates).toFixed(1)}% | ${g.accepted}/${g.attempts} |\n`;}
report+='\n## Realised error rate\n\nDenominator is calls to the error-enabled actor(s), including locked decisions. Declines are preserved individually in raw logs.\n\n| Game | Level | Pairing | Accepted / AI calls | Realised rate | Mean regret | Maximum regret |\n|---|---:|---|---:|---:|---:|---:|\n';
for(const r of errorProfiles)report+=`| ${r.mode} | ${r.level} | ${r.pairing} | ${r.accepted}/${r.degradedAICalls} | ${pct(r.accepted,r.degradedAICalls)} | ${r.regretMean.toFixed(2)} | ${r.regretMax.toFixed(2)} |\n`;
report+='\n## Kit control outcomes\n\n| Level | Focal kit | Before W/P/L | After W/P/L |\n|---|---|---|---|\n';
for(const r of kitComparison)report+=`| ${r.level} | ${r.archetype} | ${wpl(r.before)} | ${wpl(r.after)} |\n`;
report+='\nPolicy error bounds use the current evaluator and horizon, not a guarantee of long-term harmlessness. Search models perfect adversarial replies even when its opponent is fallible. Result labels can mark both combatants as failures at an unproductive timeout; those cases are shown explicitly. Negotiation timeouts use conversation-ending reasons rather than the combat-only timeout flag. No low-Health, optional HP-offset, other random seeds or other level seeds are inferred from this panel.\n';
fs.copyFileSync(fileURLToPath(import.meta.url),path.join(run,'sources','analyze-v02-degradation.mjs'),fs.constants.COPYFILE_EXCL);fs.writeFileSync(path.join(run,'interpretation.json'),JSON.stringify(analysis,null,2),{flag:'wx'});fs.writeFileSync(path.join(run,'INTERPRETATION.md'),report,{flag:'wx'});
console.log(JSON.stringify({wardComparison,errorProfiles:errorProfiles.map(({skips,actual,control,...r})=>r)},null,2));
