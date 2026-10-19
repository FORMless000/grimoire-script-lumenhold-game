#!/usr/bin/env node
// Exact crops/padding of the existing upper-body art; no AI redraw.
// Default: disposable preview. --apply: re-extract sources, then generate live colored
// portraits with the current approved crops. Both stages preserve previous files.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const ART = path.resolve(__dirname, '../art/characters/minimal');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

async function main() {
  const args = process.argv.slice(2), apply = args.includes('--apply'), at = args.indexOf('--out');
  if (apply && at !== -1) throw Error('Choose --apply or --out, not both.');
  if (at !== -1 && !args[at + 1]) throw Error('--out needs a directory.');
  const out = apply ? ART : at !== -1 ? path.resolve(args[at + 1]) : fs.mkdtempSync(path.join(os.tmpdir(), 'lumenhold-upper-body-crops-'));
  if (!apply && fs.existsSync(out) && fs.readdirSync(out).length) throw Error('Use an empty preview directory. Repository updates require --apply so current crops are backed up.');
  const layout = JSON.parse(fs.readFileSync(path.join(ART, 'concept-crop-layout.json')));
  const designs = JSON.parse(fs.readFileSync(path.join(ART, 'designs.json'))).characters;
  const oldManifestBytes = fs.readFileSync(path.join(ART, 'portrait-manifest.json'));
  const old = JSON.parse(oldManifestBytes);
  const sheets = [...new Set(layout.regions.map((r) => r[1]))].map((batch) => {
    const file = 'images/batch-' + String(batch).padStart(2, '0') + '.png', bytes = fs.readFileSync(path.join(ART, file));
    return { batch, file, sha256: sha(bytes), url: 'data:image/png;base64,' + bytes.toString('base64') };
  });
  if (layout.regions.length !== designs.length || new Set(layout.regions.map((r) => r[0])).size !== designs.length || designs.some((c) => !layout.regions.some((r) => r[0] === c.id))) throw Error('Layout must cover the cast once.');
  const browser = await chromium.launch({ headless: true });
  let rendered;
  try {
    const page = await browser.newPage();
    rendered = await page.evaluate(async ({ layout, sheets }) => {
      const images = new Map();
      for (const s of sheets) { const img = new Image(); img.src = s.url; await img.decode(); images.set(s.batch, img); }
      return layout.regions.map(([id, batch, left, right]) => {
        const img = images.get(batch), width = right - left, height = img.naturalHeight;
        if (left < 0 || right > img.naturalWidth || width < 1) throw Error('Invalid region for ' + id);
        const scan = document.createElement('canvas'); scan.width = width; scan.height = height;
        const ctx = scan.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, -left, 0);
        const pixels = ctx.getImageData(0, 0, width, height).data;
        // All four corners of these authored regions are empty ivory background.
        const background = [0, 0, 0]; let samples = 0;
        for (const [sx, sy] of [[0, 0], [width - 8, 0], [0, height - 8], [width - 8, height - 8]]) for (let dy = 0; dy < 8; dy++) for (let dx = 0; dx < 8; dx++) {
          const at = ((sy + dy) * width + sx + dx) * 4;
          for (let c = 0; c < 3; c++) background[c] += pixels[at + c]; samples++;
        }
        for (let c = 0; c < 3; c++) background[c] = Math.round(background[c] / samples);
        const polygon = layout.polygons?.[id];
        if (polygon) {
          // Clip only along empty gaps between adjacent characters; preserve the art itself.
          ctx.clearRect(0, 0, width, height); ctx.fillStyle = `rgb(${background.join(',')})`; ctx.fillRect(0, 0, width, height);
          ctx.save(); ctx.beginPath();
          polygon.forEach(([x, y], index) => index ? ctx.lineTo(x - left, y) : ctx.moveTo(x - left, y));
          ctx.closePath(); ctx.clip(); ctx.drawImage(img, -left, 0); ctx.restore();
        }
        const isolated = ctx.getImageData(0, 0, width, height).data;
        let x0 = width, x1 = -1, y0 = height, y1 = -1;
        const threshold = layout.backgroundDistance ** 2;
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
          const at = (y * width + x) * 4;
          const distance = (isolated[at] - background[0]) ** 2 + (isolated[at + 1] - background[1]) ** 2 + (isolated[at + 2] - background[2]) ** 2;
          if (distance > threshold) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        }
        if (x1 < x0) throw Error('No artwork detected for ' + id);
        x0 = Math.max(0, x0 - 3); y0 = Math.max(0, y0 - 3); x1 = Math.min(width - 1, x1 + 3); y1 = Math.min(height - 1, y1 + 3);
        const bounds = { left: left + x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
        const size = layout.size, usable = size * (1 - 2 * layout.paddingFraction), scale = usable / Math.max(bounds.width, bounds.height);
        const placement = { left: (size - bounds.width * scale) / 2, top: (size - bounds.height * scale) / 2, width: bounds.width * scale, height: bounds.height * scale };
        const concept = document.createElement('canvas'); concept.width = concept.height = size;
        const draw = concept.getContext('2d'); draw.fillStyle = `rgb(${background.join(',')})`; draw.fillRect(0, 0, size, size); draw.imageSmoothingQuality = 'high';
        draw.drawImage(scan, x0, y0, bounds.width, bounds.height, placement.left, placement.top, placement.width, placement.height);
        return { id, batch, bounds, placement, background, sourceRegion: { left, top: 0, width, height }, conceptPNG: concept.toDataURL('image/png').split(',')[1] };
      });
    }, { layout, sheets });
  } finally { await browser.close(); }
  let backup = null;
  if (apply) {
    if (!fs.readFileSync(path.join(ART, 'portrait-manifest.json')).equals(oldManifestBytes)) throw Error('Portraits changed during generation; rerun to preserve the latest edits.');
    for (const entry of old) if (sha(fs.readFileSync(path.join(entry.file.startsWith('src/') ? path.resolve(__dirname, '..') : ART, entry.file))) !== entry.sha256) throw Error('Portrait differs from its manifest: ' + entry.id);
    backup = path.join(ART, '.crop-backups', 'upper-body-' + new Date().toISOString().replace(/[:.]/g, '-'));
    fs.mkdirSync(backup, { recursive: true });
    if (fs.existsSync(path.join(ART, 'concept-manifest.json'))) fs.copyFileSync(path.join(ART, 'concept-manifest.json'), path.join(backup, 'concept-manifest.json'));
    if (fs.existsSync(path.join(ART, 'concepts'))) fs.cpSync(path.join(ART, 'concepts'), path.join(backup, 'concepts'), { recursive: true });
  }
  fs.mkdirSync(path.join(out, 'concepts'), { recursive: true });
  const concepts = [];
  for (const r of rendered) {
    const concept = Buffer.from(r.conceptPNG, 'base64'), source = sheets.find((s) => s.batch === r.batch);
    const conceptFile = 'concepts/' + r.id + '.png';
    fs.writeFileSync(path.join(out, conceptFile), concept);
    concepts.push({ id: r.id, batch: r.batch, name: designs.find((c) => c.id === r.id).name, file: conceptFile, source: source.file, sourceSha256: source.sha256, sourceRegion: r.sourceRegion, ...(layout.polygons?.[r.id] ? { sourcePolygon: layout.polygons[r.id] } : {}), bounds: r.bounds, placement: r.placement, background: r.background, width: layout.size, height: layout.size, sha256: sha(concept) });
  }
  fs.writeFileSync(path.join(out, 'concept-manifest.json'), JSON.stringify(concepts, null, 2) + '\n');
  console.log('Extracted ' + concepts.length + ' square upper-body sources in ' + out);
  if (backup) console.log('Previous source concepts preserved in ' + backup);
  await require('./generate-portraits.js').generate({ apply, conceptDir: out, outDir: apply ? undefined : path.join(out, 'portrait-preview') });
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
