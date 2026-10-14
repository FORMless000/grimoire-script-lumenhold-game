# Grimoire Script — language reference

Grimoire Script (`.grim`) is the content language of Lumenhold Academy. Every event, state, character, ending and global rule lives in `content/**/*.grim`. The engine never needs code changes to add content.

- Parser: `src/grimoire.js`. Engine semantics: `src/engine.js`.
- After editing, run `node tools/grim.js build` (the page loads `build/content.bundle.js`) and `node tools/grim.js lint`.

---

## 1. File structure

A file is a sequence of **blocks**. A block starts with a header at column 0 and runs until the next header:

```
@event library_whisper
title: Whispers in the Stacks
...
```

| Rule | Detail |
|---|---|
| Header | `@kind id` — `kind` is one of `game resource skill npc state event ending hook`. `id` is `lower_snake_case` and unique per kind across **all** files. `@game` takes no id. |
| Properties | `key: value` at column 0. Unknown keys are an error (typos are caught). |
| Long text | Continue a text property on following **indented** lines. A blank line inside makes a paragraph break. |
| Options | `> key: Label` at column 0 (events only). The option's body is indented beneath it. |
| Effect blocks | Some properties hold effects instead of text (`do:`, `tick:`, `on_add:` …). Put effects on indented lines below, or one effect inline: `tick: mood +2`. |
| Comments | Whole lines starting with `#` or `//`. There are no end-of-line comments. |
| Indentation | Spaces (tabs count as 2). Nesting is by relative indentation; 2 spaces is the convention. |

File order does not matter, except that `content/core/` loads first. Put new content in whichever file fits, or in a new file.

---

## 2. Block kinds

### `@event` — a card or menu the player resolves

```
@event pyro_candle
title: Light the Candle
when: has(class_pyromancy)
weight: 16
art: candle
tags: class magic
scene: A dark classroom, a single candle on a stool at the far end, a stern silhouette.
text: Professor Thorne places a candle at the far end of the hall. "Light it. From there."
> left: A careful spark
  check arcana 10:
    arcana +1
    say: The wick catches. Thorne grunts. From him, that is applause.
  else:
    mood -2
    say: Nothing. Then a wisp of smoke.
> right: Show them real fire
  check arcana 18:
    renown +3
    say: A pillar of white flame, then obedient silence.
  else:
    health -5
    say: The candle lights. So do the curtains.
```

| Property | Meaning | Default |
|---|---|---|
| `title` | Card title (required). Supports `{tokens}`. | — |
| `text` | Card body (required). Aim for under 400 characters. | — |
| `art` | Icon key from `src/art.js` (see §8). | sparkle |
| `scene` | One-sentence description of the intended illustration (placeholder for real art). | — |
| `tags` | Space- or comma-separated. The first known tag picks the card colour and label (see §8). | — |
| `when` | Expression; the event can only appear while true. Checked when the deck is built **and** again just before the card is shown. | always |
| `weight` | Expression; relative draw chance among eligible events. | 10 |
| `trigger` | How it enters a month's deck: `random`, `auto`, `social` or `queued` (§5). | `random`; `social` if `actor: any` |
| `actor` | The NPC the card is about: an npc id, `any` (engine picks one), or `npc` (inherited from the `queue … with` that scheduled it). Enables `npc` and `{npc}`. | none |
| `repeat` | Cooldown in months. Without it, the event happens **once per game** (once per character for `actor: any`). | once |
| `priority` | Ordering among forced cards (higher first). | queued 60, auto 50 |
| `type` | `card`, `story` or `menu` — inferred from the options (below). | inferred |
| `chain` | Free-text chain name, for documentation and `stats`. | — |
| `on_show:` | Effects applied the moment the card appears. | — |

**Options and type inference**

| Options written | Type | UI |
|---|---|---|
| `> left:` and `> right:` | `card` | Swipe left/right (the labels appear as the card tilts). |
| exactly one (any key) | `story` | A single "continue"-style choice. With no options at all, a `> ok: Continue` is added. |
| anything else, or `type: menu` | `menu` | A modal with a tile per option (2–10 work well). |

Option lines under `> key: Label` (indented):

| Line | Meaning |
|---|---|
| `when: <expr>` | The option is shown **locked** (🔒) when false. Works on cards and menus. Never lock every option. |
| `hint: text` | Sub-text under the label (menus) or on the button (cards). Use it to state costs ("Costs 20 gold"). |
| anything else | Effects (§4), run when the option is chosen. |

### `@state` — something persistent on the player

```
@state class_pyromancy
name: Elective: Pyromancy
kind: class
group: elective
art: flame
desc: Fire answers to will, not wishes.
tick:
  arcana +2
  health -1
```

| Property | Meaning |
|---|---|
| `name`, `desc`, `art` | Shown in the side panel. `desc` supports tokens. |
| `kind` | Purely visual: `origin class club job buff debuff neutral`. |
| `group` | Only one state per group: gaining one removes the others (`elective`, `club`, `job`, `origin`). |
| `duration` | Default length in months; omit for "until removed". `gain x 3` overrides it. |
| `hidden: true` | Not shown in the UI (internal bookkeeping). |
| `tick:` | Effects run at the start of every month while active (not in the month it was gained). |
| `on_add:` / `on_remove:` / `on_expire:` | Effects when gained / removed for any reason / removed because the duration ran out (`on_expire` runs before `on_remove`). |

Duration semantics: `gain sick 2` ticks at the next two month-starts, then expires. Gaining a state you already have extends its duration and does not re-run `on_add`.

### `@npc` — a character

```
@npc lyra
name: Lyra Vaneshade
# short: Lyra          (optional; what {npc} prints — defaults to the first word of name)
title: Heir of House Vaneshade, pyromancy prodigy
pronouns: she/her
house: Emberhall
color: #b0383c
romance: true
look: hair:7 skin:5 style:1
tags: noble ambitious fire peer
start_rel: 0
# seeks: often        (optional; how readily they come looking for you: often | sometimes | rarely | never)
desc: Brilliant, impatient and used to winning.
```

`pronouns` must start with `she`, `he` or `they` (this drives `{they}`, `{them}` …). `short` is the name `{npc}` prints (use it when the first word of `name` is a title: `short: Professor Thorne`). `romance: true` allows `love` to grow. `look` is optional and fixes the procedural portrait (hair 0–7, skin 0–5, style 0–4). `tags` can be tested with `tagged(npc, faculty)`; the character's `role:` counts as a tag too (`tagged(friend, student)` excludes staff, professors and outsiders such as Ilse).

**Casting by premise.** A generic event's `where` says who its premise fits, not just who it excludes:
- `tagged(x, peer)`: someone your age you spend time with (students, the prefect, Ilse); for hanging out, secrets, rivalries, birthdays and loans;
- `(tagged(x, student) or tagged(x, prefect))`: a classmate; for notes, homework, exams and class pairings;
- `tagged(x, teacher)`: someone who teaches a course; for advice after a lecture;
- `romanceable(x)`: for romance.

Shopkeepers and staff (`role: villager`, `staff`) have their own events instead.

`seeks:` scales how often a character comes looking for you on their own (design §5.5). `rarely` characters (professors, shopkeepers) come only once you have been going to them; `never` ones only appear where they are.

Each NPC carries a relationship record:

| Field | Range | Changed by |
|---|---|---|
| `met` | bool | `meet x`, or any `rel` / `love` / `bond` effect |
| `rel` | −100…100 | `rel x +N` |
| `love` | 0…100 | `love x +N` (romanceable characters only; lint warns otherwise) |
| `bond` | `none friend close rival nemesis partner ex` | `bond x status` |

### `@resource` and `@skill` — the player's numbers

Resources are the meters at the top of the screen. Skills appear in the side panel and drive `check`s.

```
@resource health
name: Health
icon: heart
min: 0
max: 100
start: 70
color: #d9606a
desc: Your body. At zero you collapse.
on_zero:
  queue crisis_collapse now
```

`on_zero:` runs once whenever a change takes the value from above `min` to `min`. Skills take `name icon start max desc color`. Values are clamped to `[min, max]` (default 0–100).

### `@hook` — global rules

```
@hook rent
on: month_start
label: Dormitory & board
when: turn > 1 and not has(summer_away)
do:
  gold -10
```

`on` is `game_start`, `month_start` or `month_end`. Month-start hooks run after state ticks; their effects appear in the month summary under `label`.

### `@ending`

```
@ending ending_archmage
priority: 80
title: The Archmage's Path
art: wand
when: arcana >= 80 and gpa >= 2.5
text: Graduating with highest honours...

@ending ending_hollow_hero
slot: mystery
priority: 95
when: flag(hollow_sealed)
...
```

At graduation the engine builds a **yearbook** (design §10.5). Each final ending (no `kind: early`) has a `slot:`: `headline` (the default), `mystery`, `relationships` or `personal`. Within a slot, endings are checked from highest `priority` down and the first ones whose `when` is true are taken, up to the slot's limit: headline 1, mystery 1, relationships 3, personal 2. The headline ending with no `when` (priority 0) is the fallback, and lint requires one. `excludes: a b` drops those endings once this one is picked. `kind: early` endings are reached only through the `end <id>` effect (game over) and take no slot. The ending screen shows the headline, then one line per other entry; the run log records them as `yearbook`.

### `@game`

This holds global settings, and there is exactly one (in `core/rules.grim`): `title subtitle years months cards_per_month max_cards_per_month social_per_month min_random_per_month intro summer_months`, plus `schema: 1`, the format version the content is written for (lint errors if it's missing or newer than the parser).

**The format is frozen at schema v1** (design §12). From now on blocks, properties, statements, functions and identifiers may be added but never removed or changed. `test/golden/schema-v1.json` records the frozen format; `node tools/grim.js schema` checks it (and `--update` records additions). The legacy constructs (`check`, `actor: any`, `love`, `draws:`, track `legacy:`, raw numbers and `grades` in options) are marked `legacy` there: they are the only removals allowed, in phase 3.

`min_random_per_month` guarantees that many random cards each month even when queued and auto cards already fill `cards_per_month` (the deck may then grow up to `max_cards_per_month`). Lumenhold uses 1, so calendar-heavy months still draw from the random pool.

---

## 3. Expressions

Used in `when`, `weight`, `if`, `chance`, `check`, assignments and `{=…}`.

**Operators:** `+ - * / %`, `== != < > <= >=`, `and or not` (or `&& || !`), parentheses. Use `==` to compare: a single `=` is an error. Strings use `"double"` or `'single'` quotes. `true` and `false` are allowed; booleans count as 1/0 in arithmetic (`flag(x) * 10`).

**Identifiers**

| Name | Value |
|---|---|
| any resource or skill id | its current value (`gold`, `arcana` …) |
| `turn` | 1…47 (months elapsed; each month is one day) |
| `month` | 1…12 within the year (1 Harvestmoon … 4 Frostcall term, 5–6 winter break, 7–10 term, 11–12 summer break) |
| `year` | 1…4 |
| `term` `break` `season` `final_year` `term_index` `gpa` `slot` | the calendar and tracks (§6c) |
| `runs_completed` | how many runs this player has finished on this machine or server. Flavour text only: never use it in a `when` that changes odds |
| `turns_left`, `max_turns`, `cards_this_month` | as named |
| `npc` | the bound actor's id (only in events with `actor`) |
| anything else | a custom variable (default 0), set with `name +1` / `name = …` |

**Functions** — bare names inside these are taken as ids, so write `has(sick)`, not `has("sick")`:

| Function | Returns |
|---|---|
| `has(x)` | true if flag `x` is set **or** state `x` is active |
| `flag(x)` | true if flag `x` is set |
| `left(state)` | months left (99 if permanent, 0 if absent) |
| `rel(n)` `love(n)` `bond(n)` `met(n)` | relationship fields (`bond` returns a string: compare with `bond(n) == "friend"`) |
| `romanceable(n)` `tagged(n, tag)` `npc_is(n)` | NPC tests (`npc_is(lyra)`: is the actor Lyra?) |
| `bonds(status)` | how many met NPCs have that bond (`bonds(partner) > 0`) |
| `known()` | how many NPCs you've met |
| `seen(event)` | times that event has been shown |
| `since(event)` | months since it was last shown (999 if never) |
| `chosen(event, key)` | true if the player picked that option the last time the event was shown |
| `rand(a, b)` | random integer a…b |
| `chance_of(skill_or_value, dc)` | the success % a `check` would have |
| `min max abs floor round clamp(v,lo,hi)` | math |

---

## 4. Effects

One statement per line. Blocks end with `:` and nest by indentation.

| Statement | Meaning |
|---|---|
| `gold +10` / `mood -5` | Add or subtract (clamped for resources and skills). |
| `gold +10~25` | A random amount in a range. |
| `x = expr` · `x += expr` · `x -= expr` · `set x = expr` | Assign or adjust any variable, resource or skill. |
| `say: text` | Outcome text shown after the choice. Multiple `say` lines join with spaces. Keep it to one line. |
| `flag a b c` / `unflag a` | Set or clear permanent boolean flags. |
| `gain state` / `gain state 3` / `lose state` | Add (optionally for N months) or remove a state. |
| `queue event` | Schedule an event for **next** month. |
| `queue event in 3` | …in 3 months (`in 0` means later this month). |
| `queue event now` | It becomes the **very next card** (this is how menus lead to sub-scenes). |
| `queue event … with npc` / `with lyra` | Carry an actor into the queued event (the target uses `actor: npc`). |
| `rel lyra +5` · `love lyra +3~6` · `bond lyra friend` · `meet lyra` | Relationships. Use `npc` instead of an id for the bound actor. Each implies `meet`. |
| `end ending_id` | Game over with that ending (after the outcome card). |
| `if expr:` / `elif expr:` / `else:` | Branching. |
| `chance 30:` … `else:` | 30% (any expression; `chance 30%:` also works). |
| `check arcana 20:` … `else:` | Skill check (below). The first top-level `check` in an option is shown on the button with its odds. |

**Skill checks:** success % = `clamp(50 + (skill − DC) × 3, 5, 95)`. At skill = DC it's 50%; 10 points above is 80%. The DC can be an expression (`check lore 12 + year * 8:`).

**Text tokens** (in `title`, `text`, `scene`, labels, hints, `say`):

| Token | Becomes |
|---|---|
| `{player}` `{month}` `{year}` | Player name, current month name, year number |
| `{npc}` | Actor's short name (`short:`, else the first word of `name`); `{npc.fullname}`, `{npc.title}`, `{npc.house}` |
| `{they} {them} {their} {theirs}` | Actor pronouns; capitalise the token for a capital (`{They}`) |
| `{are}` · `{s}` | Verb agreement: `{They} {are} late` → "She is late" / "They are late"; `{they} say{s}` → "she says" / "they say" |
| `{lyra}` / `{lyra.their}` | A specific character's first name or pronoun |
| `{=expr}` | An expression's value, e.g. `{=gold}`, or `{=flag(x) and " extra text" or ""}` |

Avoid contractions that break with "they" (`{they}'s`, `{they}'ve`).

---

## 5. How a month is built

> This is the v0.2 deck, still used by content with no `day_term` in `@game`. Lumenhold now builds each month as one day; see §6c.

1. **State ticks**, then `month_start` hooks (shown in the month summary).
2. The deck is assembled:
   - **queued** events now due (by `priority`), then **auto** events whose `when` is true (by `priority`);
   - **social** cards: `social_per_month` (1), plus 1 more at 60% once you have a strong relationship (|rel| ≥ 30 or any bond), plus 1 more at 40% with four or more;
   - **random** events until the deck holds `cards_per_month` (3), and at least `min_random_per_month` (1) of them.

   Social and random cards are shuffled.
3. Cards are played in order. `queue … now` inserts at the front. Each card re-checks its `when` before showing (so a queued follow-up can quietly skip itself).
4. When the deck is empty, `month_end` hooks run, then the next month begins, or the final ending is chosen after month 36.

**Triggers in short**
- `random` — the filler pool. Most events.
- `social` — the relationship slot. Requires a met actor (`actor: any` or a fixed met NPC).
- `auto` — forced in whenever `when` is true: calendar beats, menus, chain finales. Always give it a tight `when` and usually a `repeat`.
- `queued` — only appears through `queue`. Lint warns about orphans.

**`actor: any` selection:** every met NPC for whom `when` is true is a candidate. People with stronger relationships (|rel|, love, a bond) are picked more often. The event is once **per character** (or `repeat` = per-character cooldown) and rests globally for 2 months after showing.

---

## 5b. Translations (`.lang` files)

Content is written in English in `.grim`. Each language lives in `locales/<lang>/`, mirroring `content/` (`events/life.grim` → `events/life.lang`), plus `ui.lang` for interface strings. A `.lang` file is a list of blocks and keyed strings:

```
@event lantern_night
# en: Lantern Night
title [3f9a2c] = 灯笼夜
# en: You let it go. It rises higher than all the others.
opt.right.say.1 [b71e04] = 你放手了。它比其他所有灯笼都升得更高。
```

- **Keys** name the field: `title text scene`; `opt.<key>.label` / `.hint` / `.say.N` (the Nth `say:` in that option, counting through every branch in source order); `on_show.say.N`. NPCs: `name short title house desc`. States: `name desc` and `<on_add|tick|on_expire|on_remove>.say.N`. Resources: `on_zero.say.N`. Hooks: `label`, `do.say.N`. `@game`: `title subtitle intro month.1`…`month.12`.
- **`[hash]`** is a short hash of the English the line was translated from. When the English changes, the tool marks the line `# STALE`; fix the translation, delete the `[hash]`, and re-run.
- Text uses the same escapes as `.grim` and must keep `{npc}`, `{player}`, `{lyra}` and `{=expr}` tokens. Pronoun tokens (`{they}` `{their}` `{are}` `{s}` …) are filled from the `pronoun.*` keys in `ui.lang`; a language may set them to empty.
- **Missing or empty** lines fall back to English, so a partial translation is always playable.

Commands:

```bash
node tools/grim.js i18n            # coverage per language
node tools/grim.js i18n zh-CN      # create/refresh every zh-CN .lang file (adds new keys, flags stale ones, moves removed ones to _obsolete.lang)
node tools/grim.js sim 100 --lang zh-CN   # play with the translation applied
```

For bulk work, put partial files (just `@block id` headers and `key = text` lines) in `locales/<lang>/_in/`; the next `i18n <lang>` run merges them in and deletes them. `lint` reports untranslated and stale strings and any token mismatch.

---

## 6. Patterns

**A cause-and-effect chain**

```
# random: sets things in motion
@event fox_injured
...
> right: Free it and bandage the paw
  flag fox_met
  queue fox_returns in 2

@event fox_returns
trigger: queued
...
> right: Open the window
  queue fox_bond in 1
```

**A choice window that leads to a scene:** a menu option does `queue scene_id now`.

**A branch that remembers:** set a flag (`flag kael_ally`), and later gate on it: `when: flag(kael_ally)`, or inside effects `if flag(kael_ally):`.

**Plot progress:** read the arc, not a home-made counter. `clock(hollowstar) >= 4` is the schedule (the world moves without you); `clues(hollowstar) >= 2` is what the player has engaged with. A custom counter (`debt_paid += 1`) is still fine for a self-contained chain.

**A moral choice:** put the weight on `alignment` (−100 Hollow … +100 Lumen): `alignment -small` for a cruel, greedy or Star-tempted choice, `alignment +small` for an honest or selfless one at a cost. Gate on the design thresholds, ±30 and ±60 (`when: alignment <= -30`). Below −50 the climb back toward Lumen runs at half speed (the resource's `drag:`). Characters tagged `virtuous` or `ruthless` (`tagged(npc, virtuous)`) are the ones who react.

**A relationship milestone:** `when: spark(npc) >= 30 and bond(npc) != "partner"`, with `weight: 30` so it appears promptly once unlocked.

**A purchase:** `when: gold >= 20` plus `hint: Costs 20 gold` on the option, then `gold -20` in its effects.

**Seasonal:** `when: month == 4 or month == 5`.

---

## 6a. Numbers and options (schema v1, phase 2a)

These constructs are the new event format. Older forms keep working through a compatibility layer and are counted as **legacy** by lint (`lint --legacy` lists them; phase 3 migrates them).

**Size tiers.** Write amounts as tier words: `mood +medium`, `gold -small`, `rel npc +large`, `spark lyra +tiny`, `arcana +small` (skills use the `xp` row). Amounts come from `@balance sizes` in `content/core/balance.grim`: tiny, small, medium, large, huge. Raw numbers (`mood +5`) are legacy.

**Presets.** Named groups of effects defined with `@preset` (`params:` and a `do:` body using `$param`), used as a statement: `grind arcana`, `rest`, `social npc`, `work`, `splurge`, `risk renown`. They expand at compile time.

**Challenges** replace `check` (legacy):

```grim
challenge duel vs lyra.arcana hard:     # duel | negotiate | deceive | exam | research | brew | enchant | feat | spell
  win:
    renown +medium
  partial:                              # optional: a band of ±5 around the DC
    renown +small
  lose:
    health -medium
```

The skill is mapped from the kind (duel: (vigor + arcana) / 2; negotiate: charm; deceive: guile; research and exam: lore; brew and enchant: alchemy; feat: vigor; spell: arcana), or set with `using <skill>`. DC = `E(turn)` (the `@balance curve`) + the difficulty tier (trivial −15, easy −7, medium 0, hard +8, heroic +16) + `vs <who>.<stat>` (that character's stat minus E(turn), capped at ±15). Odds = clamp(50 + 2.5 × (skill − DC), 8, 92). A card drawn as its `variant: hard` is one tier harder and pays positive tier rewards ×1.5 (the director chooses when, phase 2b).

**Spells.** `learn_spell ward` (level +1, max 3) or `learn_spell ward 2`; `spell_level(ward)` in conditions. On a card, `> up[ward]: Raise a ward` is the swipe-up / ↑ option: hidden until the spell is known, disabled when mana is short; its mana cost (`@spell cost`, per level) is paid automatically and shown in the preview. `@game spell_resource` names the resource (default `mana`).

**Option properties.** `memory: <kind> <who>` (kind from `@vocab memory_kinds`; who is `npc` or a character id) records a memory when the option is chosen (recall arrives in phase 4).

**Facts and relations.** `learn lyra.mother` reveals a fact (`@fact` `unlock:` conditions also reveal them at month start; surface facts are known on meeting); `knows(lyra.mother)` tests it. `npc_rel lyra kael ±n` (or a tier) changes how two characters feel about each other (both directions); `npc_rel(lyra, kael)` reads it, seeded from `relations:`. `<npc>.<stat>` in expressions reads a character's stat (`lyra.charm`, `npc.wealth`).

**Relationships.** `spark` replaces `love` (legacy alias): it fades 15% a month without a romantic moment; a partnership ends after two months below 20. Friendship (`rel`) fades by 2 a month toward 0 after 6 months without contact.

**Event fields.** `class:` (routine, milestone, incident, windfall, story, crisis; see `docs/authoring/classes.md`) and `tone:` (from `@vocab tones`). Lint checks each class's budget with the preview engine, in medium-equivalents (`@balance weights` × change ÷ medium size): a routine option must cost or risk something and stay within ±1.5; milestones allow 2 large changes, windfalls 1; incidents need at least two options.

**Resources.** `max:` may be an expression (`max: 40 + arcana / 2`); `display: panel` moves a resource from the top bars to the You panel; `warn_below: N` marks it low; `drag: -50 0.5` halves increases while below −50.

**Inline text variation** (Ink-style; in any text, including `say:`): `{~a|b|c}` one of them (deterministic per seed, turn and event), `{&a|b}` cycles each time the event is seen, `{a|b|c}` runs through them and stays on the last, `{cond: a|b}` picks by a condition (`{gold > 20: rich|poor}`); a colon inside `{~…}` or `{&…}` is plain text. `cast_as(role, npc)` tests who filled a role (`{cast_as(here, maud): …|…}`). Alternatives may contain other tokens. Translations keep the same structure.

**Previews.** Every option's outcome is previewed exactly on the buttons: the engine runs the option's effects on a scratch copy of the state for each path through its chances, checks and challenges. Lint rejects `rand()` in option effects (use a chance or a range). `grim balance` asserts, over 1,000 random games, that every real outcome lies within its preview.

---

## 6b. The worldbook (`content/world/`)

Worldbook blocks are **data**: canon for authors, briefs and lint. Until phase 2b the engine doesn't play them (and `passed()` / `clue()` are always false). The full property table is generated in `docs/authoring/schema.md`.

| Block | What it is | Structured values |
|---|---|---|
| `@npc` (extended) | `age` (required; romance needs 18+), `role`, `year`, `traits` / `interests` (from `@vocab`), `voice` | `stats: arcana 34 lore 22 wealth 5` · `schedule: place@slot,slot …` · `relations: npc:value …` |
| `@fact npc.key` | what can be learned about a character: `tier` surface / personal / secret, `unlock` (expression), `text` | |
| `@place` | `region`, `kind` (public, club, job, thesis, internship, plan), `track`, `open` slots, `discover` / `closed_when` / `hinted_when` (expressions), `hint`, `desc` | `map: campus x,y` |
| `@track` | `kind` (course, club, job, internship, thesis), `skill`, `levels` + `level_names`, `place`, `hidden`, `prereq`, `ranks`, `due`, `lead` | `teaches: spell@level …` · `pay: 8, 12, 18` |
| `@spell` | `discipline` (a course track) | `cost: 8, 6, 5` · `power: 1, 2, 3` |
| `@arc` | `canon`, `clues`, `key_clues`, `cast` | `acts: name@yN …` · `clock: 0..12` · `beats: clock@yNmM …` |
| `@lore` | `keys` (comma-separated), `canon` hard / soft, `text` (not translated) | |
| `@faction`, `@archetype`, `@timeline`, `@vocab` | members and stance; spawn templates (`age: 18..22`); dated history and calendar beats; controlled vocabularies (`values:`) | |

Translated worldbook fields: place name, desc and hint; track name, level names, ranks and desc; spell name and desc; fact text; faction and arc name and desc. Lists that are shown to players (`level_names`, `ranks`) are kept as text; in Chinese, separate them with 、.

---

## 6c. The world loop (phase 2b)

From phase 2b a run is **four years, 47 months, and each month is one day** (design §4). `@game` sets the shape:

```
years: 4
last_month: 11                       # the run ends in Goldenhaze of year 4 (turn 47)
calendar: term=1-4 break=5-6 term=7-10 break=11-12
seasons: autumn=1-3 winter=4-6 spring=7-9 summer=10-12
day_term: morning=courses noon=social:1-2 afternoon=visit evening=visit night=world:1-2 midnight=special:0-1
day_break: morning=plan afternoon=visit night=world:1
max_cards_per_day: 14
```

**A day** (`src/director.js`). After the month's start effects, the player picks the visit slots on the **map** (two in term, one on a break). Then the director fills each slot from its source: `courses` (events of enrolled courses), `social` (`trigger: social`), `visit` (events with `place:` the player picked), `world` (random events with no place), `special`, `plan` (events for the active break plan). `:1-2` is how many cards a slot draws. Each candidate scores `weight × novelty × relevance × variety`. Pushed cards (queued, auto, arc beats, track notices) go into their `slot:` (else morning). When the day is over `max_cards_per_day`, priority decides (story > track > pushed > friend > social > ambient) and pushed cards that don't fit move to the next day. `when` is checked again as each card is drawn.

**People come by two tracks** (design §5.5). An event with a fixed `actor: <npc>` (and no `place:`, `track:`, `plan:` or `slot:`) is in that character's own pool as well as in the shared pools; generic social events (`per: npc` casts) can be cast with any one character.
- *You find them:* the shared pools as above; a visit to a place where a character's `schedule:` puts them (met or not, so introductions happen where people are) and the social slot (anyone scheduled at a place you know) can each give a card from that character's pool.
- *They find you:* every met character rolls each month, on their own, to bring you one card from their pool (at most two such cards a month, one on a break). The chance follows **warmth**: recent contact you chose. A card where you raised their `rel` or `spark` (even at the cap) warms them; a card with them where you didn't cools them; visiting where they are warms them a little; warmth fades every month. Standing friendship, spark and a bond add to it.
- So a character needs a ladder of personal events starting near `rel 0` (a rival's too): if every one of their events is gated at `rel >= 10`, a new acquaintance has nothing to bring you and the friendship stalls.

**Identifiers:** `term` and `break` (booleans), `season` (`"autumn"` …), `final_year`, `term_index` (1–8), `gpa` (0–4), `slot` (the slot being drawn). `month` is 1–12 within the academic year; `year` is 1–4; `turn` is 1–47.

**Event fields**

| Field | Meaning |
|---|---|
| `place: library` | Drawn when the player visits that place. `replaces: visit1` (or `visit2`) makes it a festival that takes that visit: the map locks the slot to the place. |
| `slot: night` | The slot a pushed or arc event lands in (`morning noon afternoon evening night midnight`). |
| `track: evocation` · `level: 2` · `rank: 1` | An event of that course level or club/job rank; drawn in the course's morning or at its place. |
| `plan: castle` | Drawn on a break with that plan (`plan_castle` state). |
| `arc: the_bell` · `beat: 3` | A plot card, eligible once the arc's clock reaches the beat. One plot card a month, two in a beat month. |
| `offers: courses` · `pick: 2` | A generated menu: one option per course (club, job) on offer, plus the event's own options. `pick: N` lets the player choose up to N (multi-select). |
| `cast:` | Roles filled from the cast (below). |
| `lesson:` · `scope:` · ending `slot:` / `excludes:` | Parsed and stored; used from phase 3. |

**Cast roles.** One role per line under `cast:`:

```
cast:
  friend: any where rel(friend) >= 10      # any met character for whom the condition holds
  stranger: anyone                         # met or not
  gossip: present(place)                   # someone whose schedule puts them here now
  keeper: maud                             # a fixed character
```

Roles are filled on a scratch copy of the RNG, with backtracking, favouring stronger relationships. In text use `{friend}`, `{friend.their}`; in effects `rel friend +small`, `spark friend +tiny`; in challenges `vs friend.duel`. Inside a role's event, plain `{they}` / `{them}` refer to the first role. `per: friend` makes the event's once / `repeat:` bookkeeping per character in that role (it can happen once with each friend), with a two-month rest for the event as a whole; this is what `actor: any` did. `actor: any` still works as a one-role cast (legacy). `say[lyra]: …` right after a `say:` line replaces it when that role is Lyra (its translation key gets the suffix `@lyra`).

**Tracks** (`@track` in `content/world/tracks.grim`). Statements: `enrol evocation` (or `enrol evocation 2`), `join duelling`, `leave duelling` (`leave job` / `leave club`: whichever you have), `apply intern_royal_library`, `promote track`, `perform track +small`, `rank_xp track +small`, `progress thesis +medium`, `study evocation +small` (exam preparation for an enrolled course, capped at 15; `study +small` without a track prepares for every enrolled course; this replaces `grades` effects). Inside a track notice, `track` means the track that triggered it, and `{track}` prints its name. Functions: `enrolled(t) member(t) applied(t) level(t) passed(t, n) rank(t) performance(t) progress(t) due(t) visits(t)`.

- **Courses:** enrolment menus (`offers: courses`, `pick: 2`) at each term start; `opens: 2` delays a course to term 2. At term end each enrolled course sits an exam (a challenge at the course level's difficulty, easier for study), graded A/B/C/F; the grades make the **GPA**. Passing a level teaches its spells (`teaches: flame@1 tide@2`). `legacy:` lists v0.2 states that enrolling grants, so old class events keep firing.
- **Clubs and jobs:** one of each at a time. Each term asks for `due:` visits to the track's place. Visits raise performance and rank XP; jobs pay `pay:` per visit (double on breaks). Missed visits cost performance (and standing with the `lead:`); a term with performance ≥ 70 raises it. Below 40 a `track_warning` follows, at 0 you are dropped, and with enough rank XP and performance ≥ 70 a `track_promotion` is offered.
- **Internships and the thesis** use the same statements: `apply`, then a letter event that `join`s or `leave`s; the thesis is `join thesis` with progress from visits and `progress thesis +…`.

**Hooks:** `on: term_start` and `on: term_end` run at the first and last month of each term (rules use them for tuition, term marks and probation).

**Places** (`@place`): `map: campus 585,278` positions the marker; `open:` lists the slots it is open in; `season:`, `closed_when:` close it; `discover:` (a condition) finds it, else it starts found unless `hinted_when:` shows it as "?"; `track:` makes it a club or job place; `draws:` lets old tag-only random events be drawn there. Statements: `discover library`. Functions: `discovered(p)`, `present(p)` (who is there now), `visits_to(p)` (lifetime visits picked on the map).

**Arcs** (`@arc` in `content/world/arcs.grim`): `clock: 0..12` and `beats: 1@y1m3 2@y1m9 …` advance the clock on schedule whatever the player does. Statements: `find bell_rope` (a clue), `advance hollowstar +1`. Functions: `clue(x)`, `clues(arc)` (how many of the arc's clues are found), `clock(arc)`, `act(arc)` (the current act by year).

**Push windows** (design §5.3): `queue x within 2..4` (some month 2–4 months from now) and `queue x by month 6` (before the next month 6 is over). Each month in the window the card is pushed with a rising chance (1 / months left), and on the last month for certain. `unqueue x` drops a pending one.

## 7. Errors the toolchain catches

`node tools/grim.js lint` reports:

- **Parse errors:** bad indentation, unknown property, single `=`, unknown statement, a card without both `left` and `right`.
- **References:** unknown event, state, npc, ending or skill in `queue`, `gain`, `rel`, `end`, `check` and in function arguments; `chosen(event, key)` with a bad key.
- **Actors:** `npc` / `{they}` used in a block without an actor.
- **Typos:** a flag that is read but never set; a variable that is read but never assigned.
- **Orphans:** queued events nobody queues.
- **Style:** text that is too long, a long label, unknown art key, unknown bond status, love on a non-romanceable NPC.
- **Worldbook:** unknown places, tracks, spells and npcs in worldbook blocks; values outside `@vocab`; a character without an age, or romance under 18; malformed structured values.
- **Canon:** proper nouns in player-visible text that no worldbook entry, `@lore` key, glossary or `@vocab canon_allowlist` knows (a warning; an error for batch content under `content/batches/`). `node tools/grim.js canon` lists them.

`node tools/grim.js sim 300` plays 300 random games and reports crashes, soft-locks, ending distribution, never-seen events and average final values. Add `--policy social` to play a relationship-focused player, or `--policy cautious` to avoid draining low resources.

---

## 7b. Canonical form and structural search

These two tools are the basis for structured edits across many files: find what to change with `query`, change it, normalise with `fmt`, then verify with `check`.

### `fmt`: canonical layout

`node tools/grim.js fmt` rewrites every content file in canonical layout (`fmt <file…>` for specific files; `fmt --check` only lists files that differ and exits 1). `check` reports non-canonical files without failing.

| Rule | Canonical form |
|---|---|
| Whitespace | LF line endings, no trailing spaces, tabs expanded, one final newline |
| Blank lines | At most one in a row; none at the start of a file or right after a header; one before every `@block` (before its leading `#` comments) |
| Headers and properties | `@kind id`, `key: value`, `> key: Label` |
| Indentation | Effect bodies 2 spaces per nesting level; text continuation lines 2 spaces; indented comments align with the next line |
| Statements | `say: …`, `else:`, `gold -10`, `gold +5~8`, `rel npc +4` |

`fmt` is lossless: comments and paragraph breaks are kept, and expressions and text are never rewritten. Before writing, it compiles the file before and after and refuses (leaving the file untouched) unless both compile to exactly the same content. A file that does not parse is reported, not formatted. Running it twice changes nothing.

### `query`: find blocks, options and statements

```bash
node tools/grim.js query NODE [WHERE] [--file S] [--grep RE] [--group FIELD] [--json]
node tools/grim.js query --fields        # every field, per node kind
```

`NODE` is a block kind (`event state npc ending hook resource skill`), `option`, a statement kind (`say if chance check flag unflag gain lose queue rel love bond meet end delta assign`), `stmt` (any statement) or `any`. `WHERE` is an ordinary Grimoire expression evaluated against the row's fields. `has(x)` means "tagged x". A field that does not apply, or a DC that is not a constant, makes every comparison false. Each match prints `file:line`, the enclosing `block/option`, and the source line.

| Question | Query |
|---|---|
| Easy checks that don't scale with the year | `query check 'dc < 12 and not scales'` |
| How checks are spread across skills | `query check --group skill` |
| Large gold losses | `query delta 'name == "gold" and amount <= -30'` |
| High-weight romance events among the character arcs | `query event 'has(romance) and weight >= 20' --file people` |
| Options the player gets no `say:` feedback from | `query option 'says == 0'` |
| Everything that queues a given event | `query queue 'target == "soc_loan_repaid"'` |
| Lines mentioning a word | `query say --grep lantern` |

`--group FIELD` prints counts per value instead of rows. `--json` returns full rows, including `src`, the source line, for scripts and agents. Line numbers point into the `.grim` source, so the matches are a ready-made worklist for edits.

### `rename` and `migrate`: structured edits

`node tools/grim.js rename KIND OLD NEW [--dry-run]` renames an `event`, `state`, `npc`, `flag`, `var` or `ending` id everywhere it's referenced:
- **In content:** block headers, statements, `actor:`, conditions, and `{tokens}` in text. Prose is never touched.
- **In translations:** `.lang` block headers and tokens, with their hashes re-stamped so translations don't turn stale.

It refuses targets that already exist and names used by two kinds of id. It verifies by counting references in the compiled content before and after, and writes nothing if the counts don't match. Mentions in code and docs are listed for you to check by hand. Saves are not migrated.

`node tools/grim.js migrate [--dry-run]` runs the scripts in `tools/migrations/` (`NNNN-name.js`) that haven't been applied yet, and records them in `content/.migrations.json`:

```js
module.exports = {
  id: '0001-gold-costs',
  description: 'Small gold costs become 2',
  run(ctx) {
    for (const row of ctx.query('delta', 'name == "gold" and amount == -1')) ctx.edit(row, (line) => line.replace('gold -1', 'gold -2'));
    ctx.report('done');
  },
};
```

`ctx` offers `query(node, where)` (the rows of `grim query`), `edit(at, textOrFn)`, `insertAfter(at, text)`, `remove(at)`, `lines(file)`, `report(msg)` and the compiled `content`. Lines always refer to the file as it was before the migration. A migration whose result doesn't compile writes nothing. Changed files are formatted. Afterwards, run `build`, `lint` and `diff`.

---

## 8. Reference lists

**Art keys** (`src/art.js`): book scroll letter potion cauldron flame wave moon star sun rain bolt leaf flower tree mushroom snow tower house door tent key lock chain coin pouch gem ring crown wand sparkle rune sword shield duel trophy mask eye hand heart heartbreak group skull ghost cat owl raven fox dragon frog spider paw feather candle lantern mirror hourglass bell music cup meal bed cards dice map compass scales paper cross planet gear broom bottle

**Tags with visual meaning** (card colour and label): study social romance danger mystery money job nature festival crisis class club home magic rival story exam. Any other tag is allowed and is useful for `stats`.

**Bond statuses:** none friend close rival nemesis partner ex.
