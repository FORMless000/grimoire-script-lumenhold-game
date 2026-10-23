// The rules data for the Rust core, from the JS spell data (setup/roster.mjs stays the only home of these numbers).
//   node tools/export-data.mjs          writes rust/core/data/rules-data.json (embedded at build)
// rulesData() is also used by tools/arms.mjs to export a variant's data for a native run (COMBAT_DATA).
import fs from 'node:fs';import {fileURLToPath} from 'node:url';
import {SPELLS,CONSTRUCTS,CONTEXTS,RESOURCES,FLUX_RATIO,ALIGNMENT_COST,COMBAT_TUNING} from '../setup/roster.mjs';
const keep=['name','skills','cost','damage','healing','duration','renown','holdCost','hpCost','channel','construct','castable','group','alignment','release','exposes','physical','amounts','bind','drain','drainKeep','poison','hits','rule','delay'];
export function rulesData(){
 const spells=Object.entries(SPELLS).map(([id,s])=>({id,...Object.fromEntries(keep.filter(k=>s[k]!==undefined).map(k=>[k,s[k]]))}));
 const constructs=Object.entries(CONSTRUCTS).map(([id,c])=>({id,...c}));
 return {tuning:COMBAT_TUNING,spells,constructs,contexts:CONTEXTS,resources:RESOURCES,fluxRatio:FLUX_RATIO,alignmentCost:ALIGNMENT_COST};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const out=new URL('../rust/core/data/rules-data.json',import.meta.url),data=rulesData();
 fs.writeFileSync(out,JSON.stringify(data,null,1)+'\n');console.log('wrote',out.pathname,data.spells.length,'spells');
}
