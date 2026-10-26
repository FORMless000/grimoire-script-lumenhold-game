---
name: write-academy-events
description: Add or revise content for the Lumenhold Academy life-sim — events, event chains, characters, states (classes, clubs, jobs, conditions), endings — written in Grimoire Script (.grim). Use whenever asked to write more events, expand a character, add a storyline/chain, a new class/club/job, or rebalance content.
---

# Writing Lumenhold Academy content (batch authoring)

Content is data, not code: you write `.grim` blocks under `content/`, then format, build, lint, simulate and translate. You should not need to touch `src/`. The rules live in **`docs/authoring/`**; this skill is the workflow.

In a prepared authoring trial, the supplied common/task/workflow packet overrides
the normal retrieval, validation, translation and critic steps below. Stop at its
operator checkpoints and keep experimental cards quarantined.

## 0. Load context (always)

1. Read `docs/authoring/README.md`, `style.md`, `checklist.md` and `checks.md` (how every check and roll is pitched). Skim `schema.md` (the block table is generated from the parser). Read `docs/grimoire-script.md` fully the first time; afterwards keep §3 (expressions), §4 (effects) and §5 (how a month is built) at hand.
2. Read `AGENTS.md` for the principles and where things live; numbers and rules are in `docs/design-v0.3.md` and `docs/authoring/`. It carries no lore: canon is only in the worldbook (`content/world/`).
3. **Retrieve context before writing.** Follow [the command guide](../../rag/AUTHORING.md); a frozen experiment follows its assigned packet instead.
4. For ordinary writing, supplement retrieval to avoid duplicates and reuse what exists: `node tools/grim.js ids event` (and `flag`, `state`), `node tools/grim.js query event --grep <word>` (or a condition: `query event 'track == "tavern"'`), `node tools/grim.js query fact 'npc == "<id>"'`. Read a card you build on with `show <id>`, and see what leads to it and what it leads to with `graph <id>`. `node tools/economy.js --by event --freq` shows how often cards show and what they move; `docs/authoring/README.md` lists these tools.

## 1. Plan before writing

For each event decide:
- **Trigger:** `random` (everyday, gated by `when`), `social` (about a character: a fixed `actor:` puts it on that character's own track as well, so it comes when you meet them where they are or when they come looking for you; give each character a ladder of personal events from `rel 0`, see `docs/authoring/pools.md`, Character pools), `auto` (forced when `when` holds: calendar beats, chain climaxes; tight `when` plus `repeat`), `queued` (only reachable by `queue`; `queue x in 2 with friend chance 30` delays it, carries a cast role and rolls odds), or `letter` (the nightly letter while you or they are away: `actor:` or a cast role with `per:`).
- **Where it is drawn** (the director, `docs/grimoire-script.md` §6c): `place: <id>` (a map visit), `track: <id>` with `level:` (course mornings) or `rank:` (club practice, job shifts), `plan: castle|home|work|internship` (break mornings), or no place (the night's world slot). Most everyday content belongs to a place or track now.
- **Its group** (`docs/authoring/pools.md`, "Where a card lives"; `docs/grimoire-script.md` §9): most cards join one that already says their wiring. A routine card takes the `pool:` of its place, track or plan (`grim brief` shows them), and writes only what differs. A storyline is a `@thread`: a mini-plot `from: story` (steps wait on what the start card began), a club or job capstone `from: quest` (one block and five cards of prose), cards in one sitting `from: scene` (steps end with `next`). Something on a schedule (a market day, a weekly hour) is an `@appointment`, not a card with a tricky `when`. A condition repeated across cards becomes a `@cond` (`courting(x)` exists). Never copy a group's lines onto its cards.
- **Who:** `cast:` roles, cast by premise (`friend: any where tagged(friend, peer) and rel(friend) >= 10`; classmates `tagged(x, student) or tagged(x, prefect)`; `tagged(x, teacher)`), `here: present(place)`, `keeper: maud`), or `actor:` a fixed npc id. Don't write `actor: any` (legacy since schema v1).
- **When:** `when` on state, flags, relationship, month, year.
- **Class in mind** (`docs/authoring/classes.md`): routine, milestone, incident, windfall, story.
- **The trade** (`docs/authoring/costs.md`, read it): no option is obviously best. Options trade by giving different things, or by a cost or risk the scene shows: health for the body, mood for spirits, crowns for what's bought, renown for being seen, `study`/`perform`/`progress` for skipped work, `rel` for a person let down, alignment for anything with a moral side. A free option is fine when it gives up what the other offers; never add a cost the `say:` doesn't show. Sizes in `presets.md`.
- **What it leaves behind:** flags, states, queued follow-ups. When a card hints at something the player must go after later (a card at a place, slot or track waiting on its flag), it also leaves a side-thread lead (`find lead_x`, an `@clue` with `thread:`, `kind: lead` and `followed:`); `node tools/grim.js leads` lists any that are missing. Main-plot clues (`find <clue>` of an arc) and arc clocks (`advance <arc> +1`) only in hard-canon story events. Plot gates read `clock(<arc>)` (the schedule) and `clues(<arc>)` (engagement), never a home-made counter.
- **Conscience:** if an option is cruel, greedy, dishonest or reaches for the Star's power, add `alignment -tiny`/`-small`; if it is honest or selfless at a cost, `alignment +tiny`/`+small`. Events for players deep in either side gate on `alignment >= 30` / `<= -30` (±60 for rare ones). `checklist.md` has the rule.
- **Newer constructs** (each documented in `docs/grimoire-script.md`; `node tools/grim.js schema` lists what the format has gained): `time:` / `slot:` (time of day), `defer:`, `up[spell]` options, `wage`, `locked:` on menu options, milestone `ramp:`, track `intro:`, `@game appeal` with `regrade`, `display:` on resources. From world expansion 1:
  - `@item` blocks (in `content/world/items.grim`), with `give` / `take`, `has_item()` / `worn()` and an owned item's own option `> up[item:x]:`, at most one per card;
  - `specializes:` (one character's own version of a generic card);
  - the plain check kinds `appeal`, `perform` and `soothe` (which kind fits is in `checks.md`);
  - `on_shift()`, so a shop counter skips a worker's shift visit;
  - `day:` on break plans;
  - shop counters: a `type: menu` card at the shop's place (its `always:`), with a `hint:` on each priced option and one free option with no `when`. The engine locks any option whose price you can't pay. Special offers are separate cards tagged `offer`, and cost more than money: a check, a fact you know, or a price such as `price_dear`.
- **Use tiers and presets, never raw numbers:** `mood -small`, `grind arcana`, `study evocation +small` (exam preparation; never `grades`), `perform duelling +small`, `spark lyra +tiny` (never `love`). Pitch every `challenge` (with `win:` / `partial:` / `lose:`) and every `chance` with `docs/authoring/checks.md`: difficulty, odds by nature, luck, drift; never `check`.

**Repeatable pool events** (places, class days, practice, shifts, plans) have `class: routine`, `repeat: 4`–`6` (the cooldown in months), and must read differently each time: at least 3 inline variants across text and says, all in one mode with one count (usually a sequence `{a|b|c}`, where showing *k* reads variant *k* of every field; `docs/authoring/pools.md`), plus `{season=autumn: …|winter: …|…}` or `{final_year: …|…}` lines where they fit. Don't hinge a repeatable on a one-time surprise.

For a **plot, an arc or any storyline where characters clash**, write it to `style.md`'s "Conflict and climax": confrontations on the page, an opposition that acts, a way past every fight that isn't one, a climax as a scene thread that pays off what was planted.

For a **chain**, sketch the graph first: every queued event must be queued by something, and every flag tested must be set somewhere (lint enforces both). Give it a `@thread` (with `clues:` for the leads it leaves) and take a template from `content/core/templates.grim` when its shape is one of theirs.

## 2. Search, write, then check for duplicates

Retrieval is required for every new card and for every edit that changes a card's premise, options or outcomes. Commands and the index are in [the command guide](../../rag/AUTHORING.md).

1. **Search the premise before drafting.** `npm run grim -- retrieve search "<one-line premise>"`. Read anything close in the top results with `node tools/grim.js show <id>`. If the premise is taken, pick another, or a clearly different angle.
2. **Write the blocks** (below).
3. **Check each draft for duplicates.** One card per file: `npm run grim -- retrieve related --draft <file>`. Read the top 2–4 results. The tool lists similar premises to inspect, not a duplicate verdict: you judge, but you must look. Rework the card if its premise, options or punchline repeat an existing card.
4. **Record it.** List the queries you ran and any rework in the batch notes (`build/batches/<name>.notes.md`), so the critic can check them.

Skip retrieval only when you are certain the change can't introduce or duplicate a premise: typo or wording fixes, tier or balance retunes, translations, renames, mechanical migrations. Write a one-line reason in the batch notes ("retrieval skipped: tier retune only"). When unsure, run it: doubt counts as required.

Check `npm run grim -- retrieve status` before drafting. If the index is unbuilt (a first build, or a changed build configuration: any edit to `rag/src/catalog.js`, `retrieve.js` or the adapter files), rebuild it first with `npm run grim -- retrieve index --rebuild --mode sync`. The rebuild is paid and can take hours: run it in the background and wait. Don't edit `content/` while it runs, because a source change stops it from publishing. Don't draft cards without retrieval; `brief` and `dupes` supplement it and don't replace it. If retrieval can't run at all (no key, the provider down), report it and stop before drafting. A stale index is fine: searches use the last synced snapshot and print a notice. Run `npm run grim -- retrieve index` at the end of the session, after final edits.

### Write the blocks

Use the shapes in `docs/authoring/schema.md` and the annotated `docs/authoring/examples/`. Stay in canon: names, places and facts from the brief and the worldbook. **A new proper noun needs a soft `@lore` entry** in `content/world/lore/soft/` (canon lint rejects unknown names otherwise). New characters go in `content/world/cast.grim` with `age` (adults only), traits and interests from `@vocab`, `voice`, and 5–8 `@fact`s in `content/world/facts/<id>.grim` (see `skills/distill-lore`).

New course, club or job: a `@track` in `content/world/tracks.grim` (with its `@place`), then events with `track:` and `level:`/`rank:`. New ending: `content/endings.grim`, with a `priority` that slots it correctly.

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

If a new event never appears, its `when` is too narrow, its `weight` too low, or nothing queues it: fix it or say it is deliberately rare. Content changes alter gameplay, so `grim diff` reports changes: that's expected; confirm they're what you intended, refresh the baseline (`node tools/grim.js snapshot --out test/golden/baseline.json`) and mention the ending distribution in your report. Browser check: `index.html?event=<id>&debug` (add `&actor=<npc>` for `actor: any`).

## 4. Translate (required while a translation exists)

1. `node tools/grim.js i18n zh-CN` adds empty lines for new strings and marks changed English `# STALE`.
2. Follow `locales/zh-CN/GLOSSARY.md`; add new proper nouns there.
3. Fill the `.lang` lines (or stage them in `locales/zh-CN/_in/` and re-run `i18n zh-CN`). Keep `{npc}` `{player}` `{lyra}` `{=…}`; drop `{s}` and `{are}`; full-width punctuation; labels ≤ 14 characters.
4. `node tools/grim.js i18n` until 100%, then `lint` and `sim 100 --lang zh-CN`.

## 5. Batch, critic, then report

1. `node tools/grim.js batch <name> --files content/events/pools/<file>.grim` runs every validator on the batch (build, lint, balance --quick, dupes, canon, zh coverage) and writes `build/batches/<name>.json`.
2. The critic (`skills/critic/SKILL.md`, ideally a separate subagent without your reasoning; it does read the batch notes) writes `build/batches/<name>.critic.json`. Fix its issues and re-run `batch` (at most two rounds).
3. `node tools/grim.js report --gaps` shows what the pools still lack.

Then report: how many events in which files; the retrieval queries run, the rework they caused, and any skip with its reason; new flags, states, characters, facts and lore; the chain graph; lint, sim and balance results (coverage, ending distribution); translation status.
