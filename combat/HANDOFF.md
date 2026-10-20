# Handoff: putting the combat minigame into Lumenhold

For the agent who wires `combat/` into the main game. Read this, then `INTEGRATION.md` (the design: what goes in, what comes out, and why), `EVENTS.md` (every current combat card: its foe, context, level and edits) and `web/rulebook.md` (the rules). `README.md` covers building, testing and balancing the minigame on its own.

## Integrated (2026-10-19; rules F5.9d)

The minigame is wired in: every `challenge combat` and `challenge duel` a player meets is played, and none is rolled. The rest of this file is the hand-over as it was written; where the build differs from its suggestions, this section wins.

- **Entry points in the main game:**
  - `build/combat.bundle.js` (`node combat/tools/bundle.mjs`; `--no-wasm` reuses the built `web/core.wasm`): one global `LumenholdCombat`, also `require()`-able. It's committed; `grim build --check` and `test/combat-bridge.test.js` fail when it's stale.
  - `src/engine.js`: `eng.fights` (a resolver), `fightRequest`, `playFight`, `fightAhead(key)` and `choose(key, {fights})`.
  - `src/combat.js`: the bridge (`foeOf`, `createFight`, `fightResult`, `autoplay`). The foe's level uses the engine's own DC (`foeLevel`), not `challengeDC`.
  - `src/combat-ui.js` and `src/combat.css`: the fight screen, in place of the card, which waits under it.
  - `web/analysis.mjs`: the engine's analysis for the player, shared by the bench's engine panel and the game's "engine analysis" setting (a cheat; `createAnalyst()` in the bundle runs it in its own worker).
  - `tools/combat-sim.js`: the simulated players' resolver, both sides played by the AI.
  - `locales/<lang>/combat.lang`: the fight's text by key (`combat/setup/text.mjs`, `web/text-table.mjs`), written by `grim i18n`.
- **Decisions that replace §3's suggestions:**
  - There's no stub path for bots and no auto-resolve setting.
  - There's no pacing limit.
  - Outcome `health` lines are skipped when a fight settles.
  - There's no `combat_cost`.
  - Difficulty is a player setting, Easy by default. It changes only the opponent's decisions (`AI_PRESETS`), never the numbers.
  - A fighter's level shows as the average of their six skills.
  - The UI asks `fightAhead(key)` instead of reading `firstCheck`, so fights inside `if` branches play too.
- **After a change here:**
  1. Rebuild the bundle (and, after a Rust change, the wasm: `node tools/build.mjs`, with cargo on PATH; then `node tools/golden.mjs`, and `update` when the change is meant).
  2. Run `node --test test/combat-bridge.test.js`.
  3. Run `grim diff`: fights change the golden games. When the change is meant, refresh the baseline.

## World expansion 1 (2026-10-20)

Creatures, the worn kit and lessons. Tests: `setup/expansion.test.mjs`; the design is §9.2 of `docs/design-v0.3.md`.

- **Races** (`RACES` in `setup/roster.mjs`): a `SPECIAL_LOADOUTS` entry with `race:` scales that actor's HP and Mana capacity (`kit.hpScale`) and sets `kit.noHeal` (the core's `heal` returns 0). Humans have no race.
- **Aliases:** a `SPELLS` entry with `as: <spell>` is learned as its base rule. `generateLoadout` records `kit.labels[base] = alias` (the fight text and buttons show the alias) and the cost difference in `mods.costDelta`. The core never sees an alias id; `export-data.mjs` leaves them out. A `telegraph: true` alias shows its channel as "winding up".
- **New rules** (`rust/core/src/rules.rs`): spell properties `bind`, `drain`/`drainKeep`, `poison: [per, n]` and `hits`; effects `bound` and `poison`.
- **Modifiers:** `kit.mods` = `{hp, mana, cost, costDelta, onCast, onDefend, taken, takenAll}`, from the player's worn items (`fightOptions({player: {mods}})`) or a foe loadout's `mods:`. Groups (`forbidden`, `umbral`, `nonhuman`…) are resolved by `expandMods` against the opponent: `taken … from nonhuman` becomes `takenAll` only against a creature.
- **Foes:** `FOES[id].pronouns` (`she`, `he`); creatures are "it" by default.
- **Card decisions** (`EVENTS` in `setup/foes.mjs`): `tutorial: [coach keys]` (a lesson: coach marks from `fight.coach.<key>`, "Skip the lesson" settles as a draw) and `stakes: 'none'` ("Walk away"). Either zeroes the result's deltas and follow-ups (`src/combat.js` `fightResult`).

## Where things stood (2026-10-17)

- **The minigame is canon as of `spells-v2 F5.9c`** (`RULES_VERSION` in `rust/core/src/lib.rs`). It's playable on its own:
  1. `node combat/tools/build.mjs`
  2. `PORT=61096 node combat/out/site/server.mjs`
- **One implementation per function.**
  - The rules and the AI search are Rust (`rust/core`), compiled to WebAssembly for the browser (`web/core.mjs` is its JS face) and natively for simulations.
  - Spell data, kits and the campaign bridge are JS (`setup/`).
  - Never copy the rules into the main game; build from here.
- **Balance as of F5.9, at depth 4** (`node tools/suite.mjs F59 --depth 4 --seeds 2`; reports go to `out/`, which is gitignored). F5.9 has no depth-5 run yet; F5.8's depth-5 numbers (classes 42–60%, gaps 80/91/100%) are the last at that depth.
  - Every class wins 42–61% at equal level (sd 5).
  - The higher level wins 69/91/99% at +5/+10/+20.
  - Fights last a median 14 exchanges at level 20, 23 at 50 and 27 at 80; 84 of 1,260 end on points.
  - Entering with no Health costs about 17 points of win rate, and no Mana 10 (F5.5–F5.7 measurements).
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

  Commit it, like `build/content.bundle.js`. The source of truth stays in `combat/` (or move the folder to a permanent home such as `combat/`, keeping its tools working).
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
- **Follow-ups:** `settle()` returns `followUps` (a witnessed forbidden cast's `forbidden_cast_report`). Queue the main game's consequence from them; the minigame invents no story.
- **Double charging:** check each card's outcome effects. Ones written for the stub may already charge Health for the fight.

### 4. The bridge

- **Player:** the engine's six skills, learned spells and their levels, health, mana, mood, renown, gold and alignment map straight into `fightOptions`; the field names are in the file header.
- **Names for the fight text:** the player is always "you"; pass the opponent's pronouns (`opponentPronouns`, from the character's `pronouns:`) and the opponent's name (a character's short name, or the card's description of a generic foe, e.g. "the hooded duellist") to `fighterNames` (`setup/flavor.mjs`).
- **Opponents:**
  - `vs lyra.arcana` and similar name a character: use `NAMED_LOADOUTS` (canon skills from `setup/cast-stats.mjs`, a snapshot of `content/world/cast.grim`; refresh it with `setup/sync-loadout-stats.mjs` when the cast changes).
  - A difficulty word (`adept-`, `apprentice+`) means a generic foe: `EVENTS` in `setup/foes.mjs` names it for every current card (a pool, an archetype or a special foe), and `foeLevel` sets its level from the rung. `node combat/tools/event-coverage.mjs` checks that every combat card has a decision. Seven cards become feats instead (`EVENTS.md` §6).
  - The AI: a fixed depth-5 search with no seeded mistakes (`LIVE_AI` in `web/app.mjs`), plus `preset: 'easy'|'medium'|'hard'|'engine'` (a player setting; the game defaults to Easy); `createState` adds the foe's persona.
  - The foe's level is the card's challenge level: `challengeDC` and `foeLevel` in `setup/foes.mjs` (the engine's `ladderOdds` DC, plus the odds word); `vs npc.stat` characters via `namedFoeSkills`. `tools/event-levels.mjs` lists every card's levels by month.
  - A few points of level are a big step (+10 levels wins 87%).
- **The fight setting, per challenge:** `fightSetting(cardKey, i, foe)` (`setup/foes.mjs`) gives `{context, observers, witnesses}` for the card's i-th challenge; pass all three to `fightOptions`. Every played card has them (`EVENTS.md` §6 lists them), and `tools/event-coverage.mjs` fails if any is missing. What each one does:
  - **`context`: the rebates.** The share of the fight's Health and Mana losses refunded at settlement (`CONTEXTS`, `setup/roster.mjs`): practice duel 80%, public duel 80%, the ring 65%, real conflict 50%. It comes from the card, else from the foe.
  - **`observers`: an audience whose Renown counts.** With one, Glamour pays its Renown and Rapport turns Crowns into Renown at settlement, so `fightOptions` keeps both in the player's kit; without one they do nothing and stay out. Tournaments, public challenges, Thornwick contests, the ring and any scene with spectators.
  - **`witnesses`: someone who would report a forbidden cast.** A forbidden cast always costs alignment; witnessed, it also adds a `forbidden_cast_report` follow-up, which the main game turns into its consequence (an academy story event, not written yet). An audience is always a witness. Witnesses without an audience: a sparring partner, a friend at your side (Kael in the tunnel, Ilse in the lane). Nobody: the shadow stag, and the man in grey when you face him alone.
  - **Not rebated, not an observer matter:** Crowns and alignment are never refunded. Mood is the outcome's (`settle.mood`). Renown, Mood and gold the story gives for winning stay on the card's outcomes; the fight only adds what its spells move.
  - Cards don't carry these yet; `EVENTS` is the lookup. A card field (`context`, an audience word) would be a schema addition (`EVENTS.md` §7): follow AGENTS.md "The format and the engine".
- **Condition:** handled inside `fightOptions` (`combatStart`, `setup/setup.mjs`; numbers in `COMBAT_TUNING.condition`). Warn the player before a fight when they enter below fit (Health under 70, or Mana under capacity).
  - **Health:** combat max HP comes from the skills; Health sets the share you start with. From Health 30 up you start at full HP; below 30 the start falls in a straight line to 70% at Health 0 (`healthFull` and `healthKnee` 30, `hpAtZero` 0.7; feedback 2026-10-19, was 90% + 10% × Health/70 down to 30). A badly hurt student fights hurt.
  - **What it costs** (`tools/condition-study.mjs`, depth 4, 480 fights a row, ±2.4): Health 50 −2 points of win rate, 30 −10, 15 −28, 0 −33; Mana 50% −14, 10 of 43 −19, none −24; Health 30 with half Mana −20. (F5.9b's floors: no Health −15, no Mana −15.) Resting before a fight now matters.
  - **Mana:** you start with exactly the Mana you had, and the rest of your capacity starts as **flux**. Entering with 10 of 43 gives 10 ready Mana and 33 flux. Flux is loose magic: one Reclaim takes it all back into Mana, but costs that exchange and breaks your Shadowstep, and the opponent's Seal can snuff it first (`manaAsFlux`). Until then a cast makes no new flux, since Mana plus flux can't pass capacity. Settlement never returns more Mana than you brought: flux reclaimed in the fight is the fight's, not a refill.

### 4b. Mana on one scale in both games

- **The change:** the main game's Mana pool becomes the fight's capacity, so a point of Mana means the same in both. `content/core/rules.grim`, `@resource mana`:
  ```
  max: round(43 * (2/3 + (2 * arcana + lore + alchemy + charm + vigor + guile) / 1050))
  ```
  This is `manaCapacity` (`setup/roster.mjs`, `COMBAT_TUNING.capacity`): 43 × (2/3 + weighted skill/150), Arcana counted twice. 32 at the starting skills (about 12), 43 at 50, 53 at 80. It replaces 40 + Arcana/2 (46 at the start, 65 at Arcana 50), so the pool shrinks by about a third.
- **Why:** with one scale, "Mana under capacity" is simply "Mana under max", the fight starts from the main game's own number (above), and settlement charges the same points the fight spent. No conversion, nothing to explain.
- **Rebalance with it, in the same change:**
  - `start: 30` stays (under the starting max of 32).
  - Monthly regen (`mana_regen`, 10 + Arcana/10) and the mana preset sizes (`@balance sizes: mana 3 6 10 16 25`) were tuned against the larger pool. Re-measure before touching them: `node tools/grim.js balance`, `tools/economy.js --by event` against `docs/playtest-2-flows.md`, and the design's mana invariants (`docs/design-v0.3.md`: a caster's Mana stays above 40% most term months; a balanced player's stays full). If casting dries up, scale the sizes by about 0.7 (2 4 7 11 17).
  - Exam nerves (−15) become a larger share of the pool.
  - Record the change in `docs/design-v0.3.md` (the source of truth for numbers) and refresh the golden games (`grim snapshot`) in the same commit: `grim diff` will change.
- **Done when:** the main game's max Mana equals `manaCapacity` for the same skills (add a test), and `grim balance` passes.

### 5. The UI

Port the fight screen from `web/app.mjs` and its look from `web/style.css` as an overlay over the card, which stays visible. Port the fight itself, not the bench around it.

- **Keep, as built:**
  - **The two fighters:** portrait, then Health and Mana as big numbers on bars, with flux on the Mana bar. A Lodestar shield is a gold band on the HP bar with its value. Standing constructs sit beside the name with the HP they have left.
  - **The exchange track:** one axis for every past exchange (both moves as icons; it scrolls sideways into the past), this exchange and the next four.
    - Each future slot shows who commits first (their move will show, or stays hidden), and any move forced by Compel or lost to a freeze.
    - Every line is a spell's duration, drawn in its caster's colour with its icon at the exchange it began. A line stays put as exchanges pass. Foresight, Compel and Torment live on their target in the state but draw as the caster's line (`CAST_ON_FOE`, `effectRows`); the tooltip says who a line is on.
    - Omens sit on the exchange they land.
    - Below the track, the latest exchange in full, or any one picked on the track.
  - **Beside the actions:** the telegraph (the foe's committed move, with its effect and flavor line), which opens the full text.
  - **The square action buttons:** icon, name, effect (`web/brief.mjs`, read from `describe()`), turns, and the Mana or HP cost.
  - **The inspect sheet** (the foe's skills, kit with prices, recent moves), opened by tapping the foe's portrait or card.
  - **No header and no concession.** The fight opens on the fighters: the track already shows the exchange and who leads, and the telegraph shows their move. There is no Leave: a played fight runs until someone falls, or until a stalemate or a decision on points. Don't wire `concede()` to any control. (Integrated: there's no auto-resolve setting; a player who finds fights hard lowers the difficulty.)
  - **Interaction rules:**
    - An HP or Mana change animates once: re-renders don't replay it.
    - The track's name column has a fixed width, so the columns stay aligned.
- **Keep the styles.** Move the fight's rules from `web/style.css` into `src/style.css`, scoped under the overlay's class:
  - **What to move:** the fight, fighters and bars, telegraph, effect summaries, exchange track, actions and commit bar, result, sheets, the `@container play` two-column rules and the ≤600 px rules.
  - **Tokens and fonts:** they already match the main game's, so take `--night*`, `--line`, `--gold*`, `--parch`, `--ink*`, `--muted`, `--text`, `--good`, `--bad`, `--radius` and `--serif` / `--display` / `--sans` from `src/style.css` rather than redefining them. That way the zh-CN font swap applies to the fight too. Add only the fight's own tokens: `--line-2`, `--hp`, `--mana`, `--flux`, `--you`, `--opp`, `--k-*` and `--tk-bg`; `--cw`, `--ch` and `--lw` are local to the track.
  - **The container:** declare `container: play/inline-size` on the overlay's parent, so the two-column layout follows the space the fight actually has.
- **Do not graft the mock UI.** The bench imitates the main game around the fight so the visuals could be judged in place. These are stand-ins for screens the game already has:
  - in `web/app.mjs`: `stubTop`, `stubMeters`, `stubSide`, `cardStub`, `renderChrome` and the `chrome` toggles;
  - in `web/style.css`: `.shell`, `.stage`, `.stub-*`, `.card-stub`, the `max-height:720px` rule that hides the card stub, the `.stub-top` hiding on small phones, and `body{overflow:hidden}`;
  - in `web/index.html`: the shell markup and the "Main game around the fight" fieldset.

  Leave the game's real top bar, meters, side panel and card as they are. The fight's numbers on the meters (for example the Mana orb during the fight) are a separate decision, not part of this port.
- **Do not graft the bench's control UI either.** It drives the experiment, not the fight:
  - the Bench dock: `renderBench`, `setDifficulty`, `.bench*`, and the `.bench-tool` gear in the fight header;
  - the setup panel: `#setup`, `config()`, `setup()`, the presets, the "Return to current fight" button and the welcome text;
  - the engine view and evaluation bar;
  - the search journal (`debug()`), the full log sheet (the track and the latest exchange in full replace it) and the bench's Concede;
  - the result panel's Replay, Next bout and Export log buttons. In the game the result hands the outcome back to the card (§3).

  The game sets up a fight from the card and the run (§4), not from a form. Difficulty is a player setting (the game defaults to Easy) that belongs in the game's own settings; pass it as `ai[1].preset`. The fight has no header bar.
- **Portraits:** `web/art.mjs` shows `portraits/<npc>.png` when one exists (`NAMED_LOADOUTS[name].npc`), else an SVG placeholder. The player's frame stays blank.
- **Layout:** no panel scrolls except the track, sideways.
  - It must work at phone width (375 px). With room (a 640 px container or wider) the state sits on the left and the choices on the right.
  - The bench fits 1280×800 inside its mock chrome. The real chrome differs, so check the fit again in the game at 1280×800, 1024×700 and 375×812. If height runs short, let the card behind give way first, as the bench's mock card does.
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
  - `node --test setup/ web/` (kits, the campaign bridge, icons);
  - `node tools/event-coverage.mjs` (every combat card has a decision, a context and an audience).
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

- **F5.9's linear scaling shortened low-level fights** (14 exchanges at level 20, was 20) and weakened Brawler and Sailor at levels 20–30 (33–42%). Strike no longer scales faster than spells. See `EVENTS.md` §2 for levers.
- **Named characters** (`EVENTS.md` §5): since F5.9c, peers play at a mean skill of their level, so the card's DC is their strength. Ilse, Lyra and Bram sit at their level (equivalent 50–55 at 50); the Charm- and Guile-heavy peers (Tamsin, Corvin, Nessa) and Mir stay 10–15 below, because Charm drives no combat spell. Thorne is still too weak for his canon (faculty play their canon skills). Lyra isn't ahead of Bram and Ilse.
- **Duellist is lowest after F5.9c** (40%, 34% at levels 60–80; suite `F59D2`): the other classes' extras got stronger (Starlight, Moonwell, Siphon), its kit didn't.
- **The Shadow stag** is even overall (classes 51%) but stronger at levels 20–40 than from 50.

- **Shadowstep then Mend** is the most common two-action sequence in high-level fights, and it's the game's main comeback. Switches that end it are built in but off: `SPELLS.mend.exposes` and `COMBAT_TUNING.shadowstep.breakOnCast`. Turning them on removed the back-and-forth (`rulebook.md`, F5.5). If players find it dull, give the opponent an answer to it rather than removing it.
- **Levels 20–30 vary most** (class sd ≈ 8–13). Which spell a class gets second matters more than its stats.
- **Below level 20 is rough,** and the main game starts there. At levels 10–15 (depth 4, three seeds):
  - fights run a median 24 exchanges;
  - in 46% of exchanges neither side casts;
  - classes win 23–70% (sd 14 at F5.7); Scholar and Hollow adept are lowest.

  F5.6 gives every class Flame by level 10 (`kits.flameBy`). Lowering the skill pivot or Strike's rate didn't narrow the spread. Early fights probably want hand-picked opponent kits, or fewer classes.
- **Showman is the weakest class at both depths (about 41%):** its Charm has no combat spell to drive, because Glamour and Rapport do nothing in a fight. Giving charm a combat use (crowd support, a taunt) would fix the cause.
- **Showman and Healer at levels 60–80:** at depth 5, Showman wins about 25–31% and Healer about 72–76%. Stat offsets didn't move either (variant `h1`). It needs a kit change: Showman's charm spells are out of combat kits, and Healer plays Shadowstep+Mend best.
- **Run-to-run noise:** the search's transposition table carries over between fights on a worker thread, so tied moves break differently from run to run. One class in one level band can move ±7 points between identical runs, even at depth 5. Compare whole suites, use `--seeds 3` when screening, and don't tune to a single band.
- **Untested below level 20,** where the main game starts (skills ≈ 12). Run a level-12 arm before release. If fights drag, raise the factor's floor or lower the pivot.
- **Rarely picked spells:** Starlight, Reflect and Lodestar are picked about 1% of the time they're legal. Tailwind and Foresight are niche.
- **Design questions are in `INTEGRATION.md` §8:** the cost of a won fight, how much condition weighs, the draw → partial mapping, and how a card names its context.
