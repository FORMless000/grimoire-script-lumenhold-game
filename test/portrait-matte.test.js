'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { segment } = require('../tools/portrait-matte.js');

test('border fill clears connected background while preserving enclosed pupil highlights and pale clothing', () => {
  const width = 9, height = 9, background = [250, 245, 230];
  const pixels = new Uint8ClampedArray(width * height * 4);
  const put = (x, y, rgb) => pixels.set([...rgb, 255], (y * width + x) * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) put(x, y, background);
  for (let y = 2; y <= 6; y++) for (let x = 2; x <= 6; x++) put(x, y, [30, 40, 60]);
  put(4, 4, background); // Same RGB as the backdrop, enclosed in the eye.
  put(3, 5, [255, 255, 255]);
  put(5, 5, [232, 218, 190]); // Light garment inside the silhouette.
  put(6, 5, [232, 218, 190]); // Its contour may be softened, never flooded away.
  put(2, 2, background); // Connected gap around the silhouette is removable.
  const before = pixels.slice(), result = segment(pixels, width, height, { background });
  const alpha = (x, y) => result.cutout[(y * width + x) * 4 + 3];
  assert.equal(alpha(0, 0), 0); assert.equal(alpha(2, 2), 0);
  assert.equal(alpha(4, 4), 255); assert.equal(alpha(3, 5), 255);
  assert.deepEqual(result.cutout.slice((4 * width + 4) * 4, (4 * width + 4) * 4 + 4), new Uint8ClampedArray([...background, 255]));
  assert.equal(alpha(5, 5), 255); assert.ok(alpha(6, 5) > 0);
  assert.deepEqual(pixels, before, 'raw source pixels are not mutated');
  assert.deepEqual(segment(pixels, width, height, { background }).cutout, result.cutout, 'repeatable mask');
});

test('edge unmixing avoids carrying the ivory backdrop into a replacement color', () => {
  const width = 7, height = 7, background = [250, 250, 250];
  const pixels = new Uint8ClampedArray(width * height * 4);
  const put = (x, y, rgb) => pixels.set([...rgb, 255], (y * width + x) * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) put(x, y, background);
  for (let y = 2; y <= 4; y++) for (let x = 2; x <= 4; x++) put(x, y, [50, 50, 50]);
  put(1, 3, [210, 210, 210]); // 20% dark foreground, 80% old backdrop.
  const result = segment(pixels, width, height, { background });
  const rgba = [...result.cutout.slice((3 * width + 1) * 4, (3 * width + 1) * 4 + 4)];
  assert.deepEqual(rgba, [50, 50, 50, 51]);
  assert.equal(result.cutout[(3 * width + 2) * 4 + 3], 255);
});
