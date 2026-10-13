# Authoring spec

This folder is the single source for how Lumenhold content is made (design §3.5). The Claude Code skills (`skills/write-academy-events`, `skills/distill-lore`) are built from it, and the tentative live-generation harness will build its prompts from it too, so the paths can't drift apart.

| File | Contents |
|---|---|
| `README.md` | this page: the paths, the loop, the tools |
| `style.md` | tone, voice, length limits, label rules, banned moves |
| `schema.md` | every construct of the event format, with the block/property table generated from the parser |
| `presets.md`, `classes.md` | size tiers, presets and event classes (the numbers arrive in phase 2a) |
| `checklist.md` | the acceptance checklist that validators and the critic apply; also the "Rules" section of every brief |
| `examples/*.grim` | annotated exemplar events |

The language reference stays `docs/grimoire-script.md`; canon lives only in the worldbook, `content/world/` (AGENTS.md carries no lore).

## Who writes content

Humans don't write events; they curate the worldbook, playtest, read dashboards and delete what doesn't belong. Content is made in three ways:

1. **Batch authoring by Claude Code** (`skills/write-academy-events`): 20–40 events around one brief.
2. **Feedback tuning by Claude Code** (`tune-events`, from phase 3): rebalance, rewrite, re-gate or retire events using `grim feedback` / `grim report` and the run logs.
3. **Live generation during play**: tentative (design §T3); it will follow the same spec, worldbook and validators.

## The loop for a batch

```bash
node tools/grim.js brief --cast lyra,kael --place library --topic "…" --out build/brief.md   # context pack (~6k tokens)
# write the events (content/events/*.grim), then:
node tools/grim.js fmt
node tools/grim.js build && node tools/grim.js lint        # 0 errors; canon lint: no unknown proper nouns
node tools/grim.js balance --quick                          # invariants pass; read the alarms
node tools/grim.js i18n zh-CN                               # then translate the new lines
```

Then check the batch against `checklist.md` (a separate critic pass, without the author's reasoning), and report.

## The worldbook

Everything an author may rely on is in `content/world/`: the cast (with age, voice, stats, schedules and relations), `@fact`s by tier, places with map positions, tracks, spells, factions, arcs, archetypes, the timeline and `@lore`. Look things up with:

```bash
node tools/grim.js brief …            # the relevant slice for one topic
node tools/grim.js query lore 'has("Hollow Star")'   # lore by key
node tools/grim.js query fact 'npc == "kael"'
node tools/grim.js lorebook           # everything, as build/lorebook.json
```

**Canon.** `canon: hard` lore is curated and fixed. `canon: soft` lore is proposed (by distillation or by a batch) and becomes hard when a human promotes it. A batch that introduces a new name must add a soft `@lore` entry for it, or canon lint rejects the batch.
