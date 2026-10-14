// Playtest 2, M39: fights use the combat stub (`challenge combat`), which reads arcana, vigor and guile, how you
// are right now and the spells you know, and costs mana to enter (M5). The worklist is every option whose
// challenge is a fight: duels, spars, the tournament chain, brawls, the stag and Ilse's rescue. Races, games,
// lessons and the finale's sealing keep their kinds. M15: three checks where reputation should help use renown.
'use strict';
const COMBAT = ['spring_tournament.right', 'spring_tournament_circle.left', 'spring_tournament_circle.right', 'tournament_semifinal.left',
  'tournament_final.left', 'ilse_grey_returns.left', 'curse_cure_2.right', 'pyro_lyra_spar.right', 'duel_practice_bout.left',
  'duel_practice_bout.right', 'duel_bram_hazing.right', 'y3_last_duel.left', 'xchg_farewell.right', 'tavern_brawl.right', 'life_pixies.left',
  'life_rival_academy.right', 'bram_duel.right', 'duelling_ward_line.left', 'duel_hall_gallery.left', 'duel_hall_humming_circle.left',
  'slice_frost_duel.left', 'duel_first_practice.right', 'duel_fixture.left'];
const RENOWN = ['life_village_busking.left', 'nessa_headmistress_interview.left', 'isolde_warning.right'];

function optionLines(ctx, id, key) {
  for (const s of ctx.project.compileAll().sources) {
    if (!s.path.endsWith('.grim')) continue;
    const L = ctx.lines(s.path), i = L.indexOf('@event ' + id);
    if (i < 0) continue;
    let o = i + 1; while (o < L.length && !/^@/.test(L[o]) && !new RegExp('^>\\s*' + key + '\\s*:').test(L[o])) o++;
    if (o >= L.length || /^@/.test(L[o])) throw new Error('option not found: ' + id + '.' + key);
    let end = o + 1; while (end < L.length && !/^(> |@)/.test(L[end])) end++;
    return { file: s.path, L, from: o + 1, to: end };
  }
  throw new Error('event not found: ' + id);
}
function firstChallenge(ctx, ref, fn) {
  const [id, key] = ref.split('.');
  const { file, L, from, to } = optionLines(ctx, id, key);
  for (let k = from; k < to; k++) if (/^\s*challenge\s/.test(L[k])) { ctx.edit({ file, line: k + 1 }, fn(L[k])); return; }
  throw new Error('no challenge in ' + ref);
}
module.exports = {
  id: '0020-combat-stub',
  description: 'fights use the combat stub; three reputation checks use renown',
  COMBAT, RENOWN,
  run(ctx) {
    for (const ref of COMBAT) firstChallenge(ctx, ref, (l) => l.replace(/challenge\s+[a-z_]+(\s+using\s+[a-z_]+)?/, 'challenge combat'));
    for (const ref of RENOWN) firstChallenge(ctx, ref, (l) => l.replace(/challenge\s+([a-z_]+)(\s+using\s+[a-z_]+)?/, 'challenge $1 using renown'));
    ctx.report(COMBAT.length + ' fights → combat; ' + RENOWN.length + ' checks using renown');
  },
};
