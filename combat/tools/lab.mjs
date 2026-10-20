// Search experiments (combat/lab, the combat-lab binary; not part of the game).
//   node tools/lab.mjs check                       lab alpha-beta equals the core's search on the bench positions
//   node tools/lab.mjs sample [--games 300] [--nodes 16000] [--deep 150000]   self-play positions → out/lab/samples.jsonl
//   node tools/lab.mjs fit                         Texel (outcomes) and distilled (deep values) eval weights → out/lab/weights.json
//   node tools/lab.mjs arena [--ms 10] [--cases 100] [--algos AB,ABstar,…] [--seed 1]   round robin, seats swapped
// Build the binary first: (cd combat/lab && cargo build --release).
import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {armCases,root} from './arms.mjs';
import {positions} from './positions.mjs';
import * as R from '../setup/roster.mjs';import {createState} from '../setup/setup.mjs';
import * as C from '../web/core.mjs';
const args=process.argv.slice(2),cmd=args[0],opt=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const OUT=path.join(root,'out/lab');fs.mkdirSync(OUT,{recursive:true});
function lab(op,lines){
 const r=spawnSync(path.join(root,'lab/target/release/combat-lab'),[op,...(process.env.LAB_THREADS?[process.env.LAB_THREADS]:[])],{input:lines.map(l=>JSON.stringify(l)).join('\n')+'\n',maxBuffer:2**31-1,encoding:'utf8'});
 if(r.status!==0)throw Error('combat-lab failed: '+r.stderr);
 return r.stdout.trim().split('\n').map(l=>JSON.parse(l));
}
const rng=seed=>()=>{seed=(seed+0x6D2B79F5)>>>0;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
function opening(state,seed,plies=2){const r=rng(seed),s=C.cloneState(state);for(let i=0;i<plies*2&&!s.result;i++){const l=C.legalActions(s);C.applyChoice(s,l[Math.floor(r()*l.length)]);}delete s.lastEvents;return s;}
// Sampled starts: random class pairs, levels and first leaders, each from a seeded random two-exchange opening.
function starts(n,seed){
 const all=armCases({pairs:true,levels:[20,50,80],ai:[{},{}]}),r=rng(seed),out=[];
 while(out.length<n){const c=all[Math.floor(r()*all.length)],s=opening(c.state,Math.floor(r()*2**32));if(!s.result)out.push({meta:c.meta,state:s});}
 return out;
}

if(cmd==='check'){
 const E={...R,createState,...C},P=await positions(E),lines=[];
 for(const p of P)for(const maxDepth of [1,2,3,4])for(const prune of [false,true])for(const horizonMode of ['fixed','tactical'])for(const nodeBudget of [1e9,3000])
  lines.push({state:p.state,options:{maxDepth,nodeBudget,prune,horizonMode,...(maxDepth===4&&prune?{lmr:3}:{})}});
 const rs=lab('check',lines),same=rs.filter(r=>r.same).length,gap=Math.max(...rs.map(r=>r.evalGap));
 console.log(`lab alpha-beta = core search: ${same}/${rs.length}; weighted eval (base weights) vs core eval, largest gap ${gap.toExponential(2)}`);
 for(const [i,r] of rs.entries())if(!r.same){console.log('first difference',JSON.stringify(lines[i].options),r);break;}
}

if(cmd==='sample'){
 // --play / --label: extra settings for the player and the deep labeller (e.g. '{"weights":[…]}' or '{"mlp":{…}}') — an RL round
 // plays with the current agent and labels with a deep search over the current eval.
 const games=Number(opt('games',300)),nodes=Number(opt('nodes',16000)),deep=Number(opt('deep',150000));
 const read=x=>x?.startsWith?.('@')?JSON.parse(fs.readFileSync(x.slice(1),'utf8')):JSON.parse(x??'{}');
 const play={algo:'ab',nodes,...read(opt('play','{}'))},lab2={algo:'ab',nodes:deep,...read(opt('label','{}'))};
 const cases=starts(games,Number(opt('seed',7))).map((c,i)=>({...c,play,eps:0.1,every:2,deep:lab2,...(args.includes('--noReply')?{}:{deepReply:{...lab2,nodes:Math.round(deep/2)}}),seed:i+1}));
 const t=Date.now(),rs=lab('sample',cases);
 fs.writeFileSync(path.join(OUT,opt('out','samples.jsonl')),rs.map(r=>JSON.stringify(r)).join('\n')+'\n');
 console.log(`${rs.length} games, ${rs.reduce((n,r)=>n+r.positions.length,0)} positions, ${((Date.now()-t)/1e3).toFixed(0)} s`);
}

if(cmd==='fit'){
 const games=fs.readFileSync(path.join(OUT,'samples.jsonl'),'utf8').trim().split('\n').map(l=>JSON.parse(l));
 const NF=20,base=Array.from({length:NF},(_,i)=>i<12?1:0),dot=(w,f)=>w.reduce((a,x,i)=>a+x*f[i],0);
 // Hold out every fifth game.
 const rows=games.flatMap((g,gi)=>g.positions.map(p=>({f:p.f,y:g.outcome,deep:p.deep,test:gi%5===0})));
 const train=rows.filter(r=>!r.test),test=rows.filter(r=>r.test);
 const sig=x=>1/(1+Math.exp(-x));
 const logloss=(w,k,set)=>set.reduce((a,r)=>{const p=Math.min(1-1e-9,Math.max(1e-9,sig(dot(w,r.f)/k)));return a-(r.y*Math.log(p)+(1-r.y)*Math.log(1-p));},0)/set.length;
 // 1. The scale k that best maps the hand eval to win chances.
 let k=60,bestL=Infinity;for(let x=10;x<=400;x+=2){const l=logloss(base,x,train);if(l<bestL){bestL=l;k=x;}}
 // 2. Texel: logistic regression on the terms by Newton steps (IRLS), with a ridge pull toward the hand weights.
 const ridge=Number(opt('ridge',1e-2));
 const solve=(A,b)=>{const n=b.length,M=A.map((r,i)=>[...r,b[i]]);for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;[M[c],M[p]]=[M[p],M[c]];for(let r=0;r<n;r++)if(r!==c){const f=M[r][c]/M[c][c];for(let j=c;j<=n;j++)M[r][j]-=f*M[c][j];}}return M.map((r,i)=>r[n]/r[i]);};
 const diag=Array.from({length:NF},(_,i)=>train.reduce((a,r)=>a+r.f[i]**2,0)/k**2/4+1e-6);
 let w=[...base];
 for(let it=0;it<25;it++){
  const H=Array.from({length:NF},()=>new Array(NF).fill(0)),g=new Array(NF).fill(0);
  for(const r of train){const p=sig(dot(w,r.f)/k),e=p-r.y,q=p*(1-p);for(let i=0;i<NF;i++){g[i]+=e*r.f[i]/k;for(let j=0;j<NF;j++)H[i][j]+=q*r.f[i]*r.f[j]/k**2;}}
  for(let i=0;i<NF;i++){H[i][i]+=ridge*diag[i];g[i]+=ridge*diag[i]*(w[i]-base[i]);}
  const step=solve(H,g);w=w.map((x,i)=>x-step[i]);
 }
 // 3. Distilled: ridge regression of the deep search value on the terms (non-terminal values only).
 const dset=train.filter(r=>r.deep!=null&&Math.abs(r.deep)<5000),A=Array.from({length:NF},()=>new Array(NF).fill(0)),bv=new Array(NF).fill(0);
 for(const r of dset)for(let i=0;i<NF;i++){bv[i]+=r.f[i]*r.deep;for(let j=0;j<NF;j++)A[i][j]+=r.f[i]*r.f[j];}
 for(let i=0;i<NF;i++){const lamI=ridge*A[i][i]+1e-6;A[i][i]+=lamI;bv[i]+=lamI*base[i];}
 const dw=solve(A,bv);
 const mse=(w,set)=>{const s=set.filter(r=>r.deep!=null&&Math.abs(r.deep)<5000);return Math.sqrt(s.reduce((a,r)=>a+(dot(w,r.f)-r.deep)**2,0)/s.length);};
 fs.writeFileSync(path.join(OUT,'weights.json'),JSON.stringify({k,texel:w,distill:dw},null,1));
 console.log(`${rows.length} positions (${test.length} held out). k = ${k}.`);
 console.log(`Outcome log-loss, held out: hand ${logloss(base,k,test).toFixed(4)}, Texel ${logloss(w,k,test).toFixed(4)}, distilled ${logloss(dw,k,test).toFixed(4)}`);
 console.log(`Deep-value RMS error, held out: hand ${mse(base,test).toFixed(1)}, Texel ${mse(w,test).toFixed(1)}, distilled ${mse(dw,test).toFixed(1)}`);
 const names=['lead','hp','mana','flux','shadowstep','haste','brace','heartprice','rime','constructs','omens','channel','leader','lead_sq','foresight','compelled','torment','reflect','lodestar','tailwind'];
 console.log('| term | hand | Texel | distilled |\n|---|---:|---:|---:|');names.forEach((n,i)=>console.log(`| ${n} | ${base[i]} | ${w[i].toFixed(2)} | ${dw[i].toFixed(2)} |`));
}

if(cmd==='arena'){
 const ms=Number(opt('ms',10)),n=Number(opt('cases',100)),load=f=>fs.existsSync(path.join(OUT,f))?JSON.parse(fs.readFileSync(path.join(OUT,f),'utf8')):null;
 const W=load('weights.json'),F0=load('fit-r0.json'),F1=load('fit-r1.json'),F2=load('fit-r2.json'),D6=load('fit-d6.json'),D6R1=load('fit-d6r1.json');
 const ALGOS={
  AB:{algo:'ab'},                                                                                // the current scheme (live: no prune, no LMR, fixed horizon)
  ABstar:{algo:'ab',prune:true,lmr:3,horizon:'tactical',ext:2,threatPlus:true},                  // candidate 4: knobs on, wider and deeper extension
  Texel:{algo:'ab',weights:W?.texel},                                                            // candidate 1: outcome-fitted eval
  Distill:{algo:'ab',weights:W?.distill},                                                        // candidate 2: deep-search-fitted eval
  MCTS:{algo:'mcts',k:W?.k??60,rollout:4,eps:0.2},                                               // candidate 3: implicit minimax backups, ε-greedy rollouts
  Hybrid:{algo:'mcts',k:W?.k??60,rollout:2,eps:0.05,hybrid:true},                                // candidate 3b: one-exchange minimax rollouts
  // Probes (not in the default round robin): one AB* knob at a time, and MCTS settings.
  ABprune:{algo:'ab',prune:true},ABlmr:{algo:'ab',lmr:3},ABtact:{algo:'ab',horizon:'tactical'},ABext2:{algo:'ab',horizon:'tactical',ext:2,threatPlus:true},
  LMRtexel:{algo:'ab',lmr:3,weights:W?.texel},LMRdistill:{algo:'ab',lmr:3,weights:W?.distill},
  MCTSmm:{algo:'mcts',k:W?.k??60,alpha:1,rollout:0},                                              // pure minimax backups: best-first minimax
  MCTSlowc:{algo:'mcts',k:W?.k??60,c:0.5,rollout:4,eps:0.2},MCTSa8:{algo:'mcts',k:W?.k??60,alpha:0.8,c:0.8,rollout:2,eps:0.2},
  MCTSdistill:{algo:'mcts',k:W?.k??60,alpha:0.8,c:0.8,rollout:2,eps:0.2,weights:W?.distill},
  // Round 2 (24 terms, fit-r0.json from 1,500 games): LD = LMR + the distilled eval, the anchor; each variant changes one thing.
  LD:{algo:'ab',lmr:3,weights:F0?.distill},LT:{algo:'ab',lmr:3,weights:F0?.texel},
  LDcounter:{algo:'ab',lmr:3,weights:F0?.distill,counter:true},LDcont:{algo:'ab',lmr:3,weights:F0?.distill,cont:true},
  LDreply:{algo:'ab',lmr:3,weights:F0?.distill,reply:F0?.reply},LDboth:{algo:'ab',lmr:3,weights:F0?.distill,counter:true,cont:true},
  LD2:{algo:'ab',lmr:2,weights:F0?.distill},LD4:{algo:'ab',lmr:4,weights:F0?.distill},LDr2:{algo:'ab',lmr:3,lmr2:true,weights:F0?.distill},
  LDlmp:{algo:'ab',lmr:3,lmp:5,weights:F0?.distill},LDprune:{algo:'ab',lmr:3,prune:true,weights:F0?.distill},
  LMd16:{algo:'ab',lmr:3,mlp:F0?.MLPd16},LMd32:{algo:'ab',lmr:3,mlp:F0?.MLPd32},LMt16:{algo:'ab',lmr:3,mlp:F0?.MLPt16},LMt32:{algo:'ab',lmr:3,mlp:F0?.MLPt32},
  LMd16reply:{algo:'ab',lmr:3,mlp:F0?.MLPd16,reply:F0?.reply},LMd16all:{algo:'ab',lmr:3,mlp:F0?.MLPd16,reply:F0?.reply,prune:true},
  // RL rounds: the eval refitted on games played by the previous round's agent and labelled by a deep search over its eval.
  LD_r1:{algo:'ab',lmr:3,weights:F1?.distill},LM_r1:{algo:'ab',lmr:3,mlp:F1?.MLPd16},LD_r2:{algo:'ab',lmr:3,weights:F2?.distill},LM_r2:{algo:'ab',lmr:3,mlp:F2?.MLPd16},LM_r1reply:{algo:'ab',lmr:3,mlp:F1?.MLPd16,reply:F1?.reply},
  // Double distillation: an MLP fitted to LMd16's own depth-6 searches (D6), and to those plus RL round 1's labels (D6R1).
  LM_d6:{algo:'ab',lmr:3,mlp:D6?.MLPd16},LM_d6r1:{algo:'ab',lmr:3,mlp:D6R1?.MLPd16},LM_d6x32:{algo:'ab',lmr:3,mlp:D6?.MLPd32},
 };
 const DEFAULT=['AB','ABstar','Texel','Distill','MCTS','Hybrid'];
 const names=opt('algos',DEFAULT.join(',')).split(',');
 const S=starts(n,Number(opt('seed',1))),cases=[],tags=[];
 // --vs X,Y: a gauntlet (every algo against each of X, Y only) instead of the full round robin.
 const vs=opt('vs',null)?.split(','),pairs=[];
 for(const v of vs??[])if(!names.includes(v))names.push(v);
 for(let a=0;a<names.length;a++)for(let b=a+1;b<names.length;b++)if(!vs||vs.includes(names[a])||vs.includes(names[b]))pairs.push([a,b]);
 for(const [a,b] of pairs)S.forEach((s,si)=>{for(const seatA of [0,1]){
  const algos=[0,1].map(side=>({...ALGOS[side===seatA?names[a]:names[b]],ms}));
  cases.push({state:s.state,algos,maxRounds:120,meta:{...s.meta,si,seatA}});tags.push({a,b,si,seatA});}});
 const t=Date.now(),rs=lab('run',cases);
 fs.writeFileSync(path.join(OUT,`arena-${opt('name',ms+'ms')}.jsonl`),rs.map((r,i)=>JSON.stringify({...r,tag:tags[i]})).join('\n')+'\n');
 const K=names.length,score=[...Array(K)].map(()=>new Array(K).fill(0)),games=[...Array(K)].map(()=>new Array(K).fill(0)),perf=names.map(()=>({ms:0,d:0,depth:0,nodes:0}));
 rs.forEach((r,i)=>{const {a,b,seatA}=tags[i],sa=!r.result||r.result.winner===undefined?.5:r.result.winner===seatA?1:0;
  score[a][b]+=sa;score[b][a]+=1-sa;games[a][b]++;games[b][a]++;
  for(const [x,side] of [[a,seatA],[b,1-seatA]]){perf[x].ms+=r.ms[side];perf[x].d+=r.decisions[side];perf[x].depth+=r.depth[side];perf[x].nodes+=r.nodes[side];}});
 // Bradley–Terry ratings (Elo scale), AB anchored at 0.
 let g=new Array(K).fill(0);
 for(let it=0;it<2000;it++){const ng=g.map((gi,i)=>{let wsum=0,den=0;for(let j=0;j<K;j++)if(games[i][j]){wsum+=score[i][j];den+=games[i][j]/(Math.exp(gi)+Math.exp(g[j]))*Math.exp(gi);}return gi+0.5*Math.log(Math.max(1e-6,wsum)/Math.max(1e-6,den));});const z=ng[names.indexOf('AB')]??ng[0];g=ng.map(x=>x-z);}
 const elo=x=>(x*400/Math.LN10);
 const pct=(i,j)=>games[i][j]?(100*score[i][j]/games[i][j]).toFixed(0)+'%':'—';
 console.log(`# Arena, ${ms} ms a decision: ${S.length} sampled starts × 2 seats per pairing, ${rs.length} fights, ${((Date.now()-t)/1e3).toFixed(0)} s wall\n`);
 const cols=vs?vs.map(v=>names.indexOf(v)):names.map((_,j)=>j);
 console.log(`| Row vs column | ${cols.map(j=>names[j]).join(' | ')} | Rating (AB = 0) | ms/decision | mean depth | nodes/decision |\n|---|${cols.map(()=>'---:').join('|')}|---:|---:|---:|---:|`);
 names.map((_,i)=>i).sort((x,y)=>g[y]-g[x]).forEach(i=>console.log(`| ${names[i]} | ${cols.map(j=>i===j?'·':pct(i,j)).join(' | ')} | ${elo(g[i])>=0?'+':''}${elo(g[i]).toFixed(0)} | ${(perf[i].ms/perf[i].d).toFixed(1)} | ${(perf[i].depth/perf[i].d).toFixed(1)} | ${(perf[i].nodes/perf[i].d).toFixed(0)} |`));
 const reasons={};for(const r of rs){const k=r.result?.reason??'unfinished';reasons[k]=(reasons[k]??0)+1;}
 console.log(`\nEach cell is the row's score against the column (draws half), from ${2*S.length} fights; ±${(100/Math.sqrt(2*S.length)).toFixed(0)} points is roughly one 95% half-width. Endings: ${JSON.stringify(reasons)}.`);
}

// Beatable opponents (lab/src/human.rs): candidates against simulated players, at equal level and with the player 10 below.
//   node tools/lab.mjs human [--cands Policy,Disc,…] [--players novice,decent,reader] [--kits Duellist,Healer,Brawler,Scholar]
// Players: novice (one exchange ahead, loose), decent (two ahead, a little loose) — both the game's own AI with slack —
// and reader (two ahead, answering a model of the opponent's habits it learns during the fight).
if(cmd==='human'){
 const {expandAI}=await import('../setup/setup.mjs'),{personaOf}=await import('../setup/foes.mjs');
 const G=Object.keys(R.LOADOUTS),kits=opt('kits','Duellist,Healer,Brawler,Scholar').split(',');
 const PLAYERS={
  novice:{algo:'core',maxDepth:1,nodeBudget:3e6,mistakeChance:0,tiltScale:0,slack:15,maxRegret:40},
  decent:{algo:'core',maxDepth:2,nodeBudget:3e6,mistakeChance:0,tiltScale:0,slack:5,maxRegret:20},
  reader:{algo:'human',depth:2,belief:true,rule:'softmax',temp:3,regret:20,decay:0.9},
 };
 // neutral: the same opponent without its persona (the distinctness check's twin).
 let neutral=false;
 const core=(o,extra)=>({algo:'core',...expandAI({nodeBudget:3e6,mistakeChance:0,...extra,...(neutral?{persona:false}:{})},o)});
 const H=(o,x)=>({algo:'human',tilt:neutral?{}:personaOf(o),...x});
 const CANDS={
  EasyNow:o=>core(o,{preset:'easy',maxDepth:5}),                                     // today's Easy, as live
  EasyLow:o=>core(o,{preset:'easy',maxDepth:2}),                                     // today's scheme on the lowest budget
  Policy:o=>H(o,{policy:true,rule:'softmax',temp:6}),                                // no search: move ordering + persona, softmax
  MCTS2:o=>({algo:'mcts',ms:2,k:72}),                                                // a non-alpha-beta search at 2 ms
  MCTS20:o=>({algo:'mcts',ms:20,k:72}),MCTS80:o=>({algo:'mcts',ms:80,k:72}),         // …and with longer budgets
  Disc:o=>H(o,{depth:2,gamma:0.6}),                                                  // impatient minimax
  Belief1:o=>H(o,{depth:1,belief:true}),                                             // answers its model of the player
  Belief2:o=>H(o,{depth:2,belief:true}),
  Blind:o=>H(o,{depth:1,belief:true,blind:0.5}),                                     // half the time ignores the telegraph
  Soft:o=>H(o,{depth:2,rule:'softmax',temp:15,regret:60}),                           // proportional mistakes
  Director:o=>H(o,{depth:2,rule:'target',target:0.35,regret:60}),                    // aims for a 35% win chance
  Combo:o=>H(o,{depth:2,gamma:0.6,belief:true,blind:0.3,rule:'target',target:0.4,regret:60}),
  // Round 2: Combo's target × blind; escalation (a growing appetite for damage from exchange 8); MCTS with persona priors.
  ...Object.fromEntries([0.3,0.4,0.5].flatMap(t=>[0.2,0.4,0.6].map(b=>[`C${t*100}b${b*10}`,o=>H(o,{depth:2,gamma:0.6,belief:true,blind:b,rule:'target',target:t,regret:60})]))),
  ComboE:o=>H(o,{depth:2,gamma:0.6,belief:true,blind:0.3,rule:'target',target:0.4,regret:60,esc:0.03,escStart:8}),
  ComboE2:o=>H(o,{depth:2,gamma:0.6,belief:true,blind:0.3,rule:'target',target:0.4,regret:60,esc:0.06,escStart:6}),
  BlindE:o=>H(o,{depth:1,belief:true,blind:0.5,esc:0.03,escStart:8}),
  Belief2E:o=>H(o,{depth:2,belief:true,esc:0.03,escStart:8}),
  MCTS2P:o=>({algo:'mcts',ms:2,k:72,tilt:neutral?{}:personaOf(o)}),
  // Round 3, deeper personas: MCTS with persona priors at longer budgets; the persona choosing among moves ranked by a real
  // alpha-beta (pruned) 2–4 exchanges deep (softmax over value + persona); depth 4 aiming for a 40% win chance with the persona
  // weighed in (200 persona points = all of the win chance); today's Easy at depth 3.
  MCTS10P:o=>({algo:'mcts',ms:10,k:72,tilt:neutral?{}:personaOf(o)}),MCTS30P:o=>({algo:'mcts',ms:30,k:72,tilt:neutral?{}:personaOf(o)}),
  PAB2:o=>H(o,{abDepth:2,rule:'softmax',temp:8,regret:40}),PAB3:o=>H(o,{abDepth:3,rule:'softmax',temp:8,regret:40}),PAB4:o=>H(o,{abDepth:4,rule:'softmax',temp:8,regret:40}),
  PAB4T:o=>H(o,{abDepth:4,rule:'target',target:0.4,regret:60,personaScale:200}),
  EasyD3:o=>core(o,{preset:'easy',maxDepth:3}),
  // Round 4: MCTS with persona priors on node budgets (simulated moves per decision; 2k / 7k / 19k ≈ 2 / 10 / 30 ms on an M3,
  // the same on any device), and the plan / veto layer (lab/src/plans.rs): V = veto only, P = channel plans only, + = both.
  ...Object.fromEntries([2,7,19].flatMap(k=>{const m=o=>({algo:'mcts',nodes:k*1000,k:72,tilt:neutral?{}:personaOf(o)});
   return [[`M${k}k`,m],[`M${k}kV`,o=>({...m(o),veto:40})],[`M${k}kP`,o=>({...m(o),plans:true})],[`M${k}k+`,o=>({...m(o),plans:true,veto:40})]];})),
  'PAB2+':o=>H(o,{abDepth:2,rule:'softmax',temp:8,regret:40,plans:true,veto:40}),'PAB3+':o=>H(o,{abDepth:3,rule:'softmax',temp:8,regret:40,plans:true,veto:40}),
  'PAB4+':o=>H(o,{abDepth:4,rule:'softmax',temp:8,regret:40,plans:true,veto:40}),
  'Combo+':o=>H(o,{depth:2,gamma:0.6,belief:true,blind:0.3,rule:'target',target:0.4,regret:60,plans:true,veto:40}),
  // The game's own persona opponents (rust/core persona.rs, through chooseAIAction): CP<n> = n nodes, plans and veto on.
  ...Object.fromEntries([500,1000,1500,2000,3000,4000,4500,5000].map(n=>[`CP${n}`,o=>core(o,{algorithm:'persona',mctsNodes:n,plans:true,veto:40,persona:true})])),
  EngineNew:o=>core(o,{maxDepth:5,lmr:3,eval:'mlp',slack:0,tiltScale:0,persona:false}),
  MCTS2Pr6:o=>({algo:'mcts',ms:2,k:72,tilt:neutral?{}:personaOf(o),rollout:6}),   // …with longer rollouts
 };
 const cands=opt('cands','EasyLow,Policy,MCTS2,Disc,Belief1,Belief2,Blind,Soft,Director,Combo').split(','),players=opt('players','novice,decent,reader').split(',');
 if(args.includes('--longterm')){
  // Long-term spells: against the novice, characters built around them. Per opponent: share of its decisions on long-term
  // actions, Holds per channel and how many channels it releases, the share of its damage from long-term sources and how
  // much of that the player's defences stopped; then each character's signature spell.
  const SIG={Lyra:'wildfire',Seraphine:'omen',Mir:'contraption',Tobias:'heartwood',Bram:'brace',Marisol:'moonwell',Scholar:'starlight'};
  const foes=opt('foes',Object.keys(SIG).join(',')).split(','),cases=[],tags=[];let i=0;
  const LT=new Set(['starlight','wildfire','siphon','moonwell','lodestar','animate','heartwood','bramble','contraption','omen','brace','haste','foresight','torment','compel','tailwind','rime','hold','release']);
  const CH=['starlight','wildfire','siphon','moonwell','lodestar'],LTD=new Set(['wildfire','starlight','siphon','omen','contraption','animate','bramble']);
  for(const c of cands)for(const o of foes)for(const g of kits)for(const firstLeader of [0,1])for(const seed of [1,2,3]){
   const {lastEvents,...state}=createState({playerLoadout:g,opponentLoadout:o,playerLevel:50,opponentLevel:50,firstLeader});
   cases.push({state,algos:[{...PLAYERS.novice,seed:i*2+1},{...CANDS[c](o),seed:i*2+2+seed*7919}],maxRounds:120,salt:i+seed*100003,meta:{}});tags.push({c,o});i++;
  }
  const t0=Date.now(),rs=lab('run',cases);
  fs.writeFileSync(path.join(OUT,`human-longterm.jsonl`),rs.map((r,k)=>JSON.stringify({...r,tag:tags[k]})).join('\n')+'\n');
  const sum=(a,f)=>a.reduce((x,r)=>x+f(r),0),act=(r,n)=>r.acts[1][n]??0,dl=(r,n,j)=>r.dealt[1][n]?.[j]??0;
  console.log(`# Long-term spells: ${rs.length} fights against the novice (${((Date.now()-t0)/1e3).toFixed(0)} s), foes ${foes.join(', ')}\n`);
  console.log('| Opponent | Decisions on long-term actions | Holds per channel | Channels released | Damage from long-term sources | …of it stopped by the player | Novice wins | Fights over within 4 exchanges | Per fight: plans started / aborted / waited / vetoes |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|');
  for(const c of cands){
   const a=rs.filter((_,k)=>tags[k].c===c),dec=sum(a,r=>r.decisions[1]),lt=sum(a,r=>Object.entries(r.acts[1]).filter(([n])=>LT.has(n)).reduce((x,[,v])=>x+v,0));
   const starts=sum(a,r=>CH.reduce((x,n)=>x+act(r,n),0)),holds=sum(a,r=>act(r,'hold')),rel=sum(a,r=>act(r,'release'));
   const tot=sum(a,r=>Object.values(r.dealt[1]).reduce((x,v)=>x+v[0],0)),ltd=sum(a,r=>[...LTD].reduce((x,n)=>x+dl(r,n,0),0)),ltr=sum(a,r=>[...LTD].reduce((x,n)=>x+dl(r,n,1),0));
   const w=Math.round(100*sum(a,r=>!r.result||r.result.winner===undefined?.5:r.result.winner===0?1:0)/a.length);
   const P=a.reduce((x,r)=>x.map((v,j)=>v+(r.plans?.[1]?.[j]??0)),[0,0,0,0]).map(v=>(v/a.length).toFixed(2)),short=Math.round(100*a.filter(r=>r.rounds<=4).length/a.length);
   console.log(`| ${c} | ${(100*lt/dec).toFixed(0)}% | ${(holds/Math.max(1,starts)).toFixed(2)} | ${(100*rel/Math.max(1,starts)).toFixed(0)}% | ${(100*ltd/Math.max(1,tot)).toFixed(0)}% | ${(100*(1-ltd/Math.max(1,ltr))).toFixed(0)}% | ${w}% | ${short}% | ${P.join(' / ')} |`);
  }
  console.log(`\nSignature spell per fight: casts (Holds per cast for channels) · damage dealt (Heartwood heals, Brace defends: casts only)\n\n| Opponent | ${foes.map(o=>`${o} (${SIG[o]})`).join(' | ')} |\n|---|${foes.map(()=>'---:').join('|')}|`);
  for(const c of cands)console.log(`| ${c} | ${foes.map(o=>{const a=rs.filter((_,k)=>tags[k].c===c&&tags[k].o===o),sp=SIG[o],casts=sum(a,r=>act(r,sp))/a.length,d=sum(a,r=>dl(r,sp,0))/a.length;
   return CH.includes(sp)?`${casts.toFixed(1)} (${(sum(a,r=>act(r,'hold'))/Math.max(1,sum(a,r=>act(r,sp)))).toFixed(1)} holds)${LTD.has(sp)?' · '+d.toFixed(0):''}`:`${casts.toFixed(1)}${LTD.has(sp)?' · '+d.toFixed(0):''}`;}).join(' | ')} |`);
  process.exit(0);
 }
 if(args.includes('--distinct')){
  // Persona distinctness: each named character's opponent against the novice, with its persona and as a neutral twin.
  // Lift: how much more of its play goes to its persona's favoured actions; TV: total-variation distance between the two
  // action distributions (0: the persona is invisible, 1: entirely different play).
  const foes=opt('foes','Lyra,Bram,Seraphine,Kael,Tobias,Mir,Corvin,Tamsin').split(','),cases=[],tags=[];let i=0;
  for(const c of cands)for(const tw of [false,true])for(const o of foes)for(const g of kits)for(const firstLeader of [0,1])for(const seed of [1,2,3]){
   neutral=tw;const {lastEvents,...state}=createState({playerLoadout:g,opponentLoadout:o,playerLevel:50,opponentLevel:50,firstLeader});
   cases.push({state,algos:[{...PLAYERS.novice,seed:i*2+1},{...CANDS[c](o),seed:i*2+2+seed*7919}],maxRounds:120,salt:i+seed*100003,meta:{}});tags.push({c,tw,o});i++;
  }
  neutral=false;
  const rs=lab('run',cases),dist=f=>{const m={};let n=0;rs.forEach((r,k)=>{if(f(tags[k]))for(const [a,x] of Object.entries(r.acts[1])){m[a]=(m[a]??0)+x;n+=x;}});return [m,n];};
  console.log(`# Persona distinctness: ${rs.length} fights against the novice, foes ${foes.join(', ')}\n\n| Opponent | Favoured-action share with persona / neutral twin | Lift (points) | TV distance (mean over foes) | Novice wins with persona / twin |\n|---|---:|---:|---:|---:|`);
  for(const c of cands){
   let lift=0,tv=0,fs=0,fn=0;
   for(const o of foes){
    const fav=new Set(Object.keys(personaOf(o)).filter(k=>!k.includes('_'))),[m1,n1]=dist(t=>t.c===c&&!t.tw&&t.o===o),[m0,n0]=dist(t=>t.c===c&&t.tw&&t.o===o);
    const share=(m,n)=>Object.entries(m).filter(([a])=>a.split('+').some(x=>fav.has(x))||fav.has(a)).reduce((s,[,x])=>s+x,0)/Math.max(1,n);
    const a1=share(m1,n1),a0=share(m0,n0);fs+=a1;fn+=a0;lift+=a1-a0;
    const keys=new Set([...Object.keys(m1),...Object.keys(m0)]);tv+=[...keys].reduce((s,k)=>s+Math.abs((m1[k]??0)/Math.max(1,n1)-(m0[k]??0)/Math.max(1,n0)),0)/2;
   }
   const w=tw=>{const a=rs.filter((_,k)=>tags[k].c===c&&tags[k].tw===tw);return Math.round(100*a.reduce((s,r)=>s+(!r.result||r.result.winner===undefined?.5:r.result.winner===0?1:0),0)/a.length);};
   const F=foes.length;console.log(`| ${c} | ${Math.round(100*fs/F)}% / ${Math.round(100*fn/F)}% | ${lift>0?'+':''}${Math.round(100*lift/F)} | ${(tv/F).toFixed(2)} | ${w(false)}% / ${w(true)}% |`);
  }
  process.exit(0);
 }
 const cases=[],tags=[];let i=0;
 for(const c of cands)for(const p of players)for(const gap of [0,10])for(const g of kits)for(const o of G)for(const firstLeader of [0,1]){
  const {lastEvents,...state}=createState({playerLoadout:g,opponentLoadout:o,playerLevel:50,opponentLevel:50+gap,firstLeader});
  cases.push({state,algos:[{...PLAYERS[p],seed:i*2+1},{...CANDS[c](o),seed:i*2+2}],maxRounds:120,salt:i,meta:{},oracle:args.includes('--oracle')&&p==='novice'&&gap===0});tags.push({c,p,gap});i++;
 }
 const t=Date.now(),rs=lab('run',cases);
 fs.writeFileSync(path.join(OUT,`human-${opt('name','run')}.jsonl`),rs.map((r,k)=>JSON.stringify({...r,tag:tags[k]})).join('\n')+'\n');
 const sel=f=>rs.filter((_,k)=>f(tags[k])),win=a=>a.length?Math.round(100*a.reduce((s,r)=>s+(!r.result||r.result.winner===undefined?.5:r.result.winner===0?1:0),0)/a.length):NaN;
 const q=(a,x)=>{const v=[...a].sort((m,n)=>m-n);return v.length?v[Math.min(v.length-1,Math.floor(v.length*x))]:NaN;};
 console.log(`# Beatable opponents: ${rs.length} fights, ${((Date.now()-t)/1e3).toFixed(0)} s. Player kits ${kits.join(', ')} vs every class, both leaders, level 50 (player 10 below: foe 60).\n`);
 console.log(`| Opponent | ${players.map(p=>`${p} wins (equal / 10 below)`).join(' | ')} | Reading pays (reader − novice, equal) | Length median / p90 | Player HP left when winning (median) | Opponent ms/decision${args.includes('--oracle')?' | Mean regret, other / long-term positions (points) | Blunders over 40 points, other / long-term':''} |\n|---|${players.map(()=>'---:').join('|')}|---:|---:|---:|---:|${args.includes('--oracle')?'---:|---:|':''}`);
 for(const c of cands){
  const all=sel(t=>t.c===c),w=(p,g)=>win(sel(t=>t.c===c&&t.p===p&&t.gap===g));
  const wins=all.filter(r=>r.result?.winner===0),ms=all.reduce((a,r)=>a+r.ms[1],0)/all.reduce((a,r)=>a+r.decisions[1],0);
  const gapRead=players.includes('reader')&&players.includes('novice')?w('reader',0)-w('novice',0):NaN;
  const O=all.filter(r=>r.oracle).reduce((a,r)=>a.map((x,j)=>x+r.oracle[j]),[0,0,0,0,0,0]);
  const orc=O[0]+O[3]?` | ${(O[1]/Math.max(1,O[0])).toFixed(1)} / ${(O[4]/Math.max(1,O[3])).toFixed(1)} | ${(100*O[2]/Math.max(1,O[0])).toFixed(1)}% / ${(100*O[5]/Math.max(1,O[3])).toFixed(1)}%`:'';
  console.log(`| ${c} | ${players.map(p=>`${w(p,0)}% / ${w(p,10)}%`).join(' | ')} | ${gapRead>0?'+':''}${gapRead} | ${q(all.map(r=>r.rounds),.5)} / ${q(all.map(r=>r.rounds),.9)} | ${Math.round(100*q(wins.map(r=>r.hp[0]),.5))}% | ${ms.toFixed(2)}${orc} |`);
 }
}
