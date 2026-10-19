// Deterministic border-connected color fill. Enclosed light pixels (eyes, clothes)
// are foreground; this is deliberately not a global "replace ivory" operation.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PortraitMatte = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function segment(pixels, width, height, { background, tolerance = 18 } = {}) {
    if (pixels.length !== width * height * 4 || !background || background.length !== 3) throw Error('Expected RGBA pixels and an RGB background.');
    const count = width * height, removed = new Uint8Array(count), queue = new Int32Array(count);
    const distance = (i) => background.reduce((sum, b, c) => sum + (pixels[i * 4 + c] - b) ** 2, 0);
    let head = 0, tail = 0;
    const add = (i) => { if (!removed[i] && distance(i) <= tolerance ** 2) { removed[i] = 1; queue[tail++] = i; } };
    for (let x = 0; x < width; x++) { add(x); add((height - 1) * width + x); }
    for (let y = 1; y < height - 1; y++) { add(y * width); add(y * width + width - 1); }
    while (head < tail) {
      const i = queue[head++], x = i % width;
      if (x) add(i - 1); if (x + 1 < width) add(i + 1);
      if (i >= width) add(i - width); if (i + width < count) add(i + width);
    }
    const cutout = new Uint8ClampedArray(pixels);
    let feathered = 0;
    for (let i = 0; i < count; i++) {
      if (removed[i]) { cutout[i * 4 + 3] = 0; continue; }
      const x = i % width, y = Math.floor(i / width);
      const edge = (x && removed[i - 1]) || (x + 1 < width && removed[i + 1]) || (y && removed[i - width]) || (y + 1 < height && removed[i + width]);
      if (!edge || distance(i) > 90 ** 2) continue;
      // Estimate the unmixed edge color from a nearby opaque interior pixel.
      // Only the immediate contour is adjusted; enclosed highlights stay exact.
      let neighbor = -1, nearest = Infinity;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const xx = x + dx, yy = y + dy, d = dx * dx + dy * dy;
        if (!d || xx < 0 || xx >= width || yy < 0 || yy >= height || d >= nearest) continue;
        const at = yy * width + xx;
        if (!removed[at] && distance(at) >= 64 ** 2) { neighbor = at; nearest = d; }
      }
      if (neighbor < 0) continue;
      let dot = 0, norm = 0;
      for (let c = 0; c < 3; c++) { const f = pixels[neighbor * 4 + c] - background[c]; dot += (pixels[i * 4 + c] - background[c]) * f; norm += f * f; }
      const alpha = Math.max(0, Math.min(1, dot / norm));
      if (alpha > 0 && alpha < 1) {
        cutout[i * 4 + 3] = Math.round(alpha * 255); feathered++;
        for (let c = 0; c < 3; c++) cutout[i * 4 + c] = Math.round((pixels[i * 4 + c] - (1 - alpha) * background[c]) / alpha);
      }
    }
    return { cutout, removed, backgroundPixels: tail, featheredPixels: feathered };
  }
  return { segment };
});
