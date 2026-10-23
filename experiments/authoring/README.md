# Controlled authoring experiments

Authoring and judging happen in coding-agent harnesses. These tools prepare
inputs, capture evidence, import results and support one human reviewer. They do
not start models, automate judging, change production batch acceptance, or promote
experimental cards. Every attempted trial stays in the report.

## Protocol and first setup

Read the [retrieval guide](../../docs/authoring/retrieval.md) and explicitly prepare
optional framework dependencies. All four candidate workflows must be available
in the same environment before running a verified framework comparison. Record
the exact author model, harness version and any exposed reasoning/configuration
settings. The comparison holds those settings fixed; a different author/harness
requires a separate comparison block. A subscription identity is not a model ID.

`tasks.json` contains twelve frozen task prompts across six categories: voice,
novelty, conditional callbacks, queued chains, course trades/checks, and lore.
Prompts reference worldbook entities instead of duplicating their lore. Development
and held-out prompts never appear together in an author workspace. The preparation
tool includes working changes in the source snapshot; it does not assume HEAD is
the user's intended corpus. Reviews, experiment labels, data and secrets are not
copied. Generated bundles exist for validation but may not be read for retrieval.
Use `--required-sources FILE` to freeze an evaluator-only JSON map from task IDs
to known required `kind:id` arrays. Reports compare those IDs with returned
retrieval IDs and any human-resolved native source reads. This reference set is
partial and is never included in author or judge inputs.

```bash
node tools/grim.js author-eval environment --config /absolute/path/retrieval.json --out /absolute/path/environment.json
node tools/grim.js author-eval prepare --out experiments/authoring/runs/pilot --harness codex --harness-version EXACT_VERSION --model EXACT_MODEL --config /absolute/path/retrieval.json --environment /absolute/path/environment.json
```

The environment probe records installed versions, local weights and Python
dependencies without API calls. A study prepared without that manifest is useful
for fixtures/exploration but its imported trials cannot become verified. Confirm
the registered environment remains unchanged at every invocation.

Screening prepares 24 trials: six development tasks × four workflows. Confirmation
uses `--phase confirmation --finalists grim,qmd` and prepares six new held-out
tasks × two workflows × two repetitions (24 trials). A component test uses
`--phase ablation --factor dense|rerank|graph|descriptions`: six tasks × two profiles
× two repetitions (24 trials). It never constructs a full combinatorial grid.
Use a fresh output directory each time; preparation refuses to overwrite one.

`schedule.md` randomizes execution order. `private.json` and `source-manifest.json`
are evaluator records, not author context. `trials/<id>/` are independent writable
copies. Each receives the same common instructions, byte-identical task prompt,
and its condition-specific workflow. The snapshot, common instructions, tool code,
models and configuration are fingerprinted. The default randomization seed is
20261021; a repetition number is not a sampling seed.

Index builds are explicit, potentially paid operations. Build each backend against
the experiment's `snapshot` using the shared experiment cache before author trials:

```bash
node tools/grim.js retrieve index --root experiments/authoring/runs/pilot/snapshot --cache experiments/authoring/runs/pilot/cache --backend grim --config /absolute/path/retrieval.json
```

Repeat for QMD and LightRAG. For ablations, build both assigned profiles. Once a
study is prepared, do not change its tool implementation, source snapshot, model
settings or framework versions. New snapshots/configurations mean new studies.

## Manual harness runs

Start a genuinely fresh session in the trial directory. Supply its
`authoring-input/prompt.md` verbatim. Keep the same permission/configuration
settings and available tool surface across workflows. Disable unrelated memories,
prefetches, plugins and network exploration consistently where the harness allows
it; otherwise document their presence and audit any exposure. Fresh session IDs
alone cannot prove hidden context was absent.

Installed CLIs can export native events (`codex exec --json` or Claude Code
`--print --output-format stream-json --verbose`). You invoke them yourself, using
the same model and captured prompt. Codex copies without `.git` need
`--skip-git-repo-check`. Never use resume/fork/continue for a new trial. Interactive
exports can be imported if they contain equivalent complete events; otherwise
the trial is exploratory/unverifiable. No permission-bypass flags are required.

The author writes only `content/events/trial.grim` and optional
`content/world/lore/soft/trial.grim`. Record artifacts from the evaluator's main
workspace (replace TRIAL_ID and DIR with actual values):

```bash
node tools/grim.js author-eval draft TRIAL_ID --experiment DIR --stage first --files content/events/trial.grim
node tools/grim.js author-eval validate TRIAL_ID --experiment DIR
node tools/grim.js author-eval draft TRIAL_ID --experiment DIR --stage repair1 --files content/events/trial.grim
node tools/grim.js author-eval validate TRIAL_ID --experiment DIR
node tools/grim.js author-eval freeze TRIAL_ID --experiment DIR
```

Include the soft-lore file in `--files` if used. Preserve the first draft before
checks; allow at most repair1 and repair2, guided only by deterministic `grim check`
feedback. Freeze before outside critique. Output card counts, source integrity and
artifact hashes are checked. Failed validation remains an outcome, not a reason
to erase the attempt. English experiments remain quarantined; normal translation
and content acceptance apply only after you select a card for actual adoption.
If the harness stops before creating any output, record
`author-eval fail TRIAL_ID --experiment DIR --reason "..."`; this creates a
reviewable failed attempt. Existing partial drafts must be preserved and frozen
through the regular path instead.

## Trace import and audit

Native traces and auxiliary receipts are complementary. The wrappers log actual
retrieval stages, result digests, source IDs, index/profile fingerprints, errors,
latency and provider usage when available. They keep credentials out of receipts.
Limits are 24,000 source characters per brief and 96,000 returned evidence
characters per trial. The audit also counts available native command output;
missing native read outputs must be resolved rather than treated as zero cost.
Reads confined to frozen common rule files have a separate `commonRuleChars`
counter; `observedContextChars` includes both. Bundled rule text in a baseline
brief still contributes to that brief's actual output size.
The common stopping rule is at most 120 tool calls and two repair passes; keep
an unfinished attempt in the report when its allowance runs out.

```bash
node tools/grim.js author-eval trace TRIAL_ID --experiment DIR --format codex --file /absolute/path/native.jsonl --attestation /absolute/path/invocation.json
node tools/grim.js author-eval audit TRIAL_ID --experiment DIR
```

The human invocation attestation contains `by: "human"`, `freshSession: true`,
`complete: true`, and the run's `promptHash`, `commonHash`, `workflowHash`,
`sourceHash`, `model`, `harnessVersion`, `settingsHash`, and `environmentHash`. Optionally include the
native `session` ID. Confirm these against the actual invocation/export; copying
the expected values without checking does not verify the experiment.

The importer supports Codex JSONL, Claude stream JSON, and a normalized JSONL
format with `start`, `end`, `command`, `read`, `write`, `tool`, and `external-access`
events. Normalized imports also require human completeness attestations.
Unknown commands/tools have hashes in the audit output. A `--resolutions FILE`
maps hashes to `{by:"human", allowed:true|false, reason:"..."}`.
Optional `returnedChars` and `sourceIds` record manually checked native reads.
For unknown commands/tools, `returnedChars` is required (zero when there was no
additional source output beyond already bound retrieval receipts).
Resolutions cannot excuse a detected contradictory component configuration. Incomplete exports, missing
tool invocations, unsupported accesses, or missing identity evidence remain
unverifiable. Explicit bypasses, contamination and source/config mismatches are
violated. Neither category supports a causal ablation claim.

Reports retain every attempt, separately showing adherence, quality, repairs,
usage/cost when known, and returned context. Unknown API costs remain null; no
price is fabricated. Scope of verification is observed traces plus human
attestation, not inaccessible provider internals or proof of unlogged I/O.

## Critics, panels and critic-workflow comparisons

```bash
node tools/grim.js author-eval critic-packet TRIAL_ID --experiment DIR --out /absolute/path/packet.json
node tools/grim.js author-eval critic TRIAL_ID --experiment DIR --file /absolute/path/verdict.json
```

Each critic gets a fresh session, the frozen artifact/task, the same rubric in
`critic.md`, and the source snapshot. No author reasoning, workflow identity,
other opinions or human verdicts. Findings cite source IDs and exact hashes and
need a concrete correction. Unsupported claims use `insufficient-evidence`.
The import verifies artifact, rubric and evidence bindings. Similar findings are
grouped by event/branch/rule/issue key; preserve original judgments and mark
remaining duplicates through adjudication.

An optional panel uses exactly three distinct registered families. Its members
file is a JSON array of `{model,family,harness,harnessVersion}` records. Prepare
counterbalanced A/B and B/A packets, then start each judge session manually:

```bash
node tools/grim.js author-eval panel-prepare --experiment DIR --members /absolute/path/members.json
node tools/grim.js author-eval panel-import --experiment DIR --file /absolute/path/panel-result.json
```

Packet JSON includes its ID, prompt/rubric hashes and ordered artifact hashes.
Return `packet`, the registered model/family/harness/harnessVersion, `rubricHash`,
`artifactHashes`, `preference` (A/B/tie/both-unacceptable/uncertain), and findings
with a `candidate` field (A or B). The importer binds identities and sources and
preserves individual votes. Model agreement is not truth or adoption.
Include `invocation: {by:"human", freshSession:true, session:"EXACT_SESSION_ID",
promptHash:"PACKET_PROMPT_HASH"}` after checking the actual judge invocation.
Reusing a judge session for another packet is rejected.

To compare critic workflows, add `--critic-workflows /path/a.md,/path/b.md` to
panel preparation. Both instructions operate on the exact same frozen cards,
common rubric and source snapshot; no cards are regenerated. Keep all other
judge settings fixed. This tests critic instructions, not generation quality.

## Sole-human review

```bash
node tools/grim.js author-eval review --experiment DIR
node tools/grim.js author-eval report --experiment DIR --out /absolute/path/report.json
```

Open the printed `http://127.0.0.1:PORT` URL. It is a separate local tool, not the
game or `/admin`. State persists on disk; export JSON/Markdown at any time.

1. Review every anonymous presentation and every branch. Record an independent
   accept/revise/reject/uncertain assessment plus four 1–5 ratings before seeing
   critic opinions or validator reports. Do not infer hidden workflow identities.
2. Inspect sources and findings. Mark each group valid, invalid, duplicate,
   preference, or unresolved with reasons. A duplicate points to its underlying
   group. Keep taste separate from factual defects. Final assessments are stored
   alongside the original, rather than replacing it.
3. Compare matched task/repetition pairs; ties and both-unacceptable are valid.
   A concealed repeat sample measures within-reviewer consistency, not agreement
   among humans. Lock judgments only after all presentations and findings are
   assessed; this reveals workflow/model identities.
4. Record adoption only from locked confirmation results with verified selected
   trials and no unresolved/confirmed serious findings. You alone decide.

Primary outcome is your assessment, with serious findings reported separately.
Pairwise summaries bootstrap task means (10,000 resamples, recorded study seed)
to respect repeated trials. Small samples remain inconclusive. Precision is
relative to adjudicated findings; coverage is not an exhaustive defect count.
Prefer the simpler/cheaper workflow when quality is practically tied or uncertain.

## When to ablate

Resolve a concrete critic disagreement with source evidence and, when useful, a
targeted state reproduction. Fix clear correctness bugs directly. Add generation
repetitions when variation dominates. Use an ablation when a package difference
cannot be attributed to one component and identifying its contribution would
change adoption, or when an expensive component's benefit is uncertain.

Predeclare the factor and budget, rebuild affected indexes, hold other settings
fixed and inspect actual traces. Removing graph expansion removes the automated
cross-card expansion, not the author's reasoning from visible sources. Changing
the description flag without rebuilding enriched embeddings is invalid.

HippoRAG 2, LinearRAG and Psi-RAG remain follow-up candidates, not hidden baseline
components. The research basis is contextual retrieval/A-RAG and independent
panel judging (PoLL); none establishes performance on this corpus without trials.
