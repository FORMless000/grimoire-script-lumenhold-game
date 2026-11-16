# Map review context (2026-11-15)

Read-only scope map for the independent critic pass. `progress.json` has 412 pending cards (644 total); queue location/hash is authoritative. The two largest pending map files are:

## Region streets (37 pending in `content/events/maps/region_streets_2.grim`)

IDs include `streets_chestnuts`, `streets_water_cart`, `streets_bolting_horse`, `streets_pavement_artist`, `streets_monkey`, `streets_lost_child`, `streets_runaway_bride`, `streets_pieman`; retrieve full list/source line/hash from queue. Adjacent `content/events/maps/region_streets.grim` has another 23 pending IDs, so assess the pair for repeated premises. Likely shared wiring is in map pools/appointments and map definition; check `node tools/grim.js show <id>` and `brief` before judgments. General wiring rules: `docs/authoring/pools.md` (“Where a card lives”); schedules are appointment-owned, scene threads own multi-step sequences. No map-specific brief found in this review folder.

## Capital heists (34 pending in `content/events/maps/capital_heists.grim`)

Queue begins `job_way_out`, `job_slip`, `job_caught`, `docks_bonded_talk`, `bonded_customs_lamp`, `bonded_enter`, `bonded_dead_end`, `bonded1_dogs`; consult progress queue for exact complete scope. Related files: `content/events/heists/shared.grim` (shared exits/caught/dead-end pattern; header documents wiring), plus `content/events/maps/capital_port.grim` (23 pending, dock context). Existing notes mention previous accepted/fallback map reports in `README.md` and reports under `build/batches/maps-*-2026-11-15.critic.json`; these reports concern peer/capital fallback cases, not necessarily the pending heist cards. Do not treat these as judgments for current scope.

## Retrieval/context status and gaps

`README.md` says retrieval dependency was approved and first twelve retrieval queries succeeded; retrieval history is in `retrieval-history.md` / `.json`, and report-specific duplication receipts are named in README. The directory contains existing place briefs for other groups (e.g. `brief-capital_townhouse.md`, `brief-almanac_printers.md`, `brief-fennick_farm.md`) but no clearly scoped region-streets or capital-heists brief. This task made no retrieval calls and did not inspect raw JSONL. Before verdicts, main reviewer should inspect relevant queue rows, exact source blocks, `grim show/brief`, shared pool/appointment/thread declarations, and any per-ID retrieval receipts; no evidence currently maps a specific receipt to these two groups.

## Canon and authoring references

Canon source is `content/world/`; use `node tools/grim.js brief` / lore queries for proper nouns touched by the cards. New proper nouns need soft `@lore`. Everyday cards cannot reveal/confirm main mystery secrets; only hard-canon plot events grant clues or advance arcs. All choices trade something and costs use tiers/presets (`docs/authoring/costs.md`, `classes.md`). Main plot progress uses arc clocks/clues, not home-made counters. Existing review notes in `README.md` flag prior map issues as historical context only; this map carries no critique verdicts.
