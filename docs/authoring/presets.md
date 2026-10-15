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

## Check ladder (`checks.md`)

| rank | − | (plain) | + |
|---|---|---|---|
| novice | 0 | 4 | 8 |
| apprentice | 12 | 16 | 20 |
| journeyman | 24 | 28 | 32 |
| adept | 36 | 40 | 44 |
| expert | 48 | 52 | 56 |
| master | 60 | 64 | 68 |
| grandmaster | 72 | 76 | 80 |
| archmage | 84 | 88 | 92 |

Odds by nature (the chance when your skill matches the DC): `certain` 97% · `sure` 90% · `likely` 70% · `even` 50% · `unlikely` 30% · `slim` 15% · `long_shot` 5% · `freak` 1%. A circumstance step moves the z by 0.5.

Luck (the bell's σ): `steady` 12 · `normal` 20 · `wild` 32 · `luck` 80; odds run 2–98% (milestones and exams 0–100).

Drift (share of the gap to the expected skill the DC closes): `none` 0 · `low` 0.15 · `mid` 0.3 · `high` 0.5.

Course standard at levels I–III: `apprentice+` · `journeyman+` · `adept+`; a course card rises 3 rungs per course level above its own.

## Difficulty tiers (legacy)

`trivial -15` · `easy -7` · `medium 0` · `hard +8` · `heroic +16`, relative to the expected skill at that point of the run (`curve`); being rewritten to the ladder.

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
