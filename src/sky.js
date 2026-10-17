/*
 * The sky behind the game (feedback 2026-10-15b): time of day and season as a scene, not just a tint.
 *
 *   Sky.mount()                      once, after <body> exists
 *   Sky.set(slot, season)            morning | noon | afternoon | evening | night | midnight; autumn | winter | spring | summer
 *
 * Three layers, fixed behind #app: a tint that is strong at the top and gone by the middle of the screen (the bottom
 * half keeps the page's own colour), an SVG of the sky (sun or moon by the hour, clouds, a skyline with trees dressed
 * for the season), and a canvas of particles (dust, glints, fireflies, stars and wisps by the hour; leaves, snow,
 * petals or pollen by the season). Motion stops for prefers-reduced-motion and while the tab is hidden.
 */
(function (root) {
  'use strict';
  const SLOTS = ['morning', 'noon', 'afternoon', 'evening', 'night', 'midnight'];
  const SEASONS = ['autumn', 'winter', 'spring', 'summer'];
  const DARK = { night: 1, midnight: 1 };
  let el = null, canvas = null, ctx = null, parts = [], raf = 0, last = 0, state = { slot: null, season: null }, still = false;

  // A small deterministic random, so the skyline doesn't jump between redraws.
  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) ^ Math.imul(s ^ (s >>> 13), 3266489917)) >>> 0) / 4294967296; }

  /* ---------------------------------------------------------------- the SVG */
  function celestial(slot) {
    // x, y in a 1600 × 800 frame; the horizon is at y 520.
    const sun = (x, y, r, core, glow, rays) =>
      '<circle cx="' + x + '" cy="' + y + '" r="' + r * 4 + '" fill="url(#skyGlow)" opacity=".9"/>' +
      (rays ? '<g class="sky-rays" style="transform-origin:' + x + 'px ' + y + 'px" stroke="' + glow + '" stroke-width="3" stroke-linecap="round" opacity=".45">' +
        Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2, r1 = r * 1.5, r2 = r * 2.1; return '<path d="M' + (x + Math.cos(a) * r1).toFixed(1) + ' ' + (y + Math.sin(a) * r1).toFixed(1) + 'L' + (x + Math.cos(a) * r2).toFixed(1) + ' ' + (y + Math.sin(a) * r2).toFixed(1) + '"/>'; }).join('') + '</g>' : '') +
      '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + core + '"/>';
    switch (slot) {
      case 'morning': return sun(330, 400, 46, '#ffd9a0', '#ffc88a', true);
      case 'noon': return sun(1390, 250, 40, '#fff6d8', '#fff1c0', true);
      case 'afternoon': return sun(1400, 370, 44, '#ffcf7a', '#ffbe5c', true);
      case 'evening': return '<circle cx="1330" cy="520" r="220" fill="url(#skyGlow)"/><circle cx="1330" cy="512" r="64" fill="#ff9a6a"/>';
      case 'night': return '<circle cx="1390" cy="260" r="150" fill="url(#skyGlow)" opacity=".7"/><circle cx="1390" cy="260" r="42" fill="#f3efd8"/>' +
        '<circle cx="1376" cy="250" r="8" fill="#d9d3b8"/><circle cx="1404" cy="274" r="6" fill="#d9d3b8"/><circle cx="1400" cy="242" r="4" fill="#d9d3b8"/>';
      case 'midnight': return '<circle cx="250" cy="290" r="140" fill="url(#skyGlow)" opacity=".6"/><path d="M250 248a42 42 0 1 0 30 72 34 34 0 1 1-30-72z" fill="#efe6ff"/>' +
        '<path d="M0 230C300 150 520 260 800 190S1300 140 1600 210" stroke="url(#skyAurora)" stroke-width="70" fill="none" opacity=".35" class="sky-aurora"/>';
    }
    return '';
  }
  function clouds(slot) {
    const col = { morning: '#ffe2c8', noon: '#ffffff', afternoon: '#ffe6c0', evening: '#f6a0a8', night: '#3a4270', midnight: '#2a1f50' }[slot] || '#fff';
    const op = DARK[slot] ? 0.35 : slot === 'evening' ? 0.45 : 0.3;
    const puff = (x, y, s) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><ellipse cx="0" cy="0" rx="90" ry="26"/><ellipse cx="-40" cy="-14" rx="46" ry="30"/><ellipse cx="26" cy="-22" rx="52" ry="36"/></g>';
    return '<g class="sky-clouds" fill="' + col + '" opacity="' + op + '">' + puff(220, 200, 1.1) + puff(900, 120, 0.8) + puff(1450, 260, 1.3) + puff(620, 330, 0.7) + '</g>';
  }
  function skyline(season) {
    const r = rng(7);
    // Hills, then a castle in the middle distance, then trees on the near hills.
    let h = '<path d="M0 520C200 470 360 500 520 480S860 440 1040 470 1400 500 1600 470V800H0z" fill="#1a1a3a" opacity=".55"/>';
    h += '<g fill="#14142e" opacity=".75"><rect x="700" y="400" width="34" height="120"/><path d="M694 400l23-40 23 40z"/><rect x="760" y="360" width="44" height="160"/><path d="M752 360l30-56 30 56z"/>' +
      '<rect x="830" y="420" width="30" height="100"/><path d="M824 420l21-36 21 36z"/><rect x="734" y="450" width="96" height="70"/><rect x="560" y="440" width="22" height="80"/><path d="M556 440l15-28 15 28z"/></g>';
    h += '<path d="M0 560C240 520 420 550 640 535S1040 505 1260 540 1500 560 1600 545V800H0z" fill="#121230" opacity=".85"/>';
    if (season === 'winter') h += '<path d="M0 560C240 520 420 550 640 535S1040 505 1260 540 1500 560 1600 545" stroke="#e8eeff" stroke-width="5" fill="none" opacity=".45"/>';
    const leaf = { autumn: ['#b8562a', '#d0823a', '#8a3a24'], spring: ['#2f5a3a', '#3c6a40'], summer: ['#1f4a30', '#285a36'], winter: [] }[season] || ['#1f4a30'];
    for (let i = 0; i < 14; i++) {
      const x = 40 + i * 115 + r() * 50; if (x > 600 && x < 1000) continue;
      const base = 548 - Math.sin(x / 260) * 10, th = 50 + r() * 40, w = 30 + r() * 20;
      h += '<path d="M' + x.toFixed(0) + ' ' + base.toFixed(0) + 'v-' + th.toFixed(0) + '" stroke="#0e0e24" stroke-width="5"/>';
      if (season === 'winter') {
        h += '<path d="M' + x.toFixed(0) + ' ' + (base - th * 0.6).toFixed(0) + 'l-' + (w * 0.6).toFixed(0) + ' -' + (th * 0.4).toFixed(0) + ' M' + x.toFixed(0) + ' ' + (base - th * 0.7).toFixed(0) + 'l' + (w * 0.6).toFixed(0) + ' -' + (th * 0.4).toFixed(0) + '" stroke="#0e0e24" stroke-width="3"/>' +
          '<ellipse cx="' + x.toFixed(0) + '" cy="' + (base - th - 4).toFixed(0) + '" rx="10" ry="4" fill="#eef2ff" opacity=".6"/>';
      } else {
        h += '<ellipse cx="' + x.toFixed(0) + '" cy="' + (base - th).toFixed(0) + '" rx="' + w.toFixed(0) + '" ry="' + (w * 0.8).toFixed(0) + '" fill="' + leaf[i % leaf.length] + '" opacity=".8"/>';
        if (season === 'spring') for (let k = 0; k < 5; k++) h += '<circle cx="' + (x + (r() - 0.5) * w * 1.4).toFixed(0) + '" cy="' + (base - th + (r() - 0.5) * w).toFixed(0) + '" r="4" fill="#f4b6cc" opacity=".85"/>';
      }
    }
    return h;
  }
  function svg(slot, season) {
    const glow = { morning: '#ffcf9a', noon: '#fff3c8', afternoon: '#ffc56a', evening: '#ff8a6a', night: '#c8d4ff', midnight: '#b9a0ff' }[slot] || '#fff3c8';
    return '<svg class="sky-art" viewBox="0 0 1600 800" preserveAspectRatio="xMidYMin slice" aria-hidden="true"><defs>' +
      '<radialGradient id="skyGlow"><stop offset="0" stop-color="' + glow + '" stop-opacity=".7"/><stop offset="1" stop-color="' + glow + '" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="skyAurora" x1="0" x2="1"><stop offset="0" stop-color="#6be0c0"/><stop offset=".5" stop-color="#8a6bff"/><stop offset="1" stop-color="#e06bd0"/></linearGradient>' +
      '<linearGradient id="skyFade" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#fff"/><stop offset=".92" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<mask id="skyMask"><rect width="1600" height="800" fill="url(#skyFade)"/></mask></defs>' +
      '<g mask="url(#skyMask)">' + celestial(slot) + clouds(slot) + skyline(season) + '</g></svg>';
  }

  /* ---------------------------------------------------------------- particles */
  const SLOT_FX = { morning: ['mote', 18, '#ffd9a0'], noon: ['glint', 16, '#ffffff'], afternoon: ['mote', 18, '#ffc870'], evening: ['firefly', 18, '#e8ff9a'], night: ['star', 46, '#f4f2ff'], midnight: ['wisp', 26, '#c9a8ff'] };
  const SEASON_FX = { autumn: ['leaf', 14, ['#d0823a', '#b8562a', '#e0a040', '#8a3a24']], winter: ['snow', 44, ['#ffffff']], spring: ['petal', 16, ['#f7c2d4', '#fbe0ea', '#f2a8c0']], summer: ['pollen', 14, ['#fff2a0']] };
  function spawn(kind, color, w, h, anywhere) {
    const r = Math.random;
    const p = { kind, color, x: r() * w, y: anywhere ? r() * h : -10, vx: 0, vy: 0, s: 1, a: r() * Math.PI * 2, va: 0, ph: r() * 6.3, life: 0 };
    switch (kind) {
      case 'mote': p.y = anywhere ? r() * h * 0.7 : h * 0.6; p.vx = (r() - 0.3) * 8; p.vy = -4 - r() * 6; p.s = 1 + r() * 1.6; break;
      case 'glint': p.y = r() * h * 0.45; p.s = 1 + r() * 1.5; break;
      case 'firefly': p.y = h * (0.25 + r() * 0.45); p.vx = (r() - 0.5) * 14; p.vy = (r() - 0.5) * 10; p.s = 1.6 + r() * 1.4; break;
      case 'star': p.y = r() * h * 0.5; p.s = 0.6 + r() * 1.4; break;
      case 'wisp': p.y = anywhere ? r() * h * 0.8 : h * 0.8; p.vx = (r() - 0.5) * 6; p.vy = -6 - r() * 8; p.s = 1.2 + r() * 2; break;
      case 'leaf': p.vx = 10 + r() * 16; p.vy = 18 + r() * 16; p.s = 4 + r() * 3; p.va = (r() - 0.5) * 2.4; break;
      case 'snow': p.vx = (r() - 0.5) * 6; p.vy = 14 + r() * 20; p.s = 1 + r() * 2.2; break;
      case 'petal': p.vx = 12 + r() * 14; p.vy = 14 + r() * 12; p.s = 3 + r() * 2.5; p.va = (r() - 0.5) * 3; break;
      case 'pollen': p.y = anywhere ? r() * h * 0.7 : h * 0.7; p.vx = 4 + r() * 8; p.vy = -2 - r() * 3; p.s = 1 + r() * 1.2; break;
      case 'shoot': p.x = r() * w * 0.7; p.y = r() * h * 0.25; p.vx = 520 + r() * 260; p.vy = 170 + r() * 90; p.life = 0.9; break;
    }
    return p;
  }
  function seed() {
    if (!canvas) return;
    const w = canvas.width / dpr(), h = canvas.height / dpr();
    parts = [];
    const sf = SLOT_FX[state.slot], ef = SEASON_FX[state.season];
    if (sf) for (let i = 0; i < sf[1]; i++) parts.push(spawn(sf[0], sf[2], w, h, true));
    // Leaves and petals fall in the day; snow falls any hour; summer nights get more fireflies instead of pollen.
    if (ef) {
      const kind = state.season === 'summer' && DARK[state.slot] ? 'firefly' : ef[0], cols = kind === 'firefly' ? ['#e8ff9a'] : ef[2];
      const n = DARK[state.slot] && ef[0] !== 'snow' ? Math.round(ef[1] / 2) : ef[1];
      for (let i = 0; i < n; i++) parts.push(spawn(kind, cols[i % cols.length], w, h, true));
    }
  }
  const dpr = () => Math.min(2, root.devicePixelRatio || 1);
  function resize() {
    if (!canvas) return;
    const w = el.clientWidth || root.innerWidth, h = el.clientHeight || root.innerHeight;
    canvas.width = Math.round(w * dpr()); canvas.height = Math.round(h * dpr());
    seed(); draw(0);
  }
  function step(p, dt, w, h, t) {
    p.life += dt;
    switch (p.kind) {
      case 'mote': case 'wisp': case 'pollen':
        p.x += (p.vx + Math.sin(t * 0.6 + p.ph) * 6) * dt; p.y += p.vy * dt;
        if (p.y < -10 || p.x > w + 10 || p.x < -10) Object.assign(p, spawn(p.kind, p.color, w, h, false));
        break;
      case 'firefly':
        p.vx += (Math.random() - 0.5) * 30 * dt; p.vy += (Math.random() - 0.5) * 30 * dt; p.vx *= 0.98; p.vy *= 0.98;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < h * 0.15 || p.y > h * 0.8) p.vy *= -1;
        break;
      case 'leaf': case 'petal': case 'snow':
        p.x += (p.vx + Math.sin(t * 1.3 + p.ph) * 14) * dt; p.y += p.vy * dt; p.a += p.va * dt;
        if (p.y > h + 12 || p.x > w + 20) { Object.assign(p, spawn(p.kind, p.color, w, h, false)); p.x = Math.random() * w * 1.1 - w * 0.2; }
        break;
      case 'shoot': p.x += p.vx * dt; p.y += p.vy * dt; break;
    }
  }
  function paint(p, t) {
    const c = ctx;
    switch (p.kind) {
      case 'star': case 'glint': {
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (p.kind === 'glint' ? 1.6 : 0.9) + p.ph));
        c.globalAlpha = (p.kind === 'glint' ? 0.55 : 0.85) * tw; c.fillStyle = p.color;
        c.beginPath(); c.arc(p.x, p.y, p.s, 0, 7); c.fill();
        if (p.kind === 'glint' && tw > 0.85) { c.globalAlpha = 0.4 * tw; c.fillRect(p.x - p.s * 3, p.y - 0.5, p.s * 6, 1); c.fillRect(p.x - 0.5, p.y - p.s * 3, 1, p.s * 6); }
        break;
      }
      case 'firefly': case 'wisp': case 'mote': case 'pollen': {
        const pulse = p.kind === 'firefly' ? 0.3 + 0.7 * Math.max(0, Math.sin(t * 2.2 + p.ph)) : 0.55 + 0.25 * Math.sin(t + p.ph);
        const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 4);
        g.addColorStop(0, p.color); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalAlpha = pulse * (p.kind === 'mote' || p.kind === 'pollen' ? 0.6 : 0.9); c.fillStyle = g;
        c.beginPath(); c.arc(p.x, p.y, p.s * 4, 0, 7); c.fill();
        break;
      }
      case 'snow': c.globalAlpha = 0.8; c.fillStyle = p.color; c.beginPath(); c.arc(p.x, p.y, p.s, 0, 7); c.fill(); break;
      case 'leaf': case 'petal':
        c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.scale(1, 0.45 + 0.35 * Math.abs(Math.sin(t * 2 + p.ph)));
        c.globalAlpha = 0.85; c.fillStyle = p.color; c.beginPath(); c.ellipse(0, 0, p.s, p.s * (p.kind === 'leaf' ? 0.55 : 0.7), 0, 0, 7); c.fill();
        if (p.kind === 'leaf') { c.globalAlpha = 0.5; c.strokeStyle = '#4a2010'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-p.s, 0); c.lineTo(p.s, 0); c.stroke(); }
        c.restore(); break;
      case 'shoot': {
        const a = Math.max(0, 1 - p.life / 0.9);
        const g = c.createLinearGradient(p.x, p.y, p.x - p.vx * 0.12, p.y - p.vy * 0.12);
        g.addColorStop(0, 'rgba(255,255,255,' + a + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.globalAlpha = 1; c.strokeStyle = g; c.lineWidth = 1.6; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.12, p.y - p.vy * 0.12); c.stroke();
        break;
      }
    }
  }
  function draw(dt) {
    if (!ctx) return;
    const k = dpr(), w = canvas.width / k, h = canvas.height / k, t = performance.now() / 1000;
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, w, h);
    // An occasional shooting star at night.
    if (dt && DARK[state.slot] && Math.random() < dt * (state.slot === 'midnight' ? 0.12 : 0.06)) parts.push(spawn('shoot', '#fff', w, h, true));
    for (const p of parts) { if (dt) step(p, dt, w, h, t); paint(p, t); }
    parts = parts.filter((p) => p.kind !== 'shoot' || p.life < 0.9);
    ctx.globalAlpha = 1;
  }
  function loop(now) {
    raf = 0;
    if (still || document.hidden) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    draw(dt);
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf && !still && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } }

  function mount() {
    if (el || typeof document === 'undefined') return;
    el = document.createElement('div'); el.id = 'sky'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="sky-tint"></div><div class="sky-season"></div><div class="sky-svg"></div><canvas class="sky-fx"></canvas>';
    document.body.insertBefore(el, document.body.firstChild);
    canvas = el.querySelector('canvas'); ctx = canvas.getContext && canvas.getContext('2d');
    const mq = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)');
    still = !!(mq && mq.matches);
    if (mq && mq.addEventListener) mq.addEventListener('change', (e) => { still = e.matches; if (still) draw(0); else start(); });
    root.addEventListener('resize', resize);
    // The sky also changes width without a window resize (the side panel comes and goes with the screen).
    if (root.ResizeObserver) new root.ResizeObserver(() => resize()).observe(el);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
    resize();
  }
  function set(slot, season) {
    if (!el) mount();
    if (!el) return;
    slot = SLOTS.includes(slot) ? slot : state.slot; season = SEASONS.includes(season) ? season : state.season;
    if (slot === state.slot && season === state.season) return;
    state = { slot, season };
    el.dataset.slot = slot || ''; el.dataset.season = season || '';
    el.querySelector('.sky-svg').innerHTML = slot ? svg(slot, season) : '';
    seed(); draw(0); start();
  }

  root.Sky = { mount, set, SLOTS, SEASONS };
})(typeof self !== 'undefined' ? self : this);
