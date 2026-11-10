# Schema

The full language reference is `docs/grimoire-script.md`. This page is the authoring view: the shapes you write, and a table of every block and property that is generated from the parser (`node tools/grim.js docs` refreshes it; `npm run verify` fails if it is stale).

## A two-choice card

```grim
@event library_returns_cart
title: Short Evocative Title
place: library
class: routine
tone: light
repeat: 5
weight: 10
art: book
tags: study
scene: One sentence describing the scene, shown in italics under the card.
text: Two to four sentences. Present tense, second person. Set up a real dilemma; end on the moment of choice.
> left: Short label
  lore +small
  mood -tiny
  say: What happened, in one or two sentences, with a little wit (and the cost the scene shows).
> right: Short label
  challenge research apprentice:
    win:
      lore +medium
      say: What winning looks like.
    lose:
      mood -small
      say: What losing looks like: a real outcome, not "it doesn't work".
```

- **Where it's drawn:** `place:` (a map visit), `track:` with `level:` (course mornings) or `rank:` (club practice, job shifts), `plan: castle|home|work|internship` (break mornings), or none (the night's world slot; the director: `docs/grimoire-script.md` §6c). Most everyday content belongs to a place or track.
- `class:` and `tone:` are required (`classes.md`). A pool card has `repeat:` (its cooldown) and at least three variants, one mode and one count per card (`pools.md`); a one-off has neither.
- **Effects** are tier words and presets (`presets.md`), never raw numbers: `mood -small`, `grind arcana`, `study evocation +small` (never `grades`), `perform duelling +small`, `spark lyra +tiny` (never `love`). How options trade: `costs.md`.
- **Checks** are `challenge <kind> [using <skill>] <difficulty> [<odds>] [<luck>] [drift <word>]:` with `win:` / `lose:` (and `partial:`), and pure luck is `chance <word>:`; pitch both with `checks.md`. Never `check`.

**Menus**: 3–8 options with keys other than left/right, each with a `hint:`; at least one option without `when:`. `locked:` on a menu option.
**Chains**: `queue <event> [now | in N] [with <role>] [chance N]`; every queued event must be queued by something, and every flag tested must be set somewhere (lint enforces both; `grim graph <id>` shows what leads where).
**Legacy** (still parses; lint counts it; don't write it): raw amounts in events. (`check` and `love` no longer parse, and `actor: any` names no character: lint rejects it.)

## Constructs at a glance

Each is documented in `docs/grimoire-script.md`; `node tools/grim.js schema` lists what the format has gained.

**Triggers**
- `random`: everyday, gated by `when`.
- `social`: about a character. A fixed `actor:` puts it on that character's own track as well, so it comes when you meet them where they are or when they come looking for you.
- `auto`: forced when `when` holds (calendar beats, chain climaxes); tight `when` plus `repeat`.
- `queued`: only reachable by `queue`; `queue x in 2 with friend chance 30` delays it, carries a cast role and rolls odds.
- `letter`: the nightly letter while you or they are away: `actor:` or a cast role with `per:`.

**Who and when**
- `actor: <npc>` (a fixed npc id) with `when: rel(<npc>) >= N`, or `cast:` roles cast by premise: `friend: any where tagged(friend, peer) and rel(friend) >= 10`; classmates `tagged(x, student) or tagged(x, prefect)`; `tagged(x, teacher)`; `here: present(place)`; `keeper: maud`. Don't write `actor: any`.
- Generic relationship events: a cast role with `per: friend`; `{friend}`, `{friend.their}`, or `{they}` / `{them}` / `{s}` / `{are}` for the first role; `rel friend +small`, `spark friend +tiny`.
- `when` reads state, flags, relationship, month, year. A condition repeated across cards is a `@cond` (`courting(x)` exists).
- `time:` / `slot:` (time of day), `defer:`, `day:` on break plans and on states (a state's day replaces the term day while it holds: detention gives both visits to its pool).

**What a card leaves behind**: flags, states, queued follow-ups. A hint the player must follow up later (a card at a place, slot or track waiting on its flag) also leaves a side-thread lead: `find lead_x`, an `@clue` with `thread:`, `kind: lead` and `followed:` (`node tools/grim.js leads` lists missing ones).

**Other constructs**
- `up[spell]` options (a spell problem's wiring: `pools.md`); `boost: <kind>[:<size>]` on a state (a tonic, Owl's Ink's `exam:large`); `wage`; milestone `ramp:`; track `intro:`; `@game appeal` with `regrade`; `display:` on resources.
- `@item` blocks (`content/world/items.grim`): `give` / `take`, `has_item()` / `worn()`, and an owned item's own option `> up[item:x]:`, at most one per card.
- `specializes:`: one character's own version of a generic card.
- The plain check kinds `appeal`, `perform` and `soothe` (which kind fits: `checks.md`).
- `on_shift()`, so a shop counter skips a worker's shift visit.
- **Shop counters**: a `type: menu` card at the shop's place (its `always:`), with a `hint:` on each priced option and one free option with no `when`. The engine locks any option whose price you can't pay. Special offers are separate cards tagged `offer`, and cost more than money: a check, a fact you know, or a price such as `price_dear`.

## Worldbook blocks

```grim
@npc lyra                         # extended cast (content/world/cast.grim)
age: 19
traits: proud ambitious           # from @vocab traits
stats: arcana 34 lore 22 wealth 5
schedule: duel_hall@afternoon,evening library@night
relations: kael:-10
voice: Clipped and formal; sarcastic when hurt.

@fact lyra.mother                 # surface | personal | secret
tier: personal
unlock: rel(lyra) >= 30
text: Her mother has never once told her "well done".

@place duel_hall
name: The Duelling Hall
region: grounds
map: campus 660,150
kind: club
track: duelling
open: afternoon evening
discover: has(club_dueling) or rel(lyra) >= 15
hint: Steel rings somewhere above the east stair.
hinted_when: met(lyra)

@lore founders_seal
keys: founders, seal, seven locks
canon: soft                       # hard = curated; soft = proposed
text: …
```

Also `@track`, `@spell`, `@arc`, `@faction`, `@archetype`, `@timeline` and `@vocab`; see the table below and `content/world/`.

<!-- BEGIN GENERATED: schema (node tools/grim.js docs) -->
### Blocks and properties

| Block | Property | Type | Translated |
|---|---|---|---|
| `@game` | `title` | text | yes |
|  | `subtitle` | text | yes |
|  | `years` | number |  |
|  | `months` | list |  |
|  | `cards_per_month` | number |  |
|  | `max_cards_per_month` | number |  |
|  | `social_per_month` | number |  |
|  | `min_random_per_month` | number |  |
|  | `intro` | text | yes |
|  | `summer_months` | list |  |
|  | `spell_resource` | text |  |
|  | `schema` | text |  |
|  | `last_month` | text |  |
|  | `calendar` | structured |  |
|  | `seasons` | structured |  |
|  | `day_term` | structured |  |
|  | `day_break` | structured |  |
|  | `max_cards_per_day` | text |  |
|  | `origins` | text |  |
|  | `wrapup` | structured |  |
|  | `day_last` | structured |  |
|  | `exam` | text |  |
|  | `spread` | text |  |
|  | `spark_cooldown` | text |  |
|  | `off_shift` | text |  |
|  | `appeal` | text |  |
|  | `afford` | text |  |
|  | `map_id` | text |  |
| `@balance` | `sizes` | structured |  |
|  | `difficulty` | structured |  |
|  | `weights` | structured |  |
|  | `curve` | structured |  |
|  | `desc` | text |  |
|  | `xp_cost` | structured |  |
|  | `rank_xp` | structured |  |
|  | `performance` | structured |  |
|  | `combat` | structured |  |
|  | `combat_cost` | text |  |
|  | `swing` | structured |  |
|  | `negotiate` | structured |  |
|  | `parley_scale` | structured |  |
|  | `tonic` | text |  |
|  | `boost_sizes` | structured |  |
|  | `wage` | structured |  |
|  | `coursework` | structured |  |
|  | `exam_bands` | structured |  |
|  | `npc_growth` | structured |  |
|  | `spark_follow` | structured |  |
|  | `odds` | structured |  |
|  | `study` | structured |  |
|  | `spell_check` | structured |  |
|  | `spell_bonus` | structured |  |
|  | `spell_bonus_one` | structured |  |
|  | `forbidden_cast` | structured |  |
|  | `exam_tiers` | structured |  |
|  | `dc_tiers` | structured |  |
|  | `likelihood` | structured |  |
|  | `sigma` | structured |  |
|  | `drift` | structured |  |
|  | `odds_step` | structured |  |
|  | `bell` | structured |  |
|  | `course_standard` | structured |  |
|  | `course_step` | structured |  |
|  | `course_drift` | structured |  |
| `@preset id` | `params` | text |  |
|  | `desc` | text |  |
| `@resource id` | `name` | text | yes |
|  | `icon` | text |  |
|  | `min` | number |  |
|  | `max` | number |  |
|  | `start` | number |  |
|  | `color` | text |  |
|  | `desc` | text | yes |
|  | `display` | text |  |
|  | `warn_below` | text |  |
|  | `drag` | structured |  |
|  | `tiers` | text | yes |
| | `on_zero:` | effects | `say:` lines |
| `@skill id` | `name` | text | yes |
|  | `icon` | text |  |
|  | `start` | number |  |
|  | `max` | number |  |
|  | `desc` | text | yes |
|  | `color` | text |  |
| `@npc id` | `name` | text | yes |
|  | `short` | text | yes |
|  | `title` | text | yes |
|  | `pronouns` | text |  |
|  | `house` | text | yes |
|  | `desc` | text | yes |
|  | `color` | text |  |
|  | `romance` | yes/no |  |
|  | `tags` | list |  |
|  | `look` | text |  |
|  | `start_rel` | number |  |
|  | `age` | structured |  |
|  | `role` | text |  |
|  | `year` | number |  |
|  | `traits` | list |  |
|  | `interests` | list |  |
|  | `stats` | structured |  |
|  | `schedule` | structured |  |
|  | `schedule_break` | structured |  |
|  | `relations` | structured |  |
|  | `voice` | text |  |
|  | `seeks` | text |  |
|  | `gone_when` | expression |  |
|  | `distant` | text |  |
| `@state id` | `name` | text | yes |
|  | `desc` | text | yes |
|  | `art` | text |  |
|  | `tags` | list |  |
|  | `group` | text |  |
|  | `duration` | number |  |
|  | `hidden` | yes/no |  |
|  | `kind` | text |  |
|  | `money` | text | yes |
|  | `map_id` | text |  |
|  | `day` | structured |  |
|  | `deprecated` | text |  |
|  | `boost` | text |  |
| | `tick:` | effects | `say:` lines |
| | `on_add:` | effects | `say:` lines |
| | `on_expire:` | effects | `say:` lines |
| | `on_remove:` | effects | `say:` lines |
| `@event id` | `title` | text | yes |
|  | `text` | text | yes |
|  | `art` | text |  |
|  | `scene` | text | yes |
|  | `tags` | list |  |
|  | `when` | expression |  |
|  | `weight` | expression |  |
|  | `trigger` | text |  |
|  | `actor` | text |  |
|  | `repeat` | number |  |
|  | `priority` | number |  |
|  | `type` | text |  |
|  | `chain` | text |  |
|  | `class` | text |  |
|  | `tone` | text |  |
|  | `variant` | text |  |
|  | `place` | text |  |
|  | `slot` | text |  |
|  | `time` | text |  |
|  | `replaces` | text |  |
|  | `track` | text |  |
|  | `level` | text |  |
|  | `rank` | text |  |
|  | `lesson` | text |  |
|  | `arc` | text |  |
|  | `beat` | text |  |
|  | `plan` | text |  |
|  | `cast` | list |  |
|  | `offers` | text |  |
|  | `pick` | text |  |
|  | `scope` | text |  |
|  | `ramp` | structured |  |
|  | `per` | text |  |
|  | `defer` | text |  |
|  | `specializes` | text |  |
|  | `pool` | text |  |
|  | `thread` | text |  |
|  | `order` | text |  |
| | `on_show:` | effects | `say:` lines |
| | `> key: Label` | option (`when:`, `hint:`, effects) | label, hint, `say:` |
| `@pool id` | `from` | text |  |
|  | `desc` | text |  |
| `@cond id` | `params` | text |  |
|  | `is` | text |  |
|  | `desc` | text |  |
| `@thread id` | `from` | text |  |
|  | `params` | text |  |
|  | `with` | text |  |
|  | `members` | list |  |
|  | `roles` | text |  |
|  | `default_role` | text |  |
|  | `clues` | list |  |
|  | `clock` | structured |  |
|  | `name` | text | yes |
|  | `desc` | text |  |
|  | `canon` | text |  |
|  | `premise` | text | yes |
|  | `journal` | text |  |
|  | `status` | text |  |
| `@appointment id` | `at` | text |  |
|  | `for` | text |  |
|  | `deals` | text |  |
|  | `when` | expression |  |
|  | `chance` | text |  |
|  | `pick` | text |  |
|  | `slot` | text |  |
|  | `place` | text |  |
|  | `limit` | text |  |
|  | `takes` | text |  |
|  | `priority` | number |  |
|  | `use` | text |  |
|  | `desc` | text |  |
| `@ending id` | `title` | text | yes |
|  | `text` | text | yes |
|  | `art` | text |  |
|  | `scene` | text | yes |
|  | `when` | expression |  |
|  | `priority` | number |  |
|  | `tags` | list |  |
|  | `kind` | text |  |
|  | `slot` | text |  |
|  | `excludes` | text |  |
| `@hook id` | `on` | text |  |
|  | `when` | expression |  |
|  | `desc` | text |  |
|  | `label` | text | yes |
| | `do:` | effects | `say:` lines |
| `@vocab id` | `values` | structured |  |
|  | `desc` | text |  |
| `@place id` | `name` | text | yes |
|  | `region` | text |  |
|  | `map` | structured |  |
|  | `kind` | text |  |
|  | `track` | text |  |
|  | `open` | list |  |
|  | `season` | text |  |
|  | `closed_when` | expression |  |
|  | `discover` | expression |  |
|  | `hint` | text | yes |
|  | `hinted_when` | expression |  |
|  | `desc` | text | yes |
|  | `art` | text |  |
|  | `draws` | text |  |
|  | `always` | text |  |
|  | `deprecated` | text |  |
| `@track id` | `kind` | text |  |
|  | `name` | text | yes |
|  | `skill` | structured |  |
|  | `levels` | number |  |
|  | `level_names` | text | yes |
|  | `place` | text |  |
|  | `teaches` | structured |  |
|  | `hidden` | yes/no |  |
|  | `prereq` | expression |  |
|  | `ranks` | text | yes |
|  | `pay` | structured |  |
|  | `due` | number |  |
|  | `lead` | text |  |
|  | `desc` | text | yes |
|  | `legacy` | text |  |
|  | `opens` | text |  |
|  | `intro` | text |  |
|  | `standard` | structured |  |
|  | `picked` | text | yes |
|  | `start` | number |  |
| `@spell id` | `name` | text | yes |
|  | `discipline` | text |  |
|  | `cost` | structured |  |
|  | `power` | structured |  |
|  | `desc` | text | yes |
|  | `art` | text |  |
|  | `skill` | text |  |
|  | `verb` | text |  |
|  | `pool` | text |  |
|  | `alignment` | number |  |
| `@fact npc.key` | `npc` | text |  |
|  | `tier` | text |  |
|  | `unlock` | expression |  |
|  | `text` | text | yes |
|  | `hint` | text | yes |
| `@archetype id` | `names` | text |  |
|  | `age` | structured |  |
|  | `traits` | list |  |
|  | `pronouns` | text |  |
|  | `house` | text |  |
|  | `role` | text |  |
|  | `desc` | text |  |
| `@faction id` | `name` | text | yes |
|  | `desc` | text | yes |
|  | `members` | list |  |
|  | `alignment` | number |  |
|  | `stance` | text |  |
| `@arc id` | `name` | text | yes |
|  | `canon` | text |  |
|  | `acts` | structured |  |
|  | `act_names` | text | yes |
|  | `clock` | structured |  |
|  | `beats` | structured |  |
|  | `clues` | list |  |
|  | `key_clues` | list |  |
|  | `cast` | list |  |
|  | `desc` | text | yes |
|  | `act_rumours` | text |  |
|  | `epilogue` | text | yes |
|  | `act_clock` | text |  |
| `@clue id` | `arc` | text |  |
|  | `thread` | text | yes |
|  | `name` | text | yes |
|  | `text` | text | yes |
|  | `kind` | text |  |
|  | `followed` | text |  |
| `@lore id` | `keys` | structured |  |
|  | `canon` | text |  |
|  | `text` | text |  |
| `@item id` | `name` | text | yes |
|  | `slot` | text |  |
|  | `art` | text |  |
|  | `desc` | text | yes |
|  | `worn` | structured |  |
|  | `legacy` | text |  |
|  | `bound` | text |  |
|  | `start` | number |  |
|  | `price` | text |  |
|  | `tags` | list |  |
| | `tick:` | effects | `say:` lines |
| `@timeline id` | `date` | text |  |
|  | `kind` | text |  |
|  | `event` | text |  |
|  | `text` | text |  |
| `@map id` | `name` | text | yes |
|  | `region` | text |  |
|  | `desc` | text | yes |
|  | `arrival` | text | yes |
|  | `return` | text | yes |
|  | `art` | text |  |
|  | `lodging` | text |  |

### Functions in expressions

`abs()` · `act()` · `apart()` · `applied()` · `around()` · `bond()` · `bond_months()` · `bonds()` · `bonds_around()` · `cast_as()` · `chance_of()` · `chosen()` · `clamp()` · `clock()` · `closed()` · `clue()` · `clues()` · `discovered()` · `due()` · `enrolled()` · `flag()` · `floor()` · `has()` · `has_item()` · `kind_is()` · `known()` · `knows()` · `left()` · `level()` · `max()` · `member()` · `met()` · `min()` · `npc_is()` · `npc_rel()` · `offered()` · `on_shift()` · `passed()` · `performance()` · `plan()` · `present()` · `progress()` · `rand()` · `rank()` · `rel()` · `romanceable()` · `round()` · `seen()` · `since()` · `spark()` · `spell_level()` · `tagged()` · `visits()` · `visits_to()` · `worn()`
<!-- END GENERATED: schema -->
