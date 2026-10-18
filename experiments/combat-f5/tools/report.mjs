// node report.mjs F4 D3 D4 V4 — markdown tables: class win% by level band, fight stats, level-gap win%.
import fs from 'node:fs';
const G=['Duellist','Scholar','Healer','Illusionist','Brawler','Prefect','Showman','Underground tough','Sailor','Hollow adept'];
const BANDS=[['20–30',[20,30]],['40–50',[40,50]],['60–80',[60,70,80]]];
const load=f=>fs.existsSync(new URL('../out/'+f+'.jsonl',import.meta.url))?fs.readFileSync(new URL('../out/'+f+'.jsonl',import.meta.url),'utf8').trim().split('\n').map(l=>JSON.parse(l)):null;
const med=a=>{a=[...a].sort((x,y)=>x-y);return a.length?a[a.length>>1]:NaN;};
const suites=process.argv.slice(2).map(n=>({n,cross:load(n+'_cross'),gaps:load(n+'_gaps')})).filter(s=>s.cross);
const pct=(w,n)=>n?Math.round(100*w/n):NaN;
const score=(r,side)=>!r.result||r.result.outcome==='draw'||r.result.winner===undefined?.5:r.result.winner===side?1:0;
console.log('### Class win rate by level band (draws count half)\n');
console.log('| Class | '+suites.map(s=>BANDS.map(b=>`${s.n} ${b[0]}`).join(' | ')+` | **${s.n} all**`).join(' | ')+' |');
console.log('|---|'+suites.map(()=>BANDS.map(()=>'---:').join('|')+'|---:').join('|')+'|');
const all={};
for(const g of G){const cells=[];for(const s of suites){let tw=0,tn=0;for(const [,lv] of BANDS){let w=0,n=0;for(const r of s.cross)if(lv.includes(r.level))for(const [c,side] of [[r.p,0],[r.o,1]])if(c===g){w+=score(r,side);n++;}cells.push(pct(w,n));tw+=w;tn+=n;}cells.push('**'+pct(tw,tn)+'**');(all[s.n]??=[]).push(tw/tn);}
 console.log(`| ${g} | ${cells.join(' | ')} |`);}
const sd=a=>{const m=a.reduce((x,y)=>x+y)/a.length;return Math.round(100*Math.sqrt(a.reduce((s,r)=>s+(r-m)**2,0)/a.length));};
console.log('| *spread (sd)* | '+suites.map(s=>BANDS.map(([,lv])=>{const rs=G.map(g=>{let w=0,n=0;for(const r of s.cross)if(lv.includes(r.level))for(const [c,side] of [[r.p,0],[r.o,1]])if(c===g){w+=score(r,side);n++;}return w/n;});return '*'+sd(rs)+'*';}).join(' | ')+' | ***'+sd(all[s.n])+'***').join(' | ')+' |');
console.log('\n### Fights\n\n| Suite | Fights | Knockouts | Decisions on points | Draws | Unfinished | Median length | Median length L20 / L50 / L80 | Mean search depth | CPU per fight |\n|---|---:|---:|---:|---:|---:|---:|---|---:|---:|');
for(const s of suites){const r=s.cross,k=r.filter(x=>x.result?.reason==='knockout');const L=l=>med(r.filter(x=>x.level===l).map(x=>x.rounds));
 const dep=r.filter(x=>x.depth).map(x=>(x.depth[0]+x.depth[1])/2),cpu=r.filter(x=>x.cpuMs).map(x=>x.cpuMs);
 console.log(`| ${s.n} | ${r.length} | ${k.length} | ${r.filter(x=>x.result?.reason==='decision').length} | ${r.filter(x=>x.result?.outcome==='draw').length} | ${r.filter(x=>!x.result).length} | ${med(r.map(x=>x.rounds))} | ${L(20)} / ${L(50)} / ${L(80)} | ${dep.length?(dep.reduce((a,b)=>a+b)/dep.length).toFixed(2):'≈2.8–3'} | ${cpu.length?(cpu.reduce((a,b)=>a+b)/cpu.length/1000).toFixed(1)+' s':'—'} |`);}
console.log('\n### Level gaps: how often the higher-level side wins (draws half)\n\n| Suite | +5 | +10 | +20 | +5 / +10 / +20 from base 30 | from base 55 |\n|---|---:|---:|---:|---|---|');
for(const s of suites){if(!s.gaps)continue;const f=(gap,base)=>{let w=0,n=0;for(const r of s.gaps)if(r.gap===gap&&(base===undefined||r.level===base)){w+=score(r,r.hiSide);n++;}return pct(w,n);};
 console.log(`| ${s.n} | ${f(5)}% | ${f(10)}% | ${f(20)}% | ${f(5,30)} / ${f(10,30)} / ${f(20,30)} | ${f(5,55)} / ${f(10,55)} / ${f(20,55)} |`);}
console.log('\n### Level gaps by class (+10, higher side wins %)\n\n| Suite | '+G.join(' | ')+' |\n|---|'+G.map(()=>'---:').join('|')+'|');
for(const s of suites){if(!s.gaps)continue;console.log(`| ${s.n} | `+G.map(g=>{let w=0,n=0;for(const r of s.gaps)if(r.gap===10&&r.p===g){w+=score(r,r.hiSide);n++;}return pct(w,n);}).join(' | ')+' |');}
