#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
// Wilson intervals describe encounter-seed sampling, conditional on this timed AI run.
export function wilson(w,n){if(!n)return [0,1];const z=1.959963984540054,p=w/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [Math.max(0,c-h),Math.min(1,c+h)];}
const bump=(o,k,n=1)=>{o[k]=(o[k]??0)+n;};
const args=process.argv.slice(2),at=args.indexOf('--out');
if(at<1||!args[at+1])throw Error('Usage: node analyze-v03-skills.mjs <run directories...> --out <fresh directory>');
const out=path.resolve(args[at+1]);fs.mkdirSync(path.dirname(out),{recursive:true});fs.mkdirSync(out);
const groups=new Map(),pairs=new Map(),strategies=new Map(),timings=[],depths=[];let totalMatches=0,totalDecisions=0;
for(const dir of args.slice(0,at)){
 const root=path.resolve(dir),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))),audit=JSON.parse(fs.readFileSync(path.join(root,'audit.json'))),matches=JSON.parse(fs.readFileSync(path.join(root,'matches.json')));
 assert.equal(matches.length,manifest.cases.length);assert.equal(audit.matches,matches.length);assert(audit.allCommandTapesReplayed);
 const engine=await import(pathToFileURL(path.join(root,'sources/iterations/v03/engine.mjs'))),ai=await import(pathToFileURL(path.join(root,'sources/iterations/v03/ai.mjs')));
 for(const m of matches){
   totalMatches++;const c=m.config,key=JSON.stringify([manifest.mode,c.level,c.opponentLevel,c.archetype,c.opponent,c.fixture,c.resources??{},m.leftPolicy]);
   const g=groups.get(key)??{mode:manifest.mode,level:c.level,opponentLevel:c.opponentLevel,kit:c.archetype,profile:c.opponent,fixture:c.fixture,resources:c.resources??{},policy:m.leftPolicy,n:0,win:0,partial:0,lose:0,meanRounds:0,net:{mood:0,renown:0,mana:0,crowns:0},actions:{},patterns:{},termination:{}};
   g.n++;g[m.outcomes[0]]++;g.meanRounds+=m.rounds;for(const k of Object.keys(g.net))g.net[k]+=m.ledgers[0][k].netLoss;
   bump(g.termination,m.terminationReason);for(const h of m.history)bump(g.actions,h.action);
   const pattern=m.history.filter(h=>!engine.SPELLS[h.action]).map(h=>({confront:'C',deflect:'D',withdraw:'W'}[h.action])).join('');bump(g.patterns,pattern);groups.set(key,g);
   for(const d of m.searchStats){timings.push(d.elapsedMs);depths.push(d.completedDepth);totalDecisions++;}
   if(['presets','boundaries'].includes(manifest.mode)&&['search','greedy'].includes(m.leftPolicy)){
     const pk=JSON.stringify([c.level,c.opponentLevel,m.episodeSeed]),p=pairs.get(pk)??{level:c.level,opponentLevel:c.opponentLevel};p[m.leftPolicy]={win:m.outcomes[0]==='win',net:m.ledgers[0]};pairs.set(pk,p);
   }
   if(m.leftPolicy!=='search')continue;
   const sk=JSON.stringify([manifest.mode,c.fixture]),st=strategies.get(sk)??{mode:manifest.mode,fixture:c.fixture,games:0,wins:0,actions:{},spells:{},winningSpells:{},winningPatterns:{},patterns:{},deflectPressure:{},confrontPressure:{},deflectRequests:{},attuneRecovery:{},spellGames:{},sameAsGreedy:0,decisions:0};
   st.games++;st.wins+=m.outcomes[0]==='win';bump(st.patterns,pattern);if(m.outcomes[0]==='win')bump(st.winningPatterns,pattern);
   const s=engine.createState({...c,seed:m.episodeSeed}),used=new Set();
   for(const h of m.history){
     bump(st.actions,h.action);st.decisions++;if(ai.greedyAction(engine.publicState(s))===h.action)st.sameAsGreedy++;
     if(h.action==='deflect'){bump(st.deflectPressure,s.pressure);bump(st.deflectRequests,s.intent);}
     if(h.action==='confront')bump(st.confrontPressure,s.pressure);
     if(engine.SPELLS[h.action]){bump(st.spells,h.action);used.add(h.action);if(m.outcomes[0]==='win')bump(st.winningSpells,h.action);}
     const restored=s.restored.mood;engine.applyAction(s,h.action);if(h.action==='attune')bump(st.attuneRecovery,s.restored.mood-restored);
   }
   for(const spell of used)bump(st.spellGames,spell);strategies.set(sk,st);
 }
}
const summaryGroups=[...groups.values()].map(g=>({...g,winRate:g.win/g.n,winCI95:wilson(g.win,g.n),meanRounds:g.meanRounds/g.n,net:Object.fromEntries(Object.entries(g.net).map(([k,v])=>[k,v/g.n]))}));
const paired=new Map();for(const p of pairs.values()){
 assert(p.search&&p.greedy);const key=p.level+'|'+p.opponentLevel,g=paired.get(key)??{level:p.level,opponentLevel:p.opponentLevel,n:0,bothWin:0,searchOnly:0,greedyOnly:0,neither:0,netDeltaWhenBothWin:{mood:0,renown:0,mana:0}};g.n++;
 if(p.search.win&&p.greedy.win){g.bothWin++;for(const k of Object.keys(g.netDeltaWhenBothWin))g.netDeltaWhenBothWin[k]+=p.search.net[k].netLoss-p.greedy.net[k].netLoss;}
 else if(p.search.win)g.searchOnly++;else if(p.greedy.win)g.greedyOnly++;else g.neither++;paired.set(key,g);
}
const pairedRows=[...paired.values()].map(g=>({...g,netDeltaWhenBothWin:Object.fromEntries(Object.entries(g.netDeltaWhenBothWin).map(([k,v])=>[k,g.bothWin?v/g.bothWin:null]))}));
const sorted=[...timings].sort((a,b)=>a-b),quantile=p=>sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1)]??0;
const summary={runs:args.slice(0,at),matches:totalMatches,searchDecisions:totalDecisions,groups:summaryGroups,paired:pairedRows,strategies:[...strategies.values()],performance:{p50Ms:quantile(.5),p95Ms:quantile(.95),p99Ms:quantile(.99),maxMs:quantile(1),over50Ms:timings.filter(t=>t>50).length,meanDepth:depths.reduce((a,b)=>a+b,0)/Math.max(1,depths.length)},caveats:['Intervals quantify encounter-seed sampling only.','Each row fixes the opponent-level-seeded traits; adjacent levels can differ.','Player presets also change spell ranks and Mana; this is not a skill-only comparison.','Search is budgeted and approximate, so these are AI results, not optimal-play or human win rates.','Partial agreements are not full wins.']};
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2),{flag:'wx'});
fs.copyFileSync(new URL(import.meta.url),path.join(out,'analysis-source.mjs'),fs.constants.COPYFILE_EXCL);
const lines=['| Player | Opponent | Search win rate (95% interval) | Greedy | Confront, no spells | Rhythm, no spells |','| ---: | ---: | --- | ---: | ---: | ---: |'];
for(const g of summaryGroups.filter(g=>['presets','boundaries'].includes(g.mode)&&g.policy==='search').sort((a,b)=>a.level-b.level||a.opponentLevel-b.opponentLevel)){
 const related=policy=>summaryGroups.find(x=>x.mode===g.mode&&x.level===g.level&&x.opponentLevel===g.opponentLevel&&x.policy===policy),pct=g=>g?(100*g.winRate).toFixed(0)+'%':'—';
 lines.push(`| ${g.level} | ${g.opponentLevel} (+${g.opponentLevel-g.level}) | ${pct(g)} (${g.winCI95.map(x=>(100*x).toFixed(0)).join('–')}%) | ${pct(related('greedy'))} | ${pct(related('confront'))} | ${pct(related('rhythm'))} |`);
}
fs.writeFileSync(path.join(out,'table.md'),lines.join('\n')+'\n',{flag:'wx'});
console.log(JSON.stringify({matches:summary.matches,groups:summaryGroups.length,searchDecisions:totalDecisions,out}));
