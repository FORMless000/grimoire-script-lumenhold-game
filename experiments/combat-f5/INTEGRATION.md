# Bringing the combat minigame into Lumenhold (design, F5.9)

How a card's fight becomes a played minigame and how it feeds back into the game. The numbers live in `COMBAT_TUNING` (`setup/roster.mjs`) and `content/core/balance.grim`. This doc gives the shape and the reasons, and the measured effects as of F5.4–F5.7 (2026-10-17). The step-by-step plan for implementing it is `HANDOFF.md`.

## 1. Where fights come from

About 40 cards use `challenge combat` or `challenge duel`. Today these resolve through the combat stub in `src/engine.js` (`combatValue()`, `@balance combat:`): a weighted mix of skills, condition and spell levels, rolled once, with Mana spent on entry (`combat_cost`).

The minigame replaces that roll **for the player's own fights**. The card's three outcomes stay as they are: win, partial and lose map to the fight's win, draw (or decision on points) and loss. Cards keep their text and effects, so nothing in `content/` has to change for a first version.

- **Opt-out:** a setting (and the test harness) can keep the stub's auto-resolve, so automated players, balance tools and players who don't want the minigame still work. The stub stays the expected-value model the content was balanced against.
- **Pacing:** at most about one minigame a month. Further fights that month auto-resolve with the stub, so a busy month doesn't turn into a fighting game. Story fights (the main arc's hard-canon events) always play.

## 2. The player going in (`fightOptions`)

| Main game | Fight |
|---|---|
| Six skills | the kit's skills, unchanged: every skill scales its own spells (and Vigor Strike) by 2/3 + skill/150, ×1 at 50; the skills also set combat HP and Mana capacity |
| Learned spells and their levels | the kit's spells and ranks (only spells with a combat effect) |
| Skills (Arcana counted twice) | Mana capacity: 43 × (2/3 + weighted skill/150): 34 at 20, 43 at 50, 53 at 80 |
| Health | combat max HP is 70 × (0.8 + weighted skill/250), Vigor counted twice (62 at level 20, 79 at 80); Health sets how much of it you start with (below) |
| Mana | ready Mana at the start, up to capacity |
| Mood, Renown, Crowns, alignment | the fight's own resources, for the spells that move them |

**Condition: a deficit gives a worse start, not a lost fight.** At depth 4, a fresh player starting with even 90% of their HP or Mana dropped from 47% to about 30% wins, a disaster in a fight decided by a few points. So the main game's state is compressed into a narrow band:

- **Fit:** Health ≥ 70 (the starting Health) and Mana at capacity give a full start.
- **Below that:** start HP = max × (0.9 + 0.1 × Health/70), and ready Mana = capacity × (0.9 + 0.1 × Mana/capacity). Entering with nothing costs a tenth of each.

The player's win rate entering worn or drained, against a fresh opponent (V8c with the 0.9 floors, depth 4, 432 fights per row; one standard error ≈ 2.4 points):

| Entering with | Starts with HP / Mana | Player wins | Change |
|---|---|---:|---:|
| fit | 100% / 100% | 47% | — |
| Health 56 (0.8) | 98% / 100% | 49% | +2 (noise) |
| Health 42 (0.6) | 96% / 100% | 42% | −5 |
| Health 28 (0.4) | 94% / 100% | 40% | −8 |
| Health 14 (0.2) | 92% / 100% | 38% | −9 |
| Health 0 | 90% / 100% | 32% | −15 |
| Mana 80% | 100% / 98% | 47% | −1 |
| Mana 60% | 100% / 96% | 43% | −4 |
| Mana 40% | 100% / 94% | 39% | −8 |
| Mana 20% | 100% / 92% | 35% | −12 |
| Mana 0 | 100% / 90% | 33% | −15 |
| Health 35 and Mana 50% | 95% / 95% | 33% | −14 |

At depth 5 (F5.5, 432 fights per row) the effect matches: half Health −4, no Health −17, half Mana −6, no Mana −10, both at half −12.

So being worn matters (roughly the gap of five levels at most) but never decides the fight on its own. The game should still warn the player before a fight when they enter below fit.

**Entry cost:** the stub's `combat_cost` (small Mana) is dropped for played fights. The fight spends real Mana, and settlement charges it.

## 3. The player coming out (`settle`)

| Resource | Change |
|---|---|
| Health | the share of combat HP lost × 40 (`settle.healthStake`) × (1 − the context's rebate), never below 1 Health left |
| Mana | the Mana the fight actually spent, net of flux collected and the rebate, at most what the player had |
| Mood | win +3, loss −4, draw 0 (`settle.mood`) |
| Renown, Crowns, alignment | what the fight moved: Glamour, Sleight, forbidden casts, crowd Renown |

Typical Health costs. In the V8c suite a winner lost a median 64% of their combat HP (middle half 40–83%), and a loser all of it.

| Context (Health rebate) | Win | Loss |
|---|---:|---:|
| Practice duel or rehearsal (80%) | about 5 | 8 |
| Public duel (80%) | about 5 | 8 |
| Real conflict (50%) | about 13 | 20 |

For scale (`balance.grim`): medium is 10 Health, large 16 and huge 25, and a night's sleep restores 8. A practice loss is about a night's sleep, and a real fight lost is a large hit. The card's own outcome effects still apply on top. Card effects that already charge health for the fight (written for the stub) should be reviewed when wiring each card, so the fight isn't charged twice.

## 4. Opponents

- **Named characters** use their canon skills (`cast-stats.mjs`, from `content/world/cast.grim`) and fixed or growing levels (`NAMED_LOADOUTS`).
- **Generic foes** use the ten class presets (pools by archetype) or special loadouts at a level set by the card: its rung mapped to a level near the player's expected skill for the month, level = E + 0.35 × (DC − E) + the odds word's shift (`foeLevel`, `setup/foes.mjs`). Every current card's foe, context and edits are in `EVENTS.md`.
- **The AI** plays at the player's difficulty (Easy, Medium or Hard, `AI_PRESETS`) with the foe's persona (`PERSONAS`): see `EVENTS.md` §3.
- Their Health and Mana are full unless the story says otherwise (`opponentCondition`).
- Level matters: in the F5.5 depth-5 suite the higher side wins 76% at +5 levels, 87% at +10 and 100% at +20. A card's difficulty word should move the foe's level by a few points, not tens.

## 5. Flavor

`setup/flavor.mjs` says, in one plain sentence, what each fighter visibly did and what it does in this fight. For example:
- "A translucent ward appears before Ash, blocking off the Duellist's spells."
- "A quill flies around Ash, but it does little in this situation."
- "The Duellist falls before Ash's fire."

Every line names both sides with `{name}` (who acts) and `{foe}`.
- **Kinds of line:**
  - `cast`, the action itself;
  - `hold` and `release`, for channels;
  - `end`, a lasting effect or construct ending (and Mend healing, or `broken` when a hit spoils it);
  - `ko`, the finishing action knocking the foe out;
  - `tired`, a Guard giving way;
  - `ENDINGS`, for points, draws and concessions.
- **Names:** `fighterNames({playerName, opponentName})` gives the pair. The main game passes the player's name and the opponent as the card names them. Without names, the bench uses "the Duellist" or a character's name.
- **Where they show:** the opponent's line on the telegraph, each action's line in the log, and the finish lines under each exchange.

**For the main game:** the lines are English source text. They move to string tables under `locales/` (`flavor.<id>.cast.<n>`, `.hold`, `.release`, `.end`, `.ko`), with `{name}` and `{foe}` kept intact. Word order differs between languages, which is why the names are tokens, not prefixes.

## 6. Technical integration

- **file://:** `index.html` must run without a server, where `fetch` of a local `.wasm` is blocked. The build inlines `core.wasm` (473 KB, about 160 KB gzipped) as base64 in the bundle, and instantiates it with `WebAssembly.instantiate(bytes)`.
- **Workers:** the AI search runs in a worker so the UI stays responsive. Under `file://`, create it from a Blob URL of the bundled worker code and pass the wasm bytes in the first message. With no worker support, fall back to the main thread at the Fast budget.
- **Saves:** a fight in progress is a plain JSON state (`createState` and the core's state). Save it with the run, so closing the tab mid-fight resumes it. Settlement applies once, when the fight ends.
- **One rules core:** the main game imports `setup/` (data, kits, campaign bridge, flavor) and `web/core.mjs`, never a copy. `RULES_VERSION` is stored with each fight so replays and logs can be checked.
- **The bench stays:** `experiments/combat-f5/` remains the place to balance the minigame (suite, playtest, condition study), and the main game takes its builds.

## 7. Prerequisites and order

1. **Spells v2 in content.** The main game's `content/world/spells.grim` still has the old 12 spells. Migrate it to the v2 list (`docs/spells-v2-list.md` §K), with `grim migrate` for the ids saves reference, before fights can read learned spells.
2. **Expected skills.** The main game's expected skill curve runs about 12 → 62 over the run. The F5.4 suite was tuned at levels 20–80. Below 20, Strike and spells fall to about 60–70% of base, so early fights run longer. Check a level-12 arm before release, and lift the pivot or the floor of the factor if fights there drag.
3. **Mana in the main game** tops out at 40 + Arcana/2 (65 at Arcana 50). A fight holds less: 43 × (2/3 + weighted skill/150) (43 at skill 50). A player is fit for Mana once they have the fight's capacity, and the fight readies only that much. Settlement charges only what the fight spent, so the rest of the pool is safe.
4. Wire the challenge resolution (opt-out, pacing), then the UI shell (the fight as an overlay over the card), then saves.
5. Playtest with people. The simulated players are crude: they find gross imbalances, not fun.

## 8. Open questions

- Should a won fight's Health cost be smaller still (a win at 5 Health in practice may feel like a loss)? It could scale with margin.
- Where do the 0.9 condition floors sit against the stub's `condition 0.2` weight? The stub let condition matter more. Players may expect "rest before you fight" to matter more than 15 points.
- Whether the draw outcome maps to a card's `partial`, or partial should also cover a narrow loss on points.
- How a card picks the context (practice, public, real) when it doesn't say: a default per place, or a new card field (a schema addition).
