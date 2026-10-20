# Strategy analysis checkpoint — updated after 0.2.1

The requested 0.2.1 follow-up is complete: configurable AI depth and bounded seeded mistakes, cheaper/stronger Ward, 6,960 new matches, 41 tests, full decision/ledger audits and browser checks. Findings: `docs/minigame-prototype-v02-degradation-findings.md`. Full project verification passed in an isolated snapshot; unrelated concurrent production edits were left alone. The older remaining-work list below records the earlier pause, not outstanding work on this patch.

2026-10-14. Resumed: the user explicitly requested AI depth/random degradation, a Ward buff and new simulations. See `results/v02-20261014-ward-degradation/` and the new degradation runner. Earlier observations below describe pre-rebalance rules.

Original task: inspect AI action preferences after the simulation and assess whether viable strategies collapse. The user asked to pause before the final assessment. No browser/game rules, roster, or main AI were changed during this analysis.

## Saved work

- `results/v02-20261014-strategy-analysis/`: reconstructed all 3,228 prior matches / 45,713 decision states; 1,752 paired diagnostic matches. Contains `observations.json`, `decision-states.json`, `matches.json`, `summary.json`, `strategy-interpretation.json`, `ANALYSIS.md`, manifest and frozen sources.
- `results/v02-20261014-foresight-roles/`: 360 additional single-side Foresight removals, with raw outcomes, summary, manifest and frozen sources.
- New reusable scripts: `run-v02-strategy.mjs`, `run-v02-foresight-roles.mjs`, `analyze-v02-strategy.mjs`, `validate-v02-strategy.mjs`. Both diagnostic directories have replay audits (`audit.json`). Runs and derived reports refuse to overwrite existing files.

## Preliminary findings (not yet delivered as a final assessment)

- Combat zero-adjustment baseline: 62.5% / 41.7% / 13.9% of actor trajectories at levels 20/50/80 use only Strike. Mean distinct spells per actor trajectory: 0.32 / 0.69 / 1.10. Both actor seats included; these are deterministic scenario counts, not independent players.
- Evoker opens Flame in all 24 trajectories per preset. At level 80, 118 of its 132 commands are Flame. Other recurring patterns are Strike–Restoration and Strike–Ward; Seer uses Starlight at level 80, Illusionist often stays on Strike.
- Baseline combat Foresight/Haste/Tide/Shadowstep have zero selections despite respectively 740/684/274/1,012 affordable ordinary opportunities. The five-exchange/25,000-node targeted probe still selects no Foresight/Haste/Tide, but uses Shadowstep four times. Deeper search changes four of 36 combat labels from win to partial, exposing some shallow-AI wins.
- Removing Flame eliminates all 19 Evoker full wins across its 36 matched controls; Tide becomes a fallback (60 casts) but produces no full wins. Removing Restoration eliminates the five level-50 and twelve level-80 full wins in the Restorer/Envoy controls.
- Negotiation Strike-only retains every baseline full win at levels 20 and 50 (56/144 each); at level 80 full wins fall from 57/144 to 40/144. It keeps the same label in 401/432 cases overall. However, it spends zero Mana while mean Renown losses rise (baseline 0.38/0.32/0.73 versus Strike-only 0.89/0.78/1.11). Do not call it universally dominant.
- Most Bluff spell variety occurs in failed attempts: 53/57, 44/48, 70/74 casts at levels 20/50/80. Many are attempts to delay failure under deterministic scrutiny; diversity of actions is not diversity of successful strategies.
- Removing player Foresight (Illusionist) loses no full wins but turns eight partials into losses across 216 cases. Removing audience Foresight gives the persuader twelve extra full wins across 144 cases (four per preset). Effects are concentrated in Bluff vs Illusionist (20/80) or Seer (50). Thus Foresight has limited defensive value here; the whole-spell ablation cannot separate its +10 skill bonus from its queue-binding effect.
- AI objective caveat: mutual KO evaluates to zero; negotiation terminal labels ignore resource costs; undecisive combat timeouts retain heuristic utility; voluntary exit is not searched. Mechanical compression and evaluation artifacts both need discussion. Deterministic mirror draws alone are not evidence of collapse.

## Remaining work on resume

1. Inspect the saved audits (48 selected diagnostic replays, controlled kit changes, source hashes and ledger accounting). Both validators have completed; their outputs are saved in each run's audit.json.
2. Write the coherent strategy assessment, separating observed preferences, effective strategies, resource tradeoffs and AI/horizon limitations. Likely conclusion: meaningful compression into a few routines, particularly early/mid negotiation, but no single universally viable Strike strategy in late combat.
3. Link findings and reproduction commands from the simulation README. Run narrow relevant checks for the new research scripts; previous 34 tests and isolated campaign check passed before these scripts were added. The earlier full campaign verify had two unrelated failures; do not claim it passed.
4. Do not retune or finalize a new design unless the user requests it. Leave unrelated concurrent campaign edits untouched. No further simulations are necessary merely to produce the current assessment.

## 2026-10-16 — alpha-beta search policy 2

Combat rules remain `combat-spells-v2-0.4.6`; the evaluator, numerical roster and resolver/settlement are unchanged. Search policy `alpha-beta-2` adds validated-action fast paths, cheap commitment views, reusable resolving buffers, compiled encounter data, collision-verified bounded numeric-key tables, retained best moves/history/killers, PVS/aspiration, and a single tactical extension. Browser Setup offers Fast 100 ms (default) and Deep 500 ms independently of full/shallow/fallible behavior; seeded mistake attempts reserve half the shared compute budget for exact ranking. Legacy programmatic defaults remain fixed-horizon depth 3 / 5,000 nodes. Analyst is deterministic depth 6 / 200,000 nodes with a 65,536-position table. Contexts persist per actor/encounter outside serialized state.

Live generated bundle rebuilt at `/private/tmp/lumenhold-testplay-tymsimxd` on port 61040. Frozen reference is durable at `experiments/minigames/reference/v04-search-046/`. New benchmark/convergence tools and separately invoked 108-fight generic panel commands are in the v04 README. Evidence: `experiments/minigames/results/v04-20261016-search-optimization/`; findings: `docs/minigame-combat-v04-search-findings.md`.

Validation: 74 prototype tests; final browser 88 checks / 231 layout checks / no errors; required grim check and isolated npm verify passed (122 campaign tests, no invariants/golden changes). Paired 5,000-node benchmark measured about 2.36× wall / 2.38× CPU speedup. Equal 100 ms: 17/48 deeper, none shallower. Equal 500 ms: 30 deeper, 12 equal, 6 shallower; the six retained their chosen actions and equivalent values. Tactical profiles were measured separately, with two legal fallback cases at 100 ms under desktop load. No long balance panel was run; short worker pilots and two convergence positions are diagnostic only. Rust, evaluator tuning, selective pruning and campaign integration remain deferred.
