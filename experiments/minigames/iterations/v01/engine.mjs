// Standalone implementation of prototype-0.1. All tunable defaults live here.
export const RESOURCES = ['health', 'mood', 'renown', 'mana', 'crowns'];
export const ARCHETYPES = {
  Evoker: { offsets: [8,0,0,-4], signature:['flame','tide'], support:['ward','haste'], cycle:['attack','attack','prepare'], attacks:['flame','strike','tide','feint'], prepares:['ward','haste','observe'], audience:['objection','hurry','listen'], preference:'reason' },
  Seer: { offsets:[2,-3,8,-4], signature:['foresight','starlight'], support:['glamour','shadowstep'], cycle:['prepare','attack','attack'], attacks:['starlight','feint','strike'], prepares:['foresight','glamour','shadowstep:far'], audience:['scrutinize','anticipate','objection'], preference:'reason' },
  Restorer: { offsets:[-3,3,0,8], signature:['restoration','shape'], support:['ward','attune'], cycle:['prepare','attack','attack'], attacks:['strike','feint'], prepares:['restoration','shape','attune','ward'], audience:['objection','listen','listen'], preference:'reason' },
  Illusionist: { offsets:[-4,-6,-2,-4], signature:['glamour','hush'], support:['foresight','shadowstep'], cycle:['prepare','attack','attack'], attacks:['feint','strike'], prepares:['glamour','hush','foresight','shadowstep:far'], audience:['authority','scrutinize','objection'], preference:'appeal' },
  Envoy: { offsets:[0,8,3,0], signature:['attune','glamour'], support:['haste','restoration'], cycle:['prepare','attack','attack'], attacks:['strike','feint'], prepares:['attune','glamour','haste','restoration'], audience:['objection','listen','hurry'], preference:'appeal' },
  Warden: { offsets:[0,-2,5,0], signature:['ward','shadowstep'], support:['hush','shape'], cycle:['prepare','attack','attack'], attacks:['strike','feint'], prepares:['ward','shape','hush','shadowstep:near'], audience:['scrutinize','objection','listen'], preference:'offer' }
};
export const SPELLS = {
  flame:{name:'Flame',cost:[10,9,7],school:'Evocation'},
  tide:{name:'Tide',cost:[14,10,9],school:'Evocation'},
  foresight:{name:'Foresight',cost:[10,9,7],school:'Astromancy'},
  starlight:{name:'Starlight',cost:[18,14,10],school:'Astromancy'},
  restoration:{name:'Restoration',cost:[14,10,9],school:'Alchemy'},
  shape:{name:'Shape',cost:[14,10,9],school:'Alchemy'},
  glamour:{name:'Glamour',cost:[14,10,9],school:'Illusion'},
  hush:{name:'Hush',cost:[10,9,7],school:'Illusion'},
  haste:{name:'Haste',cost:[10,9,7],school:'Beastcraft'},
  attune:{name:'Attune',cost:[10,9,7],school:'Beastcraft'},
  ward:{name:'Ward',cost:[14,10,9],school:'Umbral'},
  shadowstep:{name:'Shadowstep',cost:[18,14,10],school:'Umbral'}
};
export const CONTEXTS = {
  practice_duel:{health:.8,mood:.8,renown:.8,mana:.8,crowns:0},
  real_conflict:{health:.5,mood:.5,renown:.5,mana:.5,crowns:0},
  public_duel:{health:.8,mood:.8,renown:.2,mana:.8,crowns:0},
  rehearsal:{health:.8,mood:.8,renown:.8,mana:.8,crowns:1}
};
export const cap=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const copy=x=>structuredClone(x);
export function levelRng(level) {
  let state=level|0;
  return ()=>{let a=(state=(state+0x6D2B79F5)|0);let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};
}
export function generateKit(archetype,level,access='kit') {
  if(!ARCHETYPES[archetype] || !Number.isInteger(level) || level<1 || level>100) throw Error('Choose an archetype and an integer level from 1 to 100.');
  const a=ARCHETYPES[archetype],rng=levelRng(level),draws=Array.from({length:7},()=>rng()),j=draws.slice(0,4).map(u=>Math.floor(7*u)-3),bound=Math.min(level-1,100-level);
  const dA=cap(a.offsets[0]+j[0],-bound,bound),dC=cap(a.offsets[1]+j[1],-bound,bound),rank=1+Math.floor((level-1)/35);
  const skills={arcana:level+dA,vigor:level-dA,charm:level+dC,guile:level-dC,lore:cap(level+a.offsets[2]+j[2],1,100),alchemy:cap(level+a.offsets[3]+j[3],1,100)};
  const spells=Object.fromEntries(a.signature.map(s=>[s,rank]));
  a.support.forEach((s,i)=>spells[s]=i===Math.floor(2*draws[4])?rank:Math.max(1,rank-1));
  if(access==='all') for(const s of Object.keys(SPELLS)) spells[s]??=Math.max(1,rank-1);
  return {archetype,level,skills,spells,capacity:Math.floor(40+skills.arcana/2),cycleOffset:Math.floor(3*draws[5]),temperament:Math.floor(3*draws[6]),draws};
}
const DEFAULT_MODE = {
  combat:{strike:'',feint:'',approach:'',guard:'',observe:'',recover:'',compose:'',rally:'',concede:'',flame:'attack',tide:'surge',foresight:'forecast',starlight:'expose',restoration:'recover',shape:'barricade',glamour:'decoy',hush:'disrupt',haste:'quicken',attune:'rhythm',shadowstep:'near',ward:'protect'},
  negotiation:{reason:'',appeal:'',bluff:'',offer:'',prepare:'',reassure:'',retract:'',compose:'',close:'',flame:'demonstrate',tide:'demonstrate',foresight:'forecast',starlight:'inspect',restoration:'repair',shape:'secure',glamour:'present',hush:'quiet',haste:'quicken',attune:'connect',ward:'materials',shadowstep:'withdraw'}
};
export const APPLICATIONS = {
  combat:{flame:['attack','nothing'],tide:['surge','nothing'],foresight:['forecast','nothing'],starlight:['expose','nothing'],restoration:['recover','clean','nothing'],shape:['barricade','nothing'],glamour:['decoy','nothing'],hush:['disrupt','nothing'],haste:['quicken','nothing'],attune:['rhythm','calm','nothing'],ward:['protect','nothing'],shadowstep:['near','far','nothing']},
  negotiation:{flame:['demonstrate','hostile','nothing'],tide:['demonstrate','hostile','nothing'],foresight:['forecast','nothing'],starlight:['inspect','demonstrate','nothing'],restoration:['repair','recover','nothing'],shape:['secure','demonstrate','nothing'],glamour:['present','hostile','nothing'],hush:['quiet','hostile','nothing'],haste:['quicken','nothing'],attune:['connect','calm','nothing'],ward:['materials','nothing'],shadowstep:['withdraw','hostile','nothing']}
};
const BASIC_COST = {
  combat:{strike:{mood:2},feint:{mood:3},approach:{mood:1},guard:{mood:1},observe:{mood:1},recover:{mood:4},compose:{},rally:{renown:4},concede:{}},
  negotiation:{reason:{mood:2},appeal:{mood:3},bluff:{mood:4},offer:{mood:1,crowns:8},prepare:{mood:1},reassure:{mood:2},retract:{mood:1},compose:{},close:{}}
};
export const TESTED=new Set(['strike','feint','reason','appeal','bluff']);
const SPELL_ATTACKS=new Set(['flame','tide','starlight']);
export function command(id,application) {
  const [name,app]=id.split(':'); return {id:name,application:application??app};
}
export function label(c) {
  const name=SPELLS[c.id]?.name??c.id.charAt(0).toUpperCase()+c.id.slice(1);
  return name+(c.application?' · '+c.application:'');
}
export class Game {
  constructor(options={}) {
    const mode=options.mode??'combat';
    if(!['combat','negotiation'].includes(mode))throw Error('Unknown game mode.');
    const playerArchetype=options.playerArchetype??(mode==='combat'?'Evoker':'Envoy'),playerLevel=options.playerLevel??50;
    this.config={mode,playerArchetype,playerLevel,opponentArchetype:options.opponentArchetype??playerArchetype,opponentLevel:options.opponentLevel??playerLevel,
      fixture:options.fixture??(mode==='combat'?'practice_ring':'workshop_request'),context:options.context??(mode==='combat'?'practice_duel':'real_conflict'),
      spellAccess:options.spellAccess??'kit',visibility:options.visibility??'tells',manaCostScale:options.manaCostScale??2,combatScale:options.combatScale??3,publicStakes:options.publicStakes??true,
      resourceBudget:options.resourceBudget??'standard',playerResources:options.playerResources,opponentResources:options.opponentResources};
    const c=this.config;
    if(!['kit','all'].includes(c.spellAccess)||!['standard','depleted'].includes(c.resourceBudget)||!['tells','open'].includes(c.visibility))throw Error('Invalid test options.');
    if(!Number.isInteger(c.manaCostScale)||c.manaCostScale<1||!Number.isInteger(c.combatScale)||c.combatScale<1)throw Error('Cost scales must be positive integers.');
    if(!CONTEXTS[c.context])throw Error('Unknown rebate context.');
    if(mode==='negotiation'&&!['workshop_request','formal_petition'].includes(c.fixture))throw Error('Unknown negotiation fixture.');
    this.rebates={...CONTEXTS[c.context],...options.rebates};
    for(const k of RESOURCES)if(!Number.isFinite(this.rebates[k])||this.rebates[k]<0||this.rebates[k]>1)throw Error('Each rebate must be between 0% and 100%.');
    const player=generateKit(playerArchetype,playerLevel,c.spellAccess),opponent=generateKit(c.opponentArchetype,c.opponentLevel,c.spellAccess);
    const actor=(kit,resources)=>{
      const base=c.resourceBudget==='depleted'?{health:35,mood:30,renown:5,mana:Math.min(30,kit.capacity),crowns:6}:{health:70,mood:60,renown:30,mana:kit.capacity,crowns:30};
      const entry={...base,...resources};
      for(const k of RESOURCES){const max=k==='mana'?kit.capacity:k==='crowns'?99999:100;if(!Number.isInteger(entry[k])||entry[k]<0||entry[k]>max)throw Error('Invalid '+k+' entry balance.');}
      if(entry.health===0||entry.mood===0)throw Error('A new test needs positive Health and Mood.');
      return {kit,entry,resources:{...entry},spent:Object.fromEntries(RESOURCES.map(k=>[k,0])),restored:Object.fromEntries(RESOURCES.map(k=>[k,0])),effects:{},lastAction:null};
    };
    this.player=actor(player,c.playerResources);
    // Equal archetype/level combat has genuinely identical entry budgets by default.
    this.opponent=actor(opponent,c.opponentResources??(mode==='combat'&&playerArchetype===c.opponentArchetype&&playerLevel===c.opponentLevel?this.player.entry:undefined));
    const rng=levelRng(c.opponentLevel);
    this.tape=Array.from({length:8},()=>Array.from({length:4},()=>rng()));
    this.round=1;this.range='near';this.agreement=0;this.patience=8;this.suspicion=0;this.claims=[];this.offerUsed=false;this.demonstrationUsed=false;this.materialsSecured=false;this.hurryUsed=0;
    this.log=[];this.result=null;this.settlement=null;this.events=[];this.intent=this.chooseAI();
  }
  alive(actor){return actor.resources.health>0&&actor.resources.mood>0;}
  has(actor,key){return actor.effects[key]&&actor.effects[key].until>=this.round;}
  put(actor,key,value=1,until=this.round+1){actor.effects[key]={value,born:this.round,until};}
  take(actor,key){const effect=this.has(actor,key)?actor.effects[key]:null;delete actor.effects[key];return effect?.value??0;}
  debit(actor,key,amount){const paid=Math.min(actor.resources[key],Math.max(0,amount));actor.resources[key]-=paid;actor.spent[key]+=paid;return paid;}
  restore(actor,key,amount){const got=Math.min(actor.entry[key]-actor.resources[key],Math.max(0,amount));actor.resources[key]+=got;actor.restored[key]+=got;return got;}
  say(text){this.events.push(text);}
  normalize(raw) {
    const c={...raw};c.application??=DEFAULT_MODE[this.config.mode][c.id];
    if(SPELLS[c.id]){
      if(!APPLICATIONS[this.config.mode][c.id].includes(c.application))throw Error('Unknown spell application.');
      if(c.focus||c.exert||c.stake)throw Error('Spell casts cannot buy basic-action boosts.');
    }else{
      if(!(c.id in BASIC_COST[this.config.mode]))throw Error('Unknown action.');
      if(c.focus&&c.exert)throw Error('Choose Focus or Exert, not both.');
      if((c.focus||c.exert||c.stake)&&!TESTED.has(c.id))throw Error('That action does not accept boosts.');
      if(c.stake&&!this.config.publicStakes)throw Error('Reputation stakes are disabled in this private context.');
    }
    return c;
  }
  cost(c) {
    if(SPELLS[c.id])return {mana:SPELLS[c.id].cost[(this.player.kit.spells[c.id]??1)-1]*this.config.manaCostScale};
    const out={...BASIC_COST[this.config.mode][c.id]};
    if(c.focus)out.mana=3*this.config.manaCostScale;if(c.exert)out.health=4;if(c.stake)out.renown=4;
    return out;
  }
  actorCost(actor,c) {
    if(SPELLS[c.id])return {mana:SPELLS[c.id].cost[(actor.kit.spells[c.id]??1)-1]*this.config.manaCostScale};
    if(this.config.mode==='negotiation'&&actor===this.opponent)return {mood:{listen:0,objection:2,scrutinize:2,hurry:3}[c.id]??0};
    return this.cost(c);
  }
  availability(actor,raw) {
    const c={...raw,application:raw.application??DEFAULT_MODE[this.config.mode][raw.id]};
    if(SPELLS[c.id]&&!actor.kit.spells[c.id])return 'Not learned in this kit';
    if(c.id==='rally'&&!this.config.publicStakes)return 'Private context';
    if(c.id==='offer'&&this.offerUsed)return 'Offer already made';
    for(const [key,value]of Object.entries(this.actorCost(actor,c)))if(actor.resources[key]<value)return 'Not enough '+key;
    return '';
  }
  actions(boosts={}) {
    return [...Object.keys(BASIC_COST[this.config.mode]).map(id=>({id,...(TESTED.has(id)?boosts:{})})),
      ...Object.keys(SPELLS).flatMap(id=>APPLICATIONS[this.config.mode][id].map(application=>({id,application})))];
  }
  pay(actor,c) {
    for(const [k,v]of Object.entries(this.actorCost(actor,c)))this.debit(actor,k,v);
    if(this.config.mode==='combat'&&c.id==='haste'&&c.application==='quicken'){
      const n=this.debit(actor,'health',2*this.config.combatScale);this.say('Haste costs '+n+' Health in fatigue.');
    }
  }
  checkInfo(actor,target,c,negResponse=false,paid=false) {
    let skillKey,defence;
    if(negResponse){skillKey='lore';defence=target.kit.skills[c.id==='scrutinize'?'guile':'charm'];}
    else {
      skillKey={strike:'vigor',feint:'guile',reason:'lore',appeal:'charm',bluff:'guile'}[c.id]??'arcana';
      defence=this.config.mode==='combat'?(target.kit.skills.arcana+target.kit.skills.vigor)/2:(target.kit.skills.charm+target.kit.skills.guile)/2;
      if(this.config.mode==='negotiation'){
        const prep=Math.max(this.has(target,'anticipation')?4:0,c.id==='appeal'&&this.has(target,'authority')?4:0);defence+=prep;
      }
    }
    const keys=negResponse?[]:this.config.mode==='combat'?[...(TESTED.has(c.id)?['observeAim','attuneAim']:[]),'foreAim']:['argAim','foreAim'];
    const prep=Math.max(0,...keys.filter(k=>this.has(actor,k)).map(k=>actor.effects[k].value));
    const mood=actor.resources.mood-(paid?0:(this.actorCost(actor,c).mood??0));
    let modifiers=Math.max(prep,c.focus||c.exert?10:0)+(mood<20?-10:0);
    if(this.config.mode==='combat'&&this.has(actor,'feintPenalty'))modifiers-=10;
    modifiers=cap(modifiers,-20,20);
    return {skill:skillKey,actingSkill:actor.kit.skills[skillKey],defence,modifiers,odds:cap(50+2.5*(actor.kit.skills[skillKey]-defence)+modifiers,8,92),keys};
  }
  checked(actor,target,c,slot,response=false) {
    const info=this.checkInfo(actor,target,c,response,true),roll=this.tape[this.round-1][slot]*100,ok=roll<info.odds;
    for(const k of info.keys)this.take(actor,k);
    if(this.config.mode==='combat')this.take(actor,'feintPenalty');
    if(this.config.mode==='negotiation'&&!response){this.take(target,'anticipation');if(c.id==='appeal')this.take(target,'authority');}
    this.say(label(c)+': '+(ok?'success':'miss')+' ('+info.odds+'% chance, roll '+roll.toFixed(1)+').');
    this.checks.push({...info,keys:undefined,roll,ok,actor:actor===this.player?'player':'opponent',action:c.id});
    return ok;
  }
  preview(raw) {
    const c=this.normalize(raw),tested=TESTED.has(c.id)||(this.config.mode==='combat'&&SPELL_ATTACKS.has(c.id)&&c.application!=='nothing');
    return {command:c,cost:this.actorCost(this.player,c),disabled:this.result?'Encounter finished':this.availability(this.player,c),check:tested?this.checkInfo(this.player,this.opponent,c):null,
      warning:c.application==='hostile'?'Immediate failure. Costs are still paid.':c.id==='haste'&&this.config.mode==='combat'?'Also costs '+(2*this.config.combatScale)+' Health in fatigue.':'',
      effect:this.describe(c)};
  }
  describe(c) {
    const b=(this.player.kit.spells[c.id]??1)-1,s=this.config.combatScale;
    if(c.application==='nothing')return 'No useful target: spend Mana and your action; no effect.';
    if(c.application==='hostile')return 'Intimidate, injure or silence the audience: negotiation ends in failure.';
    if(this.config.mode==='combat'){
      const text={strike:'Near range: '+((6+(c.stake?2:0))*s)+' damage on success, '+(2*s)+' on miss, before protection.',feint:'Near range: '+((4+(c.stake?2:0))*s)+' damage on success; bypass Guard, penalize next enemy attack.',approach:'Close the distance. Opposing withdrawal takes precedence.',guard:'Block '+(4*s)+' from the next Strike this exchange. Not Feint or spells.',observe:'Prepare +10 points for your next physical attack.',recover:'Recover up to '+(3*s)+' Health; costs 4 Mood.',compose:'Recover up to 4 Mood; give up your attack.',rally:'Spend 4 Renown to recover up to 8 Mood.',concede:'Accept defeat now; preserve resources and settle rebates.',
        flame:'Deal '+((8+b)*s)+' / '+(2*s)+' damage. Bypass Guard and destroy Barricade.',tide:'Deal '+((5+b)*s)+' / '+s+' damage; a hit reduces the next Flame hitting its Wet target.',foresight:'Reveal the full next enemy action; +10 points to your next attack.',starlight:'Remove Decoy; deal '+((4+b)*s)+' / '+s+' damage.',restoration:c.application==='clean'?'Remove your Wet effect.':'Recover up to '+((6+b)*s)+' Health, capped at your entry balance.',shape:'Block '+((8+b)*s)+' from the next Strike. Flame destroys the barrier.',glamour:'Decoy absorbs '+((4+b)*s)+' from the next attack; Starlight exposes it.',hush:'Suppress the next offensive spell by '+((4+b)*s)+' damage. Casting remains allowed.',haste:'Act earlier next exchange; pay '+(2*s)+' Health fatigue now.',attune:c.application==='calm'?'Recover up to '+(6+b)+' Mood.':'Prepare +10 physical accuracy and absorb '+((3+b)*s)+' from next Strike.',ward:'Absorb up to '+((8+b)*s)+' from the first attack reaching your Ward.',shadowstep:'Move '+c.application+'; evade '+((3+b)*s)+' from next attack.'};
      return text[c.id];
    }
    const workshop=this.config.fixture==='workshop_request',demo=this.demonstrationUsed?'Demonstration already credited; no further Agreement.':workshop?'One demonstration: +'+(3+b)+' Agreement.':'No relevant demonstration in this formal petition.';
    const text={reason:'Lore check: +4 Agreement (+1 if preferred).',appeal:'Charm check: +4 Agreement (+1 if preferred).',bluff:'Guile check: +6 Agreement / +1 Suspicion on success; +2 Suspicion and -3 Renown on failure. A claim can be caught later.',offer:'Once: 8 crowns for +5 Agreement (+1 if preferred).',prepare:'Prepare +10 points for the next argument.',reassure:'Reduce Suspicion by 1. Costs 2 Mood.',retract:'Retract oldest claim, remove its credit; -1 Suspicion.',compose:'Recover up to 4 Mood. Time still passes.',close:'Bank '+(this.agreement>=18?'a win':this.agreement>=10?'a partial agreement':'a failure')+' now; settle rebates.',
      flame:demo,tide:demo,foresight:'Reveal next full response and prepare +10 check points.',starlight:c.application==='demonstrate'?demo:'Remove audience Glamour Authority; does not verify lies.',restoration:c.application==='recover'?'Restore up to '+(3*(6+b))+' lost Health.':demo,shape:c.application==='demonstrate'?demo:workshop?'Secure materials against the exchange-3 scattering.':'No loose materials; cast has no effect.',glamour:'Next Appeal/Bluff success gains +'+(2+b)+' Agreement; now +1 Suspicion and lose up to 2 Renown.',hush:workshop?'Quiet the exchange-5 interruption if timed to cover it.':'Private quiet has no numerical effect.',haste:'Next action waives one base Patience loss; Hurry and round limit remain.',attune:c.application==='calm'?'Recover up to '+(6+b)+' Mood.':workshop?'Next successful Reason/Appeal gains +'+(2+b)+' Agreement.':'No consent: ineffective, +1 Suspicion.',ward:workshop?'Protect materials from scattering if the Ward is active on exchange 3.':'No physical threat; no effect.',shadowstep:'Leave now with '+(this.agreement>=18?'win':this.agreement>=10?'partial':'lose')+'; still pay Mana.'};
    return text[c.id];
  }
  chooseAI() {
    const a=this.opponent,t=ARCHETYPES[a.kit.archetype],temp=a.kit.temperament,i=(this.round-1+a.kit.cycleOffset)%3;
    const available=c=>!this.availability(a,c);
    const make=id=>{const c=command(id);c.application??=DEFAULT_MODE[this.config.mode][c.id];return c;};
    if(this.config.mode==='negotiation'){
      let id=t.audience[i];
      if(this.claims.length&&(this.claims.length>=2||temp===0))id='scrutinize';
      else if(this.agreement>=14+temp&&id==='listen')id='objection';
      if(id==='hurry'&&this.hurryUsed>=2)id='objection';
      if(id==='anticipate')return this.has(a,'anticipation')||!available({id:'foresight',application:'anticipate'})?{id:'listen'}:{id:'foresight',application:'anticipate'};
      if(id==='authority')return this.has(a,'authority')||!available({id:'glamour',application:'authority'})?{id:'listen'}:{id:'glamour',application:'authority'};
      return available({id})?{id}:{id:'listen'};
    }
    if(this.round<8){
      if(a.resources.mood<20)return this.config.publicStakes&&a.entry.mood-a.resources.mood>=8&&available({id:'rally'})?{id:'rally'}:{id:'compose'};
      if(a.resources.health<=this.config.combatScale*(8-temp)){
        const b=(a.kit.spells.restoration??1)-1;
        if(a.entry.health-a.resources.health>=this.config.combatScale*(6+b)&&available(make('restoration')))return make('restoration');
        return available({id:'recover'})?{id:'recover'}:{id:'compose'};
      }
    }
    const family=t.cycle[i];
    if(family==='attack'&&this.range==='far')return available(make('shadowstep:near'))?make('shadowstep:near'):{id:'approach'};
    let candidates=(family==='attack'?t.attacks:t.prepares).map(make).filter(available);
    if(family==='attack'){
      for(const [condition,id]of [[this.has(this.player,'decoy'),'starlight'],[this.has(this.player,'barricade'),'flame'],[this.player.lastAction?.id==='guard','feint']]){
        if(condition&&candidates.some(c=>c.id===id))return candidates.find(c=>c.id===id);
      }
    }else{
      const effect={foresight:'forecast',shape:'barricade',glamour:'decoy',ward:'ward',haste:'haste',hush:'suppressed',attune:'rhythm',observe:'observeAim'};
      candidates=candidates.filter(c=>{
        const b=(a.kit.spells[c.id]??1)-1;
        if(c.id==='restoration')return a.entry.health-a.resources.health>=this.config.combatScale*(6+b);
        if(c.id==='shadowstep')return !(c.application==='far'&&this.range==='far');
        if(c.id==='hush')return Object.keys(this.player.kit.spells).some(s=>SPELL_ATTACKS.has(s))&&!this.has(this.player,'suppressed');
        return !effect[c.id]||!this.has(a,effect[c.id]);
      });
    }
    if(!candidates.length){const id=family==='attack'?'observe':'guard';return available({id})?{id}:{id:'compose'};}
    const n=Math.min(candidates.length,1+temp);return candidates[Math.floor(n*this.tape[this.round-1][2])];
  }
  intentView() {
    const c=this.intent;
    const forecast=this.has(this.player,'forecast')&&this.player.effects.forecast.born<this.round;
    if(this.config.visibility==='open'||forecast)return {exact:true,text:label(c)};
    if(this.config.mode==='combat'){
      const family=['strike','feint'].includes(c.id)?'physical':SPELL_ATTACKS.has(c.id)?'spell':c.id==='approach'?'approach':'prepare';
      return {exact:false,text:{physical:'A physical attack is coming.',spell:'Your opponent readies an offensive spell.',approach:'Your opponent is closing the distance.',prepare:'Your opponent is preparing or recovering.'}[family],family};
    }
    return {exact:false,text:{listen:'The audience is ready to listen.',scrutinize:'The audience is preparing a question.',objection:'The audience is preparing an objection.',hurry:'The audience is about to hurry you.',foresight:'The audience is preparing its next response.',glamour:'The audience is preparing its presentation.'}[c.id]};
  }
  combatPrepare(actor,target,c) {
    const b=(actor.kit.spells[c.id]??1)-1,s=this.config.combatScale;
    if(c.application==='nothing'){this.say(label(c)+' finds no useful target.');return;}
    switch(c.id){
      case 'guard':this.put(actor,'guard',4*s,this.round);break;
      case 'approach':break;
      case 'observe':this.put(actor,'observeAim',10);break;
      case 'recover':this.say('Recovered '+this.restore(actor,'health',3*s)+' Health.');break;
      case 'compose':this.say('Composure restored '+this.restore(actor,'mood',4)+' Mood.');break;
      case 'rally':this.say('Rally restored '+this.restore(actor,'mood',8)+' Mood.');break;
      case 'restoration':if(c.application==='clean')this.take(actor,'wet');else this.say('Restoration healed '+this.restore(actor,'health',(6+b)*s)+' Health.');break;
      case 'shape':this.put(actor,'barricade',(8+b)*s);break;
      case 'glamour':this.put(actor,'decoy',(4+b)*s);break;
      case 'ward':this.put(actor,'ward',(8+b)*s);break;
      case 'hush':this.put(target,'suppressed',(4+b)*s);break;
      case 'foresight':this.put(actor,'forecast');this.put(actor,'foreAim',10);break;
      case 'haste':this.put(actor,'haste');break;
      case 'attune':if(c.application==='calm')this.say('Attune restored '+this.restore(actor,'mood',6+b)+' Mood.');else{this.put(actor,'attuneAim',10);this.put(actor,'rhythm',(3+b)*s);}break;
      case 'shadowstep':this.put(actor,'evasion',(3+b)*s);break;
    }
  }
  combatAttack(actor,target,c,slot) {
    if((c.id==='strike'||c.id==='feint')&&this.range!=='near'){this.say(label(c)+' cannot reach across the ring.');return;}
    const b=(actor.kit.spells[c.id]??1)-1,s=this.config.combatScale;
    if(c.id==='flame'&&this.has(target,'barricade')){this.take(target,'barricade');this.say('Flame burns away the Barricade.');}
    if(c.id==='starlight'&&this.has(target,'decoy')){this.take(target,'decoy');this.say('Starlight exposes the Decoy.');}
    const ok=this.checked(actor,target,c,slot);
    const base={strike:[6,2],feint:[4,0],flame:[8+b,2],tide:[5+b,1],starlight:[4+b,1]}[c.id];
    let damage=(base[ok?0:1]+(ok&&c.stake?2:0))*s;
    const reduce=(owner,key)=>{if(damage>0&&this.has(owner,key)){const n=Math.min(damage,this.take(owner,key));damage-=n;this.say(key+' prevented '+n+' Health damage.');}};
    if(SPELL_ATTACKS.has(c.id))reduce(actor,'suppressed');
    if(c.id==='flame')reduce(target,'wet');
    if(c.id==='strike'){reduce(target,'guard');reduce(target,'barricade');reduce(target,'rhythm');}
    reduce(target,'decoy');reduce(target,'evasion');reduce(target,'ward');
    const actual=this.debit(target,'health',damage);
    this.say((actor===this.player?'You':'Opponent')+' dealt '+actual+' Health damage with '+label(c)+'.');
    if(ok&&actual>0){if(c.id==='tide')this.put(target,'wet',(3+b)*s);if(c.id==='feint')this.put(target,'feintPenalty',10);}
  }
  demonstration(b) {
    if(this.config.fixture!=='workshop_request'){this.say('This petition has no relevant demonstration target.');return;}
    if(this.demonstrationUsed){this.say('The audience already credited your demonstration.');return;}
    this.demonstrationUsed=true;this.agreement+=3+b;this.say('Harmless demonstration: +'+(3+b)+' Agreement.');
  }
  negotiationAction(c) {
    const p=this.player,o=this.opponent,b=(p.kit.spells[c.id]??1)-1,workshop=this.config.fixture==='workshop_request';
    if(c.application==='hostile'){this.say('The audience ends the meeting after your hostile cast.');return 'lose';}
    if(c.application==='nothing'){this.say(label(c)+' finds no useful target.');return;}
    if(TESTED.has(c.id)){
      const ok=this.checked(p,o,c,0),glam=['appeal','bluff'].includes(c.id)?this.take(p,'presentation'):0,attune=['reason','appeal'].includes(c.id)?this.take(p,'connection'):0;
      if(ok){
        let credit=(c.id==='bluff'?6:4)+(ARCHETYPES[o.kit.archetype].preference===c.id?1:0)+Math.max(glam,attune)+(c.stake?2:0);
        this.agreement+=credit;this.say('Your '+c.id+' gained '+credit+' Agreement.');
        if(c.id==='bluff'){this.suspicion++;this.claims.push({credit,round:this.round});}
      }else if(c.id==='bluff'){this.suspicion+=2;this.debit(p,'renown',3);this.say('The Bluff falters: +2 Suspicion, up to -3 Renown.');}
      return;
    }
    switch(c.id){
      case 'offer':this.offerUsed=true;this.agreement+=5+(ARCHETYPES[o.kit.archetype].preference==='offer'?1:0);this.say('Your paid concession advances Agreement.');break;
      case 'prepare':this.put(p,'argAim',10);break;
      case 'reassure':this.suspicion=Math.max(0,this.suspicion-1);this.say('Reassurance reduced Suspicion by 1.');break;
      case 'retract':if(this.claims.length){const claim=this.claims.shift();this.agreement=Math.max(0,this.agreement-claim.credit);this.suspicion=Math.max(0,this.suspicion-1);this.say('Retracted '+claim.credit+' Agreement of risky credit.');}else this.say('There is no claim to retract.');break;
      case 'compose':this.say('Composure restored '+this.restore(p,'mood',4)+' Mood.');break;
      case 'flame':case 'tide':this.demonstration(b);break;
      case 'starlight':if(c.application==='demonstrate')this.demonstration(b);else{const active=this.has(o,'authority');this.take(o,'authority');this.say(active?'Starlight exposes the audience’s Authority.':'There is no Authority illusion to expose.');}break;
      case 'restoration':if(c.application==='recover')this.say('Restoration healed '+this.restore(p,'health',3*(6+b))+' Health.');else this.demonstration(b);break;
      case 'shape':if(c.application==='demonstrate')this.demonstration(b);else if(workshop){this.materialsSecured=true;this.say('Materials secured against scattering.');}else this.say('No loose materials need securing.');break;
      case 'foresight':this.put(p,'forecast');this.put(p,'foreAim',10);break;
      case 'glamour':this.put(p,'presentation',2+b);this.suspicion++;this.debit(p,'renown',2);this.say('Visible Glamour: +1 Suspicion, up to -2 Renown.');break;
      case 'hush':if(workshop)this.put(p,'quiet');else this.say('Private quiet has no numerical benefit here.');break;
      case 'haste':this.put(p,'haste');break;
      case 'attune':if(c.application==='calm')this.say('Attune restored '+this.restore(p,'mood',6+b)+' Mood.');else if(workshop)this.put(p,'connection',2+b);else{this.suspicion++;this.say('No consent for Attune: +1 Suspicion.');}break;
      case 'ward':if(workshop)this.put(p,'materials');else this.say('There is no physical threat to Ward.');break;
    }
  }
  audienceResponse(c) {
    const o=this.opponent,p=this.player;
    switch(c.id){
      case 'listen':this.say('The audience listens without adding pressure.');break;
      case 'objection':if(this.checked(o,p,c,1,true)){this.agreement=Math.max(0,this.agreement-2);this.say('An objection removes 2 Agreement.');}break;
      case 'scrutinize':if(this.claims.length){if(this.checked(o,p,c,1,true)){const claim=this.claims.shift();this.agreement=Math.max(0,this.agreement-claim.credit);this.suspicion+=2;this.debit(p,'renown',4);this.say('Claim caught: -'+claim.credit+' Agreement, +2 Suspicion, up to -4 Renown.');}}else this.say('The audience questions you; there is no false claim to catch.');break;
      case 'hurry':this.hurryUsed++;this.patience=Math.max(0,this.patience-1);this.say('Hurry costs 1 extra Patience.');break;
      case 'foresight':this.put(o,'anticipation',4);break;
      case 'glamour':this.put(o,'authority',4);break;
    }
  }
  closeOutcome(){return this.agreement>=18?'win':this.agreement>=10?'partial':'lose';}
  finish(outcome,reason) {
    if(this.settlement)return this.settlement;
    this.result={outcome,reason,round:this.round};
    const ledger=actor=>Object.fromEntries(RESOURCES.map(k=>{
      const entry=actor.entry[k],before=actor.resources[k],spent=actor.spent[k],restored=actor.restored[k],ratio=this.rebates[k],refund=Math.floor(ratio*Math.min(spent,Math.max(0,entry-before))),final=Math.min(entry,before+refund);
      actor.resources[k]=final;return [k,{entry,spent,restored,before,ratio,refund,final,netLoss:entry-final}];
    }));
    this.settlement={player:ledger(this.player),opponent:ledger(this.opponent)};
    return this.settlement;
  }
  step(raw) {
    if(this.result)throw Error('The encounter is finished.');
    const c=this.normalize(raw),invalid=this.availability(this.player,c);
    if(invalid)throw Error(invalid);
    const ai=copy(this.intent),before={player:copy(this.player.resources),opponent:copy(this.opponent.resources),agreement:this.agreement,patience:this.patience,suspicion:this.suspicion};
    const shown=this.intentView();this.events=[];this.checks=[];
    const exit=c.id==='concede'||c.id==='close'||(c.id==='shadowstep'&&c.application==='withdraw'&&this.config.mode==='negotiation');
    if(exit){this.pay(this.player,c);this.say('You leave the encounter and settle your remaining resources.');this.finish(this.config.mode==='combat'?'lose':this.closeOutcome(),'voluntary exit');}
    else {
      const hasteP=this.has(this.player,'haste')&&this.player.effects.haste.born<this.round,hasteO=this.has(this.opponent,'haste')&&this.opponent.effects.haste.born<this.round;
      if(hasteP)this.take(this.player,'haste');if(hasteO)this.take(this.opponent,'haste');
      this.pay(this.player,c);this.pay(this.opponent,ai);
      if(this.config.mode==='combat'){
        const pairs=[[this.player,this.opponent,c,0],[this.opponent,this.player,ai,1]];
        for(const [actor,target,cmd]of pairs)if(this.alive(actor)&&!(['strike','feint'].includes(cmd.id)||SPELL_ATTACKS.has(cmd.id)&&cmd.application!=='nothing'))this.combatPrepare(actor,target,cmd);
        if(pairs.some(([actor,,cmd])=>this.alive(actor)&&cmd.id==='approach'||this.alive(actor)&&cmd.id==='shadowstep'&&cmd.application==='near'))this.range='near';
        if(pairs.some(([actor,,cmd])=>this.alive(actor)&&cmd.id==='shadowstep'&&cmd.application==='far'))this.range='far';
        const ip=(hasteP?1000:0)+this.player.kit.skills.vigor,io=(hasteO?1000:0)+this.opponent.kit.skills.vigor;
        if(io>ip||(io===ip&&this.round%2===0))pairs.reverse();
        for(const [actor,target,cmd,slot]of pairs)if(this.alive(actor)&&(['strike','feint'].includes(cmd.id)||SPELL_ATTACKS.has(cmd.id)&&cmd.application!=='nothing'))this.combatAttack(actor,target,cmd,slot);
        const p=this.alive(this.player),o=this.alive(this.opponent);
        if(!p||!o)this.finish(p?'win':o?'lose':'partial','defeat before rebate');
        else if(this.round===8){const lead=this.player.resources.health/this.player.entry.health-this.opponent.resources.health/this.opponent.entry.health;this.finish(lead>=.25?'win':lead>-.25&&this.opponent.resources.health<=.75*this.opponent.entry.health?'partial':'lose','eight-exchange limit');}
      }else{
        if(!this.alive(this.player))this.finish('lose','exhausted by expenditure');
        else {
          const catastrophic=this.negotiationAction(c);
          if(catastrophic)this.finish(catastrophic,'hostile casting');
          else {
            if(this.config.fixture==='workshop_request'&&this.round===3){
              if(this.materialsSecured||this.has(this.player,'materials')){this.take(this.player,'materials');this.say('Your materials stay protected.');}else{this.agreement=Math.max(0,this.agreement-2);this.say('Scattered materials cost 2 Agreement.');}
            }
            if(this.config.fixture==='workshop_request'&&this.round===5){
              if(this.has(this.player,'quiet')){this.take(this.player,'quiet');this.say('Hush prevents the noisy interruption.');}else{this.agreement=Math.max(0,this.agreement-2);this.say('Background noise costs 2 Agreement.');}
            }
            if(this.alive(this.opponent))this.audienceResponse(ai);
            this.patience=Math.max(0,this.patience-(hasteP?0:1));
            if(this.suspicion>=6||!this.alive(this.player))this.finish('lose','suspicion or exhaustion');
            else if(this.agreement>=18)this.finish('win','agreement reached');
            else if(this.patience===0||this.round===8||!this.alive(this.opponent))this.finish(this.closeOutcome(),'conversation ended');
          }
        }
      }
    }
    this.player.lastAction=copy(c);this.opponent.lastAction=copy(ai);
    this.log.push({round:this.round,shownIntent:shown,playerCommand:c,opponentCommand:ai,before,events:[...this.events],checks:copy(this.checks),after:{player:copy(this.player.resources),opponent:copy(this.opponent.resources),agreement:this.agreement,patience:this.patience,suspicion:this.suspicion},result:copy(this.result)});
    for(const actor of [this.player,this.opponent])for(const [k,e]of Object.entries(actor.effects))if(e.until<=this.round)delete actor.effects[k];
    if(!this.result){this.round++;this.intent=this.chooseAI();}
    return this.log.at(-1);
  }
  exportLog(){return {rulesVersion:'prototype-0.1',config:copy(this.config),rebates:copy(this.rebates),kits:{player:copy(this.player.kit),opponent:copy(this.opponent.kit)},entry:{player:copy(this.player.entry),opponent:copy(this.opponent.entry)},log:copy(this.log),result:copy(this.result),settlement:copy(this.settlement)};}
}
