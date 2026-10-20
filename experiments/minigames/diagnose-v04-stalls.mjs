#!/usr/bin/env node
// A sufficient, deliberately narrow tactical-stall test, not a draw adjudicator.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const out=path.resolve(process.argv[2]??'');if(!process.argv[2])throw Error('Pass a result directory');
const target=path.join(out,'stall-diagnostics.json');if(fs.existsSync(target))throw Error('Refusing to overwrite diagnostics');
const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'))),rows=JSON.parse(fs.readFileSync(path.join(out,'matches.json')));
for(const [f,hash]of Object.entries(manifest.sourceHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(out,'sources',f))).digest('hex'),hash,f);
const engine=await import(pathToFileURL(path.join(out,'sources/iterations/v04/engine.mjs')));
const states=[];let tested=0;
for(const row of rows.filter(r=>r.censored)){
 const g=engine.createState(row.config);for(const d of row.searchStats)engine.applyChoice(g,d.id);
 const legal=[0,1].map(side=>engine.legalActions(g,side));
 // Both sides must have no spell or channel command available, no stored flux,
 // and no autonomous incoming damage. This omits less obvious stall patterns.
 const basicsOnly=legal.every(xs=>xs.length===3&&xs.every(id=>engine.BASICS.includes(id)));
 const noPendingDamage=g.actors.every(a=>!a.channel&&!a.constructs.length&&!a.omens.length&&a.flux<1e-9)&&[0,1].every(side=>!engine.has(g,side,'torment')&&!engine.has(g,side,'compelled'));
 let guardSafe=null;
 if(basicsOnly&&noPendingDamage){
  guardSafe=true;
  for(const defender of [0,1])for(const attack of engine.BASICS){
   const c=engine.cloneState(g),pair=[attack,attack];pair[defender]='guard';const hp=c.actors[defender].hp;
   engine.applyChoice(c,pair[engine.actorToMove(c)]);engine.applyChoice(c,pair[engine.actorToMove(c)]);
   assert.equal(c.actors[defender].hp,hp);assert(!c.result);tested++;
  }
 }
 states.push({caseId:row.caseId,panel:row.panel,loadouts:g.actors.map(a=>a.kit.loadout),levels:g.actors.map(a=>a.kit.level),hp:g.actors.map(a=>a.hp),mana:g.actors.map(a=>a.resources.mana),flux:g.actors.map(a=>a.flux),legal,basicsOnly,noPendingDamage,guardSafe});
}
const script=fs.readFileSync(fileURLToPath(import.meta.url));fs.mkdirSync(path.join(out,'diagnostic-sources'),{recursive:true});fs.writeFileSync(path.join(out,'diagnostic-sources/diagnose-v04-stalls.mjs'),script);
const report={censored:states.length,certifiedBasicDefenseStalls:states.filter(s=>s.guardSafe).length,guardResponsesChecked:tested,semantics:'For certified states, both actors can always avoid damage with free Guard against every legal opponent action. No autonomous damage or stored flux remains and no spell is affordable. This is a sufficient tactical stall under defensive play; Strike/Strike can still do damage, so these remain censored under the existing structural-draw rule. Other censored fights are not certified by this test.',sourceSHA256:crypto.createHash('sha256').update(script).digest('hex'),states};
fs.writeFileSync(target,JSON.stringify(report,null,2));console.log(JSON.stringify({censored:report.censored,certifiedBasicDefenseStalls:report.certifiedBasicDefenseStalls,guardResponsesChecked:tested}));
