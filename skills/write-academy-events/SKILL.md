---
name: write-academy-events
description: Add or revise content for the Lumenhold Academy life-sim — events, event chains, characters, states (classes, clubs, jobs, conditions), endings — written in Grimoire Script (.grim). Use whenever asked to write more events, expand a character, add a storyline/chain, a new class/club/job, or rebalance content.
---

# Writing Lumenhold Academy content

Content is data, not code. You will write `.grim` blocks under `content/`, then build, lint and simulate. You should not need to touch `src/`.

## 0. Load context (always)

1. Read `AGENTS.md`: the world bible, cast, calendar, balance table and conventions.
2. Skim `docs/grimoire-script.md`. Read it fully the first time; after that, keep it open for §3 (expressions), §4 (effects) and §5 (how a month is built).
3. Run `node tools/grim.js stats` to see what already exists, and `node tools/grim.js ids event` (plus `flag`, `state`) to avoid duplicate ids and to reuse existing flags. Use `node tools/grim.js query` to find precedents, for example `query check 'skill == "alchemy"' --group block` or `query event 'has(romance)' --file people`.
4. Open one or two existing files of the kind you're writing (for example `content/events/classes.grim` for class events) and match their voice and density.

## 1. Plan before writing

Decide, for each event:

- **Where it comes from:** the trigger.
  - `random`: everyday filler, gated by `when`.
  - `social`: about a character; drawn from the monthly relationship slot.
  - `auto`: forced when `when` is true; for calendar beats and chain climaxes. Needs a tight `when` and usually `repeat`.
  - `queued`: only reachable by `queue` from another event.
- **Who it's about:** `actor:` an npc id, `any` (the engine picks a met character), or `npc` (inherited via `queue … with npc`).
- **When it can happen:** `when` (state, flag, relationship, month, year).
- **What it changes:** two options that each trade something. Use the magnitudes in the AGENTS.md balance table.
- **What it leaves behind:** flags, states, `queue`d follow-ups, `hollow +1` for main-mystery clues.

For a **chain**, sketch the graph first:

```
start (random, sets flag X, queues B in 2)
  -> B (queued; left: queue C now / right: flag Y)
  -> C (queued; outcome sets flag Z)
payoff (auto or random; when: flag(Z) ...)
```

Every queued event must be queued by something. Every flag you test must be set somewhere. Lint enforces both.

## 2. Write the blocks

Template for a two-choice card:

```
@event area_short_name
title: Short Evocative Title
when: <gate>
weight: 10
art: <icon key>
tags: <primary tag> <more tags>
scene: One sentence describing the illustration an artist should draw.
text: Two to four sentences. Present tense, second person. Set up a real dilemma; end on the moment of choice.
> left: Short label
  <effects>
  say: What happened, in one or two sentences, with a little wit.
> right: Short label
  check <skill> <dc>:
    <success effects>
    say: ...
  else:
    <failure effects>
    say: ...
```

Menu (a choice window): give 3–8 options with keys other than left/right (or set `type: menu`). Add `hint:` on each option, and `when:` on gated ones. **At least one option must have no `when`.**

Character event (`social`):

```
@event mira_new_thing
trigger: social
actor: mira
when: rel(mira) >= 15
...
```

Generic relationship event:

```
@event soc_new_thing
actor: any
when: not tagged(npc, faculty) and rel(npc) >= 10
repeat: 6
text: {npc} ... {They} look{s} at you ...
> left: ...
  rel npc +4
```

New class, club or job: add a `@state` in `content/states/states.grim` (with `group: elective|club|job`, `tick:`, `desc`), add an option to the matching menu in `calendar.grim` (`choose_elective`, `club_fair`, `job_board`), and add about 3 events gated on `has(<state>)`.

New character: add an `@npc` in `content/npcs/cast.grim`. Write an intro event (`random`, `actor: <id>`, `when: not met(<id>) and turn >= N`), 4–6 `social` events at rising `rel` thresholds, and, if `romance: true`, a confession at `love(<id>) >= 35 and rel(<id>) >= 25 and bond(<id>) != "partner"` with weight 30. Update the cast table in AGENTS.md.

New ending: add it to `content/endings.grim` with a `priority` that slots it correctly among the existing ones.

## 3. Quality bar

- Each option must cost or risk something. If one option is obviously better, rewrite.
- Every option ends with a `say:`. Outcomes should be specific and a little funny or poignant, never "You gain 5 mood."
- `text` stays under 400 characters, labels under about 36, and `say` lines under 300.
- Use `{npc}`, `{they}`, `{their}`, `{They}`, `{s}`, `{are}` for `actor: any` events. Never write `{they}'s` or `{they}'ve`.
- Use only art keys listed in `docs/grimoire-script.md` §8. Lint warns on unknown ones.
- Keep the world consistent: names, places and calendar from AGENTS.md. No gore, nothing explicit, no real-world brands.
- Don't change or rename existing ids. Saves and other events depend on them.

## 4. Verify (required)

```bash
node tools/grim.js fmt                  # canonical layout (spacing, indentation); never changes meaning
node tools/grim.js build
node tools/grim.js lint                 # must be 0 errors; fix warnings about your new content
node tools/grim.js sim 300              # 0 crashes; check your events aren't in "never seen"
node tools/grim.js sim 300 --policy social   # for relationship content
node tools/grim.js show <new_id>        # sanity-check one block and its references
```

If a new event never appears in the sim, its `when` is too narrow, its `weight` is too low, or nothing queues it. Fix it, or state in your report that it is deliberately rare. If an ending's share moves beyond about 35%, rebalance it.

Optional browser check: open `index.html?event=<id>&debug` (add `&actor=<npc>` for `actor: any`) to see the card exactly as players will.

## 4b. Translate (required while a translation exists)

The game ships in English and Simplified Chinese. New or changed English text falls back to English in Chinese until it's translated, and `lint` warns about it.

1. Run `node tools/grim.js i18n zh-CN`. It adds empty lines for your new strings to the matching `locales/zh-CN/**/*.lang` files and marks lines whose English you changed as `# STALE`.
2. Read `locales/zh-CN/GLOSSARY.md` for names, places, resources and tone. Add any new proper nouns you introduced.
3. Fill the translations. Either edit the `.lang` files directly (text after `=`), or write a partial file in `locales/zh-CN/_in/` with `@event <id>` headers and `key = 中文` lines, then re-run `i18n zh-CN` to merge it.
   - Keep `{npc}` `{player}` `{lyra}` `{=…}` tokens. Drop `{s}` and `{are}`; `{they}`/`{them}` become 她/他/TA and `{their}` becomes 她的/他的/TA的.
   - Use full-width punctuation and “” quotes. Keep option labels to 14 characters or fewer.
4. Run `node tools/grim.js i18n` until it reports 100%, then `lint` (no untranslated warning) and `sim 100 --lang zh-CN`.

If you can't translate, say so in your report. The game stays playable, because missing lines fall back to English.

## 5. Report back

Summarise how many events you added and in which files, any new flags, states or characters, the chain graph if you wrote one, the lint and sim results (coverage and ending distribution changes), and the translation status (`node tools/grim.js i18n`).
