# Handoff: putting the combat minigame into Lumenhold

For the agent who wires `experiments/combat-f5/` into the main game. Read this, then `INTEGRATION.md` (the design: what goes in, what comes out, and why) and `web/rulebook.md` (the rules). `README.md` covers building, testing and balancing the minigame on its own.

## Where things stand (2026-10-17)

- **The minigame is canon as of `spells-v2 F5.7`** (`RULES_VERSION` in `rust/core/src/lib.rs`). It's playable on its own:
  1. `node experiments/combat-f5/tools/build.mjs`
  2. `PORT=61096 node experiments/combat-f5/out/site/server.mjs`
- **One implementation per function.**
  - The rules and the AI search are Rust (`rust/core`), compiled to WebAssembly for the browser (`web/core.mjs` is its JS face) and natively for simulations.
  - Spell data, kits and the campaign bridge are JS (`setup/`).
  - Never copy the rules into the main game; build from here.
- **Balance as of F5.7,** from `tools/playtest.sh F57_D5 5`; the report is regenerated in `out/`, which is gitignored:
  - Every class wins 38–58% at equal level (sd 6).
  - The higher level wins 78/90/100% at +5/+10/+20.
  - Fights last about 21 exchanges at levels 20–50 and 28 at levels 60–80; 24 of 504 end on points.
  - Entering with no Health costs 17 points of win rate, and no Mana 10.
- **Already built for the main game:**
  - `setup/campaign.mjs`:
    - `fightOptions({player, opponent, context})` turns the player's state into a fight;
    - `settle(state, player)` turns the finished fight into resource changes.
  - `setup/flavor.mjs`: the text describing each action.
  - `COMBAT_TUNING` (`setup/roster.mjs`): every scaling number.
- **Nothing in `src/` or `content/` uses any of it yet.** Fights still go through the combat stub (`combatValue()` and the `challenge` case in `src/engine.js`).

## The job, in order

Each step should leave the game working and `node tools/grim.js check` passing. Run `npm run verify` at the end of each larger step.

### 1. Spells v2 in content (prerequisite)

- **The gap:** `content/world/spells.grim` still has the old 12 spells. The minigame's spells are the v2 list in `docs/spells-v2-list.md`, whose §K lists the changes.
- **The change:** migrate through `tools/migrations/` with `grim migrate`. Saves, flags and translations reference spell ids, so rename them with `grim rename` and never by hand.
- **Done when:** every spell a player can learn exists in content with the same id the minigame uses (`SPELLS` in `setup/roster.mjs`), and `grim check` and `grim diff` pass. Expect a `grim diff` change: the stub reads spell levels.

### 2. Ship the minigame to the browser from `file://`

- **The constraints:**
  - `index.html` loads classic `<script>` tags, not modules.
  - It must work from `file://`, where `fetch` of a local file is blocked (see the AGENTS.md traps).
- **The bundle:** add a build step that writes `build/combat.bundle.js`. It should:
  - bundle `setup/*.mjs` and `web/core.mjs`, the way `tools/build.mjs` already bundles `engine.mjs` for the bench site;
  - inline `core.wasm` as base64 (about 480 KB, or 160 KB gzipped) and instantiate it from bytes;
  - expose one global, e.g. `window.LumenholdCombat`.

  Commit it, like `build/content.bundle.js`. The source of truth stays in `experiments/combat-f5/` (or move the folder to a permanent home such as `combat/`, keeping its tools working).
- **The AI search:** it runs in a worker. Under `file://`, create the worker from a Blob URL of the bundled worker code and post it the wasm bytes. Fall back to the main thread at the Fast budget when workers are unavailable.
- **Done when:** a fight can start from the browser console on `index.html` opened from `file://`, with no server.

### 3. The engine hook (keep the engine DOM-free)

- **The goal:** a played fight replaces the stub's roll for the player's own `challenge combat` and `challenge duel` cards. There are about 40, `grep -rn "challenge combat\|challenge duel" content`.
- **Where the stub rolls:** in `case 'challenge'`, `pick('challenge', …)`. The engine already has a hook for deciding random branches from outside: `this._oracle` (`pick` → `this._oracle.branch(kind, probs, label)`).
- **The suggested shape:**
  1. Before `choose(key)` resolves an option whose first roll is a combat or duel challenge (`firstCheck`, already computed for the button), the UI plays the fight.
  2. The UI then calls `choose` with the outcome forced: win → `win`, draw or loss on points → `partial` when the card has one, else `lose`, knockout loss → `lose`.
  3. The engine applies `settle()`'s deltas through its normal `change()` calls, so notes, the log and caps still work.
- **Keep the stub** for:
  - automated players: `grim balance`, `economy.js`, `grim analyze`, golden games;
  - a player setting "auto-resolve fights";
  - fights past the pacing limit (at most about one played fight a month; story fights always play).

  So `grim diff` should stay unchanged while the minigame is off.
- **Entry cost:** drop `combat_cost` (`@balance combat_cost`) for played fights, since settlement charges the Mana actually spent. Keep it for stub fights.
- **Double charging:** check each card's outcome effects. Ones written for the stub may already charge Health for the fight.

### 4. The bridge

- **Player:** the engine's six skills, learned spells and their levels, health, mana, mood, renown, gold and alignment map straight into `fightOptions`; the field names are in the file header.
- **Names for the fight text:** pass the player's name and the opponent's (a character's short name, or the card's description of a generic foe, e.g. "the hooded duellist") to `fighterNames` (`setup/flavor.mjs`).
- **Opponents:**
  - `vs lyra.arcana` and similar name a character: use `NAMED_LOADOUTS` (canon skills from `setup/cast-stats.mjs`, a snapshot of `content/world/cast.grim`; refresh it with `setup/sync-loadout-stats.mjs` when the cast changes).
  - A difficulty word (`adept-`, `apprentice+`) means a generic foe: pick a preset class by place or story (the nine in `setup/loadouts.mjs`), and set its level from the expected skill at that point of the run plus the rung (the ladder in `@balance dc_tiers`).
  - A few points of level are a big step (+10 levels wins 87%).
- **Context:**
  - The stake depends on the context: `practice_duel`, `public_duel`, `real_conflict` or `rehearsal` (`CONTEXTS` in `setup/roster.mjs`, and the rebates in `INTEGRATION.md` §3).
  - Cards don't say which yet. Default by kind (`duel` → practice duel, `combat` → real conflict), or add a card field. A new field is a schema addition: follow AGENTS.md "The format and the engine".
- **Condition:** handled inside `fightOptions`. Warn the player before a fight when they enter below fit (health under 70, or mana under the fight's capacity).

### 5. The UI

- **Port the fight screen from `web/app.mjs`** as an overlay over the card, which stays visible. Keep:
  - the telegraph with its flavor line;
  - the action grid with descriptions;
  - the exchange log with finish lines;
  - Concede.
- **Drop the bench parts:** the setup panel, the engine view and the debug controls.
- **Layout:** it must work at phone width (375 px).
- **Saves:** a fight in progress is plain JSON (the state from `createState`, then the core's). Save it with the run so a closed tab resumes mid-fight, and apply settlement once, at the end.

### 6. Localization

- **What's English-only today:**
  - Flavor lines (`setup/flavor.mjs`).
  - Action descriptions: these come from Rust, `rust/core/src/text.rs`, through `describe`.
  - Event texts.
- **The plan:**
  - Move flavor into string tables under `locales/` keyed `flavor.<id>.cast.<n>` / `.hold` / `.release` / `.end` / `.broken` / `.ko` / `.tired`, plus `flavor.ending.<reason>`. Keep `{name}` and `{foe}`.
  - For descriptions, either move the templates to JS (the numbers stay in Rust), or have Rust return a template key plus values. Pick one and keep `{tokens}`.
  - New UI strings go in `UI_EN` in `src/i18n.js`; follow `locales/<lang>/GLOSSARY.md` for spell names.

### 7. Verify

- **Minigame:**
  - `cargo test --release` (in `rust/`);
  - `node tools/golden.mjs`;
  - `node --test setup/loadouts.test.mjs`.
- **Main game:**
  - `node tools/grim.js check`;
  - `npm run verify`;
  - the quick e2e that `verify` runs. Skip the full e2e (`tools/e2e.js`) unless needed; it's slow.
- **By hand, from `file://` and at phone width:** a played fight from a combat card and one from a duel card, a fight resumed after reload, and the auto-resolve setting.

## Changing minigame balance later

- **Where things live:** numbers go in `setup/roster.mjs` (`COMBAT_TUNING`, `SPELLS`) and `setup/loadouts.mjs`; rule logic in `rust/core/src/rules.rs`.
- **The loop:**
  1. Try an idea as a variant (`tools/variants/`) at depth 4, with `node tools/suite.mjs <name> --depth 4 --variant … --trace --seeds 3`.
  2. Read `tools/report.mjs`, `tools/action-report.mjs` and `tools/trace-digest.mjs`. The digest flags stalls, repetition and one-sided fights.
  3. Bake the change in, bump `RULES_VERSION`, run `tools/build.mjs`, then `tools/golden.mjs update`.
  4. Verify with `tools/playtest.sh <name> 5`.
- **Simulated players are crude.** Human playtests are the judge.

## Known open issues

- **Shadowstep then Mend** is the most common two-action sequence in high-level fights, and it's the game's main comeback. Switches that end it are built in but off: `SPELLS.mend.exposes` and `COMBAT_TUNING.shadowstep.breakOnCast`. Turning them on removed the back-and-forth (`rulebook.md`, F5.5). If players find it dull, give the opponent an answer to it rather than removing it.
- **Levels 20–30 vary most** (class sd ≈ 8–13). Which spell a class gets second matters more than its stats.
- **Below level 20 is rough,** and the main game starts there. At levels 10–15 (depth 4, three seeds):
  - fights run a median 24 exchanges;
  - in 46% of exchanges neither side casts;
  - classes win 23–70% (sd 14 at F5.7); Scholar and Hollow adept are lowest.

  F5.6 gives every class Flame by level 10 (`kits.flameBy`). Lowering the skill pivot or Strike's rate didn't narrow the spread. Early fights probably want hand-picked opponent kits, or fewer classes.
- **Showman and Healer at levels 60–80:** at depth 5, Showman wins about 25–31% and Healer about 72–76%. Stat offsets didn't move either (variant `h1`). It needs a kit change: Showman's charm spells are out of combat kits, and Healer plays Shadowstep+Mend best.
- **Run-to-run noise:** the search's transposition table carries over between fights on a worker thread, so tied moves break differently from run to run. One class in one level band can move ±7 points between identical runs, even at depth 5. Compare whole suites, use `--seeds 3` when screening, and don't tune to a single band.
- **Untested below level 20,** where the main game starts (skills ≈ 12). Run a level-12 arm before release. If fights drag, raise the factor's floor or lower the pivot.
- **Rarely picked spells:** Starlight, Reflect and Lodestar are picked about 1% of the time they're legal. Tailwind and Foresight are niche.
- **Design questions are in `INTEGRATION.md` §8:** the cost of a won fight, how much condition weighs, the draw → partial mapping, and how a card names its context.
