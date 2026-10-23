# Active decision-variety research

This is the default standalone testplay model for the current iteration. Read `REPORT-gap-8.md` and `GAP-COMPARISON-8.md` for the current half-steep level-gap results; `REPORT-progression-7.md` preserves the initial expanded-roster study; `REPORT-no-ward-final.md` preserves the previous small-kit study, `rulebook.md` for the rules, and `PLAN.md` for the original research targets. Research state uses `config.research=true`; the existing Arguments 3 path remains a golden regression fixture, available with `legacy=1`. Automatic tuning is stopped for human testplay; it has not proved global optimality or solved full-roster balance.

- `combat-canon.mjs` / `sync-combat.mjs`: independent frozen combat Mana/capacity/rank data for current research; legacy schema remains untouched.
- `progression.mjs`: explicit nested testplay grants (12/24/34 at 20/50/80) and canonical prices/ranks.
- `progression-report.mjs`: seed-cluster analysis, policy/gap/resource/action/spell tables from frozen raw tapes.
- `progression-timing.mjs`: 50 ms warmed Wasm timing checks.
- `model.mjs`: public presentation variants, local spell adaptations, tunable parameters and three resource objectives.
- `rust/src/variety.rs` (one directory above): typed runtime, settlement, vector-valued expectimax and whole-game native simulation. Every castable spell has a declared adaptation; Ward deliberately does nothing useful, while Flame burns the papers and forces failure.
- `native.mjs`: long-lived newline-JSON native protocol; schema is configured once.
- `run.mjs`: paired-seed study with frozen source/builds, raw tapes and per-game replay verification.
- `metrics.mjs`: action, spell concentration, utility-margin and resource metrics; predeclared screening fitness. Metrics are descriptive, not an optimality certificate.
- `tune-no-ward.mjs`: current seeded parameter/effect proposals and expanded training. Earlier `tune.mjs` / `tune-second.mjs` preserve historical procedures; their Ward benefits are obsolete.
- `selected-no-ward.json`: training-only selection of candidate 6 and its rationale. Independent confirmation uses new seed base 529371.
- `rulebook.md`: standalone research rules and canonical combat Mana costs and adapted effects; regenerated with `write-rulebook.mjs` from the live configuration. The research preview opens this book, while the v3 regression fixture keeps its original rulebook.
- `audit.mjs`: re-evaluates the same public states at increasing depths/budgets; reports disagreement, utility regret and completed depth.
- `tests.mjs`: new mechanics, finite payments, hidden-information checks, exact reduced-endgame probability, replay and native/Wasm agreement.

```sh
node experiments/negotiation/build-core.mjs
~/.cargo/bin/cargo build --offline --release --manifest-path experiments/negotiation/rust/Cargo.toml --bin negotiation-core
node --test experiments/negotiation/research/tests.mjs experiments/negotiation/research/progression.test.mjs
node experiments/negotiation/research/run.mjs --episodes 8 --out experiments/negotiation/results/research-new
node experiments/negotiation/research/tune.mjs --candidates 20 --out experiments/negotiation/results/tuning-new
node experiments/negotiation/research/audit.mjs experiments/negotiation/results/tuning-new/expanded-05 experiments/negotiation/results/audit-new.json 30
```

All outputs remain under `experiments/negotiation/`. Existing directories/reports are preserved. Fixed node budgets make screening reproducible; the gameplay worker’s 50 ms behavior will need separate validation before promotion. Native and Wasm use the same Rust rules. The old JavaScript oracle still verifies the unchanged v3 path; new mechanics have direct outcome tests and a separate endgame search check rather than a second complete v4 rules implementation.

The race heuristic uses deterministic public leaf strata (18 by default, `leafSamples:0` for the whole pool). Unknown future arguments use three strata in the search. These approximations, finite horizon and optional continuation beam are explicit limits. A high entropy score can reflect arbitrary near-ties; the completion audit must check meaningful alternatives and stronger-search convergence instead of treating entropy alone as success.

Current study: `results/canonical-progression-main-02/` (48 paired seeds, 6 policies, 3 levels, 4 DC gaps, 2 contexts), plus `canonical-progression-strong-01/` (8 paired seeds, depth 3 sensitivity). Main-01 is stopped and explicitly excluded. Every main-02 simulation is batch-replayed and the complete final state compared exactly. The main runner accepts `--objectives frugal,prudent,allout,dumb,hyper-frugal,ignorant`, `--tune research/live-config.mjs` and `--trace false` to avoid retaining unused score arrays. Gross unlimited Mana is recorded at canonical prices without debiting or refunding a finite wallet. No automatic effect tuning was resumed.

Arguments 8 changes only named-signal versus opponent-DC sensitivity to one half. Card-specific DC spread and Agreement targets remain unchanged. The paired repeat uses `gentler-gap8-main-01/` and `gentler-gap8-strong-01/` with the same fixture grid and seeds as the canonical-progression baseline. `gap-compare.mjs` verifies that each paired setup differs only in that factor and its version label.
