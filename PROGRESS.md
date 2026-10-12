# Status & roadmap

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
