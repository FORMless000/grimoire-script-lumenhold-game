# Controlled authoring trial

This is a quarantined English authoring experiment, not a production content batch.
Follow the supplied task exactly. Use the repository authoring specification and
worldbook. Read the common rule files listed in `docs/authoring/README.md`, plus
the language reference. Authoring principles are unchanged. The assigned workflow
replaces only the retrieval step of the normal authoring skill.

Start in a fresh session. Do not resume, fork, delegate, browse the web, read host
memories, inspect experiment labels/reviews/receipts, or read sibling trial outputs.
Use only this workspace, its frozen source evidence through the retrieval tools,
and the supplied task/common/workflow inputs. Do not inspect generated bundles to
obtain the whole card corpus. Targeted source reads are allowed and must remain in
the native trace. Unknown commands require human audit rather than an assertion
that the trial complied.

Write new cards to `content/events/trial.grim`; optional proposed soft lore goes
in `content/world/lore/soft/trial.grim`. Do not edit existing content, rules, tools,
translations, or instructions. Do not copy canonical lore into the final rationale.
Keep facts and possible outcomes distinct, and preserve all relevant unlock gates.

Record the first draft before validation, then use the same `node tools/grim.js
check` feedback for at most two self-repair passes. Record each repair separately.
Do not obtain external critique or repair from another model before freezing.
The experiment tools' `draft`, `validate`, and `freeze` commands preserve these
artifacts. An unsuccessful trial is retained; do not quietly restart it.

Use at most 96,000 returned evidence characters, including targeted native reads;
each retrieval brief is limited to 24,000 characters. Record actual usage when
the harness exposes it. A repetition number is not a model sampling seed.
Shared rule files are accounted separately from the story-evidence allowance.
Stop after 120 tool calls, a frozen output, or exhaustion of the two repair passes,
whichever occurs first. Retain an unfinished artifact as an attempted outcome.

The native transcript must include the complete session, tool inputs/results,
and its terminal event. The human supplies invocation attestations where the
harness does not export the initial prompt or model configuration. Your own
claim that a feature was disabled is not verification.
