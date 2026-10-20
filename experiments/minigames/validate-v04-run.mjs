import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
const root=path.resolve(process.argv[2]??'');if(!process.argv[2])throw Error('Pass a v04 result directory');
const target=path.join(root,'audit.json');if(fs.existsSync(target))throw Error('Refusing to overwrite audit');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))),rows=JSON.parse(fs.readFileSync(path.join(root,'matches.json')));
for(const [name,hash]of Object.entries(manifest.sourceHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'sources',name))).digest('hex'),hash,name);
const adapter=await import(pathToFileURL(path.join(root,'sources/iterations/v04/adapter.mjs')));
const engine=await import(pathToFileURL(path.join(root,'sources/iterations/v04/engine.mjs')));
assert.equal(rows.length,manifest.cases.length);let decisions=0,ledgers=0;
for(const row of rows){
 const game=adapter.create(row.config);for(const d of row.searchStats){assert.equal(engine.actorToMove(game),d.side);assert.equal(game.round,d.round);assert(engine.legalActions(game).includes(d.id));assert(d.totalNodes<=3000);adapter.advance(game,d);decisions++;}
 const actual=adapter.metrics(game);for(const key of ['commands','executedCommands','outcomes','ledgers','result','rounds'])assert.deepEqual(actual[key],row[key],`${row.caseId}:${key}`);
 if(row.censored){assert.equal(game.result,null);assert.equal(game.settlement,null);assert.deepEqual(row.outcomes,[null,null]);assert.equal(row.searchStats.length,row.decisionLimit);}
 else for(const ledger of row.ledgers)for(const [key,r]of Object.entries(ledger)){
  assert(Math.abs(r.before-(r.entry-r.spent+r.restored))<1e-6,`${row.caseId}:${key} ledger`);assert.equal(r.final,r.before+r.refund);
  if(r.refund)assert(r.final<=r.entry);if(['crowns','alignment'].includes(key))assert.equal(r.refund,0);ledgers++;
 }
}
const audit={matches:rows.length,legalDecisionsReplayed:decisions,ledgerRowsChecked:ledgers,frozenSourcesVerified:true,censoringVerified:true};fs.writeFileSync(target,JSON.stringify(audit,null,2));console.log(JSON.stringify(audit));
