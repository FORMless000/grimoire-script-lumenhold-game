# Crux in Lumenhold

Crux is canonical in `crux/`, promoted from `experiment/parley-cards` at `74ab2ce` on November 4–5, 2026. The retired worktree's `experiments/crux/README.md` and `CLAUDE.md` redirect Claude here. Keep future experiments in a separate named directory/worktree and import these sources; never maintain a second rules or renderer implementation.

## Ownership

- `rust/core/`: the rules, resource payments, deck, crude players, search and JSON view. The browser and campaign simulator use its Wasm build; the research CLI uses the same source natively. No JS rules fallback.
- `cards.js`, `voices.js`: one argument library and one presentation/voice library. `spells.js` is generated from the combat roster and icons. `encounters.js` is generated from campaign content and `PARLEYS`, for the bench and encounter identity.
- `core.js`: Wasm lifecycle, deterministic game handles and move tapes, Rust autoplay, analysis worker. Browser initialization is asynchronous; Node can use `initSync()`.
- `ui.js`, `style.css`: one mountable renderer and scoped stylesheet used by both hosts. `index.html` supplies standalone setup. Campaign `src/parley-ui.js` supplies callbacks, localized scene metadata and its host; `src/parley.css` only adapts the stage.
- `src/parley.js`: DOM-free campaign setup, result conversion, snapshots and resume. `tools/parley-sim.js` selects an existing Rust bot for campaign simulations.
- `build/crux.bundle.js`: committed classic script, `window.LumenholdCrux` or CommonJS exports, including Wasm and worker support. Works from `file://`. The server allows only this bundle and the shared stylesheet, not the entire source tree.

## Campaign inputs

`Engine.parleyRequest` runs at the reached challenge. `minigameAhead(key)` executes a disposable copy up to the first fight or negotiation, so earlier spending and branches are reflected in the request without changing the real run. `parleyAhead` and `fightAhead` are filtered wrappers.

A campaign setup supplies six actual skill values (including decimals), supported learned spell IDs/ranks, current Mana and capacity, Crowns, Health and Renown. Preset kits grant nothing to campaign players. Unsupported spells have no negotiation adaptation and do not appear in the tray.

Three additional signals are direct values, without level adjustment, normalization or averaging:

| Signal | Value | Missing context |
|---|---|---|
| Standing | Current Renown, 0–100 | Always present |
| Bond | Relevant NPC relationship, −50–100 | Unavailable, not zero |
| Record | Relevant club/job/internship performance, or thesis progress, 0–100 | Unavailable; course GPA/preparation is not converted |

Person defaults to the challenge's resolved `vs` NPC, then actor. Track defaults to the current track. `PARLEYS` binds exceptions once: e.g. an interview with the headmistress reads her relationship rather than Nessa's; a thesis defence reads thesis progress. An untracked parent or brother does not inherit a relationship with their child/sibling. Missing signals remove their arguments from the pool; if the crux asks for one, it uses the circumstance's existing skill lean. The briefing names the source or says it is unavailable.

These numbers share usable units, but their distributions differ from the original level placeholders. Campaign playtests must judge the resulting difficulty. Do not quietly remap them to restore the prototype win rates.

The reached challenge supplies DC (including drift/offsets/peer growth), `using`, partial eligibility, and satisfied positive condition steps. Crux's existing odds-word difficulty shifts live once in `setup.js`. True condition steps become named once-per-meeting evidence; false conditions grant nothing and their bonus is not also applied automatically. Generated bench defaults never override runtime branches. Evidence does not grant clues, arc progress or campaign flags.

## Payments and results

`@balance parley_scale` defaults to **0.6** for the campaign, an initial tuning setting rather than a demonstrated optimum. Rust applies it when a campaign resource transfer occurs: Crowns, Health, Alignment, theft gains, failure costs and hostile non-Mana losses, rounded up per transfer. Mana casts, demands and hostile drains retain full cost. Displayed costs, affordability and payments agree. Resource gains use the same rounded share. Patience, Suspicion, Agreement and Renown requirements are not scaled. There are **no rebates**, including on losses or played tutorial meetings. The explicit tutorial skip makes no moves and has no costs.

Crux returns remaining balances; the bridge computes deltas from the meeting entry, maps `lost` to `lose`, and returns `{request, outcome, reason, deltas, followUps, actions, moves, rules}`. `choose(key, {parleys: [result]})` validates request identity, applies the deltas once, then runs the authored outcome normally. Story purchases, rewards, Mood and Health outcomes remain additional; no blanket suppression. A Compel cast queues the existing forbidden-cast report rather than inventing a new story consequence.

The run saves `parleyInProgress`: request, rules fingerprint, entry balances, setup and move tape. Save after every move and clear only after successful settlement. Refresh reconstructs the exact state. A different rules fingerprint refuses resume while preserving the saved meeting. Missing runtime does not roll the stub or consume the card. Engine fixture callers without a resolver retain the legacy stub for compatibility.

Campaign policies install `eng.parleys` and use the existing Rust smart bot (random style uses naive). Recorded campaign games carry negotiation results alongside fight results; replay uses recorded results without rerunning either minigame. In-progress tapes are version-specific, while completed campaign results are replayable without the old Wasm.

## Localization and builds

`text.js` derives translation keys from the existing English data; `tools/messages.js` extracts display templates from Rust and the shared renderer without evaluating source. `messages.js` is generated. Other languages live in `locales/<lang>/parley.lang`; host errors/labels remain `UI_EN`. Names use the existing translated campaign content. Text translation never changes move keys, costs or the simulation. All skins and animations are scoped/namespaced; motion follows the host/device setting.

From the repository root:

```sh
node crux/build-spells.js          # after combat prices/ranks/icons change
node crux/build-encounters.js      # after campaign/registry changes
node crux/build-wasm.js            # exports Rust data, then builds Wasm (cached cargo crates)
node crux/tools/messages.js        # after renderer or Rust display text changes
node crux/tools/bundle.js          # checks generated inputs before bundling
node tools/grim.js i18n zh-CN      # fill new/STALE lines; then rebuild content
node tools/grim.js build
```

Builders offer read-only `--check` (bundle freshness is checked by `grim build --check`). `build-wasm.js` uses `$CARGO`, otherwise `~/.cargo/bin/cargo`, and needs the installed wasm32 target. Rust raw results and goldens remain preserved; `target/` is ignored.

## Validation

- `~/.cargo/bin/cargo test --offline --manifest-path crux/rust/Cargo.toml`: existing rule invariants, campaign input/payment tests, and the retained golden games/search comparisons. The golden fixture retains its documented Rapport/counter exceptions; do not regenerate it to hide differences.
- `node --test test/parley-bridge.test.js`: all 65 current challenges, direct campaign values, branches/pre-spending, evidence, resource scale, no rebates, request identity and exact resume/replay.
- `node tools/parley-e2e.js`: real campaign UI in English and Chinese, phone layout, worker analysis, refresh, settlement and missing runtime. General `tools/e2e.js` also drives negotiations and runs this test over HTTP.
- `node tools/parley-flow.js --seed 13 --out <new-file.json>`: bounded paired comparison of the compatibility roll and two resource scales; refuses to overwrite results. See `reports/integration-2026-11-05.md` and its raw JSON for the initial sample and campaign golden comparison.
- `node tools/grim.js check`, then `npm run verify:full`. Gameplay intentionally differs from the old stub: inspect and refresh the campaign golden baseline while preserving the previous file for comparison. No commit/push/deploy is implied.

## Revised payments (November 5)

Campaign scale is now 0.6, rounded up per non-Mana transfer, including gains. Mana casts, demands and hostile drains retain their full costs. This supersedes the initial 0.5 measurements above; those raw reports are historical. No rebates.
