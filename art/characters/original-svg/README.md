# Original NPC portraits (archived)

The procedural SVG portraits the game drew before the minimal PNG portraits (`../minimal/portraits/`) became the default: one file per NPC id, 64 × 64 viewBox, rendered at 256 px. They are reference copies; the renderer itself is still `procedural()` in `src/art.js`, shown in game with **Settings → Portrait art → Original** and as the fallback when a PNG is missing or fails to load.

Regenerate with `node tools/portraits.js archive` (after an NPC's `look:` or `color:` changes, if the archive should follow).
