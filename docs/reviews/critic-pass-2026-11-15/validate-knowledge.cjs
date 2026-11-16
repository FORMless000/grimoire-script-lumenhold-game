'use strict';
// Explicit isolated states; these prove eligibility/effects, not encounter rates.
const fs=require('fs'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'../../..');
const {content,errors}=require(root+'/tools/project.js').project(root).compileAll();
assert.equal(errors.length,0);
const Engine=require(root+'/src/engine.js');
const e=new Engine(content);e.newGame({seed:7,name:'Critic fixture'});
for(const n of Object.values(e.s.npcs))Object.assign(n,{met:true,rel:35});
const checks=[];
for(const id of ['know_nessa_planted','know_grisk_newt','picture_lyra']){
 e.s.turn=8;e.s.seen[id]=1;e.s.last[id]=7;
 assert(e.eligible(content.events[id],new Set()));
 checks.push({id,repeat:content.events[id].repeat,seen:1,last:7,turn:8,eligible:true});
}
e.s.turn=10;e.s.seen.know_mabel_fourth_cake=1;e.s.last.know_mabel_fourth_cake=7;e.s.lastBy={'know_mabel_fourth_cake@tobias':7};
assert(e.eligible(content.events.know_mabel_fourth_cake,new Set()));
assert(e.eligibleFor(content.events.know_mabel_fourth_cake,'tobias'));
checks.push({id:'know_mabel_fourth_cake',actor:'tobias',priorTurn:7,turn:10,eligibleForSameBirthday:true});
e.s.turn=4;delete e.s.seen.kael_until_the_thaw;
assert(e.test(content.events.know_kael_thaw.when,'kael'));
assert(!e.test(content.events.know_kael_thaw.options.find(o=>o.key==='right').when,'kael'));
checks.push({id:'know_kael_thaw',turn:4,setupSeen:false,factKnown:false,when:true});
e.s.turn=8;e.s.flags.ilse_taken=true;e._slot='afternoon';
assert.equal(e.seasonOf(),'spring');
assert(e.candidates(content.events.know_ilse_stitch).length>0);
checks.push({id:'know_ilse_stitch',turn:8,season:e.seasonOf(),ilseTaken:true,candidates:e.candidates(content.events.know_ilse_stitch).length});
e._slot='noon';assert.equal(e.timeFit(content.events.know_grimsby_nose),1);
checks.push({id:'know_grimsby_nose',slot:'noon',timeFit:1});
e.s.vals.gold=50;
for(const key of ['left','right']){
 const pv=e.preview('know_isolde_chess',key,'isolde');
 const paths=key==='left'?pv.paths.filter(p=>p.deltas['rel:isolde']):pv.paths;
 assert(paths.length>0);assert(paths.every(p=>!p.deltas.gold));
 checks.push({id:'know_isolde_chess',key,successfulPathGold:paths.map(p=>p.deltas.gold||null)});
}
fs.writeFileSync(__dirname+'/knowledge-validation.json',JSON.stringify({seed:7,checks},null,2)+'\n');
console.log('Knowledge repeat, callback, season, time and payment checks passed.');
