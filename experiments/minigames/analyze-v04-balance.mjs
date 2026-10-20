#!/usr/bin/env node
// Additional balance and degradation summaries from an already audited panel.
import fs from 'node:fs';import path from 'node:path';
if(!process.argv[2])throw Error('Pass audited result directory');
const run=path.resolve(process.argv[2]),rows=JSON.parse(fs.readFileSync(path.join(run,'matches.json'))),summary=JSON.parse(fs.readFileSync(path.join(run,'summary.json')));
const dist=xs=>{const a=xs.slice().sort((a,b)=>a-b);return {n:a.length,median:a[Math.ceil(a.length*.5)-1],p95:a[Math.ceil(a.length*.95)-1],max:a.at(-1)};};
const byLevel=[20,50,80].map(level=>{const xs=rows.filter(r=>r.panel==='generic'&&r.band===level);return {level,n:xs.length,censored:xs.filter(r=>r.censored).length,rounds:dist(xs.filter(r=>!r.censored).map(r=>r.rounds))};});
const generic=summary.byLoadout.reduce((m,r)=>{const a=m[r.loadout]??={loadout:r.loadout,n:0,wins:0,losses:0,censored:0};for(const k of ['n','wins','losses','censored'])a[k]+=r[k];return m;},{});
const decisions=rows.flatMap(r=>r.searchStats),degradation={attempts:decisions.filter(d=>d.mistakeAttempted).length,actual:decisions.filter(d=>d.degraded).length,decisions:decisions.length,skips:decisions.filter(d=>d.degradationSkipped).reduce((m,d)=>(m[d.degradationSkipped]=(m[d.degradationSkipped]??0)+1,m),{})};
const basic=(summary.allActions.counts.strike??0)+(summary.allActions.counts.guard??0),lateBasic=(summary.lateActions.counts.strike??0)+(summary.lateActions.counts.guard??0);
const spellRates=Object.entries(summary.allActions.whenLegal).sort((a,b)=>b[1].chosen-a[1].chosen);
const report={byLevel,generic:Object.values(generic),byCharacter:summary.byCharacter.map(x=>({name:x.loadout,wins:x.wins,losses:x.losses,censored:x.censored})),allActions:summary.allActions.n,basicStrikeGuardFraction:basic/summary.allActions.n,lateStrikeGuardFraction:lateBasic/summary.lateActions.n,actionCounts:summary.allActions.top,spellRates,degradation,skillGap:summary.panels.find(x=>x.panel==='skill-gap'),firstCommit:summary.byFirstCommit};
const target=path.join(run,'balance-detail.json');if(fs.existsSync(target))throw Error('Refusing overwrite');fs.writeFileSync(target,JSON.stringify(report,null,2));fs.copyFileSync(new URL(import.meta.url),path.join(run,'balance-runner.mjs'));console.log(JSON.stringify(report,null,2));
