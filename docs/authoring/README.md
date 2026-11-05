# Authoring spec

This folder is the single source for how Lumenhold content is made (design §3.5). The coding-agent skills (`skills/write-academy-events`, `skills/critic`, `skills/distill-lore`) are the workflows built on it, and the tentative live-generation harness will build its prompts from it too, so the paths can't drift apart.

| File | Contents |
|---|---|
| `checklist.md` | every acceptance question, for validators, the critic and self-checks (embedded in every brief) |
| `style.md` | tone, voice, length limits, label rules, conflict and climax, banned moves |
| `schema.md` | the shapes you write and the constructs at a glance; the block/property table is generated from the parser |
| `pools.md` | repeatable pool events, where a card lives (its wiring group), variation, character ladders, coverage, ids |
| `classes.md` | event classes, their rules and budgets; tones; weights |
| `costs.md` | the trade: what each resource, skill and track stands for, which costs fit which scenes, alignment (embedded in every brief) |
| `checks.md` | how a check or roll is pitched: difficulty, odds by nature, luck, drift, with examples |
| `presets.md` | size tiers, check ladder, presets (generated from `content/core/balance.grim`) |
| `examples/*.grim` | annotated exemplar events |
| `briefs/*.md` | sample briefs (`grim brief` output) |

Each file cites only files further down this table (and the language reference, `docs/grimoire-script.md`, and `content/`); none points back up. Canon lives only in the worldbook, `content/world/`.

## Who writes content

Humans don't write events; they curate the worldbook, playtest, read dashboards and delete what doesn't belong. Content is made in three ways:

1. **Batch authoring by coding agents** (`skills/write-academy-events`): a batch of events around one brief.
2. **Feedback tuning by coding agents** (a `tune-events` skill is planned; until then: `grim feedback`, `grim show <id>`, edit, `grim check`): rebalance, rewrite, re-gate or retire events using `grim feedback` / `grim report` and the run logs.
3. **Live generation during play**: tentative (design §T3); it will follow the same spec, worldbook and validators.

## Balance

A card's numbers are tier words; whether its options trade is `costs.md` and `classes.md` (the lint checks the routine rule). Whether the game as a whole holds is measured: `grim balance` (invariants and alarms per play style), `tools/economy.js` (sources and sinks by resource, event and month), with the measured flows per style in `docs/playtest-2-flows.md`.
