# Lumenhold v0.3: design and implementation plan (rev. 4)

> **Status.** Part I (§1–§14) is the **committed** design for **Phases 0–4**, detailed enough to implement.
> Part II (§T1–§T3) is **TENTATIVE**: minigames, crafting and live generation. These are directions only, **not to be implemented** until they're reviewed after the Phase 4 playtests. The only part of them built earlier is the small set of *hooks* in the event format (§12), so content written now never needs rewriting.
>
> Numbers marked *(tunable)* are starting values. Balance is settled by human play and telemetry, not by the simulator (§8.8).
>
> **Naming note (rev. 4a).** Parts of Phase 0 already existed in v0.2 under other names. This note uses those names: `grim query` (not `grim find`), the run record and its `hist` entries (not `runs` / `cards` / `feedback` tables), file storage under `data/` (not SQLite), `tools/rewrite.js`, and the existing feedback bar. Items marked **(exists)** are already built.

---

## Part I: Committed design (Phases 0–4)

## 0. Summary

### 0.1 What changes

The game goes from *a monthly deck of random cards* to *a day in the life, with agency*:

- A **4-year university** that follows real seasons: two 4-month terms and two 2-month breaks a year. Every character is an adult.
- Each month is **one representative day**, split into slots (morning, noon, afternoon, evening, night, sometimes midnight). That's about 3× today's cards in term time, and a lighter day in breaks.
- The player picks **two places to visit** each day on a **graphical map**. Places are found through events and relationships.
- **Clubs and jobs are highlighted places with obligations.** Skipping is allowed and has consequences.
- **Courses, clubs, jobs, internships and the thesis are one progression system** ("tracks"), fewer in number and deeper.
- **Fast top bars** (Health, Mood, Mana, Renown, Alignment), always previewed before a choice.
- **Card selection becomes a real system** (the director): novelty, relevance, variety, quotas, scheduled pushes, and radiant casting with multiple roles.
- **A worldbook** (the world as data) grounds all content production.
- **The event format (schema v1) freezes after Phase 2.** All existing events are rewritten once. Content production then runs continuously.
- **A self-hosted server** joins the standalone `index.html`, so saves, telemetry and an admin page live in one place.

### 0.2 How content gets made

Humans don't write events. There are three paths:
1. **Batch authoring by Claude Code** through the skills and `AGENTS.md`. Committed; starts in Phase 3.
2. **Feedback tuning by Claude Code** from telemetry reports. Committed; starts in Phase 3.
3. **Live generation during play.** Tentative (§T3).

All three share one authoring spec, one worldbook and one set of validators. The human role is curating the worldbook, playtesting and reading dashboards, and deleting content that doesn't belong.

### 0.3 Phase overview

| Phase | Name | Status |
|---|---|---|
| 0 | Platform and safety net | committed · done |
| 1 | Worldbook and authoring spec | committed · done (soft lore awaits curation) |
| 2a | Groundwork: numbers and options | committed · done |
| 2b | Groundwork: the world loop, then **freeze schema v1** | committed · done (playtest #1 skipped by decision) |
| 3 | One-pass migration, balance, then **content production opens** | committed · in progress: playtest #2 next (see `PROGRESS.md`) |
| 4 | Narrative systems | committed · in progress (2026-10-27, `docs/phase4-plan.md`): the Journal, facts in the People panel, inter-NPC cards, renown spotlights; yearbook endings and alignment reactions were pulled into phase 3 |
| 5 | Minigames | tentative (§T1) |
| 6 | Inventory and crafting | tentative (§T2) |
| 7 | Live generation | tentative (§T3) |

---

## 1. Platform: self-hosted server (Phase 0)

### 1.1 Shape

- `npm start` runs a Node server: Node 24, built-in `http` and `zlib`, a small router, no framework and no runtime dependencies. Project npm scripts select Node 24 automatically.
- It binds to `127.0.0.1:4173` by default; `HOST` and `PORT` override that.
- If it binds to anything other than localhost, or `PUBLIC=1` is set (behind a reverse proxy), `/admin` and the reports need `ADMIN_TOKEN`.
- `NODE_ENV=production` serves the committed content bundle; otherwise the bundle is compiled live from `content/` and `locales/`.
- Online hosting is push-to-deploy to one Linux server (git, systemd and a reverse proxy); see `docs/hosting.md`.

```
server/
  index.js          # boot, static files, gzip, live or committed content bundle, --selftest
  routes.js         # the API (§1.2)
  auth.js           # player codes, admin token, rate limits
  store.js          # file storage: atomic JSON writes, append-only NDJSON
deploy/             # push-to-deploy: setup, git hooks, systemd unit
data/               # gitignored
  runs/<runId>.ndjson         # one run: meta line + hist entries (re-appended when feedback changes)
  players/<pid>/              # player.json, saves/<slot>.json (auto, 1, 2, 3), seen.json
```

Storage is plain files rather than SQLite, so the game server keeps zero runtime dependencies on Node 24. Optional authoring tools have separate dependency installations. Reports read the files; if volume ever makes that slow, `store.js` is the one place to swap in SQLite.

**Players.**
- **The code.** A player is a **player code**: 80 random bits, shown as `XXXX-XXXX-XXXX-XXXX`, minted by the server on a browser's first visit. The server keeps only its hash (the player id, `pid`).
- **Sync.** The code is also the sync code: opening `/?sync=<code>`, or entering the code under Saved games, on another device shares that player's saves. There are no accounts.
- **Invite.** With `INVITE_CODE` set, minting needs `/?invite=<code>`; without it, anyone may mint, limited per address.
- **Revoking.** An admin can revoke a code.
- **Moving between devices.** An autosave written by another device continues as a new run (`Engine.forkRun`, as loading a slot does), so one run's log never mixes two devices.

### 1.2 Routes

| Route | Method | Who | Purpose |
|---|---|---|---|
| `/` | GET | public | game client (`index.html`, `src/`, `build/`) |
| `/api/health` | GET | public | lets the client detect the server; says whether an invite is needed |
| `/api/content?lang=` | GET | public | content sources (chunking is tentative, §T3) |
| `/api/player` | POST / GET | public / player | mint a player code / check one |
| `/api/saves` / `/api/saves/:slot` | GET / PUT / DELETE | player | 3 manual slots + autosave |
| `/api/log` | POST | player | batched run-history entries (§1.4), including feedback, the end-of-run survey and client errors |
| `/api/seen` | GET / POST | player | cross-run "seen" counters for the director (§5.2) |
| `/admin`, `/api/runs`, `/api/report`, `/api/players`, `/api/export`, `/api/batches` | GET (POST to revoke) | admin | runs, feedback by event and in time order, players, an export for `grim feedback`, authoring batches |

**Client.** The client detects the server. Without one (static build, or no player code), it falls back to localStorage saves and local "seen" counters; telemetry waits in the local archive (§1.4). `grim build --static` still produces a standalone `index.html` for demos.

### 1.3 Records (exists)

The engine already records every run completely (`s.hist`), and `Engine.exportRun()` produces the **run record** (format `lumenhold-run`). The server stores exactly that; there are no separate tables.

| Design concept | Where it lives |
|---|---|
| run | run record: `runId`, `startedAt`, `updatedAt`, `seed`, `contentHash` (content version), `lang`, `sim` (absent for human runs, else the play style), `ended {id, turn}`, `turn`, `feedback` (count) |
| card | `hist` entry `t:'card'`: `n` (seq), `turn`, `id` (event), `actor` (cast), `src`, `type`, `title`, `text`, `options` (keys, labels, checks), `choice`, `label`, `out` (outcome), `vals` (state after), `at`, `chosenAt` (`ms_to_decide = chosenAt − at`). `slot`, `place`, `class` and full `cast` are added when those systems land (2a/2b). |
| month, ending | `hist` entries `t:'month'` (start-of-month effects) and `t:'end'` |
| feedback | `fb {rating: up/down, comment, at}` on the card or ending entry it refers to. "Felt wrong" is a 👎 with a comment. The end-of-run survey is a `t:'survey'` entry. |
| run owner | `player` on the run's meta: the player id, set by the server; a run only accepts entries from its owner |
| client error | `hist` entry `t:'error'` (`msg`, `src`, `at`), sent with the run's next batch |
| save | `data/players/<pid>/saves/<slot>.json`: `{updatedAt, device, data}`, where `data` is the engine save (`version`, full state) |
| seen | `data/players/<pid>/seen.json`: `{event_id: {runs_seen, last_run, last_at}}` |
| player | `data/players/<pid>/player.json`: `{createdAt, lastSeenAt, revoked}` |

### 1.4 Telemetry

- The client sends the `hist` entries added (or whose feedback changed) since the last acknowledged batch, at each month screen and on page hide.
- **Outbox.** Every finished, replaced or retired run is kept in the browser's archive, flagged as not yet synced. The client uploads unsynced runs whenever the server is reachable; re-sending is harmless because the reader keeps the last copy of each entry. So runs played offline, or whose last batch was lost, still arrive.
- Client errors (`window.onerror`, unhandled rejections) are sent as `t:'error'` entries, at most 20 a visit.
- Rating (👍 / 👎) and comments on the current or previous card already exist: the feedback bar, the F dialog and the Journal (**exists**).
- The simulator logs runs in the same format with `grim sim --log DIR`, tagging them `sim: <policy>` (**exists**).
- All data stays on the project's own server. There's no external analytics.

---

## 2. Tooling and safety net (Phase 0)

| Tool | Behaviour |
|---|---|
| `grim fmt` (**exists**) | Lossless canonical formatter; refuses any change in meaning. `--check` for CI. |
| **Line rewriter** (`tools/rewrite.js`) | Uses the parser's recorded file and line positions. Applies edits bottom-up per file, re-parses to verify, and refuses to run if a file changed since it was read. Comments and formatting survive. |
| `grim query NODE [WHERE]` (**exists**) | Finds blocks, options and statements; `WHERE` is a Grimoire expression over the row's fields, e.g. `query check 'skill == "lore"'`, `query delta 'name == "gold" and amount > 20'`, `query event 'actor == "any"'`, `query say --grep crowns`. Prints `file:line block/option source`; `--json` gives a worklist, `--group FIELD` counts. |
| `grim rename <kind> <old> <new>` | Kinds: event, state, npc, flag, var, place, track, spell, fact, arc. Updates `.grim` references, `.lang` block headers and keys (including `@npc` overrides). |
| `grim migrate [--dry-run]` | Runs `tools/migrations/NNNN-name.js` in order and records them in `content/.migrations.json`. A migration exports `{ id, description, run(ctx) }`, where `ctx` offers `query`, `edit`, `insertAfter`, `remove` and `report`. Safe to run twice. |
| **Simulator play styles** | existing `random`, `cautious`, `social`, plus `balanced`, `focused:<skill>`, `aggressive`, `moneymaxx`, `caster`, `social:<npc>`, `truant`, `lumen`, `hollow`, `plot`. A play style is a scoring function over the option previews. **Strategy styles** (2026-10-17) add a goal on top of a scorer (the cards they always answer one way, where they go, their origin), each exercising one system: `scholar` (the scholarship and exams), `nightlife` (the midnight economy: company, table, ring), `sleuth` (leads and the plot, routed to the places where story waits), `romantic` (spark, confession, partner), `homebody` (bedtime and home breaks), `explorer` (coverage). `grim styles` prints what each one plays for; `grim balance` runs them with an alarm each. |
| `grim balance` | Runs each play style (100 games by default). **Invariants fail the run; alarms warn** (§8.8). Writes `build/balance-report.json`. |
| `grim analyze` (`tools/analyze.js`) | Describes how runs unfold, per play style, in worker threads: every resource and skill by month (p10–p90; mean skill against E(turn)), survival and early endings, cards a month by source, run time, milestones, check calibration, flows, by origin. Findings are rules over these; `--baseline` reports changes that are both large and significant (Mann–Whitney, two-proportion; p < 0.001), so seed noise stays out. Writes `build/analysis/NAME.{json,md,html}`. |
| `grim snapshot` / `grim diff` | Simulates on fixed "golden" seeds and saves coverage, endings and average resources. `diff` compares two snapshots; a pure refactor must show none. |
| **Save versioning** | `@game schema:` plus the save version. The save is at version 2 and migrates v1 (**exists**). From version 3 on, saves from an older version are refused with a friendly message (saves may break until 1.0). |
| `grim feedback` (**exists**) | Aggregates exported or server-stored run logs per event (👍 / 👎 / comments); the seed of `grim report` (§11.2). |
| `npm run verify` | the quick gate: build, lint, format, docs, the unit tests (slow whole-game style tests skipped) and the golden diff, in about a minute (`tools/verify.js`) |
| `npm run verify:full` | everything: plus the slow style tests, balance invariants and the e2e against the server |

---

## 3. Worldbook and authoring spec (Phase 1)

### 3.1 Layout

```
content/world/
  vocabulary.grim   # controlled tag vocabularies (traits, interests, roles, tones, memory kinds)
  places.grim       # @place
  tracks.grim       # @track (courses, clubs, jobs, internships, thesis)
  spells.grim       # @spell
  cast.grim         # @npc (moved from content/npcs/)
  facts/*.grim      # @fact, one file per character
  archetypes.grim   # @archetype
  factions.grim     # @faction
  arcs.grim         # @arc (§10.6)
  lore/hard/*.grim  # @lore, curated canon
  lore/soft/*.grim  # @lore, proposed by content batches; promotable to hard
  timeline.grim     # @timeline (history + the in-run calendar of fixed beats)
docs/authoring/     # the authoring spec (§3.5)
```

### 3.2 Blocks

**`@npc`** (extended). `age` is required, and the engine refuses romance if any party is under 18. Traits and interests come from `vocabulary.grim`. `wealth` is on a 1–5 scale.

```
@npc lyra
name: Lyra Vaneshade
short: Lyra
age: 19
pronouns: she/her
house: Emberhall
role: student
year: 1
romance: true
traits: proud ambitious lonely
interests: duelling fire
stats: arcana 34 lore 22 alchemy 8 charm 26 vigor 30 guile 12 wealth 5
schedule: duel_hall@afternoon,evening refectory@noon library@night
relations: kael:-20 tobias:5
voice: clipped, formal, sarcastic when hurt; never says "please" first
desc: Brilliant, impatient and used to winning.
```

**`@fact`.**
- Tiers: surface (known on meeting), personal, secret.
- `unlock` is a condition checked monthly. `learn lyra.mother` reveals a fact at once.
- Fact text is shown in the People panel, so it's translatable.

```
@fact lyra.mother
npc: lyra
tier: personal
unlock: rel(lyra) >= 30
text: Her mother has never once told her "well done".
```

**`@place`**, `@track`, `@spell`: see §6, §7 and §9.

**`@archetype`** (used in Phase 4):

```
@archetype student
names: pool students
age: 18..22
traits: pick 2
pronouns: any
house: any
```

**`@faction`**: name, desc, members, alignment lean, stance toward the player.

**`@lore`.**
- `keys` drive retrieval. Lore is context for content production and isn't shown in the game, so it isn't translated.
- `canon: hard` is curated; `canon: soft` is proposed by a batch.

```
@lore founders_seal
keys: founders, seal, seven locks, lake, star key
canon: hard
text: The founders bound something beneath the lake with seven locks, one per tower…
```

**`@timeline`**: dated canon history, and the in-run calendar of fixed beats (§4.4).

### 3.3 Canon lint

- Extracts proper nouns (capitalised runs that don't start a sentence, plus known patterns) from every text field.
- Compares them against the names of NPCs, places, tracks, spells, factions and archetype pools, lore `keys`, the glossary, and an allowlist.
- **Hand-curated content:** a warning. **Content from batches and generation:** an error, unless the batch adds a `lore/soft` entry introducing the name.

### 3.4 Lorebook export and briefs

- `grim lorebook --out build/lorebook.json` exports every entry as `{id, kind, keys, text, canon, refs}`.
- `grim brief --cast lyra,kael --place library --track evocation --arc hollowstar --topic "…"` prints a markdown **context pack**:
  - the relevant NPCs, with facts up to the requested tier;
  - the place;
  - the track and its level;
  - the arc's current act and clue list;
  - matching lore entries (keyword retrieval);
  - 3 similar existing events as style examples;
  - the presets and class rules.

  It's capped at about 6k tokens by default.

Experimental authoring retrieval and controlled evaluation are documented in
[`rag/README.md`](../rag/README.md) and
[`rag/EVALUATION.md`](../rag/EVALUATION.md).

### 3.5 Authoring spec (`docs/authoring/`)

| File | Contents |
|---|---|
| `README.md` | how to make content; the three paths |
| `style.md` | tone, voice per class, banned clichés, length limits, label rules |
| `schema.md` | every construct in schema v1 with examples (partly generated from `SCHEMA`) |
| `presets.md`, `classes.md` | when to use each preset, size tier and event class |
| `checklist.md` | the acceptance checklist validators and critics apply |
| `examples/*.grim` | annotated exemplar events, one per class and source |

The Claude Code skills are rebuilt from these files:
- `write-academy-events`: batch authoring.
- `distill-lore`: Phase 1 seeding.
- `tune-events`: Phase 3 onward.

The tentative live harness will build its prompts from the same files, so the paths can't drift.

### 3.6 Seeding by distillation (a Phase 1 task for Claude Code)

1. Per NPC: read every event involving them → draft `@fact`s (5–8 per main character), a `schedule`, `voice`, `stats`, `relations`.
2. Per place mentioned in events: draft a `@place` with region, map position and opening hours.
3. Draft `@lore` from the Hollow Star chain and recurring world details (60+ entries), and the `@timeline`.
4. Run canon lint over all existing content and add the missing names to the worldbook or allowlist.
5. **Human curation:** review the diff in git and promote soft lore to hard.

---

## 4. Time (Phase 2b)

### 4.1 Calendar and seasons

| # | Month | Real-world | Season | Status | Fixed beats |
|---|---|---|---|---|---|
| 1 | Harvestmoon | Sep | autumn | **term** | year start, enrolment, Harvest Feast; *year 4: thesis setup* (before enrolment) |
| 2 | Emberwane | Oct | autumn | term | Club Fair; Lantern Night (festival) |
| 3 | Mistveil | Nov | autumn | term | — |
| 4 | Frostcall | Dec | winter | term | **finals**; Midwinter Ball (festival, at term end) |
| 5 | Deepwinter | Jan | winter | **break** | break plan chosen |
| 6 | Thawmoon | Feb | winter | break | — |
| 7 | Stormbloom | Mar | spring | **term** | enrolment; internship applications open |
| 8 | Greenrise | Apr | spring | term | Spring Tournament (festival) |
| 9 | Blossomtide | May | spring | term | internship offers; *year 4: the Night* (plot finale) |
| 10 | Highsun | Jun | summer | term | **finals**; *year 4: thesis defence* |
| 11 | Goldenhaze | Jul | summer | **break** | break plan; *year 4: the wrap-up begins (no plan, free board, no duties)* |
| 12 | Starfall | Aug | summer | break | Starfall festival (the meteor showers); *year 4: graduation, the endings resolved, end of run* |

- **4 years.** The run ends in Starfall of year 4: **48 months**.
- **The wrap-up** (playtest 2): year 4's last break is not a vacation. There is no break plan; the player stays on campus with free board and no obligations. Goldenhaze is a free campus month; with no job offer by then it brings the last call (§7.7). Starfall, the last month, resolves the endings: no map and no ordinary cards, only the graduation and one resolution card per ending (X10 fills these), whose choices decide how each ending resolves (feedback 2026-10-25):
  - **Every line of the yearbook is told on a card that day**, in the ending's own terms: the career you sign (§7.7), the lake's outcome, each partner (stay together, or part at the gate), the friends who stayed (keep in touch, or say goodbye), the Dumonts' photograph, the corner for Tamsin, and which personal lines the yearbook keeps (up to two of those you qualify for). Academic standing is told by the final lists and isn't a choice.
  - **The replay guarantee:** replaying month 48 from one save reaches every ending the run has earned by choosing differently; `grim finale` checks it (and a slow test, on simulated runs).
- **The origin** is picked in the Sorting Mirror itself (§3; feedback 2026-10-20, until then on its own screen before the game): a new game opens on a prologue, the sky-barge's arrival and then the mirror, a menu whose answers name the crowns each origin gives, and month 1 begins once it's picked, so its charges and summary follow the pick and see the origin. Tools and tests still pass the origin to `newGame`, and then the mirror only reflects it.
- The names `final_year`, `wrapup`, `term`, `break` and `season` are available in conditions and text.

### 4.2 Day recipes

**Term day:**

| Slot | Source | Cards |
|---|---|---|
| morning | `courses` | 1 per enrolled course (2; 1 plus the thesis in year 4) |
| noon | `social` | 1–2 |
| afternoon | `visit` (map pick 1) | 1–2 |
| evening | `visit` (map pick 2) | 1–2 |
| night | `world` | 1–2 |
| midnight | `special` | 0–1, only events with `slot: midnight` |

**Break day:** morning = `plan` (break-plan pool), two visits (afternoon and evening; the evening one added after playtest 2), night = `world`. About 6–7 cards.

**Played in order** (playtest 2, M1): the day runs slot by slot, and each visit is picked on the map when its slot comes, so the morning's cards can change where the afternoon goes. Most places are open for both visits (M2). Social and world cards are not tied to noon and night: `spread: social world` keeps their count but deals them across the day's slots, and an event whose text names a time (`time: evening`) is drawn three times as often then and a third as often elsewhere (M43). A slot shows its time of day and the season behind the game (`src/sky.js`, feedback 2026-10-15b): a tint strong at the top and gone by mid-screen, so the bottom half keeps the page's colour; a sun or moon placed by the hour, clouds, and a skyline whose trees follow the season; and particles: dust, glints, fireflies, stars and shooting stars, or wisps by the hour, and leaves, snow, petals or pollen by the season. Motion stops for reduced-motion settings.

Declared in `@game`:

```
@game
schema: 1
calendar: term=1-4 break=5-6 term=7-10 break=11-12
seasons: autumn=1-3 winter=4-6 spring=7-9 summer=10-12
day_term: morning=courses noon=social:1-2 afternoon=visit evening=visit night=world:1-2 midnight=special:0-1
day_break: morning=plan afternoon=visit evening=visit night=world:1
spread: social world
```

**Run length:** 32 term months × ~11 cards + 15 break months × ~5 ≈ **425 decisions** *(checked at playtest #1)*.

**The midnight turn** (playtest 2, M41; content X13): after an unsigned note in year 1 Stormbloom, a night card opens the midnight slot each on-campus month, after the night's cards (term, or a break at the castle or working on campus; not at home, on an internship, while locked out, or on the last day). "Sleep" is the night's rest (below, bedtime); "Go out" costs nothing at the door, rests nothing, and opens the midnight pick (`visit midnight`) among the places open then: the Gilded Newt, the boathouse, the refectory kitchens, the restricted section, the observatory and the gargoyle passage, and since world expansion 1 the Whisperwood (its deep part, the Hush, keeps only midnight hours). A place is offered only if something there can play that night. Suspicion (I4): going out in term queues the suspicion card at 33% (`queue night_suspicion chance 33`), and a risky outcome queues it at its own odds (about 50%, by event); the cards never say whether you were seen, and two copies bring at most one card the next morning (about 66% for a risky night). Caught in a term's last month and off home or to an internship, the card waits until you're back on campus (`defer: off_campus`, I6). If you weren't watched, you are now; if you were, a three-month lockout and detention, with gold and mood losses, and `watched` is cleared. Day events that give `watched` never lock you out. At the Newt (feedback 2026-10-20) a purse won at the high table brings the next hand at once, each dearer and harder, three in all, with walking away always open; a company night can run into a second party (more pay, more Health and suspicion).

### 4.3 Break plans

Chosen at the start of each break, as a menu:

| Plan | Available | Effect |
|---|---|---|
| Stay at the castle | always | skeleton crew, secrets, cheap rent (6/month) |
| Go home | always | home map, family and old friends, free board |
| Travel | from year 2, costs crowns | travel map (port city / the North) |
| Work on campus | always | a holiday gig chosen on a pushed card (the grounds, the kitchens; X15 adds more), paid through its cards and better than a term job; board still paid; no double wage (playtest 2, M6) |
| Research internship | from year 2, by application (§7.5) | host map, project, stipend |
| Thesis retreat | year 4 winter | thesis progress |

v0.3 ships castle, home, work on campus and internships. Travel and internship maps follow as content (Phase 3/4).

### 4.4 Festivals and fixed beats

- Fixed beats live in `@timeline` as dated `auto` events.
- Festivals use `replaces: visit1 | visit2`: they appear on the map at their location in that visit, and going there draws the festival first. They no longer take the visit (playtest 2, B3): skipping a festival is a choice. A festival's place is closed in the day's earlier visits, getting ready (I5), so a visit there earlier can't use up the festival.

### 4.5 Re-pacing existing content

- `year == 3` → `final_year` (17 places).
- Hollow Star clues spread across years 1–3, finale in year 4 by Blossomtide, or earlier that spring by the player's choice (§10.6).
- Year-gated arcs (Lyra's ultimatum, the confessions, Ilse) shift by a year or gain a middle beat.
- Careers move to year 4. Year 3 gets internships and the exchange students.
- Today's summer events become break-plan pools.
- Festivals move to the months in §4.1.

---

## 5. Director (Phase 2b)

### 5.1 Sources

`courses`, `visit` (the picked place), `social`, `world`, `special`, `plan`, `pushed` (story, track and fixed beats), `ambient` (fallback).

An event belongs to a source through its fields:
- `place:` → visit
- `track:` → courses, or the track's place
- `slot:` + `class:`
- events with no specific source → social / world / ambient, by tags.

### 5.2 Selection

Each slot draws its quota from its source with **weighted sampling**, where:

```
score     = weight × novelty × relevance × variety × time_fit
novelty   = (1 − e^(−since/τ)) × 0.6^seen_this_run          τ = 6 months (tunable)
relevance = (1 + 0.5·cast_affinity) × (1 + 0.5·active_arc) × (1 + 0.3·recent_tag_overlap)
variety   = 0.5 if the same tone or primary tag as either of the previous 2 cards, else 1
time_fit  = 3 in an event's `time:` slots, 0.3 elsewhere, 1 without one; 0 outside its `slot:`
```

- `tone:` (light / warm / tense / grim / eerie) is a schema field (§12).
- Novelty is **within one run only**. Earlier runs, and other players on a shared server, don't make a card rarer. The cross-run counters (`/api/seen`, or localStorage in the static build) are still recorded for the admin statistics.

### 5.3 Pushing

| Syntax | Meaning |
|---|---|
| `queue x` | next month |
| `queue x in N` | in N months |
| `queue x now` | very next card |
| `queue x within A..B` | a window: the chance rises each month (1 / months left), forced on the last month |
| `queue x by month M` | deadline form of a window |
| `queue x … with role` | carries a cast role into the queued event |
| `unqueue x` | cancel |

- **No daily card cap** (removed after playtest 2: it held back pushed cards and would hinder future content). `max_cards_per_day` stays an optional `@game` setting; when one is set, priority classes decide the overflow: `story > track > pushed > friend > social > ambient` (`friend`: §5.5), and overflow goes to the next day.
- A pushed event re-checks its `when`, and the `where:` of any cast it was pushed with, when drawn, and skips quietly if either fails (feedback 2026-10-16).

**Appointments** (the card-wiring framework, 2026-10-25; `docs/grimoire-script.md` §9). Everything the game pushes, besides `queue`, is an `@appointment`: an occasion (the month's start, the course slot, a visit, or a notice such as term end, a failed course, low marks, renewal, promotion, a spark crossing its cooldown), its subjects (track kinds you're in, or everyone you've met), what it deals (a card, a pool, a trigger, the subject track's own cards), a `when`, a chance, and at the month's start a slot and the shared plot-card cap. `content/core/appointments.grim` declares the game's own, in the order they deal: at the month's start `forced` (auto cards), `beats` (one plot card a month, two in a beat month, §10.6) and `milestones` (ramps); `class` (the course morning); at a visit `festivals` (taking the visit, §4.4), `off_shift` and `fixed` (a place's `always:`); `letters` (off campus at night); and the notices `intro`, `start`, `exam`, `appeal`, `warning`, `review`, `promotion`, `spark_cooldown`. The older spellings (`trigger: auto`, `ramp:`, `beat:`, `replaces:`, `always:`, `@game exam:` …) are shorthands for them. A new recurring push (a market day, a tutoring hour, one character's shift) is a new appointment, with no director code. The day's slots themselves stay the `@game day_term` / `day_break` recipe (§4.2).

### 5.4 Radiant casting

```
cast:
  friend: any where rel(friend) >= 20 and tagged(friend, peer)
  rival:  any where rival != friend and rel(rival) <= -10
  host:   present(place)
  stranger: anyone where tagged(stranger, student)
```

- **`any`:** met characters (authored and spawned). **`anyone`:** includes unmet characters, for introductions. **`present(place)`:** characters whose schedule puts them at the visited place in this slot.
- **Filling:** roles fill in order, weighted by affinity (|rel| + spark + recency), with up to 50 backtracking attempts. Eligibility checks cast on a scratch copy of the random state; the drawn card keeps its cast.
- **Per-role cooldown:** `repeat: N` applies per character.
- **Text and effects use roles:** `{friend}`, `{rival.their}`, `rel rival -8`.
- `say[lyra]:` overrides a line when Lyra is cast (translation key `…@lyra`).
- **Cast-dependent outcomes** read NPC stats and tags: `challenge negotiate vs rival.charm`, `gold +friend.wealth`, `if tagged(friend, noble):`.
- `actor: any` stays as shorthand for a single-role cast (removed from content in Phase 3).

### 5.5 People: two tracks *(phase 3)*

Friends are found the way they are in life: in the courses, clubs, jobs and places you choose. And once you enjoy someone's company, they start finding you. Every social opportunity comes by two tracks.

- **Track 1, you find them.** The shared pools (§5.1). A visit to a place where a character's `schedule:` puts them in that slot may give a card from that character's own pool; so may the social slot (anyone scheduled at a place you know). Unmet characters count too, so introductions happen where people are.
- **Track 2, they find you.** Each met character rolls once a month, independently of every other card, to bring one card from their own pool. It sits in the social slot with priority `friend` (between pushed and social). At most 2 such cards a month (1 on a break, where the chance is halved).
- **A character's pool:** their events (a fixed `actor:`, no place, track, plan or slot), plus generic social events cast with them in the `per:` role.
- **Schedules** (M42): an entry can hold on a share of days (`observatory@midnight:30`), and `schedule_break:` gives a break schedule, or `away`.
- **Milestones** (M13) are pushed, not drawn: `ramp: rel(npc) 18..30` pushes the card each month at 40% from the low mark, certain at the high mark.
- **One bar per character** (M37): length is closeness (rel), colour runs friendly ↔ romantic with spark. Friendship gains carry spark along in proportion to the spark already there (at most 2×, 3× for a partner), and crossing spark 30 asks once whether you want it (`spark_cooldown`). Friendship carries spark only from spark 12 (`@balance spark_follow from`: a romantic moment has to start it), and until that question has come (or you're partners) the spark it carries is applied but not shown, in outcomes or on the bar (feedback 2026-10-20). A rival's bar is full at −50.
- **Off campus** (M38, M19, M29, M31): at home or on an internship, the day draws that place's pools, a letter comes each night, anyone who reaches you writes, and spark fades at half the pace. A character away over a break (`schedule_break: away`) is reachable only by letter.
- **Warmth (0–100, per character)** is recent, chosen contact:
  - meeting sets it to 35;
  - visiting where they are: +12 (it counts as seeking them, playtest 2 M18);
  - a card with them whose outcome moved the relationship further its own way (a friend's rel or spark up, even at the cap; a rival's down): +18; otherwise −8. When every option moved it that way, only the larger move counts (M17);
  - −20% every month.
- **Pull** = 4 + warmth + 0.3 × friendship (hostility for a rival) + 0.3 × spark + bond (partner 30, close 20, friend 12, rival or nemesis 10). Monthly chance = pull / 100, at most 85%.
- **Encounter chances:** 55% per visit with someone present; 35% at lunch. An encounter takes the place of one of the visit's (or lunch's) other cards: time with someone is part of the visit, not extra.
- **In class:** a course's `lead:` and whoever is at its place that morning warm a little at each class.
- **Who seeks (`@npc seeks:`):**
  - `often` (default: the core cast, friends and rivals): full pull;
  - `sometimes`: ×0.6, nothing below warmth 15;
  - `rarely` (professors, staff, shopkeepers): ×0.4, nothing below warmth 35, so they come only once you have been coming to them;
  - `never`.
- **Fixtures** are the people of a place or a track, promoted from the background:
  - Sister Amaranth; Professors Brask, Vey and Marisol; Mabel, Mr Grimsby, Old Pell and Grisk.
  - **Shape:** lighter ladders (an introduction where they work or through their track, two or three repeatable cards, one milestone, often teaching a spell, §9.1), no romance, `seeks: rarely` (Grisk `sometimes`), and their own facts.
  - **The roster's tiers:** core cast (full arcs, romance, the plot) and fixtures; no procedural characters for now.
- **Leads (`@track lead:`)** are a course's professor or whoever runs a club or job:
  - enrolling or joining meets them;
  - each term, a course's grade moves their regard (A +medium, B +small, F −small), and a club or job term with performance ≥ 70 adds +small (missed visits cost it, §6.2);
  - their regard is §9.2's advisor modifier.
- **Casting by premise:** generic social events cast `peer` (students, the prefect, Ilse), classmates (student or prefect), `teacher` or `romanceable` as their premise needs, never just "not faculty". So a shopkeeper is never asked to do your homework.
- All numbers are tunable (`FRIENDS` in `src/director.js`).
- **Authoring consequence:** a character needs personal events from `rel 0` (rivals from below), or a new acquaintance has nothing to bring and the friendship stalls (`docs/authoring/pools.md`).

**Other candidates for independent pushers** (ideas, not built):
- rivals and nemeses provoking you;
- faculty mentors beyond leads (a thesis advisor);
- family letters (origin-driven, quieter at home);
- creditors (Grisk while in debt);
- the press (renown tiers: spotlights and scandals, §8.2);
- familiars and pets (Ember);
- an arc's agents (the man in grey, the Wardens) driven by alignment and clues rather than the clock;
- places that call you back (a favourite's regulars and news).

---

## 6. Places and the map (Phase 2b)

### 6.1 `@place`

```
@place duel_hall
name: The Duelling Hall
region: castle                 # castle | grounds | village | wilds | home | travel | internship:<host>
map: campus 660,150            # map id + position
kind: club                     # public | club | job | thesis | internship | plan
track: duelling                # for club/job/thesis/internship places
open: afternoon evening        # slots
season: any                    # or e.g. "not winter"
closed_when: flag(hall_burned)
discover: has(club_duelling) or rel(lyra) >= 15
hint: Steel rings somewhere above the east stair.   # teaser shown while hinted
hinted_when: met(lyra)
desc: Scorched floorboards and a ceiling that has seen things.
```

- **Public from the start:** courtyard, library, refectory, lakeshore, village.
- Everything else is discovered through `discover`, the `discover <place>` effect, joining a track, or a donation.
- **Visit draw:** 1–2 events with `place:` matching, plus a radiant cast from `present()`.
- **Ambient leak:** place events can surface in `world` / `social` slots at ×0.2 weight.
- **Content from dropped tracks moves to places:** Stargazers → Observatory, Choir → Great Hall, Skyrace → Flight Field, Familiar Stables → Stables, First-Year Tutor → Courtyard and mentoring events.

### 6.2 Obligations (clubs, jobs, thesis, internship)

| | Club | Job | Thesis (year 4) |
|---|---|---|---|
| Due per term | **2 practices** + fixtures (fixed dates, pushed) | **3 shifts** | **3 sessions** |
| Visiting gives | track events: XP, rank XP, contacts | track events + **pay per shift** | progress + advisor events |
| Extra visits | more XP, at decreasing returns | none: the shifts are fixed (I1). After the last shift a visit is an ordinary one (the place's own cards, no pay); the first such visit in a run shows a hint card (`@game off_shift`). No shifts on a break (I2) | extra progress |
| At term end, per missed visit | performance −15, lead rel −5 | performance −15, boss rel −5, no pay | progress −8, advisor rel −5 |
| Excused | ill or injured; "cover for me" via a friend (rel ≥ 40) | ill; calling in sick costs −5 performance, no rel loss | ill |

- The map badge shows what's left ("Practice · 2 left", "Shift · 1 left") and turns urgent in the last month of the term. A job whose shifts are done says "all done this term" on the map and in the side panel; on a break the side panel says there are no shifts.

**Performance** (0–100 per club or job; starts at 50):

| Event | Change |
|---|---|
| attended visit | +8 (cap 100) |
| good outcome in a track event | +5 |
| bad outcome in a track event | −5 |
| missed required visit | −15 (per above) |

| Threshold | Consequence |
|---|---|
| < 40 | warning event (pushed) |
| < 20 | benched (club: misses the next fixture) or fewer shifts offered (job: quota 2, with less pay) |
| 0 | dropped or fired. Club: rejoin at the next Club Fair, starting at performance 30. Job: the Job Board marks you unreliable for 1 term |

**Promotion** needs performance ≥ 70 and enough rank XP (§7.4).

### 6.3 The map view

Concept: `docs/map-concept.svg` / `.png`.

**Rendering** (`src/map.js`): an illustrated SVG base per map (`content/world/maps/<id>.svg`: campus, home, port, north, internship hosts), plus markers generated from `@place`.

**Marker states:**

| State | Look |
|---|---|
| open | solid |
| closed now | dimmed, with opening hours |
| your club / job / thesis | gold or ember ring + badge |
| hinted | dashed "?" + teaser |
| visited today | dimmed, dashed ring: a place is picked at most once a day (I3); the midnight pick is exempt |
| undiscovered | hidden under fog |
| festival | glow + "festival this evening" (banner above the map) |
| festival later today | dotted gold ring, closed: "getting ready for the festival this evening" (I5) |

**Overlays:**
- pins for characters present (from schedules; met characters only; at most 3, plus "+n");
- ✦ for unseen events or a pushed event waiting there;
- a season tint (autumn amber, winter snow, spring blossom, summer gold).

**Interaction:**
- The map opens once per visit, when its slot comes (playtest 2, M1): "Where will you spend the afternoon?", then later "…the evening?". A tap on an open place picks it and a second tap on it goes there, whenever it comes, as a spell is cast in a fight (feedback 2026-10-19); "Stay in" skips the visit. The map takes the card's place in the stage, scaled to fit it, and its markers carry no slot numbers.
- Picking a closed place shows its opening hours instead.
- **The map button** (top bar, feedback 2026-10-20) shows the maps you know, to look at, not to pick from: the one you're on now, the term map, and any other where you've visited a place (home, an internship host), one tab each. A tap on a place gives its hours and description.
- The outcome of a pick (attendance, pay) shows as a short toast, not a card.

**Accessibility:**
- A list view with the same states as text.
- Keyboard: arrow keys cycle markers, Enter picks.
- Tap targets ≥ 44 px; the map fits the screen width, with scrolling on small screens.

---

## 7. Tracks (Phase 2b mechanics, Phase 3 content)

### 7.1 The list

**Courses: 6 disciplines × 3 levels, plus 3 hidden.** One skill per discipline. Each course teaches one spell (spells v2, §9.1), a level of it at the start of each course level, on the course's own start card (`start:`); a hidden course teaches its one-level spell the same way.

| Discipline | Skill | Merges (today) | Spell |
|---|---|---|---|
| Evocation | arcana | Pyromancy, Tidecalling | Flame |
| Astromancy & Divination | lore | Astromancy, Divination | Foresight |
| Alchemy & Healing | alchemy | Practical Alchemy, Healing Arts | Mend |
| Illusion & Glamour | charm | Illusion & Glamour | Glamour |
| Beastcraft & Flight | vigor | Beastcraft (+ flight) | Haste |
| Umbral Theory | guile | Umbral Theory | Shadowstep |

| Hidden course | Prerequisite | Spell |
|---|---|---|
| Artifice | Alchemy II + Evocation II | Animate |
| Starcalling | Astromancy III + clue `heard_of_starcalling` | Starlight |
| Hollow Studies | Umbral II + Astromancy II + clue `knows_founders_seal` | Seal |

Ward is no course's: every first-year learns it in the first month, at the orientation safety talk.

**Clubs (4, one at a time):**
- Duelling Circle (arcana / vigor)
- Lumen Ledger (charm / lore)
- Verdant Circle (alchemy)
- Midnight Cartographers (guile; *secret*: discovered, never offered at the Fair)

**Jobs (4, one at a time):** Library Assistant (lore), Gilded Newt (charm), Apothecary Clerk (alchemy), Broom Courier (vigor).

**Internships (by application):** one host per discipline, plus the invitation-only Office of Unseen Affairs (§7.5).

**Thesis:** year 4 (§7.6).

### 7.2 `@track`

```
@track evocation
kind: course                     # course | club | job | internship | thesis
name: Evocation
skill: arcana
levels: 3
level_names: Evocation I, Evocation II, Advanced Evocation
place: lecture_tower             # where its events happen / obligation location for clubs & jobs
teaches: flame@1 flame@2 flame@3
start: evo_first_flame           # courses: the card that teaches the level's spell, pushed on enrolment
hidden: false
prereq: true                     # hidden courses: e.g. passed(alchemy,2) and passed(evocation,2)
# clubs/jobs:
ranks: Member, Officer, Captain  # or Apprentice, Clerk, Manager
pay: 8, 12, 18                   # crowns per shift by rank (jobs) (tunable)
due: 2                           # required visits per term
lead: lyra                       # NPC whose relationship absence affects (or a cast role)
```

### 7.3 Courses

**Enrolment:** a menu at the start of each term with `pick: 2`, where `pick` is a new menu property. There is no "take no courses" option (playtest 2, I10: it could be combined with a course); a fallback appears only when no course is open to you (`offered(courses) == 0`).

| When | Offered |
|---|---|
| Year 1 autumn | level I of Evocation, Astromancy, Alchemy, Illusion |
| Year 1 spring | level I of all 6, plus level II of courses passed |
| Year 2 autumn | + level II |
| Year 2 spring | + level III |
| Year 3 on | + hidden courses whose prerequisites hold |

- **Never a course already passed.** A failed course may be retaken.
- In year 4 the thesis takes one slot, so there are **14 course slots against 21 courses**.
- **Hint events** (2–3 per hidden course) point at the prerequisites.

**Exams:**
- In the term's last month, each course's exam is a card (playtest 2): the player chooses to answer steadily or to go for top marks (the swing of §9.2), and the card shows the pass and A chances. The exam is on the course's skill, at the **course standard** for its level (§8.6: I apprentice+, II adept+, III master+, a track's `standard:` overriding), with low drift; `@balance exam_tiers` sets each level's offset (`standard+2 standard+3 standard+3` since spells v2, 2026-10-17: the course spell and its XP now come before the exam; measured over 40 balanced games, pass and A rates of 87 / 52, 75 / 41 and 80 / 44% at levels I–III, against 87 / 47, 81 / 33 and 86 / 28% just before, at `standard+1`). Measured (feedback 2026-10-15, 40 games a style): a balanced player passes level I about 87% of the time, II about 75%, III about 70%, with A rates of about 44%, 29% and 18%; before, the standards were two rungs apart and every level passed about 92%, because the players who reach a higher level are further ahead in its skill. Until the check ladder (2026-10) it was a legacy tier by level (easy, medium, hard), eased in L when harder exams sent careful players to "Barely", and exams passed about 90% of the time; on the ladder about 83% (GPA about 2.9). The enrolment menu shows each course's skill, exam tier, spells and pass chance up front.
- **Study modifiers:** attendance and study choices during the term add up to +15 to the roll (`@balance study: attend 0 cap 15 monthly 3 check 5`). Since 2026-10-19 preparation comes mostly from routine sources, so passing is predictable:
  - each course's class gives **+3** in each of the three term months before its exam (none in the exam month), **+5** instead when a check in that course's class is won (once a month per course);
  - the library's **revision card** (`library_revision`, the library's first card on a term visit, once a term, before exam month) gives +3 to every course; the enrolment card points to it;
  - cards' own study gains are `+tiny` (migration 0034 lowered every gain one size), balanced by the study costs elsewhere: their net is about +2 a course a term (it was 4–6).

  So 9 comes with the classes; two won class checks (13) or one library afternoon (12) is a sure pass. (Before: monthly 2; until feedback 2026-10-15b a course card added 2 silently; the median preparation at an exam stayed about 8–11.)
- Until the exam minigame exists (§T1), it **auto-resolves**.

**Grades:**
- **Preparation floors** (2026-10-19; `exam_bands … sigma 16 pass_from 6 pass_at 12 b_from 9 b_at 15`): the pass chance can't fall below a smooth ramp from 6 prepared to certain at 12, nor B-or-better below one from 9 to certain at 15, joined to the skill's chance as either being enough. The careful exam's spread widened from σ 12 to 16, so skill shades the odds gently. Measured (25 games a style): pass at levels I/II/III 96 / 94 / 92% for a balanced player (was 90 / 72 / 72), GPA about 3.2 (was 2.7).
- Grades come from the bell at every level (feedback 2026-10-15; `@balance exam_bands: a 15 b 5 pass -5 ambitious 8 ambitious_sigma 20`): P(A) = odds(bar + 15), P(B or better) = odds(bar + 5), P(pass) = odds(bar − 5), so there is no hard A gate (before, an A needed a margin of 15 and going for top marks was never worth it). Going for top marks lowers the A mark by 8 and is sat at σ 20 instead of the careful 12: from the bar to 15 over it, about +16 to +26 points of A and +6 to +12 of F for the same expected GPA (±0.2), and better below the bar. `node tools/exam-odds.js` prints the table.
- GPA = mean of A4 / B3 / C2 / F0.
- **GPA replaces Standing:**
  - probation if below 1.5 (from the end of year 1);
  - the disciplinary board if below 1.0 twice in a row;
  - it gates the scholar ending, internships and thesis eligibility.
- Course events annotate `lesson: <fact or lore id>`. This is stored now and used by the tentative exam minigame.

### 7.4 Clubs and jobs

- **Joining or changing:** the Club Fair (Emberwane) and the **Job Board place**. Visiting it *is* the change event. At the fair a member stays, resigns or switches; a switch shows what it leaves (rank and performance). The job board lists each job's pay per shift. Declining gives no mood (playtest 2, M23, M35).
- **Each term:** joining a job mid-term asks at most one shift fewer than the months left, and no job can be taken in a term's last month (the job board says new staff start next term, and offers one evening's odd job instead; feedback 2026-10-20). At term end every job asks whether you stay on (`job_term_review`, M33).
- **Clubs are open-ended** (feedback 2026-10-20): every club visit in term counts in full, and the map shows no count. Each club except the Cartographers still expects one visit a term (`due: 1`, unshown); a member who never comes gets the term-end warning in the club's words ("you haven't shown up once all term").
- **Pay through events** (M10): a job visit draws a shift card first, and its options pay the wage (`wage`, a share of `pay:` at your rank) with tips and fines as the spread.
- **Pay by hazard** (playtest 2, L-1): one base (15 / 21 / 27 a shift by rank); the hazardous jobs (the courier's flights, the Newt's nights) pay a quarter more and show the hazard in minor incident cards (a bad landing, a lost parcel, broken glass, the walk home after closing); the quiet ones (the library, the apothecary's counter) pay a fifth less.
- **Fixed shifts** (playtest 2, I1, I2): `due:` is the number of shifts a term, not a minimum. Only those visits are shifts (shift card, pay, performance, rank XP); later visits that term, and every visit on a break, are ordinary visits to the place. Vacation work comes from the break plan ("Work on campus" and its gigs).
- **Ranks:**
  - Promotion = performance ≥ 70 + rank XP (from track events) + a milestone event. A new rank starts at performance 50 (M12).
  - Perks per rank (clubs: fixtures, contacts, spells; jobs: pay, discounts, access to places).
- **Event depth targets:**
  - 15–20 events per course level;
  - 30+ per club or job across its ranks;
  - a milestone event per level or rank.
- **Rewards come through track events,** not a fixed payout.
- **The Midnight Cartographers** are a society (M40): hidden, joined by invitation, with no dues, performance or ranks, and beside your club rather than instead of it.

### 7.5 Research internships

- **Application** (Greenrise): apply to as many hosts as you like; each letter after the first costs gold and mood (playtest 2, M36). A host needs its discipline at level II (shown locked, with the reason, until you have it).
- **Offers** (Blossomtide): one sealed letter per application, opened one at a time. A host's GPA bar is checked first, then the interview, a `challenge research` on the host's skill (a word from Thorne makes the Conclave's easier). A rejection lets you open the next letter; an acceptance withdraws the rest.
- **Hosts:**
  - Royal Library archives (lore)
  - Conclave laboratory (arcana)
  - Guild of Alchemists' works (alchemy)
  - Observatory expedition (lore)
  - Beastcraft field station (vigor)
  - Thornwick exchange lab (charm)
  - Office of Unseen Affairs (guile; by invitation)
- **When:** the summer of year 2 and year 3, one summer per offer (M16). A strong summer (performance ≥ 80) brings a letter asking you back; otherwise the post ends, and next year needs a new application. A strong summer is also remembered in the final year: the host writes with a post after graduation (a return offer, §7.7).
- **Away:** an internship draws no campus pools; the day's social and world cards come from the internship's own events, and nobody from campus comes calling.
- **Play:** a break day on the host's map: morning assignment card, two visits, night.
  - A supervisor NPC (authored, or a spawned archetype once Phase 4 exists).
  - **One project** with `challenge research` checkpoints (auto-resolved until §T1).
- **Rewards** (instead of double pay from full-time work):
  - stipend 6 per month *(tunable)*;
  - skill XP and renown;
  - possible `published` flag;
  - **a recommendation letter**: better odds and offers at the year-4 Career Fair;
  - **thesis head start**: +15 progress if the thesis is in the same discipline.
- **Plot hooks:** some hosts contain authored leads, each one of the redundant routes to a key clue (§10.6).

### 7.6 Thesis (year 4)

**Setup** (Harvestmoon, year 4, before enrolment so the thesis takes one course slot; moved from year 3's Highsun after playtest 2, where starting in a term's last month made the first term end warn at once):
1. **Discipline:** any with level III passed.
2. **Advisor:** a faculty NPC. Their relationship modifies the thesis challenges, and their traits colour the events.
3. **Topic:** one of 3, drawn from the discipline plus your flags, at an ambition level:

| Ambition | Difficulty | Payoff |
|---|---|---|
| safe | tier −1 | ×0.7 |
| solid | normal | normal |
| ambitious | tier +1 | ×1.5; can bind to the main plot if you hold ≥ 3 key clues |

**Running it:**
- One course slot each term.
- A **thesis lab** place with obligations (§6.2).
- **Progress** (0–100) and the advisor relationship.

| Month (year 4) | Milestone | Mechanic |
|---|---|---|
| Harvestmoon | proposal | advisor meeting; topic locked |
| Emberwane–Mistveil | literature | `challenge research` |
| Frostcall | first draft | advisor feedback; rewrite (time) or push on (risk) |
| Deepwinter–Thawmoon | (optional) | "thesis retreat" break plan: +progress |
| Stormbloom–Greenrise | experiment / fieldwork | discipline-skill `challenge`; a pushed **complication** incident |
| Blossomtide | final draft | progress < 60 → crunch event (mood and health for progress) |
| Highsun | **defence** | `challenge negotiate` against a committee of 3, modified by progress and the advisor relationship (auto-resolved until §T1) |

**Result:** distinction, pass, or fail and resubmit (graduate late). It feeds GPA, the yearbook headline, the Career Fair and renown. An ambitious, plot-bound thesis adds a line to the ending's *mystery* slot.

---

### 7.7 Careers and offers (year 4; feedback 2026-10-25)

A job comes only through a card, so it is always foreshadowed. An **offer** is a flag (`offer_<career>`); on the last day the player signs one of the offers held (`took_<career>`), and that is the yearbook's headline.

**Where offers come from:**
- **The Career Fair** (Emberwane, year 4): leave your name with one employer (Conclave, Royal Library, Guild of Alchemists, Office of Unseen Affairs, the Circus of Wonders, or teaching at Lumenhold with a faculty member's trust), then an interview; a good one is an offer. "Not yet" brings the fair's second week the month after, and then it's gone.
- **Return offers:** a strong internship (performance ≥ 80, §7.5) brings a letter from its host in the final year (the Royal Library's archives, the Conclave Laboratory, the Guild's works, the Observatory Expedition, the Beastcraft Field Station, Thornwick's laboratory, the Office of Unseen Affairs); a part-time job going well (performance ≥ 60 or its second rank) asks you to stay on full time (the Spire's stacks, the Gilded Newt, Pell & Daughters, the courier loft).
- **Head-hunting:** what you're known for brings a letter: arcana ≥ 80 with GPA ≥ 2.5 (the Conclave), the scholar's lore (a Spire fellowship), alchemy ≥ 72 (a shop lease), guile ≥ 75 (the Unseen Office), 180 crowns (a shipping house's partnership).
- Letters arrive one a month at most, from Stormbloom of year 4 to Goldenhaze.

**The last call** (Goldenhaze, year 4, with no offer held): the registrar's window, a menu that always holds a sure post (a clerk's desk), a friendly interview where you once worked or interned, a long shot in your best subject, or waiting until after graduation.

**The last day** (`last_career`): one option per offer held, plus keeping looking. Signing none, or holding none, ends on one of two lines by performance: *Still Looking* (GPA ≥ 2.5 or renown ≥ 30) or *Back in Your Old Room*.

## 8. Economy, preview and balance (Phase 2a; tuned in Phase 3)

### 8.1 Top bars and the You panel

| Top bar (fast, always previewed) | You panel (slow) |
|---|---|
| Health · Mood · **Mana** · **Alignment** as meters, then Crowns and Renown as plain numbers, each with what next month's start will take or give under it, itemised on hover (feedback 2026-10-15) | 6 skills · GPA · course levels and each enrolled course's standing (exam preparation, months to the exam, today's pass chance) · club/job rank and performance · thesis progress · spells · conditions · discovered facts |

### 8.2 Resources *(all numbers tunable)*

**Health, Mood (0–100).**
- **Balanced play** should keep them up easily.
- **Aggressive play** (always grinding or working) drains mood to 0 in about 3 term months and health in about 6. Health- and mood-focused options recover at a similar rate.
- Zero triggers the existing crisis events.
- **Bedtime** (2026-10-17): recovery is a night's sleep, not a month-start rest. Every ordinary month (turns 1–47; the last day keeps its closing sequence) ends with one bedtime card at midnight: the night card's "Sleep" on campus once the night is open, else `night_sleep` (before the unlock, at home, on an internship or another plan away, locked out, or when the night card dropped out of a day already scheduled; it steps aside once the night card has shown that month). Sleep (preset `sleep`) gives +8 Health and +4 Mood, or +20 and +10 at home on a break (`plan_home`), whatever the conditions, capped at 100; it cures nothing. Going out gives up that night's rest. The old `natural_recovery` hook (+10 Health a month below 70, unless sick or injured) is gone, and there is no standing mood from a partner.
- No standing monthly mood from relationships (feedback 2026-10-15): the old "in love" and "lonely" hooks are gone; mood comes from what happens in cards.

**Crowns** (no maximum).

| Cost | Amount |
|---|---|
| rent and board | 8 / term month; break: castle or campus work 8, home 0, travel varies |
| tuition | 16 / term, for every origin (origin design 2026-10-16; until then noble and merchant families paid it and the scholarship half) |
| course fees | 8 / term, at enrolment |

- **Forced sinks** (`class: incident`, pushed, rare): medical bills, family emergencies, fines, a broken wand.
- **Unpaid rent or board** → `hungry` (−3 health, −4 mood a month). Twice in a row → debt with Grisk.
- **Unpaid debt** escalates (playtest 2, M22): the first missed payment brings a reminder card (ignored, it adds a month), the next the collectors.
- **Money-maxxing sinks:** luxuries, bribes, patronage (crowns for renown), risky investments, donations that unlock places.
- **Income:** job shifts, break work, windfalls.
- **Origins** (`docs/origin-design.md`, 2026-10-16): each starts with its skill levels and purse (presets `origin_*_start`): noble Charm 25, Lore 12, 90 crowns, +6 Renown; scholarship Lore 28, Arcana 12, 60; witch-raised Alchemy 30, Arcana 15, Lore 6, 45, +6 Mood; street-raised Guile 30, Vigor 18, 38; trading heir Charm 25, Guile 15, 150. Support comes as cash on one card in the last break month before each later term (turns 6, 12 … 42), wherever the break is spent: the noble's family letter (38, an 11 gift in 30% of terms, Mood −small), the scholarship's bursary list (38 at a latest-term GPA of 3.0, 46 at 3.5, `term_gpa`; nothing below or with no grades), the company's report (78 in 70% of terms, else nothing). These are about two thirds of `origin-design.md`'s 60/15/60/68/120 (2026-10-16: at full size the supported origins ended runs with 400–700 crowns). Witch- and street-raised get nothing. Rolls happen when the card is drawn, so a reload keeps them.

**Mana (0–max).**
- Max = the combat minigame's Mana capacity, one scale in both games (2026-10-18; `combat/INTEGRATION.md` §2): round(43 × (2/3 + (2·arcana + lore + alchemy + charm + vigor + guile)/1050)), Arcana counted twice: 32 at the starting skills, 43 at 50, 53 at 80. It was 40 + arcana/2. Regen per month = 10 + arcana/10, unchanged, so the pool refills nearly every month (measured, 80 games a style: every style's Mana sits at or near its max).
- Restored by some events (the observatory at night, ley lines, a professor's tea).
- Ambient drains: wards failing, wild magic. (Exam nerves, −15 in each term's exam month, were removed with the one Mana scale.)
- Spent by spells (§9.1).

**Renown (0–100).**
- −20% of its current value each month.
- **Tiers:** Known 30, Famous 60, Legend 85. Each unlocks **spotlight** events (`class: milestone`) with large renown and real stakes.
- At renown ≥ 60, spotlights carry **scandal** branches with a chance of roughly (renown − 50)%.

**Alignment (−100 Hollow … +100 Lumen).**
- No decay.
- Moves toward Lumen at half speed once below −50, so climbing back from deep Hollow is harder.
- Thresholds (±30, ±60) gate events; NPCs tagged `virtuous` / `ruthless` react.
- The framing is the default pending decision D1.

**Relationships: two axes.**
- **Friendship (`rel`, −50…100; negative = hostility; rivalry bottoms out at −50, feedback 2026-10-20):** slow and sticky. A one-character focus reaches 100 at about 2 years. It never decays (feedback 2026-10-15b; it used to fade after 6 months without interaction).
- **Spark (`spark`, 0–100; replaces `love`):**
  - can start at first meeting;
  - **−15% a month** without a romance interaction; the month's summary says it once for everyone it touched, in words ("Fading sparks: no romantic moment last month…"), and a partnership it ends gets its own line (feedback 2026-10-19);
  - −10 to −25 on hurtful choices;
  - **jealousy** events if spark ≥ 30 with more than one person (romance only: friends aren't jealous, 2026-10-20);
  - no card raises spark with someone hostile to you (friendship below 0), unless the card is itself the reason (2026-10-20);
  - partnership needs spark ≥ 60 at a confession, and breaks after 2 months below 20.
- **Adults only** (§3.2).

### 8.3 Previews

- `preview(option, state)` walks the option's effects on a copy of the state, in order.
- **Fixed amounts and ranges** combine per resource.
- `if` is evaluated against the running state.
- `chance` / `check` / `challenge` become labelled branches with probabilities, nested at most 2 deep; deeper nesting collapses to ranges.
- Queues and flags show as a small "something follows" mark.
- **UI:** the changes on the choice button, by a setting (feedback 2026-10-15, 2026-10-15b; the gear menu, with the scene-description switch): signs by size (+ for tiny or small, ++ medium, +++ large or huge; − for losses), numbers, or icons only. Crowns and Mana always show numbers, and so does every outcome after a choice. Exam preparation for several courses at once shows as one icon. Branches as "win ++ renown / lose − mood (62%)".
- **Previews past a cap** (feedback 2026-10-19): a preview shows the amounts as written, also where they meet a cap or a floor (a Health gain at full Health still shows); the outcome after the choice shows what changed. The preview records the keys that met one (`over`), and the property test allows those to fall short.
- **A choice button stays compact** (feedback 2026-10-24): its label (the one line that may wrap), the kind of roll, and one line per outcome (at most three), each cut short rather than wrapped: two lines for a plain choice, four for a check or challenge, five with a partial. An option's description (`hint:`) is not on the button. Outcome labels take the colour of how it went (success, partial, failure).
- **The floating window** (feedback 2026-10-24; it replaced the expansion on hover, long-press and a selected menu tile) follows the mouse over a choice or a menu tile, or opens at the finger on a long-press: the option's label, why it is locked, its description, a fight's foe and level, every outcome with each change named, and the "…" spelled out. It shows when it says more than the button or a line of the button is cut short.
- **The "…" reveal** (in the floating window; feedback 2026-10-19) never repeats the preview: notes an outcome's label already says are dropped (an exam's grade), a spell is named without the skill bonus the icons show, what every outcome shares is listed once, and what only some do is listed once with those outcomes after it ("A, B, C"). The option carries one "…", not one per outcome.
- **The roll on a button** (feedback 2026-10-19) says only the skill it tests ("Arcana"): not the kind of check, its odds word or its swing, which the option's own words carry, and not the chance, which the outcome lines under it give (2026-10-20). A roll of pure luck (`chance`) shows the dice alone. A fight's button says only "Fight"; its foe and level are in the floating window (2026-10-24).
- **Spell levels** (I–III) show only for a spell with three levels; a one-level spell (Ward, the capstones, club and job spells) shows its name alone (feedback 2026-10-24).
- **Spells** name the skill they scale with under their description (the You panel, a fight's action preview and the foe's intent; feedback 2026-10-19).
- **Menus and the map** take the card's place in the stage, as a fight does (feedback 2026-10-19): no backdrop and no cards behind them, and the top bar and the side panel stay usable. A click picks; a click on the pick confirms, whenever it comes. With several to pick, the last pick confirms and a click on an earlier one takes it back.
- **Scene descriptions:** a card's `scene:` line shows in italics under it (Settings → Scene descriptions hides it). Cards keep their composed icon art; no other card art is planned.
- **Hard invariants:**
  - lint rejects any effect it can't preview;
  - the simulator property test asserts that every actual outcome falls within its preview, over 1,000 runs.

### 8.4 Presets, tiers and budgets (`content/core/balance.grim`)

**Size tiers** *(tunable)*:

| | tiny | small | medium | large | huge |
|---|---|---|---|---|---|
| health | 3 | 5 | 10 | 16 | 25 |
| mood | 4 | 8 | 13 | 20 | 30 |
| crowns | 3 | 8 | 15 | 30 | 60 |
| renown | 1 | 3 | 6 | 10 | 16 |
| mana | 3 | 6 | 10 | 16 | 25 |
| skill XP | 1 | 2 | 4 | 7 | 12 |
| rel / spark | 1 / 4 | 2 / 8 | 4 / 13 | 6 / 20 | 9 / 30 |
| alignment | 2 | 4 | 7 | 12 | 20 |

**Difficulty:** the check ladder (§8.6; values in `presets.md`). *Legacy:* `trivial −15 · easy −7 · medium 0 · hard +8 · heroic +16`, relative to `E(turn)`.

**Presets** expand to effects:
- `grind <skill>` = skill +medium XP, mood −small, health −tiny
- `rest` = mood +medium, health +small
- `social <role>` = rel +small, mood +small, crowns −tiny
- `work` = crowns +medium, mood −small, health −tiny
- `splurge` = mood +large, crowns −medium
- `risk` = a `chance` between large gain and medium loss

**Option value:**
- Σ (weight_resource × delta). The weights live in `balance.grim`.
- **Routine** cards: no option is obviously best (at least as good as another on every value and better on one, with no risk on either side), and each option sits within ±1.5 medium-equivalents. A free option is honest when it gives up what the other offers; a cost must be one the scene shows (playtest 2, A3, which replaced "every option costs or risks something"; `docs/authoring/costs.md`). Other classes follow §8.7.

### 8.5 Skills

- **XP sources:**
  - **coursework** (feedback 2026-10-15): once a month for each enrolled course, a fixed amount by course level (`@balance coursework`, from the `xp` row whatever the course's skill, so courses of one level train equally). It shows with the first card of that course in the month, or at month's end if the course had none. It replaced the monthly coursework hooks, which only paid when no card had;
  - course cards;
  - club and job events;
  - **incidental XP from ordinary events, spread across all skills**;
  - internships;
  - the thesis.

  No-repeat electives push everyone toward breadth after their main discipline.
- **Cost of the next point** = `a + b·level`. Starting values: `a ≈ 0.11X`, `b ≈ 0.0006X`, where X is the total XP of a typical term month (fitted by a tuning script).
- **Focus multiplier:**
  - **mastery** +30% XP on a course's skill while you hold level II+ in it;
  - an **aligned club or job** +15%.
  - Together that's about ×1.5, needed for "focused reaches about 95 by month 24" with a focus share of about 60%.
- **Rust:** −1 a month after 3 idle months, never below 60% of peak. Breaks (2 months) never cause rust alone.

### 8.6 Checks and difficulty over time

A check's difficulty comes from the story, not the calendar (the skill-check survey and redesign, 2026-10-15; how to write one is `docs/authoring/checks.md`).

- **Difficulty** is the DC, written as a rung of a rank ladder (novice … archmage, each with − and +; `@balance dc_tiers`): who or what the player is actually up against. A course card may write its course's `standard` (per level, ± rungs); a check against a character reads that character's stat.
- **Odds by nature**: the chance when skill matches the DC (`certain` 97% … `freak` 1%), moved by circumstance steps (facts of the world, never skill).
- **Luck** is the bell's σ: `steady`, `normal`, `wild`, `luck` (mostly chance).
- **Drift** keeps difficulty on par as the player grows: DC = d + k·(E(turn) − d), where `E(turn)` is the expected skill of a balanced player (the curve). More significant, less drift: routine and repeat cards keep up (`high`, about half of a passive player's growth), milestones and crises barely (`low`), plot-relevant story checks not at all (`none`). It pulls a hard check toward the player, so a high-drift hard check never becomes harder than a no-drift one.
- Odds = `floor + (ceil − floor)·Φ(z(odds) + steps + (skill − DC)/σ)`, 2–98%; a milestone check and an exam run 0–100. Skill still matters at the extremes.
- **Course levels**: the standard is apprentice+, adept+ and master+ at levels I–III (`course_standard`), and a course card shown above its own `level:` rises 5 rungs per level (`course_step`), the gap between standards. A course card's `standard` check drifts `low` (`course_drift`), so the rise isn't pulled back toward E(turn). Measured (feedback 2026-10-15): with the standards two rungs apart and `high` drift, course-card odds rose with level (balanced median 47%, 56%, 74%), because the players who reach a level are ahead in its skill; now they are flat (about 46%, 44%, 46%). Cards written at a fixed rung keep getting easier as the player grows.
- `partial:` is optional, with a band of ±5 around DC.
- `variant hard`: the same event 2 rungs harder with ×1.5 rewards; the director picks it more often as the year advances.
- *Legacy (until every check is rewritten):* a tier word puts the DC at E(turn) + offset, and odds = `clamp(50 + slope·(skill − DC), 5, 95)`; `chance N` is a raw percentage.

### 8.7 Event classes (`class:` is required)

| Class | Rule | Measured |
|---|---|---|
| `routine` | strict budget (§8.4) | per event |
| `milestone` | may be pure reward; capped at 2 large | per run: count and value |
| `incident` | may be all-negative; must offer agency (mitigate vs accept) | per run: about 1–3 serious ones a year |
| `windfall` | may be all-positive; capped at 1 large | per run: frequency band |
| `story` | exempt from budget; reviewed by the critic | per arc |
| `crisis` | exempt | rate per play style |

### 8.8 Balance: alarms, and players as the judge

**Reality.**
- Impact varies by design.
- How often an event appears is hidden behind prerequisite webs.
- Simulated players are crude stand-ins.

So automation catches **gross errors and regressions only**. **Human playtests** (end of Phases 2b, 3 and 4) and continuous telemetry are the judge. When they disagree with the simulator, **players win**, and the simulator's play styles are adjusted to match.

**Level 1: hard invariants (fail the build):**
- previews ⊇ outcomes;
- no soft-locks, no empty menus;
- no forced payment without a fallback;
- adults only for romance;
- every key clue has ≥ 2 reachable sources;
- every event has a class;
- routine budget respected: no option obviously best, each within ±1.5 (`docs/authoring/costs.md`).

**Level 2: alarms (wide tolerances, warnings):**

| Target | Alarm when |
|---|---|
| Focus tops a skill at ~2 years | `focused:x`: x < 85 by month 24, or the other skills average < 20 at the end |
| Balanced ≈ 50% everywhere | `balanced`: mean skill outside 35–65 at the end |
| Balanced affords ~50% of event costs | outside 30–70% |
| Money-maxxing has sinks | crowns still climbing steeply in year 4 |
| Forced sinks make food risky now and then | no tight month in a typical year |
| Casting at every chance keeps mana low | `caster`: mana > 40% in most term months |
| Without casting, mana still drains | `balanced`: mana always full |
| Balanced holds health and mood | `balanced`: either hits 0 in > 15% of runs |
| Aggressive breaks down | mood survives past term month 5, or health past 9 |
| One friend at ~2 years | `social:x`: friendship < 80 by month 24 |
| Romance is volatile | swings < 20 within 3 months in most romance runs |
| Skipping hurts | `truant` is never dropped or fired |
| Incidents / windfalls per year | outside 1–3 / 1–4 per year |

**Level 3: impact report** (`grim report`, §11.2): reach × magnitude per event, using telemetry wherever human runs exist.

---

## 9. Option types (Phase 2a)

### 9.1 Spells

Spells v2 (2026-10-17; the list and its reasons: `docs/spells-v2-list.md`). The ids are the combat minigame's
(`combat/setup/roster.mjs`), so a fight can take the player's spells as they are.

- **35 spells.** The six course spells have three levels; every other spell has one.
  - Course spells: Flame, Foresight, Mend, Glamour, Haste, Shadowstep. Hidden courses: Animate, Starlight, Seal.
  - Ward: everyone's, from the first month's safety talk.
  - Peer capstones, one per close friend (bond close or partner): Wildfire (Lyra), Heartwood (Tobias), Omen (Seraphine),
    Sleight (Corvin), Contraption (Mir), Hoarfrost (Kael), Candour (Nessa).
  - Club and job spells, each at the end of a five-card chain that starts at rank 2: Brace (Duelling Circle), Quickquill
    (Lumen Ledger), Bramble (Verdant Circle), Index (Library), Rapport (Gilded Newt), Distil (Apothecary; id `purify`),
    Tailwind (Courier). A chain card that does its part pulls the next one into the same visit, once a visit (feedback
    2026-10-19, migration 0035): the start and a preparation on one visit, a preparation and the final on the next. The
    final comes a month after the start once two preparations are done, or at four months.
  - With no source yet: the hidden pool (Rime, Reflect, Moonwell, Lodestar, Toll) and the forbidden pool (Torment,
    Extraction, Siphon, Compel, Eclipse, Heartprice), marked `pool:`.

```
@spell sleight
name: Sleight
skill: guile           # the skill it trains when learned and adds to on checks (one or two; none for Ward)
verb: Lift             # the verb its cards use
cost: 4                # Mana per level (three values for a course spell), on a card and in a fight alike
alignment: tiny        # taken off alignment on every cast (Sleight; the forbidden pool: small)
art: spell_sleight
desc: Palm, swap, pocket. …
```

- **Learned from:** a course's start card (`start:`, each level at the level's start; passing the level is the fallback
  and never teaches ahead), cards (`learn_spell x`), and `teaches:`. A spell costs the same Mana on a card as in a fight: `cost:` is the roster's (`combat/setup/roster.mjs`), and a test keeps them equal.
- **A reward** (playtest 2, L-6): learning a spell, or a level of one, gives skill XP in its skill (`@balance spell_bonus`
  by level for a three-level spell: medium, large, huge; `spell_bonus_one`, large, for a one-level spell), shown on the
  "New spell" note.
- **Options:** `> up[ward]: Raise a ward` is the swipe-up / ↑ option.
  - Invisible unless the spell is known; shown but disabled if mana is short.
  - Mana (and alignment, for a spell with `alignment:`) is taken automatically and shown in the preview.
  - Effects can read `spell_level(ward)`.
  - Translation keys: `opt.up.*`.
- **Saves:** a spell content no longer has is dropped on load, and a level past the spell's levels is clamped.

### 9.2 Challenges

```
challenge duel vs rival hard:     # combat | duel | negotiate | deceive | exam | research | brew | enchant
  win:     rel rival -4
           renown +large
  partial: renown +small
  lose:    health -medium
```

**Fights are played** (2026-10-19): every `combat` and `duel` challenge is a fight in the combat minigame (`combat/`, §T1), for the player and for the simulated players alike; none is rolled. Its result picks the branch: a win is `win`; a draw, or a loss on points, is `partial` when there is one, else `lose`; a knockout is `lose`. The fight's own Health and Mana changes are applied, and the branch runs without its `health` lines (they stay in content for compatibility). The DC below still sets the foe's level (`foeLevel`: the DC plus the odds word), and the card's odds are only the preview's estimate.
- **Into and out of a fight** (feedback 2026-10-19; `COMBAT_TUNING` in `combat/setup/roster.mjs`): from Health 30 up you start at full HP; below 30 the start falls in a straight line to 70% at Health 0 (was 90% + 10% × Health/70 down to 30, then steeper). Afterwards, Health is lost only when the fight ends below 30 HP: the stake (40) × (30 − HP left) / 30, less the setting's rebate (was the share of HP lost × 40 at any HP).
- **The fight says its setting** at the top, all through it: the situation (practice duel, a real fight, a public duel, a rehearsal, a ring bout) with what comes back afterwards (its Health and Mana rebate), that Health is lost only below 30 HP, whether a crowd watches (Renown at stake), and, for a fighter who knows a forbidden spell, whether anyone would report one.
- **A forbidden cast** costs 2 alignment, on a card and in a fight (`@balance forbidden_cast: alignment 2`; a third of the `small` tier it cost before).
- **Allies** (2026-10-25): a fight is still one against one, but a card may put someone beside you (`challenge combat … with kael`). Every three or four exchanges they throw their spell at your foe for free (Kael: Hoarfrost), at half its base damage as your own cast would scale it, resolved with the scheduled hits (`combat/rust/core/src/rules.rs`, step 5). One framework for every companion: the climax's allies, a friend in a brawl.
- **Creatures and the kit** (world expansion 1, 2026-10-20; `combat/HANDOFF.md`):
  - **Races** scale a creature foe only: critter (HP ×0.5, Mana ×0.6), beast (×1), monster (×1.75, ×0.6), boss (×3, ×1.5), placeholders for the simulator. Every creature is barred from healing; human foes (students, practitioners, the Outcast) never scale and may heal.
  - **Creature moves** are real spells of their own (F5.11): copies of an existing rule at their own numbers (Skitter is Shadowstep, Bark is Ward), delayed blows that land a few exchanges after they're cast, and four mechanics of their own. **Bind**: from the next exchange, Breaking Free is the only move. **Drain** takes Mana into the creature's flux. **Poison** ticks now and next exchange; once attached, nothing but a mature Lodestar stops it, and nothing cures it. **Multi-hit**: only the first hit meets a parry or brace.
  - **The worn kit** (§T2) adds flat modifiers in fights only: HP and Mana, cheaper spells, a spell hit on each cast of a group, a strike on a foe who defends, and less damage from creatures or named spells. Foes may carry the same table (the thornwitch, the Outcast). The kit can be changed on the fight's first screen, never mid-fight.
  - **Lessons and free fights:** a card's fight may be a lesson (coach marks; "Skip the lesson" settles as a draw) or carry nothing at stake ("Walk away"); neither moves any bar.
- **Duel terms and the spell redesign** (F5.11-plan.1, 2026-10-21; `docs/minigame-combat-f5.11-plan.1-2026-10-21.md`, `combat/HANDOFF.md`):
  - The basics are **Impulse**, **Parry** and **Refocus**. Physical damage is **Impact**. Haste adds an Impulse to an eligible spell instead of bundling actions.
  - Every hostile application is blocked, landed or reflected by one rule for both sides.
  - Generated foe kits learn club and job spells (capstones) from level 30, one club and one job, three at most; they learn hidden spells from 30, one every 10 levels.

**Auto-resolve** (every other kind; it's their only mode until §T1): the odds of a check on the mapped skill(s), against `DC(tier)`, plus modifiers.

| Challenge | Skill(s) |
|---|---|
| combat | played (above); the old stub, compatibility only: arcana, vigor and guile, plus condition (health, mood, mana) and the levels of every spell content knows |
| duel | played (above); the stub, compatibility only: (vigor + arcana) / 2 |
| negotiate | charm |
| deceive | guile |
| exam | the course's skill |
| research | lore |
| brew / enchant | alchemy |

- **Modifiers** (each capped at ±15):
  - `vs <role>.<stat>`: the opponent's stat is the DC (legacy tiers: it shifts the DC by the stat minus E(turn)). Peers grow with you (feedback 2026-10-15, `@balance npc_growth`): classmates (tag `peer`) and the pen pal (`thornwick`) have every skill stat × k(turn) = 1 + (K − 1)·(E(t) − E(1))/(E(end) − E(1)), where K brings their best skill to 0.9 × the final E(turn) (Lyra's arcana 34 → 56). Faculty and villagers keep fixed stats. Every classmate, Corvin, Nessa and Bram (still a prefect) included, is a first-year with you;
  - study points; the advisor relationship (the track's `lead:` regard, rel / 5, within ±15, inside that track's cards and at its exams); spells known (+2 for each known spell whose `skill:` is tested, at most +6; L-3); items (§T2).
- **Combat stub** (playtest 2, retired 2026-10-19): before the minigame, fights rolled `combat` and entering one spent Mana. The engine keeps it only for unit-test fixtures with no fight resolver (`eng.fights`); real runs never reach it. The fight's opponent plays at a player setting, Easy by default (Easy / Medium / Hard / Engine).
- **Luck (swing)**: how much of the outcome is chance rather than skill (§8.6): `steady` (practice decides), `normal`, `wild` (partly luck), `luck` (gambles, searches). It is independent of difficulty and stakes.
- **Kind and skill**: the kind is the shape of the action (talk round, mislead, work out, brew, a feat, cast, fight; `exam` only in a course); the skill is what the player uses against the obstacle, with `using` only when it differs from the kind's default.
- **Renown** can be the tested value (`using renown`) where popularity is the advantage.
- The simulator auto-resolves every other kind; its fights are played by the minigame's AI on both sides (`tools/combat-sim.js`: the player's side at a preset by style, the foe at Easy).

### 9.3 Crafting policy

Until §T2's crafting exists, alchemy is a skill and appears only in prose. Validators reject any mechanical reference to recipes or ingredients. **Items** exist since world expansion 1 (2026-10-20; `@item`, the kit): an owned item opens its own options on cards where it fits (`up[item:x]`, at most one per card, so owning more never stacks), and what you wear (one wand, one robe, one trinket) counts only in fights, as flat numbers. Ordinary checks never read items; tonics (`group: tonic` states) are the only check bonuses you can buy.

---

## 10. Narrative state

### 10.1 Facts (stored in 2a; UI in Phase 4)

- `@fact` blocks (§3.2). `learn npc.fact` reveals one; `unlock` conditions reveal them monthly.
- **Phase 4:** the People panel shows facts by tier, with a "new" marker. Facts are also usable in conditions (`knows(lyra.mother)`) and modifiers.

### 10.2 Memories (annotated in 2a; recall in Phase 4)

- Options carry `memory: helped friend` / `memory: hurt rival`. The kinds come from the vocabulary: helped, hurt, laughed, fought, confided, kissed, betrayed, rescued, protected, abandoned.
- The engine stores `{npc, event, kind, turn, place, vars}`.
- **Phase 4:** `{friend.recall(helped)}` picks a matching memory and renders a **translated template** for its kind, filled from `vars`, e.g. "Still owe you for {memory.place}, by the way." It renders as empty if no memory exists.
- No gameplay effect. Deterministic.

### 10.3 Relationships between NPCs (stored in 2a; behaviours in Phase 4)

- `npc_rel(a, b)` in conditions; `npc_rel a b +5` as an effect. Seeded from `relations:`; only changed pairs are stored.
- **Phase 4 behaviours:**
  - jealousy events (spark plus `npc_rel`);
  - cliques (casting prefers friends together);
  - matchmaking events;
  - "friend and rival in the same room" events.

### 10.4 Side characters from archetypes (Phase 4)

- `spawn newcomer from student` creates a persistent character (`gen_NN`) from the archetype: traits, age 18–22, house, pronouns.
- The **name is stored as a pool index**, rendered per language from `locales/<lang>/names.lang`.
- Spawned characters fill `any` roles, have schedules (by archetype), and get memories and facts (generic, from trait templates).
- **Limits:** at most 12 alive. They leave by graduating, transferring or drifting away (events). 3–4 spawn at game start.
- Batches may spawn characters but never author new named canon characters without a hard-lore entry.

### 10.5 Yearbook endings (`slot:` in schema v1; engine in Phase 4)

| Slot | Picks |
|---|---|
| headline | 1 (the career signed on the last day, §7.7; none signed: still looking or back home) |
| mystery | 0–1 (the main-plot outcome, §10.6) |
| relationships | 0–3 (best bonds: partner > close > friend; one line each) |
| personal | 0–2 (academic standing when it's poor; then the lines the yearbook keeps: alignment, renown, notable flags) |

- Endings declare `slot:` and `excludes:`. Game-over endings stay exclusive.
- Phase 3 annotates the existing 19 endings with slots (ignored until Phase 4).
- **Chosen on the last day** (feedback 2026-10-25, §4.1): each relationship and personal line reads a choice made on a month-48 card (kept with a partner, the friends who stayed, the Dumonts' photograph, Tamsin's corner, the lines the yearbook keeps), and the headline reads the career signed there (§7.7).

### 10.6 Arcs and the main plot (mechanics 2b · restructure 3 · journal UI 4)

**`@arc`:**

```
@arc hollowstar
canon: hard
acts: omens@y1 investigation@y2 escalation@y3 convergence@y4
clock: 0..12
beats: 2@y1m3 3@y1m9 5@y2m2 …        # clock advances on schedule
clues: founders_ledger lake_bell second_shadow seven_locks star_key kael_family ilse_truth
key_clues: seven_locks star_key ilse_truth
```

- **Events:** `arc:` (for director relevance), `clue(x)` in conditions, `find x` grants a clue (hard canon only), `act(hollowstar) >= 3`.
- **Clock beats are deadlines** (v2, 2026-10-26): the clock advances on schedule whatever the player does, and an act's climax raises it to the next act's opener (`advance hollowstar to N`), so pushing the investigation opens the next act early. Each act's cards are a story thread whose steps wait on the act being open, not on a month; the Night is a scene thread played in one sitting (`content/events/hollowstar/threads.grim`, `docs/plots/hollowstar-v2.md`).
- **The arc closes** (`close hollowstar`) with the Night's outcome, or with the Night seen from above for a player it never called: no card of the arc, and no clue, comes after.

**The Hollow Star in 4 acts:**

| Act | When | Without you (clock beats) | What you can do |
|---|---|---|---|
| I · Omens | year 1 (clock 1, climax by y1m9) | the lake breathes; the man in grey confronts Kael in the courtyard | the bell, the founders' seal, the black-star dream: two of them bring the climax early |
| II · Investigation | year 2 (clock 4, climax by y2m9) | Ilse arrives and the Dumonts clash in the open; things of frost come ashore | Kael's secret, what Ilse was raised for, the Codex, the man in grey's offer; save Ilse (a fight, a negotiation or a run for Kael) |
| III · Escalation | year 3 (clock 7, climax by y3m7) | the cult burns a black star on the Great Hall door; Isolde and Kael draw wands on the ice; the man in grey strikes in daylight | pick a side; the seven locks, the star key, your second shadow; lose the key and win it back (four ways, three without a fight) |
| IV · Convergence | year 4 (clock 10; the Night by Blossomtide) | the last winter; the Dumonts' mother writes; the Night | who trains with you; go down early with the key, in spring (the cult half-formed, only the promised come), or at the Blossom moon |

**The Night** (a scene, one sitting): who comes down with you (one companion: Kael or Ilse fight beside you, Maud or the headmistress help at the wall and the door); the cult's circle on the ice, led by the Dumonts' mother; the man in grey in the tunnel; Ilse, if she was taken; your own shadow; the founders' wall; the door. Every clue pays off there, found or not (at worse odds if not). Every fight sits beside a way that isn't one, and losing costs odds at the door, never the story (decision 2026-10-26). Each outcome has its aftermath card.

**Rules:**
- **The world moves without you.** Ignoring the plot gives the *bystander* result, not a game over.
- **Redundant routes:** each key clue has 2–3 sources (a place, a character's facts, an internship, a thesis topic, a research checkpoint). Hard invariant: ≥ 2 reachable.
- **Preparation decides the finale:**
  - clues held;
  - allies (friendship ≥ 50 with Kael, Ilse, Maud, Isolde);
  - alignment (≤ −60 unlocks *siding with the star*);
  - spells known.
- **Pacing:** at most 1 plot card a month, except in each act's climax month.
- **Batch content** may read the act for flavour and point toward clue *sources*. Only hard-canon events can grant key clues or move the clock.
- **The outcome** fills the yearbook *mystery* slot: sealed, bargained, freed, failed, fled, held the line, claimed, or bystander.
- **Character arcs** (Lyra, Ilse, Kael, …) use the same construct, at a smaller scope.
- **Phase 4:** a Journal tab shows clues found and the current act (as rumours, not spoilers).

---

## 11. Content production (committed paths)

### 11.1 Path 1: batch authoring by Claude Code (from Phase 3)

Loop per batch (a typical batch is 20–40 events around one brief):
1. Choose a gap from `grim report --gaps` (depth targets, places with thin pools, under-served arcs, characters, seasons).
2. `grim brief …` → context pack.
3. Write the events.
4. `grim build && grim lint && grim balance --quick && grim i18n zh-CN`, then translate.
5. **Critic:** a separate subagent checks the batch against `checklist.md`: canon, tone, class rules, safety (adults only, nothing explicit), and duplication.
6. **Duplicate check:** shingled-text Jaccard ≥ 0.6 against existing events is flagged.
7. **Acceptance (default; decision D5):** auto-accept when all validators and the critic pass. Each batch writes a report, with a random 10% flagged for optional spot-checks in `/admin`.

### 11.2 Path 3: feedback tuning (from Phase 3)

`grim report` extends the existing `grim feedback` and reads the stored run records (human runs first, simulated runs separately):

| Signal | Suggests |
|---|---|
| one option > 85% of picks (routine) | unbalanced choice |
| eligible but never drawn | gating too tight |
| high 👎 or "felt wrong" rate | rewrite |
| long decision times | unclear text |
| a card right before quitting | pacing |
| outcome outside preview | engine bug (invariant) |
| reach × magnitude outliers | review impact |

The `tune-events` skill works through the report: rebalance, rewrite, re-gate or retire. Each change runs `grim snapshot` / `diff` before and after, plus canon lint and the critic.

### 11.3 Translation

Every batch and every tuning pass runs `i18n zh-CN` and translates per the glossary. New constructs get their own keys:
- inline alternatives;
- `say[npc]` overrides (`@npc` suffix);
- `@fact` text, place names and descriptions, track, spell and rank names;
- recall templates;
- name pools.

### 11.4 Reports in `/admin`

- runs list;
- per-event statistics (reach, choices, ratings);
- the impact report;
- balance alarms;
- the batch acceptance log;
- a worldbook browser.

---

## 12. Schema v1: the event format that freezes after Phase 2b

| Construct | Added in | Engine at freeze |
|---|---|---|
| `class:`, `tone:` | 2a | full (lint, reports, variety) |
| presets, size and difficulty tiers, `variant` | 2a | full |
| new resources (`mana`, `alignment`, crowns, renown decay), `rel` + `spark` | 2a | full |
| `> up[spell]:`, `spell_level()`, `learn_spell` | 2a | full |
| `challenge … win/partial/lose`, `vs role.stat` | 2a | **auto-resolve**; `combat` and `duel` are played in the combat minigame (2026-10-19) |
| inline text `{a\|b}`, `{cond: x\|y}`, `{season=…}`, `{slot=…}` | 2a | full |
| `learn npc.fact`, `knows()` | 2a | stored + conditions; panel in Phase 4 |
| `memory: kind role` | 2a | stored; recall in Phase 4 |
| `npc_rel()` / `npc_rel a b ±n` | 2a | stored + conditions; behaviours in Phase 4 |
| `slot:`, `season`, `term`, `break`, `final_year` | 2b | full |
| `place:`, `replaces:`, `discover`, `present()` | 2b | full |
| `track:`, `level:`, `rank:`, `lesson:`, menu `pick: N` | 2b | full (`lesson:` stored for §T1) |
| `cast:` roles, `say[npc]`, `any` / `anyone` | 2b | full |
| `queue within / by`, `unqueue`, priority classes | 2b | full |
| `@arc`, `arc:`, `clue()`, `find`, `act()` | 2b | full |
| ending `slot:` / `excludes:` | 2b | parsed; yearbook in Phase 4 |
| `spawn x from archetype` | 2b | parsed; full in Phase 4 |
| `scope:`, `gen.*` flags | 2b | parsed only (§T3) |

- **After the freeze, changes may only add things:** new optional fields or statements, never a change in meaning. `@game schema: 1` is checked by lint.
- **During 2a and 2b,** a **compatibility layer** keeps the old syntax working (raw numbers, `actor: any`, `check`, `love`, `grades`) with "legacy" lint warnings, so the game stays playable. It's removed at the end of Phase 3.

---

## 13. Implementation plan (Phases 0–4)

**Principles.**
1. Build everything that affects *how an event is written* first, then freeze the format.
2. Rewrite the existing content **once**.
3. Open content production as early as possible.
4. A vertical slice before each corpus change.
5. Hard invariants always pass; alarms get reviewed, not blindly obeyed.
6. Humans playtest at the end of Phases 2b, 3 and 4.
7. Saves may break until 1.0.

### Phase 0: Platform and safety net

- **Already done (v0.2+):** git; full run logging (`s.hist`, run records, `sim --log`); rating and comments (feedback bar, Journal, export, `grim feedback`); `grim query`; `grim fmt`; save version 2.
- **Deliverables:**
  - the server (§1): client hosting, saves, telemetry, `/api/seen`, a skeleton `/admin`
  - client changes: server saves with a localStorage fallback and 3 manual slots, telemetry queue (sends the existing run history)
  - the remaining tools in §2 (rewriter, `rename`, `migrate`, play styles, `balance`, `snapshot` / `diff`)
  - simulator play styles
  - `grim balance` (invariants and alarms that apply today)
  - golden-seed snapshot
  - `npm run verify`
- **Exit:**
  - the game runs from the server in both languages, with saves and telemetry rows;
  - e2e passes against the server;
  - `query`, `rename` and `migrate` are covered by tests;
  - the snapshot diff against v0.2 shows **no gameplay change**.
- **Risk:** low.

### Phase 1: Worldbook and authoring spec

- **Deliverables:**
  - `content/world/` (§3.1)
  - parser support for the new blocks (data only; no gameplay use yet)
  - vocabulary
  - places with map positions
  - **the reduced track list** (§7.1) as data
  - 12 spells
  - the extended cast (age, stats, schedules, voice, relations)
  - facts (5–8 per main NPC)
  - 60+ lore entries
  - timeline, factions, arcs (data)
  - canon lint, `grim lorebook`, `grim brief`
  - `docs/authoring/`
  - skills rebuilt: `write-academy-events`, `distill-lore`
- **Method:** Claude Code distils (§3.6), then a human curates in git.
- **Exit:**
  - the worldbook parses and lints;
  - canon lint reports 0 unknown names over existing content;
  - briefs are generated for 5 sample topics;
  - **no gameplay change** (snapshot diff).
- **Risk:** low.

### Phase 2a: Groundwork, numbers and options

- **Deliverables:**
  - the resources of §8.2 (mana, alignment, crowns, renown decay, rel/spark)
  - top bars and the You panel
  - `balance.grim` presets and tiers
  - class / tone fields and the budget lint
  - **preview engine** + property test
  - `challenge` auto-resolve + `partial`
  - spells and the swipe-up option
  - inline text variation
  - `learn` / `memory:` / `npc_rel` stored
  - the compatibility layer
- **Vertical slice:** 10 new events using every 2a construct, plus 2 spells.
- **Exit:**
  - the slice plays in both languages;
  - the preview property test passes over 1,000 runs;
  - old content still runs (compatibility layer);
  - e2e passes.
- **Risk:** medium.

### Phase 2b: Groundwork, the world loop, then freeze

- **Deliverables:**
  - calendar, seasons, terms and breaks (§4)
  - break plans (castle, home, work full-time)
  - day recipes
  - **director** (§5): scoring, cross-run novelty, quotas, pushing, priorities
  - cast roles, `say[npc]`, NPC stats and schedules
  - **places + map UI** (§6)
  - tracks: enrolment (`pick: 2`), course opening schedule, exams → GPA, clubs/jobs with obligations, performance and absence, the Job Board, internship and thesis mechanics
  - XP model, rust, mastery
  - `@arc` clocks and clues
  - parsing for ending slots, `spawn`, `scope`
- **Vertical slice:**
  - 1 course (3 levels), 1 club, 1 job, 1 internship host (stub);
  - 5 places on the campus map;
  - a 4-event arc;
  - plus the existing content running in compatibility mode.
- **Human playtest #1:** pacing (cards per day, run length), the map, obligation pressure.
- **Exit:** the playtest notes are addressed. **Schema v1 freezes** (`@game schema: 1`, lint enforced).
- **Risk:** medium-high; pacing is the main unknown.

### Phase 3: One-pass migration, balance, then content production opens

**Migration steps** (each a `grim migrate` script or a Claude Code worklist, verified by snapshot diff where it applies):
1. **Mechanical:** `final_year`; `actor: any` → `cast:`; `love` → `spark`; `grades` → GPA references (118); numbers → nearest preset or tier.
2. **Judged:** suitable `check` → `challenge` (148, with Claude Code worklists); assign a `class` and `tone` to every event.
3. **Structural:** `slot`, `place`, `track`, `level` / `rank`, `lesson`, `arc`, `memory` annotations.
4. **Consolidation:**
   - 10 electives → 6 disciplines;
   - 7 clubs → 4, 6 jobs → 4;
   - dropped content moves to places (§6.1);
   - write hint events for the hidden courses.
5. **Re-pacing:** 4 years and real seasons (§4.5). Restructure the Hollow Star into 4 acts with redundant clue sources, writing the new events needed.
6. **Endings:** annotate slots.
7. **Translation:** `i18n zh-CN` complete. The compatibility layer is removed.
8. **Balance:** invariants pass, alarms reviewed and tuned.
9. **Human playtest #2:** a full run in each language.
10. **Feedback tooling:** `grim report` and the `tune-events` skill working on playtest telemetry.

**Content production opens:** path 1 starts with depth targets (§7.4): course levels, clubs and jobs, places, break plans.

**Exit:**
- 0 lint errors and 0 legacy warnings;
- invariants pass;
- zh 100%;
- playtest #2 notes addressed;
- the first path-1 batch accepted through the full loop.

**Risk:** high (the biggest pass), but done once.

### Phase 4: Narrative systems

- **Deliverables:**
  - fact discovery in the People panel + `knows()` usage
  - memory recall templates (en + zh)
  - NPC-to-NPC behaviours (jealousy, cliques, matchmaking)
  - archetype side characters + name pools
  - **yearbook endings**
  - renown spotlights / scandals
  - alignment reactions
  - arc Journal tab
- **Content:** path-1 batches for each system; path-3 tuning from playtest telemetry.
- **Human playtest #3.**
- **Exit:**
  - the systems are live with content;
  - playtest notes are addressed;
  - **a review gate for Part II:** decide whether and how to proceed with §T1–§T3.
- **Risk:** low; it only adds to the format.

---

## 14. Decisions

Defaults apply until changed; none blocks Phase 0.

| # | Decision | Default |
|---|---|---|
| D1 | Alignment framing | Lumen ↔ Hollow |
| D2 | Romance | several at once, with jealousy |
| D3 | Obligations | 2 practices, 3 shifts, 3 thesis sessions per term; at most 1 club + 1 job |
| D4 | Track list (§7.1) | as proposed; **needed before Phase 1 data is curated** |
| D5 | Path 1 acceptance | auto-accept when everything passes, with a 10% optional spot-check |
| D6 | Breaks in v0.3 | castle, home, work full-time; travel and internships as Phase 3–4 content |
| D7 | Main plot | optional (a bystander result is valid) |
| D8 | Exams as knowledge tests | deferred with §T1; exams auto-resolve until then |
| D9 | Model provider and budget | deferred with §T3 |

---

## Part II: TENTATIVE (do not implement before the Phase 4 review)

These sections record the direction agreed so far. Their **only** effect on Phases 0–4 is the hooks in §12 (`challenge`, `lesson:`, `scope:`, `gen.*`). Everything else waits.

## T1. Minigames *(tentative; Phase 5 if approved)*

**Built: fights** (2026-10-19). The combat minigame (`combat/`; its hand-over, `combat/HANDOFF.md`) plays every `combat` and `duel` challenge (§9.2). By the user's decision there is no auto-resolve for fights and no monthly limit on them. Everything else in this section stays tentative.

**Bound: negotiations** (world expansion 1, E8). Every `challenge negotiate` is a real negotiation, bound to the negotiation minigame (`docs/minigame-negotiation-v03.md`) and registered with its opponent profile and room in `src/negotiation.js`; until the minigame ships, a stub decides it from charm, lore and guile (`@balance negotiate`). Trivial asks became plain checks (`appeal`, `perform`, `soothe`). **Minigames happen freely:** the "about one a month" limit below is superseded by the user's decision (2026-10-20).

**Shared direction:**
- **Short:** 30–90 seconds, 5–8 decisions, swipe or tap, no reflex tests.
- **Stats and spells shape each one,** so progression matters.
- **Auto-resolve stays available** at the plain check odds. A skilled player should beat it by about +10–15 points.
- **Stakes previewed;** ~~at most about 1 playable minigame a month~~ (superseded: no limit); seeded and deterministic.
- **One module interface:** `{skills, spells, mana, items, opponent, tier, context} → {outcome, spent, notes}`.

| Minigame | Direction |
|---|---|
| **Duel** | Poise meters; secret strike / guard / feint each round; Guile reveals tells; opponent styles from traits; Vigor = stamina; Arcana = damage; spell cards cost mana (Ward, Flame breaks Guard, Glamour fakes a tell, Haste acts second); how you win affects the relationship |
| **Negotiation / deception** | Conviction vs Patience (plus Suspicion when deceiving); argument cards reason / appeal / pressure / offer / lie / spell; hidden values from traits; **discovered facts become special cards**; lies are remembered and checked later; **the thesis defence** is a 3-member committee variant using your findings as cards |
| **Exam** | Questions drawn from the `lesson:`-tagged lectures you saw that term, plus a validated question bank; skill buys lifelines (eliminate, hint, time). Needs decision D8 |
| **Research** | Push-your-luck over face-down sources; clue vs complication; bank or push; 3 complications = bust; Lore reduces complications; discovered places and facts add sources; can hold key clues |

## T2. Inventory and crafting *(tentative; Phase 6 if approved)*

- **Items:** consumables and charms, with "use item" swipe-up options alongside spells.
- **Alchemy:** ingredients carry element vectors; steer the brew into a recipe's region without overshooting into the volatile zone. Alchemy skill widens the target; recipes are discovered.
- **Enchanting:** inscribe a spell into an item, making a charm with charges.
- **This is the one planned addition to the format after the freeze** (items, `use item`, `brew`, `enchant`). Until then the crafting policy (§9.3) applies.
- **Adopted (world expansion 1, 2026-10-20):** the items subset: `@item` with `slot`, `worn:` fight modifiers, `legacy:` (granted while a condition holds, so old flags and states become items without editing their events) and `bound:`; `give`/`take`, `has_item()`/`worn()`, `up[item:x]` options; the Kit panel. Owned items never change check numbers. Alchemy recipes and enchanting stay tentative.

## T3. Live generation *(tentative; Phase 7 if approved, last)*

**Pipeline** (prompts built from `docs/authoring/`, like the Claude Code skills):
1. plan (large model, run rarely)
2. retrieve (`grim brief`)
3. write (mid model; schema-constrained JSON → grim)
4. validate (code: the same validators as path 1)
5. critique (small model, separate from the writer)
6. repair (≤ 2 rounds)
7. translate

**Sandbox:**
- presets and tiers only, no `end`;
- writes only `gen.*` flags; can't touch hard-canon arcs, clues or the clock;
- no new places, tracks or spells;
- characters only through roles or spawned archetypes.

**Survey:** every 3 months, 3–4 options inferred from play plus free text. The text is treated as data only.

**Delivery:** asynchronous on the server; results go into the run's `gen` push queue with a 1–3 month window. The game never waits.

**Scope:** `temporary` (this run) or `library` (kept across runs, with provenance).

**Audit:** a Library panel and `/admin` to list, preview, rate and delete, with automatic pruning.

**Also deferred here:** content chunking for very large libraries; embedding-based retrieval and duplicate detection; the model provider (D9).
