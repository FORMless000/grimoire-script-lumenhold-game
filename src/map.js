/*
 * The map view (design §6.3): pick where to spend the day's visit slots.
 *
 *   MapView.render(container, view, { t, esc, Art, npcs, title, onConfirm(picks) })
 *
 * `view` comes from Engine.mapView(): {map, slots, places: [{id, name, x, y, state, open[], hours,
 * kind, track, present[], news, festival[], hint}], locked: [{slot, place, event}], season, phase}.
 * The base art is content/world/maps/<map>.svg (an <img>, so it works from file:// too); markers are
 * positioned in percent of its 960 × 680 frame. The map is shown before each visit (playtest 2, M1), for
 * that slot alone: tapping an open place picks it, and tapping it again (as a spell in a fight, whenever it comes) or
 * the button goes there, so a misclick costs nothing; "Stay in" skips the visit. A festival's place is highlighted in its slot (picking
 * it joins the festival). A list view shows the same states as text; arrow keys move between markers and Enter picks
 * (Enter twice goes). (Several slots still work: then a tap on the last pick or the button confirms them; a tap on an
 * earlier pick takes it back.) Markers carry no slot numbers (feedback 2026-10-19). The map fills the space under one
 * toolbar, dots scale with it, and captions are laid out so they never cover each other (feedback 2026-10-20).
 *
 *   MapView.browse(container, views, { …, name(view), subtitle, onClose })   the map button: look, don't pick
 */
(function (root) {
  'use strict';
  const W = 960, H = 680;

  function render(el, view, o) {
    const { t, esc, Art } = o;
    const picks = view.slots.map((sl) => { const l = view.locked.find((x) => x.slot === sl); return l ? l.place : null; });
    const lockedAt = (i) => !!view.locked.find((x) => x.slot === view.slots[i]);
    // On phones the campus is too dense for 44 px targets: start in the list view (the map is one tap away).
    let listMode = !o.browse && !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 600px)').matches), status = '';
    const byId = Object.fromEntries(view.places.map((p) => [p.id, p]));
    const order = view.places.slice().sort((a, b) => a.y - b.y || a.x - b.x);

    function pickedIdx(id) { return picks.map((p, i) => (p === id && !lockedAt(i) ? i : -1)).filter((i) => i >= 0); }
    // A tap picks a place; a tap on the last pick goes (feedback 2026-10-19: no time limit, as a spell in a fight).
    let lastPick = null;
    const isReady = () => view.slots.length === 1 ? !!picks[0] : picks.every((p, i) => p || lockedAt(i) || !view.places.some((x) => x.open[i]));
    function go() {
      if (!isReady()) { status = t('map.notReady'); return draw(); }
      o.onConfirm(picks.slice());
    }
    function tap(id) {
      const p = byId[id]; if (!p) return;
      status = '';
      // Looking, not picking (the map button): a tap says what the place is.
      if (o.browse) {
        status = p.state === 'hinted' ? (p.hint || t('map.undiscovered')) : p.name + (p.hours && p.hours.length ? ' · ' + p.hours.map((h) => t('slot.' + h)).join(', ') : '') + (p.desc ? ' — ' + p.desc : '');
        lastPick = id; return draw();
      }
      const already = pickedIdx(id);
      if (already.length) {
        if (lastPick === id) return go();
        picks[already[already.length - 1]] = null; lastPick = null; return draw();
      }
      if (p.state === 'hinted') { status = p.hint || t('map.undiscovered'); return draw(); }
      if (p.visited) { status = t('map.visitedToday', { name: p.name }); return draw(); }
      if (p.festLater) { status = t('map.festivalLater', { name: p.name, slot: t('slot.' + p.festLater).toLowerCase() }); return draw(); }
      if (view.slots.length === 1 && picks[0] && !lockedAt(0) && p.open[0]) picks[0] = null;   // one slot: a new tap moves the pick
      const free = view.slots.map((_, i) => i).filter((i) => !picks[i] && !lockedAt(i));
      if (!free.length) { status = t('map.full'); return draw(); }
      const ok = free.find((i) => p.open[i]);
      if (ok == null) { status = t('map.closed', { name: p.name, hours: (p.hours || []).map((h) => t('slot.' + h)).join(', ') }); return draw(); }
      picks[ok] = id; lastPick = id;
      status = t('map.again', { place: p.name });
      draw();
    }
    function markerClass(p) {
      const c = ['mk', 'st-' + p.state];
      if (p.track) c.push('mine', 'k-' + p.track.kind);
      if (p.track && p.track.urgent) c.push('urgent');
      if (p.visited) c.push('visited');
      if (p.festLater) c.push('fest-later');
      if (p.festival.length) c.push('fest');
      if (picks.includes(p.id) || (o.browse && lastPick === p.id)) c.push('picked');
      return c.join(' ');
    }
    function badge(p) {
      // A club shows no count (feedback 2026-10-20): it is open-ended; the one visit a term it expects goes unsaid.
      if (!p.track || p.track.due == null || p.track.kind === 'club' || p.track.kind === 'society') return '';
      const label = p.track.done ? t('map.shiftsDone') : p.track.kind === 'job' ? t('map.shiftsLeft', { n: p.track.due }) : t('map.sessionsLeft', { n: p.track.due });
      return '<span class="mk-badge' + (p.track.urgent ? ' urgent' : '') + '">' + esc(label) + '</span>';
    }
    function pins(p) {
      if (!p.present.length) return '';
      const shown = p.present.slice(0, 3).map((id) => '<span class="pin" title="' + esc((o.npcs[id] || {}).name || id) + '">' + Art.avatar(Object.assign({ id }, o.npcs[id] || {}), 18) + '</span>').join('');
      return '<span class="mk-pins">' + shown + (p.present.length > 3 ? '<span class="pin more">+' + (p.present.length - 3) + '</span>' : '') + '</span>';
    }
    function marker(p) {
      const title = p.state === 'hinted' ? (p.hint || t('map.undiscovered')) : p.name + (p.visited ? ' — ' + t('map.visitedNow') : p.festLater ? ' — ' + t('map.festivalSoon', { slot: t('slot.' + p.festLater).toLowerCase() }) : p.state === 'closed' ? ' — ' + t('map.closedNow') : '') + (p.festival.length ? ' — ' + t('map.festival', { slot: t('slot.' + p.festival[0].slot) }) : '');
      const cap = (p.state !== 'hinted' ? '<span class="mk-label">' + esc(p.name) + '</span>' : '') + badge(p) + pins(p);
      return '<button class="' + markerClass(p) + '" data-id="' + esc(p.id) + '" style="left:' + (100 * p.x / W) + '%;top:' + (100 * p.y / H) + '%" title="' + esc(title) + '" aria-label="' + esc(title) + '">' +
        '<span class="mk-dot">' + (p.state === 'hinted' ? '?' : Art.icon(p.art || 'star', 18)) + (p.news ? '<i class="mk-news">✦</i>' : '') + '</span>' +
        (cap ? '<span class="mk-cap">' + cap + '</span>' : '') + '</button>';
    }
    function listRow(p) {
      const states = [p.state === 'hinted' ? t('map.hinted') : o.browse ? (p.hours || []).map((h) => t('slot.' + h)).join(', ') || t('map.open') : p.visited ? t('map.visitedNow') : p.festLater ? t('map.festivalSoon', { slot: t('slot.' + p.festLater).toLowerCase() }) : p.state === 'closed' ? t('map.closedNow') : t('map.open')];
      if (p.track) states.push(badge(p).replace(/<[^>]+>/g, ''));
      if (p.festival.length) states.push(t('map.festival', { slot: t('slot.' + p.festival[0].slot) }));
      if (p.present.length) states.push(t('map.here', { names: p.present.map((id) => (o.npcs[id] || {}).short || ((o.npcs[id] || {}).name || id).split(' ')[0]).join(', ') }));
      if (p.news) states.push(t('map.new'));
      const n = view.slots.length > 1 ? picks.map((x, i) => (x === p.id ? t('slot.' + view.slots[i]) : null)).filter(Boolean) : [];
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
      const q = o.browse ? o.subtitle || '' : single ? t('map.q.' + view.slots[0]) + (view.visits > 1 && view.visit ? ' · ' + t('map.visitOf', { n: view.visit, of: view.visits }) : '') : t('map.question2');
      // One toolbar above the map (feedback 2026-10-20: the map got more room): title, question and status on the left,
      // the picks and the buttons on the right; the map takes all the space left below.
      const goBtn = o.browse ? '<button class="btn primary" id="mapClose">' + esc(t('map.close')) + '</button>'
        : '<button class="btn ' + (single && !chosen ? 'ghost-btn' : 'primary') + '" id="mapGo"' + (ready ? '' : ' disabled') + '>' + esc(single ? (chosen ? t('map.goTo', { place: byId[picks[0]] ? byId[picks[0]].name : picks[0] }) : t('map.stayIn')) : t('map.go')) + '</button>';
      el.innerHTML = '<div class="mapwrap">' + (o.tabs || '') +
        '<div class="map-head"><div class="map-heading"><div class="map-titles"><span class="map-title">' + esc(o.title || '') + '</span>' + (q ? '<span class="map-q">' + esc(q) + '</span>' : '') + '</div>' +
        '<div class="map-status" role="status">' + esc(status || (o.browse ? t('map.howToLook') : t('map.howToPick'))) + '</div></div>' +
        '<div class="map-actions">' + (single || o.browse ? '' : '<div class="map-picks">' + chips() + '</div>') +
        '<button class="btn ghost-btn" id="mapList">' + esc(listMode ? t('map.showMap') : t('map.showList')) + '</button>' + goBtn + '</div></div>' + (o.browse ? '' : festBanner()) +
        (listMode ? '<div class="map-list">' + order.map(listRow).join('') + '</div>'
          : '<div class="map-fit"><div class="map-frame season-' + esc(view.season || 'none') + '"><img class="map-base" alt="" src="content/world/maps/' + esc(view.map) + '.svg"><div class="map-tint"></div>' + order.map(marker).join('') + '</div></div>') +
        '</div>';
      watch(el.querySelector('.map-frame'));
      el.querySelectorAll('[data-id]').forEach((b) => { b.onclick = () => tap(b.dataset.id); });
      el.querySelectorAll('.pick-chip:not([disabled])').forEach((b) => { b.onclick = () => { picks[+b.dataset.slot] = null; status = ''; draw(); }; });
      el.querySelectorAll('[data-map]').forEach((b) => { b.onclick = () => o.onTab(b.dataset.map); });
      el.querySelector('#mapList').onclick = () => { listMode = !listMode; draw(); };
      if (o.browse) { el.querySelector('#mapClose').onclick = () => o.onClose(); return; }
      el.querySelector('#mapGo').onclick = () => (single && !chosen ? o.onConfirm([null]) : go());
    }
    // Captions make room for each other (feedback 2026-10-20: places overlapped). Each place's name, count and people
    // take the first free spot around its dot (below, above, beside, on a diagonal, then below or above to one side), the picked place and your own
    // commitments first, closed places last; a caption with no room left shows only on hover or focus. Laid out again
    // whenever the map changes size.
    let ro = null;
    function watch(frame) {
      if (ro) { ro.disconnect(); ro = null; }
      if (!frame) return;
      layout(frame);
      const fit = frame.parentNode;   // a map wider than the stage (a phone) starts centred
      if (fit.scrollWidth > fit.clientWidth) fit.scrollLeft = (fit.scrollWidth - fit.clientWidth) / 2;
      if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(() => layout(frame)); ro.observe(frame); }
      if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (frame.isConnected) layout(frame); });
    }
    function rank(m) {
      const c = m.classList;
      return c.contains('picked') ? 0 : c.contains('mine') || c.contains('fest') ? 1 : m.querySelector('.mk-news') ? 2 : c.contains('st-open') && !c.contains('visited') && !c.contains('fest-later') ? 3 : 4;
    }
    function layout(frame) {
      const fw = frame.clientWidth, fh = frame.clientHeight, dot = frame.querySelector('.mk-dot');
      if (!fw || !fh || !dot) return;
      const r = dot.offsetWidth / 2 + 1, g = 3, d = r * 0.72;
      const pts = [...frame.querySelectorAll('.mk')].map((m) => ({ m, cap: m.querySelector('.mk-cap'), x: parseFloat(m.style.left) * fw / 100, y: parseFloat(m.style.top) * fh / 100 }));
      const taken = pts.map((p) => ({ own: p, box: [p.x - r, p.y - r, p.x + r, p.y + r] }));
      const hit = (a, b) => a[0] < b[2] + 4 && b[0] < a[2] + 4 && a[1] < b[3] + 1 && b[1] < a[3] + 1;   // a word's gap apart
      pts.filter((p) => p.cap).sort((a, b) => rank(a.m) - rank(b.m)).forEach((p) => {
        const w = p.cap.offsetWidth, h = p.cap.offsetHeight;
        const spots = [['b', -w / 2, r + g], ['t', -w / 2, -r - g - h], ['r', r + g, -h / 2], ['l', -r - g - w, -h / 2],
          ['br', d, d], ['bl', -d - w, d], ['tr', d, -d - h], ['tl', -d - w, -d - h],
          ['br', -r, r + g], ['bl', r - w, r + g], ['tr', -r, -r - g - h], ['tl', r - w, -r - g - h]];
        let spot = null, box = null;
        for (const s of spots) {
          const b = [p.x + s[1], p.y + s[2], p.x + s[1] + w, p.y + s[2] + h];
          if (b[0] < 0 || b[1] < 0 || b[2] > fw || b[3] > fh || taken.some((x) => x.own !== p && hit(x.box, b))) continue;
          spot = s; box = b; break;
        }
        const s = spot || spots[0];
        p.cap.style.transform = 'translate(' + Math.round(s[1]) + 'px,' + Math.round(s[2]) + 'px)';
        p.cap.dataset.side = s[0];
        p.m.classList.toggle('cap-off', !spot && rank(p.m) > 0);
        if (box) taken.push({ own: p, box });
      });
    }
    function key(e) {
      const btns = [...el.querySelectorAll('[data-id]')];
      if (!btns.length) return false;
      const i = btns.indexOf(document.activeElement);
      if (['ArrowRight', 'ArrowDown'].includes(e.key)) { btns[(i + 1) % btns.length].focus(); return true; }
      if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { btns[(i - 1 + btns.length) % btns.length].focus(); return true; }
      if (e.key === 'Enter' && i >= 0) { tap(btns[i].dataset.id); const again = el.querySelector('[data-id="' + btns[i].dataset.id + '"]'); if (again) again.focus(); return true; }
      if (e.key === 'Enter' && i < 0 && !o.browse) { const go = el.querySelector('#mapGo'); if (go && !go.disabled) { go.click(); return true; } }
      return false;
    }
    draw();
    return { key, picks: () => picks.slice() };
  }

  // The map button (feedback 2026-10-20): the maps you know (Engine.atlas()), one at a time, to look at. A tab per map
  // when there are several; a tap on a place says what it is. o: { t, esc, Art, npcs, name(view), subtitle, onClose }.
  function browse(el, views, o) {
    let cur = 0, ctl = null;
    const show = () => {
      const tabs = views.length > 1 ? '<div class="map-tabs" role="tablist">' + views.map((v, i) => '<button class="seg-b' + (i === cur ? ' on' : '') + '" role="tab" aria-selected="' + (i === cur) + '" data-map="' + i + '">' + o.esc(o.name(v)) + '</button>').join('') + '</div>' : '';
      ctl = render(el, views[cur], Object.assign({}, o, { browse: true, tabs, title: o.name(views[cur]), onTab: (i) => { cur = +i; show(); } }));
    };
    show();
    return { key: (e) => ctl.key(e) };
  }

  root.MapView = { render, browse };
})(typeof self !== 'undefined' ? self : this);
