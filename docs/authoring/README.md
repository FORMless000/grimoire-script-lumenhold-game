# Authoring spec

This folder is the single source for how Lumenhold content is made (design §3.5). The coding-agent skills (`skills/write-academy-events`, `skills/distill-lore`) are built from it, and the tentative live-generation harness will build its prompts from it too, so the paths can't drift apart.

| File | Contents |
|---|---|
| `README.md` | this page: the paths, the loop, the tools |
| `style.md` | tone, voice, length limits, label rules, banned moves |
| `schema.md` | every construct of the event format, with the block/property table generated from the parser |
| `presets.md`, `classes.md` | size tiers, presets and event classes |
| `costs.md` | the trade: what each resource, skill and track stands for, which costs fit which scenes, and the "no option obviously best" rule (also in every brief) |
| `checks.md` | how a skill check or a roll is pitched: difficulty (what you're up against), odds by nature, luck and drift, with examples (also in every brief, through the checklist) |
| `checklist.md` | the acceptance checklist that validators and the critic apply; also the "Rules" section of every brief |
| `examples/*.grim` | annotated exemplar events |
| `briefs/*.md` | sample briefs (`grim brief` output) |

The language reference stays `docs/grimoire-script.md`; canon lives only in the worldbook, `content/world/` (AGENTS.md carries no lore). How cards are wired (pools, threads and their templates, named conditions, appointments) is its §9; which group a new card joins is `pools.md`, "Where a card lives". The libraries are `content/core/templates.grim` (story, quest, scene; pool templates), `content/core/appointments.grim` (when the game deals cards) and `content/core/conds.grim`.

## Who writes content

Humans don't write events; they curate the worldbook, playtest, read dashboards and delete what doesn't belong. Content is made in three ways:

1. **Batch authoring by coding agents** (`skills/write-academy-events`): 20–40 events around one brief.
2. **Feedback tuning by coding agents** (a `tune-events` skill is planned; until then: `grim feedback`, `grim show <id>`, edit, `grim check`): rebalance, rewrite, re-gate or retire events using `grim feedback` / `grim report` and the run logs.
3. **Live generation during play**: tentative (design §T3); it will follow the same spec, worldbook and validators.

## The loop for a batch

Load context through [the everyday authoring procedure](../../rag/AUTHORING.md).
Prepared experiments instead follow their assigned packet.

```bash
# write the events (content/events/*.grim), then:
node tools/grim.js fmt
node tools/grim.js build && node tools/grim.js lint        # 0 errors; canon lint: no unknown proper nouns
node tools/grim.js balance --quick                          # invariants pass; read the alarms
node tools/grim.js i18n zh-CN                               # then translate the new lines
```

Then check the batch against `checklist.md` (a separate critic pass, without the author's reasoning), and report.

## Finding prior art

Follow the [retrieval command guide](../../rag/AUTHORING.md) for source discovery and inspection. Ordinary structural tools include:

```bash
node tools/grim.js brief --place library --track library_assistant --topic "…"   # lists every card already there, shows the most similar in full
node tools/grim.js brief --like soc_argument,life_timeloop_2 --topic "…"         # the named cards in full (the chain you extend, a shape you copy)
node tools/grim.js query event 'place == "library"' --fields                     # everything matching a condition
node tools/grim.js query event --grep goat                                       # by premise
node tools/grim.js show <id>                                                     # a block, where its properties come from, and everything that references it
node tools/grim.js graph <id>                                                    # who leads to it (queues, gates) and what it leads to
node tools/grim.js dupes content/events/pools/<file>.grim                        # near-duplicate premises
node tools/economy.js --by event --freq                                          # how often cards show and what they move
```

## Controlled retrieval experiments

See [RAG setup and retrieval](../../rag/README.md) and the
[controlled evaluation protocol](../../rag/EVALUATION.md).

## Balance

A card's numbers are tier words; whether its options trade is `costs.md` and `classes.md` (the lint checks the routine rule; `presets.md` has the sizes, generated from `content/core/balance.grim`). Whether the game as a whole holds is measured: `grim balance` (invariants and alarms per play style), `tools/economy.js` (sources and sinks by resource, event and month), with the measured flows per style in `docs/playtest-2-flows.md`.

## The worldbook

Everything an author may rely on is in `content/world/`: the cast (with age, voice, stats, schedules and relations), `@fact`s by tier, places with map positions, tracks, spells, factions, arcs, archetypes, the timeline and `@lore`. Look things up with:

```bash
node tools/grim.js brief …            # the relevant slice for one topic
node tools/grim.js query lore 'has("Hollow Star")'   # lore by key
node tools/grim.js query fact 'npc == "kael"'
node tools/grim.js lorebook           # everything, as build/lorebook.json
```

**Canon.** `canon: hard` lore is curated and fixed. `canon: soft` lore is proposed (by distillation or by a batch) and becomes hard when a human promotes it. A batch that introduces a new name must add a soft `@lore` entry for it, or canon lint rejects the batch.
