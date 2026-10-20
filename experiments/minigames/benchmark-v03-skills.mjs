#!/usr/bin/env node
// Frozen-source, paired-seed experiments for the current negotiation rules.
// Presets measure the full kit (skills, spell ranks and Mana), not skill-only ablations.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
const args=process.argv.slice(2),get=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const mode=get('mode','presets'),episodes=Number(get('episodes',['presets','boundaries'].includes(mode)?'100':'20')),baseSeed=Number(get('seed','20261015'));
if(!['presets','boundaries','variety','ranks','no-mana'].includes(mode)||!Number.isInteger(episodes)||episodes<1||!Number.isInteger(baseSeed)||baseSeed<0||baseSeed>4294967295)throw Error('Invalid mode, episode count or seed');
const root=path.dirname(fileURLToPath(import.meta.url)),out=path.resolve(get('out','experiments/minigames/results/v03-skills-'+Date.now()));
fs.mkdirSync(path.dirname(out),{recursive:true});fs.mkdirSync(out);
const files=['benchmark-v03-skills.mjs','harness.mjs','policies.mjs',...['engine.mjs','roster.mjs','ai.mjs','adapter.mjs'].map(f=>'iterations/v03/'+f)],hashes={};
for(const file of files){const raw=fs.readFileSync(path.join(root,file));hashes[file]=crypto.createHash('sha256').update(raw).digest('hex');const dst=path.join(out,'sources',file);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.writeFileSync(dst,raw,{flag:'wx'});}
// Import the snapshot so a concurrent workspace edit cannot change this experiment.
const adapter=await import(pathToFileURL(path.join(out,'sources/iterations/v03/adapter.mjs')));
const {runMatch,episodeSeed}=await import(pathToFileURL(path.join(out,'sources/harness.mjs')));
const panels=[];
function add(level,opponentLevel,extras={},policies=['search']){panels.push({config:{level,opponentLevel,archetype:'Balanced',opponent:'debater',fixture:'debate',search:{budgetMs:50},...extras},policies});}
if(mode==='presets')for(const [level,opponents]of [[20,[20,30,40,50,60,80,100]],[50,[50,60,70,80,90,100]],[80,[80,90,100]]])for(const opponent of opponents)add(level,opponent,{},['search','greedy','confront','rhythm']);
if(mode==='boundaries')for(const [level,opponents]of [[20,[32,35]],[50,[72,75]]])for(const opponent of opponents)add(level,opponent,{},['search','greedy']);
if(mode==='no-mana')for(const level of [20,50,80])for(const gap of [0,20])add(level,level+gap,{resources:{mana:0}},['search','greedy']);
if(mode==='ranks')for(const level of [1,10,35,36,70,71])for(const opponent of [...new Set([level,Math.min(100,level+20),Math.min(100,level+40)])])add(level,opponent);
if(mode==='variety'){
 for(const level of [20,50,80])for(const fixture of ['workshop','favor'])add(level,Math.min(100,level+20),{fixture});
 for(const opponent of ['scholar','social','skeptic','official'])add(20,40,{opponent});
 for(const level of [20,50,80])for(const archetype of ['Evoker','Seer','Restorer','Illusionist','Envoy','Warden'])add(level,Math.min(100,level+20),{archetype});
}
const cases=[];
// Interleave policies on each episode: all use the same random draw stream,
// although differing response paths may consume different requests.
for(const panel of panels)for(let episode=0;episode<episodes;episode++)for(const policy of panel.policies)cases.push({config:panel.config,episodeSeed:episodeSeed(baseSeed,episode),leftPolicy:policy});
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version:'v03-pressure-skills',mode,episodes,baseSeed,node:process.version,cpu:os.cpus()[0]?.model,platform:process.platform,cases,sourceHashes:hashes,notes:'Full kit presets. Mood 24, Renown 3, full level-dependent Mana unless overridden. Full win only; partial is separate. Timed search is not bitwise reproducible; replay the retained command tapes. No rules/AI retuning.'},null,2),{flag:'wx'});
const matches=[],started=performance.now();
for(const [caseId,c]of cases.entries()){
 const m=runMatch(adapter,{...c,keepTrace:false});const row={caseId,...c,...m};matches.push(row);
 fs.appendFileSync(path.join(out,'matches.ndjson'),JSON.stringify(row)+'\n');
 if((caseId+1)%Math.max(1,Math.floor(cases.length/32))===0)console.log(JSON.stringify({mode,done:caseId+1,total:cases.length,seconds:Math.round((performance.now()-started)/1000)}));
}
fs.writeFileSync(path.join(out,'matches.json'),JSON.stringify(matches),{flag:'wx'});
fs.writeFileSync(path.join(out,'completed.json'),JSON.stringify({matches:matches.length,elapsedSeconds:(performance.now()-started)/1000}),{flag:'wx'});
console.log(out);
