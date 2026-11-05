/*
 * Fork C · Feed (experiments/combat-ui): the fastest to play. Two compact fighter rows; a running feed of the exchanges, the
 * newest at the bottom, right above the moves (so what just happened is where the eye already is), ending in what is coming
 * now (their move, a blow landing); and a list of moves where one tap acts. ⓘ (or a long press) reads a move first.
 */
(function (root) {
  'use strict';
  const { esc } = root.FightProto;
  const SHOWN = 6;   // exchanges kept in the feed (the Log sheet has them all)

  function row(F, i) {
    const chips = F.chipsHtml(i);
    return `<div class="fd-f ${i ? 'opp' : 'you'}"><button class="fd-pf" ${i ? 'data-pf-sheet="inspect"' : 'tabindex="-1"'} aria-label="${esc(F.tr('inspect'))}">${F.portrait(i)}</button>` +
      `<b class="fd-n" title="${esc(F.nameOf(i))}">${esc(F.titleOf(i))}</b><div class="fd-bars">${F.bar(i, 'hp')}${F.bar(i, 'mana')}</div>${chips ? `<div class="pf-chips">${chips}</div>` : ''}</div>`;
  }

  function entry(F, h, last) {
    const rc = F.recap(h);
    const line = (s) => { const x = rc.sides[s]; return `<p class="fd-l ${s ? 'opp' : 'you'}"><span class="pf-ico">${F.icon(x.id, s, x.channel)}</span><span class="fd-w">${esc(s ? F.nameOf(1) : F.tr('you'))}</span><span class="fd-m">${esc(x.name)}</span>${F.pillsHtml(F.outcome(rc, s))}</p>`; };
    const extras = rc.extras.map(F.extraHtml).join('');
    return `<li class="fd-e${last ? ' last' : ''}${last && F.fresh ? ' fresh' : ''}"><span class="fd-r">${rc.round}</span><div>${line(rc.leader)}${line(1 - rc.leader)}${extras ? `<p class="fd-xs">${extras}</p>` : ''}</div></li>`;
  }

  function nowEntry(F) {
    const t = F.their(); if (t.mode === 'over') return '';
    const due = F.incoming(0).filter((o) => o.in === 0), r = F.game.round;
    const them = t.mode === 'busy' ? `<span class="fd-m wait">${esc(F.tr('waitingFor', { name: F.nameOf(1) }))}</span>${t.mine ? `<span class="fd-mine">${esc(F.tr('youLocked', { move: F.actionName(t.mine, 0) }))}</span>` : ''}`
      : t.mode === 'hidden' ? `<span class="fd-m hid">${esc(F.tr('youPickFirst'))}</span>`
      : `<button class="fd-their${t.mode === 'forced' ? ' forced' : ''}" data-pf-sheet="action:1:${esc(t.id)}"><span class="pf-ico">${F.icon(t.id, 1)}</span><span class="fd-m">${esc(t.name)}</span>${F.effHtml(t.brief)}</button>`;
    return `<li class="fd-e now"><span class="fd-r">${r}</span><div><p class="fd-l opp">${them}</p>` +
      due.map((o) => `<p class="fd-l blow"><span class="pf-ico">${F.icon(o.id, 1)}</span><span class="fd-m">${esc(o.name)}</span>${o.parts.map((p) => `<b class="${p.impact ? 'k-dmg' : 'k-spell'}">${p.n}</b>`).join('+')} <small>${esc(F.tr('landsNow'))}</small></p>`).join('') + '</div></li>';
  }

  function feed(F) {
    const hs = F.history.slice(-SHOWN);
    const body = hs.length ? hs.map((h, k) => entry(F, h, k === hs.length - 1)).join('') : `<li class="fd-e empty"><div><p>${esc(F.tr('nothingYet'))}</p></div></li>`;
    return `<section data-k="feed" class="fd-feed"><header><b>${esc(F.tr('history'))}</b>${F.history.length ? `<button data-pf-sheet="history">${esc(F.tr('log'))}</button>` : ''}</header><ol data-keep-scroll="feed" data-stick="end">${body}${nowEntry(F)}</ol></section>`;
  }

  function moves(F) {
    const L = F.actionList();
    const item = (it, k) => `<div class="fd-a${it.disabled ? ' off' : ''}"><button class="fd-go" data-pf-act="${esc(it.id)}"${it.disabled ? ' disabled' : ''} title="${esc(it.name + ' · ' + it.price + (it.reason ? ' · ' + it.reason : ''))}">` +
      `<span class="pf-ico">${F.icon(it.id)}</span><span class="fd-an">${esc(it.short)}${it.lv ? ` <i>${it.lv}</i>` : ''}</span>${F.effHtml(it.brief)}${F.costHtml(it)}${k < 9 ? `<kbd>${k + 1}</kbd>` : ''}</button>` +
      `<button class="fd-i" data-pf-sheet="action:0:${esc(it.id)}" aria-label="${esc(F.tr('moreInfo'))}">${F.ICON.info}</button></div>`;
    return `<div data-k="dock" class="pf-dock stick">${L.state ? `<p class="fd-state">${esc(L.state)}</p>` : ''}<div class="fd-acts${F.myTurn() ? '' : ' waiting'}">${L.items.map(item).join('')}</div></div>`;
  }

  const view = {
    cls: 'fork-c', pick: 'commit',
    render(F) {
      return F.aroundHtml() + `<section data-k="top" class="fd-top">${row(F, 1)}${row(F, 0)}</section>` + feed(F) + (F.game.result ? F.resultHtml() : moves(F)) + F.leaveHtml();
    },
    bind(F) {
      // A long press reads a move instead of playing it.
      for (const b of F.layer.querySelectorAll('.fd-go')) {
        let timer = null, long = false;
        b.onpointerdown = () => { long = false; timer = setTimeout(() => { long = true; F.showSheet('action:0:' + b.dataset.pfAct); }, 450); };
        b.onpointerup = b.onpointerleave = () => clearTimeout(timer);
        const go = b.onclick; b.onclick = (e) => { if (long) { e.preventDefault(); return; } go(e); };
      }
    },
  };
  root.CombatUI = root.FightProto.define(view);
})(typeof self !== 'undefined' ? self : this);
