// Reuse flat rule records at each decision ply; never put these buffers in live state.
function copyFlatSearchRecord(source,target={}){for(const key in target)if(!Object.hasOwn(source,key))delete target[key];return Object.assign(target,source);}
function copyFlatSearchArray(source,target=[]){for(let i=0;i<source.length;i++)target[i]=copyFlatSearchRecord(source[i],target[i]);target.length=source.length;return target;}
function copySearchActor(source,target={}){
 const resources=target.resources,spent=target.spent,restored=target.restored,effects=target.effects??{},channel=target.channel,constructs=target.constructs,omens=target.omens;
 Object.assign(target,source);
 target.resources=copyFlatSearchRecord(source.resources,resources);target.spent=copyFlatSearchRecord(source.spent,spent);target.restored=copyFlatSearchRecord(source.restored,restored);
 for(const id in effects)if(!Object.hasOwn(source.effects,id))delete effects[id];
 for(const id in source.effects)effects[id]=copyFlatSearchRecord(source.effects[id],effects[id]);
 target.effects=effects;target.channel=source.channel?copyFlatSearchRecord(source.channel,channel??undefined):null;
 target.constructs=copyFlatSearchArray(source.constructs,constructs);target.omens=copyFlatSearchArray(source.omens,omens);return target;
}
export function copySearchState(source,target={}){
 const actors=target.actors??[],pending=target.pending??[],earlyCommit=target.earlyCommit??[],reports=target.reports??[];
 Object.assign(target,source);delete target.history;delete target.searchStats;
 for(let i=0;i<2;i++){actors[i]=copySearchActor(source.actors[i],actors[i]);pending[i]=source.pending[i];earlyCommit[i]=source.earlyCommit[i];}
 for(let i=0;i<source.reports.length;i++)reports[i]=source.reports[i];reports.length=source.reports.length;
 target.actors=actors;target.pending=pending;target.earlyCommit=earlyCommit;target.reports=reports;target.searching=true;target.lastEvents=[];target.bursts=[];return target;
}
export function searchChild(source,ply,context,stats){
 if(source.pending[0]===null&&source.pending[1]===null){
  let target=context.views[ply];if(!target)target=context.views[ply]={};
  const pending=target.pending??[null,null];Object.assign(target,source);target.pending=pending;pending[0]=null;pending[1]=null;target.searching=true;stats.commitmentViews++;return target;
 }
 stats.stateCopies++;return context.buffers[ply]=copySearchState(source,context.buffers[ply]);
}
