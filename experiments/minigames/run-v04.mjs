#!/usr/bin/env node
// Small deterministic integration panel. A work limit censors; it never draws.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
import * as adapter from './iterations/v04/adapter.mjs';import {runMatch} from './harness.mjs';
const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const root=path.dirname(fileURLToPath(import.meta.url)),out=path.resolve(arg('out','experiments/minigames/results/v04-'+new Date().toISOString().replace(/[:.]/g,'-')));
const decisionLimit=Number(arg('decisions','48'));if(!Number.isInteger(decisionLimit)||decisionLimit<2)throw Error('Invalid --decisions');
const cases=[];for(const level of [20,50,80])for(const firstLeader of [0,1])for(const spellAccess of ['kit','all'])cases.push({config:{playerLevel:level,opponentLevel:level,playerLoadout:'Duellist',opponentLoadout:'Duellist',firstLeader,spellAccess,observers:true,search:{maxDepth:2,nodeBudget:1500}},leftPolicy:'alpha',rightPolicy:'alpha',keepTrace:true,decisionLimit,censorAtLimit:true});
fs.mkdirSync(path.dirname(out),{recursive:true});fs.mkdirSync(out);
const sourceHashes={};for(const f of ['run-v04.mjs','harness.mjs','policies.mjs','iterations/v04/loadouts.mjs','iterations/v04/cast-stats.mjs','iterations/v04/roster.mjs','iterations/v04/engine.mjs','iterations/v04/ai.mjs','iterations/v04/adapter.mjs']){const bytes=fs.readFileSync(path.join(root,f)),target=path.join(out,'sources',f);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);sourceHashes[f]=crypto.createHash('sha256').update(bytes).digest('hex');}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({rulesVersion:adapter.RULES_VERSION,node:process.version,createdUTC:new Date().toISOString(),cases,sourceHashes,semantics:'12 deterministic smoke scenarios, not a balance study. Fixed level-gated spell ladders; generic skill jitter uses level + 1000 × preset salt. Search 2 exchanges/1500 nodes. Unfinished games are censored at a simulation work limit, never adjudicated as draws and never settled.'},null,2));
const rows=[];for(const [caseId,c]of cases.entries()){rows.push({caseId,...c,...runMatch(adapter,c)});console.log(`${caseId+1}/${cases.length}`);}
fs.writeFileSync(path.join(out,'matches.json'),JSON.stringify(rows,null,2));
const summary={n:rows.length,completed:rows.filter(r=>!r.censored).length,censored:rows.filter(r=>r.censored).length,knockouts:rows.filter(r=>r.terminationReason==='knockout').length,structuralDraws:rows.filter(r=>r.terminationReason==='stalemate').length,decisions:rows.reduce((n,r)=>n+r.searchStats.length,0),depthZero:rows.flatMap(r=>r.searchStats).filter(r=>r.completedDepth===0).length};
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2));console.log('RESULTS='+out+'\n'+JSON.stringify(summary));
