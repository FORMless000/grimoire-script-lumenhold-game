# Grimoire Script — language reference

Grimoire Script (`.grim`) is the content language of Lumenhold Academy. Every event, state, character, ending and global rule lives in `content/**/*.grim`. The engine never needs code changes to add content.

- Parser: `src/grimoire.js`. Engine semantics: `src/engine.js`.
- After editing, run `node tools/grim.js build` (the page loads `build/content.bundle.js`) and `node tools/grim.js lint`.
- **Current forms first.** Examples here use the current event format: tier words (`mood -small`), `challenge`, `spark`, `cast:` roles and a `class:` on every event. Older forms that still parse (raw amounts in events, `check`, `love`, `actor: any`, `grades`) are marked *legacy* where they appear; lint counts them, and §6a says what replaces each. Writing guidance is in `docs/authoring/` and `skills/write-academy-events/`.

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
track: evocation
level: 1
class: routine
tone: light
repeat: 5
weight: 10
art: candle
tags: class magic
scene: A dark classroom, a single candle on a stool at the far end, a stern silhouette.
text: Professor Thorne places a candle at the far end of the hall. "Light it. From there."
> left: A careful spark
  challenge spell using arcana easy:
    win:
      arcana +small
      say: The wick catches. Thorne grunts. From him, that is applause.
    lose:
      mood -small
      say: Nothing. Then a wisp of smoke.
> right: Show them real fire
  challenge spell using arcana hard:
    win:
      renown +small
      say: A pillar of white flame, then obedient silence.
    lose:
      health -small
      say: The candle lights. So do the curtains.
```

| Property | Meaning | Default |
|---|---|---|
| `title` | Card title (required). Supports `{tokens}`. | — |
| `text` | Card body (required). Aim for under 400 characters. | — |
| `art` | Icon key from `src/art.js` (see §8). | sparkle |
| `scene` | One-sentence description of the scene, shown in italics under the card (Settings → Scene descriptions). | — |
| `tags` | Space- or comma-separated. The first known tag picks the card colour and label (see §8). | — |
| `when` | Expression; the event can only appear while true. Checked when the deck is built **and** again just before the card is shown. | always |
| `weight` | Expression; relative draw chance among eligible events. | 10 |
| `trigger` | How it enters a month's deck: `random`, `auto`, `social`, `queued` or `letter` (§5, §6c). | `random` (`social` for the *legacy* `actor: any`) |
| `actor` | The NPC the card is about: an npc id, `any` (engine picks one), or `npc` (inherited from the `queue … with` that scheduled it). Enables `npc` and `{npc}`. | none |
| `repeat` | Cooldown in months. Without it, the event happens **once per game** (once per character with `per: <role>`). | once |
| `priority` | Ordering among forced cards (higher first). | queued 60, auto 50 |
| `defer` | Expression (playtest 2, I6). When a pushed card is about to show and this is true, it goes back to the queue for next month instead (a failed `when` drops it). Lumenhold: `night_suspicion` waits with `defer: off_campus`. | — |
| `type` | `card`, `story` or `menu` — inferred from the options (below). | inferred |
| `chain` | Free-text chain name, for documentation and `stats`. | — |
| `on_show:` | Effects applied the moment the card appears. | — |

**Options and type inference**

| Options written | Type | UI |
|---|---|---|
| `> left:` and `> right:` | `card` | Swipe left/right (the labels appear as the card tilts). |
| exactly one (any key) | `story` | A single "continue"-style choice. With no options at all, a `> ok: Continue` is added. |
| anything else, or `type: menu` | `menu` | A lead-in card (the title, text and scene, with one button saying a choice follows), then a modal with a tile per option (2–10 work well). Write the `text:` as the lead-in; every option needs a `say:` (lint). |

Option lines under `> key: Label` (indented):

| Line | Meaning |
|---|---|
| `when: <expr>` | On a card, the option is shown **locked** (🔒) when false. In a menu it is **hidden** when false (playtest 2, M24), unless it has `locked:`. Never gate every option. |
| `locked: text` | (menus) When `when` is false, show the option anyway, disabled, with this reason. Use it for prerequisites the player can see and work towards ("Needs Astromancy II.", "Needs 40 crowns."); leave relationship, state and plot gates hidden. Text variants work (`{member(x): They've already asked you back.|Needs Astromancy II.}`). |
| `hint: text` | Sub-text under the label (menus) or on the button (cards). Use it to state costs ("Costs 20 gold"). |
| anything else | Effects (§4), run when the option is chosen. |

### `@state` — something persistent on the player

```
@state inspired
name: Inspired
kind: buff
art: sparkle
duration: 2
desc: Ideas arrive faster than you can write them down.
tick:
  lore +1
  arcana +1
  mood +2
  say: {~Ideas arrive faster than you can write them down.|You fill a notebook and start another.}
```

A state's `tick:` (like a hook's `do:`) may use raw amounts: they are monthly rules, not event outcomes. Its `say:` lines show in the month summary beside the numbers.

| Property | Meaning |
|---|---|
| `name`, `desc`, `art` | Shown in the side panel. `desc` supports tokens. |
| `kind` | Purely visual: `origin class club job buff debuff neutral`. |
| `group` | Only one state per group: gaining one removes the others (`elective`, `club`, `job`, `origin`). |
| `money` | An origin's money situation in one line, shown on the origin screen (`tags: poor` adds a warning). |
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

`pronouns` must start with `she`, `he` or `they` (this drives `{they}`, `{them}` …). `short` is the name `{npc}` prints (use it when the first word of `name` is a title: `short: Professor Thorne`). `romance: true` allows `spark` (romantic interest) to grow. `look` is optional and fixes the procedural portrait (hair 0–7, skin 0–5, style 0–4; `body:1` draws a goblin, its skin 0–3 a shade of green). `tags` can be tested with `tagged(npc, faculty)`; the character's `role:` counts as a tag too (`tagged(friend, student)` excludes staff, professors and outsiders such as Ilse).

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
| `met` | bool | `meet x`, or any `rel` / `spark` / `bond` effect |
| `rel` | −100…100 | `rel x +small` (tier words; the `rel` row) |
| `spark` | 0…100 | `spark x +tiny` (romanceable characters only; lint warns otherwise). `love` is its legacy name. |
| `bond` | `none friend close rival nemesis partner ex` | `bond x status` |

### `@resource` and `@skill` — the player's numbers

Resources are the meters at the top of the screen. Skills appear in the side panel and drive challenges (§6a).

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
@hook break_rent
on: month_start
label: Board at the castle
when: break and (has(plan_castle) or has(plan_work))
do:
  gold -8
  say: {~The castle in the holidays still wants its board.|A bed in an empty dormitory costs the same as a full one.}
```

`on` is `game_start`, `month_start`, `month_end`, `term_start` or `term_end`. Month-start hooks run after state ticks; their effects appear in the month summary under `label`, with their `say:` lines. Hooks, like state ticks, may use raw amounts.

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
| `term` `break` `season` `final_year` `wrapup` `term_index` `gpa` `term_gpa` `slot` | the calendar and tracks (§6c) |
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
| `rel(n)` `spark(n)` `bond(n)` `met(n)` (`love(n)` is *legacy* for `spark`) | relationship fields (`bond` returns a string: compare with `bond(n) == "friend"`) |
| `romanceable(n)` `tagged(n, tag)` `npc_is(n)` | NPC tests (`npc_is(lyra)`: is the actor Lyra?) |
| `bonds(status)` | how many met NPCs have that bond (`bonds(partner) > 0`) |
| `bonds_around(status)` | the same, counting only those who are `around` now: use it to offer a scene with someone of that bond in person (`bonds_around(partner) > 0`) |
| `known()` | how many NPCs you've met |
| `seen(event)` | times that event has been shown |
| `since(event)` | months since it was last shown (999 if never) |
| `around(n)` | true if `n` can be met in person now: not away for the break (`schedule_break: away`) and not gone (`gone_when`). A card that names someone it doesn't cast checks it |
| `apart(n)` | months since the last card with `n` (or the last change in your standing with them); 999 if never. Per person, unlike `since(event)` |
| `chosen(event, key)` | true if the player picked that option the last time the event was shown |
| `rand(a, b)` | random integer a…b |
| `chance_of(skill_or_value, dc)` | the success % a `check` would have |
| `min max abs floor round clamp(v,lo,hi)` | math |

---

## 4. Effects

One statement per line. Blocks end with `:` and nest by indentation.

| Statement | Meaning |
|---|---|
| `gold -small` / `mood +medium` / `arcana +tiny` | Add or subtract a tier (§6a; skills use the `xp` row). Clamped for resources and skills. |
| `gold +10` · `gold +10~25` | A raw amount, or a random one in a range: for hooks, states and custom counters; *legacy* in events. |
| `x = expr` · `x += expr` · `x -= expr` · `set x = expr` | Assign or adjust any variable, resource or skill. |
| `say: text` | Outcome text shown after the choice. Multiple `say` lines join with spaces. Keep it to one line. |
| `flag a b c` / `unflag a` | Set or clear permanent boolean flags. |
| `gain state` / `gain state 3` / `lose state` | Add (optionally for N months) or remove a state. |
| `queue event` | Schedule an event for **next** month. |
| `queue event in 3` | …in 3 months (`in 0` means later this month). |
| `queue event now` | It becomes the **very next card** (this is how menus lead to sub-scenes). |
| `queue event … with npc` / `with lyra` | Carry an actor into the queued event (the target uses `actor: npc`). |
| `queue any tagged <tag> …` | (Feedback 2026-10-16.) A pool instead of one event: when it falls due (at once for `now`), one `trigger: queued` event with that tag is drawn by the usual score (`when`, cast, cooldown, novelty, weight); none eligible, nothing comes. It takes the same `now` / `in N` / `within a..b` / `with` / `chance` as a named queue. Lint wants at least one queued event with the tag; those events are not orphans, and `grim reach` and `grim graph` treat the queue as reaching the whole pool. |
| `queue event … chance unlikely` (or a % such as `chance 33`, legacy) | When it falls due, push the card with those odds by nature (`@balance likelihood`), else drop it (playtest 2, I4); `now` and `in 0` roll at once. Copies of one event due the same month give at most one card. The card shows no odds. The budget lint counts it as a risk when the queued card is an `incident` or `crisis`, and the simulated players score it as a risk weighted by its odds (I8). |
| `rel lyra +small` · `spark lyra +tiny` · `bond lyra friend` · `meet lyra` | Relationships. Use a cast role (or `npc` for the bound actor) instead of an id. Each implies `meet`. (`love` is *legacy* for `spark`.) |
| `end ending_id` | Game over with that ending (after the outcome card). |
| `if expr:` / `elif expr:` / `else:` | Branching. |
| `chance likely:` … `else:` | Pure luck, at the odds of an odds-by-nature word (`@balance likelihood`), moved by circumstance steps: `chance likely +1 if spark(npc) >= 30:` (`docs/authoring/checks.md`). *Legacy:* `chance 30:` (any expression; `chance 30%:` also works). |
| `challenge research adept- unlikely wild:` … `win:` / `lose:` | A challenge (§6a): its kind, the skill it uses, a difficulty on the ladder, odds by nature, luck, drift and circumstance steps. The first top-level challenge in an option is shown on the button with its odds. |
| `check arcana 20:` … `else:` | *Legacy* skill check (raw DC); use `challenge`. |

**Odds:** a challenge compares your skill with the expected skill at that point of the run plus its difficulty tier, with a swing (§6a, `@balance swing` and `odds`). The legacy `check` used a raw DC.

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
3. Cards are played in order. `queue … now` inserts at the front. Each card re-checks its `when`, and the cast roles' `where:` for a cast bound when it was pushed (feedback 2026-10-16), before showing (so a queued follow-up can quietly skip itself).
4. When the deck is empty, `month_end` hooks run, then the next month begins, or the final ending is chosen after the last month.

**Triggers in short**
- `random` — the filler pool. Most events.
- `social` — the relationship slot. Requires a met actor: a fixed `actor:`, or a cast role with `per:` (the *legacy* `actor: any` worked the same way).
- `auto` — forced in whenever `when` is true: calendar beats, menus, chain finales. Always give it a tight `when` and usually a `repeat`.
- `queued` — only appears through `queue`. Lint warns about orphans.
- `letter` — a letter (playtest 2, M38): drawn only off campus, one each night, and by anyone who reaches you while one of you is away (M19). In no other pool.

**Cast selection** (and the *legacy* `actor: any`): every met NPC for whom `when` is true is a candidate. People with stronger relationships (|rel|, spark, a bond) are picked more often. The event is once **per character** (or `repeat` = per-character cooldown) and rests globally for 2 months after showing.

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

**A purchase:** `when: gold >= 15` plus `hint: Costs fifteen crowns` on the option, then `gold -medium` in its effects (the prose's amount matches the tier; lint warns when it doesn't).

**Seasonal:** `when: month == 4 or month == 5`.

---

## 6a. Numbers and options (schema v1, phase 2a)

These constructs are the new event format. Older forms keep working through a compatibility layer and are counted as **legacy** by lint (`lint --legacy` lists them; phase 3 migrates them).

**Size tiers.** Write amounts as tier words: `mood +medium`, `gold -small`, `rel npc +large`, `spark lyra +tiny`, `arcana +small` (skills use the `xp` row). Amounts come from `@balance sizes` in `content/core/balance.grim`: tiny, small, medium, large, huge. Raw numbers (`mood +5`) are legacy.

**Presets.** Named groups of effects defined with `@preset` (`params:` and a `do:` body using `$param`), used as a statement: `grind arcana`, `rest`, `social npc`, `work`, `splurge`, `risk renown`. They expand at compile time.

**Challenges** replace `check` (legacy). How to pitch one is `docs/authoring/checks.md`; the numbers are `@balance` (`presets.md`).

```grim
challenge duel vs lyra.arcana +2 wild:  # combat | duel | negotiate | deceive | exam | research | brew | enchant | feat | spell
  win:
    renown +medium
  partial:                              # optional: a band of ±5 around the DC
    renown +small
  lose:
    health -medium
```

The line is `challenge <kind> [using <skill>] <difficulty> [<odds>] [<luck>] [drift <word>] [±N if <cond>]…:`.

- **The skill** is mapped from the kind (duel: (vigor + arcana) / 2; negotiate: charm; deceive: guile; research and exam: lore; brew and enchant: alchemy; feat: vigor; spell: arcana), or set with `using <skill>`. `using` may also name a resource such as `renown`; a resource isn't on the skill scale, so it reads as E(turn) + (value − 50) / 2.
- **Difficulty** is the DC: a rung of the ladder (`novice-` … `archmage+`, `@balance dc_tiers`); `standard` / `standard±N` on a course card (the course's `standard:` at the card's `level:`, else `@balance course_standard`); or `vs <who>.<stat> [±N]` (that character's stat, ± N rungs; a character with a tag in `@balance npc_growth: share 0.9 tags peer thornwick` has every skill stat scaled up with E(turn), so their best skill ends at `share` of the final E). A course card shown in a course level above its own `level:` rises `course_step` rungs per level; the hard variant adds 2.
- **Odds by nature** (`certain sure likely even unlikely slim long_shot freak`, default `even`) is the chance when your skill matches the DC (`@balance likelihood`). **Circumstance steps** (`+1 if renown >= 60`) move it by `odds_step` in z.
- **Luck** (`steady normal wild luck`, default `normal`) is the bell's σ (`@balance sigma`).
- **Drift** (`none low mid high`) pulls the DC toward the expected skill E(turn) (the `@balance curve`): DC = d + k × (E − d). Default: `story` none; `milestone` and `crisis` low; a course card's `standard` check inside its course `@balance course_drift` (low); anything else high.
- **Odds** = floor + (ceil − floor) × Φ(z(odds) + steps + (skill − DC) / σ), with `@balance bell: floor 2 ceil 98`; a check on a `class: milestone` card runs 0–100. Rounded to a whole percent.
- **Modifiers** on the skill: a known spell adds `@balance spell_check: per 2 cap 6` to checks of its skill (`@spell skill:`, else its discipline's); in a course card an `exam` adds study (up to the cap); the advisor's regard.

*Legacy* (being rewritten): a tier word `trivial easy medium hard heroic` puts the DC at E(turn) + `@balance difficulty` (+ `vs` stat − E, within ±15; one tier per course level above I; one more for the hard variant, up to heroic), and odds = clamp(50 + slope × (skill − DC), `@balance odds: min 5 max 95`; milestones 100) with slopes `@balance swing: normal 2.5 wild 1.2 steady 4`.

**Exams.** `@balance exam_tiers` gives the bar at each course level: a legacy tier (E + offset), or a rung / `standard±N` (that difficulty with low drift). Study and the advisor lower it; the exam reads the same bell (0–100). Grades come from bands over the bar, `@balance exam_bands: a 15 b 5 pass -5 ambitious 8 ambitious_sigma 20`: P(A) = odds(bar + a), P(B or better) = odds(bar + b), P(pass) = odds(bar + pass). `sit_exam wild` (going for top marks) lowers the A mark by `ambitious` and is sat at σ `ambitious_sigma`; the careful exam at σ `sigma` (default 12). **Preparation floors** (2026-10-19): `pass_from`/`pass_at` and `b_from`/`b_at` lift the pass and B-or-better chances smoothly (smoothstep) to certain at `pass_at` and `b_at` prepared, joined to the skill's chance as either being enough (`1 − (1 − skill) × (1 − floor)`); unset, there are none. Preparation itself: `@balance study: monthly N check M cap C` gives each course N in each term month before its exam (none in the exam month), M instead when a check on that course's card is won (once a month per course). `node tools/exam-odds.js` prints the table.

**Combat and duel are played** (2026-10-19). `challenge combat <tier>:` and `challenge duel …:` are fights (duels, spars, the ring, the tournament), and each is played in the combat minigame (`combat/`, design §9.2), never rolled. The engine hands the fight to a resolver (`eng.fights`: the fight screen, or the simulated players' AI), and its result picks the branch: a win is `win`; a draw, or a loss on points, is `partial` when there is one, else `lose`; a knockout is `lose`. The fight's own Health and Mana changes apply, and the branch runs **without its `health` lines** (write the fight's aftermath in other lines; `health` stays valid for compatibility). The difficulty tier and odds word set the foe's level, and `vs` names the foe; who the foe is comes from the minigame's `EVENTS` (`combat/setup/foes.mjs`), and lint lists a fight card without a decision there. Lint allows **at most one fight on any path through an option**. A non-fight contest (a race, a brawl you talk down) is `feat`. A card drawn as its `variant: hard` is one tier harder and pays positive tier rewards ×1.5 (the director chooses when, phase 2b).

*Compatibility:* with no resolver (unit-test fixtures only), the old stub still rolls: arcana, vigor and guile weighted, condition × (the mean of health, mood and mana − 50), spells × total spell levels (at most +15), and an entry cost in Mana (`@balance combat:` and `combat_cost:`).

**Spells.** `learn_spell flame` (level +1, up to the spell's levels) or `learn_spell flame 2`. Learning a level gives skill XP in the spell's skill (`skill:`, else its discipline's): one tier per level for a three-level spell (`@balance spell_bonus: medium large huge`), `@balance spell_bonus_one` for a one-level spell; the note shows it. `spell_level(flame)` in conditions. On a card, `> up[ward]: Raise a ward` is the swipe-up / ↑ option: hidden until the spell is known, disabled when mana is short; its mana cost (`@spell cost`, per level) is paid automatically and shown in the preview, and so is the alignment of a spell with `alignment:` (a tier, taken off per cast). `@game spell_resource` names the resource (default `mana`).

**Option properties.** `memory: <kind> <who>` (kind from `@vocab memory_kinds`; who is `npc` or a character id) records a memory when the option is chosen (recall arrives in phase 4).

**Facts and relations.** `learn lyra.mother` reveals a fact (`@fact` `unlock:` conditions also reveal them at month start; surface facts are known on meeting); `knows(lyra.mother)` tests it. `npc_rel lyra kael ±n` (or a tier) changes how two characters feel about each other (both directions); `npc_rel(lyra, kael)` reads it, seeded from `relations:`. `<npc>.<stat>` in expressions reads a character's stat (`lyra.charm`, `npc.wealth`).

**Relationships.** `spark` replaces `love` (legacy alias): it fades 15% a month without a romantic moment; a partnership ends after two months below 20. Friendship (`rel`) fades by 2 a month toward 0 after 6 months without contact.

**Event fields.** `class:` (routine, milestone, incident, windfall, story, crisis; see `docs/authoring/classes.md`) and `tone:` (from `@vocab tones`). Lint checks each class's budget with the preview engine, in medium-equivalents (`@balance weights` × change ÷ medium size): no routine option may be obviously better than another (at least as good on every value and better on one, with neither a gamble nor a follow-up; options that move alignment differently never are), and each stays within ±1.5; milestones allow 2 large changes, windfalls 1; incidents need at least two options.

**Resources.** `max:` may be an expression (`max: 40 + arcana / 2`); `display: panel` moves a resource from the top bars to the You panel, and `display: number` shows it in the middle of the top row as a plain number instead of a bar; `warn_below: N` marks it low; `drag: -50 0.5` halves increases while below −50.

**Inline text variation** (Ink-style; in any text, including `say:`): `{~a|b|c}` one of them (deterministic per seed, turn and event), `{&a|b}` cycles each time the event is seen, `{a|b|c}` runs through them and stays on the last, `{cond: a|b}` picks by a condition (`{gold > 20: rich|poor}`); a colon inside `{~…}` or `{&…}` is plain text. `cast_as(role, npc)` tests who filled a role (`{cast_as(here, maud): …|…}`). Alternatives may contain other tokens. Translations keep the same structure.

**Variation is linked within a block.** Every variation group of an event (title, text, scene, labels, hints, `locked:`, every `say:` and override, nested groups too) picks the same position: the showing number for a sequence or a cycle, one hash of seed, turn and event for `{~…}`. So a block uses **one mode with one part count**, and variant *k* of every field belongs together; a field may have no variation. Conditionals are not variation and mix freely. States and hooks are linked the same way within each block. Translations keep each line's mode and count. The lint (`variants`) checks all of this.

**Previews.** Every option's outcome is previewed exactly on the buttons: the engine runs the option's effects on a scratch copy of the state for each path through its chances, checks and challenges. Lint rejects `rand()` in option effects (use a chance or a range). `grim balance` asserts, over 1,000 random games, that every real outcome lies within its preview.

---

## 6b. The worldbook (`content/world/`)

Worldbook blocks are **data**: canon for authors, briefs and lint. Until phase 2b the engine doesn't play them (and `passed()` / `clue()` are always false). The full property table is generated in `docs/authoring/schema.md`.

| Block | What it is | Structured values |
|---|---|---|
| `@npc` (extended) | `age` (required; romance needs 18+), `role`, `year`, `traits` / `interests` (from `@vocab`), `voice` | `stats: arcana 34 lore 22 wealth 5` · `schedule: place@slot,slot … place@slot:30` (a number: there that share of days, decided per month without the RNG; M42) · `schedule_break: …` (the schedule on breaks, or `away`: gone for the break, reachable only by letter) · `gone_when: <condition>` (review fixes: while it holds the character is nowhere on the map, fills no cast role and is drawn for no card except letters, e.g. `flag(ilse_taken)` or `flag(tobias_went_home) and since(tobias_bad_harvest) < 2`; scenes queued for them still play) · `distant: true` (feedback 2026-10-15: a pen pal; never on the map or `around()`, fills no cast role and no `actor: any`, letters included, and reaches you only through their own `actor:` cards, which are `trigger: letter`, at a steady rate of their own; auto and queued scenes with them still play) · `relations: npc:value …` |
| `@fact npc.key` | what can be learned about a character: `tier` surface / personal / secret, `unlock` (expression), `text` | |
| `@place` | `region`, `kind` (public, club, job, thesis, internship, plan), `track`, `always: <event> …` (feedback 2026-10-15 and 2026-10-16: the listed events of the place come first on every visit, in order, each while its `when` holds, whatever its cooldown, followed by one drawn card; a group `a|b` plays one of its eligible events by weight, and the others aren't drawn on that visit; an event with `slot:` counts only in that slot, midnight included, one without only on daytime visits), `open` slots, `discover` / `closed_when` / `hinted_when` (expressions), `hint`, `desc` | `map: campus x,y` |
| `@track` | `kind` (course, club, job, internship, thesis), `skill`, `levels` + `level_names`, `place`, `hidden`, `prereq`, `ranks`, `due`, `lead`, `standard` (a course's rung per level, for `standard` checks), `start` (a course's start card, pushed when you enrol) | `teaches: spell@level …` · `pay: 8, 12, 18` |
| `@spell` | `skill` (one or two skills; none for a spell with no skill), `verb` (the one verb its cards use), `pool` (`hidden` or `forbidden`: no source yet), `alignment` (a tier per cast), `discipline` (a course track; optional) | `cost: 10, 9, 7` (one value per level: one or three levels) · `power:` optional, one per level |
| `@arc` | `canon`, `clues`, `key_clues`, `cast`, `act_names` (the acts as players read them, comma-separated) | `acts: name@yN …` · `clock: 0..12` · `beats: clock@yNmM …` |
| `@clue` | `arc` or `thread`, `name`, `text`, `kind: clue \| lead`, `followed: <expr>` (a lead only) | the Clues panel's entry for a clue or a lead |
| `@lore` | `keys` (comma-separated), `canon` hard / soft, `text` (not translated) | |
| `@faction`, `@archetype`, `@timeline`, `@vocab` | members and stance; spawn templates (`age: 18..22`); dated history and calendar beats; controlled vocabularies (`values:`) | |

Translated worldbook fields: place name, desc and hint; track name, level names, ranks and desc; spell name and desc; fact text; faction and arc name and desc. Lists that are shown to players (`level_names`, `ranks`) are kept as text; in Chinese, separate them with 、.

---

## 6c. The world loop (phase 2b)

From phase 2b a run is **four years, 48 months, and each month is one day** (design §4). `@game` sets the shape:

```
years: 4
last_month: 12                       # the run ends in Starfall of year 4 (turn 48)
wrapup: 11-12                        # the final year's last break: no plans or duties (the `wrapup` identifier)
calendar: term=1-4 break=5-6 term=7-10 break=11-12
seasons: autumn=1-3 winter=4-6 spring=7-9 summer=10-12
day_term: morning=courses noon=social:1-2 afternoon=visit evening=visit night=world:1-2 midnight=special:0-1
day_break: morning=plan afternoon=visit evening=visit night=world:1
day_last: morning=special:0          # the last day: no map, no pools, only pushed cards (the run's resolution)
spread: social world                 # these sources' cards are dealt across the day's slots, not drawn in their own
origins: choose_origin               # the origin screen before the game lists this menu's options
```

**The origin** (`@game origins:`, playtest 2). The UI shows the menu's options on their own screen before the game, each with its origin state's `money:` line, and a warning when the state is tagged `poor`. `newGame({origin: key})` runs that option before the first month's hooks, so tuition and board already see it. Started without an origin (old callers, some tools), the game still queues the menu as a card.

**The wrap-up** (`wrapup:`). Months of the final year listed here stay `break` months, but `wrapup` is true in them: content uses it to offer no break plan, and with no plan there is no board. The map shows the phase as "wrap-up". On the last turn, `day_last:` (if set) replaces the day's recipe and no one comes looking for you, so the month holds only pushed cards: the graduation and the endings' resolution (`turn == max_turns`).

**Festival places wait** (I5): a place with a festival (`replaces: visitN`) in a later visit of today is closed until then; the map view marks it `festLater` with that visit's slot.

**Fixed shifts** (I1, I2): a job track's `due:` is its shifts a term. A visit to the job's place after the last one, or on a break, is an ordinary visit (`attend` keeps no attendance or pay, and the slot draws the place's events, not the track's). In term, `@game off_shift: <event>` is pushed first on such a visit, as often as the event's `repeat:` allows (Lumenhold's has none: once a run). **One visit per place a day** (I3): a place picked earlier today is not open again (the map marks it visited), except in an opened slot.

**Opening a slot** (M41): `visit midnight` in a card makes that slot of today a visit. When it comes, the map opens for it, listing only places open then that have an event naming the slot (`slot: midnight` or `time: … midnight`), and the visit draws only such events (no ambient fallback). Lumenhold's night card uses it for the midnight turn.

**Simulated players** (`tools/policies.js`, A1) drive the engine exactly as the UI does: `newGame` with an origin, then `advance`, one `pickPlaces` per map and one `choose` per card, all through `Policies.play` (with `record: true` it keeps every pick and choice; `Policies.replay` plays a record back and must give the same game). Bots draw their own random numbers, seeded from the game's seed, never the game's RNG. `eng.preview` leaves the game untouched (a test checks it), and `eng.trackTarget(st, track)` says which track a track statement acts on.

**A day** (`src/director.js`). The day is played slot by slot, in order (playtest 2, M1). The director fills each slot from its source as the player reaches it: `courses` (events of enrolled courses), `social` (`trigger: social`), `visit` (events with `place:` the player picked), `world` (random events with no place), `special`, `plan` (events for the active break plan). `:1-2` is how many cards a slot draws. A `visit` slot first stops on the **map** for that one visit: the player taps a place open in that slot, or stays in (no card). Each candidate scores `weight × novelty × relevance × variety × time fit`: an event's `time:` multiplies it by 3 in those slots and by 0.3 elsewhere, and a `slot:` keeps it to that slot. The sources listed in `@game spread:` keep their budget (`noon=social:1-2` still decides how many), but their cards are dealt to random slots of the day (not `special`), so a social card can come in the evening. Pushed cards (queued, auto, arc beats, track notices) go into their `slot:` (else the day's first). If `@game` sets `max_cards_per_day` (optional; no cap when absent, and Lumenhold sets none) and the day is over it, priority decides (story > track > pushed > friend > social > ambient) and pushed cards that don't fit move to the next day. `when` is checked again as each card is drawn.

**People come by two tracks** (design §5.5). An event with a fixed `actor: <npc>` (and no `place:`, `track:`, `plan:` or `slot:`) is in that character's own pool as well as in the shared pools; generic social events (`per: npc` casts) can be cast with any one character.
- *You find them:* the shared pools as above; a visit to a place where a character's `schedule:` puts them (met or not, so introductions happen where people are) and the social slot (anyone scheduled at a place you know) can each give a card from that character's pool.
- *They find you:* every met character rolls each month, on their own, to bring you one card from their pool (at most two such cards a month, one on a break). The chance follows **warmth**: recent contact you chose. A card where you raised their `rel` or `spark` (even at the cap) warms them; a card with them where you didn't cools them; visiting where they are warms them a little; warmth fades every month. Standing friendship, spark and a bond add to it.
- *Warmth counts seeking* (M17, M18): a card warms someone only when its outcome moves the relationship further its own way (a friend's `rel`/`spark` up, a rival's down); when every option moves it that way, only the larger move counts. Visiting a place where they are counts as seeking them.
- *Milestones* (M13): an event with `ramp: rel(npc) 18..30` leaves the pools and is pushed instead, each month, for the character furthest along: at 40% once the value reaches the low mark, rising to certain at the high mark. Use it on becoming friends, confessions and the like, whose gate already names the low mark.
- *Spark follows friendship* (M37): a `rel` gain on a romanceable character who already has spark adds spark too, `gain × spark / per`, at most `cap`× (`partner`× for a partner): `@balance spark_follow: per 25 cap 2 partner 3 cooldown 30`. Crossing `cooldown` pushes `@game spark_cooldown` once (not for a partner), whose `cool npc` statement clears spark. A gain at the cap shows in the outcome, marked as at the maximum.
- *Off campus* (M38): on a break under a plan state tagged `away` (home, an internship), the day draws that plan's own pool (and, when the plan's `map_id:` is a track kind, your track of that kind's events) instead of campus pools, a `trigger: letter` card comes each night, anyone who calls writes instead, and friendship and spark fade at half the pace. The identifier `off_campus` is true then.
- So a character needs a ladder of personal events starting near `rel 0` (a rival's too): if every one of their events is gated at `rel >= 10`, a new acquaintance has nothing to bring you and the friendship stalls.

**Identifiers:** `term` and `break` (booleans), `season` (`"autumn"` …), `final_year`, `wrapup` (the final year's wrap-up months), `off_campus` (M38), `term_index` (1–8), `gpa` (0–4, cumulative), `term_gpa` (0–4: the latest completed term's grades only, appeals included; 0 when that term graded no course; origin design 2026-10-16), `slot` (the slot being drawn). `month` is 1–12 within the academic year; `year` is 1–4; `turn` is 1–48.

**Event fields**

| Field | Meaning |
|---|---|
| `place: library` | Drawn when the player visits that place. `replaces: visit1` (or `visit2`) makes it a festival in that visit: the map marks its place, and picking the place draws it first (the visit is not forced). |
| `slot: night` | The slot the event is drawn in or, if pushed or an arc beat, lands in (`morning noon afternoon evening night midnight`). Drawn events with a `slot:` appear in no other slot. |
| `time: evening night` | Slots the event fits: drawn three times as often there, a third as often elsewhere. Use it rather than `slot:` when the text names a time but could happen at another. |
| `track: evocation` · `level: 2` · `rank: 1` | An event of that course level or club/job rank; drawn in the course's morning or at its place. |
| `plan: castle` | Drawn on a break with that plan (`plan_castle` state). |

**Which map** (A1): the map is `@game map_id:` (`campus` when absent). A plan state's `map_id:` replaces it while the plan lasts: a map id (`map_id: home`), or a track kind (`map_id: internship`: the map of your track of that kind's place, the host). Lint checks that it names a map with places or a track kind.
| `arc: the_bell` · `beat: 3` | A plot card, eligible once the arc's clock reaches the beat. One plot card a month, two in a beat month. |
| `offers: courses` · `pick: 2` | A generated menu: one option per course (club, job) on offer, plus the event's own options. `pick: N` lets the player choose up to N (multi-select). A generated option's outcome is its track's `picked:` line; a multi-pick outcome is the chosen options' lines in order, then the event's own `say:`. |
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

**Tracks** (`@track` in `content/world/tracks.grim`). Statements: `enrol evocation` (or `enrol evocation 2`), `join duelling`, `leave duelling` (`leave job` / `leave club` / `leave internship`, any track kind: whichever you have; `leave` on an application withdraws it; every track statement takes a kind the same way, e.g. `perform internship +small` in a card shared by all internships, X12), `apply intern_royal_library`, `wage` (in a job's own events: one shift's pay at your rank; `wage short`, `wage overtime` take a share set by `@balance wage: short 0.5 full 1 overtime 2`), `promote track`, `perform track +small`, `rank_xp track +small`, `progress thesis +medium`, `study evocation +small` (exam preparation for an enrolled course: each term month's coursework adds `monthly`, a course card `attend` by itself, and at most a cap counts, `@balance study: attend 0 cap 15 monthly 3 check 5`; an exam's difficulty by course level is `@balance exam_tiers: standard standard standard+2`; `study +small` without a track prepares for every enrolled course; this replaces `grades` effects), `coursework` (in a course's own events: the month's coursework XP for that course, at most once a month; the engine also runs it after the first card of a course each month and, for a course with no card that month, at month's end; the amount by course level is `@balance coursework: small small small`, from the `xp` row whatever the course's skill; it also adds `@balance study: monthly` exam preparation). A course, club or job a menu can offer has `picked:`, one line saying what choosing it was like (lint warns without it). Inside a track notice, `track` means the track that triggered it, and `{track}` prints its name. Functions: `enrolled(t) member(t) applied(t) level(t) passed(t, n) rank(t) performance(t) progress(t) due(t) visits(t)`, and `offered(courses)` (or `clubs`, `jobs`): how many options an `offers:` menu of that kind would list now, for a fallback option that appears only when there is nothing to offer (I10). `member()` and `applied()` also take a track kind: `member(club)`, `member(job)`, `applied(internship)` are true for any track of that kind; `rank(job)` and `performance(internship)` read the one of that kind you're in.

- **Courses:** enrolment menus (`offers: courses`, `pick: 2`) at each term start, where each course shows what it tests, its exam's difficulty, the spells it teaches and today's pass chance; `opens: 2` delays a course to term 2. In a term's last month, `@game exam: course_exam` pushes that card once per enrolled course, in its context; its options grade the exam with `sit_exam` (or `sit_exam wild` / `sit_exam steady`, see Swing). A course not graded by a card sits the exam at term end, as before. Each exam is at the course level's difficulty, easier for study, graded A/B/C/F; the grades make the **GPA**. Passing a level teaches its spells (`teaches: flame@1 flame@2`); a course-start card may teach them first (`learn_spell`), and passing then adds nothing. `legacy:` lists v0.2 states that enrolling grants, so old class events keep firing.
- **Clubs and jobs:** one of each at a time. Each term asks for `due:` visits to the track's place; joining mid-term asks at most one per month left (M34). Visits raise performance and rank XP. A job pays through its shift cards (M10): a visit to its place draws one of the job's events first, and their options pay `wage` (plus whatever tips or fines they hold); only a visit with no shift card left to draw pays the flat `pay:`. There is no double wage on a break (holiday work is the break plan's gigs). Missed visits cost performance (and standing with the `lead:`); a term with performance ≥ 70 raises it. Below 40 a `track_warning` follows, at 0 you are dropped, and with enough rank XP and performance ≥ 70 a `track_promotion` is offered; a promotion starts the new rank at performance 50 (M12). Every job pushes `job_term_review` at term end (keep it, or resign), except after the last term (M33). Offered menus show each job's pay per shift (read from its cards) and what joining another club or job leaves behind.
- **Societies** (`kind: society`, M40): a hidden flavour group joined through an event (`join cartographers`). No dues, performance or ranks (`perform`, `rank_xp` and `promote` on one are lint errors), and it takes no club slot. Its events are drawn at its place like a club's.
- **Internships and the thesis** use the same statements: `apply`, then a letter event that `join`s or `leave`s; the thesis is `join thesis` with progress from visits and `progress thesis +…`. One internship at a time. Every visit to an internship's place counts in full. While a plan state tagged `away` is held on a break (Lumenhold's internship plan), the day draws no campus pools: social and world cards come from the plan's pool and the member internship's events, and nobody comes calling (M16).

- **Meeting the lead** (N1): a track's `lead:` is met when you enrol or join; with `intro: <event>` on the track, and the lead not yet met, that card is queued instead (in the track's context, with the lead as actor), so you meet them on a card of their own.
- **A course's start card** (spells v2): `start: <event>` on a course is pushed when you enrol, later that same month and in the course's context (as `queue … in 0`). Lumenhold's teach the course spell's level at the start of each course level; the card's `when` (e.g. `spell_level(flame) <= level(evocation)`) keeps it from repeating what you know. On a course with `start:`, passing a level is the fallback: it raises each spell only to the number of its `teaches:` entries up to that level (`flame@1 flame@2` → Flame 2 after level 2), so it never teaches ahead of the next start card. Without `start:`, passing teaches one more level, as before.
- **Appeals** (N4): `@game appeal: <event>` is pushed after a failed course, in that course's context. `regrade track C` (or a course id) changes the course's latest grade; turning an F into a pass teaches that level's spells, and the note says "on appeal".

- **Affordability** (review fixes): `@game afford: gold` names the resource an option's up-front price is paid in. An option whose top-level effects spend it (a tier at its amount, a range at its worst; costs inside a `chance`, `challenge` or `if` don't count) is disabled while you hold less, and the card says how much it needs; choosing it throws. If every option still available would be locked, none is (never soft-lock: the scene then takes what you have). Lint: an event that is not an incident may not spend it `on_show`, nor have every always-available option certainly spend it.

**Hooks:** `on: term_start` and `on: term_end` run at the first and last month of each term (rules use them for tuition, term marks and probation).

**Places** (`@place`): `map: campus 585,278` positions the marker; `open:` lists the slots it is open in; `season:`, `closed_when:` close it; `discover:` (a condition) finds it, else it starts found unless `hinted_when:` shows it as "?"; `track:` makes it a club or job place; `draws:` lets old tag-only random events be drawn there. Statements: `discover library`. Functions: `discovered(p)`, `present(p)` (who is there now), `visits_to(p)` (lifetime visits picked on the map).

**Arcs** (`@arc` in `content/world/arcs.grim`): `clock: 0..12` and `beats: 1@y1m3 2@y1m9 …` advance the clock on schedule whatever the player does. Statements: `find bell_rope` (a clue), `advance hollowstar +1`. Functions: `clue(x)`, `clues(arc)` (how many of the arc's clues are found), `clock(arc)`, `act(arc)` (the current act by year).

**Clues and leads** (`@clue` in `content/world/clues.grim`, playtest 2 X11): every clue an arc lists has a `@clue` with the `name:` and `text:` the Journal shows. A `kind: lead` is a pointer a story beat leaves behind ("Old Maud lost a friend to the lake"): `find` gives it like a clue, `clue(x)` tests it, but `clues(arc)` never counts it, and its `followed:` expression strikes it through in the Journal once it holds (usually `clue(<the clue it leads to>)`). The pattern: beats every player sees leave leads; the clue waits at the place or with the person the lead names (`place:` plus `when: clue(lead_…)`), so finding it is a choice. Lint: every `find` and `clue()` target needs a `@clue`, every arc clue has one, a clue is in its arc's `clues:` and a lead never is. **Side threads** (feedback 2026-10-15): a `@clue` with `thread: <a title>` instead of `arc:` belongs to no arc (`clues(arc)` never counts it) and is grouped under that title in the Clues panel, after the arcs; a thread whose leads are all followed moves to the bottom. Use one wherever a card hints at something the player has to go after later (a place, a slot, a track): `find` the lead where it is hinted, `followed:` where it pays off. `node tools/grim.js leads` lists flags (and `seen`/`chosen` tests) that a card at a place, slot or track waits for, and whether the card that sets them leaves a lead. Side leads are everyday: they never touch the mystery's secrets.

```grim
@clue lead_maud_friend
arc: hollowstar
kind: lead
name: Maud lost a friend
text: Old Maud was a student the last time the lake froze, and lost a friend to it. She might tell you more, if she trusts you.
followed: clue(knows_founders_seal)
```

**Push windows** (design §5.3): `queue x within 2..4` (some month 2–4 months from now) and `queue x by month 6` (before the next month 6 is over). Each month in the window the card is pushed with a rising chance (1 / months left), and on the last month for certain. `unqueue x` drops a pending one.

## 7. Errors the toolchain catches

`node tools/grim.js lint` reports:

- **Parse errors:** bad indentation, unknown property, single `=`, unknown statement, a card without both `left` and `right`.
- **References:** unknown event, state, npc, ending or skill in `queue`, `gain`, `rel`, `end`, `check` and in function arguments; `chosen(event, key)` with a bad key.
- **Actors:** `npc` / `{they}` used in a block without an actor.
- **Typos:** a flag that is read but never set; a variable that is read but never assigned.
- **Orphans:** queued events nobody queues.
- **Style:** text that is too long, a long label, unknown art key, unknown bond status, spark on a non-romanceable NPC.
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
