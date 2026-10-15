# Presets and size tiers

> Tiers, presets and weights are defined in `content/core/balance.grim`; all content uses tier words and presets, never raw numbers (lint reports a new one as legacy). The tables below are generated from that file by `node tools/grim.js docs` (`docs --check` fails when they drift), so retune there, not here. What each value stands for, and which cost fits which scene, is in `costs.md`.

<!-- BEGIN GENERATED: tiers (node tools/grim.js docs) -->
## Size tiers

| | tiny | small | medium | large | huge |
|---|---|---|---|---|---|
| health | 3 | 5 | 10 | 16 | 25 |
| mood | 4 | 8 | 13 | 20 | 30 |
| crowns | 3 | 8 | 15 | 30 | 60 |
| renown | 2 | 4 | 8 | 13 | 20 |
| mana | 3 | 6 | 10 | 16 | 25 |
| alignment | 3 | 6 | 10 | 16 | 25 |
| skill XP | 2 | 3 | 6 | 10 | 16 |
| lore | 1 | 1 | 3 | 5 | 8 |
| rel | 1 | 2 | 4 | 6 | 9 |
| spark | 4 | 8 | 13 | 20 | 30 |

## Difficulty tiers

`trivial -15` · `easy -7` · `medium 0` · `hard +8` · `heroic +16`, relative to the expected skill at that point of the run (`curve`).

## Presets

| Preset | Expands to |
|---|---|
| `grind <skill>` | Hard work on one skill. `$skill +medium; mood -small; health -tiny` |
| `rest` | A real rest. `mood +medium; health +small` |
| `social <who>` | Time with someone. `rel $who +small; mood +small; gold -tiny` |
| `work` | Paid work. `gold +medium; mood -small; health -tiny` |
| `splurge` | Spending to feel better. `mood +large; gold -medium` |
| `risk <res>` | A gamble: a large gain or a medium loss. `chance 50: $res +large; else: $res -medium` |
<!-- END GENERATED: tiers -->
