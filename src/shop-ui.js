/*
 * The shop (`type: shop`, threads 2): a menu shown as a counter, where any number of wares go in one basket.
 *
 *   ShopView.open(view, deps) -> { key(e) }   key: a keydown, true when the shop used it
 *
 * `view` is the engine's card view: `view.shop.purse`, and each option's `role` (the engine reads it from what the
 * option does): a `ware` goes in the basket (its `price`, or a sale's `income`); an option `alone` (the pawnbroker's
 * "Sell something…", a test of skill) is taken on its own, as on a menu; `leave` is the way out. A ware that no longer
 * fits beside what's already in the basket locks until something comes out. Tapping an option on its own picks it (the
 * basket empties), and tapping it again goes, as on a menu. Buying one ware is choosing it, as before; two or more are
 * the engine's basket (`choose([keys])`).
 *
 * deps: { t, esc, Art, openPanel, actorRow, parts(o) -> {html, tip, extra}, attachTip, setPreview, buy(key | keys) }
 */
(function (root) {
  'use strict';

  function open(v, d) {
    const { t, esc } = d;
    const opts = v.options;
    const wares = opts.filter((o) => o.role === 'ware'), alone = opts.filter((o) => o.role === 'alone');
    const leave = opts.find((o) => o.role === 'leave') || null;
    const purse = v.shop && v.shop.purse != null ? v.shop.purse : Infinity;
    const st = { basket: [], one: null };
    const parts = {};
    const order = wares.concat(alone);   // the number keys, in the order shown

    const total = () => st.basket.reduce((a, k) => a + (opts.find((o) => o.key === k).price || 0), 0);
    const gain = () => st.basket.reduce((a, k) => a + (opts.find((o) => o.key === k).income || 0), 0);
    const priceTag = (o) => o.income ? '<span class="price gain">' + esc(t('shop.pays', { n: o.income })) + '</span>' : o.price ? '<span class="price">' + esc(t('shop.price', { n: o.price })) + '</span>' : '';
    const tile = (o, i) => {
      parts[o.key] = d.parts(o);
      const why = o.locked || (o.poor ? t('card.cantAfford', { cost: o.poor }) : '');
      return '<button class="opt shop-item' + (why ? ' locked' : '') + '" data-k="' + esc(o.key) + '"' + (o.disabled ? ' disabled' : '') + '>' +
        '<span class="num">' + (i < 9 ? i + 1 : '') + '</span><b>' + (why ? '🔒 ' : '') + esc(o.label) + '</b>' + priceTag(o) +
        (why ? '<small class="why">' + esc(why) + '</small>' : '<small class="why fit">' + esc(t('shop.wontFit')) + '</small>') +
        (o.hint ? '<small>' + esc(o.hint) + '</small>' : '') + (parts[o.key].html || '') + '</button>';
    };
    let n = 0;
    const html = '<div class="modal dark shop"><div class="modal-art">' + d.Art.scene(v.art, v.tags, v.id) + '</div><div class="modal-body">' +
      (v.actor ? d.actorRow(v.actor).replace('actor-row', 'actor-row" style="color:var(--text)') : '') +
      '<h2>' + esc(v.title) + '</h2><p class="text prompt">' + esc(t(wares.length > 1 ? 'shop.prompt' : 'menu.prompt')) + '</p>' +
      (wares.length ? '<div class="opt-grid shelf">' + wares.map((o) => tile(o, n++)).join('') + '</div>' : '') +
      (alone.length ? '<p class="shop-alone">' + esc(t('shop.alone')) + '</p><div class="opt-grid">' + alone.map((o) => tile(o, n++)).join('') + '</div>' : '') +
      '<p class="shop-total" id="shopTotal"></p>' +
      '<div class="row shop-go" style="margin-top:10px">' + (leave ? '<button class="btn" id="shopLeave">' + esc(leave.label) + '</button>' : '') +
      '<button class="btn primary grow" id="shopBuy" disabled></button></div></div></div>';
    d.openPanel(html);
    const root = document.getElementById('overlay') || document;

    function render() {
      const room = purse - total();
      root.querySelectorAll('.shop-item').forEach((b) => {
        const o = opts.find((x) => x.key === b.dataset.k);
        const inBasket = st.basket.includes(o.key) || st.one === o.key;
        b.classList.toggle('sel', inBasket);
        const wontFit = o.role === 'ware' && !inBasket && !o.disabled && (o.price || 0) > room;
        b.classList.toggle('wont-fit', wontFit);
        if (!o.disabled) b.disabled = wontFit;
      });
      const buy = document.getElementById('shopBuy');
      const tot = document.getElementById('shopTotal');
      if (st.one) { buy.disabled = false; buy.textContent = t('menu.confirmOne'); tot.textContent = ''; return; }
      buy.disabled = !st.basket.length;
      buy.textContent = st.basket.length ? t('shop.buy', { n: st.basket.length }) : t('shop.buyNone');
      tot.textContent = !st.basket.length ? '' : (total() ? t('shop.total', { cost: total(), purse: purse === Infinity ? '' : purse }) : '') + (gain() ? (total() ? ' · ' : '') + t('shop.gain', { gain: gain() }) : '');
    }
    function toggle(key) {
      const o = opts.find((x) => x.key === key);
      if (!o || o.disabled) return;
      if (o.role === 'alone') {
        if (st.one === key) return go();
        st.one = key; st.basket = [];
      } else {
        st.one = null;
        const i = st.basket.indexOf(key);
        if (i >= 0) st.basket.splice(i, 1);
        else if ((o.price || 0) <= purse - total()) st.basket.push(key);
      }
      render();
    }
    function go() {
      if (st.one) return d.buy(st.one);
      if (!st.basket.length) return;
      // In shelf order, so the receipt reads as the shelf does; one ware is an ordinary choice.
      const keys = wares.map((o) => o.key).filter((k) => st.basket.includes(k));
      d.buy(keys.length === 1 ? keys[0] : keys);
    }
    root.querySelectorAll('.shop-item').forEach((b) => {
      const o = opts.find((x) => x.key === b.dataset.k);
      b.onclick = () => toggle(o.key);
      b.onmouseenter = () => d.setPreview(o.affects);
      b.onmouseleave = () => d.setPreview(null);
      d.attachTip(b, () => parts[o.key].tip, parts[o.key].extra);
    });
    document.getElementById('shopBuy').onclick = go;
    if (leave) document.getElementById('shopLeave').onclick = () => d.buy(leave.key);
    render();

    return {
      key(e) {
        const k = parseInt(e.key, 10);
        if (k >= 1 && k <= 9 && order[k - 1]) { toggle(order[k - 1].key); return true; }
        if (e.key === 'Enter') { go(); return true; }
        if (e.key === 'Escape' && leave) { d.buy(leave.key); return true; }
        return false;
      },
    };
  }

  root.ShopView = { open };
})(typeof window !== 'undefined' ? window : globalThis);
