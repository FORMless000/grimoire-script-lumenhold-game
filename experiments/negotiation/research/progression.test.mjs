import test from 'node:test';import assert from 'node:assert/strict';
import {SPELLS as COMBAT,manaCapacity} from '../../../combat/setup/roster.mjs';
import {researchPreset,combatSpellCost,canon} from './progression.mjs';
import {createResearchState,researchAction,researchSearch,simulateResearch} from './model.mjs';
import {core} from '../core.mjs';import {nativeCore} from './native.mjs';
const payment=(type,policyVariant)=>{const s=createResearchState({level:80,policyVariant,requests:[{type,amount:8}]});s.card=s.pool.find(c=>c.baseId==='event_0'&&c.frame==='open').id;return s;};
test('level differences have half sensitivity while argument difficulty retains its spread',()=>{
 const make=scale=>{const s=createResearchState({tune:{levelGapScale:scale,checkSlope:.013}});s.card=s.pool.find(c=>c.source==='skills'&&c.key==='lore'&&c.frame==='open').id;s.pool.find(c=>c.id===s.card).dc=0;return s;};
 const old=make(1),gentle=make(.5),p=core('chance',gentle);assert.equal(p,core('chance',old));
 for(const s of [old,gentle])s.player.skills.lore+=10;
 assert(Math.abs(core('chance',old)-p-.13)<1e-12);assert(Math.abs(core('chance',gentle)-p-.065)<1e-12);
 gentle.player.skills.lore-=10;gentle.config.difficulty+=10;assert(Math.abs(core('chance',gentle)-p+.065)<1e-12);
 gentle.config.difficulty-=10;gentle.pool.find(c=>c.id===gentle.card).dc+=10;assert(Math.abs(core('chance',gentle)-p+.13)<1e-12);
});
test('progressive kits are nested and level 80 knows every castable player spell',()=>{
 let previous=[];for(let level=1;level<=100;level++){
  const p=researchPreset(level);assert(previous.every(id=>p.spells[id]));assert.equal(p.capacity,manaCapacity(p.skills));previous=Object.keys(p.spells);
  if(level>=80)assert.deepEqual(previous.sort(),Object.keys(COMBAT).filter(id=>COMBAT[id].group!=='creature'&&COMBAT[id].castable!==false).sort());
 }
 for(const [level,n,rank]of [[20,12,1],[50,24,3],[80,34,3]]){const p=researchPreset(level);assert.equal(Object.keys(p.spells).length,n);assert.equal(p.spells.glamour,rank);}
});
test('every Mana price/rank and course duration matches combat; old discounts are ignored',()=>{
 for(const [id,spell]of Object.entries(canon.spells))for(let rank=1;rank<=spell.levels;rank++){
  assert.equal(combatSpellCost(id,rank),COMBAT[id].cost[rank-1]);
  const s=createResearchState({player:{spells:{[id]:rank}},tune:{manaScale:.01},effectOverrides:{[id]:{mana:0}}});
  assert.equal(s.config.spellEffects[id]?.mana??0,COMBAT[id].cost[rank-1]);
  if(['foresight','haste','shadowstep'].includes(id))assert.equal(s.config.spellEffects[id].duration,COMBAT[id].duration[rank-1]);
 }
});
test('dumb always pays affordable Health/Gold prices and cannot cast, including zero-Mana spells',()=>{
 for(const type of ['gold','health']){const s=payment(type,'dumb');assert.deepEqual(core('legal',s),['face']);assert.equal(researchSearch(s,{depth:1,fixedNodes:true}).id,'face');const before=s.resources[type];researchAction(s,'face');assert.equal(s.resources[type],before-8);}
 const s=createResearchState({level:80,policyVariant:'dumb'});assert(!core('legal',s).some(id=>COMBAT[id]));
});
test('hyper-frugal and ignorant cannot pay Health/Gold; hyper-frugal records canonical unlimited Mana',()=>{
 for(const variant of ['hyper-frugal','ignorant'])for(const type of ['gold','health']){const s=payment(type,variant);assert(!core('legal',s).includes('face'));assert.throws(()=>researchAction(s,'face'));s.resolve=0;assert(core('legal',s).includes('withdraw'));}
 const s=createResearchState({level:80,mana:0,policyVariant:'hyper-frugal'});assert(core('legal',s).includes('candour'));assert(!core('legal',s).includes('mend'));assert(!core('legal',s).includes('purify'));researchAction(s,'candour');assert.equal(s.resources.mana,0);assert.equal(s.spent.mana,6);researchAction(s,'withdraw');assert.equal(s.settlement.resources.mana.netLoss,0);assert.equal(s.settlement.resources.mana.rebate,0);
 assert(!core('legal',createResearchState({level:80,policyVariant:'ignorant'})).some(id=>COMBAT[id]));
});
test('all restricted policies replay deterministically and agree between native and Wasm',async()=>{
 const native=nativeCore();try{for(const variant of ['dumb','hyper-frugal','ignorant']){
  const s=payment('gold',variant),o={depth:1,fixedNodes:true,nodeBudget:2000,beam:8,trace:true};
  const a=simulateResearch(s,o),b=await native.request({op:'simulate',state:s,options:o});assert(a.terminated);assert.deepEqual(a.state,b.state);
  const tape=a.state.history.map(h=>h.action);assert.deepEqual(core('replay',s,{tape}),a.state);assert.deepEqual(await native.request({op:'replay',state:s,tape}),a.state);
  const replay=structuredClone(s);for(const h of a.state.history){assert(core('legal',replay).includes(h.action));researchAction(replay,h.action);}assert.deepEqual(replay.history,a.state.history);assert.deepEqual(replay.settlement,a.state.settlement);
  if(variant!=='hyper-frugal')assert(a.state.history.every(h=>!COMBAT[h.action]));else assert(a.state.spent.mana>0);
  if(variant!=='dumb'){assert.equal(a.state.spent.health,0);assert.equal(a.state.spent.gold,0);}
 }}finally{native.close();}
});
