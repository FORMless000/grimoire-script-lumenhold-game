'use strict';
// Reading order only. Labels, frozen artifacts and saved ratings are never rewritten.
const G=require('../../src/grimoire.js'),U=require('./util.js');
const GROUPS={
  stables:{key:'stables',title:'Routine events · Stables',rank:0},
  courtyard:{key:'courtyard',title:'Routine events · Courtyard',rank:1},
  lyra:{key:'lyra',title:'Rivalry · Lyra',rank:2},
  newt:{key:'newt',title:'Midnight gig · Gilded Newt',rank:3},
  library:{key:'library',title:'Spell discovery · Library',rank:4},
};
function definition(card){return card.compiledDef||card.block?.def||{};}
function sourceOrder(a,b){return (a.block?.file||'').localeCompare(b.block?.file||'')||(a.block?.line||0)-(b.block?.line||0)||a.key.localeCompare(b.key);}
function prerequisites(ast,out={flags:new Set(),events:new Set()}){
  if(!ast)return out;
  if(ast.t==='bin'&&['&&','||'].includes(ast.op)){prerequisites(ast.a,out);prerequisites(ast.b,out);}
  else if(ast.t==='call'&&ast.n==='flag'&&ast.args[0]?.t==='sym')out.flags.add(ast.args[0].v);
  else if(ast.t==='bin'&&ast.a?.t==='call'&&ast.b?.t==='num'){
    const call=ast.a,positive=ast.op==='>'&&ast.b.v>=0||ast.op==='>='&&ast.b.v>=1||ast.op==='!='&&ast.b.v===0;
    if(positive&&['seen','since'].includes(call.n)&&call.args[0]?.t==='sym')out.events.add('event:'+call.args[0].v);
  }
  // Negated flags and seen(x)==0 are not predecessor evidence.
  return out;
}
function units(artifact){
  const cards=artifact.cards.filter(c=>c.key.startsWith('event:')),byKey=new Map(cards.map(c=>[c.key,c])),adj=new Map(cards.map(c=>[c.key,new Set()])),forward=new Map(cards.map(c=>[c.key,new Set()])),writers=new Map();
  function connect(from,to){if(from===to||!byKey.has(from)||!byKey.has(to))return;adj.get(from).add(to);adj.get(to).add(from);forward.get(from).add(to);}
  for(const c of cards){const d=definition(c);for(const effects of [d.on_show||[],...(d.options||[]).map(o=>o.effects||[])])G.walkEffects(effects,s=>{
    if(s.t==='flag')for(const name of s.names||[]){if(!writers.has(name))writers.set(name,[]);writers.get(name).push(c.key);}
    if(s.t==='queue'&&s.event)connect(c.key,'event:'+s.event);
  });}
  const explicitChains=new Map();
  for(const c of cards){const d=definition(c),refs=prerequisites(d.when?.ast);for(const flag of refs.flags)for(const from of writers.get(flag)||[])connect(from,c.key);for(const from of refs.events)connect(from,c.key);
    if(d.chain){const prior=explicitChains.get(d.chain);if(prior)connect(prior,c.key);else explicitChains.set(d.chain,c.key);}
  }
  const seen=new Set(),result=[];
  for(const c of cards.sort(sourceOrder)){
    if(seen.has(c.key))continue;const keys=[],todo=[c.key];while(todo.length){const key=todo.pop();if(seen.has(key))continue;seen.add(key);keys.push(key);todo.push(...adj.get(key));}
    const remaining=new Set(keys),ordered=[];let cyclic=false;
    while(remaining.size){let available=[...remaining].filter(to=>![...remaining].some(from=>forward.get(from).has(to)));if(!available.length){cyclic=true;available=[...remaining];}available.sort((a,b)=>sourceOrder(byKey.get(a),byKey.get(b)));const next=available[0];remaining.delete(next);ordered.push(byKey.get(next));}
    result.push({cards:ordered,cyclic});
  }
  // Deleted/unparseable records remain inspectable at the end.
  for(const c of artifact.cards.filter(c=>!byKey.has(c.key)))result.push({cards:[c],cyclic:false});
  return result;
}
function group(cards){
  const defs=cards.map(definition),tags=new Set(defs.flatMap(d=>d.tags||[])),places=new Set(defs.map(d=>d.place).filter(Boolean));
  if(defs.some(d=>d.actor==='lyra')&&(tags.has('rival')||defs.some(d=>/bond\(lyra\)\s*==\s*["']rival["']/.test(d.when?.src||''))))return GROUPS.lyra;
  if(tags.has('company_night')||places.has('gilded_newt')||defs.some(d=>d.track==='tavern'||/gig_newt/.test(d.when?.src||'')))return GROUPS.newt;
  if(places.has('library'))return GROUPS.library;
  if(places.has('stables'))return GROUPS.stables;
  if(places.has('courtyard'))return GROUPS.courtyard;
  const place=[...places].sort()[0];return {key:place?'place:'+place:'other',title:place?'Events · '+place:'Other events',rank:5};
}
function arrange(m,artifacts,views){
  const byLabel=new Map(views.map(v=>[v.label,v])),all=[];
  for(const batch of m.batches)for(const unit of units(artifacts.get(batch.id))){
    const labels=unit.cards.map(c=>Object.entries(m.mapping).filter(([,p])=>p.batch===batch.id&&p.key===c.key).map(([label])=>label));
    const primary=labels.map(a=>a[0]).filter(Boolean);if(!primary.length)continue;
    all.push({...unit,batch:batch.id,group:group(unit.cards),labels,primary});
  }
  const categories=[...new Map(all.map(u=>[u.group.key,u.group])).values()].sort((a,b)=>a.rank-b.rank||a.key.localeCompare(b.key));
  const output=[];
  for(const category of categories){
    const selected=U.shuffle(all.filter(u=>u.group.key===category.key),U.rng(m.seed+':reading-order-v1:'+category.key));
    if(selected.length>1&&selected.at(-1).labels.some(labels=>labels.length>1))selected.unshift(selected.pop());
    let chainNumber=0;const delayed=[];
    function append(label,unit,index,chain){const card=byLabel.get(label);if(!card)throw new Error('Review ordering lost a presentation');output.push({...card,reviewGroup:{key:category.key,title:category.title},reviewChain:chain?{...chain,position:index+1,length:unit.cards.length,sourceOrderFallback:unit.cyclic}:null});}
    for(const unit of selected){
      const chain=unit.cards.length>1?{id:'chain-'+U.hash(unit.primary).slice(0,12),number:++chainNumber}:null;
      for(const [i,labels] of unit.labels.entries()){if(labels[0])append(labels[0],unit,i,chain);for(const label of labels.slice(1))delayed.push({label,unit,index:i,chain});}
    }
    // Keep consistency presentations, without interrupting a primary story sequence.
    for(const entry of delayed)append(entry.label,entry.unit,entry.index,entry.chain);
  }
  if(output.length!==views.length||new Set(output.map(c=>c.label)).size!==views.length)throw new Error('Review ordering changed presentation identity or coverage');
  return output;
}
module.exports={prerequisites,units,group,arrange};
