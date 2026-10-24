// World expansion 1 (E4, E10): races, the worn kit's modifiers, creature copies of a rule (F5.11), and the new rules: bind,
// drain, poison, swarm hits, no healing for creatures (as F5.11-plan.1 has them).
import test from 'node:test';import assert from 'node:assert/strict';
import {fightOptions} from './campaign.mjs';
import {createState} from './setup.mjs';
import {RACES,SPELLS,expandMods,generateLoadout} from './roster.mjs';
import {FLAVOR} from './flavor.mjs';
import {SPECIAL_LOADOUTS} from './loadouts.mjs';
import {FOES,PERSONAS,knownLoadout} from './foes.mjs';
import {DEFEAT,resolvedLines,fighterNames} from './flavor.mjs';
import * as core from '../web/core.mjs';

const skills={arcana:40,lore:40,alchemy:40,charm:40,vigor:40,guile:40};
const player=(extra={})=>({skills,spells:{ward:1,flame:2,purify:1,brace:1,shadowstep:1},level:40,health:70,mana:40,mood:60,renown:20,gold:10,alignment:0,...extra});
const fight=(loadout,extra={},level=40)=>createState(fightOptions({player:player(extra),opponent:{loadout,level}}));
// Plays one exchange: the player's move, then the foe's (its first legal move when `foe` isn't legal).
function exchange(s,mine,foe){
 const order=[0,1].map(()=>core.actorToMove(s));
 for(let i=0;i<2&&!s.result;i++){const side=core.actorToMove(s),want=side===0?mine:foe,legal=core.legalActions(s,side);core.applyChoice(s,legal.includes(want)?want:legal[0]);}
 return order;
}

test('a creature race scales HP and Mana and forbids healing; a human foe is 1×',()=>{
 const level=40,human=fight('Thornwitch'),ferret=fight('Bramble ferret'),bear=fight('Bristleback'),spinner=fight('The Spinner');
 const base=generateLoadout('Bramble ferret',level);
 assert.equal(base.race,'critter');assert.equal(base.noHeal,true);assert.equal(base.hpScale,RACES.critter.hp);
 assert(ferret.actors[1].maxHP<human.actors[1].maxHP,'a critter is smaller');
 assert(bear.actors[1].maxHP>human.actors[1].maxHP*1.4,'a monster is bigger');
 assert(spinner.actors[1].maxHP>human.actors[1].maxHP*2.5,'a boss is about three times');
 assert.equal(generateLoadout('Thornwitch',level).noHeal,undefined,'humans may heal');
 assert.equal(generateLoadout('The Outcast',level).race,undefined,'the Outcast is human: no race');
});

test('worn modifiers: flat HP and Mana, cheaper spells, and nonhuman damage reduction only against creatures',()=>{
 const plain=fight('Thornwitch'),worn=fight('Thornwitch',{mods:{hp:3,mana:2,cost:{brace:-1},taken:[{n:2,from:['nonhuman']}]}});
 assert.equal(worn.actors[0].maxHP,plain.actors[0].maxHP+3);
 assert.equal(worn.actors[0].kit.capacity,plain.actors[0].kit.capacity+2);
 assert.equal(worn.actors[0].kit.mods.cost.brace,-1);
 assert.equal(worn.actors[0].kit.mods.takenAll,0,'the thornwitch is human');
 assert.equal(fight('Bristleback',{mods:{taken:[{n:2,from:['nonhuman']}]}}).actors[0].kit.mods.takenAll,2);
 const m=expandMods({cost:{forbidden:-1,umbral:-1}});
 assert.equal(m.cost.shadowstep,-1);assert.equal(m.cost.siphon,-1);assert.equal(m.cost.flame,undefined);
});

test('on_defend: a foe who guards takes the wand\'s strike damage',()=>{
 const s=fight('Thornwitch',{mods:{onDefend:2}}),hp=s.actors[1].hp;
 exchange(s,'reclaim','guard');
 assert.equal(s.actors[1].hp,hp-2);
});

test('on_cast: each cast of the group also deals spell damage',()=>{
 const a=fight('Thornwitch'),b=fight('Thornwitch',{mods:{onCast:{ward:3}}});
 exchange(a,'ward','guard');exchange(b,'ward','guard');
 assert(b.actors[1].hp<a.actors[1].hp,'the ward also struck');
});

test('a creature never heals; a human foe may',()=>{
 const run=noHeal=>{const s=fight('Thornwitch');s.actors[1].kit.spells.mend=1;if(noHeal)s.actors[1].kit.noHeal=true;
  s.actors[1].hp=Math.round(s.actors[1].maxHP/2);const hp=s.actors[1].hp;exchange(s,'reclaim','mend');return s.actors[1].hp-hp;};
 assert(run(false)>0,'a human mends');
 assert.equal(run(true),0,'a creature doesn\'t');
});

test('every new foe has a loadout, a persona, flavour for its moves, and a defeat line where it doesn\'t fall',()=>{
 const ids=['practice_mannequin','bramble_ferret','bristleback','stag_beetle','grumpy_oak','elder_oak','spiderling_swarm','the_spinner','the_spinner_weak','thornwitch','masked_circle','the_outcast'];
 for(const id of ids){const f=FOES[id];assert.ok(f,id);assert.ok(knownLoadout(f.loadout),f.loadout);assert.ok(PERSONAS[f.loadout],'persona '+f.loadout);}
 for(const l of Object.keys(SPECIAL_LOADOUTS).filter(l=>SPECIAL_LOADOUTS[l].creature))assert.ok(DEFEAT[l],'defeat line '+l);
});

// Exact numbers: skills 50 (every factor 1), custom kits with creature moves.
const S50={arcana:50,lore:50,alchemy:50,charm:50,vigor:50,guile:50};
const ORDERS=[[0,0],[0,1],[1,0],[1,1]];
function duel(mine,theirs,{me=0,leader=0}={}){const k=me===0?[mine,theirs]:[theirs,mine];return createState({playerKit:{skills:S50,spells:k[0]},opponentKit:{skills:S50,spells:k[1]},firstLeader:leader});}
function play(s,me,mine,theirs){for(let i=0;i<2&&!s.result;i++){const side=core.actorToMove(s);core.applyChoice(s,side===me?mine:theirs);}}
const edit=(s,f)=>{const t=structuredClone(s);f(t);return t;};
const DEF={ward:1,shadowstep:2,brace:1,reflect:1,flame:1,mend:1};

test('a creature\'s copy (F5.11) plays its base spell\'s rule under its own name, cost, icon and words',()=>{
 const COPIES={skitter:'shadowstep',fade:'shadowstep',burrow:'brace',hide:'brace',bark:'ward',carapace:'ward',beetle_flame:'flame'};
 for(const [id,rule]of Object.entries(COPIES)){
  assert.equal(SPELLS[id].rule,rule,id);assert.equal(SPELLS[id].group,'creature');assert.ok(FLAVOR[id]?.cast,id+' has its own cast line');
  const s=duel({[id]:1,flame:1},DEF);
  assert(core.legalActions(s,0).includes(id));assert.equal(core.cost(s,0,id),SPELLS[id].cost[0],id+' at its own cost');
  assert.equal(core.describeData(s,0,id).k,core.describeData(duel({[rule]:1},DEF),0,rule).k,id+' described as '+rule);
 }
 assert.equal(core.label('beetle_flame'),'Flame','the beetle\'s Flame wears Flame\'s name');
 // By behaviour, on both sides and in both orders.
 for(const [me,leader]of ORDERS){
  let s=duel({skitter:1,flame:1},{...DEF},{me,leader});play(s,me,'skitter','flame');assert.equal(s.actors[me].hp,70,'Skitter evades');
  s=duel({bark:1,flame:1},{...DEF},{me,leader});play(s,me,'bark','flame');assert.equal(s.actors[me].hp,70,'Bark wards');
  s=duel({bark:1,flame:1},{...DEF},{me,leader});play(s,me,'bark','strike');assert.equal(s.actors[me].hp,65,'and halves Impact');
  s=duel({hide:1,flame:1},{...DEF},{me,leader});play(s,me,'hide','flame');play(s,me,'reclaim','flame');assert.equal(s.actors[me].hp,62,'Hide: 80% off for two exchanges');
  s=duel({beetle_flame:1},{hoarfrost:1,...DEF},{me,leader});play(s,me,'beetle_flame','reclaim');assert.equal(s.actors[1-me].hp,60,'the beetle\'s Flame: 10');
  s=duel({beetle_flame:1},{hoarfrost:1,...DEF},{me,leader});play(s,me,'beetle_flame','hoarfrost');assert.deepEqual([s.actors[0].hp,s.actors[1].hp],[70,70],'and Hoarfrost cancels it');
 }
 const k=generateLoadout('Stag beetle',40);assert.ok(k.spells.beetle_flame,'the stag beetle owns it');
});

test('bind (F5.11-plan.1): from the next exchange, Breaking Free is the only move, for each binder\'s own span',()=>{
 for(const [me,leader]of ORDERS)for(const [id,n]of [['root',1],['threads',1],['web',1],['bramble',1]]){
  const s=duel(DEF,{[id]:1,ward:1},{me,leader}),hp=s.actors[1-me].hp;
  play(s,me,'strike',id);assert.equal(s.actors[1-me].hp,hp-9,id+': the casting exchange plays as committed');
  for(let i=0;i<n;i++){assert.deepEqual(core.legalActions(s,me),['break_free'],id+' exchange '+(i+1));assert.match(core.describe(s,me,'break_free'),/only action/);play(s,me,'break_free','ward');}
  assert(core.legalActions(s,me).length>1,id+' over after '+n);
 }
 // Ward, Shadowstep or Breaking Free keep it off; Parry and Brace don't; Reflect binds its caster.
 for(const [me,leader]of ORDERS){
  for(const [def,off]of [['ward',true],['shadowstep',true],['guard',false],['brace',false]]){const s=duel(DEF,{threads:1,ward:1},{me,leader});play(s,me,def,'threads');assert.equal(core.legalActions(s,me).includes('break_free'),!off,def);}
  const s=duel(DEF,{threads:1,ward:1},{me,leader});play(s,me,'reflect','threads');assert.deepEqual(core.legalActions(s,1-me),['break_free'],'reflected');
 }
 // A channel waits while bound; frozen comes before bound.
 let s=duel({starlight:1,ward:1},{threads:1,ward:1});
 play(s,0,'starlight','threads');assert.deepEqual(core.legalActions(s,0),['break_free']);play(s,0,'break_free','ward');
 assert.deepEqual(core.legalActions(s,0),['hold','release'],'the channel resumes');
 s=duel({rime:1,ward:1},{threads:1,flame:1});
 s=edit(s,t=>{t.actors[0].hp=15;});play(s,0,'rime','threads');play(s,0,'break_free','flame');
 s=edit(s,t=>{t.actors[0].freezeUntil=t.round;t.actors[0].effects.bound={value:1,from:t.round,until:t.round,born:t.round};});
 assert.deepEqual(core.legalActions(s,0),['frozen'],'frozen first');
});

test('drain: Filch takes ready Mana into the creature\'s flux; Roar hits and scatters it; Ward keeps both off; Reflect turns them back',()=>{
 for(const [me,leader]of ORDERS){
  let s=duel({filch:1,roar:1},DEF,{me,leader});const m=s.actors[1-me].resources.mana;
  play(s,me,'filch','reclaim');assert.equal(s.actors[1-me].resources.mana,m-5,'5 taken');assert.equal(s.actors[me].resources.mana+s.actors[me].flux,s.actors[me].kit.capacity,'kept as flux, up to capacity');
  s=duel({filch:1,roar:1},DEF,{me,leader});
  play(s,me,'roar','reclaim');assert.equal(s.actors[1-me].resources.mana,m-4,'Roar scatters 4');assert.equal(s.actors[1-me].hp,62,'and deals 8');assert.equal(s.actors[1-me].flux,0,'scattered, not kept by anyone');
  s=duel({filch:1,roar:1},DEF,{me,leader});play(s,me,'roar','ward');assert.equal(s.actors[1-me].resources.mana,m-7,'Ward: only its own cost');assert.equal(s.actors[1-me].hp,70);
  s=duel({filch:1,roar:1},DEF,{me,leader});const mine=s.actors[me].resources.mana;play(s,me,'roar','reflect');
  assert.equal(s.actors[me].hp,62,'the roar comes back');assert.equal(s.actors[me].resources.mana,mine-4-4,'and so does the scatter');
 }
});

test('poison (F5.11-plan.1): a tick this exchange and the next, past every defence and a frozen rescue; no cure; a new bite starts it over',()=>{
 for(const [me,leader]of ORDERS){
  for(const def of ['guard','ward','brace','shadowstep','reflect']){
   const s=duel({venom:1,ward:1},DEF,{me,leader});play(s,me,'venom','reclaim');
   play(s,me,'reclaim',def);assert.equal(s.actors[1-me].hp,58,'second tick past '+def);
  }
  let s=duel({venom:1,ward:1},{...DEF,purify:1},{me,leader});play(s,me,'venom','purify');play(s,me,'reclaim','reclaim');play(s,me,'reclaim','reclaim');
  assert.equal(s.actors[1-me].hp,70-20-12,'Distill pays 20 and cures nothing: two ticks, then none');
  s=duel({venom:1,ward:1},DEF,{me,leader});play(s,me,'venom','reclaim');play(s,me,'venom','reclaim');play(s,me,'reclaim','reclaim');
  assert.equal(s.actors[1-me].hp,70-6-6-6,'a recast refreshes, it doesn\'t stack');
  s=duel({venom:1,ward:1},{...DEF,rime:1},{me,leader});s=edit(s,t=>{t.actors[1-me].hp=10;});
  play(s,me,'strike','rime');play(s,me,'strike','reclaim');assert.equal(s.actors[1-me].freezeUntil,3,'rescued by Rime');
  play(s,me,'venom','frozen');assert.equal(s.actors[1-me].hp,18,'poison bites through the frozen interval');
 }
});

test('swarm: three smaller Impact hits; Parry and Brace meet only the first; the text counts the total',()=>{
 for(const [me,leader]of ORDERS){
  let s=duel({swarm:1},DEF,{me,leader});play(s,me,'swarm','reclaim');assert.equal(s.actors[1-me].hp,55);
  s=duel({swarm:1},DEF,{me,leader});play(s,me,'swarm','guard');assert.equal(s.actors[1-me].hp,60,'Parry stops the first of 5 + 5 + 5');
  s=duel({swarm:1},DEF,{me,leader});play(s,me,'swarm','ward');assert.equal(s.actors[1-me].hp,61,'Ward halves each: 3 + 3 + 3 (rounded up)');
  assert.match(core.describe(s,me,'swarm'),/15 Impact damage as 3 hits of 5/);
 }
});

test('the fight text tells each creature by its own words: its cast and end lines, and its blows without a wand',()=>{
 const names=fighterNames({opponentName:'the bristleback',opponentLoadout:'Bristleback'});
 const said=(loadout,mine,foe)=>{const s=fight(loadout),before=structuredClone(s);exchange(s,mine,foe);
  return resolvedLines(before,s,{pair:s.lastPair,round:before.round,channels:[null,null],eventData:[]},names)[1];};
 assert.match(said('Bristleback','guard','hide'),/hunches down/);
 assert.match(said('Bristleback','guard','strike'),/lunges|closes|weight/,'no wand for a creature');
 assert.doesNotMatch(said('Bristleback','guard','strike'),/wand/);
 assert.match(said('Stag beetle','guard','beetle_flame'),/mandibles/);
 for(const l of Object.keys(SPECIAL_LOADOUTS).filter(l=>SPECIAL_LOADOUTS[l].creature))for(const id of Object.keys(SPECIAL_LOADOUTS[l].kit??{}))assert.ok(FLAVOR[id]?.cast,l+' '+id+' has a cast line');
});
