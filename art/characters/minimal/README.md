# Character portrait workshop

All 21 NPC portraits are live at `src/portraits/minimal/<id>.png` (256 × 256). The workshop and generation tools write directly to these files; there is no copy/sync step. Settings → Portrait art → Original still selects the preserved procedural SVGs, which also serve as fallback. Their archive is in [`../original-svg/`](../original-svg/).

The current crops use wider 825–900px source squares, with faces close to center and roughly 7–12% top space for most characters. Large buns and thick hair have about 4% top space. The earlier tighter crops remain available in the local backups and Initial alignment baseline.

From the repository root:

```sh
node tools/portrait-preview.js
```

Open **http://127.0.0.1:4174/** (`--port 4175` selects another port). A `file://` page cannot save crops; the separate [`concept gallery`](concepts/index.html) works from a file URL for inspection.

## Tune a portrait

1. Select **Adjust crop** on a portrait or individual concept. Drag to pan, scroll to zoom, or set Left, Top and Crop size in source pixels. Arrow keys move one source pixel, Shift + arrows ten; `+`/`-` zoom. Switching characters keeps unsaved drafts within the current tab.
2. Use the yellow center lines, cyan head oval and head-top/chin guides to keep the face near center, with some space above the hair and shoulders/collar visible. The round mask previews the game's circular clipping. Guides never enter the exported pixels.
3. Check the small-size samples and white pupil highlights. Light garments remain naturally light; distinguish these from background padding.
4. **Save portrait to repo** writes `src/portraits/minimal/<id>.png` and its entry in `portrait-manifest.json`, with backups. Reload the game to see the new alignment. **Download 256px PNG** exports separately without saving to the repository.

**Saved alignment** discards that character's draft. **Initial alignment** restores the approved tight framing recorded when the colored sources were introduced; press Save to apply. Drafts do not survive a page reload. Saves detect stale manifests, changed source images and changed live PNGs rather than overwriting another editor's work.

Each save preserves its previous PNG and complete manifest under ignored `.crop-backups/<time>-<id>-<suffix>/`. Restore a matching PNG and **only its manifest entry** if undoing one character, so later edits to other characters survive. Bulk generation backups use repository-relative paths under `.crop-backups/backgrounds-<time>/`.

## Backgrounds and regeneration

[`background-palette.json`](background-palette.json) assigns one muted flat color per character, chosen for contrast with their existing hair and clothing. These colors are presentation choices, not worldbook facts.

The deterministic pipeline is raw ivory concept → border-connected color flood fill → transparent cutout → replacement color → current approved crop. Four-connected pixels within RGB distance 18 of the sampled ivory are filled from the image borders. Enclosed highlights and other light interior details are retained. Only the immediate silhouette contour is softened and unmixed from the old ivory to reduce edge halos. Inspect `cutouts/` and `masks/` when changing sources or the tolerance; this is color segmentation, not semantic segmentation.

```sh
node tools/generate-portraits.js             # temporary preview; prints its directory
node tools/generate-portraits.js --out DIR   # preview in an empty directory
node tools/generate-portraits.js --apply     # backed-up update of the live assets
node tools/portraits.js check               # source/output hashes, sizes, roster
```

Preview folders mirror the repository structure. Open their `art/characters/minimal/concepts/index.html` to review colored concepts, round crops, cutouts and masks. Generation always starts from the raw concepts and retains the manifest's current crop rectangles, so repeated runs do not accumulate processing or reset manual framing. Restart the workshop after an external regeneration to reload its reset baseline.

To deliberately re-extract the raw concepts from the upper-body sheets, use `node tools/crop-character-concepts.js` (temporary preview), `--out DIR`, or `--apply`. Extraction now delegates color filling and live exports to the same generator and **preserves current crop coordinates**. Its source backup is `.crop-backups/upper-body-<time>/`; the subsequent generator separately backs up the live outputs and manifests. Review framing if the source layout changes. Full-body action artwork is not used.

## Files

| Path | Purpose |
| --- | --- |
| `images/` | Preserved upper-body master sheets, indexed in `generation-records.json`. |
| `concepts/<id>.png` | Raw padded 1024 × 1024 ivory upper-body concepts. Color generation never modifies these. |
| `concept-crop-layout.json`, `concept-manifest.json` | Sheet separation regions, optional clipping polygons, placement, sampled background RGB and source/output hashes. |
| `colored/<id>.png` | 1024 × 1024 colored crop sources used by the workshop. |
| `cutouts/<id>.png`, `masks/<id>.png` | Transparent character and grayscale alpha mask for inspection; white mask means foreground. |
| `background-palette.json`, `background-manifest.json` | Color choices and reproducible segmentation provenance, including raw-source, algorithm, mask and cutout hashes. |
| `portrait-manifest.json` | Current crops and hashes. `file` is **repository-root-relative** to the live PNG; `source` is **relative to this art directory**. Crop rectangles use source pixels. |
| `concept-portrait-baseline.json` | Approved tight crop reset coordinates in the colored sources. |
| `initial-portrait-manifest.json` | Preserved original sheet-based crop provenance; different coordinates/sources. |
| `portraits/` | Frozen pre-color exports retained for reference. No longer generation outputs or game inputs. Workshop HTTP URLs under `portraits/` alias the live PNGs for old links. |
| `DESIGNS.md`, `designs.json` | Appearance notes and evidence; canon remains in the worldbook. |
| `prompts.json`, `generation-records.json`, `source-hashes.json`, `style-reference.png` | Original generation provenance and style reference. |
| `fullbody/` | Separate action concepts; not portrait sources. |

Canvas performs decoding, compositing, resizing and PNG encoding using the project's existing Playwright dependency. No additional image-processing package is required. PNG encodings may differ across browser versions; manifests store the actual output hashes.

See the [integration/maintenance handoff](../../../docs/portrait-integration-handoff.md). Validation:

```sh
node --test test/portrait-matte.test.js test/portrait-preview.test.js test/portraits.test.js
node tools/portrait-preview.e2e.js
node tools/portraits.e2e.js
node tools/grim.js check
npm run verify
```
