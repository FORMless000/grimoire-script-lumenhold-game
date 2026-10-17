# Spell loadouts for encounters (spell redesign v2)

This doc says which spells and skills an opponent brings to a fight. The spells are those of [`docs/spells-v2-list.md`](spells-v2-list.md) (revision 2); their icons are in [`docs/spells-v2-icons.md`](spells-v2-icons.md).

Implemented in the standalone combat v04 prototype (`experiments/minigames/iterations/v04/`, `generateLoadout`). The 0.4.3 revision replaces stochastic spell acquisition with fixed level gates, as requested; campaign encounter wiring remains separate.

**What a loadout is:** an opponent's skills, Mana capacity and spells, with each spell at a level.
- In **combat v2/v04** it is the opponent's whole kit.
- In **negotiation v3** the opponent doesn't cast yet, so only the skills matter: they set its trait offsets. The spells are ready for when opponents can cast there.

## 1. Inputs: the level

Every loadout is built from one number, the encounter's **level L** (1–100), which is the same scale as the check ladder (`docs/authoring/presets.md`):

| The encounter says | L is |
|---|---|
| a rung (`challenge combat adept-:`) | the rung's value: novice 4, apprentice 16, journeyman 28, adept 40, expert 52, master 64, grandmaster 76, archmage 88; `−` and `+` subtract or add 4 |
| `vs <npc>.<stat>` | that stat as it stands today (peers grow with the player, `@balance npc_growth`), plus or minus 4 per `+N`/`−N` step |
| `vs here.<stat>` | the stat of whoever is present, who then uses their own named preset (§6) |

**Bands**, used throughout:

| Band | L | Who you meet there |
|---|---|---|
| Low | 1–24 | first-years, village trouble, practice bouts |
| Mid | 25–49 | upper-years, the tournament rounds, rings and brawls |
| High | 50–74 | champions, the duelling captain, faculty-grade |
| Top | 75–100 | masters and the mystery's powers |

## 2. The rule every preset follows (deterministic spell gains)

Every preset has a **fixed spell-unlock ladder**. Spells never reroll when the level rises. Preferences rank choices in descending weight; zero forbids a choice. Equal weights follow table order. For extras, a hidden spell wins a tie against a club/job spell once eligible. The `unlockLevels` map is exported with every generated kit.

**1. Skills.** Generic skill jitter alone uses `levelRng(L + 1000 × salt)`. Six offsets sum to zero; each skill is `clamp(round(L + offset + jitter), 1, 100)`, with uniform jitter in `±(2 + L/20)`. Mana capacity is `floor(52 + mean skill / 4)`, from all six skills (was `40 + arcana/2`; see `spells-v2-economy.md` §11). Named characters use their own stats (§6).

**2. Ward** unlocks at L 1 for every caster.

**3. Flame** unlocks at `max(1, ceil(25 × (1 − flameBase)))`: the first level at which the previous chance rule would have been certain. There are no Flame rolls. It is therefore universal by L 25. For example Duellist learns it at 3, Healer and Brawler at 10, and Scholar at 15.

**4. Curriculum.** Generic loadouts gain another course spell at **1, 15, 40, 65**. At 1 choose the highest-preference eligible spell among Foresight, Mend and Glamour. Later gains take the highest-preference remaining choice from the five course spells. Haste and Shadowstep cannot unlock below 12.

For named characters, Flame and guaranteed course spells reserve positions in that four-course budget, matching the Lyra example. Remaining positions use the same milestone ladder. Peer study-year bonuses lower the corresponding course gates to L 1, except Haste/Shadowstep retain their L 12 floor. A higher study year never removes known spells. Empty/zero-weight pools do not invent replacement spells.

Course rank is **1 below 44, 2 from 44, and 3 from 68**. Prodigies raise their designated course spell one rank, capped at 3.

**5. Extras.** There are two normal extra slots: **L 45 and L 70**. The first selects the highest-preference club/job spell. At 70 hidden spells join the pool and the second takes the highest-preference remaining choice. An unfilled first slot waits until a supplied spell is eligible (e.g. a named character with only hidden extras). Neither slot replaces a known spell. Toll is never selected.

From study year 3, a growing named character's highest-preference extra unlocks at L 1, including hidden extras. This promotes the same spell; it does not reroll the remaining slots. A named grant such as Starlight at 50 is still certain at that level without the year bonus.

**6. Forbidden spells** have slots at **L 35 and L 80**, in descending preference. Only underground presets get them, apart from explicitly guaranteed named spells such as the man in grey's Compel. No gain rolls occur.

**7. Peer capstones** never appear in generic presets. They remain with their named peers.

Typical non-underground sizes are Ward plus sometimes Flame and one course spell at 10; four spells at 30; six at 55; eight at 90. Underground presets add one forbidden spell from 35, two from 80. Named guarantees can add spells on top.

## 3. Generic presets

Skill offsets are listed as arcana, lore, alchemy, charm, vigor, guile, and sum to 0.

Course weights are for Foresight, Mend, Glamour, Haste and Shadowstep. Extra weights cover club and job spells; hidden-pool weights apply from L 70. **Bold** marks the preset's favourite.

| # | Preset | Salt | Skill offsets | flameBase | Course weights | Club and job (L 45+) | Hidden (L 70+) | Forbidden |
|---|---|---|---|---|---|---|---|---|
| 1 | **Duellist** | 1 | +8, −2, −8, −2, +6, −2 | 0.9 | 2, 1, 0.5, **3**, 2 | **Brace 3**, Tailwind 1 | Reflect 1, Lodestar 1, Starlight 0.5 | — |
| 2 | **Scholar** | 2 | +2, +10, 0, −2, −8, −2 | 0.4 | **4**, 1, 1, 0.5, 1 | **Index 3**, Quickquill 2 | Starlight 2, Seal 1, Moonwell 1 | — |
| 3 | **Healer** | 3 | +2, +2, +8, +2, −4, −10 | 0.6 | 1, **4**, 0.5, 1, 0.5 | **Bramble 3**, Distil 2 | Animate 1, Moonwell 1 | — |
| 4 | **Illusionist** | 4 | 0, 0, −8, +8, −6, +6 | 0.4 | 1, 0.5, **4**, 0.5, 3 | Rapport 2, Quickquill 1 | **Reflect 2**, Seal 1 | — |
| 5 | **Brawler** | 5 | −4, −8, −6, +2, +12, +4 | 0.6 | 0.5, 1, 0.5, **4**, 1 | **Tailwind 3**, Brace 2, Rapport 1 | Rime 1 | — |
| 6 | **Prefect** | 6 | +4, +4, −6, −4, +4, −2 | 0.7 | 2, 2, 0.5, 1, 1 | **Brace 3**, Index 1 | Lodestar 2, Seal 1 | — |
| 7 | **Showman** | 7 | +2, −4, −8, +12, +2, −4 | 0.6 | 1, 0.5, **4**, 2, 0.5 | **Rapport 3**, Tailwind 1 | Reflect 1 | — |
| 8 | **Underground tough** | 8 | −2, −8, −4, −2, +8, +8 | 0.7 | 0.5, 1, 1, **3**, **3** | Tailwind 2, Brace 1, Rapport 1 | Rime 1 | **Extraction 3**, Torment 2, Heartprice 1 |
| 9 | **Hollow adept** | 9 | +6, +6, −4, −6, −6, +4 | 0.5 | **3**, 1, 0.5, 0.5, **3** | Index 1 | **Seal 2, Rime 2**, Moonwell 1 (never Starlight) | **Siphon 3**, Eclipse 2, Torment 1, Compel 0.5 |

**What each one feels like:**
- **Duellist:** the Duel Hall's regulars. Flame from 3, then Haste and Shadowstep. They add Brace at 45 and Reflect at 70.
- **Scholar:** upper-years, examiners and Conclave staff. Foresight first, then Index at 45 and Starlight at 70. Built more for negotiation than for fights.
- **Healer:** infirmary and greenhouse folk. Flame from 10. Mend first, Bramble at 45.
- **Illusionist:** Thornwick's students. Glamour and Shadowstep, Reflect at Top.
- **Brawler:** the Newt's back room and the courier loft's rivals. Vigor-heavy, Haste and Tailwind.
- **Prefect:** patrols and junior officials. A balanced, defensive kit that ends in Brace and Lodestar, a wall.
- **Showman:** exhibition fights with observers. Glamour and Rapport turn the crowd into Renown.
- **Underground tough** (underground): ring fighters, Grisk's men, smugglers. Haste and Shadowstep, then Extraction and Torment from Mid.
- **Hollow adept** (underground): the Hollow cult and the northerners who serve it. Foresight and Shadowstep, Seal and Rime, then Siphon and Eclipse.

## 4. A worked example: the Duellist across the bands

| L | Kit |
|---|---|
| 10 | Ward, Flame 1, Foresight 1 |
| 30 | Ward, Flame 1, Foresight 1, Haste 1 |
| 55 | Ward, Flame 2, Foresight 2, Haste 2, Shadowstep 2, Brace |
| 80 | Ward, Flame 3, Foresight 3, Haste 3, Shadowstep 3, Mend 3, Brace, Reflect |

The exact same spell ladder applies every time. Neighbouring levels can still vary in skills, and 44/68 upgrade learned course spells.

## 5. Which encounter uses which preset

Every combat in the game today:

| Encounter (event) | Level | Preset | Observers |
|---|---|---|---|
| `duel_practice_bout`, `duelling_ward_line` | apprentice+ (20) | Duellist | no |
| `duel_fixture` | adept− (36) | Duellist | yes |
| `spring_tournament`, `spring_tournament_circle` | journeyman / journeyman+ | Duellist | yes |
| `tournament_semifinal` | expert− (48) | Duellist | yes |
| `duelling_captain_challenge` | expert (52) | Duellist | yes |
| `duel_first_practice`, `pyro_lyra_spar`, `tournament_final`, `y3_last_duel` | vs `lyra` | Lyra (§6) | final: yes |
| `duel_bram_hazing`, `bram_duel` | vs `bram.vigor` | Bram | hazing: yes |
| `slice_frost_duel` | vs `kael.arcana` +1 | Kael | no |
| `duel_hall_gallery` | vs `here.arcana` | whoever is present (Duellist for a stranger) | no |
| `rival_contest`, `rival_last_match` | adept / adept+ | Tamsin when they are the opponent, else Illusionist | yes |
| `life_rival_academy`, `xchg_farewell` | apprentice+ / adept− | Illusionist (Thornwick) | yes |
| `tavern_brawl`, `gig_newt_brawl` | apprentice+ | Brawler | yes (the bar) |
| `midnight_boathouse_ring`, `ring_on_yourself` | adept− | Underground tough | yes (a betting crowd, so a forbidden cast is seen) |
| `newt_high_table` | adept− | Underground tough (Grisk's men; Grisk keeps the bank) | yes |
| `ilse_grey_returns`, `hs_tunnel` | journeyman / master− | the man in grey (§6); in `hs_tunnel` with `flag(ilse_taken)`, Ilse beside him | no |
| `curse_cure_2` (a shadow stag), `life_pixies` | — | **creatures: no loadout.** They fight with basic actions and one natural trait, outside this system | — |

- **Prefect, Scholar, Healer and Showman** have no fight yet. They are ready for night patrols, Conclave and exam confrontations, and exhibition bouts.
- **Negotiation opponents** take their skill shape from the same table, so a Thornwick envoy negotiates with the Illusionist's charm and guile.

## 6. Named characters

A named character's preset is the generic rule with four changes:

1. **Skills are their own:** the worldbook `stats:` in `content/world/cast.grim`. Peers grow with the player; faculty and villagers are fixed. There is no shape and no jitter.
2. **Their iconic spell is guaranteed**, at every level.
3. **Their place spell** (the club or job where they spend their time) unlocks at **L 25**, with no roll. Peers' encounter stats start around 28–38, so in practice they have it at every level they're met at.
4. **Picks come from their own weights.** They follow the generic curriculum and extra counts, minus anything they already have. Ward is always there, and Flame follows its fixed `flameBase` unlock level as usual.
5. **Peers gain spells as the years pass.** Their level already grows with the player. On top of that:
   - their curriculum picks are **at least their year of study** (1 in year 1, up to 4 in year 4);
   - from **year 3** they add **one extra pick** from their extras list (hidden-pool entries included), if the level rule hasn't already given them one.

   Lyra, for example:

   | Year | Level | Spells |
   |---|---|---|
   | 1 | ~34 | Ward, Flame, Wildfire, Brace, one course spell |
   | 4 | ~56 | four course spells at level 2, plus Tailwind or another extra |

   The unlock ladder is fixed, so the same peer at the same level and year always has the same kit; raising either input never removes spells.

A **prodigy** knows their signature course spell one level above `rank(L)`, up to 3.

### Peers (iconic = the spell from their relationship capstone)

Stats are listed as arcana, lore, alchemy, charm, vigor, guile.

| Peer | Stats at the start | Iconic | Place spell | flameBase | Course weights (Fs, Md, Gl, Ha, Sh) | Extras | Notes |
|---|---|---|---|---|---|---|---|
| **Lyra** | 34, 22, 8, 20, 28, 12 | **Wildfire** | **Brace** (Duel Hall) | 1.0, *prodigy: Flame +1* | 1, 0, 0, **3**, 0.5 | Tailwind 1 | Fire, Brace for the backlash, Haste to close in. Pride: almost never Shadowstep, never Mend |
| **Tobias** | 12, 14, 26, 18, 30, 4 | **Heartwood** | **Bramble** (greenhouses) | 0.0 | 0.5, **4**, 0, 2, 0 | Distil 1 | The two constructs that can stand together, plus Mend. Flame only from L 25, when the rule forces it |
| **Seraphine** | 20, 32, 10, 16, 8, 14 | **Omen** | no club or job: **Foresight** (the observatory's course), guaranteed | 0.2 | –, 1, 1, 0, **3** | **Starlight** guaranteed from L 50 (the observatory at night) | Foresight makes them commit first, Omen lands on the exchange she chose. She hides when futures are loud (Shadowstep) |
| **Corvin** | 16, 12, 14, 30, 18, 38 | **Sleight** | **Rapport** (the Newt, evenings) | 0.4 | 1, 0, 2, 1, **4** | Quickquill 0.5 | Never a forbidden spell. He knows the underground but isn't of it |
| **Mir** | 24, 20, 30, 14, 10, 12 | **Contraption** | **Animate** (the workshop; Artifice) | 0.6 ("three fires") | 1, 2, 0, 2, 0 | Distil 1 | Contraption and Animate may stand together (list §E). Haste for the ornithopter |
| **Kael** | 36, 26, 8, 10, 22, 18 | **Hoarfrost** | **Index** (the library, afternoons) | 0.3 | **3**, 1, 0, 0.5, 2 | **Starlight** guaranteed from L 50 (the star that eats light) | Hoarfrost answers fire. Index does nothing in a fight, which suits him: he came to read |
| **Nessa** | 14, 26, 8, 30, 12, 24 | **Candour** | **Quickquill** (Ledger office) | 0.3 | 2, 0.5, 1, 0.5, 1 | Index 1 | Mostly a negotiation opponent: Candour then Quickquill is her move |

### Others with events (no capstone spell, but a kit of their own)

| Character | L | Guaranteed | Draws | Notes |
|---|---|---|---|---|
| **Bram** (peer, rival) | `vs bram.vigor` (32 at the start) | **Brace** (Duel Hall, evenings); **Lodestar** from L 50 | flameBase 0.8; course weights Haste 3, Mend 1, Foresight 1, Glamour 0, Shadowstep 0 | **The wall:** a prefect doesn't hide, and doesn't step aside. Under the sash, he steps between |
| **Ilse** | her arcana (40 at the start) | **Rime** (her "sliver of winter") | flameBase 0.2; Shadowstep 2, Haste 2, Foresight 1 | With `flag(ilse_taken)` she counts as **underground**: Eclipse guaranteed, plus forbidden preferences Siphon 2 and Torment 1 |
| **Tamsin** (pen pal, Thornwick) | adept / adept+ in their fights | **Glamour** at `rank(L)` + 1 (prodigy); **Rapport** from L 30 (the theatre's crowd); **Reflect** from L 40 (stage mirrors) | flameBase 0.3; Shadowstep 3, Haste 1, Foresight 1 | The showman's kit, for `rival_last_match`'s exhibition under lanterns |
| **The man in grey** (lore `man_in_grey`; no `@npc`) | the encounter's rung | **Compel** ("Home," he says, and she goes); **Rime** (fountains freeze when he talks) | underground; forbidden preferences Eclipse 2, Siphon 2, Heartprice 1; Foresight 2, Shadowstep 2 | His iconic forbidden spell is guaranteed even at journeyman (`ilse_grey_returns`), but the check there is `likely`: he is toying with you |
| **Grisk** | 64 (guile 82, charm 46) | **Extraction** ("every sentence an invoice"); **Rapport** (keeps the Newt's high table) | underground; Compel 2, Torment 1; Glamour 3, Shadowstep 2, Foresight 1 | Mostly a negotiation opponent; he lets his men do the fighting |

### Faculty and villagers (fixed levels; rarely fought, often negotiated with)

L is the mean of their two best skills, so `rank` is fixed and so is most of the kit. The "Rest" column lists their favourites; the rule in §2 still decides how many they get at their L.

| Character | L | Iconic | Rest | Notes |
|---|---|---|---|---|
| **Thorne** | 81 | **Flame 3** | Brace, Seal, Lodestar, Foresight 3 | A Warden: the textbook kit with a wall |
| **Isolde** | 87 | **Seal** (Hollow Studies) | Starlight, Reflect, Foresight 3, Shadowstep 3 | She never needs to raise her voice |
| **Vey** | 74 | **Glamour 3** | Reflect, Rapport, Shadowstep 3 | Delighted by anyone who fools her |
| **Brask** | 61 | **Haste 2**, prodigy, so 3 | Tailwind, Mend 2 | |
| **Marisol** | 63 | **Moonwell** (water from the lake bed) | Haste 2, Mend 2 | Tide was cut. The well is her calm before the whoop |
| **Amaranth** | 66 | **Mend 2**, prodigy, so 3 | Distil, Brace | |
| **Maud** | 65 | **Mend 2**, prodigy, so 3 | Bramble, Distil | Toll is hers in the story, never in a fight |
| **Pell** | 61 | **Distil** (the apothecary's own) | Mend 2 | He counts the drops aloud |
| **Mabel** | 49 | **Rapport** | Mend 2, Glamour 2 | |
| **Grimsby** | 52 | **Index** | Foresight 2 | Finds the book you need, not the one you asked for |

- Peer capstone spells stay with their peers. No faculty member or villager has one.
- Comment:

## 7. Checks the presets should pass in the simulator

- Every kit at every L in 1–100, for every preset: contains Ward; contains Flame when L ≥ 25; contains no forbidden spell unless the preset is underground; contains no peer spell unless it is that peer's preset.
- Named presets always contain their iconic spell, and their place spell when L ≥ 25.
- A peer's kit never shrinks from one year to the next at a rising level; in year 4 it has at least four course spells.
- Kit sizes stay within the "Typical kit size" table above.
- The same (preset, L) gives the same kit twice; neighbouring presets at the same L differ.

## 8. Prototype implementation

- `roster.mjs` exports `generateLoadout`; `loadouts.mjs` holds the nine generic and 22 named preference tables. “Loadout” replaces the previous term in controls, configs and exported kit identifiers.
- Generic skills use all six independent offsets and level-growing jitter. Spell acquisition uses fixed gates and priority only, with no RNG draws.
- `cast-stats.mjs` is a hash-tested worldbook snapshot, refreshed explicitly by `sync-loadout-stats.mjs`.
- The standalone bench preserves growing characters' stat ratios and sets their documented encounter stat to L. Campaign adapters can provide exact current `Engine.statOf` skills. Faculty/villagers retain fixed stats and a fixed integer level (floor of the mean of their two strongest skills).
- Named salts 10–31 follow §6's order. Preference lists without numeric weights use equal priority 1 on listed choices. The man in grey has no NPC stat block, so its fixture uses all six skills at L and marks them provisional.
- Named study-year and Ilse flag fixtures are exposed in Setup. Random selects one of the nine generic presets; it never changes that preset's spell ladder.
- Campaign spell acquisition, encounter dispatch, and the proposed Mir construct synergy remain separate work.

## 9. Decisions

- **Peers gain spells over the years:** rule 5 in §6.
- **Loadouts are deterministic.** The same preset at the same level (and, for peers, the same year) gives the same kit in every match. There is no per-encounter variation; rematches are predictable on purpose.
- **Mana is left alone here.** Spell costs, capacity and starting Mana are balanced after the simulator runs.
- Comment:
