// Human duels (F5.11-plan.1 balance): every human loadout against every other at each level tier, both initiative orders,
// engine against engine (or any presets or player models), with each loadout's win rate by tier and the moves it played.
//   node tools/human-study.mjs [--levels 20,45,70] [--depth 5] [--nodes 3000000] [--player engine] [--foe engine] [--reps 1]
//                              [--classes Duellist,Brawler] [--named] [--spread 4] [--matrix] [--variant f] [--json out/x.json] [--threads n]
// --player / --foe: an AI preset (easy, medium, hard, engine) or a simulated player model (novice, decent; PLAYER_MODELS).
// When the two sides differ, every loadout meets every loadout (mirrors included) with the player's model on side 0, and
// each side gets its own table: the player model by its loadout, the foe by its own.
// --spread k also plays each tier at its level − k and + k (other skill jitters and kits), counted under the tier.
// --reps n plays every fight n times on other seeds (for the seeded persona opponents and slack players).
// --named adds the named characters (the growing ones at the tier's level) to the generic classes.
// --subjects named: the named characters (side 1, the foe's AI) each against every generic class (side 0, the player's AI),
// with a table for each side.
import fs from 'node:fs';
import {play,applyVariant} from './arms.mjs';
import {PLAYER_MODELS} from './player-models.mjs';
const argv=process.argv.slice(2),opt=(k,d)=>{const i=argv.indexOf('--'+k);return i<0?d:argv[i+1]??true;};
await applyVariant(opt('variant',null));
const R=await import('../setup/roster.mjs'),{createState}=await import('../setup/setup.mjs');
const levels=String(opt('levels','20,45,70')).split(',').map(Number),depth=Number(opt('depth',5)),nodes=Number(opt('nodes',3e6));
const spread=Number(opt('spread',0)),offs=spread?[-spread,0,spread]:[0],reps=Number(opt('reps',1));
const named=argv.includes('--named')?Object.keys(R.NAMED_LOADOUTS).filter(n=>!R.NAMED_LOADOUTS[n].fixed):[];
const pool=opt('classes')?String(opt('classes')).split(','):[...Object.keys(R.LOADOUTS),...named];
const subjects=opt('subjects')==='named'?Object.keys(R.NAMED_LOADOUTS).filter(n=>!R.NAMED_LOADOUTS[n].fixed):null;
const presets=[opt('player','engine'),opt('foe','engine')],asym=presets[0]!==presets[1]||!!subjects,foes=subjects??pool;
const aiFor=(name,seed)=>PLAYER_MODELS[name]?{...PLAYER_MODELS[name],seed}:{preset:name,maxDepth:depth,nodeBudget:nodes,mistakeChance:0,seed};
const cases=[];
for(let rep=0;rep<reps;rep++)for(const tier of levels)for(const off of offs)for(let i=0;i<pool.length;i++)for(let j=asym?0:i+1;j<foes.length;j++)for(const firstLeader of [0,1]){
 const level=tier+off,s=createState({playerLoadout:pool[i],opponentLoadout:foes[j],playerLevel:level,opponentLevel:level,firstLeader,context:'practice_duel',
  ai:presets.map((name,side)=>aiFor(name,(level*7919+i*31+j*7+side+rep*104729)>>>0))});
 const {lastEvents,...state}=s;
 cases.push({meta:{p:pool[i],o:foes[j],level:tier,firstLeader},state,search:{},maxRounds:80,tableLimit:16384});
}
const t0=Date.now(),results=play(cases,opt('threads')?Number(opt('threads')):undefined),secs=(Date.now()-t0)/1000;
// Per role (one when both sides play alike, else player and foe), loadout and tier: fights, points (win 1, draw ½), HP
// margin, exchanges; moves by count; and each pairing's points.
const roles=asym?presets.map((p,i)=>subjects?(i?p+' · named':p+' · classes'):p):[presets[0]],S=roles.map(()=>({})),moves=roles.map(()=>({})),pairs=roles.map(()=>({}));
const total={n:0,rounds:0,ko:0,decision:0,draw:0,pts:0};
for(const [i,r]of results.entries()){
 const c=cases[i].meta,res=r.result??{reason:'unfinished'},hp=side=>r.hp[side]/cases[i].state.actors[side].maxHP;
 total.n++;total.rounds+=r.rounds;if(res.reason==='knockout')total.ko++;else if(res.reason==='decision')total.decision++;else total.draw++;
 for(const side of [0,1]){
  const role=asym?side:0,l=side?c.o:c.p,win=res.winner===undefined||res.winner===null?.5:res.winner===side?1:0;if(side===0)total.pts+=win;
  const x=((S[role][l]??={})[c.level]??={n:0,pts:0,margin:0,rounds:0,ko:0});
  const pr=(((pairs[role][l]??={})[side?c.p:c.o]??={})[c.level]??={n:0,pts:0});pr.n++;pr.pts+=win;
  x.n++;x.pts+=win;x.margin+=hp(side)-hp(1-side);x.rounds+=r.rounds;if(res.reason==='knockout'&&res.winner===side)x.ko++;
  const m=((moves[role][l]??={})[c.level]??={});for(const [k,v]of Object.entries(r.acts?.[side]??{}))m[k]=(m[k]??0)+v;
 }
}
const pct=x=>(100*x).toFixed(0).padStart(3)+'%';
console.log(`${total.n} fights, ${presets.join(' vs ')}${presets.some(p=>!PLAYER_MODELS[p]&&!['easy','medium'].includes(p))?` at depth ${depth}`:''}, levels ${levels.join('/')}${spread?' ±'+spread:''}${reps>1?', ×'+reps:''}, ${secs.toFixed(0)} s; knockouts ${pct(total.ko/total.n)}, decisions ${pct(total.decision/total.n)}, draws ${pct(total.draw/total.n)}, ${(total.rounds/total.n).toFixed(1)} exchanges${asym?`; ${presets[0]} scores ${pct(total.pts/total.n)}`:''}`);
for(const [role,name]of roles.entries()){
 if(asym)console.log(`\n${name} (side ${role}), by its own loadout:`);
 console.log('loadout'.padEnd(18)+levels.map(l=>('L'+l).padStart(13)).join('')+'   all');
 for(const l of role&&subjects?subjects:pool){
  const row=levels.map(lv=>{const x=S[role][l]?.[lv];return x?`${pct(x.pts/x.n)} ${(100*x.margin/x.n).toFixed(0).padStart(4)}  `:''.padStart(13);}).join(' ');
  const all=levels.reduce((a,lv)=>({n:a.n+(S[role][l]?.[lv]?.n??0),pts:a.pts+(S[role][l]?.[lv]?.pts??0)}),{n:0,pts:0});
  console.log(l.padEnd(18)+row+pct(all.pts/all.n));
 }
 if(!asym||role===0){const tier=levels.map(lv=>{let n=0,p=0;for(const l of pool){n+=S[role][l]?.[lv]?.n??0;p+=S[role][l]?.[lv]?.pts??0;}return p/n;});if(asym)console.log('all'.padEnd(18)+tier.map(w=>`${pct(w)}`.padEnd(12)).join(' '));}
}
console.log('\n(win rate, mean HP-share margin ×100)');
for(const [role,name]of roles.entries()){
 console.log(`\nMoves played${asym?' by '+name:''}, share of each loadout's actions by tier (top 8):`);
 for(const l of role&&subjects?subjects:pool)for(const lv of levels){const m=moves[role][l]?.[lv]??{},n=Object.values(m).reduce((a,b)=>a+b,0);
  console.log(`${l.padEnd(16)} L${String(lv).padEnd(3)} `+Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`${k} ${(100*v/n).toFixed(0)}`).join(', '));}
}
if(argv.includes('--matrix'))for(const lv of levels){console.log(`\nL${lv} points share${asym?` of ${presets[0]}`:''}, row against column:`);console.log(''.padEnd(18)+foes.map(o=>o.slice(0,5).padStart(6)).join(''));
 for(const l of pool)console.log(l.padEnd(18)+foes.map(o=>{const x=pairs[0][l]?.[o]?.[lv];return x?String(Math.round(100*x.pts/x.n)).padStart(6):'     -';}).join(''));}
// Action usage over all fights: each action's share of all of a role's actions.
for(const [role,name]of roles.entries()){
 const usage={};for(const l of role&&subjects?subjects:pool)for(const lv of levels)for(const [k,v]of Object.entries(moves[role][l]?.[lv]??{}))usage[k]=(usage[k]??0)+v;
 const all=Object.values(usage).reduce((a,b)=>a+b,0);
 console.log(`\nAll actions${asym?' by '+name:''}:`,Object.entries(usage).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${(100*v/all).toFixed(1)}`).join(', '));
}
if(opt('json'))fs.writeFileSync(opt('json'),JSON.stringify({levels,pool,subjects,presets,depth,reps,S:asym?S:S[0],moves:asym?moves:moves[0],pairs:asym?pairs:pairs[0],total,secs},null,1));
