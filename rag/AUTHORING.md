# Source evidence for authoring

Use these tools from the project root with any compatible coding-agent harness or
model. Read the relevant canon and existing scenes before drafting; generated
graph descriptions aid discovery and are not canon. Original sources retain
conditional outcomes and fact unlock conditions.

## Authoring loop

Retrieval is a required step of event authoring (the workflow, skip rule and
fallback are in `skills/write-academy-events/SKILL.md`):

1. `search` the one-line premise before drafting; read close hits with `grim show`.
2. Draft the card.
3. `related --draft` on each card, one card per file; read the top 2–4 results.
4. Rework any card whose premise, options or punchline repeat an existing card.
5. Synchronize with `retrieve index` at the end of the session, after final edits.

Frozen experiments in [EVALUATION.md](EVALUATION.md) follow their trial's own instructions instead.

## Find evidence

```sh
npm run grim -- retrieve search "a stable favour that costs study time" --limit 10
```
Use `search` before drafting to find relevant worldbook entries and existing premises.

```sh
npm run grim -- retrieve related --draft content/events/draft.grim
```
Use `related` to find existing premises resembling a draft; inspect candidates rather than treating the ranking as a duplicate verdict.

## Inspect evidence

```sh
npm run grim -- retrieve read npc:lyra --budget 12000
```
Use `read` to inspect complete original blocks, including every branch and condition.

```sh
npm run grim -- retrieve neighbors npc:lyra --limit 20
```
Use `neighbors` to inspect bounded, typed static references; references do not prove runtime reachability.

```sh
npm run grim -- retrieve brief "a library discovery with a cost" --place library --budget 24000
```
Use `brief` to assemble original evidence and dependencies into a bounded packet.

All commands support `--json`. Search defaults to ten matches, evidence packets
to 24,000 characters, and neighbors to twenty edges. Evidence limits apply at
complete-block boundaries; omissions and required evidence that does not fit are
reported explicitly. Resolve incomplete required evidence with separate reads.
Ordinary `query`, `show`, `graph`, and `brief` remain available for structural
inspection. Automatic receipts are saved in `rag/receipts/retrieval.jsonl`; retain
your harness's native transcript as well when auditing other tool access.

## Maintain the index

```sh
npm run grim -- retrieve status
```
Use `status` to check readiness without making model requests.

```sh
npm run grim -- retrieve index --dry-run
```
Use the dry run to inspect added, edited, deleted, and moved blocks without model requests.

```sh
npm run grim -- retrieve index
```
**Run incremental synchronization at the end of every content-writing session,
after final source edits.** Synchronize explicitly mid-session when fresh retrieval is needed.
Until then, `search`, `brief` and `related` answer from the last synchronized snapshot and
print a notice: new blocks are not searchable yet, edited blocks rank by their synced
text, deleted blocks are hidden. An unbuilt index, a changed build configuration and
frozen experiments still fail closed.

```sh
npm run grim -- retrieve index --resume
```
Use `--resume` after an interrupted update, with the same source and build configuration; the previous revision remains active until publication.

Each published sync then deletes the index data it no longer needs: older revisions, and indexes from earlier
build configurations. `retrieve prune --dry-run` lists what would go; `index --keep-old` skips it. See
[README.md](README.md).

```sh
npm run grim -- retrieve index --rebuild --mode sync
```
Use this for initial construction or changed extraction configuration;
it submits paid model work and may take hours. An unbuilt index blocks authoring:
rebuild it before drafting, in the background, without editing `content/` until it
publishes (the procedure is in `skills/write-academy-events/SKILL.md` §2). Searches never index content.
An embedding change rebuilds vectors; keyword and reranker changes do not rebuild
the graph. No backend fallback is used.

**Don't edit `rag/src/retrieve.js`, `catalog.js` or the adapter files casually**
(`adapters/lightrag.js`, `process.js`, `credentials.js`, `model-aliases.json`,
`lightrag_*.py`). They are hashed into the index identity: any change orphans the
built index and forces a paid rebuild. Put fixes in modules outside that list,
such as `cli.js` or `snapshot.js`.

See [README.md](README.md) for setup, presets, cache behavior, and recovery, or
[EVALUATION.md](EVALUATION.md) for controlled comparisons and frozen experiments.
Frozen experiment instructions take precedence over everyday synchronization.
