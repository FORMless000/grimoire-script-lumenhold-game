# Source evidence for authoring

Run these from the project root, with any compatible coding-agent harness or model. Grim RAG is the default; the commands below are unchanged. Generated search descriptions aid discovery and are not canon; original sources keep conditional outcomes and fact unlock conditions.

## When retrieval is required

Retrieval is a required step of authoring: for every new card, and every edit that changes a card's premise, options or outcomes.

- **Skip it** only when the change can't introduce or duplicate a premise: typo or wording fixes, tier or balance retunes, translations, renames, mechanical migrations. Write a one-line reason in the batch notes ("retrieval skipped: tier retune only"). When unsure, run it: doubt counts as required.
- **Before drafting, check `retrieve status`.** An unbuilt index (a first build, or a changed build configuration) is rebuilt first: `retrieve index --rebuild --mode sync`, below. Never draft cards without retrieval; `grim brief` and `grim dupes` supplement it and don't replace it. If retrieval can't run at all (no key, the provider down), report it and stop before drafting.
- **A stale index is fine:** searches answer from the last synced snapshot and print a notice.

## The loop

1. **Search the premise before drafting:** `search "<one-line premise>"`. Read anything close in the top results with `node tools/grim.js show <id>`. If the premise is taken, pick another, or a clearly different angle.
2. **Draft the card.**
3. **Check each draft for duplicates**, one card per file: `related --draft <file>`, then read the top 2–4 results. The tool lists similar premises to inspect, not a duplicate verdict: you judge, but you must look. Rework any card whose premise, options or punchline repeat an existing card.
4. **Record it** in the batch notes (`build/batches/<name>.notes.md`): the queries you ran and any rework, so the critic can check them.
5. **Synchronize** with `retrieve index` at the end of the session, after final edits.

## Find evidence

```sh
npm run grim -- retrieve search "a stable favour that costs study time" --limit 10
npm run grim -- retrieve related --draft content/events/draft.grim
```
`search` finds relevant worldbook entries and existing premises; `related` finds existing premises resembling a draft (inspect candidates; the ranking is not a duplicate verdict).

## Inspect evidence

```sh
npm run grim -- retrieve read npc:lyra --budget 12000        # complete original blocks, every branch and condition
npm run grim -- retrieve neighbors npc:lyra --limit 20       # bounded, typed static references (not proof of runtime reachability)
npm run grim -- retrieve brief "a library discovery with a cost" --place library --budget 24000   # evidence and dependencies in one bounded packet
```

All commands support `--json`. Search defaults to ten matches, evidence packets to 24,000 characters, neighbors to twenty edges. Limits apply at complete-block boundaries; omissions, and required evidence that doesn't fit, are reported explicitly: resolve them with separate reads. Ordinary `query`, `show`, `graph` and `brief` remain available for structural inspection. Receipts are saved in `rag/receipts/retrieval.jsonl`; keep your harness's native transcript as well when auditing other tool access.

## Maintain the index

```sh
npm run grim -- retrieve status              # readiness, without model requests
npm run grim -- retrieve index --dry-run     # added, edited, deleted and moved blocks, without model requests
npm run grim -- retrieve index               # incremental sync
npm run grim -- retrieve index --resume      # after an interrupted update (same source and build configuration)
npm run grim -- retrieve index --rebuild --mode sync   # initial construction or a changed extraction configuration
```

- **Run the incremental sync at the end of every content-writing session, after final source edits**; sync explicitly mid-session when fresh retrieval is needed. Until then `search`, `brief` and `related` answer from the last synced snapshot with a notice: new blocks aren't searchable yet, edited blocks rank by their synced text, deleted blocks are hidden. An unbuilt index or a changed build configuration still fails closed.
- `--resume` keeps the previous revision active until publication.
- Each published sync deletes index data it no longer needs: older revisions, and indexes from earlier build configurations. `retrieve prune --dry-run` lists what would go; `index --keep-old` skips it.
- **A rebuild** submits paid model work: run it in the background and wait, and don't edit `content/` while it runs (a source change stops it from publishing). Grim updates reuse unchanged descriptions and vectors; no extracted graph is maintained. Searches never index content. Reranker changes don't rebuild the index. No backend fallback is used; a busy reranker falls back to the next in `rag/src/models.json` (announced). The optional LightRAG backend's recovery details remain in `rag/README.md`.

**Don't edit index-identity files casually.** Grim hashes `grim-retrieve.js`, `catalog.js` and `adapters/grim.js`; LightRAG hashes `retrieve.js`, `catalog.js` and its adapter support files. Changing these requires a rebuild. Put interface fixes in `cli.js` or `snapshot.js` where possible.

Setup, presets, cache behaviour and recovery: [README.md](README.md).
