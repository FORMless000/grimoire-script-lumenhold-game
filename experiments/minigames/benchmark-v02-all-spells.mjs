#!/usr/bin/env node
// Fixed-state latency panel, not a win-rate experiment. No AI/rules tuning here.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createState, cloneState, applyChoice, actorToMove, legalActions, ARCHETYPES, SPELLS, RULES_VERSION} from './iterations/v02/engine.mjs';
import {chooseAIAction, AI_PROFILES} from './iterations/v02/ai.mjs';

const args=process.argv.slice(2);
const option=(key,fallback)=>{const i=args.indexOf('--'+key);return i<0?fallback:args[i+1];};
const root=path.dirname(fileURLToPath(import.meta.url));
const out=path.resolve(option('out','experiments/minigames/results/v02-all-spells-'+new Date().toISOString().replace(/[:.]/g,'-')));
const repeats=Number(option('repeats',3)), warmups=Number(option('warmups',1));
const limit=Number(option('limit',0)); // Small dry runs only; 0 = complete panel.
const panel=option('panel','quick');assert(['quick','full'].includes(panel));
for(const n of [repeats,warmups,limit])assert(Number.isInteger(n)&&n>=0);
assert(repeats>0);
const search={nodeBudget:5000}, seeds=[20261014,77,104729];
const profiles=Object.keys(AI_PROFILES), fixtures=[];

function pair(s,commands){
  applyChoice(s,commands[actorToMove(s)]);
  applyChoice(s,commands[actorToMove(s)]);
  assert.equal(s.result,null,'Fixture must stay live');
}
function add(base,phase,state){
  const side=actorToMove(state),actions=legalActions(state);
  for(const a of state.actors)assert.deepEqual(Object.keys(a.kit.spells).sort(),Object.keys(SPELLS).sort());
  assert(actions.length>0);
  fixtures.push({id:fixtures.length,...base,phase,side,round:state.round,legalCount:actions.length,
    role:state.pending[1-side]?'responder':'committer',state:structuredClone(state)});
}
function makeFixtures(base){
  const initial=createState({...base,spellAccess:'all',search});
  assert.equal(legalActions(initial).length,15,'All 12 spells affordable at entry');
  add(base,'opening',initial);
  const response=cloneState(initial);applyChoice(response,'strike');add(base,'respond-strike',response);
  const middle=cloneState(initial);
  pair(middle,base.mode==='combat'?['flame','tide']:['glamour','attune']);
  pair(middle,['strike','guard']);add(base,'midgame',middle);
  const forecast=cloneState(initial),commands=['guard','guard'];commands[initial.leader]='foresight';pair(forecast,commands);
  add(base,'foresight-1-commit',forecast);
  applyChoice(forecast,'strike');add(base,'foresight-1-response',forecast);
  applyChoice(forecast,'guard');add(base,'foresight-2-commit',forecast);
  pair(forecast,['guard','guard']);add(base,'foresight-3-commit',forecast);
  const bilateral=cloneState(initial);pair(bilateral,['foresight','foresight']);add(base,'bilateral-foresight-commit',bilateral);
}
for(const level of [20,50,80])for(const archetype of Object.keys(ARCHETYPES))for(const firstLeader of [0,1]){
  makeFixtures({mode:'combat',playerLevel:level,opponentLevel:level,playerArchetype:archetype,opponentArchetype:archetype,firstLeader});
}
// Both negotiation fixtures, both commitment orders, all presets. Approaches and
// audience kits rotate deterministically; this is not a full negotiation factorial.
for(const [i,level] of [20,50,80].entries())for(const [j,fixture] of ['workshop_request','formal_petition'].entries())for(const firstLeader of [0,1]){
  makeFixtures({mode:'negotiation',playerLevel:level,opponentLevel:level,playerArchetype:j?'Illusionist':'Envoy',
    opponentArchetype:Object.keys(ARCHETYPES)[i*2+j],fixture,approach:['reason','appeal','bluff'][(i+j+firstLeader)%3],firstLeader});
}
if(panel==='quick'){
  const selected=fixtures.filter(f=>f.firstLeader===1&&
    ['opening','respond-strike','foresight-1-commit','bilateral-foresight-commit'].includes(f.phase)&&
    (f.mode==='negotiation'||f.playerArchetype==='Evoker'));
  fixtures.splice(0,fixtures.length,...selected);
}
if(limit)fixtures.splice(limit);
fixtures.forEach((f,i)=>f.id=i);
fs.mkdirSync(path.dirname(out),{recursive:true});fs.mkdirSync(out);
const hashes={};
for(const file of ['benchmark-v02-all-spells.mjs','iterations/v02/roster.mjs','iterations/v02/engine.mjs','iterations/v02/ai.mjs']){
  const source=fs.readFileSync(path.join(root,file));hashes[file]=crypto.createHash('sha256').update(source).digest('hex');
  const target=path.join(out,'sources',file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,source);
}
const manifest={schema:'minigame-all-spells-latency-2',rulesVersion:RULES_VERSION,createdUTC:new Date().toISOString(),environment:{node:process.version,platform:os.platform(),release:os.release(),arch:os.arch(),cpu:os.cpus()[0]?.model,logicalCPUs:os.cpus().length,totalMemoryBytes:os.totalmem()},
  settings:{search,profiles:AI_PROFILES,seeds,repeats,warmups,limit,panel,spellAccess:'all',healthModel:'direct',resourceBudget:'standard',manaCostScale:2,combatScale:3},sourceHashes:hashes,
  timing:'External performance.now around chooseAIAction, including optional exact-ranking pass; excludes fixture cloning, assertions and file IO. Single process, sequential decisions. Per-fixture/profile warmups excluded. Repeats rotate three fixed policy seeds, so fallible ranking paths can vary. Equal-weight fixed states, not gameplay-frequency weighted. Foresight changes commitment order without extra planning decisions.'};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
fs.writeFileSync(path.join(out,'fixtures.json'),JSON.stringify(fixtures,null,2));
const tasks=fixtures.flatMap(f=>profiles.map(profile=>({f,profile})));
const rows=[];
function decision(f,profile,repeat){
  const state=structuredClone(f.state),before=JSON.stringify(state),options={...AI_PROFILES[profile],...search,seed:seeds[repeat%seeds.length]};
  const start=performance.now(),d=chooseAIAction(state,options),wallMs=performance.now()-start;
  assert.equal(JSON.stringify(state),before,'AI must not mutate the fixture');
  assert(legalActions(state).includes(d.id));assert(d.completedDepth<=options.maxDepth);
  assert(d.totalNodes<=search.nodeBudget*2);assert(!d.degraded||(d.regret>0&&d.regret<=35));
  return {fixtureId:f.id,mode:f.mode,level:f.playerLevel,archetype:f.playerArchetype,phase:f.phase,role:f.role,side:f.side,legalCount:f.legalCount,profile,repeat,wallMs,...d};
}
// Rotate task order on successive passes to spread warmup/thermal/order effects.
for(let pass=-warmups;pass<repeats;pass++){
  const offset=((pass+warmups)*97)%tasks.length;
  for(let i=0;i<tasks.length;i++){
    const {f,profile}=tasks[(i+offset)%tasks.length],row=decision(f,profile,Math.max(0,pass));
    if(pass>=0)rows.push(row);
    if(i%192===0)console.log(`${pass<0?'warmup':'measured'} pass ${pass<0?pass+warmups+1:pass+1}: ${i+1}/${tasks.length}`);
  }
}
// Seeded decisions must repeat exactly; timing fields alone are excluded.
let replayed=0;
for(const row of rows.filter(r=>r.repeat===0).filter((_,i)=>i%37===0)){
  const replay=decision(fixtures[row.fixtureId],row.profile,0);
  const stable=r=>Object.fromEntries(Object.entries(r).filter(([k])=>!['wallMs','elapsedMs'].includes(k)));
  assert.deepEqual(stable(replay),stable(row));replayed++;
}
const quantile=(xs,p)=>{const sorted=[...xs].sort((a,b)=>a-b);return sorted.length?sorted[Math.max(0,Math.ceil(sorted.length*p)-1)]:null;};
function stats(rs){
  const times=rs.map(r=>r.wallMs),depths={};for(const r of rs)depths[r.completedDepth]=(depths[r.completedDepth]??0)+1;
  return {n:rs.length,p50Ms:quantile(times,.5),p95Ms:quantile(times,.95),p99Ms:quantile(times,.99),maxMs:Math.max(...times),over100Ms:rs.filter(r=>r.wallMs>100).length,over200Ms:rs.filter(r=>r.wallMs>200).length,depths,
    mainBudgetHits:rs.filter(r=>r.nodes===search.nodeBudget).length,rankingCalls:rs.filter(r=>r.rankingNodes>0).length,rankingBudgetHits:rs.filter(r=>r.rankingNodes===search.nodeBudget).length,mistakeAttempts:rs.filter(r=>r.mistakeAttempted).length,acceptedMistakes:rs.filter(r=>r.degraded).length,
    legalCount:{min:Math.min(...rs.map(r=>r.legalCount)),max:Math.max(...rs.map(r=>r.legalCount))}};
}
function group(keys,rs=rows){
  const groups=new Map();for(const r of rs){const key=keys.map(k=>r[k]).join('|');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
  return [...groups].map(([key,rs])=>({key,...stats(rs)}));
}
const interactive=rows.filter(r=>r.role!=='forced');
const summary={fixtures:fixtures.length,measuredCalls:rows.length,warmupCalls:tasks.length*warmups,replayedDecisions:replayed,
  interactive:stats(interactive),byModeProfile:group(['mode','profile'],interactive),byPhaseProfile:group(['mode','phase','profile']),byLevelProfile:group(['mode','level','profile'],interactive),
  byRoleProfile:group(['mode','role','profile']),byRanking:group(['profile','mistakeAttempted'],interactive),
  slowest:[...rows].sort((a,b)=>b.wallMs-a.wallMs).slice(0,20)};
fs.writeFileSync(path.join(out,'decisions.json'),JSON.stringify(rows,null,2));
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2));
fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify({stateMutationChecks:tasks.length*(warmups+repeats)+replayed,legalDecisionsChecked:rows.length,exactSeedReplays:replayed,allActorsLearnAll12Spells:true,entryLegalActions:15,nodeBudgetsChecked:true},null,2));
let report=`# All-spell AI decision latency — ${RULES_VERSION}\n\n${fixtures.length} fixed states, ${rows.length} measured decisions, ${warmups} warmup(s) and ${repeats} measurements per state/profile. ${manifest.environment.cpu}; Node ${process.version}, ${os.arch()}.\n\nBoth actors learn all 12 spells; all 15 actions are affordable at entry. Later mana can restrict affordable choices. Defaults: depth 3 (shallow 1), 5,000 main nodes; attempted fallibility adds a separate ranking budget of 5,000.\n\nExternal timings include the complete AI wrapper. Repeated states/seeds are timing samples, not independent games. The equal-weight panel intentionally overrepresents Foresight stress states; aggregate quantiles are not a typical-match latency estimate. All decisions use one command per exchange; Foresight changes commitment order.\n\n| Mode / profile | Calls | Median ms | p95 ms | p99 ms | Max ms | Depth 0 / 1 / 2 / 3 | Ranking calls |\n|---|---:|---:|---:|---:|---:|---|---:|\n`;
for(const g of summary.byModeProfile)report+=`| ${g.key} | ${g.n} | ${g.p50Ms.toFixed(1)} | ${g.p95Ms.toFixed(1)} | ${g.p99Ms.toFixed(1)} | ${g.maxMs.toFixed(1)} | ${[0,1,2,3].map(d=>g.depths[d]??0).join(' / ')} | ${g.rankingCalls} |\n`;
report+='\n## Phase detail\n\n| Mode / phase / profile | Median ms | p95 ms | Max ms | Depth 0 / calls | Legal choices |\n|---|---:|---:|---:|---:|---|\n';
for(const g of summary.byPhaseProfile)report+=`| ${g.key} | ${g.p50Ms.toFixed(1)} | ${g.p95Ms.toFixed(1)} | ${g.maxMs.toFixed(1)} | ${g.depths[0]??0} / ${g.n} | ${g.legalCount.min}–${g.legalCount.max} |\n`;
report+='\nRaw states, every decision, source snapshots/hashes, environment and exact replay checks are preserved alongside this report. No gameplay parameters were changed. CPU times vary with hardware, JIT, garbage collection and background activity. They do not measure a physical smartphone. See browser measurements separately for worker dispatch overhead.\n';
fs.writeFileSync(path.join(out,'REPORT.md'),report);
console.log('RESULTS='+out+'\n'+JSON.stringify(summary.byModeProfile,null,2));
