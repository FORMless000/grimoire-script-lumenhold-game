import {RULES_VERSION} from './engine.mjs';
import {RESOURCES} from './roster.mjs';
// Four independent uint32 lanes; every hit additionally compares the full key.
export function hashSearchWords(words){
 const u32=new Uint32Array(words.buffer,words.byteOffset,words.byteLength/4);let a=2166136261,b=2246822519,c=3266489917,d=668265263;
 for(let i=0;i<u32.length;i++){const n=u32[i];a=Math.imul(a^n,16777619);b=Math.imul(b^n,2246822519);c=Math.imul(c^n,3266489917);d=Math.imul(d^n,668265263);}
 return [a>>>0,b>>>0,c>>>0,d>>>0];
}
export function createSearchContext({tableLimit=4096,hashPosition=hashSearchWords}={}){
 if(!Number.isInteger(tableLimit)||tableLimit<1)throw Error('Invalid transposition-table capacity');
 return {tableLimit,hashPosition,table:new Array(tableLimit),size:0,generation:0,invalidations:0,fingerprint:null,searchKits:null,symbols:new Map(),nextSymbol:1,buffers:[],views:[],history:new Map(),killers:[],encoding:[]};
}
export function prepareSearchContext(context,state,policyVersion){
 const config={...state.config};delete config.ai;delete config.search;delete config.computeProfile;
 const fingerprint=JSON.stringify([RULES_VERSION,policyVersion,config,state.rebates,state.actors.map(a=>[a.kit,a.entry,a.maxHP])]);
 if(context.fingerprint!==fingerprint){
  context.table=new Array(context.tableLimit);context.size=0;context.searchKits=null;context.symbols.clear();context.nextSymbol=1;context.history.clear();context.killers=[];context.buffers=[];context.views=[];
  if(context.fingerprint!==null)context.invalidations++;context.fingerprint=fingerprint;
 }
 context.generation++;return context;
}
function searchSymbol(context,value){let id=context.symbols.get(value);if(id===undefined){id=context.nextSymbol++;context.symbols.set(value,id);}return id;}
function encodeSearchValue(context,value,out){
 if(value===null){out.push(0);return;}
 if(value===undefined){out.push(1);return;}
 if(typeof value==='number'){out.push(2,value);return;}
 if(typeof value==='boolean'){out.push(3,Number(value));return;}
 if(typeof value==='string'){out.push(4,searchSymbol(context,value));return;}
 if(Array.isArray(value)){out.push(5,value.length);for(const v of value)encodeSearchValue(context,v,out);return;}
 const keys=Object.keys(value).sort();out.push(6,keys.length);for(const k of keys){out.push(searchSymbol(context,k));encodeSearchValue(context,value[k],out);}
}
const SEARCH_ACTOR_SCALARS=['hp','flux','lastAction','rimeReady','rimeUsed','freezeUntil','pendingRenown','glamourAwarded','rapportCrowns'];
const SEARCH_ACTOR_FIELDS=new Set([...SEARCH_ACTOR_SCALARS,'kit','entry','maxHP','resources','spent','restored','effects','channel','constructs','omens']);
export function searchPositionKey(context,state){
 const out=context.encoding;out.length=0;
 out.push(state.round,state.normalLeader,state.leader,state.earlyCommit[0],state.earlyCommit[1]);
 for(const k of ['pending','lastPair','reports'])encodeSearchValue(context,state[k],out);
 for(const actor of state.actors){
  // Fixed scalar slots avoid repeatedly encoding field names and resource maps.
  for(const k of SEARCH_ACTOR_SCALARS){const v=actor[k];out.push(typeof v==='number'?v:typeof v==='boolean'?Number(v):v===null?0:searchSymbol(context,v));}
  for(const k of ['resources','spent','restored'])for(const resource of RESOURCES)out.push(actor[k][resource]);
  for(const k of ['effects','channel','constructs','omens'])encodeSearchValue(context,actor[k],out);
  // Keep unknown actor fields in identity, rather than silently ignoring future rules.
  const extra=Object.keys(actor).filter(k=>!SEARCH_ACTOR_FIELDS.has(k)).sort();out.push(extra.length);for(const k of extra){out.push(searchSymbol(context,k));encodeSearchValue(context,actor[k],out);}
 }
 const words=Float64Array.from(out),hash=context.hashPosition(words);return {words,hash,index:hash[0]%context.tableLimit};
}
function sameSearchKey(a,b){
 if(a.hash.some((n,i)=>n!==b.hash[i])||a.words.length!==b.words.length)return false;
 const x=new Uint32Array(a.words.buffer,a.words.byteOffset,a.words.byteLength/4),y=new Uint32Array(b.words.buffer,b.words.byteOffset,b.words.byteLength/4);
 for(let i=0;i<x.length;i++)if(x[i]!==y[i])return false;return true;
}
export function probeSearchCache(context,key){const entry=context.table[key.index];return entry&&sameSearchKey(entry,key)?entry:null;}
export function storeSearchCache(context,key,record){
 let entry=context.table[key.index];
 if(!entry||!sameSearchKey(entry,key)){
  if(entry&&entry.generation===context.generation&&entry.depth>record.depth)return;
  if(!entry)context.size++;
  entry={words:key.words,hash:key.hash,depth:record.depth,generation:context.generation,bestId:record.bestId,scores:new Map()};context.table[key.index]=entry;
 }
 entry.depth=Math.max(entry.depth,record.depth);entry.generation=context.generation;entry.bestId=record.bestId;entry.scores.set(record.horizon,record);
 // Depths are bounded by maxDepth; cap retained horizon variants as well.
 if(entry.scores.size>32)entry.scores.delete(entry.scores.keys().next().value);
}
