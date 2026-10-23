# Grim RAG workflow

Use `node tools/grim.js retrieve search "topic" --json` to discover candidates,
`retrieve read kind:id` for originals, `retrieve neighbors kind:id --json` for
static dependencies, and `retrieve brief "topic" --cast id --budget 24000` for a
focused evidence pack. The run input selects the assigned backend/profile.
Read originals before relying on derived search descriptions. Use `retrieve
related --draft content/events/trial.grim --json` when checking nearby premises.
Do not substitute the legacy brief/query/show/graph helpers for an ablated stage.
If a backend or index is unavailable, retain the failure; do not silently switch.
