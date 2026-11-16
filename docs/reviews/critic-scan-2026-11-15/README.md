# New-card critic scan and plan — November 15, 2026

Inventory and plan only. No critic pass has started and no verdict has been issued.

## Expanded scope: cards outside the independent passes

The user's follow-up broadens the queue beyond missing verdicts. **644 active cards fall outside the documented independent review passes:** the October 15 external archive, October 20 new-card pass, and October 28 current-card pass. **632 have other recorded verdicts with unattributed reviewers; 12 have no recorded coverage.** The 12-card queue below is a subset of this broader queue, not the whole proposed independent pass.

These records establish independent-pass scope, not that a particular model read every card. There is no reliable reviewer identity field tying the other batch verdicts to Codex or Claude. Claude co-author trailers on commits establish participation in the changes, not whether a separate critic was used. Consequently, keep those cards in a conservative new independent-pass queue without claiming their existing reviews were self-reviews.

[All 644 IDs and source links](independent-queue.md) and their per-card evidence in [inventory.json](inventory.json) make the broader scope reviewable.

| Group | Active cards outside the documented independent passes |
|---|---:|
| Earlier expansion and Hollowstar additions | 220 |
| Threads 1: detention, elixirs, Cartographers and castle heists | 66 |
| Threads 2: minor cast, Night Market, pushers, agents and offer hints | 61 |
| New maps, including active fallback cards | 297 |
| **Total** | **644** |

Plan: start with the 12 cards without coverage; then review the 220 earlier additions, Threads 1, Threads 2, and the remaining 285 map cards. Split the earlier additions into their existing source/story groups (the between-card sets, knowledge/full-picture/journal sets, Hollowstar additions, society/scandals, and spotlight sets). Preserve existing T1–T5, M/S, P/K/C batch boundaries where useful, with separate scoped verdicts. Each heist or story thread stays together. Apply the procedure below to every batch and compare premises across batches as well as within them. This is a plan, not authorization to start paid indexing or edit content.

## Identifiable author self-reviews

Eight reports explicitly say the author reviewed their own work. All eight were committed in changes with a Claude co-author trailer. This supports calling them Claude-linked author self-reviews; the records do not conclusively identify the model that performed the review.

| Report in `build/batches/` | Active historical-scope IDs still present | Outside documented independent passes |
|---|---:|---:|
| `bonds.critic.json` | 50 | 0 |
| `intro.critic.json` | 23 | 0 |
| `kit-shops.critic.json` | 25 | 0 |
| `miniplots_2026_10.critic.json` | 15 | 0 |
| `romance.critic.json` | 65 | 0 |
| `spell_uses_2026_10.critic.json` | 21 | 0 |
| `spells-v2.critic.json` | 75 | 0 |
| `whisperwood.critic.json` | 91 | 0 |

Their historical file scopes are recovered at the report commit, using companion batch files or the directories named in the summary. Exact IDs, scope basis, commit hashes and later coverage are retained in `inventory.json` under `selfReviewReports`. **No active card in those scopes remains self-review-only.** Later independent coverage can reject a card; it does not certify the present version or completion of repairs. The 117 changed previously reviewed definitions remain separate re-review candidates below.

## Initial scan: missing recorded verdicts

At HEAD `b8082c5`, the project compiles **2,187 cards**, of which **2,147 are active definitions** and 40 are explicitly disabled/retired. Against the October 29 inventory, 378 IDs were added and none removed: 358 active additions and 20 disabled additions.

**12 active new cards have no recorded critic coverage.** All are in `content/events/maps/placeholders.grim`. The other 346 active additions have recorded review evidence. No older active card lacks recorded coverage in this join.

“Active” here means no retired tag or literal `when: false`, not proven gameplay reachability. Placeholder tags do not establish a review exemption: these cards can still be dealt. Conversely, disabled placeholders are outside this pass.

## Exact queue

Review these in three small batches, in this order. Batch names below are proposed output names, not existing verdicts.

| Proposed batch | Event | Source |
|---|---|---|
| `maps-peer-fallbacks-2026-11-15` | `vaneshade_house_quiet_hour` | [line 264](../../../content/events/maps/placeholders.grim:264) |
| | `oracle_rooms_quiet_hour` | [line 279](../../../content/events/maps/placeholders.grim:279) |
| | `hollis_house_quiet_hour` | [line 294](../../../content/events/maps/placeholders.grim:294) |
| | `ten_clockworks_quiet_hour` | [line 377](../../../content/events/maps/placeholders.grim:377) |
| | `ashby_lane_quiet_hour` | [line 426](../../../content/events/maps/placeholders.grim:426) |
| | `fennick_farm_quiet_hour` | [line 441](../../../content/events/maps/placeholders.grim:441) |
| | `almanac_printers_quiet_hour` | [line 456](../../../content/events/maps/placeholders.grim:456) |
| `maps-capital-fallbacks-2026-11-15` | `capital_library_quiet_hour` | [line 12](../../../content/events/maps/placeholders.grim:12) |
| | `capital_townhouse_quiet_hour` | [line 27](../../../content/events/maps/placeholders.grim:27) |
| | `capital_guild_quiet_hour` | [line 108](../../../content/events/maps/placeholders.grim:108) |
| `maps-travel-mornings-2026-11-15` | `travel_city_morning` | [line 233](../../../content/events/maps/placeholders.grim:233) |
| | `travel_country_morning` | [line 248](../../../content/events/maps/placeholders.grim:248) |

The peer batch comes first because later peer content now shares these places. Compare its premises and continuity against `capital_peers.grim` and `countryside_peers.grim`. For the capital batch, compare the home and hiring-hall scenes against `capital_homes.grim`, `capital_port.grim` and the existing internship content. For travel mornings, inspect the travel-plan and lodging wiring, origin assumptions, seasons and actual time slots. These are review questions, not findings.

## Critic-pass procedure

1. Follow [the critic skill](../../../skills/critic/SKILL.md). Read the current checklist and its cited style, class, cost, check, pool and preset rules. Read all 12 events in full, including every text/say variant, the inherited `maps_placeholder` pool, applicable places, plans, appointments and conditions. Use `grim show <id>` and `grim graph <id>` to establish compiled gates and delivery paths.
2. Generate place/cast briefs with `grim brief`; read the relevant worldbook entries, speakers' voices and facts. Compare against every existing card at each place. Pay particular attention to repeat variation, choice-dependent callbacks, meaningful trades while away, and promised effects.
3. Check retrieval readiness and existing notes before searching. For each queued card, save a single-event draft in a temporary directory, run `npm run grim -- retrieve related --draft <file>`, and read the closest 2–4 source cards. Record the query and comparison in the new batch notes. Supplement with `grim dupes` and `grim query event --grep <word>`. Do not equate similarity rankings with duplicate verdicts. An unavailable index must be resolved before any premise rework; a paid rebuild is not authorized by this planning task.
4. Write one `build/batches/<proposed-name>.critic.json` per batch, using the skill's accept/reject criteria and concrete fixes only. Include explicit `scope.reviewedEventIds`, source HEAD/content hash, and the reviewed cards' definition hashes from this inventory. State the reviewer and review basis accurately. Keep the IDs in this queue fixed even though the source file contains other cards; a whole-file companion batch list must not imply that all its cards were reviewed.
5. The critic leaves source content to the author. If rejected or accepted with polish, the author applies fixes, retrieves again for premise/outcome changes, updates zh-CN and the bundle, runs required project checks, then requests a recheck. Preserve this scan and earlier verdicts as history. End a content-writing session with the required retrieval sync.

Completion means every queued ID has a scoped verdict against an identified source version, with each blocking finding fixed and rechecked. An accepted report may still contain polish items; track them explicitly rather than treating acceptance as proof every issue was fixed.

## Evidence reconciliation and limits

[inventory.json](inventory.json) records exact IDs, source locations, definition hashes, report evidence, exclusions and documented scope resolutions. [scan.cjs](scan.cjs) reproduces the coverage join:

```sh
node docs/reviews/critic-scan-2026-11-15/scan.cjs
```

The join reads local batch verdicts and the available external archive at `../lifesim-reviews/event-critique/`. It uses explicit report scopes, companion batch lists and exact event IDs in critic issues. Six accepted reports lack machine-readable scopes (M1, M3, M4, M5, M6, S2); their batch notes and verdicts establish their scope. For whole-file batches, IDs are recovered from the files at the commit that last wrote the verdict, rather than inferred from today's contents. The C3 notes and accepted summary also establish coverage for the renamed jammed-press and watch-guide cards. C2 explicitly critiques `theatre_stage_door`; C1 explicitly critiques the counting-house and crew-loft placeholders. These five cards are therefore not first-review gaps.

Recorded coverage is evidence that a card received criticism, including rejected verdicts. It does not independently establish reviewer identity or independence, completion of fixes, or review of the current definition. Explicit self-reviews do not count toward coverage.

Separately, **117 active, previously reviewed definitions differ from the October 29 compiled definitions**. Their exact IDs and hashes are in `inventory.json` under `changedReviewed`. This includes inherited wiring changes; it is neither a defect count nor a proven unreviewed-version backlog. Compare those changes against later reviews and mechanical migrations before adding rechecks. They are outside the 12-card first-review queue; four already overlap the broader 644-card queue, so the counts must not simply be added.

## Validation

The inventory compilation returned zero errors. Unique-ID and coverage-partition assertions passed. `npm run grim -- retrieve status` reports the Grim authoring index ready, with 3,148 records and no added, modified, deleted or moved records; searches can proceed without rebuilding it. No retrieval queries or model calls were run.

`node tools/grim.js check` passed (exit 0): zero lint errors, seven warnings on older milestone cards, and 200 random-policy simulations with zero crashes. All 644 unique queue IDs, source line references, the coverage split and local document links were checked; the scan script passes `node --check`. The working tree was clean before this scan. No card, localization, historical verdict or retrieval index was edited. No gameplay change or full verification run was needed for this inventory and plan.
