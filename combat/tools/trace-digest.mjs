// How fights feel, from traced suites: stalls, repetition, variety and swings, by level band. Markdown out.
//   node tools/trace-digest.mjs <name> [other names…]   reads out/<name>_cross.traces.jsonl
// Watch for: many decisions on points or long identical-pair runs (stalemates), a high share of exchanges where both sides
// only Strike/Guard/Reclaim (dry fights), few distinct actions (one-button play), few HP lead changes (one-sided fights).
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const names=process.argv.slice(2);if(!names.length){console.error('usage: node tools/trace-digest.mjs <name> [other names…]');process.exit(2);}
const BASIC=new Set(['strike','guard','reclaim','frozen','cancel']);
const band=lv=>lv<=30?'20–30':lv<=50?'40–50':'60–80';
const median=a=>{if(!a.length)return '—';a=[...a].sort((x,y)=>x-y);return a[a.length>>1];};
console.log('### How fights play (from the traces)\n');
console.log('**Both basic:** exchanges where neither side casts. **Repeats:** an action the same as that side\'s last one. **Longest run:** the longest stretch of the same pair of actions, per fight. **Lead changes:** times the HP lead (by 5+) switches sides, per fight.\n');
console.log('| Suite | Levels | Fights | Mean length | Knockouts / decisions / draws | Decisions end at (median exchange) | Both basic | Repeats | Distinct actions per side | Longest run | Lead changes |');
console.log('|---|---|---:|---:|---|---:|---:|---:|---:|---:|---:|');
const pairs={};
for(const name of names){
 const f=path.join(root,'out',name+'_cross.traces.jsonl');
 if(!fs.existsSync(f)){console.error('No '+path.relative(root,f));process.exit(1);}
 const agg={};const A=k=>agg[k]??={n:0,len:0,ko:0,dec:0,draw:0,basic:0,ex:0,rep:0,acts:0,distinct:0,run:0,swing:0,decAt:[]};
 const bigram=pairs[name]={};
 for(const line of fs.readFileSync(f,'utf8').trim().split('\n')){
  const t=JSON.parse(line).trace,a=A(band(t.kits[0].level)),h=t.history.filter(x=>x.resolved!==false);
  a.n++;a.len+=h.length;
  const r=t.result;if(r?.reason==='knockout')a.ko++;else if(r?.reason==='decision'){a.dec++;a.decAt.push(r.round);}else a.draw++;
  let run=1,best=1,lead=0;
  for(let i=0;i<h.length;i++){
   const p=h[i].pair;a.ex++;if(BASIC.has(p[0])&&BASIC.has(p[1]))a.basic++;
   if(i){for(const s of [0,1]){a.acts++;if(p[s]===h[i-1].pair[s])a.rep++;const k=h[i-1].pair[s]+' → '+p[s];bigram[k]=(bigram[k]??0)+1;}
    if(p[0]===h[i-1].pair[0]&&p[1]===h[i-1].pair[1])best=Math.max(best,++run);else run=1;}
   const l=Math.sign(Math.round((h[i].hp[0]-h[i].hp[1])/5));if(l&&lead&&l!==lead)a.swing++;if(l)lead=l;
  }
  a.run+=best;for(const s of [0,1])a.distinct+=new Set(h.map(x=>x.pair[s])).size/2;
 }
 const pc=(x,y)=>Math.round(100*x/y)+'%',f1=x=>x.toFixed(1);
 for(const [k,a] of Object.entries(agg).sort())console.log(`| ${name} | ${k} | ${a.n} | ${f1(a.len/a.n)} | ${a.ko} / ${a.dec} / ${a.draw} | ${median(a.decAt)} | ${pc(a.basic,a.ex)} | ${pc(a.rep,a.acts)} | ${f1(a.distinct/a.n)} | ${f1(a.run/a.n)} | ${f1(a.swing/a.n)} |`);
}
for(const name of names)console.log(`\n**Most common action pairs in a row (${name}):** `+Object.entries(pairs[name]).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>`${k} (${v})`).join(', '));
