// State/replay coverage only. One fixed seed per scene/level is not a win-rate study.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath,pathToFileURL} from 'node:url';
if(!process.argv[2])throw Error('Usage: node smoke.mjs <new output directory>');
const out=path.resolve(process.argv[2]),root=path.dirname(fileURLToPath(import.meta.url));fs.mkdirSync(path.dirname(out),{recursive:true});fs.mkdirSync(out);fs.mkdirSync(path.join(out,'source'));
const hashes={};for(const name of ['engine.mjs','reference-engine.mjs','reference-ai.mjs','core.mjs','negotiation.wasm','cards.mjs','encounters.mjs','schema.mjs','ai.mjs','smoke.mjs']){const raw=fs.readFileSync(path.join(root,name));hashes[name]=crypto.createHash('sha256').update(raw).digest('hex');fs.writeFileSync(path.join(out,'source',name),raw);}
const {ENCOUNTERS}=await import(pathToFileURL(path.join(out,'source/encounters.mjs'))),{createState,applyAction,observation,legalActions}=await import(pathToFileURL(path.join(out,'source/engine.mjs'))),{searchAction}=await import(pathToFileURL(path.join(out,'source/ai.mjs')));
const rows=[];for(const e of ENCOUNTERS)for(const level of [20,50,80]){
 const config={encounter:e.id,level,seed:level,mood:e.id==='blood_bargain'?10:70},s=createState(config);let steps=0;
 while(!s.result){const d=searchAction(observation(s),{depth:1,nodeBudget:1000});if(!legalActions(s).includes(d.id))throw Error('Illegal AI decision');applyAction(s,d.id);if(++steps>100)throw Error('Did not terminate');}
 const replay=createState(config);for(const h of s.history)applyAction(replay,h.action);if(JSON.stringify(s.history)!==JSON.stringify(replay.history)||JSON.stringify(s.settlement)!==JSON.stringify(replay.settlement))throw Error('Replay mismatch');
 for(const r of Object.values(s.settlement.resources))if(r.rebate>Math.max(0,r.entry-r.before)||r.rebate<0)throw Error('Invalid rebate');
 rows.push({config,result:s.result,history:s.history,settlement:s.settlement});
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({purpose:'Coverage smoke, not balance evidence',levels:[20,50,80],seed:'level',policy:{depth:1,nodeBudget:1000,budgetMs:50},hashes,node:process.version},null,2));
fs.writeFileSync(path.join(out,'matches.json'),JSON.stringify(rows));fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({cases:rows.length,replaysVerified:true,terminationVerified:true,rebateCapsVerified:true},null,2));console.log(out,rows.length+' cases passed');
