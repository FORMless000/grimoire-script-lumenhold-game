// How far below the foe's level a perfect player (the engine) can be and still beat each difficulty: the engine at
// base − gap against a preset at base, every class pair, the engine on each side. Depth 4, both leaders.
//   node tools/underdog-study.mjs [--base 40] [--gaps 0,5,10,15,20] [--presets easy,medium,hard] [--seeds 1]
import {LOADOUTS} from '../setup/roster.mjs';
import {createState,expandAI} from '../setup/setup.mjs';
import {play} from './arms.mjs';
const args=process.argv.slice(2),opt=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const base=Number(opt('base',40)),gaps=opt('gaps','0,5,10,15,20').split(',').map(Number),presets=opt('presets','easy,medium,hard').split(','),seeds=Array.from({length:Number(opt('seeds',1))},(_,i)=>i+1);
const G=Object.keys(LOADOUTS),cases=[],meta=[];let idx=0;
for(const preset of presets)for(const gap of gaps)for(let i=0;i<G.length;i++)for(let j=i+1;j<G.length;j++)for(const side of [0,1])for(const firstLeader of [0,1])for(const seed of seeds){
 const cls=[G[i],G[j]],lv=[side?base:base-gap,side?base-gap:base];
 const ai=[0,1].map(s=>({mistakeChance:0,seed:(seed*7919+idx*2+s)>>>0,...(s===side?{}:expandAI({preset},cls[s]))}));idx++;
 const st=createState({playerLoadout:cls[0],opponentLoadout:cls[1],playerLevel:lv[0],opponentLevel:lv[1],firstLeader,ai});
 const {lastEvents,...state}=st;cases.push({meta:{},state,search:{maxDepth:Number(opt('depth',4)),nodeBudget:3e6,prune:true},maxRounds:120,tableLimit:16384});meta.push({preset,gap,side});}
const rs=play(cases),cell={};
rs.forEach((r,i)=>{const {preset,gap,side}=meta[i];((cell[preset]??={})[gap]??=[]).push(!r.result||r.result.winner===undefined?.5:r.result.winner===side?1:0);});
console.log(`| Foe difficulty (foe at level ${base}) | ${gaps.map(g=>'engine −'+g).join(' | ')} |\n|---|${gaps.map(()=>'---:').join('|')}|`);
for(const p of presets)console.log(`| ${p} | ${gaps.map(g=>{const v=cell[p][g];return (100*v.reduce((a,b)=>a+b,0)/v.length).toFixed(0)+'%';}).join(' | ')} |`);
