'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),G=require('../../src/grimoire.js'),O=require('../src/review-order.js');
function card(id,place,line,effects=[],when){const d={id,place,when:when?G.expr(when):undefined,options:[{effects}]};return {key:'event:'+id,compiledDef:d,block:{file:'content/events/new.grim',line,def:d}};}
function fixture(){
 const a=[card('end',null,1),card('middle','library',90,[{t:'queue',event:'end'}],'flag(started)'),card('start','library',100,[{t:'flag',names:['started']}],'not flag(started)'),card('stable','stables',110),card('yard','courtyard',120)];
 const b=[card('middle','library',1,[],'seen(start) > 0'),card('start','library',50),card('end','library',2,[],'since(middle) >= 1'),card('stable','stables',60),card('yard','courtyard',70)];
 const m={seed:'fixed-reading-order',batches:[{id:'a'},{id:'b'}],mapping:{}},artifacts=new Map([['a',{cards:a}],['b',{cards:b}]]),views=[];
 for(const [batch,list] of [['a',a],['b',b]])for(const c of list){const label='Card '+views.length;m.mapping[label]={batch,key:c.key};views.push({label,key:c.key,batch,judgment:{rating:3,worldFit:'yes',comments:'Keep'}});}
 m.mapping.repeat={batch:'a',key:'event:middle'};views.push({label:'repeat',key:'event:middle',batch:'a',judgment:{rating:4}});
 return {m,artifacts,views};
}
test('reading groups mix standalone places but keep each author chain contiguous and in dependency order',()=>{
 const f=fixture(),before=JSON.stringify(f),ordered=O.arrange(f.m,f.artifacts,f.views);
 assert.equal(ordered.length,11);assert.equal(ordered.filter(c=>c.reviewGroup.key==='stables').length,2);assert.equal(ordered.filter(c=>c.reviewGroup.key==='courtyard').length,2);
 const library=ordered.filter(c=>c.reviewGroup.key==='library');assert.equal(library.length,7);
 for(let i=0;i<6;i+=3){const chain=library.slice(i,i+3);assert.equal(new Set(chain.map(c=>c.batch)).size,1);assert.deepEqual(chain.map(c=>c.key),['event:start','event:middle','event:end']);assert.deepEqual(chain.map(c=>c.reviewChain.position),[1,2,3]);assert.equal(new Set(chain.map(c=>c.reviewChain.id)).size,1);}
 assert.equal(library.at(-1).label,'repeat');assert.deepEqual(ordered.map(c=>c.label).sort(),f.views.map(c=>c.label).sort());assert.equal(JSON.stringify(f),before);assert.deepEqual(ordered.map(c=>c.judgment),ordered.map(c=>f.views.find(v=>v.label===c.label).judgment));
 assert.deepEqual(O.arrange(f.m,f.artifacts,[...f.views].reverse()).map(c=>c.label),ordered.map(c=>c.label));
});
test('negative gates do not invent predecessor links; self retries and cycles do not lose cards',()=>{
 assert.deepEqual([...O.prerequisites(G.expr('not flag(done) and seen(first) == 0').ast).flags],[]);assert.deepEqual([...O.prerequisites(G.expr('not flag(done) and seen(first) == 0').ast).events],[]);
 const a=card('a','library',20,[{t:'queue',event:'b'}]),b=card('b','library',10,[{t:'queue',event:'a'},{t:'queue',event:'b'}]);const result=O.units({cards:[a,b]});assert.equal(result.length,1);assert.equal(result[0].cyclic,true);assert.deepEqual(result[0].cards.map(c=>c.key),['event:b','event:a']);
});
test('rivalry and gig themes take precedence over incidental places; unresolved sources remain visible',()=>{
 const rival=card('rival','library',1);rival.compiledDef.actor='lyra';rival.compiledDef.tags=['rival'];assert.equal(O.group([rival]).key,'lyra');
 const gig=card('gig',null,2,[],'has(gig_newt_rush)');assert.equal(O.group([gig]).key,'newt');
 const broken={key:'unparsed:broken',raw:'broken'};assert.equal(O.units({cards:[broken]})[0].cards[0],broken);assert.equal(O.group([broken]).key,'other');
});
