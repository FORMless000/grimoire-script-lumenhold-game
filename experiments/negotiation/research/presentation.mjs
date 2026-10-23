// Display adapters consume actual projected transitions, so tuning cannot leave
// the UI showing obsolete penalties. Projections never mutate the live state.
import {core} from '../core.mjs';import {SPELLS,signal as baseSignal} from '../reference-engine.mjs';
const n=x=>Number(x.toFixed(2));
export function activeEffects(s){return Object.keys(s.player.spells).filter(id=>SPELLS[id].castable!==false).map((id,i)=>({id,duration:s.researchState.active[i]??0,effect:s.config.spellEffects[id]})).filter(x=>x.duration>0);}
export function researchSignal(s){let sig=baseSignal(s);for(const a of activeEffects(s)){const skill=a.effect.swap;if(skill&&s.player.skills[skill]>sig.value)sig={name:skill+' via '+SPELLS[a.id].name,value:s.player.skills[skill],skill};}return sig;}
export const researchSpellCost=(s,id)=>s.config.spellEffects[id]?.mana??0;
export function spellPrice(s,id){const e=s.config.spellEffects[id];if(!e)return 'Story only';return [e.mana+' Mana',...(e.health?[e.health+' Health']:[]),...(e.renown?[e.renown+' Renown']:[]),...(e.resolve?[e.resolve+' Resolve']:[]),...(e.patience?[e.patience+' Patience']:[])].join(' · ');}
export function unavailable(s,id){const e=s.config.spellEffects[id];if(SPELLS[id].castable===false||!e)return 'Story only';if(!s.player.spells[id])return 'Not learned';if(s.castUsed)return 'Spell used this turn';for(const[k,label]of[['mana','Mana'],['health','Health'],['renown','Renown']])if((e[k]??0)>0&&s.resources[k]<e[k])return 'Not enough '+label;if(s.resolve<(e.resolve??0))return 'Not enough Resolve';return '';}
export function describeSpell(s,id){const e=s.config.spellEffects[id];if(!e)return 'Story-only magic.';const power=s.config.tune.spellPower,parts=[];
 if(e.irrelevant)return 'Ward has no useful effect in negotiation. Pay '+e.mana+' Mana and add '+e.suspicion+' Suspicion.';
 if(e.fail)return 'The papers catch fire. “I agree: you should leave.” Immediate failure.';
 if(e.foresight)parts.push('Reveal the rolling next argument');
 if(e.force)parts.push('Ordinary check passes');if(e.waiveGate)parts.push('also bypasses a flag/knowledge request');
 if(e.swap)parts.push('Use '+e.swap+' if stronger');
 if(e.chance)parts.push((e.chance>0?'+':'')+n(e.chance*power*100)+' points'+(e.only?.length?' on '+e.only.join('/'):' on checks'));
 if(e.frameChance)parts.push('+'+n(e.frameChance*power*100)+' points in '+e.frames.join('/'));
 if(e.restoreResolve)parts.push('restore '+n(e.restoreResolve*power)+' Resolve');if(e.restoreMana)parts.push('restore '+e.restoreMana+' Mana');if(e.restorePatience)parts.push('restore '+e.restorePatience+' Patience');
 if(e.resolveShield)parts.push('block '+n(e.resolveShield*power)+' Resolve damage');if(e.suspicionShield)parts.push(e.suspicionShield>=99?'rejection adds no Suspicion':'block '+e.suspicionShield+' rejection Suspicion');if(e.patienceShield)parts.push('Patience losses −'+e.patienceShield);
 if(e.deflectResolve===0)parts.push('Deflect: no Resolve cost');if(e.deflectPatience)parts.push('Deflect Patience '+e.deflectPatience);if(e.deflectRisk!==undefined)parts.push('Deflect risk ×'+e.deflectRisk);
 if(e.successResolve)parts.push('acceptance restores '+n(e.successResolve*power)+' Resolve');if(e.successMultiplier>1)parts.push('presentation success benefit ×'+e.successMultiplier);
 if(e.afterFailure)parts.push('rejection gives next check +'+n(e.afterFailure*power*100)+' points');if(e.repeatSource)parts.push('repeat signal: +'+n(e.repeatSource*power*100)+' points');
 if(e.goldDiscount)parts.push('crown price ×'+(1-e.goldDiscount));if(e.concealGold)parts.push('conceal the payment trail');
 if(e.noFatigue)parts.push('ignore Resolve fatigue');if(e.rejectResolve)parts.push('rejection: +'+e.rejectResolve+' Resolve loss');if(e.rejectRenown)parts.push('rejection: lose '+e.rejectRenown+' Renown');if(e.rejectSuspicion)parts.push('rejection: +'+e.rejectSuspicion+' Suspicion');if(e.responsePatience)parts.push('response costs '+e.responsePatience+' extra Patience');
 const suspicion=e.suspicion>0?e.suspicion*s.config.tune.spellSuspicion:e.suspicion;parts.push((suspicion>0?'+':'')+suspicion+' Suspicion');return parts.join('; ')+'.'+(e.duration>1?' Lasts '+e.duration+' responses.':'');
}
export function responsePreview(s){const legal=core('legal',s),failure=core('project',s,{id:'face',event:false}),success=core('project',s,{id:'face',event:true});const failureText='Rejected: −'+n(s.resolve-failure.resolve)+' Resolve · +'+n(failure.suspicion-s.suspicion)+' Suspicion · −'+n(s.patience-failure.patience)+' Patience'+(failure.spent.renown>s.spent.renown?' · −'+n(failure.spent.renown-s.spent.renown)+' Renown':'');
 const benefits=['+1 Agreement'];if(success.resolve<s.resolve)benefits.push('−'+n(s.resolve-success.resolve)+' Resolve');if(success.resolve>s.resolve)benefits.push('+'+n(success.resolve-s.resolve)+' Resolve');if(success.suspicion<s.suspicion)benefits.push('−'+n(s.suspicion-success.suspicion)+' Suspicion');if(success.suspicion>s.suspicion)benefits.push('+'+n(success.suspicion-s.suspicion)+' Suspicion');if(success.patience>s.patience)benefits.push('+'+n(success.patience-s.patience)+' Patience');
 let skip=null;if(legal.includes('deflect')){const t=core('project',s,{id:'deflect',event:false});const factor=activeEffects(s).reduce((m,x)=>m*(x.effect.deflectRisk??1),1);skip={resolve:n(s.resolve-t.resolve),patience:n(s.patience-t.patience),risk:Math.min(.9,s.config.tune.skipRiskBase+s.config.tune.skipRiskStep*s.bypasses)*factor};}
 const card=s.pool.find(c=>c.id===s.card),discount=activeEffects(s).reduce((m,a)=>Math.max(m,a.effect.goldDiscount??0),0);return {failureText,successText:benefits.join(' · '),skip,price:card.type==='gold'?Math.ceil(card.amount*(1-discount)):card.amount};
}
