import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,generateKit,ARCHETYPES,SPELLS,RESOURCES,APPLICATIONS} from './engine.mjs';

test('600 level-seeded kits reproduce, stay bounded and mirror',()=>{
  for(const archetype of Object.keys(ARCHETYPES))for(let level=1;level<=100;level++){
    const a=generateKit(archetype,level),b=generateKit(archetype,level);
    assert.deepEqual(a,b);assert.equal((a.skills.arcana+a.skills.vigor)/2,level);assert.equal((a.skills.charm+a.skills.guile)/2,level);
    for(const n of Object.values(a.skills))assert(n>=1&&n<=100);
    for(const [s,r]of Object.entries(a.spells)){assert(r>=1&&r<=3);assert(SPELLS[s].cost[r-1]*2<=a.capacity);}
    const game=new Game({playerArchetype:archetype,playerLevel:level});
    assert.deepEqual(game.player.kit,game.opponent.kit);assert.deepEqual(game.player.entry,game.opponent.entry);
  }
  assert.notDeepEqual(generateKit('Evoker',49),generateKit('Evoker',50));
});

test('replay is deterministic and preview cannot shift the tape or intent',()=>{
  const a=new Game(),b=new Game();
  while(!a.result){
    const cmd={id:a.range==='far'?'approach':'strike'};
    const snapshot=JSON.stringify(a);
    for(let i=0;i<8;i++)a.preview(cmd);
    assert.equal(JSON.stringify(a),snapshot);
    assert.deepEqual(a.step(cmd),b.step(cmd));
  }
  assert.deepEqual(a.exportLog(),b.exportLog());
});

test('all twelve spells and every application remain accessible in both modes and fixtures',()=>{
  for(const level of [20,50,80])for(const mode of ['combat','negotiation'])for(const fixture of mode==='combat'?['practice_ring']:['workshop_request','formal_petition']){
    for(const id of Object.keys(SPELLS))for(const application of APPLICATIONS[mode][id]){
      const g=new Game({mode,fixture,playerLevel:level,spellAccess:'all'});
      assert.equal(g.preview({id,application}).disabled,'',id+' '+application);
      const before=g.player.resources.mana,cost=g.preview({id,application}).cost.mana;
      g.step({id,application});
      const raw=g.settlement?.player.mana.before??g.player.resources.mana;
      assert.equal(raw,before-cost);
      if(application==='hostile')assert.equal(g.result.outcome,'lose');
    }
  }
});

test('worked Flame II / Guard / Ward I example',()=>{
  const g=new Game({spellAccess:'all',playerResources:{mana:21}});
  g.player.kit.skills.arcana=50;g.opponent.kit.skills.arcana=50;g.opponent.kit.skills.vigor=50;
  g.player.kit.spells.flame=2;g.put(g.opponent,'ward',24);g.intent={id:'guard'};g.tape[0][0]=.4;
  g.step({id:'flame',application:'attack'});
  assert.equal(g.player.resources.mana,3);assert.equal(g.opponent.resources.health,67);assert(!g.has(g.opponent,'ward'));
});

test('scrutiny catches a new Bluff before full agreement wins',()=>{
  const g=new Game({mode:'negotiation',fixture:'formal_petition'});
  Object.assign(g.player.kit.skills,{guile:50});Object.assign(g.opponent.kit.skills,{charm:50,guile:50,lore:50});
  g.agreement=13;g.suspicion=3;g.patience=3;g.intent={id:'scrutinize'};g.tape[0]=[.2,.3,.1,.1];
  g.step({id:'bluff'});
  assert.equal(g.agreement,13);assert.equal(g.suspicion,6);assert.equal(g.result.outcome,'lose');
  assert.equal(g.settlement.player.renown.before,26);
});

test('rebates cannot duplicate healing, exceed entry, or settle twice',()=>{
  const g=new Game();
  g.debit(g.player,'health',27);g.restore(g.player,'health',18);
  g.debit(g.player,'mood',12);g.restore(g.player,'mood',6);
  const settled=g.finish('lose','test ledger');
  assert.deepEqual(settled.player.health,{entry:70,spent:27,restored:18,before:61,ratio:.8,refund:7,final:68,netLoss:2});
  assert.equal(settled.player.mood.final,58);
  const snapshot=structuredClone(g.player.resources);
  assert.deepEqual(g.finish('win','should not replace result'),settled);assert.deepEqual(g.player.resources,snapshot);assert.equal(g.result.outcome,'lose');
  for(const ratio of [0,.5,.8,1])for(let loss=0;loss<=70;loss++){
    const x=new Game({rebates:{health:ratio}});x.debit(x.player,'health',loss);x.finish('lose','bounds');
    assert(x.player.resources.health<=70&&x.player.resources.health>=70-loss);
  }
});

test('zero Mana, poor Mood and unaffordable costs cannot soft-lock',()=>{
  for(const mode of ['combat','negotiation']){
    const g=new Game({mode,spellAccess:'all',playerResources:{mana:0,mood:1,renown:0,crowns:0}});
    assert.equal(g.preview({id:'compose'}).disabled,'');assert.equal(g.preview({id:mode==='combat'?'concede':'close'}).disabled,'');
    const before=JSON.stringify(g);
    assert.throws(()=>g.step({id:'flame',application:mode==='combat'?'attack':'demonstrate'}),/mana/);
    assert.equal(JSON.stringify(g),before);
  }
  const g=new Game({playerResources:{mood:21}});
  assert.equal(g.preview({id:'strike'}).check.modifiers,-10);
});

test('Hush reduces spell damage without forbidding the cast',()=>{
  const g=new Game({spellAccess:'all'});g.intent={id:'flame',application:'attack'};g.tape[0][1]=0;
  const hp=g.player.resources.health;
  g.step({id:'hush',application:'disrupt'});
  assert.equal(g.player.resources.health,hp-15); // Flame II 27 minus added-support Hush I 12.
});

test('Haste costs Health immediately, only applies next exchange and may defeat its caster',()=>{
  const g=new Game({spellAccess:'all'});g.intent={id:'guard'};
  g.step({id:'haste',application:'quicken'});
  assert.equal(g.player.resources.health,64);assert(g.has(g.player,'haste'));
  g.intent={id:'guard'};g.step({id:'strike'});assert(!g.has(g.player,'haste'));
  const x=new Game({spellAccess:'all',playerResources:{health:6}});x.intent={id:'guard'};x.step({id:'haste',application:'quicken'});
  assert.equal(x.result.outcome,'lose');assert.equal(x.settlement.player.health.before,0);
});

test('audience preparation applies after the current player argument',()=>{
  const g=new Game({mode:'negotiation',playerArchetype:'Envoy',opponentArchetype:'Seer',fixture:'formal_petition'});
  g.intent={id:'foresight',application:'anticipate'};g.tape[0][0]=0;
  const expected=g.preview({id:'reason'}).check.defence;g.step({id:'reason'});
  assert.equal(g.log[0].checks[0].defence,expected);assert(g.has(g.opponent,'anticipation'));
  assert.equal(g.preview({id:'reason'}).check.defence,54);
});

test('voluntary exits do not charge the audience, and carried ledgers isolate each bout',()=>{
  const g=new Game({mode:'negotiation',spellAccess:'all'});g.agreement=11;g.intent={id:'objection'};
  g.step({id:'shadowstep',application:'withdraw'});
  assert.equal(g.result.outcome,'partial');assert.equal(g.opponent.spent.mood,0);assert(g.player.spent.mana>0);
  const x=new Game({playerResources:{health:35,mana:10}});
  x.debit(x.player,'health',10);x.finish('lose','first bout');
  const next=new Game({playerResources:{...x.player.resources}});
  assert.equal(next.player.entry.health,33);next.finish('lose','no spending');
  assert.equal(next.player.resources.health,33);
});

test('fixed mixed policies finish all presets with bounded ledgers',()=>{
  for(const level of [20,50,80])for(const archetype of Object.keys(ARCHETYPES))for(const mode of ['combat','negotiation']){
    const g=new Game({mode,playerArchetype:archetype,playerLevel:level,spellAccess:'all'});
    while(!g.result){
      const actions=g.actions().filter(c=>c.application!=='hostile'&&c.application!=='nothing'&&!['concede','close'].includes(c.id)&&!g.preview(c).disabled);
      const c=actions[(g.round*3)%actions.length];g.step(c);
    }
    assert(g.log.length<=8);
    for(const actor of [g.player,g.opponent])for(const k of RESOURCES){assert(actor.resources[k]>=0&&actor.resources[k]<=actor.entry[k]);assert.equal(actor.entry[k]-actor.resources[k],g.settlement[actor===g.player?'player':'opponent'][k].netLoss);}
  }
});
