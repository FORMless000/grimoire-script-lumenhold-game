#!/usr/bin/env node
/*
 * grim — content toolchain for Lumenhold.
 *
 *   node tools/grim.js build [--check]  bundle content/**\/*.grim + locales -> build/content.bundle.js (run after every
 *                                       content or translation edit); --check only reports a stale bundle (exit 1)
 *   node tools/grim.js lint             parse + cross-reference check (errors fail; warnings are advisory)
 *   node tools/grim.js sim [N] [--seed S] [--policy random|cautious|social] [--verbose] [--log DIR]
 *                                       auto-play N games, report coverage, endings, deaths, balance
 *                                       (--log writes every game's full run log to DIR as JSON)
 *   node tools/grim.js reach            static reachability: events, options, endings, places, tracks no play can reach
 *   node tools/grim.js stats            count blocks by kind / trigger / tag
 *   node tools/grim.js show <id>        print a block's source and everything that references it
 *   node tools/grim.js odds <event>…    each check's and roll's odds over the run, for a passive and a focused player (checks.md)
 *   node tools/grim.js graph <id>       the event graph around an event, state or hook: who leads to it (queues it, with
                                      odds; sets what its gates read) and what it leads to (queues, and who reads what it sets)
  node tools/grim.js ids [kind]       list ids (event|state|npc|ending|resource|skill|flag|var)
  node tools/grim.js leads [--all]    "hinted now, act later" pairs (a flag or card a place/slot/track card waits for) and
                                      whether the card that sets it leaves a lead for the Clues panel; --queued [--out f]:
                                      the timed follow-ups (queue in N / within / by month), candidates to turn into leads
 *   node tools/grim.js check            build + lint + sim 200 (what agents should run before finishing)
 *   node tools/grim.js fmt [FILE…] [--check]
 *                                       rewrite .grim files in canonical layout (lossless; refuses any change in meaning).
 *                                       --check only lists files that are not canonical (exit 1 if any)
 *   node tools/grim.js query NODE [WHERE] [--file S] [--grep RE] [--group FIELD] [--json] [--fields]
 *                                       find blocks / options / statements, e.g.  query check "dc < 12 and not scales"
 *   node tools/grim.js rename KIND OLD NEW [--dry-run]
 *                                       rename an event/state/npc/flag/var/ending id in content and translations (verified)
 *   node tools/grim.js migrate [--dry-run]
 *                                       run new scripts in tools/migrations/ (recorded in content/.migrations.json)
 *   node tools/grim.js balance [--quick] [--games N]
 *                                       play every play style; invariants fail (exit 1), alarms warn; includes the
 *                                       preview property test (every outcome within its preview; 1000 games, 100 with --quick)
 *   node tools/grim.js styles             the simulated play styles and what each one plays for (tools/policies.js)
 *   node tools/grim.js analyze [--styles all|quick|a,b] [--games N] [--baseline FILE] [--name NAME]
 *                                       trajectories per play style (tools/analyze.js): resource and skill curves by
 *                                       month, survival, pace and run time, milestones, check odds, findings and a
 *                                       comparison with an earlier run; writes build/analysis/NAME.{json,md,html}
 *   node tools/grim.js curve [--games N] [--write]
 *                                       fit the expected-skill curve E(turn) from the balanced play style
 *   node tools/grim.js snapshot [NAME] [--out FILE]
 *                                       play the golden seeds and save endings, choices, final values, coverage
 *   node tools/grim.js diff [A] [B]     compare two snapshots (default: test/golden/baseline.json vs a fresh one);
 *                                       a pure refactor shows "no gameplay change" (exit 1 otherwise)
 *   node tools/grim.js lorebook [--out FILE]
 *                                       export the worldbook as JSON (default build/lorebook.json)
 *   node tools/grim.js brief [--cast a,b] [--place P] [--track T] [--arc A] [--topic "…"] [--tier T] [--out FILE]
 *                            [--examples N] [--like id,id]
 *                                      a ~6k-token context pack for writing events (design §3.4): cast, place, track,
 *                                      arc, lore, every card already written there, N similar cards as examples
 *                                      (same place or track first; --like adds named ones) and the rules
 *   node tools/grim.js docs [--check]   regenerate the block table in docs/authoring/schema.md and the tiers and presets
 *                                      in docs/authoring/presets.md (from content/core/balance.grim)
 *   node tools/grim.js report --gaps [--games N] [--policy P] [--all] [--json]
 *                                       pools per draw source vs floors and depth targets; empty draws and cards per day
 *   node tools/grim.js dupes [FILE…] [--threshold 0.6] [--strict]
 *                                       near-duplicate events (5-word shingle Jaccard); with files, only pairs touching them
 *   node tools/grim.js batch NAME --files a.grim,b.grim [--critic FILE] [--skip-balance]
 *                                       validate an authoring batch: build, lint, balance --quick, dupes, canon,
 *                                       i18n zh-CN, the critic's verdict; writes build/batches/NAME.json
 *   node tools/grim.js schema [--update]
 *                                       check the format against the frozen manifest (test/golden/schema-v1.json):
 *                                       removals fail, additions are listed (--update records them)
 *   node tools/grim.js canon            proper nouns in player-visible text that the worldbook doesn't know
 *   node tools/grim.js feedback [PATH…] [--event ID] [--json]
 *                                       summarise playtest feedback from exported run logs (default: feedback/)
 *   node tools/grim.js i18n [lang]      no lang: translation coverage per language.
 *                                       with lang (e.g. zh-CN): create/update locales/<lang>/*.lang — adds new
 *                                       keys (empty), stamps [hash]es, flags stale entries, moves obsolete ones
 *                                       to _obsolete.lang. Run after any content change, then translate the gaps.
 *   node tools/grim.js sim ... --lang zh-CN   play with a translation applied (catches broken {tokens})
 */
'use strict';
const fs = require('fs');
const path = require('path');
const G = require('../src/grimoire.js');
const Engine = require('../src/engine.js');
const Art = require('../src/art.js');
const I18n = require('../src/i18n.js');
const Fmt = require('./format.js');
const Query = require('./query.js');
const Policies = require('./policies.js');

const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const BUNDLE = path.join(ROOT, 'build', 'content.bundle.js');
const LOCALES = path.join(ROOT, 'locales');

const P = require('./project.js').project(ROOT);
const { listFiles, rel, localeLangs, loadLocaleSources, loadSources, compileAll } = P;

const C = process.stdout.isTTY ? { r: '\x1b[31m', y: '\x1b[33m', g: '\x1b[32m', d: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m' } : { r: '', y: '', g: '', d: '', b: '', x: '' };

/* ------------------------------------------------------------------ build */
function build(opts = {}) {
  const { sources, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(C.r + 'error ' + C.x + e.message)); console.error(C.r + 'build failed' + C.x); process.exit(1); }
  fs.mkdirSync(path.dirname(BUNDLE), { recursive: true });
  const { text, locales } = P.bundleText(sources);
  if (opts.check) {
    const fresh = fs.existsSync(BUNDLE) && fs.readFileSync(BUNDLE, 'utf8') === text;
    console.log(fresh ? 'build: bundle is up to date' : C.r + 'build: build/content.bundle.js is stale' + C.x + ' — run node tools/grim.js build (the file:// game loads it)');
    // The combat minigame's bundle (combat/tools/bundle.mjs): built from combat/, committed like the content bundle.
    const stale = require('../combat/tools/bundle-hash.cjs').staleReason();
    console.log(stale ? C.r + 'build: ' + stale + C.x : 'build: combat bundle is up to date');
    return fresh && !stale;
  }
  fs.writeFileSync(BUNDLE, text);
  const nLoc = Object.values(locales).reduce((n, a) => n + a.length, 0);
  console.log(C.g + 'built ' + C.x + path.relative(ROOT, BUNDLE) + ' (' + sources.length + ' content files, ' + nLoc + ' locale files in ' + Object.keys(locales).length + ' language(s), ' + (text.length / 1024).toFixed(0) + ' KB)');
}

/* ------------------------------------------------------------------ lint */
const KNOWN_BONDS = new Set(['none', 'friend', 'close', 'rival', 'nemesis', 'partner', 'ex']);
const SPECIAL_IDS = new Set(G.IDENTS);
const PRONOUN_KEYS = new Set(['they', 'them', 'their', 'theirs', 'are', 's', 'name', 'fullname', 'title', 'house']);

let ROLES = new Set();   // cast role names of the event being scanned (valid character references)
let IN_EVENT = false;    // scanning an event's effects (raw amounts are legacy there)
let CUR_TRACK = null;    // the scanned event's track (a wage is paid only in a job's own events)
function analyze(content) {
  // `member(club)`, `applied(internship)`, `leave job`: any track of that kind
  const KIND_ARGS = new Set(Object.values(content.tracks || {}).map((d) => d.kind));
  // Collect everything that is set / referenced, with locations.
  const A = { flagsSet: {}, flagsRead: {}, varsSet: {}, varsRead: {}, queued: {}, statesRef: {}, npcsRef: {}, endingsRef: {}, eventsRef: {}, problems: [], legacy: [] };
  const add = (map, k, where) => { (map[k] = map[k] || []).push(where); };
  const P = (level, where, msg) => A.problems.push({ level, where, msg });
  const taught = A.taught = new Set();   // spells some card or track teaches (spells v2: a spell with no source needs a pool)

  function scanExpr(ex, where, hasActor) {
    if (!ex) return;
    G.walkAst(ex.ast, (n) => {
      if (n.t === 'id') {
        if (n.n === 'npc' && !hasActor) P('error', where, '"npc" used but this block has no actor: ' + ex.src);
        if (!SPECIAL_IDS.has(n.n) && !content.resources[n.n] && !content.skills[n.n]) add(A.varsRead, n.n, where);
      }
      if (n.t === 'call') {
        const refs = G.FUNC_REFS[n.n] || [];
        n.args.forEach((a, i) => {
          const kind = refs[i];
          if (a.t !== 'sym') return;
          if (kind === 'flagOrState') { if (!content.states[a.v]) add(A.flagsRead, a.v, where); }
          else if (kind === 'flag') add(A.flagsRead, a.v, where);
          else if (kind === 'state') add(A.statesRef, a.v, where);
          else if (kind === 'npc') { if (!ROLES.has(a.v)) add(A.npcsRef, a.v, where); }
          else if (kind === 'event') add(A.eventsRef, a.v, where);
          else if (kind === 'track') { if (!content.tracks[a.v] && !(['member', 'applied', 'rank', 'performance'].includes(n.n) && KIND_ARGS.has(a.v)) && !(n.n === 'kind_is' && a.v === 'track')) P('error', where, n.n + '(): unknown track "' + a.v + '"'); }
          else if (kind === 'clue') { if (!content.clues[a.v]) P('error', where, 'clue(' + a.v + '): no @clue ' + a.v); }
          if ((n.n === 'bonds' || n.n === 'bonds_around') && !KNOWN_BONDS.has(a.v)) P('warn', where, 'unknown bond status "' + a.v + '"');
          if (n.n === 'offered' && !['courses', 'clubs', 'jobs'].includes(a.v)) P('error', where, 'offered(): takes courses, clubs or jobs, not "' + a.v + '"');
        });
        if (n.n === 'chosen' && n.args[0] && n.args[0].t === 'sym' && n.args[1] && n.args[1].t === 'sym') {
          const ev = content.events[n.args[0].v];
          if (ev && !ev.options.some((o) => o.key === n.args[1].v)) P('error', where, 'chosen(' + n.args[0].v + ', ' + n.args[1].v + '): event has no such option');
        }
      }
      if (n.t === 'str' && /^(friend|close|rival|nemesis|partner|ex|none)$/.test(n.v) === false && ex.src.includes('bond(')) {
        // bond comparisons with unknown status
        if (/^[a-z]+$/.test(n.v)) P('warn', where, 'bond compared with unknown status "' + n.v + '"');
      }
    });
  }
  function scanText(text, where, hasActor) {
    if (!text) return;
    const tt = G.textTokens(text);
    for (const c of tt.conds) { try { scanExpr(G.expr(c), where, hasActor); } catch (e) { P('error', where, 'bad condition in {' + c + ': …}: ' + e.message); } }
    for (const k of tt.tokens) {
      if (['player', 'month', 'year'].includes(k)) continue;
      if (k[0] === '=') { try { const ex = G.expr(k.slice(1)); scanExpr(ex, where, hasActor); } catch (e) { P('error', where, 'bad {=expr}: ' + e.message); } continue; }
      if (content.npcs[k]) { add(A.npcsRef, k, where); continue; }
      if (ROLES.has(k) || k === 'track' || k === 'place') continue;
      const [head, key] = k.includes('.') ? k.split('.') : [null, k];
      if (head && ROLES.has(head)) continue;
      if (head && head !== 'npc' && !content.npcs[head]) { P('error', where, 'unknown npc in {' + k + '}'); continue; }
      if (!PRONOUN_KEYS.has(key.toLowerCase()) && key !== 'npc') { P('error', where, 'unknown text token {' + k + '}'); continue; }
      if (!head && !hasActor) P('error', where, '{' + k + '} needs an actor (this block has none)');
    }
  }
  // Ladder checks (docs/authoring/checks.md): the rules the guide states that the format can see. Legacy tiers are
  // left alone until the rewrite moves them.
  function lintChecks(e, o) {
    const rung = (w) => (content.balance.dc_tiers || {})[w] != null ? content.balance.dc_tiers[w] : (G.RANKS.indexOf(w.replace(/[+-]$/, '')) * 12 + (w.endsWith('-') ? 0 : w.endsWith('+') ? 8 : 4));
    const track = e.track && content.tracks[e.track];
    G.walkEffects(o.effects, (st) => {
      if (st.t !== 'challenge' || !st.ladder) return;
      const w = e.file + ':' + st.line;
      if (st.standard && !(track && track.kind === 'course')) P('error', w, 'challenge standard: only a course card has a course standard (use a rung)');
      if (st.kind === 'exam' && !(track && track.kind === 'course')) P('warn', w, 'challenge exam: only for course tests (pick the kind that fits the action)');
      if (st.using && (G.CHALLENGE_KINDS[st.kind] || []).length === 1 && G.CHALLENGE_KINDS[st.kind][0] === st.using) P('warn', w, 'challenge using ' + st.using + ': already the default for ' + st.kind);
      if (st.rung && rung(st.rung) >= rung('grandmaster+')) {
        if (!['story', 'milestone'].includes(e.class)) P('warn', w, 'challenge ' + st.rung + ': legendary difficulty belongs on story or milestone cards');
        if (!st.partial || !e.options.some((x) => !hasChallenge(x.effects))) P('warn', w, 'challenge ' + st.rung + ': a legendary check needs partial: and an option without the check');
      }
      let ends = false; G.walkEffects(st.lose || [], (x) => { if (x.t === 'end') ends = true; });
      if (ends && !st.partial && !['certain', 'sure', 'likely'].includes(st.odds)) P('warn', w, 'challenge: losing ends the run; add partial: or make it likely or better');
      for (const x of st.steps || []) if (Object.keys(content.skills).some((k) => new RegExp('\\b' + k + '\\b').test(x.cond.src))) P('warn', w, 'challenge step "' + x.cond.src + '": steps are for facts of the world; skill is already in the roll');
    });
  }
  const hasChallenge = (effects) => { let f = false; G.walkEffects(effects || [], (x) => { if (x.t === 'challenge') f = true; }); return f; };
  function scanEffects(effects, where, hasActor) {
    G.walkEffects(effects, (st) => {
      const w = where.replace(/:\d+$/, '') + ':' + st.line;
      if (st.tier && !st.preset && ['delta', 'rel', 'spark', 'npc_rel'].includes(st.t)) {
        const row = st.t === 'delta' ? (content.skills[st.name] ? 'xp' : st.name) : st.t === 'npc_rel' ? 'rel' : st.t;
        if (content.balance && content.balance.sizes && !content.balance.sizes[row]) P('error', w, 'no size tiers for "' + row + '" in @balance sizes');
      }
      // Raw amounts are legacy in events only, and only for tiered rows (custom counters like `hollow +1` stay raw).
      if (IN_EVENT && !st.tier && !st.preset && ['delta', 'rel', 'spark'].includes(st.t) && st.min != null && (st.t !== 'delta' || content.resources[st.name] || content.skills[st.name])) A.legacy.push({ where: w, what: 'raw number (use a size tier)' });
      if (st.legacy) A.legacy.push({ where: w, what: '"love" (now "spark")' });
      if (st.t === 'check') A.legacy.push({ where: w, what: '"check" (use "challenge")' });
      if ((st.t === 'delta' || st.t === 'assign') && st.name === 'grades') A.legacy.push({ where: w, what: 'Standing ("grades"; GPA replaces it in phase 2b)' });
      switch (st.t) {
        case 'delta': case 'assign':
          if (!content.resources[st.name] && !content.skills[st.name]) add(A.varsSet, st.name, w);
          if (st.expr) scanExpr(st.expr, w, hasActor);
          if (SPECIAL_IDS.has(st.name)) P('error', w, 'cannot assign to built-in "' + st.name + '"');
          break;
        case 'say': { scanText(st.text, w, hasActor); const n = longestRendering(st.text); if (n > 320) P('warn', w, 'say text is long (' + n + ' chars at its longest)'); break; }
        case 'flag': st.names.forEach((n) => add(A.flagsSet, n, w)); break;
        case 'unflag': break;
        case 'gain': case 'lose': if (!content.states[st.state]) P('error', w, st.t + ': unknown state "' + st.state + '"'); add(A.statesRef, st.state, w); if (st.dur) scanExpr(st.dur, w, hasActor); break;
        case 'queue':
          if (st.tagged) {
            // `queue any tagged <tag>` (feedback 2026-10-16): the pool is every queued event with the tag.
            const pool = Object.values(content.events).filter((e) => e.trigger === 'queued' && (e.tags || []).includes(st.tagged));
            if (!pool.length) P('error', w, 'queue any tagged ' + st.tagged + ': no queued event has that tag');
            for (const e of pool) add(A.queued, e.id, w);
          } else {
            if (!content.events[st.event]) P('error', w, 'queue: unknown event "' + st.event + '"');
            add(A.queued, st.event, w);
          }
          if (st.with === 'npc' && !hasActor) P('error', w, 'queue ... with npc: block has no actor');
          else if (st.with && st.with !== 'npc' && !content.npcs[st.with] && !ROLES.has(st.with)) P('error', w, 'queue ... with: unknown npc "' + st.with + '"');
          if (st.delay) scanExpr(st.delay, w, hasActor);
          if (st.chance != null && (st.chance < 1 || st.chance > 99)) P('error', w, 'queue ... chance: must be 1–99 (got ' + st.chance + ')');
          break;
        case 'rel': case 'spark': case 'bond': case 'meet': case 'cool':
          if (ROLES.has(st.npc)) break;
          if (st.npc === 'npc') { if (!hasActor) P('error', w, st.t + ' npc: block has no actor'); }
          else if (!content.npcs[st.npc]) P('error', w, st.t + ': unknown npc "' + st.npc + '"');
          else add(A.npcsRef, st.npc, w);
          if (st.t === 'bond' && !KNOWN_BONDS.has(st.status)) P('warn', w, 'unknown bond status "' + st.status + '" (known: ' + [...KNOWN_BONDS].join(', ') + ')');
          if (st.t === 'spark') { const id = st.npc === 'npc' ? null : st.npc; if (id && content.npcs[id] && !content.npcs[id].romance) P('warn', w, 'spark change on non-romanceable npc "' + id + '"'); }
          break;
        case 'end': if (!content.endings[st.ending]) P('error', w, 'end: unknown ending "' + st.ending + '"'); add(A.endingsRef, st.ending, w); break;
        case 'learn': if (!content.facts[st.fact]) P('error', w, 'learn: unknown fact "' + st.fact + '"'); break;
        case 'enrol': case 'join': case 'leave': case 'promote': case 'apply': case 'perform': case 'rank_xp': case 'progress':
          if (st.track !== 'track' && !KIND_ARGS.has(st.track) && !content.tracks[st.track]) P('error', w, st.t + ': unknown track "' + st.track + '"');
          else if (['perform', 'rank_xp', 'promote'].includes(st.t) && content.tracks[st.track] && content.tracks[st.track].kind === 'society') P('error', w, st.t + ': ' + st.track + ' is a society (no performance or ranks)');
          break;
        case 'study': if (st.track && st.track !== 'track' && !(content.tracks[st.track] && content.tracks[st.track].kind === 'course')) P('error', w, 'study: "' + st.track + '" is not a course'); break;
        case 'discover': if (!content.places[st.place]) P('error', w, 'discover: unknown place "' + st.place + '"'); break;
        case 'find': if (!content.clues[st.clue]) P('error', w, 'find: no @clue "' + st.clue + '"');
          else if (/^content\/batches\//.test(w)) { const key = Object.values(content.arcs).some((a) => (a.key_clues || []).includes(st.clue)); if (key) P('error', w, 'find ' + st.clue + ': only hard-canon events may grant key clues'); }
          break;
        case 'advance': if (!content.arcs[st.arc]) P('error', w, 'advance: unknown arc "' + st.arc + '"'); else if (/^content\/batches\//.test(w)) P('error', w, 'advance: only hard-canon events move an arc clock'); break;
        case 'spawn': if (!content.archetypes[st.archetype]) P('error', w, 'spawn: unknown archetype "' + st.archetype + '"'); break;
        case 'unqueue': if (!content.events[st.event]) P('error', w, 'unqueue: unknown event "' + st.event + '"'); break;
        case 'learn_spell': {
          const sp = content.spells[st.spell];
          if (!sp) { P('error', w, 'learn_spell: unknown spell "' + st.spell + '"'); break; }
          taught.add(st.spell);
          if (st.level && sp.cost && st.level > sp.cost.length) P('error', w, 'learn_spell ' + st.spell + ' ' + st.level + ': the spell has ' + sp.cost.length + ' level(s)');
          break;
        }
        case 'regrade': if (st.track !== 'track' && !(content.tracks[st.track] && content.tracks[st.track].kind === 'course')) P('error', w, 'regrade: "' + st.track + '" is not a course'); break;
        case 'npc_rel': for (const x of [st.a, st.b]) { if (x === 'npc') { if (!hasActor) P('error', w, 'npc_rel npc: block has no actor'); } else if (!content.npcs[x]) P('error', w, 'npc_rel: unknown npc "' + x + '"'); } break;
        case 'challenge':
          if (!G.CHALLENGE_KINDS[st.kind]) P('error', w, 'challenge: unknown kind "' + st.kind + '" (' + Object.keys(G.CHALLENGE_KINDS).join(' ') + ')');
          if (st.using && !content.skills[st.using] && !content.resources[st.using]) P('error', w, 'challenge using: unknown skill or resource "' + st.using + '"');
          if (st.vs) {
            if (st.vs.who === 'npc' ? !hasActor : !content.npcs[st.vs.who] && !ROLES.has(st.vs.who)) P('error', w, 'challenge vs: unknown character or cast role "' + st.vs.who + '"');
            if (!content.skills[st.vs.stat] && !['wealth', 'rel', 'spark'].includes(st.vs.stat)) P('error', w, 'challenge vs: "' + st.vs.stat + '" is not a skill, wealth, rel or spark');
          }
          for (const x of st.steps || []) scanExpr(x.cond, w, hasActor);
          break;
        case 'visit': {
          const recipeSlots = new Set([...(content.game.day_term || []), ...(content.game.day_break || [])].map((r) => r.slot));
          if (!recipeSlots.has(st.slot)) P('error', w, 'visit: "' + st.slot + '" is in no day recipe');
          else if (!Object.values(content.places).some((p) => (p.open || []).includes(st.slot))) P('warn', w, 'visit: no place is open at ' + st.slot);
          break;
        }
        case 'coursework': {
          const id = st.track && st.track !== 'track' ? st.track : CUR_TRACK;
          if (!(id && content.tracks[id] && content.tracks[id].kind === 'course')) P('error', w, 'coursework: ' + (st.track && st.track !== 'track' ? '"' + st.track + '" is not a course' : 'only a course\'s own events (track: <course>) give coursework, or name the course'));
          break;
        }
        case 'wage': {
          const words = Object.assign({ short: 0.5, full: 1, overtime: 2 }, (content.balance && content.balance.wage) || {});
          if (st.size && words[st.size] == null) P('error', w, 'wage: unknown wage word "' + st.size + '" (' + Object.keys(words).join(' ') + ')');
          if (IN_EVENT && !(CUR_TRACK && content.tracks[CUR_TRACK] && ['job', 'internship'].includes(content.tracks[CUR_TRACK].kind))) P('error', w, 'wage: only a job\'s or internship\'s own events (track: <job>) pay a wage');
          break;
        }
        case 'if': st.branches.forEach((b) => scanExpr(b.cond, w, hasActor)); break;
        case 'chance': if (st.p) scanExpr(st.p, w, hasActor); for (const x of st.steps || []) scanExpr(x.cond, w, hasActor); break;
        case 'check': if (!content.skills[st.skill]) P('error', w, 'check: unknown skill "' + st.skill + '"'); scanExpr(st.dc, w, hasActor); break;
      }
    });
  }

  const loc = (d) => d.file + ':' + d.line;
  for (const e of Object.values(content.events)) {
    const hasActor = !!e.actor || !!e.cast;
    ROLES = new Set((e.cast || []).map((r) => r.role)); IN_EVENT = true; CUR_TRACK = e.track || null;
    const w = loc(e);
    if (e.actor && !['any', 'npc'].includes(e.actor) && !content.npcs[e.actor]) P('error', w, 'actor: unknown npc "' + e.actor + '"');
    if (e.trigger === 'social' && !e.actor && !e.per) P('warn', w, 'social event without actor (or per: <cast role>)');
    if (e.art && !Art.has(e.art)) P('warn', w, 'unknown art "' + e.art + '" (see src/art.js; available: ' + Art.list().join(' ') + ')');
    if (!e.art) P('info', w, 'event has no art');
    scanExpr(e.when, w, hasActor); scanExpr(e.weight, w, hasActor); if (e.defer) scanExpr(e.defer, w, hasActor);
    if (e.ramp) { scanExpr(e.ramp.expr, w, hasActor); if (e.trigger === 'queued' || e.trigger === 'auto') P('warn', w, 'ramp: a queued or auto event is pushed already; the ramp is ignored'); }
    scanText(e.title, w, hasActor); scanText(e.text, w, hasActor); scanText(e.scene, w, hasActor);
    { const n = longestRendering(e.text || ''); if (n > 480) P('warn', w, 'card text is long (' + n + ' chars at its longest; aim for < 400)'); }
    scanEffects(e.on_show, w, hasActor);
    if (e.actor === 'any') A.legacy.push({ where: w, what: '"actor: any" (use a cast: role)' });
    if (e.place && !content.places[e.place]) P('error', w, 'place: unknown place "' + e.place + '"');
    { // a slot an event needs must exist in a day recipe, and a place event's slot gate must be an open, visited slot
      const recipeSlots = new Set([...(content.game.day_term || []), ...(content.game.day_break || [])].map((r) => r.slot));
      if (e.slot && recipeSlots.size && !recipeSlots.has(e.slot)) P('error', w, 'slot: "' + e.slot + '" is in no day recipe');
      for (const sl of e.time || []) if (recipeSlots.size && !recipeSlots.has(sl)) P('error', w, 'time: "' + sl + '" is in no day recipe');
      if (e.slot && (e.time || []).length) P('warn', w, 'time: is ignored when slot: requires one slot');
      const pl = e.place && content.places[e.place];
      for (const m of ((e.when && e.when.src) || '').matchAll(/slot == "(\w+)"/g)) if (pl && pl.open && !pl.open.includes(m[1])) P('warn', w, 'when needs slot "' + m[1] + '" but ' + e.place + ' is closed then');
    }
    if (e.track && !content.tracks[e.track]) P('error', w, 'track: unknown track "' + e.track + '"');
    if (e.arc && !content.arcs[e.arc]) P('error', w, 'arc: unknown arc "' + e.arc + '"');
    if (e.plan && !content.states['plan_' + e.plan]) P('error', w, 'plan: no @state plan_' + e.plan);
    if (e.replaces && !e.place) P('error', w, 'replaces: needs a place:');
    if (e.per && !(e.cast || []).some((r) => r.role === e.per)) P('error', w, 'per: "' + e.per + '" is not one of this event\'s cast roles');
    for (const r of e.cast || []) {
      if (r.pool === 'fixed' && !content.npcs[r.npc]) P('error', w, 'cast ' + r.role + ': unknown character "' + r.npc + '"');
      if (r.pool === 'present' && r.place && r.place !== 'place' && !content.places[r.place]) P('error', w, 'cast ' + r.role + ': unknown place "' + r.place + '"');
      if (r.where) scanExpr(r.where, w, true);
    }
    if (!e.class) A.legacy.push({ where: w, what: 'no class: (routine, milestone, incident, windfall, story, crisis)' });
    if (e.tone && content.vocab.tones && !content.vocab.tones.values.includes(e.tone)) P('error', w, 'tone "' + e.tone + '" is not in @vocab tones');
    if (e.class) budgetCheck(e, content, (lvl, msg) => P(lvl, w, msg));
    crownCheck(e, content, (lvl, msg) => P(lvl, w, msg));
    for (const o of e.options) {
      const ow = e.file + ':' + o.line;
      if (o.spell && !content.spells[o.spell]) P('error', ow, 'up[' + o.spell + ']: unknown spell');
      // Previews must be exact (design §8.3): no rand() in an option's effects.
      G.walkEffects(o.effects, (st) => { const ex = st.expr || st.p || st.dc || st.delay; if (ex && /\brand\(/.test(ex.src)) P('error', e.file + ':' + st.line, 'rand() in an option can\'t be previewed: use a chance or a range (a~b)'); });
      if (o.memory) {
        if (content.vocab.memory_kinds && !content.vocab.memory_kinds.values.includes(o.memory.kind)) P('error', ow, 'memory: "' + o.memory.kind + '" is not in @vocab memory_kinds');
        if (o.memory.who === 'npc' ? !hasActor : !content.npcs[o.memory.who]) P('error', ow, 'memory: unknown character "' + o.memory.who + '"');
      }
      scanText(o.label, ow, hasActor); scanText(o.hint, ow, hasActor); scanExpr(o.when, ow, hasActor);
      { const n = longestRendering(o.label); if (n > 42) P('warn', ow, 'option label is long (' + n + ' chars; aim for < 36)'); }
      scanEffects(o.effects, ow, hasActor);
      lintChecks(e, o);
    }
    if (e.options.length > 1 && e.options.every((o) => o.when)) P('warn', w, 'every option has a "when" — the card can soft-lock if none are available');
    ROLES = new Set(); IN_EVENT = false;
  }
  for (const s of Object.values(content.states)) ['tick', 'on_add', 'on_expire', 'on_remove'].forEach((k) => scanEffects(s[k], loc(s), false));
  fightLint(content, P, loc);
  for (const h of Object.values(content.hooks)) { scanExpr(h.when, loc(h), false); scanEffects(h.do, loc(h), false); if (!['game_start', 'month_start', 'month_end', 'term_start', 'term_end'].includes(h.on)) P('error', loc(h), 'hook "on" must be game_start, month_start, month_end, term_start or term_end'); }
  for (const r of Object.values(content.resources)) scanEffects(r.on_zero, loc(r), false);
  for (const en of Object.values(content.endings)) {
    scanExpr(en.when, loc(en), false); scanText(en.text, loc(en), false);
    // Yearbook slots (design §10.5): game-over endings stay exclusive; a headline fallback has no `when`.
    if (en.slot && !['headline', 'mystery', 'relationships', 'personal'].includes(en.slot)) P('error', loc(en), 'slot: "' + en.slot + '" is not headline, mystery, relationships or personal');
    if (en.slot && en.kind === 'early') P('error', loc(en), 'an early (game-over) ending takes no slot');
    for (const x of en.excludes || []) if (!content.endings[x]) P('error', loc(en), 'excludes: unknown ending "' + x + '"');
  }
  if (!Object.values(content.endings).some((en) => en.kind !== 'early' && (en.slot || 'headline') === 'headline' && !en.when)) P('error', '-', 'no headline fallback ending (a final ending with no slot or slot: headline, and no when)');
  for (const n of Object.values(content.npcs)) { if (!n.name) P('error', loc(n), 'npc needs a name'); if (n.pronouns && !/^(she|he|they)\b/.test(n.pronouns)) P('warn', loc(n), 'pronouns should start with she/he/they'); }

  analyzeWorld(content, P, scanExpr, scanText, taught);

  // Cross-reference results
  for (const [f, ws] of Object.entries(A.flagsRead)) if (!A.flagsSet[f]) P('warn', ws[0], 'flag "' + f + '" is read but never set (typo?)' + (ws.length > 1 ? ' [+' + (ws.length - 1) + ' more]' : ''));
  for (const [v, ws] of Object.entries(A.varsRead)) if (!A.varsSet[v]) P('warn', ws[0], 'identifier "' + v + '" is not a resource/skill and is never assigned (typo?)');
  for (const [s, ws] of Object.entries(A.statesRef)) if (!content.states[s]) P('error', ws[0], 'unknown state "' + s + '"');
  for (const [n, ws] of Object.entries(A.npcsRef)) if (!content.npcs[n]) P('error', ws[0], 'unknown npc "' + n + '"');
  for (const [ev, ws] of Object.entries(A.eventsRef)) if (!content.events[ev]) P('error', ws[0], 'unknown event "' + ev + '"');
  // The engine itself queues these at term end (design §6.2).
  for (const id of ['track_warning', 'track_promotion', 'job_term_review'].concat(content.game.spark_cooldown ? [content.game.spark_cooldown] : [])) A.queued[id] = A.queued[id] || ['engine'];
  // The exam card (`@game exam:`) is pushed by the engine for each enrolled course (M4).
  if (content.game.exam) A.queued[content.game.exam] = A.queued[content.game.exam] || ['engine'];
  // The off-shift hint (`@game off_shift:`, I1) is pushed by the director on a job visit after the term's last shift.
  if (content.game.off_shift) A.queued[content.game.off_shift] = A.queued[content.game.off_shift] || ['engine'];
  // The appeal card (`@game appeal:`, N4) after a failed course, and a track's `intro:` card when you join it (N1).
  if (content.game.appeal) A.queued[content.game.appeal] = A.queued[content.game.appeal] || ['engine'];
  for (const d of Object.values(content.tracks)) if (d.intro) A.queued[d.intro] = A.queued[d.intro] || ['track ' + d.id];
  for (const d of Object.values(content.tracks)) if (d.start) A.queued[d.start] = A.queued[d.start] || ['track ' + d.id + ' start'];
  for (const k of ['appeal', 'off_shift', 'exam', 'spark_cooldown']) if (content.game[k] && !content.events[content.game[k]]) P('error', 'content/core/rules.grim', '@game ' + k + ': unknown event "' + content.game[k] + '"');
  // `@game afford:` (review fixes) names a resource; options that charge it up front lock when you can't pay.
  if (content.game.afford && !content.resources[content.game.afford]) P('error', 'content/core/rules.grim', '@game afford: unknown resource "' + content.game.afford + '"');
  // No unavoidable crown loss outside incidents (review fixes): every other card keeps one always-available option
  // that can't cost the afford resource for certain (a cost on every branch counts as certain).
  if (content.game.afford) {
    const res = content.game.afford;
    const loses = (effs) => (effs || []).some((st) => {
      if (st.t === 'delta' && st.name === res) return st.tier ? st.sign < 0 : Math.max(st.min, st.max) < 0;
      if (st.t === 'challenge') return [st.win, st.partial, st.lose].filter(Boolean).length > 0 && [st.win, st.partial, st.lose].filter(Boolean).every(loses);
      if (st.t === 'chance') return loses(st.body) && loses(st.else);
      if (st.t === 'if') return !!st.else && st.branches.every((b) => loses(b.body)) && loses(st.else);
      return false;
    });
    for (const e of Object.values(content.events)) {
      if (e.class === 'incident' || !(e.options || []).length) continue;
      const where = e.file + ':' + e.line;
      if (loses(e.on_show)) { P('error', where, e.id + ': loses ' + res + ' on show; only an incident may take ' + res + ' unavoidably'); continue; }
      if (e.offers) continue;   // generated menus (courses, clubs, jobs) list free choices of their own
      const free = e.options.some((o) => !o.when && !o.spell && !loses(o.effects));
      if (!free) P('error', where, e.id + ': every always-available option costs ' + res + '; give one a way out or make the card an incident');
    }
  }
  for (const e of Object.values(content.events)) if (e.trigger === 'queued' && !A.queued[e.id]) P('warn', loc(e), 'queued-only event "' + e.id + '" is never queued (orphan)');
  for (const st of Object.values(content.states)) if (!A.statesRef[st.id]) P('info', loc(st), 'state "' + st.id + '" is never gained');
  if (!Object.keys(content.endings).length) P('error', '-', 'no @ending defined');
  return A;
}

// Worldbook blocks (design §3): references, vocabularies, structured values, adults-only romance.
// Event classes (design §8.7). Option values come from the preview engine on a fresh game state, in
// medium-equivalents: Σ weight × change / medium-size, using @balance weights and sizes.
// Length of the longest way a text can render: each {…|…} group counts as its longest alternative
// (conditions dropped), innermost first.
function longestRendering(text) {
  let t = String(text), prev;
  do {
    prev = t;
    t = t.replace(/\{([^{}]*)\}/g, (m, inner) => {
      if (!inner.includes('|') && !/^[^:]+:\s/.test(inner)) return m.length > 12 ? 'xxxxxxxx' : 'xxxxxx';   // a token ({npc}, {=expr})
      const body = inner.replace(/^[~&]/, '').replace(/^[^|:]+:\s?/, (c) => (/[=<>!]|^\s*[a-z_]+(\(|\s*$)/.test(c.slice(0, -1).trim()) || /^[a-z_]+:\s?$/.test(c) ? '' : c));
      return body.split('|').reduce((a, b) => (b.length > a.length ? b : a), '');
    });
  } while (t !== prev);
  return t.length;
}

// Crown amounts named in a card must be amounts the card actually moves (playtest 2: texts said 10 and 20 while
// the gold row pays 8 and 15). Cards that move no gold (a fine nobody charges, a coin trick) are flavour.
const CROWN_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20, 'twenty-five': 25, thirty: 30, forty: 40, fifty: 50, sixty: 60, hundred: 100 };
const CROWN_RE = new RegExp('\\b(\\d+|' + Object.keys(CROWN_WORDS).join('|') + ')\\s+(?:gold|crowns?)\\b', 'gi');
function crownCheck(e, content, P) {
  if (e.when && e.when.src === 'false') return;
  const row = (content.balance && content.balance.sizes && content.balance.sizes.gold) || [3, 8, 15, 30, 60];
  const TI = { tiny: 0, small: 1, medium: 2, large: 3, huge: 4 };
  const moved = new Set(), texts = [e.title, e.text];
  const walk = (effs) => G.walkEffects(effs || [], (st) => {
    if (st.t === 'delta' && st.name === 'gold') { if (st.tier) moved.add(row[TI[st.tier]]); for (const k of ['min', 'max', 'amount']) if (typeof st[k] === 'number') moved.add(Math.abs(st[k])); }
    if (st.t === 'say') texts.push(st.text);
  });
  walk(e.on_show);
  for (const o of e.options) { texts.push(o.label, o.hint); walk(o.effects); }
  if (!moved.size) return;
  for (const t of texts) for (const m of String(t || '').matchAll(CROWN_RE)) {
    const v = CROWN_WORDS[m[1].toLowerCase()] != null ? CROWN_WORDS[m[1].toLowerCase()] : +m[1];
    if (!moved.has(v)) P('warn', 'names "' + m[0] + '" but the card moves ' + [...moved].sort((a, b) => a - b).join(', ') + ' gold');
  }
}
// Fights (2026-10-18): every combat and duel challenge is played in the combat minigame, so it must sit on an option (the UI
// plays it before the choice resolves), at most one on any path through that option, and the minigame must know its foe
// (combat/setup/foes.mjs EVENTS, read from build/combat.bundle.js; without a decision a generic student is fought).
function fightLint(content, P, loc) {
  const isFight = (st) => st.t === 'challenge' && (st.kind === 'combat' || st.kind === 'duel');
  // The most fights any one path through these effects can meet.
  const most = (effs) => (effs || []).reduce((n, st) => {
    if (st.t === 'if') return n + Math.max(...st.branches.map((b) => most(b.body)), most(st.else));
    if (st.t === 'challenge') return n + (isFight(st) ? 1 : 0) + Math.max(most(st.win), most(st.partial), most(st.lose));
    if (st.body) return n + Math.max(most(st.body), most(st.else));
    return n;
  }, 0);
  let EVENTS = null;
  try { EVENTS = require('../build/combat.bundle.js').EVENTS; } catch (e) { P('warn', 'build/combat.bundle.js', 'cannot read the combat bundle (' + e.message + '): fight foes unchecked'); }
  const used = new Set();
  for (const e of Object.values(content.events)) {
    G.walkEffects(e.on_show, (st) => { if (isFight(st)) P('error', e.file + ':' + st.line, 'a ' + st.kind + ' challenge must be on an option (fights are played before the choice resolves), not in on_show'); });
    for (const o of e.options) {
      if (most(o.effects) > 1) P('error', e.file + ':' + o.line, 'option "' + o.key + '" can meet more than one fight on one path (a choice plays at most one)');
      let n = 0; G.walkEffects(o.effects, (st) => { if (isFight(st)) n++; });
      if (!n || !EVENTS) continue;
      const key = e.id + '/' + o.key; used.add(key);
      if (!EVENTS[key] || !EVENTS[key].play) P('warn', e.file + ':' + o.line, 'fight with no foe decision in combat/setup/foes.mjs EVENTS["' + key + '"] (a generic student will be fought)');
    }
  }
  for (const [what, list] of [['state', Object.values(content.states).flatMap((s) => ['tick', 'on_add', 'on_expire', 'on_remove'].map((k) => [s, s[k]]))], ['hook', Object.values(content.hooks).map((h) => [h, h.do])]])
    for (const [d, effs] of list) G.walkEffects(effs, (st) => { if (isFight(st)) P('error', loc(d), 'a ' + st.kind + ' challenge must be on an event\'s option, not in a ' + what); });
  if (EVENTS) for (const k of Object.keys(EVENTS)) if (!used.has(k)) P('warn', 'combat/setup/foes.mjs', 'EVENTS["' + k + '"] matches no fight in content');
}
function budgetCheck(e, content, P) {
  const bal = content.balance || {};
  const weights = bal.weights || {};
  // A neutral mid-range state, so costs never clamp away (a fresh game may start broke after tuition).
  const eng = budgetCheck.eng = budgetCheck.eng || (() => {
    const x = new Engine(content); x.newGame({ seed: 1, name: 'Lint' });
    // Mid-range of each bar (half its max, at most 50: Mana's pool is about 32 early, 2026-10-18), so a cost isn't clamped.
    for (const [id, r] of Object.entries(content.resources)) x.s.vals[id] = id === 'gold' ? 200 : r.min < 0 ? 0 : Math.min(50, Math.round(x.resMax(r) / 2));
    x.sparkFollow = () => ({ per: 25, cap: 0, partner: 0, cooldown: 101 });   // value what the card says, not spark carried along (M37)
    // Every course enrolled with some preparation, so `study … -tiny` (a skipped lecture) shows as the cost it is (A3).
    // Coursework counts as already given this month: it is the same on every option, so it stays out of their value.
    for (const d of Object.values(content.tracks || {})) if (d.kind === 'course') x.s.tracks[d.id] = { kind: 'course', status: 'enrolled', passed: {}, grades: [], rank: 0, perf: 50, rankXp: 0, visits: 0, due: 0, progress: 0, study: 7, level: 1, cw: x.s.turn };
    // A member of every club, job and placement, so `wage` pays and `wage overtime` counts.
    for (const d of Object.values(content.tracks || {})) if (d.kind !== 'course') x.s.tracks[d.id] = { kind: d.kind, status: 'member', passed: {}, grades: [], rank: 0, perf: 50, rankXp: 0, visits: 0, due: 0, progress: 0, level: 1 };
    // Everyone already met, so a `rel` doesn't read as a first meeting (which would count as leading somewhere).
    for (const n of Object.values(x.s.npcs)) n.met = true;
    return x;
  })();
  const actor = e.actor && !['any', 'npc'].includes(e.actor) ? e.actor : e.actor ? Object.keys(content.npcs)[0] : null;
  const row = (k) => (content.skills[k] ? 'xp' : k.split(':')[0]);
  const medium = (k) => eng.tierAmount(row(k) === 'xp' ? Object.keys(content.skills)[0] : row(k), 'medium') || 7;
  const weight = (k) => weights[row(k)] != null ? weights[row(k)] : 0.5;
  let larges = 0;
  // Track events are previewed in their track's context (performance and progress count as costs).
  const prevCur = eng.s.cur;
  // Cast events get a stand-in cast (distinct characters), so `rel friend -tiny` counts as a cost.
  let cast = null;
  if (e.cast) { const pool = Object.keys(content.npcs); cast = {}; for (const r of e.cast) cast[r.role] = r.pool === 'fixed' ? r.npc : pool.find((id) => !Object.values(cast).includes(id)); }
  eng.s.cur = { id: e.id, track: e.track || null, cast };
  // A cast role named `npc` is the card's actor (the engine reads `npc` as the actor).
  const who = cast && cast.npc ? cast.npc : actor;
  const rows = [];
  for (const o of e.options) {
    let pv; try { pv = eng.preview(e.id, o.key, who); } catch (err) { continue; }
    // Exam preparation (`study`) has no weight in the value; it still counts as a cost or gain between options (A3).
    const value = (d) => Object.entries(d).reduce((a, [k, r]) => (k.startsWith('study:') ? a : a + weight(k) * ((r[0] + r[1]) / 2) / medium(k)), 0);
    const exp = pv.paths.reduce((a, p) => a + p.p * value(p.deltas), 0);
    // A penalty card (incident or crisis) queued at odds (`queue … chance N`, I4, I8) is a risk too.
    let atOdds = false; G.walkEffects(o.effects, (st) => { const q = st.t === 'queue' && st.chance != null && content.events[st.event]; if (q && ['incident', 'crisis'].includes(q.class)) atOdds = true; });
    for (const [k, r] of Object.entries(pv.deltas)) if (Math.max(Math.abs(r[0]), Math.abs(r[1])) >= eng.tierAmount(row(k) === 'xp' ? Object.keys(content.skills)[0] : row(k), 'large')) larges++;
    // The expected change per value, and whether the option is a gamble or leads somewhere (a state, a flag, a queue).
    const per = {}; for (const p of pv.paths) for (const [k, r] of Object.entries(p.deltas)) per[k] = (per[k] || 0) + p.p * (r[0] + r[1]) / 2;
    rows.push({ key: o.key, exp, per, risky: atOdds || pv.paths.length > 1, follows: pv.paths.some((p) => p.follows), gated: !!o.when || !!o.spell });
  }
  // A placeholder card (I7) stands in for content still to write: listed, not judged.
  if (e.class === 'routine' && (e.tags || []).includes('placeholder')) P('info', 'placeholder card (to be replaced with real content)');
  else if (e.class === 'routine') {
    // Design §8.4, §8.8 (playtest 2, A3): no option is obviously best — at least as good as another on every value
    // and better on one, neither a gamble nor leading anywhere — and each option within ±1.5 medium-equivalents.
    // A free option is fine beside one that gives something else (docs/authoring/costs.md).
    const plain = rows.filter((r) => !r.risky && !r.follows && !r.gated);
    // Alignment is a direction, not a gain: options that move it differently are never one "better" than the other.
    const dominates = (a, b) => { let strict = false; for (const k of new Set([...Object.keys(a.per), ...Object.keys(b.per)])) { const x = a.per[k] || 0, y = b.per[k] || 0; if (k === 'alignment' && Math.abs(x - y) > 1e-6) return false; if (x < y - 1e-6) return false; if (x > y + 1e-6) strict = true; } return strict; };
    for (const a of plain) for (const b of plain) if (a !== b && dominates(a, b)) P('error', 'routine option "' + a.key + '" is obviously better than "' + b.key + '" (at least as good on every value; see docs/authoring/costs.md)');
    for (const r of rows) if (Math.abs(r.exp) > 1.5) P('error', 'routine option "' + r.key + '" is worth ' + r.exp.toFixed(1) + ' medium-equivalents (budget ±1.5)');
  }
  eng.s.cur = prevCur;
  if (e.class === 'milestone' && larges > 2) P('warn', 'milestone has ' + larges + ' large changes (cap 2)');
  if (e.class === 'windfall' && larges > 1) P('warn', 'windfall has ' + larges + ' large changes (cap 1)');
  if (e.class === 'incident' && e.options.length < 2) P('warn', 'an incident must offer agency: at least two options');
}

function analyzeWorld(content, P, scanExpr, scanText, taught = new Set()) {
  const loc = (d) => d.file + ':' + d.line;
  const vocab = (id) => (content.vocab[id] ? new Set(content.vocab[id].values || []) : null);
  const inVocab = (list, id, d, what) => { const v = vocab(id); if (!v) return; for (const x of [].concat(list || [])) if (!v.has(x)) P('error', loc(d), what + ' "' + x + '" is not in @vocab ' + id); };
  const slots = vocab('slots');
  const isSkill = (x) => !!content.skills[x];
  for (const n of Object.values(content.npcs)) {
    if (n.age == null) P('error', loc(n), '@npc ' + n.id + ' needs an age (every character is an adult)');
    else if (typeof n.age !== 'number') P('error', loc(n), '@npc age must be a single number');
    if (n.romance && !(n.age >= 18)) P('error', loc(n), 'romance: true needs age 18 or over');
    inVocab(n.traits, 'traits', n, 'trait'); inVocab(n.interests, 'interests', n, 'interest');
    if (n.role) inVocab(n.role, 'roles', n, 'role');
    if (n.seeks) inVocab(n.seeks, 'seeks', n, 'seeks');
    for (const k of Object.keys(n.stats || {})) if (!isSkill(k) && k !== 'wealth') P('error', loc(n), 'stats: "' + k + '" is not a skill (or wealth)');
    if (n.stats && n.stats.wealth != null && !(n.stats.wealth >= 1 && n.stats.wealth <= 5)) P('error', loc(n), 'stats: wealth is 1–5');
    for (const x of [].concat(n.schedule || [], (n.schedule_break && n.schedule_break.entries) || [])) {
      if (!content.places[x.place]) P('error', loc(n), 'schedule: unknown place "' + x.place + '"');
      if (slots) for (const sl of x.slots) if (!slots.has(sl)) P('error', loc(n), 'schedule: unknown slot "' + sl + '"');
      if (x.chance === 0) P('warn', loc(n), 'schedule: ' + x.place + ' at 0% is never used');
    }
    for (const id of Object.keys(n.relations || {})) if (!content.npcs[id]) P('error', loc(n), 'relations: unknown npc "' + id + '"');
    scanExpr(n.gone_when, loc(n), false);
  }
  const PLACE_KINDS = new Set(['public', 'club', 'job', 'thesis', 'internship', 'plan', 'society']);
  for (const d of Object.values(content.places)) {
    if (!d.name) P('error', loc(d), '@place needs a name');
    if (!d.map) P('warn', loc(d), '@place has no map position');
    if (d.region && !(vocab('regions') || new Set([d.region.split(':')[0]])).has(d.region.split(':')[0])) P('error', loc(d), 'region "' + d.region + '" is not in @vocab regions');
    if (d.kind && !PLACE_KINDS.has(d.kind)) P('error', loc(d), 'kind must be one of ' + [...PLACE_KINDS].join(', '));
    if (d.track && !content.tracks[d.track]) P('error', loc(d), 'track: unknown track "' + d.track + '"');
    if (['club', 'job', 'thesis', 'internship'].includes(d.kind) && !d.track) P('warn', loc(d), d.kind + ' place without a track');
    if (slots) for (const sl of d.open || []) if (!slots.has(sl)) P('error', loc(d), 'open: unknown slot "' + sl + '"');
    // A place must open in a slot the day recipes visit, or nobody can ever go there (internship hosts use their own map).
    const visitSlots = new Set([...(content.game.day_term || []), ...(content.game.day_break || [])].filter((r) => r.source === 'visit').map((r) => r.slot));
    if (d.open && d.kind !== 'internship' && visitSlots.size && !d.open.some((sl) => visitSlots.has(sl))) P('error', loc(d), 'open: ' + d.open.join(' ') + ' — never a visit slot (' + [...visitSlots].join(', ') + '), so the place can never be visited');
    scanExpr(d.discover, loc(d), false); scanExpr(d.closed_when, loc(d), false); scanExpr(d.hinted_when, loc(d), false);
    // `always:` (feedback 2026-10-15, -16): the place's fixed cards in order, each an event of this place; a group a|b.
    if (d.always) for (const id of G.alwaysGroups(d.always).flat()) { const e = content.events[id]; if (!e) P('error', loc(d), 'always: no event "' + id + '"'); else if (e.place !== d.id) P('error', loc(d), 'always: "' + id + '" is not an event of this place (place: ' + (e.place || 'none') + ')'); }
  }
  const TRACK_KINDS = new Set(['course', 'club', 'job', 'internship', 'thesis', 'society']);
  for (const d of Object.values(content.tracks)) {
    if (!TRACK_KINDS.has(d.kind)) P('error', loc(d), '@track kind must be one of ' + [...TRACK_KINDS].join(', '));
    if (!d.name) P('error', loc(d), '@track needs a name');
    for (const sk of [].concat(d.skill || [])) if (!isSkill(sk)) P('error', loc(d), 'skill: unknown skill "' + sk + '"');
    if (d.place && !content.places[d.place]) P('error', loc(d), 'place: unknown place "' + d.place + '"');
    if (d.lead && !content.npcs[d.lead]) P('error', loc(d), 'lead: unknown npc "' + d.lead + '"');
    if (d.intro && !content.events[d.intro]) P('error', loc(d), 'intro: unknown event "' + d.intro + '"');
    if (d.start && !content.events[d.start]) P('error', loc(d), 'start: unknown event "' + d.start + '"');
    if (d.start && d.kind !== 'course') P('error', loc(d), 'start: only a course has a start card');
    if (d.intro && !d.lead) P('warn', loc(d), 'intro: without a lead: nobody to meet');
    for (const t of d.teaches || []) { taught.add(t.spell); const sp = content.spells[t.spell]; if (sp && sp.cost && t.level > sp.cost.length) P('error', loc(d), 'teaches ' + t.spell + '@' + t.level + ': the spell has ' + sp.cost.length + ' level(s)'); if (!sp) P('error', loc(d), 'teaches: unknown spell "' + t.spell + '"'); if (d.levels && t.level > d.levels) P('error', loc(d), 'teaches ' + t.spell + '@' + t.level + ': the track has ' + d.levels + ' level(s)'); }
    if (d.level_names && d.levels && d.level_names.split(/\s*,\s*/).length !== d.levels) P('error', loc(d), 'level_names should list ' + d.levels + ' names');
    if (d.pay && d.ranks && d.pay.length !== d.ranks.split(/\s*,\s*/).length) P('error', loc(d), 'pay should have one amount per rank');
    if (d.kind === 'course' && !d.levels) P('error', loc(d), 'a course needs levels:');
    scanExpr(d.prereq, loc(d), false);
  }
  for (const d of Object.values(content.spells)) {
    if (!d.name) P('error', loc(d), '@spell needs a name');
    if (d.discipline && !(content.tracks[d.discipline] && content.tracks[d.discipline].kind === 'course')) P('error', loc(d), 'discipline: "' + d.discipline + '" is not a course @track');
    // Spells v2: one or three levels (one cost per level); power, when given, matches; skills are skill ids.
    if (!d.cost || ![1, 3].includes(d.cost.length)) P('error', loc(d), 'cost: one value per spell level (one or three levels)');
    else if (d.power && d.power.length !== d.cost.length) P('error', loc(d), 'power: one value per spell level (' + d.cost.length + ')');
    for (const k of [].concat(d.skill || [])) if (!content.skills[k]) P('error', loc(d), 'skill: unknown skill "' + k + '"');
    if (d.skill && [].concat(d.skill).length > 2) P('error', loc(d), 'skill: at most two skills');
    if (d.pool && !['hidden', 'forbidden'].includes(d.pool)) P('error', loc(d), 'pool: hidden or forbidden');
    if (d.alignment && !G.TIERS.includes(d.alignment)) P('error', loc(d), 'alignment: a size tier (tiny … huge), charged per cast');
  }
  for (const d of Object.values(content.spells)) if (!d.pool && !taught.has(d.id)) P('info', loc(d), 'spell ' + d.id + ' has no source (no teaches:, no learn_spell) and no pool:');
  for (const d of Object.values(content.facts)) {
    const npc = d.id.split('.')[0];
    if (!content.npcs[npc]) P('error', loc(d), '@fact ' + d.id + ': unknown npc "' + npc + '"');
    if (d.npc && d.npc !== npc) P('error', loc(d), 'npc: ' + d.npc + ' doesn\'t match the id ' + d.id);
    if (!['surface', 'personal', 'secret'].includes(d.tier)) P('error', loc(d), 'tier must be surface, personal or secret');
    if (!d.text) P('error', loc(d), '@fact needs text');
    scanExpr(d.unlock, loc(d), false); scanText(d.text, loc(d), false);
  }
  for (const d of Object.values(content.factions)) for (const m of d.members || []) if (!content.npcs[m]) P('error', loc(d), 'members: unknown npc "' + m + '"');
  for (const d of Object.values(content.arcs)) {
    if (d.canon && !['hard', 'soft'].includes(d.canon)) P('error', loc(d), 'canon must be hard or soft');
    for (const k of d.key_clues || []) if (!(d.clues || []).includes(k)) P('error', loc(d), 'key clue "' + k + '" is not in clues');
    for (const m of d.cast || []) if (!content.npcs[m]) P('error', loc(d), 'cast: unknown npc "' + m + '"');
    for (const b of d.beats || []) if (d.clock && (b.clock < d.clock.min || b.clock > d.clock.max)) P('error', loc(d), 'beat ' + b.clock + ' is outside the clock');
  }
  // Clues and leads (X11): every arc clue has a @clue; a clue is in its arc's clues:, a lead never is.
  for (const d of Object.values(content.arcs)) for (const k of d.clues || []) if (!content.clues[k]) P('error', loc(d), 'clue "' + k + '" has no @clue');
  for (const d of Object.values(content.arcs)) if (d.act_names && d.acts && d.act_names.split(/\s*[,，、]\s*/).length !== d.acts.length) P('error', loc(d), 'act_names: one name per act');
  for (const d of Object.values(content.clues)) {
    if (d.kind && !['clue', 'lead'].includes(d.kind)) P('error', loc(d), 'kind must be clue or lead');
    if (d.followed && d.kind !== 'lead') P('error', loc(d), 'followed: is for leads');
    if (!d.name || !d.text) P('error', loc(d), '@clue needs name and text');
    if (d.followed) scanExpr(d.followed, loc(d), false);
    // A side thread's clue (feedback 2026-10-15): no arc, a thread name, and never one of an arc's clues.
    if (!d.arc) {
      if (!d.thread) P('error', loc(d), '@clue ' + d.id + ': needs an arc: or a thread:');
      if (Object.values(content.arcs).some((a) => (a.clues || []).includes(d.id))) P('error', loc(d), '@clue ' + d.id + ': listed in an arc\'s clues: but names no arc');
      continue;
    }
    if (d.thread) P('error', loc(d), '@clue ' + d.id + ': an arc clue takes its arc\'s name; drop thread:');
    const arc = content.arcs[d.arc];
    if (!arc) { P('error', loc(d), '@clue ' + d.id + ': unknown arc "' + d.arc + '"'); continue; }
    const listed = (arc.clues || []).includes(d.id);
    if (d.kind === 'lead' ? listed : !listed) P('error', loc(d), d.kind === 'lead' ? 'a lead must not be in its arc\'s clues:' : 'not in ' + d.arc + '\'s clues: (or make it kind: lead)');
  }
  for (const d of Object.values(content.lore)) {
    if (!['hard', 'soft'].includes(d.canon)) P('error', loc(d), '@lore canon must be hard or soft');
    if (!d.keys || !d.keys.length) P('error', loc(d), '@lore needs keys');
    if (!d.text) P('error', loc(d), '@lore needs text');
  }
  for (const d of Object.values(content.timeline)) {
    if (!['history', 'beat'].includes(d.kind)) P('error', loc(d), '@timeline kind must be history or beat');
    if (d.event && !content.events[d.event]) P('error', loc(d), 'event: unknown event "' + d.event + '"');
    if (!d.text) P('error', loc(d), '@timeline needs text');
  }
  for (const d of Object.values(content.archetypes)) if (d.age != null && typeof d.age === 'object' && (d.age.min < 18)) P('error', loc(d), 'archetype ages start at 18 (every character is an adult)');
}

function lint(opts = {}) {
  const { content, errors } = compileAll();
  errors.forEach((e) => console.error(C.r + 'error ' + C.x + e.message));
  if (errors.length) { console.error(C.r + errors.length + ' parse error(s)' + C.x); if (!opts.noExit) process.exit(1); return false; }
  const A = analyze(content);
  schemaLint(content, A.problems);
  for (const u of canonCheck(content)) A.problems.push({ level: /^content\/batches\//.test(u.where[0]) ? 'error' : 'warn', where: u.where[0], msg: 'unknown proper noun "' + u.name + '" (add it to the worldbook, a @lore key or @vocab canon_allowlist)' + (u.where.length > 1 ? ' [+' + (u.where.length - 1) + ' more]' : '') });
  for (const lang of localeLangs()) lintLocale(content, lang, A.problems, opts);
  reachLint(content, A.problems);
  lintVariants(content, A.problems);
  lintMenus(content, A.problems);
  // Every map a place sits on needs its base art (src/map.js loads content/world/maps/<map>.svg).
  // A plan's `map_id:` (and @game map_id:) names a map some place sits on, or a track kind (A1).
  const MAPS = new Set(Object.values(content.places || {}).map((pl) => pl.map && pl.map.map).filter(Boolean)), KINDS = new Set(Object.values(content.tracks || {}).map((d) => d.kind));
  for (const st of Object.values(content.states || {})) if (st.map_id && !MAPS.has(st.map_id) && !KINDS.has(st.map_id)) A.problems.push({ level: 'error', where: rel(st.file) + ':' + st.line, msg: 'state "' + st.id + '": map_id "' + st.map_id + '" is neither a map with places nor a track kind' });
  if (content.game.map_id && !MAPS.has(content.game.map_id)) A.problems.push({ level: 'error', where: '@game', msg: '@game map_id: "' + content.game.map_id + '" has no places' });
  for (const pl of Object.values(content.places || {})) if (pl.map && pl.map.map && !fs.existsSync(path.join(ROOT, 'content', 'world', 'maps', pl.map.map + '.svg'))) A.problems.push({ level: 'error', where: rel(pl.file) + ':' + pl.line, msg: 'place "' + pl.id + '": no map art content/world/maps/' + pl.map.map + '.svg' });
  const by = { error: [], warn: [], info: [] };
  A.problems.forEach((p) => by[p.level].push(p));
  by.error.forEach((p) => console.error(C.r + 'error ' + C.x + p.where + ': ' + p.msg));
  by.warn.forEach((p) => console.error(C.y + 'warn  ' + C.x + p.where + ': ' + p.msg));
  if (opts.verbose) by.info.forEach((p) => console.error(C.d + 'info  ' + p.where + ': ' + p.msg + C.x));
  if (opts.legacy) A.legacy.forEach((l) => console.error(C.d + 'legacy ' + l.where + ': ' + l.what + C.x));
  console.log((by.error.length ? C.r : C.g) + 'lint: ' + by.error.length + ' error(s), ' + by.warn.length + ' warning(s), ' + by.info.length + ' info' + C.x + C.d + ', ' + A.legacy.length + ' legacy (phase 3 migrates; --legacy lists)' + C.x + ' — ' + Object.keys(content.events).length + ' events, ' + Object.keys(content.states).length + ' states, ' + Object.keys(content.npcs).length + ' npcs, ' + Object.keys(content.endings).length + ' endings');
  if (by.error.length && !opts.noExit) process.exit(1);
  return !by.error.length;
}

// Linked variation (docs/grimoire-script.md § Inline variation): every group of a block picks the same position, so a
// block uses one mode (sequence, cycle or random) with one part count. Conditionals {cond: a|b} are exempt.
// The scan mirrors the engine's variant(): {=…} is an expression, {~…} random, {&…} cycle, a colon in the first part
// makes a conditional, otherwise two or more parts make a sequence.
const VARIANTS_LEVEL = 'error';
function variantGroups(text) {
  const out = [];
  (function scan(t) {
    let i = 0;
    while (i < t.length) {
      if (t[i] !== '{') { i++; continue; }
      let d = 0, j = i;
      for (; j < t.length; j++) { if (t[j] === '{') d++; else if (t[j] === '}' && --d === 0) break; }
      if (j >= t.length) return;
      const inner = t.slice(i + 1, j), parts = []; let dd = 0, st = 0;
      for (let k = 0; k < inner.length; k++) { const c = inner[k]; if (c === '{') dd++; else if (c === '}') dd--; else if (c === '|' && !dd) { parts.push(inner.slice(st, k)); st = k + 1; } }
      parts.push(inner.slice(st));
      let mode = null;
      if (inner[0] === '~') mode = 'random'; else if (inner[0] === '&') mode = 'cycle';
      else if (inner[0] !== '=') {
        let colon = -1; dd = 0;
        for (let k = 0; k < parts[0].length; k++) { const c = parts[0][k]; if (c === '{') dd++; else if (c === '}') dd--; else if (c === ':' && !dd) { colon = k; break; } }
        mode = colon > 0 ? 'cond' : 'sequence';
      }
      if (mode && mode !== 'cond' && parts.length > 1) out.push(mode + '×' + parts.length);
      if (inner[0] !== '=') parts.forEach((x) => scan(x));
      i = j + 1;
    }
  })(text || '');
  return out;
}
// Per block: the groups of each translatable string, keyed by string key.
function variantsByBlock(strings) {
  const by = {};
  for (const x of strings) { const g = variantGroups(x.text); if (g.length) (by[x.block] = by[x.block] || {})[x.key] = g; }
  return by;
}
// Menus (feedback 2026-10-15): a menu opens with a lead-in card, so it needs text; every option the player can pick
// says what happened (one ending the run is exempt); a course, club or job a generated menu offers has a `picked:` line.
function lintMenus(content, problems) {
  const P = (d, msg) => problems.push({ level: 'warn', where: rel(d.file) + ':' + d.line, msg });
  const kinds = { courses: 'course', clubs: 'club', jobs: 'job' }, offered = new Set();
  for (const e of Object.values(content.events)) {
    if (e.type !== 'menu' || /^\s*false\s*$/.test((e.when && e.when.src) || '')) continue;
    if (e.offers) offered.add(kinds[e.offers]);
    if (!String(e.text || '').trim()) P(e, 'menu "' + e.id + '" has no text for its lead-in card');
    for (const o of e.options) {
      let says = false, ends = false;
      G.walkEffects(o.effects, (st) => { if (st.t === 'say') says = true; if (st.t === 'end') ends = true; });
      if (!says && !ends) P(e, 'menu "' + e.id + '" option "' + o.key + '" has no say: (its outcome would be empty)');
    }
  }
  for (const d of Object.values(content.tracks || {})) if (offered.has(d.kind) && !d.hidden && !d.picked) P(d, d.kind + ' "' + d.id + '" has no picked: line (the outcome of choosing it in a menu)');
}

function lintVariants(content, problems) {
  const strings = I18n.extract(content), eng = {};
  for (const x of strings) eng[x.block + ' ' + x.key] = x;
  for (const [block, keys] of Object.entries(variantsByBlock(strings))) {
    const kinds = new Set(Object.values(keys).flat());
    if (kinds.size < 2) continue;
    const x = strings.find((y) => y.block === block);
    const [kind, id] = block.split(':'), d = id && content[kind + 's'] && content[kind + 's'][id];
    problems.push({ level: VARIANTS_LEVEL, where: d ? rel(d.file) + ':' + d.line : x.file, msg: block + ' mixes variation (one mode and one count per block): ' + Object.entries(keys).map(([k, g]) => k + ' ' + g.join(',')).join('; ') });
  }
  for (const lang of localeLangs()) {
    const loc = I18n.loadLocale(lang, loadLocaleSources(lang).filter((x) => !x.path.endsWith('/_obsolete.lang')));
    for (const [block, keys] of Object.entries(loc.blocks)) for (const [key, e] of Object.entries(keys)) {
      const src = eng[block + ' ' + key]; if (!src || !e.text) continue;
      const a = variantGroups(src.text).sort().join(','), b = variantGroups(e.text).sort().join(',');
      if (a !== b) problems.push({ level: VARIANTS_LEVEL, where: 'locales/' + lang + ' ' + block + ' ' + key, msg: '[' + lang + '] variation differs from English (' + (a || 'none') + ' vs ' + (b || 'none') + ')' });
    }
  }
}

// Reachability (tools/reach.js): a static fixpoint over producible facts. Anything it calls unreachable needs
// a fact (flag, state, clue, track, place, met npc, queue) that no reachable event, hook or state produces.
function reachLint(content, problems) {
  const r = require('./reach.js').reach(content);
  const at = (id) => { const e = content.events[id]; return e ? rel(e.file) + ':' + e.line : id; };
  for (const u of r.unreachable) problems.push({ level: 'error', where: at(u.id), msg: 'event "' + u.id + '" is unreachable: ' + u.why });
  for (const o of r.deadOptions) problems.push({ level: 'warn', where: at(o.id), msg: 'option "' + o.option + '" of "' + o.id + '" can never open: ' + o.why });
  for (const e of r.endings) problems.push({ level: 'error', where: 'ending ' + e.id, msg: 'ending "' + e.id + '" is unreachable: ' + e.why });
  for (const k of r.keyClues) if (k.sources.length < 2) problems.push({ level: 'error', where: 'arc ' + k.arc, msg: 'key clue "' + k.clue + '" has ' + k.sources.length + ' reachable source(s) (design §10.6 needs ≥ 2): ' + (k.sources.join(', ') || 'none') });
  for (const p of r.places) problems.push({ level: 'warn', where: 'place ' + p, msg: 'place "' + p + '" can never be discovered' });
  for (const t of r.tracks) problems.push({ level: 'warn', where: 'track ' + t, msg: 'track "' + t + '" can never be joined' });
  return r;
}
function reachCmd() {
  const { content } = compileAll();
  const problems = [], r = reachLint(content, problems);
  problems.forEach((p) => console.error((p.level === 'error' ? C.r + 'error ' : C.y + 'warn  ') + C.x + p.where + ': ' + p.msg));
  console.log((r.unreachable.length ? C.r : C.g) + 'reach: ' + r.reachable + '/' + r.total + ' events reachable' + C.x + ', ' + r.retired.length + ' retired (' + r.retired.join(', ') + '), ' + r.unreachable.length + ' unreachable, ' + r.deadOptions.length + ' dead option(s); ' + r.facts.flag.size + ' flags, ' + r.facts.clue.size + ' clues, ' + r.facts.place.size + ' places, ' + r.facts.track.size + ' tracks producible');
  return !problems.some((p) => p.level === 'error');
}

// Canon lint (tools/canon.js): known names include every glossary's English column.
function canonCheck(content) {
  const glossaries = localeLangs().map((l) => path.join(ROOT, 'locales', l, 'GLOSSARY.md')).filter((f) => fs.existsSync(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  return require('./canon.js').unknownNames(content, glossaries);
}

/* ------------------------------------------------------------------ i18n */
const PRONOUN_TOKENS = new Set(['they', 'them', 'their', 'theirs', 'are', 's']);
function tokensOf(s) { const t = G.textTokens(s); return t.tokens.concat(t.conds.map((c) => '=' + c)); }
// A token is "named" if it carries information the translation must keep (names, values).
function namedTokens(s) { return tokensOf(s).filter((k) => !PRONOUN_TOKENS.has(k.toLowerCase()) && !(k.includes('.') && PRONOUN_TOKENS.has(k.split('.')[1].toLowerCase()))).map((k) => (k[0] === '=' ? '{=…}' : '{' + k + '}')).sort(); }
function badToken(content, k) {
  if (['player', 'month', 'year', 'npc'].includes(k)) return null;
  if (k[0] === '=') { try { G.expr(k.slice(1)); return null; } catch (e) { return 'bad {=expr}: ' + e.message; } }
  if (content.npcs[k]) return null;
  const [head, key] = k.includes('.') ? k.split('.') : [null, k];
  if (head && head !== 'npc' && !content.npcs[head]) return 'unknown npc in {' + k + '}';
  if (!PRONOUN_KEYS.has(key.toLowerCase())) return 'unknown token {' + k + '}';
  return null;
}
// grim report --gaps: pools per draw source against floors and depth targets, with empty-draw rates from sim runs.
function report(opts = {}) {
  const { content, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
  const R = require('./report.js');
  const style = Policies.get(opts.policy);
  const runs = [];
  const w = console.warn; console.warn = () => {};
  try { for (let g = 0; g < opts.games; g++) runs.push(playGame(content, { seed: 4242 + g * 7919, style, runId: 'report-' + g }).eng.s); } finally { console.warn = w; }
  const { rows, usage } = R.gaps(content, runs);
  if (opts.json) { console.log(JSON.stringify({ rows, usage }, null, 2)); return; }
  console.log(C.b + 'pacing' + C.x + ' (' + opts.games + ' ' + style.name + ' games): term day ' + usage.termDay.toFixed(1) + ' cards, break day ' + usage.breakDay.toFixed(1) + ', empty visits ' + (usage.emptyShare * 100).toFixed(0) + '% of ' + usage.visits);
  const pct = (x) => (x == null ? '   –' : String(Math.round(x * 100)).padStart(3) + '%');
  let short = 0;
  for (const kind of ['place', 'course', 'club', 'job', 'plan', 'thesis', 'internship', 'slot']) {
    const rs = rows.filter((r) => r.kind === kind);
    if (!rs.length) continue;
    console.log('\n' + C.b + kind + C.x + C.d + '  (floor ' + R.FLOOR[kind] + ', target ' + R.TARGET[kind] + ')' + C.x);
    for (const r of rs) {
      if (!opts.all && !r.short && r.events >= r.target) continue;
      short += r.short;
      const extra = [r.track ? '+' + r.track + ' track' : '', r.compat ? r.compat + ' compat' : '', r.ranks ? 'ranks ' + r.ranks.join('/') : '', r.hidden ? 'hidden' : ''].filter(Boolean).join(', ');
      console.log('  ' + (r.short ? C.r : r.events < r.target ? C.y : C.g) + r.id.padEnd(24) + C.x + String(r.events).padStart(3) + ' events ' + String(r.repeatable).padStart(3) + ' repeatable' + (kind === 'place' ? '  empty ' + pct(r.emptyShare) + ' of ' + String(r.visits || 0).padStart(4) + ' visits' : '') + (r.short ? C.r + '  short ' + r.short + C.x : '') + (extra ? C.d + '  ' + extra + C.x : ''));
    }
  }
  console.log('\n' + (short ? C.y : C.g) + 'gaps: ' + short + ' event(s) below the floors' + C.x + C.d + ' (--all lists sources at target too; --json for machines)' + C.x);
}

// grim batch NAME --files a.grim,b.grim [--critic verdict.json] [--skip-balance]
// Runs the validators on one authoring batch (design §11.1) and writes build/batches/NAME.json:
// build, lint (problems in the batch's files), balance --quick, dupes, canon, i18n zh-CN coverage,
// the critic's verdict ({accept, issues}) and a 10% spot-check sample. Accepted = all pass + critic accepts.
function batch(name, opts = {}) {
  const { spawnSync } = require('child_process');
  if (!name || !/^[a-z0-9_-]+$/i.test(name)) { console.error('usage: grim batch NAME --files a.grim,b.grim [--critic FILE]'); process.exit(2); }
  const files = String(opts.files || '').split(',').map((f) => f.trim()).filter(Boolean).map((f) => path.relative(ROOT, path.resolve(f)));
  if (!files.length) { console.error('batch: --files is required'); process.exit(2); }
  const inBatch = (where) => files.some((f) => String(where || '').startsWith(f));
  const run = (args) => { const r = spawnSync(process.execPath, [__filename, ...args], { cwd: ROOT, encoding: 'utf8', env: Object.assign({}, process.env, { FORCE_COLOR: '0' }) }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
  const v = {};
  const b = run(['build']); v.build = { ok: b.code === 0 };
  const l = run(['lint']);
  const probs = l.out.split('\n').map((x) => x.match(/^(error|warn)\s+(\S+?):\s(.*)$/)).filter(Boolean).map((m) => ({ level: m[1], where: m[2], msg: m[3] }));
  v.lint = { ok: l.code === 0 && !probs.some((p) => p.level === 'error'), errors: probs.filter((p) => p.level === 'error'), warnings: probs.filter((p) => p.level === 'warn' && inBatch(p.where)) };
  const { content } = compileAll();
  const events = Object.values(content.events).filter((e) => inBatch(e.file)).map((e) => e.id);
  const ids = new Set(events);
  if (opts.balance !== false) { const bal = run(['balance', '--quick']); v.balance = { ok: bal.code === 0, alarms: bal.out.split('\n').filter((x) => /^alarm/.test(x)).map((x) => x.replace(/^alarm\s+/, '')) }; }
  else v.balance = { ok: true, skipped: true };
  const pairs = require('./dupes.js').dupes(content, { only: ids });
  v.dupes = { ok: !pairs.length, pairs };
  const unknown = canonCheck(content).filter((u) => u.where.some(inBatch)).map((u) => u.name);
  v.canon = { ok: !unknown.length, unknown };
  run(['i18n', 'zh-CN']);
  const loc = I18n.loadLocale('zh-CN', loadLocaleSources('zh-CN').filter((x) => !x.path.endsWith('/_obsolete.lang')));
  const strings = I18n.extract(content).filter((x) => inBatch(x.file));
  const done = strings.filter((x) => { const e = loc.blocks[x.block] && loc.blocks[x.block][x.key]; return e && e.text !== ''; }).length;
  v.i18n = { ok: done === strings.length, translated: done, total: strings.length };
  // The critic's verdict: --critic FILE, else build/batches/NAME.critic.json if the critic wrote one.
  const dir = path.join(ROOT, 'build', 'batches');
  fs.mkdirSync(dir, { recursive: true });
  const criticFile = opts.critic ? path.resolve(opts.critic) : path.join(dir, name + '.critic.json');
  const critic = readJSONFile(criticFile);
  // A deterministic 10% sample for optional human spot-checks (decision D5).
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const spot = events.slice().sort((a, b2) => { const ha = [...a].reduce((x, c) => (x * 33 + c.charCodeAt(0) + h) >>> 0, 7); const hb = [...b2].reduce((x, c) => (x * 33 + c.charCodeAt(0) + h) >>> 0, 7); return ha - hb; }).slice(0, Math.max(1, Math.ceil(events.length / 10)));
  const valid = Object.values(v).every((x) => x.ok);
  const rec = { name, at: Date.now(), files, events, contentHash: contentHash(), validators: v, critic: critic || null, spotCheck: events.length ? spot : [], accepted: valid && !!(critic && critic.accept) };
  fs.writeFileSync(path.join(dir, name + '.json'), JSON.stringify(rec, null, 2) + '\n');
  for (const [k, x] of Object.entries(v)) {
    const detail = k === 'lint' ? x.errors.length + ' error(s), ' + x.warnings.length + ' warning(s) in batch' : k === 'dupes' ? x.pairs.map((p) => p.a + '~' + p.b + ' ' + p.score).join(', ') : k === 'canon' ? x.unknown.join(', ') : k === 'i18n' ? x.translated + '/' + x.total + ' zh' : k === 'balance' ? (x.skipped ? 'skipped' : x.alarms.length + ' alarm(s)') : '';
    console.log((x.ok ? C.g + 'pass ' : C.r + 'FAIL ') + C.x + k.padEnd(8) + C.d + detail + C.x);
  }
  for (const p of v.lint.errors.concat(v.lint.warnings).slice(0, 30)) console.log('  ' + p.level + ' ' + p.where + ': ' + p.msg);
  console.log((critic ? (critic.accept ? C.g + 'pass ' : C.r + 'FAIL ') : C.y + 'wait ') + C.x + 'critic  ' + C.d + (critic ? (critic.issues || []).length + ' issue(s)' : 'no verdict yet (' + path.relative(ROOT, criticFile) + ')') + C.x);
  console.log((rec.accepted ? C.g + 'batch ' + name + ': accepted' : C.y + 'batch ' + name + ': not accepted') + C.x + ' — ' + events.length + ' event(s), spot-check ' + rec.spotCheck.join(', ') + C.d + ' → build/batches/' + name + '.json' + C.x);
  return rec;
}

// The content declares the format version it is written for (design §12); the parser must know it.
function schemaLint(content, problems) {
  const frozen = readJSONFile(SCHEMA_FILE);
  const v = content.game.schema, max = frozen ? frozen.schema : require('./schema-manifest.js').SCHEMA_VERSION;
  if (v == null) problems.push({ level: 'error', where: 'content/core/rules.grim', msg: '@game has no "schema:" (the format version, currently ' + max + ')' });
  else if (v > max) problems.push({ level: 'error', where: 'content/core/rules.grim', msg: '@game schema ' + v + ' is newer than the parser (' + max + ')' });
}
function readJSONFile(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } }
const SCHEMA_FILE = path.join(ROOT, 'test', 'golden', 'schema-v1.json');

// grim schema [--update]: compare the parser's format with the frozen manifest. Removals and changes fail;
// legacy constructs may be retired; additions are listed and recorded with --update.
function schemaCmd(opts = {}) {
  const M = require('./schema-manifest.js');
  const cur = M.manifest(), old = readJSONFile(SCHEMA_FILE);
  if (!old) { fs.writeFileSync(SCHEMA_FILE, JSON.stringify(cur, null, 2) + '\n'); console.log('schema: wrote ' + path.relative(ROOT, SCHEMA_FILE)); return true; }
  const d = M.compare(old, cur);
  d.removed.forEach((x) => console.error(C.r + 'removed ' + C.x + x));
  d.changed.forEach((x) => console.error(C.r + 'changed ' + C.x + x));
  d.retired.forEach((x) => console.log(C.d + 'retired (legacy) ' + x + C.x));
  d.added.forEach((x) => console.log(C.g + 'added ' + C.x + x));
  const ok = !d.removed.length && !d.changed.length;
  if (!ok) { console.error(C.r + 'schema: the frozen format v' + old.schema + ' may only grow' + C.x + ' (design §12)'); return false; }
  if (opts.update && (d.added.length || d.retired.length)) {
    cur.legacy = old.legacy;
    fs.writeFileSync(SCHEMA_FILE, JSON.stringify(cur, null, 2) + '\n');
    console.log('schema: recorded ' + d.added.length + ' addition(s)' + (d.retired.length ? ', ' + d.retired.length + ' retirement(s)' : ''));
  } else console.log(C.g + 'schema: v' + old.schema + ' intact' + C.x + (d.added.length ? ' (' + d.added.length + ' addition(s) not recorded; run with --update)' : ''));
  return true;
}

// The fight's strings (the combat minigame's text table, build/combat.bundle.js): block @combat in locales/<lang>/combat.lang.
// Spell names come from content, with its own translations, so only spells content doesn't have are listed.
function combatStrings(content) {
  const C = require('../build/combat.bundle.js'); C.initSync();
  return Object.entries(C.combatTextTable()).filter(([k]) => !(k.startsWith('label.') && content.spells[k.slice(6)]))
    .map(([key, text]) => ({ file: 'combat.lang', block: 'combat', key, text, hash: I18n.hash(text) }));
}
// A fight line's placeholders: the values ({n}, {dmg}, {noun}…) must all stay; names and pronouns may change form; the
// {v:…|…} agreement forms are English grammar.
const FIGHT_GRAMMAR = new Set(['name', 'foe', 'name’s', 'foe’s', 'pos', 'fpos', 'fobj']);
function fightTokens(text) { return [...String(text).matchAll(/\{([^{}]+)\}/g)].map((m) => m[1]).filter((k) => !/^f?v:/.test(k)); }
function lintLocale(content, lang, problems, opts = {}) {
  const P = (level, where, msg) => problems.push({ level, where, msg });
  const loc = I18n.loadLocale(lang, loadLocaleSources(lang).filter((s) => !s.path.endsWith('/_obsolete.lang')));
  loc.errors.forEach((e) => P('error', e.split(': ')[0], e.split(': ').slice(1).join(': ')));
  const strings = I18n.extract(content), fight = combatStrings(content);
  const known = new Set(strings.concat(fight).map((s) => s.block + ' ' + s.key));
  let missing = 0, stale = 0;
  const where = (block, key) => { for (const [f, p] of Object.entries(loc.files)) if (p.blocks[block] && p.blocks[block][key]) return f + ':' + p.blocks[block][key].line; return 'locales/' + lang; };
  for (const s of fight) {
    const e = loc.blocks.combat && loc.blocks.combat[s.key];
    if (!e || e.text === '') { missing++; continue; }
    const w = where('combat', s.key), en = fightTokens(s.text), tr = fightTokens(e.text);
    if (e.hash && e.hash !== s.hash) { stale++; if (opts.verbose) P('info', w, 'stale translation (English changed): combat ' + s.key); }
    const lost = en.filter((k) => !FIGHT_GRAMMAR.has(k) && !tr.includes(k)), extra = tr.filter((k) => !en.includes(k) && !FIGHT_GRAMMAR.has(k));
    if (lost.length || extra.length) P('warn', w, '[' + lang + '] combat ' + s.key + ': placeholders differ from English (' + (lost.length ? 'missing {' + lost.join('} {') + '}' : '') + (extra.length ? ' unknown {' + extra.join('} {') + '}' : '') + ')');
  }
  for (const s of strings) {
    const e = loc.blocks[s.block] && loc.blocks[s.block][s.key];
    if (!e || e.text === '') { missing++; continue; }
    const w = where(s.block, s.key);
    if (e.hash && e.hash !== s.hash) { stale++; if (opts.verbose) P('info', w, 'stale translation (English changed): ' + s.block + ' ' + s.key); }
    // Tokens the (already linted) English uses, plus the event's cast roles, are valid here too.
    const ev = s.block.startsWith('event ') && content.events[s.block.slice(6)];
    const ok = new Set(tokensOf(s.text).concat(['track', 'place'], ((ev && ev.cast) || []).map((r) => r.role)));
    for (const k of tokensOf(e.text)) { if (ok.has(k) || ok.has(k.split('.')[0])) continue; const b = badToken(content, k); if (b) P('error', w, '[' + lang + '] ' + b); }
    const a = namedTokens(s.text).join(' '), b = namedTokens(e.text).join(' ');
    if (a !== b) P('warn', w, '[' + lang + '] tokens differ from English (' + (a || 'none') + ' vs ' + (b || 'none') + ')');
  }
  for (const [block, keys] of Object.entries(loc.blocks)) for (const key of Object.keys(keys)) if (!known.has(block + ' ' + key)) P('warn', where(block, key), '[' + lang + '] obsolete key ' + block + ' ' + key + ' (run: node tools/grim.js i18n ' + lang + ')');
  const uiMissing = Object.keys(I18n.UI_EN).filter((k) => loc.ui[k] == null).length;
  for (const [k, v] of Object.entries(loc.ui)) {
    if (I18n.UI_EN[k] == null) { P('warn', 'locales/' + lang + '/ui.lang', '[' + lang + '] unknown ui key ' + k); continue; }
    const need = [...I18n.UI_EN[k].matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    const have = [...v.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    if (need !== have) P('warn', 'locales/' + lang + '/ui.lang', '[' + lang + '] ui key ' + k + ' placeholders differ ({' + need + '} vs {' + have + '})');
  }
  if (missing || uiMissing) P('warn', 'locales/' + lang, missing + ' content string(s) and ' + uiMissing + ' ui string(s) untranslated (they fall back to English). Run: node tools/grim.js i18n ' + lang);
  if (stale) P('warn', 'locales/' + lang, stale + ' translation(s) are stale — the English changed since they were written (lint --verbose lists them)');
  return { missing, stale, uiMissing, total: strings.length };
}

function i18nStatus() {
  const { content, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
  const langs = localeLangs();
  if (!langs.length) { console.log('No translations yet. Create one with: node tools/grim.js i18n <lang>   (e.g. zh-CN)'); return; }
  for (const lang of langs) {
    const r = lintLocale(content, lang, [], {});
    const pct = (100 * (r.total - r.missing) / r.total).toFixed(1);
    console.log(lang.padEnd(8) + pct.padStart(6) + '% content (' + (r.total - r.missing) + '/' + r.total + '), ' + r.stale + ' stale, ' + r.uiMissing + ' ui strings missing');
  }
}

function i18nSync(lang) {
  if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(lang)) { console.error('bad language code "' + lang + '" (use e.g. zh-CN, fr, pt-BR)'); process.exit(1); }
  const { content, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
  const dir = path.join(LOCALES, lang);
  const sources = loadLocaleSources(lang);
  const loc = I18n.loadLocale(lang, sources);
  if (loc.errors.length) { loc.errors.forEach((e) => console.error(C.r + 'error ' + C.x + e)); console.error('fix the locale files first'); process.exit(1); }
  const langName = loc.ui['lang.name'] || lang;
  const used = new Set();
  const byFile = {};
  for (const s of I18n.extract(content).concat(combatStrings(content))) (byFile[s.file] = byFile[s.file] || []).push(s);
  const report = [];
  const written = new Set();
  for (const [file, list] of Object.entries(byFile)) {
    const out = path.join(dir, file.replace(/^content\//, '').replace(/\.grim$/, '.lang'));
    const lines = ['# Lumenhold Academy — ' + langName + ' (' + lang + ') translation of ' + file,
      '# Maintained by `node tools/grim.js i18n ' + lang + '`. Translate the text after "="; keep {tokens}.',
      '# "# en:" shows the English source. [hash] marks the English version a line was translated from;',
      '# lines marked STALE need updating — after fixing the text, delete the [hash] and re-run the tool.', ''];
    let cur = null, n = 0, done = 0, st = 0;
    for (const s of list) {
      if (s.block !== cur) { cur = s.block; lines.push('', '@' + s.block.replace(':', ' ')); }
      const e = loc.blocks[s.block] && loc.blocks[s.block][s.key];
      used.add(s.block + ' ' + s.key);
      n++;
      const tr = e ? e.text : '';
      let h = s.hash;
      if (e && tr !== '' && e.hash && e.hash !== s.hash) { h = e.hash; st++; lines.push('# STALE — English changed since this was translated'); }
      if (tr !== '') done++;
      lines.push('# en: ' + I18n.enc(s.text));
      lines.push(s.key + ' [' + h + '] = ' + I18n.enc(tr));
    }
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, lines.join('\n') + '\n');
    written.add(rel(out));
    report.push([rel(out), done, n, st]);
  }
  // UI strings
  {
    const out = path.join(dir, 'ui.lang');
    const lines = ['# Lumenhold Academy — ' + langName + ' (' + lang + ') interface strings.',
      '# Keys come from UI_EN in src/i18n.js. Keep {placeholders}; "_html" keys may contain <b> tags.',
      '# pronoun.* keys fill {they} {them} {their} {theirs} {are} {s} in content text (empty is allowed).', '', '@ui'];
    let n = 0, done = 0;
    for (const [k, en] of Object.entries(I18n.UI_EN)) {
      n++;
      const tr = loc.ui[k];
      if (tr != null && (tr !== '' || k.startsWith('pronoun.'))) done++;
      lines.push('# en: ' + I18n.enc(en));
      lines.push(k + ' = ' + I18n.enc(tr == null ? '' : tr));
    }
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(out, lines.join('\n') + '\n');
    written.add(rel(out));
    report.push([rel(out), done, n, 0]);
  }
  // Obsolete entries: keep the work, out of the way.
  const obs = ['# Translations whose source no longer exists. Kept for reference; not loaded by the game.', ''];
  let nObs = 0, nNew = 0;
  // Entries already in _obsolete.lang are carried over; only newly retired ones are reported as moved.
  const prevObs = I18n.loadLocale(lang, sources.filter((x) => x.path.endsWith('/_obsolete.lang'))).blocks;
  for (const [block, keys] of Object.entries(loc.blocks)) {
    const rows = Object.entries(keys).filter(([k, v]) => !used.has(block + ' ' + k) && v.text !== '');
    if (!rows.length) continue;
    obs.push('@' + block.replace(':', ' '));
    for (const [k, v] of rows) { obs.push(k + (v.hash ? ' [' + v.hash + ']' : '') + ' = ' + I18n.enc(v.text)); nObs++; if (!(prevObs[block] && prevObs[block][k])) nNew++; }
  }
  const obsPath = path.join(dir, '_obsolete.lang');
  if (nObs) { fs.writeFileSync(obsPath, obs.join('\n') + '\n'); written.add(rel(obsPath)); }
  // Remove .lang files that no longer correspond to a content file
  for (const s of sources) if (!written.has(s.path) && !s.path.endsWith('/_obsolete.lang')) { fs.unlinkSync(path.join(ROOT, s.path)); console.log(C.d + 'removed ' + s.path + C.x); }
  let T = 0, D = 0, S = 0;
  for (const [f, d, n, st] of report) { T += n; D += d; S += st; console.log((d === n ? C.g : C.y) + String(d).padStart(5) + '/' + String(n).padEnd(5) + C.x + ' ' + f + (st ? C.y + '  ' + st + ' stale' + C.x : '')); }
  console.log(C.b + lang + ': ' + D + '/' + T + ' translated (' + (100 * D / T).toFixed(1) + '%), ' + S + ' stale' + (nNew ? ', ' + nNew + ' obsolete moved to _obsolete.lang' : '') + C.x);
}

/* ------------------------------------------------------------------ sim */
// Play one game to its ending with a play style (tools/policies.js). Everything that happened is in
// eng.s.hist. Throws on a soft-lock (a card with no available option) or a game that never ends.
function playGame(content, { seed, style, runId, name = 'Sim', onLog = null, previews = null }) {
  const eng = new Engine(content);
  // Preview property test (design §8.3): every real outcome lies within its preview.
  const before = previews ? (e, v, key) => (Array.isArray(key) ? null : e.preview(v.id, key, v.actor ? v.actor.id : null)) : null;
  const after = previews ? (e, v, key, out, pv) => { if (!pv) return; previews.cards++; if (!Engine.fits(pv, out.deltas)) previews.misses.push({ event: v.id, key, turn: e.s.turn, actual: out.deltas, paths: pv.paths.map((p) => p.deltas) }); } : null;
  try { return Policies.play(eng, style, { seed, name, runId, maxSteps: 6000, strict: true, before, after }); } finally { if (onLog) onLog(eng); }
}

function sim(n = 300, opts = {}) {
  const { content, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
  if (opts.lang && opts.lang !== 'en') {
    const loc = I18n.loadLocale(opts.lang, loadLocaleSources(opts.lang));
    const st = I18n.applyContent(content, loc);
    console.log('sim with ' + opts.lang + ' applied: ' + st.translated + '/' + st.total + ' strings translated');
  }
  const warnings = {};
  const origWarn = console.warn; console.warn = (...a) => { const k = a.join(' '); warnings[k] = (warnings[k] || 0) + 1; };
  const seen = {}, endings = {}, endTurns = [], finals = {}, cardsPerMonth = [], menus = {};
  const resSum = {}; const skillSum = {}; let games = 0; let crashes = 0;
  const seed0 = opts.seed != null ? opts.seed : 12345;
  const meta = { game: content.game.title, contentHash: contentHash(), lang: opts.lang || 'en', sim: opts.policy || 'random' };
  if (opts.log) fs.mkdirSync(opts.log, { recursive: true });
  const style = Policies.get(opts.policy);
  for (let g = 0; g < n; g++) {
    try {
      const seed = seed0 + g * 7919;
      const { eng, r } = playGame(content, { seed, style, runId: 'sim-' + style.name + '-' + seed, onLog: opts.log ? (e) => fs.writeFileSync(path.join(opts.log, e.s.runId + '.json'), JSON.stringify(e.exportRun(meta))) : null });
      let monthCards = 0;
      for (const h of eng.s.hist) {
        if (h.t === 'month') { if (h.turn > 1) cardsPerMonth.push(monthCards); monthCards = 0; }
        if (h.t !== 'card' || h.choice == null) continue;
        monthCards++; seen[h.id] = (seen[h.id] || 0) + 1;
        if (h.type === 'menu') { menus[h.id] = menus[h.id] || {}; menus[h.id][h.choice] = (menus[h.id][h.choice] || 0) + 1; }
      }
      endings[r.id] = (endings[r.id] || 0) + 1; endTurns.push(r.turn);
      for (const y of r.yearbook || []) endings[y.id] = (endings[y.id] || 0) + 1;   // yearbook lines (mystery, relationships, personal)
      if (!r.early) finals[r.id] = (finals[r.id] || 0) + 1;
      for (const id of content.order.resources) resSum[id] = (resSum[id] || 0) + eng.s.vals[id];
      for (const id of content.order.skills) skillSum[id] = (skillSum[id] || 0) + eng.s.vals[id];
      games++;
    } catch (e) { crashes++; if (crashes < 5) console.error(C.r + 'game ' + g + ' crashed: ' + C.x + e.stack); }
  }
  console.warn = origWarn;
  const allEvents = Object.keys(content.events).filter((id) => !(content.events[id].tags || []).includes('retired'));
  const never = allEvents.filter((id) => !seen[id]);
  const avg = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  const maxT = new Engine(content).maxTurns;
  console.log(C.b + '\n=== sim: ' + games + ' games (' + (opts.policy || 'random') + ' policy), ' + crashes + ' crashed ===' + C.x);
  console.log('avg length: ' + avg(endTurns).toFixed(1) + ' / ' + maxT + ' months; reached graduation: ' + (100 * endTurns.filter((t) => t >= maxT).length / Math.max(1, games)).toFixed(0) + '%');
  console.log('avg cards per month: ' + avg(cardsPerMonth).toFixed(2));
  console.log('\nendings:');
  Object.entries(endings).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => { const d = content.endings[k] || {}; console.log('  ' + (100 * v / games).toFixed(1).padStart(5) + '%  ' + k + C.d + (d.kind === 'early' ? ' (early)' : ' (' + (d.slot || 'headline') + ')') + C.x); });
  const unreached = Object.keys(content.endings).filter((k) => !endings[k]);
  if (unreached.length) console.log(C.y + '  never reached: ' + unreached.join(', ') + C.x);
  console.log('\nfinal resources (avg): ' + content.order.resources.map((id) => id + ' ' + (resSum[id] / games).toFixed(0)).join(', '));
  console.log('final skills (avg):    ' + content.order.skills.map((id) => id + ' ' + (skillSum[id] / games).toFixed(0)).join(', '));
  console.log('\ncoverage: ' + (allEvents.length - never.length) + ' / ' + allEvents.length + ' events seen at least once');
  if (never.length) console.log(C.y + 'never seen (' + never.length + '): ' + C.x + never.join(', '));
  const rare = allEvents.filter((id) => seen[id] && seen[id] / games < 0.03);
  if (rare.length) console.log(C.d + 'rare (<3% of games): ' + rare.map((id) => id + '(' + seen[id] + ')').join(', ') + C.x);
  if (opts.verbose) {
    console.log('\nmenu picks:'); for (const [m, o] of Object.entries(menus)) console.log('  ' + m + ': ' + Object.entries(o).map(([k, v]) => k + '=' + v).join(' '));
    console.log('\nmost frequent:'); Object.entries(seen).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log('  ' + (v / games).toFixed(2) + ' per game  ' + k));
  }
  const wk = Object.entries(warnings);
  if (wk.length) { console.log(C.y + '\nruntime warnings:' + C.x); wk.slice(0, 20).forEach(([k, v]) => console.log('  ' + v + '×  ' + k)); }
  if (opts.log) console.log('\nrun logs: ' + games + ' file(s) in ' + path.relative(process.cwd(), opts.log));
  return crashes === 0;
}

/* ------------------------------------------------------------------ balance */
// Design §8.8: invariants fail the run, alarms warn. Checks for systems that don't exist yet (XP curve,
// mana, obligations, previews) are added in the phase that builds them.
function balance(opts = {}) {
  const { content, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
  const games = opts.games || (opts.quick ? 30 : 100);
  const styles = opts.quick ? ['random', 'balanced', 'social', 'aggressive', 'truant', 'lumen', 'hollow'] : ['random', 'cautious', 'social', 'balanced', 'aggressive', 'moneymaxx', 'caster', 'truant', 'focused:arcana', 'focused:lore', 'focused:alchemy', 'focused:guile', 'social:lyra', 'social:corvin', 'lumen', 'hollow', 'plot'].concat(Policies.STRATEGIES);
  const report = { format: 'lumenhold-balance', v: 1, contentHash: contentHash(), createdAt: new Date().toISOString(), games, styles: {}, invariants: [], alarms: [] };
  const fail = (msg) => report.invariants.push(msg), alarm = (msg) => report.alarms.push(msg);
  // Static invariants
  for (const e of Object.values(content.events)) {
    // An `offers:` menu whose fallback appears exactly when nothing is offered (`offered(kind) == 0`, I10) is never empty.
    const fallback = e.offers && e.options.some((o) => o.when && o.when.src.replace(/\s+/g, '') === 'offered(' + e.offers + ')==0');
    if (e.type === 'menu' && !fallback && e.options.every((o) => o.when)) fail('menu ' + e.id + ' (' + e.file + ':' + e.line + '): every option has a "when", so it can be empty');
  }
  // Hard invariant: previews contain the outcomes (random play, many games).
  const pt = { cards: 0, misses: [] };
  const ptGames = opts.quick ? 100 : 1000;
  for (let g = 0; g < ptGames && pt.misses.length < 20; g++) {
    try { playGame(content, { seed: 99 + g * 104729, style: Policies.get('random'), runId: 'preview-test', previews: pt }); } catch (e) { /* crashes are reported below */ }
  }
  report.previewTest = { games: ptGames, cards: pt.cards, misses: pt.misses.length };
  for (const m of pt.misses.slice(0, 5)) fail('preview miss: ' + m.event + '/' + m.key + ' turn ' + m.turn + ': actual ' + JSON.stringify(m.actual) + ' not within ' + JSON.stringify(m.paths));
  const seenAll = {};
  const origWarn = console.warn; const warns = {}; console.warn = (...a) => { const k = a.join(' '); warns[k] = (warns[k] || 0) + 1; };
  for (const name of styles) {
    const style = Policies.get(name);
    const st = report.styles[name] = { games: 0, crashed: 0, endings: {}, lines: {}, early: 0, zero: { health: 0, mood: 0 }, final: {} };
    for (let g = 0; g < games; g++) {
      const seed = 777 + g * 7919;
      try {
        const { eng, r } = playGame(content, { seed, style, runId: 'balance' });
        st.games++;
        st.endings[r.id] = (st.endings[r.id] || 0) + 1;
        for (const y of r.yearbook || []) st.lines[y.id] = (st.lines[y.id] || 0) + 1;
        if (r.early) st.early++;
        let hz = false, mz = false;
        for (const h of eng.s.hist) {
          if (h.vals) { if (h.vals.health <= 0) hz = true; if (h.vals.mood <= 0) mz = true; }
          if (h.t === 'card' && h.choice != null) seenAll[h.id] = (seenAll[h.id] || 0) + 1;
        }
        if (hz) st.zero.health++; if (mz) st.zero.mood++;
        for (const [k, v] of Object.entries(eng.s.vals)) st.final[k] = (st.final[k] || 0) + v / games;
        (st.runs = st.runs || []).push(runMetrics(content, eng));
      } catch (e) { st.crashed++; fail(name + ' seed ' + seed + ': ' + e.message); }
    }
    for (const k of Object.keys(st.final)) st.final[k] = Math.round(st.final[k]);
    // One ending dominating is an alarm; the headline fallback (a final ending with no `when`) is allowed more,
    // since the yearbook's other lines still vary, but not a majority.
    const top = Object.entries(st.endings).sort((a, b) => b[1] - a[1])[0];
    const fallback = top && content.endings[top[0]] && content.endings[top[0]].kind !== 'early' && !content.endings[top[0]].when;
    // focused:* styles and the scholar chase one skill's (or the scholar's) ending on purpose, so dominance there is the point.
    if (top && !name.startsWith('focused:') && name !== 'scholar' && top[1] / st.games > (fallback ? 0.5 : 0.35)) alarm(name + ': ' + top[0] + ' is ' + Math.round(100 * top[1] / st.games) + '% of headlines (> ' + (fallback ? 50 : 35) + '%)');
    if (name === 'balanced') for (const k of ['health', 'mood']) if (st.zero[k] / st.games > 0.15) alarm('balanced: ' + k + ' hits 0 in ' + Math.round(100 * st.zero[k] / st.games) + '% of runs (> 15%)');
  }
  console.warn = origWarn;
  for (const [name, st] of Object.entries(report.styles)) designAlarms(name, st.runs || [], alarm, report.styles);
  for (const st of Object.values(report.styles)) delete st.runs;
  for (const [k, v] of Object.entries(warns)) alarm('runtime warning ×' + v + ': ' + k);
  // Every final ending (headline or yearbook line) should be reached by some play style that wants it.
  const reached = new Set(Object.values(report.styles).flatMap((st) => Object.keys(st.endings).concat(Object.keys(st.lines))));
  // Game-over endings are avoided by every style but random; tests prove those reachable (test/alignment.test.js).
  report.endingsUnreached = Object.keys(content.endings).filter((k) => !reached.has(k) && content.endings[k].kind !== 'early');
  if (!opts.quick && report.endingsUnreached.length) alarm(report.endingsUnreached.length + ' ending(s) reached by no play style: ' + report.endingsUnreached.join(', '));
  const never = Object.keys(content.events).filter((id) => !seenAll[id] && !(content.events[id].tags || []).includes('retired'));
  report.neverSeen = never;
  if (never.length) alarm(never.length + ' event(s) never seen by any play style: ' + never.join(', '));
  fs.mkdirSync(path.join(ROOT, 'build'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'build', 'balance-report.json'), JSON.stringify(report, null, 1) + '\n');
  console.log(C.b + 'balance: ' + styles.length + ' play styles × ' + games + ' games' + C.x + C.d + ' · preview test: ' + pt.cards + ' choices in ' + ptGames + ' games, ' + pt.misses.length + ' outside their preview' + C.x);
  for (const [name, st] of Object.entries(report.styles)) {
    const top = Object.entries(st.endings).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => k.replace(/^ending_/, '') + ' ' + Math.round(100 * v / Math.max(1, st.games)) + '%').join(', ');
    const myst = Object.entries(st.lines).filter(([k]) => (content.endings[k] || {}).slot === 'mystery').sort((a, b) => b[1] - a[1]).map(([k, v]) => k.replace(/^ending_/, '') + ' ' + Math.round(100 * v / Math.max(1, st.games)) + '%').join(', ');
    console.log('  ' + name.padEnd(15) + ' early ' + String(Math.round(100 * st.early / Math.max(1, st.games))).padStart(3) + '%  ' + C.d + top + (myst ? ' · mystery: ' + myst : '') + ' · alignment ' + (st.final.alignment ?? 0) + C.x);
  }
  report.invariants.forEach((m) => console.log(C.r + 'INVARIANT ' + C.x + m));
  report.alarms.forEach((m) => console.log(C.y + 'alarm     ' + C.x + m));
  console.log((report.invariants.length ? C.r : C.g) + report.invariants.length + ' invariant failure(s)' + C.x + ', ' + report.alarms.length + ' alarm(s) — build/balance-report.json');
  return report.invariants.length === 0;
}

// Per-run measures for the design's Level-2 alarms (§8.8), from the run history: the month entries carry every
// resource and skill at the start of each month; cards carry their class and their deltas.
function runMetrics(content, eng) {
  const h = eng.s.hist, months = h.filter((x) => x.t === 'month' && x.vals), skills = content.order.skills;
  const at = (turn) => { let v = null; for (const m of months) if (m.turn <= turn) v = m.vals; return v; };
  const probe = new Engine(content), isTerm = (m) => probe.phaseOf(m.turn) === 'term';
  const termMonths = months.filter(isTerm);
  const manaMax = (v) => 40 + (v.arcana || 0) / 2;
  const rel = {}, relAt24 = {}, spark = {};
  for (const x of h) {
    const d = x.t === 'card' ? x.out && x.out.deltas : null;
    if (d) for (const [k, v] of Object.entries(d)) {
      if (k.startsWith('rel:')) { rel[k.slice(4)] = (rel[k.slice(4)] || 0) + v; if (x.turn <= 24) relAt24[k.slice(4)] = rel[k.slice(4)]; }
      if (k.startsWith('spark:')) (spark[k.slice(6)] = spark[k.slice(6)] || []).push([x.turn, v]);
    }
  }
  // romance volatility: the largest spark change within any 3-month window, for the most-sparked character
  let swing = 0;
  for (const list of Object.values(spark)) for (const [t0] of list) { const w = list.filter(([t]) => t >= t0 && t < t0 + 3).reduce((a, [, v]) => a + v, 0); swing = Math.max(swing, Math.abs(w)); }
  // a run that ended in collapse (health) or despair (mood) broke down then, even if no month started at zero
  const early = eng.s.ended && eng.s.turn < eng.maxTurns ? eng.s.ended.id : null;
  const firstZero = (k) => { let n = 0; for (const m of termMonths) { n++; if (m.vals[k] <= 0) return n; } return (k === 'health' && early === 'ending_sent_home') || (k === 'mood' && early === 'ending_quiet_departure') ? termMonths.length : null; };
  const cls = (c) => h.filter((x) => x.t === 'card' && x.class === c).length;
  const cards = h.filter((x) => x.t === 'card'), leads = eng.threads().flatMap((t) => t.leads || []);
  const years = Math.max(1, Math.ceil(eng.s.turn / 12));
  return {
    m24: at(24), end: eng.s.vals, skills,
    goldY3: (at(36) || {}).gold, goldEnd: eng.s.vals.gold, turn: eng.s.turn, gpaEnd: eng.gpa(),
    tightPerYear: months.filter((m) => isTerm(m) && m.vals.gold < 8).length / years,
    manaHighShare: termMonths.length ? termMonths.filter((m) => m.vals.mana > 0.4 * manaMax(m.vals)).length / termMonths.length : 0,
    manaFullShare: termMonths.length ? termMonths.filter((m) => m.vals.mana >= 0.95 * manaMax(m.vals)).length / termMonths.length : 0,
    moodZeroAt: firstZero('mood'), healthZeroAt: firstZero('health'),
    relAt24, swing, sparked: Object.keys(spark).length > 0,
    dropped: h.some((x) => (x.out && x.out.notes || []).some((n) => n.kind === 'dropped')) || h.some((x) => (x.summary || []).some((it) => (it.notes || []).some((n) => n.kind === 'dropped'))),
    incidentsPerYear: cls('incident') / years, windfallsPerYear: cls('windfall') / years,
    // for the strategy styles (tools/policies.js): nights out, the scholarship, leads, romance, coverage
    nightsOut: cards.filter((x) => x.id === 'night_out' && x.choice === 'right').length,
    stipendPaid: cards.filter((x) => x.id === 'scholarship_award' && x.out && x.out.deltas && x.out.deltas.gold > 0).length,
    stipendTerms: cards.filter((x) => x.id === 'scholarship_award').length,
    leads: leads.length, followed: leads.filter((x) => x.followed).length,
    firstPartner: (cards.find((x) => ((x.out && x.out.notes) || []).some((n) => n.kind === 'bond' && n.status === 'partner')) || {}).turn ?? null,
    distinct: new Set(cards.map((x) => x.id)).size, early,
    fights: (eng.s.fights || []).length, fightsWon: (eng.s.fights || []).filter((f) => f.outcome === 'win').length,
  };
}
// The design's Level-2 alarms (§8.8): wide tolerances, each judged on the median run of the style it is about.
function designAlarms(name, runs, alarm, all) {
  if (!runs.length) return;
  const med = (a) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : null; };
  const share = (f) => runs.filter(f).length / runs.length;
  const r1 = (x) => Math.round(x * 10) / 10;
  if (name.startsWith('focused:')) {
    const k = name.split(':')[1];
    const at24 = med(runs.map((r) => r.m24 && r.m24[k]));
    if (at24 != null && at24 < 85) alarm(name + ': ' + k + ' is ' + Math.round(at24) + ' at month 24 (design: ~85+ by month 24)');
    const others = med(runs.map((r) => r.skills.filter((s) => s !== k).reduce((a, s) => a + r.end[s], 0) / (r.skills.length - 1)));
    if (others < 20) alarm(name + ': the other skills average ' + Math.round(others) + ' at the end (design: ≥ 20)');
  }
  if (name === 'balanced') {
    const mean = med(runs.map((r) => r.skills.reduce((a, s) => a + r.end[s], 0) / r.skills.length));
    if (mean < 35 || mean > 65) alarm('balanced: mean skill ' + Math.round(mean) + ' at the end (design: 35–65)');
    if (share((r) => r.manaFullShare > 0.9) > 0.5) alarm('balanced: mana is (almost) always full without casting');
    const tight = med(runs.map((r) => r.tightPerYear));
    if (tight < 1) alarm('balanced: ' + r1(tight) + ' tight month(s) a year (design: forced sinks make food risky now and then)');
    const inc = med(runs.map((r) => r.incidentsPerYear)), win = med(runs.map((r) => r.windfallsPerYear));
    if (inc < 1 || inc > 3) alarm('balanced: ' + r1(inc) + ' incidents a year (design: 1–3)');
    if (win < 1 || win > 4) alarm('balanced: ' + r1(win) + ' windfalls a year (design: 1–4)');
  }
  if (name === 'moneymaxx') {
    const climb = med(runs.map((r) => r.goldY3 == null || r.turn < 40 ? null : (r.goldEnd - r.goldY3) / Math.max(1, r.turn - 36)));
    if (climb != null && climb > 5) alarm('moneymaxx: crowns still climb ' + r1(climb) + ' a month in year 4 (design: sinks catch money-maxxing)');
  }
  if (name === 'caster' && share((r) => r.manaHighShare > 0.5) > 0.5) alarm('caster: mana stays above 40% in most term months (design: casting keeps it low)');
  if (name === 'aggressive') {
    const mz = med(runs.map((r) => r.moodZeroAt ?? 99)), hz = med(runs.map((r) => r.healthZeroAt ?? 99));
    if (mz > 5 && hz > 9) alarm('aggressive: mood lasts ' + (mz === 99 ? 'the run' : mz + ' term months') + ', health ' + (hz === 99 ? 'the run' : hz + ' term months') + ' (design: breaks down by 5 / 9)');
  }
  if (name.startsWith('social:')) {
    const npc = name.split(':')[1], f = med(runs.map((r) => r.relAt24[npc] || 0));
    if (f < 80) alarm(name + ': friendship ' + Math.round(f) + ' at month 24 (design: ~80+ at about two years)');
    const rom = runs.filter((r) => r.sparked);
    if (rom.length && rom.filter((r) => r.swing >= 20).length / rom.length < 0.5) alarm(name + ': romance swings ≥ 20 within 3 months in only ' + Math.round(100 * rom.filter((r) => r.swing >= 20).length / rom.length) + '% of romance runs (design: volatile)');
  }
  if (name === 'truant' && !share((r) => r.dropped)) alarm('truant: never dropped or fired (design: skipping hurts)');
  // The strategy styles (tools/policies.js `about`). Wide tolerances: each says a system no longer does its job.
  const other = (n, f) => (all && all[n] && all[n].runs && all[n].runs.length ? med(all[n].runs.map(f)) : null);
  if (name === 'scholar') {
    const paid = runs.reduce((a, r) => a + r.stipendPaid, 0) / Math.max(1, runs.reduce((a, r) => a + r.stipendTerms, 0));
    if (paid < 0.4 || paid > 0.95) alarm('scholar: the stipend is paid in ' + Math.round(100 * paid) + '% of terms (design: a real stake a study-first scholar mostly keeps; 40–95%)');
    const g = med(runs.map((r) => r.gpaEnd)), gb = other('balanced', (r) => r.gpaEnd);
    if (gb != null && g <= gb) alarm('scholar: GPA ' + g.toFixed(2) + ' is no better than balanced\'s ' + gb.toFixed(2) + ' (studying should pay in grades)');
  }
  if (name === 'nightlife') {
    if (share((r) => r.early) > 0.2) alarm('nightlife: ' + Math.round(100 * share((r) => r.early)) + '% of runs end early (going out every night should cost, not end the run)');
    const g = med(runs.map((r) => r.goldEnd)), gm = other('moneymaxx', (r) => r.goldEnd);
    if (gm != null && g > gm) alarm('nightlife: ends with ' + Math.round(g) + ' crowns, more than moneymaxx\'s ' + Math.round(gm) + ' (the night pays better than any job)');
  }
  if (name === 'sleuth') {
    const f = runs.reduce((a, r) => a + r.followed, 0) / Math.max(1, runs.reduce((a, r) => a + r.leads, 0));
    if (f < 0.6) alarm('sleuth: follows ' + Math.round(100 * f) + '% of its leads (a lead names a place a player can go; ≥ 60%)');
  }
  if (name === 'romantic') {
    const fp = med(runs.map((r) => r.firstPartner ?? 99));
    if (fp > 24) alarm('romantic: first partner at month ' + (fp === 99 ? 'never' : fp) + ' (median; a player courting from the start finds one within two years)');
  }
  if (name === 'homebody' && share((r) => r.early) > 0.05) alarm('homebody: ' + Math.round(100 * share((r) => r.early)) + '% of runs end early (> 5%; a careful player who sleeps every night should graduate)');
  if (name === 'combatmaxx') {
    const f = med(runs.map((r) => r.fights)), fb = other('balanced', (r) => r.fights);
    if (fb != null && f < 2 * fb) alarm('combatmaxx: ' + f + ' fights, under twice balanced\'s ' + fb + ' (a player who seeks fights should find them)');
    const won = runs.reduce((a, r) => a + r.fightsWon, 0) / Math.max(1, runs.reduce((a, r) => a + r.fights, 0));
    if (won < 0.5) alarm('combatmaxx: wins ' + Math.round(100 * won) + '% of its fights (it takes only fights a card calls winnable; ≥ 50%)');
    if (share((r) => r.early) > 0.2) alarm('combatmaxx: ' + Math.round(100 * share((r) => r.early)) + '% of runs end early (fighting often should cost, not end the run)');
  }
  if (name === 'explorer') {
    const d = med(runs.map((r) => r.distinct)), db = other('balanced', (r) => r.distinct);
    if (db != null && d <= db) alarm('explorer: sees ' + d + ' different cards, no more than balanced\'s ' + db + ' (variety should reward exploring)');
  }
}

/* ------------------------------------------------------------------ curve */
// Fits the expected-skill curve E(turn) (design §8.6): the mean skill of the balanced play style at the
// start of each turn. --write puts it in @balance curve (content/core/balance.grim).
function curve(opts = {}) {
  const { content, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
  const games = opts.games || 100, sums = [], counts = [];
  for (let g = 0; g < games; g++) {
    const { eng } = playGame(content, { seed: 31337 + g * 7919, style: Policies.get('balanced'), runId: 'curve' });
    for (const h of eng.s.hist) if (h.t === 'month' && h.vals) {
      const sk = content.order.skills.map((k) => h.vals[k] || 0);
      sums[h.turn - 1] = (sums[h.turn - 1] || 0) + sk.reduce((a, b) => a + b, 0) / sk.length; counts[h.turn - 1] = (counts[h.turn - 1] || 0) + 1;
    }
  }
  const c = sums.map((x, i) => Math.round(x / counts[i]));
  console.log('E(turn) over ' + games + ' balanced games: ' + c.join(' '));
  if (opts.write) {
    const { Rewriter } = require('./rewrite.js');
    const file = 'content/core/balance.grim';
    const rw = new Rewriter(ROOT);
    const n = rw.lines(file).findIndex((l) => /^curve\s*:/.test(l));
    if (n < 0) { console.error('no curve: line in ' + file); process.exit(1); }
    rw.edit(file, n + 1, 'curve: ' + c.join(' '));
    rw.apply();
    console.log('written to ' + file + ' — rebuild, and refresh the golden baseline if gameplay changed intentionally');
  }
  return c;
}

/* ------------------------------------------------------------------ snapshot / diff */
// Golden seeds: the same games every time. A pure refactor must reproduce them exactly.
const GOLDEN = { styles: ['random', 'social', 'cautious'], games: 40, seed: 424242 };
function snapshot(out, opts = {}) {
  const { content, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
  const games = opts.games || GOLDEN.games;
  const snap = { format: 'lumenhold-snapshot', v: 1, contentHash: contentHash(), createdAt: new Date().toISOString(), games: [], seen: {} };
  for (const name of GOLDEN.styles) {
    const style = Policies.get(name);
    const seen = snap.seen[name] = {};
    for (let g = 0; g < games; g++) {
      const seed = GOLDEN.seed + g * 7919;
      try {
        const { eng, r } = playGame(content, { seed, style, runId: 'golden' });
        const picks = eng.s.hist.filter((h) => h.t === 'card' && h.choice != null);
        picks.forEach((h) => { seen[h.id] = (seen[h.id] || 0) + 1; });
        const vals = {}; for (const [k, v] of Object.entries(eng.s.vals)) vals[k] = Math.round(v * 100) / 100;
        snap.games.push({ style: name, seed, ending: r.id, turn: r.turn, cards: picks.length, choices: I18n.hash(picks.map((h) => h.id + ':' + h.choice).join(' ')), vals });
      } catch (e) { snap.games.push({ style: name, seed, error: e.message }); }
    }
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(snap, null, 1) + '\n');
  console.log('snapshot: ' + snap.games.length + ' games (' + GOLDEN.styles.join(', ') + ' × ' + games + ') → ' + rel(out));
  return snap;
}
function snapDiff(aPath, bPath) {
  const [a, b] = [aPath, bPath].map((p) => JSON.parse(fs.readFileSync(p, 'utf8')));
  const key = (g) => g.style + '@' + g.seed;
  const bm = new Map(b.games.map((g) => [key(g), g]));
  const lines = []; let changed = 0;
  for (const ga of a.games) {
    const gb = bm.get(key(ga));
    if (!gb) { lines.push('missing in B: ' + key(ga)); changed++; continue; }
    const d = [];
    if (ga.error !== gb.error) d.push('error ' + (ga.error || '-') + ' → ' + (gb.error || '-'));
    if (ga.ending !== gb.ending) d.push('ending ' + ga.ending + ' → ' + gb.ending);
    if (ga.turn !== gb.turn) d.push('turn ' + ga.turn + ' → ' + gb.turn);
    if (ga.choices !== gb.choices) d.push('choices differ (' + ga.cards + ' → ' + gb.cards + ' cards)');
    const vd = Object.keys({ ...ga.vals, ...gb.vals }).filter((k) => (ga.vals || {})[k] !== (gb.vals || {})[k]);
    if (vd.length) d.push('final ' + vd.slice(0, 6).map((k) => k + ' ' + (ga.vals || {})[k] + '→' + (gb.vals || {})[k]).join(', ') + (vd.length > 6 ? ' …' : ''));
    if (d.length) { changed++; if (lines.length < 25) lines.push(key(ga) + ': ' + d.join('; ')); }
  }
  const dist = (s) => { const m = {}; s.games.forEach((g) => { const k = g.style + ' ' + (g.ending || 'ERROR'); m[k] = (m[k] || 0) + 1; }); return m; };
  const da = dist(a), db = dist(b);
  const distLines = Object.keys({ ...da, ...db }).sort().filter((k) => da[k] !== db[k]).map((k) => '  ' + k + ': ' + (da[k] || 0) + ' → ' + (db[k] || 0));
  const seenLines = [];
  for (const st of Object.keys({ ...a.seen, ...b.seen })) {
    const sa = a.seen[st] || {}, sb = b.seen[st] || {};
    const lost = Object.keys(sa).filter((id) => !sb[id]), gained = Object.keys(sb).filter((id) => !sa[id]);
    if (lost.length) seenLines.push('  ' + st + ': no longer seen: ' + lost.join(', '));
    if (gained.length) seenLines.push('  ' + st + ': newly seen: ' + gained.join(', '));
  }
  if (a.contentHash !== b.contentHash) console.log(C.d + 'content ' + a.contentHash + ' → ' + b.contentHash + C.x);
  if (!changed && !seenLines.length) { console.log(C.g + 'diff: no gameplay change' + C.x + ' (' + a.games.length + ' golden games)'); return true; }
  console.log(C.y + 'diff: ' + changed + ' of ' + a.games.length + ' golden games changed' + C.x);
  lines.forEach((l) => console.log('  ' + l));
  if (distLines.length) { console.log('endings:'); distLines.forEach((l) => console.log(l)); }
  if (seenLines.length) { console.log('coverage:'); seenLines.forEach((l) => console.log(l)); }
  return false;
}

/* ------------------------------------------------------------------ fmt */
function fmt(paths, opts = {}) {
  const files = paths.length ? paths.map((p) => path.resolve(p)).flatMap((p) => (fs.existsSync(p) && fs.statSync(p).isDirectory() ? listFiles(p) : [p])) : listFiles(CONTENT);
  let changed = 0, errors = 0;
  for (const f of files) {
    if (!fs.existsSync(f)) { console.error(C.r + 'not found: ' + C.x + f); errors++; continue; }
    const r = Fmt.formatChecked(fs.readFileSync(f, 'utf8'), rel(f));
    if (r.error) { console.error(C.r + rel(f) + ': ' + C.x + r.error); errors++; continue; }
    if (!r.changed) continue;
    changed++;
    if (opts.check) console.log(C.y + 'not canonical: ' + C.x + rel(f));
    else { fs.writeFileSync(f, r.text); console.log('formatted ' + rel(f)); }
  }
  if (!opts.quiet || changed || errors) console.log('fmt: ' + files.length + ' file(s), ' + changed + (opts.check ? ' not canonical' : ' rewritten') + (errors ? ', ' + errors + ' error(s)' : '') + (opts.check && changed ? C.d + ' — run node tools/grim.js fmt' + C.x : ''));
  return errors === 0 && !(opts.check && changed);
}

/* ------------------------------------------------------------------ query */
function query(args, opts = {}) {
  if (opts.fields) { for (const [k, v] of Object.entries(Query.FIELDS)) console.log(C.b + k.padEnd(16) + C.x + v); return; }
  const [node, ...rest] = args;
  if (!node) { console.log('usage: node tools/grim.js query NODE [WHERE]   (NODE: ' + Query.BLOCKS.concat(['option'], Query.STATEMENTS, ['stmt', 'any']).join(' ') + '; --fields lists what WHERE can use)'); return; }
  const { content, sources, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
  let hits;
  try { hits = Query.select(content, { node, where: rest.join(' ').trim() || null }); } catch (e) { console.error(C.r + 'query: ' + C.x + e.message); process.exit(1); }
  const lines = {}; for (const src of sources) lines[src.path] = src.text.split('\n');
  const srcLine = (h) => ((lines[h.file] || [])[h.line - 1] || '').trim();
  if (opts.file) hits = hits.filter((h) => h.file.includes(opts.file));
  if (opts.grep) { const re = new RegExp(opts.grep, 'i'); hits = hits.filter((h) => re.test(srcLine(h)) || re.test(h.text || h.title || h.label || '')); }
  if (opts.json) { console.log(JSON.stringify(hits.map((h) => ({ ...h, src: srcLine(h) })), null, 2)); return; }
  if (opts.group) {
    const g = {}; for (const h of hits) { const k = String(h[opts.group]); g[k] = (g[k] || 0) + 1; }
    Object.entries(g).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(String(v).padStart(5) + '  ' + k));
  } else {
    for (const h of hits) console.log(C.d + h.file + ':' + h.line + C.x + '  ' + C.b + h.block + (h.option ? '/' + h.option : '') + C.x + '  ' + srcLine(h));
  }
  console.log(C.d + hits.length + ' match(es)' + C.x);
}

/* ------------------------------------------------------------------ feedback */
// Same fingerprint the browser stamps on exported runs (src/ui.js runMeta), so logs from older content stand out.
const contentHash = () => P.contentHash();
function feedback(paths, opts = {}) {
  const RunLog = require('./runlog.js');
  // Default: exported files in feedback/ plus the server's run logs in data/runs/.
  const { runs, files, skipped } = RunLog.loadRuns(paths.length ? paths : [path.join(ROOT, 'feedback'), path.join(ROOT, 'data', 'runs')]);
  skipped.forEach((m) => console.error(C.y + 'skipped ' + m + C.x));
  const { content } = compileAll();
  const now = contentHash();
  const months = content.game.months || [];
  const { total, rows } = RunLog.aggregateFeedback(runs, { event: opts.event, contentHash: now });
  if (opts.json) { console.log(JSON.stringify({ runs: runs.length, feedback: total, contentHash: now, events: Object.fromEntries(rows) }, null, 2)); return; }
  console.log(C.b + 'feedback: ' + total + ' note(s) on ' + rows.length + ' event(s) from ' + runs.length + ' run(s) in ' + files.length + ' file(s)' + C.x);
  if (!files.length) console.log(C.d + 'Export logs from the title screen (or an ending) into feedback/, or play on the server (npm start).' + C.x);
  for (const [key, b] of rows) {
    const missing = !content.events[b.id] && !content.endings[b.id];
    console.log('\n' + C.b + key + C.x + '  ' + C.g + '+' + b.up + C.x + ' ' + C.r + '-' + b.down + C.x + (missing ? C.y + '  (no longer exists)' + C.x : ''));
    for (const n of b.notes) {
      const when = (months[((n.turn - 1) % (months.length || 12))] || 'month ' + n.turn) + ' Y' + Math.ceil(n.turn / (months.length || 12));
      const mark = n.rating === 'up' ? C.g + '+' + C.x : n.rating === 'down' ? C.r + '-' + C.x : ' ';
      console.log('  ' + mark + ' ' + C.d + when + (n.actor ? ' @' + n.actor : '') + (n.choice ? ' → ' + n.choice : '') + ' · ' + n.lang + ' · ' + n.run + (n.sim ? ' · sim:' + n.sim : '') + (n.stale ? ' · older content' : '') + C.x);
      if (n.comment) console.log('    ' + n.comment.replace(/\n/g, '\n    '));
    }
  }
}

/* ------------------------------------------------------------------ stats / show / ids */
function stats() {
  const { content, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
  const ev = Object.values(content.events);
  const count = (arr, f) => arr.reduce((m, x) => { [].concat(f(x)).forEach((k) => { m[k] = (m[k] || 0) + 1; }); return m; }, {});
  console.log('events: ' + ev.length);
  console.log('  by trigger: ' + JSON.stringify(count(ev, (e) => e.trigger)));
  console.log('  by type:    ' + JSON.stringify(count(ev, (e) => e.type)));
  console.log('  by file:'); Object.entries(count(ev, (e) => e.file)).forEach(([k, v]) => console.log('    ' + String(v).padStart(4) + '  ' + k));
  console.log('  by tag:     ' + Object.entries(count(ev, (e) => e.tags || [])).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ':' + v).join(' '));
  console.log('  by actor:   ' + Object.entries(count(ev.filter((e) => e.actor), (e) => e.actor)).map(([k, v]) => k + ':' + v).join(' '));
  console.log('  chains:     ' + Object.entries(count(ev.filter((e) => e.chain), (e) => e.chain)).map(([k, v]) => k + ':' + v).join(' '));
  for (const k of ['states', 'npcs', 'endings', 'hooks', 'resources', 'skills']) console.log(k + ': ' + Object.keys(content[k]).length);
}
function show(id) {
  const { content, sources } = compileAll();
  let found = false;
  for (const k of ['events', 'states', 'npcs', 'endings', 'hooks', 'resources', 'skills']) {
    const d = content[k][id]; if (!d) continue; found = true;
    const src = sources.find((s) => s.path === d.file).text.split('\n');
    let end = d.line; while (end < src.length && !src[end].startsWith('@')) end++;
    console.log(C.b + d.file + ':' + d.line + C.x + '\n' + src.slice(d.line - 1, end).join('\n').trimEnd());
    const kind = k.slice(0, -1), v = variantsByBlock(I18n.extract(content).filter((x) => x.block === kind + ':' + id))[kind + ':' + id];
    if (v) console.log(C.b + '\nvariation:' + C.x + '\n' + Object.entries(v).map(([key, g]) => '  ' + key.padEnd(24) + g.join(', ')).join('\n'));
  }
  if (!found) console.log('(no block with id "' + id + '")');
  const re = new RegExp('\\b' + id + '\\b');
  console.log(C.b + '\nreferences:' + C.x);
  for (const s of sources) s.text.split('\n').forEach((l, i) => { if (re.test(l) && !l.startsWith('@')) console.log('  ' + s.path + ':' + (i + 1) + '  ' + l.trim()); });
}
function ids(kind) {
  const { content } = compileAll();
  const A = analyze(content);
  const map = { event: content.events, state: content.states, npc: content.npcs, ending: content.endings, resource: content.resources, skill: content.skills, hook: content.hooks, flag: A.flagsSet, var: A.varsSet };
  const kinds = kind ? [kind] : Object.keys(map);
  for (const k of kinds) { if (!map[k]) { console.log('unknown kind ' + k); continue; } console.log(C.b + k + C.x + ': ' + Object.keys(map[k]).sort().join(' ')); }
}

/* ------------------------------------------------------------------ docs */
// Regenerates the block/property table in docs/authoring/schema.md from the parser's SCHEMA.
function genDocs(opts = {}) {
  const file = path.join(ROOT, 'docs', 'authoring', 'schema.md');
  const type = (kind, p) => {
    if (G.STRUCT_PROPS[p] && !(p === 'skill' && kind !== 'track')) return 'structured';
    if (['when', 'weight', 'closed_when', 'gone_when', 'discover', 'hinted_when', 'unlock', 'prereq'].includes(p)) return 'expression';
    if (['years', 'cards_per_month', 'max_cards_per_month', 'social_per_month', 'min_random_per_month', 'min', 'max', 'start', 'duration', 'repeat', 'priority', 'start_rel', 'year', 'levels', 'due', 'alignment'].includes(p)) return 'number';
    if (['tags', 'months', 'summer_months', 'traits', 'interests', 'open', 'members', 'clues', 'key_clues', 'cast'].includes(p)) return 'list';
    if (['romance', 'hidden'].includes(p)) return 'yes/no';
    return 'text';
  };
  const I18nFields = require('../src/i18n.js').FIELDS || {};
  const rows = ['', '### Blocks and properties', '', '| Block | Property | Type | Translated |', '|---|---|---|---|'];
  for (const [kind, sc] of Object.entries(G.SCHEMA)) {
    const tr = new Set(I18nFields[kind] || []);
    sc.props.forEach((p, i) => rows.push('| ' + (i ? '' : '`@' + kind + (sc.noId ? '' : sc.dotted ? ' npc.key' : ' id') + '`') + ' | `' + p + '` | ' + type(kind, p) + ' | ' + (tr.has(p) ? 'yes' : '') + ' |'));
    sc.effects.forEach((p) => rows.push('| | `' + p + ':` | effects | `say:` lines |'));
    if (sc.options) rows.push('| | `> key: Label` | option (`when:`, `hint:`, effects) | label, hint, `say:` |');
  }
  rows.push('', '### Functions in expressions', '', [...G.FUNCS].sort().map((f) => '`' + f + '()`').join(' · '), '');
  const ok1 = regenSection(file, 'schema', rows.join('\n'), opts);
  return genPresetsDoc(opts) && ok1;
}

// Replaces the text between a file's BEGIN/END GENERATED markers; with --check, only reports a stale section.
function regenSection(file, name, gen, opts) {
  const text = fs.readFileSync(file, 'utf8'), base = path.basename(file);
  const begin = '<!-- BEGIN GENERATED: ' + name + ' (node tools/grim.js docs) -->', end = '<!-- END GENERATED: ' + name + ' -->';
  const i = text.indexOf(begin), j = text.indexOf(end);
  if (i < 0 || j < 0) { console.error(base + ': generated markers missing'); return false; }
  const next = text.slice(0, i + begin.length) + gen + text.slice(j);
  if (opts.check) { const ok = next === text; console.log(ok ? 'docs: ' + base + ' is up to date' : C.r + 'docs: ' + base + ' is stale' + C.x + ' — run node tools/grim.js docs'); return ok; }
  if (next !== text) { fs.writeFileSync(file, next); console.log('docs: ' + base + ' regenerated'); } else console.log('docs: ' + base + ' is up to date');
  return true;
}

// The size tiers, difficulty tiers and presets in docs/authoring/presets.md, from @balance and @preset (step 5),
// so the writing guide can't drift from content/core/balance.grim.
function genPresetsDoc(opts = {}) {
  const { content, errors } = compileAll();
  if (errors.length) { errors.forEach((e) => console.error(e.message)); return false; }
  const b = content.balance || {}, sizes = b.sizes || {}, TIER = ['tiny', 'small', 'medium', 'large', 'huge'];
  const rows = ['', '## Size tiers', '', '| | ' + TIER.join(' | ') + ' |', '|---' + '|---'.repeat(TIER.length) + '|'];
  const label = { gold: 'crowns', xp: 'skill XP' };
  for (const [k, row] of Object.entries(sizes)) rows.push('| ' + (label[k] || k) + ' | ' + row.join(' | ') + ' |');
  // The check ladder (docs/authoring/checks.md): rungs, odds by nature, luck, drift, course standards.
  if (b.dc_tiers) {
    const RK = G.RANKS, at = (w) => b.dc_tiers[w];
    rows.push('', '## Check ladder (`checks.md`)', '', '| rank | − | (plain) | + |', '|---|---|---|---|');
    for (const r of RK) rows.push('| ' + r + ' | ' + at(r + '-') + ' | ' + at(r) + ' | ' + at(r + '+') + ' |');
    rows.push('', 'Odds by nature (the chance when your skill matches the DC): ' + Object.entries(b.likelihood || {}).map(([k, v]) => '`' + k + '` ' + v + '%').join(' · ') + '. A circumstance step moves the z by ' + b.odds_step + '.', '');
    rows.push('Luck (the bell\'s σ): ' + Object.entries(b.sigma || {}).map(([k, v]) => '`' + k + '` ' + v).join(' · ') + '; odds run ' + (b.bell || {}).floor + '–' + (b.bell || {}).ceil + '% (milestones and exams 0–100).', '');
    rows.push('Drift (share of the gap to the expected skill the DC closes): ' + Object.entries(b.drift || {}).map(([k, v]) => '`' + k + '` ' + v).join(' · ') + '.', '');
    rows.push('Course standard at levels I–III: ' + (b.course_standard || []).map((x) => '`' + x + '`').join(' · ') + '; a course card rises ' + b.course_step + ' rungs per course level above its own.', '');
  }
  rows.push('## Difficulty tiers (legacy)', '', Object.entries(b.difficulty || {}).map(([k, v]) => '`' + k + ' ' + (v > 0 ? '+' : '') + v + '`').join(' · ') + ', relative to the expected skill at that point of the run (`curve`); being rewritten to the ladder.', '');
  rows.push('## Presets', '', '| Preset | Expands to |', '|---|---|');
  const lines = fs.readFileSync(path.join(ROOT, 'content', 'core', 'balance.grim'), 'utf8').split('\n');
  for (const pr of Object.values(content.presets || {})) {
    if (!pr.file || !pr.file.endsWith('balance.grim')) continue;
    let k = pr.line, body = [];
    while (k < lines.length && !lines[k].startsWith('do:')) k++;
    for (k++; k < lines.length && /^\s+\S/.test(lines[k]); k++) body.push(lines[k].trim());
    rows.push('| `' + pr.id + ((pr.params || []).length ? ' <' + pr.params.join('> <') + '>' : '') + '` | ' + (pr.desc ? pr.desc + ' ' : '') + '`' + body.join('; ').replace(/:; /g, ': ') + '` |');
  }
  rows.push('');
  return regenSection(path.join(ROOT, 'docs', 'authoring', 'presets.md'), 'tiers', rows.join('\n'), opts);
}

/* ------------------------------------------------------------------ main */
const [cmd, ...rest] = process.argv.slice(2);
const flag = (name) => { const i = rest.indexOf('--' + name); return i >= 0 ? (rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[i + 1] : true) : null; };
switch (cmd) {
  case 'build': if (build({ check: !!flag('check') }) === false) process.exit(1); break;
  case 'reach': if (!reachCmd()) process.exit(1); break;
  case 'lint': lint({ verbose: !!flag('verbose'), legacy: !!flag('legacy') }); break;
  case 'sim': { const ok = sim(Number(rest.find((x) => /^\d+$/.test(x))) || 300, { seed: flag('seed') != null ? Number(flag('seed')) : undefined, policy: flag('policy'), lang: flag('lang'), verbose: !!flag('verbose'), log: typeof flag('log') === 'string' ? path.resolve(flag('log')) : null }); if (!ok) process.exit(1); break; }
  case 'i18n': if (rest[0]) i18nSync(rest[0]); else i18nStatus(); break;
  case 'stats': stats(); break;
  case 'show': show(rest[0]); break;
  case 'odds': { const { content, errors } = compileAll(); if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); } console.log(require('./odds.js').odds(content, rest.filter((x) => !x.startsWith('--')))); break; }
  case 'graph': { const { content } = compileAll(); const out = require('./graph.js').describe(content, rest[0]); if (!out) { console.error('graph: no event, state or hook "' + rest[0] + '"'); process.exit(1); } console.log(out); break; }
  case 'leads': {
    const { content } = compileAll(), L = require('./leads.js');
    if (flag('queued')) {
      const text = L.queuedReport(content), out = flag('out');
      if (out) { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, text); console.log('wrote ' + out + ' (' + L.queued(content).length + ' timed follow-ups)'); } else console.log(text);
      break;
    }
    console.log(L.report(content, !!flag('all'))); break;
  }
  case 'ids': ids(rest[0]); break;
  case 'rename': {
    const [kind, from, to] = rest.filter((x) => !x.startsWith('--'));
    if (!to) { console.log('usage: node tools/grim.js rename KIND OLD NEW [--dry-run]   (KIND: ' + require('./rename.js').KINDS.join(' ') + ')'); process.exit(1); }
    let res;
    try { res = require('./rename.js').rename(ROOT, kind, from, to, { dryRun: !!flag('dry-run') }); } catch (e) { console.error(C.r + 'rename: ' + C.x + e.message); process.exit(1); }
    if (flag('dry-run')) console.log(res.diff);
    console.log((flag('dry-run') ? 'would rename ' : 'renamed ') + kind + ' ' + from + ' → ' + to + ': ' + res.references + ' reference(s), ' + res.files.length + ' file(s)' + (flag('dry-run') ? '' : '. Run: node tools/grim.js build'));
    if (res.comments) console.log(C.d + res.comments + ' comment line(s) mention "' + from + '" (left as written)' + C.x);
    if (res.elsewhere.length) console.log(C.y + 'not rewritten, check by hand: ' + C.x + res.elsewhere.join(', '));
    break;
  }
  case 'migrate': {
    let ran;
    try { ran = require('./migrate.js').migrate(ROOT, { dryRun: !!flag('dry-run') }); } catch (e) { console.error(C.r + 'migrate: ' + C.x + e.message); process.exit(1); }
    if (ran.length && !flag('dry-run')) console.log('Next: node tools/grim.js build && node tools/grim.js lint && node tools/grim.js diff');
    break;
  }
  case 'analyze': { const r = require('child_process').spawnSync(process.execPath, [path.join(__dirname, 'analyze.js'), ...rest], { stdio: 'inherit' }); if (r.status) process.exit(r.status); break; }
  case 'styles': for (const n of Policies.list()) console.log(n.padEnd(16) + ' ' + Policies.about(n)); break;
  case 'curve': curve({ games: Number(flag('games')) || 100, write: !!flag('write') }); break;
  case 'balance': if (!balance({ quick: !!flag('quick'), games: Number(flag('games')) || 0 })) process.exit(1); break;
  case 'snapshot': snapshot(path.resolve(flag('out') || path.join(ROOT, 'build', 'snapshots', (rest.find((x) => !x.startsWith('--') && rest[rest.indexOf(x) - 1] !== '--out') || 'latest') + '.json'))); break;
  case 'diff': {
    const files = rest.filter((x) => !x.startsWith('--'));
    const a = files[0] || path.join(ROOT, 'test', 'golden', 'baseline.json');
    let b = files[1];
    if (!b) { b = path.join(ROOT, 'build', 'snapshots', 'latest.json'); snapshot(b); }
    if (!snapDiff(a, b)) process.exit(1);
    break;
  }
  case 'lorebook': {
    const { content, errors } = compileAll();
    if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
    const book = require('./worldbook.js').lorebook(content);
    const out = path.resolve(flag('out') || path.join(ROOT, 'build', 'lorebook.json'));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(book, null, 1) + '\n');
    const by = {}; book.forEach((e) => { by[e.kind] = (by[e.kind] || 0) + 1; });
    console.log('lorebook: ' + book.length + ' entries (' + Object.entries(by).map(([k, v]) => v + ' ' + k).join(', ') + ') → ' + rel(out));
    break;
  }
  case 'brief': {
    const { content, sources, errors } = compileAll();
    if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
    const list = (x) => (typeof x === 'string' ? x.split(',').map((y) => y.trim()).filter(Boolean) : []);
    const rulesFile = path.join(ROOT, 'docs', 'authoring', 'checklist.md');
    let res;
    try {
      res = require('./worldbook.js').brief(content, sources, { like: list(flag('like')), examples: flag('examples') ? Number(flag('examples')) : null, cast: list(flag('cast')), place: flag('place') || null, track: flag('track') || null, arc: flag('arc') || null, topic: typeof flag('topic') === 'string' ? flag('topic') : '', tier: flag('tier') || 'personal', budget: Number(flag('budget')) || 24000, rules: [rulesFile, path.join(ROOT, 'docs', 'authoring', 'costs.md')].filter((f) => fs.existsSync(f)).map((f) => fs.readFileSync(f, 'utf8').replace(/^# .*\n/, '')).join('\n') });
    } catch (e) { console.error(C.r + 'brief: ' + C.x + e.message); process.exit(1); }
    if (flag('out')) { fs.mkdirSync(path.dirname(path.resolve(flag('out'))), { recursive: true }); fs.writeFileSync(path.resolve(flag('out')), res.text); console.error('brief: ' + res.chars + ' chars (~' + Math.round(res.chars / 4) + ' tokens), ' + res.lore + ' lore, ' + res.examples + ' example(s) → ' + flag('out')); }
    else process.stdout.write(res.text);
    break;
  }
  case 'report': report({ gaps: !!flag('gaps'), games: Number(flag('games')) || 30, policy: flag('policy') || 'balanced', json: !!flag('json'), all: !!flag('all') }); break;
  case 'batch': { const rec = batch(rest.find((x, i) => !x.startsWith('--') && !['--files', '--critic'].includes(rest[i - 1])), { files: flag('files'), critic: flag('critic'), balance: !flag('skip-balance') }); if (!Object.values(rec.validators).every((x) => x.ok)) process.exit(1); break; }
  case 'dupes': {
    const { content } = compileAll();
    const t = flag('threshold') != null ? Number(flag('threshold')) : 0.6;
    const files = rest.filter((x, i) => !x.startsWith('--') && rest[i - 1] !== '--threshold');
    const only = files.length ? new Set(Object.values(content.events).filter((e) => files.some((f) => (e.file || '').includes(f))).map((e) => e.id)) : null;
    const d = require('./dupes.js').dupes(content, { only, threshold: t });
    d.forEach((p) => console.log(C.y + p.score.toFixed(2) + C.x + '  ' + p.a + '  ~  ' + p.b));
    console.log((d.length ? C.y : C.g) + 'dupes: ' + d.length + ' pair(s) at Jaccard ≥ ' + t + C.x + (only ? C.d + ' (pairs touching ' + only.size + ' event(s) in ' + files.join(', ') + ')' + C.x : ''));
    if (d.length && flag('strict')) process.exit(1);
    break;
  }
  case 'schema': if (!schemaCmd({ update: !!flag('update') })) process.exit(1); break;
  case 'docs': if (!genDocs({ check: !!flag('check') })) process.exit(1); break;
  case 'canon': {
    const { content, errors } = compileAll();
    if (errors.length) { errors.forEach((e) => console.error(e.message)); process.exit(1); }
    const u = canonCheck(content);
    u.forEach((x) => console.log(C.y + x.name + C.x + '  ' + C.d + x.where.join(' ') + C.x));
    console.log('canon: ' + u.length + ' unknown proper noun(s)');
    if (u.length) process.exit(1);
    break;
  }
  case 'fmt': if (!fmt(rest.filter((x) => !x.startsWith('--')), { check: !!flag('check') })) process.exit(1); break;
  case 'query': { const valued = ['file', 'grep', 'group']; query(rest.filter((x, i) => !x.startsWith('--') && !valued.includes((rest[i - 1] || '').slice(2))), { json: !!flag('json'), fields: !!flag('fields'), file: flag('file'), grep: flag('grep'), group: flag('group') }); break; }
  case 'feedback': feedback(rest.filter((x, i) => !x.startsWith('--') && rest[i - 1] !== '--event'), { event: flag('event'), json: !!flag('json') }); break;
  case 'check': { build(); const ok = lint({ noExit: true }); fmt([], { check: true, quiet: true }); const ok2 = sim(200, {}); process.exit(ok && ok2 ? 0 : 1); break; }
  default: console.log(fs.readFileSync(__filename, 'utf8').split(' */')[0].split('\n').slice(2).map((l) => l.replace(/^ \*\s?/, '')).join('\n'));
}
