#!/usr/bin/env node
// Browser verification uses disposable submissions and verdicts, never the real review.
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert/strict');
const {chromium}=require('playwright');
const U=require('../src/util.js'),W=require('../src/workspaces.js'),I=require('../src/batch-import.js'),R=require('../src/batch-review.js');
const G=require('../../src/grimoire.js'),I18n=require('../../src/i18n.js');
const root=path.resolve(__dirname,'../..');
async function main(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lifesim-review-browser-'));
  const write=(file,text)=>{const p=path.join(dir,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text);};
  const card=(id,next='')=>`@event ${id}\ntitle: The borrowed notebook\nactor: lyra\nplace: courtyard\nart: book\ntext: {~Lyra wants her notebook back, right now.|She holds out a hand.|She taps the notebook.} <img src=x onerror=bad()>\n> left: Hand it over\n  gold +small\n  flag notebook_returned\n  if flag(earlier_choice):\n    say: {~You remember the promise.|You hand back the notebook.|The promise holds.}\n  else:\n    say: It is not the promise you remember.\n  ${next?'queue '+next+' in 1':'say: She leaves with the notebook.'}\n> right: Ask for a minute\n  say: Lyra counts the seconds out loud.\n`;
  const world='@balance\nsizes: gold 3 11 15 30 60\n\n@npc lyra\nname: Lyra\ncolor: #8877aa\n\n@place courtyard\nname: Courtyard\n';
  write('_operator/snapshot/content/world.grim',world);write('_operator/snapshot/content/base.grim',card('old'));
  const names=['baseline','grim','qmd','lightrag'];
  for(const name of names){write(name+'/content/world.grim',world);write(name+'/content/base.grim',card('old'));U.writeJSON(path.join(dir,'_operator/initial',name+'.json'),W.inventory(path.join(dir,name)));const raw=card(name+'_one',name+'_two')+'\n'+card(name+'_two');write(name+'/content/new.grim',raw);
    let lang='';for(const def of Object.values(G.compile([{path:'content/new.grim',text:raw}]).content.events)){lang+='@event '+def.id+'\n';for(const field of I18n.extract({events:{[def.id]:def}})){const value=field.key==='title'?'借来的笔记本':field.key==='text'?'{~莱拉现在就想拿回她的笔记本。|她伸出一只手。|她敲了敲笔记本。} <img src=x onerror=bad()>':field.text.startsWith('{~You remember')?'{~你还记得那个承诺。|你归还了笔记本。|承诺依然有效。}':field.text==='It is not the promise you remember.'?'你记得的不是这个承诺。':'中文：'+field.text;lang+=field.key+' ['+field.hash+'] = '+I18n.enc(value)+'\n';}}write(name+'/locales/zh-CN/new.lang',lang);
  }
  const corpusHash=I.parseSources([{path:'content/base.grim',text:card('old')},{path:'content/world.grim',text:world}]).catalog.corpusHash;
  U.writeJSON(path.join(dir,'_operator/manifest.json'),{version:1,destination:dir,snapshotHash:'fixture',corpusHash,projects:Object.fromEntries(names.map(n=>[n,{backend:n}]))});
  write('prompt.md','Write two connected cards about a borrowed notebook.');
  const imported=I.importWorkspaces(root,dir,{scan:W.scan(dir).file,prompt:path.join(dir,'prompt.md')}),server=R.serve(imported.directory);
  await new Promise(r=>server.on('listening',r));let browser;
  try{
    browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));const url='http://127.0.0.1:'+server.address().port;
    await page.goto(url);await page.waitForSelector('.rating-choices');
    assert.equal(await page.locator('#nav button').count(),9);
    assert.ok(await page.getByText('You remember the promise.',{exact:true}).first().isVisible());
    assert.equal(await page.getByText('It is not the promise you remember.',{exact:true}).first().isVisible(),false);
    await page.getByLabel('Comments (optional)').fill('Draft survives preview changes.');
    await page.getByRole('button',{name:'Next text',exact:true}).first().click();assert.ok((await page.locator('.card-body .text').first().textContent()).startsWith('She holds out a hand.'),await page.locator('.card-body .text').first().textContent());assert.ok(await page.getByText('You hand back the notebook.',{exact:true}).first().isVisible());
    assert.equal(await page.getByLabel('Comments (optional)').inputValue(),'Draft survives preview changes.');
    await page.locator('.option-outcome select[data-branch]').first().selectOption('1');assert.ok(await page.getByText('It is not the promise you remember.',{exact:true}).first().isVisible());assert.equal(await page.getByText('You hand back the notebook.',{exact:true}).first().isVisible(),false);
    assert.ok((await page.locator('[data-choice=left] .choice-effects').first().textContent()).includes('+11'));
    await page.locator('[data-choice=right]').first().click();assert.equal(await page.locator('#view > .story-panel > .option-outcome[data-option=left]').count(),0);assert.equal(await page.locator('#view > .story-panel > .option-outcome[data-option=right]').count(),1);
    await page.locator('[data-choice=left]').first().click();await page.locator('.option-outcome select[data-branch]').first().selectOption('0');await page.getByRole('button',{name:'Previous text',exact:true}).first().click();
    assert.ok((await page.locator('.event-attributes').first().textContent()).includes('notebook_returned'));assert.ok((await page.locator('.event-attributes').first().textContent()).includes('trigger'));
    assert.equal(await page.locator('.card-body img[src="x"]').count(),0,'authored HTML is rendered as text');
    assert.ok(await page.locator('.av-img').first().evaluate(img=>img.href.baseVal.includes('lyra.png')));
    await page.screenshot({path:'/private/tmp/lifesim-review-desktop.png',fullPage:true});
    const s=await (await fetch(url+'/api/state')).json(),first=s.cards[0];
    assert.equal(s.ordering,'theme-place-chain-v1');assert.ok(s.cards[0].reviewChain);assert.equal(s.cards[0].reviewChain.position,1);assert.equal(s.cards[1].reviewChain.id,s.cards[0].reviewChain.id);assert.equal(s.cards[1].reviewChain.position,2);assert.ok(await page.locator('.review-group-heading').first().isVisible());assert.ok(await page.locator('.chain-position').isVisible());
    await page.getByRole('button',{name:'Next card',exact:true}).click();assert.ok((await page.locator('.chain-position').textContent()).includes('2 / 2'));await page.getByRole('button',{name:'Previous card',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:/save/i}).count(),0,'no manual save controls');
    // Delay the first save, then click rapidly: writes must remain ordered.
    let firstSave=true;await page.route('**/api/rating*',async route=>{if(firstSave){firstSave=false;await new Promise(r=>setTimeout(r,400));}await route.continue();});
    await page.locator('.rating-choices [data-value="5"]').click();await page.locator('.rating-choices [data-value="2"]').click();await page.locator('.world-fit-choices [data-value="yes"]').click();await page.locator('.world-fit-choices [data-value="partial"]').click();await page.getByLabel('Comments (optional)').fill('Latest automatic comment.');
    await page.waitForFunction(()=>document.querySelector('#status').textContent==='Saved automatically.');await page.unroute('**/api/rating*');assert.equal(firstSave,false,'delayed request fixture was exercised');
    let saved=R.state(imported.directory),j=saved.cards.find(c=>c.label===first.label).judgment;assert.equal(j.rating,2);assert.equal(j.worldFit,'partial');assert.equal(j.comments,'Latest automatic comment.');
    await page.reload();await page.waitForSelector('.rating-choices');assert.equal(await page.locator('.rating-choices [data-value="2"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.world-fit-choices [data-value="partial"]').getAttribute('aria-pressed'),'true');assert.equal(await page.getByLabel('Comments (optional)').inputValue(),'Latest automatic comment.');
    await page.getByLabel('Review language').selectOption('zh-CN');await page.waitForFunction(()=>document.documentElement.lang==='zh-CN');await page.getByText('你还记得那个承诺。',{exact:true}).first().waitFor();
    assert.equal(await page.getByText('你记得的不是这个承诺。',{exact:true}).first().isVisible(),false);await page.getByRole('button',{name:'下一段文本',exact:true}).first().click();await page.getByText('你归还了笔记本。',{exact:true}).first().waitFor();await page.getByRole('button',{name:'上一段文本',exact:true}).first().click();assert.equal(await page.locator('.card-body h2').first().textContent(),'借来的笔记本');
    await page.getByLabel('评论（可选）').fill('中文评价，自动保存。');await page.waitForFunction(()=>document.querySelector('#status').textContent==='已自动保存。');await page.screenshot({path:'/private/tmp/lifesim-review-simple-zh.png',fullPage:false});
    // A failed autosave stays local and is retried after reloading with a working connection.
    await page.route('**/api/rating*',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Fixture offline'})}));await page.locator('.rating-choices [data-value="1"]').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('自动保存失败'));
    assert.equal(R.state(imported.directory).cards.find(c=>c.label===first.label).judgment.rating,2);await page.unroute('**/api/rating*');await page.reload();await page.waitForFunction(()=>document.querySelector('#status').textContent==='已自动保存。');assert.equal(R.state(imported.directory).cards.find(c=>c.label===first.label).judgment.rating,1);
    // A reset invalidates the old page and removes browser drafts instead of restoring deleted reviews.
    const oldEpoch=R.load(imported.directory).reviewEpoch;R.reset(dir);await page.locator('.rating-choices [data-value="5"]').click();await page.waitForFunction(()=>document.querySelector('#error').textContent.includes('重置'));
    await page.evaluate(()=>localStorage.setItem('lumenhold-review:obsolete','old notes'));await page.reload();await page.waitForSelector('.rating-choices');assert.notEqual(R.load(imported.directory).reviewEpoch,oldEpoch);assert.equal(await page.locator('.rating-choices [aria-pressed=true]').count(),0);assert.equal(await page.getByLabel('评论（可选）').inputValue(),'');assert.equal(await page.evaluate(()=>localStorage.getItem('lumenhold-review:obsolete')),null);assert.equal(Object.keys(R.load(imported.directory).judgments).length,0);
    const assess=async label=>{await page.locator('#nav button').filter({hasText:label.replace('Card','卡片')}).click();await page.locator('.rating-choices [data-value="4"]').click();await page.locator('.world-fit-choices [data-value="yes"]').click();await page.waitForFunction(()=>document.querySelector('#status').textContent==='已自动保存。');};
    for(const c of s.cards)await assess(c.label);
    saved=await(await fetch(url+'/api/state')).json();assert.equal(saved.complete,true);assert.ok(!JSON.stringify(saved).includes('"identity"'));assert.equal(saved.cards[0].judgment.rating,4);assert.equal(saved.cards[0].judgment.worldFit,'yes');assert.equal(saved.cards[0].judgment.language,'zh-CN');
    await page.locator('#reveal').click();await page.waitForFunction(()=>document.querySelector('#progress').textContent.includes('已揭晓身份'));const done=await(await fetch(url+'/export.json')).json();assert.equal(done.revealed,true);assert.equal(done.report.withinReviewerConsistency.length,1);assert.ok(!('pairs' in done));assert.ok(done.cards.every(c=>!('initial' in c.judgment)));
    await page.locator('.rating-choices [data-value="3"]').click();await page.waitForFunction(()=>document.querySelector('#status').textContent==='已自动保存。');
    await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'phone has no horizontal overflow');await page.screenshot({path:'/private/tmp/lifesim-review-simple-mobile.png',fullPage:false});assert.deepEqual(errors,[]);
    console.log('PASS: one rating, three world-fit choices, optional comments, no save buttons, ordered rapid autosaves, reload persistence, Chinese preview/text variants, failed-save recovery, stale-tab reset protection, removed browser drafts, blinding/reveal, editable ratings after reveal, exports and mobile layout. Real verdicts untouched.');
  }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
