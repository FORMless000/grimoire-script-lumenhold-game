// The adapter owns engine details. Policies receive cloned public observations only.
import {Game,ARCHETYPES,SPELLS,TESTED,command,levelRng,cap} from './engine.mjs';
export const id='v01';
export const archetypes=Object.keys(ARCHETYPES);
const copy=x=>structuredClone(x);
const attacks=new Set(['strike','feint','flame','tide','starlight']);
const meaningful=c=>c.application!=='nothing'&&c.application!=='hostile';
function roleView(game,side) {
  return Object.assign(Object.create(Game.prototype),game,side===0?{}:{player:game.opponent,opponent:game.player});
}
function reference(game,side) {
  // chooseAI's selected actor is named opponent. Its candidate draw belongs to that actor's level.
  const view=side===1?Object.assign(Object.create(Game.prototype),game):roleView(game,1);
  const level=side===0?game.player.kit.level:game.opponent.kit.level,rng=levelRng(level);
  view.tape=Array.from({length:8},()=>Array.from({length:4},()=>rng()));
  const c=view.chooseAI();
  return game.config.mode==='combat'?roleView(game,side).normalize(c):c;
}
export function create(config,{episodeSeed,skillShift=0,skillShiftSide=0,checkShift=0}={}) {
  const g=new Game(config);
  const actor=skillShiftSide===0?g.player:g.opponent;
  if(skillShift)for(const key of Object.keys(actor.kit.skills)){
    const next=actor.kit.skills[key]+skillShift;
    if(next<1||next>100)throw Error('Skill-only benchmark would clip a skill.');
    actor.kit.skills[key]=next;
  }
  if(checkShift){
    const original=g.checkInfo;
    g.checkInfo=function(a,target,c,response=false,paid=false){
      const info=original.call(this,a,target,c,response,paid);
      if(a===actor)info.actingSkill+=checkShift;
      if(target===actor)info.defence+=checkShift;
      info.odds=cap(50+2.5*(info.actingSkill-info.defence)+info.modifiers,8,92);
      return info;
    };
  }
  if(episodeSeed!==undefined){
    const rng=levelRng(episodeSeed);
    // Only success checks vary. Level-seeded AI candidate draws remain unchanged.
    for(const row of g.tape){row[0]=rng();row[1]=rng();}
  }
  return g;
}
function healthImpact(game,view,c,p) {
  const actor=view.player,target=view.opponent,b=(actor.kit.spells[c.id]??1)-1,s=game.config.combatScale;
  const base={strike:[6,2],feint:[4,0],flame:[8+b,2],tide:[5+b,1],starlight:[4+b,1]}[c.id];
  if(!base)return 0;
  if(['strike','feint'].includes(c.id)&&game.range!=='near')return 0;
  const reduce=raw=>{
    let d=raw*s;
    if(SPELLS[c.id]&&view.has(actor,'suppressed'))d=Math.max(0,d-actor.effects.suppressed.value);
    if(c.id==='flame'&&view.has(target,'wet'))d=Math.max(0,d-target.effects.wet.value);
    const keys=[...(c.id==='strike'?['guard','barricade','rhythm']:[]),...(c.id==='starlight'?[]:['decoy']),'evasion','ward'];
    for(const k of keys)if(view.has(target,k))d=Math.max(0,d-target.effects[k].value);
    return Math.min(target.resources.health,d);
  };
  return p*reduce(base[0]+(c.stake?2:0))+(1-p)*reduce(base[1]);
}
function option(game,view,c) {
  const meta=view.preview(c),b=(view.player.kit.spells[c.id]??1)-1,s=game.config.combatScale,p=(meta.check?.odds??100)/100;
  const healthMissing=view.player.entry.health-view.player.resources.health,moodMissing=view.player.entry.mood-view.player.resources.mood;
  const out={command:meta.command,cost:meta.cost,kind:'support',tags:[],chance:p,damage:0,healing:0,moodRecovery:0,block:0,progress:0};
  if(game.config.mode==='combat'){
    out.damage=healthImpact(game,view,c,p);
    if(attacks.has(c.id))out.kind='attack';
    out.block=({guard:4,shape:8+b,glamour:4+b,hush:4+b,ward:8+b,attune:3+b,shadowstep:3+b}[c.id]??0)*s;
    if(c.id==='recover'||c.id==='restoration'&&c.application==='recover')out.healing=Math.min(healthMissing,(c.id==='recover'?3:6+b)*s);
    if(c.id==='attune'&&c.application==='calm'){out.block=0;out.moodRecovery=Math.min(moodMissing,6+b);}
    if(c.id==='compose')out.moodRecovery=Math.min(moodMissing,4);
    if(c.id==='rally')out.moodRecovery=Math.min(moodMissing,8);
    if(c.id==='haste')out.cost={...out.cost,health:2*s};
    if(c.id==='approach'||c.id==='shadowstep'&&c.application==='near')out.tags.push('approach');
    if(c.id==='shadowstep'&&c.application==='far')out.tags.push('retreat');
    if(['observe','foresight','attune'].includes(c.id)&&c.application!=='calm')out.tags.push('prepare');
    if(c.id==='concede')out.kind='exit';
  }else{
    if(['reason','appeal','bluff'].includes(c.id)){
      out.kind='argument';out.tags.push(c.id==='bluff'?'deception':'honest');
      const pref=ARCHETYPES[view.opponent.kit.archetype].preference===c.id?1:0;
      const glamour=['appeal','bluff'].includes(c.id)&&view.has(view.player,'presentation')?view.player.effects.presentation.value:0;
      const attune=['reason','appeal'].includes(c.id)&&view.has(view.player,'connection')?view.player.effects.connection.value:0;
      out.progress=p*((c.id==='bluff'?6:4)+pref+(c.stake?2:0)+Math.max(glamour,attune));
    }
    if(c.id==='offer'){out.progress=5+(ARCHETYPES[view.opponent.kit.archetype].preference==='offer'?1:0);out.tags.push('offer');}
    if(['flame','tide'].includes(c.id)||['starlight','shape'].includes(c.id)&&c.application==='demonstrate'||c.id==='restoration'&&c.application==='repair')
      out.progress=game.config.fixture==='workshop_request'&&!game.demonstrationUsed?3+b:0;
    if(c.id==='compose')out.moodRecovery=Math.min(moodMissing,4);
    if(c.id==='attune'&&c.application==='calm')out.moodRecovery=Math.min(moodMissing,6+b);
    if(c.id==='restoration'&&c.application==='recover')out.healing=Math.min(healthMissing,3*(6+b));
    if(['prepare','foresight'].includes(c.id))out.tags.push('prepare');
    if(c.id==='close'||c.id==='shadowstep')out.kind='exit';
  }
  return out;
}
export function observe(game,side,{information='native'}={}) {
  const me=side===0?game.player:game.opponent,other=side===0?game.opponent:game.player,view=roleView(game,side);
  const audience=game.config.mode==='negotiation'&&side===1;
  let options;
  if(audience){
    const commands=[{id:'listen'},{id:'objection'},{id:'scrutinize'},{id:'hurry'},{id:'foresight',application:'anticipate'},{id:'glamour',application:'authority'}];
    options=commands.filter(c=>!game.availability(me,c)&&!(c.id==='hurry'&&game.hurryUsed>=2)).map(c=>({command:c,cost:game.actorCost(me,c),kind:'response',tags:[],damage:0,progress:0}));
  }else{
    const commands=view.actions().filter(meaningful);
    for(const c of view.actions().filter(c=>TESTED.has(c.id))){
      commands.push({...c,focus:true});
      commands.push({...c,exert:true});
      if(game.config.publicStakes)commands.push({...c,stake:true},{...c,focus:true,stake:true},{...c,exert:true,stake:true});
    }
    options=commands.filter(c=>!view.preview(c).disabled).map(c=>option(game,view,c));
  }
  let tell=null;
  if(side===0&&information!=='blind'){
    tell=information==='exact'?{exact:true,command:copy(game.intent)}:game.intentView();
    if(tell.exact)tell.command=copy(game.intent);
    else if(game.config.mode==='negotiation')tell.family={listen:'listen',objection:'object',scrutinize:'question',hurry:'hurry',foresight:'prepare',glamour:'prepare'}[game.intent.id];
  }
  return copy({mode:game.config.mode,role:audience?'audience':'actor',round:game.round,range:game.range,
    self:{skills:me.kit.skills,resources:me.resources,entry:me.entry,effects:me.effects},
    other:{skills:other.kit.skills,resources:other.resources,entry:other.entry,effects:other.effects,lastAction:other.lastAction},
    agreement:game.agreement,patience:game.patience,suspicion:game.suspicion,claimCount:game.claims.length,hurryUsed:game.hurryUsed,
    preferredApproach:ARCHETYPES[other.kit.archetype].preference,fixture:game.config.fixture,tell,options,referenceAction:reference(game,side)});
}
export function commitOpponent(game,c) {
  const actor=game.opponent;
  if(game.availability(actor,c))throw Error('Opponent selected an unaffordable action.');
  if(game.config.mode==='combat')roleView(game,1).normalize(c);
  else if(!observe(game,1).options.some(o=>JSON.stringify(o.command)===JSON.stringify(c)))throw Error('Illegal audience response.');
  game.intent=copy(c);
}
export function advance(game,c){return game.step(c);}
export function ended(game){return !!game.result;}
export function metrics(game) {
  const p=game.settlement.player,o=game.settlement.opponent;
  let otherOutcome;
  if(game.config.mode==='combat'){
    const alive=x=>x.health.before>0&&x.mood.before>0;
    if(game.result.reason==='voluntary exit')otherOutcome='win';
    else if(!alive(p)||!alive(o))otherOutcome=alive(o)?'win':alive(p)?'lose':'partial';
    else {const lead=o.health.before/o.health.entry-p.health.before/p.health.entry;otherOutcome=lead>=.25?'win':lead>-.25&&p.health.before<=.75*p.health.entry?'partial':'lose';}
  }else otherOutcome=game.result.outcome==='win'?'lose':game.result.outcome==='lose'?'win':'partial';
  return {outcomes:[game.result.outcome,otherOutcome],rounds:game.log.length,timeout:game.result.reason==='eight-exchange limit',
    noWinner:game.config.mode==='combat'&&game.result.outcome==='lose'&&otherOutcome==='lose',
    ledgers:[p,o],commands:game.log.map(r=>[r.playerCommand,r.opponentCommand])};
}
export function trace(game){return game.exportLog();}
