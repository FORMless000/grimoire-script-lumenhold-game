'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const T=require('../src/batch-traces.js'),U=require('../src/util.js'),P=require('../src/presentation.js');
const line=value=>JSON.stringify(value);
test('interactive traces preserve tool-call/result locations, ignore reasoning and task notifications, retain human follow-up',()=>{
 const text=[{type:'user',timestamp:'2026-10-24T06:00:00Z',sessionId:'s',cwd:'/trial',message:{content:'Task'}},{type:'assistant',timestamp:'2026-10-24T06:00:01Z',message:{model:'observed-model',content:[{type:'thinking',thinking:'PRIVATE REASONING'},{type:'tool_use',id:'one',name:'Bash',input:{command:'node tools/grim.js query event'}}]}},{type:'user',timestamp:'2026-10-24T06:00:02Z',message:{content:[{type:'tool_result',tool_use_id:'one',content:'OUTPUT'}]}},{type:'user',message:{content:'<task-notification>background completion</task-notification>'}},{type:'user',message:{content:'Translate them.'}},{type:'system',subtype:'stop_hook_summary',timestamp:'2026-10-24T06:00:03Z'}].map(line).join('\n');
 const n=T.native(text);assert.equal(n.calls[0].line,2);assert.equal(n.calls[0].resultLine,3);assert.equal(n.calls[0].at,'2026-10-24T06:00:01Z');assert.equal(n.calls[0].output,'OUTPUT');assert.equal(n.prompts.length,2);assert.deepEqual(n.models,['observed-model']);assert.equal(n.stopMarkers,1);assert.ok(!JSON.stringify(n).includes('PRIVATE REASONING'));
});
test('literal command sites include local function aliases without inventing shell-loop invocation counts',()=>{
 const c='g(){ node tools/grim.js "$@"; }; for q in "a" "b"; do g retrieve search "$q"; done; g query event; node tools/grim.js graph old';
 assert.deepEqual(T.operations(c).map(o=>[o.family,o.operation]),[['rag','search'],['original','query'],['original','graph']]);
 assert.equal(T.operations('G="node tools/grim.js"; $G retrieve status').length,1);
 assert.equal(T.operations('node tools/grim.js retrieve brief test')[0].family,'rag');
});
test('author receipts exclude preparation, validate rendered output and correlate loop arguments to native sites',()=>{
 const output={query:'a',results:[]},row={at:'2026-10-24T06:00:02Z',operation:'search',argv:['search','a','--limit','8'],corpusHash:'corpus',result:output,outputHash:U.hash(P.render(output,'search',false)),returnedChars:100,elapsedMs:50};
 const parsed={unknown:[],prompts:[{at:'2026-10-24T06:00:00Z'}],lastAt:'2026-10-24T06:00:10Z',calls:[{at:'2026-10-24T06:00:01Z',id:'c',line:1,tool:'Bash',input:{command:'for q in "a" "b"; do node tools/grim.js retrieve search "$q" --limit 8; done'},output:'filtered',outputChars:8}]};
 const result=T.summarize(parsed,[{...row,at:'2026-10-24T01:00:00Z'},row].map(line).join('\n'),'corpus');
 assert.equal(result.excluded.length,1);assert.equal(result.receipts.length,1);assert.equal(result.receipts[0].nativeCallId,'c');assert.equal(result.receipts[0].outputDigestMatches,true);assert.equal(result.summary.ragEmittedChars,100);assert.equal(result.summary.nativeToolOutputChars,8);assert.deepEqual(result.issues,[]);
 const bad=T.summarize({...parsed,calls:[]},line({...row,corpusHash:'wrong',outputHash:'tamper'}),'corpus');assert.equal(bad.issues.length,3);
});
test('prompt normalization records only formatting equivalence and redacts credential patterns',()=>{
 assert.equal(T.taskText('\n<pasted_content id="x">\nTask\n* a\n</pasted_content id="x">\n'),T.taskText('Task\n\n- a\n'));
 assert.notEqual(T.taskText('Task\n- a'),T.taskText('Task\n- b'));
 assert.ok(!T.redact('OPENROUTER_API_KEY=secretvalue sk-or-v1-abcdefghijklmnopqrstuv Bearer abcdefghijklmnopqrstuv').includes('secretvalue'));
 assert.equal(T.redact('event:spell_reflect'), 'event:spell_reflect');
});
