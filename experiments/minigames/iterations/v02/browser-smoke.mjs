// Run from the project root with Playwright installed and the testplay server live.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const url=arg('url','http://127.0.0.1:61040/'),out=arg('out',null);
if(out&&fs.existsSync(out))throw Error('Refusing to overwrite browser results');
const {chromium}=createRequire(path.resolve('package.json'))('playwright');
const browser=await chromium.launch({headless:true}),errors=[],checks=[];
const ready=p=>p.waitForFunction(()=>document.querySelector('.result')||document.querySelector('[data-action]:not([disabled])'));
async function fit(p){const m=await p.evaluate(()=>({w:innerWidth,h:innerHeight,dw:document.documentElement.scrollWidth,dh:document.documentElement.scrollHeight}));assert(m.dw<=m.w&&m.dh<=m.h,JSON.stringify(m));}
async function choose(p,id){await ready(p);await p.locator(`[data-section=${['strike','guard','reclaim'].includes(id)?'basic':'spells'}]`).click();await p.locator(`[data-action=${id}]`).click();await fit(p);await p.locator('#commit').click();await ready(p);}
async function log(p){const waiting=p.waitForEvent('download');await p.locator('#export').click();const download=await waiting;return JSON.parse(fs.readFileSync(await download.path()));}
async function page(firstLeader=0,fixture=null){const p=await browser.newPage({viewport:{width:320,height:568}});p.on('pageerror',e=>errors.push(e.message));if(fixture)await policyFixture(p,fixture);await p.goto(url);assert.equal(await p.locator('[data-mode], #fixture, #approach').count(),0);assert.deepEqual(await p.locator('[data-rebate]').evaluateAll(inputs=>inputs.map(i=>i.dataset.rebate)),['health','mana']);await p.locator('details').evaluate(e=>e.open=true);await p.locator('#first-leader').selectOption(String(firstLeader));await p.locator('#all-spells').check();return p;}
// Test fixtures replace only the worker policy, keeping the actual UI and engine.
async function policyFixture(p,source){await p.route('**/app.mjs?worker=1',route=>route.fulfill({contentType:'text/javascript',body:`self.onmessage=e=>self.postMessage({token:e.data.token,decision:{id:${source},completedDepth:0,nodes:0,elapsedMs:0}});`}));}
try{
 for(const caster of ['player','opponent','both'])for(const firstLeader of [0,1]){
  const p=await page(firstLeader,caster==='player'?"'guard'":"e.data.state.round===1?'foresight':'guard'");
  await p.locator('#begin').click();await ready(p);
  await choose(p,caster==='opponent'?'guard':'foresight');
  for(let remaining=3;remaining>0;remaining--){
   const text=await p.locator('.forecasts').innerText();assert(text.includes(`for ${remaining} exchange`));
   if(caster==='both')assert(text.includes('Both active: normal alternation'));
   if(caster==='opponent')assert((await p.locator('.intent').innerText()).includes('You commit first'));
   if(caster==='player')assert((await p.locator('.intent').innerText()).includes('Telegraph'));
   await p.locator('[data-section=spells]').click();assert.equal(await p.locator('[data-action]').count(),12);await fit(p);
   await choose(p,'guard');
  }
  assert.equal(await p.locator('.forecasts').count(),0);await p.locator('#leave').click();await fit(p);
  const data=await log(p);assert.equal(data.rulesVersion,'prototype-0.2.2');assert.equal(data.config.mode,'combat');assert.equal(data.history.length,4);
  assert(data.history.every(r=>r.pair.length===2));assert(data.stats.every(r=>!r.planning));
  checks.push({mode:'combat',caster,firstLeader,exchanges:data.history.length});await p.close();
 }
 for(const firstLeader of [0,1]){
  const p=await page(firstLeader,"'strike'");await p.locator('#budget').selectOption('depleted');
  await p.locator('#begin').click();await ready(p);
  for(let i=0;i<8&&!await p.locator('.result').count();i++)await choose(p,'strike');
  const data=await log(p);assert.equal(data.result.tiebreak,'telegraphed initiative');assert.equal(data.result.winner,firstLeader);
  assert.equal(data.result.outcome,firstLeader===0?'win':'lose');await fit(p);checks.push({firstLeader,tiebreak:data.result});await p.close();
 }
 // Actual AI worker, all four degradation profiles, combat.
 for(const profile of ['full','shallow','fallible','shallow_fallible']){
  const p=await page(1);await p.locator('#ai-profile').selectOption(profile);await p.locator('#ai-seed').fill('77');await p.locator('#begin').click();await ready(p);
  for(let i=0;i<8&&!await p.locator('.result').count();i++)await choose(p,'strike');
  assert.equal(await p.locator('.result').count(),1);await fit(p);const data=await log(p);assert.equal(data.rulesVersion,'prototype-0.2.2');assert.equal(data.config.mode,'combat');
  assert(data.stats.length>0);assert(data.stats.every(r=>!r.planning));checks.push({mode:'combat',profile,decisions:data.stats.length});await p.close();
 }
 for(const level of [20,50,80]){
  const p=await browser.newPage({viewport:{width:375,height:667}});p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url+'?quickstart='+level);await ready(p);await fit(p);
  assert.equal(await p.locator('[data-mode], #fixture, #approach, .meters').count(),0);
  assert(!/negotiation|agreement|patience|suspicion/i.test(await p.locator('body').innerText()));
  checks.push({quickstart:level});await p.close();
 }
 const p=await browser.newPage();await p.goto(url);const rules=await p.evaluate(async()=>await(await fetch('/rulebook.md')).text());
 assert(rules.includes('# Combat testplay'));assert(!/negotiation|agreement|patience|suspicion/i.test(rules));await p.close();
 assert.deepEqual(errors,[]);const result={checks,errors,viewport:{width:320,height:568}};
 if(out)fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
