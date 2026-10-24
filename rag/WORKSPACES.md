# Segregated batch workspaces

Future preparation produces `baseline` and `lightrag`, with identical starting
content and common rules. Each is one exploratory batch, not independent trials
per card. Previously prepared four-condition projects and review archives remain
untouched; scan/import accepts the projects recorded in their manifest.

```sh
npm run grim -- author-eval workspaces prepare --out DESTINATION
npm run grim -- author-eval workspaces status --experiment DESTINATION
npm run grim -- author-eval workspaces scan --experiment DESTINATION
npm run grim -- author-eval workspaces import --experiment DESTINATION --prompt PROMPT.txt
npm run grim -- author-eval workspaces review --experiment DESTINATION
```

Preparation includes runtime setup and paid full-corpus retrieval readiness probes;
it never launches author sessions. `prepare --resume` requires identical recorded
source/configuration. Unrelated destinations are refused. Operator inventories,
receipts and prompt hashes are under `_operator/`; they are not supplied to authors.
Paste identical prompt bytes into fresh sessions, keep author settings and budgets
fixed, and preserve native transcripts separately under `_operator/sessions/`.

The baseline has no retrieval runtime or retrieval instructions. The retrieval
project includes only its assigned adapter; neutral `rag/USAGE.md` documents source
inspection. Its starting corpus in `rag/frozen/content/` is fixed, so new drafts
never enter that index. CLI overrides of runtime, corpus and caches are rejected.
This is interface isolation, not an OS security boundary.

Scans preserve added, modified, moved and deleted blocks, cards in existing files,
parse failures and raw changed files. Tool/rule/input drift and generated bundles
are recorded separately. Import freezes a blinded review artifact rather than
adopting content. A later balance pass requires another scan/import; prior imports
remain immutable. Preserve agents' Chinese translations alongside English sources
for bilingual review. See [EVALUATION.md](EVALUATION.md) for interpretation.

```sh
npm run grim -- author-eval workspaces traces --experiment DESTINATION --sessions EXPORT_DIRECTORY
```

The batch trace importer currently reads Claude interactive JSONL; filenames match
project identities from the manifest. Independent-trial imports additionally
support Codex and normalized exports. Native exports and retrieval receipts are
complementary; incomplete logs cannot verify tool adherence. Existing historical
workflow labels remain readable as data, not available active backends.
