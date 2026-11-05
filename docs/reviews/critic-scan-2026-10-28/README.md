# Critic scan and plan — October 28, 2026

Scan complete; critic pass not yet performed. No card sources or verdicts were changed.

## Scope and evidence

Current source has **1,743 event IDs**. Using the existing October 20 review baseline (`0e4641a5dd8b6cf3607322b971c7bfb1d7647986`) gives **643 currently present new IDs**. Of these, **99 have no recorded critic verdict** and **36 have author self-review only**: **135 new cards need a first independent critic pass**.

Compared IDs, rather than filenames or the existence of a verdict file, across `content/**/*.grim`, `build/batches/`, and the older archive at `../lifesim-reviews/event-critique/`. The inventory records every queued ID, source file, available review evidence and current source hashes. This is review-coverage evidence; an old acceptance does not establish that today's prose has been reviewed.

[Machine-readable inventory](inventory.json) records the scanned HEAD, baseline, exact batch membership, re-review scopes and older gaps. Current content has no uncommitted .grim edits at scan time; unrelated working-tree edits were left alone.

## First independent pass: 135 cards

| Planned batch, in priority order | Cards | Evidence |
|---|---:|---|
| careers-and-last-day | 20 | No recorded critic verdict |
| miniplots | 15 | Author self-review only |
| spell-uses | 21 | Author self-review only |
| routine-pools | 66 | No recorded critic verdict |
| other-new-cards | 13 | No recorded critic verdict |

1. **Careers and last day (20):** all 17 career offers/returns and three new final-day cards. Trace offers, signatures, eligibility and yearbook consequences across both files; older cards are supporting context.
2. **Mini-plots (15):** all three threads. Read the complete chain, its leads, queued/deferred beats and outcomes, including home-break continuity. Existing acceptance explicitly records author self-review.
3. **Everyday spell uses (21):** check normal and spell routes, honest trades, spell knowledge and repeat variants. Existing acceptance explicitly records author self-review.
4. **Routine pools (66):** split by file into five manageable passes: castle 21, courses 9, grounds 12, village 9, world 15. The existing `routine_pools_2.json` has no critic verdict. Read inherited pool properties alongside each card.
5. **Other new cards (13):** experimental expansion 5, ring cameos 4, intro additions 3, `isolde_asks_again` 1. Trace the intro/calendar callback and ring placement, and check experimental premises against accepted content.

These are explicit ID scopes. A file-level batch command may include older cards sharing the file; record those as validation context rather than silently expanding the critic scope.

## Re-review queue, separate from uncritiqued cards

- **October 20 expansion:** 284 surviving cards of the original 285 (`intro_purse` retired). The saved verdict remains rejected, with 46 findings and a resolution of “fixed; awaiting re-review.” Verify each claimed fix and the declined/partial rulings against current canon and rules; re-read affected choices and their dependencies, broadening only where changes warrant it. Preserve the original report and write a distinct round-two verdict.
- **Plans/thesis:** all 36 IDs remain. The round-two verdict is rejected for mismatched random setup/outcome variants and sequences that assume a previous choice. Verify current source before deciding whether the historical issues remain; do not assume the fixes landed merely because the batch is old.
- **Phase 4:** all 14 batches have accepted critic verdicts. Do not repeat all 210 cards. Five later retrieval reworks are documented in `build/batches/P4-recheck.notes.md`; a targeted post-edit check of `scandal_credit_taken`, `spot_newt_drink`, `between_love_note`, `fame_lend_your_name`, and `season_first_supper` can close the gap between those verdicts and subsequent changes.

## Older evidence gaps

The whole-source join also finds **55 older IDs with no matched verdict and 66 older IDs with only self-review**, listed separately in the inventory. They predate the chosen new-card baseline and are outside the primary 135-card plan. The 66 self-reviewed cards belong to the spell-source/lesson/club-chain work. Reconcile archive scope before expanding this task; absence of a matching record is not proof a human never read a card.

Missing local verdict files alone are misleading: `courses_upper` (24), `courses_hidden` (6), `incidents` (13) and `plans_more` (18) all have ID-level reviews in the external archive (reports 60–74). They are not first-pass gaps. The archive says snapshot rechecks were stopped at the user's request; this plan does not resume that older recheck queue.

## Procedure and completion criteria

Follow [the critic workflow](../../../skills/critic/SKILL.md) and [acceptance checklist](../../authoring/checklist.md). Before each pass, read the cited style, class, cost, check, pool and preset references; load current worldbook voices/facts and briefs for the touched cast, places and tracks. Read every scoped card in full, including all variants and inherited wiring. Consult author retrieval notes as evidence, without adopting the author's rationale.

Retrieval status at scan time: **ready**, 2,494 records, no added/modified/deleted/moved blocks. During review, run `retrieve related --draft` on single-card extracts for suspected duplicate premises and inspect the original hits; record queries and decisions. An index rebuild or paid indexing run is unnecessary for this scan.

Write concrete checklist defects with an actionable fix and evidence. Reject canon, safety, class, plot-safety or blocking duplicate defects, or when more than about one in five cards has an issue; otherwise accept with polish. Save separate scoped JSON verdicts and notes without overwriting self-review or historical rejection evidence. The critic does not edit card sources. Any subsequent author fixes require retrieval where meaning changes, localization updates, bundle regeneration and the applicable project checks before re-review.

For the actual pass, validate with the existing batch tooling and narrow state/variant probes where needed; report incomplete checks honestly. For this planning-only change, inventory consistency checks and `node tools/grim.js check` are the validation; no full verification or gameplay acceptance is claimed.

## Scan validation result

Inventory consistency passed: 135 unique queued IDs exist in their recorded source files; re-review scopes contain 284 and 36 current IDs. `node tools/grim.js check` exited 0: build and format checks completed, lint reported 0 errors and 7 existing warnings, and 200 random-policy games completed with 0 crashes. The regenerated content bundle has no Git diff. Full verification was not run for this documentation-only plan.
