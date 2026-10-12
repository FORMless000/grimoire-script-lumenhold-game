#!/usr/bin/env node
// Browser smoke test: plays full games in a real browser and checks the UI.
//
//   node tools/e2e.js              # English + zh-CN playthroughs, language switch, previews
//   node tools/e2e.js --lang zh-CN # one language only
//   node tools/e2e.js --shots      # also save screenshots to build/e2e/
//
// Needs Playwright:  npm i -D playwright && npx playwright install chromium
// (or set PLAYWRIGHT_PATH to an existing install's module directory).
// Exits non-zero on page errors, games that don't reach an ending, or (in zh-CN) runs of English text.
'use strict';
const path = require('path');
const fs = require('fs');

function loadPlaywright() {
  const tries = [process.env.PLAYWRIGHT_PATH, 'playwright', '/opt/npm-tools/node_modules/playwright'].filter(Boolean);
  for (const t of tries) { try { return require(t); } catch (e) { /* next */ } }
  console.error('Playwright not found. Install it with:\n  npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const args = process.argv.slice(2);
const only = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : null;
const SHOTS = args.includes('--shots');
const ROOT = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'index.html');
const OUT = path.join(ROOT, 'build', 'e2e');
if (SHOTS) fs.mkdirSync(OUT, { recursive: true });

const ENGLISH_RUN = /[A-Za-z]{4,}(?:\s+[A-Za-z]{3,}){2,}/g;   // 3+ English words in a row

async function newPage(browser, errs) {
  const p = await browser.newPage({ viewport: { width: 1280, height: 820 } });
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|fonts\./.test(m.text())) errs.push(m.text()); });
  await p.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());   // offline-safe
  return p;
}

async function playthrough(browser, lang) {
  const errs = [], english = new Set();
  const p = await newPage(browser, errs);
  await p.goto(URL + '?lang=' + lang); await p.waitForTimeout(300);
  await p.click('#begin'); await p.waitForTimeout(300);
  const visible = () => p.evaluate(() => (document.querySelector('#deck .card') || document.querySelector('#overlay') || {}).innerText || '');
  const scan = async () => { if (lang === 'en') return; for (const m of (await visible()).match(ENGLISH_RUN) || []) english.add(m); };
  let steps = 0, ended = false;
  const n = { menu: 0, card: 0, outcome: 0, month: 0 };
  while (steps++ < 1200) {
    if (await p.$('#again')) { ended = true; break; }
    if (await p.$('#beginMonth')) { n.month++; await scan(); await p.click('#beginMonth'); await p.waitForTimeout(80); continue; }
    if (await p.$('.opt')) { n.menu++; await scan(); const o = await p.$$('.opt:not([disabled])'); await o[steps % o.length].click(); await p.waitForTimeout(120); continue; }
    if (await p.$('#contBtn')) { n.outcome++; await scan(); await p.keyboard.press('Enter'); await p.waitForTimeout(240); continue; }
    if (await p.$('#deck .card')) {
      n.card++; await scan();
      if (SHOTS && n.card === 12) await p.screenshot({ path: path.join(OUT, lang + '_card.png') });
      const bt = await p.$$('#choices .choice:not([disabled])'); await bt[steps % bt.length].click(); await p.waitForTimeout(320); continue;
    }
    await p.waitForTimeout(150);
  }
  if (SHOTS) await p.screenshot({ path: path.join(OUT, lang + '_ending.png') });
  await p.close();
  const ok = ended && !errs.length && !english.size;
  console.log((ok ? 'PASS' : 'FAIL') + ` playthrough [${lang}]: ended=${ended} months=${n.month} cards=${n.card} menus=${n.menu}`);
  if (english.size) console.log('  English text in ' + lang + ': ' + [...english].slice(0, 8).join(' | '));
  errs.forEach((e) => console.log('  error: ' + e));
  return ok;
}

async function languageSwitch(browser) {
  const errs = [];
  const p = await newPage(browser, errs);
  await p.goto(URL + '?lang=en'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) { /* ignore */ } });
  await p.goto(URL); await p.waitForTimeout(300);
  await p.click('#begin'); await p.waitForTimeout(200); await p.click('#beginMonth'); await p.waitForTimeout(300);
  for (let i = 0; i < 4; i++) {
    if (await p.$('.opt:not([disabled])')) await (await p.$$('.opt:not([disabled])'))[0].click();
    else if (await p.$('#contBtn')) await p.click('#contBtn');
    else await p.keyboard.press('ArrowRight');
    await p.waitForTimeout(400);
  }
  const when = () => p.evaluate(() => (document.querySelector('#when') || {}).innerText || 'TITLE SCREEN');
  const before = await when();
  await p.$eval('#langToggle', (el) => el.click()); await p.waitForTimeout(900);
  const after = await when();
  await p.$eval('[data-tab=journal]', (el) => el.click()); await p.waitForTimeout(200);
  const journal = await p.evaluate(() => document.querySelector('#tabBody').innerText);
  await p.close();
  const ok = /[一-鿿]/.test(after) && /[一-鿿]/.test(journal) && after !== 'TITLE SCREEN' && !errs.length;
  console.log((ok ? 'PASS' : 'FAIL') + ` language switch: "${before.replace(/\s+/g, ' ')}" -> "${after.replace(/\s+/g, ' ')}"`);
  errs.forEach((e) => console.log('  error: ' + e));
  return ok;
}

async function previews(browser) {
  const errs = [];
  const p = await newPage(browser, errs);
  const cases = ['y3_career_fair', 'soc_birthday&actor=mira', 'ilse_village', 'hs_the_night'];
  let ok = true;
  for (const lang of ['en', 'zh-CN']) for (const c of cases) {
    await p.goto(URL + '?debug&lang=' + lang + '&event=' + c); await p.waitForTimeout(400);
    const t = await p.evaluate(() => ((document.querySelector('#deck .card') || document.querySelector('#overlay') || {}).innerText || '').trim());
    if (!t) { ok = false; console.log(`  empty preview: ${lang} ${c}`); }
  }
  await p.close();
  ok = ok && !errs.length;
  console.log((ok ? 'PASS' : 'FAIL') + ` event previews (${cases.length} events x 2 languages)`);
  errs.forEach((e) => console.log('  error: ' + e));
  return ok;
}

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const lang of only ? [only] : ['en', 'zh-CN']) results.push(await playthrough(browser, lang));
    if (!only) { results.push(await languageSwitch(browser)); results.push(await previews(browser)); }
  } finally { await browser.close(); }
  const failed = results.filter((r) => !r).length;
  console.log(failed ? `\n${failed} check(s) failed` : '\nall browser checks passed');
  process.exit(failed ? 1 : 0);
})();
