/*
 * Crux's page: setup and briefing, the scene, the table, the end screen. All rules live in the Rust core (core.js
 * loads it); this file only renders a game's view and forwards taps as moves. Works from file:// (classic scripts, no
 * fetch).
 *
 * The table follows the duels (combat/web): a parchment card stub over one compact panel. You (a vertical Mana gauge
 * and what you carry) face whoever sits across the table: the crux they hold to, their Patience and Suspicion, and the
 * push beside them. Below, what they say (the voice) and the three arguments, each with its own two actions. The spells
 * sit in a grid of square tiles with a commit bar that says exactly what the picked one would do; pick it again, or
 * Cast. Two columns, one when narrow.
 *
 * Each meeting sounds and looks like its own scene (voices.js): its circumstance gives the verbs, the mood words, the
 * reactions, the ending and the look; the .grim parley's room gives the register; the card gives who and where. The
 * numbers and the rules are the same everywhere; the plain names (Confront, Deflect, Push for crux) stay in the
 * tooltips and the rules.
 */
(function (root) {
  'use strict';
  function mount(options = {}) {
  const R = options.runtime || root.LumenholdCrux || { core: root.CruxCore, cards: root.CruxCards, spells: root.CruxSpells, encounters: root.CruxEncounters, voices: root.CruxVoices };
  const K = R.core, C = R.cards, S = R.spells, ENC = R.encounters, V = R.voices;
  const TUNE = K.statics.tune, KINDS = K.statics.kinds, LOADOUTS = K.statics.loadouts;
  const $app = options.host;
  if (!$app) throw Error('Crux needs a host');
  let disposed = false;
  const campaign = !!options.game;
  const originalPlay = options.game && options.game.play;
  if (originalPlay) options.game.play = (key) => { const v = originalPlay(key); if (options.onSave) options.onSave(); return v; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const q = new URLSearchParams(location.search);
  const pct = (p) => `${Math.round(p * 100)}%`;
  const signed = (p) => `${p >= 0 ? '+' : '−'}${pct(Math.abs(p))}`;
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

  const SPELL_IDS = K.statics.spells.map((x) => x.id);
  // A spell as the view says it is now: its rank, cost, Suspicion, why it can't be cast, its preview and words.
  const spellOf = (g, id) => g.spells.find((x) => x.id === id);

  const ui = {
    screen: campaign ? 'table' : 'setup',
    setup: {
      level: Math.min(100, Math.max(1, Math.round(Number(q.get('level')) || 20))),
      loadout: LOADOUTS.includes(q.get('loadout')) ? q.get('loadout') : 'Scholar',
      encKey: ENC.some((e) => e.key === q.get('scene')) ? q.get('scene') : 'intro_wrong_tower/right',
      skip: [],
      seed: Number(q.get('seed')) || 0,
      mana: q.get('mana') == null ? null : Number(q.get('mana')),
      crowns: q.get('crowns') == null ? null : Number(q.get('crowns')),
      health: q.get('health') == null ? null : Number(q.get('health')),
      renown: q.get('renown') == null ? null : Number(q.get('renown')),
    },
    engine: { on: (() => { try { return !!localStorage.getItem('crux.engine'); } catch (e) { return false; } })(), report: null, for: null, running: false, error: '' },
    game: options.game || null, gameNo: 1, pick: null, rules: false, ask: null, hint: '', lastCrux: null, cruxDelta: 0,
    shown: new Set(), lastVoice: null, ended: null,
  };
  const encounter = () => options.encounter || ENC.find((e) => e.key === ui.setup.encKey) || ENC[0];
  const encounterOf = (g) => options.encounter || ENC.find((e) => e.key === g.enc);
  const cfg = (seed) => ({ seed, level: ui.setup.level, loadout: ui.setup.loadout, enc: encounter().key, skip: ui.setup.skip, mana: ui.setup.mana, crowns: ui.setup.crowns, health: ui.setup.health, renown: ui.setup.renown });

  // ---------- the meeting's voice (voices.js): its circumstance, its room, who sits across the table
  function voiceOf(e, circ = C.circumstanceOf(e)) {
    const c = V.CIRC[circ] || V.CIRC.authority, roomKey = V.ROOMS[e.room] ? e.room : '';
    return { ...c, circ, name: C.CIRCUMSTANCES[circ].name, roomKey, room: V.ROOMS[roomKey] || null, who: cap(e.who) || V.PROFILES[e.profile] || 'Across the table' };
  }
  // One of several lines, the same one each time this moment is shown.
  const hashStr = (s) => [...s].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);
  const pickOf = (xs, salt) => xs[hashStr(String(salt)) % xs.length];
  const band = (v, p) => v.bands[TUNE.bands.findIndex(([hi]) => p < hi)] || '';
  // The engine's labels, in the meeting's own verbs.
  const say = (v, label) => label.replace(/^Confront /, `${v.verbs.confront} `).replace(/^Deflect /, `${v.verbs.deflect} `).replace(/^Push for crux$/, v.verbs.push);

  // A log line the rules marked (`say`), in the meeting's words, with the numbers kept beside it. `big`: a moment the
  // onlookers react to, in a watched room.
  function voiced(g, v, l, i) {
    if (!l.say) return null;
    const [a0, a1, a2, a3] = l.say.a, salt = `${g.seed}|${i}`, T = (t) => t.replace(/\{title\}/g, a0);
    switch (l.say.k) {
      case 'won': return { line: pickOf(v.won[Math.min(Number(a1), v.won.length - 1)], salt), mech: `${a0} won · the crux ${a2} → ${a3}`, mood: 'up', big: Number(a1) >= 2 };
      case 'held': return { line: T(pickOf(v.held, salt)), mech: a1 ? `${a0} holds (${a1})` : `${a0} holds, as foreseen`, mood: 'down', big: true };
      case 'deflect': return { line: T(pickOf(v.deflect, salt)), mech: `${a0} · ${v.verbs.deflect.toLowerCase()}`, mood: '' };
      case 'neglect': return { line: T(pickOf(v.neglect, salt)), mech: `${a0} lands, unanswered`, mood: 'down', big: true };
      case 'hold': return { line: pickOf(v.hold, salt), mech: `the crux holds (${a0})`, mood: 'down', big: true };
      case 'give': return { line: pickOf(v.give, salt), mech: `the crux gives way (${a0})`, mood: 'up', big: true };
      default: return null;
    }
  }
  const crowd = (v, s, salt) => (v.roomKey === 'public' && s.big ? pickOf(s.mood === 'up' ? v.room.up : v.room.down, `${salt}|crowd`) : '');
  function logLine(g, v, l, i) {
    const s = voiced(g, v, l, i);
    if (!s) return `<div class="${l.cls}">${esc(l.text)}</div>`;
    const c = crowd(v, s, `${g.seed}|${i}`);
    return `<div class="${l.cls} voiced"><i>${esc(s.line)}</i> <span>${esc(s.mech)}</span>${c ? ` <em>${esc(c)}</em>` : ''}</div>`;
  }
  // What they say now: the last voiced line, or before anything has happened, the scene's opening.
  function voiceNow(g, v) {
    for (let i = g.log.length - 1; i >= 0; i--) {
      const s = voiced(g, v, g.log[i], i);
      if (s) return { key: `${ui.gameNo}|${i}`, at: i, ...s, crowd: crowd(v, s, `${g.seed}|${i}`) };
    }
    return { key: `${ui.gameNo}|open`, line: pickOf(v.opener, g.seed), mech: g.crux.text, mood: 'open', crowd: '' };
  }
  // How it ended, in the meeting's words.
  function ending(v, o) {
    const key = o.outcome === 'win' ? 'persuaded' : o.outcome === 'partial' ? 'partial' : o.why;
    const w = v.end[key];
    if (w) return { head: w[0], line: w[1] };
    return { head: { slip: 'Slipped away', flame: 'Violence', compel: 'Compelled', doom: 'Found out' }[o.why] || 'No deal', line: o.reason };
  }

  // The look: the circumstance and the room on the layer (style.css, [data-circ] and [data-room]), and its ambience inside
  // it, made once and kept across renders. Nothing outside the layer is touched, so the game can mount it in its stage.
  const $layer = $app.closest('.parley-layer') || $app;
  if (campaign) ui.engine.on = options.engineHelp && options.engineShown;
  function dress(v) {
    $layer.dataset.circ = v.circ;
    if (v.roomKey) $layer.dataset.room = v.roomKey; else delete $layer.dataset.room;
    let amb = $layer.querySelector(':scope > .ambience');
    if (!amb) {
      amb = document.createElement('div');
      amb.className = 'ambience';
      amb.setAttribute('aria-hidden', 'true');
      // Motes, fireflies, glints: placed by a fixed scatter, so a re-render never moves them.
      amb.innerHTML = `<b class="amb-light"></b><b class="amb-star"></b>${Array.from({ length: 18 }, (_, k) => {
        const r = (n) => (hashStr(`${k}|${n}`) % 1000) / 1000;
        return `<i style="--x:${(r('x') * 100).toFixed(1)}%;--y:${(r('y') * 100).toFixed(1)}%;--d:${(6 + r('d') * 10).toFixed(1)}s;--w:${(-r('w') * 12).toFixed(1)}s;--s:${(0.6 + r('s') * 0.9).toFixed(2)}"></i>`;
      }).join('')}`;
      $layer.prepend(amb);
    }
    if (amb.dataset.circ !== v.circ) { amb.dataset.circ = v.circ; amb.querySelector('.amb-star').innerHTML = v.motif; }
  }

  function gapWords(gap) {
    if (gap <= -15) return 'well below you';
    if (gap < -5) return 'below you';
    if (gap <= 5) return 'about your match';
    if (gap <= 10) return 'a little above you';
    return 'well above you';
  }
  const spellIcon = (id) => `<span class="a-ico" aria-hidden="true">${S.spells[id].icon}</span>`;
  // The icon of what a card tests or asks: the skill's, the resource's, or the spell's own.
  const askIcon = (ask) => `<span class="sign a-${ask.kind}" title="${esc(ask.label)}">${ask.spell ? S.spells[ask.spell].icon : S.signs[ask.sign]}${ask.short ? `<b>${esc(ask.short)}</b>` : ''}</span>`;

  // A square tile, as in the duels: icon, name, what it does in a word, its price in the corner.
  function tile({ id, data, kind, icon, name, eff, cost, costCls = 'c-mana', sus = 0, on = true, why = '', selected = false, evalKey = '' }) {
    return `<button class="act k-${kind}${on ? '' : ' off'}${selected ? ' selected' : ''}${why ? ' blocked' : ''}" data-${data}="${id}"${evalKey ? ` data-evalfor="${evalKey}"` : ''} title="${esc(name + (sus ? ` · +${sus} Suspicion` : '') + (why ? ' · ' + why : ''))}">
      ${evalKey ? evalSlot(evalKey) : ''}${cost != null ? `<span class="a-cost ${costCls}"><b>${cost}</b></span>` : ''}${sus ? `<span class="a-sus" aria-label="+${sus} Suspicion">+${sus}</span>` : ''}${icon}<span class="a-name">${esc(name)}</span><span class="a-eff">${esc(eff)}</span>
    </button>`;
  }
  // The engine's score for a move, filled in by paintEngine (a key ending in `:*` takes the best of its targets).
  const evalSlot = (key) => (ui.engine.on ? `<i class="a-eval" data-eval="${key}"></i>` : '');
  const spellTile = (g, id, opts) => { const x = spellOf(g, id); return tile({ id, kind: x.kind, icon: spellIcon(id), name: S.spells[id].name, eff: x.short, cost: x.cost, sus: x.sus, ...opts }); };
  const stubTag = (v) => `<span class="tag" title="${esc(v.room ? v.room.line : '')}">${esc(v.name.toUpperCase())}${v.room ? ` · ${esc(v.room.name.toUpperCase())}` : ''}</span>`;

  // ---------- setup and briefing: the page already wears the chosen meeting's look
  function renderSetup() {
    const s = ui.setup, e = encounter(), v = voiceOf(e);
    const g = K.newGame(cfg(1)).view;
    dress(v);
    const sig = Object.entries(g.signals).map(([k, x]) => `<span>${esc(C.SIGNALS[k])} <b>${x}</b></span>`).join('');
    const legend = Object.entries(KINDS).map(([k, name]) => `<span class="k-${k}"><i></i>${esc(name)}</span>`).join('');

    $app.innerHTML = `
      <div class="wrap">
        <div class="card-stub">${stubTag(v)}<h3>Crux</h3><button class="link" data-act="rules">Rules</button></div>
        <div class="fight cols">
          <div class="col">
          <p class="fine">Prototype. Win their small arguments to bring them round, then choose your moment to break the crux.</p>
          <div class="field"><span class="eyebrow">YOU</span><label class="lvl"><span>Level <b id="lvlOut">${s.level}</b></span><input id="level" type="range" min="1" max="100" step="1" value="${s.level}" aria-label="Your level"></label><select id="loadout" class="encpick" aria-label="Loadout">${LOADOUTS.map((k) => `<option ${k === s.loadout ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select><div class="sigs">${sig}</div></div>
          <div class="field"><span class="eyebrow">ACROSS THE TABLE · ${ENC.length} FROM THE GAME</span>
            <div class="row"><select id="enc" class="encpick" aria-label="Negotiation">
              ${[...new Set(ENC.map((x) => x.group))].map((grp) => `<optgroup label="${esc(grp)}">${ENC.filter((x) => x.group === grp).map((x) => `<option value="${esc(x.key)}" ${x.key === s.encKey ? 'selected' : ''}>${esc(x.title)}: ${esc(x.label)}</option>`).join('')}</optgroup>`).join('')}
            </select><button data-act="randomenc">Random</button></div></div>
          <div class="intent brief">
            <span class="v-motif" aria-hidden="true">${v.motif}</span>
            <div class="it"><b>${esc(e.title)} <small>${esc(v.name)} · level ${g.encLevel}, ${gapWords(g.gap)}</small></b>
              ${e.scene ? `<span class="scene-line">${esc(e.scene)}</span>` : ''}
              <span class="flavor">${esc(e.intro)}</span>
              <small>Across the table: <b class="inl">${esc(v.who)}</b>. You want: <b class="inl">${esc(e.label)}</b>. Their crux: <b class="inl">${esc(g.crux.title)}</b> (${esc(C.SIGNALS[g.crux.signal])}). Their arguments lean on ${esc(C.SIGNALS[C.leanOf(e)])}.</small>
              <small>${g.patience} Patience: 1 an argument; a press of the crux costs 1, then 2, 3… and may overdraw. ${TUNE.suspicionLimit} Suspicion and they walk out, and every spell they see you cast adds to it.${e.partial ? ' A partial deal is possible.' : ''}</small>
              <small>You bring ${g.crowns} crowns, ${g.health} Health and ${g.renown} Renown.${[...g.table, ...g.deck].some((c) => c.gate) ? ` They will ask: ${[...new Set([...g.table, ...g.deck].filter((c) => c.gate).map((c) => c.title))].join(', ')}.` : ''}</small>
              ${g.facts.length ? `<small>★ On your side: ${g.facts.map((f) => esc(f.text)).join(', ')} (once each: +${pct(TUNE.fact)} on one argument).</small>` : ''}</div>
          </div>
          </div>
          <div class="col">
          <div class="field"><span class="eyebrow">SPELLS PREPARED · ${g.known.length} OF ${Object.keys(g.ranks).length} · <span class="c-mana">${g.mana}</span> MANA</span>
            <div class="legend">${legend}</div>
            <div class="acts">${SPELL_IDS.filter((id) => g.ranks[id]).map((id) => spellTile(g, id, { data: 'know', on: g.known.includes(id) })).join('')}</div>
            <p class="fine">Your loadout’s spells as the duels build it, at the duels’ prices and ranks, from the same Mana, with the negotiation spells the duels leave out. Each breaks one rule, over the whole table, and each cast is seen: <span class="c-sus">+Suspicion</span> (the corner). Tap one to leave it out.</p></div>
          <button class="primary wide" data-act="start">Sit down</button>
          </div>
        </div>
      </div>`;
  }

  // ---------- the table
  // The small chips: a grudge, a rally, a fact, and what your spells left on it.
  function fxChips(g, c) {
    const out = [];
    if (c.grudged) out.push('<span class="tw bad">Back, harder</span>');
    if (c.boost) out.push(`<span class="tw ${c.boost > 0 ? 'good' : 'bad'}">${c.boost > 0 ? '+' : '−'}${pct(Math.abs(c.boost))}</span>`);
    const t = g.temp[c.uid];
    if (t && t.bonus) out.push(`<span class="tw spell">+${pct(t.bonus)}</span>`);
    if (c.adv) out.push('<span class="tw k-check live" title="Advantage: two rolls, the better kept">Two rolls</span>');
    if (c.index) out.push(`<span class="tw k-check live" title="Index: answered with Lore">as ${esc(C.SIGNALS[c.index])}</span>`);
    return out.join('');
  }
  // A card's effect, when it has one: a banner across the card, so the rare ones are seen. Their spells and the cards
  // yours put in their deck wear one too.
  function fxBand(c) {
    if (c.hex) return `<span class="fxband bad hex" title="${esc(C.HEXES[c.hex].lands)}"><b>Their spell</b>${esc(C.HEXES[c.hex].short)}</span>`;
    if (c.gift) return `<span class="fxband good" title="${esc(c.text)}"><b>Your spell</b>${c.gift === 'lodestar' ? 'Free: Patience to the full' : 'Free to answer'}</span>`;
    if (!c.fx) return '';
    const fx = C.EFFECTS[c.fx];
    return `<span class="fxband ${fx.good ? 'good' : 'bad'}" title="${esc(fx.text)}"><b>${esc(fx.name)}</b>${esc(fx.short)}</span>`;
  }

  // A small argument: what it tests or asks, its chance, what winning adds to the crux, what failing costs, how soon it
  // lands if neglected, and its own two actions. A card not shown before is dealt onto the table (`deal`: its turn).
  function argCard(g, v, c, deal) {
    const st = { gain: c.gain, fail: c.failParts }, ask = c.asks, p = c.chance;
    const left = c.left, cost = c.cost, noDeflect = c.deflect;
    // The chance, or what makes it certain: a demand met or not, Foresight's fate, the Lodestar.
    const odds = c.gate ? (p ? 'Met' : 'No') : c.fate ? (c.fate === 'win' ? '✓' : '✗') : p === 1 ? 'Sure' : pct(p);
    const lands = c.hex ? 'and it lands' : c.gift ? 'and it passes' : 'and it lands at its failure’s cost';
    const clock = `<span class="tw ${left <= 1 ? 'bad' : ''}" title="Leave it ${left} more action${left === 1 ? '' : 's'} ${lands}">${left <= 1 ? (c.hex ? 'Lands next' : 'Neglected next') : c.hex ? `Lands in ${left}` : `Neglected in ${left}`}</span>${(c.wait || TUNE.linger) <= 2 && !c.gift ? '<span class="tw bad" title="It won’t wait long">Urgent</span>' : ''}`;
    const fxCls = c.hex ? ' fx fx-bad hex' : c.gift ? ' fx fx-good' : c.fx ? ` fx ${C.EFFECTS[c.fx].good ? 'fx-good' : 'fx-bad'}` : '';
    const verb = c.hex ? 'Resist' : v.verbs.confront;
    const yes = c.gate ? (p ? 'Meet' : 'Fail') : verb;
    // A card as the game's cards are: parchment under a dark band, swiped right to answer it and left to set it aside
    // (attachArgSwipe), the way's label fading in as it leans. The two choices under it do the same.
    return `<div class="arg${c.gate ? ' demand' : ''}${left <= 1 ? ' due' : ''}${fxCls}${c.fate ? ` fated ${c.fate}` : ''}${deal != null ? ' dealt' : ''}" data-uid="${c.uid}"${deal != null ? ` style="--deal:${deal * 110}ms"` : ''}>
      <span class="card-label left" aria-label="${esc(v.verbs.deflect)}">${noDeflect ? '🔒' : '←'}</span><span class="card-label right" aria-label="${esc(yes)}">${odds} →</span>
      <div class="a-body">
        <span class="a-head"><span class="a-motif" aria-hidden="true">${v.motif}</span>${askIcon(ask)}<span class="odds${p === 0 ? ' no' : ''}${c.fate ? ' fate' : ''}"${c.fate ? ` title="Foreseen: it will ${c.fate === 'win' ? 'win' : 'fail'}"` : ''}>${odds}</span></span>
        <span class="a-text">
        <b class="atitle">${esc(c.title)}</b>
        ${fxBand(c)}
        <span class="stakes"><span class="up">▲ crux ${signed(st.gain)}</span><span class="dn">✕ ${esc(c.hex ? 'stays' : st.fail.map((x) => x.short).join(', ') || 'nothing')}</span></span>
        <span class="tws">${clock}${fxChips(g, c)}</span>
        ${g.facts.filter((f) => !f.used).map((f) => `<button class="fact-use" data-fact="${f.id}" data-on="${c.uid}" title="${esc(f.text)}: +${pct(TUNE.fact)} on this argument, once">★ ${esc(f.text)}</button>`).join('')}
        </span>
      </div>
      <span class="a-acts"><button class="deflect" data-deflect="${c.uid}" data-evalfor="deflect:${c.uid}" ${noDeflect ? 'disabled' : ''} aria-label="${esc(v.verbs.deflect)}" title="${esc(noDeflect || `${v.verbs.deflect} (Deflect, or swipe left): 1 Patience, nothing else`)}">${evalSlot(`deflect:${c.uid}`)}<span class="arrow">${noDeflect ? '🔒' : '←'}</span></button><button class="confront" data-confront="${c.uid}" data-evalfor="confront:${c.uid}" aria-label="${esc(yes)}" title="${esc(yes)} (${c.hex ? 'resist' : 'Confront'}, or swipe right): ${esc(c.fate ? `foreseen ${c.fate === 'win' ? 'to win' : 'to fail'}` : pct(p))}, ${cost ? `${cost} Patience` : 'free'}">${evalSlot(`confront:${c.uid}`)}<b>${odds}</b><span class="arrow">→</span></button></span>
    </div>`;
  }

  // Swiping an argument (the game's attachSwipe, src/ui.js): right answers it, left sets it aside. While it is dragged its
  // full description shows above the table (#swipeDesc). A drag only starts once it is plainly sideways, so the page
  // still scrolls under a finger; a short one springs back. Nothing is selected: a tap does nothing.
  function attachArgSwipe(el) {
    const uid = Number(el.dataset.uid), c = ui.game.view.table.find((x) => x.uid === uid);
    if (!c) return;
    const canLeft = !c.deflect, acts = el.querySelector('.a-acts');
    const labels = { left: el.querySelector('.card-label.left'), right: el.querySelector('.card-label.right') };
    let x0 = 0, y0 = 0, dx = 0, dy = 0, down = false, moved = false;
    const lean = (x) => {
      const a = Math.min(1, Math.abs(x) / 70);
      labels.left.style.opacity = x < 0 ? a : 0; labels.right.style.opacity = x > 0 ? a : 0;
      el.classList.toggle('lean-left', x < -20); el.classList.toggle('lean-right', x > 20);
    };
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || ui.busy || acts.contains(e.target) || e.target.closest('button')) return;
      down = true; moved = false; x0 = e.clientX; y0 = e.clientY; dx = dy = 0;
    });
    el.addEventListener('pointermove', (e) => {
      if (!down) return;
      dx = e.clientX - x0; dy = e.clientY - y0;
      if (!moved) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { down = false; return; }
        if (Math.abs(dx) < 8) return;
        moved = true; try { el.setPointerCapture(e.pointerId); } catch (err) { /* a pointer already gone */ } el.classList.remove('dealt'); el.classList.add('dragging');
        describe(c);
      }
      el.style.transform = `translate(${dx}px, ${dy * 0.2}px) rotate(${dx / 14}deg)`;
      lean(dx);
    });
    const end = () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      ui.swallow = true; setTimeout(() => { ui.swallow = false; }, 0);
      el.classList.remove('dragging');
      describe(null);
      const dir = dx < 0 ? 'left' : 'right';
      if (Math.abs(dx) > Math.min(90, el.offsetWidth * 0.5) && (dir === 'right' || canLeft)) {
        const s = dir === 'left' ? -1 : 1;
        el.style.transform = `translate(${s * window.innerWidth * 0.6}px, 30px) rotate(${s * 22}deg)`;
        el.style.opacity = '0';
        ui.busy = true;
        setTimeout(() => { if (disposed) return; ui.busy = false; act(dir === 'right' ? `confront:${uid}` : `deflect:${uid}`); }, 230);
      } else { el.style.transform = ''; lean(0); }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }
  // A move on an argument, from a swipe or a key.
  function act(key) {
    ui.hint = '';
    try { ui.game.play(key); } catch (err) { ui.hint = err.message; }
    render();
  }

  // An argument in full: what it asks, its text, its odds, what winning and failing do, its effect.
  function argDesc(g, v, c) {
    const fx = c.fx ? C.EFFECTS[c.fx] : null, ask = c.asks, st = { gain: c.gain, fail: c.failParts };
    return `<span class="p-ico">${askIcon({ ...ask, short: '' })}</span><div><b>${esc(c.title)}</b> <span class="dim">· ${esc(ask.label)}, ${esc(ask.have)}</span><p class="flavor">${esc(c.text)}</p>
      ${c.hex ? `<p><span class="fxline bad">Their spell: it can’t be deflected. Resist it (${pct(c.chance)}: it stays if you fail) or counter it with Ward or Reflect. If it lands: ${esc(C.HEXES[c.hex].lands)}</span></p>`
    : `<p>${c.gate ? (c.chance === 1 ? `A demand you can meet: ${v.verbs.confront} is certain, and you pay.` : `A demand you can’t meet: ${v.verbs.confront} fails.`) : c.fate ? `Foreseen: it will ${c.fate === 'win' ? 'win' : 'fail'}.` : `${pct(c.chance)} to win${c.adv ? ' (two rolls)' : ''}.`}${c.gift ? ' Free to answer.' : ''} Win: the crux ${signed(st.gain)}. Fail: ${esc(st.fail.map((x) => x.long).join(', ') || 'nothing')}.${fx ? ` <span class="fxline ${fx.good ? 'good' : 'bad'}">${esc(fx.name)}: ${esc(fx.text)}</span>` : ''}</p>`}</div>`;
  }
  // The description of the argument being swiped, pinned above the table while it moves; null hides it.
  function describe(c) {
    let box = $layer.querySelector('#swipeDesc');
    if (!c) { if (box) box.classList.remove('show'); return; }
    const g = ui.game.view;
    if (!box) { box = document.createElement('div'); box.id = 'swipeDesc'; box.className = 'swipe-desc'; box.setAttribute('aria-live', 'polite'); $app.closest('.parley-layer').appendChild(box); }
    box.innerHTML = `<div class="preview">${argDesc(g, voiceOf(encounterOf(g), g.circ), c)}</div>`;
    box.classList.add('show');
  }

  // The commit bar: a picked spell's exact effect, or how the arguments are played.
  function preview(g, v) {
    if (!ui.pick) return `<div class="preview hint">${esc(ui.hint || `Swipe an argument: → ${v.verbs.confront}, ← ${v.verbs.deflect}. Drag it partway to read it; let go short and it comes back. Tap a spell to see exactly what it would do.`)}</div>`;
    const id = ui.pick, x = spellOf(g, id), why = x.why, pv = x.preview;
    return `<div class="preview k-${x.kind}"><span class="p-ico">${spellIcon(id)}</span><div><b>${esc(S.spells[id].name)}</b><p>${esc(x.text)}</p>
      ${pv ? `<p class="pv">${esc(pv)}</p>` : ''}<p><span class="c-mana">${x.cost} Mana</span>: ${g.mana} → ${g.mana - x.cost}.${x.sus ? ` <span class="c-sus">+${x.sus} Suspicion</span>: ${g.suspicion} → ${g.suspicion + x.sus} of ${TUNE.suspicionLimit}${x.sus > 1 ? ' (they’re watching)' : ''}.` : ''} ${x.action ? ' It is your action.' : ' One spell an action.'}</p>${why ? `<p class="why">${esc(why)}.</p>` : ''}</div></div>
      <button id="commit" class="primary" data-act="cast" ${why ? 'disabled' : ''}>Cast</button>`;
  }

  // Their deck: a small stack of card backs wearing the meeting's emblem.
  const deckStack = (v, n) => `<span class="deckstack${n ? '' : ' empty'}" title="${n} in their deck">${n ? `<i></i><i></i><i>${v.motif}</i>` : ''}<b>${n}</b></span><span class="decknoun">${esc(v.deck(n))}</span>`;

  function renderTable() {
    const g = ui.game.view, e = encounterOf(g), v = voiceOf(e, g.circ), over = g.over;
    dress(v);
    const pc = g.cruxChance, pp = g.pressChance, cost = g.pressCost;
    const moved = ui.lastCrux != null && Math.abs(pc - ui.lastCrux) > 1e-9;
    if (moved) ui.cruxDelta = pc - ui.lastCrux;
    ui.lastCrux = pc;
    const noPush = over ? 'The meeting is over' : g.canPress;
    const mods = over ? '' : [
      noPush ? `<span class="tw bad">${esc(noPush)}</span>` : '',
      ...g.active.map(([kind, text]) => `<span class="tw ${kind === 'good' || kind === 'bad' ? kind : `k-${kind} live`}">${esc(text)}</span>`),
    ].join('');
    const sus = Array.from({ length: TUNE.suspicionLimit }, (_, i) => `<i class="${i < g.suspicion ? 'on' : ''}"></i>`).join('');
    // Patience as dots, like Suspicion: one a point, filled while they still have it; above their usual (Starlight, Reflect) the extra dots ring brighter.
    const pat = Array.from({ length: Math.max(g.patienceMax, g.patience) }, (_, i) => `<i class="${i < g.patience ? 'on' : ''}${i >= g.patienceMax ? ' extra' : ''}"></i>`).join('');
    const seen = g.deck.slice(0, g.seen);
    const after = g.patience - cost;
    // What they say now, fresh when it has just changed (it slides in, and a watched room stirs).
    const said = voiceNow(g, v), fresh = said.key !== ui.lastVoice;
    ui.lastVoice = said.key;
    // Cards not seen before are dealt, one after another.
    let k = 0;
    const deal = (c) => (ui.shown.has(c.uid) ? null : k++);
    const engineToggle = !over && (!campaign || options.engineHelp) ? `<button class="link eng-toggle" data-act="engine" aria-pressed="${ui.engine.on}" title="The engine’s evaluation of every move, from what you can see">Engine</button>` : '';
    // A lesson can be skipped until the first move (it costs nothing then); the campaign names where Standing, Bond and Record come from.
    const skip = campaign && options.tutorial && !over && !ui.game.moves.length ? '<button class="link" data-act="skiplesson">Skip the lesson</button>' : '';
    const sources = campaign && options.sources ? `<p class="fine sources">${Object.entries(options.sources).map(([key, x]) => `<span>${esc(C.SIGNALS[key])}</span>: ${esc(x)}`).join(' · ')}</p>` : '';
    const engineOn = ui.engine.on && !over;

    $app.innerHTML = `
      <div class="wrap${over ? ' over' : ''}">
        <div class="card-stub">${stubTag(v)}<h3>${esc(e.title)}</h3>
          <span class="stub-btns">${skip}${engineToggle}<button class="link" data-act="rules">Rules</button>${over ? '' : `<button class="icon-btn" data-act="leave" title="Leave">${S.actions.leave}</button>`}</span></div>
        <div class="fight cols">
          <div class="col main-col">
          <div class="fighters${engineOn ? ' with-eval' : ''}">${engineOn ? '<div class="evalbar" title="The engine: your chance to win from here, played well"><i></i><span></span></div>' : ''}
            <div class="fighter you">
              <div class="vgauge" title="Mana ${g.mana} of ${g.cap}"><b>${g.mana}</b><span class="vtrack"><i style="height:${Math.max(0, Math.min(100, (g.mana / g.cap) * 100))}%"></i></span><small>Mana</small></div>
              <div class="you-side">
                <div class="fname"><b>You</b><small>lv ${g.level}</small></div>
                <span class="a-crowns">${S.signs.crowns}${g.crowns}</span><span class="a-health">${S.signs.health}${g.health}</span><span class="a-renown">${S.signs.renown}${g.renown}</span>
              </div>
            </div>
            <div class="fighter opp">
              <div class="fname opp-name"><b title="${esc(v.who)}">${esc(v.who)}</b></div>
              <div class="crux-name" title="${esc(g.crux.text)}"><span>holds to</span> <b>${esc(g.crux.title)}</b> <small>· ${esc(C.SIGNALS[g.crux.signal])}</small></div>
              <div class="opp-row">
                <div class="cpct"><b class="${moved ? (ui.cruxDelta > 0 ? 'bump up' : 'bump down') : ''}">${pct(pc)}</b>${ui.cruxDelta ? `<span class="cdelta ${ui.cruxDelta > 0 ? 'up' : 'down'}">${ui.cruxDelta > 0 ? '▲' : '▼'}${pct(Math.abs(ui.cruxDelta))}</span>` : ''}<small title="${esc(g.band)}">${esc(band(v, pc) || g.band)}</small></div>
                <div class="opp-stats">
                  <div class="susrow patrow"><span class="pats">${pat}</span><small>Patience ${g.patience}/${g.patienceMax}${g.patience < 0 ? ' (overdrawn)' : ''}</small></div>
                  <div class="susrow"><span class="sus">${sus}</span><small>Suspicion ${g.suspicion}/${TUNE.suspicionLimit}</small></div>
                </div>
                <button class="push" data-act="press" data-evalfor="press" ${noPush ? 'disabled' : ''} title="${esc(noPush || `${v.verbs.push} (Push for crux): ${cost} Patience, ${g.patience} → ${after}.${after < 0 ? ' Overdrawn: a landed push still wins.' : ''} The next costs ${Math.max(0, TUNE.pressStart + g.presses + 1)}.`)}">${evalSlot('press')}${S.actions.press}<span>${esc(v.verbs.push)}<small>${over ? 'The meeting is over' : noPush ? 'a Sore point bars it' : `${pp === 1 ? 'certain' : pct(pp)} · ${cost ? `${cost} Patience` : 'free'}${after < 0 ? ' · overdraws' : ''}`}</small></span></button>
              </div>
              <span class="btrack crux"><i class="fill" style="width:${pc * 100}%"></i></span>
              ${v.roomKey === 'public' ? `<span class="audience${fresh && said.crowd ? ` stir ${said.mood}` : ''}" aria-hidden="true"></span>` : ''}
            </div>
          </div>
          <div class="voice ${said.mood}${fresh ? ' fresh' : ''}">
            <span class="v-motif" aria-hidden="true">${v.motif}</span>
            <div class="v-text"><p class="v-line">${esc(said.line)}</p><p class="v-sub">${esc(said.mech)}</p>${said.crowd ? `<p class="v-crowd">${esc(said.crowd)}</p>` : ''}</div>
          </div>
          ${over ? endPanel(g, e, v) : `<div class="objective"><span class="want" title="What you came for"><small>You want</small>${esc(e.label)}</span>${mods ? `<span class="tws">${mods}</span>` : ''}</div>
          ${sources}
          <div class="args">${g.table.length ? Array.from({ length: g.tableSize }, (_, s) => { const c = g.table.find((x) => x.slot === s); return c ? argCard(g, v, c, deal(c)) : '<div class="arg empty"></div>'; }).join('') : `<p class="fine">Nothing left to answer: ${esc(v.verbs.push.toLowerCase())}.</p>`}</div>
          <div class="deckline">${deckStack(v, g.deck.length)}${seen.map((c, i) => `<span class="tw seen" title="${esc(c.text)}">${i + 1}. ${esc(c.title)}${c.fx ? ' · ' + esc(C.EFFECTS[c.fx].name) : ''}</span>`).join('')}${g.canBury ? '<button class="link" data-act="bury">send the next to the bottom</button>' : ''}${g.facts.some((f) => !f.used) ? `<span class="tw fact-note" title="Each card’s ★ uses it there: +${pct(TUNE.fact)}, once">★ on your side: use it on a card</span>` : ''}</div>

          <div class="log">${g.log.map((l, i) => [l, i]).filter(([, i]) => i !== said.at).slice(-3).reverse().map(([l, i]) => logLine(g, v, l, i)).join('')}</div>`}
          </div>
          <div class="col side-col">
          ${over ? `<div class="end-log"><span class="eyebrow">The meeting</span><div class="log">${g.log.map((l, i) => logLine(g, v, l, i)).reverse().join('')}</div></div>` : `<div class="acts">${g.known.map((id) => spellTile(g, id, { data: 'spell', why: spellOf(g, id).why, selected: ui.pick === id, evalKey: `cast:${id}` })).join('')}</div>
          <div class="commit-bar">${preview(g, v)}</div>
          ${engineOn ? '<div class="engine"><b class="engine-head"></b><ol class="lines"></ol><p class="fine">Your chance to win after each move, played well: a search of your next moves through every roll, as the duels’ engine searches a fight (a partial deal counts half). It knows only what you know: a card you haven’t seen is a blank to it, and their Agreement is the least the crux shows. Each line follows the likelier roll (✓ lands, ✗ holds).</p></div>' : ''}`}
          </div>
        </div>
      </div>`;
    for (const c of g.table) ui.shown.add(c.uid);
    $app.querySelectorAll('.args .arg[data-uid]').forEach(attachArgSwipe);
    if (over) { const b = $app.querySelector('.end-panel .primary'); if (b) b.focus({ preventScroll: true }); const p = $app.querySelector('.end-panel.first'); if (p) p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  }

  // How it ended, inside the table it was played at (it stays in view, frozen at the last move): the meeting's emblem,
  // its headline and line, what you came for, the numbers, then Continue.
  function endPanel(g, e, v) {
    const o = g.over, w = ending(v, o);
    const goal = o.outcome === 'win' ? ['met', '✓'] : o.outcome === 'partial' ? ['part', '◐'] : ['missed', '✗'];
    const first = ui.ended !== ui.gameNo;
    ui.ended = ui.gameNo;
    return `<section class="end-panel end ${o.outcome}${first ? ' first' : ''}" aria-live="polite">
          <span class="emblem" aria-hidden="true">${v.motif}</span>
          <div class="end-head">
            <span class="eyebrow">${esc(v.who.toUpperCase())}</span>
            <h2>${esc(w.head)}</h2>
            <p class="flavor">${esc(w.line)}</p>
            <div class="goal ${goal[0]}"><span>${goal[1]}</span>${esc(e.label)}</div>
            ${w.line !== o.reason ? `<p class="fine">${esc(o.reason)}</p>` : ''}
          </div>
          <div class="stats">
            <span>Arguments won · failed · ${esc(v.verbs.deflect.toLowerCase())}</span><b>${g.wins} · ${g.fails} · ${g.deflected}</b>
            <span>Presses of the crux</span><b>${g.presses}</b>
            <span>The crux at the end</span><b>${pct(g.cruxChance)}</b>
            <span>Their Agreement, hidden until now</span><b>${g.agreement}</b>
            <span>Patience left</span><b>${g.patience < 0 ? `${g.patience} (overdrawn)` : g.patience}</b>
            <span>Mana spent</span><b>${(options.entryMana == null ? g.cap : options.entryMana) - g.mana}</b>
            ${g.spent.crowns || g.spent.health ? `<span>Crowns · Health paid</span><b>${g.spent.crowns} · ${g.spent.health}</b>` : ''}
            ${g.alignment ? `<span>Alignment</span><b>${g.alignment}</b>` : ''}
          </div>
          <div class="row center end-btns">${campaign ? '<button class="primary" data-act="done">Continue</button>' : '<button class="primary" data-act="again">Again</button><button data-act="replay">Same shuffle</button><button data-act="setup">Setup</button>'}</div>
        </section>`;
  }

  function renderRules() {
    if (!ui.rules) return;
    const view = ui.screen === 'table' && ui.game ? ui.game.view : null, v = view ? voiceOf(encounterOf(view), view.circ) : voiceOf(encounter());
    const box = document.createElement('div');
    box.className = 'modal';
    box.innerHTML = `<div class="fight"><h2>How Crux works</h2>
      <p class="fine here">${esc(v.name)}: here, Confront is <b>${esc(v.verbs.confront)}</b>, Deflect is <b>${esc(v.verbs.deflect)}</b>, and Push for crux is <b>${esc(v.verbs.push)}</b>. The words change with the meeting; the rules never do.</p>
      <ul>
        <li>They hold one <b>crux</b>. <b>Push for crux</b> at the chance shown: if it lands, you win. The first push costs <b>1 of their Patience</b>, the next 2, then 3 and so on, and a push may overdraw it: a landed push wins even past zero. A miss costs nothing more.</li>
        <li>Meanwhile they raise <b>small arguments</b>, ${TUNE.table} on the table at a time, from a deck made for this kind of meeting. <b>Confront</b> one (a check at the chance shown) or <b>Deflect</b> it, for <b>1 Patience</b>. Either way it leaves the table and the next is dealt.</li>
        <li>Each argument shows its stakes exactly: <b>▲ crux +x%</b> if you win it, and <b>✕</b> what failing costs, which differs by argument: Suspicion, the crux cooling, more Patience, the others rallying, Mana, crowns, Health, or it coming back later.</li>
        <li><b>Neglect an argument too long and it lands</b>: you take its failure’s cost anyway. Most wait 3 to 5 of your actions; an <b>Urgent</b> one, 1 or 2. Each card counts down (<i>neglected in 3</i>). Deflect the ones you can’t win before they land.</li>
        <li>They have ${TUNE.patience} Patience. Build the crux up, then pick your moment to go all-in. At zero, the meeting is over. ${TUNE.suspicionLimit} Suspicion and they walk out: failures and spells both add to it.</li>
        <li>Some are <b>demands</b>: crowns, Health, Renown or a spell cast for them. Meet one and Confronting it is certain (you pay what it asks); if you can’t, it fails. Each card’s icon shows what it tests or asks.</li>
        <li>About one argument in six does something more, shown on a banner across it: a <b>Sore point</b> bars the crux until you answer it, an <b>Opening</b> makes your next push free when you win it, a <b>Watchful</b> one makes every spell cost more Suspicion while it stands, and so on.</li>
        <li><b>One spell an action</b>, at the Mana prices shown. Each breaks one rule over the whole table (Foresight rolls every argument’s dice before you choose, Haste confronts them all at once, Seal clears the table), and <b>every cast is seen: +1 Suspicion</b> (Foresight and Haste +2), shown in the tile’s corner. A spell that would make them walk out can’t be cast. Pick a spell to see exactly what it would do; pick it again, or Cast.</li>
        <li>In a few informal meetings they have magic too: one of their arguments is <b>their spell</b>. It can’t be deflected. <b>Resist</b> it (an Arcana check; it stays if you fail) or counter it with <b>Ward</b> or <b>Reflect</b>; left too long, it lands. The man in grey’s Compulsion loses you the meeting.</li>
      </ul>
      <div class="row end-row"><button class="primary" data-act="closerules">Got it</button></div>
    </div>`;
    $app.appendChild(box);
  }

  function renderAsk() {
    if (!ui.ask) return;
    const box = document.createElement('div');
    box.className = 'modal';
    box.innerHTML = `<div class="fight"><p>${esc(ui.ask.text)}</p>
      <div class="row end-row"><button data-act="no">Keep talking</button><button class="primary" data-act="yes">${esc(ui.ask.yes)}</button></div></div>`;
    $app.appendChild(box);
  }

  // ---------- the engine (a cheat): its search runs in a worker (core.js analyst), a depth at a time, each depth's
  // result painted as it comes; a new position stops the old search.
  const stateKey = () => `${ui.gameNo}|${ui.game.moves.length}`;
  const analyst = K.analyst((report, running, ms, error) => {
    const e = ui.engine;
    e.report = report || e.report; e.running = running; e.error = error || '';
    if (!disposed) { paintEngine(); localize(); }
  }, { ms: options.engineBudget || 8000 });
  function requestAnalysis() {
    const e = ui.engine;
    if (!e.on || !ui.game || ui.game.view.over || ui.screen !== 'table') { analyst.stop(); e.running = false; return; }
    if (e.for === stateKey()) return;
    e.for = stateKey(); e.report = null; e.running = true; e.error = '';
    analyst.search(ui.game);
  }
  // The engine's chances: a tenth of a point near certainty, so 99.6% doesn't read as a sure thing.
  const epct = (v) => (v > 0.99 && v < 1 ? `${(Math.floor(v * 1000) / 10).toFixed(1)}%` : v < 0.01 && v > 0 ? `${(Math.ceil(v * 1000) / 10).toFixed(1)}%` : pct(v));
  function paintEngine() {
    const e = ui.engine, g = ui.game && ui.game.view;
    if (!e.on || !g || ui.screen !== 'table' || g.over) return;
    const v = voiceOf(encounterOf(g), g.circ);
    const live = e.report && e.for === stateKey() ? e.report : null;
    const scoreOf = (key) => {
      if (!live) return undefined;
      if (!key.endsWith(':*')) return live.scores[key];
      const pre = key.slice(0, -1), xs = Object.entries(live.scores).filter(([k]) => k.startsWith(pre)).map(([, x]) => x);
      return xs.length ? Math.max(...xs) : undefined;
    };
    for (const el of $app.querySelectorAll('[data-eval]')) { const x = scoreOf(el.dataset.eval); el.textContent = x === undefined ? '' : epct(x); }
    const ready = live && live.depth > 0;
    const bestKey = ready ? live.best : null;
    for (const el of $app.querySelectorAll('[data-evalfor]')) {
      const k = el.dataset.evalfor;
      el.classList.toggle('best', !!bestKey && (k === bestKey || (k.endsWith(':*') && bestKey.startsWith(k.slice(0, -1)))));
    }
    const bar = $app.querySelector('.evalbar');
    if (bar) { const x = ready ? live.value : undefined; bar.querySelector('i').style.height = `${x === undefined ? 50 : x * 100}%`; bar.querySelector('span').textContent = x === undefined ? '…' : x > 0.99 && x < 1 ? '99%' : x < 0.01 && x > 0 ? '1%' : pct(x); }
    const head = $app.querySelector('.engine-head'), lines = $app.querySelector('.engine .lines');
    const positions = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : `${n}`);
    if (head) head.textContent = e.error ? `Engine: ${e.error}` : ready ? `Engine · ${live.exact ? 'solved to the end' : `depth ${live.depth}`} · ${positions(live.nodes)} positions${e.running ? ' · thinking…' : ''}` : 'Engine · thinking…';
    const step = (x, i) => `<span class="${i === 0 ? 'mv' : x.end ? 'end' : ''}">${esc(say(v, x.label))}${x.note ? ` <b class="${x.note === '✓' ? 'ok' : 'no'}">${x.note}</b>` : ''}</span>`;
    if (lines) lines.innerHTML = ready ? live.lines.slice(0, 5).map((l, i) => `<li class="${i === 0 ? 'best' : ''}"><span class="eval">${epct(l.value)}</span><span class="line">${(l.line || [{ label: l.label }]).map(step).join('<i>→</i>')}</span></li>`).join('') : '';
  }

  function render() {
    if (ui.screen === 'setup') renderSetup(); else { renderTable(); requestAnalysis(); paintEngine(); }
    renderRules();
    renderAsk();
    if (campaign && !options.engineHelp) $app.querySelectorAll('.eng-toggle').forEach((e) => e.remove());
    localize();
  }

  function start(seed) {
    ui.game = K.newGame(cfg(seed >>> 0));
    ui.gameNo = (ui.gameNo || 0) + 1;
    Object.assign(ui, { screen: 'table', pick: null, hint: '', lastCrux: null, cruxDelta: 0, shown: new Set(), lastVoice: null });
    render();
    window.scrollTo(0, 0);
  }
  const newSeed = () => (Math.random() * 2 ** 32) >>> 0;
  const ASKS = {
    flame: { text: 'Attack them? The meeting is lost.', yes: 'Cast Flame' },
    shadowstep: { text: 'Slip out now? The meeting is lost.', yes: 'Slip away' },
    compel: { text: 'Compel them? Everything on the table is won, but after your next action they see what you did, and the meeting is lost unless that action wins it.', yes: 'Cast Compel' },
    leave: { text: 'Leave the table? The meeting is lost.', yes: 'Leave' },
  };

  // Cast the picked spell.
  function commit() {
    const id = ui.pick;
    const why = spellOf(ui.game.view, id).why;
    if (why) { ui.hint = `${S.spells[id].name}: ${why}.`; return; }
    if (ASKS[id]) { ui.ask = { ...ASKS[id], act: id }; return; }
    ui.game.play(`cast:${id}`);
    ui.pick = null;
  }

  // The click a drag ends with is not a tap.
  $app.addEventListener('click', (ev) => { if (ui.swallow) { ui.swallow = false; ev.stopImmediatePropagation(); ev.preventDefault(); } }, true);
  $app.addEventListener('click', (ev) => {
    const t = ev.target.closest('button');
    if (!t) return;
    const d = t.dataset, s = ui.setup, g = ui.game, play = (key) => g.play(key);
    ui.hint = '';
    try {
      if (d.act === 'done') { if (options.onDone() !== false) destroy(); return; }
      if (d.act === 'skiplesson') { if (options.onSkip() !== false) destroy(); return; }
      if (d.act === 'randomenc') { s.encKey = ENC[Math.floor(Math.random() * ENC.length)].key; }
      else if (d.know) { s.skip = s.skip.includes(d.know) ? s.skip.filter((x) => x !== d.know) : [...s.skip, d.know]; }
      else if (d.act === 'start') { start(s.seed || newSeed()); return; }
      else if (d.confront !== undefined) { play(`confront:${d.confront}`); }
      else if (d.deflect !== undefined) { play(`deflect:${d.deflect}`); }
      else if (d.act === 'press') { play('press'); }
      else if (d.spell) { if (ui.pick === d.spell) commit(); else ui.pick = d.spell; }
      else if (d.act === 'cast') { commit(); }
      else if (d.act === 'bury') { play('bury'); }
      else if (d.fact !== undefined) {
        play(`fact:${d.fact}:${d.on}`);
      }
      else if (d.act === 'leave') { ui.ask = { ...ASKS.leave, act: 'leave' }; }
      else if (d.act === 'yes') { const act = ui.ask.act; ui.ask = null; ui.pick = null; play(act === 'leave' ? 'leave' : `cast:${act}`); }
      else if (d.act === 'no') { ui.ask = null; }
      else if (d.act === 'again') { start(newSeed()); return; }
      else if (d.act === 'replay') { start(g.setup.seed); return; }
      else if (d.act === 'setup') { ui.screen = 'setup'; }
      else if (d.act === 'rules') { ui.rules = true; }
      else if (d.act === 'engine') { ui.engine.on = !ui.engine.on; if (options.onEngineShown) options.onEngineShown(ui.engine.on); if (!campaign) try { localStorage.setItem('crux.engine', ui.engine.on ? '1' : ''); } catch (e) { /* a private window */ } }
      else if (d.act === 'closerules') { ui.rules = false; }
      else return;
    } catch (err) {
      ui.hint = err.message;
    }
    render();
  });

  // The level slider says its value as it moves; the kit is rebuilt when it's let go (change).
  $app.addEventListener('input', (ev) => {
    if (ev.target.id === 'level') { const o = $app.querySelector('#lvlOut'); if (o) o.textContent = ev.target.value; }
  });
  $app.addEventListener('change', (ev) => {
    if (ev.target.id === 'enc') ui.setup.encKey = ev.target.value;
    else if (ev.target.id === 'level') { ui.setup.level = Number(ev.target.value); ui.setup.skip = []; }
    else if (ev.target.id === 'loadout') { ui.setup.loadout = ev.target.value; ui.setup.skip = []; }
    else return;
    render();
  });

  function localize() { if (R.text && options.translations) R.text.localize($app, options.translations); }
  function destroy() { disposed = true; analyst.stop(); if (options.game) options.game.play = originalPlay; $app.replaceChildren(); }
  render();
  return { destroy };
  }
  root.CruxUI = { open: mount };
})(typeof self !== 'undefined' ? self : this);
