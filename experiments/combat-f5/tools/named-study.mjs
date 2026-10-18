// How strong each named character is as a fighter, in class levels: the character at their own skills plays every class at
// levels 10–90 (depth 4, the suite's fallible AIs, both leaders), and the level where the classes' win rate crosses 50% is the
// character's equivalent class level. Growing characters play at reference skill --at (their canon ratios kept) and study
// year --year; fixed ones (faculty, Grisk) at their canon skills; the man in grey has no canon skills (all = --at).
//   node tools/named-study.mjs [--at 50] [--year 2] [--depth 4] [--seeds 2] [--names Lyra,Kael] [--stats '{"lyra":{"vigor":32}}']
// --kits '{"Thorne":{"course":[3,1,0,2,2]}}' tries NAMED_LOADOUTS changes. --stats tries worldbook stat changes (by npc id) before they are made in content/world/cast.grim.
import {armCases,play} from './arms.mjs';
import {LOADOUTS,NAMED_LOADOUTS,fixedLoadoutLevel,generateLoadout,LOADOUT_SKILLS} from '../setup/roster.mjs';
import {CAST_STATS} from '../setup/cast-stats.mjs';
const args=process.argv.slice(2),opt=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const at=Number(opt('at',50)),year=Number(opt('year',2)),depth=Number(opt('depth',4)),seeds=Array.from({length:Number(opt('seeds',2))},(_,i)=>i+1);
for(const [id,st]of Object.entries(JSON.parse(opt('stats','{}'))))Object.assign(CAST_STATS[id].skills,st);
for(const [n,k]of Object.entries(JSON.parse(opt('kits','{}'))))Object.assign(NAMED_LOADOUTS[n],k);
const names=opt('names',Object.keys(NAMED_LOADOUTS).join(',')).split(','),foeLevels=[10,20,30,40,50,60,70,80,90];
const cases=[];
for(const n of names)for(const c of armCases({fallible:true,seeds,maxRounds:120,search:{maxDepth:depth,nodeBudget:3e6,prune:true},named:[n],foes:Object.keys(LOADOUTS),levels:[fixedLoadoutLevel(n)??at],foeLevels,config:{playerYear:year}}))cases.push(c);
const rs=play(cases),cell={};
rs.forEach((r,i)=>{const {p,levelO}=cases[i].meta;((cell[p]??={})[levelO]??=[]).push(!r.result||r.result.winner===undefined?.5:r.result.winner===0?1:0);});
const rate=v=>v.reduce((a,b)=>a+b,0)/v.length;
// The class level where the character's win rate falls through 50% (linear between the measured levels).
const equivalent=n=>{const w=foeLevels.map(l=>rate(cell[n][l]));if(w[0]<.5)return '<'+foeLevels[0];for(let i=1;i<w.length;i++)if(w[i]<.5)return Math.round(foeLevels[i-1]+(w[i-1]-.5)/(w[i-1]-w[i])*(foeLevels[i]-foeLevels[i-1]));return '>'+foeLevels.at(-1);};
const mean=k=>Math.round(LOADOUT_SKILLS.reduce((a,s)=>a+k[s],0)/6);
console.log(`| Character | Plays at | Equivalent class level | Mean skill | Skills (arc lor alc cha vig gui) | Wins vs classes at ${foeLevels.join(' / ')} |\n|---|---|---:|---:|---|---|`);
for(const n of names){const lv=fixedLoadoutLevel(n),k=generateLoadout(n,lv??at,'kit',{year}).skills;
 console.log(`| ${n} | ${lv?'canon (fixed)':'reference '+at} | ${equivalent(n)} | ${mean(k)} | ${LOADOUT_SKILLS.map(s=>k[s]).join(' ')} | ${foeLevels.map(l=>(100*rate(cell[n][l])).toFixed(0)).join(' / ')} |`);}
