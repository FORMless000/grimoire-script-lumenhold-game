#!/usr/bin/env node
// Finite-panel win rates. Paired seats/orders are not independent random trials.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';
if(!process.argv[2])throw Error('Pass an audited complete cross-loadout result directory');
const out=path.resolve(process.argv[2]),read=f=>JSON.parse(fs.readFileSync(path.join(out,f)));
for(const f of ['cross-winrates.json','winrates.csv','REPORT.md'])assert(!fs.existsSync(path.join(out,f)),'Refusing overwrite: '+f);
const manifest=read('manifest.json'),audit=read('audit.json'),rows=read('matches.json');
const protocolFile=fs.readdirSync(out).find(f=>f.endsWith('.protocol.json')||f==='cross-loadouts-protocol.json');assert(protocolFile,'Missing cross-loadout protocol');
const protocol=read(protocolFile),names=protocol.loadouts,levels=protocol.levels;
for(const f of [...levels.map(l=>`matchups-${l}.csv`),'cross-loadouts-analyzer.mjs'])assert(!fs.existsSync(path.join(out,f)),'Refusing overwrite: '+f);
assert.deepEqual(manifest.sourceHashes,protocol.baselineSourceHashes,'Simulation source changed from the selected baseline');
assert.equal(manifest.rulesVersion,'combat-spells-v2-0.4.6');assert.equal(rows.length,protocol.totalCases);assert.equal(rows.length,audit.matches);assert(audit.frozenSourcesVerified);
for(const [f,hash]of Object.entries(manifest.sourceHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(out,'sources',f))).digest('hex'),hash,f);
const observation=(r,side)=>({caseId:r.caseId,pairId:r.pairId,loadout:side?r.config.opponentLoadout:r.config.playerLoadout,opponent:side?r.config.playerLoadout:r.config.opponentLoadout,
 level:side?r.config.opponentLevel:r.config.playerLevel,outcome:r.outcomes[side],censored:r.censored,rounds:r.rounds,firstCommit:side===r.config.firstLeader,
 decisions:r.searchStats.filter(d=>d.side===side)});
const actors=rows.flatMap(r=>[observation(r,0),observation(r,1)]);
for(const level of levels)for(let a=0;a<names.length;a++)for(let b=a+1;b<names.length;b++){
 const xs=rows.filter(r=>r.config.playerLevel===level&&[names[a],names[b]].includes(r.config.playerLoadout)&&[names[a],names[b]].includes(r.config.opponentLoadout));
 assert.equal(xs.length,4,`${level}/${names[a]}/${names[b]}`);assert.equal(new Set(xs.map(r=>[r.config.playerLoadout,r.config.firstLeader].join('|'))).size,4);
}
const stats=xs=>{
 const wins=xs.filter(x=>x.outcome==='win').length,losses=xs.filter(x=>x.outcome==='lose').length,draws=xs.filter(x=>x.outcome==='draw').length,censored=xs.filter(x=>x.censored).length,n=xs.length;
 assert.equal(wins+losses+draws+censored,n);const rounds=xs.map(x=>x.rounds).sort((a,b)=>a-b),decisions=xs.flatMap(x=>x.decisions),counts={};for(const d of decisions)counts[d.id]=(counts[d.id]??0)+1;
 return {n,wins,losses,draws,censored,winRate:n?wins/n:null,decisiveWinRate:wins+losses?wins/(wins+losses):null,unresolvedWinRateRange:n?[wins/n,(wins+censored)/n]:null,
  medianRounds:rounds[Math.ceil(n*.5)-1]??null,meanRounds:n?rounds.reduce((a,b)=>a+b,0)/n:null,
  actionCounts:counts,completedDepths:decisions.reduce((m,d)=>(m[d.completedDepth]=(m[d.completedDepth]??0)+1,m),{}),firstCommitWins:xs.filter(x=>x.firstCommit&&x.outcome==='win').length};
};
const byLoadout=names.map(loadout=>({loadout,overall:stats(actors.filter(a=>a.loadout===loadout)),byLevel:levels.map(level=>({level,...stats(actors.filter(a=>a.loadout===loadout&&a.level===level))}))}));
for(const row of byLoadout){assert.equal(row.overall.n,96);for(const band of row.byLevel)assert.equal(band.n,32);}
const matrices=levels.map(level=>({level,rows:names.map(loadout=>({loadout,opponents:names.filter(n=>n!==loadout).map(opponent=>({opponent,...stats(actors.filter(a=>a.level===level&&a.loadout===loadout&&a.opponent===opponent))}))}))}));
const ranked=[...byLoadout].sort((a,b)=>b.overall.winRate-a.overall.winRate||names.indexOf(a.loadout)-names.indexOf(b.loadout));
const summary={rulesVersion:manifest.rulesVersion,baseline:protocol.baseline,seed:protocol.seed,loadouts:names,levels,matches:rows.length,completed:rows.filter(r=>!r.censored).length,censored:rows.filter(r=>r.censored).length,draws:rows.filter(r=>r.noWinner).length,
 knockoutCount:rows.filter(r=>r.terminationReason==='knockout').length,legalDecisionsReplayed:audit.legalDecisionsReplayed,byLoadout,ranking:ranked.map(r=>r.loadout),matrices,
 byLevel:levels.map(level=>({level,...stats(actors.filter(a=>a.level===level))})),firstCommit:stats(actors.filter(a=>a.firstCommit)),semantics:protocol.semantics};
fs.writeFileSync(path.join(out,'cross-winrates.json'),JSON.stringify(summary,null,2));
const pct=n=>(100*n).toFixed(1)+'%',quote=s=>'"'+String(s).replaceAll('"','""')+'"';
fs.writeFileSync(path.join(out,'winrates.csv'),['loadout,games,wins,losses,draws,censored,winrate_level20,winrate_level50,winrate_level80,winrate_overall',...ranked.map(r=>[quote(r.loadout),r.overall.n,r.overall.wins,r.overall.losses,r.overall.draws,r.overall.censored,...r.byLevel.map(l=>l.winRate),r.overall.winRate].join(','))].join('\n')+'\n');
for(const matrix of matrices)fs.writeFileSync(path.join(out,`matchups-${matrix.level}.csv`),[['loadout',...names].map(quote).join(','),...matrix.rows.map(r=>[quote(r.loadout),...names.map(n=>n===r.loadout?'':r.opponents.find(o=>o.opponent===n).winRate)].join(','))].join('\n')+'\n');
let report=`# Complete cross-loadout win rates: saved combat 0.4.6\n\nTested the immutable engine and original AI from \`${protocol.baseline}\`. No rules, numbers, or live UI were changed. This is separate from concurrent balancing/search work.\n\n${rows.length} fights: 36 unordered pairs × levels 20/50/80 × both seats × both first-commitment orders. Each loadout has 32 fights per level, 96 overall. Normal level-generated skills and kits, standard Health70 plus level HP reserve, no observers, year1, full alpha-beta depth3/5000 nodes, no degradation. Forbidden spells retain their kit access; external alignment/observer consequences are not scored as combat utility.\n\nFinished ${summary.completed}/${rows.length}; censored ${summary.censored}, draws ${summary.draws}. The 120-exchange simulation cap is not a gameplay timeout. All ${audit.legalDecisionsReplayed} decisions legally replayed from hash-checked frozen sources, with resource settlement audits.\n\n| Loadout | Level 20 | Level 50 | Level 80 | Overall | W–L–D–unfinished |\n|---|---:|---:|---:|---:|---:|\n`;
for(const r of ranked)report+=`| ${r.loadout} | ${r.byLevel.map(x=>pct(x.winRate)).join(' | ')} | ${pct(r.overall.winRate)} | ${r.overall.wins}–${r.overall.losses}–${r.overall.draws}–${r.overall.censored} |\n`;
for(const matrix of matrices){report+=`\n## Matchup matrix, level ${matrix.level}\n\nRow loadout's wins / four paired configurations. Diagonal mirrors were not tested.\n\n| Loadout | ${names.join(' | ')} |\n|---|${names.map(()=>'---:').join('|')}|\n`;for(const r of matrix.rows)report+=`| ${r.loadout} | ${names.map(n=>n===r.loadout?'—':pct(r.opponents.find(o=>o.opponent===n).winRate)).join(' | ')} |\n`;}
report+='\n## Interpretation limits\n\nThese are exact proportions in this finite deterministic panel, not random-sample estimates of human win probability. Four seat/order configurations of a matchup are paired observations, not four independent replicates; no binomial confidence interval is assigned. Equal encounter levels deliberately retain loadout skill offsets, deterministic spell gates and ranks. The AI has an equal node budget, so larger kits may complete less search depth; per-loadout completed-depth and action counts are saved in cross-winrates.json. Named-character fixtures and self mirrors are outside this class comparison.\n\nReproduce with the copied cross-loadouts-runner.mjs, its --baseline snapshot and a fresh --out path. The copied analyzer recreates the tables after the frozen generic analyzer has written audit.json. Raw traces, source hashes, cases and worker timings remain alongside this report.\n';
fs.writeFileSync(path.join(out,'REPORT.md'),report);fs.copyFileSync(new URL(import.meta.url),path.join(out,'cross-loadouts-analyzer.mjs'));console.log(JSON.stringify({matches:rows.length,censored:summary.censored,ranking:ranked.map(r=>({loadout:r.loadout,...Object.fromEntries(r.byLevel.map(x=>['level'+x.level,x.winRate])),wins:r.overall.wins,losses:r.overall.losses,overall:r.overall.winRate}))},null,2));
