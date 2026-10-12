# Presets and size tiers

> **Live (phase 2a).** Tiers, presets and weights are defined in `content/core/balance.grim`; new content uses tier words and presets. Raw numbers still work and are counted as legacy until phase 3 converts them.

## Size tiers (design §8.4, tunable)

| | tiny | small | medium | large | huge |
|---|---|---|---|---|---|
| health / mood | 2 | 4 | 7 | 12 | 20 |
| crowns | 3 | 8 | 15 | 30 | 60 |
| renown | 1 | 3 | 6 | 10 | 16 |
| mana | 3 | 6 | 10 | 16 | 25 |
| skill XP | 1 | 2 | 4 | 7 | 12 |
| rel / spark | 2 / 3 | 4 / 6 | 7 / 10 | 12 / 15 | 20 / 25 |
| alignment | 2 | 4 | 7 | 12 | 20 |

## Difficulty tiers

`trivial −15 · easy −7 · medium 0 · hard +8 · heroic +16`, relative to the expected skill at that point of the run.

## Presets

| Preset | Expands to |
|---|---|
| `grind <skill>` | skill +medium XP, mood −small, health −tiny |
| `rest` | mood +medium, health +small |
| `social <role>` | rel +small, mood +small, crowns −tiny |
| `work` | crowns +medium, mood −small, health −tiny |
| `splurge` | mood +large, crowns −medium |
| `risk` | a `chance` between a large gain and a medium loss |
