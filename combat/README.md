# Combat F5: one Rust core for simulations and live play

The combat rules and the AI search exist once, in Rust (`rust/core`). They are compiled natively for balance simulations (`rust/sim`, all cores) and to WebAssembly for the browser game (`rust/wasm` → `web/core.wasm`). JS keeps setup and spell data, text formatting of events, and the UI.

| Folder | What lives there |
|---|---|
| `setup/` | spell and loadout data (`roster.mjs` with `COMBAT_TUNING`, `loadouts.mjs`, `cast-stats.mjs`), `setup.mjs` (`createState`: config, kits, entry resources, max HP, condition), `campaign.mjs` (the main game's bridge in and out of a fight), `flavor.mjs` (what each action looks like) |
| `rust/core/` | the rules (`rules.rs`), the state and its JSON form (`state.rs`), the search and AI policy (`ai.rs`), action descriptions (`text.rs`); spell numbers come from `data/rules-data.json`, generated from `setup/roster.mjs` |
| `rust/sim/` | `combat-sim`: `run` (parallel fights for `tools/sim.mjs`), `step`, `search`, `fight` (line-based JSON, for tests) |
| `rust/wasm/` | the browser build: a small C ABI over linear memory, no wasm-bindgen |
| `web/` | the test bench UI (`app.mjs`, `index.html`, `style.css`, `server.mjs`; `brief.mjs` for the effect on each action button, `art.mjs` for portraits and placeholders), `core.mjs` (the JS face of the core: `applyChoice`, `legalActions`, `describe`, `chooseAIAction`, `searchAction`, …), `rulebook.md` |
| `tools/` | `build.mjs`, `playtest.sh`, `suite-f5.sh`, `sim.mjs`, `arms.mjs`, `replay.mjs`, `report.mjs`, `action-report.mjs`, `golden.mjs`, `export-data.mjs`, `bench-live.js` |
| `test/golden.json` | regression goldens (see below) |
| `out/` | gitignored: the built site, suite results, and the retired JS oracle (`out/oracle/`) |

## Build and play

```bash
node combat/tools/build.mjs
```

```bash
PORT=61096 node combat/out/site/server.mjs
```

`build.mjs` exports the spell data to Rust, builds the native simulator and the WebAssembly core (`rustup target add wasm32-unknown-unknown` once), and writes the site to `out/site/`. Needs Rust (stable) and Node 20+.

## Playtests and balance simulations

**The playtest pipeline** (rerun after every rule change):

```bash
combat/tools/playtest.sh F56_D5 5
```

This runs the balance suite with every side searching 5 exchanges per decision: 504 class-matrix fights at levels 20–80 and 432 level-gap fights, all with the fallible AI. It takes about 10 minutes on 8 cores (40 s at depth 4). It writes `out/F56_D5-report.md`, which has:
- class win rates by level band;
- fight statistics (knockouts, decisions, draws, lengths, search depth);
- level-gap win rates;
- a table of every spell and action: how often it's in kits, how often the searching AI picks it when it's legal (the main strength measure), uses per fight, damage per use, and the win rate of fighters who used it against those who didn't;
- the choices inside channels and Haste.

Options:
- `tools/playtest.sh <name> [depth] ['<config JSON>'] [baseline name]`. A config tries a rule variant, e.g. `'{"manaCostScale":1.5}'`. A baseline name adds that run's columns to the win-rate tables.
- Without traces or the spell table: `DEPTH=4 tools/suite-f5.sh RS`, then `node tools/report.mjs RS [other names…]`.
- The spell and action table alone: `node tools/action-report.mjs <name>` (add `--gaps` to include the level-gap fights).

Each results file has one summary line per fight and `<name>_cross.arm.json`, the arm it was run with. Arms for `tools/sim.mjs` take the same fields the old JS runner took (`pairs`, `gaps`, `named`, `offsets`, `levels`, `fallible`, `seeds`, `search`, `config`, `maxRounds`, `tableLimit`), and its output lines have the same fields.

**Traces and replays.** Every simulated fight is reproducible: node budgets (not clocks) bound the search, and seeds drive the AI's mistakes.
- `node tools/replay.mjs out/F53_D5_cross.jsonl 17` replays the fight on line 17 of the results and checks it against that line. It prints an exchange-by-exchange summary and writes the full log to `out/replays/`.
- The playtest pipeline, `TRACE=1 tools/suite-f5.sh`, and `--trace` on `tools/sim.mjs` all write every fight's full log to `out/<name>_cross.traces.jsonl`, one fight per line, about 45 KB each.

A log has the same shape as the browser's exported log, plus structured events:
- `history`: per exchange, the actions, their descriptions, the event texts (`events`) and structured events (`eventData`: who dealt what to whom, Torment charges, reflected hits), and HP, ready Mana and flux after it;
- `stats`: per AI decision, the legal moves, the chosen and best move, the value, completed depth, nodes, and any deliberate mistake with its regret;
- `kits`, `config`, `result`, `settlement` and `reports`.

## Tuning, variants and the campaign bridge

**`COMBAT_TUNING`** (`setup/roster.mjs`) is the one home of the scaling numbers, exported to Rust with the spells:
- `skill`: the per-point rates of the main combat skills (Arcana, Vigor, Alchemy) and the others (since F5.9 all 1/150: factor 2/3 + skill/150);
- `strike`: Strike's base damage and its Vigor rate;
- `offsets`: the jitter of class skills (class offsets are % of level since F5.9);
- `guard`, `shadowstep`, `decision`: Guard fatigue, whether casting breaks your own Shadowstep, and the quiet exchanges before a stalemate is called on points;
- `hp`, `capacity`: combat max HP and Mana capacity (each with an optional pivot and floor, unused since F5.9);
- `condition`: how a worn or drained player starts (floors);
- `settle`: what a fight costs afterwards.

**Variants** try a balance idea without editing the roster. A variant is a module in `tools/variants/` whose default export mutates the roster objects: `R => { R.SPELLS.flame.cost = [9]; … }`. Pass it with `--variant` to `tools/suite.mjs` and `tools/condition-study.mjs`, or as `VARIANT=…` to `playtest.sh` and `suite-f5.sh`. It's recorded in each arm, so replays reproduce it. Each variant sets values on top of the roster as it was when it was written, so applying an old variant to today's roster isn't the same experiment. `v1`–`v8c` are the F5.4 tuning steps (F5.4 baked in `v8c` plus the 0.9 floors), `g1`–`g9` are the F5.5 trace-review steps (F5.5 baked in `g7`), and `g10`–`g11` plus `l3` the F5.6 low-level steps (F5.6 baked in `g11` and `l3`). `l1`, `l2` and `h1` were tried and rejected. `p1`–`p6` are the F5.7 scaling steps (F5.7 baked in `p6` plus a Mana floor of 34), F5.8 baked in `s1`, F5.9 baked in `f59-linear-b` plus percentage offsets (`f59-linear` was too steep for HP), and F5.9b baked in `f59b-kits3` with the new kit gates (`f59b-vigor`, `f59b-kits`, `f59b-kits2` were its steps).
- `node tools/suite.mjs <name> --depth 4 [--variant f] [--trace] [--all] [--arms cross,gaps,all] [--seeds 3]` runs the suite directly (about 2 minutes at depth 4). One seed leaves about ±8 points of noise per class and level band. Use `--seeds 3` when you screen class changes.
- `node tools/condition-study.mjs [--variant f] [--grid '[{"health":0.5},…]']` measures how entering worn or drained changes the player's win rate (432 fights per condition; about 10 minutes at depth 4).

**The campaign bridge** (`setup/campaign.mjs`), for the main game:
- `fightOptions({player, opponent, context})` turns the player's skills, learned spells, Health, Mana and other resources into `createState` options;
- `settle(state, player)` turns a finished fight into resource changes: Health (only below `settle.healthFreeAbove` HP left: `settle.healthStake` × how far below, less the context's rebate, never below 1), Mana, Mood, Renown, Crowns and alignment.

See `INTEGRATION.md` for the design and `HANDOFF.md` for the plan to wire it into the main game.

**Opponents and the AI** (`setup/foes.mjs`, F5.9; the plan for every current combat card is `EVENTS.md`):
- `PERSONAS`: the actions each class, character and special foe favours (points added to their value when choosing);
- `FOES`, `POOLS`: the foes the cards name, with display names, loadouts or pools, persona overrides and contexts;
- `EVENTS`: every `challenge combat` / `challenge duel` in `content/`, played (against which foe) or converted to a feat;
- `foeLevel`: a generic foe's level from the card's rung and odds word.

`AI_PRESETS` (`setup/roster.mjs`) are the difficulty levels (easy, medium, hard, engine). Pass `ai: [null, {preset: 'medium'}]` to `createState`, which expands it with `expandAI` and adds the loadout's persona.
- **Easy and Medium (F5.10)** are persona opponents (`algorithm: 'persona'`, `rust/core/src/persona.rs`). A small MCTS is steered by the persona's tilt, a channel plan layer builds and releases channels on purpose (`plans`), and a sanity veto (`veto`, in points) stops a favourite thrown into a defence that punishes it or that knocks the caster out. They're memoryless, and their budgets are node counts (`mctsNodes`), so a slower device plays the same opponent, only slower.
- **Hard and Engine** use the alpha-beta search at the bench's fixed depth 5 with no seeded mistakes (`LIVE_AI`, `web/app.mjs`). Engine adds LMR and the Engine eval (`lmr: 3`, `eval: 'mlp'`), and so does the engine analysis (`web/analysis.mjs`).
- **The Engine eval** is a 16-unit MLP over the hand eval's terms, distilled from deep searches (`rust/core/src/neural.rs`; weights from `tools/export-mlp.mjs`).

The search's own knobs are `tilt`, `tiltScale`, `slack` and `maxRegret` (`rust/core/src/ai.rs`); a tilt key names an action, or `<spell>_hold` / `<spell>_release` for one channel's Hold or Release.

The experiments behind these choices live in `lab/` (a standalone crate over the core) and `tools/lab.mjs`: arenas, simulated players (novice, decent, reader), persona distinctness and long-term spell use. Build the lab with `(cd lab && cargo build --release)`.

Tools:
- `node tools/ai-study.mjs [--grid '[{"preset":"easy"},{"slack":8}]']`: what an AI setting costs against the optimal AI;
- `node tools/foe-study.mjs "Shadow stag"`: a foe against every class;
- `node tools/named-study.mjs [--stats '{…}'] [--kits '{…}']`: each named character's equivalent class level, optionally with worldbook stat or kit changes;
- `node tools/spell-value.mjs [--spells wildfire,omen] [--variant …]`: what a spell is worth to its holder (engine AI against every class, with and without it), and how often it's cast and held;
- `node tools/event-coverage.mjs [--list]`: that every combat card has a decision;
- `node tools/event-levels.mjs`: each played card's foe level by month, from the card's challenge level, next to the player's skills;
- `node tools/player-study.mjs`: the main game's measured player against every class at E − 10, E and E + 10.

**Flavor** (`setup/flavor.mjs`): one plain sentence of what each fighter did, naming both sides (`{name}` and `{foe}`, from `fighterNames`). The player is "you", so lines mark possessives (`{name’s}`), verb forms (`{v:lunges|lunge}`, `{fv:…}` for the foe) and pronouns (`{pos}`, `{fpos}`, `{fobj}`, from `fighterNames({opponentPronouns})`). `resolvedLines(before, after, exchange, names)` writes each logged action with its result: per-attack lines for each defence (`ATTACK_LINES`), then the damage, Mana or duration in plain words, from the core's `hit` and `moved` events. There are cast lines, Hold and Release lines for channels, `end` lines for effects and constructs, `ko` lines for the finishing action, and endings. The browser shows them in the telegraph, the log and under each exchange. 

## Changing the rules

1. Spell numbers: edit `setup/roster.mjs`, including the special spells' named `amounts` (Wildfire, Omen, Siphon, Moonwell, Lodestar, Rime). Rule logic and the remaining rule constants (named at the top of `rust/core/src/rules.rs`): edit Rust. Action descriptions are in `rust/core/src/text.rs` and use those same constants.
2. Run `node tools/build.mjs`.
3. Run `cargo test --release` (in `rust/`), `node tools/golden.mjs` (about 2 minutes) and `node --test setup/loadouts.test.mjs`. These check every transition, UI query, search and AI decision, natively and in WebAssembly.
4. If the change is meant to alter play, run `node tools/golden.mjs update` and commit the new goldens with the change. Bump `RULES_VERSION` in `rust/core/src/lib.rs`.

## Speed (2026-10-17, Apple Silicon, 8 cores)

| | JS (retired) | Rust |
|---|---:|---:|
| search, one core, cache on, depth 3 | 6.4 µs/node | 0.29 µs/node (native) |
| depth-4 suite, 936 fights | 23.6 min wall (8 processes) | 38 s wall |
| browser, nodes per ms | ~110 | ~1,100 (WebAssembly) |
| browser completed depth: Fast 100 ms / Deep 500 ms / engine view 1.5 s | 3.5 / 4.3 / 4.6 | 4.5 / 5.6 / 5.7 |
| browser at ¼ budget (slower-phone proxy): 25 ms / 125 ms | 2.9 / 3.7 | 3.9 / 4.8 |

The depth-4 suite run on Rust matched the JS suite within noise: class win rates within 4 points, the same knockout, decision and draw counts and level-gap curves, and the same winner in 92% of paired fights. The two differ only where moves tie in value, because the transposition tables break those ties differently. `core.wasm` is 457 KB (162 KB gzipped). `opt-level = "s"` would make it 320 KB but searches 1.7× slower, so the build keeps speed.

## How it was proved equal

Before the JS rules and search were retired, the Rust core (F5.2) was checked against them:
- 2,200 random fights (91,466 transitions) matched identically: state, results, events and legal lists, covering every castable spell, bundle, event kind and ending.
- On 84 positions, depths 1–3, with the cache off, search was identical in nodes, values, moves and rankings. With the cache on it reached the same values.
- 50 seeded fallible-AI fights played the same actions.
- 200 fights through the WebAssembly glue answered 3.9 M UI queries identically, including every `describe` text.

The goldens froze that behaviour. They have since been refreshed for F5.3 (Foresight), F5.4 (the integration pass: skill scaling, kits, Compel, condition) F5.5 (Guard fatigue, stalemates, Starlight, Reflect, class offsets) and F5.6 (Shadowstep and Haste at rank 1, Illusionist's course). The oracle, its differential checker (`out/oracle/tools/check.mjs`) and the frozen F5.2 Rust builds it was compared with are kept in `out/oracle/`. These checks apply only to F5.2 and are not part of the ongoing pipeline.
