# Status & roadmap

**v0.3 in progress** (plan: `docs/design-v0.3.md`, Phases 0 → 2b, then human playtest #1).
- **Phase 0 (platform and safety net): done.**
  - Server (`npm start`): saves and slots, run-log telemetry, seen counters, `/admin`. File storage, no dependencies.
  - Tools: play styles, `balance`, `snapshot` / `diff` with a golden baseline, `rename`, `migrate`, `npm test`, `npm run verify`.
  - Browser tests run against the server.
- **Phase 1 (worldbook and authoring spec): done, pending your curation.**
  - `content/world/`: the extended cast (ages, voice, stats, schedules, relations), 72 facts, 40 places with campus map positions, the reduced track list (25 tracks), 12 spells, arcs, factions, archetypes, a timeline and 72 soft lore drafts. All of it is translated.
  - Tools: canon lint (0 unknown names across existing content), `grim brief`, `grim lorebook`, `grim docs`.
  - `docs/authoring/` (with 5 sample briefs); skills `write-academy-events` (rebuilt) and `distill-lore`.
  - **Your step:** review `content/world/` in git and promote soft lore to `lore/hard/` (`canon: hard`).
- **Phase 2a (numbers and options): done.**
  - Resources: the top bars are Health · Mood · Mana · Renown · Alignment; Crowns and Standing are in the You panel; renown decay; mana regeneration. Relationships: spark, with friendship and spark decay.
  - `content/core/balance.grim`: size and difficulty tiers, weights, a fitted E(turn) curve, presets.
  - Event format: `class:`/`tone:` with budget lint, `challenge` (partial results, `vs`), spells and the swipe-up option, inline text variation, `learn`/`knows`, `memory:`, `npc_rel`, `variant: hard`.
  - Exact previews on every option; the property test passes (0 misses).
  - Compatibility layer: lint counts 2,325 legacy uses, the phase 3 worklist.
  - Vertical slice: 10 events plus the Ward and Flame spells, in en and zh.
  - Save version 3: older saves are refused, and their logs kept.

- **Phase 2b (the world loop): done, ready for human playtest #1** (`docs/playtest-1.md`).
  - Calendar: four years, 47 months, terms and breaks, seasons. Each month is one day.
  - The director (`src/director.js`): day recipes and slots, weighted drawing (novelty, relevance, variety), priorities and overflow, push windows (`queue … within` / `by month`, `unqueue`).
  - The map (`src/map.js`): two visits a day (one on breaks), opening hours, discovery, festivals that take a visit, club/job markers, who's there, a list view.
  - Tracks: enrolment menus (`offers:`, `pick: 2`), term exams → GPA, spells taught on passing, clubs and jobs with obligations, performance, warnings, ranks and pay; internship applications; the thesis.
  - Cast roles and `say[npc]`; arcs with clocks, beats and clues; break plans (castle, home, work, internship); the XP model and rust.
  - Migration 0001 retired the v0.2 calendar menus and exams. Old content runs in compatibility mode (legacy states granted by tracks, `draws:` for places).
  - Vertical slice: Evocation I–III, the Duelling Circle, the Library Assistant job, campus and home places, the Royal Library internship stub, the thesis and the four-beat `the_bell` arc, about 50 events, in en and zh.
  - Tests for the calendar, director, map, tracks, cast and arcs; the browser test plays full four-year runs through the map and multi-pick menus.
  - **Known gaps** (phase 3): skewed endings, unreachable romance, short days (about 7 cards against 11). See the playtest guide.
- **Your step:** play it (`npm start`) and leave feedback; then the schema freezes and phase 3 starts.

**v0.2.** Engine, UI, toolchain, docs and agent skill are done.
- **Localization:** a key-based module (`src/i18n.js`, `locales/`) with English and a complete Simplified Chinese translation (3,126 content strings plus the UI), switchable in-game.
- **Content:** 354 events (100 added in v0.2: final-year careers, summer recess, faculty arcs, Ilse Dumont's chain, more character, social, life and class events), 55 states, 12 characters, 19 endings.
- Lint is clean, and simulated games finish without crashes or soft-locks in both languages.

## Ideas for next iterations

- **Content depth:** the 9 events the random sim never reaches (mostly deep chain steps) could use looser gates; more romance-route payoffs in year 3; endings for Ilse's chain.
- **Localization:** a third language (the toolchain supports any code: `node tools/grim.js i18n fr`); a human proofread of the Chinese.
- **Systems:**
  - Exams that scale with what you studied (per-class marks).
  - Items and inventory (a `@item` block: buy, hold and use).
  - Relationship decay over time for neglected friends.
  - Multiple save slots.
- **Presentation:**
  - Replace SVG placeholders with real art. Every event has a `scene:` description ready for an artist or an image model.
  - Sound and music.
  - A card-flip animation for outcomes.
- **Tooling:**
  - Done: `grim fmt` (lossless canonical formatter) and `grim query` (structural search), the groundwork for scripted content migrations.
  - Next: `grim migrate`, numbered migration scripts that use an editing API on top of `query`, ending with lint plus a before/after sim comparison.
  - Next: a rename map applied by `Engine.load`, so ids can be renamed without breaking saves.
  - `grim new <kind>` scaffolding.
  - A coverage report per chain.
  - A "goal" sim policy that tries to reach a named ending.
