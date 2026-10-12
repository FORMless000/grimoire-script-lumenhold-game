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
tags: noble ambitious fire
start_rel: 0
desc: Brilliant, impatient and used to winning.
```

`pronouns` must start with `she`, `he` or `they` (this drives `{they}`, `{them}` …). `short` is the name `{npc}` prints (use it when the first word of `name` is a title: `short: Professor Thorne`). `romance: true` allows `love` to grow. `look` is optional and fixes the procedural portrait (hair 0–7, skin 0–5, style 0–4). `tags` can be tested with `tagged(npc, faculty)`.

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
when: arcana >= 50 and grades >= 70
text: Graduating with highest honours...
```

At graduation, endings **without** `kind: early` are checked from highest `priority` down; the first whose `when` is true wins. One ending with no `when` (priority 0) is the fallback. `kind: early` endings are reached only through the `end <id>` effect (game over).

### `@game`

This holds global settings, and there is exactly one (in `core/rules.grim`): `title subtitle years months cards_per_month max_cards_per_month social_per_month min_random_per_month intro summer_months`.

`min_random_per_month` guarantees that many random cards each month even when queued and auto cards already fill `cards_per_month` (the deck may then grow up to `max_cards_per_month`). Lumenhold uses 1, so calendar-heavy months still draw from the random pool.

---

## 3. Expressions

Used in `when`, `weight`, `if`, `chance`, `check`, assignments and `{=…}`.

**Operators:** `+ - * / %`, `== != < > <= >=`, `and or not` (or `&& || !`), parentheses. Use `==` to compare: a single `=` is an error. Strings use `"double"` or `'single'` quotes. `true` and `false` are allowed; booleans count as 1/0 in arithmetic (`flag(x) * 10`).

**Identifiers**

| Name | Value |
|---|---|
| any resource or skill id | its current value (`gold`, `arcana` …) |
| `turn` | 1…36 (months elapsed) |
| `month` | 1…12 within the year (1 Harvestmoon … 10 Highsun, 11–12 summer) |
| `year` | 1…3 |
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

**A counter across many events:** `hollow +1` in every clue event, then `when: hollow >= 3` for the payoff.

**A relationship milestone:** `when: love(npc) >= 35 and bond(npc) != "partner"`, with `weight: 30` so it appears promptly once unlocked.

**A purchase:** `when: gold >= 20` plus `hint: Costs 20 gold` on the option, then `gold -20` in its effects.

**Seasonal:** `when: month == 4 or month == 5`.

---

## 7. Errors the toolchain catches

`node tools/grim.js lint` reports:

- **Parse errors:** bad indentation, unknown property, single `=`, unknown statement, a card without both `left` and `right`.
- **References:** unknown event, state, npc, ending or skill in `queue`, `gain`, `rel`, `end`, `check` and in function arguments; `chosen(event, key)` with a bad key.
- **Actors:** `npc` / `{they}` used in a block without an actor.
- **Typos:** a flag that is read but never set; a variable that is read but never assigned.
- **Orphans:** queued events nobody queues.
- **Style:** text that is too long, a long label, unknown art key, unknown bond status, love on a non-romanceable NPC.

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

---

## 8. Reference lists

**Art keys** (`src/art.js`): book scroll letter potion cauldron flame wave moon star sun rain bolt leaf flower tree mushroom snow tower house door tent key lock chain coin pouch gem ring crown wand sparkle rune sword shield duel trophy mask eye hand heart heartbreak group skull ghost cat owl raven fox dragon frog spider paw feather candle lantern mirror hourglass bell music cup meal bed cards dice map compass scales paper cross planet gear broom bottle

**Tags with visual meaning** (card colour and label): study social romance danger mystery money job nature festival crisis class club home magic rival story exam. Any other tag is allowed and is useful for `stats`.

**Bond statuses:** none friend close rival nemesis partner ex.
