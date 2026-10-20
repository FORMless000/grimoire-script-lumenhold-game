// Equal deterministic search trees, not equal wall-clock budgets. Includes the
// Wasm JSON boundary; warm-up is excluded. No claims about cold startup.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {createState,project} from './reference-engine.mjs';import {searchAction as js} from './reference-ai.mjs';import {searchAction as wasm} from './ai.mjs';
const out=process.argv[2];if(!out)throw Error('Supply a new JSON output path');
const cases=[];for(const level of [20,50,80])for(const seed of [1,20,80]){let s=createState({level,seed});if(seed===80)s=project(s,'glamour');cases.push(s);}
const options={fixedNodes:true,nodeBudget:1000000,depth:2};for(const f of [wasm,js])f(cases[0],{...options,depth:1});
const rows=[];for(const state of cases){let a,b;const t=performance.now();a=js(state,options);const jsMs=performance.now()-t;const u=performance.now();b=wasm(state,options);const wasmMs=performance.now()-u;assert.equal(a.depth,2);assert.equal(b.depth,2);assert.equal(a.id,b.id);assert(Math.abs(a.value-b.value)<1e-10);rows.push({level:state.config.level,seed:state.config.seed,castUsed:state.castUsed,depth:2,id:b.id,value:b.value,jsMs,wasmMs,speedup:jsMs/wasmMs,jsNodes:a.nodes,wasmNodes:b.nodes});}
const sum=k=>rows.reduce((n,r)=>n+r[k],0);const report={node:process.version,options,n:rows.length,jsMs:sum('jsMs'),wasmMs:sum('wasmMs'),speedup:sum('jsMs')/sum('wasmMs'),rows};fs.writeFileSync(out,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({n:rows.length,jsMs:report.jsMs,wasmMs:report.wasmMs,speedup:report.speedup}));
