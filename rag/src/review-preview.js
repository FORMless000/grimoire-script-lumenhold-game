/* Inspection controls, not a simulated player. Text selection and tier sizes reuse the game. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../../src/grimoire.js'),require('../../src/engine.js'));
  else root.ReviewPreview=factory(root.Grimoire,root.Engine);
})(typeof self!=='undefined'?self:this,function(G,Engine){
  'use strict';
  function prose(def){
    const text=[def.title,def.scene,def.text];
    for(const option of def.options||[])text.push(option.label,option.hint,option.locked);
    G.walkEffects(def.on_show||[],s=>{if(s.t==='say')text.push(s.text);});
    for(const option of def.options||[])G.walkEffects(option.effects||[],s=>{if(s.t==='say')text.push(s.text);});
    return text.filter(x=>typeof x==='string');
  }
  function variants(def){
    let count=1;const conditions=new Set();
    function scan(text){
      for(let i=0;i<text.length;i++){
        if(text[i]!=='{')continue;
        let depth=0,j=i;for(;j<text.length;j++){if(text[j]==='{')depth++;else if(text[j]==='}'&&!--depth)break;}
        if(j===text.length)break;
        const inner=text.slice(i+1,j);let d=0,start=0,colon=-1;const parts=[];
        for(let k=0;k<inner.length;k++){const ch=inner[k];if(ch==='{')d++;else if(ch==='}')d--;else if(!d&&ch==='|'){parts.push(inner.slice(start,k));start=k+1;}else if(!d&&ch===':'&&start===0&&colon<0)colon=k;}
        parts.push(inner.slice(start));
        if(inner[0]!=='='){
          const conditional=colon>0&&!['~','&'].includes(inner[0]);
          if(conditional)conditions.add(inner.slice(0,colon).trim());else count=Math.max(count,parts.length);
          scan(conditional?inner.slice(colon+1):inner);
        }
        i=j;
      }
    }
    prose(def).forEach(scan);return {count,conditions:[...conditions]};
  }
  function vary(text,selection={}){
    const context=Object.create(Engine.prototype),index=selection.variant||0;
    context._exprCache={};context.s={seen:{review:index+1}};
    context.variantHash=()=>index;
    context.test=ex=>selection.conditions?.[ex.src]!==false;
    return context.vary(String(text||''),null,'review');
  }
  function branches(step){
    if(step.t==='if')return [...step.branches.map(b=>({label:b.cond.src,body:b.body})),{label:'Else',body:step.else||[]}];
    if(step.t==='challenge')return ['win','partial','lose'].filter(k=>step[k]).map(k=>({label:k,body:step[k]}));
    if(step.body)return [{label:'Success / taken',body:step.body},{label:'Failure / otherwise',body:step.else||[]}];
    return [];
  }
  function selected(steps,choices={},prefix='effects'){
    return (steps||[]).flatMap((step,i)=>{const key=prefix+'.'+i,options=branches(step);return options.length?selected((options[choices[key]||0]||options[0]).body,choices,key+'.'+(choices[key]||0)):[step];});
  }
  function stat(step,mechanics={}){
    let row,label,amount;
    if(step.t==='delta'){row=step.name;label=mechanics.names?.[row]||row;}
    else if(['rel','spark','npc_rel'].includes(step.t)){row=step.t==='npc_rel'?'rel':step.t;label=row+' '+(step.npc||[step.a,step.b].join(' ↔ '));}
    else if(['study','perform','progress','rank_xp'].includes(step.t)){row={perform:'performance',rank_xp:'xp'}[step.t]||step.t;label=step.t+' '+(step.track||'');}
    else return null;
    const context=Object.create(Engine.prototype);context.c={balance:{sizes:mechanics.sizes||{}},skills:mechanics.skills||{}};
    if(step.tier){
      const defaults={study:[1,3,5,8,12],performance:[2,5,8,15,25],progress:[2,4,8,15,25]};
      const n=step.sign*(defaults[row]?context.trackSize(row,step.tier,defaults[row]):context.tierAmount(row,step.tier));
      amount=Number.isFinite(n)?(n>=0?'+':'')+n:'?';
    }else if(step.min!=null)amount=step.min===step.max||step.max==null?(step.min>=0?'+':'')+step.min:step.min+'…'+step.max;
    else return null;
    return {label,amount,tier:step.tier||null,xp:!!mechanics.skills?.[row],type:step.t};
  }
  return {variants,vary,branches,selected,stat};
});
