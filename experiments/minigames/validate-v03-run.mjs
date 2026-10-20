#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {pathToFileURL,fileURLToPath} from 'node:url';
const run=path.resolve(process.argv[2]??'');if(!process.argv[2])throw Error('Usage: node validate-v03-run.mjs <run directory>');
const read=file=>JSON.parse(fs.readFileSync(path.join(run,file))),manifest=read('manifest.json'),matches=read('matches.json');
assert.equal(matches.length,manifest.cases.length);
for(const [file,hash]of Object.entries(manifest.sourceHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(run,'sources',file))).digest('hex'),hash);
const {createState,applyAction}=await import(pathToFileURL(path.join(run,'sources/iterations/v03/engine.mjs')));
let turns=0,ledgers=0;
for(const [i,m]of matches.entries()){
 assert.equal(i,m.caseId);for(const [k,v]of Object.entries(manifest.cases[i]))assert.deepEqual(m[k],v);
 const s=createState({...m.config,seed:m.episodeSeed});
 for(const h of m.history){assert.equal(s.intent,h.intent);applyAction(s,h.action);assert.deepEqual(s.history.at(-1),h);turns++;}
 assert.equal(s.result.outcome,m.outcomes[0]);assert.equal(s.result.reason,m.terminationReason);assert.deepEqual(s.settlement,m.ledgers[0]);
 for(const [resource,row]of Object.entries(s.settlement)){ledgers++;assert(row.final>=0&&row.final<=row.entry);assert.equal(row.netLoss,row.entry-row.final);if(resource==='crowns')assert.equal(row.rebate,0);}
}
const source=fs.readFileSync(fileURLToPath(import.meta.url)),audit={matches:matches.length,turns,ledgerRows:ledgers,sourceHashesVerified:true,exactCaseCoverageVerified:true,allCommandTapesReplayed:true,ledgersVerified:true,validationSourceHash:crypto.createHash('sha256').update(source).digest('hex'),note:'Actual player command tapes are replayed; time-budget search choices/timings are not claimed to reproduce.'};
fs.copyFileSync(fileURLToPath(import.meta.url),path.join(run,'sources/validate-v03-run.mjs'),fs.constants.COPYFILE_EXCL);fs.writeFileSync(path.join(run,'audit.json'),JSON.stringify(audit,null,2),{flag:'wx'});console.log(JSON.stringify(audit));
