# First research checkpoint

The requested objective is **not complete**. These are training/screening results, not held-out validation and not proof of optimal play. Current live preview still uses Arguments 3; the new research path is opt-in until validated.

## What is implemented

- Public presentation variants distinguish open questions, binding records, personal appeals, public audiences, demonstrations and ultimatums. Each keeps one named check and one Agreement on acceptance, but changes DC, liabilities and success benefits.
- All 34 castable spells have research effects; Flame alone forces the requested comic failure. Recovery trades actual Health/Resolve/Patience/Mana, and declared costs cannot be underpaid. The old Candour–Quickquill free-Agreement combination is absent.
- Frugal, Prudent and All-out objectives compare full-win estimates separately from normalized post-rebate resource costs. Frugal/Prudent have explicit local win-slack bounds (6/2 points); these are estimates, not guarantees about realized win rates.
- Native Rust whole-game simulation avoids per-action Wasm/JSON crossings. Same Rust rules run in Wasm. Sources, binaries, proposals, tapes and replays are preserved.
- Seeded automatic proposal search varies check model, pool/frame weights, Agreement/Resolve scaling, Mana economy and individual spell strengths/costs. It screens 20 proposals and expands four, without promoting a result or using held-out seeds for selection.

## Evidence

The initial 168-game pilot was too easy at early/mid levels and retained two-spell dominance. It also exposed a staircase leaf estimate and unpaid Resolve-cost issue; those were corrected before the automated screen, with the original run preserved.

The screen ran 20 ×42 games (2 seeds per level/objective/context cell), then 4 ×168 games (8 seeds): **1,512 screened games**, each with exact command-tape replay verification. All use training seed base 413017. The ordinary group includes both general meetings and explicitly configured crown/Health concessions; broad spell access is a separate level-50 diagnostic.

Leading training proposal 7, expanded screen:

| Group | Full wins | Confront / Deflect | Effective spell count | Largest spell share |
| --- | --- | --- | --- | --- |
| Ordinary + configured concessions | 98/144 (68.1%) | 83.0% /17.0% | 2.24 | Ward 73.4% |
| Broad access at level 50 | 18/24 (75.0%) | See raw metrics | 5.24 | See raw metrics |

Ordinary objective comparison (48 games each, paired seeds):

| Objective | Full wins | Net Mana spent | Gold | Health | Renown |
| --- | --- | --- | --- | --- | --- |
| Frugal | 34 | 227 | 48 | 20 | 26 |
| Prudent | 32 | 252 | 48 | 20 | 26 |
| All-out | 32 | 266 | 48 | 22 | 26 |

These are totals, not per-game costs. Frugal spent 14.7% less Mana than All-out in this small selected sample. Its extra realized wins do not establish superiority; seeds are paired, the candidate was selected on these seeds, and search is approximate. Gold and Renown use have not differentiated enough here. In the separate broad-access diagnostic, each objective won 6/8; Frugal spent 138/37 Mana/Renown versus 144/40 for each other objective.

A 30-state fixed-work audit changed 20% of one-response recommendations under the strongest tested budget. However, 24/30 reference searches completed only two response depths, and just six completed depth three. The mean shallow utility difference was .0083. This is a reason to increase the reference budget, not to claim converged optimal behavior. A subsequent three-million-node audit completed depth three in 26/30 cases and depth two in four. It changed 23.3% of shallow recommendations and 16.7% of two-response recommendations; mean utility differences were .0094/.0068. This still does not establish full-game convergence. A small full-game reference run is the next check before changing mechanics based on a shallow policy’s Ward concentration.

## Tests

11 research tests passed, including native/Wasm seeded-game agreement, replay, resource-cost bounds, hidden-information isolation, the spell roster, a reduced exact endgame with a closed-form win probability and 12 three-card endgames checked against an independent exhaustive JavaScript solver. The unchanged v3 path still passes 28 tests and its 1,605 transition /102 spell-rank /12 search goldens. No main-game verification command that writes generated bundles was run for this goal.

## Outstanding work

Inspect stronger-search convergence before changing more mechanics. Ward dominance, weak Resolve-recovery demand and insufficient Gold/Renown objective differentiation remain open. `iteration-02-design.md` records proposed tradeoffs for the next controlled iteration; those changes are not active yet. Then rerun automatic search, evaluate independent seeds, encounter/kit/condition diversity and skill-gap curves, and validate the promoted phone UI and rulebook before declaring completion.
