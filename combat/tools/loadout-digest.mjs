// How each class plays, from a suite's traces: win rate, its most-used actions (share of its exchanges), how often it casts
// a spell rather than Strike/Guard/Reclaim, its favourite two-move sequence, and what finishes the fights it wins.
//   node tools/loadout-digest.mjs F59G [--band 20-30]
import fs from 'node:fs';import readline from 'node:readline';
const name=process.argv[2],bi=process.argv.indexOf('--band'),band=bi<0?null:process.argv[bi+1].split('-').map(Number);
const BASIC=new Set(['strike','guard','reclaim','frozen']),per={};
const rl=readline.createInterface({input:fs.createReadStream(`out/${name}_cross.traces.jsonl`)});
const key=(id,ch)=>id==='hold'||id==='release'?`${ch} ${id}`:id?.startsWith('bundle:')?'haste: '+id.slice(7).replaceAll('+',' + '):id;
for await(const line of rl){const {p,o,level,trace:t}=JSON.parse(line);if(band&&(level<band[0]||level>band[1]))continue;
 [p,o].forEach((cls,side)=>{const c=per[cls]??={fights:0,wins:0,rounds:0,acts:{},seq:{},casts:0,n:0,finish:{},hpWin:[]};
  c.fights++;c.rounds+=t.history.length;const w=t.result?.winner;if(w===side)c.wins++;else if(w===undefined||w===null)c.wins+=.5;
  let prev=null;for(const h of t.history){const id=h.pair?.[side];if(!id)continue;const k=key(id,h.channels?.[side]);c.acts[k]=(c.acts[k]??0)+1;c.n++;if(!BASIC.has(id))c.casts++;
   if(prev){const s=prev+' → '+k;c.seq[s]=(c.seq[s]??0)+1;}prev=k;}
  if(w===side){const last=t.history.at(-1),f=key(last.pair[side],last.channels?.[side]);c.finish[f]=(c.finish[f]??0)+1;c.hpWin.push(last.hp[side]);}
 });}
const top=(o,n,total)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>`${k} ${Math.round(100*v/total)}%`).join(', ');
console.log(`| Class | Wins | Exchanges | Casts | Most used (share of its exchanges) | Favourite sequence | Wins finished by |\n|---|---:|---:|---:|---|---|---|`);
for(const [cls,c]of Object.entries(per)){const seqTotal=Object.values(c.seq).reduce((a,b)=>a+b,0),fin=Object.values(c.finish).reduce((a,b)=>a+b,0);
 console.log(`| ${cls} | ${Math.round(100*c.wins/c.fights)}% | ${(c.rounds/c.fights).toFixed(1)} | ${Math.round(100*c.casts/c.n)}% | ${top(c.acts,5,c.n)} | ${top(c.seq,1,seqTotal)} | ${top(c.finish,2,fin)} |`);}
