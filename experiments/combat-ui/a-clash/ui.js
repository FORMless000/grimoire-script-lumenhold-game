/*
 * Fork A · Clash (experiments/combat-ui), iteration 2 (feedback 2026-10-29: second favourite; wanted a timeline and a
 * more compact move list). The live screen's order kept: them, the clash (each side's move, what it did to the other, the
 * fight's own text), the timeline, you; then, docked, this exchange said plainly over a compact grid of moves. Fighters
 * have short vertical bars and an outline lit by what is on them.
 */
(function (root) {
  'use strict';
  const { esc } = root.FightProto;

  function fighter(F, i) {
    const chips = F.chipsHtml(i);
    return `<article class="ca-f ${i ? 'opp' : 'you'} ${F.aura(i)}">${F.vbars(i)}` +
      `<button class="ca-pf" ${i ? 'data-pf-sheet="inspect"' : 'tabindex="-1"'} aria-label="${esc(F.tr('inspect'))}">${F.portrait(i)}</button>` +
      `<div class="ca-fi"><div class="ca-name"><b title="${esc(F.nameOf(i))}">${esc(F.titleOf(i))}</b><small>${esc(F.tr('lv', { n: F.levelOf(i) }))}</small></div><div class="ca-nums">${F.num(i, 'hp')}${F.num(i, 'mana')}</div>` +
      (chips ? `<div class="pf-chips">${chips}</div>` : '') + '</div></article>';
  }

  // The last exchange: a row a side (its move, what it did for itself, then what it did to the other), the leader first;
  // then the fight's own text.
  function clash(F) {
    const L = F.ledger(F.history[F.history.length - 1]);
    if (!L) return `<section class="ca-clash empty"><p>${esc(F.tr('nothingYet'))}</p></section>`;
    const rc = L.rc;
    const row = (s) => {
      const x = rc.sides[s];
      return `<div class="ca-row ${s ? 'opp' : 'you'}"><span class="pf-ico">${F.icon(x.id, s, x.channel)}</span>` +
        `<span class="ca-move"><small class="ca-who">${esc(F.tagOf(s))}</small>${esc(x.name)} ${F.itemsHtml(L.self[s])}</span>` +
        `<span class="ca-out"><span class="ca-arrow">▶ ${esc(F.tagOf(1 - s))}</span>${L.to[s].length ? F.itemsHtml(L.to[s]) : `<span class="pf-pill none">${esc(F.tr('noDamage'))}</span>`}</span></div>`;
    };
    return `<section class="ca-clash${F.fresh ? ' fresh' : ''}" aria-live="polite"><header><b>${esc(F.tr('lastEx', { n: rc.round }))}</b><button class="ca-log" data-pf-sheet="history">${esc(F.tr('log'))}</button></header>` +
      row(rc.leader) + row(1 - rc.leader) +
      (L.lines.length || L.finish.length ? `<div class="ca-text">${L.lines.map((l) => `<p class="pf-flavor ${l.side ? 'opp' : 'you'}">${esc(l.text)}</p>`).join('')}${L.finish.map((f) => `<p class="pf-flavor fin">${esc(f)}</p>`).join('')}</div>` : '') + '</section>';
  }

  const view = {
    cls: 'fork-a', pick: 'select',
    render(F) {
      return `<div data-k="head" class="pf-head">${F.aroundHtml()}${fighter(F, 1)}</div><div data-k="up" class="pf-up" data-keep-scroll="up">${clash(F)}${F.game.result ? '' : F.laneHtml({ past: 3, ahead: 3 })}</div>` +
        `<div data-k="dock" class="pf-dock">${fighter(F, 0)}${F.game.result ? F.resultHtml() : F.telegraphHtml() + F.movesHtml()}${F.leaveHtml()}</div>`;
    },
  };
  // A new exchange shows from its top.
  view.bind = (F) => { const up = F.layer.querySelector('.pf-up'); if (up && F.fresh) up.scrollTop = 0; };
  root.CombatUI = root.FightProto.define(view);
})(typeof self !== 'undefined' ? self : this);
