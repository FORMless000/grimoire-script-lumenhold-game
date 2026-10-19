// How much an AI's personality (tilt) and difficulty (slack) cost it: the knobbed AI against an optimal one, every class pair,
// with the knobbed AI on each side in turn (so seat and class order cancel out).
//   node tools/ai-study.mjs [--depth 4] [--levels 30,60] [--seeds 2] [--grid '[{"slack":8},{"preset":"easy"},…]']
// A grid entry is AI settings for the knobbed side ({slack, maxRegret, tilt, tiltScale, mistakeChance}), or {preset: name}
// for one of AI_PRESETS, or {persona:true, …} to give each class its own persona (PERSONAS in setup/foes.mjs). Expanded by expandAI.
// Prints the knobbed AI's win rate (draws half), how often it left the best move, and the median cost of those moves.
import {armCases,play} from './arms.mjs';
import {expandAI} from '../setup/setup.mjs';
const args=process.argv.slice(2),opt=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const depth=Number(opt('depth',4)),levels=opt('levels','30,60').split(',').map(Number),seeds=Array.from({length:Number(opt('seeds',2))},(_,i)=>i+1);
const grid=JSON.parse(opt('grid',JSON.stringify([{},{slack:4},{slack:8},{slack:16},{slack:32},{preset:'easy'},{preset:'medium'},{preset:'hard'}])));
const OPTIMAL={mistakeChance:0};
const settingsFor=(g,cls)=>({...OPTIMAL,...expandAI(g,cls)});
console.log('| Knobbed AI | Wins vs optimal | Left the best move | Median cost of those (points) | Fights |\n|---|---:|---:|---:|---:|');
for(const g of grid){
 const cases=[],sides=[];
 for(const side of [0,1]){
  const arm={pairs:true,levels,seeds,fallible:true,maxRounds:120,search:{maxDepth:depth,nodeBudget:3e6,prune:true}};
  for(const c of armCases({...arm,ai:[OPTIMAL,OPTIMAL]})){
   const cls=side?c.meta.o:c.meta.p;
   c.state.config.ai[side]={...c.state.config.ai[side],profile:undefined,...settingsFor(g,cls)};delete c.state.config.ai[side].profile;
   c.state.config.ai[1-side]={seed:c.state.config.ai[1-side].seed,...OPTIMAL};
   cases.push(c);sides.push(side);
  }
 }
 const rs=play(cases);let w=0,off=0,dec=0;const regrets=[];
 rs.forEach((r,i)=>{const s=sides[i];w+=!r.result||r.result.winner===undefined?.5:r.result.winner===s?1:0;dec+=r.decisions?.[s]??0;off+=r.degraded?.[s]??0;for(const x of r.regrets?.[s]??[])regrets.push(x);});
 regrets.sort((a,b)=>a-b);
 console.log(`| ${JSON.stringify(g)} | ${(100*w/rs.length).toFixed(0)}% | ${dec?(100*off/dec).toFixed(0)+'%':'—'} | ${regrets.length?regrets[regrets.length>>1].toFixed(1):'—'} | ${rs.length} |`);
}
