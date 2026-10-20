// World expansion 1 (E4, E10): races, the worn kit's modifiers, creature aliases, and the new rules: bind, drain, poison,
// swarm hits, no healing for creatures.
import test from 'node:test';import assert from 'node:assert/strict';
import {fightOptions} from './campaign.mjs';
import {createState} from './setup.mjs';
import {RACES,SPELLS,expandMods,generateLoadout} from './roster.mjs';
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

test('aliases learn their base rule under the creature\'s name, at the alias\'s cost',()=>{
 const k=generateLoadout('Bramble ferret',40);
 assert.ok(k.spells.shadowstep&&!k.spells.skitter);assert.equal(k.labels.shadowstep,'skitter');
 assert.equal(k.mods.costDelta.shadowstep,SPELLS.skitter.cost[0]-SPELLS.shadowstep.cost[0]);
 const s=fight('Bramble ferret');
 assert(core.legalActions(s,1).includes('shadowstep'));
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

test('bind: rooted, you can\'t step aside or brace next exchange',()=>{
 const s=fight('Grumpy oak');
 exchange(s,'guard','root');
 const legal=core.legalActions(s,0);
 assert(!legal.includes('shadowstep')&&!legal.includes('brace'),'bound');
 assert(legal.includes('guard'));
});

test('drain: a filch takes Mana into the creature\'s flux; a roar scatters it',()=>{
 const s=fight('Bramble ferret'),mine=s.actors[0].resources.mana,flux=s.actors[1].flux;
 exchange(s,'guard','filch');
 assert(s.actors[0].resources.mana<mine);assert(s.actors[1].flux>flux);
});

test('poison: a venom bite burns each exchange, past every defence; Distil clears it',()=>{
 const s=fight('The Spinner');
 exchange(s,'guard','venom');
 assert.ok(s.actors[0].effects.poison,'poisoned');
 const before=s.actors[0].hp;exchange(s,'guard','ward');
 assert(s.actors[0].hp<before,'it burns through a guard');
 exchange(s,'purify','ward');
 assert.ok(!s.actors[0].effects.poison,'Distil clears it');
});

test('swarm: several small hits, and a guard stops only the first',()=>{
 const s=fight('Spiderling swarm'),hp=s.actors[0].hp;
 exchange(s,'guard','swarm');
 assert(s.actors[0].hp<hp,'the later bites get past the guard');
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

test('the fight text tells an alias by the creature\'s own words',()=>{
 const s=fight('Bristleback'),before=structuredClone(s);
 exchange(s,'guard','starlight');
 const names=fighterNames({opponentName:'the bristleback',opponentLoadout:'Bristleback'});
 const r={pair:s.lastPair,round:before.round,channels:[null,null],eventData:[]};
 const [,line]=resolvedLines(before,s,r,names);
 assert.match(line,/rears up/);
});
