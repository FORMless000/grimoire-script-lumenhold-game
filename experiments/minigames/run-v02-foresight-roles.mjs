#!/usr/bin/env node
// Follow-up to the joint removal: separate caster roles without changing game rules.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {fileURLToPath,pathToFileURL} from 'node:url';
const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const input=path.resolve(arg('input','experiments/minigames/results/v02-20261014-negotiation-skill-direct'));
const out=path.resolve(arg('out','experiments/minigames/results/v02-20261014-foresight-roles'));
const read=name=>JSON.parse(fs.readFileSync(path.join(input,name)));
const originalManifest=read('manifest.json'),baseline=read('matches.json').filter(m=>m.skillShift===0);
fs.mkdirSync(out);const sourceFiles=['harness.mjs','policies.mjs','iterations/v02/roster.mjs','iterations/v02/engine.mjs','iterations/v02/ai.mjs','iterations/v02/adapter.mjs'];
for(const f of sourceFiles){const data=fs.readFileSync(path.join(input,'sources',f));assert.equal(crypto.createHash('sha256').update(data).digest('hex'),originalManifest.sourceHashes[f]);const target=path.join(out,'sources',f);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data);}
fs.copyFileSync(fileURLToPath(import.meta.url),path.join(out,'sources','run-v02-foresight-roles.mjs'));
const adapter=await import(pathToFileURL(path.join(out,'sources/iterations/v02/adapter.mjs')));
const {runMatch}=await import(pathToFileURL(path.join(out,'sources/harness.mjs')));
const cases=[];
for(const m of baseline)for(const side of [0,1])if(adapter.create(m.config).actors[side].kit.spells.foresight)cases.push({referenceCaseId:m.caseId,config:m.config,variant:side===0?'no-player-foresight':'no-audience-foresight',side,leftPolicy:'alpha',rightPolicy:'alpha'});
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({schema:'v02-foresight-role-probe-1',node:process.version,input,sourceHashes:originalManifest.sourceHashes,cases,semantics:'Remove Foresight from one indicated learned kit only. Other spells, skills, ranks, capacities, resources and both search settings are unchanged; the reduced kit is visible to both searches. Deterministic paired scenarios, no confidence intervals.'},null,2));
const index=new Map(baseline.map(m=>[m.caseId,m])),raw=[];
for(const [caseId,c]of cases.entries()){
 const diagnostic={...adapter,create(config,options){const g=adapter.create(config,options),a=g.actors[c.side];a.kit={...a.kit,spells:{...a.kit.spells}};delete a.kit.spells.foresight;return g;}};
 const result=runMatch(diagnostic,{...c,keepTrace:caseId%48===0}),ref=index.get(c.referenceCaseId);
 for(const ledger of result.ledgers)for(const r of Object.values(ledger))assert(r.final>=0&&r.final<=r.entry+1e-8);
 raw.push({caseId,...c,...result,referenceOutcomes:ref.outcomes});
 if(caseId%48===0)console.log(`foresight roles: ${caseId+1}/${cases.length}`);
}
const groups=[];
for(const variant of ['no-player-foresight','no-audience-foresight'])for(const level of [20,50,80]){
 const rows=raw.filter(m=>m.variant===variant&&m.config.playerLevel===level);
 groups.push({variant,level,n:rows.length,outcomes:['win','partial','lose'].map(o=>rows.filter(m=>m.outcomes[0]===o).length),referenceOutcomes:['win','partial','lose'].map(o=>rows.filter(m=>m.referenceOutcomes[0]===o).length),unchanged:rows.filter(m=>m.outcomes[0]===m.referenceOutcomes[0]).length,gainedFullWin:rows.filter(m=>m.outcomes[0]==='win'&&m.referenceOutcomes[0]!=='win').length,lostFullWin:rows.filter(m=>m.outcomes[0]!=='win'&&m.referenceOutcomes[0]==='win').length});
}
fs.writeFileSync(path.join(out,'matches.json'),JSON.stringify(raw,null,2));fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({matches:raw.length,groups},null,2));
console.log(JSON.stringify({matches:raw.length,groups},null,2));
