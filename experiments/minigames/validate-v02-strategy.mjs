#!/usr/bin/env node
// Independent replay/audit of the diagnostic variants from frozen engine sources.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {pathToFileURL,fileURLToPath} from 'node:url';
const dir=path.resolve(process.argv[2]??'');if(!process.argv[2])throw Error('Usage: node validate-v02-strategy.mjs <diagnostic directory>');
const read=n=>JSON.parse(fs.readFileSync(path.join(dir,n))),manifest=read('manifest.json'),matches=read('matches.json');
const roles=manifest.schema==='v02-foresight-role-probe-1';assert(roles||manifest.schema==='v02-strategy-diagnostic-1');
const hashes=roles?manifest.sourceHashes:manifest.inputs[0].sourceHashes;
for(const f of ['harness.mjs','policies.mjs','iterations/v02/roster.mjs','iterations/v02/engine.mjs','iterations/v02/ai.mjs','iterations/v02/adapter.mjs'])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'sources',f))).digest('hex'),hashes[f]);
if(!roles)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'sources/run-v02-strategy.mjs'))).digest('hex'),manifest.analysisSourceHash);
assert.equal(matches.length,manifest.cases.length);assert.equal(new Set(manifest.cases.map(c=>JSON.stringify(c))).size,matches.length);
const adapter=await import(pathToFileURL(path.join(dir,'sources/iterations/v02/adapter.mjs'))),{runMatch}=await import(pathToFileURL(path.join(dir,'sources/harness.mjs')));
function diagnostic(c){return {...adapter,create(config,options){const g=adapter.create(config,options),base=adapter.create(config,options);
 if(c.variant==='deeper-both')g.config={...g.config,search:{maxDepth:5,nodeBudget:25000}};
 for(const side of [0,1]){const a=g.actors[side];a.kit=structuredClone(a.kit);
  for(const id of Object.keys(a.kit.spells))if(c.variant==='basics-only'&&side===0||c.variant==='no-flame'&&side===0&&id==='flame'||c.variant==='no-restoration'&&side===0&&id==='restoration'||c.variant==='no-foresight-both'&&id==='foresight'||roles&&side===c.side&&id==='foresight')delete a.kit.spells[id];
  for(const k of ['skills','level','capacity','draws'])assert.deepEqual(a.kit[k],base.actors[side].kit[k]);
  for(const k of ['resources','entry','hp','maxHP'])assert.deepEqual(a[k],base.actors[side][k]);
 }
 return g;}};}
let ledgerRows=0;
for(const [i,m]of matches.entries()){
 assert.equal(m.caseId,i);for(const [k,v]of Object.entries(manifest.cases[i]))assert.deepEqual(m[k],v);
 for(const ledger of m.ledgers)for(const r of Object.values(ledger)){ledgerRows++;assert(r.final>=-1e-8&&r.final<=r.entry+1e-8);assert(Math.abs(r.netLoss-(r.entry-r.final))<1e-8);assert(Math.abs(r.final-r.before-r.refund)<1e-8);}
 assert.equal(m.commands.length,m.rounds);assert(m.rounds>=1&&m.rounds<=8);
 diagnostic(m).create(m.config,{skillShift:0});
 for(const s of m.searchStats){assert(s.nodes<=(m.variant==='deeper-both'?25000:5000));assert(s.completedDepth<=(m.variant==='deeper-both'?5:3));}
}
const indices=[...new Set(Array.from({length:24},(_,i)=>Math.round(i*(matches.length-1)/23)))];
for(const i of indices){const c=manifest.cases[i],m=matches[i],replayed=runMatch(diagnostic(c),c);
 for(const k of ['outcomes','rounds','timeout','noWinner','ledgers','commands'])assert.deepEqual(replayed[k],m[k]);
 const stable=stats=>stats.map(({elapsedMs,...s})=>s);assert.deepEqual(stable(replayed.searchStats),stable(m.searchStats));
}
const audit={matches:matches.length,resourceLedgerRows:ledgerRows,uniqueExactCasesVerified:true,sourceHashesVerified:true,ledgerCapsVerified:true,ablationControlsVerified:true,replayIndices:indices,resultsAndSearchReproduced:true,validatorSourceHash:crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex')};
fs.copyFileSync(fileURLToPath(import.meta.url),path.join(dir,'sources','validate-v02-strategy.mjs'),fs.constants.COPYFILE_EXCL);fs.writeFileSync(path.join(dir,'audit.json'),JSON.stringify(audit,null,2),{flag:'wx'});console.log(JSON.stringify(audit,null,2));
