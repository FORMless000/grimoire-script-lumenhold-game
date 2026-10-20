# Standalone negotiation simulator · Arguments 3

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
