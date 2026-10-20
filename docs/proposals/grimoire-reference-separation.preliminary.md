# PRELIMINARY — proposal for two-stage language-reference loading

> REVIEW ONLY. Not approved, not active, and must not be used to write or revise game content. The existing writing skill and references remain in effect. All suggested instructions and paths below describe a possible future workflow.

Prepared 2026-10-15 for review by another coding agent. Companion: [preliminary compact reference](grimoire-events-compact.preliminary.md).

## 1. Objective and scope

Reduce the language-reference material loaded for ordinary event authoring while preserving exact syntax, important defaults, and an explicit route to specialized behavior. Support agents using ordinary repository reads in Codex or Claude Code; no custom retrieval harness is assumed.

This proposal concerns the language reference only. It does not replace the writing skill, style/cost/check/pool guidelines, design, canon brief, translation glossary, or required validation. It proposes no language, engine, balance, or content changes.

The two stages are **load the compact event reference**, then **retrieve the required complete-reference passages**. They are not two different versions of the language.

## 2. Proposed document responsibilities

| Document | Responsibility | Proposed loading |
|---|---|---|
| Compact event reference; candidate future path `docs/authoring/event-language.md` | Current syntax and behavior needed for ordinary cards; a small grammar example; retrieval conditions with exact source locations | Read fully before event writing |
| Existing `docs/grimoire-script.md` | Complete language and behavior reference, including specialized blocks, configuration, tooling, and clearly marked compatibility behavior | Read the relevant passages when a feature or uncertainty requires them |
| Existing authoring docs and writing skill | Writing quality, how choices trade, how checks are pitched, workflow, canon retrieval, and acceptance | Existing requirements continue; this proposal does not consolidate them |

Keep the complete reference at its existing path. Initially, do not fragment it into many files or renumber its sections: existing links and direct agent retrieval already depend on it. The compact layer is a curated reading view, not a second independent specification.

## 3. What belongs in the compact layer

Include block layout and indentation; card/menu options; ordinary event fields; trigger and draw-source distinctions; common expressions and effects; tier/preset use; current challenges and chance syntax; casting, pronouns and text variants; repeat bookkeeping; follow-up queues; track effect basics; and the minimum clue/clock safety distinction.

Keep behavior that changes the meaning of otherwise valid text explicit: hidden versus disabled options, `slot:` versus `time:`, once versus repeat/per-character bookkeeping, `queue now` versus next month, `defer` versus failed `when`, and automatic costs already charged by the engine.

Retrieve before using specialized features: exact check/combat arithmetic; spell options and learning; milestone ramps; generated menus; variable assignments and state lifecycle; scheduling windows; off-campus letters and midnight visits; facts/memories/inter-NPC relations; new worldbook blocks; endings; `.lang`; and configuration changes. Some common syntax may appear in both layers; the compact layer must point to its complete definition.

Do not copy canon or mutable balance tables into the compact reference. Use schematic placeholders for syntax, retrieve IDs and voices through the existing brief workflow, and keep numbers in the existing generated presets/reference sources.

## 4. Direct retrieval contract

Each compact section carries an inclusive, one-based source span such as `docs/grimoire-script.md:430-460`, plus an exact heading or distinctive label. The compact draft includes a lookup table for omitted features. A line number points to text to read; it is not a substitute for reading it.

An agent can use a line-range file reader, or execute this from the repository root:

```bash
sed -n '430,460p' docs/grimoire-script.md
```

The draft records the full source SHA-256 and date. If the source changed, or a span no longer contains its named section, relocate the section before relying on the passage:

```bash
rg -n '^##|^###|^\*\*' docs/grimoire-script.md
```

Read enough surrounding text to include a whole table, code block, or rule. Do not copy a legacy example just because it appears in the retrieved range. If two passages disagree, consult the design and implementation and record the discrepancy; do not let a compact paraphrase silently settle it.

Line numbers are deliberately tied to a source snapshot. On adoption, updating the full reference must include refreshing affected compact pointers and the fingerprint. This is a maintenance obligation for the coding agent, not an assumed tool capability. A small checker could be proposed later; none is introduced here.

## 5. Complete-reference separation plan

The first separation is editorial: the compact layer selects current event language; the complete file stays intact. Before adoption, reconcile stale statements and mark current versus compatibility material clearly. A later reorganization of the complete file is optional and should refresh all pointers in the same change.

| Existing complete-reference material | Treatment |
|---|---|
| §1; event portion of §2 | Compact layout and core event rules; retrieve unusual properties |
| Remaining §2 blocks, including game settings | Full reference only, with explicit lookup triggers |
| §3 expressions | Common operators/functions in compact; full catalog and special cases retrieved |
| §4 effects and tokens | Current common forms in compact; assignments and uncommon behavior retrieved |
| §5 v0.2 deck | Compatibility reference only; do not present as the current academy day |
| §5b translations | Full reference retrieved for translation work; no removal of the workflow's translation requirement |
| §6 patterns | Short queue/flag patterns in compact; scene/canon examples stay in their existing sources |
| §6a numbers/options | Current challenge grammar and variants in compact; formulas, specialized effects and compatibility details retrieved |
| §6b worldbook | Full reference only; retrieve before adding or modifying canon definitions |
| §6c world loop | Core routing and track statements in compact; detailed scheduling, systems and configuration retrieved |
| §§7–7b validation/tools | Full reference; required commands remain in the writing workflow |
| §8 art/tags/bonds | Small bond vocabulary in compact; full art/tag lists retrieved |

## 6. Discrepancies for the reviewing agent

These are observed issues in the reference snapshot, not fixes made by this proposal. Verify against design, parser and engine before adopting the draft.

| Location in `docs/grimoire-script.md` | Observation / review needed |
|---|---|
| Lines 37-68, §2 event example | Uses legacy `easy`/`hard` challenge words despite the current authoring guidance requiring the ladder. The compact example uses a rung. |
| Lines 23 and 464-478 | The early block-kind list omits later worldbook kinds. Avoid claiming that early list is exhaustive. |
| Lines 248 and 524 | `turn` is described as 1–47 and 1–48. The compact draft avoids hardcoding a run length. |
| Lines 304 and 430-440 | The short odds explanation refers to the older expected-skill/tier description. Current ladder semantics are described later. |
| Lines 421-424 versus lines 28-29 | A challenge example contains inline comments although the syntax rules disallow end-of-line comments. New schematic examples omit them. |
| Lines 466 and 554-572 | The worldbook introduction says `passed()` and `clue()` are always false until phase 2b, while later sections describe active track/clue behavior. Do not preload that historical sentence as a current rule. |
| Lines 436 and `docs/authoring/checks.md`, “Drift: more significant, less drift” | Clarify the interaction between class defaults and repeatable story/milestone cards. The draft requires retrieval for this case rather than inferring precedence. |
| Lines 552 and 432-433 | The cast example uses `vs friend.duel`, while check guidance says the opposing stat should match the tested skill. Review that example before recommending it. |

The separate discussion draft `docs/dc-guideline-proposal.md` is not an authority for this proposal. Proposed or unimplemented mechanics must not be introduced through documentation compaction.

## 7. Token budget and expected savings

The complete reference at this snapshot contains 58,981 Unicode characters: roughly 14.7k tokens at characters ÷ 4. This heuristic is not a model-tokenizer measurement. Aim for a 3–5k-token compact reference, including its retrieval map and provenance. Measure the companion after editing rather than assuming it meets the target.

That would save roughly 10–12k tokens on an ordinary assignment needing no specialized language passage. It does not imply that every assignment saves that amount: retrieved passages add tokens, and the other writing guidelines and task brief still need context. No authoring quality or latency improvement has been measured.

Measured companion draft: 20,883 Unicode characters, approximately 5.2k tokens by the same heuristic, including the preliminary notice, source fingerprint and retrieval map. This is slightly above the 3–5k target. Relative to the complete reference it removes about 65% of the characters before any retrieval. Review should prioritize semantic coverage over trimming the remaining roughly 900 characters needed to reach the upper target. The proposal itself is approximately 3k tokens and is separate from that authoring footprint.

Keep the proposal itself out of an eventual writer's preload. Its review notes, discrepancy inventory, and adoption procedure belong to reviewers.

## 8. Review and adoption procedure — not performed

1. Check the compact draft against the full reference, design, parser, engine and director. Resolve the discrepancy list first. Classify each statement as a faithful condensation, a necessary correction, or a proposed policy; do not mix these silently.
2. Check coverage using representative tasks: ordinary place card; course card at a higher level; generic social card with `per:`; queued chain carrying a character; hidden/locked menu; repeat variants; job wage; and a specialized spell, letter or plot card. Confirm the compact text tells the agent when to retrieve missing details.
3. Parse representative syntax examples in memory, and use the existing project checks. Confirm defaults and effects against implementation; a parse pass alone cannot establish behavioral correctness.
4. Measure token counts with the intended model's tokenizer if available, using the same tokenizer for full and compact text. Count retrieved passages and other required guidelines separately.
5. If desired, compare loading strategies on the same preserved authoring tasks and canon snapshots. Look for invalid syntax, missed retrieval, rule violations, token use and review corrections. Do not claim equivalence from document size alone.
6. Only after review and approval, promote the compact draft to its chosen active path, refresh full-reference pointers/fingerprint, and change the writing skill's initial-read instruction. Keep the full reference available. Update related entry points only as needed; do not replace quality guidelines with this language sheet.

Candidate replacement wording for the writing skill, **for review only**:

> Read the compact event-language reference fully. It covers ordinary current event syntax. Before using a feature listed for retrieval, or when its behavior is uncertain, read the indicated complete-reference lines. If source lines have moved, relocate by heading. Continue to read the required authoring guidelines and retrieve the relevant canon and existing cards. Do not infer syntax or defaults from omitted material.

## 9. Status of this delivery

Only this proposal and its companion preliminary reference are added. No active instruction points to them; the complete reference, skills, engine, content and generated schema are unchanged by this proposal. Structural validation and project-check outcomes are reported with the delivery; they do not make these drafts approved authoring material.

Validation on 2026-10-15:

- Both files have preliminary/non-authoring notices; local Markdown links and balanced code fences checked.
- All 54 complete-reference spans in the compact draft are within the 672-line source; fingerprint and selected retrieval labels checked. The proposal has one additional example span.
- The single schematic `grim` block parses in memory with `src/grimoire.js`. This establishes syntax only, not balance or authoring acceptability.
- `node tools/grim.js docs --check` passed in a temporary copy.
- `node tools/grim.js check` passed in that copy: lint had 0 errors and 9 localization warnings; 200 random simulations had 0 crashes. Warnings include token mismatches and 73 stale translations in the copied working content. This is not an authoring-equivalence experiment.
- The working directory already had unrelated in-progress changes, and its generated bundle was stale. The temporary copy allowed the required check to rebuild without overwriting that bundle. The full-reference fingerprint stayed unchanged during this work.
