// Every class against special foes (creatures, bosses, forbidden practitioners), each side on a difficulty preset, as the
// live game plays them (LIVE_AI: depth 5, no seeded mistakes): the classes' win rate per foe and level, the winner's HP margin,
// fight length, and how the foe spreads its actions (its top action's share, and how many actions make up 80% of its moves).
//   node tools/creature-study.mjs [--foes "Bristleback;Stag beetle"] [--levels 20,35,50] [--gap -10] [--player engine]
//     [--foe medium] [--seeds 2]   (--player/--foe: a preset or a player model, novice or decent: tools/player-models.mjs)
//     [--classes Duellist,Healer] [--variant tools/variants/x.mjs] [--all] [--foe-start .6]
//     [--player-skills 100] [--json out.json]
// --gap: the class's level minus the foe's. --all: the class side knows every castable spell at its top rank (a custom kit).
// --foe-start: the foe starts with that share of its HP (createState's opponentStart). Levels default to each foe's card range.
import fs from 'node:fs';
import {play,applyVariant} from './arms.mjs';
import {PLAYER_MODELS} from './player-models.mjs';
const args=process.argv.slice(2),opt=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];},flag=k=>args.includes('--'+k);
await applyVariant(opt('variant'));
const R=await import('../setup/roster.mjs'),{createState}=await import('../setup/setup.mjs');
const {LOADOUTS,SPECIAL_LOADOUTS,SPELLS,LOADOUT_SKILLS}=R;
// The cards' foe levels (tools/event-levels.mjs): low, middle and high of each range.
const CARD_LEVELS={'Practice mannequin':[5],'Bramble ferret':[15,25,35],Bristleback:[18,28,40],'Stag beetle':[24,35,46],'Grumpy oak':[24,35,46],
 'Elder oak':[30,40,52],'Spiderling swarm':[26,37,48],'Shadow stag':[30,40,52],'The Spinner':[60],'The Spinner, weakened':[60],Thornwitch:[24,35,46],
 'Masked circle':[30,40,52],'The Outcast':[80],'The man in grey':[23,40,60],Grisk:[40]};
const foes=(opt('foes')??Object.keys(CARD_LEVELS).filter(f=>f!=='Practice mannequin').join(";")).split(";").map(s=>s.trim());
for(const f of foes)if(!SPECIAL_LOADOUTS[f]&&!LOADOUTS[f]&&!R.NAMED_LOADOUTS[f])throw Error('Unknown foe '+f);
const classes=(opt('classes')??Object.keys(LOADOUTS).join(',')).split(','),gap=Number(opt('gap',-10)),seeds=Number(opt('seeds',2));
const presets=[opt('player','engine'),opt('foe','medium')],all=flag('all'),foeStart=opt('foe-start'),playerSkills=opt('player-skills');
const LIVE={maxDepth:5,nodeBudget:3e6,mistakeChance:0};
const allSpells=Object.fromEntries(Object.entries(SPELLS).filter(([,s])=>s.group!=='creature'&&!s.as&&s.castable!==false).map(([id,s])=>[id,s.cost.length]));
const cases=[];
for(const foe of foes)for(const L of (opt('levels')?opt('levels').split(',').map(Number):CARD_LEVELS[foe.split('#')[0]]??[30]))for(const p of classes)for(let seed=1;seed<=seeds;seed++)for(const firstLeader of [0,1]){
 const lp=Math.max(1,Math.min(100,L+gap)),meta={p,o:foe,level:L,levelP:lp,seed,firstLeader};
 const skills=playerSkills?Object.fromEntries(LOADOUT_SKILLS.map(k=>[k,Number(playerSkills)])):null;
 const s=createState({playerLoadout:p,opponentLoadout:foe,playerLevel:lp,opponentLevel:L,firstLeader,context:'real_conflict',
  ...(all?{playerKit:{skills:skills??Object.fromEntries(LOADOUT_SKILLS.map(k=>[k,lp])),spells:allSpells,level:lp}}:skills?{playerSkills:skills}:{}),
  ...(foeStart?{opponentStart:{hp:Number(foeStart)}}:{}),
  ai:presets.map((preset,side)=>PLAYER_MODELS[preset]?{...PLAYER_MODELS[preset],seed:(seed*7919+cases.length*2+side)>>>0}:{...LIVE,preset,seed:(seed*7919+cases.length*2+side)>>>0})});
 const {lastEvents,...state}=s;
 cases.push({meta,state,search:{},maxRounds:80,tableLimit:16384,maxHP:[s.actors[0].maxHP,s.actors[1].maxHP]});
}
const t0=performance.now(),rs=play(cases.map(({maxHP,...c})=>c));
const score=r=>!r.result||r.result.winner===undefined?.5:r.result.winner===0?1:0;
const pct=x=>(100*x).toFixed(0)+'%',mean=a=>a.reduce((x,y)=>x+y,0)/Math.max(1,a.length);
const rows=[],out={presets,gap,all,foeStart,cells:[]};
for(const foe of foes){
 const mine=rs.map((r,i)=>[r,cases[i]]).filter(([,c])=>c.meta.o===foe);
 for(const L of [...new Set(mine.map(([,c])=>c.meta.level))]){
  const cell=mine.filter(([,c])=>c.meta.level===L),acts={},pacts={},byClass={};
  for(const [r,c] of cell){
   for(const [a,n]of Object.entries(r.acts?.[1]??{}))acts[a]=(acts[a]??0)+n;
   for(const [a,n]of Object.entries(r.acts?.[0]??{}))pacts[a]=(pacts[a]??0)+n;
   (byClass[c.meta.p]??=[]).push(score(r));
  }
  const total=Object.values(acts).reduce((a,b)=>a+b,0),sorted=Object.entries(acts).sort((a,b)=>b[1]-a[1]);
  let run=0,k80=0;for(const [,n]of sorted){if(run>=.8*total)break;run+=n;k80++;}
  const margin=mean(cell.map(([r,c])=>{const w=r.result?.winner;return w===undefined?0:(w===0?1:-1)*r.hp[w]/c.maxHP[w];}));
  const wins=mean(cell.map(([r])=>score(r))),rounds=mean(cell.map(([r])=>r.rounds));
  const ko=cell.filter(([r])=>r.result?.reason==='knockout').length/cell.length;
  const classWins=Object.fromEntries(Object.entries(byClass).map(([p,v])=>[p,mean(v)]));
  rows.push(`| ${foe} | ${L} | ${pct(wins)} | ${(100*margin).toFixed(0)} | ${rounds.toFixed(1)} | ${pct(ko)} | ${k80} | ${sorted.slice(0,5).map(([a,n])=>a+' '+pct(n/total)).join(', ')} | ${Object.entries(classWins).map(([p,v])=>p.slice(0,4)+' '+pct(v)).join(' ')} |`);
  out.cells.push({foe,level:L,wins,margin,rounds,ko,k80,acts,pacts,classWins,fights:cell.length});
 }
}
console.log(`Classes on ${presets[0]} at foe level ${gap>=0?'+':''}${gap}${all?' (every spell)':''} against foes on ${presets[1]}${foeStart?`, foe starting at ${foeStart} HP`:''}; ${rs.length} fights in ${((performance.now()-t0)/1000).toFixed(0)} s.`);
console.log('Margin: the winner\'s HP share left, signed (+ the class won). k80: how many of the foe\'s actions make up 80% of its moves.\n');
console.log('| Foe | Level | Class wins | Margin | Exchanges | KO | k80 | Foe actions | By class |\n|---|---:|---:|---:|---:|---:|---:|---|---|');
for(const r of rows)console.log(r);
if(opt('json'))fs.writeFileSync(opt('json'),JSON.stringify(out,null,1));
