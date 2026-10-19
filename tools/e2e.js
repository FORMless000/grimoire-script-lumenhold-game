#!/usr/bin/env node
// Browser smoke test: plays full games in a real browser and checks the UI.
//
//   node tools/e2e.js              # English + zh-CN playthroughs, language switch, previews (from file://)
//   node tools/e2e.js --server     # the same against the Lumenhold server (npm start), plus checks that the
//                                  # run log, feedback, seen counters and saves reached it
//   node tools/e2e.js --quick      # English playthrough + previews only
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
const SERVER = args.includes('--server');
const QUICK = args.includes('--quick');
const ROOT = path.resolve(__dirname, '..');
let URL = 'file://' + path.join(ROOT, 'index.html');
let server = null;
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
  // Fights (the combat minigame) are played with real clicks against a foe that searches little, to keep the run quick.
  await p.evaluate(() => { if (window.CombatUI) window.CombatUI.foeAI = { maxDepth: 2, nodeBudget: 2e4 }; });
  await p.click('#begin'); await p.waitForTimeout(300);
  await pickOrigin(p);
  const visible = () => p.evaluate(() => (document.querySelector('#deck .card') || document.querySelector('#overlay') || {}).innerText || '');
  const scan = async () => { if (lang === 'en') return; for (const m of (await visible()).match(ENGLISH_RUN) || []) english.add(m); };
  let steps = 0, ended = false;
  const n = { menu: 0, multi: 0, map: 0, card: 0, outcome: 0, month: 0, fight: 0 };
  let idle = 0;
  while (steps++ < 5000) {
    if (await p.$('#deck .card, .opt, #mapGo, #contBtn, #beginMonth, #again, #fightLayer')) idle = 0;
    if (await p.$('#again')) { ended = true; break; }
    if (await p.$('#beginMonth')) { n.month++; await scan(); await p.click('#beginMonth'); await p.waitForTimeout(80); continue; }
    if (await p.$('#mapGo')) { n.map++; await scan(); if (!(await mapPick(p, steps))) break; await p.waitForTimeout(200); continue; }
    if (await p.$('.opt')) {
      n.menu++; await scan();
      const o = await p.$$('.opt:not([disabled])'); await o[steps % o.length].click(); await p.waitForTimeout(120);
      if (await p.$('#multiGo')) {   // pick: N menus: add a second option when there is one, then confirm
        n.multi++;
        const rest = await p.$$('.opt:not([disabled]):not(.sel)'); if (rest.length) { await rest[0].click(); await p.waitForTimeout(80); }
        await p.click('#multiGo'); await p.waitForTimeout(120);
      }
      continue;
    }
    if (await p.$('#fightLayer')) {   // a fight: an open action each exchange, then back to the card
      if (await p.$('#fightDone')) { n.fight++; await p.click('#fightDone'); await p.waitForTimeout(300); continue; }
      const a = await p.$$('#fightLayer .act:not([disabled])');
      if (a.length) { await a[steps % a.length].click(); await p.click('#fightLayer .fl-commit'); }
      await p.waitForTimeout(150); continue;
    }
    if (await p.$('#contBtn')) { n.outcome++; await scan(); await p.keyboard.press('Enter'); await p.waitForTimeout(240); continue; }
    if (await p.$('#deck .card')) {
      n.card++; await scan();
      if (SHOTS && n.card === 12) await p.screenshot({ path: path.join(OUT, lang + '_card.png') });
      if (n.card === 5) await p.click('#fbBar .fb-r.down');
      const bt = await p.$$('#choices .choice:not([disabled])'); await bt[steps % bt.length].click(); await p.waitForTimeout(320); continue;
    }
    // Nothing to act on: wait, but report a screen that stays stuck.
    if (++idle > 40) { console.log('  stuck on: ' + (await p.evaluate(() => (document.querySelector('#overlay') || document.body).innerText.slice(0, 300).replace(/\s+/g, ' ')))); break; }
    await p.waitForTimeout(150); continue;
  }
  if (SHOTS) await p.screenshot({ path: path.join(OUT, lang + '_ending.png') });
  let serverOk = true;
  if (SERVER && ended) serverOk = await checkServer(p, lang, errs);
  await p.close();
  const ok = ended && serverOk && !errs.length && !english.size;
  console.log((ok ? 'PASS' : 'FAIL') + ` playthrough [${lang}]: ended=${ended} months=${n.month} days=${n.map} cards=${n.card} fights=${n.fight} menus=${n.menu} (multi-pick ${n.multi})`);
  if (!n.map || !n.multi) { console.log('  expected at least one map screen and one multi-pick menu'); return false; }
  if (english.size) console.log('  English text in ' + lang + ': ' + [...english].slice(0, 8).join(' | '));
  errs.forEach((e) => console.log('  error: ' + e));
  return ok;
}

// The origin screen (M32): a random origin each run, so runs cover them all over time.
async function pickOrigin(p) {
  const opts = await p.$$('.origin-opt');
  if (!opts.length) throw new Error('no origin screen after Begin');
  await opts[Math.floor(Math.random() * opts.length)].click(); await p.waitForTimeout(250);
}

// The map screen (M1): one visit at a time; tapping an open place goes there at once, "Stay in" skips it.
async function mapPick(p, steps) {
  if (SHOTS && steps < 40) await p.screenshot({ path: path.join(OUT, 'map.png') });
  const turn = () => p.evaluate(() => lumen.eng.s.hist.filter((h) => h.t === 'pick').length);
  const before = await turn();
  const open = await p.$$('#mapRoot .mk.st-open .mk-dot, #mapRoot .ml-row.st-open');
  if (open.length) { await open[steps % open.length].click(); await p.waitForTimeout(60); }
  // a place closed in this slot only shows a status line; then stay in
  if ((await turn()) === before) { const stay = await p.$('#mapGo:not([disabled])'); if (stay) { await stay.click(); await p.waitForTimeout(60); } }
  if ((await turn()) === before) { console.log('  map: could not leave the map; ' + (await p.evaluate(() => (document.querySelector('#mapRoot .map-status') || {}).innerText || ''))); return false; }
  return true;
}

// After a finished game on the server: the run is stored complete, with its feedback, seen counters
// were counted, and the autosave was cleared.
async function checkServer(p, lang, errs) {
  await p.waitForTimeout(800);
  const r = await p.evaluate(async () => {
    const runId = lumen.eng.s.runId;
    const run = await fetch('api/runs/' + runId).then((x) => x.json());
    const seen = await fetch('api/seen').then((x) => x.json());
    const saves = await fetch('api/saves').then((x) => x.json());
    const local = lumen.eng.s.hist.filter((h) => h.t === 'card').length;
    return { stored: run.hist.filter((h) => h.t === 'card').length, local, ended: !!run.ended, unresolved: run.hist.filter((h) => h.t === 'card' && h.choice == null).length, fb: run.hist.filter((h) => h.fb).length, seen: Object.values(seen).some((c) => c.last_run === runId), auto: saves.find((x) => x.slot === 'auto').empty };
  });
  const ok = r.stored === r.local && r.ended && r.unresolved === 0 && r.fb >= 1 && r.seen && r.auto;
  console.log((ok ? 'PASS' : 'FAIL') + ` server log [${lang}]: ${r.stored}/${r.local} cards stored, ended=${r.ended}, unresolved=${r.unresolved}, feedback=${r.fb}, seen=${r.seen}, autosave cleared=${r.auto}`);
  return ok;
}

async function languageSwitch(browser) {
  const errs = [];
  const p = await newPage(browser, errs);
  await p.goto(URL + '?lang=en'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) { /* ignore */ } });
  await p.goto(URL); await p.waitForTimeout(300);
  await p.click('#begin'); await p.waitForTimeout(200); await pickOrigin(p); await p.click('#beginMonth'); await p.waitForTimeout(300);
  // Play until an outcome card is on screen: switching there must keep it (B1), not skip to the next card.
  for (let i = 0; i < 30 && !(await p.$('#contBtn')); i++) {
    if (await p.$('.opt:not([disabled])')) await (await p.$$('.opt:not([disabled])'))[0].click();
    else if (await p.$('#mapGo')) await mapPick(p, i);
    else if (await p.$('#beginMonth')) await p.click('#beginMonth');
    else await p.keyboard.press('ArrowRight');
    await p.waitForTimeout(400);
  }
  const when = () => p.evaluate(() => (document.querySelector('#when') || {}).innerText || 'TITLE SCREEN');
  const before = await when();
  const hadOutcome = !!(await p.$('#contBtn'));
  await p.$eval('#langToggle', (el) => el.click()); await p.waitForTimeout(900);
  const after = await when();
  const keptOutcome = !hadOutcome || !!(await p.$('#contBtn'));
  if (!keptOutcome) console.log('  the outcome card was skipped by the language switch');
  await p.$eval('[data-tab=journal]', (el) => el.click()); await p.waitForTimeout(200);
  const journal = await p.evaluate(() => document.querySelector('#tabBody').innerText);
  await p.close();
  const ok = /[一-鿿]/.test(after) && /[一-鿿]/.test(journal) && after !== 'TITLE SCREEN' && keptOutcome && hadOutcome && !errs.length;
  console.log((ok ? 'PASS' : 'FAIL') + ` language switch: "${before.replace(/\s+/g, ' ')}" -> "${after.replace(/\s+/g, ' ')}"`);
  errs.forEach((e) => console.log('  error: ' + e));
  return ok;
}

async function previews(browser) {
  const errs = [];
  const p = await newPage(browser, errs);
  const cases = ['y3_career_fair', 'soc_birthday&actor=mir', 'ilse_village', 'hs_the_night'];
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
  if (SERVER) {
    const os = require('os');
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumenhold-e2e-'));
    server = require('../server/index.js').createServer({ dataDir }).server;
    await new Promise((res) => server.listen(0, '127.0.0.1', res));
    URL = 'http://127.0.0.1:' + server.address().port + '/';
    process.on('exit', () => fs.rmSync(dataDir, { recursive: true, force: true }));
    console.log('server mode: ' + URL);
  }
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const lang of only ? [only] : QUICK ? ['en'] : ['en', 'zh-CN']) results.push(await playthrough(browser, lang));
    if (!only && !QUICK) results.push(await languageSwitch(browser));
    if (!only) results.push(await previews(browser));
  } finally { await browser.close(); if (server) server.close(); }
  const failed = results.filter((r) => !r).length;
  console.log(failed ? `\n${failed} check(s) failed` : '\nall browser checks passed');
  process.exit(failed ? 1 : 0);
})();
