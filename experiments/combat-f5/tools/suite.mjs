// The balance suite: class matrix (9 classes, levels 20–80) and level gaps, plus optionally every class with every spell.
//   node tools/suite.mjs <name> [--depth 4] [--budget N] [--config '<JSON>'] [--variant tools/variants/x.mjs] [--trace] [--all] [--arms cross,gaps,all] [--seeds 3]
//   --seeds N plays the class matrix with N AI-mistake seeds (default 1) to cut noise when screening ideas.
// Writes out/<name>_cross.jsonl, out/<name>_gaps.jsonl and with --all out/<name>_all.jsonl (each with .arm.json, and .traces.jsonl when traced).
// Depth 4 takes about 40 s on 8 cores, depth 5 about 10 min. The node cap per decision defaults to one that never binds at that depth.
import {spawnSync} from 'node:child_process';import path from 'node:path';import {root} from './arms.mjs';
const args=process.argv.slice(2),name=args[0],opt=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];},flag=k=>args.includes('--'+k);
if(!name||name.startsWith('--')){console.error("usage: node tools/suite.mjs <name> [--depth 4] [--config '<JSON>'] [--variant file] [--trace] [--all]");process.exit(2);}
const depth=Number(opt('depth',4)),budget=Number(opt('budget',depth<=4?3e6:3e7*10**(depth-5))),config=JSON.parse(opt('config','{}')),variant=opt('variant',undefined);
const common={fallible:true,maxRounds:120,search:{maxDepth:depth,nodeBudget:budget,prune:true},...(variant?{variant}:{})};
const arms={
 cross:{pairs:true,levels:[20,30,40,50,60,70,80],seeds:Array.from({length:Number(opt('seeds',1))},(_,i)=>i+1),config},
 gaps:{gaps:[5,10,20],bases:[30,55],seeds:[1,2],config},
 // Every class with every spell (about 35 options a turn): a shallower search keeps it to minutes; it rates spells on equal menus.
 ...(flag('all')?{all:{pairs:true,levels:[30,60],seeds:[1],config:{...config,spellAccess:'all'},search:{maxDepth:Math.min(depth,3),nodeBudget:1e6,prune:true}}}:{})
};
const only=opt('arms',null)?.split(','); // e.g. --arms all
for(const [k,arm] of Object.entries(arms).filter(([k])=>!only||only.includes(k))){
 const r=spawnSync('node',[path.join(root,'tools/sim.mjs'),JSON.stringify({...common,...arm}),path.join(root,'out',`${name}_${k}.jsonl`),...(flag('trace')?['--trace']:[])],{stdio:'inherit'});
 if(r.status!==0)process.exit(r.status??1);
}
