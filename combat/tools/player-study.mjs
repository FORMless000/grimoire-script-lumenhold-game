// The main game's player against every class: is a foe at the card's challenge level (foe level = DC) a fair fight for the
// player the curve expects? Skills from the measured balanced player (tools/event-levels.mjs PLAYER: best, 2nd, average,
// weakest), laid out as a fighter (best on Arcana, 2nd on Vigor, weakest on Charm) or a talker (best on Charm, 2nd on
// Lore, weakest on Vigor); spells as a generated kit at level E (the kit gates follow the main game's courses).
// Foes at E − 10, E and E + 10 (an even rung's DC is E at any drift). Depth 4, the suite's fallible AIs, both leaders.
//   node tools/player-study.mjs [--months 12,24,36,47] [--seeds 2] [--kit Duellist]
import {play} from './arms.mjs';
import {LOADOUTS,generateLoadout} from '../setup/roster.mjs';
import {createState} from '../setup/setup.mjs';
import {PLAYER,playerAt} from './event-levels.mjs';
const args=process.argv.slice(2),opt=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const months=opt('months','12,24,36,47').split(',').map(Number),seeds=Array.from({length:Number(opt('seeds',2))},(_,i)=>i+1),kitClass=opt('kit','Duellist');
const LAYOUTS={fighter:['arcana','vigor','guile','alchemy','lore','charm'],talker:['charm','lore','alchemy','guile','arcana','vigor']};
function profile(t,layout){const A=playerAt('average',t),B=playerAt('best',t),S=playerAt('second',t),W=playerAt('weakest',t),m=(6*A-B-S-W)/3;
 const v=[B,S,m+3,m,m-3,W].map(x=>Math.max(1,Math.min(100,Math.round(x))));return Object.fromEntries(LAYOUTS[layout].map((k,i)=>[k,v[i]]));}
const cases=[],meta=[];let idx=0;
for(const t of months){const e=playerAt('E',t),spells=generateLoadout(kitClass,e).spells;
 for(const layout of Object.keys(LAYOUTS))for(const d of [-10,0,10])for(const o of Object.keys(LOADOUTS))for(const seed of seeds)for(const firstLeader of [0,1]){
  const s=createState({playerKit:{skills:profile(t,layout),spells,level:e},opponentLoadout:o,opponentLevel:Math.max(1,e+d),firstLeader,ai:[0,1].map(side=>({profile:'fallible',seed:(seed*7919+idx*2+side)>>>0}))});idx++;
  const {lastEvents,...state}=s;cases.push({meta:{},state,search:{maxDepth:Number(opt('depth',4)),nodeBudget:3e6,prune:true},maxRounds:120,tableLimit:16384});meta.push({t,layout,d});}}
const rs=play(cases),cell={};
rs.forEach((r,i)=>{const {t,layout,d}=meta[i];((cell[layout+t]??={})[d]??=[]).push(!r.result||r.result.winner===undefined?.5:r.result.winner===0?1:0);});
const pct=v=>(100*v.reduce((a,b)=>a+b,0)/v.length).toFixed(0)+'%';
console.log('| Month | E | Player skills (best / 2nd / … / weakest) | Layout | Player wins vs classes at E − 10 / E / E + 10 |\n|---:|---:|---|---|---|');
for(const t of months)for(const layout of Object.keys(LAYOUTS)){const p=profile(t,layout);
 console.log(`| ${t} | ${playerAt('E',t)} | ${LAYOUTS[layout].map(k=>p[k]).join(' / ')} | ${layout} (${LAYOUTS[layout][0]} best) | ${[-10,0,10].map(d=>pct(cell[layout+t][d])).join(' / ')} |`);}
