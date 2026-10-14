// Policies know public observations, not engine instances, future rolls or hidden commands.
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function best(options,score) {
  if(!options.length)throw Error('Policy has no legal action.');
  return options.map((o,i)=>({o,i,s:score(o)})).sort((a,b)=>b.s-a.s||a.i-b.i)[0].o.command;
}
const basic=o=>o.kind==='attack'&&!o.command.focus&&!o.command.exert&&!o.command.stake&&!('mana' in o.cost);
const spent=o=>(o.cost.mana??0)*.06+(o.cost.renown??0)*.5+(o.cost.mood??0)*.12+(o.cost.health??0)*1.2+(o.cost.crowns??0)*.08;
function estimateThreat(v){
  if(v.tell?.exact){
    const id=v.tell.command.id;
    return ['strike','feint'].includes(id)?'physical':['flame','tide','starlight'].includes(id)?'spell':'prepare';
  }
  if(v.tell)return v.tell.family??'prepare';
  const id=v.other.lastAction?.id;
  return ['strike','feint'].includes(id)?'physical':['flame','tide','starlight'].includes(id)?'spell':'unknown';
}
function combatScore(v,o,reactive=false){
  const threat=estimateThreat(v),remaining=9-v.round;
  const likelyHit=threat==='physical'||threat==='spell'?1:threat==='unknown'?.45:.1;
  let protection=o.block;
  if(o.command.id==='guard'||o.command.id==='shape')protection*=threat==='spell'?0:threat==='physical'?.75:.35;
  if(o.command.id==='hush')protection*=threat==='physical'?0:threat==='spell'?.8:.3;
  const healing=Math.min(o.healing,v.self.entry.health-v.self.resources.health);
  let score=o.damage+healing*(v.self.resources.health<=24?1.4:.75)+protection*likelyHit*(reactive?1.3:.4)+o.moodRecovery*(v.self.resources.mood<20?1.8:.1)-spent(o);
  if(o.tags.includes('prepare'))score+=remaining>1?3:0;
  if(o.tags.includes('approach'))score+=v.range==='far'?10:-10;
  if(o.tags.includes('retreat'))score-=15;
  if(o.kind==='exit')score=-1000;
  return score;
}
export const policies={
  scripted:{modes:['combat','negotiation'],roles:['actor','audience'],choose:v=>{
    const reference=v.options.find(o=>same(o.command,v.referenceAction));
    return reference?.command??best(v.options,o=>o.damage+o.progress-spent(o));
  }},
  rush:{modes:['combat'],roles:['actor'],choose:v=>{
    if(v.range==='far')return best(v.options,o=>o.command.id==='approach'?100:-100);
    const options=v.options.filter(basic);
    return options.length?best(options,o=>o.damage):best(v.options,o=>o.moodRecovery);
  }},
  greedy:{modes:['combat'],roles:['actor'],choose:v=>best(v.options,o=>combatScore(v,o))},
  reactive:{modes:['combat'],roles:['actor'],choose:v=>best(v.options,o=>combatScore(v,o,true))},
  honest:{modes:['negotiation'],roles:['actor'],choose:v=>{
    if(v.agreement>=10&&v.patience<=1)return v.options.find(o=>o.command.id==='close').command;
    return best(v.options.filter(o=>o.kind!=='exit'&&!o.tags.includes('deception')),o=>o.progress-spent(o)+o.moodRecovery*(v.self.resources.mood<20?2:.1));
  }},
  deceiver:{modes:['negotiation'],roles:['actor'],choose:v=>{
    if(v.agreement>=10&&v.patience<=1)return v.options.find(o=>o.command.id==='close').command;
    const questioned=v.tell?.family==='question'||v.tell?.exact&&v.tell.command.id==='scrutinize';
    return best(v.options.filter(o=>o.kind!=='exit'),o=>{
      if(o.tags.includes('deception'))return o.progress*1.25-spent(o)-(questioned?7:0)-(v.suspicion>=4?12:0);
      if(o.command.id==='reassure')return v.suspicion>=4?4:-5;
      return o.progress-spent(o)+o.moodRecovery*(v.self.resources.mood<20?2:.1);
    });
  }},
  opportunist:{modes:['negotiation'],roles:['actor'],choose:v=>{
    if(v.agreement>=10&&v.patience<=1)return v.options.find(o=>o.command.id==='close').command;
    const questioned=v.tell?.family==='question'||v.tell?.exact&&v.tell.command.id==='scrutinize';
    return best(v.options.filter(o=>o.kind!=='exit'),o=>o.progress-spent(o)
      +(o.command.id==='offer'&&v.agreement+o.progress>=18?4:0)
      -(o.tags.includes('deception')?(questioned?8:1)+v.suspicion:0)
      +(o.command.id==='reassure'&&v.suspicion>=4?4:0)+o.moodRecovery*(v.self.resources.mood<20?2:.1));
  }},
  skeptic:{modes:['negotiation'],roles:['audience'],choose:v=>best(v.options,o=>o.command.id==='scrutinize'&&v.claimCount?10:o.command.id==='objection'?5:0)},
  impatient:{modes:['negotiation'],roles:['audience'],choose:v=>best(v.options,o=>o.command.id==='hurry'?10:o.command.id==='objection'?5:0)}
};
export function choose(name,view){
  const p=policies[name];
  if(!p||!p.modes.includes(view.mode)||!p.roles.includes(view.role))throw Error('Policy '+name+' cannot play '+view.mode+' / '+view.role);
  return p.choose(view);
}
