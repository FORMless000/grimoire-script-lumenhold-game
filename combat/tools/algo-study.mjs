// Arena: two AI settings head to head under a strict per-decision node budget, every class pair, seats swapped.
//   node tools/algo-study.mjs [--a '{…}'] [--b '{…}'] [--budget 64000] [--levels 20,45,70] [--openings 1] [--plies 2] [--name x]
// --a / --b are AI settings merged over the base {mistakeChance:0, tiltScale:0, maxDepth:30, nodeBudget:<budget>, prune:true}: iterative
// deepening runs until the node budget stops it (strict: a search aborts at the budget and plays its last completed depth).
// Openings: each case is also played from <openings> seeded random starts of <plies> exchanges (both sides random legal moves),
// and every start is played twice, A on each seat, so seat, class order and first leader cancel out.
// Prints A's score (draws half), Elo with a 95% interval from the paired games, and the breakdowns; lines go to out/algo/<name>.jsonl.
import fs from 'node:fs';import path from 'node:path';
import {armCases,play,root} from './arms.mjs';
import * as C from '../web/core.mjs';
const args=process.argv.slice(2),opt=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const budget=Number(opt('budget',64000)),levels=opt('levels','20,45,70').split(',').map(Number);
const openings=Number(opt('openings',1)),plies=Number(opt('plies',2)),name=opt('name','arena');
const base={mistakeChance:0,tiltScale:0,maxDepth:30,nodeBudget:budget,prune:true};   // tiltScale 0: no urge, so no second (ranking) search
const A={...base,...JSON.parse(opt('a','{}'))},B={...base,...JSON.parse(opt('b','{}'))};

// mulberry32: the openings' random moves.
const rng=seed=>()=>{seed=(seed+0x6D2B79F5)>>>0;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
function opening(state,seed){
 const r=rng(seed),s=C.cloneState(state);
 for(let i=0;i<plies*2&&!s.result;i++){const legal=C.legalActions(s);C.applyChoice(s,legal[Math.floor(r()*legal.length)]);}
 delete s.lastEvents;return s;
}
const cases=[],tags=[];
armCases({pairs:true,levels,ai:[{},{}]}).forEach((c,idx)=>{
 for(let k=0;k<Math.max(1,openings);k++){
  const start=openings?opening(c.state,(idx*1009+k*7919+1)>>>0):c.state;
  if(start.result)continue;
  for(const seatA of [0,1]){
   const state=structuredClone(start);
   state.config.ai=[0,1].map(side=>({seed:c.state.config.ai[side].seed,...(side===seatA?A:B)}));
   cases.push({...c,state,search:{},maxRounds:120,meta:{...c.meta,opening:k,seatA}});
   tags.push({pair:`${idx}:${k}`,seatA,level:c.meta.level,classA:seatA?c.meta.o:c.meta.p});
  }
 }
});
const t0=Date.now(),rs=play(cases),wall=(Date.now()-t0)/1e3;
fs.mkdirSync(path.join(root,'out/algo'),{recursive:true});
fs.writeFileSync(path.join(root,'out/algo',name+'.jsonl'),rs.map((r,i)=>JSON.stringify({...r,tag:tags[i]})).join('\n')+'\n');

const scoreA=(r,t)=>!r.result||r.result.winner===undefined?.5:r.result.winner===t.seatA?1:0;
const elo=s=>s<=0?-Infinity:s>=1?Infinity:-400*Math.log10(1/s-1);
function summary(idx){
 const pairs=new Map();let n=0,sum=0;
 for(const i of idx){const s=scoreA(rs[i],tags[i]),p=pairs.get(tags[i].pair)??[0,0];n++;sum+=s;pairs.set(tags[i].pair,[p[0]+s,p[1]+1]);}
 const ps=[...pairs.values()].map(([x,k])=>x/k),m=ps.reduce((a,b)=>a+b,0)/ps.length,sd=Math.sqrt(ps.reduce((a,b)=>a+(b-m)**2,0)/Math.max(1,ps.length-1)),se=sd/Math.sqrt(ps.length);
 const f=x=>Number.isFinite(x)?(x>0?'+':'')+x.toFixed(0):x>0?'+∞':'−∞';
 return {n,score:sum/n,text:`${(100*sum/n).toFixed(1)}% | ${f(elo(sum/n))} [${f(elo(m-1.96*se))}, ${f(elo(m+1.96*se))}] | ${n}`};
}
const all=rs.map((_,i)=>i),by=key=>{const g=new Map();all.forEach(i=>{const k=tags[i][key];if(!g.has(k))g.set(k,[]);g.get(k).push(i);});return g;};
const side=(r,t,who)=>who==='A'?t.seatA:1-t.seatA;
const perDecision=(who,f)=>{let x=0,d=0;rs.forEach((r,i)=>{const s=side(r,tags[i],who);x+=f(r,s);d+=r.decisions[s];});return x/d;};
const cpuShare=(who)=>{let x=0;rs.forEach((r,i)=>{const s=side(r,tags[i],who),tot=r.nodes[0]+r.nodes[1];x+=tot?r.cpuMs*r.nodes[s]/tot:0;});return x;};
const decs=w=>rs.reduce((a,r,i)=>a+r.decisions[side(r,tags[i],w)],0);
console.log(`# Arena ${name}: A ${JSON.stringify(A)} vs B ${JSON.stringify(B)}\n${rs.length} fights, ${wall.toFixed(0)} s wall; openings ${openings}×${plies} exchanges; levels ${levels}\n`);
console.log('| Slice | A score | A Elo [95%] | Fights |\n|---|---:|---:|---:|');
console.log(`| all | ${summary(all).text} |`);
for(const [k,idx] of by('level'))console.log(`| level ${k} | ${summary(idx).text} |`);
for(const [k,idx] of [...by('classA')].sort())console.log(`| A plays ${k} | ${summary(idx).text} |`);
const seat0=rs.reduce((a,r)=>a+(!r.result||r.result.winner===undefined?.5:r.result.winner===0?1:0),0)/rs.length;
const reasons={};for(const r of rs){const k=r.result?.reason??'unfinished';reasons[k]=(reasons[k]??0)+1;}
console.log(`\nSeat 0 scores ${(100*seat0).toFixed(1)}% (seat bias check). Endings: ${JSON.stringify(reasons)}. Median length ${rs.map(r=>r.rounds).sort((a,b)=>a-b)[rs.length>>1]} exchanges.`);
for(const w of ['A','B'])console.log(`${w}: ${perDecision(w,(r,s)=>r.nodes[s]).toFixed(0)} nodes/decision, mean completed depth ${perDecision(w,(r,s)=>r.depth[s]*r.decisions[s]).toFixed(2)}, ~${(cpuShare(w)/decs(w)).toFixed(1)} ms/decision`);
