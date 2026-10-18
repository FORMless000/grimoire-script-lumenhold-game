# Combat cards and their opponents (F5.9 plan)

What every current combat card becomes when the minigame replaces the combat stub: who the player fights, at what level, in what context, and what the card's text needs. Also the opponent roster (pools, new archetypes, special foes), the AI's personalities and difficulty, and a proposed authoring guideline.

Everything here is a plan for `content/`. Nothing in `content/` is edited by this pass.
- **The data:** `setup/foes.mjs` (`EVENTS`, `FOES`, `POOLS`, `PERSONAS`, `foeLevel`).
- **The check:** `node tools/event-coverage.mjs [--list]` fails if a `challenge combat` / `challenge duel` in `content/` has no decision, or a decision names a missing card, foe, pool or loadout.
- **Measured with:** `tools/ai-study.mjs` (AI knobs), `tools/foe-study.mjs` (a foe against every class), `tools/named-study.mjs` (named characters), `tools/suite.mjs` (classes). All at depth 4, on 2026-10-17, rules `spells-v2 F5.9`.

## 1. Summary

- **The cards:** 40 combat challenges on 35 cards.
  - **33 become played fights:** 15 against named characters, 17 against generic foes from pools or fixed archetypes, 1 against a special creature.
  - **7 become feats:** the same rung and odds, no fight. These are sports, races, crowd brawls the player defuses, a pixie swarm and a knife game.
- **New in the minigame:**
  - a Sailor class;
  - a Shadow stag creature with its own move, Gore (the first `physical` spell: it hits like a Strike, so Guard stops it and Ward only halves it);
  - a `ring_bout` context;
  - AI personas (spells each fighter favours);
  - three difficulty presets;
  - class skill offsets as percentages of level;
  - one linear scaling rule for everything.
- **Proposed for content:**
  - a `foe` clause on challenges (schema addition, §7);
  - a context per card;
  - removing Health from played fights' outcomes;
  - a few text fixes;
  - worldbook calibration for named fighters (§5);
  - an authoring guideline (§8).

## 2. Scaling (F5.9)

Every number that grows with skill now uses one rule, anchored at skill 50: factor = 1 + perPoint × (skill − 50).

| What | Factor | At skill 0 / 50 / 100 |
|---|---|---|
| Every spell amount (each skill drives its own spells) and Strike (Vigor) | 2/3 + skill/150 | ×0.67 / ×1 / ×1.33 (doubles from 0 to 100) |
| Mana capacity (weighted skills, Arcana ×2) | 43 × (2/3 + skill/150) | 29 / 43 / 57 |
| Combat max HP (weighted skills, Vigor ×2) | 0.8 + skill/250, on 70 | 56 / 70 / 84 (+50% from 0 to 100; gentler so low-Vigor classes aren't squishy) |

- **Class skill offsets** are now percentages of the level, and so is the jitter (±9%). F5.8's fixed points ×2 equal the new percentages at level 50. A class keeps its shape at every level, so a level-20 Brawler is as lopsided as a level-80 one.
- **Named characters** already scaled by ratio (canon skills × level / their reference skill), and so does the main game's `npc_growth`.

Class matrix, depth 4, 2 seeds (1,260 fights per suite), class win rate at equal level:

| Suite | 20–30 sd | 40–50 sd | 60–80 sd | Classes overall | Fight length L20 / L50 / L80 | Higher level wins +5 / +10 / +20 |
|---|---:|---:|---:|---|---|---|
| F5.8 rules + Sailor (fixed offsets) | 11 | 9 | 11 | 41–61% (sd 5) | 20 / 22 / 28 | 76 / 91 / 100% |
| + percentage offsets | 4 | 9 | 7 | 41–57% (sd 4) | 20 / 22 / 28 | 76 / 92 / 100% |
| + linear scaling (**F5.9**) | 10 | 6 | 9 | 43–61% (sd 5) | **14** / 23 / 27 | 69 / 91 / 99% |

**What the linear scaling costs (open issues):**
- **Low-level fights got shorter:** 14 exchanges at L20, was 20. The cause is damage, not HP. At L20, Strike now deals ×0.8 (was ×0.58) and spells ×0.8 (was ×0.7). Flattening HP below 50 didn't help.
- **The Vigor classes dip:** Brawler and Sailor fall to 33–42% at L20–30, because Strike no longer scales faster than spells.

Both are left for the balance pass after shipping. Levers: a lower Strike base, a Vigor-only bonus to Strike, or Vigor offsets.

## 3. The AI: personality and difficulty

**Personality.** Each loadout carries a persona: points added to the value of actions it likes when it chooses, so it picks them when they are only a little worse. About 4 points equal 1 HP of lead.
- **Where they live:** `PERSONAS` in `setup/foes.mjs`, for every class, character and special foe. A foe can override its loadout's persona (`FOES.*.persona`), so the "unbeaten fourth-year" is a Duellist who loves Haste.
- **Example characters:** Lyra leans on Flame and Wildfire, Kael on Hoarfrost, Bram on Brace, and the man in grey on Compel and Eclipse.

**Difficulty.** On top of the persona, `slack` lets the AI pick at random among every move within that many points of the best tilted move. `maxRegret` caps how bad a chosen move may be, measured by the untilted search. The core is `choose()` in `rust/core/src/ai.rs`. The settings come from the side's AI options (`tilt`, `tiltScale`, `slack`, `maxRegret`), expanded from a preset by `expandAI` (`setup/setup.mjs`).

Measured at depth 4: the knobbed AI against an optimal one, every class pair, the knobbed AI on each side.

| Knobbed AI | Wins vs optimal | Leaves the best move | Median cost of those moves |
|---|---:|---:|---:|
| none (optimal) | 50% | 0% | — |
| persona only | 45–48% | 18–19% | 0 |
| persona ×2 / ×3 | 38% / 33% | 23% / 26% | 0 / 0.7 |
| slack 4 / 8 / 16 / 32 | 40 / 32 / 13 / 2% | 25 / 33 / 47 / 61% | 0 / 1.5 / 4.9 / 12.1 |
| slack 8 + persona (maxRegret 20) | 32% | 33% | 1.5 |
| slack 24 + persona ×1.5 (maxRegret 60) | 6% | 53% | 8.4 |

Personas alone are cheap: a fighter with habits loses only a few points.

**The three presets** (`AI_PRESETS`, `setup/roster.mjs`), with final numbers at F5.9, levels 15/30/60, 1,080 fights each:

| Preset | Settings | Wins vs optimal | Leaves the best move | Who it's for |
|---|---|---:|---:|---|
| **Easy** | slack 24, maxRegret 60, persona ×1.5 | 7% | 53% | Very permissive. It drifts among decent moves and leans hard on its favourites, so a player who reads the telegraph and the action texts wins. |
| **Medium** | slack 10, maxRegret 24, persona ×1 | 26% | 37% | Has habits and small slips but never throws a fight away. A careful, thoughtful player wins most fights at equal level. |
| **Hard** | slack 0, no persona | 50% | 0% | The search's best move, every time. |

- **The bench** has a Difficulty selector (`web/index.html`).
- **Proposed for the main game:**
  - a player setting, Easy / Medium / Hard, default Medium, applied to every foe;
  - the foe's level still comes from the card.
- The optimal AI is a far stronger player than a person, so "26% against optimal" means Medium usually loses to a careful human. Confirm in playtests.

## 4. Opponents

### Generic foes: pools and archetypes

| Pool | Classes | Used by |
|---|---|---|
| `student` | Duellist, Prefect, Brawler, Scholar, Showman, Healer, Illusionist | tournament rounds, club sparring |
| `thornwick` | Illusionist, Showman, Duellist | the rival school's duellists |
| `champion` | Duellist, Prefect, Scholar, Illusionist, Hollow adept | visiting champions (expert rungs) |
| `ring` | Brawler, Underground tough, Sailor, Showman | the boathouse ring's opener |

- **Picking from a pool:** the foe's class is drawn by the encounter seed.
- **Named archetypes** fix the class and override the persona: the rower, the farrier's apprentice, the bookmaker (`FOES`).
- **New class, Sailor:**
  - Vigor-led, with Charm second;
  - Tailwind, Brace, and hidden Lodestar;
  - for barge crews, deckhands and the ring's sailor;
  - wins 41–49% across suites.

### Special foes

`SPECIAL_LOADOUTS` (`setup/loadouts.mjs`): fighters outside the classes, with a fixed kit `{spell: level learned}` and creature-only spells (`group: 'creature'`, which no class or `spellAccess: 'all'` can get).

**The Shadow stag** (`curse_cure_2`). Canon: it guards the moonpetal in the Whisperwood and "steps aside only for the brave" (`content/world/lore/soft/places.grim`).
- **Kit:** Gore (its charge: 15 damage, physical: Guard stops it, Ward only halves it, Reflect can't turn it), Brace at 15, Shadowstep at 30, Tailwind at 45.
- **Skills:** Vigor +44%, Guile +28%.
- **Losing, it yields rather than falls.** Its own end line is "The shadow stag lowers its head and steps aside for {name}." (`DEFEAT`, `setup/flavor.mjs`), matching the card's win text.
- **Against every class at equal level** (fallible AIs, 4 seeds, 400 fights), classes win 51% overall:
  - stronger at levels 20–40, weaker from 50;
  - Healer and Showman struggle against it.
- **Tuning history:**
  - The first draft (Vigor +48%, Gore 16, every spell from level 1) won 92%.
  - Gore 14 lost 78%.
  - Gore is a sharp lever: about 15 points of class win rate per point of damage.

**The physical flag** (`SPELLS.*.physical`, read by the Rust core): a damage spell that hits like a blow: Guard stops it, Ward halves it (as a Strike) and Reflect can't turn it. Use it for any future creature attack or weapon.

### Contexts

`practice_duel`, `public_duel` and `real_conflict` as before, plus a new one:

- **`ring_bout`:** 65% Health rebate (between a duel's 80% and a real fight's 50%), Renown 50%. Bare-knuckle bouts hurt more than a duel and less than a real fight.

### A generic foe's level

`foeLevel` (`setup/foes.mjs`) keeps a fight about as hard as the roll it replaces.

- **The basis:**
  - The stub rolls against a DC: the rung (`dc_tiers`), drifted toward the expected skill E(turn) by the card's drift (story cards none, `drift mid` 0.3, other cards 0.5).
  - One DC point moves the stub's odds about 2%; one level here moves the fight's about 6%.
- **The rule:**
  - level = E + 0.35 × (DC − E) + the odds word's shift;
  - the shift: sure −6, likely −3, even 0, unlikely +3, slim +6.
- **Example:** at E = 30, an `adept-` card (DC 36, drift 0.5 → 33) gives level 31.
- **The luck word** (`steady` / `wild`) doesn't change the level: the fight has its own variance.
- **Caveat: E is a skill, not a combat level.** The player's skills are lopsided like a character's (§5), and a lopsided fighter is weaker than a class at the same top skill. Before release, measure the player's equivalent class level from simulated runs, then use it in place of E. Use `tools/named-study.mjs` with the skills `grim analyze` reports for each play style.

### Named foes

- **Their skills:** a named foe uses its canon shape. The main game passes its current skills (`Engine.statOf`, canon × `npc_growth`).
- **A card's `vs npc.stat ±n`** scales those skills × (1 + 0.03 n): about 1.4 levels per rung, matching the rung rule above.
- **A generic rung with a named foe** (Tamsin in `rival_contest`) uses the character's shape at the rung's level.
- **The man in grey** has no canon skills, so his level always comes from the card's rung.

## 5. Named characters: strength and the worldbook

Each character played every class at levels 10–90 (depth 4, fallible AIs, both leaders, 2 seeds). Growing peers played at reference skill 50 (canon ratios kept, study year 2); fixed characters played at their canon skills. The **equivalent class level** is where the classes' win rate crosses 50%.

| Character | Plays at | Equivalent class level | Mean skill | Fits the character? |
|---|---|---:|---:|---|
| Lyra | reference 50 | 45 | 30 | **Too even with her peers.** A prodigy "used to winning" should lead the students. |
| Tamsin | reference 50 | 45 | 35 | Yes: Thornwick's best, Lyra's equal. |
| Bram | reference 50 | 44 | 31 | Yes: strong and Vigor-heavy, just below Lyra. |
| Kael | reference 50 | 43 | 28 | Yes, though the story treats him as formidable (the man in grey leaves at the sight of him), so +2–4 would fit. |
| Mir | reference 50 | 42 | 31 | Acceptable: chaotic, contraption-driven. |
| Ilse | reference 50 | 42 | 27 | Yes: cult-trained, fierce. |
| Seraphine | reference 50 | 36 | 26 | Yes: dreamy, not a fighter. |
| Tobias | reference 50 | 34 | 29 | Yes: gentle. |
| Nessa | reference 50 | 28 | 32 | Yes: a reporter. |
| Corvin | reference 50 | 27 | 28 | Yes: reckless, a lockpick rather than a duellist. |
| The man in grey | all skills 50 | 48 | 50 | Level comes from the card's rung. |
| Isolde | canon | 65 | 64 | Yes: formidable; could be higher. |
| Thorne | canon | 63 | 48 | **Too weak.** Master of Arcana, "rumoured to have once out-dueled a storm": he should outclass any late-game player (E ends at 62) and the Headmistress as a duellist. |
| Brask | canon | 50 | 41 | Yes: brave, Vigor 70. |
| Marisol | canon | 49 | 43 | Yes. |
| Vey | canon | 48 | 50 | Yes: sly, not a brawler. |
| Maud, Amaranth | canon | 45, 44 | 43 | Yes: healers. |
| Grisk, Pell, Mabel, Grimsby | canon | 29, 29, 27, 25 | 28–37 | Yes: villagers and a moneylender, not fighters. |

**What sets a character's strength.**
- **Spell ranks, more than stats.** A character falls off where the classes they face cross a course-rank step:
  - rank 2 at level 44: Lyra beats level-40 classes 90%, level-50 ones 13%;
  - rank 3 at 68: Thorne beats level-60 classes 70%, level-70 ones 8%.
- **Stat changes barely move it:**
  - Lyra with Vigor +8 and Lore +6: 45 → 47;
  - Thorne with Vigor +16 and Guile +12: 63 → 64;
  - Thorne with Haste and Shadowstep at rank 3: still 64.
- **The cause:** a skill point is worth 1/150 of a spell's amount, while a rank or an extra spell is worth several levels.

**Proposals for the worldbook and the bridge** (to apply with `distill-lore` / `grim migrate`, then re-measure with `tools/named-study.mjs --stats '{…}' --kits '{…}'`):

1. **Keep one scaling rule in both systems.**
   - The main game's `npc_growth` already multiplies every skill by k(turn), keeping each character's shape. The minigame's named loadouts and (now) class offsets are ratio-based too.
   - The worldbook's skill numbers should stay ratios of the character's top skill, not absolute claims, so any growth rule keeps them true.
   - Don't hand-set a grown character's later stats. Let the curve do it.
2. **Read the live stats.**
   - The fight should take a character's current `Engine.statOf` values, not the bench's "reference = level" approximation.
   - `setup/cast-stats.mjs` stays a snapshot for the bench, refreshed by `setup/sync-loadout-stats.mjs`.
3. **Give fighters spell ranks in canon.**
   - Since ranks dominate, the worldbook (or `NAMED_LOADOUTS`) should state a fighter's spells and ranks, or rank them from their equivalent level rather than their top skill.
   - Concretely: Lyra's Flame and Wildfire a rank above her peers (her `prodigy: flame` already does this for Flame; extend it to Wildfire), and Thorne at rank 3 with Haste, Shadowstep and Reflect.
   - Re-measure. The targets: Lyra ≈ +5 over the peer pack, Thorne ≥ 75.
   - Note: `prodigy` only raises a three-level spell's rank. Wildfire has one level, so this needs either a Wildfire rank ladder or a different lever.
4. **Calibrate against the player, not against classes.**
   - The target for a story duel is the character's equivalent level against the player's at that turn: Lyra at the tournament final (`vs lyra.arcana +3`) should be clearly ahead, Tobias behind.
   - This needs the player's equivalent level (§4 caveat).
5. **Allowed to be weak:** Corvin, Nessa, Tobias, Seraphine and the villagers are non-fighters. Their low numbers are canon-consistent; leave them.

## 6. Every combat card

Card edits apply when the minigame plays the card.

- **Health.** "Drop health" means removing the outcome's `health` lines: settlement charges the Health the fight actually cost (about 5–8 in practice, 10–13 in the ring, 13–20 in a real fight). Keep every other effect: flags, relations, renown, gold, `queue`.
- **Partial.** `partial` means a draw or a loss on points.
- **Level.** "rung" means `foeLevel`; "named" means the named-foe rule in §4.

| # | Card / option | Challenge | Decision | Foe | Context | Card edits |
|---:|---|---|---|---|---|---|
| 1 | spring_tournament / right | combat journeyman+ drift mid | play | `tournament_entrant` (student pool) | public | Drop health. Lose text "knocked out of the ring in eleven seconds": cut the timing, since a played fight can be long. |
| 2 | spring_tournament_circle / left | combat journeyman drift mid | play | `tournament_entrant` | public | Drop health. |
| 3 | spring_tournament_circle / right | combat journeyman+ drift mid | play | `tournament_entrant` | public | Drop health; same timing fix as #1. |
| 4 | tournament_semifinal / left | combat expert- drift mid | play | `tournament_unbeaten`: Duellist, persona Flame / Haste / Strike | public | Drop health. |
| 5 | tournament_final / left | combat vs lyra.arcana +3 | play | Lyra, named ×1.09 | public | None (no health lines). |
| 6 | hs_tunnel / fight (with Kael) | combat master- | play | the man in grey, rung | real | Drop health (win −small, lose −large). The odds word prices Kael's help: no extra handicap. Text: "Kael's frost and your spell hit him together" suits a fight. |
| 7 | hs_tunnel / fight (alone) | combat master- unlikely | play | the man in grey, rung +3 | real | Drop health. |
| 8 | ilse_grey_returns / left | combat journeyman likely | play | the man in grey, rung −3 | real | Drop health. His hand on Ilse is in the rung; no extra handicap. Hard-canon story card: `find ilse_truth` stays on both outcomes. |
| 9 | rival_contest / left (thornwick_secrets) | combat adept likely | play | Tamsin if met, else `thornwick_illusionist` | public | Drop health. Play the secret plan instead of the odds word: the foe commits first for 3 exchanges (as under Foresight) at the even level. The win text, "you counter every planned trick before it's cast", then describes the fight. |
| 10 | rival_contest / left | combat adept | play | Tamsin, else `thornwick_illusionist` | public | Drop health. |
| 11 | rival_last_match / left | combat adept+ | play | Tamsin, else `thornwick_final_year` (Thornwick pool) | practice ("nothing at stake") | Drop health. |
| 12 | curse_cure_2 / right | combat adept- | play | `shadow_stag` (special) | real | Drop health. Its defeat line matches the win text ("lowers its head — and steps aside"). |
| 13 | pyro_lyra_spar / right | combat vs lyra.arcana | play | Lyra, named | practice | Drop health. |
| 14 | duel_practice_bout / left | combat apprentice+ steady | play | `quick_fourth_year`: Duellist, Haste-happy | practice | Drop health. Stance: "hold your ground" means the fourth-year leads (`firstLeader: 1`). |
| 15 | duel_practice_bout / right | combat apprentice+ wild | play | `quick_fourth_year` | practice | Drop health. Stance: "go on the attack" means you lead (`firstLeader: 0`). |
| 16 | duel_bram_hazing / right | combat vs bram.vigor | play | Bram, named | public (members watching) | Drop health. |
| 17 | y3_last_duel / left | combat vs lyra.arcana +2 | play | Lyra, named ×1.06 | practice | Drop health. |
| 18 | xchg_farewell / right | combat adept- wild | play | `thornwick_sketcher`: Illusionist, persona Shadowstep | practice | Drop health. |
| 19 | tavern_brawl / right | combat apprentice+ wild | **convert** | — | — | `challenge feat apprentice+ wild`: stepping into a brawl between a troll and a dwarf is nerve and a loud voice, not a duel. Text unchanged. |
| 20 | life_pixies / left | combat apprentice- wild | **convert** | — | — | `challenge feat apprentice- wild`: catching a swarm with a laundry bag. Text unchanged. |
| 21 | life_rival_academy / right | combat apprentice+ | play | `thornwick_best` (Thornwick pool) | public | Drop health. |
| 22 | midnight_boathouse_ring / left | combat adept- | play | `ring_opener` (ring pool) | ring | Drop health. |
| 23 | bram_duel / right | combat vs bram.vigor | play | Bram, named | public (formal challenge) | Drop health. |
| 24 | courtyard_seasonal_game / left | duel using vigor apprentice wild | **convert** | — | — | `challenge feat apprentice wild`: a team game. Text unchanged. |
| 25 | lyra_date_dawn_duel / left | duel vs lyra.arcana | play | Lyra, named | practice | Drop health. |
| 26 | duel_hall_gallery / left | combat vs here.arcana | play | the peer cast as `here`, named | practice | Drop health. Every `peer`-tagged character has a named loadout. |
| 27 | flight_field_pickup_race / left | duel using vigor journeyman+ wild | **convert** | — | — | `challenge feat journeyman+ wild`: a broom race. Text unchanged. |
| 28 | newt_high_table / health | combat adept- wild | **convert** | — | — | `challenge feat adept- wild`: the bone-dice knife game is steadiness, not a fight. The hint "Win or bleed" stays. |
| 29 | ring_on_yourself / left | combat adept- | play | `ring_opener` | ring | Drop health. |
| 30 | ring_on_yourself / right | combat adept- | play | `ring_opener` | ring | Drop health. |
| 31 | ring_bout_2 / left | combat adept | play | by text variant: `ring_rower` (Brawler), `ring_villager` (Underground tough), `ring_scarf` (Illusionist) | ring | Drop health. Needs the variant index (§7). |
| 32 | ring_bout_3 / left | combat adept+ | play | `ring_duellist`, `ring_farrier` (Brawler, Strike / Brace), `ring_hood` (Hollow adept) | ring | Drop health. |
| 33 | ring_bout_4 / left | combat expert- | play | `ring_champion` (Prefect, Brace / Guard), `ring_bookmaker` (Underground tough, dirty), `ring_sailor` (Sailor) | ring | Drop health; the ring's last-standing bonus stays. |
| 34 | gig_newt_brawl / left | combat apprentice+ | **convert** | — | — | `challenge feat apprentice+`: defusing a fight between two crews while on duty. Text unchanged. |
| 35 | duelling_captain_challenge / left | combat expert drift mid | play | `visiting_champion` (champion pool) | public | Drop health (both outcomes). |
| 36 | slice_candle_flame / right | duel vs lyra.arcana | play | Lyra, named | practice | Drop health (partial and lose). Partial = draw or loss on points. |
| 37 | slice_frost_duel / left | combat vs kael.arcana +1 | play | Kael, named ×1.03 | practice | Drop health. |
| 38 | duel_first_practice / right | combat vs lyra.vigor -1 | play | `club_partner` (student pool), at the rung lyra.vigor −1 | practice | Drop health. The opponent is "your partner", not Lyra: `vs lyra.vigor` is only the DC. |
| 39 | duel_fixture / left | combat adept- | play | `thornwick_duellist` (Thornwick pool) | public | Drop health (lose). |
| 40 | lake_skimming / left | duel apprentice wild | **convert** | — | — | `challenge feat apprentice wild`: skimming stones with a friend. Text unchanged. |

**Converted cards** keep their rung, odds and text; only the challenge kind changes. A `feat` tests Vigor by default, like the stub's `duel using vigor`. The texts already describe a contest of nerve or body, not a duel.

## 7. Proposed format addition: `foe`

Cards don't name generic foes today, so the bridge has to look them up in `EVENTS` by card id. A schema-v1 addition (feature added, nothing changed) would let content say it. Follow AGENTS.md "The format and the engine", and record it with `grim schema --update`.

```
challenge combat adept- foe ring_opener context ring:
challenge combat adept foe {ring_rower|ring_villager|ring_scarf}:
```

- **`foe <id>`** names a `@foe` block, a new world block that moves `FOES` into content:
  ```
  @foe ring_rower
  name: the rower
  loadout: Brawler
  persona: strike 6 guard 4
  ```
  Pools would be `@foe` blocks with `pool:`.
- **`foe {a|b|c}`** picks by the same variant index as the card's `{~…}` text. The engine exposes the index it rolled.
- **`context practice|public|real|ring`** defaults by kind: `duel` means practice, `combat` means real.
- **`vs npc.stat`** keeps naming a character, as now.
- **Lint additions:**
  - every played combat challenge has a foe (explicit, or `vs`);
  - a `foe` names a defined `@foe`;
  - a `{a|b}` list matches the text's variant count.

Until then, `setup/foes.mjs` `EVENTS` is the lookup, and `tools/event-coverage.mjs` keeps it complete.

## 8. Proposed guideline: writing a combat card

A draft for `docs/authoring/` (and `skills/write-academy-events/`). It is not committed there, and is to be reviewed with the authors first.

1. **Is it a fight?**
   - A fight is two sides trading spells or blows, where either can be knocked out or yield. Use `combat` for real danger and `duel` for a formal bout.
   - These are **not** fights; use `feat` (Vigor), `deceive` or `negotiate`:
     - races and sports;
     - stopping someone else's brawl;
     - swarms of small creatures;
     - games of nerve.
   - Rule of thumb: if the player can't picture casting at one opponent, it's not a fight.
2. **Name the opponent.** `vs npc.stat` for a character; otherwise a foe from the roster (a pool or an archetype). A new kind of opponent gets a foe entry with a name, a loadout and a persona. A creature or monster gets a special loadout with its own physical attack, and a soft `@lore` entry if it is a new proper noun.
3. **The rung is the opponent's strength.**
   - Set circumstances (a distracted foe, an ally, a stolen plan) once: with the odds word or with a fight setup, never both.
   - Prefer the setup when it shows on the board: an ally's opening hit, the foe committing first.
4. **Don't charge Health in a played fight's outcomes.** The fight settles Health and Mana by what actually happened. Keep the story's consequences: flags, relationships, renown, gold, queues.
5. **Write outcomes that fit any fight.**
   - A fight can be long, end on points or end in a concession.
   - Avoid fixed timings ("in eleven seconds") and assumptions about how it ended.
   - Use `partial` for a draw or a narrow loss on points when the difference matters.
6. **Choose the context:** practice (sparring, exhibitions), public (tournaments, formal challenges), ring (the boathouse), real (danger). It sets how much the fight hurts.
7. **A defeat that isn't a fall** (a guardian that yields, a rival who concedes) gets its own end line in the flavor table, so the fight's last sentence matches the card's win text.
8. **Plot safety holds.** A fight with a main-plot foe (the man in grey) belongs on a hard-canon story card, and its clues come from the card's outcomes, never from the fight.
9. **Pacing:** at most about one played fight a month; story fights always play. Don't write a run of fight cards into one month and expect them all to be played.

## 9. Open questions

- **The player's equivalent class level** (§4). It's the calibration both foe levels and named characters need.
- **Low-level fight length and the Vigor classes** under the linear scaling (§2).
- **Which preset a story foe uses.** Should the man in grey ignore Easy? (Proposed: no; difficulty is the player's choice.)
- **Named fighters' spell ranks** in canon or in `NAMED_LOADOUTS` (§5).
- **Whether the ring pays out its renown** in the ring context, or the card's `renown` covers it.
