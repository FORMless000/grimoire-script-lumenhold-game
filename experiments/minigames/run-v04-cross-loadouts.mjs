#!/usr/bin/env node
// Complete general-loadout round robin against an immutable engine/AI snapshot.
// Do not import the live workspace: another balance/search iteration may change it.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const args=process.argv.slice(2),arg=(key,fallback)=>{const i=args.indexOf('--'+key);return i<0?fallback:args[i+1];};
if(!args.includes('--out'))throw Error('Pass --out <fresh result directory>');
const baseline=path.resolve(arg('baseline',path.join(root,'results/v04-20261016-economy-construct-followup'))),out=path.resolve(arg('out'));
const workers=Number(arg('workers','4')),limit=Number(arg('limit','0')),seed=20261016;
assert(Number.isInteger(workers)&&workers>=1&&workers<=8);assert(Number.isInteger(limit)&&limit>=0);
const original=JSON.parse(fs.readFileSync(path.join(baseline,'manifest.json')));
for(const [file,hash]of Object.entries(original.sourceHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(baseline,'sources',file))).digest('hex'),hash,file);
const engine=await import(pathToFileURL(path.join(baseline,'sources/iterations/v04/engine.mjs')));
assert.equal(engine.RULES_VERSION,'combat-spells-v2-0.4.6','This panel targets the saved 0.4.6 balance/AI version');
const loadouts=Object.keys(engine.LOADOUTS),cases=[];let pairId=0;
for(const level of [20,50,80])for(let a=0;a<loadouts.length;a++)for(let b=a+1;b<loadouts.length;b++){
 for(const focalSide of [0,1])for(const firstLeader of [0,1]){
  const names=focalSide?[loadouts[b],loadouts[a]]:[loadouts[a],loadouts[b]];
  cases.push({caseId:cases.length,pairId,panel:'generic',focal:loadouts[a],focalSide,band:level,
   config:{playerLoadout:names[0],opponentLoadout:names[1],playerLevel:level,opponentLevel:level,playerYear:1,opponentYear:1,firstLeader,
    spellAccess:'kit',resourceBudget:'standard',healthModel:'offset',observers:false,damageMultiplier:1,encounterSeed:seed,
    search:{maxDepth:3,nodeBudget:5000},ai:[{profile:'full',seed},{profile:'full',seed:seed+1}]},
   leftPolicy:'alpha',rightPolicy:'alpha',keepTrace:true,decisionLimit:240,censorAtLimit:true});
 }
 pairId++;
}
assert.equal(cases.length,loadouts.length*(loadouts.length-1)/2*3*4);
fs.mkdirSync(path.dirname(out),{recursive:true});assert(!fs.existsSync(out),'Refusing to overwrite results');
const input=out+'.cases.json',protocol=out+'.protocol.json';
fs.writeFileSync(input,JSON.stringify(cases,null,2),{flag:'wx'});
const metadata={schema:'v04-complete-cross-loadout-1',baseline,rulesVersion:engine.RULES_VERSION,baselineSourceHashes:original.sourceHashes,
 seed,workers,levels:[20,50,80],loadouts,totalCases:cases.length,selectedCases:limit?Math.min(limit,cases.length):cases.length,
 gamesPerLoadoutPerLevel:(loadouts.length-1)*4,semantics:'All unordered general-loadout pairs, both engine seats and both initial commitment orders. Same encounter level, normal deterministic loadout-specific skills/unlocks; not equal six-skill vectors. Full original 0.4.6 depth3/5000-node AI, no degradation or gameplay chance. Standard Health70 plus level reserve, normal Mana capacity, year1, no observers, practice rebate. Unfinished at120 exchanges is censored, not a draw. Four configurations are paired observations, not independent random replicates. No self mirrors or named characters in this class comparison.'};
fs.writeFileSync(protocol,JSON.stringify(metadata,null,2),{flag:'wx'});
console.log(JSON.stringify({out,baseline,cases:metadata.selectedCases,workers}));
const command=[path.join(baseline,'sources/run-v04-random.mjs'),'--case-file',input,'--workers',String(workers),'--out',out,...(limit?['--limit',String(limit)]:[])];
const child=spawn(process.execPath,command,{stdio:'inherit'});
const exitCode=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',(code,signal)=>signal?reject(Error('Simulation interrupted: '+signal)):resolve(code));});
if(exitCode!==0)process.exit(exitCode??1);
for(const file of [input,protocol])fs.copyFileSync(file,path.join(out,path.basename(file)));
fs.copyFileSync(new URL(import.meta.url),path.join(out,'cross-loadouts-runner.mjs'));
