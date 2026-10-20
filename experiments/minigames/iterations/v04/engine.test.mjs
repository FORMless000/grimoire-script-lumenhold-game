import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,cloneState,applyChoice,actorToMove,legalActions,available,amount,attackPower,cost,describe,has,basicBundles,finish,concede,SPELLS,generateLoadout,FLUX_RATIO} from './engine.mjs';
// Controlled amount tests: skill 50, physical scale 1, and an explicit 200-Mana
// capacity. Generated encounter kits retain their normal 1–100 skills/capacities.
function state(options={}){const s=createState({spellAccess:'all',healthModel:'direct',combatScale:1,damageMultiplier:1,playerResources:{health:100},...options});for(const a of s.actors){a.kit=structuredClone(a.kit);for(const k of Object.keys(a.kit.skills))a.kit.skills[k]=50;a.kit.capacity=200;a.entry.mana=200;a.resources.mana=200;}return s;}
function play(s,left,right='reclaim'){const pair=[left,right];applyChoice(s,pair[actorToMove(s)]);return applyChoice(s,pair[actorToMove(s)]);}
const close=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('roster has 24 named spells, five hidden entries, six forbidden; only courses have levels',()=>{
 assert.equal(Object.keys(SPELLS).length,35);assert.equal(Object.values(SPELLS).filter(x=>x.levels===3).length,6);
 assert.equal(Object.values(SPELLS).filter(x=>x.group==='forbidden').length,6);assert.equal(SPELLS.purify.name,'Distil');assert.equal(SPELLS.ward.skills.length,0);
 assert.deepEqual(SPELLS.animate.skills,['alchemy','arcana']);assert.deepEqual(SPELLS.flame.learnXP,[{skill:'arcana',amounts:[6,10,16]}]);
 for(const level of [20,50,80]){const a=generateLoadout('Duellist',level,'all');assert.deepEqual(a,generateLoadout('Duellist',level,'all'));for(const [id,r]of Object.entries(a.spells))assert.equal(r,SPELLS[id].levels===3?1+Math.floor((level-1)/35):1);}
 for(const obsolete of ['tide','restoration','shape','hush','attune'])assert(!SPELLS[obsolete]);
});
test('all 34 castable spells are legal and finite; Toll remains story-only',()=>{
 for(const id of Object.keys(SPELLS)){
  const s=state();if(id==='toll'){assert(!legalActions(s).includes(id));assert.match(available(s,0,id),/story/);continue;}
  assert(legalActions(s,0).includes(id),id);play(s,id);
  if(s.actors[0].channel){play(s,'hold');play(s,'release');}
  for(const a of s.actors){assert(Number.isFinite(a.hp));assert(a.resources.mana>=0);assert(a.resources.mana<=a.kit.capacity);}
 }
});
test('skill scales amounts once, Animate averages two skills, and counts/costs stay fixed',()=>{
 const s=state();s.actors[0].kit.skills.arcana=100;s.actors[0].kit.skills.alchemy=0;
 close(amount(s,0,'flame',8),10);close(amount(s,0,'animate',10),10);assert.equal(cost(s,0,'ward'),9);
 assert.equal(SPELLS.foresight.duration[1],4);assert.equal(SPELLS.shadowstep.duration[1],2);
});
test('no exchange limit or passive-repeat draw; a structural inability to damage draws',()=>{
 const s=state();for(let n=0;n<25;n++)play(s,'guard','guard');assert.equal(s.round,26);assert.equal(s.result,null);
 const t=state();for(const a of t.actors){a.kit={...a.kit,spells:{}};a.constructs=[{id:'heartwood',power:0,reduction:1000,threshold:1000,taken:0}];}
 play(t,'guard','guard');assert.equal(t.result.outcome,'draw');assert.equal(t.result.reason,'stalemate');
 concede(s,0);assert.equal(s.result.winner,1);assert.equal(s.result.reason,'conceded');
});
test('a free Heartprice can unlock damage after Mana is exhausted, preventing a false draw',()=>{
 const s=state();for(const a of s.actors){a.resources.mana=0;a.kit.spells={heartprice:1,torment:1};a.constructs=[{id:'heartwood',power:0,reduction:1000,threshold:1000,taken:0}];}
 play(s,'guard','guard');assert.equal(s.result,null);play(s,'heartprice','heartprice');play(s,'torment','torment');assert(s.actors.every(a=>a.hp<100));
});
test('Guard blocks two thirds of physical and one third of spell damage',()=>{
 const s=state();play(s,'strike','guard');assert.equal(s.actors[1].hp,97);
 const t=state();play(t,'flame','guard');assert.equal(t.actors[1].hp,88);
});
test('Ward costs nine Mana and Starlight pierces one third',()=>{
 const s=state();play(s,'flame','ward');assert.equal(s.actors[1].hp,100);assert.equal(s.actors[1].spent.mana,9);
 const t=state();play(t,'starlight');play(t,'release','ward');assert.equal(t.actors[1].hp,91);
 const u=state();play(u,'starlight');play(u,'hold');play(u,'release','ward');assert.equal(u.actors[1].hp,87);
});
test('two-thirds flux, Seal, Reclaim and settlement preserve the resource ledger',()=>{
 const s=state();play(s,'flame');close(s.actors[0].flux,cost(s,0,'flame')*FLUX_RATIO);
 play(s,'reclaim');close(s.actors[0].resources.mana,200-cost(s,0,'flame')/3);assert.equal(s.actors[0].flux,0);
 play(s,'flame','seal');assert.equal(s.actors[0].flux,0);
 finish(s,'draw','test');for(const ledger of s.settlement)for(const [k,row]of Object.entries(ledger)){close(row.before,row.entry-row.spent+row.restored);if(row.refund)assert(row.final<=row.entry);if(['crowns','alignment'].includes(k))assert.equal(row.refund,0);}
});
test('Foresight forces 3/4/5 exchanges beginning next exchange; opposing effects alternate',()=>{
 for(const [i,level]of [20,50,80].entries()){
  const s=state({playerLevel:level});play(s,'foresight');assert.equal(s.earlyCommit[1],3+i);
  for(let n=3+i;n>0;n--){assert.equal(actorToMove(s),1);play(s,'guard','guard');}assert.deepEqual(s.earlyCommit,[0,0]);
 }
 const t=state();play(t,'foresight','foresight');for(let n=0;n<4;n++){assert.equal(t.leader,t.normalLeader);play(t,'guard','guard');}
});
test('Haste supplies one public basic bundle; repeated Guard/Reclaim add nothing',()=>{
 const s=state({playerLevel:80});play(s,'haste');assert.equal(s.actors[0].hp,100);assert.equal(legalActions(s,0).length,basicBundles(3).length);
 assert(!legalActions(s,0).includes('flame'));assert(legalActions(s,0).includes('bundle:strike+strike+strike'));
 play(s,'bundle:strike+strike+strike','ward');assert.equal(s.actors[1].hp,100);assert(!has(s,0,'haste'));
 assert(basicBundles(3).includes('bundle:guard'));assert(!basicBundles(3).some(id=>id.includes('guard+guard')));
});
test('Shadowstep counts the casting exchange, evades every hit, and breaks on damage or actual Mana recovery',()=>{
 const s=state();play(s,'shadowstep','flame');assert.equal(s.actors[0].hp,100);assert(has(s,0,'shadowstep'));
 play(s,'strike','flame');assert.equal(s.actors[0].hp,100);assert(!has(s,0,'shadowstep'));
 const t=state();play(t,'shadowstep','guard');play(t,'reclaim','guard');assert(!has(t,0,'shadowstep'));
 const u=state({playerLevel:80});play(u,'shadowstep','guard');u.actors[0].flux=0;u.actors[0].resources.mana=u.actors[0].kit.capacity;
 play(u,'reclaim','flame');assert.equal(u.actors[0].hp,100);assert(!has(u,0,'shadowstep'));
});
test('Reclaim breaks Shadowstep before incoming attacks in either seat and commitment order',()=>{
 for(const side of [0,1])for(const firstLeader of [0,1])for(const attack of ['strike','flame']){
  const s=state({playerLevel:80,firstLeader}),pair=['guard','guard'];pair[side]='shadowstep';play(s,...pair);
  const a=s.actors[side],mana=a.resources.mana,flux=a.flux,power=attackPower(s,1-side,attack);
  pair[side]='reclaim';pair[1-side]=attack;play(s,...pair);
  assert.equal(a.hp,100-power);assert(!has(s,side,'shadowstep'));
  close(a.resources.mana,mana+flux);assert.equal(a.flux,0);
 }
});
test('empty or capacity-capped Reclaim retains Shadowstep against same-exchange damage',()=>{
 for(const blocked of ['empty','full','sealed']){
  const s=state({playerLevel:80});play(s,'shadowstep','guard');
  if(blocked==='empty')s.actors[0].flux=0;
  if(blocked==='full')s.actors[0].resources.mana=s.actors[0].kit.capacity;
  if(blocked==='sealed')s.actors[1].constructs=[{id:'bramble',power:2,reduction:0,threshold:100,taken:0}];
  play(s,'reclaim',blocked==='sealed'?'seal':'flame');
  assert.equal(s.actors[0].hp,100);assert(!has(s,0,'shadowstep'));
 }
});
test('Haste Reclaim bundle exposes Shadowstep while preserving Guard and late Mana payout',()=>{
 const s=state({playerLevel:80});play(s,'shadowstep','guard');play(s,'haste','guard');
 const a=s.actors[0],hp=a.hp,mana=a.resources.mana,flux=a.flux;
 play(s,'bundle:guard+reclaim','flame');
 assert.equal(a.hp,hp-Math.ceil(attackPower(s,1,'flame')*2/3));assert(!has(s,0,'shadowstep'));close(a.resources.mana,mana+flux);
 const t=state({playerLevel:80});play(t,'shadowstep','guard');t.actors[0].hp=1;
 play(t,'reclaim','flame');assert.equal(t.result.winner,1);assert.equal(t.actors[0].hp,0);
});
test('channels are public starts, unbounded Holds or Release, never other actions',()=>{
 const s=state();play(s,'starlight');assert.deepEqual(legalActions(s,0),['hold','release']);
 assert.throws(()=>play(s,'strike'),/Illegal/);for(let i=0;i<10;i++)play(s,'hold','guard');assert.equal(s.actors[0].channel.holds,10);
 assert.equal(s.result,null);play(s,'release');assert.equal(s.actors[0].channel,null);assert.equal(s.actors[1].hp,62);
});
test('Moonwell banks until Release; Lodestar consumes an absorb pool across hits',()=>{
 const s=state();s.actors[0].resources.mana=20;play(s,'moonwell');play(s,'hold');play(s,'hold');assert.equal(s.actors[0].resources.mana,20);play(s,'release');assert.equal(s.actors[0].resources.mana,32);
 const t=state();play(t,'lodestar');play(t,'hold');play(t,'release','strike');assert.equal(t.actors[0].hp,100);assert.equal(t.actors[0].effects.lodestar.value,24);play(t,'guard','flame');assert.equal(t.actors[0].hp,100);close(t.actors[0].effects.lodestar.value,12);play(t,'reclaim','flame');assert.equal(t.actors[0].hp,94);assert(!t.actors[0].effects.lodestar);
});
test('Hoarfrost cancels Flame and a Wildfire Hold including its self-damage',()=>{
 const s=state();play(s,'hoarfrost','flame');assert.deepEqual(s.actors.map(a=>a.hp),[100,100]);
 const t=state();play(t,'wildfire');play(t,'hold','hoarfrost');assert.deepEqual(t.actors.map(a=>a.hp),[100,100]);
 play(t,'release','hoarfrost');assert.deepEqual(t.actors.map(a=>a.hp),[100,100]);
});
test('Wildfire Hold and Release have fixed costs and separate self damage',()=>{
 const s=state();play(s,'wildfire');play(s,'hold');assert.equal(s.actors[0].hp,98);assert.equal(s.actors[1].hp,88);play(s,'release');assert.equal(s.actors[1].hp,62);assert.equal(s.actors[0].spent.mana,10);
});
test('Brace fades 2/1/1 on every hit including Wildfire self-damage',()=>{
 const s=state();play(s,'brace','flame');assert.equal(s.actors[0].hp,100);play(s,'wildfire','flame');assert.equal(s.actors[0].hp,84);play(s,'hold','flame');assert.equal(s.actors[0].hp,66);play(s,'hold','flame');assert.equal(s.actors[0].hp,48);play(s,'hold','flame');assert.equal(s.actors[0].hp,28);
});
test('constructs act immediately and end on damage or their final lifetime tick',()=>{
 const s=state();play(s,'animate');assert.equal(s.actors[1].hp,94);assert.equal(s.actors[0].constructs[0].threshold,40);play(s,'guard','flame');assert.equal(s.actors[0].hp,89);play(s,'reclaim','flame');assert.equal(s.actors[0].constructs.length,1);assert.equal(s.actors[1].hp,82);play(s,'reclaim','flame');assert.equal(s.actors[0].constructs.length,0);assert.equal(s.actors[1].hp,82);
 const t=state();play(t,'animate');for(let i=0;i<3;i++)play(t,'guard');assert.equal(t.actors[1].hp,76);assert.equal(t.actors[0].constructs.length,0);play(t,'guard');assert.equal(t.actors[1].hp,76);
});
test('Heartwood and Bramble coexist; replacing Contraption bursts on both sides',()=>{
 const s=state();play(s,'heartwood');play(s,'bramble');assert.deepEqual(s.actors[0].constructs.map(c=>c.id),['heartwood','bramble']);
 play(s,'animate');assert.deepEqual(s.actors[0].constructs.map(c=>c.id),['animate']);
 const t=state();play(t,'contraption');const hp=t.actors.map(a=>a.hp);play(t,'heartwood');assert.equal(t.actors[0].hp,hp[0]); // burst 4, new Heartwood reduction 2, then heal 2
 assert.equal(t.actors[1].hp,hp[1]-4);
});
test('Omen is public and lands two exchanges later; Ward can meet it',()=>{
 const s=state();play(s,'omen');assert.equal(s.actors[0].omens[0].due,3);play(s,'guard');assert.equal(s.actors[1].hp,100);
 play(s,'guard','ward');assert.equal(s.actors[1].hp,100);assert.equal(s.actors[0].omens.length,0);
 const t=state();play(t,'omen');play(t,'guard');play(t,'guard');assert.equal(t.actors[1].hp,70);
});
test('Glamour/Rapport require observers, earn Renown at settlement; theft is a transfer',()=>{
 const s=state({observers:true});play(s,'glamour');assert.equal(s.actors[0].resources.renown,30);play(s,'rapport');assert.equal(s.actors[0].resources.crowns,20);
 play(s,'sleight');assert.equal(s.actors[0].resources.crowns,25);assert.equal(s.actors[1].resources.crowns,25);assert.equal(s.actors[0].resources.alignment,-3);
 finish(s,'draw','test');assert.equal(s.actors[0].resources.renown,38);assert.equal(s.settlement[0].renown.refund,0);assert.equal(s.settlement[0].crowns.refund,0);
 const t=state();play(t,'glamour');play(t,'rapport');assert.equal(t.actors[0].pendingRenown,0);assert.equal(t.actors[0].resources.crowns,30);
});
test('Distil trades unavoidable HP for ready Mana, including gain above entry and no rebate on gains',()=>{
 const s=state();s.actors[0].entry.mana=10;s.actors[0].resources.mana=10;play(s,'purify');assert.equal(s.actors[0].hp,91);assert.equal(s.actors[0].resources.mana,22);
 finish(s,'draw','test');assert.equal(s.settlement[0].mana.final,22);assert.equal(s.settlement[0].mana.refund,0);
});
test('simultaneous theft has no engine-seat advantage, and receiver capacity cannot destroy Crowns',()=>{
 const s=state();s.actors.forEach(a=>a.resources.crowns=1);play(s,'sleight','sleight');assert.deepEqual(s.actors.map(a=>a.resources.crowns),[1,1]);
 const t=state();t.actors[0].resources.crowns=99999;const before=t.actors[1].resources.crowns;play(t,'sleight');assert.equal(t.actors[1].resources.crowns,before);
});
test('each side brings its own Crowns rather than inheriting the other wallet',()=>{
 const s=createState({playerResources:{crowns:1}});assert.deepEqual(s.actors.map(a=>a.resources.crowns),[1,30]);
 const t=createState({resourceBudget:'depleted',opponentResources:{crowns:4}});assert.deepEqual(t.actors.map(a=>a.resources.crowns),[6,4]);
});
test('capped gains record actual collected flux and actual Renown awards',()=>{
 const s=state({observers:true});s.actors[0].pendingRenown=1000;s.actors[0].flux=20;finish(s,'draw','test');
 assert.equal(s.settlement[0].mana.fluxCollected,0);assert.equal(s.settlement[0].mana.fluxDiscarded,20);assert.equal(s.settlement[0].renown.earnedAtSettlement,70);assert.equal(s.settlement[0].renown.final,100);
});
test('Tailwind adds 3/6/9 to consecutive Strikes and ends on another action',()=>{
 const s=state();play(s,'tailwind');play(s,'strike');assert.equal(s.actors[1].hp,88);play(s,'strike');assert.equal(s.actors[1].hp,73);play(s,'strike');assert.equal(s.actors[1].hp,55);assert(!has(s,0,'tailwind'));
 const t=state();play(t,'tailwind');play(t,'guard');assert(!has(t,0,'tailwind'));
});
test('Rime rescues first knockout once, skips a whole exchange, and thaws',()=>{
 const s=state();s.actors[0].hp=5;play(s,'rime','flame');assert.equal(s.actors[0].hp,1);assert.deepEqual(legalActions(s,0),['frozen']);
 play(s,'frozen','flame');assert.equal(s.actors[0].hp,1);assert(legalActions(s,0).includes('guard'));
 play(s,'rime','flame');assert.equal(s.result.winner,1);assert(s.actors[0].rimeUsed);
});
test('Reflect blocks one spell action and returns half power without reflecting physical damage',()=>{
 const s=state();play(s,'flame','reflect');assert.deepEqual(s.actors.map(a=>a.hp),[91,100]);
 const t=state();play(t,'strike','reflect');assert.equal(t.actors[1].hp,91);
 const u=state();play(u,'reflect','reflect');assert.deepEqual(u.actors.map(a=>a.hp),[100,100]);
});
test('forbidden casts charge alignment and create witnessed post-fight reports; Holds do not recast',()=>{
 const s=state({observers:true});play(s,'siphon');play(s,'hold');assert.equal(s.actors[0].resources.alignment,-6);assert.equal(s.reports.length,1);
 play(s,'release');finish(s,'draw','test');assert.equal(s.result.followUps[0].type,'forbidden_cast_report');assert.equal(s.settlement[0].alignment.refund,0);
});
test('Siphon heals actual damage, Torment charges HP per action, Extraction transfers symmetrically',()=>{
 const s=state();s.actors[0].hp=60;play(s,'siphon');play(s,'hold');play(s,'release');assert.equal(s.actors[0].hp,76);
 const t=state();play(t,'torment','guard');assert.equal(t.actors[1].hp,92);play(t,'guard','guard');play(t,'guard','guard');assert.equal(t.actors[1].hp,76);play(t,'guard','guard');assert.equal(t.actors[1].hp,76);
 const u=state();u.actors[0].resources.mana=10;play(u,'extraction');assert.equal(u.actors[0].resources.mana,9);assert.equal(u.actors[1].resources.mana,193);
 const v=state();play(v,'extraction','extraction');assert.equal(v.actors[0].resources.mana,v.actors[1].resources.mana);
});
test('Compel repeats legal public history, cancels when absent, and lasts through next exchange',()=>{
 const s=state();play(s,'compel','flame');assert.equal(s.actors[0].hp,100);assert.equal(s.actors[1].spent.mana,0);
 const t=state();play(t,'guard','strike');const hp=t.actors[0].hp;play(t,'compel','ward');assert.equal(t.actors[0].hp,hp-9);play(t,'guard','flame');assert.equal(t.actors[1].spent.mana,0);play(t,'guard','flame');assert(t.actors[1].spent.mana>0);
});
test('Eclipse converts only actual next-exchange damage; Heartprice charges HP without flux',()=>{
 const s=state();s.actors[0].resources.mana=20;play(s,'eclipse');const mana=s.actors[0].resources.mana;play(s,'guard','flame');close(s.actors[0].resources.mana,mana+9); // floor(18 × 2/3 × .75)
 const t=state();play(t,'heartprice');const before=t.actors[0].resources.mana;play(t,'flame');assert.equal(t.actors[0].resources.mana,before);assert.equal(t.actors[0].hp,90);assert.equal(t.actors[0].flux,0);assert(has(t,0,'heartprice'));
 assert.deepEqual(JSON.parse(JSON.stringify(t)).actors[0].effects.heartprice.until,null);
});
test('mutual knockout still goes to the actual telegraphed actor, with both costs paid',()=>{
 for(const firstLeader of [0,1]){const s=state({firstLeader});s.actors.forEach(a=>a.hp=2);play(s,'flame','flame');assert.equal(s.result.winner,firstLeader);assert.equal(s.result.tiebreak,'telegraphed initiative');assert(s.actors.every(a=>a.spent.mana>0));}
});
test('search clones isolate all new mutable state',()=>{
 const s=state();play(s,'heartwood');play(s,'omen');const before=JSON.stringify(s),c=cloneState(s);c.actors[0].constructs[0].taken=999;c.actors[0].omens[0].power=0;c.actors[0].resources.mana=0;assert.equal(JSON.stringify(s),before);
});


test('global damage multiplier halves all damage sources, rounds up, and leaves prices/healing/shields unchanged',()=>{
 assert.equal(createState().config.damageMultiplier,1);
 for(const id of ['strike','flame','hoarfrost']){const s=state({damageMultiplier:.5});s.actors[0].kit.skills.arcana=47;s.actors[0].kit.skills.vigor=47;const expected=Math.ceil((id==='strike'?9:id==='flame'?18:16)*.985*.5);assert.equal(attackPower(s,0,id),expected);play(s,id);assert.equal(s.actors[1].hp,100-expected);assert.match(describe(s,0,id),new RegExp('Deal '+expected+' '));}
 const guard=state({damageMultiplier:.5});play(guard,'flame','guard');assert.equal(guard.actors[1].hp,94);
 const ward=state({damageMultiplier:.5});play(ward,'starlight');play(ward,'release','ward');assert.equal(ward.actors[1].hp,95);
 for(const [id,n]of [['animate',3],['bramble',3],['contraption',4]]){const s=state({damageMultiplier:.5});play(s,id);assert.equal(s.actors[1].hp,100-n);}
 const omen=state({damageMultiplier:.5});play(omen,'omen');play(omen,'guard');play(omen,'guard');assert.equal(omen.actors[1].hp,85);
 const fire=state({damageMultiplier:.5});play(fire,'wildfire');play(fire,'hold');assert.deepEqual(fire.actors.map(a=>a.hp),[99,94]);play(fire,'release');assert.equal(fire.actors[1].hp,81);
 const drain=state({damageMultiplier:.5});drain.actors[0].hp=60;play(drain,'siphon');play(drain,'hold');play(drain,'release');assert.equal(drain.actors[0].hp,68);
 const reflect=state({damageMultiplier:.5});play(reflect,'flame','reflect');assert.deepEqual(reflect.actors.map(a=>a.hp),[95,100]);
 const heal=state({damageMultiplier:.5});heal.actors[0].hp=60;play(heal,'mend');assert.equal(heal.actors[0].hp,74);play(heal,'haste');assert.equal(heal.actors[0].hp,74);
 const shield=state({damageMultiplier:.5});play(shield,'heartwood');assert.equal(shield.actors[0].constructs[0].reduction,2);assert.equal(shield.actors[0].constructs[0].threshold,40);
 assert.throws(()=>createState({damageMultiplier:0}),/scales/);
});
test('damage previews use scaled rounded outputs for channels, constructs, Omen and Tailwind',()=>{
 const s=state({damageMultiplier:.5});
 for(const id of Object.keys(SPELLS))assert(!/\bbase\b|scaled/.test(describe(s,0,id)),id);
 assert.match(describe(s,0,'starlight'),/13 spell damage, or 19/);assert.match(describe(s,0,'wildfire'),/6 spell damage to them, 1 to you/);
 assert.match(describe(s,0,'contraption'),/Deal 4 spell damage/);assert.match(describe(s,0,'contraption'),/ending: 2 spell damage/);
 assert.match(describe(s,0,'omen'),/15 spell damage/);assert.match(describe(s,0,'tailwind'),/6\/8\/9 physical/);
 play(s,'starlight');assert.match(describe(s,0,'release'),/Deal 13 spell damage/);play(s,'hold');assert.match(describe(s,0,'release'),/Deal 19 spell damage/);
});
test('random opponent selects an existing deterministic level-generated kit and records its encounter seed',()=>{
 const loadouts=new Set();
 for(let seed=0;seed<100;seed++){const s=createState({opponentLoadout:'random',opponentLevel:80,encounterSeed:seed}),kit=s.actors[1].kit;loadouts.add(kit.loadout);assert.equal(s.config.opponentLoadout,'random');assert.equal(s.config.resolvedOpponentLoadout,kit.loadout);assert.deepEqual(kit,generateLoadout(kit.loadout,80));assert.deepEqual(createState(s.config).actors[1].kit,kit);}
 assert.equal(loadouts.size,9);for(const encounterSeed of [-1,1.2,4294967296])assert.throws(()=>createState({opponentLoadout:'random',encounterSeed}),/Encounter seed/);
});

test('equal skills grow endurance faster than damage; low Health still permits combat',()=>{
 const rows=[];
 for(const level of [20,50,80,100]){
  const skills=Object.fromEntries(['arcana','lore','alchemy','charm','vigor','guile'].map(k=>[k,level]));
  const s=createState({playerLevel:level,opponentLevel:level,playerSkills:skills,opponentSkills:skills,spellAccess:'all'});
  rows.push([s.actors[0].maxHP,attackPower(s,0,'strike')]);
  assert.equal(s.actors[0].maxHP,80+2*level);assert.deepEqual(s.actors[0].kit.skills,skills);
  const low=createState({playerSkills:skills,playerResources:{health:0}});assert(low.actors[0].maxHP>0);assert(legalActions(low,0).includes('strike'));
 }
 assert.deepEqual(rows,[[120,8],[180,9],[240,11],[280,12]]);
 assert(rows[2][0]/rows[2][1]>rows[0][0]/rows[0][1]);
});
test('Mend stays below damage at every equal skill and Heartprice cannot heal through free Strike',()=>{
 for(let skill=1;skill<=100;skill++)for(let r=1;r<=3;r++){
  const s=state();for(const a of s.actors)for(const k of Object.keys(a.kit.skills))a.kit.skills[k]=skill;
  s.actors[0].kit.spells={heartprice:1,mend:r,flame:r};play(s,'heartprice');
  const power=attackPower(s,0,'flame');s.actors[0].hp=50;const before=s.actors[0].hp;play(s,'mend','strike');
  assert(s.actors[0].hp<before,`${skill}/${r}`);
  const t=state();for(const k of Object.keys(t.actors[0].kit.skills))t.actors[0].kit.skills[k]=skill;t.actors[0].kit.spells.mend=r;t.actors[0].hp=50;play(t,'mend');const healing=t.actors[0].hp-50;
  assert(healing<power);assert(healing/power>=.75);assert(healing/power<=.8+1e-9);
 }
});
test('Glamour and Rapport cannot repeatedly farm settlement awards',()=>{
 const s=state({observers:true});play(s,'glamour');play(s,'glamour');assert.equal(s.actors[0].pendingRenown,3);play(s,'rapport');play(s,'rapport');assert.equal(s.actors[0].pendingRenown,8);assert.equal(s.actors[0].resources.crowns,20);
});
test('Seal is bounded and Eclipse caps actual external damage recovery',()=>{
 const s=state();s.actors[1].flux=40;play(s,'seal','guard');assert.equal(s.actors[1].flux,28);
 const t=state();t.actors[0].resources.mana=0;t.actors[0].effects.eclipse={value:10,from:1,until:1,born:0};play(t,'reclaim','flame');assert.equal(t.actors[0].resources.mana,10);
 const u=state();u.actors[0].resources.mana=20;play(u,'wildfire');u.actors[0].effects.eclipse={value:24,from:2,until:2,born:1};const before=u.actors[0].resources.mana;play(u,'hold','guard');assert.equal(u.actors[0].resources.mana,before-2);
});

 test('Foresight preparation cannot permanently amplify an autonomous construct',()=>{const s=state();play(s,'foresight');play(s,'animate');assert.equal(s.actors[0].constructs[0].power,6);play(s,'guard');assert.equal(s.actors[0].constructs[0].power,6);});

test('Contraption lifetime expiry includes its final tick before the ending burst',()=>{
 const s=state();play(s,'contraption');play(s,'guard');play(s,'guard');assert.deepEqual(s.actors.map(a=>a.hp),[97,72]);assert.equal(s.actors[0].constructs.length,0);play(s,'guard');assert.deepEqual(s.actors.map(a=>a.hp),[97,72]);
});
test('Reflect blocks only the first damaging spell action, leaving a later Omen to land',()=>{
 const s=state();play(s,'omen');play(s,'guard');play(s,'flame','reflect');assert.deepEqual(s.actors.map(a=>a.hp),[91,70]);
});
