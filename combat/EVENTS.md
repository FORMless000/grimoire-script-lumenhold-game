# Combat cards and their opponents (F5.9b plan)

What every current combat card becomes when the minigame replaces the combat stub: who the player fights, at what level, in what context, and what the card's text needs. Also the opponent roster (pools, new archetypes, special foes), the AI's personalities and difficulty, and a proposed authoring guideline.

Everything here is a plan for `content/`. Nothing in `content/` is edited by this pass.
- **The data:** `setup/foes.mjs` (`EVENTS`, `FOES`, `POOLS`, `PERSONAS`, `foeLevel`).
- **The check:** `node tools/event-coverage.mjs [--list]` fails if a `challenge combat` / `challenge duel` in `content/` has no decision, or a decision names a missing card, foe, pool or loadout.
- **Measured with:**
  - `tools/ai-study.mjs`: AI knobs;
  - `tools/foe-study.mjs`: a foe against every class;
  - `tools/named-study.mjs`: named characters;
  - `tools/player-study.mjs`: the main game's player against the classes;
  - `tools/event-levels.mjs`: each card's foe level by month;
  - `tools/suite.mjs`: classes.
- **When and how:** on 2026-10-17/18, at depth 4 unless noted (the live AI's difficulty at depth 5). Rules `spells-v2 F5.9b`.

## 1. Summary

- **The cards:** 40 combat challenges on 35 cards.
  - **33 become played fights:** 15 against named characters, 17 against generic foes from pools or fixed archetypes, 1 against a special creature.
  - **7 become feats:** the same rung and odds, no fight. These are sports, races, crowd brawls the player defuses, a pixie swarm and a knife game.
- **New in the minigame:**
  - a Sailor class;
  - a Shadow stag creature with its own move, Gore (the first `physical` spell: it hits like a Strike, so Guard stops it and Ward only halves it);
  - a `ring_bout` context;
  - AI personas (spells each fighter favours);
  - four difficulty presets (Easy, Medium, Hard, Engine) on a fixed depth-5 search;
  - class skill offsets as percentages of level;
  - one linear scaling rule for everything;
  - kit gates fitted to the main game's progression (§2), and foe levels taken from each card's own challenge level (§4).
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
- **Named characters** scale by ratio, as the main game's `npc_growth` does: since F5.9c, canon skills × the factor that makes their mean skill the level (`scaleToMean`); F5.9–F5.9b used × level / their reference skill.

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

### Kit gates (F5.9b): fitted to the main game

**The main game's progression** (40 games per play style):
- Skills grow about 13 points a year, and a balanced player's average tracks E(turn).
- The best skill sits about 15 above the average, and the weakest about 20 below.
- Courses teach rank II from year 1 spring (E ≈ 20) and rank III from year 2 spring (E ≈ 34). A player has about four course spells by month 12.
- Card foes therefore run at about level 12–65 (§4).

**The old gates don't fit that range.** They were set for levels up to 100:
- course spells at 1 / 15 / 40 / 65;
- extras at 45 / 70;
- forbidden spells at 35 / 80;
- ranks at 44 / 68.

So a level-30 foe had 4 of its ~8 spells at rank 1, and hidden and second forbidden spells never appeared. The new gates are in `COMBAT_TUNING.kits`:

| | F5.9 | **F5.9b** |
|---|---|---|
| Course slots | 1 / 15 / 40 / 65 (Haste, Shadowstep from 12) | **1 / 8 / 16 / 26** (Haste, Shadowstep from 10) |
| Extras | 45 (own) / 70 (own or hidden) | **20 / 34** (own) **/ 46 / 58** (own or hidden); underground classes at most 2 |
| Forbidden (underground) | 35 / 80 | **28 / 58** |
| A character's place spell | 25 | **16** |
| Rank 2 / rank 3 | 44 / 68 | **22 / 36** |
| Spells by level 20 / 30 / 40 / 50 / 60 | 4.0 / 4.0 / 5.2 / 6.1 / 6.1 of 8.4 | **5.9 / 7.1 / 8.2 / 9.2 / 9.7** of 9.7 |

**Every class kit now fills out within the main game's range,** with the earliest picks earlier. Spells that appear in no class kit:
- the peers' own capstones (Wildfire, Heartwood, Omen, Contraption, Hoarfrost, Candour), which belong to those characters;
- Compel, kept for story foes (the man in grey, Grisk);
- Heartprice.

**Rebalancing for the fuller kits.** Earlier gates made the kits richer at mid levels, which first pushed the class spread to sd 12. The fixes:
- underground classes take at most two extras;
- Brawler and Sailor are 6% more Vigor-heavy;
- Healer's Distil, and the Distil added to Brawler and Sailor, come only at the last gate (58);
- **Distil costs 20 HP** (was 14). It was picked 15% of the time it was legal, and its users won 84% of their fights; wherever it came early, its holders dominated.

Depth 4, 2 seeds:

| Suite | 20–30 sd | 40–50 sd | 60–80 sd | Classes | Fight length L20 / L50 / L80 | Higher level wins +5 / +10 / +20 |
|---|---:|---:|---:|---|---|---|
| F5.9 | 10 | 6 | 9 | 43–61% (sd 5) | 14 / 23 / 27 | 69 / 91 / 99% |
| F5.9 + new gates only | 11 | 13 | 21 | 32–72% (sd 12) | 14 / 25 / 25 | 70 / 92 / 99% |
| **F5.9b** | 11 | 8 | 11 | 44–54% (sd 3) | 14 / 23 / 28 | 73 / 91 / 98% |

**Showman** is still weak at levels 60–80 (29%): its Charm drives no combat spell.

## 3. The AI: personality and difficulty

**The live opponent** searches a fixed 5 exchanges ahead, with no seeded mistakes (`LIVE_AI` in `web/app.mjs`: depth 5, a 3M node cap, `mistakeChance` 0). The old search-level choice (full, shallow, fallible) is gone from the bench. The difficulty preset is its only knob.

**Personality.** Each loadout carries a persona: points added to the value of actions it likes when it chooses, so it picks them when they are only a little worse. About 4 points equal 1 HP of lead.
- **Where they live:** `PERSONAS` in `setup/foes.mjs`, for every class, character, faculty member and special foe. A foe can override its loadout's persona (`FOES.*.persona`), so the "unbeaten fourth-year" is a Duellist who loves Haste.
- **F5.9b strengthened them,** most of all for each character's unique spell:
  - class personas are about 1.5× F5.9's (Duellist Flame 9);
  - characters' signature spells get 14–16: Lyra's Wildfire and Kael's Hoarfrost 16, Bram's Brace 14, Ilse's Rime 14, the man in grey's Compel 16;
  - the faculty now have personas too: Isolde's Seal, Brask's Haste, Amaranth's Mend.
- **A channel's Hold and Release** can be favoured on their own, as `<spell>_hold` / `<spell>_release` (Lyra's `wildfire_hold` 12: she lets Wildfire build before releasing it). A plain `hold` would favour every channel's Hold.

**Difficulty.** On top of the persona, `slack` lets the AI pick at random among every move within that many points of the best tilted move. `maxRegret` caps how bad a chosen move may be, measured by the untilted search. The core is `choose()` in `rust/core/src/ai.rs`. The settings come from the side's AI options (`tilt`, `tiltScale`, `slack`, `maxRegret`), expanded from a preset by `expandAI` (`setup/setup.mjs`).

Measured at depth 4: the knobbed AI against an optimal one (the engine), every class pair, the knobbed AI on each side.

| Knobbed AI | Wins vs optimal | Leaves the best move | Median cost of those moves |
|---|---:|---:|---:|
| none (optimal) | 50% | 0% | — |
| persona only | 45–48% | 18–19% | 0 |
| persona ×2 / ×3 | 38% / 33% | 23% / 26% | 0 / 0.7 |
| slack 4 / 8 / 16 / 32 | 40 / 32 / 13 / 2% | 25 / 33 / 47 / 61% | 0 / 1.5 / 4.9 / 12.1 |
| slack 8 + persona (maxRegret 20) | 32% | 33% | 1.5 |
| slack 24 + persona ×1.5 (maxRegret 60) | 6% | 53% | 8.4 |

(These rows are F5.9's, with the weaker personas.)

Personas alone are cheap: a fighter with habits loses only a few points.

**The four presets** (`AI_PRESETS`, `setup/roster.mjs`, F5.9b).
- **Renames:** F5.9's Easy, Medium and Hard are now Medium, Hard and Engine, and a new Easy sits below them.
- **Measured** at depth 4 with the F5.9b personas: levels 15/30/60, 1,080 fights each, against the engine.

| Preset | Settings | Wins vs engine | Leaves the best move | Median cost of those (points) | Who it's for |
|---|---|---:|---:|---:|---|
| **Easy** (new) | slack 40, maxRegret 100, persona ×2 | 2% | 60% | 13.6 | Forgiving. It drifts among any move that isn't ruinous and plays its favourites, so a player who reads the words wins comfortably. |
| **Medium** (F5.9 Easy) | slack 24, maxRegret 60, persona ×1.5 | 9% | 51% | 7.6 | Loose and habit-driven. A player who reads the telegraph and the action texts wins. Proposed main-game default. |
| **Hard** (F5.9 Medium) | slack 10, maxRegret 24, persona ×1 | 28% | 34% | 1.9 | Has habits and small slips but never throws a fight away. A careful, thoughtful player wins most fights at equal level. |
| **Engine** (F5.9 Hard) | slack 0, no persona | 50% | 0% | — | The search's best move, every time. |

- **Persona alone** (no slack) costs 5 points: 45% against the engine, leaving the best move 21% of the time.
- **The bench** has a Difficulty selector (`web/index.html`), defaulting to Medium.
- **Proposed for the main game:**
  - a player setting, Easy / Medium / Hard / Engine, default Medium, applied to every foe;
  - the foe's level still comes from the card.
- **A person plays well below the engine,** so these rates order the presets but don't say how often a human wins against each. Confirm in playtests.
- **Measured at depth 4 only.** The live opponent searches depth 5; one depth-5 row was measured before that study was dropped (persona alone: 46%, 360 fights).

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

### A foe's level: the card's own challenge level (F5.9b)

**The foe is the opponent the rung describes.** Its level is the challenge's DC, computed exactly as the main engine's `ladderOdds` does (`challengeDC`, `foeLevel` in `setup/foes.mjs`):
- the rung (`dc_tiers`) or a character's current stat, ± 4 per rung;
- pulled toward E(turn) by the card's drift: story cards none, milestone and crisis low (0.15), others high (0.5), or the card's own `drift` word.

A class's mean skill is its level, so a foe at level DC is as strong as the rung says. F5.9 compressed it instead (E + 0.35 × (DC − E)); that is gone.

**The odds word** shifts the level by the fight's own measured odds, not the stub's. In F5.9 the higher side wins 69% at +5 levels and 91% at +10, so:

| Odds word | certain | sure | likely | even | unlikely | slim | long shot | freak |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Foe level | −15 | −10 | −5 | 0 | +5 | +8 | +12 | +20 |

**The luck word** (`steady` / `wild`) changes nothing: the fight has its own variance.

**Named foes:**
- `vs npc.stat ±n` keeps the character's shape: their current skills (canon × the main game's `npc_growth`), scaled to a mean skill of the foe's level (`namedFoeSkills` → `scaleToMean`). A peer then spends a class's skill points at the same level, so the card's challenge level is their strength, as for any foe. (F5.9b put the named stat on the foe's level instead; the canon's low secondary skills left peers about 15 levels weaker than the card's DC.)
- A character on a generic rung (Tamsin in `rival_contest`) plays at a mean skill of the foe's level the same way.
- The man in grey has no canon skills: all of his are the level.

**Is a matched rung fair?** `tools/player-study.mjs` puts the main game's balanced player (best, 2nd, average and weakest skills by month, from the 40-game measurements) against every class at E − 10, E and E + 10. An even rung's DC is E at any drift. The kit is the generated one at level E.

| Month | E | Fighter layout (Arcana best): E − 10 / E / E + 10 | Talker layout (Charm best): E − 10 / E / E + 10 |
|---:|---:|---|---|
| 12 | 26 | 100 / **80** / 3% | 98 / **20** / 0% | | —
| 24 | 40 | 98 / **78** / 50% | 85 / **35** / 8% | | —
| 36 | 53 | 95 / **63** / 25% | 55 / **38** / 8% | | —
| 47 | 61 | 80 / **38** / 28% | 75 / **23** / 13% | | —

- **Averaged over the two layouts,** a matched rung is close to even (50–57%) through month 36, and harder in the final year (30%).
- **The spread between layouts is the stub's own:** its combat value reads Arcana, Vigor and Guile, so a talker also rolls worse there.
- These are F5.9b rules with the suite's fallible AI on both sides; the live opponent's difficulty preset moves them (§3). At Medium (the proposed default), a matched rung is clearly in the player's favour.

### Every played card's foe level, by month

From `node tools/event-levels.mjs`:
- **Months:** the card's `when:`. The tournament rounds share spring_tournament's month 8; "any" means the card has no month, year or turn condition.
- **Characters' stats** grow as the main game's `npc_growth` does.
- **Player skills** are the balanced player's average / best in those months.

| Card / option | Challenge | Drift | Months | E(turn) | **Foe level** | Player average / best | Foe |
|---|---|---|---|---|---:|---|---|
| spring_tournament/right | journeyman+ drift mid | mid | 8,20,32,44 | 21–58 | **29–40** | 23–61 / 37–77 | your opponent |
| spring_tournament_circle/left | journeyman drift mid | mid | 8,20,32,44 | 21–58 | **26–37** | 23–61 / 37–77 | your opponent |
| spring_tournament_circle/right | journeyman+ drift mid | mid | 8,20,32,44 | 21–58 | **29–40** | 23–61 / 37–77 | your opponent |
| tournament_semifinal/left | expert- drift mid | mid | 8,20,32,44 | 21–58 | **40–51** | 23–61 / 37–77 | the unbeaten fourth-year |
| tournament_final/left | vs lyra.arcana +3 | none | 8,20,32,44 | 21–58 | **50–66** | 23–61 / 37–77 | Lyra |
| hs_tunnel/fight | master- | none | any | 12–62 | **60** | 19–63 / 33–80 | the man in grey |
| hs_tunnel/fight | master- unlikely | none | any | 12–62 | **65** | 19–63 / 33–80 | the man in grey |
| ilse_grey_returns/left | journeyman likely | none | 20–48 | 35–62 | **23** | 36–63 / 51–80 | the man in grey |
| rival_contest/left | adept likely | none | 32 | 48 | **35** | 49 / 66 | Tamsin / the Thornwick illusionist |
| rival_contest/left | adept | none | 32 | 48 | **40** | 49 / 66 | Tamsin / the Thornwick illusionist |
| rival_last_match/left | adept+ | none | 44 | 58 | **44** | 61 / 77 | Tamsin / the Thornwick final-year |
| curse_cure_2/right | adept- | none | any | 12–62 | **36** | 19–63 / 33–80 | the shadow stag |
| pyro_lyra_spar/right | vs lyra.arcana | high | any | 12–62 | **23–59** | 19–63 / 33–80 | Lyra |
| duel_practice_bout/left | apprentice+ steady | high | any | 12–62 | **16–41** | 19–63 / 33–80 | the fourth-year |
| duel_practice_bout/right | apprentice+ wild | high | any | 12–62 | **16–41** | 19–63 / 33–80 | the fourth-year |
| duel_bram_hazing/right | vs bram.vigor | high | any | 12–62 | **22–59** | 19–63 / 33–80 | Bram |
| y3_last_duel/left | vs lyra.arcana +2 | high | any | 12–62 | **27–63** | 19–63 / 33–80 | Lyra |
| xchg_farewell/right | adept- wild | low | 25,26,27,28 | 40–43 | **37** | 42–45 / 57–61 | the boy with the sketchbook |
| life_rival_academy/right | apprentice+ | high | 8 | 21 | **21** | 23 / 37 | Thornwick’s best |
| midnight_boathouse_ring/left | adept- | high | any | 12–62 | **24–49** | 19–63 / 33–80 | your opponent |
| bram_duel/right | vs bram.vigor | high | any | 12–62 | **22–59** | 19–63 / 33–80 | Bram |
| lyra_date_dawn_duel/left | vs lyra.arcana | high | any | 12–62 | **23–59** | 19–63 / 33–80 | Lyra |
| duel_hall_gallery/left | vs here.arcana | high | any | 12–62 | **12–59** | 19–63 / 33–80 | (the peer present) |
| ring_on_yourself/left | adept- | high | any | 12–62 | **24–49** | 19–63 / 33–80 | your opponent |
| ring_on_yourself/right | adept- | high | any | 12–62 | **24–49** | 19–63 / 33–80 | your opponent |
| ring_bout_2/left | adept | high | any | 12–62 | **26–51** | 19–63 / 33–80 | the rower / the villager / the student in the scarf |
| ring_bout_3/left | adept+ | high | any | 12–62 | **28–53** | 19–63 / 33–80 | the club duellist / the farrier’s apprentice / the hooded fighter |
| ring_bout_4/left | expert- | high | any | 12–62 | **30–55** | 19–63 / 33–80 | the ring’s champion / the bookmaker / the sailor |
| duelling_captain_challenge/left | expert drift mid | mid | any | 12–62 | **40–55** | 19–63 / 33–80 | the visiting champion |
| slice_candle_flame/right | vs lyra.arcana | low | 4–48 | 16–62 | **33–57** | 20–63 / 34–80 | Lyra |
| slice_frost_duel/left | vs kael.arcana +1 | low | 8–48 | 21–62 | **40–60** | 23–63 / 37–80 | Kael |
| duel_first_practice/right | vs lyra.vigor -1 | high | any | 12–62 | **18–52** | 19–63 / 33–80 | your sparring partner |
| duel_fixture/left | adept- | low | any | 12–62 | **32–40** | 19–63 / 33–80 | the Thornwick duellist |

- **Mostly the foe sits near the player's average skill,** as the rung intends.
- **The story fights are the hard ones,** with no drift:
  - the man in grey in the tunnel is level 60–65 whenever it happens;
  - the tournament final has Lyra at 50–66.
- **The man in grey distracted** (`ilse_grey_returns`, journeyman likely) is only level 23 against a player averaging 36–63. The stub's odds there are likely as well, so it matches the card, but the fight reads easy.

## 5. Named characters: strength and the worldbook

**F5.9c: peers at their level, with signature spells that pull their weight.** Growing peers now play at a mean skill of the level (canon shape kept), and the channel and signature spells were buffed (rulebook, F5.9c). Same study at reference 50, 1 seed:

| Peer | F5.9b | **F5.9c** | Mean skill | Notes |
|---|---:|---:|---:|---|
| Ilse | 35 | **55** | 50 | Rime and Arcana 95. |
| Lyra | 35 | **50** | 50 | Wildfire is now worth +13 to her (`tools/spell-value.mjs`), and she Holds it. |
| Bram | 36 | **50** | 50 | |
| Tobias | 31 | **47** | 50 | Heartwood +27: he leans on it (8% without it). |
| Kael | 35 | **46** | 50 | Hoarfrost +5. |
| Seraphine | 30 | **45** | 50 | Omen +20, Starlight +5; Vigor 24, so little HP. |
| Mir | 34 | **39** | 50 | Contraption +12, but Charm 38, Vigor 27. |
| Tamsin | 34 | **39** | 50 | Charm 71 drives no combat spell; Glamour has no combat effect. |
| Corvin | 30 | **37** | 50 | Guile 89 (Shadowstep only); Sleight has no combat effect. |
| Nessa | 27 | **35** | 50 | Charm 79; Candour has no combat effect. |

The fighters (Ilse, Lyra, Bram) sit at their level; the Charm- and Guile-heavy peers stay 10–15 below, the Showman's problem: Charm drives no combat spell. The F5.9b study below is kept for the record.

**Spell value** (`node tools/spell-value.mjs`): the holder (engine AI) plays every class at levels 35/50/65, with the spell and without it; the gap is the spell's worth.

| Spell | Holder | F5.9b value | **F5.9c value** | F5.9c casts / Holds a fight |
|---|---|---:|---:|---|
| Wildfire | Lyra | +3 | **+13** | 1.2 / 0.6 |
| Heartwood | Tobias | 0 | **+27** | 2.7 / – |
| Omen | Seraphine | +2 | **+20** | 2.4 / – |
| Contraption | Mir | 0 | **+12** | 1.1 / – |
| Hoarfrost | Kael | −2 | **+5** | 4.4 / – |
| Starlight | Seraphine | +3 | **+5** | 0.3 / 0.1 |
| Rime | Ilse | −3 | **+5** | 0.6 / – |
| Moonwell | Healer | −7 | **+13** | 1.4 / 0.1 |
| Lodestar | Bram | 0 | **+8** | 0.8 / 2.2 |
| Siphon | Hollow adept | +2 | **−2** | 1.2 / 1.6 |
| Compel | the man in grey | +2 | +4 (unchanged) | 4.3 / – |

60 fights a row (final F5.9c numbers), so ±6 is noise. Siphon is used now but still adds nothing measurable; Compel wasn't changed (the man in grey's weakness is his kit, not the spell).

**Classes** (suite `F59D2`, depth 4, 2 seeds): 40–57% (sd 5, was 4), gaps 75/89/98%. Scholar 57% (Starlight is its extra; at 7 Mana it reached 63%, so Starlight stays 9), Hollow adept 54% (Siphon, Moonwell), Duellist lowest at 40% (34% at levels 60–80).

### F5.9b study

Each character played every class at levels 10–90: depth 4, the suite's fallible AIs, both leaders, 2 seeds, F5.9b kits. Growing peers played at reference skill 50 (canon ratios kept, study year 2); fixed characters played at their canon skills. The **equivalent class level** is where the classes' win rate crosses 50%. F5.9's numbers, with the old rank steps at 44 and 68, are in brackets.

| Character | Plays at | Equivalent class level (F5.9) | Mean skill | Fits the character? |
|---|---|---:|---:|---|
| Bram | reference 50 | 36 (44) | 31 | Yes: strong and Vigor-heavy. |
| Lyra | reference 50 | 35 (45) | 30 | **Too even with her peers.** A prodigy "used to winning" should lead the students. |
| Kael | reference 50 | 35 (43) | 28 | Yes, though the story treats him as formidable (the man in grey leaves at the sight of him), so +2–4 would fit. |
| Ilse | reference 50 | 35 (42) | 27 | Yes: cult-trained, fierce. |
| Mir | reference 50 | 34 (42) | 31 | Acceptable: chaotic, contraption-driven. |
| Tamsin | reference 50 | 34 (45) | 35 | Yes: Thornwick's best, Lyra's equal. |
| Tobias | reference 50 | 31 (34) | 29 | Yes: gentle. |
| Seraphine | reference 50 | 30 (36) | 26 | Yes: dreamy, not a fighter. |
| Corvin | reference 50 | 30 (27) | 28 | Yes: reckless, a lockpick rather than a duellist. |
| Nessa | reference 50 | 27 (28) | 32 | Yes: a reporter. |
| The man in grey | all skills 50 | 38 (48) | 50 | Level comes from the card's rung. |
| Isolde | canon | 53 (65) | 64 | Yes: formidable; could be higher. |
| Thorne | canon | 51 (63) | 48 | **Too weak.** Master of Arcana, "rumoured to have once out-dueled a storm": he should outclass any late-game player (E ends at 61, a balanced player's best skill at 80) and the Headmistress as a duellist. |
| Marisol | canon | 39 (49) | 43 | Yes. |
| Brask | canon | 37 (50) | 41 | Yes: brave, Vigor 70. |
| Amaranth, Maud | canon | 36, 35 (44, 45) | 43 | Yes: healers. |
| Vey | canon | 35 (48) | 50 | Yes: sly, not a brawler. |
| Grisk, Pell, Mabel, Grimsby | canon | 29, 26, 25, 24 | 28–37 | Yes: villagers and a moneylender, not fighters. |

**Why everyone fell about 10 levels.** A named character's level is their top skill, and the classes they're measured against now reach full kits and rank 3 by about level 40. A class at level 40 now has eight spells at rank 3, where before it had five at rank 1. The ordering barely moved; the yardstick did.

**What sets a character's strength.**
- **Spell ranks, more than stats.** A character falls off where the classes they face cross a course-rank step:
  - with F5.9's gates (rank 2 at 44, rank 3 at 68), Lyra beat level-40 classes 90% and level-50 ones 13%, and Thorne beat level-60 classes 70% and level-70 ones 8%;
  - with F5.9b's (22 and 36), the cliffs moved down with them: Lyra now beats level-30 classes 88% and level-40 ones 18%.
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
   - Re-measure. The targets: Lyra ≈ +5 over the peer pack, Thorne above any late-game player (≥ 65 in F5.9b's equivalent levels).
   - Note: `prodigy` only raises a three-level spell's rank. Wildfire has one level, so this needs either a Wildfire rank ladder or a different lever.
4. **Calibrate against the player, not against classes.**
   - The target for a story duel is the character's equivalent level against the player's at that turn: Lyra at the tournament final (`vs lyra.arcana +3`) should be clearly ahead, Tobias behind.
   - This needs the player's equivalent level (§4 caveat).
5. **Allowed to be weak:** Corvin, Nessa, Tobias, Seraphine and the villagers are non-fighters. Their low numbers are canon-consistent; leave them.

## 6. Every combat card

Card edits apply when the minigame plays the card.

- **Health.** "Drop health" means removing the outcome's `health` lines: settlement charges the Health the fight actually cost (about 5–8 in practice, 10–13 in the ring, 13–20 in a real fight). Keep every other effect: flags, relations, renown, gold, `queue`.
- **Partial.** `partial` means a draw or a loss on points.
- **Level.** Every foe's level is the card's challenge level (§4); the per-month levels are in §4's table.
- **Context** sets the rebates: practice and public 80% of the fight's Health and Mana losses refunded, the ring 65%, real 50%.
- **Audience** (`observers` / `witnesses` in `EVENTS`, F5.9c): *audience* is a crowd whose Renown counts (Glamour and Rapport pay out) and who would also report a forbidden cast; *witnesses* is someone who would report one but no crowd (a sparring partner, a friend at your side); *nobody* is no one from the academy. A forbidden cast always costs alignment. `tools/event-coverage.mjs` fails if a played card doesn't state its context and audience.

| # | Card / option | Challenge | Decision | Foe | Context | Audience | Card edits |
|---:|---|---|---|---|---|---|---|
| 1 | spring_tournament / right | combat journeyman+ drift mid | play | `tournament_entrant` (student pool) | public | audience | Drop health. Lose text "knocked out of the ring in eleven seconds": cut the timing, since a played fight can be long. |
| 2 | spring_tournament_circle / left | combat journeyman drift mid | play | `tournament_entrant` | public | audience | Drop health. |
| 3 | spring_tournament_circle / right | combat journeyman+ drift mid | play | `tournament_entrant` | public | audience | Drop health; same timing fix as #1. |
| 4 | tournament_semifinal / left | combat expert- drift mid | play | `tournament_unbeaten`: Duellist, persona Flame / Haste / Strike | public | audience | Drop health. |
| 5 | tournament_final / left | combat vs lyra.arcana +3 | play | Lyra, scaled to the DC (her Arcana + 12) | public | audience | None (no health lines). |
| 6 | hs_tunnel / fight (with Kael) | combat master- | play | the man in grey, rung | real | witnesses | Drop health (win −small, lose −large). The odds word prices Kael's help: no extra handicap. Text: "Kael's frost and your spell hit him together" suits a fight. |
| 7 | hs_tunnel / fight (alone) | combat master- unlikely | play | the man in grey, rung +5 levels | real | nobody | Drop health. |
| 8 | ilse_grey_returns / left | combat journeyman likely | play | the man in grey, rung −5 levels | real | witnesses | Drop health. His hand on Ilse is in the rung; no extra handicap. Hard-canon story card: `find ilse_truth` stays on both outcomes. |
| 9 | rival_contest / left (thornwick_secrets) | combat adept likely | play | Tamsin if met, else `thornwick_illusionist` | public | audience | Drop health. Play the secret plan instead of the odds word: the foe commits first for 3 exchanges (as under Foresight) at the even level. The win text, "you counter every planned trick before it's cast", then describes the fight. |
| 10 | rival_contest / left | combat adept | play | Tamsin, else `thornwick_illusionist` | public | audience | Drop health. |
| 11 | rival_last_match / left | combat adept+ | play | Tamsin, else `thornwick_final_year` (Thornwick pool) | practice ("nothing at stake") | audience | Drop health. |
| 12 | curse_cure_2 / right | combat adept- | play | `shadow_stag` (special) | real | nobody | Drop health. Its defeat line matches the win text ("lowers its head — and steps aside"). |
| 13 | pyro_lyra_spar / right | combat vs lyra.arcana | play | Lyra, named | practice | audience | Drop health. |
| 14 | duel_practice_bout / left | combat apprentice+ steady | play | `quick_fourth_year`: Duellist, Haste-happy | practice | witnesses | Drop health. Stance: "hold your ground" means the fourth-year leads (`firstLeader: 1`). |
| 15 | duel_practice_bout / right | combat apprentice+ wild | play | `quick_fourth_year` | practice | witnesses | Drop health. Stance: "go on the attack" means you lead (`firstLeader: 0`). |
| 16 | duel_bram_hazing / right | combat vs bram.vigor | play | Bram, named | public (members watching) | audience | Drop health. |
| 17 | y3_last_duel / left | combat vs lyra.arcana +2 | play | Lyra, scaled to the DC (her Arcana + 8) | practice | witnesses | Drop health. |
| 18 | xchg_farewell / right | combat adept- wild | play | `thornwick_sketcher`: Illusionist, persona Shadowstep | practice | witnesses | Drop health. |
| 19 | tavern_brawl / right | combat apprentice+ wild | **convert** | — | — | — | `challenge feat apprentice+ wild`: stepping into a brawl between a troll and a dwarf is nerve and a loud voice, not a duel. Text unchanged. |
| 20 | life_pixies / left | combat apprentice- wild | **convert** | — | — | — | `challenge feat apprentice- wild`: catching a swarm with a laundry bag. Text unchanged. |
| 21 | life_rival_academy / right | combat apprentice+ | play | `thornwick_best` (Thornwick pool) | public | audience | Drop health. |
| 22 | midnight_boathouse_ring / left | combat adept- | play | `ring_opener` (ring pool) | ring | audience | Drop health. |
| 23 | bram_duel / right | combat vs bram.vigor | play | Bram, named | public (formal challenge) | audience | Drop health. |
| 24 | courtyard_seasonal_game / left | duel using vigor apprentice wild | **convert** | — | — | — | `challenge feat apprentice wild`: a team game. Text unchanged. |
| 25 | lyra_date_dawn_duel / left | duel vs lyra.arcana | play | Lyra, named | practice | witnesses | Drop health. |
| 26 | duel_hall_gallery / left | combat vs here.arcana | play | the peer cast as `here`, named | practice | witnesses | Drop health. Every `peer`-tagged character has a named loadout. |
| 27 | flight_field_pickup_race / left | duel using vigor journeyman+ wild | **convert** | — | — | — | `challenge feat journeyman+ wild`: a broom race. Text unchanged. |
| 28 | newt_high_table / health | combat adept- wild | **convert** | — | — | — | `challenge feat adept- wild`: the bone-dice knife game is steadiness, not a fight. The hint "Win or bleed" stays. |
| 29 | ring_on_yourself / left | combat adept- | play | `ring_opener` | ring | audience | Drop health. |
| 30 | ring_on_yourself / right | combat adept- | play | `ring_opener` | ring | audience | Drop health. |
| 31 | ring_bout_2 / left | combat adept | play | by text variant: `ring_rower` (Brawler), `ring_villager` (Underground tough), `ring_scarf` (Illusionist) | ring | audience | Drop health. Needs the variant index (§7). |
| 32 | ring_bout_3 / left | combat adept+ | play | `ring_duellist`, `ring_farrier` (Brawler, Strike / Brace), `ring_hood` (Hollow adept) | ring | audience | Drop health. |
| 33 | ring_bout_4 / left | combat expert- | play | `ring_champion` (Prefect, Brace / Guard), `ring_bookmaker` (Underground tough, dirty), `ring_sailor` (Sailor) | ring | audience | Drop health; the ring's last-standing bonus stays. |
| 34 | gig_newt_brawl / left | combat apprentice+ | **convert** | — | — | — | `challenge feat apprentice+`: defusing a fight between two crews while on duty. Text unchanged. |
| 35 | duelling_captain_challenge / left | combat expert drift mid | play | `visiting_champion` (champion pool) | public | audience | Drop health (both outcomes). |
| 36 | slice_candle_flame / right | duel vs lyra.arcana | play | Lyra, named | practice | witnesses | Drop health (partial and lose). Partial = draw or loss on points. |
| 37 | slice_frost_duel / left | combat vs kael.arcana +1 | play | Kael, scaled to the DC (his Arcana + 4) | practice | audience | Drop health. |
| 38 | duel_first_practice / right | combat vs lyra.vigor -1 | play | `club_partner` (student pool), at the rung lyra.vigor −1 | practice | witnesses | Drop health. The opponent is "your partner", not Lyra: `vs lyra.vigor` is only the DC. |
| 39 | duel_fixture / left | combat adept- | play | `thornwick_duellist` (Thornwick pool) | public | audience | Drop health (lose). |
| 40 | lake_skimming / left | duel apprentice wild | **convert** | — | — | — | `challenge feat apprentice wild`: skimming stones with a friend. Text unchanged. |

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

- **The final year runs hard** for a matched rung (§4: 30% averaged over layouts at month 47). It could get a drift, or a −5 shift for cards in year 4.
- **Low-level fight length and the Vigor classes** under the linear scaling (§2).
- **Which preset a story foe uses.** Should the man in grey ignore Easy and Medium? (Proposed: no; difficulty is the player's choice.)
- **Named fighters' spell ranks** in canon or in `NAMED_LOADOUTS` (§5).
- **Whether the ring pays out its renown** in the ring context, or the card's `renown` covers it.
