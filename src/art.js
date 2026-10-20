/*
 * The game's art: a small library of line-art SVG icons (64x64, stroke = currentColor), a card-scene composer
 * (gradient, starfield and icon) and NPC portraits: the final PNGs (Minimal, the default) over the procedural SVG
 * (Original). Cards keep this composed art; a card's `scene:` is a line of description shown under it, not an art brief.
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
    // Spell icons (docs/spells-v2-icons.md, docs/spell-icons/): one per spell, `art: spell_<name>` on @spell.
    spell_animate: '<rect x="20" y="8" width="24" height="18" rx="4"/><circle cx="27" cy="17" r="2"/><circle cx="37" cy="17" r="2"/><path d="M32 4v4 M16 30h32v16H16z M22 46v12 M42 46v12 M10 32v12 M54 32v12"/>',
    spell_brace: '<path d="M24 8l16 6v14c0 12-7 19-16 24C15 47 8 40 8 28V14z"/><path d="M46 16c3 4 5 8 5 14s-2 10-5 14" opacity="0.8"/><path d="M55 12c4 5 6 11 6 18s-2 13-6 18" opacity="0.45"/>',
    spell_bramble: '<path d="M8 56c8-10 4-18 14-24s8-16 18-20 10-6 16-6"/><path d="M15 47l-7-2 M21 36l1-7 M31 28l-5-5 M39 17l6 2 M48 11V5"/><path d="M28 42c4 0 7 2 8 6-4 1-7-1-8-6z"/>',
    spell_candour: '<path d="M8 12h48v30H30l-12 10V42H8z"/><circle cx="32" cy="27" r="5"/><path d="M32 16v3 M32 35v3 M21 27h3 M40 27h3"/>',
    spell_compel: '<path d="M14 8h36 M22 8v18 M42 8v18 M32 8v20"/><circle cx="32" cy="34" r="6"/><path d="M32 40v12 M22 26l5 18 M42 26l-5 18 M25 60l7-8 7 8"/>',
    spell_contraption: '<circle cx="26" cy="38" r="8"/><path d="M26 22v6 M26 48v6 M10 38h6 M36 38h6 M15 27l4 4 M33 45l4 4 M15 49l4-4 M33 31l4-4"/><path d="M50 4l-8 12h8l-6 12"/>',
    spell_distil: '<path d="M26 26h12 M28 26v8L16 52a6 6 0 0 0 5 8h22a6 6 0 0 0 5-8L36 34v-8"/><path d="M32 20C25 15 22 11 22 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 3-3 7-10 12z"/><path d="M22 50h20"/>',
    spell_eclipse: '<circle cx="32" cy="32" r="13" fill="currentColor"/><circle cx="32" cy="32" r="19"/><path d="M32 4v6 M32 54v6 M4 32h6 M54 32h6 M12 12l4 4 M48 48l4 4 M12 52l4-4 M48 16l4-4"/>',
    spell_extraction: '<path d="M8 10h48L36 34v18l-8 6V34z"/><path d="M32 2l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" transform="translate(0 2)"/>',
    spell_flame: '<path d="M32 6c4 10 14 16 14 30a14 14 0 0 1-28 0c0-8 4-12 8-16 0 6 2 9 5 10-1-8 1-16 1-24z"/><path d="M32 40c3 3 5 6 5 9a5 5 0 0 1-10 0c0-3 2-6 5-9z"/>',
    spell_foresight: '<path d="M6 36c7-10 16-15 26-15s19 5 26 15c-7 10-16 15-26 15S13 46 6 36z"/><circle cx="32" cy="36" r="7"/><path d="M32 4v8 M18 8l4 6 M46 8l-4 6"/>',
    spell_glamour: '<path d="M8 26c8-4 16-4 24 0 8-4 16-4 24 0 0 14-6 22-14 22-5 0-8-4-10-8-2 4-5 8-10 8-8 0-14-8-14-22z"/><circle cx="21" cy="32" r="3"/><circle cx="43" cy="32" r="3"/><path d="M50 4l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>',
    spell_haste: '<path d="M6 20h16 M4 32h20 M6 44h16"/><path d="M30 12l26 20-26 20 9-20z"/>',
    spell_heartprice: '<path d="M32 56C12 42 6 32 6 23a12 12 0 0 1 26-6 12 12 0 0 1 26 6c0 9-6 19-26 33z"/><path d="M32 22l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="currentColor"/>',
    spell_heartwood: '<path d="M32 58V34 M32 46l-8-6 M32 42l8-6 M32 58c-4-4-10-4-14-2 M32 58c4-4 10-4 14-2"/><path d="M32 34C16 26 8 18 8 11a9 9 0 0 1 24-3 9 9 0 0 1 24 3c0 7-8 15-24 23z"/><path d="M20 14c3 0 6 2 7 5"/>',
    spell_hoarfrost: '<path d="M32 4v16 M32 44v16 M8 18l15 9 M56 46l-15-9 M8 46l15-9 M56 18l-15 9"/><path d="M26 8l6 6 6-6 M26 56l6-6 6 6 M8 26l8-3-2-8 M56 38l-8 3 2 8 M8 38l8 3-2 8 M56 26l-8-3 2-8"/><path d="M32 24c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z"/>',
    spell_index: '<rect x="8" y="26" width="42" height="30" rx="2"/><path d="M8 40h42 M24 32h10 M24 48h10"/><rect x="16" y="6" width="26" height="16" rx="1"/><path d="M21 11h16 M21 16h10"/>',
    spell_lodestar: '<path d="M32 10l4 18 18 4-18 4-4 18-4-18-18-4 18-4z"/><circle cx="32" cy="32" r="27" stroke-dasharray="6 6"/>',
    spell_mend: '<path d="M32 54C12 40 6 30 6 21a12 12 0 0 1 26-6 12 12 0 0 1 26 6c0 9-6 19-26 33z"/><path d="M32 18v28 M27 24h10 M27 32h10 M27 40h10"/>',
    spell_moonwell: '<path d="M38 4a12 12 0 1 0 10 18A10 10 0 0 1 38 4z"/><path d="M8 38h48 M12 38v18h40V38 M20 46c4-3 8-3 12 0s8 3 12 0"/>',
    spell_omen: '<rect x="16" y="6" width="32" height="52" rx="3"/><path d="M32 16l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/><path d="M24 46h16 M28 51h8"/>',
    spell_quickquill: '<path d="M52 6C36 10 24 24 20 44l-4 12 8-8c18-6 28-20 28-42z M20 44l14-14"/><path d="M34 58h22 M42 51h14"/>',
    spell_rapport: '<path d="M8 20l7 24h11l3-20z M56 20l-7 24H38l-3-20z"/><path d="M20 44v10 M44 44v10 M14 56h12 M38 56h12"/><path d="M32 4v8 M24 8l3 5 M40 8l-3 5"/>',
    spell_reflect: '<ellipse cx="18" cy="32" rx="8" ry="22"/><path d="M56 10L30 30 M30 30l26 18 M56 48h-9 M56 48v-9"/>',
    spell_rime: '<path d="M32 6l22 13v26L32 58 10 45V19z"/><path d="M32 18v28 M20 25l24 14 M20 39l24-14"/>',
    spell_seal: '<circle cx="32" cy="32" r="24"/><circle cx="32" cy="32" r="18" stroke-dasharray="3 4"/><circle cx="32" cy="27" r="5"/><path d="M30 31l-3 12h10l-3-12"/>',
    spell_shadowstep: '<path d="M30 58V24a14 14 0 0 1 28 0v34" stroke-dasharray="4 5"/><ellipse cx="12" cy="50" rx="4" ry="7"/><ellipse cx="22" cy="38" rx="4" ry="7" opacity="0.6"/><ellipse cx="38" cy="30" rx="4" ry="7" opacity="0.3"/>',
    spell_siphon: '<path d="M14 32c4 6 6 10 6 13a6 6 0 0 1-12 0c0-3 2-7 6-13z M50 32c4 6 6 10 6 13a6 6 0 0 1-12 0c0-3 2-7 6-13z"/><path d="M14 26c0-16 36-16 36 0 M44 20l6 6 3-8"/>',
    spell_sleight: '<path d="M6 44c8 0 12-8 20-8h14a4 4 0 0 1 0 8H28"/><path d="M40 42l12-8a4 4 0 0 1 5 6L42 54H20l-14 4"/><circle cx="40" cy="16" r="9"/><path d="M40 12v8"/>',
    spell_starlight: '<path d="M32 4l4 9 10 1-8 6 3 10-9-6-9 6 3-10-8-6 10-1z"/><path d="M26 36l-6 22 M38 36l6 22 M32 38v20"/>',
    spell_tailwind: '<path d="M6 22h30a8 8 0 1 0-8-8 M6 34h42a8 8 0 1 1-8 8 M6 46h20"/>',
    spell_toll: '<path d="M18 44h28c-3-3-5-8-5-16a9 9 0 0 0-18 0c0 8-2 13-5 16z M28 50a4 4 0 0 0 8 0 M32 12V6"/><path d="M10 22c-3 5-3 11 0 16 M54 22c3 5 3 11 0 16 M4 18c-4 8-4 16 0 24 M60 18c4 8 4 16 0 24"/>',
    spell_torment: '<circle cx="32" cy="32" r="24"/><path d="M32 8v10 M32 56V46 M8 32h10 M56 32H46 M15 15l7 7 M49 49l-7-7 M15 49l7-7 M49 15l-7 7"/><circle cx="32" cy="32" r="5"/>',
    spell_ward: '<path d="M32 6l20 8v16c0 14-9 23-20 28C21 53 12 44 12 30V14z"/><circle cx="32" cy="30" r="8"/>',
    spell_wildfire: '<path d="M32 4c4 10 12 16 12 28a12 12 0 0 1-24 0c0-8 4-12 8-16 0 6 2 8 4 9 0-8-1-14 0-21z"/><path d="M12 56c-4-2-6-5-6-9 0-5 4-7 5-13 2 4 5 5 5 9 2-2 2-4 2-6 3 4 4 8 4 11 0 4-3 7-6 8z M52 56c4-2 6-5 6-9 0-5-4-7-5-13-2 4-5 5-5 9-2-2-2-4-2-6-3 4-4 8-4 11 0 4 3 7 6 8z"/><path d="M4 60h56"/>',
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
  // Procedural ("Original") portrait, inner markup of a 64x64 viewBox. look: optional "hair:N skin:N style:N" overrides.
  function procedural(npc) {
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
    // A goblin (feedback 2026-10-15b, `look: … body:1`): green skin, long ears, a big nose, a toothy grin, a waistcoat.
    if (look.body === 1) {
      const g = ['#7fa35a', '#6b8f4e', '#93a85c', '#5f8a6a'][(look.skin || 0) % 4], gd = '#4d6b38';
      return '<circle cx="32" cy="32" r="32" fill="' + col + '"/>' +
        '<path d="M12 64c2-10 9-16 20-16s18 6 20 16z" fill="#4a1f3a"/><path d="M24 50l8 10 8-10" fill="#e9d9a8"/><path d="M32 52v12" stroke="#2a1420" stroke-width="1"/>' +
        '<circle cx="35" cy="57" r="1.1" fill="#d8b468"/><circle cx="35" cy="61" r="1.1" fill="#d8b468"/>' +
        '<rect x="28" y="40" width="8" height="9" fill="' + g + '"/>' +
        '<path d="M21 28L3 17l6 9-4 1 16 11z" fill="' + g + '" stroke="' + gd + '" stroke-width="1"/><path d="M43 28l18-11-6 9 4 1-16 11z" fill="' + g + '" stroke="' + gd + '" stroke-width="1"/>' +
        '<path d="M8 21l10 8 M56 21l-10 8" stroke="' + gd + '" stroke-width="1" opacity=".7"/>' +
        '<ellipse cx="32" cy="32" rx="13" ry="12.5" fill="' + g + '"/>' +
        '<path d="M22 22c3-4 7-5 10-5s7 1 10 5c-3-1-6-2-10-2s-7 1-10 2z" fill="' + gd + '"/>' +
        '<path d="M23 27l7 1 M41 27l-7 1" stroke="#2a2418" stroke-width="1.6" stroke-linecap="round"/>' +
        '<ellipse cx="27" cy="31" rx="2.6" ry="2" fill="#f2d65a"/><ellipse cx="37" cy="31" rx="2.6" ry="2" fill="#f2d65a"/>' +
        '<circle cx="27.4" cy="31" r="1" fill="#1a1420"/><circle cx="37.4" cy="31" r="1" fill="#1a1420"/>' +
        '<circle cx="37" cy="31" r="4" fill="none" stroke="#d8b468" stroke-width="1"/><path d="M41 32c2 3 2 8 1 12" fill="none" stroke="#d8b468" stroke-width=".7"/>' +
        '<path d="M31 30c3 2 6 7 4 10-2 1-5 0-6-1z" fill="' + gd + '"/>' +
        '<path d="M24 39c4 4 12 4 16 0-3 5-13 5-16 0z" fill="#3a1a1a"/><path d="M27 40l1.5 2.5 1.5-2 M36 40l-1.5 2.5-1.5-2" fill="#f5efd8"/>';
    }
    return '<circle cx="32" cy="32" r="32" fill="' + col + '"/>' +
      '<path d="M10 64c2-12 10-18 22-18s20 6 22 18z" fill="#1b1830"/><path d="M26 46l6 8 6-8" fill="none" stroke="#e9d9a8" stroke-width="2"/>' +
      '<rect x="28" y="38" width="8" height="8" fill="' + skin + '"/>' +
      '<ellipse cx="32" cy="30" rx="12" ry="14" fill="' + skin + '"/>' + hairPath +
      '<circle cx="27" cy="31" r="1.6" fill="#1a1420"/><circle cx="37" cy="31" r="1.6" fill="#1a1420"/>' +
      '<path d="M29 37c2 1.5 4 1.5 6 0" fill="none" stroke="#6a3a30" stroke-width="1.4" stroke-linecap="round"/>';
  }


  // Minimal portraits (docs/portrait-integration-handoff.md): final 256x256 PNGs by stable NPC id, copied from
  // art/characters/minimal/portraits/ by `node tools/portraits.js sync`. Document-relative, so they load from file:// too.
  const PORTRAIT_DIR = 'src/portraits/minimal/';
  const PORTRAITS = {};
  'lyra tobias seraphine corvin mir nessa bram kael ilse tamsin isolde thorne maud amaranth brask vey marisol mabel grimsby pell grisk'
    .split(' ').forEach((id) => { PORTRAITS[id] = id + '.png'; });
  const SVGNS = 'http://www.w3.org/2000/svg';
  let portraitStyle = 'minimal', clipSeq = 0, preloaded = false;
  const hasDoc = typeof document !== 'undefined';

  // 'minimal' (default) or 'original'; anything else selects minimal.
  function setPortraitStyle(style) {
    portraitStyle = style === 'original' ? 'original' : 'minimal';
    if (portraitStyle === 'minimal' && hasDoc && !preloaded && typeof Image === 'function') {
      preloaded = true;
      for (const id in PORTRAITS) new Image().src = PORTRAIT_DIR + PORTRAITS[id];
    }
    return portraitStyle;
  }
  function portraitLayer(id) {
    const cid = 'avc' + (++clipSeq).toString(36) + '-' + id;
    return '<g class="av-min"><clipPath id="' + cid + '"><circle cx="32" cy="32" r="32"/></clipPath>' +
      '<image class="av-img" href="' + PORTRAIT_DIR + PORTRAITS[id] + '" x="0" y="0" width="64" height="64" preserveAspectRatio="xMidYMid slice" clip-path="url(#' + cid + ')"/></g>';
  }
  // NPC portrait. The procedural portrait is always drawn; in Minimal mode a known id's PNG, clipped to a circle, covers it.
  // The procedural layer stays in the markup as the fallback if the PNG fails (see the listener below).
  function avatar(npc, size, opts) {
    const id = npc.id || npc.name || 'x', s = size || 48;
    const style = (opts && opts.style) || portraitStyle;
    const png = style === 'minimal' && Object.prototype.hasOwnProperty.call(PORTRAITS, id);
    return '<svg class="avatar" viewBox="0 0 64 64" width="' + s + '" height="' + s + '" aria-hidden="true" data-npc="' + String(id).replace(/[&<>"]/g, '') + '">' +
      '<g class="av-orig">' + procedural(npc) + '</g>' + (png ? portraitLayer(id) : '') + '</svg>';
  }
  // After a style change: add or remove only the image layers of the avatars already on screen (nothing else re-renders).
  function refreshAvatars(scope) {
    if (!hasDoc) return;
    (scope || document).querySelectorAll('svg.avatar[data-npc]').forEach((el) => {
      const id = el.getAttribute('data-npc'), layer = el.querySelector('.av-min');
      const want = portraitStyle === 'minimal' && Object.prototype.hasOwnProperty.call(PORTRAITS, id);
      if (!want && layer) layer.remove();
      if (want && !layer) {
        const tmp = document.createElementNS(SVGNS, 'svg');
        tmp.innerHTML = portraitLayer(id);
        el.appendChild(tmp.firstChild);
      }
    });
  }
  // One capture listener, scoped to portrait images: a missing or corrupt PNG is removed, which reveals the procedural
  // portrait under it (style.css hides that layer only while an image layer is present).
  if (hasDoc && document.addEventListener) {
    document.addEventListener('error', (e) => {
      const t = e.target;
      if (!t || !t.classList || !t.classList.contains('av-img')) return;
      (t.closest('.av-min') || t).remove();
    }, true);
  }

  return { icon, scene, avatar, setPortraitStyle, refreshAvatars, getPortraitStyle: () => portraitStyle, has, list, paletteFor, ICONS, PORTRAITS, PORTRAIT_DIR };
});
