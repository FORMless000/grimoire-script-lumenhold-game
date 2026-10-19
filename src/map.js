/*
 * The map view (design §6.3): pick where to spend the day's visit slots.
 *
 *   MapView.render(container, view, { t, esc, Art, npcs, title, onConfirm(picks) })
 *
 * `view` comes from Engine.mapView(): {map, slots, places: [{id, name, x, y, state, open[], hours,
 * kind, track, present[], news, festival[], hint}], locked: [{slot, place, event}], season, phase}.
 * The base art is content/world/maps/<map>.svg (an <img>, so it works from file:// too); markers are
 * positioned in percent of its 960 × 680 frame. The map is shown before each visit (playtest 2, M1), for
 * that slot alone: tapping an open place picks it, and a double-click (a second tap within DOUBLE_MS) or the button goes
 * there, so a misclick costs nothing; "Stay in" skips the visit. A festival's place is highlighted in its slot (picking
 * it joins the festival). A list view shows the same states as text; arrow keys move between markers and Enter picks
 * (Enter twice goes). (Several slots still work: then a double-click on the last pick or the button confirms them.)
 */
(function (root) {
  'use strict';
  const W = 960, H = 680;

  function render(el, view, o) {
    const { t, esc, Art } = o;
    const picks = view.slots.map((sl) => { const l = view.locked.find((x) => x.slot === sl); return l ? l.place : null; });
    const lockedAt = (i) => !!view.locked.find((x) => x.slot === view.slots[i]);
    // On phones the campus is too dense for 44 px targets: start in the list view (the map is one tap away).
    let listMode = !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 600px)').matches), status = '';
    const byId = Object.fromEntries(view.places.map((p) => [p.id, p]));
    const order = view.places.slice().sort((a, b) => a.y - b.y || a.x - b.x);

    function pickedIdx(id) { return picks.map((p, i) => (p === id && !lockedAt(i) ? i : -1)).filter((i) => i >= 0); }
    // A tap picks a place (or unpicks it); a second tap on it within DOUBLE_MS, a double-click, goes (misclicks cost a day).
    const DOUBLE_MS = 450;
    let lastTap = null;
    const isReady = () => view.slots.length === 1 ? !!picks[0] : picks.every((p, i) => p || lockedAt(i) || !view.places.some((x) => x.open[i]));
    function go() {
      if (!isReady()) { status = t('map.notReady'); return draw(); }
      o.onConfirm(picks.slice());
    }
    function tap(id) {
      const p = byId[id]; if (!p) return;
      const now = Date.now(), twice = !!lastTap && lastTap.id === id && now - lastTap.t < DOUBLE_MS;
      lastTap = { id, t: now };
      status = '';
      const already = pickedIdx(id);
      if (already.length) { if (twice) return go(); picks[already[already.length - 1]] = null; return draw(); }
      if (p.state === 'hinted') { status = p.hint || t('map.undiscovered'); return draw(); }
      if (p.visited) { status = t('map.visitedToday', { name: p.name }); return draw(); }
      if (p.festLater) { status = t('map.festivalLater', { name: p.name, slot: t('slot.' + p.festLater).toLowerCase() }); return draw(); }
      const free = view.slots.map((_, i) => i).filter((i) => !picks[i] && !lockedAt(i));
      if (!free.length) { status = t('map.full'); return draw(); }
      const ok = free.find((i) => p.open[i]);
      if (ok == null) { status = t('map.closed', { name: p.name, hours: (p.hours || []).map((h) => t('slot.' + h)).join(', ') }); return draw(); }
      picks[ok] = id;
      draw();
      if (twice) go();
    }
    function markerClass(p) {
      const c = ['mk', 'st-' + p.state];
      if (p.track) c.push('mine', 'k-' + p.track.kind);
      if (p.track && p.track.urgent) c.push('urgent');
      if (p.visited) c.push('visited');
      if (p.festLater) c.push('fest-later');
      if (p.festival.length) c.push('fest');
      if (picks.includes(p.id)) c.push('picked');
      return c.join(' ');
    }
    function badge(p) {
      if (!p.track || p.track.due == null) return '';
      const label = p.track.done ? t('map.shiftsDone') : p.track.kind === 'job' ? t('map.shiftsLeft', { n: p.track.due }) : p.track.kind === 'thesis' ? t('map.sessionsLeft', { n: p.track.due }) : t('map.practiceLeft', { n: p.track.due });
      return '<span class="mk-badge' + (p.track.urgent ? ' urgent' : '') + '">' + esc(label) + '</span>';
    }
    function pins(p) {
      if (!p.present.length) return '';
      const shown = p.present.slice(0, 3).map((id) => '<span class="pin" title="' + esc((o.npcs[id] || {}).name || id) + '">' + Art.avatar(Object.assign({ id }, o.npcs[id] || {}), 18) + '</span>').join('');
      return '<span class="mk-pins">' + shown + (p.present.length > 3 ? '<span class="pin more">+' + (p.present.length - 3) + '</span>' : '') + '</span>';
    }
    function marker(p) {
      const n = picks.map((x, i) => (x === p.id ? i + 1 : 0)).filter(Boolean);
      const title = p.state === 'hinted' ? (p.hint || t('map.undiscovered')) : p.name + (p.visited ? ' — ' + t('map.visitedNow') : p.festLater ? ' — ' + t('map.festivalSoon', { slot: t('slot.' + p.festLater).toLowerCase() }) : p.state === 'closed' ? ' — ' + t('map.closedNow') : '') + (p.festival.length ? ' — ' + t('map.festival', { slot: t('slot.' + p.festival[0].slot) }) : '');
      return '<button class="' + markerClass(p) + '" data-id="' + esc(p.id) + '" style="left:' + (100 * p.x / W) + '%;top:' + (100 * p.y / H) + '%" title="' + esc(title) + '" aria-label="' + esc(title) + '">' +
        '<span class="mk-dot">' + (p.state === 'hinted' ? '?' : Art.icon(p.art || 'star', 18)) + (n.length ? '<b class="mk-n">' + n.join('·') + '</b>' : '') + (p.news ? '<i class="mk-news">✦</i>' : '') + '</span>' +
        (p.state !== 'hinted' ? '<span class="mk-label">' + esc(p.name) + '</span>' : '') + badge(p) + pins(p) + '</button>';
    }
    function listRow(p) {
      const states = [p.state === 'hinted' ? t('map.hinted') : p.visited ? t('map.visitedNow') : p.festLater ? t('map.festivalSoon', { slot: t('slot.' + p.festLater).toLowerCase() }) : p.state === 'closed' ? t('map.closedNow') : t('map.open')];
      if (p.track) states.push(badge(p).replace(/<[^>]+>/g, ''));
      if (p.festival.length) states.push(t('map.festival', { slot: t('slot.' + p.festival[0].slot) }));
      if (p.present.length) states.push(t('map.here', { names: p.present.map((id) => (o.npcs[id] || {}).short || ((o.npcs[id] || {}).name || id).split(' ')[0]).join(', ') }));
      if (p.news) states.push(t('map.new'));
      const n = picks.map((x, i) => (x === p.id ? t('slot.' + view.slots[i]) : null)).filter(Boolean);
      return '<button class="ml-row ' + markerClass(p) + '" data-id="' + esc(p.id) + '"><b>' + esc(p.state === 'hinted' ? '?' : p.name) + '</b><span>' + esc(states.join(' · ')) + '</span>' + (n.length ? '<em>' + esc(n.join(', ')) + '</em>' : '') + '</button>';
    }
    function chips() {
      return view.slots.map((sl, i) => {
        const lock = view.locked.find((x) => x.slot === sl);
        const id = picks[i];
        return '<button class="pick-chip' + (id ? ' set' : '') + (lock ? ' locked' : '') + '" data-slot="' + i + '"' + (lock ? ' disabled' : '') + '>' +
          '<span class="pc-n">' + (i + 1) + '</span>' + esc(t('slot.' + sl)) + ' · ' + esc(id ? byId[id] ? byId[id].name : id : t('map.choose')) + (lock ? ' ✦' : '') + '</button>';
      }).join('');
    }
    function festBanner() {
      return (view.festivals || []).map((f) => '<div class="map-fest">✦ ' + esc(t('map.festivalHere', { event: o.eventTitle ? o.eventTitle(f.event) : f.event, place: byId[f.place] ? byId[f.place].name : f.place, slot: t('slot.' + f.slot).toLowerCase() })) + '</div>').join('');
    }
    function draw() {
      const single = view.slots.length === 1;
      const ready = single || isReady(), chosen = single && picks[0];
      const q = single ? t('map.q.' + view.slots[0]) + (view.visits > 1 && view.visit ? ' · ' + t('map.visitOf', { n: view.visit, of: view.visits }) : '') : t('map.question2');
      el.innerHTML = '<div class="mapwrap">' +
        '<div class="map-head"><div><div class="map-title">' + esc(o.title || '') + '</div><div class="map-q">' + esc(q) + '</div></div>' +
        (single ? '' : '<div class="map-picks">' + chips() + '</div>') + '</div>' + festBanner() +
        (listMode ? '<div class="map-list">' + order.map(listRow).join('') + '</div>'
          : '<div class="map-frame season-' + esc(view.season || 'none') + '"><img class="map-base" alt="" src="content/world/maps/' + esc(view.map) + '.svg"><div class="map-tint"></div>' + order.map(marker).join('') + '</div>') +
        '<div class="map-status" role="status">' + esc(status || t('map.howToPick')) + '</div>' +
        '<div class="map-actions"><button class="btn ghost-btn" id="mapList">' + esc(listMode ? t('map.showMap') : t('map.showList')) + '</button>' +
        '<button class="btn ' + (single && !chosen ? 'ghost-btn' : 'primary') + '" id="mapGo"' + (ready ? '' : ' disabled') + '>' + esc(single ? (chosen ? t('map.goTo', { place: byId[picks[0]] ? byId[picks[0]].name : picks[0] }) : t('map.stayIn')) : t('map.go')) + '</button></div></div>';
      el.querySelectorAll('[data-id]').forEach((b) => { b.onclick = () => tap(b.dataset.id); });
      el.querySelectorAll('.pick-chip:not([disabled])').forEach((b) => { b.onclick = () => { picks[+b.dataset.slot] = null; status = ''; draw(); }; });
      el.querySelector('#mapList').onclick = () => { listMode = !listMode; draw(); };
      el.querySelector('#mapGo').onclick = () => (single && !chosen ? o.onConfirm([null]) : go());
    }
    function key(e) {
      const btns = [...el.querySelectorAll('[data-id]')];
      if (!btns.length) return false;
      const i = btns.indexOf(document.activeElement);
      if (['ArrowRight', 'ArrowDown'].includes(e.key)) { btns[(i + 1) % btns.length].focus(); return true; }
      if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { btns[(i - 1 + btns.length) % btns.length].focus(); return true; }
      if (e.key === 'Enter' && i >= 0) { tap(btns[i].dataset.id); const again = el.querySelector('[data-id="' + btns[i].dataset.id + '"]'); if (again) again.focus(); return true; }
      if (e.key === 'Enter' && i < 0) { const go = el.querySelector('#mapGo'); if (go && !go.disabled) { go.click(); return true; } }
      return false;
    }
    draw();
    return { key, picks: () => picks.slice() };
  }

  root.MapView = { render };
})(typeof self !== 'undefined' ? self : this);
