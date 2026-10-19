// The combat rules and AI search for the browser: the Rust core (rust/core) compiled to WebAssembly (rust/wasm → core.wasm).
// This file only moves data across the boundary and keeps the engine's JS API, so app.mjs and its workers call the same names.
// A state stays a plain JS object (setup.mjs makes it; workers receive copies). Rule calls load it into the core when it is not
// the one already loaded; applyChoice and concede write the core's next state back into the same object.
import {tx,textInUse} from '../setup/text.mjs';

const SYNC=Symbol('core-sync');
const imports={env:{now:()=>performance.now()}};
let coreModule=null,W,loaded=null,serial=0;
// A trap (a panic in the core) poisons the instance; start a fresh one and report the core's message.
function instantiate(){W=new WebAssembly.Instance(coreModule,imports).exports;W.init();loaded=null;}

const encoder=new TextEncoder(),decoder=new TextDecoder();
const read=()=>decoder.decode(new Uint8Array(W.memory.buffer,W.out_ptr(),W.out_len()));
// call(name, ...args): string arguments become (ptr, len) pairs in core memory, freed after the call.
function call(name,...args){
  const instance=W,owned=[],flat=[];
  for(const a of args){if(typeof a!=='string'){flat.push(a);continue;}const b=encoder.encode(a),p=W.alloc(b.length);new Uint8Array(W.memory.buffer,p,b.length).set(b);owned.push([p,b.length]);flat.push(p,b.length);}
  try{return W[name](...flat);}
  catch(e){if(!(e instanceof WebAssembly.RuntimeError))throw e;const message=read();instantiate();throw Error(message||e.message);}
  finally{if(W===instance)for(const [p,n] of owned)W.dealloc(p,n);}
}
function use(s){if(loaded!==s||s[SYNC]!==serial){call('load',JSON.stringify(s));loaded=s;s[SYNC]=++serial;}}
// The core's state after a change, written into the caller's object.
function writeBack(s){call('dump');const next=JSON.parse(read());for(const k of Object.keys(s))if(!(k in next))delete s[k];Object.assign(s,next);loaded=s;s[SYNC]=++serial;}

export let RULES_VERSION=null;
export const POLICY_VERSION='alpha-beta-2';
// Starts the core from a compiled WebAssembly.Module: the loader at the end of this file (the bench, Node), or the main game's
// bundle (build/combat.bundle.js, from combat/tools/bundle.mjs), which cuts that loader and passes the module it compiled.
export function initCore(module){coreModule=module;instantiate();call('rules_version');RULES_VERSION=read();}
export const coreReady=()=>!!coreModule;

// An action's name: in the main game's language when it handed translations (useText: label.<id>; spells by their id).
export const BASIC_LABELS={strike:'Strike',guard:'Guard',reclaim:'Reclaim',hold:'Hold',release:'Release',frozen:'Frozen',cancel:'Cancelled'};
export function label(id){
  if(typeof id!=='string')return id;
  if(textInUse()){if(id.startsWith('bundle:'))return id.slice(7).split('+').map(label).join(' + ');const t=tx('label.'+id,null);if(t)return t;}
  call('label',id);return read();
}
// Event text, from the structured events the core returns.
export function formatEvent(e){
  const who=side=>side===0?'You':'Opponent';
  switch(e.type){
    case 'constructEnded':return `${label(e.id)} ended.`;
    case 'froze':return `${who(e.side)} froze on 1 HP; thaw after next exchange.`;
    case 'witnessed':return `Observers witnessed forbidden ${label(e.id)}.`;
    case 'compelsCancel':return 'Opposing Compels cancel each other.';
    case 'tormentCharged':return `Torment charged ${e.value.toFixed(2)} HP for the action.`;
    case 'hoarfrostCancel':return 'Hoarfrost and opposing fire cancel.';
    case 'dealt':return `${label(e.id)} dealt ${Math.round(e.amount*100)/100} HP to ${e.target===0?'you':'opponent'}.`;
    case 'reclaimed':return `${who(e.side)} reclaimed ${e.amount.toFixed(2)} Mana.`;
    case 'hit':case 'moved':return null;   // structured only: the fight text (resolvedLines) tells these
  }
  throw Error('Unknown event '+e.type);
}

export function cloneState(s){return structuredClone(s);}
export function actorToMove(s){use(s);const side=call('actor');return side<0?null:side;}
export function legalActions(s,side){use(s);call('legal',side??-1);return JSON.parse(read());}
// Why an action can't be taken (rust/core/src/rules.rs unavailable), by key for translations.
export const UNAVAILABLE={frozen:'Frozen this exchange',notAction:'Not an available action',channeling:'Hold or Release while channeling',notChanneling:'Not channeling',hasteBundle:'Haste requires one basic-action bundle',noBundle:'No Haste bundle available',notLearned:'Not learned',cardsOnly:'Cards/story only',mana:'Not enough ready Mana',hp:'Not enough HP'};
const UNAVAILABLE_KEY=Object.fromEntries(Object.entries(UNAVAILABLE).map(([k,v])=>[v,k]));
export function available(s,side,id){use(s);call('unavailable',side,id);const r=read();return r&&textInUse()&&UNAVAILABLE_KEY[r]?tx('unavailable.'+UNAVAILABLE_KEY[r],r):r;}
export function cost(s,side,id){use(s);return call('cost',side,id);}
export function hpCost(s,side,id){use(s);return call('hp_cost',side,id);}
export function has(s,side,key){use(s);return !!call('has',side,key);}
// What an action does, from the core's template (rust/core/src/text.rs): English from the core, or rendered here with the
// translations (useText: the template keys of textTable()). describeData is the template itself (web/brief.mjs reads it).
export function describe(s,side,id){if(textInUse())return renderText(describeData(s,side,id));use(s);call('describe',side,id);return read();}
export function describeData(s,side,id){use(s);call('describe_data',side,id);return JSON.parse(read());}
let TEXT_EN=null;
export function textTable(){if(!TEXT_EN){call('text_table');TEXT_EN=JSON.parse(read());}return TEXT_EN;}
export function renderText(v){
  if(typeof v==='string')return v;
  if(Array.isArray(v))return v.map(renderText).join(tx('w.listSep',', '));
  if(!v||typeof v!=='object')return '';
  if(v.label!==undefined)return label(v.label);
  return tx(v.k,textTable()[v.k]??'').replace(/\{(\w+)\}/g,(m,n)=>n in v?renderText(v[n]):'');
}
export function applyChoice(s,id){
  use(s);
  if(call('apply',id))throw Error(read());
  const r=JSON.parse(read());writeBack(s);
  if(r.resolved){r.eventData=r.events;s.lastEvents=r.events=r.events.map(formatEvent).filter(Boolean);}
  return r;
}
export function concede(s,side=0){if(![0,1].includes(side))throw Error('Invalid actor');use(s);call('concede',side);writeBack(s);}

// Search contexts (transposition table, history, killers) live in core memory; freed with freeSearchContext or when collected.
const contexts=new FinalizationRegistry(({handle,instance})=>{if(instance===W)W.context_free(handle);});
export function createSearchContext({tableLimit=4096}={}){
  if(!Number.isInteger(tableLimit)||tableLimit<1)throw Error('Invalid transposition-table capacity');
  const ctx={handle:call('context_new',tableLimit),instance:W,tableLimit};contexts.register(ctx,{handle:ctx.handle,instance:W},ctx);return ctx;
}
export function freeSearchContext(ctx){if(ctx?.handle&&ctx.instance===W){contexts.unregister(ctx);W.context_free(ctx.handle);ctx.handle=0;}}
const handle=ctx=>ctx&&ctx.instance===W?ctx.handle:0;
const optionsJSON=o=>JSON.stringify(o??{},(k,v)=>typeof v==='function'?undefined:v);
export function searchAction(state,opts={},ctx){use(state);if(call('search',handle(ctx),optionsJSON(opts)))throw Error(read());return JSON.parse(read());}
export function chooseAIAction(state,opts={},ctx){use(state);if(call('choose',handle(ctx),optionsJSON(opts)))throw Error(read());return JSON.parse(read());}
// The analysis view follows stored best moves: the "key" of a position is the state itself.
export function searchPositionKey(ctx,s){return s;}
export function probeSearchCache(ctx,s){use(s);call('best',handle(ctx));const id=read();return id?{bestId:id}:undefined;}

// <loader> The bench and Node: core.wasm next to this file. A worker compiles synchronously: a module worker that awaited here
// would miss the messages posted while it loads. combat/tools/bundle.mjs cuts from here to </loader>.
const source=new URL('./core.wasm',import.meta.url);
function bytesSync(url){const x=new XMLHttpRequest();x.open('GET',url,false);x.responseType='arraybuffer';x.send();if(x.status!==200)throw Error('core.wasm: HTTP '+x.status);return x.response;}
initCore(globalThis.process?.versions?.node
  ?new WebAssembly.Module((await import('node:fs')).readFileSync(source))
  :typeof document==='undefined'
    ?new WebAssembly.Module(bytesSync(source))
    :await WebAssembly.compileStreaming(fetch(source)).catch(async()=>WebAssembly.compile(await (await fetch(source)).arrayBuffer())));
// </loader>
