---
name: authoring-retrieval
description: Retrieve focused source evidence for Lumenhold card authoring with Grim RAG, QMD, or LightRAG; inspect canon, related premises and static dependencies without loading the whole corpus.
---

Read [the retrieval guide](../../docs/authoring/retrieval.md) for CLI configuration.
Use compact `retrieve search` results to select originals with `retrieve read`.
Inspect `retrieve neighbors` before extending a chain; these are static references,
not proof that a branch is reachable or an outcome always happens. Use a bounded
`retrieve brief` when several sources must be considered together. Treat omitted
required evidence as incomplete work, not permission to guess.

Canon stays in the original worldbook. Search descriptions, extracted graph text,
and alternative event outcomes cannot establish new canon. Preserve fact unlocks
when deciding what a new scene may reveal. `retrieve related --draft FILE` returns
premises to inspect, not an automatic duplicate verdict.

Do not silently replace a missing or stale backend. Indexing can invoke paid
embedding/helper models; run it explicitly within the user's authorized work.
In an experiment, use its assigned workflow and profile without substituting
legacy graph or search tools for an ablated component. Read the experiment's
common and workflow inputs; do not load evaluation labels or sibling drafts.
