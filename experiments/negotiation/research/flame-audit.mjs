// Inspect loss-ending casts without treating surrender ties as useful variety.
import fs from 'node:fs';import path from 'node:path';import readline from 'node:readline';import {pathToFileURL} from 'node:url';
const directory=path.resolve(process.argv[2]),out=path.join(directory,'flame-tie-audit.json');if(fs.existsSync(out))throw Error('Audit already exists');
const {createResearchState}=await import(pathToFileURL(path.join(directory,'source/research/model.mjs'))),{nativeCore}=await import(pathToFileURL(path.join(directory,'source/research/native.mjs'))),options=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'))).options,native=nativeCore(),audits=[];
try{for await(const line of readline.createInterface({input:fs.createReadStream(path.join(directory,'matches.ndjson')),crlfDelay:Infinity})){
 const r=JSON.parse(line),i=r.state.history.findIndex(h=>h.action==='flame');if(i<0)continue;
 const s=await native.request({op:'replay',state:createResearchState(r.state.config),tape:r.state.history.slice(0,i).map(h=>h.action)}),d=await native.request({op:'search',state:s,options});
 audits.push({level:r.level,scenario:r.scenario,gap:r.gap,episode:r.episode,selected:d.id,maxWin:Math.max(...d.scores.map(x=>x.winEstimate)),flame:d.scores.find(x=>x.id==='flame'),withdraw:d.scores.find(x=>x.id==='withdraw')});
}fs.writeFileSync(out,JSON.stringify(audits,null,2),{flag:'wx'});console.log(JSON.stringify({n:audits.length,allZero:audits.every(a=>a.maxWin===0),allEqual:audits.every(a=>a.flame.value===a.withdraw.value)}));}finally{native.close();}
