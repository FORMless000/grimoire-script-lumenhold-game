/*
 * Fork B · Arena (experiments/combat-ui), iteration 3 (feedback 2026-10-29). A face-off in panels, no scrolling region of
 * its own: on a wide stage (tablet, fill) the last exchange stands between the two fighters and everything fits; on a
 * phone it drops under them and the fight scrolls as one page. No room stands empty: each move's line of fight text sits
 * in its fighter's panel (on a phone, in the exchange), and before the first exchange the panels say how the fight opens.
 * Under the face-off: the timeline (compact, as the live track) with this exchange said plainly beside it on a wide stage,
 * the moves, and the engine's analysis when it is on.
 * Fighters: short vertical bars, compact status chips (icon and number; tap for the rest) and an outline that takes the
 * colour and motion of the status on them. An exchange lands fast: the moves slam in, a spark where they meet, each line
 * wipes in from its side, and the panels jolt and flash by how hard they were hit, the number popping over the portrait.
 */
(function (root) {
  'use strict';
  const { esc } = root.FightProto;

  // A fighter: bars, portrait, numbers, chips, then what its move did this exchange in the fight's words (on a wide stage;
  // before the first exchange, what opens the fight).
  function side(F, i, fx, L) {
    const chips = F.chipsHtml(i, { compact: true }), say = sayOf(F, i, L);
    return `<div class="ar-side ${i ? 'opp' : 'you'} ${F.aura(i)}${fx.cls}"><div class="ar-id">${F.vbars(i)}<span class="ar-pfw"><button class="ar-pf" ${i ? 'data-pf-sheet="inspect"' : 'tabindex="-1"'} aria-label="${esc(F.tr('inspect'))}">${F.portrait(i)}</button>${fx.pop}</span>` +
      `<div class="ar-meta"><b title="${esc(F.nameOf(i))}">${esc(F.titleOf(i))}</b><small>${esc(F.tr('lv', { n: F.levelOf(i) }))}</small>${F.num(i, 'hp')}${F.num(i, 'mana')}</div></div><div class="pf-chips">${chips}</div>` +
      (say ? `<p class="ar-say pf-flavor ${i ? 'opp' : 'you'}${L ? '' : ' idle'}${F.fresh ? ' fresh' : ''}">${esc(say)}</p>` : '') + '</div>';
  }
  // A side's line: its move in the fight's words; before the first exchange, how the fight opens.
  function sayOf(F, i, L) {
    if (L) { const l = L.lines.find((x) => x.side === i); return l ? l.text : ''; }
    if (F.game.result) return '';
    return i ? F.tr(F.game.leader ? 'idleTheyLead' : 'idleTheyAnswer', { name: F.titleOf(1) }) : F.tr('idleYou');
  }

  // The last exchange: the two moves meeting, what each side did to the other, then the fight's text (on a wide stage only
  // the lines that close the exchange: each move's own line is in its fighter's panel). Before the first exchange: the
  // fight's stakes in full, the spells they can cast (public: their sheet lists them) and how it opens.
  function stage(F, L) {
    const lines = (list, cls) => list.map(([side, text]) => `<p class="pf-flavor ${cls} ${side ? 'opp' : 'you'}">${esc(text)}</p>`).join('');
    if (!L) {
      const idle = [0, 1].map((i) => [i, sayOf(F, i, null)]).filter((x) => x[1]);
      const kit = Object.keys(F.game.actors[1].kit.spells || {});
      return `<section class="ar-stage empty">${F.settingHtml().replace('<details class="pf-setting">', '<details class="pf-setting" open>')}` +
        (kit.length ? `<button class="ar-kit" data-pf-sheet="inspect"><small>${esc(F.tr('theirSpells'))}</small>${kit.map((id) => `<span class="pf-ico" title="${esc(F.label(id))}">${F.icon(id, 1)}</span>`).join('')}<i aria-hidden="true">›</i></button>` : '') +
        `<div class="ar-text">${lines(idle, 'own idle')}</div></section>`;
    }
    const rc = L.rc;
    const tile = (s) => { const x = rc.sides[s]; return `<div class="ar-tile ${s ? 'opp' : 'you'}"><span class="pf-ico">${F.icon(x.id, s, x.channel)}</span><b>${esc(x.name)}</b>${L.self[s].length ? `<span class="ar-self">${F.itemsHtml(L.self[s])}</span>` : ''}</div>`; };
    const way = (s) => `<p class="ar-way ${s ? 'opp' : 'you'}"><span class="ar-from">${esc(F.tagOf(s))}</span><span class="ar-arrow" aria-hidden="true">▶</span>` +
      `<span class="ar-to">${esc(F.tagOf(1 - s))}</span><span class="ar-items">${L.to[s].length ? F.itemsHtml(L.to[s]) : `<span class="pf-pill none">${esc(F.tr('noDamage'))}</span>`}</span></p>`;
    const text = lines(L.lines.map((l) => [l.side, l.text]), 'own') + L.finish.map((f) => `<p class="pf-flavor fin">${esc(f)}</p>`).join('');
    return `<section class="ar-stage lead-${rc.leader}${F.fresh ? ' fresh' : ''}" aria-live="polite"><header><b>${esc(F.tr('lastEx', { n: rc.round }))}</b><small>${esc(rc.leader ? F.tr('theyLed') : F.tr('youLed'))}</small><button data-pf-sheet="history">${esc(F.tr('log'))}</button></header>` +
      `<div class="ar-meet">${tile(0)}<span class="ar-x" aria-hidden="true">⚔</span>${tile(1)}</div>${way(0)}${way(1)}${text ? `<div class="ar-text">${text}</div>` : ''}</section>`;
  }

  const view = {
    cls: 'fork-b', pick: 'select',
    // Each piece is keyed (data-k): one that renders the same stays in place, so its animation runs on.
    render(F) {
      const L = F.ledger(F.history[F.history.length - 1]), fx = [F.hitFx(0), F.hitFx(1)], around = F.aroundHtml({ setting: false });
      const quake = /fx-heavy/.test(fx[0].cls + fx[1].cls);
      return (around ? `<div data-k="around" class="ar-around">${around}</div>` : '') +
        `<section data-k="top" class="ar-top${quake ? ' fx-quake' : ''}">${side(F, 0, fx[0], L)}${stage(F, L)}${side(F, 1, fx[1], L)}</section>` +
        // The timeline and this exchange share a row on a wide stage (the timeline fills what this exchange leaves).
        // Once the fight is over, the timeline goes (feedback 2026-10-29).
        (F.game.result ? '' : `<div data-k="row" class="ar-row">${F.laneHtml({ ahead: 6 })}<div class="ar-now">${F.telegraphHtml()}</div></div>`) +
        (F.game.result ? `<div data-k="result">${F.resultHtml()}</div>` : `<div data-k="moves" class="ar-moves">${F.movesHtml()}</div>`) +
        `<div data-k="engine">${F.engineHtml()}</div>` + F.leaveHtml();
    },
  };
  root.CombatUI = root.FightProto.define(view);
})(typeof self !== 'undefined' ? self : this);
