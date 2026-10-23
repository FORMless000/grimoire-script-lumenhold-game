# Authoring retrieval

These auxiliary tools return evidence for coding agents. They do not write cards,
choose canon, launch author/judge models, or alter the game. The old `brief`,
`query`, `show`, and `graph` commands remain the experiment baseline.

## Start without an API

```bash
node tools/grim.js retrieve index --profile lexical
node tools/grim.js retrieve search "an unpaid favor" --profile lexical --json
node tools/grim.js retrieve read npc:lyra,fact:lyra.mother --budget 12000
node tools/grim.js retrieve neighbors event:soc_borrow_money --json
```

`lexical` is an explicit diagnostic profile: no embeddings, contextual descriptions,
reranking, or automated graph expansion. It never silently replaces `full`.
For neighbors without an index, use the default full profile (the operation itself
does not call a model). Kind-qualified IDs avoid collisions between block types.

## Full Grim RAG

Fill `OPENROUTER_API_KEY=` in the repository-root `.env.local` file. This local
file is gitignored and read automatically by Grim RAG and the LightRAG adapter.
An exported `OPENROUTER_API_KEY` takes precedence. The file is parsed as data,
without shell expansion, and credentials are never included in configuration,
prompts or receipts. An explicit index
build calls the description helper and embedding API; search can call embedding
and reranking APIs. No authoring or evaluator model is launched by these tools.

```bash
node tools/grim.js retrieve index
node tools/grim.js retrieve search "concealing a friend's mistake" --limit 10 --json
node tools/grim.js retrieve brief "late revision" --cast lyra,kael --place library --budget 24000
node tools/grim.js retrieve related --draft content/events/trial.grim --json
```

Defaults are Qwen3 Embedding 8B, Qwen3 Reranker 8B, and Gemini 3.1 Flash Lite through
OpenRouter. `--config FILE` can set `models.embedding`, `models.reranker`,
`models.helper`; `--cache DIR` selects the cache location. Model changes, backend
configuration, implementation fingerprints and preprocessing identity separate
indexes. Changed contextual dependencies invalidate descriptions and embeddings.
Stale/modified indexes fail closed. API errors never trigger another scheme.

The profile choices are `full`, `lexical`, `no-dense`, `no-rerank`, `no-graph`, and
`no-descriptions`. `no-dense` removes only the dense channel; its other components
still operate. Build a profile's own index before querying it. An ablation cannot
reuse enriched vectors from the full profile.
`no-graph` also omits contextual source expansion during description generation;
its descriptions see the current block only. Explicitly requested cast/fact
evidence remains available. Thus this factor tests automated relationship
expansion during indexing and briefing, not the author's reasoning about sources.

## Sources, outputs and budgets

The catalog is parsed from English source blocks. It includes complete event
prose, choices and outcomes, plus worldbook and supporting state/hook definitions.
Translations, bundles, reviews, labels and experiment results are not indexed.
Original text, location, hash, fact unlocks, canon status and branch guards remain
available. Derived descriptions are explicitly separate from original evidence.

`search` accepts exact `--kind`, `--cast`, and `--place` filters. A match is a
candidate to inspect, not proof of similarity or canon. `read` fetches only the
requested blocks. `neighbors` defaults to twenty static edges and reports omitted
edges; these connections do not establish runtime reachability. `brief` accepts
`--required kind:id,...`, `--cast`, `--place`, `--track`, and `--arc`; explicit
roots and the requested cast's facts take priority over examples. Secret facts
keep their unlock conditions: an author's knowledge does not authorize revealing
them on an ordinary card.

Brief/read source bodies default to a 24,000-character budget. Blocks are never
cut in half. Omitted IDs are returned separately; required omissions set
`incomplete: true` and CLI exit status 2. JSON envelope/provenance fields are
reported separately from the source-body budget. Text output prints omissions in
a footer. `--out FILE` writes exclusive JSON output and refuses to overwrite it.
Compact text is the default; `--json` includes the full provenance envelope.

## Optional isolated frameworks

The game declares Node >=20, so one Node 24 installation can serve the game,
Grim RAG and QMD. A second Node environment is optional, not required. QMD needs
Node >=22 and a pinned `@tobilu/qmd` installation (the inspected release is
2.8.3). Keep its package dependencies separate from the game's package.json.
The npm test scripts name `test/*.test.js` explicitly for Node 20/24 compatibility.
Download its documented default GGUF models explicitly. Configure absolute
paths to the executable and the three model files in this order: embeddings,
reranker, query expansion. The adapter hashes their bytes at index and query time.
When using separate Node versions, the executable must select QMD's newer runtime;
with one Node 24 installation, its ordinary npm launcher suffices. The adapter sets
private `INDEX_PATH`, `QMD_CONFIG_DIR` and `XDG_CACHE_HOME` values per corpus.

```json
{
  "qmd": {
    "executable": "/absolute/path/to/qmd",
    "weights": ["/absolute/path/embed.gguf", "/absolute/path/rerank.gguf", "/absolute/path/expand.gguf"]
  },
  "lightrag": {"python": "/absolute/path/to/isolated-venv/bin/python"}
}
```

QMD receives one exported document per source block in a private named index. Its
results map back to original parents. The adapter uses its own config directory,
not your global collections. Internal QMD chunks may be smaller than a card, but
agents read the original complete parent through the common interface.

For LightRAG, create a separate Python venv, install `lightrag-hku`, and record its
resolved dependency lock (e.g. `pip freeze`). Its version is bound to the index.
The included Python bridge uses local JSON/NetworkX/NanoVector storage, OpenRouter
model functions, `ainsert` with per-block parent paths, and `aquery_data` in `mix`
mode. It never asks LightRAG to generate an authoring answer. Runtime/model changes
require a rebuild. Extracted graph text is never substituted for source evidence.

```bash
node tools/grim.js retrieve index --backend qmd --config /absolute/path/retrieval.json
node tools/grim.js retrieve search "a deferred obligation" --backend qmd --config /absolute/path/retrieval.json --json
node tools/grim.js retrieve index --backend lightrag --config /absolute/path/retrieval.json
```

External indexes are scoped to immutable corpus/config fingerprints and rebuilt
for a new corpus. Custom Grim indexes additionally reuse unchanged records. No
major framework dependencies or models are downloaded automatically by the wrapper.
Missing installations and unsupported result mappings are explicit errors.

## Research comparisons

Use [the controlled experiment protocol](../../experiments/authoring/README.md).
In a prepared workspace, the run input automatically fixes source root, backend,
profile, cache, fingerprint and tool receipt path. Original corpus retrieval stays
frozen even while the trial adds candidate cards to its writable content copy.
Secrets are deliberately excluded from trial snapshots. For manual trial sessions,
inherit the key through the environment, or create a separate ignored `.env.local`
in that trial workspace. Never copy credentials into the frozen inputs.

For the least setup, start with Grim RAG: it uses the existing Node runtime and
OpenRouter, with no Python, vector server, or downloaded model weights. The lexical
profile needs no API at all. QMD adds local models but can share Node 24. LightRAG
still requires Python and its dependencies; defer it if that setup is unwanted.
Retrieval quality on this corpus remains an experimental question.

Framework results compare complete workflows; local model precision and different
extraction pipelines are part of the treatment. Isolate component effects through
within-stack ablations. The wrappers and mocked protocol tests do not establish
live provider quality or external framework compatibility for every release.

Interfaces were checked against the primary [QMD source](https://github.com/tobi/qmd)
and [LightRAG retrieval documentation](https://github.com/HKUDS/LightRAG/blob/main/docs/ProgramingWithCore.md).
The custom design draws on [Contextual Retrieval](https://www.anthropic.com/research/contextual-retrieval)
and [A-RAG](https://arxiv.org/abs/2602.03442). [HippoRAG](https://github.com/OSU-NLP-Group/HippoRAG),
LinearRAG and Psi-RAG are follow-up candidates; none is implemented in this round.
