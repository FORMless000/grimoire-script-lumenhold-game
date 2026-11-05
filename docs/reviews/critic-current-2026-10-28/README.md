# Independent critic pass — current cards, October 28, 2026

**Complete. Overall verdict: reject.** Reviewed **574 active cards** across 23 batches; 84 finding records affect 114 distinct scoped cards. Each finding names a concrete fix. The complete machine-readable result is [verdict.json](verdict.json); individual verdicts are in [build/batches](../../../build/batches). No card, engine, localization, existing verdict or baseline was edited.

## Scope

The adopted queue contains 135 newer first-pass gaps, 114 older first-pass evidence gaps, 320 previously rejected current cards and five later Phase 4 edits. Seven legacy calendar definitions were found to be compiled but explicitly retired with `when: false`; they are excluded and listed in [progress.json](progress.json). The initial scan counted those seven among 581 compiled IDs. The deleted `intro_purse` remains excluded.

This pass covers the adopted evidence-gap/re-review queue, not every one of the game’s 1,743 compiled definitions. Active means present and not explicitly retired; no claim is made that each card is frequent or reachable under every play style. The older external archive’s user-stopped snapshot recheck queue was not resumed.

## Findings and repair order

1. Fix the contradictory yearbook selection: `last_remembered` accepts both a printed distinction and “Strike them all”, retaining the distinction flag. This is the sole P1 record.
2. Repair outcome memory: the lucky deck can follow a failed vault recovery; the red-ink journal records observations/speaking after failure; return offers claim unearned internship milestones; the Bramble chain forgets planting in Maud’s garden.
3. Resolve moral, time/presence and choice rules. The last-standing ring contract deliberately locks escape, so it needs a costly noncombat route or an explicit documented design exception.
4. Rework the two duplicate premises: `item_thorn_wants` versus `lesson_siphon`, and `seventh_tower_outside_ledge` versus `observatory_roof_ledge`.
5. Address the remaining scene-supported costs, skill rewards, repeat callbacks and small wording fixes in each batch verdict.

Counts are finding records, not independent bugs: related-card groups can cover multiple cards, and the ring-route rule occurs in two batch reports. Acceptance follows the critic skill’s class/canon/duplicate/repeat blockers and approximate one-in-five threshold. Three batches are accepted with polish; twenty require repair.

## Earlier findings

Of the 46 October 20 issue records, 43 are resolved in current source, two are partly resolved and still raised (lucky-deck recovery and Corvin/Vey’s chance), and one prank-alignment criticism is not upheld in its current reciprocal context. See [prior-findings.json](prior-findings.json). The separate plans/thesis re-review found all thirteen previous issues repaired, while identifying other remaining defects. Existing verdicts are preserved.

## Evidence and validation

- [retrieval-audit.json](retrieval-audit.json) records 256 fresh single-card queries, the top two nonself comparisons and additional close matches. All returned source hashes were checked against current sources. The 266 additional supporting event texts were read in full prose; scores only nominated candidates. Prior retrieval/review evidence was reused for unchanged premises in the re-review set.
- OpenRouter card-text and candidate-excerpt transfer was explicitly approved by the user. Fresh results and embedding/reranking receipts are in `retrieval/`. No credentials are included.
- [retrieval-method.cjs](retrieval-method.cjs) completed the remaining queries with the same BM25, dense cosine, reciprocal-rank fusion and configured reranker. It reused one validated index and precomputed unchanged token counts; exact lexical results and saved draft queries match three fixtures. Run `node docs/reviews/critic-current-2026-10-28/retrieval-method.cjs --validate-only` from the project root to reproduce that local check. No retrieval implementation or index-identity source was edited.
- [probes.cjs](probes.cjs) and [probes.json](probes.json) reproduce nine controlled fixtures with seed 7 and actual compiled content. Failure branches are executed explicitly; these are evidence of possible states, not estimates of gameplay frequency.
- `node tools/grim.js check` exited 0: 0 lint errors, 7 existing warnings, 200 random-policy games, 0 crashes. Full verification and a new balance run were not performed for this review-only task.
- The content hash is unchanged at `0e06e8`. Exact scope coverage, unique batch ownership, JSON structure, issue source locations and retrieval source hashes were checked. No content-writing session occurred, so no localization or retrieval-index sync was required.

## Batch verdicts

| Batch | Cards | Finding records | Verdict |
|---|---:|---:|---|
| careers | 20 | 5 | Reject |
| castle-more | 21 | 7 | Reject |
| courses-more | 9 | 4 | Reject |
| expansion-bonds-recheck | 50 | 3 | Reject |
| expansion-breaks-recheck | 21 | 2 | Reject |
| expansion-intro-recheck | 22 | 1 | Accept with polish |
| expansion-kit-recheck | 25 | 2 | Accept with polish |
| expansion-romance-recheck | 65 | 10 | Reject |
| expansion-spell-lessons-recheck | 10 | 0 | Accept with polish |
| expansion-whisperwood-recheck | 91 | 1 | Reject |
| grounds-more | 12 | 3 | Reject |
| miniplots | 15 | 7 | Reject |
| older-calendar-and-life | 27 | 2 | Reject |
| older-club-and-job-spell-chains | 35 | 3 | Reject |
| older-night-work-and-bell | 21 | 4 | Reject |
| older-spell-followups | 15 | 1 | Reject |
| older-spell-sources | 16 | 4 | Reject |
| other-new | 13 | 4 | Reject |
| phase4-targeted-recheck | 5 | 2 | Reject |
| plans-thesis-recheck | 36 | 6 | Reject |
| spell-uses | 21 | 6 | Reject |
| village-more | 9 | 3 | Reject |
| world-more | 15 | 4 | Reject |
