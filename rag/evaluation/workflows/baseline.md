# Current retrieval workflow

Use the current `node tools/grim.js brief`, `query`, `show`, and `graph` commands
to inspect canon and prior events. Keep their behavior unchanged. Do not use
`retrieve`, QMD, LightRAG, embeddings, or a helper model. Inspect matching source
blocks rather than loading every story card. Record the actual returned size;
the old brief budget is not a strict upper bound.
