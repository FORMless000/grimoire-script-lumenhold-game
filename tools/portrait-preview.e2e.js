#!/usr/bin/env node
// Real-browser crop/save/reload checks. Writes only a disposable copy of the art.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');
const { createPortraitServer } = require('./portrait-preview.js');

async function main() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lumenhold-portrait-browser-'));
  const artDir = path.join(temp, 'art');
  fs.cpSync(path.resolve(__dirname, '../art/characters/minimal'), artDir, { recursive: true, filter: (p) => !p.includes('.crop-backups') });
  fs.cpSync(path.resolve(__dirname, '../src/portraits/minimal'), path.join(temp, 'src/portraits/minimal'), { recursive: true });
  const manifestFile = path.join(artDir, 'portrait-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile)), initial = manifest[0];
  // Keep the interaction fixture predictable after users tune their real candidates.
  initial.crop = JSON.parse(fs.readFileSync(path.join(artDir, 'concept-portrait-baseline.json'))).find((p) => p.id === initial.id).crop;
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  const originalPNG = fs.readFileSync(path.join(temp, initial.file));
  const legacyPNG = fs.readFileSync(path.join(artDir, 'portraits/lyra.png'));
  const server = createPortraitServer({ artDir, rootDir: temp }); let browser;
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    const base = 'http://127.0.0.1:' + server.address().port;
    await page.goto(base); await page.waitForSelector('.person [data-edit="lyra"]');
    assert.equal(await page.locator('.person').count(), 21);
    await page.locator('[data-tab="characters"]').click(); assert.equal(await page.locator('.concept-person:visible').count(), 21);
    assert.equal(await page.locator('.character-concept').evaluateAll((images) => images.every((img) => img.complete && img.naturalWidth === 1024 && img.naturalHeight === 1024)), true);
    await page.locator('[data-tab="concepts"]').click(); assert.equal(await page.locator('.sheet:visible').count(), 5);
    await page.locator('[data-tab="portraits"]').click();
    await page.locator('.person [data-edit="lyra"]').click();
    await page.waitForFunction(() => document.getElementById('saveStatus').textContent === 'Showing the saved alignment.');
    assert.equal(await page.locator('#savePortrait').isDisabled(), true);
    const pixels = await page.locator('#cropCanvas').evaluate((c) => c.toDataURL());
    await page.locator('#showGuides').uncheck(); assert.equal(await page.locator('#guides').isVisible(), false);
    await page.locator('#showRound').uncheck(); assert.equal(await page.locator('#roundMask').isVisible(), false);
    assert.equal(await page.locator('#cropCanvas').evaluate((c) => c.toDataURL()), pixels, 'guides must not alter image pixels');
    await page.locator('#showGuides').check(); await page.locator('#showRound').check();
    const box = await page.locator('#cropCanvas').boundingBox();
    // Zoom before panning so the interaction has room within any approved framing.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -40);
    await page.waitForFunction((value) => Number(document.getElementById('sizeNumber').value) < value, initial.crop.width);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 24, box.y + box.height / 2 - 10); await page.mouse.up();
    assert.ok(Number(await page.locator('#leftNumber').inputValue()) > initial.crop.left, 'drag changes crop');
    const size = Number(await page.locator('#sizeNumber').inputValue());
    await page.mouse.wheel(0, -40);
    await page.waitForFunction((value) => Number(document.getElementById('sizeNumber').value) < value, size);
    await page.locator('#topNumber').fill(String(initial.crop.top + 16));
    await page.locator('#cropCanvas').focus(); await page.keyboard.press('ArrowDown');
    const top = Number(await page.locator('#topNumber').inputValue()); assert.equal(top, initial.crop.top + 17);
    // Switching characters keeps the current tab's unsaved draft.
    await page.locator('#character').selectOption('seraphine');
    await page.waitForFunction(() => !document.getElementById('downloadPortrait').disabled);
    await page.locator('#character').selectOption('lyra');
    await page.waitForFunction((value) => Number(document.getElementById('topNumber').value) === value, top);
    const expected = await page.evaluate(async () => {
      const data = await fetch('/api/data').then((r) => r.json()), p = data.portraits.find((p) => p.id === 'lyra');
      const img = new Image(); img.src = p.source; await img.decode();
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high';
      const n = (id) => Number(document.getElementById(id).value);
      ctx.drawImage(img, n('leftNumber'), n('topNumber'), n('sizeNumber'), n('sizeNumber'), 0, 0, 256, 256);
      return c.toDataURL('image/png').split(',')[1];
    });
    await page.locator('#savePortrait').click();
    await page.waitForFunction(() => document.getElementById('saveStatus').textContent.startsWith('Saved src/portraits/minimal/lyra.png'));
    const updated = JSON.parse(fs.readFileSync(path.join(artDir, 'portrait-manifest.json')))[0];
    assert.equal(updated.crop.top, top);
    assert.deepEqual(fs.readFileSync(path.join(temp, updated.file)), Buffer.from(expected, 'base64'), 'live PNG exactly matches the unadorned crop');
    assert.notDeepEqual(fs.readFileSync(path.join(temp, updated.file)), originalPNG);
    assert.deepEqual(fs.readFileSync(path.join(artDir, 'portraits/lyra.png')), legacyPNG, 'obsolete copy is untouched');
    assert.equal(fs.readdirSync(path.join(artDir, '.crop-backups')).length, 1);
    await page.reload(); await page.locator('.person [data-edit="lyra"]').click();
    await page.waitForFunction((value) => Number(document.getElementById('topNumber').value) === value, top);
    assert.equal(await page.locator('#savePortrait').isDisabled(), true);
    await page.locator('#resetInitial').click();
    assert.equal(Number(await page.locator('#topNumber').inputValue()), initial.crop.top);
    assert.equal(await page.locator('#savePortrait').isDisabled(), false);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.locator('#editor').evaluate((d) => d.scrollWidth > d.clientWidth + 1), false);
    assert.deepEqual(errors, []);
    console.log('PASS: 21 portraits, 21 individual square concepts, 5 upper-body sheets; drag, zoom, keyboard, guides, drafts, save, backup, reload, source-matched reset and phone layout. Repository artwork was not modified by this test.');
  } finally {
    if (browser) await browser.close();
    await new Promise((r) => server.close(r));
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
