# Integrating the minimal character portraits

## Current state

The proposed artwork for all 21 current NPCs is committed under [`art/characters/minimal/`](../art/characters/minimal/README.md). Five source sheets and the supplied reference are preserved. The 256 × 256 PNGs in `portraits/` are the current candidates, with editable crop coordinates in `portrait-manifest.json`. The game has **not** been switched to them.

Run `node tools/portrait-preview.js`, open http://127.0.0.1:4174/, and finish crop alignment before copying assets into the game's served paths. Saving a crop changes the candidate PNG and manifest on disk; it does not make a Git commit or affect gameplay. Commit tuned PNGs and their manifest together. The immutable initial manifest and local ignored backups support returning to earlier alignments.

Appearance priority for this set is direct card descriptions (including authored card scenes), then worldbook facts/cast prose, then the current SVG appearance, then inferred styling. [`DESIGNS.md`](../art/characters/minimal/DESIGNS.md) identifies those sources and choices. These notes do not change canon. Baseline portraits deliberately exclude event-only transformations; any later variants should be tied to actual game state rather than replacing the baseline.

## Smallest implementation

1. After visual review, copy the 21 current candidate PNGs from `art/characters/minimal/portraits/` into `src/portraits/minimal/`. Keep the masters and review tooling in the art folder. The existing game server already serves `/src/...`; its allowlist does not serve the art folder. Relative `src/portraits/minimal/<id>.png` URLs also work from the root `index.html` under `file://`.
2. Extend the presentation entry point [`Art.avatar(npc, size)`](../src/art.js) to choose between the minimal portrait and its current SVG rendering. Keep the original human **and goblin** SVG code intact as the Original mode and fallback. Keep the existing `avatar` class, size and circular clipping so all current callers retain their layout. Use a small explicit mapping of approved NPC ids to PNGs; unknown NPCs use the original renderer.
3. A simple SVG wrapper can draw the original procedural portrait beneath a clipped `<image>` for the selected PNG. A missing or failed PNG then leaves the original visible. Original mode omits the image entirely. Use relative asset URLs and a unique clip-path id for each rendered avatar; repeated instances of one NPC must not collide. Test a failed image explicitly rather than assuming a browser's failure rendering.
4. Add a **Portrait art: Minimal / Original** choice to [`openSettings()`](../src/ui.js). The UI currently stores its plain `settings` object at `lumenhold.settings.v1`; there is no separate `UISettings` module. Add a presentation preference there and pass it to, or set it on, the art renderer. The intended selected style is Minimal; Original remains selectable. Add the English UI labels in `UI_EN` in `src/i18n.js` and translate the corresponding `locales/zh-CN/ui.lang` entries.
5. On a toggle, replace only the visible avatar nodes or refresh their art layer. Preserve the current card, option selection and map interaction. In particular, do not re-enter `showMap()` as a side effect of changing a presentation setting. Language changes and newly rendered cards should honor the stored preference.

The current avatar call sites are map pins (18 px) in `src/map.js`, plus the People panel (44 px), actor rows (40 px), and ending relationships (26 px) in `src/ui.js`. Search again at integration time because other work is ongoing. Cover those surfaces and any new callers together. No engine state, save migration, NPC-id rename, worldbook change or balance change is needed.

## Acceptance checks

- Inspect the 21 final crops in both circular and square views; keep pupil highlights readable at the small sizes. Check Seraphine's star scarf, the Dumont siblings' related eyes, glasses and Grisk's ears when choosing how much to crop.
- Test Minimal and Original on a card, the People panel and an ending, in English and Chinese. The original goblin portrait must remain available.
- Verify preference persistence after reload. Toggle while a card or map selection is active and confirm no gameplay input is lost or advanced.
- Test both `file://` and `npm start`; simulate one missing PNG and one unknown NPC to verify the procedural fallback.
- Rebuild the committed bundle after changing UI translations. Run `node tools/grim.js check` and `npm run verify`; gameplay golden results should remain unchanged. No new gameplay baseline is expected for a portrait-only change.

The workshop is an authoring tool on a separate localhost port. Its save endpoint is restricted to the checked-in portrait roster, checks crop bounds and PNG dimensions, rejects stale edits, and backs up overwritten candidates. It is not a production upload endpoint or part of the game's server.
