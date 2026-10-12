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
