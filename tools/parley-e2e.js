// Crux campaign smoke: file:// and HTTP, phone layout, worker analysis, refresh, settlement and missing runtime.
'use strict';
const assert = require('node:assert/strict'), path = require('path');
const Engine = require('../src/engine.js');
const { content } = require('./project.js').project(path.resolve(__dirname, '..')).compileAll();

async function run(browser, base = 'file://' + path.resolve(__dirname, '../index.html')) {
  const e = new Engine(content); e.newGame({ seed: 77, name: 'Parley test' });
  Object.assign(e.s.vals, { gold: 90, renown: 25, mana: 30 }); e.s.spells = { glamour: 1, sleight: 1, ward: 1 };
  e.s.cur = { id: 'slice_market_haggle', actor: null }; e.s.deck = [];
  const save = e.save();
  for (const lang of ['en', 'zh-CN']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await context.newPage(), errors = [];
    p.on('pageerror', (err) => errors.push(err.message));
    await p.route(/fonts\.(googleapis|gstatic)/, (route) => route.abort());
    await p.addInitScript(({ save, lang }) => {
      if (!localStorage.getItem('crux.test.seeded')) {
        localStorage.setItem('lumenhold.save.v1', save);
        localStorage.setItem('lumenhold.settings.v1', JSON.stringify({ lang, motion: 'reduced', fightEngine: true, fightEngineShown: false, fightEngineBudget: 30 }));
        localStorage.setItem('crux.test.seeded', '1');
      }
    }, { save, lang });
    try {
      await p.goto(base + '?lang=' + lang); await p.click('#cont');
      await p.click('#choices .left');
      await p.locator('.parley-layer button[data-act=begin]').click();
      await p.waitForSelector('.parley-layer .arg[data-uid]');
      assert.equal(await p.locator('#choices').isVisible(), false);
      assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow');
      await p.locator('.parley-layer [data-act=engine]').click();
      await p.waitForFunction(() => document.querySelector('.parley-layer .engine-head')?.textContent.includes('depth') || /已|深度/.test(document.querySelector('.parley-layer .engine-head')?.textContent || ''));
      // A real cast must persist immediately, and survive a reload without changing its exact resource balance.
      await p.locator('.parley-layer [data-spell=sleight]').click();
      await p.locator('.parley-layer [data-act=cast]').click();
      const before = await p.evaluate(() => JSON.parse(localStorage.getItem('lumenhold.save.v1')).parleyInProgress);
      assert.deepEqual(before.moves, ['cast:sleight']);
      await p.reload(); await p.click('#cont');
      await p.waitForSelector('.parley-layer .arg[data-uid]');
      const after = await p.evaluate(() => JSON.parse(localStorage.getItem('lumenhold.save.v1')).parleyInProgress);
      assert.deepEqual(after, before, 'refresh keeps the same setup and command tape');
      if (process.env.CRUX_SHOTS) await p.screenshot({ path: path.join(process.env.CRUX_SHOTS, 'crux-' + lang + '.png') });
      await p.locator('.parley-layer [data-act=leave]').click();
      await p.locator('.parley-layer [data-act=yes]').click();
      await p.locator('.parley-layer [data-act=done]').click();
      await p.waitForSelector('#contBtn');
      const result = await p.evaluate(() => JSON.parse(localStorage.getItem('lumenhold.save.v1')));
      assert.equal(result.parleyInProgress, undefined);
      assert.equal(result.vals.mana, e.s.vals.mana - 4, 'Sleight retains its canonical four Mana');
      assert.equal(result.vals.alignment, e.s.vals.alignment - 1);
      assert.equal(result.parleys.length, 1);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
  // A missing runtime must not turn a negotiation into a dice roll or consume its option.
  const p = await browser.newPage();
  try {
    await p.route(/fonts\.(googleapis|gstatic)/, (route) => route.abort());
    await p.goto(base + '?debug&lang=en&event=intro_wrong_tower');
    await p.waitForSelector('#choices .right');
    const mana = await p.evaluate(() => { window.cruxTestRuntime = window.LumenholdCrux; window.LumenholdCrux = null; return window.lumen.eng.s.vals.mana; });
    await p.click('#choices .right'); await p.waitForTimeout(300);
    assert.equal(await p.locator('#deck .card').isVisible(), true);
    assert.equal(await p.locator('.parley-layer').count(), 0);
    await p.evaluate(() => { window.LumenholdCrux = window.cruxTestRuntime; delete window.cruxTestRuntime; });
    await p.click('#choices .right');
    await p.waitForSelector('.parley-layer [data-act=skiplesson]');
    assert.equal(await p.locator('.parley-layer [data-act=engine]').count(), 0, 'analysis respects the campaign setting');
    await p.locator('.parley-layer [data-act=skiplesson]').click();
    await p.waitForSelector('#contBtn');
    assert.equal(await p.evaluate(() => window.lumen.eng.s.vals.mana), mana, 'skipping before any move has no cost');
  } finally { await p.close(); }
  // The standalone bench mounts the same renderer and core, with its original setup controls.
  const bench = await browser.newPage({ viewport: { width: 390, height: 844 } }), errors = [];
  bench.on('pageerror', (err) => errors.push(err.message));
  try {
    await bench.route(/fonts\.(googleapis|gstatic)/, (route) => route.abort());
    await bench.goto('file://' + path.resolve(__dirname, '../crux/index.html') + '?seed=13');
    await bench.locator('[data-act=start]').click();
    await bench.locator('button[data-act=begin]').click();
    await bench.waitForSelector('.arg[data-uid]');
    assert.ok(await bench.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await bench.locator('[data-act=leave]').click();
    await bench.locator('[data-act=yes]').click();
    await bench.waitForSelector('[data-act=replay]');
    assert.deepEqual(errors, []);
  } finally { await bench.close(); }
  console.log('PASS Crux campaign: English + Chinese, phone, analysis worker, refresh, settlement, unavailable runtime');
  console.log('PASS Crux standalone: same renderer, setup, table and end screen from file://');
}

module.exports = { run };
if (require.main === module) (async () => {
  const { chromium } = require('playwright'), browser = await chromium.launch();
  try { await run(browser); } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
