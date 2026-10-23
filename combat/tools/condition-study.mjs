// How the player's condition on entering a fight (Health and Mana below full) changes their chance to win.
//   node tools/condition-study.mjs [--depth 4] [--variant file] [--config '<JSON>'] [--grid '[{"health":0.8},…]']
// Every class as the player against every other class at levels 20/45/70, both initiative orders (432 fights per condition),
// the player entering worn or drained while the opponent is fresh. Prints the player's win rate per condition and the start it maps to.
import {armCases,play,applyVariant} from './arms.mjs';
const args=process.argv.slice(2),opt=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const depth=Number(opt('depth',4)),variant=opt('variant',undefined),config=JSON.parse(opt('config','{}'));
await applyVariant(variant);
const {combatStart}=await import('../setup/setup.mjs');
const grid=opt('grid',null)?JSON.parse(opt('grid')):[{},{health:.8},{health:.6},{health:.4},{health:.2},{mana:.8},{mana:.6},{mana:.4},{mana:.2},{health:.6,mana:.6},{health:.4,mana:.4}];
const cases=[],groups=[];
for(const c of grid){
 const arm={offsets:[1,2,3,4,5,6,7,8],levels:[20,45,70],fallible:true,seeds:[1],maxRounds:120,search:{maxDepth:depth,nodeBudget:3e6,prune:true},config:{...config,playerCondition:c}};
 const cs=armCases(arm);groups.push({c,from:cases.length,n:cs.length});cases.push(...cs);
}
const t0=performance.now(),lines=play(cases);
const score=(r,side)=>!r.result||r.result.outcome==='draw'||r.result.winner===undefined?.5:r.result.winner===side?1:0;
console.log(`| Condition on entering (1 = fit / full) | Starts with HP / Mana | Player wins | Change |\n|---|---|---:|---:|`);
let base;
for(const g of groups){
 const rs=lines.slice(g.from,g.from+g.n),w=rs.reduce((n,r)=>n+score(r,0),0)/rs.length*100;base??=w;
 const s=combatStart(g.c);
 console.log(`| health ${g.c.health??1}, mana ${g.c.mana??1} | ${Math.round(s.hp*100)}% / ${Math.round(s.mana*100)}% | ${w.toFixed(0)}% | ${g===groups[0]?'—':(w-base>=0?'+':'')+(w-base).toFixed(0)} |`);
}
console.log(`\n${cases.length} fights, depth ${depth}, ${((performance.now()-t0)/1000).toFixed(0)} s`);
