# Controlled authoring evaluation

New studies compare the ordinary baseline (`brief`, structured `query`, `show`,
`graph`, and file inspection) with LightRAG plus those common tools. Any compatible
coding-agent harness/model may author or judge; record its exact version, model,
reasoning settings and repair allowance and hold them fixed within a comparison.
Old four-condition experiments, frozen cards, transcripts, ratings and reviewer
archives remain historical data and can still be imported and inspected.

Use [AUTHORING.md](AUTHORING.md) for commands, [README.md](README.md) for setup,
and [WORKSPACES.md](WORKSPACES.md) for segregated batch runs. Setup never builds
an index or launches agents. Preparing a retrieval workspace can build a paid
index, so do this separately from offline smoke validation.

## Independent trials

The twelve frozen prompts in `evaluation/tasks.json` have one development and one
held-out task per category: voice, novelty, continuity, chains, mechanics and lore.
New screening is six development tasks × two workflows = 12 trials; confirmation
is six held-out tasks × two finalists × two fresh repetitions = 24 trials. Treat
whole workflows as packages; these comparisons do not identify a component's
causal contribution. Legacy component-ablation preparation is retired.

```sh
npm run grim -- author-eval environment
npm run grim -- author-eval prepare --out rag/runs/STUDY --harness HARNESS --harness-version EXACT_VERSION --model EXACT_MODEL
npm run grim -- author-eval packet TRIAL --experiment rag/runs/STUDY
npm run grim -- author-eval handoff TRIAL --experiment rag/runs/STUDY
```

Finish the declared task and required-source references before starting. Every
trial uses a fresh session and separate writable copy of the same frozen current
source, including relevant uncommitted files. Common prompts, rules, budgets,
validators and tools are fixed; only workflow instructions differ. Do not expose
other drafts, findings, labels or held-out prompts. Frozen retrieval uses the
starting snapshot; do not synchronize experimental drafts into it.

The handoff creates instructions and a launcher; you start the harness manually.
Preserve the first draft, then allow at most two repairs using deterministic
validator feedback. Record `draft`, run `validate`, record repairs and `freeze`;
failed/no-output attempts are retained with `fail`. Outside critique begins only
after freeze. Do not translate/adopt experimental cards unless specifically
requested by the operator. No gameplay golden refresh is authorized by a trial.

```sh
npm run grim -- author-eval draft TRIAL --experiment rag/runs/STUDY --files content/events/trial.grim
npm run grim -- author-eval validate TRIAL --experiment rag/runs/STUDY
npm run grim -- author-eval freeze TRIAL --experiment rag/runs/STUDY
npm run grim -- author-eval trace TRIAL --experiment rag/runs/STUDY --format codex --file NATIVE.jsonl
npm run grim -- author-eval review --experiment rag/runs/STUDY
npm run grim -- author-eval report --experiment rag/runs/STUDY
```

Trace imports support Codex JSONL, Claude structured exports and equivalent
normalized interactive exports. Keep original bytes. Record source hashes,
retrieval receipts, returned IDs, actual stages/models, cache use, errors, costs
when available and final artifact hashes. Audit outcomes are verified, violated,
or unverifiable. Unknown shell operations and incomplete transcripts need manual
resolution. Retrieval receipts alone cannot establish absence of other access.
Report adherence separately from quality and retain every attempted run.

## Human review and critics

You assess each anonymous artifact before seeing critic opinions or validators.
Preserve initial judgments and later adjudication separately. Review complete
cards, branches, linked variants and cited sources. The current batch interface
uses a rating, world fit (yes/partial/conflicted) and optional notes, autosaved.
Archive a reviewer's results before resetting for the next reviewer. Do not expose
workflow identity before locking judgments. Concealed repeats measure
within-reviewer consistency, not agreement between people.

Optional independent critics receive identical task, frozen cards, rubric and
source snapshot, but no author reasoning, workflow identity, other critic views
or human verdicts. Each finding names a card/branch, defect, rule, evidence,
severity and concrete correction; permit insufficient evidence. Preserve all
original findings while grouping underlying defects. You adjudicate as valid,
invalid, duplicate, preference or unresolved. Optional panels use three separately
configured model families, fresh sessions and counterbalanced A/B order. No
silent substitutions or automatic adoption. For critic-workflow comparisons,
reuse the same frozen cards rather than regenerating authors' output.

Primary outcomes are human quality judgments and confirmed serious defects.
Secondary measures include paired preference, critic precision/coverage,
retrieval-source coverage, repair count, context size, latency, costs and adherence.
Summaries must pair by task and respect repetitions. Small or mixed results stay
inconclusive; inspect factual disagreement against sources, record style
preferences separately, and add repetitions for unstable outcomes. Only run a
predeclared component ablation if its answer changes adoption; rebuild affected
caches and hold all other settings fixed. Adoption requires your recorded decision
after confirmation and serious-finding resolution. Prefer simpler/cheaper tooling
when quality is practically tied. Production acceptance policy remains unchanged.
