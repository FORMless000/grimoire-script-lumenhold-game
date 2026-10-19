'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let data, active, image, crop, drag, loading = 0, saving = false;
  const drafts = new Map(), images = new Map();
  const canvas = $('cropCanvas'), ctx = canvas.getContext('2d');
  const exported = document.createElement('canvas'); exported.width = exported.height = 256;
  const exportedContext = exported.getContext('2d');
  const saved = (id) => data.portraits.find((p) => p.id === id);
  const sameCrop = (a, b) => ['left', 'top', 'width', 'height'].every((k) => a[k] === b[k]);

  function selectTab(id) {
    for (const b of document.querySelectorAll('[data-tab]')) b.setAttribute('aria-pressed', String(b.dataset.tab === id));
    for (const section of ['portraits', 'characters', 'concepts']) $(section).hidden = id !== section;
    $('shape').hidden = id !== 'portraits';
  }
  for (const b of document.querySelectorAll('[data-tab]')) b.onclick = () => selectTab(b.dataset.tab);
  $('shape').onclick = function () { document.body.classList.toggle('square'); this.setAttribute('aria-pressed', String(document.body.classList.contains('square'))); };

  async function request(url, options) {
    const res = await fetch(url, options), body = await res.json();
    if (!res.ok) throw Error(body.error || 'Unable to load artwork.');
    return body;
  }
  function renderGallery() {
    $('roster').innerHTML = data.designs.characters.map((c) => {
      const p = saved(c.id), src = p.file + '?v=' + p.sha256;
      const sources = [...c.sourceEvents, ...c.sourceFacts].map((s) => `${esc(s.id)} (${esc(s.file)}:${s.line})`).join('<br>');
      return `<article class="person" id="${c.id}"><h2>${esc(c.name)}</h2><p class="identity">${c.age} · ${esc(c.pronouns)}</p><a class="portrait-link" href="${src}" target="_blank"><img class="face" src="${src}" width="160" height="160" alt="${esc(c.name)}"></a><div class="sizes">${[26, 40, 48].map((n) => `<span><img src="${src}" width="${n}" height="${n}" alt="${n}px ${esc(c.name)}"><small>${n}px</small></span>`).join('')}</div><button data-edit="${c.id}">Adjust crop</button><p class="description">${esc(c.appearance)}</p><details><summary>Evidence and chosen details</summary><p><b>Written anchor:</b> ${esc(c.canon)}</p><p><b>SVG / design:</b> ${esc(c.design)}</p><p class="sources">${sources}</p></details></article>`;
    }).join('');
    $('characterConcepts').innerHTML = data.designs.characters.map((c) => {
      const p = saved(c.id);
      if (!['concepts/' + c.id + '.png', 'colored/' + c.id + '.png'].includes(p.source)) return '';
      const src = p.source + '?v=' + p.sourceSha256;
      return `<article class="concept-person"><h2>${esc(c.name)}</h2><a href="${src}" target="_blank"><img class="character-concept" src="${src}" width="1024" height="1024" alt="${esc(c.name)} upper-body concept"></a><a href="${src}" download="${c.id}-concept.png">Download square concept</a><button data-edit="${c.id}">Adjust portrait crop</button></article>`;
    }).join('');
    for (const button of document.querySelectorAll('[data-edit]')) button.onclick = () => openEditor(button.dataset.edit);
    $('concepts').innerHTML = data.batches.map((b) => `<section class="sheet"><a href="${b.file}" target="_blank"><img src="${b.file}" alt="Concept batch ${b.batch}"></a><ol style="--n:${b.ids.length}">${b.ids.map((id) => `<li><a href="#${id}" data-person="${id}">${esc(data.designs.characters.find((c) => c.id === id).name)}</a></li>`).join('')}</ol></section>`).join('');
    for (const link of document.querySelectorAll('[data-person]')) link.onclick = () => selectTab('portraits');
  }
  function sourceImage(src) {
    if (!images.has(src)) images.set(src, new Promise((resolve, reject) => {
      const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(Error('Unable to load concept master.')); img.src = src;
    }));
    return images.get(src);
  }
  async function openEditor(id) {
    if (saving) return;
    const ticket = ++loading;
    active = id; image = null; $('character').value = id;
    $('editorTitle').textContent = data.designs.characters.find((c) => c.id === id).name;
    if (!$('editor').open) $('editor').showModal();
    $('savePortrait').disabled = true; $('saveStatus').textContent = 'Loading concept master…';
    for (const key of ['resetSaved', 'resetInitial', 'downloadPortrait']) $(key).disabled = true;
    try {
      const loaded = await sourceImage(saved(id).source);
      if (ticket !== loading) return;
      image = loaded; crop = { ...(drafts.get(id) || saved(id).crop) }; drag = null;
      draw();
      for (const key of ['resetSaved', 'resetInitial', 'downloadPortrait']) $(key).disabled = false;
    } catch (error) { $('saveStatus').textContent = error.message; }
  }
  function clampCrop() {
    const size = Math.round(Math.max(32, Math.min(crop.width, image.naturalWidth, image.naturalHeight)));
    crop = { left: Math.round(Math.max(0, Math.min(crop.left, image.naturalWidth - size))), top: Math.round(Math.max(0, Math.min(crop.top, image.naturalHeight - size))), width: size, height: size };
  }
  function draw() {
    clampCrop();
    ctx.clearRect(0, 0, 512, 512); ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, crop.left, crop.top, crop.width, crop.height, 0, 0, 512, 512);
    // This separate canvas has no guides or round mask and is the only export source.
    exportedContext.clearRect(0, 0, 256, 256); exportedContext.imageSmoothingQuality = 'high';
    exportedContext.drawImage(image, crop.left, crop.top, crop.width, crop.height, 0, 0, 256, 256);
    for (const sample of $('liveSizes').querySelectorAll('canvas')) {
      const context = sample.getContext('2d'); context.clearRect(0, 0, sample.width, sample.height); context.drawImage(exported, 0, 0, sample.width, sample.height);
    }
    for (const [key, value, max] of [['left', crop.left, image.naturalWidth - crop.width], ['top', crop.top, image.naturalHeight - crop.height], ['size', crop.width, Math.min(image.naturalWidth, image.naturalHeight)]]) {
      for (const suffix of ['Range', 'Number']) { const input = $(key + suffix); input.min = key === 'size' ? 32 : 0; input.max = max; input.value = value; }
    }
    const changed = !sameCrop(crop, saved(active).crop);
    if (changed) drafts.set(active, { ...crop }); else drafts.delete(active);
    $('savePortrait').disabled = saving || !changed;
    $('cropInfo').textContent = `Master ${image.naturalWidth} × ${image.naturalHeight} · export 256 × 256`;
    $('saveStatus').textContent = changed ? 'Unsaved alignment. Save to update the repository PNG.' : 'Showing the saved alignment.';
  }
  function zoom(size) {
    const centerX = crop.left + crop.width / 2, centerY = crop.top + crop.height / 2;
    crop.width = crop.height = size; crop.left = centerX - size / 2; crop.top = centerY - size / 2; draw();
  }
  for (const key of ['left', 'top', 'size']) for (const suffix of ['Range', 'Number']) $(key + suffix).oninput = (event) => {
    if (!image || saving) return;
    const value = Number(event.target.value); if (!Number.isFinite(value) || event.target.value === '') return;
    if (key === 'size') zoom(value); else { crop[key] = value; draw(); }
  };
  canvas.onpointerdown = (event) => {
    if (!image || saving) return;
    drag = { x: event.clientX, y: event.clientY, left: crop.left, top: crop.top, size: crop.width };
    canvas.setPointerCapture(event.pointerId); canvas.focus();
  };
  canvas.onpointermove = (event) => {
    if (!drag || saving) return;
    const scale = drag.size / canvas.getBoundingClientRect().width;
    crop.left = drag.left - (event.clientX - drag.x) * scale;
    crop.top = drag.top - (event.clientY - drag.y) * scale; draw();
  };
  canvas.onpointerup = canvas.onpointercancel = () => { drag = null; };
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault(); if (image && !saving) zoom(crop.width * (event.deltaY > 0 ? 1.04 : .96));
  }, { passive: false });
  canvas.onkeydown = (event) => {
    if (!image || saving) return;
    const step = event.shiftKey ? 10 : 1;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === '+' || event.key === '=') return zoom(crop.width - step * 4);
    if (event.key === '-') return zoom(crop.width + step * 4);
    if (event.key === 'ArrowLeft') crop.left -= step;
    if (event.key === 'ArrowRight') crop.left += step;
    if (event.key === 'ArrowUp') crop.top -= step;
    if (event.key === 'ArrowDown') crop.top += step;
    draw();
  };
  $('showGuides').onchange = () => { $('guides').toggleAttribute('hidden', !$('showGuides').checked); };
  $('showRound').onchange = () => { $('roundMask').toggleAttribute('hidden', !$('showRound').checked); };
  $('character').onchange = () => openEditor($('character').value);
  $('closeEditor').onclick = () => { if (!saving) $('editor').close(); };
  $('editor').addEventListener('cancel', (event) => { if (saving) event.preventDefault(); });
  $('resetSaved').onclick = () => { crop = { ...saved(active).crop }; draw(); };
  $('resetInitial').onclick = () => { crop = { ...data.originals.find((p) => p.id === active).crop }; draw(); };
  $('downloadPortrait').onclick = () => { const a = document.createElement('a'); a.href = exported.toDataURL('image/png'); a.download = active + '.png'; a.click(); };
  $('savePortrait').onclick = async () => {
    if (saving) return;
    saving = true; $('savePortrait').disabled = true; $('character').disabled = true;
    for (const id of ['resetSaved', 'resetInitial', 'downloadPortrait', 'closeEditor']) $(id).disabled = true;
    $('saveStatus').textContent = 'Saving portrait and alignment…';
    try {
      const result = await request('/api/portraits/' + active, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: saved(active).version, crop, png: exported.toDataURL('image/png') }) });
      data.portraits[data.portraits.findIndex((p) => p.id === active)] = result.portrait;
      drafts.delete(active); renderGallery();
      $('saveStatus').textContent = `Saved ${result.portrait.file} and alignment. Previous files: ${result.backup}`;
    } catch (error) { $('saveStatus').textContent = error.message; $('savePortrait').disabled = false; }
    finally {
      saving = false; $('character').disabled = false;
      for (const id of ['resetSaved', 'resetInitial', 'downloadPortrait', 'closeEditor']) $(id).disabled = false;
    }
  };
  async function boot() {
    if (location.protocol === 'file:') { $('loadStatus').textContent = 'To edit and save portraits, run node tools/portrait-preview.js from the repository, then open http://127.0.0.1:4174/.'; return; }
    try {
      data = await request('/api/data'); renderGallery();
      $('character').innerHTML = data.designs.characters.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
      $('liveSizes').innerHTML = [18, 26, 40, 48, 128].map((size) => `<span><canvas width="${size}" height="${size}" aria-label="${size}px crop preview"></canvas><small>${size}px</small></span>`).join('');
      $('loadStatus').textContent = 'Click “Adjust crop” on a character. Changes reach disk only when you save.';
    } catch (error) { $('loadStatus').textContent = error.message; }
  }
  boot();
})();
