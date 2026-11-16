# Fallback retrieval evidence — 2026-11-15

Scope: the 12 active coverage gaps listed in `docs/reviews/critic-scan-2026-11-15/inventory.json`. This records retrieval evidence only; it contains no duplicate judgments or critic verdicts.

## Readiness

Command: `npm run grim -- retrieve status`

Result: success. Retrieval was ready in `authoring` mode with backend `grim`, profile `full`, 3,148 records, corpus hash `459ef22c44d4679aabb39bd95572887e7b111bc3c5209b6b6d55c2640b73530e`, and index hash `3985c5477be6ed5ed1be735ca1df00fc167e91952eea69ae676322c24d558229`. No index rebuild was attempted.

## Draft extraction

Each complete event definition was copied unchanged from `content/events/maps/placeholders.grim` into `/private/tmp/lifesim-critic-2026-11-15/<event-id>.grim`. All 12 extractions succeeded. The source content was not edited.

## Related queries

Queries were attempted sequentially using `npm run grim -- retrieve related --draft <temp-file> --json`.

| Event | Result |
|---|---|
| `almanac_printers_quiet_hour` | Failed: `retrieve: fetch failed` |
| `ashby_lane_quiet_hour` | Failed: `retrieve: fetch failed` |
| `capital_guild_quiet_hour` | Failed: `retrieve: fetch failed` |
| `capital_library_quiet_hour` | Started, then interrupted after repeated provider failures; no result captured |

After repeated fetch failures, later default-sandbox queries were stopped. One exact retry was attempted with elevated execution permissions:

`npm run grim -- retrieve related --draft /private/tmp/lifesim-critic-2026-11-15/almanac_printers_quiet_hour.grim --json`

The automatic approval review rejected it, stating the retrieval command likely sends private project card content to an external provider and the destination/payload egress was not explicitly approved. No workaround or further query retry was attempted. No candidates, IDs, similarity scores, or candidate source text were returned, so none could be inspected.

## Remaining event queries

The following drafts were extracted but not queried due to the repeated fetch failures and approval rejection:

- `capital_townhouse_quiet_hour`
- `travel_city_morning`
- `travel_country_morning`
- `vaneshade_house_quiet_hour`
- `oracle_rooms_quiet_hour`
- `hollis_house_quiet_hour`
- `ten_clockworks_quiet_hour`
- `fennick_farm_quiet_hour`

The search loop had begun with alphabetically sorted files; after the interrupted `capital_library_quiet_hour` attempt, no more requests were sent.

## Approved retry

After the user explicitly approved sending draft text and context to the configured retrieval providers for this critic pass, all 12 previously blocked queries were rerun sequentially with elevated execution permission. Every command exited 0. Captured JSON and stderr are under `/private/tmp/lifesim-critic-2026-11-15/results/`; the compact machine-readable result and complete current source blocks for the three highest non-self candidates per draft are in `docs/reviews/critic-pass-2026-11-15/fallback-retrieval-results.json`. Candidate `score` values are reported as returned by the retriever, without interpreting them as probabilities or duplicate verdicts.
