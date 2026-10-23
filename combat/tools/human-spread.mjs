// The spread of a tools/human-study.mjs --json result: per tier, the loadouts' win-rate range and standard deviation.
//   node tools/human-spread.mjs out/a.json [out/b.json …]
import fs from 'node:fs';
for(const f of process.argv.slice(2)){
 const {levels,pool,S}=JSON.parse(fs.readFileSync(f,'utf8')),cols=[];
 for(const lv of [...levels,'all']){
  const w=pool.map(l=>{const xs=lv==='all'?levels.map(t=>S[l][t]):[S[l][lv]];return xs.reduce((a,x)=>a+x.pts,0)/xs.reduce((a,x)=>a+x.n,0);});
  const m=w.reduce((a,b)=>a+b,0)/w.length,sd=Math.sqrt(w.reduce((a,b)=>a+(b-m)**2,0)/w.length);
  cols.push(`${lv==='all'?'all':'L'+lv} ${(100*Math.min(...w)).toFixed(0)}–${(100*Math.max(...w)).toFixed(0)} sd ${(100*sd).toFixed(0)}`);
 }
 console.log(f.padEnd(28),cols.join('  |  '));
}
