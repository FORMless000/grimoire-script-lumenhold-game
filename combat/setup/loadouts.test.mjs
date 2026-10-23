import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {COMBAT_TUNING,LOADOUTS,NAMED_LOADOUTS,LOADOUT_SKILLS,COURSE_PICKS,generateLoadout,courseRank,fixedLoadoutLevel,SPELLS,COMBAT_EXCLUDED,manaCapacity,flameUnlock,curriculumBudget} from './roster.mjs';
import {CAST_STATS,CAST_STATS_HASH} from './cast-stats.mjs';
import {createState} from './setup.mjs';
const peerSpells=['wildfire','heartwood','omen','sleight','contraption','hoarfrost','candour'];
test('ten generic presets follow fixed level gates, course ranks, restrictions and skill seeds',()=>{
 const g=COMBAT_TUNING.kits,[r2,r3]=g.ranks,open=(gates,level)=>gates.filter(x=>x<=level).length;
 assert.equal(Object.keys(LOADOUTS).length,10);assert.deepEqual([r2-1,r2,r3-1,r3].map(courseRank),[1,2,2,3]);
 for(const [name,def]of Object.entries(LOADOUTS)){
  assert.equal(def.offsets.reduce((a,b)=>a+b),0,name);
  for(let level=1;level<=100;level++){
   const a=generateLoadout(name,level);assert.deepEqual(a,generateLoadout(name,level));assert.equal(a.seed,level+1000*def.salt);assert.equal(a.spells.ward,1);
   if(level>=g.flameBy)assert(a.spells.flame>=1&&a.spells.flame<=courseRank(level),name+' '+level);
   // A course slot opens at its gate; Haste and Shadowstep wait for courseMin, so a slot can open a little late.
   const courses=COURSE_PICKS.filter(id=>id in a.spells),slots=open(g.courses,level);assert(courses.length<=slots&&courses.length>=Math.min(slots,open(g.courses,level-2)),name+' '+level);
   if(level<g.courseMin.haste)assert(!a.spells.haste);if(level<g.courseMin.shadowstep)assert(!a.spells.shadowstep);
   // Capstones (club and job spells) and hidden spells (feedback 2026-10-21): none below level 30; capstones one a gate, three
   // at most, from the loadout's lists; every hidden spell listed, one each `every` levels.
   const caps=Object.keys(a.spells).filter(id=>SPELLS[id].capstone),hidden=Object.keys(a.spells).filter(id=>id!=='ward'&&!SPELLS[id].capstone&&!['course','forbidden'].includes(SPELLS[id].group));
   const listed={...def.hidden,...def.extras},usable=id=>!COMBAT_EXCLUDED.has(id);
   if(level<30)assert.deepEqual([caps.length,hidden.length],[0,0],name+' '+level);
   assert(caps.length<=open(g.capstones,level)&&caps.length<=3&&caps.every(id=>id in listed),name+' '+level);
   const nHidden=Object.keys(listed).filter(id=>!SPELLS[id].capstone&&usable(id)).length;
   assert.equal(hidden.length,level<g.hidden.from?0:Math.min(nHidden,1+Math.floor((level-g.hidden.from)/g.hidden.every)),name+' '+level+' hidden');
   for(const id of hidden)assert(id in listed&&a.unlockLevels[id]>=g.hidden.from,name+' '+id);
   const forbidden=Object.keys(a.spells).filter(id=>SPELLS[id].group==='forbidden');
   assert(def.underground?forbidden.length===Math.min(open(g.forbidden,level),Object.keys(def.forbidden).length):forbidden.length===0,name+' '+level);
   assert(!a.spells.toll);for(const id of peerSpells)assert(!a.spells[id]);
   for(const [i,k]of LOADOUT_SKILLS.entries()){assert(Number.isInteger(a.skills[k])&&a.skills[k]>=1&&a.skills[k]<=100);assert(Math.abs(a.skills[k]-Math.max(1,Math.min(100,level*(1+def.offsets[i]/100))))<=level*.09+.5);}
   assert.equal(a.capacity,manaCapacity(a.skills));
   // Course ranks (F5.11): within courseRank, I for everything else, and the curriculum budget at most (or one rank a course spell).
   for(const [id,r]of Object.entries(a.spells))if(SPELLS[id].levels===3)assert(r>=1&&r<=courseRank(level),name+' '+level+' '+id);else assert.equal(r,1);
   const course=Object.entries(a.spells).filter(([id])=>SPELLS[id].levels===3);
   assert(course.reduce((n,[,r])=>n+r,0)<=Math.max(course.length,...Array.from({length:level},(_,l)=>curriculumBudget(l+1)))+course.length,name+' '+level+' budget');
  }
 }
 assert.notDeepEqual(generateLoadout('Duellist',50).draws,generateLoadout('Scholar',50).draws);
});
test('capstones: one club and one job first, a third at most, all from level 30; one without combat effect still takes its place',()=>{
 const g=COMBAT_TUNING.kits,at=(name,level=100)=>Object.fromEntries(Object.entries(generateLoadout(name,level).unlockLevels).filter(([id])=>SPELLS[id].capstone));
 assert.deepEqual(at('Duellist'),{brace:30,tailwind:40});                 // a club, then the job
 assert.deepEqual(at('Brawler'),{tailwind:30,brace:40,purify:60});        // a job, then a club, then a second job
 assert.deepEqual(at('Showman'),{tailwind:30,brace:40});                  // Rapport (no combat effect) keeps the third place
 assert.deepEqual(at('Illusionist'),{brace:40});                          // Rapport keeps the first
 assert.deepEqual(at('Prefect'),{brace:30});                              // Index is its job
 assert.deepEqual(at('Scholar'),{});                                      // Index and Quickquill: nothing in combat
 assert.deepEqual(at('Tobias'),{bramble:30,purify:40});                   // the place first
 assert.deepEqual(at('Bram'),{brace:1});                                  // an iconic capstone keeps its level
 for(const name of Object.keys(LOADOUTS))assert(!Object.keys(generateLoadout(name,29).spells).some(id=>SPELLS[id].capstone),name);
 assert.deepEqual(g.capstones,[30,40,60]);
});
test('worldbook snapshot is current; named skills are fixed or keep their canon shape at a mean of the level',()=>{
 const hash=crypto.createHash('sha256').update(fs.readFileSync(new URL('../../content/world/cast.grim',import.meta.url))).digest('hex');assert.equal(CAST_STATS_HASH,hash);
 assert.equal(Object.keys(NAMED_LOADOUTS).length,22);
 for(const [name,def]of Object.entries(NAMED_LOADOUTS)){
  if(!def.npc)continue;const canon=CAST_STATS[def.npc];
  if(def.fixed){const a=generateLoadout(name,1),b=generateLoadout(name,100);assert.deepEqual(a,b);assert.deepEqual(a.skills,canon.skills);const top=Object.values(canon.skills).sort((a,b)=>b-a);assert.equal(a.level,Math.floor((top[0]+top[1])/2));}
  // Growing characters: mean skill = level (the class rule), canon shape kept; capped points move to the other skills.
  else for(const level of [10,30,50,70,95]){const k=generateLoadout(name,level).skills,v=LOADOUT_SKILLS.map(s=>k[s]),mean=v.reduce((a,b)=>a+b)/6,sum=LOADOUT_SKILLS.reduce((a,s)=>a+canon.skills[s],0);
   assert(Math.abs(mean-level)<=.5,name+' '+level+' mean '+mean);if(Math.max(...v)<100)for(const s of LOADOUT_SKILLS)assert(Math.abs(k[s]-canon.skills[s]*6*level/sum)<=.5+1e-9,name+' '+level+' '+s);}
 }
 assert.equal(fixedLoadoutLevel('Thorne'),81);assert.equal(fixedLoadoutLevel('Grisk'),64);assert(generateLoadout('The man in grey',28).provisionalSkills);
 const exact={arcana:40,lore:20,alchemy:10,charm:25,vigor:30,guile:15};assert.deepEqual(generateLoadout('Lyra',40,'kit',{skills:exact}).skills,exact);
});
test('named spells, place guarantees, prodigies, study years and Ilse flags are reproducible',()=>{
 const g=COMBAT_TUNING.kits;
 for(const [name,def]of Object.entries(NAMED_LOADOUTS))for(let level=1;level<=100;level++)for(const year of [1,4]){
  const a=generateLoadout(name,level,'kit',{year});assert.deepEqual(a,generateLoadout(name,level,'kit',{year}));
  for(const id of def.iconic??[])if(!COMBAT_EXCLUDED.has(id))assert(a.spells[id],name+' '+id);if(def.place&&!COMBAT_EXCLUDED.has(def.place))assert.equal(!!a.spells[def.place],a.level>=Math.min(g.capstones[0],g.hidden.from),name+' place');
  for(const [id,min]of def.grants??[])if(a.level>=min&&!COMBAT_EXCLUDED.has(id))assert(a.spells[id],name+' grant '+id);
  for(const id of peerSpells)if(!(def.iconic??[]).includes(id))assert(!a.spells[id]);
  if(!a.underground)assert(!Object.keys(a.spells).some(id=>SPELLS[id].group==='forbidden'));
  if(a.year===4&&level>=g.courses[3])assert(Object.keys(a.spells).filter(id=>SPELLS[id].group==='course').length>=4,name+' year4');
  if(def.prodigy&&!COMBAT_EXCLUDED.has(def.prodigy))assert(a.spells[def.prodigy]>=1&&a.spells[def.prodigy]<=Math.min(3,courseRank(a.level)+1),name+' prodigy');
 }
 const free=generateLoadout('Ilse',80),taken=generateLoadout('Ilse',80,'kit',{ilseTaken:true});assert(!free.underground);assert(taken.underground);assert(taken.spells.eclipse);assert(Object.keys(taken.spells).filter(id=>SPELLS[id].group==='forbidden').length>=2);
 assert.equal(Object.keys(generateLoadout('Lyra',12).spells).filter(id=>SPELLS[id].group==='course').length,2);assert.equal(Object.keys(generateLoadout('Lyra',56,'kit',{year:4}).spells).filter(id=>SPELLS[id].group==='course').length,4);assert(!generateLoadout('Lyra',80).spells.mend);assert(!generateLoadout('Lyra',80).spells.glamour);
 const a=createState({playerLoadout:'Lyra',playerLevel:50,playerYear:4});assert.deepEqual(a.actors[0].kit,a.actors[1].kit);
 const b=createState({playerLoadout:'Thorne',playerLevel:20});assert.equal(b.config.resolvedPlayerLevel,81);
});
test('all-spells stress access remains available and invalid context is rejected',()=>{
 for(const name of [...Object.keys(LOADOUTS),...Object.keys(NAMED_LOADOUTS)])assert.equal(Object.keys(generateLoadout(name,50,'all').spells).length,35);
 for(const year of [0,5,1.5])assert.throws(()=>generateLoadout('Lyra',50,'kit',{year}),/year/);
 assert.throws(()=>generateLoadout('Lyra',50,'kit',{skills:{arcana:50}}),/Six skill/);
});

test('all loadouts keep spells as level or study year rises, including low levels',()=>{
 for(const name of [...Object.keys(LOADOUTS),...Object.keys(NAMED_LOADOUTS)])for(let level=1;level<100;level++)for(let year=1;year<=4;year++){
  const a=generateLoadout(name,level,'kit',{year}),b=generateLoadout(name,level+1,'kit',{year});
  for(const [id,r]of Object.entries(a.spells))assert(b.spells[id]>=r,`${name} ${level}/${year} lost ${id} at higher level`);
  if(year<4){const c=generateLoadout(name,level,'kit',{year:year+1});for(const [id,r]of Object.entries(a.spells))assert(c.spells[id]>=r,`${name} ${level}/${year} lost ${id} in later year`);}
 }
});
test('spell unlock levels do not depend on jitter or rerolls, and preferences determine the ladder',()=>{
 for(const [name,def]of Object.entries(LOADOUTS)){
  const low=generateLoadout(name,1),top=generateLoadout(name,100);assert.deepEqual(low.unlockLevels,top.unlockLevels);assert.equal(low.draws.length,6);assert.equal(top.draws.length,6);
  assert.equal(top.unlockLevels.flame,flameUnlock(def));
  for(let level=1;level<=100;level++){const a=generateLoadout(name,level);for(const [id,at]of Object.entries(a.unlockLevels))assert.equal(id in a.spells,level>=at,`${name} ${id}@${level}`);}
 }
  assert.deepEqual(generateLoadout('Duellist',100).unlockLevels,{ward:1,flame:flameUnlock(LOADOUTS.Duellist),foresight:1,haste:10,shadowstep:16,mend:26,brace:30,tailwind:40,reflect:30,lodestar:40,starlight:50});
 const hf=generateLoadout('Healer',100).unlockLevels.flame;assert.equal(hf,flameUnlock(LOADOUTS.Healer));assert(!generateLoadout('Healer',hf-1).spells.flame);assert(generateLoadout('Healer',hf).spells.flame);
 assert.equal(generateLoadout('Lyra',50).draws.length,0);
});
test('the curriculum budget (F5.11): course ranks total the budget where the course spells can hold it; Ward and extras on top',()=>{
 const g=COMBAT_TUNING.kits;
 assert.deepEqual([1,65,100].map(curriculumBudget),[1,14,18]);
 for(const [name,def]of Object.entries(LOADOUTS))for(let level=1;level<=100;level++){
  const a=generateLoadout(name,level),course=Object.entries(a.spells).filter(([id])=>SPELLS[id].levels===3);
  const total=course.reduce((n,[,r])=>n+r,0),room=course.reduce((n,[id])=>n+Math.min(3,courseRank(level)+Number(def.prodigy===id)),0);
  // Rank-ups never come back once given: at least the budget (as far as the spells known can hold it), and above it only by the
  // spells learned at I since a rank-up was handed out (one per course gate at most).
  assert(total>=Math.min(room,curriculumBudget(level)),name+' '+level+' total '+total+' < budget');
  assert(total<=Math.max(course.length,curriculumBudget(level)+g.courses.length-1),name+' '+level+' total '+total);
  assert.equal(a.spells.ward,1);for(const [id,r]of Object.entries(a.spells))if(SPELLS[id].levels!==3)assert.equal(r,1,name+' '+id);
  if(level===65)assert(Math.abs(total-14)<=1,name+' at 65: '+total);
 }
});
