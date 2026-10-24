# LightRAG setup

This project uses official `lightrag-hku==1.5.7` with local JSON, NetworkX and
NanoVectorDB storage. The bridge supplies OpenRouter calls to native LightRAG
extraction, gleaning, merging, document deletion, and retrieval-only `mix` search.
Authoring stays in your chosen coding-agent harness/model. See
[AUTHORING.md](AUTHORING.md) for the command guide and
[EVALUATION.md](EVALUATION.md) for experiments.

## Setup

Install Node 24 and Python >=3.10 (3.12 recommended), then run from the repository:

For a fresh clone, copy `.env.example` to `.env.local` **inside `rag/`**, fill in
your OpenRouter key, then prepare dependencies and build the local authoring index:

```sh
./rag/prepare.sh --build
```

```powershell
.\rag\prepare.ps1 --build
```

`--build` makes paid API calls when indexing is needed. An existing ready index
is verified and reused; an existing stale index is synchronized incrementally.
Interrupted work requires explicit `--resume` with the original inputs.
After pulling source changes, use `--sync` to synchronize an existing index.
Use `--python-bin PATH` with these modes if Python needs to be selected explicitly.
They run the dependency setup below before indexing.

To verify an existing installation and index **without installing, indexing, or
making network/model calls**, run:

```sh
./rag/prepare.sh --check
# Equivalent: npm run rag:prepare -- --check
```

On Windows use `.\rag\prepare.ps1 --check`. No arguments also means `--check`.
Verification checks the pinned installed LightRAG version, source/configuration
fingerprints, manifest integrity and native document/chunk coverage. It exits
nonzero for an unavailable, stale, incomplete or interrupted index; it does not
perform a paid search or certify remote provider availability.

To install only the isolated Python environment, without indexing:

```sh
./rag/setup.sh
```

```powershell
.\rag\setup.ps1
```

Scripts prepare only LightRAG's isolated venv and record its resolved packages.
They never index content or make model calls. Use `--python-bin PATH` to select
Python. Runtime paths are in ignored `rag/envs/retrieval.json`. Keep your existing
key in ignored `rag/.env.local`, as `OPENROUTER_API_KEY=...`; an environment variable
takes precedence. Never include this file in exports. Dependencies, caches,
receipts and experiment runs stay within `rag/` and are ignored by Git.

## Git and deployment

The game server and committed gameplay bundles do not require a RAG installation
or index. Deployment uses `git archive`, so ignored, untracked local artifacts
are not deployed; the server's static-file allowlist also excludes `rag/`.
Keep `rag/` source, tests, scripts, requirements, default model configuration,
evaluation templates and documentation in Git. `rag/.gitignore` excludes venvs,
downloaded dependencies/weights, graph and vector caches, credentials, private
receipts and experiment runs. It intentionally does not ignore the whole folder.
Previously tracked files would need to be untracked separately; currently none
of these generated RAG artifacts are tracked.

Each author builds their own index after cloning. Keep local run/review archives
backed up separately when needed: they remain on disk, but Git does not back them
up. The committed `build/content.bundle.js` and `build/combat.bundle.js` must
continue to ship with the game.

## Models

`rag/authoring.json` selects the default `gemini` preset. To use the alternative,
set `"preset": "qwen"` in `rag/envs/retrieval.json`. Explicit `models.extract`,
`models.keyword`, `models.embedding` and `models.reranker` override preset values.

| Role | Gemini preset | Qwen preset |
|---|---|---|
| Extraction and merge summaries | `google/gemini-3.1-flash-lite`, temperature 0 / default reasoning | `qwen/qwen3.8-flash`, reasoning disabled |
| Query keywords | Same as extraction | Same as extraction |
| Embeddings | `qwen/qwen3-embedding-8b` | Same |
| Reranking | `voyageai/rerank-3-lite` | Same |

The existing OpenRouter key serves every role. Missing models, unexpected model
substitution and failed reranking are errors. Provider routing may be configured
explicitly with `provider`; receipts preserve actual model/provider and reported
usage/cost, including provider cache details when returned. Local request caches
include endpoint, model, provider and request contents. Gemini stable system
prefixes request supported provider caching; cache hits are observed, not assumed.
Native LightRAG's model caches remain enabled.

## Lifecycle and recovery

An index manifest separates extraction identity, vector configuration and corpus
revision. Indexing inputs contain complete parent blocks, parser metadata and
referenced worldbook context. A source move updates locations without changing
extraction inputs. Changes to relevant contextual sources invalidate dependent
blocks. Retired blocks are removed from discovery. Original source reading and
static dependency inspection are independent of generated graph descriptions.

Synchronization stages a copy of the last revision, uses native document deletion
for removed/edited blocks, and inserts changed blocks. Shared contributions are
reconstructed by LightRAG from remaining sources; this can require additional
summaries or embeddings. Unchanged vectors and valid request caches are reused.
Only a complete, source-verified revision is published atomically. A writer lock
serializes updates. Failures retain the previous manifest and pending work.

Use `index --resume` with unchanged inputs after interruption. A dead writer's
lock is reclaimed only on explicit resume. Restore the recorded source/config
before resuming if either changed. Staged stores, private request receipts and
batch journals live under `rag/cache/lightrag/`; do not delete pending work merely
to retry a paid request. Ambiguous batch submissions stop for operator
reconciliation: recover the batch ID from OpenRouter logs and fill the affected
`jobs/<revision>/request-<hash>.json` anchors with `{"id":"batch_..."}`.
An explicitly resumed, definitively failed batch row may be retried; successful
rows use cached results. Ambiguous submissions are never blindly resubmitted.

Initial construction and extraction changes require explicit `--rebuild`.
Gemini 3.8 Flash rebuilds can use asynchronous batch transport, coalescing independent
native requests into waves while preserving glean/merge dependencies. Embeddings
use synchronous calls. The default Gemini 3.1 Flash Lite preset and incremental updates use synchronous transport; Lite batching is not assumed.
Qwen uses `--mode sync`; its batch capability is not assumed. No transport is
substituted silently. [OpenRouter batch reference](https://openrouter.ai/docs/batch-quickstart).
A full rebuild can take many batch waves; leave the process running or resume it.

Extraction model/preprocessing changes create a new graph lineage. Embedding
changes rebuild native vectors without re-extraction. Keyword or reranker changes
only affect retrieval and their own caches. Implementation changes conservatively
invalidate extraction identity. Old revision data is retained for recovery.

## Offline verification

```sh
npm run rag:smoke
```

The smoke command uses temporary `.grim` fixtures and the installed official
package, fake embeddings and scripted extraction responses, with external socket
connections blocked. It reports per-scenario work counts, not measured API prices.
It does not read or build the real corpus. For a later paid initial build:

```sh
npm run grim -- retrieve index --rebuild --mode sync
```

HTTP billing/access/request failures open a local circuit breaker. Subsequent native retries cannot make network calls in that process. Fix the reported cause before explicit resume; do not blindly retry. Legacy graph imports retain their actual per-record inputs and source provenance, and are upgraded only when a source or its contextual dependencies change.
