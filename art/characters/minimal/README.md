# Character portrait workshop

The current concept set contains five master sheets, 21 square 256 × 256 portraits, the supplied style reference, concise appearance notes and source evidence. These are review assets; the game still uses its original procedural SVG portraits.

From the repository root:

```sh
node tools/portrait-preview.js
```

Open **http://127.0.0.1:4174/**. Use `--port 4175` if that port is occupied. The workshop needs only the project's existing Node runtime; it does not use the game server or install image-processing dependencies. Opening `index.html` through `file://` displays the launch instructions because browser file pages cannot write repository files.

## Tune a portrait

1. Click **Adjust crop**. Drag the image, scroll to zoom, or set Left, Top and Crop size in source pixels. The character selector lets you move between drafts without saving each immediately.
2. Use the yellow horizontal/vertical center lines and cyan head oval, head-top and chin lines to align characters consistently. The round mask shows how the square export will appear in the game. Neither overlay is exported.
3. Inspect the live 18, 26, 40, 48 and 128 px samples. Preserve the white pupil highlights and distinguishable hair, face and collar.
4. Click **Save portrait to repo**. It replaces only `portraits/<id>.png` and that entry in `portrait-manifest.json`; the gallery refreshes immediately. Reloading the page reads the saved files. **Download 256px PNG** is a separate export that does not update the repository.

**Saved alignment** discards the selected character's unsaved adjustment. **Initial alignment** restores the original candidate's coordinates in the editor; press Save to apply them. Arrow keys adjust the crop one source pixel, Shift + arrows ten; `+`/`-` zoom. Drafts survive switching characters or closing the dialog within the current tab, but are lost on reload.

Each successful save keeps the previous PNG and complete crop manifest together under `.crop-backups/<time>-<id>-<suffix>/`, which Git ignores. To undo a saved edit, prefer adjusting again or Initial alignment. For manual restoration, restore the matching PNG and **only its entry** from that backup manifest so other characters' later edits remain intact. Reload before editing again. The tool rejects stale saves when another editor or process has changed a portrait.

## Files

- `images/`: unmodified generated concept masters, indexed by batch and left-to-right roster in `generation-records.json`.
- `portraits/`: current review crops; square PNGs with the ivory background retained.
- `portrait-manifest.json`: authoritative current crop rectangles, output/source SHA-256 and dimensions. Coordinates are integer pixels from the top-left of the source master.
- `initial-portrait-manifest.json`: immutable starting crop coordinates and hashes, used by Initial alignment. It is not the current export manifest.
- `DESIGNS.md` / `designs.json`: appearance notes with written anchors, SVG fallbacks and freely chosen styling distinguished. Source order follows the user's requested priority; authored card scene descriptions count as written appearance evidence.
- `prompts.json`, `generation-records.json`, `source-hashes.json`, `style-reference.png`: generation provenance and the source snapshot used for the 17 October 2026 design pass. Notes are a design proposal, not new worldbook canon.

The original crops used macOS `sips`; subsequent editor exports use browser Canvas. Equivalent crop coordinates may produce different PNG encodings and slight resampling differences. Current PNG hashes are refreshed on save; source master hashes stay fixed.

The future integration plan is [the portrait handoff](../../../docs/portrait-integration-handoff.md). No game, save, worldbook, translation or balance changes are part of this artwork commit.

Validation:

```sh
node --test test/portrait-preview.test.js
node tools/portrait-preview.e2e.js
node tools/grim.js check
npm run verify
```
