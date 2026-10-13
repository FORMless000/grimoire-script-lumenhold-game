# AGENTS.md — working on Lumenhold Academy

Lumenhold Academy is a card-swipe life sim set at a magical academy. It runs in the browser: open `index.html` directly (no install), or run `npm start` for the local server, which adds server saves, run logs and an admin page. The v0.3 redesign is planned in `docs/design-v0.3.md`. Content lives in a custom scripting language, Grimoire Script (`.grim`), which agents can extend without touching the engine.

**Adding events, characters, states or chains?** Follow `skills/write-academy-events/SKILL.md` (built from `docs/authoring/`; batches are reviewed with `skills/critic/SKILL.md`) and use `docs/grimoire-script.md` as the language reference. Canon lives in the worldbook, `content/world/`: get a brief (`node tools/grim.js brief …`) before writing, and extend the worldbook with `skills/distill-lore/SKILL.md`. Every change must pass `node tools/grim.js check` (quick) and, before you finish a larger change, `npm run verify`. Content is written in English; translations live in `locales/` (see **Localization** below).

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
tools/schema-manifest.js   the frozen format (test/golden/schema-v1.json); tools/report.js, dupes.js: gap report, duplicates
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

**The format is frozen at schema v1** (`@game schema: 1`, `test/golden/schema-v1.json`). Language features may be added but never removed or changed in meaning. After adding one, run `node tools/grim.js schema --update` to record it (`test/schema.test.js` fails on removals). Only the constructs marked `legacy` in the manifest may go, in phase 3.

### Event files

| File | Contents | Triggers |
|---|---|---|
| `calendar_2b.grim` | The four-year loop's fixed beats: enrolment (`offers: courses`, `pick: 2`), Club Fair, Job Board, break plans, track notices, internship, thesis, Lantern Night, year four | auto, place, queued |
| `slice_2a.grim` | Phase 2a vertical slice: tiers, presets, challenges, spells, variation | mixed |
| `slice_2b.grim` | Phase 2b vertical slice: Evocation I–III, Duelling Circle, Library Assistant, campus places, break plans, the internship stub, thesis, the_bell arc | place, track, plan, arc |
| `calendar.grim` | v0.2 fixed beats: intro, origin, festivals, graduation (its menus and exams are retired by migration 0001) | mostly `auto` |
| `classes.grim` | v0.2 elective events, now `track: <course>` (pyromancy/tidecalling → evocation, …) | track |
| `clubs.grim` | Club events, `track: <club>`; dropped clubs moved to their places (choir → great hall, …) | track, place |
| `jobs.grim` | Job events, `track: <job>`; stables and tutor moved to their places | track, place |
| `people_students.grim` | Per-character arcs for Lyra, Tobias, Seraphine, Corvin, Mira, Nessa | intros `random`, rest `social` |
| `people_others.grim` | Kael (outside the main chain), Bram, Thorne, Maud, Isolde | same |
| `social.grim` | Generic relationship events (`cast: npc: any …` + `per: npc`): friendship, romance, rivalry, decay | `social` |
| `chain_hollowstar.grim` | The main mystery and its finale | mixed |
| `chains_minor.grim` | Forbidden section, curse cure, Grisk's debt, Ember the fox, the ghost | mixed |
| `life.grim` | Everyday academy life, money, seasons | random |
| `crisis.grim` | What happens when a resource hits zero | queued |
| `pools/*.grim` | Phase 3 baseline pools: places, course levels, clubs and jobs, break plans, thesis, internships | place, track, plan |
| `expansion_y3.grim` | Final year: Career Fair menu → interview → offer (`career_*` flags feed the teacher / wanderer endings), thesis, portrait, farewells | auto + random |
| `expansion_summer.grim` | `sum_*` summer-recess events; castle and home ones are `plan:` pools | plan, random |
| `expansion_faculty.grim` | Short arcs for Thorne, Maud and the headmistress | social |
| `expansion_people.grim` | More per-character events for the student cast | social |
| `expansion_social.grim` | More generic relationship events (`per: npc`) | social |
| `expansion_life.grim` | More everyday life, incl. the `timeloop` chain | random |
| `expansion_classes.grim` | One more event per elective (`track:`), plus compulsory broom flight | track, random |
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
node tools/grim.js schema     # check the frozen format v1 (--update records additions)
node tools/grim.js report --gaps        # pools per place / course level / club & job / plan vs floors and depth targets
node tools/grim.js dupes [FILE…]        # near-duplicate events (shingled Jaccard ≥ 0.6)
node tools/grim.js batch NAME --files a.grim,b.grim   # validate an authoring batch → build/batches/NAME.json (/admin: Batches)
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

## Canon: read the worldbook, not this file

This file carries no world lore. The worldbook in `content/world/` is the only source of canon, and it is kept current:
- `cast.grim`: the characters, with age, role, voice, traits, stats, schedules and relations; `facts/<npc>.grim`.
- `places.grim`, `tracks.grim`, `spells.grim`, `arcs.grim`, `factions.grim`, `timeline.grim`.
- `lore/{hard,soft}/`: setting, people and the main mystery.

Calendar, resources and skills are defined in `content/core/rules.grim`. Tone and safety rules are in `docs/authoring/style.md`.

**Before writing anything, read the canon you touch:**
- `node tools/grim.js brief --cast … --place … --track … --arc … --topic "…"` gives a focused context pack.
- `node tools/grim.js lorebook` writes everything to `build/lorebook.json`.
- `node tools/grim.js query lore 'has("…")'` and `query fact 'npc == "…"'` look up single entries.

Don't copy lore into prompts, skills or docs: point to the worldbook. To extend canon, use `skills/distill-lore/SKILL.md`; a new proper noun needs a soft `@lore` entry, or canon lint rejects it.

Two rules that no lookup will tell you:
- **Plot safety:** only hard-canon story events may grant key clues (`find`) or move arc clocks (`advance`). Everyday and pool events may be eerie but never reveal or confirm the main mystery's secrets.
- **Adults only, nothing explicit, no gore.** Every character is an adult (lint checks ages).

---

## Balance guidelines

**All content uses size tiers and presets** (`content/core/balance.grim`, `docs/authoring/presets.md`), `class:`/`tone:`, and `challenge` instead of `check`. Never write raw numbers in event options. The tier rows in `@balance sizes` are the single place to retune amounts; skills use the `xp` row except where a skill has its own row (`lore`).

- **Read the economy before tuning:** `node tools/economy.js --games 30` splits every resource, skill, rel and spark into its sources and sinks (month hooks by label, cards by kind) per play style, with p10/p50/p90 finals and the ending mix.
- **Challenges** are relative to `E(turn)`, the expected skill of a balanced player (`@balance curve`). After a change to skill growth, refit it with `node tools/grim.js curve --write`.
- **Monthly baseline** (`content/core/rules.grim`): board −8 crowns a term month, tuition per term, term pressure, loneliness without a friend, rest below 60 health, coursework (an enrolled course trains its main skill). Jobs pay per visit (`@track pay:`).
- **Relationships:** gates are on the scale of the `rel` row (a best friend reaches 60–100 over four years; most arcs open at rel 10–25).
- **Every option should cost or risk something**, except a small safe choice (≤ 0.5 medium-equivalents) beside a risky one. The best cards trade one resource for another.
- **Weights:** default 10. Milestones 18–30, so they show up soon after unlocking. Niche events 6–8.
- After adding content, run `sim 300`, `sim 300 --policy social` and `balance --quick`. No single ending should exceed about 35% per style (known exception: the hollow endings for plot-completing styles until endings get slots in phase 4), and your events should not be "never seen" unless deliberately rare.

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
