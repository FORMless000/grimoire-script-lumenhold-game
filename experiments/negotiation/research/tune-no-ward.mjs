// Training-only search after the explicit no-benefit Ward constraint.
// Historical Ward-dependent proposals/results remain untouched.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {rng} from '../reference-engine.mjs';
import {summarize,fitness} from './metrics.mjs';

const exec=promisify(execFile);
const out=path.resolve(process.argv[2]??'experiments/negotiation/results/variety-tune-no-ward-01');
fs.mkdirSync(out);
fs.copyFileSync(fileURLToPath(import.meta.url),path.join(out,'tuner-source.mjs'));
const anchor=JSON.parse(fs.readFileSync(new URL('../results/variety-tune-02/best-training-candidate.json',import.meta.url)));
delete anchor.effectOverrides.ward;
const proposalSeed=967213,trainingSeed=413017,u=rng(proposalSeed);
const pick=values=>values[Math.floor(u()*values.length)];
const proposals=[];
function add(name,tune={},effects={}){
 proposals.push({name,tune:{...anchor.tune,...tune},effectOverrides:{...structuredClone(anchor.effectOverrides),...effects}});
}
add('previous-champion-without-ward');
add('more-accessible-checks',{checkBase:.59});
add('lighter-fatigue',{checkBase:.58,fatigue:.16,resolveBase:18,resolveSlope:.25});
for(let i=3;i<10;i++)add('no-ward-'+i,{
 checkBase:pick([.56,.58,.60,.62]),dcSpread:pick([.6,.8,1]),
 targetBase:pick([4.5,5]),targetSlope:pick([.015,.025]),
 resolveBase:pick([14,18,22]),resolveSlope:pick([.15,.25]),
 fatigue:pick([.16,.22,.28]),manaScale:pick([.85,1,1.15]),
 skipResolve:pick([3,4]),spellPower:pick([.9,1,1.1]),
 frameWeights:[3,2.5,2.5,1.5,1.5,.75].map(w=>w*pick([.8,1,1.2]))
},{
 glamour:{mana:pick([4,5,6]),chance:pick([.14,.18,.22])},
 mend:{mana:pick([3,4]),health:pick([1,2]),restoreResolve:pick([7,9,11])},
 haste:{mana:pick([2,3])},shadowstep:{mana:pick([3,4,5])},foresight:{mana:pick([2,3])},
 rime:{mana:pick([3,4]),suspicionShield:2,chance:pick([-.07,-.10])},
 brace:{mana:pick([4,5]),resolveShield:pick([4,6]),duration:2},
 sleight:{mana:2,goldDiscount:.5,concealGold:true,chance:.16,only:['skills:guile']}
});
fs.writeFileSync(path.join(out,'proposals.json'),JSON.stringify({proposalSeed,trainingSeed,proposals,method:'10 no-Ward candidates; paired 2-seed screens; top 3 expanded to 8 training seeds. Resource-access diagnostic explicitly grants all spells.'},null,2));
const runner=fileURLToPath(new URL('./run.mjs',import.meta.url));
async function run(proposal,index,episodes,stage){
 const label=stage+'-'+String(index).padStart(2,'0'),file=path.join(out,label+'.json'),dir=path.join(out,label);
 fs.writeFileSync(file,JSON.stringify(proposal,null,2));
 const args=[runner,'--episodes',String(episodes),'--seed',String(trainingSeed),'--nodes','16000','--depth','2','--beam','8','--contexts','extended','--diagnostics','all-spells,resource-access','--tune',file,'--out',dir];
 if(stage==='screen')args.push('--subset','ordinary,concessions,worn,all-spells,resource-access');
 const result=await exec(process.execPath,args,{maxBuffer:5e6});
 fs.writeFileSync(path.join(out,label+'.log'),result.stdout+result.stderr);
 const rows=fs.readFileSync(path.join(dir,'matches.ndjson'),'utf8').trim().split('\n').map(JSON.parse);
 const main=summarize(rows.filter(r=>!['worn','all-spells','resource-access'].includes(r.scenario)));
 const worn=summarize(rows.filter(r=>r.scenario==='worn'));
 const broad=summarize(rows.filter(r=>r.scenario==='all-spells'));
 const resources=summarize(rows.filter(r=>r.scenario==='resource-access'));
 const score=fitness(main)+fitness(broad)+.5*(1-Math.abs(worn.winRate-.5));
 const row={index,name:proposal.name,stage,score,main,worn,broad,resources,proposal,path:dir};
 fs.writeFileSync(path.join(out,label+'-metrics.json'),JSON.stringify(row,null,2));
 console.log(label,proposal.name,score.toFixed(3),'main',main.winRate.toFixed(3),'effective',main.effectiveSpells.toFixed(2),'broad',broad.winRate.toFixed(3),'broad top',broad.topSpellShare.toFixed(2));
 return row;
}
const screen=[];
for(const[i,p]of proposals.entries()){
 screen.push(await run(p,i,2,'screen'));
 screen.sort((a,b)=>b.score-a.score);
 fs.writeFileSync(path.join(out,'ranking.partial.json'),JSON.stringify(screen,null,2));
}
const expanded=[];
for(const row of screen.slice(0,3))expanded.push(await run(row.proposal,row.index,8,'expanded'));
expanded.sort((a,b)=>b.score-a.score);
fs.writeFileSync(path.join(out,'ranking.json'),JSON.stringify({screen,expanded},null,2));
fs.writeFileSync(path.join(out,'best-training-candidate.json'),JSON.stringify(expanded[0].proposal,null,2));
console.log('BEST',expanded[0].path);
