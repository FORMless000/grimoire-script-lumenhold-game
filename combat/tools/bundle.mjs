// The minigame for the main game: build/combat.bundle.js, one classic script (UMD) that works from file:// and in Node.
//   node combat/tools/bundle.mjs            rebuild core.wasm (export-data + cargo), then write the bundle
//   node combat/tools/bundle.mjs --no-wasm  write the bundle from the core.wasm already built (combat/web/core.wasm)
// It holds setup/ (data, kits, foes, the campaign bridge, flavor), the core's JS face (web/core.mjs without its loader) and
// brief.mjs, with core.wasm inlined as base64. One global, LumenholdCombat (module.exports in Node):
//   initSync()   compile and start the core synchronously (Node, workers; a browser's main thread refuses modules > 4 KB)
//   init()       the same, asynchronously (a browser's main thread): a promise of the API
//   createAI()   the AI search in a worker made from a Blob of this bundle (works from file://), or on the main thread at a
//                small node budget when workers are unavailable: {choose(state, options) → promise, reset(), terminate()}
//   …and every export of the bundled modules (createState, fightOptions, settle, EVENTS, FOES, chooseAIAction, describe…).
// The source of truth stays in combat/; the bundle is committed, like build/content.bundle.js (combat/tools/bundle-hash.cjs
// says when it is stale).
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {COMBAT,BUNDLE,MODULES,sourcesHash}=require('./bundle-hash.cjs');
const os=await import('node:os');
const sh=(cmd,args,cwd=COMBAT)=>execFileSync(cmd,args,{cwd,stdio:'inherit',env:{...process.env,PATH:path.join(os.homedir(),'.cargo/bin')+path.delimiter+process.env.PATH}});

if(!process.argv.includes('--no-wasm')){
 sh('node',['tools/export-data.mjs']);
 sh('cargo',['build','--profile','wasm','-p','combat-wasm','--target','wasm32-unknown-unknown'],path.join(COMBAT,'rust'));
 fs.copyFileSync(path.join(COMBAT,'rust/target/wasm32-unknown-unknown/wasm/combat_wasm.wasm'),path.join(COMBAT,'web/core.wasm'));
}
const wasm=fs.readFileSync(path.join(COMBAT,'web/core.wasm'));
const {RULES_VERSION}=await import('../web/core.mjs');
const {readActionIcons}=await import('../web/icon-source.mjs');

// Each module: imports dropped, `export` dropped from declarations (their names collected), the core's loader cut.
const names=[],declared=new Map();
const bodies=MODULES.map(file=>{
 let src=fs.readFileSync(path.join(COMBAT,file),'utf8');
 if(file==='web/core.mjs'){const a=src.indexOf('// <loader>'),b=src.indexOf('// </loader>');if(a<0||b<0)throw Error('web/core.mjs: no <loader> section');src=src.slice(0,a)+src.slice(b+'// </loader>'.length);}
 if(/^\s*import\s*\(|^export default/m.test(src))throw Error(file+': unsupported import or export form');
 // Re-exports (`export {A,B};`) name what another bundled module already exports.
 src=src.replace(/^import [^;]*;\n/gm,'').replace(/^export \{[^}]*\};\n/gm,'');
 src=src.replace(/^export (async function|function|const|let|class) ([A-Za-z_$][\w$]*)/gm,(m,kind,name)=>{names.push(name);return kind+' '+name;});
 for(const m of src.matchAll(/^(?:async function|function|const|let|class) ([A-Za-z_$][\w$]*)/gm)){if(declared.has(m[1]))throw Error(`${m[1]} is declared in both ${declared.get(m[1])} and ${file}`);declared.set(m[1],file);}
 if(/\bimport\.meta\b|\bawait\b(?![^\n]*\/\/)/.test(src.replace(/\basync\b[\s\S]*?\bawait\b/g,'')))console.warn(file+': check for import.meta or top-level await');
 return `// ---- combat/${file}\n${src.trim()}\n`;
});
const RUNTIME=['WASM','ACTION_ICONS','wasmBytes','initSync','init','createAI','serveWorker','api'];
for(const n of RUNTIME)if(declared.has(n))throw Error(`${n} (bundle runtime) is also declared in ${declared.get(n)}`);

const runtime=`// ---- the bundle's runtime
function wasmBytes(){
 if(typeof Buffer!=='undefined')return new Uint8Array(Buffer.from(WASM,'base64'));
 const s=atob(WASM),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b;
}
let starting=null;
function initSync(){if(!coreReady())initCore(new WebAssembly.Module(wasmBytes()));return api;}
function init(){return starting||(starting=coreReady()?Promise.resolve(api):WebAssembly.compile(wasmBytes()).then(m=>{if(!coreReady())initCore(m);return api;}));}
// Inside the AI worker: one search context per fight (reset between fights), decisions posted back by token.
function serveWorker(){
 initSync();let ctx=createSearchContext();
 self.onmessage=e=>{const d=e.data||{};
  if(d.type==='reset'){freeSearchContext(ctx);ctx=createSearchContext();return;}
  try{self.postMessage({token:d.token,decision:chooseAIAction(d.state,d.options,ctx)});}
  catch(err){self.postMessage({token:d.token,error:String(err&&err.message||err)});}};
}
function createAI(opts={}){
 const budget=opts.fallbackBudget||3e5,pending=new Map();let worker=null,url=null,token=0,ctx=null;
 const local=(state,options)=>init().then(()=>{if(!ctx)ctx=createSearchContext();return chooseAIAction(state,{...options,nodeBudget:Math.min((options&&options.nodeBudget)||Infinity,budget)},ctx);});
 if(!opts.mainThread&&typeof Worker!=='undefined'&&typeof Blob!=='undefined'&&typeof URL!=='undefined'&&URL.createObjectURL){
  try{
   url=URL.createObjectURL(new Blob([api.workerSource],{type:'text/javascript'}));worker=new Worker(url);
   worker.onmessage=e=>{const p=pending.get(e.data.token);if(!p)return;pending.delete(e.data.token);if(e.data.error)p.reject(Error(e.data.error));else p.resolve(e.data.decision);};
   // A worker that fails to start (a browser that blocks blob workers) hands its requests to the main thread.
   worker.onerror=e=>{if(e&&e.preventDefault)e.preventDefault();const w=worker;worker=null;try{w.terminate();}catch(x){}
    for(const [t,p] of pending){pending.delete(t);local(p.state,p.options).then(p.resolve,p.reject);}};
  }catch(e){worker=null;}
 }
 return {
  get threaded(){return !!worker;},
  choose(state,options){if(!worker)return local(state,options);const t=++token;return new Promise((resolve,reject)=>{pending.set(t,{resolve,reject,state,options});worker.postMessage({token:t,state,options});});},
  reset(){if(worker)worker.postMessage({type:'reset'});else if(ctx){freeSearchContext(ctx);ctx=null;}},
  terminate(){if(worker){worker.terminate();worker=null;}if(url)URL.revokeObjectURL(url);if(ctx){freeSearchContext(ctx);ctx=null;}for(const p of pending.values())p.reject(Error('AI stopped'));pending.clear();}
 };
}
const api={};
for(const [k,get] of Object.entries({${[...names,'ACTION_ICONS','initSync','init','createAI','serveWorker'].map(n=>`${n}:()=>${n}`).join(',')}}))Object.defineProperty(api,k,{get,enumerable:true});
return api;`;

const header={rules:RULES_VERSION,sources:sourcesHash(),wasm:(await import('node:crypto')).createHash('sha256').update(wasm).digest('hex')};
const out=`// Generated by combat/tools/bundle.mjs from combat/ (the combat minigame); do not edit. Rebuild: node combat/tools/bundle.mjs
// combat-bundle ${JSON.stringify(header)}
(function(root,factory){
 'use strict';
 const api=factory();
 Object.defineProperty(api,'workerSource',{value:'('+factory.toString()+')().serveWorker();'});
 if(typeof module==='object'&&module.exports)module.exports=api;else root.LumenholdCombat=api;
})(typeof self!=='undefined'?self:this,function(){
'use strict';
const WASM='${wasm.toString('base64')}';
const ACTION_ICONS=${JSON.stringify(readActionIcons())};
${bodies.join('\n')}
${runtime}
});
`;
fs.mkdirSync(path.dirname(BUNDLE),{recursive:true});
fs.writeFileSync(BUNDLE,out);
console.log(`build/combat.bundle.js: ${(out.length/1024).toFixed(0)} KB (core.wasm ${(wasm.length/1024).toFixed(0)} KB), ${names.length} exports, rules ${RULES_VERSION}`);
