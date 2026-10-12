/*
 * Lumenhold localization.
 *
 *  - UI strings: English defaults live in UI_EN below; other languages override them in
 *    locales/<lang>/ui.lang (block "@ui").
 *  - Content strings: English is the source, written inline in content/**\/*.grim.
 *    Translations live in locales/<lang>/<same path>.lang, keyed by block + field, e.g.
 *
 *        @event pyro_candle
 *        # en: Light the Candle
 *        title [3f9a1c] = 点燃蜡烛
 *        opt.left.say.1 [77b0e2] = 烛芯被点燃了……
 *
 *    The [hash] fingerprints the English text that was translated. If the English later
 *    changes, the entry is reported as stale (but still used) until someone updates the
 *    translation and deletes the [hash] (the sync tool re-stamps it).
 *  - Applied once at load: I18n.applyContent(content, locale) rewrites the compiled content
 *    in place, so the engine and save files stay language-agnostic.
 *
 * Tooling: `node tools/grim.js i18n <lang>` creates/updates the .lang files; `lint` validates them.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.I18n = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ English UI strings */
  // Keys ending in "_html" may contain simple markup (<b>). {name} placeholders are filled by t().
  const UI_EN = {
    'lang.name': 'English',
    'lang.label': 'Language',

    'title.yourName': 'Your name',
    'title.seed': 'Seed (optional)',
    'title.seedPlaceholder': 'random',
    'title.begin': 'Begin your first year',
    'title.continue': 'Continue · {info}',
    'title.saveInfo': '{name} — {month}, Year {year}',
    'title.howto_html': '<b>Swipe</b> each card left or right (or press ← / →) to choose. Some moments open a <b>menu</b> with more options. Keep your <b>Health, Mood, Gold and Standing</b> above zero for three years — 36 months — and see who you become. Glowing dots above a meter show what a choice will touch.',
    'title.names': 'Wren, Ash, Rowan, Elowen, Fenn, Isla, Corin, Sable, Theo, Marlo, Juniper, Ezra',
    'title.defaultName': 'Wren',

    'top.people': 'Character & people',
    'top.notes': 'Toggle illustration notes',
    'top.quit': 'Save & return to title',
    'top.lang': 'Language',
    'date.sub': 'YEAR {year} · MONTH {turn} OF {max}',

    'tab.you': 'You',
    'tab.people': 'People',
    'tab.journal': 'Journal',
    'pips.thisMonth': 'this month',

    'side.conditions': 'Conditions & commitments',
    'side.nothing': 'Nothing yet.',
    'side.monthsLeft': '{n} mo',
    'side.noPeople': "You haven't really met anyone yet.",
    'side.relationship': 'Relationship {n}',
    'side.romance': 'Spark {n}',
    'side.spells': 'Spells',
    'side.spellCost': '{n} mana',
    'side.emptyJournal': 'Your story is yet unwritten.',
    'journal.when': '{month} · Y{year}',

    'bond.friend': 'friend',
    'bond.close': 'close',
    'bond.rival': 'rival',
    'bond.nemesis': 'nemesis',
    'bond.partner': 'partner',
    'bond.ex': 'ex',

    'tag.class': 'Class',
    'tag.club': 'Club',
    'tag.job': 'Work',
    'tag.social': 'Social',
    'tag.romance': 'Romance',
    'tag.study': 'Study',
    'tag.mystery': 'Mystery',
    'tag.danger': 'Danger',
    'tag.crisis': 'Crisis',
    'tag.festival': 'Festival',
    'tag.money': 'Coin',
    'tag.nature': 'Grounds',
    'tag.home': 'Home',
    'tag.rival': 'Rivalry',
    'tag.exam': 'Exam',
    'tag.story': 'Chronicle',
    'tag.magic': 'Magic',
    'tag.default': 'Academy life',

    'card.consequence': 'consequence',
    'card.illustration': 'Illustration: {text}',
    'card.notAvailable': 'Not available',
    'check.button': '{skill} check · {p}%',
    'check.chip': '{skill} check ({p}%) · {result}',
    'check.success': 'success',
    'check.failed': 'failed',
    'chip.rel': '{name} {delta}',
    'chip.love': '{name} (spark) {delta}',
    'note.meet': 'You met {name}.',
    'note.bond': '{name}: {status}',
    'note.gain': '+ {state}',
    'note.lose': '− {state}',
    'note.spell': 'New spell: {spell} {level}',
    'note.fact': 'You learned something about {name}.',
    'check.challengeChip': '{kind} ({p}%) · {result}',
    'challenge.duel': 'Duel',
    'challenge.negotiate': 'Negotiation',
    'challenge.deceive': 'Deception',
    'challenge.exam': 'Exam',
    'challenge.research': 'Research',
    'challenge.brew': 'Brewing',
    'challenge.enchant': 'Enchanting',
    'challenge.win': 'win',
    'challenge.partial': 'partial',
    'challenge.lose': 'lose',
    'spell.button': '{spell} {level} · {cost} mana',
    'spell.short': 'Not enough mana',
    'preview.follows': 'Something follows from this.',
    'title.oldSave': 'Your saved game was from an older version of the game and can no longer be loaded. Its run log was kept.',
    'slots.tooOld': 'From an older version; can’t be loaded',
    'outcome.tap': 'tap or swipe to continue',
    'outcome.continue': 'Continue',

    'month.header': 'Year {year} · Month {turn} of {max}',
    'month.thisMonth': 'This month',
    'month.begin': 'Begin {month}',
    'month.continue': 'Continue',
    'season.1': 'The leaves turn. A new term begins.',
    'season.2': 'Lanterns over the lake.',
    'season.3': 'Fog creeps up the stairwells.',
    'season.4': 'Frost on the windows; exams in the air.',
    'season.5': 'Deep winter. The Midwinter Ball approaches.',
    'season.6': 'The thaw, and a new term.',
    'season.7': 'Storms roll in off the mountains.',
    'season.8': 'The lawns are green again. Tournament season.',
    'season.9': 'Blossom on every bough.',
    'season.10': 'High summer heat — and the Grand Examinations.',
    'season.11': 'Summer recess. The towers empty.',
    'season.12': 'The last weeks of summer. Stars begin to fall.',

    'ending.early': 'Your story ends early · {month}, Year {year}',
    'ending.graduation': 'Graduation · Ending',
    'ending.people': 'The people who mattered',
    'ending.again': 'Begin anew',
    'ending.journal': 'Read your journal',
    'ending.back': 'Back to the ending',
    'ending.fond': 'fond',
    'ending.cold': 'cold',
    'ending.export': 'Export this run',

    // Playtest feedback: rate / comment on the current or previous card; runs are logged for export.
    'fb.this': 'This card',
    'fb.last': 'Last card',
    'fb.prev': 'Previous',
    'fb.ending': 'Ending',
    'fb.good': 'Good',
    'fb.bad': 'Bad',
    'fb.open': 'Rate & comment (F)',
    'fb.heading': 'Feedback',
    'fb.intro': 'Rate cards and leave notes for the writers. Everything is saved with this run’s log.',
    'fb.chose': 'You chose: {choice}',
    'fb.placeholder': 'What worked, what didn’t? Tone, typos, balance, a confusing choice…',
    'fb.save': 'Save',
    'fb.cancel': 'Cancel',
    'fb.none': 'Nothing to rate yet.',
    'fb.when': '{month} · Y{year}',
    'fb.log': 'Playtest log: {runs} runs · {notes} notes',
    'fb.export': 'Export',

    // Saved games and the optional server
    // The day and the map (phase 2b)
    'slot.morning': 'Morning', 'slot.noon': 'Noon', 'slot.afternoon': 'Afternoon', 'slot.evening': 'Evening', 'slot.night': 'Night', 'slot.midnight': 'Midnight',
    'phase.term': 'Term', 'phase.break': 'Break',
    'map.title': '{month} · Year {year} · {phase}',
    'map.question1': 'Where will you spend the afternoon?',
    'map.question2': 'Where will you spend the afternoon and the evening?',
    'map.choose': 'choose…',
    'map.go': 'Begin the day',
    'map.showList': 'List view',
    'map.showMap': 'Map view',
    'map.undiscovered': 'Somewhere you haven’t found yet.',
    'map.full': 'Both visits are picked; tap one to change it.',
    'map.closed': '{name} isn’t open then (open: {hours}).',
    'map.closedNow': 'closed now',
    'map.open': 'open',
    'map.hinted': 'not yet found',
    'map.festival': 'festival: takes your {slot} visit',
    'map.here': 'here: {names}',
    'map.new': 'something new',
    'map.practiceLeft': 'Practice · {n} left',
    'map.shiftsLeft': 'Shift · {n} left',
    'map.sessionsLeft': 'Session · {n} left',
    'menu.confirm': 'Confirm ({n}/{max})',
    'note.grade': '{track}: {grade}',
    'note.enrol': 'Enrolled: {track}',
    'note.join': 'Joined: {track}',
    'note.leave': 'Left: {track}',
    'note.promote': 'Promoted in {track}',
    'note.dropped': 'Dropped from {track}',
    'note.missed': '{track}: missed {n}',
    'note.attend': '{track}: {n} left this term',
    'note.discover': 'New place: {place}',
    'note.clue': 'A clue found',
    'side.studies': 'Studies & commitments',
    'side.gpa': 'GPA {gpa}',
    'side.enrolled': 'Enrolled this term',
    'side.grades': 'Grades: {grades}',
    'side.rankLine': '{rank} · {due} due this term',
    'side.perf': '{n}%',
    'side.progress': 'Progress {n}%',
    'side.applied': 'Applied',
    'slots.heading': 'Saved games',
    'slots.auto': 'Autosave',
    'slots.slot': 'Slot {n}',
    'slots.empty': 'Empty',
    'slots.info': '{name} — {month}, Year {year}',
    'slots.saveHere': 'Save here',
    'slots.load': 'Load',
    'slots.saved': 'Saved',
    'slots.close': 'Close',
    'slots.whereServer': 'Stored on the server. Loading a slot continues it as a new run.',
    'slots.whereLocal': 'Stored in this browser. Loading a slot continues it as a new run.',
    'net.connected': 'Connected: runs and feedback are saved on the server.',
    'net.admin': 'Admin',

    // Pronoun tables used by {they} {them} {their} {theirs} {are} {s} in content text.
    'pronoun.she.they': 'she', 'pronoun.she.them': 'her', 'pronoun.she.their': 'her', 'pronoun.she.theirs': 'hers', 'pronoun.she.are': 'is', 'pronoun.she.s': 's',
    'pronoun.he.they': 'he', 'pronoun.he.them': 'him', 'pronoun.he.their': 'his', 'pronoun.he.theirs': 'his', 'pronoun.he.are': 'is', 'pronoun.he.s': 's',
    'pronoun.they.they': 'they', 'pronoun.they.them': 'them', 'pronoun.they.their': 'their', 'pronoun.they.theirs': 'theirs', 'pronoun.they.are': 'are', 'pronoun.they.s': '',
  };

  /* ------------------------------------------------------------------ helpers */
  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ('000000' + (h >>> 0).toString(16)).slice(-6);
  }
  const enc = (s) => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
  const dec = (s) => String(s).replace(/\\(n|\\)/g, (m, c) => (c === 'n' ? '\n' : '\\'));

  /* ------------------------------------------------------------------ .lang parser */
  // Returns { blocks: { 'event:pyro_candle': { title: {text, hash, line} } }, order: [...], errors: [] }
  function parseLang(text, path) {
    const out = { blocks: {}, order: [], errors: [], path };
    let cur = null;
    String(text).replace(/\r\n?/g, '\n').split('\n').forEach((raw, i) => {
      const line = raw.trim();
      if (!line || line.startsWith('#')) return;
      let m = line.match(/^@([a-z]+)(?:\s+([a-z_][a-z0-9_]*(?:\.[a-z_][a-z0-9_]*)?))?$/);
      if (m) {
        cur = m[1] + (m[2] ? ':' + m[2] : '');
        if (!out.blocks[cur]) { out.blocks[cur] = {}; out.order.push(cur); }
        return;
      }
      m = line.match(/^([A-Za-z0-9_.-]+)(?:\s+\[([0-9a-f]{6})\])?\s*=\s?(.*)$/);
      if (!m) { out.errors.push(path + ':' + (i + 1) + ': expected "key [hash] = text", "@block id" or "# comment"'); return; }
      if (!cur) { out.errors.push(path + ':' + (i + 1) + ': entry before any @block header'); return; }
      if (out.blocks[cur][m[1]]) out.errors.push(path + ':' + (i + 1) + ': duplicate key "' + m[1] + '" in @' + cur.replace(':', ' '));
      out.blocks[cur][m[1]] = { text: dec(m[3]), hash: m[2] || null, line: i + 1 };
    });
    return out;
  }

  // sources: [{path, text}] for one language -> merged locale
  function loadLocale(lang, sources) {
    const loc = { lang, blocks: {}, ui: {}, errors: [], files: {} };
    // Files in an "_in/" inbox (staged translations) are merged last so they win.
    const ordered = (sources || []).slice().sort((a, b) => (/\/_in\//.test(a.path) ? 1 : 0) - (/\/_in\//.test(b.path) ? 1 : 0));
    for (const src of ordered) {
      const p = parseLang(src.text, src.path);
      loc.errors.push(...p.errors);
      loc.files[src.path] = p;
      for (const b of p.order) {
        const target = b === 'ui' ? null : (loc.blocks[b] = loc.blocks[b] || {});
        for (const [k, v] of Object.entries(p.blocks[b])) {
          if (b === 'ui') { if (v.text !== '' || (k.startsWith('pronoun.') && loc.ui[k] == null)) loc.ui[k] = v.text; continue; }  // pronouns may be intentionally empty
          if (v.text === '' && target[k] && target[k].text !== '') continue;  // never let an empty line erase a translation
          target[k] = v;
        }
      }
    }
    return loc;
  }

  /* ------------------------------------------------------------------ content traversal */
  // Calls cb(blockKey, fieldKey, text, set, def) for every translatable string, in source order.
  const FIELDS = {
    game: ['title', 'subtitle', 'intro'],
    resource: ['name', 'desc'],
    skill: ['name', 'desc'],
    npc: ['name', 'short', 'title', 'house', 'desc'],
    state: ['name', 'desc'],
    event: ['title', 'text', 'scene'],
    ending: ['title', 'text', 'scene'],
    hook: ['label'],
    // Worldbook text players will see (lore, vocab, archetypes and timeline are authoring context only).
    place: ['name', 'desc', 'hint'],
    track: ['name', 'level_names', 'ranks', 'desc'],
    spell: ['name', 'desc'],
    fact: ['text'],
    faction: ['name', 'desc'],
    arc: ['name', 'desc'],
  };
  const EFFECT_FIELDS = { resource: ['on_zero'], state: ['on_add', 'tick', 'on_expire', 'on_remove'], hook: ['do'], event: ['on_show'] };

  function walkSays(effects, fn) {
    if (!effects) return;
    for (const st of effects) {
      if (st.t === 'say') fn(st);
      if (st.t === 'if') { st.branches.forEach((b) => walkSays(b.body, fn)); walkSays(st.else, fn); }
      else if (st.t === 'challenge') { walkSays(st.win, fn); walkSays(st.partial, fn); walkSays(st.lose, fn); }
      else if (st.body) { walkSays(st.body, fn); walkSays(st.else, fn); }
    }
  }

  function visit(content, cb) {
    const defs = [];
    const g = content.game || {};
    defs.push(g.block ? g : Object.assign({ block: 'game', id: 'game' }, g));
    for (const col of ['resources', 'skills', 'npcs', 'states', 'events', 'endings', 'hooks', 'places', 'tracks', 'spells', 'facts', 'factions', 'arcs']) defs.push(...Object.values(content[col] || {}));
    defs.sort((a, b) => (a.file || '').localeCompare(b.file || '') || (a.line || 0) - (b.line || 0));
    for (const d of defs) {
      const kind = d.block || 'game';
      const bkey = kind === 'game' ? 'game' : kind + ':' + d.id;
      for (const f of FIELDS[kind] || []) if (typeof d[f] === 'string' && d[f]) cb(bkey, f, d[f], (v) => { d[f] = v; }, d);
      if (kind === 'game' && Array.isArray(d.months)) d.months.forEach((m, i) => cb(bkey, 'month.' + (i + 1), m, (v) => { d.months[i] = v; }, d));
      for (const ef of EFFECT_FIELDS[kind] || []) { let n = 0; walkSays(d[ef], (st) => { n++; cb(bkey, ef + '.say.' + n, st.text, (v) => { st.text = v; }, d); }); }
      if (kind === 'event') for (const o of d.options || []) {
        cb(bkey, 'opt.' + o.key + '.label', o.label, (v) => { o.label = v; }, d);
        if (o.hint) cb(bkey, 'opt.' + o.key + '.hint', o.hint, (v) => { o.hint = v; }, d);
        let n = 0; walkSays(o.effects, (st) => { n++; cb(bkey, 'opt.' + o.key + '.say.' + n, st.text, (v) => { st.text = v; }, d); });
      }
    }
  }

  // Ordered list of every translatable string: [{file, block, key, text, hash}]
  function extract(content) {
    const out = [];
    visit(content, (block, key, text, set, def) => out.push({ file: def.file || 'content/core/rules.grim', block, key, text, hash: hash(text) }));
    return out;
  }

  // Rewrite compiled content in place. Returns stats.
  function applyContent(content, locale) {
    const stats = { total: 0, translated: 0, stale: 0, missing: [] };
    if (!locale) return stats;
    visit(content, (block, key, text, set) => {
      stats.total++;
      const e = locale.blocks[block] && locale.blocks[block][key];
      if (!e || e.text === '') { stats.missing.push(block + ' ' + key); return; }
      if (e.hash && e.hash !== hash(text)) stats.stale++;
      stats.translated++;
      set(e.text);
    });
    const P = pronounTable(locale.ui);
    content.pronouns = P;
    content.lang = locale.lang;
    return stats;
  }

  function pronounTable(ui) {
    const t = {};
    for (const p of ['she', 'he', 'they']) {
      t[p] = {};
      for (const f of ['they', 'them', 'their', 'theirs', 'are', 's']) {
        const k = 'pronoun.' + p + '.' + f;
        t[p][f] = ui && ui[k] != null ? ui[k] : UI_EN[k];
      }
    }
    return t;
  }

  /* ------------------------------------------------------------------ runtime (UI) */
  let current = { lang: 'en', ui: {} };
  function use(locale) { current = locale ? { lang: locale.lang, ui: locale.ui || {} } : { lang: 'en', ui: {} }; }
  function t(key, vars) {
    let s = current.ui[key] != null ? current.ui[key] : UI_EN[key];
    if (s == null) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    return s;
  }
  function lang() { return current.lang; }

  return { UI_EN, hash, enc, dec, parseLang, loadLocale, visit, extract, applyContent, pronounTable, use, t, lang, FIELDS };
});
