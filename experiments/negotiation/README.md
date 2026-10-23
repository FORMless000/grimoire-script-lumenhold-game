# Standalone negotiation simulator · Arguments 8

Current testplay defaults to the version 8 spell-progression model in `research/`.
Start with `?quickstart=20`, `50`, or `80`; add `&encounter=random` for consecutive story encounters. The three engine objectives are Frugal, Prudent and All-out. Ward is castable but has no negotiation benefit; Flame burns the papers and loses the meeting.

Read [the current rulebook](research/rulebook.md), [the spell-progression study](research/REPORT-gap-8.md), and [the research reproduction notes](research/README.md). The final build is served locally on port 55918; `hosting-local.json` records its frozen directory. `hosting-preview.json` records the older remote deployment, which the current Sites account could not access for this wrap-up. All code and results remain inside this experiment; there is no main-game integration or main-game commit.

Skill-versus-opponent differences now change check chances by 0.65 percentage points per point, half the previous 1.3. Card difficulty spread and Agreement target scaling retain their values. See [the paired before/after comparison](research/GAP-COMPARISON-8.md).

The normal presets now learn 12 / 24 / 34 spells at levels 20 / 50 / 80; late game includes every player-castable spell. Course ranks, Mana prices and capacity follow the combat snapshot in `research/combat-canon.mjs`, with no negotiation discount. Refresh that snapshot explicitly with `node experiments/negotiation/research/sync-combat.mjs --update`; keep previous result snapshots. The original `schema.mjs` remains frozen for legacy goldens.

Simulation resource policies are `dumb` (no spells, compulsory affordable Health/Gold requests), `hyper-frugal` (unlimited Mana, no Health/Gold spending), and `ignorant` (neither spells nor Health/Gold). They use the same All-out response planner. The gameplay UI retains Frugal/Prudent/All-out suggestions. Read the rulebook for exact restrictions and virtual Mana accounting.

The material below documents the preserved **Arguments 3 regression fixture**, available in the browser with `&legacy=1`. Its numerical rules and benchmark results do not describe the current default.

This research prototype stays in `experiments/negotiation/`, separate from the main game and its commits. Read [the standalone rulebook](rulebook.md) and [the tuned AI study](ai-study-tuned-rust-20261020.md).

Runtime transitions, checks, random outcomes, settlement and sampled expectimax are implemented in `rust/src/lib.rs`. The same `negotiation.wasm` runs in browsers and Node simulations. JavaScript supplies content, player-profile construction, initial seeded deck setup and presentation. The retained `reference-engine.mjs` and `reference-ai.mjs` independently verify the port; production transitions and search do not fall back to them.

## Run and verify

```sh
# Uses installed Rust + wasm32-unknown-unknown and cached crates, offline.
node experiments/negotiation/build-core.mjs
~/.cargo/bin/cargo test --offline --release --manifest-path experiments/negotiation/rust/Cargo.toml
node experiments/negotiation/golden.mjs
node --test experiments/negotiation/engine.test.mjs

node experiments/negotiation/build.mjs /private/tmp/negotiation-preview-new
PORT=55918 node /private/tmp/negotiation-preview-new/server.mjs
```

Use `?quickstart=20`, `50`, `80`, and optionally `&encounter=random`. Random picks source-backed scenes, excluding the previous scene; Replay repeats its resolved config. Setup may scroll. Gameplay fits a phone, with an internally scrolling flat spell tray. Every spell can be inspected; only learned, affordable, castable spells with a free slot can be cast. Engine analysis highlights evaluated suggestions and never takes a turn.

Entry Patience is always 8 and Suspicion limit always 6. Every accepted card gives 1 Agreement. Default target is `clamp(round(4+(DC-20)*6/80),4,10)`: 4/6/9 at DC20/50/80, 10 at DC100. Each check uses one named signal. Charm dominates via frequency rather than contributing to unrelated checks. Scenes use source/key tag eligibility and weights, with no hidden DC offsets. Explicit flags, spell-knowledge or payment cards appear only when configured.

The 45-card ordinary library and 47 encounter presets cover all 39 requested source events in 43 scene variants plus four research fixtures. `encounters.mjs` retains source pointers; the rulebook lists every adapter. The frozen `schema.mjs` records combat-source hashes for costs, ranks, kit statistics and icons; refresh it explicitly with `sync-schema.mjs --update`, never during a benchmark.

## Repeat the study

```sh
node experiments/negotiation/study.mjs --episodes 32 --seed 20261020 --out /private/tmp/negotiation-study-new
node experiments/negotiation/analyze-study.mjs /private/tmp/negotiation-study-new /private/tmp/negotiation-study-new.md
node experiments/negotiation/smoke.mjs /private/tmp/negotiation-coverage-new
node experiments/negotiation/performance.mjs /private/tmp/negotiation-performance-new.json
```

The study freezes sources, Rust source/lockfile and Wasm, uses paired seeds, records raw command tapes and verifies every replay. Main grid: Balanced at 20/50/80, DC gaps −15/−10/0/+10/+20, always-Confront / one-response / up-to-three-response policies, 32 episodes per cell. Separate level-50 diagnostics vary spell access and kits. All 1,536 tapes replayed; the scene smoke checks 141 scene/level cases. Output directories and reports refuse overwriting.

Gameplay analysis uses sampled expectimax with a cooperative 50 ms cap, a 250,000-check ceiling, three unknown-card samples and up to three response turns. All legal root actions receive scores; useful-spell pruning applies in continuations. Scores are heuristic expected utility, not calibrated win probability. `fixedNodes: true` disables the deadline for deterministic fixed-work tests. A missing Wasm build fails explicitly.

Short goldens passed 1,605 transition cases, 102 spell/rank cases and 12 root-action search comparisons against JavaScript. Nine matched depth-two searches (including the Wasm boundary) took ~82 ms in Wasm versus ~984 ms in JavaScript, about 12× faster on this machine. This measures warmed fixed-work search, not a promise that a 50 ms budget itself runs faster or that every serialized one-step transition is faster. See `results/tuned-rust-20261020/performance.json` for raw timings.

The old `ai-study-20261020.md` and old result directories describe previous rules and remain preserved for comparison. Current results are in `results/tuned-rust-20261020/` (ignored by Git); archived snapshots reproduce their own rule version. The hosted preview has its own source repository and retains owner-private access.
