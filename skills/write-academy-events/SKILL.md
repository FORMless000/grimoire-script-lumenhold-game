---
name: write-academy-events
description: Add or revise content for the Lumenhold Academy life-sim — events, event chains, characters, states (classes, clubs, jobs, conditions), endings — written in Grimoire Script (.grim). Use whenever asked to write more events, expand a character, add a storyline/chain, a new class/club/job, or rebalance content.
---

# Writing Lumenhold Academy content (batch authoring)

Content is data, not code: you write `.grim` blocks under `content/`, then format, build, lint, simulate and translate. You should not need to touch `src/`. The rules live in `docs/authoring/`; this skill is the workflow.

## 0. Load context (always)

1. **Read:** `AGENTS.md` (principles; canon is only in the worldbook, `content/world/`; numbers and rules are in `docs/design-v0.3.md` and `docs/authoring/`), then in `docs/authoring/`: `style.md`, `costs.md`, `classes.md`, `checks.md` and `checklist.md`. Read `docs/grimoire-script.md` fully the first time; afterwards keep §3 (expressions), §4 (effects) and §5 (how a month is built) at hand.
2. **By task:** `pools.md` for repeatable cards and for which group a card joins ("Where a card lives"); `schema.md` for the shapes and the constructs at a glance (its block table is generated from the parser: skim it); `presets.md` for sizes.
3. **Retrieve context before writing:** [rag/AUTHORING.md](../../rag/AUTHORING.md) (required; it says when you may skip, and what to do when the index is unbuilt).
4. **Reuse what exists**, alongside retrieval:

```bash
node tools/grim.js brief --place library --track library_assistant --topic "…"   # every card already there, the most similar in full, and the rules
node tools/grim.js brief --like soc_argument,life_timeloop_2 --topic "…"         # the named cards in full (the chain you extend, a shape you copy)
node tools/grim.js brief --cast <id> --topic "…"                                 # the slice of the worldbook for one topic
node tools/grim.js ids event                                                     # (and flag, state) ids in use
node tools/grim.js query event 'place == "library"' --fields                     # everything matching a condition (or 'track == "tavern"')
node tools/grim.js query event --grep goat                                       # by premise
node tools/grim.js query fact 'npc == "kael"'                                    # facts; query lore 'has("Hollow Star")' for lore by key
node tools/grim.js lorebook                                                      # the whole worldbook, as build/lorebook.json
node tools/grim.js show <id>                                                     # a block, where its properties come from, everything that references it
node tools/grim.js graph <id>                                                    # who leads to it (queues, gates) and what it leads to
node tools/grim.js dupes content/events/pools/<file>.grim                        # near-duplicate premises
node tools/economy.js --by event --freq                                          # how often cards show and what they move
```

The worldbook holds everything an author may rely on: the cast (age, voice, stats, schedules, relations), `@fact`s by tier, places with map positions, tracks, spells, factions, arcs, archetypes, the timeline and `@lore`.

## 1. Plan before writing

For each event decide (the syntax for each is in `schema.md`, "Constructs at a glance"):
- **Trigger:** `random`, `social`, `auto`, `queued` or `letter`.
- **Where it is drawn:** a `place:`, a `track:` with `level:` / `rank:`, a `plan:`, or no place (the night's world slot).
- **Its group** (`pools.md`, "Where a card lives"): most cards join one that already says their wiring, and write only what differs. A storyline is a `@thread` from a template (`story`, `quest`, `scene`); something on a schedule is an `@appointment`; a repeated condition is a `@cond`.
- **Who:** `cast:` roles cast by premise, or a fixed `actor:`. For a character's own cards, give them a ladder from `rel 0` (`pools.md`, "Character pools").
- **When:** `when` on state, flags, relationship, month, year.
- **Class** (`classes.md`) and **the trade** (`costs.md`: read it): no option obviously best, every cost one the scene shows, alignment for a moral side.
- **Checks:** pitch every `challenge` and `chance` with `checks.md`.
- **What it leaves behind:** flags, states, queued follow-ups, and a side-thread lead for a hint the player must go after later. Main-plot clues and arc clocks only in hard-canon story events.
- **Repeatables:** variants by `pools.md`. **Plots, arcs, clashes:** `style.md`, "Conflict and climax". **Chains:** sketch the graph first (`pools.md`).

## 2. Search, write, then check for duplicates

1. Search the premise, write the blocks, check each draft with `related`, and record the queries in the batch notes: the loop in [rag/AUTHORING.md](../../rag/AUTHORING.md).
2. **Write the blocks** with the shapes in `docs/authoring/schema.md` and the annotated `docs/authoring/examples/`. Stay in canon: names, places and facts from the brief and the worldbook.
   - **A new proper noun needs a soft `@lore` entry** in `content/world/lore/soft/` (canon lint rejects unknown names otherwise).
   - New characters go in `content/world/cast.grim` with `age` (adults only), traits and interests from `@vocab`, and a `voice`, plus 5–8 `@fact`s in `content/world/facts/<id>.grim` (`skills/distill-lore`).
   - New course, club or job: a `@track` in `content/world/tracks.grim` (with its `@place`), then events with `track:` and `level:`/`rank:`.
   - New ending: `content/endings.grim`, with a `priority` that slots it correctly.

## 3. Verify (required)

```bash
node tools/grim.js fmt                       # canonical layout; never changes meaning
node tools/grim.js build
node tools/grim.js lint                      # 0 errors (incl. canon lint and worldbook references); fix warnings on your content
node tools/grim.js sim 300                   # 0 crashes; your events are not in "never seen"
node tools/grim.js sim 300 --policy social   # for relationship content
node tools/grim.js balance --quick           # 0 invariant failures; read the alarms
node tools/grim.js show <new_id>             # sanity-check a block and its references
node tools/grim.js graph <new_id>            # for a chain: what queues each card, what each leads to
node tools/grim.js check                     # build + lint + sim 200: the standard check before finishing
```

- **A new event never appears:** its `when` is too narrow, its `weight` too low, or nothing queues it. Fix it, or say it is deliberately rare.
- **`grim diff` reports changes:** content changes alter gameplay, so that's expected. Confirm they're what you intended, refresh the baseline (`node tools/grim.js snapshot --out test/golden/baseline.json`) and mention the ending distribution in your report.
- **Browser check:** `index.html?event=<id>&debug` (add `&actor=<npc>` for `actor: any`).

## 4. Translate (required while a translation exists)

1. `node tools/grim.js i18n zh-CN` adds empty lines for new strings and marks changed English `# STALE`.
2. Follow `locales/zh-CN/GLOSSARY.md`, one form per term (where it lists a choice, use the one it marks); add new proper nouns there. 他／她 follows each character's `pronouns:` in `content/world/cast.grim`.
3. Fill the `.lang` lines (or stage them in `locales/zh-CN/_in/` and re-run `i18n zh-CN`). Keep `{npc}` `{player}` `{lyra}` `{=…}`; drop `{s}` and `{are}`; full-width punctuation; labels ≤ 14 characters.
4. `node tools/grim.js i18n` until 100%, then `lint` and `sim 100 --lang zh-CN`.

## 5. Batch, critic, then report

1. `node tools/grim.js batch <name> --files content/events/pools/<file>.grim` runs every validator on the batch (build, lint, balance --quick, dupes, canon, zh coverage) and writes `build/batches/<name>.json`.
2. The critic (`skills/critic/SKILL.md`, ideally a separate subagent without your reasoning; it does read the batch notes) writes `build/batches/<name>.critic.json`. Fix its issues and re-run `batch` (at most two rounds).
3. `node tools/grim.js report --gaps` shows each kind of source's thinnest pools.
4. `npm run grim -- retrieve index` once the final edits are in.

Then report:
- how many events, in which files;
- the retrieval queries run, the rework they caused, and any skip with its reason;
- new flags, states, characters, facts and lore;
- the chain graph;
- lint, sim and balance results (coverage, ending distribution);
- translation status.
