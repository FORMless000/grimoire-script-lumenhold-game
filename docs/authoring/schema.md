# Schema

The full language reference is `docs/grimoire-script.md`. This page is the authoring view: the shapes you write, and a table of every block and property that is generated from the parser (`node tools/grim.js docs` refreshes it; `npm run verify` fails if it is stale).

## A two-choice card

```grim
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
    say: …
  else:
    <failure effects>
    say: …
```

**Menus**: 3–8 options with keys other than left/right, each with a `hint:`; at least one option without `when:`.
**Character events**: `actor: <npc>` with `when: rel(<npc>) >= N`. **Generic relationship events**: `actor: any`, `{npc}` / `{they}` / `{their}` / `{s}` / `{are}` in text, `rel npc ±n`.
**Chains**: `queue <event> [now | in N] [with npc]`; every queued event must be queued by something.

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
| `@resource id` | `name` | text | yes |
|  | `icon` | text |  |
|  | `min` | number |  |
|  | `max` | number |  |
|  | `start` | number |  |
|  | `color` | text |  |
|  | `desc` | text | yes |
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
|  | `relations` | structured |  |
|  | `voice` | text |  |
| `@state id` | `name` | text | yes |
|  | `desc` | text | yes |
|  | `art` | text |  |
|  | `tags` | list |  |
|  | `group` | text |  |
|  | `duration` | number |  |
|  | `hidden` | yes/no |  |
|  | `kind` | text |  |
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
| | `on_show:` | effects | `say:` lines |
| | `> key: Label` | option (`when:`, `hint:`, effects) | label, hint, `say:` |
| `@ending id` | `title` | text | yes |
|  | `text` | text | yes |
|  | `art` | text |  |
|  | `scene` | text | yes |
|  | `when` | expression |  |
|  | `priority` | number |  |
|  | `tags` | list |  |
|  | `kind` | text |  |
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
| `@spell id` | `name` | text | yes |
|  | `discipline` | text |  |
|  | `cost` | structured |  |
|  | `power` | structured |  |
|  | `desc` | text | yes |
|  | `art` | text |  |
| `@fact npc.key` | `npc` | text |  |
|  | `tier` | text |  |
|  | `unlock` | expression |  |
|  | `text` | text | yes |
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
|  | `clock` | structured |  |
|  | `beats` | structured |  |
|  | `clues` | list |  |
|  | `key_clues` | list |  |
|  | `cast` | list |  |
|  | `desc` | text | yes |
| `@lore id` | `keys` | structured |  |
|  | `canon` | text |  |
|  | `text` | text |  |
| `@timeline id` | `date` | text |  |
|  | `kind` | text |  |
|  | `event` | text |  |
|  | `text` | text |  |

### Functions in expressions

`abs()` · `bond()` · `bonds()` · `chance_of()` · `chosen()` · `clamp()` · `clue()` · `flag()` · `floor()` · `has()` · `known()` · `left()` · `love()` · `max()` · `met()` · `min()` · `npc_is()` · `passed()` · `rand()` · `rel()` · `romanceable()` · `round()` · `seen()` · `since()` · `tagged()`
<!-- END GENERATED: schema -->
