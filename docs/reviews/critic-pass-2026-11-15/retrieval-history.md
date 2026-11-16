# Historical retrieval receipt inventory

Parsed locally from `rag/receipts/retrieval.jsonl`; no network calls were made for this inventory and no raw JSONL receipt lines are reproduced. The machine-readable, per-ID map is `retrieval-history.json`.

## Scope and counts

Scope is the 644 IDs in `docs/reviews/critic-scan-2026-11-15/inventory.json` → `outsideIndependentPasses`.

- 2,622 receipt lines total at scan time: 1,603 related operations and 887 search operations.
- 1,015 successful related receipts associate to 610 scoped IDs by exact `--draft` basename `<event-id>.grim`; 34 scoped IDs had no basename-matched related receipt.
- Search commands have no event ID in their receipt shape, so the 887 successful search receipts are not assigned to individual cards.
- For the 1,015 matched receipts, the corrected catalog comparison finds 220 self-candidate hashes equal to the current catalog source hash, 1 different, and 794 without a returned self-candidate (unverified). The original raw-text comparison was invalid because trimming/splitting source blocks changed their hash representation; it has been replaced with the catalog identity check described below.

## Receipt shape and identity limits

A receipt includes `at`, `argv`, backend/profile, corpus/index identity, operation, query, result/output hashes, returned character/byte counts, and a structured result. Related result candidates include `key` (event ID), ranking `score`, reason, title, file/line, `sourceHash`, metadata, and an excerpt. The top-level related query is blank; `result.query` stores the flattened draft text used for retrieval. The receipt records a draft path in argv but no source-file hash for that draft. The map hashes the flattened query text, and records each candidate's sourceHash. It now compares historical candidate hashes to the current canonical record from `require("./rag/src/catalog.js").catalog(process.cwd()).records` by `event:<id>`, rather than hashing a locally sliced source block.

The receipt does not preserve the original `.grim` syntax as a complete draft source block. Candidate excerpts are limited snippets, not full source text; current canonical text can be retrieved from the catalog record when the source hash matches. A matching self-candidate `sourceHash` supports that the indexed source candidate matches the current catalog block, but does not establish every historical draft query detail or independently validate other candidates. A different hash or missing self-candidate must not be treated as evidence for the current definition.

`retrieval-history.json` includes all 644 IDs with source file/line, compiled definition hash from the inventory, current source block hash, all exact-basename related receipts with timestamps and top four candidate IDs/scores/hashes, and the self-candidate comparison. Historical matches are evidence pointers only; they are not duplicate verdicts.

## Hash comparison correction

A first comparison hashed blocks sliced directly from `.grim` files and reported 6 equal, 215 different among returned self-candidates. The slicing/whitespace normalization was not equivalent to the catalog source identity. Rechecking with the canonical `rag/src/catalog.js` record hash yields 220 equal, 1 different, and 794 unverifiable across the 1,015 receipts. For the 54 newly run between-card queries, all 216 top-four non-self candidate hashes match the corresponding current catalog records (zero mismatch, zero missing). The 12 fallback queries have all 36 top-three non-self candidate hashes matching current catalog records (zero mismatch, zero missing). The raw stdout files are preserved under `/private/tmp/lifesim-critic-2026-11-15/`; these hash corrections do not alter the retrieval results or rankings.
