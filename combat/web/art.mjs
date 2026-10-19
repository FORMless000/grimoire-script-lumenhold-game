// Fighter portraits: a character's Minimal portrait (art/characters/minimal/portraits/<npc>.png, copied to portraits/ by
// tools/build.mjs) where one exists, otherwise an SVG placeholder: a bust silhouette on a tint picked from the name, so each
// foe keeps one look. The player's frame stays empty: the game assumes nothing about how they look.
const TINTS=['#628B90','#7d6a9c','#8c6f55','#5e7d63','#86606a','#5a6f94','#8a7d4e','#6b7480'];
const hash=s=>[...String(s)].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261);
const BUST='<circle cx="32" cy="25" r="11"/><path d="M11 60c1-13 10-20 21-20s20 7 21 20z"/>';
const HOOD='<path d="M32 10c-10 0-16 8-16 18v6c0 4 3 6 6 7l-11 19h42l-11-19c3-1 6-3 6-7v-6c0-10-6-18-16-18z"/><ellipse cx="32" cy="30" rx="7" ry="8" fill="#0b0f1d" opacity=".55"/>';
const HAT='<path d="M14 23h36l-4-3c-2-6-7-10-14-10s-12 4-14 10z"/><circle cx="32" cy="30" r="9"/><path d="M12 60c1-12 9-19 20-19s19 7 20 19z"/>';
const STAG='<path d="M24 12l-3-6M24 12l-6-1M24 12l1 8M40 12l3-6M40 12l6-1M40 12l-1 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M25 20c2-2 12-2 14 0l1 12c0 5-4 10-8 12-4-2-8-7-8-12z"/><path d="M14 60c2-10 9-16 18-16s16 6 18 16z"/>';
const SHAPES={hooded:HOOD,hat:HAT,creature:STAG};
export function placeholder(key,shape='bust'){
 const tint=shape==='hat'?'#6b7480':shape==='creature'?'#2c3348':TINTS[hash(key)%TINTS.length];
 return `<svg viewBox="0 0 64 64" aria-hidden="true" class="ph"><rect width="64" height="64" fill="${tint}"/><g fill="#1a1f38" color="#1a1f38" opacity=".72">${SHAPES[shape]??BUST}</g></svg>`;
}
// The player: an empty frame, never a face.
export const BLANK='<svg viewBox="0 0 64 64" aria-hidden="true" class="ph blank"><rect width="64" height="64" fill="#1b2043"/></svg>';
// {npc} → the PNG; {creature} → a creature; underground loadouts → hooded; the man in grey → his hat; else a bust.
export function portrait({npc,loadout,creature,underground,portraits}){
 if(npc&&portraits?.includes(npc))return `<img src="portraits/${npc}.png" alt="" loading="lazy">`;
 return placeholder(loadout,creature?'creature':loadout==='The man in grey'?'hat':underground?'hooded':'bust');
}
