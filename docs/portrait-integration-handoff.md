# NPC portrait integration and maintenance handoff

## Current integration

All 21 NPCs use the minimal PNG portraits at **`src/portraits/minimal/<id>.png`**, directly generated and edited in place. The latest framing pass widened the crops to 825–900px source squares and moved faces close to center. Most characters have roughly 7–12% top space; large buns and thick hair have about 4%. Collar/shoulder detail remains visible. Exports remain 256 × 256 square images; the game clips them to circles. The earlier tighter framing remains in the Initial alignment baseline and local backups; regenerate from the current `portrait-manifest.json` to retain the latest alignment.

`Art.avatar` in `src/art.js` renders each PNG above the preserved procedural SVG. Settings → Portrait art → Minimal / Original controls the `portraitArt` preference in `lumenhold.settings.v1`. The SVG remains selectable and serves as fallback for unknown ids or failed images. The original archive is `art/characters/original-svg/`. Style changes replace only portrait layers, retaining the surrounding UI and game state.

The same renderer covers map residents (18px), People (44px), card/menu actors (40px) and ending relationships (26px). Runtime PNG URLs remain document-relative, supporting both `file://` and `npm start`; no art sources or JSON manifests are fetched by the game. The existing server serves `/src/` without an allowlist change.

Stable id/filename roster:

```text
lyra       tobias     seraphine  corvin     mir
nessa      bram       kael       ilse       tamsin
isolde     thorne     maud       amaranth
brask      vey        marisol    mabel
grimsby    pell       grisk
```

Match by id, never localized display name. Appearance precedence remains card descriptions → worldbook facts → SVG references → inferred styling. Background colors do not establish lore or alter appearances.

## Authoring pipeline

All authoring files below are under `art/characters/minimal/`:

| Input/output | Role |
| --- | --- |
| `images/`, `concept-crop-layout.json` | Preserved upper-body sheets and extraction layout. |
| `concepts/<id>.png`, `concept-manifest.json` | Raw padded ivory concepts, sampled background RGB and provenance. |
| `background-palette.json` | Per-character replacement hex colors and flood-fill tolerance. |
| `cutouts/`, `masks/` | Transparent cutouts and grayscale alpha masks for inspection. |
| `colored/<id>.png` | Colored 1024 × 1024 sources for crop editing. |
| `background-manifest.json` | Original source hashes, colors, tolerance, algorithm hash, mask/cutout hashes and pixel counts. |
| `portrait-manifest.json` | Current crop rectangles, source hashes and live output hashes. `file` is repository-root-relative; `source` is art-directory-relative. |
| `concept-portrait-baseline.json` | Initial-alignment reset in the current colored sources, preserving the approved tight crop set. |
| `initial-portrait-manifest.json` | Preserved original sheet-based crop provenance. |
| `portraits/` | Frozen pre-color exports. No longer live inputs or current outputs. |
| `fullbody/` | Separate action concepts, not used by this pipeline. |

`tools/portrait-matte.js` flood-fills only border-connected pixels within RGB distance 18 of each concept's sampled ivory, using four-neighbor connectivity. This protects enclosed pupil highlights and pale interior details. The immediate foreground contour is softened and unmixed against the old backdrop before placing the cutout on the new flat color. Raw concepts are never modified by background generation. Color segmentation is intentionally conservative; inspect masks when changing art or tolerance, especially light hair/clothes and any enclosed background gaps.

From the repository root:

```sh
node tools/generate-portraits.js            # preview in a temporary folder
node tools/generate-portraits.js --out DIR  # preview in an empty folder
node tools/generate-portraits.js --apply    # update live PNGs + colored sources + manifests
node tools/portraits.js check              # validate hashes, dimensions and renderer roster
```

Preview folders mirror the repository. Their `art/characters/minimal/concepts/index.html` displays the colored concepts, round portraits and mask/cutout links. Every run uses raw concepts and **retains the current crop rectangles**. The generator checks for concurrent crop/output changes before applying, backs up overwritten files under `.crop-backups/backgrounds-<time>/` with repository-relative paths, and restores previous bytes if output replacement fails. The directory is ignored by Git.

`tools/crop-character-concepts.js` remains the entry point for re-extracting from the upper-body sheets. It supports the same preview/`--out`/`--apply` modes, backs up raw concepts before applying, then invokes the color generator. It no longer resets crops to the full square or exports into the old art-folder portrait directory. Source-layout changes can still require visual crop review.

`node tools/portraits.js sync` is retained for legacy manifests. With current live paths it validates only; it cannot copy the frozen pre-color portraits over live ones. Normal editing needs no sync step.

## Crop workshop

```sh
node tools/portrait-preview.js
```

Open http://127.0.0.1:4174/. **Save portrait to repo** now writes the live `src/portraits/minimal/<id>.png` and current manifest directly. Drag/zoom, numeric controls, center/head guides and small-size samples are retained. Guides and round-mask overlays do not enter exported pixels. Reload the game after a save. Restart the workshop after external generation so its reset baseline is current.

A save preserves the preceding PNG and complete manifest under `.crop-backups/<time>-<id>-<suffix>/` and rejects stale edits or externally changed sources/outputs. Restore a matching PNG and only its entry from the backup manifest when undoing one character. **Initial alignment** restores the approved tight colored-source baseline in the editor, and requires Save to apply. **Saved alignment** discards the draft. Downloading a PNG is independent of saving.

The local server serves live assets directly; old `/portraits/<id>.png` review URLs alias them. Under `file://`, the workshop cannot save; the static concept gallery remains viewable.

## Validation and delivery

```sh
node --test test/portrait-matte.test.js test/portrait-preview.test.js test/portraits.test.js
node tools/portrait-preview.e2e.js
node tools/portraits.e2e.js
node tools/grim.js check
npm run verify
```

The matte tests cover connected background removal, enclosed highlights, pale foreground and edge color unmixing. The workshop browser test uses disposable assets to verify saving to the live path, unchanged obsolete copies, crop gestures, guides, drafts, backup/reload/reset and phone layout. The runtime portrait checks cover both styles, languages, desktop/phone, file/server loading, persistence, preserved interaction state, and missing/corrupt image fallback. Ending coverage is also in `tools/e2e.js`.

When transferring or eventually committing this work, include live PNGs, authoring sources/manifests, palette, cutouts/masks, tools and tests together. Several assets were already untracked in this shared checkout; do not assume an earlier artwork commit includes them. Exclude ignored backups and temporary preview folders. No gameplay, save, NPC-id or balance changes are required; do not refresh golden gameplay baselines for portrait changes.

Validated 18 October 2026: all 12 focused portrait tests, all 175 repository unit tests, workshop and runtime portrait browser checks, `grim check`, and `npm run verify` passed. Full re-extraction reproduced all 21 live PNG hashes and retained every approved crop; raw concept hashes remained unchanged. The gameplay comparison found no changes across 120 golden games. The quick balance check reported six alarms and zero invariant failures. The final browser playthrough completed all 48 months and checked ending portraits and both-language event previews.
