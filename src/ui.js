/*
 * Lumenhold UI — renders the engine's output and feeds choices back.
 * Swipe the card left/right (or use the buttons / arrow keys). Menus open as a modal.
 * Add ?debug to the URL for the content-author panel, ?event=<id>&debug to preview one event.
 * ?lang=<code> forces a language for this visit (e.g. ?lang=zh-CN).
 * All visible strings go through t() (src/i18n.js) or come from (translated) content.
 */
(function () {
  'use strict';
  const SAVE_KEY = 'lumenhold.save.v1';
  const SETTINGS_KEY = 'lumenhold.settings.v1';
  const RESUME_KEY = 'lumenhold.resume';
  const RUNS_KEY = 'lumenhold.runs.v1';   // archive of finished / abandoned runs (full logs + feedback), without a server
  const SEEN_KEY = 'lumenhold.seen.v1';   // cross-run seen counters, without a server
  const SLOT_KEY = (n) => 'lumenhold.slot.' + n;
  const MAX_RUNS = 15;
  const app = document.getElementById('app');
  const params = new URLSearchParams(location.search);
  const DEBUG = params.has('debug');
  const t = I18n.t;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };
  let settings = { notes: true, lang: null, amounts: 'marks' };
  try { Object.assign(settings, JSON.parse(store.get(SETTINGS_KEY) || '{}')); } catch (e) { /* ignore */ }
  const saveSettings = () => store.set(SETTINGS_KEY, JSON.stringify(settings));

  let content = null, eng = null;
  const ui = { tab: 'you', mode: null, view: null, busy: false, sideOpen: false };
  const LOCALES = window.LUMENHOLD_LOCALES || {};
  const languages = [{ code: 'en', name: 'English' }].concat(Object.keys(LOCALES).map((code) => {
    const uiSrc = LOCALES[code].find((s) => /(^|\/)ui\.lang$/.test(s.path));
    const loc = uiSrc ? I18n.loadLocale(code, [uiSrc]) : { ui: {} };
    return { code, name: loc.ui['lang.name'] || code };
  }));

  /* ------------------------------------------------------------------ boot (called at the end of this file) */
  function pickLang() {
    const want = params.get('lang') || settings.lang;
    if (want && languages.some((l) => l.code === want)) return want;
    const nav = (navigator.language || 'en').toLowerCase();
    const hit = languages.find((l) => l.code.toLowerCase() === nav) || languages.find((l) => nav.startsWith(l.code.toLowerCase().split('-')[0]) && l.code !== 'en');
    return hit ? hit.code : 'en';
  }
  function boot() {
    if (!window.LUMENHOLD_SOURCES) return fatal(['Content bundle not found (build/content.bundle.js).', '', 'From the project folder run:', '    node tools/grim.js build']);
    const r = Grimoire.compile(window.LUMENHOLD_SOURCES);
    if (r.errors.length) return fatal(['Content failed to compile:', ''].concat(r.errors.map((e) => e.message)));
    content = r.content;
    const lang = pickLang();
    let locale = null;
    if (lang !== 'en' && LOCALES[lang]) {
      locale = I18n.loadLocale(lang, LOCALES[lang]);
      if (locale.errors.length) console.warn('[i18n]', locale.errors.join('\n'));
      const st = I18n.applyContent(content, locale);
      if (st.missing.length) console.info('[i18n] ' + lang + ': ' + st.missing.length + ' untranslated strings (shown in English)');
    }
    I18n.use(locale);
    document.documentElement.lang = lang;
    if (/^zh/.test(lang)) loadCjkFonts();
    window.lumen = { content, get eng() { return eng; }, Grimoire, Engine, Art, I18n };
    document.addEventListener('keydown', onKey);
    if (params.get('event')) return previewEvent(params.get('event'));
    window.addEventListener('pagehide', () => { if (eng && eng.s) Net.flush(eng, runRecordMeta(), { final: true }); });
    Net.detect().then(syncAutosave).catch((e) => console.warn(e)).then(() => {
      const resume = store.get(RESUME_KEY);
      if (resume) {
        store.del(RESUME_KEY);
        const saved = store.get(SAVE_KEY);
        if (saved) {
          try {
            eng = new Engine(content).load(saved); buildGame();
            const out = resume === 'outcome' && !eng.s.cur ? lastOutcome() : null;
            if (out) { renderChrome(); renderFeedbackBar(); return showOutcome(out); }
            return step(eng.advance());
          } catch (e) { if (e.code === 'SAVE_VERSION') retireOldSave(saved); else console.warn(e); eng = null; }
        }
      }
      titleScreen();
    });
  }
  // With a server, the newer of the local and the server autosave wins (by the time of its last event).
  async function syncAutosave() {
    if (!Net.available) return;
    const lastAt = (s) => { try { const h = (typeof s === 'string' ? JSON.parse(s) : s).hist || []; return h.length ? h[h.length - 1].at || 0 : 0; } catch (e) { return 0; } };
    const local = store.get(SAVE_KEY);
    let remote = null;
    try { remote = await Net.getSave('auto'); } catch (e) { console.warn('[net] autosave', e.message); }
    if (remote && lastAt(remote) > lastAt(local)) store.set(SAVE_KEY, JSON.stringify(remote));
    else if (local && lastAt(local) > lastAt(remote)) Net.putSave('auto', local).catch((e) => console.warn(e));
  }
  function loadCjkFonts() {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600&family=Noto+Serif+SC:wght@500;700&display=swap';
    document.head.appendChild(l);
  }
  function fatal(lines) { app.innerHTML = '<div class="errors">' + esc(lines.join('\n')) + '</div>'; }
  function switchLang(code, resume) {
    // An outcome on screen is re-shown after the reload (in the new language) instead of being skipped.
    if (resume && eng && eng.s && !eng.s.ended) { save(); store.set(RESUME_KEY, ui.mode === 'outcome' ? 'outcome' : '1'); }
    settings.lang = code; saveSettings();
    const u = new URL(location.href); u.searchParams.delete('lang');
    location.href = u.toString();
  }

  /* ------------------------------------------------------------------ title */
  // Saves from an older version can't be loaded (design: saves may break until 1.0). Their run log is
  // kept: in the local archive without a server (the server already has it).
  function retireOldSave(raw) {
    try {
      const o = JSON.parse(raw);
      if (o && o.hist && !Net.available) {
        const meta = runMeta();
        archiveRecord({ format: 'lumenhold-run', v: 1, runId: o.runId || 'old-' + Date.now().toString(36), name: o.name, seed: o.seed, startedAt: o.hist[0] && o.hist[0].at, updatedAt: Date.now(), turn: o.turn, ended: null, feedback: o.hist.filter((h) => h.fb).length, ...meta, retired: 'save version ' + (o.version || 1), hist: o.hist });
      }
    } catch (e) { console.warn(e); }
    store.del(SAVE_KEY);
    ui.notice = t('title.oldSave');
  }
  function titleScreen() {
    ui.mode = 'title';
    closeOverlay(); closeFeedback(); removeFeedbackBar();
    let saved = store.get(SAVE_KEY);
    if (saved) { try { new Engine(content).load(saved); } catch (e) { if (e.code === 'SAVE_VERSION') { retireOldSave(saved); saved = null; } } }
    let savedInfo = '';
    if (saved) { try { const s = JSON.parse(saved); const e = new Engine(content).load(s); savedInfo = t('title.saveInfo', { name: esc(s.name), month: esc(e.monthName()), year: e.yearOf() }); } catch (e) { savedInfo = ''; } }
    const g = content.game;
    const cur = I18n.lang();
    app.innerHTML =
      '<div class="title-screen"><div class="title-panel">' +
      '<div class="title-crest">' + Art.icon('tower', 64) + '</div>' +
      '<h1>' + esc(g.title || 'Lumenhold Academy') + '</h1>' +
      '<p class="sub">' + esc(g.subtitle || '') + '</p>' +
      '<div class="title-form">' +
      (languages.length > 1 ? '<div class="lang-row">' + Art.icon('globe', 16) + languages.map((l) => '<button class="lang-btn' + (l.code === cur ? ' on' : '') + '" data-lang="' + esc(l.code) + '">' + esc(l.name) + '</button>').join('') + '</div>' : '') +
      '<label for="pname">' + esc(t('title.yourName')) + '</label><input id="pname" maxlength="24" value="' + esc(randomName()) + '" autocomplete="off">' +
      '<details class="adv"><summary>' + esc(t('title.seed')) + '</summary><input id="pseed" inputmode="numeric" placeholder="' + esc(t('title.seedPlaceholder')) + '"></details>' +
      '<div class="row"><button class="btn primary grow" id="begin">' + esc(t('title.begin')) + '</button>' +
      (savedInfo ? '<button class="btn grow" id="cont">' + esc(t('title.continue', { info: '' })) + savedInfo + '</button>' : '') + '</div>' +
      '<div class="row"><button class="btn ghost-btn grow" id="slotsBtn">' + esc(t('slots.heading')) + '</button></div>' +
      (ui.notice ? '<div class="notice">' + esc(ui.notice) + '</div>' : '') +
      '<div class="howto">' + t('title.howto_html') + '</div>' + runLogLine() +
      '</div></div></div>';
    ui.notice = null;
    document.querySelectorAll('.lang-btn').forEach((b) => { b.onclick = () => { if (b.dataset.lang !== cur) switchLang(b.dataset.lang, false); }; });
    document.getElementById('begin').onclick = async () => {
      const name = document.getElementById('pname').value.trim() || t('title.defaultName');
      const seed = document.getElementById('pseed').value.trim();
      // The run being replaced keeps its log (and any feedback) in the archive.
      if (saved) { try { const old = new Engine(content).load(saved); archiveRun(old); Net.flush(old, runRecordMeta(old), { final: true }); } catch (e) { console.warn(e); } store.del(SAVE_KEY); }
      const seen = await loadSeen();
      const start = (origin) => {
        ui.mode = null; closeOverlay();
        eng = new Engine(content);
        buildGame();
        step(eng.newGame({ name, seed: seed === '' ? null : seed, ...seen, ...(origin ? { origin } : {}) }));
      };
      const choices = new Engine(content).originChoices();
      if (choices.length) showOrigins(choices, start); else start(null);
    };
    const c = document.getElementById('cont');
    if (c) c.onclick = () => { eng = new Engine(content).load(saved); buildGame(); step(eng.advance()); };
    document.getElementById('slotsBtn').onclick = () => openSlots();
    const ex = document.getElementById('exportRuns');
    if (ex) ex.onclick = () => exportRuns(allRuns(), 'lumenhold-runs-' + fileStamp() + '.json');
  }
  // The origin screen (playtest 2, M32): who you were before, and what it means for money, before the game starts.
  function showOrigins(choices, start) {
    ui.mode = 'origin';
    const opts = choices.map((o, i) => '<button class="opt origin-opt' + (o.poor ? ' poor' : '') + '" data-k="' + esc(o.key) + '"><span class="num">' + (i + 1) + '</span>' +
      '<b>' + (o.art ? Art.icon(o.art, 16) + ' ' : '') + esc(o.label) + '</b>' + (o.hint ? '<small>' + esc(o.hint) + '</small>' : '') +
      (o.money ? '<small class="money">' + Art.icon('coin', 13) + ' ' + esc(o.money) + '</small>' : '') +
      (o.poor ? '<small class="warn">' + esc(t('origin.poorWarning')) + '</small>' : '') + '</button>').join('');
    openOverlay('<div class="modal dark origin-modal"><div class="modal-body"><h2>' + esc(t('origin.heading')) + '</h2><p class="text">' + esc(t('origin.intro')) + '</p>' +
      '<div class="opt-grid">' + opts + '</div><div class="row" style="margin-top:14px"><button class="btn ghost-btn grow" id="originBack">' + esc(t('origin.back')) + '</button></div></div></div>');
    document.querySelectorAll('.origin-opt').forEach((b) => { b.onclick = () => { if (ui.mode === 'origin') start(b.dataset.k); }; });
    document.getElementById('originBack').onclick = () => { closeOverlay(); ui.mode = 'title'; };
    ui.originPick = (i) => { const o = choices[i]; if (o && ui.mode === 'origin') start(o.key); };
  }
  function randomName() { const n = t('title.names').split(/\s*[,，、]\s*/).filter(Boolean); return n[Math.floor(Math.random() * n.length)] || 'Wren'; }

  function previewEvent(id) {
    eng = new Engine(content);
    eng.newGame({ name: t('title.defaultName'), seed: 1 });
    if (!content.events[id]) return fatal(['No event with id "' + id + '"']);
    const actor = params.get('actor') || (content.events[id].actor && !['any', 'npc'].includes(content.events[id].actor) ? content.events[id].actor : null) || (content.events[id].actor ? Object.keys(content.npcs)[0] : null);
    if (actor && eng.s.npcs[actor]) eng.s.npcs[actor].met = true;
    eng.s.deck.unshift({ id, actor, src: 'preview', force: true });
    buildGame();
    step(eng.advance());
  }

  /* ------------------------------------------------------------------ layout */
  function buildGame() {
    const nextLang = languages[(languages.findIndex((l) => l.code === I18n.lang()) + 1) % languages.length];
    app.innerHTML =
      '<div class="game">' +
      '<header class="top"><div class="brand">' + esc(content.game.title || 'Lumenhold') + '</div>' +
      '<div class="date"><div class="when" id="when"></div><div class="timeline" id="timeline"></div></div>' +
      '<div class="top-actions">' +
      '<button class="icon-btn side-toggle" id="sideToggle" title="' + esc(t('top.people')) + '">' + Art.icon('group', 20) + '</button>' +
      (languages.length > 1 ? '<button class="icon-btn" id="langToggle" title="' + esc(t('top.lang') + ' → ' + nextLang.name) + '">' + Art.icon('globe', 18) + '</button>' : '') +
      '<button class="icon-btn" id="notesToggle" title="' + esc(t('top.notes')) + '">' + Art.icon('feather', 18) + '</button>' +
      '<button class="icon-btn" id="amountsToggle" title="' + esc(t('top.amounts', { mode: t('amounts.' + (settings.amounts || 'marks')) })) + '">' + Art.icon('scales', 18) + '</button>' +
      '<button class="icon-btn" id="slotsTop" title="' + esc(t('slots.heading')) + '">' + Art.icon('scroll', 18) + '</button>' +
      '<button class="icon-btn" id="quit" title="' + esc(t('top.quit')) + '">' + Art.icon('door', 18) + '</button></div></header>' +
      '<div class="meters" id="meters"></div>' +
      '<main class="stage"><div class="deck" id="deck"><div class="ghost two"></div><div class="ghost"></div></div>' +
      '<div class="choices" id="choices"></div></main>' +
      '<aside class="side" id="side"><div class="tabs" id="tabs">' +
      '<button data-tab="you">' + esc(t('tab.you')) + '</button><button data-tab="people">' + esc(t('tab.people')) + '</button><button data-tab="journal">' + esc(t('tab.journal')) + '</button></div>' +
      '<div class="tab-body" id="tabBody"></div></aside>' +
      '</div>';
    document.getElementById('quit').onclick = () => { save(true); Net.flush(eng, runRecordMeta()); titleScreen(); };
    document.getElementById('slotsTop').onclick = () => openSlots();
    const lt = document.getElementById('langToggle');
    if (lt) lt.onclick = () => switchLang(nextLang.code, true);
    document.getElementById('notesToggle').onclick = () => { settings.notes = !settings.notes; saveSettings(); document.querySelectorAll('.scene-note').forEach((n) => { n.style.display = settings.notes ? '' : 'none'; }); };
    document.getElementById('amountsToggle').onclick = (e) => {
      settings.amounts = AMOUNT_MODES[(AMOUNT_MODES.indexOf(settings.amounts || 'marks') + 1) % AMOUNT_MODES.length]; saveSettings();
      e.currentTarget.title = t('top.amounts', { mode: t('amounts.' + settings.amounts) });
      toast(t('top.amounts', { mode: t('amounts.' + settings.amounts) }));
      if (ui.mode === 'card' && ui.view) showCard(ui.view); else if (ui.mode === 'menu' && ui.view) showMenu(ui.view, true);
    };
    document.getElementById('sideToggle').onclick = () => { ui.sideOpen = !ui.sideOpen; document.getElementById('side').classList.toggle('open', ui.sideOpen); };
    document.getElementById('tabs').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; ui.tab = b.dataset.tab; renderSide(); };
    const meters = document.getElementById('meters');
    // The meters together, then the `display: number` resources (Crowns, Renown) as plain numbers, each with what next
    // month's start will take or give under it (feedback 2026-10-15).
    const orbIds = content.order.resources.filter((id) => !content.resources[id].display);
    const numIds = content.order.resources.filter((id) => content.resources[id].display === 'number').sort((a, b) => (b === 'gold') - (a === 'gold'));
    const numberMeter = (id) => { const r = content.resources[id]; return '<div class="meter number" id="m-' + id + '" style="--c:' + esc(r.color || '#888') + '" title="' + esc(r.name + ' — ' + (r.desc || '')) + '"><span class="dot"></span><div class="num">' + Art.icon(r.icon || 'coin', 16) + '<span class="val"></span></div><div class="due"></div><div class="lbl">' + esc(r.name || id) + '</div></div>'; };
    meters.innerHTML = '<div class="meter-group">' + orbIds.map(orbMeter).join('') + '</div><div class="meter-group numbers">' + numIds.map(numberMeter).join('') + '</div>';
    ui.dueKey = null;
    function orbMeter(id) {
      const r = content.resources[id];
      return '<div class="meter" id="m-' + id + '" style="--c:' + esc(r.color || '#888') + '" title="' + esc(r.name + ' — ' + (r.desc || '')) + '">' +
        // Alignment (M20): one fill from the bottom, Lumen gold with a sun, Hollow violet with its own icon.
        '<span class="dot"></span><div class="orb"><div class="fill"></div>' + (r.min < 0 ? '<span class="ico-pos">' + Art.icon('sun', 20) + '</span><span class="ico-neg">' + Art.icon(r.icon || 'star', 20) + '</span>' : Art.icon(r.icon || 'star', 20)) + '</div>' +
        '<div class="val"></div><div class="lbl">' + esc(r.name || id) + '</div></div>';
    }
    if (DEBUG && !document.querySelector('.debug-btn')) buildDebug();
    if (!params.get('event')) buildFeedbackBar();
    renderChrome();
  }

  function renderChrome() {
    if (!eng || !eng.s) return;
    const snap = eng.snapshot();
    const when = document.getElementById('when');
    if (!when) return;
    when.innerHTML = esc(snap.month) + '<small>' + esc(t('date.sub', { year: snap.year, turn: snap.turn, max: snap.maxTurns })) + '</small>';
    let tl = '';
    for (let i = 1; i <= snap.maxTurns; i++) tl += '<i class="' + (i < snap.turn ? 'done ' : '') + (i === snap.turn ? 'now ' : '') + (eng.phaseOf(i) === 'break' ? 'summer' : '') + '"></i>';
    document.getElementById('timeline').innerHTML = tl;
    for (const r of snap.resources) {
      const el = document.getElementById('m-' + r.id); if (!el) continue;
      const min = r.min == null ? 0 : r.min, max = r.maxNow;
      const fill = el.querySelector('.fill');
      if (!fill) { /* `display: number`: the value alone */ } else if (min < 0) {   // bipolar (Alignment, M20): the fill rises from the bottom with how far you lean, in that side's colour
        fill.style.height = Math.min(100, (Math.abs(r.value) / Math.max(max, -min)) * 100) + '%'; fill.style.bottom = '0';
        el.classList.toggle('neg', r.value < 0); el.classList.toggle('pos', r.value > 0);
      } else fill.style.height = Math.max(0, Math.min(100, ((r.value - min) / (max - min)) * 100)) + '%';
      el.querySelector('.val').textContent = Math.round(r.value);
      el.classList.toggle('low', r.warn_below != null && r.value <= r.warn_below);
    }
    renderDue();
    // No count of the day's cards (M3): the day isn't planned ahead any more.
    renderSide(snap);
  }

  // Under each plain number: next month's charges and changes (rent, tuition, fading renown), from engine.upcoming().
  // Hovering lists them by label. Recomputed only when the state has moved on.
  function renderDue() {
    const key = eng.s.turn + ':' + (eng.s.hist || []).length;
    if (ui.dueKey === key) return; ui.dueKey = key;
    const items = eng.upcoming();
    for (const el of document.querySelectorAll('.meter.number')) {
      const id = el.id.slice(2), r = content.resources[id];
      const rows = items.filter((x) => x.deltas[id]).map((x) => ({ label: x.label || t('due.other'), v: Math.round(x.deltas[id]) })).filter((x) => x.v);
      const total = rows.reduce((a, x) => a + x.v, 0);
      const due = el.querySelector('.due');
      due.textContent = total ? t('due.next', { delta: (total > 0 ? '+' : '−') + Math.abs(total) }) : '';
      due.className = 'due ' + (total > 0 ? 'pos' : total < 0 ? 'neg' : '');
      el.title = r.name + ' — ' + (r.desc || '') + (rows.length ? '\n\n' + t('due.heading') + '\n' + rows.map((x) => '  ' + x.label + ' ' + (x.v > 0 ? '+' : '−') + Math.abs(x.v)).join('\n') : '');
    }
  }
  const bondLabel = (b) => t('bond.' + b);
  const shortName = (npcOrId) => { const d = typeof npcOrId === 'string' ? content.npcs[npcOrId] : npcOrId; return d ? Engine.shortName(d) : String(npcOrId); };

  function renderSide(snap) {
    snap = snap || eng.snapshot();
    const body = document.getElementById('tabBody'); if (!body) return;
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
    let h = '';
    if (ui.tab === 'you') {
      h += '<div class="sec-h">' + esc(snap.name) + '</div>';
      const panel = snap.resources.filter((r) => r.display === 'panel');
      if (panel.length) h += '<div class="panel-res">' + panel.map((r) => '<div class="pres' + (r.warn_below != null && r.value <= r.warn_below ? ' low' : '') + '" title="' + esc(r.desc || '') + '">' + Art.icon(r.icon || 'star', 16) + '<span>' + esc(r.name) + '</span><b>' + Math.round(r.value) + '</b></div>').join('') + '</div>';
      const tracks = snap.tracks || [];
      if (tracks.length || snap.gpa) {
        h += '<div class="sec-h">' + esc(t('side.studies')) + (snap.gpa ? '<span class="gpa">' + esc(t('side.gpa', { gpa: snap.gpa.toFixed(2) })) + '</span>' : '') + '</div>';
        for (const tr of tracks) {
          let line = '';
          if (tr.kind === 'course') line = tr.status === 'enrolled' ? '' : tr.grades.length ? t('side.grades', { grades: tr.grades.join(' ') }) : '';
          else if (tr.kind === 'job' && tr.status === 'member' && snap.phase !== 'term') line = t('side.noShifts', { rank: tr.rank || '' });
          else if (tr.kind === 'job' && tr.done) line = t('side.shiftsDone', { rank: tr.rank || '' });
          else if (tr.kind === 'club' || tr.kind === 'job') line = t('side.rankLine', { rank: tr.rank || '', perf: tr.perf, due: tr.due });
          else if (tr.kind === 'thesis') line = t('side.progress', { n: tr.progress });
          else if (tr.kind === 'society') line = t('side.society');
          else if (tr.status === 'applied') line = t('side.applied');
          // An enrolled course as it stands (step 5): preparation toward the exam, when it is, and today's odds.
          const standing = tr.study != null;
          const when = standing ? (tr.examIn === 0 ? t('side.examNow') : tr.examIn === 1 ? t('side.examNext') : t('side.examIn', { n: tr.examIn })) : '';
          const body = standing
            ? '<p>' + esc(t('side.prep', { n: tr.study, cap: tr.studyCap }) + ' · ' + when) + '</p><div class="prep"><b style="width:' + Math.round((tr.study / Math.max(1, tr.studyCap)) * 100) + '%"></b></div>'
            : '<p>' + esc(line) + '</p>';
          const right = tr.kind === 'club' || tr.kind === 'job' ? t('side.perf', { n: tr.perf }) : standing ? t('side.passToday', { p: tr.pass }) : '';
          h += '<div class="state track ' + esc(tr.kind) + '"' + (standing ? ' title="' + esc(t('side.oddsTip', { pass: tr.pass, top: tr.top })) + '"' : '') + '>' + Art.icon(tr.kind === 'job' ? 'coin' : tr.kind === 'club' ? 'group' : tr.kind === 'society' ? 'map' : 'book', 20) + '<div class="grow"><b>' + esc(tr.levelName || tr.name) + '</b>' + body + '</div>' + (right ? '<span class="left">' + esc(right) + '</span>' : '') + '</div>';
        }
      }
      if (snap.spells.length) {
        h += '<div class="sec-h">' + esc(t('side.spells')) + '</div>';
        for (const sp of snap.spells) h += '<div class="state spell">' + Art.icon(sp.art || 'wand', 20) + '<div><b>' + esc(sp.name) + ' ' + ['', 'I', 'II', 'III'][sp.level] + '</b><p>' + esc(sp.desc || '') + '</p></div><span class="left">' + esc(t('side.spellCost', { n: sp.cost })) + '</span></div>';
      }
      for (const s of snap.skills) {
        const pct = Math.min(100, (s.value / (s.max || 100)) * 100);   // the skill's real range (was drawn against 60: B8)
        h += '<div class="skill" title="' + esc(s.desc || '') + '">' + Art.icon(s.icon || 'star', 18) + '<div><div class="nm">' + esc(s.name) + '</div><div class="bar"><b style="width:' + pct + '%"></b></div></div><div class="v">' + Math.round(s.value) + '</div></div>';
      }
      h += '<div class="sec-h">' + esc(t('side.conditions')) + '</div>';
      if (!snap.states.length) h += '<div class="empty">' + esc(t('side.nothing')) + '</div>';
      const order = { origin: 0, class: 1, club: 2, job: 3 };
      snap.states.slice().sort((a, b) => (order[a.kind] ?? 9) - (order[b.kind] ?? 9)).forEach((s) => {
        h += '<div class="state ' + esc(s.kind || '') + '">' + Art.icon(s.art || 'sparkle', 20) + '<div><b>' + esc(s.name) + '</b><p>' + esc(s.desc) + '</p></div>' + (s.left != null ? '<span class="left">' + esc(t('side.monthsLeft', { n: s.left })) + '</span>' : '') + '</div>';
      });
    } else if (ui.tab === 'people') {
      if (!snap.npcs.length) h += '<div class="empty">' + esc(t('side.noPeople')) + '</div>';
      for (const n of snap.npcs) {
        // One bar per character (M37): its length is how close you are (rel; a rival's runs red), its colour how
        // friendly ↔ romantic it is (spark's share).
        const rel = n.rel, w = Math.min(100, Math.abs(rel));
        const mix = (a, b, f) => '#' + [0, 2, 4].map((i) => Math.round(parseInt(a.substr(i, 2), 16) * (1 - f) + parseInt(b.substr(i, 2), 16) * f).toString(16).padStart(2, '0')).join('');
        const col = rel < 0 ? '#ff8a80' : mix('7fd18b', 'e0708a', n.romance ? Math.min(1, (n.spark || 0) / 60) : 0);
        h += '<div class="person" data-id="' + esc(n.id) + '">' + Art.avatar(n, 44) + '<div class="info"><div class="nm">' + esc(n.name) + (n.bond !== 'none' ? '<span class="bond-badge bond-' + esc(n.bond) + '">' + esc(bondLabel(n.bond)) + '</span>' : '') + '</div>' +
          '<div class="ttl">' + esc(n.title || '') + '</div>' +
          '<div class="relbar' + (rel < 0 ? ' neg' : '') + '" title="' + esc(t('side.relationship', { n: rel }) + (n.romance ? ' · ' + t('side.romance', { n: n.spark }) : '')) + '"><b style="width:' + w + '%;background:' + col + '"></b>' + (n.romance && n.spark > 0 ? '<i style="left:' + Math.min(100, n.spark) + '%"></i>' : '') + '</div>' +
          '<div class="desc">' + esc(n.desc || '') + '<br><br>' + esc(t('side.relationship', { n: rel })) + (n.romance ? ' · ' + esc(t('side.romance', { n: n.spark })) : '') + '</div></div></div>';
      }
    } else {
      // The threads you are following (X11): each arc's act, clues found and leads, above the log.
      const arcs = Object.keys(content.arcs || {}).sort((a, b) => (content.arcs[b].canon === 'hard') - (content.arcs[a].canon === 'hard'));
      for (const id of arcs) {
        const j = eng.journalOf(id); if (!j || (!j.clues.length && !j.leads.length && !j.act)) continue;
        if (!j.clues.length && !j.leads.length && content.arcs[id].canon !== 'hard') continue;
        h += '<div class="thread"><div class="th-head"><b>' + esc(j.name) + '</b>' + (j.actName ? '<span class="th-act">' + esc(t('journal.act', { n: j.act, of: j.acts, name: j.actName })) + '</span>' : '') + '</div>';
        if (j.clues.length) h += '<div class="th-sub">' + esc(t('journal.clues')) + '</div>' + j.clues.map((c) => '<div class="th-row clue' + (c.key ? ' key' : '') + '"' + (c.key ? ' title="' + esc(t('journal.keyClue')) + '"' : '') + '><b>' + esc(c.name) + '</b> ' + esc(c.text) + '</div>').join('');
        if (j.leads.length) h += '<div class="th-sub">' + esc(t('journal.leads')) + '</div>' + j.leads.map((c) => '<div class="th-row lead' + (c.followed ? ' done' : '') + '"><b>' + esc(c.name) + '</b> ' + esc(c.text) + (c.followed ? ' <i>(' + esc(t('journal.followed')) + ')</i>' : '') + '</div>').join('');
        h += '</div>';
      }
      const log = snap.log.slice().reverse();
      if (h && log.length) h += '<div class="th-sub log-head">' + esc(t('journal.log')) + '</div>';
      if (!log.length) h += '<div class="empty">' + esc(t('side.emptyJournal')) + '</div>';
      for (const l of log.slice(0, 120)) {
        // Re-render title and choice in the current language when possible.
        const ev = content.events[l.id];
        const title = ev ? eng.interpLogged(ev.title, l) : l.title;
        const opt = ev && l.key ? ev.options.find((o) => o.key === l.key) : null;
        const choice = opt ? eng.interpLogged(opt.label, l) : l.choice;
        const say = l.sayIds && l.sayIds.length && l.sayIds.every((id) => eng.sayIndex[id]) ? l.sayIds.map((id) => eng.interpLogged(eng.sayIndex[id].text, l)).join(' ') : l.say;
        h += '<div class="log-item"><div class="when">' + esc(t('journal.when', { month: eng.monthName(l.turn), year: eng.yearOf(l.turn) })) + '</div><b>' + esc(title) + '</b> — <span class="ch">' + esc(choice) + '</span>' + (say ? '<div class="say">' + esc(say) + '</div>' : '') + (l.n != null ? journalFeedback(l.n) : '') + '</div>';
      }
    }
    body.innerHTML = h;
    body.querySelectorAll('.person').forEach((p) => { p.onclick = () => p.classList.toggle('open'); });
    body.querySelectorAll('.fb-mini button').forEach((b) => {
      const n = Number(b.parentNode.dataset.n);
      b.onclick = () => (b.dataset.r ? quickRate(n, b.dataset.r) : openFeedback([n]));
    });
  }

  function setPreview(affects) {
    document.querySelectorAll('.meter').forEach((m) => m.classList.toggle('preview', !!affects && affects.includes(m.id.slice(2))));
  }
  function toast(text) {
    if (!text) return;
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = text;
    document.body.appendChild(el); setTimeout(() => el.remove(), 2600);
  }
  // Time of day (M7): the page takes a faint tint of the slot being played.
  // A card or screen without a slot keeps the colour of the last one.
  function setSlotTint(slot) { if (slot) document.body.dataset.slot = slot; }
  function floatDeltas(deltas) {
    for (const [k, v] of Object.entries(deltas || {})) {
      const el = document.getElementById('m-' + k);
      if (!el || !v) continue;
      const chip = document.createElement('div');
      chip.className = 'float-chip ' + (v > 0 ? 'pos' : 'neg');
      chip.textContent = (v > 0 ? '+' : '') + Math.round(v);
      el.appendChild(chip);
      setTimeout(() => chip.remove(), 1700);
    }
  }

  /* ------------------------------------------------------------------ flow */
  function step(r) {
    save();
    renderChrome();
    route(r);
    renderFeedbackBar();
  }
  function route(r) {
    if (r.kind === 'month') { Net.flush(eng, runRecordMeta()); return showMonth(r); }
    if (r.kind === 'map') return showMap(r.view);
    if (r.kind === 'ending') {
      archiveRun(eng); store.del(SAVE_KEY); clearTimeout(serverSaveTimer);   // a pending autosave push must not resurrect it
      // Delete only after an autosave push already in flight has landed, or it would bring the save back.
      if (Net.available) { Net.flush(eng, runRecordMeta(), { final: true }); pendingPush.then(() => Net.deleteSave('auto')).catch(() => {}); }
      recordSeen(eng);
      return showEnding(r);
    }
    if (r.onShow) floatDeltas(r.onShow.deltas);
    if (r.view.type === 'menu') return showMenu(r.view);
    return showCard(r.view);
  }
  function next() { ui.busy = false; step(eng.advance()); }
  let serverSaveTimer = null, pendingPush = Promise.resolve();
  function save(now) {
    if (!eng || !eng.s || eng.s.ended || params.get('event')) return;
    const json = eng.save();
    store.set(SAVE_KEY, json);
    if (!Net.available) return;
    clearTimeout(serverSaveTimer);
    const push = () => { pendingPush = Net.putSave('auto', json).catch((e) => console.warn('[net] save', e.message)); return pendingPush; };
    if (now) push(); else serverSaveTimer = setTimeout(push, 1500);
  }

  function resolve(key) {
    let out;
    try { out = eng.choose(key); } catch (e) { console.error(e); ui.busy = false; return; }
    renderChrome();
    floatDeltas(out.deltas);
    if (out.say || out.notes.length || out.checks.length || hasVisibleDeltas(out.deltas)) showOutcome(out);
    else next();
  }
  function hasVisibleDeltas(d) { return Object.keys(d).some((k) => content.skills[k] || k.startsWith('rel:') || k.startsWith('spark:') || (content.resources[k] && content.resources[k].display === 'panel')); }

  /* ------------------------------------------------------------------ card */
  const TAGLINE_TAGS = ['class', 'club', 'job', 'social', 'romance', 'study', 'mystery', 'danger', 'crisis', 'festival', 'money', 'nature', 'home', 'rival', 'exam', 'story', 'magic'];
  function cardTagline(v) {
    for (const tag of v.tags || []) if (TAGLINE_TAGS.includes(tag)) return t('tag.' + tag);
    return t('tag.default');
  }
  function actorRow(a) {
    if (!a) return '';
    const n = Object.assign({ id: a.id }, content.npcs[a.id], a);
    const rel = a.rel > 0 ? '+' + a.rel : String(a.rel);
    return '<div class="actor-row">' + Art.avatar(n, 40) + '<div class="who"><b>' + esc(a.name) + '</b><span>' + esc(a.title || '') + ' · ' + rel + '</span></div>' +
      (a.bond && a.bond !== 'none' ? '<span class="bond-badge bond-' + esc(a.bond) + '">' + esc(bondLabel(a.bond)) + '</span>' : '') + '</div>';
  }
  function cardShell(inner, art, tags, seed, extraClass) {
    const deck = document.getElementById('deck');
    deck.querySelectorAll('.card').forEach((c) => c.remove());
    const card = document.createElement('div');
    card.className = 'card enter ' + (extraClass || '');
    card.innerHTML = (art !== false ? '<div class="card-art">' + Art.scene(art, tags, seed) + '</div>' : '') + inner;
    deck.appendChild(card);
    return card;
  }
  const sceneNote = (scene, hidden) => scene ? '<p class="scene-note"' + (hidden ? ' style="display:none"' : '') + '>' + esc(t('card.illustration', { text: scene })) + '</p>' : '';
  // A challenge names its kind and the skill(s) it rolls (B24): "Enchanting · Charm".
  const challengeLabel = (kind, using) => t('challenge.' + kind) + (using ? ' · ' + using.split('+').map(skillName).join(' + ') : '');
  const swingText = (c) => (c.swing ? ' · ' + t('swing.' + c.swing) : '');
  const checkText = (c) => c.exam ? t('check.examButton', { skill: c.using.split('+').map(skillName).join(' + '), p: c.p, top: c.top }) + swingText(c)
    : c.combat ? t('check.combatButton', { p: c.p, cost: c.cost }) + swingText(c)
    : c.challenge ? t('check.challengeButton', { kind: challengeLabel(c.skill, c.using), p: c.p }) + swingText(c) : t('check.button', { skill: skillName(c.skill), p: c.p });
  // The roll on an option's button (B24, M11): combat, the future minigame, is marked apart from skill checks.
  const checkLine = (c) => (c ? '<span class="chk roll' + (c.combat ? ' combat' : '') + '">' + Art.icon(c.combat ? 'sword' : c.exam ? 'scroll' : 'dice', 12) + ' ' + esc(checkText(c)) + '</span>' : '');

  function showCard(v) {
    ui.mode = 'card'; ui.view = v; ui.busy = false; setSlotTint(v.slot);
    closeOverlay();
    const story = v.type === 'story' || v.options.length === 1;
    const L = story ? v.options[0] : v.options.find((o) => o.key === 'left');
    const R = story ? v.options[0] : v.options.find((o) => o.key === 'right');
    const card = cardShell(
      '<div class="card-label left">' + esc(L.label) + '</div><div class="card-label right">' + esc(R.label) + '</div>' +
      '<div class="card-body">' + actorRow(v.actor) + '<h2>' + esc(v.title) + '</h2><p class="text">' + esc(v.text) + '</p>' +
      sceneNote(v.scene, !settings.notes) + '</div>',
      v.art, v.tags, v.id);
    card.querySelector('.card-art').insertAdjacentHTML('beforeend', '<span class="tagline">' + esc(cardTagline(v)) + '</span>' + (v.src === 'queued' && !(v.tags || []).includes('story') ? '<span class="src">' + esc(t('card.consequence')) + '</span>' : '') +
      (v.slot ? '<span class="slotchip">' + esc([t('slot.' + v.slot), v.place && content.places[v.place] ? content.places[v.place].name : null, v.track && content.tracks[v.track] ? content.tracks[v.track].name : null].filter(Boolean).join(' · ')) + '</span>' : ''));
    const choices = document.getElementById('choices');
    const pv = (o) => previewHtml(v, o);
    const chk = (o) => (o.hint ? '<span class="chk">' + esc(o.hint) + '</span>' : '') + checkLine(o.check) + pv(o);
    if (story) {
      choices.innerHTML = '<button class="choice single" data-k="' + esc(L.key) + '"><span>' + esc(L.label) + chk(L) + '</span></button>';
    } else {
      const lock = (o) => o.disabled ? ' disabled title="' + esc(o.locked || (o.poor ? t('card.cantAfford', { cost: o.poor }) : null) || o.hint || t('card.notAvailable')) + '"' : '';
      const U = v.options.find((o) => o.key === 'up');
      choices.innerHTML = '<button class="choice left" data-k="left"' + lock(L) + '><span class="arrow">' + (L.disabled ? '🔒' : '←') + '</span><span>' + esc(L.label) + chk(L) + '</span></button>' +
        '<button class="choice right" data-k="right"' + lock(R) + '><span>' + esc(R.label) + chk(R) + '</span><span class="arrow">' + (R.disabled ? '🔒' : '→') + '</span></button>' +
        (U ? '<button class="choice up" data-k="up"' + (U.disabled ? ' disabled title="' + esc(t('spell.short')) + '"' : '') + '><span class="arrow">' + (U.disabled ? '🔒' : '↑') + '</span><span>' + esc(U.label) + '<span class="chk">' + esc(t('spell.button', { spell: spellName(U.spell.id), level: ['', 'I', 'II', 'III'][U.spell.level], cost: U.spell.cost })) + '</span>' + pv(U) + '</span></button>' : '');
    }
    choices.querySelectorAll('.choice').forEach((b) => {
      const opt = v.options.find((o) => o.key === b.dataset.k);
      b.onmouseenter = () => setPreview(opt.affects);
      b.onmouseleave = () => setPreview(null);
      b.onclick = () => commitCard(story ? 'right' : b.dataset.k);
    });
    const UP = v.options.find((o) => o.key === 'up');
    attachSwipe(card, {
      move(dx) {
        const side = dx < 0 ? 'left' : 'right';
        const a = Math.min(1, Math.abs(dx) / 90);
        card.querySelector('.card-label.left').style.opacity = side === 'left' ? a : 0;
        card.querySelector('.card-label.right').style.opacity = side === 'right' ? a : 0;
        setPreview(Math.abs(dx) > 25 ? (side === 'left' ? L : R).affects : null);
      },
      commit(dir) { resolveCardDir(dir); },
      allow(dir) { if (dir === 'up') return !!UP && !UP.disabled; return story || !(dir === 'left' ? L : R).disabled; },
    });
  }
  // Values are stored with fractions (the coursework curve); show whole numbers, and one decimal only below 1.
  function shownAmount(x) { const r = Math.round(x); return r === 0 && x > 0 ? String(Math.round(x * 10) / 10) : String(r); }
  // How amounts show (feedback 2026-10-15; a setting): 'marks', one to five pips by size tier; 'numbers'; or 'icons', the
  // icon alone. Colour gives the direction, so there is no sign. Crowns and Mana are always exact.
  const AMOUNT_MODES = ['marks', 'numbers', 'icons'];
  const TIER_WORDS = ['tiny', 'small', 'medium', 'large', 'huge'];
  const exactAmount = (k) => k === 'mana' || k === 'gold';
  function amountShown(k, lo, hi) {
    if (hi == null) hi = lo;
    const big = Math.abs(hi) >= Math.abs(lo) ? hi : lo;
    const mode = exactAmount(k) ? 'numbers' : settings.amounts || 'marks';
    if (mode === 'icons') return { text: '', title: '' };
    if (mode === 'marks') { const n = eng.sizeOf(k, big); return { text: '•'.repeat(n + 1), title: t('size.' + TIER_WORDS[n]) }; }
    const a = Math.abs(Math.round(lo)), b = Math.abs(Math.round(hi));
    return { text: lo === hi ? shownAmount(Math.abs(lo)) : Math.min(a, b) + '~' + Math.max(a, b), title: '' };
  }
  const deltaClass = (lo, hi) => (hi == null ? (lo > 0 ? 'pos' : lo < 0 ? 'neg' : '') : hi > 0 && lo >= 0 ? 'pos' : lo < 0 && hi <= 0 ? 'neg' : hi > 0 ? 'pos' : '');
  function skillName(id) { return (content.skills[id] && content.skills[id].name) || id; }
  function spellName(id) { return (content.spells[id] && content.spells[id].name) || id; }
  // Exact outcome preview (design §8.3) for one option: one line of changes, or one line per outcome.
  function previewHtml(v, o) {
    let pv;
    try { pv = eng.preview(v.id, o.key, v.actor ? v.actor.id : null); } catch (e) { return ''; }
    const amt = (k, r) => {
      const d = deltaLook(k); if (!d) return '';
      const a = amountShown(k, r[0], r[1]);
      return '<i class="' + deltaClass(r[0], r[1]) + '" title="' + esc(d.name + (a.title ? ' · ' + a.title : '')) + '">' + Art.icon(d.icon, 12) + esc(a.text) + '</i>';
    };
    const line = (d) => Object.entries(d).filter(([, r]) => r[0] || r[1]).map(([k, r]) => amt(k, r)).join('');
    const label = (pth) => {
      const d = pth.labels[0]; if (!d) return '';
      if (d.kind === 'check') return (d.choice === 0 ? '✓ ' : '✗ ');
      if (d.kind === 'challenge') return t('challenge.' + ['win', 'partial', 'lose'][d.choice]) + ' ';
      if (d.kind === 'exam') return ['A', 'B', 'C', 'F'][d.choice] + ' ';
      return '';
    };
    const more = pv.follows ? '<i class="more" title="' + esc(t('preview.follows')) + '">…</i>' : '';
    if (pv.paths.length <= 1) { const l = line(pv.deltas); return l || more ? '<span class="pv">' + l + more + '</span>' : ''; }
    const paths = pv.paths.slice().sort((a, b) => b.p - a.p);
    return '<span class="pv multi">' + paths.slice(0, 3).map((pth) => '<span class="pvl"><b>' + esc(label(pth)) + Math.round(pth.p * 100) + '%</b>' + (line(pth.deltas) || '—') + (pth.follows ? '<i class="more">…</i>' : '') + '</span>').join('') + (paths.length > 3 ? '<span class="pvl">…</span>' : '') + '</span>';
  }
  function commitCard(dir) {
    if (ui.busy || ui.mode !== 'card') return;
    const card = document.querySelector('#deck .card');
    if (!card) return;
    const v = ui.view;
    const story = v.type === 'story' || v.options.length === 1;
    const opt = v.options.find((o) => o.key === dir);
    if (!story && opt && opt.disabled) return;
    flyOut(card, dir);
    resolveCardDir(dir);
  }
  function resolveCardDir(dir) {
    if (ui.busy) return;
    ui.busy = true;
    setPreview(null);
    const v = ui.view;
    const story = v.type === 'story' || v.options.length === 1;
    const key = story ? v.options[0].key : dir;
    setTimeout(() => resolve(key), 260);
  }
  function flyOut(card, dir) {
    const s = dir === 'left' ? -1 : 1;
    card.classList.remove('dragging');
    card.style.transform = dir === 'up' ? 'translate(0, -' + Math.round(window.innerHeight * 0.9) + 'px)' : 'translate(' + (s * (window.innerWidth * 0.9)) + 'px, 40px) rotate(' + (s * 24) + 'deg)';
    card.style.opacity = '0';
  }

  function attachSwipe(card, h) {
    let x0 = 0, y0 = 0, dx = 0, down = false, moved = false;
    card.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || ui.busy) return;
      down = true; moved = false; x0 = e.clientX; y0 = e.clientY; dx = 0;
      card.setPointerCapture(e.pointerId); card.classList.add('dragging'); card.classList.remove('enter');
    });
    card.addEventListener('pointermove', (e) => {
      if (!down) return;
      dx = e.clientX - x0; const dy = (e.clientY - y0) * (h.allow && h.allow('up') ? 0.7 : 0.25);
      if (Math.abs(dx) > 4) moved = true;
      card.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (dx / 16) + 'deg)';
      if (h.move) h.move(dx);
    });
    let dy = 0;
    card.addEventListener('pointermove', (e) => { if (down) dy = e.clientY - y0; });
    const end = () => {
      if (!down) return; down = false;
      card.classList.remove('dragging');
      const dir = dy < -100 && Math.abs(dx) < 80 ? 'up' : dx < 0 ? 'left' : 'right';
      if ((dir === 'up' || Math.abs(dx) > 100) && (!h.allow || h.allow(dir))) { flyOut(card, dir); h.commit(dir); }
      else {
        card.style.transform = '';
        if (h.move) h.move(0);
        if (!moved && h.tap) h.tap();
      }
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);
  }

  /* ------------------------------------------------------------------ outcome */
  function noteText(n) {
    if (n.kind === 'meet') return t('note.meet', { name: content.npcs[n.npc] ? content.npcs[n.npc].name : n.npc });
    // A rivalry can sit alongside friendship (respect with an edge), so say so when it starts (B14).
    if (n.kind === 'bond') return t(n.status === 'rival' ? 'note.bondRival' : 'note.bond', { name: shortName(n.npc), status: bondLabel(n.status) });
    if (n.kind === 'gain' || n.kind === 'lose') return t('note.' + n.kind, { state: content.states[n.state] ? content.states[n.state].name : n.state });
    if (n.kind === 'spell') {
      const lv = ['', 'I', 'II', 'III'][n.level] || n.level;
      // The spell's reward (L-6): the skill it trained, "+3 Arcana".
      const bonus = Object.entries(n.bonus || {}).filter(([, v]) => v > 0).map(([k, v]) => '+' + Math.round(v) + ' ' + skillName(k)).join(', ');
      return bonus ? t('note.spellBonus', { spell: spellName(n.spell), level: lv, bonus }) : t('note.spell', { spell: spellName(n.spell), level: lv });
    }
    const tn = (id) => (content.tracks[id] ? content.tracks[id].name : id);
    if (n.kind === 'grade') {
      const track = ((content.tracks[n.track] || {}).level_names || tn(n.track)).split(/\s*[,，、]\s*/)[n.level - 1] || tn(n.track);
      if (n.bar == null) return t('note.grade', { track, grade: n.grade });
      return t('note.gradeWhy', { track, grade: n.grade, skill: (n.skills || []).map(skillName).join(' + '), value: n.value, bar: n.bar, p: n.pass });
    }
    if (n.kind === 'regrade') {
      const track = ((content.tracks[n.track] || {}).level_names || tn(n.track)).split(/\s*[,，、]\s*/)[n.level - 1] || tn(n.track);
      return t('note.regrade', { track, from: n.from, grade: n.grade });
    }
    if (n.kind === 'leave' && content.tracks[n.track] && content.tracks[n.track].kind === 'thesis') return t('note.thesisDone', { track: tn(n.track) });
    if (['enrol', 'join', 'leave', 'promote', 'dropped'].includes(n.kind)) return t('note.' + n.kind, { track: tn(n.track) });
    if (n.kind === 'missed') return t('note.missed', { track: tn(n.track), n: n.n });
    if (n.kind === 'wage') return t('note.wage', { track: tn(n.track), gold: n.gold });
    if (n.kind === 'attend') return n.left == null ? t('note.attendBreak', { track: tn(n.track) }) : t('note.attend', { track: tn(n.track), n: n.left });
    if (n.kind === 'discover') return t('note.discover', { place: content.places[n.place] ? content.places[n.place].name : n.place });
    if (n.kind === 'clue') return t('note.clue');
    if (n.kind === 'fact') return t('note.fact', { name: shortName(n.fact.split('.')[0]) });
    return n.text || '';
  }
  // A delta's icon and name: resources, skills, relationships and track numbers (performance, progress, exam preparation).
  function deltaLook(k) {
    if (content.resources[k]) return { icon: content.resources[k].icon, name: content.resources[k].name };
    if (content.skills[k]) return { icon: content.skills[k].icon, name: content.skills[k].name };
    const [kind, id] = k.split(':');
    if ((kind === 'rel' || kind === 'spark') && content.npcs[id]) return { icon: kind === 'spark' ? 'rose' : 'group', name: shortName(id), npc: true, kind };
    if (/^(perf|progress|study)$/.test(kind) && content.tracks && content.tracks[id]) return { icon: kind === 'study' ? 'book' : 'star', name: t('chip.' + kind, { track: content.tracks[id].name, delta: '' }).trim(), kind };
    return null;
  }
  function chipsFor(out) {
    let h = '';
    for (const c of out.checks || []) {
      if (c.challenge) h += '<span class="chip ' + (c.result === 'win' ? 'check-ok' : c.result === 'partial' ? 'check-part' : 'check-fail') + (c.challenge === 'combat' ? ' combat' : '') + '">' + Art.icon(c.challenge === 'combat' ? 'sword' : 'dice', 14) + esc(t('check.challengeChip', { kind: challengeLabel(c.challenge, c.skill), p: c.p, result: t('challenge.' + c.result) })) + '</span>';
      else h += '<span class="chip ' + (c.ok ? 'check-ok' : 'check-fail') + '">' + Art.icon('dice', 14) + esc(t('check.chip', { skill: skillName(c.skill), p: c.p, result: t(c.ok ? 'check.success' : 'check.failed') })) + '</span>';
    }
    // A gain at the cap (M37): shown, marked as at the maximum.
    for (const [k, v] of Object.entries(out.capped || {})) {
      if ((out.deltas || {})[k]) continue;
      const [kind, id] = k.split(':'); if (!content.npcs[id]) continue;
      h += '<span class="chip pos capped">' + Art.icon(kind === 'spark' ? 'rose' : 'group', 14) + esc(t(kind === 'spark' ? 'chip.love' : 'chip.rel', { name: shortName(id), delta: amountShown(k, v).text }).trim() + ' · ' + t('chip.max')) + '</span>';
    }
    for (const [k, v] of Object.entries(out.deltas || {})) {
      if (!v) continue;
      const d = deltaLook(k); if (!d) continue;
      const a = amountShown(k, v), cls = v > 0 ? 'pos' : 'neg';
      // Track numbers (design §6.2, §7.3) and relationships read as a phrase; the rest as a name and an amount.
      const label = d.kind === 'spark' || d.kind === 'rel' ? t(d.kind === 'spark' ? 'chip.love' : 'chip.rel', { name: d.name, delta: a.text })
        : d.kind ? t('chip.' + d.kind, { track: content.tracks[k.split(':')[1]].name, delta: a.text }) : d.name + (a.text ? ' ' + a.text : '');
      h += '<span class="chip ' + cls + '"' + (a.title ? ' title="' + esc(a.title) + '"' : '') + '>' + Art.icon(d.icon, 14) + esc(label.trim()) + '</span>';
    }
    // A new spell gets a banner of its own, first in line (B4); other notes stay chips.
    for (const n of out.notes || []) if (n.kind === 'spell') h = '<div class="spell-banner">' + Art.icon('wand', 20) + '<span>' + esc(noteText(n)) + '</span></div>' + h;
    for (const n of out.notes || []) if (n.kind !== 'spell') h += '<span class="chip note">' + esc(noteText(n)) + '</span>';
    return h;
  }
  function showOutcome(out) {
    ui.mode = 'outcome'; ui.busy = false;
    const card = cardShell('<div class="card-body">' + (out.say ? '<p class="say">' + esc(out.say) + '</p>' : '<p class="say" style="opacity:.6">…</p>') +
      '<div class="chips">' + chipsFor(out) + '</div></div><div class="tap-note">' + esc(t('outcome.tap')) + '</div>', false, null, null, 'outcome');
    card.style.background = 'linear-gradient(180deg, #f6efdd, #ece0c2)';
    document.getElementById('choices').innerHTML = '<button class="choice single" id="contBtn">' + esc(t('outcome.continue')) + '</button>';
    document.getElementById('contBtn').onclick = () => continueOutcome();
    renderFeedbackBar();
    attachSwipe(card, { commit() { setTimeout(continueOutcome, 200); }, tap() { flyOut(card, 'right'); setTimeout(continueOutcome, 200); } });
  }
  // The last choice's outcome, rebuilt from the run log, with its say lines in the current language.
  function lastOutcome() {
    const h = eng.s.hist, rec = h.slice().reverse().find((x) => x.t === 'card');
    if (!rec || !rec.out || rec.choice == null) return null;
    const l = eng.s.log[eng.s.log.length - 1];
    let say = rec.out.say;
    if (l && l.n === rec.n && l.sayIds && l.sayIds.length) {
      const parts = l.sayIds.map((id) => { const [sid, who] = id.split('@'); const e = eng.sayIndex[sid]; return e ? eng.interpLogged(e.text, l, who || l.actor) : null; });
      if (parts.every((x) => x != null)) say = parts.join(' ');
    }
    return { say, deltas: rec.out.deltas || {}, notes: rec.out.notes || [], checks: rec.out.checks || [] };
  }
  function continueOutcome() {
    if (ui.mode !== 'outcome' || ui.busy) return;
    ui.busy = true;
    next();
  }

  /* ------------------------------------------------------------------ menu */
  // A course up front (M4): what it tests, its exam, its spells, and the pass chance if the exam were today.
  function courseLine(c) {
    if (!c) return '';
    // The exam tier is a legacy word or a ladder one (`standard`, `standard+2`): an offset reads as harder or easier.
    const m = /^standard([+-]\d+)?$/.exec(c.exam || ''), tier = m ? (m[1] ? (+m[1] > 0 ? 'hard' : 'easy') : 'standard') : c.exam;
    const parts = [t('course.tests', { skill: c.skills.map(skillName).join(' + ') }), t('course.exam', { tier: t('tier.' + tier), p: c.pass })];
    if (c.teaches.length) parts.push(t('course.teaches', { spells: c.teaches.map(spellName).join(', ') }));
    return '<small class="course">' + Art.icon('scroll', 12) + ' ' + esc(parts.join(' · ')) + '</small>';
  }
  // A job up front (M23): a new hire's pay per shift, read from the job's cards, and the shifts a term asks for.
  function jobLine(j) {
    if (!j) return '';
    return '<small class="course">' + Art.icon('coin', 12) + ' ' + esc(t('job.outlook', { gold: j.shift, n: j.due })) + '</small>';
  }
  // What switching club or job costs (M35): the one you leave, with its rank and performance.
  function switchLine(sw) {
    if (!sw || !content.tracks[sw.from]) return '';
    const d = content.tracks[sw.from], rank = (d.ranks || '').split(/\s*[,，、]\s*/)[sw.rank] || '';
    return '<small class="course warn">' + esc(t('track.switch', { from: d.name, rank, perf: sw.perf })) + '</small>';
  }
  // Every menu opens with a lead-in card (feedback 2026-10-15): the scene alone, no options and no outcome, and one
  // button that says a choice follows. The menu after it shows the title, a prompt and the options.
  function showMenuLead(v) {
    ui.mode = 'lead'; ui.view = v; ui.busy = false; setSlotTint(v.slot);
    closeOverlay();
    const card = cardShell('<div class="card-body">' + actorRow(v.actor) + '<h2>' + esc(v.title) + '</h2><p class="text">' + esc(v.text) + '</p>' + sceneNote(v.scene, !settings.notes) + '</div>', v.art, v.tags, v.id);
    card.querySelector('.card-art').insertAdjacentHTML('beforeend', '<span class="tagline">' + esc(t('menu.tagline')) + '</span>');
    const choices = document.getElementById('choices');
    choices.innerHTML = '<button class="choice single" id="leadBtn"><span>' + esc(v.pick > 1 ? t('menu.leadMany', { n: v.pick }) : t('menu.lead')) + '</span></button>';
    const open = () => { if (ui.mode !== 'lead' || ui.view !== v) return; ui.mode = 'leading'; setTimeout(() => showMenu(v, true), 220); };
    ui.leadGo = () => { if (ui.mode === 'lead') { flyOut(card, 'right'); open(); } };
    document.getElementById('leadBtn').onclick = ui.leadGo;
    attachSwipe(card, { commit: open, tap: ui.leadGo });
  }
  function showMenu(v, led) {
    if (!led) return showMenuLead(v);
    ui.mode = 'menu'; ui.view = v; ui.busy = false; ui.multi = v.pick > 1 ? [] : null;
    const deck = document.getElementById('deck'); deck.querySelectorAll('.card').forEach((c) => c.remove());
    document.getElementById('choices').innerHTML = '';
    const opts = v.options.map((o, i) => {
      if (o.poor && !o.locked) o = Object.assign({}, o, { locked: t('card.cantAfford', { cost: o.poor }) });
      const aff = o.affects.map((id) => content.resources[id] ? Art.icon(content.resources[id].icon, 14) : '').join('');
      return '<button class="opt' + (o.locked ? ' locked' : '') + '" data-k="' + esc(o.key) + '"' + (o.disabled ? ' disabled' : '') + '><span class="num">' + (i < 9 ? i + 1 : '') + '</span><b>' + (o.locked ? '🔒 ' : '') + esc(o.label) + '</b>' +
        (o.locked ? '<small class="why">' + esc(o.locked) + '</small>' : '') +
        (o.hint ? '<small>' + esc(o.hint) + '</small>' : '') + courseLine(o.course) + jobLine(o.job) + switchLine(o.switching) + (previewHtml(v, o) || (aff ? '<span class="aff">' + aff + '</span>' : '')) + '</button>';
    }).join('');
    openOverlay('<div class="modal dark"><div class="modal-art">' + Art.scene(v.art, v.tags, v.id) + '</div><div class="modal-body">' + (v.actor ? actorRow(v.actor).replace('actor-row', 'actor-row" style="color:var(--text)') : '') +
      '<h2>' + esc(v.title) + '</h2><p class="text prompt">' + esc(v.pick > 1 ? t('menu.promptMany', { n: v.pick }) : t('menu.prompt')) + '</p>' +
      '<div class="opt-grid">' + opts + '</div>' + (ui.multi ? '<div class="row" style="margin-top:14px"><button class="btn primary grow" id="multiGo" disabled style="width:100%">' + esc(t('menu.confirm', { n: 0, max: v.pick })) + '</button></div>' : '') + '</div></div>');
    if (ui.multi) document.getElementById('multiGo').onclick = () => { if (ui.multi.length) { const keys = ui.multi.slice(); ui.busy = true; closeOverlay(); setPreview(null); resolve(keys); } };
    document.querySelectorAll('.opt').forEach((b) => {
      const o = v.options.find((x) => x.key === b.dataset.k);
      b.onmouseenter = () => setPreview(o.affects);
      b.onmouseleave = () => setPreview(null);
      b.onclick = () => pickMenu(o.key);
    });
  }
  function pickMenu(key) {
    if (ui.busy || ui.mode !== 'menu') return;
    const o = ui.view.options.find((x) => x.key === key);
    if (!o || o.disabled) return;
    if (ui.multi) {
      const i = ui.multi.indexOf(key);
      if (i >= 0) ui.multi.splice(i, 1); else if (ui.multi.length < ui.view.pick) ui.multi.push(key);
      document.querySelectorAll('.opt').forEach((b) => b.classList.toggle('sel', ui.multi.includes(b.dataset.k)));
      const go = document.getElementById('multiGo');
      go.disabled = !ui.multi.length; go.textContent = t('menu.confirm', { n: ui.multi.length, max: ui.view.pick });
      return;
    }
    ui.busy = true;
    closeOverlay(); setPreview(null);
    resolve(key);
  }

  /* ------------------------------------------------------------------ map (design §6.3) */
  function showMap(view) {
    ui.mode = 'map'; ui.busy = false; setSlotTint(view.slots.length === 1 ? view.slots[0] : null);
    document.querySelectorAll('#deck .card').forEach((c) => c.remove());
    document.getElementById('choices').innerHTML = '';
    openOverlay('<div class="modal dark map-modal"><div class="modal-body" id="mapRoot"></div></div>');
    const snap = eng.snapshot();
    ui.mapCtl = MapView.render(document.getElementById('mapRoot'), view, {
      t, esc, Art, npcs: content.npcs,
      title: t('map.title', { month: snap.month, year: snap.year, phase: t('phase.' + view.phase) }),
      eventTitle: (id) => (content.events[id] ? eng.interp(content.events[id].title) : id),
      onConfirm(picks) {
        if (ui.mode !== 'map') return;
        let out;
        try { out = eng.pickPlaces(picks); } catch (e) { console.warn(e); return; }
        ui.mode = null; ui.mapCtl = null; closeOverlay();
        // No "…" card after a pick (M9): pay floats up from the meters, notes (a shift counted) show as a toast.
        // No toast either (feedback 2026-10-15): it covered the options; what's left of a term is in the You panel.
        renderChrome(); floatDeltas(out.deltas); save();
        next();
      },
    });
    const first = document.querySelector('#mapRoot .mk.st-open'); if (first) first.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------------ month */
  function showMonth(r) {
    ui.mode = 'month'; ui.busy = false;
    document.querySelectorAll('#deck .card').forEach((c) => c.remove());
    document.getElementById('choices').innerHTML = '';
    let rows = '';
    if (r.turn === 1 && content.game.intro) rows += '<div class="row say">' + esc(content.game.intro) + '</div>';
    for (const s of r.summary) {
      const chips = chipsFor({ deltas: s.deltas, notes: s.notes, checks: [] });
      if (!chips && !s.say.length) continue;
      rows += '<div class="row"><span class="lbl">' + esc(s.label || t('month.thisMonth')) + '</span><span class="chips">' + chips + '</span></div>';
      if (s.say.length) rows += '<div class="row say">' + esc(s.say.join(' ')) + '</div>';
    }
    const total = {};
    r.summary.forEach((s) => Object.entries(s.deltas).forEach(([k, v]) => { total[k] = (total[k] || 0) + v; }));
    openOverlay('<div class="modal dark month-modal"><div class="modal-body">' +
      '<div class="yr">' + esc(t('month.header', { year: r.year, turn: r.turn, max: r.maxTurns })) + '</div>' +
      '<div class="big">' + esc(r.month) + '</div>' +
      '<p class="season">' + esc(t('season.' + r.monthIndex)) + '</p>' +
      (rows ? '<div class="summary">' + rows + '</div>' : '') +
      '<div class="row" style="margin-top:18px"><button class="btn primary grow" id="beginMonth" style="width:100%">' + esc(r.ended ? t('month.continue') : t('month.begin', { month: r.month })) + '</button></div>' +
      '</div></div>');
    const go = () => { if (ui.mode !== 'month') return; ui.mode = null; closeOverlay(); floatDeltas(total); next(); };
    document.getElementById('beginMonth').onclick = go;
    ui.monthGo = go;
  }

  /* ------------------------------------------------------------------ ending */
  function showEnding(r) {
    ui.mode = 'ending';
    const snap = eng.snapshot();
    const stats = snap.resources.concat(snap.skills).map((x) => '<div>' + esc(x.name) + '<b>' + Math.round(x.value) + '</b></div>').join('');
    const people = snap.npcs.filter((n) => n.bond !== 'none' || Math.abs(n.rel) >= 30).map((n) => '<span>' + Art.avatar(n, 26) + esc(shortName(n)) + ' · ' + esc(n.bond !== 'none' ? bondLabel(n.bond) : t(n.rel > 0 ? 'ending.fond' : 'ending.cold')) + '</span>').join('');
    openOverlay('<div class="modal dark ending-modal"><div class="modal-art" style="aspect-ratio:400/170">' + Art.scene(r.art, ['mystery'], r.id) + '</div><div class="modal-body">' +
      '<div class="kicker">' + esc(r.early ? t('ending.early', { month: eng.monthName(), year: eng.yearOf() }) : t('ending.graduation')) + '</div>' +
      '<h2>' + esc(r.title) + '</h2><p class="text">' + esc(r.text) + '</p>' +
      (r.yearbook || []).map((y) => '<div class="sec-h">' + esc(t('ending.slot.' + y.slot)) + ' · ' + esc(y.title) + '</div><p class="text yearbook-line">' + esc(y.text) + '</p>').join('') +
      '<div class="final-stats">' + stats + '</div>' + (people ? '<div class="sec-h">' + esc(t('ending.people')) + '</div><div class="final-people">' + people + '</div>' : '') +
      '<div class="row" style="display:flex;gap:10px"><button class="btn primary grow" id="again">' + esc(t('ending.again')) + '</button><button class="btn grow" id="journal">' + esc(t('ending.journal')) + '</button></div>' +
      '<div class="row" style="margin-top:10px;text-align:center"><button class="linkish" id="exportRun">' + esc(t('ending.export')) + '</button></div>' +
      '</div></div>');
    document.getElementById('exportRun').onclick = () => exportRuns([eng.exportRun(runMeta())], 'lumenhold-run-' + fileStamp() + '.json');
    document.getElementById('again').onclick = () => { eng = null; titleScreen(); };
    document.getElementById('journal').onclick = () => { closeOverlay(); ui.tab = 'journal'; ui.sideOpen = true; document.getElementById('side').classList.add('open'); renderSide(); document.getElementById('choices').innerHTML = '<button class="choice single" id="backEnd">' + esc(t('ending.back')) + '</button>'; document.getElementById('backEnd').onclick = () => { showEnding(r); renderFeedbackBar(); }; renderFeedbackBar(); };
  }

  /* ------------------------------------------------------------------ overlay */
  function openOverlay(html) {
    closeOverlay();
    const o = document.createElement('div'); o.className = 'overlay'; o.id = 'overlay'; o.innerHTML = html;
    document.body.appendChild(o);
    const f = o.querySelector('button:not(:disabled)'); if (f && ui.mode !== 'menu') f.focus({ preventScroll: true });
  }
  function closeOverlay() { const o = document.getElementById('overlay'); if (o) o.remove(); }

  /* ------------------------------------------------------------------ keys */
  function onKey(e) {
    if (document.getElementById('slotDialog')) { if (e.key === 'Escape') { e.preventDefault(); closeSlots(); } return; }
    if (fbOpen) {
      if (e.key === 'Escape') { e.preventDefault(); closeFeedback(); }
      else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveFeedback(); }
      return;
    }
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
    if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey && !e.altKey && document.getElementById('fbBar')) { e.preventDefault(); openFeedback(); return; }
    if (ui.mode === 'origin') { if (/^[1-9]$/.test(e.key) && ui.originPick) { e.preventDefault(); ui.originPick(+e.key - 1); } else if (e.key === 'Escape') { e.preventDefault(); closeOverlay(); ui.mode = 'title'; } return; }
    if (ui.mode === 'map') { if (ui.mapCtl && ui.mapCtl.key(e)) e.preventDefault(); return; }
    if (ui.mode === 'card') {
      const v = ui.view; const story = v.type === 'story' || v.options.length === 1;
      if (e.key === 'ArrowLeft') { e.preventDefault(); commitCard(story ? 'right' : 'left'); }
      else if (e.key === 'ArrowUp' && v.options.some((o) => o.key === 'up' && !o.disabled)) { e.preventDefault(); commitCard('up'); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); commitCard('right'); }
      else if (story && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); commitCard('right'); }
    } else if (ui.mode === 'outcome') {
      if (['Enter', ' ', 'ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); const c = document.querySelector('#deck .card'); if (c) flyOut(c, e.key === 'ArrowLeft' ? 'left' : 'right'); setTimeout(continueOutcome, 180); }
    } else if (ui.mode === 'lead') {
      if (['Enter', ' ', 'ArrowRight', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); ui.leadGo && ui.leadGo(); }
    } else if (ui.mode === 'menu') {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9 && ui.view.options[n - 1]) pickMenu(ui.view.options[n - 1].key);
    } else if (ui.mode === 'month') {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ui.monthGo && ui.monthGo(); }
    }
  }

  /* ------------------------------------------------------------------ run log & playtest feedback
   * The engine records every month, card, choice and outcome in s.hist (see engine.js "Run history").
   * Feedback (good / bad + comment) attaches to a card or the ending as `fb`. The run in progress lives
   * in the save; finished or replaced runs move to the RUNS_KEY archive. Export downloads JSON that
   * `node tools/grim.js feedback <file>` aggregates per event. */
  let contentHash = null, fbOpen = false, fbItems = [];
  function runMeta() {
    if (!contentHash) contentHash = I18n.hash((window.LUMENHOLD_SOURCES || []).map((x) => x.path + '\n' + x.text).join('\n'));
    return { game: content.game.title || 'Lumenhold', contentHash, lang: I18n.lang(), userAgent: navigator.userAgent };
  }
  function loadRuns() { try { const r = JSON.parse(store.get(RUNS_KEY) || '[]'); return Array.isArray(r) ? r : []; } catch (e) { return []; } }
  // Upsert a run into the archive (oldest first). When full, drop the oldest runs without feedback first.
  function archiveRun(engine) {
    if (!engine || !engine.s || !engine.s.hist || params.get('event') || Net.available) return;
    archiveRecord(engine.exportRun(runMeta()));
  }
  function archiveRecord(rec) {
    const runs = loadRuns().filter((r) => r.runId !== rec.runId);
    runs.push(rec);
    const dropOne = () => {
      let i = runs.findIndex((r) => r !== rec && !r.feedback);
      if (i < 0) i = runs.findIndex((r) => r !== rec);
      if (i < 0) return false;
      runs.splice(i, 1); return true;
    };
    while (runs.length > MAX_RUNS && dropOne());
    for (;;) {
      try { localStorage.setItem(RUNS_KEY, JSON.stringify(runs)); return; } catch (e) { if (!dropOne()) { console.warn('[runs] could not archive run', e); return; } }
    }
  }
  // Archived runs plus the one in the save, if any.
  function allRuns() {
    const runs = loadRuns();
    const saved = store.get(SAVE_KEY);
    if (saved) {
      try {
        let rec;
        try { rec = new Engine(content).load(saved).exportRun(Object.assign(runMeta(), { inProgress: true })); } catch (e) { rec = null; }
        if (!rec) throw new Error('old save');
        const i = runs.findIndex((r) => r.runId === rec.runId);
        if (i >= 0) runs[i] = rec; else runs.push(rec);
      } catch (e) { console.warn(e); }
    }
    return runs;
  }
  function runLogLine() {
    if (Net.available) return '<div class="fb-log"><span>' + esc(t('net.connected')) + '</span><a class="linkish" href="admin" target="_blank" rel="noopener">' + esc(t('net.admin')) + '</a></div>';
    const runs = allRuns();
    if (!runs.length) return '';
    const notes = runs.reduce((a, r) => a + (r.feedback || 0), 0);
    return '<div class="fb-log"><span>' + esc(t('fb.log', { runs: runs.length, notes })) + '</span><button class="linkish" id="exportRuns">' + esc(t('fb.export')) + '</button></div>';
  }
  function exportRuns(runs, filename) {
    const data = JSON.stringify({ format: 'lumenhold-runs', v: 1, exportedAt: new Date().toISOString(), runs }, null, 1);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function fileStamp() { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()); }
  // After feedback changes: the save holds a live run; a finished run only exists in the archive.
  function persistFeedback(ns) {
    ns.forEach((n) => Net.markDirty(eng.s.runId, n));
    if (eng.s.ended) archiveRun(eng); else save();
    Net.flush(eng, runRecordMeta());
  }
  // Run metadata sent with every telemetry batch (the run record without its history).
  function runRecordMeta(engine) { const r = (engine || eng).exportRun(runMeta()); delete r.hist; return r; }
  // Cross-run "seen" counters, for the director's novelty score (design §5.2).
  // The pseudo-id `_runs` counts completed runs (the `runs_completed` identifier).
  function recordSeen(engine) {
    const ids = [...new Set(engine.s.hist.filter((h) => h.t === 'card').map((h) => h.id)), '_runs'];
    if (Net.available) { Net.addSeen(engine.s.runId, ids); return; }
    let seen = {}; try { seen = JSON.parse(store.get(SEEN_KEY) || '{}'); } catch (e) { /* reset */ }
    const at = Date.now();
    for (const id of ids) { const c = seen[id] = seen[id] || { runs_seen: 0, last_run: null, last_at: null }; if (c.last_run !== engine.s.runId) { c.runs_seen++; c.last_run = engine.s.runId; c.last_at = at; } }
    store.set(SEEN_KEY, JSON.stringify(seen));
  }

  // newGame options from the seen counters: {runsSeen: {id: runs}, runsCompleted}.
  async function loadSeen() {
    let seen = {};
    try { seen = Net.available ? await Net.getSeen() : JSON.parse(store.get(SEEN_KEY) || '{}'); } catch (e) { seen = {}; }
    const runsSeen = {};
    for (const [id, c] of Object.entries(seen || {})) if (id !== '_runs' && c && c.runs_seen) runsSeen[id] = c.runs_seen;
    return { runsSeen, runsCompleted: (seen && seen._runs && seen._runs.runs_seen) || 0 };
  }

  // What the live bar and the F dialog rate: the newest two cards (or the ending and the last card).
  function fbTargets() {
    if (!eng || !eng.s || !eng.s.hist) return [];
    return eng.recentEntries(2).map((e, i) => ({ e, label: e.t === 'end' ? t('fb.ending') : i > 0 ? t('fb.prev') : t(ui.mode === 'month' ? 'fb.last' : 'fb.this') }));
  }
  const fbBtn = (n, r, fb, cls) => '<button class="fb-r ' + r + (fb && fb.rating === r ? ' on' : '') + (cls || '') + '" data-n="' + n + '" data-r="' + r + '" title="' + esc(t(r === 'up' ? 'fb.good' : 'fb.bad')) + '" aria-pressed="' + !!(fb && fb.rating === r) + '">' + (r === 'up' ? '👍' : '👎') + '</button>';
  function buildFeedbackBar() {
    if (document.getElementById('fbBar')) return;
    const bar = document.createElement('div'); bar.className = 'fb-bar'; bar.id = 'fbBar';
    document.body.appendChild(bar);
    bar.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.r) quickRate(Number(b.dataset.n), b.dataset.r); else openFeedback();
    };
  }
  function removeFeedbackBar() { const b = document.getElementById('fbBar'); if (b) b.remove(); }
  function renderFeedbackBar() {
    const bar = document.getElementById('fbBar'); if (!bar) return;
    const targets = fbTargets();
    bar.style.display = targets.length ? '' : 'none';
    bar.innerHTML = targets.map(({ e, label }) => '<div class="fb-t" title="' + esc(e.title || '') + '"><span class="fb-lbl">' + esc(label) + '</span>' + fbBtn(e.n, 'up', e.fb) + fbBtn(e.n, 'down', e.fb) + '</div>').join('') +
      '<button class="fb-open' + (targets.some(({ e }) => e.fb && e.fb.comment) ? ' has' : '') + '" title="' + esc(t('fb.open')) + '">✎</button>';
  }
  function journalFeedback(n) {
    const e = eng.histEntry(n); if (!e) return '';
    const fb = e.fb;
    return '<div class="fb-mini" data-n="' + n + '">' + fbBtn(n, 'up', fb) + fbBtn(n, 'down', fb) + '<button class="fb-c' + (fb && fb.comment ? ' has' : '') + '" title="' + esc(t('fb.open')) + '">✎</button></div>' +
      (fb && fb.comment ? '<div class="fb-note">' + esc(fb.comment) + '</div>' : '');
  }
  function quickRate(n, r) {
    const e = eng.histEntry(n); if (!e) return;
    const fb = e.fb || {};
    eng.setFeedback(n, { rating: fb.rating === r ? null : r, comment: fb.comment });
    persistFeedback([n]); renderFeedbackBar();
    if (ui.tab === 'journal') renderSide();
  }
  // ns: hist sequence numbers to edit (from the journal); default: the live targets.
  function openFeedback(ns) {
    if (!eng || !eng.s || !eng.s.hist) return;
    closeFeedback();
    fbItems = ns ? ns.map((n) => eng.histEntry(n)).filter(Boolean).map((e) => ({ e, label: e.t === 'end' ? t('fb.ending') : '' })) : fbTargets();
    const body = fbItems.length ? fbItems.map(({ e, label }) => {
      const fb = e.fb || {};
      return '<div class="fb-item" data-n="' + e.n + '"><div class="fb-head"><span>' + esc(label) + '</span><span>' + esc(t('fb.when', { month: eng.monthName(e.turn), year: eng.yearOf(e.turn) })) + '</span></div>' +
        '<b class="fb-title">' + esc(e.title || e.id) + '</b>' + (e.label ? '<div class="fb-chose">' + esc(t('fb.chose', { choice: e.label })) + '</div>' : '') +
        '<div class="fb-rate">' + ['up', 'down'].map((r) => '<button class="fb-r ' + r + (fb.rating === r ? ' on' : '') + '" data-r="' + r + '">' + (r === 'up' ? '👍 ' : '👎 ') + esc(t(r === 'up' ? 'fb.good' : 'fb.bad')) + '</button>').join('') + '</div>' +
        '<textarea rows="3" maxlength="2000" placeholder="' + esc(t('fb.placeholder')) + '">' + esc(fb.comment || '') + '</textarea></div>';
    }).join('') : '<p class="fb-intro">' + esc(t('fb.none')) + '</p>';
    const wrap = document.createElement('div'); wrap.className = 'fb-wrap'; wrap.id = 'fbDialog';
    wrap.innerHTML = '<div class="fb-dialog" role="dialog" aria-modal="true" aria-labelledby="fbH"><h3 id="fbH">' + esc(t('fb.heading')) + '</h3><p class="fb-intro">' + esc(t('fb.intro')) + '</p>' + body +
      '<div class="fb-actions"><button class="btn" id="fbCancel">' + esc(t('fb.cancel')) + '</button>' + (fbItems.length ? '<button class="btn primary" id="fbSave">' + esc(t('fb.save')) + '</button>' : '') + '</div></div>';
    document.body.appendChild(wrap);
    fbOpen = true;
    wrap.onclick = (e) => { if (e.target === wrap) closeFeedback(); };
    wrap.querySelectorAll('.fb-rate .fb-r').forEach((b) => {
      b.onclick = () => { const was = b.classList.contains('on'); b.parentNode.querySelectorAll('.fb-r').forEach((x) => x.classList.remove('on')); if (!was) b.classList.add('on'); };
    });
    document.getElementById('fbCancel').onclick = closeFeedback;
    const sv = document.getElementById('fbSave'); if (sv) sv.onclick = saveFeedback;
    const ta = wrap.querySelector('textarea'); if (ta) ta.focus({ preventScroll: true });
  }
  function saveFeedback() {
    const wrap = document.getElementById('fbDialog'); if (!wrap) return;
    const ns = [];
    wrap.querySelectorAll('.fb-item').forEach((it) => {
      const on = it.querySelector('.fb-rate .fb-r.on');
      ns.push(Number(it.dataset.n));
      eng.setFeedback(Number(it.dataset.n), { rating: on ? on.dataset.r : null, comment: it.querySelector('textarea').value });
    });
    persistFeedback(ns);
    closeFeedback();
    renderFeedbackBar();
    if (ui.tab === 'journal') renderSide();
  }
  function closeFeedback() { const w = document.getElementById('fbDialog'); if (w) w.remove(); fbOpen = false; fbItems = []; }

  /* ------------------------------------------------------------------ saved games (autosave + 3 slots) */
  // Slots live on the server when there is one, else in this browser. Loading a slot continues as a new
  // run (Engine.forkRun), so its log never mixes with the timeline it was saved from.
  async function slotList() {
    if (Net.available) return Net.listSaves();
    return ['auto', '1', '2', '3'].map((slot) => {
      const raw = store.get(slot === 'auto' ? SAVE_KEY : SLOT_KEY(slot));
      if (!raw) return { slot, empty: true };
      try { const o = JSON.parse(raw); const d = o.data || o; return { slot, name: d.name, turn: d.turn, updatedAt: o.updatedAt || null }; } catch (e) { return { slot, empty: true }; }
    });
  }
  async function slotData(slot) {
    if (Net.available && slot !== 'auto') return Net.getSave(slot);
    const raw = store.get(slot === 'auto' ? SAVE_KEY : SLOT_KEY(slot));
    if (!raw) return null;
    const o = JSON.parse(raw); return o.data || o;
  }
  async function openSlots() {
    closeSlots();
    const inGame = !!(eng && eng.s && !eng.s.ended && ui.mode !== 'title' && !params.get('event'));
    const wrap = document.createElement('div'); wrap.className = 'fb-wrap'; wrap.id = 'slotDialog';
    wrap.innerHTML = '<div class="fb-dialog slots" role="dialog" aria-modal="true" aria-labelledby="slotsH"><h3 id="slotsH">' + esc(t('slots.heading')) + '</h3><p class="fb-intro">' + esc(t(Net.available ? 'slots.whereServer' : 'slots.whereLocal')) + '</p><div id="slotRows" class="fb-intro">…</div>' +
      '<div class="fb-actions"><button class="btn" id="slotsClose">' + esc(t('slots.close')) + '</button></div></div>';
    document.body.appendChild(wrap);
    wrap.onclick = (e) => { if (e.target === wrap) closeSlots(); };
    document.getElementById('slotsClose').onclick = closeSlots;
    const tmp = new Engine(content);
    const render = async (note) => {
      let list;
      try { list = await slotList(); } catch (e) { document.getElementById('slotRows').textContent = e.message; return; }
      const rows = document.getElementById('slotRows'); if (!rows) return;
      rows.className = '';
      rows.innerHTML = list.map((x) => '<div class="slot-row"><div><b>' + esc(x.slot === 'auto' ? t('slots.auto') : t('slots.slot', { n: x.slot })) + '</b><span>' +
        esc(x.empty ? t('slots.empty') : t('slots.info', { name: x.name, month: tmp.monthName(x.turn), year: tmp.yearOf(x.turn) })) + (note && note.slot === x.slot ? ' · ' + esc(note.text) : '') + '</span></div><div class="slot-acts">' +
        (inGame && x.slot !== 'auto' ? '<button class="linkish" data-save="' + x.slot + '">' + esc(t('slots.saveHere')) + '</button>' : '') +
        (!x.empty ? '<button class="linkish" data-load="' + x.slot + '">' + esc(t('slots.load')) + '</button>' : '') + '</div></div>').join('');
      rows.querySelectorAll('[data-save]').forEach((b) => { b.onclick = async () => {
        const json = eng.save();
        try { if (Net.available) await Net.putSave(b.dataset.save, json); else store.set(SLOT_KEY(b.dataset.save), JSON.stringify({ updatedAt: Date.now(), data: JSON.parse(json) })); render({ slot: b.dataset.save, text: t('slots.saved') }); } catch (e) { render({ slot: b.dataset.save, text: e.message }); }
      }; });
      rows.querySelectorAll('[data-load]').forEach((b) => { b.onclick = async () => {
        let data; try { data = await slotData(b.dataset.load); } catch (e) { render({ slot: b.dataset.load, text: e.message }); return; }
        if (!data) return;
        if ((data.version || 1) < Engine.SAVE_VERSION) { render({ slot: b.dataset.load, text: t('slots.tooOld') }); return; }
        // The old run is archived and flushed; no autosave push for it (it could land after the new game's and overwrite it).
        if (eng && eng.s && !eng.s.ended && ui.mode !== 'title') { clearTimeout(serverSaveTimer); Net.flush(eng, runRecordMeta(), { final: true }); archiveRun(eng); }
        eng = new Engine(content).load(JSON.parse(JSON.stringify(data)));
        if (b.dataset.load !== 'auto') eng.forkRun();
        closeSlots(); save(true); buildGame(); step(eng.advance());
      }; });
    };
    render();
  }
  function closeSlots() { const w = document.getElementById('slotDialog'); if (w) w.remove(); }

  /* ------------------------------------------------------------------ debug panel (developer-facing, English only) */
  function buildDebug() {
    const btn = document.createElement('button'); btn.className = 'btn debug-btn'; btn.textContent = 'debug';
    const panel = document.createElement('div'); panel.className = 'debug-panel'; panel.style.display = 'none';
    const evIds = Object.keys(content.events).sort();
    panel.innerHTML = '<b>Content debug</b>' +
      '<input id="dbgEv" list="dbgEvList" placeholder="event id"><datalist id="dbgEvList">' + evIds.map((id) => '<option value="' + esc(id) + '">').join('') + '</datalist>' +
      '<select id="dbgActor"><option value="">(actor: default)</option>' + Object.keys(content.npcs).map((id) => '<option>' + esc(id) + '</option>').join('') + '</select>' +
      '<div class="row"><button class="btn" id="dbgPlay">Play now</button><button class="btn" id="dbgSkip">Skip month</button></div>' +
      '<input id="dbgSet" placeholder="gold = 200 · flag x · gain sick · rel lyra +30"><div class="row"><button class="btn" id="dbgRun">Run effect</button><button class="btn" id="dbgDump">Refresh</button></div>' +
      '<pre id="dbgOut"></pre>';
    document.body.appendChild(btn); document.body.appendChild(panel);
    btn.onclick = () => { panel.style.display = panel.style.display === 'none' ? '' : 'none'; dump(); };
    const dump = () => {
      const s = eng.s;
      document.getElementById('dbgOut').textContent = 'lang ' + I18n.lang() + '  turn ' + s.turn + '  deck: ' + s.deck.map((d) => d.id + (d.actor ? '@' + d.actor : '')).join(', ') + '\nqueue: ' + s.queue.map((q) => q.id + '→' + q.due).join(', ') +
        '\nflags: ' + Object.keys(s.flags).join(' ') + '\nstates: ' + Object.keys(s.states).join(' ') + '\nvals: ' + JSON.stringify(s.vals) + '\nnpcs: ' + JSON.stringify(s.npcs);
    };
    panel.querySelector('#dbgPlay').onclick = () => {
      const id = document.getElementById('dbgEv').value.trim(); if (!content.events[id]) return alertish('no such event');
      const actor = document.getElementById('dbgActor').value || null;
      if (actor) eng.s.npcs[actor].met = true;
      if (eng.s.cur) eng.s.deck.unshift(eng.s.cur);
      eng.s.cur = null;
      eng.s.deck.unshift({ id, actor: actor || (content.events[id].actor === 'any' ? Object.keys(content.npcs)[0] : null), src: 'debug', force: true });
      closeOverlay(); ui.busy = false; step(eng.advance()); dump();
    };
    panel.querySelector('#dbgSkip').onclick = () => { eng.s.deck = []; eng.s.cur = null; closeOverlay(); ui.busy = false; step(eng.advance()); dump(); };
    panel.querySelector('#dbgRun').onclick = () => {
      try {
        const src = '@hook dbg\non: month_end\ndo:\n  ' + document.getElementById('dbgSet').value.trim();
        const defs = Grimoire.parseFile(src, 'debug');
        const ctx = eng.newCtx(null); eng.run(defs[0].do, ctx); eng.handleZeroed(ctx); renderChrome(); floatDeltas(ctx.deltas); dump();
      } catch (e) { alertish(e.message); }
    };
    panel.querySelector('#dbgDump').onclick = dump;
    function alertish(m) { document.getElementById('dbgOut').textContent = m; }
  }

  // Start last, so every helper above is initialised before the first render.
  boot();
})();
