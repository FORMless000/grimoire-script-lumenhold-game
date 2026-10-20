// Paired-seed AI study. Frozen sources and exact command tapes are retained.
// DC is the asymmetric opponent's difficulty; its DC-derived Agreement target also changes; Patience/Suspicion remain 8/6.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath,pathToFileURL} from 'node:url';import assert from 'node:assert/strict';
const argv=process.argv.slice(2),arg=(key,otherwise)=>{const i=argv.indexOf('--'+key);return i<0?otherwise:argv[i+1];};
const episodes=Number(arg('episodes',32)),seed=Number(arg('seed',20261020)),out=path.resolve(arg('out','experiments/negotiation/results/ai-study-'+Date.now()));
if(!Number.isInteger(episodes)||episodes<1)throw Error('Use a positive episode count');fs.mkdirSync(path.dirname(out),{recursive:true});fs.mkdirSync(out);fs.mkdirSync(path.join(out,'source'));
const root=path.dirname(fileURLToPath(import.meta.url)),hashes={};for(const name of ['engine.mjs','reference-engine.mjs','reference-ai.mjs','core.mjs','negotiation.wasm','cards.mjs','encounters.mjs','schema.mjs','ai.mjs','study.mjs','rust/src/lib.rs','rust/Cargo.toml','rust/Cargo.lock']){const raw=fs.readFileSync(path.join(root,name));hashes[name]=crypto.createHash('sha256').update(raw).digest('hex');fs.mkdirSync(path.dirname(path.join(out,'source',name)),{recursive:true});fs.writeFileSync(path.join(out,'source',name),raw);}
const {createState,applyAction,observation,legalActions,SPELLS}=await import(pathToFileURL(path.join(out,'source/engine.mjs'))),{searchAction,candidates}=await import(pathToFileURL(path.join(out,'source/ai.mjs'))),{meetingLimits}=await import(pathToFileURL(path.join(out,'source/encounters.mjs')));
const cases=[];for(const level of [20,50,80])for(const gap of [-15,-10,0,10,20])for(const policy of ['face','shallow','search'])for(let i=0;i<episodes;i++){
 const difficulty=level+gap;cases.push({suite:'gap',policy,gap,episode:i,config:{encounter:'sandbox',level,difficulty,...meetingLimits(difficulty),seed:(seed+Math.imul(i+1,0x9E3779B9))>>>0}});
}
// Separate spell-access diagnostics; these are not evidence for ordinary kits.
for(const kit of ['all-spells','Showman','Hollow adept'])for(let i=0;i<episodes;i++)cases.push({suite:'access',policy:'search',gap:0,episode:i,kit,config:{encounter:'sandbox',level:50,difficulty:50,...meetingLimits(50),loadout:kit==='all-spells'?'Balanced':kit,allSpells:kit==='all-spells',seed:(seed+Math.imul(i+1,0x9E3779B9))>>>0}});
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({description:'DC gap study plus explicit spell-access diagnostics; 50 ms cooperative search, max 3 response turns; paired seeds',episodes,seed,node:process.version,hashes,cases},null,2));
const summary={games:0,replaysVerified:0,groups:{}};let previous='';
for(const [caseId,c]of cases.entries()){
 const key=c.suite==='gap'?`${c.config.level}/${c.gap}/${c.policy}`:`access/${c.kit}`,s=createState(c.config),decisions=[],opportunities={},candidateTurns={},eligibleGames={};let steps=0;
 while(!s.result){
  if(!s.castUsed){const legal=legalActions(s),considered=candidates(s);for(const id of Object.keys(s.player.spells)){if(legal.includes(id)){opportunities[id]=(opportunities[id]??0)+1;eligibleGames[id]=true;}if(considered.includes(id))candidateTurns[id]=(candidateTurns[id]??0)+1;}}
  const d=c.policy==='face'?{id:'face'}:searchAction(observation(s),{depth:c.policy==='shallow'?1:3,budgetMs:50});assert(legalActions(s).includes(d.id));decisions.push(d);applyAction(s,d.id);if(++steps>100)throw Error('Meeting did not terminate');
 }
 const replay=createState(c.config);for(const h of s.history)applyAction(replay,h.action);assert.deepEqual(replay.history,s.history);assert.deepEqual(replay.settlement,s.settlement);
 const actions={},spells={},used={};for(const h of s.history){if(SPELLS[h.action]){spells[h.action]=(spells[h.action]??0)+1;used[h.action]=true;}else actions[h.action]=(actions[h.action]??0)+1;}
 const row={caseId,key,...c,result:s.result,settlement:s.settlement,history:s.history,decisions,actions,spells,opportunities,candidateTurns,eligibleGames};fs.appendFileSync(path.join(out,'matches.ndjson'),JSON.stringify(row)+'\n');
 const g=summary.groups[key]??={n:0,win:0,partial:0,lose:0,turns:0,actions:{},spells:{},usedGames:{},opportunities:{},candidateTurns:{},eligibleGames:{}};g.n++;g[s.result.outcome]++;g.turns+=Math.max(...s.history.map(h=>h.round));
 for(const [field,values]of Object.entries({actions,spells,usedGames:used,opportunities,candidateTurns,eligibleGames}))for(const [id,n]of Object.entries(values))g[field][id]=(g[field][id]??0)+Number(n);
 summary.groups[key]=g;summary.games++;summary.replaysVerified++;
 if(previous!==key){if(previous)console.log(previous,JSON.stringify(summary.groups[previous]));previous=key;}
 if((caseId+1)%episodes===0)fs.writeFileSync(path.join(out,'summary.partial.json'),JSON.stringify(summary,null,2));
}
console.log(previous,JSON.stringify(summary.groups[previous]));fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2));console.log(out);
