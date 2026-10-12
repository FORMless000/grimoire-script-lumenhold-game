# AGENTS.md — working on Lumenhold Academy

Lumenhold Academy is a card-swipe life sim set at a magical academy. It runs in the browser: open `index.html` directly (no install), or run `npm start` for the local server, which adds server saves, run logs and an admin page. The v0.3 redesign is planned in `docs/design-v0.3.md`. Content lives in a custom scripting language, Grimoire Script (`.grim`), which agents can extend without touching the engine.

**Adding events, characters, states or chains?** Follow `skills/write-academy-events/SKILL.md` (built from `docs/authoring/`) and use `docs/grimoire-script.md` as the language reference. Canon lives in the worldbook, `content/world/`: get a brief (`node tools/grim.js brief …`) before writing, and extend the worldbook with `skills/distill-lore/SKILL.md`. Every change must pass `node tools/grim.js check` (quick) and, before you finish a larger change, `npm run verify`. Content is written in English; translations live in `locales/` (see **Localization** below).

---

## Project map

```
index.html                 entry point; loads src/* and build/content.bundle.js
src/grimoire.js            parser + expression compiler (UMD: browser + Node)
src/engine.js              DOM-free game logic (turns, effects, states, relationships, tracks, endings)
src/director.js            DOM-free day builder (design §5): day recipes, slots, map view, scoring, push windows
src/map.js                 the map screen (markers, list view, keyboard); presentation only
src/i18n.js                 localization: .lang parser, string extraction, applyContent, UI string table (UI_EN), t()
src/art.js                 SVG icon library, card scene composer, procedural portraits
src/net.js                 optional server client: detection, telemetry batches, server saves, seen counters
src/ui.js, src/style.css   presentation only: swipe cards, menus, month & ending screens, side panel, feedback bar, saved games, ?debug panel
server/                    `npm start`: index.js (routes, static files, live bundle), store.js (files under data/), admin.html
data/                      server data, gitignored: runs/<runId>.ndjson, saves/<slot>.json, seen.json
tools/grim.js              CLI (see Workflow)
tools/project.js           shared loaders (sources, locales, bundle, content hash) for a project root
tools/format.js, query.js  canonical formatter (grim fmt) and structural search (grim query)
tools/rewrite.js           verified line edits; used by rename.js (grim rename) and migrate.js (grim migrate)
tools/migrations/          NNNN-name.js content migrations; applied ids in content/.migrations.json
tools/policies.js          simulator play styles; tools/runlog.js reads run logs and aggregates feedback
tools/canon.js             canon lint (unknown proper nouns); tools/worldbook.js: lorebook export and briefs
tools/e2e.js               browser tests (Playwright): from file:// or --server
test/                      node:test suite (npm test), fixtures/, golden/baseline.json (snapshot for grim diff)
build/content.bundle.js    GENERATED — all .grim sources + .lang files as one JS file (so file:// works). Never edit by hand.
content/core/rules.grim    @game, resources, skills, global hooks (rent, drift, start)
content/world/              the worldbook (design §3): cast.grim (the 12 characters: age, voice, stats, schedules,
                           relations), facts/<npc>.grim, places.grim (map positions, hours), tracks.grim (courses,
                           clubs, jobs, internships, thesis), spells.grim, arcs.grim (clocks, beats), factions.grim,
                           archetypes.grim, timeline.grim, vocabulary.grim, lore/{hard,soft}/, maps/*.svg (map art)
content/core/balance.grim  @balance (size and difficulty tiers, XP, the E(turn) curve) and @preset blocks
content/states/states.grim origins, electives, clubs, jobs (v0.2 states, granted by tracks' legacy:), conditions, plan_* break plans
content/endings.grim       early (game-over) and graduation endings
content/events/*.grim      events, grouped by theme (see below)
docs/grimoire-script.md    language reference (includes the .lang format)
docs/authoring/            the authoring spec (style, schema, checklist, presets, classes, examples, sample briefs);
                           skills/write-academy-events and skills/distill-lore are built from it
locales/<lang>/            translations: one .lang per .grim file, plus ui.lang and GLOSSARY.md
```

The engine is content-agnostic. Only touch `src/` when you need a new language feature (a new statement, function or block property). When you do, update `src/grimoire.js` (syntax plus `SCHEMA` / `FUNCS`), `src/engine.js` (semantics), `tools/grim.js` (lint), `tools/format.js` and `tools/query.js` (canonical spacing and query fields for a new statement), and `docs/grimoire-script.md`, in that order.

### Event files

| File | Contents | Triggers |
|---|---|---|
| `calendar_2b.grim` | The four-year loop's fixed beats: enrolment (`offers: courses`, `pick: 2`), Club Fair, Job Board, break plans, track notices, internship, thesis, Lantern Night, year four | auto, place, queued |
| `slice_2a.grim` | Phase 2a vertical slice: tiers, presets, challenges, spells, variation | mixed |
| `slice_2b.grim` | Phase 2b vertical slice: Evocation I–III, Duelling Circle, Library Assistant, campus places, break plans, the internship stub, thesis, the_bell arc | place, track, plan, arc |
| `calendar.grim` | v0.2 fixed beats: intro, origin, festivals, graduation (its menus and exams are retired by migration 0001) | mostly `auto` |
| `classes.grim` | 3 events per elective, gated on `has(class_x)` | random, weight 16 |
| `clubs.grim` | 3 per club, gated on `has(club_x)` | random, weight 14 |
| `jobs.grim` | 3 per job, gated on `has(job_x)` | random, weight 14 |
| `people_students.grim` | Per-character arcs for Lyra, Tobias, Seraphine, Corvin, Mira, Nessa | intros `random`, rest `social` |
| `people_others.grim` | Kael (outside the main chain), Bram, Thorne, Maud, Isolde | same |
| `social.grim` | Generic `actor: any` relationship events (friendship, romance, rivalry, decay) | `social` |
| `chain_hollowstar.grim` | The main mystery and its finale | mixed |
| `chains_minor.grim` | Forbidden section, curse cure, Grisk's debt, Ember the fox, the ghost | mixed |
| `life.grim` | Everyday academy life, money, seasons | random |
| `crisis.grim` | What happens when a resource hits zero | queued |
| `expansion_y3.grim` | Final year: Career Fair menu → interview → offer (`career_*` flags feed the teacher / wanderer endings), thesis, portrait, farewells | auto + random |
| `expansion_summer.grim` | `sum_*` summer-recess events (castle, home, travel) | random, months 11–12 |
| `expansion_faculty.grim` | Short arcs for Thorne, Maud and the headmistress | social |
| `expansion_people.grim` | More per-character events for the student cast | social |
| `expansion_social.grim` | More generic `actor: any` relationship events | social |
| `expansion_life.grim` | More everyday life, incl. the `timeloop` chain | random |
| `expansion_classes.grim` | One more event per elective, plus compulsory broom flight | random |
| `chain_ilse.grim` | Ilse Dumont's chain (flags `ilse_saved`, `ilse_taken`, `dumont_reunited`, …) | social |

---

## Workflow

```bash
node tools/grim.js build      # regenerate build/content.bundle.js — required after any .grim change
node tools/grim.js lint       # cross-reference check; 0 errors required, read the warnings
node tools/grim.js sim 300    # auto-play: crashes, soft-locks, coverage, ending distribution
node tools/grim.js check      # build + lint + sim 200 — run before you finish
node tools/grim.js show <id>  # print a block's source and everywhere it's referenced
node tools/grim.js ids flag   # list existing ids (event|state|npc|ending|resource|skill|flag|var)
node tools/grim.js stats      # counts by file / trigger / tag / actor / chain
node tools/grim.js fmt        # canonical layout for .grim files (lossless; --check to only report)
node tools/grim.js query check 'dc < 12 and not scales'   # structural search: blocks, options, statements (--fields)
node tools/grim.js feedback   # summarise playtest feedback: exported logs in feedback/ and the server's data/runs/
node tools/grim.js sim 50 --log build/runs   # also write every simulated game's full run log as JSON
node tools/grim.js sim 100 --policy balanced # play styles: random cautious social balanced aggressive moneymaxx focused:<skill> social:<npc>
node tools/grim.js balance    # every play style: invariants fail the run, alarms warn (--quick: fewer styles and games)
node tools/grim.js diff       # golden-seed snapshot vs test/golden/baseline.json: "no gameplay change" or what changed
node tools/grim.js brief --cast lyra,kael --place library --topic "…"   # ~6k-token context pack for writing events
node tools/grim.js canon      # proper nouns the worldbook doesn't know (also part of lint)
node tools/grim.js lorebook   # export the worldbook as build/lorebook.json
node tools/grim.js docs       # regenerate the block table in docs/authoring/schema.md (verify checks it)
node tools/grim.js rename npc kael kael_dumont   # verified rename across content and translations (--dry-run)
node tools/grim.js migrate    # run new scripts in tools/migrations/ (--dry-run shows the diff)
npm test                      # unit tests: tools and server
npm start                     # local server on http://127.0.0.1:4173 (admin: /admin)
npm run verify                # build, lint, fmt --check, tests, balance --quick, diff, e2e against the server
```

**Gameplay changes and the golden baseline.** `grim diff` (part of `verify`) fails when the golden games play differently. That's the point for refactors and tooling work. When a change is meant to alter gameplay (new rules, retuned content), confirm the diff is what you intended, then refresh the baseline in the same commit: `node tools/grim.js snapshot --out test/golden/baseline.json`.

To preview a single event in the browser, open `index.html?event=<id>&debug`; add `&actor=<npc>` for `actor: any` events. With `?debug`, a panel lets you play any event now, skip the month, or run an effect line (`gold = 200`, `rel lyra +40`, `gain class_umbral`).

Node (≥ 20) is needed for the tools and the server. The game itself still runs as plain static files. Playwright (a devDependency) is only for `tools/e2e.js`: `npm install && npx playwright install chromium`.

### Run logs and playtest feedback

The engine records every run in full in `s.hist`: each month's start-of-month effects, every card shown (with its title, text and options as displayed), the choice, the outcome (deltas, checks, notes, `say`), and the resources and skills after it. `s.log` remains the player-facing journal. While playing, a bar in the bottom-left corner rates the current and the previous card 👍 / 👎. The ✎ button (or **F**) adds comments, and the Journal has the same controls for any earlier card. Feedback is stored as `fb` on the history entry.

- **With the server (`npm start`):** the client sends new and changed history entries at every month screen, at the ending and on page hide. Runs land in `data/runs/<runId>.ndjson`, and `/admin` lists runs and feedback by event. Saves (an autosave plus 3 slots) also live on the server; loading a slot continues as a new run (`Engine.forkRun`).
- **Without a server:** the run in progress is in the save. Finished or replaced runs move to `lumenhold.runs.v1` in localStorage (the 15 most recent; runs without feedback are dropped first). "Export" on the title screen downloads all runs, and "Export this run" on an ending screen downloads just that one.
- **Reading them:** `node tools/grim.js feedback` reads `feedback/` (exported files) and `data/runs/` (`--event <id>` filters, `--json` for machine-readable output). Events are sorted by net 👎. Notes logged against older content are marked, using `contentHash`.
- **Tuning workflow:** read the feedback, `show <id>`, edit, then `check`.

---

## World bible (keep new content consistent)

**Setting.** Lumenhold Academy is seven towers joined by bridges of light, standing above a mirror-still lake. A village lies below, reached by barge. The Whisperwood forest is nearby. Rival school: Thornwick Academy. Currency: crowns (`gold`). The tone is warm, witty and slightly melancholy, like a cosy fantasy novel. Humour comes from specifics, not from winking at the reader. There is no gore, and nothing explicit.

**Calendar** (`month` 1–12; 4 years = 47 turns, ending in Goldenhaze of year 4; each month is one day):

| # | Month | Phase | Fixed beats |
|---|---|---|---|
| 1 | Harvestmoon | term 1 | enrolment (pick two courses), Harvest Feast |
| 2 | Emberwane | term 1 | Club Fair, Lantern Night (takes the evening visit) |
| 3 | Mistveil | term 1 | — (the Job Board is a place: visit it to change jobs) |
| 4 | Frostcall | term 1 | term end: course exams → GPA, obligations checked |
| 5 | Deepwinter | winter break | break plan (castle, home, work, internship), Midwinter Ball |
| 6 | Thawmoon | winter break | — |
| 7 | Stormbloom | term 2 | enrolment; internship applications (years 2–3) |
| 8 | Greenrise | term 2 | Spring Tournament |
| 9 | Blossomtide | term 2 | internship offers; year-3 Hollow Star finale (v0.2 gate, moves to year 4 in phase 3) |
| 10 | Highsun | term 2 | term end; thesis topic (year 3), thesis defence (year 4) |
| 11 | Goldenhaze | summer break | break plan; the run ends here in year 4 |
| 12 | Starfall | summer break | Starfall festival |

**Player.** Top bars: `health`, `mood`, `mana`, `renown`, `alignment`; `gold` (Crowns) and `grades` (Standing, legacy) are in the You panel, with the GPA, tracks and spells. Six skills: `arcana lore alchemy charm vigor guile`. Origins (`origin_*` states) are picked at the start.

**Cast.**

| id | Who | Romance | Hooks |
|---|---|---|---|
| lyra | Lyra Vaneshade, noble pyromancy prodigy; proud, lonely | yes | rivalry → respect; her mother's pressure |
| tobias | Tobias Fennick, farm boy on a scholarship; gentle, talks to plants | yes | homesick; family harvest; Gerald the mandrake |
| seraphine | Seraphine Hale, seer; dreamy, half in other times | yes | prophecies; drawn to the lake |
| corvin | Corvin Ashby, charming thief; in debt, on last warning | yes | Midnight Cartographers; may ask you to run away |
| mira | Mira Ten (they/them), chaotic artificer | yes | inventions; the clockwork owl; family pressure |
| kael | Kael Dumont, transfer from the frozen North; cold hands | yes | **main mystery**: his family serve the Hollow Star |
| nessa | Nessa Quill, editor of the Lumen Ledger | yes | scoops, gossip columns, press freedom |
| bram | Bram Hollis, bullying prefect | no | demerits, sabotage; a possible redemption arc |
| thorne | Professor Aldric Thorne, Arcana; severe mentor | no | office hours; recommendation letter |
| maud | Old Maud, groundskeeper and hedge-witch | no | remedies, secret garden, knew the last Hollow night |
| isolde | Headmistress Isolde Marrow | no | knows everything; recruits you as a Warden |
| ilse | Ilse Dumont, Kael's younger sister, raised by the Hollow cult | no | appears from year 2 once you know of her; can be saved from the man in grey |

Faculty (`thorne maud isolde`) carry `tags: faculty`. Exclude them from peer events with `not tagged(npc, faculty)`.

Minor named figures you may reuse: Professor Marisol (Tidecalling), Professor Vey (Illusion), Professor Brask (Beastcraft), Sister Amaranth (infirmary), Grisk (goblin moneylender), the man in grey (Hollow cult), Pim (your first-year mentee), Footnote (library cat), Bartholomew (Maud's goat), Edmund (Maud's lost friend), the Duchess of Ambry (escaped portrait), the Oracle of Vell (Seraphine's mother), Prudence Ashworth (ghost), Pell & Daughters (apothecary), the Gilded Newt (tavern), Mabel's tea shop, Grimsby's Books.

**The Hollow Star (main chain).** A light-eating star sleeps beneath the lake, sealed by the founders (seven towers, seven locks, a star-shaped key). Clue events set flags and add `hollow +1`. At `hollow >= 3` the headmistress gets involved; in year 3, month 9, the lake freezes (`hs_the_night`), and `hs_beneath` decides between `hollow_sealed`, `hollow_bargain`, ending claimed, or fleeing. New clue events should `hollow +1` and be gated with sensible `when`s.

---

## Balance guidelines

**New content uses size tiers and presets** (`content/core/balance.grim`, `docs/authoring/presets.md`), `class:`/`tone:`, and `challenge` instead of `check`; raw numbers below still apply to legacy content until phase 3.

| Change | Small | Typical | Big (rare, earned) |
|---|---|---|---|
| health / mood | ±2–4 | ±5–8 | ±10–20 |
| gold | ±5 | ±10–25 | ±30–60 |
| grades (Standing) | ±1–3 | ±4–6 | ±10–16 (exams) |
| renown | ±1–2 | ±3–5 | ±8–15 |
| skill | +1 | +2 | +3–4 |
| rel | ±2–4 | ±5–8 | ±10–20 (milestones, betrayals) |
| love | +2–4 | +5–8 | +12–15 (confessions) |

- **Skill check DCs:** 10 is easy early on, 15 moderate, 20 hard, 25+ heroic. Starting skills are about 6–15 and reach 30–60 by graduation. Scale with year when it matters: `12 + year * 8`.
- **Monthly baseline:** every month draws at least one random card (`min_random_per_month: 1`) even when calendar cards fill the slots; rent −10 gold, term stress −1 mood (−4 in exam months), coursework −1 Standing every other month. Jobs pay 10–18 a month.
- **Every option should cost or risk something.** A choice between two good things or two bad things beats an obvious one. The best cards trade one resource for another.
- **Weights:** default 10. Gated class, club and job events use 14–16. Milestone events (friendship, confession) use 18–30 so they show up soon after unlocking. Very niche events use 6–8.
- After adding content, run `sim 300` and `sim 300 --policy social`. No single graduation ending should exceed about 35% under random play, and your new events should not appear in "never seen" unless they are deliberately rare. If one is, loosen its `when` or raise its `weight`.

## Conventions

- **Event ids** are prefixed by area: `pyro_`, `tide_`, `duel_`, `lib_`, `lyra_`, `soc_`, `life_`, `hs_` (Hollow Star), `fox_`. Use `<chain>_<step>` for chains.
- **Flags** are past-tense facts (`kael_told`, `fox_met`). Custom counters are nouns (`hollow`, `debt_paid`).
- **Every event** has `title`, `text`, `art`, `tags`, `scene`. Option labels stay under about 36 characters, imperative or first-person ("Open the book", "I'll be there.").
- **Every option** has at least one effect, and almost always a `say:` so the player sees a consequence.
- **Never soft-lock:** menus need at least one option without `when`, and cards must not lock both sides.
- **Don't edit** `build/content.bundle.js` by hand, and don't rename existing ids (saves and flags reference them).

---

## Localization

English in `content/**/*.grim` is the source of truth. Each language has a folder `locales/<lang>/` mirroring `content/` (`events/life.lang` translates `events/life.grim`), plus `ui.lang` for interface strings and `GLOSSARY.md` for names and terms.

- **Never translate inside `.grim` files.** Write the English, then run `node tools/grim.js i18n zh-CN`. It rewrites every `.lang` file: new strings appear as empty `key [hash] = ` lines under a `# en:` comment, removed strings move to `_obsolete.lang`, and lines whose English changed are marked `# STALE`.
- **Translate** by filling the text after `=`. For bulk work, drop files into `locales/<lang>/_in/` containing just `@event id` headers and `key = text` lines; the next `i18n` run merges them into the canonical files (an empty line never overwrites a translation) and deletes the inbox file.
- **Keep tokens:** `{npc}`, `{player}`, `{lyra}`, `{=expr}` must survive (lint errors otherwise). Pronoun tokens are filled from `ui.lang` `pronoun.*` keys; in Chinese, `{s}` and `{are}` are simply dropped.
- **Follow `locales/zh-CN/GLOSSARY.md`** for names, places, resources and tone; add new proper nouns there.
- `node tools/grim.js i18n` prints coverage; `lint` warns about untranslated or stale strings and token mismatches; `sim --lang zh-CN` plays with the translation applied.
- New UI strings go in `UI_EN` in `src/i18n.js` and are used via `t('key')` in `ui.js`.
