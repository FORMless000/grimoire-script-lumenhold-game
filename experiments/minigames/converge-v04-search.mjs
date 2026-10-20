#!/usr/bin/env node
// Analyst decisions use fixed node budgets, fresh contexts and frozen source inputs.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {pathToFileURL} from 'node:url';
import {searchFixtures} from './search-fixtures.mjs';
const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const run=arg('run',null),sources=path.resolve(run?path.join(run,'sources'):arg('sources','experiments/minigames')),out=path.resolve(arg('out','experiments/minigames/results/convergence-'+Date.now()));
const samples=Number(arg('samples','6')),budgets=arg('budgets','50000,200000,1000000').split(',').map(Number),maxDepth=Number(arg('depth','8')),tableLimit=Number(arg('table-limit','65536'));
if(!Number.isInteger(tableLimit)||tableLimit<1)throw Error('Invalid table capacity');
if(!Number.isInteger(samples)||samples<1||!Number.isInteger(maxDepth)||maxDepth<1||budgets.some(n=>!Number.isInteger(n)||n<1))throw Error('Invalid convergence settings');
fs.mkdirSync(out);
const sourceSnapshot=path.join(out,'sources','iterations/v04');fs.mkdirSync(sourceSnapshot,{recursive:true});
for(const name of ['economy','cast-stats','loadouts','roster','engine','search-state','search-cache','ai'])fs.copyFileSync(path.join(sources,'iterations/v04',name+'.mjs'),path.join(sourceSnapshot,name+'.mjs'));
fs.copyFileSync(new URL(import.meta.url),path.join(out,'converge-v04-search.mjs'));fs.copyFileSync(new URL('./search-fixtures.mjs',import.meta.url),path.join(out,'search-fixtures.mjs'));
if(run){const original=JSON.parse(fs.readFileSync(path.join(run,'manifest.json')));for(const [file,hash]of Object.entries(original.sourceHashes))if(crypto.createHash('sha256').update(fs.readFileSync(path.join(run,'sources',file))).digest('hex')!==hash)throw Error('Frozen input hash mismatch: '+file);}
const engine=await import(pathToFileURL(path.join(sourceSnapshot,'engine.mjs'))),ai=await import(pathToFileURL(path.join(sourceSnapshot,'ai.mjs')));
let candidates=[];
if(run){
 const rows=JSON.parse(fs.readFileSync(path.join(run,'matches.json')));
 for(const row of rows){const state=engine.createState(row.config),indices=new Set([0,Math.floor(row.searchStats.length/2)]);for(let i=0;i<row.searchStats.length;i++){if(indices.has(i))candidates.push({id:`case-${row.caseId}-decision-${i}`,state:engine.cloneState(state)});engine.applyChoice(state,row.searchStats[i].id);}}
}else candidates=searchFixtures(engine);
const preferred=['20-opening-commit','20-depleted-respond','50-foresight-respond','50-channel-respond','80-omen-respond','80-construct-respond'];
if(!run)candidates.sort((a,b)=>{const rank=x=>{const n=preferred.indexOf(x.id);return n<0?preferred.length+searchFixturesIndex(x.id):n;};return rank(a)-rank(b);});
function searchFixturesIndex(id){let n=0;for(const c of id)n=(Math.imul(n,31)+c.charCodeAt(0))>>>0;return n;}
const requested=arg('fixture-ids',null);
const selected=requested?requested.split(',').map(id=>{const item=candidates.find(f=>f.id===id);if(!item)throw Error('Unknown fixture '+id);return item;}):run?Array.from({length:Math.min(samples,candidates.length)},(_,i)=>candidates[Math.floor(i*candidates.length/Math.min(samples,candidates.length))]):candidates.slice(0,samples);
const manifest={rulesVersion:engine.RULES_VERSION,policyVersion:ai.POLICY_VERSION,sources,usedSources:sourceSnapshot,run,samples:selected.map(f=>f.id),budgets,maxDepth,tableLimit,horizonMode:'tactical',node:process.version,sourceHashes:{}};
const frozen=path.join(out,'sources','iterations/v04');fs.mkdirSync(frozen,{recursive:true});
for(const name of ['economy','cast-stats','loadouts','roster','engine','search-state','search-cache','ai']){const file=name+'.mjs',bytes=fs.readFileSync(path.join(frozen,file));manifest.sourceHashes[file]=crypto.createHash('sha256').update(bytes).digest('hex');}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));fs.writeFileSync(path.join(out,'positions.json'),JSON.stringify(selected));
const results=[];
for(const f of selected){
 const decisions=[];
 for(const nodeBudget of budgets){const d={nodeBudget,...ai.searchAction(f.state,{maxDepth,nodeBudget,tableLimit,horizonMode:'tactical'})};decisions.push(d);fs.writeFileSync(path.join(out,`decision-${selected.indexOf(f)}-${nodeBudget}.json`),JSON.stringify(d,null,2));console.log(JSON.stringify({id:f.id,nodeBudget,depth:d.completedDepth,stoppingReason:d.stoppingReason}));}
 const strongest=decisions.reduce((a,b)=>b.nodeBudget>a.nodeBudget?b:a);
 const ranking=strongest.completedDepth>0?ai.searchAction(f.state,{maxDepth:strongest.completedDepth,nodeBudget:strongest.nodeBudget,tableLimit,horizonMode:'tactical',rankActions:true}):null;
 const exactRanking=ranking?.completedDepth===strongest.completedDepth,sign=engine.actorToMove(f.state)===0?1:-1;
 const row={id:f.id,decisions:decisions.map(d=>({...d,valueChangeFromPrevious:null,regretAtReferenceDepth:exactRanking?sign*(ranking.value-ranking.rankedActions.find(a=>a.id===d.id).value):null})),referenceDepth:strongest.completedDepth,exactRanking,rankingNodes:ranking?.nodes??0,rankingStoppingReason:ranking?.stoppingReason??null};
 for(let i=1;i<row.decisions.length;i++)row.decisions[i].valueChangeFromPrevious=row.decisions[i].value-row.decisions[i-1].value;
 results.push(row);fs.writeFileSync(path.join(out,`position-${results.length}.json`),JSON.stringify(row,null,2));console.log(JSON.stringify({id:f.id,depths:decisions.map(d=>d.completedDepth),exactRanking}));
}
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
