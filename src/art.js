/*
 * Placeholder art: a small library of line-art SVG icons (64x64, stroke = currentColor),
 * a card-scene composer and a procedural NPC portrait. Real art can replace these later —
 * every event also carries a `scene:` description for artists / image generators.
 *
 * To add an icon: add an entry to ICONS (inner SVG markup, 64x64 viewBox). Content refers to it by key (`art: key`).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Art = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const ICONS = {
    book: '<path d="M10 14h18a4 4 0 0 1 4 4v34a4 4 0 0 0-4-4H10z M54 14H36a4 4 0 0 0-4 4v34a4 4 0 0 1 4-4h18z"/>',
    scroll: '<path d="M18 12h30a6 6 0 0 1 0 12h-4v26a6 6 0 0 1-6 6H14a6 6 0 0 1 0-12h4z M18 44V12 M24 22h14 M24 30h14 M24 38h10"/>',
    letter: '<rect x="8" y="16" width="48" height="32" rx="3"/><path d="M8 18l24 18 24-18"/>',
    potion: '<path d="M26 8h12 M28 8v14L16 44a8 8 0 0 0 7 12h18a8 8 0 0 0 7-12L36 22V8"/><path d="M20 40h24"/>',
    cauldron: '<path d="M10 24h44 M14 24c0 16 6 26 18 26s18-10 18-26"/><path d="M18 50l-4 6 M46 50l4 6"/><circle cx="26" cy="16" r="3"/><circle cx="36" cy="11" r="2"/>',
    flame: '<path d="M32 6c4 10 14 16 14 30a14 14 0 0 1-28 0c0-8 4-12 8-16 0 6 2 9 5 10-1-8 1-16 1-24z"/>',
    wave: '<path d="M6 26c6-6 12-6 18 0s12 6 18 0 12-6 16 0 M6 38c6-6 12-6 18 0s12 6 18 0 12-6 16 0 M6 50c6-6 12-6 18 0s12 6 18 0 12-6 16 0"/>',
    moon: '<path d="M40 8a24 24 0 1 0 16 36A20 20 0 0 1 40 8z"/>',
    star: '<path d="M32 6l7 17 18 1-14 11 5 18-16-10-16 10 5-18L7 24l18-1z"/>',
    sun: '<circle cx="32" cy="32" r="11"/><path d="M32 6v8 M32 50v8 M6 32h8 M50 32h8 M13 13l6 6 M45 45l6 6 M13 51l6-6 M45 19l6-6"/>',
    rain: '<path d="M18 38a10 10 0 0 1 2-20 14 14 0 0 1 26 2 9 9 0 0 1 0 18z M22 46l-3 8 M32 46l-3 8 M42 46l-3 8"/>',
    bolt: '<path d="M36 4L14 36h14l-4 24 26-34H34z"/>',
    leaf: '<path d="M12 52C12 26 28 10 54 10c0 26-16 42-42 42z M12 52l26-26"/>',
    flower: '<circle cx="32" cy="24" r="5"/><circle cx="32" cy="13" r="6"/><circle cx="42" cy="21" r="6"/><circle cx="38" cy="33" r="6"/><circle cx="26" cy="33" r="6"/><circle cx="22" cy="21" r="6"/><path d="M32 39v19 M32 50c-6 0-10-4-10-8"/>',
    tree: '<path d="M32 58V36 M32 6l16 22H38l12 14H14l12-14H16z"/>',
    mushroom: '<path d="M8 32a24 20 0 0 1 48 0z M24 32v18a8 8 0 0 0 16 0V32"/><circle cx="24" cy="22" r="3"/><circle cx="40" cy="20" r="3"/>',
    snow: '<path d="M32 6v52 M10 19l44 26 M10 45l44-26 M26 10l6 6 6-6 M26 54l6-6 6 6"/>',
    tower: '<path d="M20 58V22h24v36 M16 22h32l-4-8H20z M26 14V6l12 4-12 4 M28 58V46a4 4 0 0 1 8 0v12 M28 30h8"/>',
    house: '<path d="M8 30L32 10l24 20 M14 26v30h36V26 M26 56V40h12v16"/>',
    door: '<path d="M16 58V20a16 16 0 0 1 32 0v38z M10 58h44"/><circle cx="40" cy="38" r="2"/>',
    tent: '<path d="M6 56L32 10l26 46z M32 10v46 M24 56l8-14 8 14"/>',
    key: '<circle cx="20" cy="32" r="10"/><path d="M30 32h26 M48 32v8 M54 32v6"/>',
    lock: '<rect x="14" y="28" width="36" height="28" rx="4"/><path d="M22 28v-8a10 10 0 0 1 20 0v8 M32 38v8"/>',
    chain: '<rect x="6" y="24" width="24" height="16" rx="8"/><rect x="34" y="24" width="24" height="16" rx="8"/><path d="M22 32h20"/>',
    coin: '<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="15"/><path d="M32 24l2.5 5 5.5.5-4 4 1 5.5-5-3-5 3 1-5.5-4-4 5.5-.5z"/>',
    pouch: '<path d="M24 10h16l-4 8c10 4 16 14 16 24 0 8-6 14-20 14S12 50 12 42c0-10 6-20 16-24z M26 18h12"/>',
    gem: '<path d="M18 10h28l10 14-24 32L8 24z M8 24h48 M26 10l-4 14 10 32 10-32-4-14"/>',
    ring: '<circle cx="32" cy="40" r="16"/><path d="M24 18l8-8 8 8-8 8z"/>',
    crown: '<path d="M8 48l-2-30 14 12 12-18 12 18 14-12-2 30z M8 54h48"/>',
    wand: '<path d="M12 52L42 22"/><path d="M46 8l2 6 6 2-6 2-2 6-2-6-6-2 6-2z M20 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>',
    sparkle: '<path d="M32 6l5 21 21 5-21 5-5 21-5-21-21-5 21-5z"/>',
    rune: '<circle cx="32" cy="32" r="24"/><path d="M32 12l17 30H15z M32 12v40 M15 42l34-20"/>',
    sword: '<path d="M44 8h12v12L26 50 M14 38l12 12 M18 46l-8 8 M20 44l-4-4"/>',
    shield: '<path d="M32 6l20 8v16c0 14-9 23-20 28C21 53 12 44 12 30V14z"/>',
    duel: '<path d="M10 54L44 20 M54 54L20 20"/><path d="M48 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2z M16 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>',
    trophy: '<path d="M20 8h24v14a12 12 0 0 1-24 0z M20 12h-8c0 8 4 12 8 12 M44 12h8c0 8-4 12-8 12 M32 34v12 M22 56h20l-2-10H24z"/>',
    mask: '<path d="M8 20c8-4 16-4 24 0 8-4 16-4 24 0 0 16-6 26-14 26-5 0-8-6-10-6s-5 6-10 6C14 46 8 36 8 20z"/><path d="M18 28c3-2 6-2 8 0 M38 28c3-2 6-2 8 0"/>',
    eye: '<path d="M4 32c8-12 18-18 28-18s20 6 28 18c-8 12-18 18-28 18S12 44 4 32z"/><circle cx="32" cy="32" r="8"/><circle cx="32" cy="32" r="2"/>',
    hand: '<path d="M22 58V30l-6-6a3 3 0 0 1 4-4l4 4V10a3 3 0 0 1 6 0v16V8a3 3 0 0 1 6 0v18V12a3 3 0 0 1 6 0v16-8a3 3 0 0 1 6 0v18c0 12-6 20-14 20z"/>',
    heart: '<path d="M32 54C12 40 6 30 6 21a12 12 0 0 1 26-6 12 12 0 0 1 26 6c0 9-6 19-26 33z"/>',
    // Romance (spark) in chips and previews; health keeps the heart (B9).
    rose: '<path d="M32 30c-9 0-14-6-14-12 0-5 4-9 9-9 2-3 8-3 10 0 5 0 9 4 9 9 0 6-5 12-14 12z"/><path d="M27 16c3 3 7 3 10 0 M32 30v26 M32 46c-5-6-13-5-16-1 6 3 12 3 16 1z"/>',
    heartbreak: '<path d="M32 54C12 40 6 30 6 21a12 12 0 0 1 26-6 12 12 0 0 1 26 6c0 9-6 19-26 33z"/><path d="M32 15l-5 10 8 6-6 10 3 12"/>',
    group: '<circle cx="22" cy="22" r="7"/><circle cx="42" cy="22" r="7"/><path d="M8 52c0-10 6-16 14-16s14 6 14 16 M30 40c2-3 6-4 12-4 8 0 14 6 14 16"/>',
    skull: '<path d="M14 30a18 18 0 0 1 36 0c0 6-2 10-6 12v8H20v-8c-4-2-6-6-6-12z M26 50v-6 M32 50v-6 M38 50v-6"/><circle cx="25" cy="30" r="4"/><circle cx="39" cy="30" r="4"/>',
    ghost: '<path d="M14 56V28a18 18 0 0 1 36 0v28l-6-5-6 5-6-5-6 5-6-5z"/><circle cx="26" cy="28" r="2.5"/><circle cx="38" cy="28" r="2.5"/>',
    cat: '<path d="M14 54V24l6-14 8 10h8l8-10 6 14v30z"/><path d="M24 34h2 M38 34h2 M30 42l2 2 2-2 M20 44l-8 2 M44 44l8 2"/>',
    owl: '<path d="M16 12l6 6h20l6-6v28c0 10-7 18-16 18s-16-8-16-18z"/><circle cx="25" cy="28" r="6"/><circle cx="39" cy="28" r="6"/><path d="M30 36l2 4 2-4"/>',
    raven: '<path d="M8 36c8-2 14-8 18-16 4-8 12-10 18-6l10 2-8 4c2 12-6 24-20 26l-4 10-2-10c-4 0-8-4-12-10z"/><circle cx="42" cy="18" r="1.5"/>',
    fox: '<path d="M10 12l12 10h20l12-10-4 20c0 12-8 22-18 22S14 44 14 32z"/><path d="M24 34h2 M38 34h2 M30 44l2 2 2-2"/>',
    dragon: '<path d="M8 44c10 0 14-8 20-14s14-10 24-6l6-6-2 10c2 10-6 20-18 22l-6 8-2-8c-6 0-12-2-22-6z M44 20l2-8 M50 22l6-6"/><circle cx="48" cy="28" r="1.5"/>',
    frog: '<path d="M8 44c0-12 10-20 24-20s24 8 24 20c0 6-10 8-24 8S8 50 8 44z"/><circle cx="22" cy="22" r="6"/><circle cx="42" cy="22" r="6"/><path d="M22 40c6 4 14 4 20 0"/>',
    spider: '<circle cx="32" cy="36" r="9"/><circle cx="32" cy="22" r="5"/><path d="M24 30L10 20 M24 36H6 M24 42L10 54 M40 30l14-10 M40 36h18 M40 42l14 12"/>',
    paw: '<circle cx="20" cy="22" r="5"/><circle cx="32" cy="16" r="5"/><circle cx="44" cy="22" r="5"/><path d="M32 30c-10 0-16 10-16 16 0 6 6 8 16 4 10 4 16 2 16-4 0-6-6-16-16-16z"/>',
    feather: '<path d="M50 8C30 10 16 26 14 50 M14 50l-6 8 M50 8c-2 18-12 30-30 34 M34 26l-14 4 M42 18l-16 4"/>',
    candle: '<path d="M24 58V28h16v30 M20 58h24 M32 28v-6"/><path d="M32 8c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z"/>',
    lantern: '<path d="M26 10h12 M32 4v6 M22 18h20 M24 18l-4 30h24l-4-30 M18 54h28l-2-6H20z"/><path d="M32 28c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z"/>',
    mirror: '<ellipse cx="32" cy="26" rx="16" ry="20"/><path d="M32 46v12 M24 58h16 M24 18l6-6 M24 26l12-12"/>',
    hourglass: '<path d="M16 6h32 M16 58h32 M20 6c0 16 24 16 24 26S20 42 20 58 M44 6c0 16-24 16-24 26s24 10 24 26"/>',
    bell: '<path d="M14 46h36c-4-4-6-10-6-20a12 12 0 0 0-24 0c0 10-2 16-6 20z M28 52a4 4 0 0 0 8 0 M32 8v6"/>',
    music: '<path d="M24 46V14l26-6v32"/><circle cx="18" cy="46" r="6"/><circle cx="44" cy="40" r="6"/>',
    cup: '<path d="M12 22h34v14a14 14 0 0 1-14 14h-6a14 14 0 0 1-14-14z M46 26h4a6 6 0 0 1 0 12h-4 M10 56h38 M22 8c-2 4 2 6 0 10 M32 8c-2 4 2 6 0 10"/>',
    meal: '<ellipse cx="32" cy="44" rx="26" ry="8"/><path d="M12 42c0-12 9-20 20-20s20 8 20 20 M32 22v-6 M28 16h8"/>',
    bed: '<path d="M6 48V18 M6 40h52v8 M58 40V32a6 6 0 0 0-6-6H26v14"/><circle cx="16" cy="32" r="5"/>',
    cards: '<rect x="10" y="12" width="26" height="38" rx="3" transform="rotate(-10 23 31)"/><rect x="28" y="14" width="26" height="38" rx="3" transform="rotate(10 41 33)"/>',
    dice: '<rect x="12" y="12" width="40" height="40" rx="6"/><circle cx="22" cy="22" r="2.5"/><circle cx="32" cy="32" r="2.5"/><circle cx="42" cy="42" r="2.5"/><circle cx="42" cy="22" r="2.5"/><circle cx="22" cy="42" r="2.5"/>',
    map: '<path d="M6 14l16-6 20 6 16-6v42l-16 6-20-6-16 6z M22 8v42 M42 14v42"/>',
    compass: '<circle cx="32" cy="32" r="24"/><path d="M40 24l-4 12-12 4 4-12z"/>',
    scales: '<path d="M32 8v48 M20 56h24 M12 16h40 M12 16L4 34h16z M52 16l-8 18h16z"/>',
    paper: '<rect x="8" y="10" width="48" height="44" rx="2"/><path d="M14 18h36 M14 26h16 M14 34h16 M14 42h16 M36 26h14v16H36z"/>',
    cross: '<path d="M24 8h16v16h16v16H40v16H24V40H8V24h16z"/>',
    planet: '<circle cx="32" cy="32" r="12"/><ellipse cx="32" cy="32" rx="28" ry="9" transform="rotate(-20 32 32)"/>',
    gear: '<circle cx="32" cy="32" r="8"/><circle cx="32" cy="32" r="16"/><path d="M32 8v8 M32 48v8 M8 32h8 M48 32h8 M15 15l6 6 M43 43l6 6 M15 49l6-6 M43 21l6-6"/>',
    broom: '<path d="M52 8L30 34 M30 34l-14 6-8 16 16-8 6-14z M22 42l-6 6"/>',
    globe: '<circle cx="32" cy="32" r="24"/><path d="M8 32h48 M32 8c-8 8-11 16-11 24s3 16 11 24 M32 8c8 8 11 16 11 24s-3 16-11 24"/>',
    bottle: '<path d="M26 6h12v10l6 8v30a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V24l6-8z M20 34h24"/>',
  };

  const PALETTES = {
    study: ['#1d2a52', '#3f5aa6'], social: ['#4a2440', '#b5577a'], romance: ['#5a1630', '#d9607e'],
    danger: ['#3a1010', '#a8352f'], mystery: ['#1f1238', '#6b45b0'], money: ['#3a2c0c', '#b68a24'],
    job: ['#36290f', '#a8812e'], nature: ['#14301f', '#3f8a55'], festival: ['#3e220c', '#d27a32'],
    crisis: ['#200808', '#7a2020'], class: ['#162a3c', '#2f7aa0'], club: ['#2a1a3c', '#8a5ab0'],
    home: ['#2c2418', '#8a6a44'], magic: ['#101c3c', '#4a62d8'], rival: ['#2c1414', '#a04040'],
    default: ['#171d36', '#43508c'],
  };

  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function has(k) { return Object.prototype.hasOwnProperty.call(ICONS, k); }
  function list() { return Object.keys(ICONS); }

  function icon(key, size, extra) {
    const inner = ICONS[key] || ICONS.sparkle;
    return '<svg class="ico ' + (extra || '') + '" viewBox="0 0 64 64" width="' + (size || 24) + '" height="' + (size || 24) + '" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }

  function paletteFor(tags) {
    for (const t of tags || []) if (PALETTES[t]) return PALETTES[t];
    return PALETTES.default;
  }

  // Card illustration: gradient + seeded starfield + halo + icon.
  function scene(key, tags, seedStr) {
    const [a, b] = paletteFor(tags);
    let h = hash(seedStr || key || 'x');
    const rnd = () => { h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h % 10000) / 10000; };
    let stars = '';
    for (let i = 0; i < 26; i++) {
      const x = (rnd() * 400).toFixed(1), y = (rnd() * 240).toFixed(1), r = (0.6 + rnd() * 1.6).toFixed(2), o = (0.25 + rnd() * 0.6).toFixed(2);
      stars += '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff6dc" opacity="' + o + '"/>';
    }
    const gid = 'g' + (hash(a + b) % 99999);
    const inner = ICONS[key] || ICONS.sparkle;
    return '<svg class="scene" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="' + b + '"/><stop offset="1" stop-color="' + a + '"/></linearGradient>' +
      '<radialGradient id="' + gid + 'h" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff3cf" stop-opacity="0.35"/><stop offset="1" stop-color="#fff3cf" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="400" height="240" fill="url(#' + gid + ')"/>' + stars +
      '<circle cx="200" cy="120" r="110" fill="url(#' + gid + 'h)"/>' +
      '<circle cx="200" cy="120" r="74" fill="none" stroke="#fff3cf" stroke-opacity="0.18" stroke-width="1.5" stroke-dasharray="3 7"/>' +
      '<g transform="translate(152 72) scale(1.5)" fill="none" stroke="#fbf1d6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' + inner + '</g>' +
      '</svg>';
  }

  const SKIN = ['#f1d3b3', '#e0b48c', '#c68c62', '#a0673f', '#7a4a2a', '#f5dccb'];
  const HAIR = ['#2a1d14', '#5a3820', '#a8682c', '#d8b468', '#e9e2d0', '#7a2a2a', '#2a2a40', '#1a1a1a'];
  // Procedural portrait. look: optional "hair:N skin:N style:N" overrides.
  function avatar(npc, size) {
    const id = npc.id || npc.name || 'x';
    let h = hash(id);
    const look = {};
    String(npc.look || '').replace(/(\w+):(\d+)/g, (m, k, v) => { look[k] = +v; });
    const pickN = (arr, k) => arr[(look[k] != null ? look[k] : (h = Math.imul(h ^ (h >>> 11), 2246822519) >>> 0) % arr.length) % arr.length];
    const skin = pickN(SKIN, 'skin'), hair = pickN(HAIR, 'hair');
    const style = look.style != null ? look.style : (hash(id + 's') % 5);
    const col = npc.color || '#556';
    const hairPath = [
      '<path d="M18 30c0-12 6-18 14-18s14 6 14 18c-2-6-6-9-14-9s-12 3-14 9z" fill="' + hair + '"/>',
      '<path d="M16 34c0-14 6-22 16-22s16 8 16 22v14c-2-6-3-14-4-18-4 0-10-2-12-6-2 4-8 6-12 6-1 4-2 12-4 18z" fill="' + hair + '"/>',
      '<path d="M19 28c0-10 6-15 13-15s13 5 13 15l-3-3-3 3-3-3-4 3-4-3-3 3-3-3z" fill="' + hair + '"/>',
      '<path d="M18 30c0-12 6-18 14-18s14 6 14 18c-6-2-10-8-12-12-4 6-10 10-16 12z" fill="' + hair + '"/><circle cx="32" cy="10" r="5" fill="' + hair + '"/>',
      '<path d="M17 32c0-13 6-20 15-20s15 7 15 20l-2 10c-1-8-3-14-6-16-4 2-10 2-14 0-3 2-5 8-6 16z" fill="' + hair + '"/>',
    ][style % 5];
    const s = size || 48;
    return '<svg class="avatar" viewBox="0 0 64 64" width="' + s + '" height="' + s + '" aria-hidden="true">' +
      '<circle cx="32" cy="32" r="32" fill="' + col + '"/>' +
      '<path d="M10 64c2-12 10-18 22-18s20 6 22 18z" fill="#1b1830"/><path d="M26 46l6 8 6-8" fill="none" stroke="#e9d9a8" stroke-width="2"/>' +
      '<rect x="28" y="38" width="8" height="8" fill="' + skin + '"/>' +
      '<ellipse cx="32" cy="30" rx="12" ry="14" fill="' + skin + '"/>' + hairPath +
      '<circle cx="27" cy="31" r="1.6" fill="#1a1420"/><circle cx="37" cy="31" r="1.6" fill="#1a1420"/>' +
      '<path d="M29 37c2 1.5 4 1.5 6 0" fill="none" stroke="#6a3a30" stroke-width="1.4" stroke-linecap="round"/>' +
      '</svg>';
  }

  return { icon, scene, avatar, has, list, paletteFor, ICONS };
});
