// F5.11-plan.1 (docs/minigame-combat-f5.11-plan.1-2026-10-21.md §12): fixtures for the redesigned rules, on both actor sides
// and both commitment orders where the order could matter. Skills 50 everywhere, so every skill factor is 1: base numbers
// are the numbers dealt (70 HP, 43 Mana, Impulse 9).
import test from 'node:test';import assert from 'node:assert/strict';
import {createState} from './setup.mjs';
import * as core from '../web/core.mjs';

const skills={arcana:50,lore:50,alchemy:50,charm:50,vigor:50,guile:50};
const KIT={ward:1,shadowstep:1,brace:1,reflect:1,mend:1,flame:1};
// A duel: `me` (side 0 or 1) holds `mine`, the other side `theirs`; `leader` commits first.
function duel(mine,theirs,{me=0,leader=0,...opts}={}){
 const kits=me===0?[mine,theirs]:[theirs,mine];
 return createState({playerKit:{skills,spells:kits[0]},opponentKit:{skills,spells:kits[1]},firstLeader:leader,...opts});
}
// One exchange: my move and theirs, in commitment order.
function play(s,me,mine,theirs){for(let i=0;i<2&&!s.result;i++){const side=core.actorToMove(s);core.applyChoice(s,side===me?mine:theirs);}}
// Every actor side and commitment order.
const ORDERS=[[0,0],[0,1],[1,0],[1,1]];
const hp=(s,side)=>s.actors[side].hp;
// A state edited by hand, as a fresh object so the core loads it.
const edit=(s,f)=>{const t=structuredClone(s);f(t);return t;};

test('Impulse, Parry and Refocus keep their ids under their new names; Breaking Free is a basic',()=>{
 assert.equal(core.label('strike'),'Impulse');assert.equal(core.label('guard'),'Parry');assert.equal(core.label('reclaim'),'Refocus');
 assert.equal(core.label('break_free'),'Breaking Free');assert.equal(core.label('purify'),'Distill');
 assert.match(core.describe(duel(KIT,KIT),0,'strike'),/Impact damage/);
});

test('Parry stops Impact and halves spells; Ward the reverse; Brace takes 80% off both for two exchanges, never Omen',()=>{
 for(const [me,leader]of ORDERS){
  let s=duel(KIT,{...KIT,omen:1},{me,leader});
  play(s,me,'guard','strike');assert.equal(hp(s,me),70,'Parry stops an Impulse');
  play(s,me,'ward','flame');assert.equal(hp(s,me),70,'Ward stops Flame');
  play(s,me,'brace','flame');assert.equal(hp(s,me),66,'Brace: 20 → 4');
  play(s,me,'reclaim','strike');assert.equal(hp(s,me),64,'Brace, second exchange: 9 → 2');
  play(s,me,'reclaim','strike');assert.equal(hp(s,me),55,'Brace is over');
  s=duel({...KIT,brace:1},{...KIT,omen:1},{me,leader});
  play(s,me,'reclaim','omen');play(s,me,'reclaim','reclaim');play(s,me,'brace','reclaim');
  assert.equal(hp(s,me),50,'Omen gets past Brace');
 }
});

test('Wildfire: the cast does what a Hold does; the heat grows 2, 4, 6; the Release is one hit Ward halves',()=>{
 for(const [me,leader]of ORDERS){
  const s=duel({wildfire:1},KIT,{me,leader});
  play(s,me,'wildfire','reclaim');assert.deepEqual([hp(s,me),hp(s,1-me)],[68,55]);assert.equal(s.actors[me].channel.bank,15);
  play(s,me,'hold','reclaim');assert.deepEqual([hp(s,me),hp(s,1-me)],[64,40]);assert.equal(s.actors[me].channel.bank,30);
  assert.match(core.describe(s,me,'hold'),/6 to yourself/);
  play(s,me,'release','ward');assert.equal(hp(s,1-me),40-23,'45 through Ward: 23');
 }
});

test('Hoarfrost cancels Wildfire, its self-burn included',()=>{
 for(const [me,leader]of ORDERS){
  const s=duel({wildfire:1},{hoarfrost:1},{me,leader});
  play(s,me,'wildfire','hoarfrost');assert.deepEqual([hp(s,me),hp(s,1-me)],[70,70]);
 }
});

test('Omen: 20 at t+2 and 20 at t+3; Ward or Shadowstep keeps it off; casts due the same exchange land as one hit',()=>{
 for(const [me,leader]of ORDERS){
  let s=duel({omen:1},KIT,{me,leader});
  play(s,me,'omen','reclaim');assert.deepEqual(s.actors[me].omens.map(o=>[o.due,o.power]),[[3,20],[4,20]]);
  play(s,me,'omen','reclaim');assert.deepEqual(s.actors[me].omens.map(o=>[o.due,o.power]),[[3,20],[4,40],[5,20]]);
  play(s,me,'reclaim','guard');assert.equal(hp(s,1-me),60,'Parry halves an arriving Omen');
  play(s,me,'reclaim','ward');assert.equal(hp(s,1-me),60,'Ward stops the combined 40');
  s=duel({omen:1},KIT,{me,leader});
  play(s,me,'omen','ward');assert.equal(s.actors[me].omens.length,0,'Ward keeps the application off');
  play(s,me,'omen','shadowstep');assert.equal(s.actors[me].omens.length,0,'so does a Shadowstep cast this exchange');
 }
});

test('Reflect: this exchange, hostile spells and spell damage go back, scheduled ones too; never Impact; nothing bounces twice',()=>{
 for(const [me,leader]of ORDERS){
  let s=duel(KIT,{...KIT,omen:1},{me,leader});
  play(s,me,'reflect','flame');assert.deepEqual([hp(s,me),hp(s,1-me)],[70,50]);
  play(s,me,'reflect','strike');assert.equal(hp(s,me),61,'Impact is not reflected');
  play(s,me,'reflect','omen');assert.equal(s.actors[1-me].omens.length,0);assert.equal(s.actors[me].omens.length,2,'the Omen comes back on its caster');
  assert(s.actors[me].omens.every(o=>o.bounced));
  s=duel(KIT,{...KIT,omen:1},{me,leader});
  play(s,me,'reclaim','omen');play(s,me,'reclaim','reclaim');play(s,me,'reflect','reclaim');
  assert.deepEqual([hp(s,me),hp(s,1-me)],[70,50],'an arriving Omen hit is returned');
 }
});

test('Venom: ticks this exchange and the next, before Mend, past Ward; nothing cures it; a mature Lodestar alone stops a tick',()=>{
 for(const [me,leader]of ORDERS){
  let s=duel({...KIT,purify:1},{venom:1},{me,leader});
  s=edit(s,t=>{t.actors[me].hp=50;});
  play(s,me,'mend','venom');assert.equal(hp(s,me),44,'the first tick spoils Mend');
  play(s,me,'ward','reclaim');assert.equal(hp(s,me),38,'the second gets past Ward');
  play(s,me,'mend','reclaim');assert.equal(hp(s,me),56,'then Mend heals (18)');
  s=duel({...KIT,purify:1},{venom:1},{me,leader});
  play(s,me,'purify','venom');assert.ok(s.actors[me].effects.poison,'Distill no longer cures');
  s=duel({...KIT,purify:1},{venom:1},{me,leader});
  play(s,me,'ward','venom');assert.ok(!s.actors[me].effects.poison,'Ward keeps the bite off');
 }
});

test('Bind: from the next exchange, Breaking Free only; it keeps a new Bind off; the casting exchange plays as committed',()=>{
 for(const [me,leader]of ORDERS){
  let s=duel(KIT,{web:1,threads:1,flame:1},{me,leader});
  play(s,me,'strike','web');assert.equal(hp(s,1-me),61,'the Impulse of the casting exchange lands');
  assert.deepEqual(core.legalActions(s,me),['break_free']);
  play(s,me,'break_free','web');assert(core.legalActions(s,me).includes('strike'),'Web binds one exchange (creature pass 1; was 2), and the recast while Breaking Free was kept off');
  s=duel(KIT,{web:1,threads:1},{me,leader});
  play(s,me,'ward','threads');assert(core.legalActions(s,me).includes('strike'),'Ward keeps it off');
  play(s,me,'reflect','threads');assert.deepEqual(core.legalActions(s,1-me),['break_free'],'Reflect binds its caster');
 }
});

test('Bramble: 4 spell damage and Bind 1 for 12 Mana; Ward and Shadowstep stop both, Reflect returns both',()=>{
 for(const [me,leader]of ORDERS){
  let s=duel({bramble:1},KIT,{me,leader});
  assert.equal(core.cost(s,me,'bramble'),12);
  play(s,me,'bramble','guard');assert.equal(hp(s,1-me),68,'Parry halves the damage; the Bind still lands');
  assert.deepEqual(core.legalActions(s,1-me),['break_free']);
  s=duel({bramble:1},KIT,{me,leader});
  play(s,me,'bramble','ward');assert.equal(hp(s,1-me),70,'Ward: no damage');assert(core.legalActions(s,1-me).includes('strike'),'and no Bind');
  s=duel({bramble:1},KIT,{me,leader});
  play(s,me,'bramble','shadowstep');assert.equal(hp(s,1-me),70,'Shadowstep: evaded');assert(core.legalActions(s,1-me).includes('strike'),'and no Bind');
  s=duel({bramble:1},KIT,{me,leader});
  play(s,me,'bramble','reflect');assert.equal(hp(s,me),66,'Reflect: the thorns turn on their caster');assert.deepEqual(core.legalActions(s,me),['break_free'],'and so does the Bind');
  assert.equal(hp(s,1-me),70);
 }
});

test('Refocus gathers all the flux, which is 2/3 of the Mana spent, and nothing more',()=>{
 for(const [me,leader]of ORDERS){
  const s=duel(KIT,KIT,{me,leader}),full=s.actors[me].resources.mana;
  play(s,me,'flame','guard');assert.equal(s.actors[me].resources.mana,full-10);assert(Math.abs(s.actors[me].flux-20/3)<1e-9,'Flame 10: flux 6⅔');
  play(s,me,'ward','guard');assert(Math.abs(s.actors[me].flux-(20+14)/3)<1e-9,'Ward 7: flux + 4⅔');
  play(s,me,'reclaim','guard');assert(Math.abs(s.actors[me].resources.mana-(full-17+34/3))<1e-9,'Refocus: 2/3 of the 17 spent comes back');assert.equal(s.actors[me].flux,0);
  play(s,me,'reclaim','guard');assert(Math.abs(s.actors[me].resources.mana-(full-17+34/3))<1e-9,'a second Refocus gathers nothing');
 }
});

test('The Long Wait: 24 spell and 24 Impact together in three exchanges; Ward stops one half and halves the other',()=>{
 for(const [me,leader]of ORDERS){
  let s=duel({the_long_wait:1},KIT,{me,leader});
  play(s,me,'the_long_wait','reclaim');play(s,me,'reclaim','reclaim');play(s,me,'reclaim','reclaim');
  play(s,me,'reclaim','ward');assert.equal(hp(s,1-me),58,'24 stopped, 24 → 12');
  s=duel({the_long_wait:1},KIT,{me,leader});
  play(s,me,'the_long_wait','reclaim');play(s,me,'reclaim','reclaim');play(s,me,'reclaim','reclaim');
  play(s,me,'reclaim','guard');assert.equal(hp(s,1-me),22,'Parry touches neither half');
  s=duel({the_long_wait:1},KIT,{me,leader});
  play(s,me,'the_long_wait','reclaim');play(s,me,'reclaim','reclaim');play(s,me,'reclaim','reclaim');
  play(s,me,'reclaim','reflect');assert.deepEqual([hp(s,me),hp(s,1-me)],[46,46],'the silk returns, the force lands');
 }
});

test('Acorns: 8 now and 8 next exchange for 6 Mana, each met by its own exchange\'s defences',()=>{
 for(const [me,leader]of ORDERS){
  const s=duel({acorns:1},KIT,{me,leader});
  assert.equal(core.cost(s,me,'acorns'),6);
  play(s,me,'acorns','reclaim');assert.equal(hp(s,1-me),62);
  play(s,me,'reclaim','ward');assert.equal(hp(s,1-me),62,'Ward stops the second');
 }
});

test('Tailwind: an Impulse\'s 9 Impact, +15 each consecutive cast, for 4 Mana +1 each; any other move starts both over',()=>{
 for(const [me,leader]of ORDERS){
  const s=duel({tailwind:1,ward:1},{...KIT,mend:1},{me,leader});
  assert.equal(core.cost(s,me,'tailwind'),4);
  play(s,me,'tailwind','reclaim');assert.equal(hp(s,1-me),61,'9, as an Impulse');assert.equal(core.cost(s,me,'tailwind'),5);
  play(s,me,'tailwind','reclaim');assert.equal(hp(s,1-me),37,'then 24');assert.equal(core.cost(s,me,'tailwind'),6);
  play(s,me,'tailwind','guard');assert.equal(hp(s,1-me),37,'Parry stops the 39, and the chain still grows');assert.equal(core.cost(s,me,'tailwind'),7);
  play(s,me,'tailwind','reclaim');assert.equal(hp(s,1-me),0,'54');
  const t=duel({tailwind:1,ward:1},{...KIT,mend:1},{me,leader});
  play(t,me,'tailwind','reclaim');play(t,me,'ward','mend');assert.equal(core.cost(t,me,'tailwind'),4,'the cost starts over too');
  play(t,me,'tailwind','reclaim');assert.equal(hp(t,1-me),61,'healed 18 to full, then 9 again');
 }
});

test('Haste: 7 Mana, 2/3/4 exchanges; an action that throws no Impulse parries for free, under fatigue but not counted for it',()=>{
 for(const [me,leader]of ORDERS){
  let s=duel({haste:2,ward:1,flame:1},KIT,{me,leader});
  assert.equal(core.cost(s,me,'haste'),7);
  play(s,me,'haste','strike');assert.equal(hp(s,me),61,'its own first cast: no Parry yet');
  play(s,me,'flame','strike');assert.equal(hp(s,me),61,'Flame + a free Parry: the Impulse is stopped');assert.equal(hp(s,1-me),50);
  play(s,me,'reclaim','flame');assert.equal(hp(s,me),51,'Refocus + a free Parry halves Flame');
  play(s,me,'ward','strike');assert.equal(hp(s,1-me),41,'Ward throws an Impulse instead, so no Parry: Ward halves the blow');assert.equal(hp(s,me),46);
  play(s,me,'strike','strike');assert(!core.has(s,me,'haste'),'rank II: three exchanges');assert.equal(hp(s,me),37,'Haste over: no free Parry');
  // The free Parry doesn't tire a chosen Parry next exchange; a chosen Parry tires the free one.
  s=duel({haste:2,ward:1,flame:1},KIT,{me,leader});
  play(s,me,'haste','reclaim');play(s,me,'flame','reclaim');play(s,me,'guard','strike');assert.equal(hp(s,me),70,'a full Parry after a free one');
  play(s,me,'reclaim','strike');assert.equal(hp(s,me),65,'the free Parry after a chosen one leaks half');
 }
});

test('Haste (Countertempo): the next exchanges, a spell without damage of its own adds an Impulse; never a basic or its own first cast',()=>{
 for(const [me,leader]of ORDERS){
  const s=duel({haste:2,ward:1,flame:1,shadowstep:1},KIT,{me,leader});
  play(s,me,'haste','reclaim');assert.equal(hp(s,1-me),70,'the first cast doesn\'t trigger itself');
  play(s,me,'ward','reclaim');assert.equal(hp(s,1-me),61,'Ward and an Impulse');
  play(s,me,'flame','reclaim');assert.equal(hp(s,1-me),41,'Flame deals its own damage: no Impulse');
  play(s,me,'shadowstep','strike');assert.equal(hp(s,me),61,'the Impulse breaks the new Shadowstep before the hits');
 }
});

test('Shadowstep lasts 1/2/3 exchanges by rank, including the cast, and keeps Compel off',()=>{
 for(const r of [1,2,3]){const s=duel({shadowstep:r},KIT);play(s,0,'shadowstep','reclaim');let n=1;while(n<5&&core.has(s,0,'shadowstep')){play(s,0,'guard','reclaim');n++;}assert.equal(n,r,'rank '+r);}
 const s=duel({...KIT,shadowstep:2},{compel:1,ward:1});
 play(s,0,'shadowstep','guard');play(s,0,'guard','compel');
 assert(!core.has(s,0,'compelled'),'Shadowstep blocks Compel');
});

test('Compel: captures this exchange\'s move, which plays; then forces it three exchanges; Ward keeps it off; Reflect turns it back',()=>{
 for(const [me,leader]of ORDERS){
  let s=duel(KIT,{compel:1,ward:1,reflect:1},{me,leader});
  play(s,me,'reclaim','guard');
  play(s,me,'strike','compel');assert.equal(hp(s,1-me),61,'the captured Impulse plays as usual');
  for(let i=0;i<3;i++){assert.deepEqual(core.legalActions(s,me),['strike'],'forced '+(i+1));play(s,me,'strike','guard');}
  assert(core.legalActions(s,me).length>1,'free after three');
  s=duel(KIT,{compel:1,ward:1},{me,leader});
  play(s,me,'reclaim','guard');play(s,me,'ward','compel');assert(!core.has(s,me,'compelled'));
  s=duel({...KIT,compel:1},{compel:1,reflect:1,ward:1},{me,leader});
  play(s,me,'reclaim','guard');play(s,me,'compel','reflect');assert(core.has(s,me,'compelled'),'its caster is compelled');
  assert.equal(s.actors[me].compelAction,'compel');
 }
});

test('Compel: a captured move that can\'t be played is a lost turn (Hold after the channel, Breaking Free once free)',()=>{
 for(const [me,leader]of ORDERS){
  let s=duel({starlight:1,ward:1},{compel:1,ward:1},{me,leader});
  play(s,me,'starlight','guard');play(s,me,'release','compel');
  assert.deepEqual(core.legalActions(s,me),['cancel'],'Release captured, not channelling: lost');
  s=duel(KIT,{compel:1,threads:1,ward:1},{me,leader});
  play(s,me,'reclaim','threads');play(s,me,'break_free','compel');
  assert.deepEqual(core.legalActions(s,me),['cancel'],'Breaking Free captured: no free bind immunity once free');
 }
});

test('Torment: 2× the ready Mana each move pays, Holds included, past Ward; Ward keeps the curse off',()=>{
 for(const [me,leader]of ORDERS){
  let s=duel({starlight:1,flame:1,ward:1},{torment:1,ward:1},{me,leader});
  play(s,me,'flame','torment');assert.equal(hp(s,me),50,'Flame paid 10: 20 HP');
  play(s,me,'starlight','reclaim');assert.equal(hp(s,me),32,'Starlight paid 9: 18');
  play(s,me,'hold','reclaim');assert.equal(hp(s,me),28,'a Hold paid 2: 4');
  s=duel({flame:1,ward:1},{torment:1,ward:1},{me,leader});
  play(s,me,'ward','torment');play(s,me,'flame','reclaim');assert.equal(hp(s,me),70);
 }
});

test('Lodestar: one at a time; on its seventh exchange it negates all damage, the toll and poison too, and heals 20',()=>{
 for(const [me,leader]of ORDERS){
  let s=duel({lodestar:1,ward:1,flame:1},{flame:1,venom:1,torment:1,ward:1},{me,leader});
  play(s,me,'lodestar','torment');assert.equal(core.available(s,me,'lodestar'),'A Lodestar is already rising');
  s=edit(s,t=>{t.actors[me].hp=40;t.actors[1-me].resources.mana=43;});
  for(let i=0;i<5;i++)play(s,me,'ward','reclaim');
  play(s,me,'reclaim','venom');const before=hp(s,me);
  play(s,me,'flame','flame');
  assert.equal(hp(s,me),Math.min(70,before+20),'the mature star: nothing gets through, then it heals 20');
  assert(!core.available(s,me,'lodestar'),'it can be cast again after maturity');
 }
});

test('Lodestar holds a quiet fight open until it matures',()=>{
 let s=duel({lodestar:1,ward:1},{ward:1},{leader:0});
 s=edit(s,t=>{t.actors[0].hp=50;});
 play(s,0,'lodestar','ward');for(let i=0;i<7&&!s.result;i++)play(s,0,'guard','guard');
 assert.equal(hp(s,0),70,'healed: no decision on points came first');
});

test('Rime: one cast a fight; Heartprice allows its rescue but no other healing; it can\'t be repeated',()=>{
 let s=duel({rime:1,heartprice:1,mend:1,ward:1},{flame:1,ward:1});
 play(s,0,'rime','reclaim');assert.equal(core.available(s,0,'rime'),'Once a fight');
 s=edit(s,t=>{t.actors[0].hp=30;t.actors[0].resources.mana=20;});
 play(s,0,'heartprice','reclaim');assert.equal(hp(s,0),50,'all ready Mana became HP');assert.equal(s.actors[0].resources.mana,0);
 assert.equal(core.available(s,0,'heartprice'),'Already paid');
 s=edit(s,t=>{t.actors[0].hp=12;});
 s=edit(s,t=>{t.actors[0].resources.mana=20;});
 play(s,0,'mend','reclaim');assert.equal(hp(s,0),12,'Mend heals nothing under Heartprice');
 play(s,0,'reclaim','flame');assert.equal(hp(s,0),24,'Rime\'s rescue still works');
});

test('Eclipse: for three exchanges, damage taken becomes as much ready Mana',()=>{
 const s=duel({eclipse:1,ward:1},{flame:1,ward:1});
 s.actors[0].resources.mana=10;const t=structuredClone(s);
 play(t,0,'eclipse','flame');assert.equal(t.actors[0].resources.mana,10-6+20);
 play(t,0,'reclaim','flame');assert.equal(t.actors[0].resources.mana,43,'24 + 20, capped at capacity');
 play(t,0,'reclaim','reclaim');play(t,0,'reclaim','flame');assert.equal(t.actors[0].resources.mana,43,'over after three exchanges');
});

test('Glamour, Rapport and Sleight pay in tranches: full, half rounded up, then nothing; no audience spends no tranche',()=>{
 let s=duel({glamour:1,rapport:1,sleight:1,ward:1},{ward:1},{observers:true});
 for(let i=0;i<3;i++)play(s,0,'glamour','guard');assert.equal(s.actors[0].pendingRenown,6,'4 + 2');
 const crowns=s.actors[0].resources.crowns;
 for(let i=0;i<3;i++)play(s,0,'rapport','guard');assert.equal(s.actors[0].pendingRenown,6+12,'8 + 4');
 assert.equal(s.actors[0].resources.crowns,crowns-20,'10 Crowns a paying cast, none for nothing');
 s=edit(s,t=>{t.actors[1].resources.crowns=30;t.actors[0].resources.mana=43;});
 for(let i=0;i<3;i++)play(s,0,'sleight','guard');assert.equal(s.actors[1].resources.crowns,30-15-8);
 s=duel({glamour:1,ward:1},{ward:1},{observers:false});
 play(s,0,'glamour','guard');assert.deepEqual(s.actors[0].tranches,[0,0,0],'no audience: no tranche spent');
});

test('the same-exchange order of a fresh defence against a hostile spell doesn\'t depend on side or commitment order',()=>{
 for(const [me,leader]of ORDERS)for(const [def,spell]of [['shadowstep','extraction'],['shadowstep','seal'],['reflect','extraction'],['shadowstep','threads']]){
  let s=duel(KIT,{extraction:1,seal:1,threads:1,flame:1},{me,leader});
  s=edit(s,t=>{t.actors[me].flux=10;});
  const mana=s.actors[me].resources.mana,flux=s.actors[me].flux;
  play(s,me,def,spell);
  assert(s.actors[me].resources.mana>=mana-12&&s.actors[me].flux>=flux-0.001||def==='reflect',`${def} vs ${spell}, side ${me}, leader ${leader}`);
  if(spell==='threads')assert(core.legalActions(s,me).length>1,'not bound');
 }
});

test('has() answers for every effect the core knows (the browser build panicked on Bound)',()=>{
 const s=duel(KIT,KIT);
 for(const k of ['guard','ward','brace','foreAim','haste','shadowstep','tailwind','reflect','torment','eclipse','heartprice','compelled','lodestar','bound','poison'])
  for(const side of [0,1])assert.equal(typeof core.has(s,side,k),'boolean',k);
 const t=duel(KIT,{threads:1});play(t,0,'guard','threads');assert(core.has(t,0,'bound'),'bound after Threads');
});
