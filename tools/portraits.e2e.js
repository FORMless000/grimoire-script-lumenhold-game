#!/usr/bin/env node
// Browser checks for the NPC portraits in game (docs/portrait-integration-handoff.md), from file:// and from the server:
// every surface in both styles, English and Chinese, desktop and phone; switching style mid-card keeps the card, the
// engine state and a multi-pick selection; the setting survives a reload and a language switch, defaults for old or
// broken settings and works without local storage; an unknown NPC, a missing PNG and a corrupt PNG fall back to the
// procedural portrait with no broken image and no change of size. (The ending is checked by tools/e2e.js.)
//
//   node tools/portraits.e2e.js [--shots]    (screenshots to build/e2e/portraits/)
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.argv.includes('--shots');
const OUT = path.join(ROOT, 'build/e2e/portraits');
if (SHOTS) fs.mkdirSync(OUT, { recursive: true });
function loadPlaywright() {
  for (const t of [process.env.PLAYWRIGHT_PATH, 'playwright', '/opt/npm-tools/node_modules/playwright'].filter(Boolean)) { try { return require(t); } catch (e) { /* next */ } }
  console.error('Playwright not found. Install it with:\n  npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const VIEWPORTS = { desktop: { width: 1280, height: 820 }, phone: { width: 390, height: 844 } };
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) failures++; };
const wait = (p, ms) => p.waitForTimeout(ms);

async function newPage(browser, vp, errs, opts = {}) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS[vp] });
  if (opts.noStorage) await ctx.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('storage disabled'); } }); });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|fonts\.|404|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  if (opts.route) await opts.route(p);
  return p;
}

// What the avatars in a scope look like: count, PNG layers, visible procedural layers, sizes.
const survey = (p, sel) => p.evaluate((sel) => [...document.querySelectorAll(sel)].map((el) => {
  const img = el.querySelector('.av-min image'), orig = el.querySelector('.av-orig');
  return { id: el.dataset.npc, png: !!img, href: img && img.getAttribute('href'), origVisible: getComputedStyle(orig).visibility !== 'hidden', w: el.getAttribute('width'), box: Math.round(el.getBoundingClientRect().width) };
}), sel);
const loadedAll = (p) => p.evaluate(() => Promise.all([...document.querySelectorAll('.av-min image')].map((img) => new Promise((res) => {
  const probe = new Image(); probe.onload = () => res(probe.naturalWidth === 256 && probe.naturalHeight === 256); probe.onerror = () => res(false); probe.src = img.href.baseVal;
}))).then((r) => r.every(Boolean)));

async function setStyle(p, style) {
  await p.$eval('#settingsBtn', (el) => el.click()); await wait(p, 120);
  await p.click('[data-portraits=' + style + ']'); await wait(p, 120);
  const on = await p.$eval('[data-portraits=' + style + ']', (el) => el.classList.contains('on'));
  await p.click('#settingsClose'); await wait(p, 80);
  return on;
}

// Play from a fresh start until the card actor, the map pins and the People panel have each been seen once, checking
// them in Minimal; on desktop, also switch style on the first card and the first map. Menu actors come from a preview.
async function checkSurface(p, sel, size, what, label) {
  await wait(p, 250);   // a failed load would have removed the layer by now
  const b = await survey(p, sel);
  ok(b.length && b.every((x) => x.png && !x.origVisible && x.w === String(size)) && (await loadedAll(p)), `${label}: ${what} shows ${b.length} PNG portrait(s) at ${size}px (${b.map((x) => x.id).join(' ')})`);
  if (SHOTS) await p.screenshot({ path: path.join(OUT, (label + ' ' + what).replace(/\W+/g, '_') + '.png') });
}
async function tour(p, base, lang, label, toggles) {
  await p.goto(base + '?lang=' + lang); await wait(p, 300);
  await p.click('#begin'); await wait(p, 250);
  const o = await p.$$('.origin-opt'); await o[0].click(); await wait(p, 80); await p.click('#originGo'); await wait(p, 250);
  const seen = {};
  const at = async (key, sel, size) => {
    if (seen[key] || !(await p.$(sel))) return;
    seen[key] = true;
    await checkSurface(p, sel, size, key, label);
    if (toggles && key !== 'People panel') await toggleHere(p, label + ' ' + key);
  };
  const click = async (h) => { try { await h.click({ timeout: 2000 }); } catch (e) { /* re-rendered under us; the next step retries */ } };
  for (let i = 0; i < 200 && Object.keys(seen).length < 3; i++) {
    await at('card actor', '#deck .card .actor-row .avatar', 40);
    if (!seen['map pins'] && (await p.$('.map-list'))) { await click(await p.$('#mapList')); await wait(p, 150); }   // phones open the map as a list
    await at('map pins', '.mk-pins .avatar', 18);
    // last: on a phone the People panel covers the screen
    if (seen['card actor'] && seen['map pins']) { await p.$eval('[data-tab=people]', (el) => el.click()); await wait(p, 150); await at('People panel', '.person .avatar', 44); }
    if (await p.$('#beginMonth')) await click(await p.$('#beginMonth'));
    else if (await p.$('#mapGo')) {
      const open = await p.$$('#mapRoot .mk.st-open .mk-dot, #mapRoot .ml-row.st-open');
      if (open.length) { await click(open[i % open.length]); await wait(p, 60); }
      const go = await p.$('#mapGo:not([disabled])'); if (go) await click(go);   // a tap picks; the button goes (or stays in)
    } else if (await p.$('.opt:not([disabled])')) {
      await click((await p.$$('.opt:not([disabled])'))[0]); await wait(p, 80);
      if (await p.$('#multiGo')) await click(await p.$('#multiGo'));
    } else if (await p.$('#contBtn')) await p.keyboard.press('Enter');
    else if (await p.$('#deck .card')) { const bt = await p.$$('#choices .choice:not([disabled])'); if (bt.length) await click(bt[i % bt.length]); }
    await wait(p, 200);
  }
  ok(Object.keys(seen).length === 3, `${label}: saw ${Object.keys(seen).join(', ')}`);
  await p.goto(base + '?lang=' + lang + '&debug&event=tamsin_letter_asks_secret&actor=tamsin'); await wait(p, 400);
  await p.click('#leadBtn'); await wait(p, 300);   // a menu opens from its lead card
  await checkSurface(p, '#overlay .actor-row .avatar', 40, 'menu actor', label);
  if (toggles) await toggleHere(p, label + ' menu actor');
}

// Switch style on the current screen: only the avatars' image layers change, every node (card, map, People rows,
// menu options and their selection) stays the same object, and the engine state is untouched.
const snapshot = (p) => p.evaluate(() => {
  const nodes = [...document.querySelectorAll('#app *, #overlay *')].filter((n) => !n.closest('.av-min'));
  nodes.forEach((n) => { n.__mark = 1; });
  window.__marked = nodes.filter((n) => n.closest('#deck, #mapRoot, #overlay .modal, #side, #choices'));
  return { state: JSON.stringify(lumen.eng.s), sel: document.querySelectorAll('.opt.sel').length, nodes: nodes.length };
});
const compare = (p) => p.evaluate(() => {
  const nodes = [...document.querySelectorAll('#app *, #overlay *')].filter((n) => !n.closest('.av-min'));
  let saved = 'n/a'; try { saved = JSON.parse(localStorage.getItem('lumenhold.settings.v1')).portraitArt; } catch (e) { /* none */ }
  const gone = window.__marked.filter((n) => !n.isConnected).map((n) => n.tagName.toLowerCase() + '.' + n.getAttribute('class'));
  return { state: JSON.stringify(lumen.eng.s), sel: document.querySelectorAll('.opt.sel').length, nodes: nodes.length, gone, fresh: nodes.filter((n) => !n.__mark).length, png: document.querySelectorAll('svg.avatar .av-min').length, hidden: [...document.querySelectorAll('.av-orig')].filter((g) => getComputedStyle(g).visibility === 'hidden').length, avatars: document.querySelectorAll('svg.avatar').length, known: [...document.querySelectorAll('svg.avatar')].filter((a) => lumen.Art.PORTRAITS[a.dataset.npc]).length, saved };
});
async function toggleHere(p, label) {
  const before = await snapshot(p);
  const segOn = await setStyle(p, 'original');
  const mid = await compare(p);
  ok(segOn && !mid.fresh && !mid.gone.length && mid.state === before.state && mid.sel === before.sel && mid.png === 0 && mid.hidden === 0 && mid.saved === 'original',
    `${label}: switching to Original keeps every node and the engine state (${mid.avatars} avatar(s)${before.sel ? ', ' + before.sel + ' selected option(s)' : ''})` +
    (mid.fresh || mid.gone.length || mid.state !== before.state ? ` — ${mid.fresh} new node(s), detached: ${mid.gone.slice(0, 4).join(' ')}, state ${mid.state === before.state ? 'same' : 'changed'}` : ''));
  await setStyle(p, 'minimal'); await wait(p, 250);
  const back = await compare(p);
  ok(!back.fresh && !back.gone.length && back.state === before.state && back.png === back.known && back.saved === 'minimal', `${label}: back to Minimal, ${back.png}/${back.avatars} PNG layer(s)`);
}
async function multiPick(p, base, label) {
  await p.goto(base + '?lang=en&debug&event=enrolment'); await wait(p, 400);
  await p.click('#leadBtn'); await wait(p, 300);
  await (await p.$$('.opt:not([disabled])'))[0].click(); await wait(p, 100);
  const before = await snapshot(p);
  await setStyle(p, 'original');
  const mid = await compare(p);
  await setStyle(p, 'minimal');
  ok(before.sel === 1 && mid.sel === 1 && !mid.fresh && !mid.gone.length && mid.state === before.state, `${label}: a multi-pick selection survives the switch`);
}

// An unknown NPC, a missing PNG and a corrupt PNG, rendered in the live page.
async function fallbacks(p, label) {
  const r = await p.evaluate(async () => {
    const box = document.createElement('div'); box.id = 'fallbackProbe'; document.body.appendChild(box);
    box.innerHTML = lumen.Art.avatar({ id: 'nobody', color: '#345' }, 40) + lumen.Art.avatar({ id: 'lyra' }, 40) + lumen.Art.avatar({ id: 'mir' }, 40) + lumen.Art.avatar({ id: 'kael' }, 40);
    const [, missing, corrupt] = box.querySelectorAll('svg.avatar');
    missing.querySelector('image').setAttribute('href', 'src/portraits/minimal/no-such-npc.png');
    corrupt.querySelector('image').setAttribute('href', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB' + 'Zm9v');
    await new Promise((res) => setTimeout(res, 600));
    const out = [...box.querySelectorAll('svg.avatar')].map((el) => ({ png: !!el.querySelector('.av-min'), orig: getComputedStyle(el.querySelector('.av-orig')).visibility !== 'hidden', w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }));
    box.remove();
    return out;
  });
  const [unknown, missing, corrupt, good] = r;
  ok(!unknown.png && unknown.orig, `${label}: unknown NPC draws the procedural portrait`);
  ok(!missing.png && missing.orig && missing.w === 40 && missing.h === 40, `${label}: missing PNG falls back, same size`);
  ok(!corrupt.png && corrupt.orig && corrupt.w === 40 && corrupt.h === 40, `${label}: corrupt PNG falls back, same size`);
  ok(good.png && !good.orig, `${label}: a good PNG stays`);
}

async function main() {
  const { chromium } = loadPlaywright();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumenhold-portraits-e2e-'));
  const server = require('../server/index.js').createServer({ dataDir }).server;
  await new Promise((res) => server.listen(0, '127.0.0.1', res));
  const bases = { 'file://': 'file://' + path.join(ROOT, 'index.html'), server: 'http://127.0.0.1:' + server.address().port + '/' };
  const browser = await chromium.launch();
  try {
    for (const [mode, base] of Object.entries(bases)) for (const lang of ['en', 'zh-CN']) for (const vp of Object.keys(VIEWPORTS)) {
      const errs = [], label = `${mode} ${lang} ${vp}`;
      const p = await newPage(browser, vp, errs);
      await tour(p, base, lang, label, vp === 'desktop');
      if (vp === 'desktop') { await fallbacks(p, label); if (lang === 'en') await multiPick(p, base, label); }
      ok(!errs.length, `${label}: no page errors` + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
      await p.context().close();
    }

    for (const [mode, base] of Object.entries(bases)) {
      // Persistence across a reload and a language switch; defaults for old and broken settings.
      const errs = [], p = await newPage(browser, 'desktop', errs);
      const count = () => p.evaluate(() => ({ png: document.querySelectorAll('svg.avatar .av-min').length, all: document.querySelectorAll('svg.avatar').length }));
      await p.goto(base + '?lang=en&debug&event=soc_birthday&actor=mir'); await wait(p, 400);
      await setStyle(p, 'original');
      await p.reload(); await wait(p, 400);
      let c = await count();
      ok(c.all > 0 && c.png === 0, `${mode}: Original survives a reload`);
      await p.goto(base + '?lang=zh-CN&debug&event=soc_birthday&actor=mir'); await wait(p, 400);
      c = await count();
      ok(c.all > 0 && c.png === 0, `${mode}: Original survives a language change`);
      for (const old of ['{"notes":false,"amounts":"numbers"}', '{"portraitArt":"sepia","amounts":"numbers"}', 'not json']) {
        await p.evaluate((v) => localStorage.setItem('lumenhold.settings.v1', v), old);
        await p.goto(base + '?lang=en&debug&event=soc_birthday&actor=mir'); await wait(p, 400);
        c = await count();
        const kept = await p.evaluate(() => localStorage.getItem('lumenhold.settings.v1'));
        ok(c.png > 0, `${mode}: settings ${old} select Minimal` + (old.includes('numbers') ? ', other settings untouched' : '') + (old.includes('numbers') && kept !== old ? ' (CHANGED)' : ''));
      }
      ok(!errs.length, `${mode}: settings checks without page errors` + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
      await p.context().close();

      // No local storage at all.
      const errs2 = [], q = await newPage(browser, 'desktop', errs2, { noStorage: true });
      await q.goto(base + '?lang=en&debug&event=soc_birthday&actor=mir'); await wait(q, 400);
      const a = await q.evaluate(() => document.querySelectorAll('svg.avatar .av-min').length);
      const seg = await setStyle(q, 'original');
      const b = await q.evaluate(() => document.querySelectorAll('svg.avatar .av-min').length);
      ok(a > 0 && seg && b === 0 && !errs2.length, `${mode}: without local storage, Minimal by default and the switch still works` + (errs2.length ? ' — ' + errs2.join(' | ') : ''));
      await q.context().close();
    }

    // Server: a 404 and a corrupt file for real portrait URLs.
    const errs = [], p = await newPage(browser, 'desktop', errs, { route: async (pg) => {
      await pg.route('**/src/portraits/minimal/mir.png', (r) => r.fulfill({ status: 404, body: 'nope' }));
      await pg.route('**/src/portraits/minimal/lyra.png', (r) => r.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('not a png at all') }));
    } });
    await p.goto(bases.server + '?lang=en&debug&event=soc_birthday&actor=mir'); await wait(p, 600);
    const mir = await survey(p, '#deck .card .actor-row .avatar');
    const injected = await p.evaluate(async () => {
      const box = document.createElement('div'); document.body.appendChild(box);
      box.innerHTML = lumen.Art.avatar({ id: 'lyra' }, 44);
      await new Promise((res) => setTimeout(res, 600));
      const el = box.querySelector('svg.avatar');
      return { png: !!el.querySelector('.av-min'), orig: getComputedStyle(el.querySelector('.av-orig')).visibility !== 'hidden' };
    });
    ok(mir.length === 1 && !mir[0].png && mir[0].origVisible && mir[0].box === 40, 'server: a 404 for the card actor\'s PNG shows the procedural portrait at 40px');
    ok(!injected.png && injected.orig, 'server: a corrupt PNG response shows the procedural portrait');
    ok(!errs.length, 'server: fallbacks without page errors' + (errs.length ? ' — ' + errs.join(' | ') : ''));
    await p.context().close();
  } finally { await browser.close(); server.close(); fs.rmSync(dataDir, { recursive: true, force: true }); }
  console.log(failures ? `\n${failures} portrait check(s) failed` : '\nall portrait checks passed');
  process.exit(failures ? 1 : 0);
}
main();
