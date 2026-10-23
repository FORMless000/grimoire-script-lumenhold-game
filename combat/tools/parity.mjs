// Native / WebAssembly parity for the combat core (F5.11-plan.1; replaces the frozen goldens of tools/golden.mjs, which dated
// from the retired JS oracle). Nothing is frozen, so a rule change needs no refresh: random fights, searches and seeded AI
// fights are played now through both builds of the same core, the native simulator (rust/target/release/combat-sim) and the
// browser's (web/core.mjs + core.wasm), and must agree on every state, legal list, search result and decision.
//   node tools/parity.mjs [fights]    after tools/build.mjs (or cargo build --release and the wasm build)
import path from 'node:path';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import * as R from '../setup/roster.mjs';
import {createState} from '../setup/setup.mjs';
import * as C from '../web/core.mjs';
import {positions} from './positions.mjs';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BIN=path.join(root,'rust/target/release/combat-sim');
const N=Number(process.argv[2]??120);
const E={...R,createState,...C};
function native(cmd,lines){
 const run=spawnSync(BIN,[cmd],{input:lines.map(l=>JSON.stringify(l)).join('\n')+'\n',maxBuffer:2**31-1,encoding:'utf8'});
 if(run.status!==0)throw Error('combat-sim failed: '+run.stderr);
 return run.stdout.trim().split('\n').map(l=>JSON.parse(l));
}
// JSON equality with numbers as numbers (serde prints 1.0 where JS prints 1); timing fields and JS-only fields left out.
const SKIP=new Set(['elapsedMs','lastEvents','searching']);
function same(a,b){
 if(typeof a==='number'||typeof b==='number')return Number(a)===Number(b);
 if(Array.isArray(a)||Array.isArray(b))return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>same(x,b[i]));
 if(a&&b&&typeof a==='object'&&typeof b==='object'){const ka=Object.keys(a).filter(k=>!SKIP.has(k)),kb=Object.keys(b).filter(k=>!SKIP.has(k));return ka.length===kb.length&&ka.every(k=>k in b&&same(a[k],b[k]));}
 return a===b;
}
const start=s=>{const {lastEvents,...rest}=s;return rest;};

let rng=0x5eed1234;const rand=()=>{rng=(rng+0x6D2B79F5)|0;let t=Math.imul(rng^(rng>>>15),1|rng);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const pick=xs=>xs[Math.floor(rand()*xs.length)];
// Varied setups: generic, named and special kits, levels 20–70, all-spell access, observers, both health models, depleted
// budgets, scales.
function setups(n){
 const generic=Object.keys(R.LOADOUTS),named=Object.keys(R.NAMED_LOADOUTS),special=Object.keys(R.SPECIAL_LOADOUTS),out=[];
 for(let f=0;f<n;f++){
  const pool=f%5===4?named:f%5===3?special:generic,lv=()=>20+Math.floor(rand()*51);
  out.push({playerLoadout:pick(f%5===3?generic:pool),opponentLoadout:pick(pool),playerLevel:lv(),opponentLevel:lv(),spellAccess:f%3===0?'kit':'all',firstLeader:f%2,
   observers:f%4===0,healthModel:f%3===1?'offset':'direct',resourceBudget:f%7===0?'depleted':'standard',context:pick(Object.keys(R.CONTEXTS)),
   manaCostScale:f%11===0?1.5:1,hpScale:f%13===0?.5:1,damageMultiplier:f%17===0?.5:1,combatScale:f%19===0?1.25:1});
 }
 return out.filter(o=>{try{createState(o);return true;}catch{return false;}});
}
let bad=0;const t0=performance.now();
const report=(label,ok,total)=>{console.log(`${ok===total?'ok  ':'FAIL'} ${label}: ${ok}/${total}  (${((performance.now()-t0)/1000).toFixed(0)} s)`);if(ok!==total)bad++;};

// 1. Transitions: random legal play in WebAssembly (some passive fights, some conceded), replayed natively step by step.
const fights=setups(N).map((opts,i)=>{
 const s=createState(opts),first=start(structuredClone(s)),actions=[],seen=[];
 const passive=i%6===5,concedeAt=i%9===4?3+Math.floor(rand()*12):Infinity;
 while(!s.result&&s.round<=90){
  if(s.round>=concedeAt&&s.pending.every(p=>p===null)){const side=Math.floor(rand()*2);actions.push('concede:'+side);C.concede(s,side);seen.push({state:structuredClone(s),legal:C.legalActions(s)});break;}
  const legal=C.legalActions(s),id=passive&&legal.includes('guard')&&rand()<.93?'guard':pick(legal);actions.push(id);C.applyChoice(s,id);
  seen.push({state:structuredClone(s),legal:C.legalActions(s)});
 }
 return {first,actions,seen};
});
const lines=native('step',fights.map(f=>({state:f.first,actions:f.actions})));
let at=0,ok=0,steps=0;
for(const [i,f]of fights.entries()){
 let good=true;
 for(const [k,w]of f.seen.entries()){const n=lines[at++];steps++;if(good&&!(same(n.state,w.state)&&same(n.legal,w.legal))){good=false;if(bad<3)console.log(`   fight ${i}: differs at step ${k} (${f.actions[k]})`);}}
 if(good)ok++;
}
report(`transitions (${steps} steps)`,ok,fights.length);

// 2. Search on the shared positions: cache off and on, fixed and tactical horizons, with and without pruning.
const P=await positions(E),cases=[];
for(const p of P)for(let d=1;d<=2;d++)for(const prune of [false,true])for(const horizonMode of ['fixed','tactical'])cases.push({p,options:{maxDepth:d,nodeBudget:1e9,prune,horizonMode,rankActions:d%2===1,table:false}});
const sr=native('search',cases.map(c=>({state:c.p.state,options:c.options})));
let sok=0;
cases.forEach((c,i)=>{const w=C.searchAction(C.cloneState(c.p.state),c.options);if(same(w,sr[i]))sok++;else if(sok+3>i)console.log(`   ${c.p.id} ${JSON.stringify(c.options)}: native ${sr[i].id} ${sr[i].value}, wasm ${w.id} ${w.value}`);});
report(`search on ${P.length} positions`,sok,cases.length);

// 3. Seeded AI fights with the transposition table: the Engine preset and a persona opponent, the same decisions.
const G=Object.keys(R.LOADOUTS),aiCases=[];
for(let i=0;i<12;i++){const level=[20,45,70][i%3];aiCases.push({playerLoadout:G[i%9],opponentLoadout:G[(i*4+1)%9],playerLevel:level,opponentLevel:level,firstLeader:i%2,
 ai:[{preset:i%2?'engine':'medium',seed:i*2+1,maxDepth:3,nodeBudget:200000},{preset:'engine',seed:i*2+2,maxDepth:3,nodeBudget:200000}]});}
const search={};
const af=native('fight',aiCases.map(o=>({state:start(createState(o)),search,tableLimit:4096,maxRounds:120})));
let aok=0;
aiCases.forEach((o,i)=>{const s=createState(o),ctx=[C.createSearchContext({tableLimit:4096}),C.createSearchContext({tableLimit:4096})],acts=[];
 while(!s.result&&s.round<=120){const d=C.chooseAIAction(s,search,ctx[C.actorToMove(s)]);acts.push(d.id);C.applyChoice(s,d.id);}
 if(same(acts,af[i].actions))aok++;else console.log(`   AI fight ${i}: differs at move ${acts.findIndex((a,k)=>a!==af[i].actions[k])}`);
 ctx.forEach(C.freeSearchContext);});
report('seeded AI fights',aok,aiCases.length);
if(bad)process.exitCode=1;
