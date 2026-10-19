#!/usr/bin/env node
// Border flood-fill -> transparent cutout -> flat color -> existing crop -> live PNG.
// Default: temporary preview. --out DIR: empty preview directory. --apply: backed-up live update.
'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), ART = path.join(ROOT, 'art/characters/minimal');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const json = f => JSON.parse(fs.readFileSync(f));

async function generate({ apply = false, outDir, conceptDir = ART, rootDir = ROOT, artDir = ART } = {}) {
  const out = apply ? rootDir : outDir || fs.mkdtempSync(path.join(os.tmpdir(), 'lumenhold-colored-portraits-'));
  if (!apply && fs.existsSync(out) && fs.readdirSync(out).length) throw Error('Preview directory must be empty.');
  const manifestFile = path.join(artDir, 'portrait-manifest.json'), before = fs.readFileSync(manifestFile), previous = JSON.parse(before);
  const palette = json(path.join(artDir, 'background-palette.json')), concepts = json(path.join(conceptDir, 'concept-manifest.json'));
  const input = previous.map(p => {
    const c = concepts.find(c => c.id === p.id), paint = palette.colors[p.id];
    if (!c || !/^#[0-9a-f]{6}$/i.test(paint?.color)) throw Error('Missing concept/color: ' + p.id);
    const bytes = fs.readFileSync(path.join(conceptDir, c.file));
    if (sha(bytes) !== c.sha256) throw Error('Original concept changed: ' + p.id);
    return { id: p.id, crop: p.crop, color: paint.color, background: c.background, originalSource: c.file, originalSha256: c.sha256, url: 'data:image/png;base64,' + bytes.toString('base64') };
  });
  if (Object.keys(palette.colors).length !== input.length) throw Error('Palette must cover the roster exactly.');
  const browser = await chromium.launch({ headless: true }); let rendered;
  try {
    const page = await browser.newPage(); await page.addScriptTag({ path: path.join(__dirname, 'portrait-matte.js') });
    rendered = await page.evaluate(async ({ input, tolerance }) => {
      const outputs = [];
      for (const p of input) {
        const img = new Image(); img.src = p.url; await img.decode();
        const w = img.naturalWidth, h = img.naturalHeight, c = document.createElement('canvas'); c.width = w; c.height = h;
        const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
        const source = ctx.getImageData(0, 0, w, h), matte = PortraitMatte.segment(source.data, w, h, { background: p.background, tolerance });
        ctx.putImageData(new ImageData(matte.cutout, w, h), 0, 0);
        const cutout = c.toDataURL('image/png').split(',')[1];
        const mask = document.createElement('canvas'); mask.width = w; mask.height = h; const maskCtx = mask.getContext('2d'), maskData = maskCtx.createImageData(w, h);
        for (let i = 0; i < w * h; i++) { const a = matte.cutout[i * 4 + 3]; maskData.data.set([a, a, a, 255], i * 4); } maskCtx.putImageData(maskData, 0, 0);
        const colored = document.createElement('canvas'); colored.width = w; colored.height = h; const draw = colored.getContext('2d'); draw.fillStyle = p.color; draw.fillRect(0, 0, w, h); draw.drawImage(c, 0, 0);
        const portrait = document.createElement('canvas'); portrait.width = portrait.height = 256; const pc = portrait.getContext('2d'); pc.imageSmoothingQuality = 'high';
        const r = p.crop;
        if (r.left < 0 || r.top < 0 || r.width !== r.height || r.left + r.width > w || r.top + r.height > h) throw Error('Crop outside source: ' + p.id);
        pc.drawImage(colored, r.left, r.top, r.width, r.height, 0, 0, 256, 256);
        outputs.push({ id: p.id, cutout, mask: mask.toDataURL('image/png').split(',')[1], colored: colored.toDataURL('image/png').split(',')[1], portrait: portrait.toDataURL('image/png').split(',')[1], backgroundPixels: matte.backgroundPixels, featheredPixels: matte.featheredPixels });
      }
      return outputs;
    }, { input, tolerance: palette.tolerance });
  } finally { await browser.close(); }
  const files = new Map(), next = [], records = [];
  const relativeArt = path.relative(rootDir, artDir);
  for (const r of rendered) {
    const old = previous.find(p => p.id === r.id), original = input.find(p => p.id === r.id), source = 'colored/' + r.id + '.png';
    const png = Buffer.from(r.portrait, 'base64'), colored = Buffer.from(r.colored, 'base64');
    const file = 'src/portraits/minimal/' + r.id + '.png';
    files.set(file, png);
    for (const [folder, data] of [['colored', r.colored], ['cutouts', r.cutout], ['masks', r.mask]]) files.set(path.join(relativeArt, folder, r.id + '.png'), Buffer.from(data, 'base64'));
    next.push({ ...old, file, source, background: original.color, sourceSha256: sha(colored), sha256: sha(png) });
    records.push({ id: r.id, originalSource: original.originalSource, originalSha256: original.originalSha256, color: original.color, tolerance: palette.tolerance, algorithmSha256: sha(fs.readFileSync(path.join(__dirname, 'portrait-matte.js'))), backgroundPixels: r.backgroundPixels, featheredPixels: r.featheredPixels, cutoutSha256: sha(Buffer.from(r.cutout, 'base64')), maskSha256: sha(Buffer.from(r.mask, 'base64')) });
  }
  const encode = x => Buffer.from(JSON.stringify(x, null, 2) + '\n');
  files.set(path.join(relativeArt, 'portrait-manifest.json'), encode(next));
  files.set(path.join(relativeArt, 'background-manifest.json'), encode(records));
  // Keep the approved framing as the reset baseline when switching to colored sources.
  const baselineFile = path.join(artDir, 'concept-portrait-baseline.json');
  const baseline = fs.existsSync(baselineFile) ? json(baselineFile) : [];
  const reset = next.map(p => ({ ...p, crop: baseline.find(b => b.id === p.id && b.source === p.source)?.crop || p.crop }));
  files.set(path.join(relativeArt, 'concept-portrait-baseline.json'), encode(reset));
  const cards = next.map(p => { const name = concepts.find(c => c.id === p.id).name; return `<article><h2>${name}</h2><a href="../${p.source}"><img class="concept" src="../${p.source}" alt="${name} colored upper-body concept"></a><img class="round" src="../../../../${p.file}" alt="${name} live portrait"><p><a href="../cutouts/${p.id}.png">Transparent cutout</a> · <a href="../masks/${p.id}.png">Mask</a></p></article>`; }).join('');
  files.set(path.join(relativeArt, 'concepts/index.html'), Buffer.from(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Colored portrait concepts</title><style>body{margin:24px;background:#151721;color:#eeeae2;font:16px system-ui}h1{font:36px Georgia}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}article{padding:16px;background:#202334;border-radius:12px;text-align:center}h2{font-size:15px}.concept{display:block;width:100%;height:auto}.round{display:block;width:128px;height:128px;border-radius:50%;margin:16px auto}a{color:#ebcb83;font-size:13px}</style><h1>Colored portrait concepts</h1><p>21 background-segmented upper-body concepts and their live portrait crops. Raw ivory sources remain in this folder. Use the localhost workshop to adjust crops.</p><main>${cards}</main></html>`));
  let backup;
  if (apply) {
    if (!fs.readFileSync(manifestFile).equals(before)) throw Error('Portraits changed during rendering. Rerun to include the latest crops.');
    for (const p of previous) {
      const file = path.join(p.file.startsWith('src/') ? rootDir : artDir, p.file);
      if (sha(fs.readFileSync(file)) !== p.sha256) throw Error('Current portrait changed outside its manifest: ' + p.id);
    }
    backup = path.join(artDir, '.crop-backups', 'backgrounds-' + new Date().toISOString().replace(/[:.]/g, '-'));
    const previousBytes = new Map();
    for (const file of files.keys()) {
      const absolute = path.join(rootDir, file), bytes = fs.existsSync(absolute) ? fs.readFileSync(absolute) : null; previousBytes.set(file, bytes);
      if (bytes) { const target = path.join(backup, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes); }
    }
    try {
      for (const [file, bytes] of files) { const target = path.join(rootDir, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target + '.tmp', bytes); fs.renameSync(target + '.tmp', target); }
    } catch (e) {
      for (const [file, bytes] of previousBytes) { const target = path.join(rootDir, file); if (bytes) fs.writeFileSync(target, bytes); else fs.rmSync(target, { force: true }); fs.rmSync(target + '.tmp', { force: true }); } throw e;
    }
  } else {
    for (const [file, bytes] of files) { const target = path.join(out, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes); }
  }
  console.log((apply ? 'Updated live portraits in ' : 'Preview in ') + out + (backup ? '\nPrevious files: ' + backup : ''));
  return { out, records, portraits: next, backup };
}
if (require.main === module) {
  const args = process.argv.slice(2), at = args.indexOf('--out');
  if (args.includes('--apply') && at >= 0) throw Error('Choose --apply or --out.');
  if (at >= 0 && !args[at + 1]) throw Error('--out needs a directory.');
  generate({ apply: args.includes('--apply'), outDir: at >= 0 ? args[at + 1] : undefined }).catch(e => { console.error(e); process.exitCode = 1; });
}
module.exports = { generate };
