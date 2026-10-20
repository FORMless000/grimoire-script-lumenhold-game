#!/usr/bin/env node
// An accounting model, NOT a candidate game implementation or a win-rate study.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
import {createState,cloneState,attackPower,amount,damagePower,cost,hpCost,describe,SPELLS,FLUX_RATIO,RULES_VERSION,actorToMove,applyChoice} from './iterations/v04/engine.mjs';
import {evaluate} from './iterations/v04/ai.mjs';
if(RULES_VERSION!=='combat-spells-v2-0.4.4')throw Error('Historical draft audit requires the archived 0.4.4 source: run results/v04-20261016-economy-pricing/sources/analyze-v04-economy.mjs instead.');
const root=path.dirname(fileURLToPath(import.meta.url));
const draft=JSON.parse(fs.readFileSync(path.join(root,'economy-draft-1.json'))),out=path.resolve(process.argv[2]??'');if(!process.argv[2])throw Error('Pass a fresh output directory');fs.mkdirSync(out,{recursive:false});
assert.deepEqual(Object.keys(draft.spells).sort(),Object.keys(SPELLS).sort());assert.equal(draft.reference.fluxRatio,FLUX_RATIO);
function reference(rank=2){
 const s=createState({spellAccess:'all',playerLevel:50,firstLeader:0});
 // The pricing fixture fixes all six skills, independent of seeded kit offsets.
 for(const a of s.actors){a.kit=structuredClone(a.kit);for(const key of Object.keys(a.kit.skills))a.kit.skills[key]=50;a.kit.capacity=65;a.entry.mana=65;a.resources.mana=65;for(const id of Object.keys(a.kit.spells))a.kit.spells[id]=SPELLS[id].levels===3?rank:1;}
 return s;
}
const ref=draft.reference,T=ref.hpPerAction,mu=ref.hpPerPermanentlySpentMana;
const irrecoverable=c=>c*(1-FLUX_RATIO);
const budget=(c,actions=1,k=ref.castsPerReclaim)=>T*actions+T/k+mu*irrecoverable(c);
const current=Object.fromEntries(Object.keys(SPELLS).map(id=>[id,{name:SPELLS[id].name,mana:cost(reference(),0,id),hpCost:hpCost(reference(),0,id),description:describe(reference(),0,id)}]));
const core=[1,2,3].map(rank=>{const s=reference(rank),flame=attackPower(s,0,'flame'),heal=amount(s,0,'mend',5+rank),c=cost(s,0,'flame');return {rank,flame,mend:heal,mana:c,irrecoverableMana:irrecoverable(c),healDamageRatio:heal/flame,flameHpPerPermanentManaIgnoringTurns:flame/irrecoverable(c),mendHpPerPermanentManaIgnoringTurns:heal/irrecoverable(c),manaHpPriceImpliedByFlameAfterReferenceTurnCosts:(flame-T-T/3)/irrecoverable(c)};});
const sensitivity=[1,2,3,4,5].map(k=>({castsPerReclaim:k,flame12ManaBudget:budget(12,1,k),reclaimTempoPerCast:T/k}));
const currentProbe=reference();currentProbe.actors[0].hp=30;currentProbe.actors[0].resources.health=30;currentProbe.actors[0].resources.mana=20;
for(const action of ['purify','mend']){const pair=[action,'guard'];applyChoice(currentProbe,pair[actorToMove(currentProbe)]);applyChoice(currentProbe,pair[actorToMove(currentProbe)]);}
const currentCycle={hpChange:currentProbe.actors[0].hp-30,readyManaChange:currentProbe.actors[0].resources.mana-20,fluxChange:currentProbe.actors[0].flux};
const scaling=[];for(const skill of [1,20,50,80,100]){const scale=.75+skill/200;scaling.push({skill,currentScale:.5+skill/100,proposedScale:scale,strike:Math.ceil(9*scale),flame:draft.spells.flame.damage.map(d=>Math.ceil(d*scale)),mend:draft.spells.mend.healing.map((h,i)=>Math.floor(.8*Math.ceil(draft.spells.mend.damageEquivalentBudgets[i]*scale))),distilHp:Math.ceil(9*scale),distilMana:Math.floor(12*scale)});}
let healingRatioChecks=0,heartpricePressureChecks=0;const ratioExtrema=[];
for(let rank=0;rank<3;rank++){
 const ratios=[];for(let skill=1;skill<=100;skill++){
  const scale=.75+skill/200,D=Math.ceil(draft.spells.flame.damage[rank]*scale),H=Math.floor(.8*Math.ceil(draft.spells.mend.damageEquivalentBudgets[rank]*scale)),strike=Math.ceil(9*scale),bloodCost=Math.ceil(draft.spells.mend.mana[rank]*draft.spells.heartprice.hpPerMana);
  assert(H<=D*.8+1e-9);healingRatioChecks++;
  assert(H-bloodCost<strike);heartpricePressureChecks++;
  ratios.push(H/D);
 }
 ratioExtrema.push({rank:rank+1,min:Math.min(...ratios),max:Math.max(...ratios)});
}
// HP/MP can both recover against a passive opponent; Moonwell intentionally
// permits recovery too. Price the time and test the same cycle under free pressure.
const cycle={actions:3,distilHpCost:9,distilManaGain:12,mendManaCost:12,mendHealing:14,fluxReclaimed:8,hpGain:14-9,manaGain:12-12+8};
cycle.resourceGainHpEquivalent=cycle.hpGain+mu*cycle.manaGain;cycle.actionBudget=T*cycle.actions;cycle.accountingSurplus=cycle.resourceGainHpEquivalent-cycle.actionBudget;cycle.hpChangeUnderThreeUnmitigatedStrikes=cycle.hpGain-3*T;assert(cycle.accountingSurplus<0);assert(cycle.hpChangeUnderThreeUnmitigatedStrikes<0);
const channelRows=[];for(let holds=0;holds<=20;holds++){
 const actions=holds+2;
 const star=draft.spells.starlight,wild=draft.spells.wildfire,siphon=draft.spells.siphon;
 channelRows.push({holds,starlight:{actions,damage:holds?star.releaseDamageAfterHold:star.releaseDamage,budget:budget(star.mana[0]+holds*star.holdMana,actions)},wildfire:{actions,damage:wild.releaseDamage+holds*wild.holdDamage,selfDamage:holds*wild.holdSelfDamage,netHpSwing:wild.releaseDamage+holds*(wild.holdDamage-wild.holdSelfDamage),budget:budget(wild.mana[0]+holds*wild.holdMana,actions)},siphon:{actions,damage:(siphon.damageOnStart+holds*siphon.damagePerHold),healingUpperBound:Math.floor((siphon.damageOnStart+holds*siphon.damagePerHold)*siphon.healFractionOfActualDamage),budget:budget(siphon.mana[0]+holds*siphon.holdMana,actions),affordableAtFull65Mana:siphon.mana[0]+holds*siphon.holdMana<=65},moonwell:{actions,mana:holds*6,hpEquivalent:holds*6*mu,tempo:actions*T},lodestar:{actions,absorb:24+9*holds,budget:budget(6,actions)}});
 assert(holds*6*mu<actions*T);assert.equal(24+9*holds,budget(6,actions));
}
const constructs=['animate','heartwood','bramble','contraption'].map(id=>{const c=draft.spells[id],damage=(c.tickDamage??0)*c.maxExchanges,healing=(c.tickHealing??0)*c.maxExchanges,reduction=c.reductionPerHit*c.maxExchanges;return {id,maxExchanges:c.maxExchanges,damagePotential:damage,healingPotential:healing,reductionAssumingOneHitPerExchange:reduction,netBurstIgnoringDefenses:0,totalPotentialAtOneHitPerExchange:damage+healing+reduction,budget:budget(c.mana[0]),note:'Upper full-lifetime reference; early destruction, defenses and healing caps lower realization. Per-hit reduction can be worth more against multi-hit actions.'};});
const s=reference(),healthChild=cloneState(s),manaChild=cloneState(s);healthChild.actors[0].hp-=1;manaChild.actors[0].resources.mana-=1;const hpWeight=evaluate(s)-evaluate(healthChild),mpWeight=evaluate(s)-evaluate(manaChild);
const report={status:draft.status,rulesVersionMeasured:RULES_VERSION,reference:ref,currentStrike:attackPower(s,0,'strike'),currentCore:core,currentRoster:current,currentDistilMendCycle:currentCycle,currentAiMarginalWeights:{hpUtilityPerHp:hpWeight,utilityPerReadyMana:mpWeight,impliedHpPerReadyMana:mpWeight/hpWeight},pricing:{formula:'HP budget = actions*9 + 9/castsPerReclaim + 1.5*ManaCost/3',standardFlame12:budget(12),standardMend12Target:budget(12)*.8,upfrontManaMarginalHpBurn:mu/3,permanentManaHp:mu},reclaimSensitivity:sensitivity,scaling,ratioExtrema,proposedDistilMendReclaimCycle:cycle,channels:channelRows,constructs,checks:{rosterSpells:Object.keys(draft.spells).length,healingRatioChecks,heartpricePressureChecks,channelHoldCountsChecked:21},limitations:['Accounting proposal, not an implemented engine or balance simulation.','One HP-equivalent price is a reference, not a universal state value.','Reclaim tax assumes three spells per Reclaim; terminal automatic flux recovery can remove the tax.','Finite construct caps and persistent Lodestar absorb are proposed mechanics, not current rules.','No overall win-rate or strategy-diversity improvement has been measured.']};
const files=['analyze-v04-economy.mjs','economy-draft-1.json','iterations/v04/roster.mjs','iterations/v04/loadouts.mjs','iterations/v04/cast-stats.mjs','iterations/v04/engine.mjs','iterations/v04/ai.mjs'],sourceHashes={};
for(const file of files){const target=path.join(out,'sources',file);fs.mkdirSync(path.dirname(target),{recursive:true});const bytes=fs.readFileSync(path.join(root,file));fs.writeFileSync(target,bytes);sourceHashes[file]=crypto.createHash('sha256').update(bytes).digest('hex');}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({createdUTC:new Date().toISOString(),node:process.version,sourceHashes},null,2));fs.writeFileSync(path.join(out,'economy.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,...report.checks,pricing:report.pricing,currentCore:core,currentCycle,proposedCycle:cycle,currentAi:report.currentAiMarginalWeights}));
