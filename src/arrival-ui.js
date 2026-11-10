/*
 * The arrival screen (new maps, 2026-11-10): shown before the map when you reach another map, or come back to the term
 * map. It says where you are and where you stay; a traveller picks lodging here; the places that offer work are named
 * (work is found by visiting them, never picked from the break menu). Coming back, it says what the time away left you.
 *
 *   ArrivalView.open(arrival, deps) -> { key(e) }   key: a keydown, true when the screen used it
 *
 * `arrival` is the engine's (`mapView().arrival`): { kind: 'arrival' | 'return', map, name, line, stay, lodging, work,
 * held, ledger }. deps: { t, esc, openPanel, confirm(lodgingId | null) }
 */
(function (root) {
  'use strict';

  function open(a, d) {
    const { t, esc } = d;
    const lodging = a.lodging && a.lodging.length && !a.held ? a.lodging : null;
    const st = { pick: lodging ? (lodging.find((l) => l.ok) || {}).id || null : null };
    const coins = (n) => (n ? t('arrive.cost', { n }) : t('arrive.free'));
    const tile = (l, i) => '<button class="opt arrive-lodging' + (l.ok ? '' : ' locked') + '" data-k="' + esc(l.id) + '"' + (l.ok ? '' : ' disabled') + '>' +
      '<span class="num">' + (i + 1) + '</span><b>' + (l.ok ? '' : '🔒 ') + esc(l.name) + '</b>' +
      '<span class="price">' + esc(coins(l.cost)) + (l.monthly ? ' · ' + esc(t('arrive.monthly', { n: l.monthly })) : '') + '</span>' +
      (l.desc ? '<small>' + esc(l.desc) + '</small>' : '') + (l.ok ? '' : '<small class="why">' + esc(t('card.cantAfford', { cost: l.cost })) + '</small>') + '</button>';
    let body = '';
    if (a.kind === 'return') {
      const g = a.ledger || {};
      const rows = [];
      if (g.gold != null && g.gold !== 0) rows.push(t(g.gold > 0 ? 'arrive.goldUp' : 'arrive.goldDown', { n: Math.abs(g.gold) }));
      if ((g.items || []).length) rows.push(t('arrive.items', { items: g.items.join(t('list.sep')) }));
      body = rows.length ? '<ul class="arrive-ledger">' + rows.map((r) => '<li>' + esc(r) + '</li>').join('') + '</ul>' : '';
    } else {
      if (a.stay) body += '<p class="arrive-stay"><span class="label">' + esc(t('arrive.stay')) + '</span> ' + esc(a.stay.name) + (a.stay.desc ? '<small>' + esc(a.stay.desc) + '</small>' : '') + '</p>';
      if (lodging) body += '<p class="arrive-sub">' + esc(t('arrive.lodging')) + '</p><div class="opt-grid">' + lodging.map(tile).join('') + '</div>';
      if ((a.work || []).length) body += '<p class="arrive-work"><span class="label">' + esc(t('arrive.work')) + '</span> ' + esc(a.work.map((w) => w.name).join(t('list.sep'))) + '<small>' + esc(t('arrive.workHint')) + '</small></p>';
    }
    const title = a.name || t(a.kind === 'return' ? 'arrive.backTitle' : 'arrive.title');
    const html = '<div class="modal dark arrive"><div class="modal-art arrive-art"><img alt="" src="content/world/maps/' + esc(a.map) + '.svg"></div><div class="modal-body">' +
      '<p class="arrive-kicker">' + esc(t(a.kind === 'return' ? 'arrive.back' : 'arrive.kicker')) + '</p><h2>' + esc(title) + '</h2>' +
      (a.line ? '<p class="text">' + esc(a.line) + '</p>' : '') + body +
      '<div class="row" style="margin-top:12px"><button class="btn primary grow" id="arriveGo"></button></div></div></div>';
    d.openPanel(html);
    const root = document.getElementById('overlay') || document;
    function render() {
      root.querySelectorAll('.arrive-lodging').forEach((b) => b.classList.toggle('sel', b.dataset.k === st.pick));
      const go = document.getElementById('arriveGo');
      const l = lodging && lodging.find((x) => x.id === st.pick);
      go.textContent = l ? t('arrive.goLodging') : t(a.kind === 'return' ? 'arrive.goBack' : 'arrive.go');
    }
    root.querySelectorAll('.arrive-lodging').forEach((b) => { b.onclick = () => { if (b.disabled) return; if (st.pick === b.dataset.k) return go(); st.pick = b.dataset.k; render(); }; });
    const go = () => d.confirm(st.pick);
    document.getElementById('arriveGo').onclick = go;
    render();
    return {
      key(e) {
        const k = parseInt(e.key, 10);
        if (lodging && k >= 1 && k <= lodging.length && lodging[k - 1].ok) { st.pick = lodging[k - 1].id; render(); return true; }
        if (e.key === 'Enter') { go(); return true; }
        return false;
      },
    };
  }

  root.ArrivalView = { open };
})(typeof window !== 'undefined' ? window : globalThis);
