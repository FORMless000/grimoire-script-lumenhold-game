#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const dir=path.resolve(arg('strategy','experiments/minigames/results/v02-20261014-strategy-analysis'));
const rolesDir=path.resolve(arg('roles','experiments/minigames/results/v02-20261014-foresight-roles'));
const read=(d,n)=>JSON.parse(fs.readFileSync(path.join(d,n))),manifest=read(dir,'manifest.json'),obs=read(dir,'observations.json'),diagnostics=read(dir,'matches.json'),summary=read(dir,'summary.json');
const roles=read(rolesDir,'summary.json');
const references=new Map(manifest.inputs.flatMap(i=>read(i.dir,'matches.json').map(m=>[i.dir.includes('cross-skill')?'cross|'+m.caseId:'negotiation|'+m.caseId,m])));
const mode=m=>m.config.mode??'combat',mean=xs=>xs.reduce((s,v)=>s+v,0)/Math.max(1,xs.length);
const economy=[];
for(const group of summary.groups){const rows=diagnostics.filter(m=>m.variant===group.variant&&mode(m)===group.mode&&m.config.playerLevel===group.level);
 let sameLabelWithStrictResourceImprovement=0,sameLabelWithResourceTradeoff=0;
 for(const m of rows){const r=references.get(m.reference.panel+'|'+m.reference.caseId);assert(r);if(m.outcomes[0]!==r.outcomes[0])continue;
  const differences=Object.keys(r.ledgers[0]).map(k=>m.ledgers[0][k].netLoss-r.ledgers[0][k].netLoss);
  if(differences.every(d=>d<=1e-8)&&differences.some(d=>d<-1e-8))sameLabelWithStrictResourceImprovement++;
  else if(differences.some(d=>d>1e-8)&&differences.some(d=>d<-1e-8))sameLabelWithResourceTradeoff++;
 }
 economy.push({variant:group.variant,mode:group.mode,level:group.level,n:rows.length,sameLabelWithStrictResourceImprovement,sameLabelWithResourceTradeoff,
  baselineMana:mean(rows.map(m=>references.get(m.reference.panel+'|'+m.reference.caseId).ledgers[0].mana.netLoss)),mana:mean(rows.map(m=>m.ledgers[0].mana.netLoss)),
  baselineRenown:mean(rows.map(m=>references.get(m.reference.panel+'|'+m.reference.caseId).ledgers[0].renown.netLoss)),renown:mean(rows.map(m=>m.ledgers[0].renown.netLoss))});
}
const baselineNegotiation=[...references.entries()].filter(([k,m])=>k.startsWith('negotiation|')&&m.skillShift===0).map(([,m])=>m);
const approachUse=[];
for(const level of [20,50,80])for(const approach of ['reason','appeal','bluff']){
 const rows=baselineNegotiation.filter(m=>m.config.playerLevel===level&&m.config.approach===approach),spells=m=>m.commands.filter(p=>!['strike','guard','reclaim'].includes(p[0].id)).length;
 approachUse.push({level,approach,n:rows.length,spellCasts:rows.reduce((s,m)=>s+spells(m),0),spellCastsInLosses:rows.filter(m=>m.outcomes[0]==='lose').reduce((s,m)=>s+spells(m),0),allStrike:rows.filter(m=>m.commands.every(p=>p[0].id==='strike')).length});
}
const combatByLevel=[20,50,80].map(level=>{const rows=obs.profiles.filter(p=>p.role==='combatant'&&p.level===level),n=rows.reduce((s,p)=>s+p.trajectories,0);return {level,n,allStrike:rows.reduce((s,p)=>s+p.allStrikeTrajectories,0),noSpells:rows.reduce((s,p)=>s+p.noSpellTrajectories,0),meanSpellTypes:rows.reduce((s,p)=>s+p.meanSpellTypes*p.trajectories,0)/n};});
const interpretation={schema:'v02-strategy-analysis-1',diagnosticMatches:summary.diagnosticMatches+roles.matches,combatByLevel,approachUse,economy,foresightRoleGroups:roles.groups,
 note:'Counts are finite deterministic scenarios. Baseline profiles use both actor seats. Ordinary affordable-choice rates exclude forecast planning and locked execution. Spell-removal tests alter visible learned kits, not player game rules. Same-label resource comparisons concern realised costs against these AIs, not dominance against all possible opponents.'};
const pct=(n,d)=>(100*n/d).toFixed(1)+'%',rank=c=>Object.entries(c).sort((a,b)=>b[1]-a[1]);
let report='# v02 AI action profiles and strategy probes\n\nReconstructed all 3,228 prior matches and 45,713 decision states. Ran 1,752 strategy diagnostics plus 360 single-side Foresight removals. Ordinary choices, forecast planning, and locked executions are recorded separately. Baseline tables below use zero imposed skill adjustment.\n\n## Combat action trajectories\n\n| Level | Actor trajectories | Strike only | No spells | Mean distinct spells per trajectory |\n|---|---:|---:|---:|---:|\n';
for(const r of combatByLevel)report+=`| ${r.level} | ${r.n} | ${pct(r.allStrike,r.n)} | ${pct(r.noSpells,r.n)} | ${r.meanSpellTypes.toFixed(2)} |\n`;
report+='\n## Profiles by kit and role\n\nBoth seats are included for combat; negotiation roles remain separate. Each row summarises matched scenario trajectories, not independent players.\n\n| Level | Role | Kit | Trajectories | Strike only | Main actions (counts) | Common sequence |\n|---|---|---|---:|---:|---|---|\n';
for(const p of obs.profiles)report+=`| ${p.level} | ${p.role} | ${p.archetype} | ${p.trajectories} | ${pct(p.allStrikeTrajectories,p.trajectories)} | ${rank(p.actions).slice(0,4).map(([id,n])=>`${id}: ${n}`).join(', ')} | ${p.mostCommonSequences[0]?.[0]} |\n`;
report+='\n## Affordable spell choices, combat baseline\n\nBoth actors, ordinary discretionary decisions. Opportunity means learned and legal/affordable at that exact state. Conditional choice fractions are not causal estimates of value.\n\n| Spell | Selected | Affordable opportunities | Choice fraction |\n|---|---:|---:|---:|\n';
const p0=obs.globalProfiles.find(p=>p.panel==='cross'&&p.scope==='baseline'&&p.side===0),p1=obs.globalProfiles.find(p=>p.panel==='cross'&&p.scope==='baseline'&&p.side===1);
for(const [id,r]of Object.entries(p0.affordableChoiceRate).filter(([id])=>!['strike','guard','reclaim'].includes(id))){const q=p1.affordableChoiceRate[id];report+=`| ${id} | ${r.chosen+q.chosen} | ${r.opportunities+q.opportunities} | ${pct(r.chosen+q.chosen,r.opportunities+q.opportunities)} |\n`;}
report+='\n## Paired diagnostic outcomes\n\nEach variant is compared with the same baseline cases. W/P/L = full win / partial / loss for the focal actor. Strike-only leaves its full kit visible; basics-only removes focal learned spells so both searches know the restriction. Deeper-both increases the ceiling to five exchanges and 25,000 nodes, with no guarantee of completing that depth.\n\n| Variant | Game | Level | Cases | Baseline W/P/L | Variant W/P/L | Same label |\n|---|---|---:|---:|---|---|---:|\n';
for(const r of summary.groups)report+=`| ${r.variant} | ${r.mode} | ${r.level} | ${r.n} | ${r.referenceWin}/${r.referencePartial}/${r.referenceLose} | ${r.win}/${r.partial}/${r.lose} | ${r.unchanged} |\n`;
report+='\n## Single-side Foresight removals\n\nThe player removal covers Illusionist only; the audience removal covers Seer/Illusionist audiences with both persuader kits. Other spells/stats/resources are retained.\n\n| Removal | Level | Cases | Baseline W/P/L | Without W/P/L |\n|---|---:|---:|---|---|\n';
for(const r of roles.groups)report+=`| ${r.variant} | ${r.level} | ${r.n} | ${r.referenceOutcomes.join('/')} | ${r.outcomes.join('/')} |\n`;
report+='\n## Negotiation action variety by approach\n\nPersuader only. Spell counts in losing attempts help distinguish visible action variety from successful strategy variety.\n\n| Level | Approach | Cases | Strike-only trajectories | Spell casts | Spell casts in losses |\n|---|---|---:|---:|---:|---:|\n';
for(const r of approachUse)report+=`| ${r.level} | ${r.approach} | ${r.n} | ${r.allStrike} | ${r.spellCasts} | ${r.spellCastsInLosses} |\n`;
report+='\n## Economic qualification: Strike-only negotiation\n\nNet loss after settlement. Less Mana spending can trade against more Renown damage; equal outcome labels do not imply equal economic quality.\n\n| Level | Baseline Mana | Strike-only Mana | Baseline Renown | Strike-only Renown | Same label, strictly better resources |\n|---|---:|---:|---:|---:|---:|\n';
for(const r of economy.filter(r=>r.variant==='strike-only'&&r.mode==='negotiation'))report+=`| ${r.level} | ${r.baselineMana.toFixed(2)} | ${r.mana.toFixed(2)} | ${r.baselineRenown.toFixed(2)} | ${r.renown.toFixed(2)} | ${r.sameLabelWithStrictResourceImprovement}/${r.n} |\n`;
report+='\nProfiles include openers, response tables, common sequences/bigrams and legal opportunity counts in observations.json. Exact decision states, matched raw diagnostics, source snapshots, case manifests and replay audits are preserved. These tests do not prove game-theoretic dominance, human enjoyment, generalisation across all level seeds, or optimality of the evaluation function.\n';
fs.copyFileSync(fileURLToPath(import.meta.url),path.join(dir,'sources','analyze-v02-strategy.mjs'),fs.constants.COPYFILE_EXCL);
fs.writeFileSync(path.join(dir,'strategy-interpretation.json'),JSON.stringify(interpretation,null,2),{flag:'wx'});fs.writeFileSync(path.join(dir,'ANALYSIS.md'),report,{flag:'wx'});
console.log(JSON.stringify({diagnosticMatches:interpretation.diagnosticMatches,combatByLevel,approachUse},null,2));
