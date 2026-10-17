# How three loadouts play at level 80 (spell redesign v2)

Six generic loadouts, played out at level 80 so each has its full spell roster.

Three iconic ones (sections 1–3):
- **Duellist**: the clean spell-fencer.
- **Underground tough**: the dirty fighter.
- **Hollow adept**: the forbidden caster.

The three weakest in the class matrix (sections 4–6):
- **Healer** (36% overall).
- **Brawler** (42%).
- **Illusionist** (47%).

For each there is a "how to play" guide drawn from what wins in the simulated fights, the numbers behind it, and one fight shown exchange by exchange, so you can see how a fight actually unfolds.

**Setup.** The engine is the "F4" balance variant of `docs/spells-v2-economy.md` §11: §5's spell numbers with §11's capacity, skill factor and decision on points. Each loadout played 48 fights as side 0: the 8 other generic loadouts × 2 first leaders × 3 seeds. Both sides used the fallible AI (depth 3, 30% mistake attempts).

**Caveats**
- These are AI habits, not proof of best play. The AI looks 3 exchanges ahead, so it undervalues anything slower than that: channels and constructs above all.
- Each matchup has only 6 fights from one side. Where both loadouts here were focal, the two sides are combined into 12.
- The scratch scripts are not in the repo; the economy doc's §8 says how to rebuild the fork.

## The common shape of a level-80 fight

All three loadouts follow the same three phases.

| Phase | Exchanges | What happens |
|---|---|---|
| **Setup** | 1–4 | Buffs and tricks come out: Shadowstep, Foresight, Ward, Extraction, Torment, Eclipse. About a third of actions are still Flame. |
| **Attrition** | 5–12 | A Mend war. Both sides Flame and Mend, and the one who has to Reclaim at a bad moment falls behind. Extraction, Eclipse and Seal peak here. |
| **Race** | 13+ | Tricks are spent and Mana is thin. It becomes Flame, Strike, Reclaim, Mend, and whoever runs out of Mana for Mend first loses. |

Three facts hold for all three loadouts:
- **Flame does 87–91% of the damage**, and lands nearly every killing blow. The other damage is Strike.
- **Mend is the second action** (14–16% of actions).
- **The fight is decided by Mana timing, not tricks.** The tricks set up who has Mana in the race.

## 1. Duellist

**Kit:** Ward, Flame 3, Foresight 3, Haste 3, Shadowstep 3, Mend 3, Brace, Reflect.

**Record:** 36 won, 12 lost, no draws. Median 21 exchanges.
- Sweeps Scholar, Healer, Prefect and Brawler 6–0, and Illusionist 5–1. Even with Showman, 3–3.
- Even with Underground tough over 12 fights (6–6).
- Loses to Hollow adept over 12 fights (4–8).

### How to play it

**Core loop: Flame, and Flame again.** Flame is 42% of its actions and 89% of its damage, and every one of its 36 wins ended on a Flame. Everything else in the kit exists to keep Flame going.

**Opening (exchanges 1–4).**
- Flame from exchange 1. The single most common opening is four Flames.
- If you aren't under pressure, set Shadowstep (around exchange 2) and Foresight (around 3) first. Foresight's +4 then rides on your next Flames.

**Answering a lead.**
| They lead | Answer | Why |
|---|---|---|
| Strike | **Flame** (68%), Mend if low | Strike only costs you 10, so trade up. |
| Flame | **Ward** (34%), or Brace or Reflect (9% each) | Reflect sends the Flame back for about 22. It's the best answer when you can afford 16 Mana. |
| Guard | **Flame** (46%) or **Reclaim** (20%) | A Guard lead is a free moment to Reclaim safely. |
| Ward | Reclaim, Foresight or Strike | Don't throw a Flame into a Ward. |
| Reclaim | **Flame** (82%) | They've just spent a turn not defending. Punish it every time. |

**Mana rhythm.** Reclaim when they can't punish it, behind a Guard lead or a Ward, or inside a **Haste bundle: Guard + Reclaim**, which reclaims and defends in one exchange. Haste's other good bundle is Strike + Strike against a Guard.

**Low HP (below 35%).** Keep attacking: Flame 46%, Mend only 16%. A Duellist that turtles loses the race.

**Matchups.**
- **Against Hollow adept:** don't attack into Eclipse. Mend and Ward while it's up, and make the adept pay for it; save Flames for the race. Expect Seal to eat your flux, so Reclaim early, in small amounts.
- **Against Underground tough:** keep Mana low enough that Extraction steals little, and Reclaim right after Extraction rather than before it. When Torment lands, don't waste actions: each one costs you 9.

### A fight: Duellist beats Hollow adept in 28

- **Setup (1–4).** The Duellist opens with Foresight while the adept sets Shadowstep. The adept's first Flame lands for 22. The Duellist answers the next Flame with **Reflect**: 22 back.
- **Eclipse stall (5–13).**
  - The adept casts Eclipse four times, and the Duellist refuses to attack into it.
  - The Duellist Mends to full, then sits in **Haste: Guard** bundles, which cost it nothing.
  - The adept spends 26 Mana on Eclipse and Mend, then Reclaims 44. Neither side has lost anything.
- **Attrition (14–21).** Flames, Mends and the adept's Strikes trade. By exchange 21 the Duellist is behind, 43 HP to 66.
- **Race (22–28).**
  - The Duellist Flames in five of the last six exchanges, mostly as the answer to the adept's leads (23 each). The adept can only Strike, Mend and Reclaim around them.
  - It ends with the Duellist on 1 HP and the adept dead to a 6-point Flame finisher.

| Ex | Leads | Duellist | Hollow adept | HP (Duellist / Hollow adept) | Mana | What happened |
|---|---|---|---|---|---|---|
| 1 | Hollow adept | Foresight | Shadowstep | 70 / 70 | 66 / 54 |  |
| 2 | Hollow adept | Reclaim | Flame | 48 / 70 | 70 / 47 | Flame hits Duellist 22; Duellist reclaims 4 |
| 3 | Hollow adept | Reflect | Flame | 48 / 48 | 54 / 40 | Flame hits Hollow adept 22 |
| 4 | Hollow adept | Strike | Seal | 48 / 38 | 54 / 32 | Strike hits Hollow adept 10 |
| 5 | Hollow adept | Mend | Eclipse | 66 / 38 | 47 / 26 |  |
| 6 | Hollow adept | Guard | Mend | 66 / 57 | 47 / 19 |  |
| 7 | Hollow adept | Mend | Eclipse | 70 / 57 | 40 / 13 |  |
| 8 | Duellist | Guard | Mend | 70 / 70 | 40 / 6 |  |
| 9 | Hollow adept | Foresight | Reclaim | 70 / 70 | 34 / 50 | Hollow adept reclaims 44 |
| 10 | Hollow adept | Haste | Ward | 70 / 70 | 29 / 43 |  |
| 11 | Hollow adept | Haste: Guard + Reclaim | Eclipse | 70 / 70 | 46 / 37 | Duellist reclaims 17 |
| 12 | Hollow adept | Haste: Guard | Eclipse | 70 / 70 | 46 / 31 |  |
| 13 | Hollow adept | Haste: Guard | Foresight | 70 / 70 | 46 / 25 |  |
| 14 | Duellist | Guard | Flame | 52 / 70 | 46 / 18 | Flame hits Duellist 18 |
| 15 | Hollow adept | Flame | Strike | 42 / 47 | 39 / 18 | Flame hits Hollow adept 23; Strike hits Duellist 10 |
| 16 | Duellist | Mend | Mend | 60 / 66 | 32 / 11 |  |
| 17 | Duellist | Reclaim | Strike | 50 / 66 | 41 / 11 | Strike hits Duellist 10; Duellist reclaims 9 |
| 18 | Duellist | Mend | Strike | 58 / 66 | 34 / 11 | Strike hits Duellist 10 |
| 19 | Duellist | Foresight | Reclaim | 58 / 66 | 28 / 37 | Hollow adept reclaims 26 |
| 20 | Hollow adept | Reclaim | Shadowstep | 58 / 66 | 37 / 19 | Duellist reclaims 9 |
| 21 | Hollow adept | Guard | Flame | 43 / 66 | 37 / 12 | Flame hits Duellist 15 |
| 22 | Hollow adept | Flame | Strike | 33 / 43 | 30 / 12 | Flame hits Hollow adept 23; Strike hits Duellist 10 |
| 23 | Hollow adept | Flame | Mend | 33 / 38 | 23 / 5 | Flame hits Hollow adept 23 |
| 24 | Hollow adept | Flame | Reclaim | 33 / 15 | 16 / 26 | Flame hits Hollow adept 23; Hollow adept reclaims 21 |
| 25 | Hollow adept | Flame | Mend | 33 / 10 | 9 / 19 | Flame hits Hollow adept 23 |
| 26 | Duellist | Reclaim | Flame | 11 / 10 | 27 / 12 | Flame hits Duellist 22; Duellist reclaims 19 |
| 27 | Hollow adept | Flame | Mend | 11 / 6 | 20 / 5 | Flame hits Hollow adept 23 |
| 28 | Duellist | Flame | Strike | 1 / 0 | 62 / 61 | Flame hits Hollow adept 6; Strike hits Duellist 10 |

The Mana on the last row includes the flux paid out at settlement.

## 2. Underground tough

**Kit:** Ward, Flame 3, Mend 3, Haste 3, Shadowstep 3, Glamour 3, Tailwind, Rime, Extraction, Torment.

**Record:** 34 won, 13 lost, 1 draw. Median 19 exchanges, the shortest of the three.
- Wins 5–1 or 6–0 against Healer, Brawler, Prefect, Showman and Illusionist.
- Even with Scholar (3–2–1).
- Even with Duellist over 12 fights (6–6), and wins against Hollow adept over 12 (7–5).

### How to play it

**Core loop: deny, then bleed.** Flame is only 27% of its actions. The rest is the dirty work:
- **Extraction**, about 2.3 a fight: it steals 9 ready Mana, so the opponent can't afford its race.
- **Torment** does 38 HP a fight that nothing blocks.
- **Ward** is its main answer as responder (26%).

**Opening (exchanges 1–4).** Two openings dominate:
- **Ward, Extraction, Shadowstep, Torment**: defend, steal, then set up the combo.
- **Shadowstep, Torment, Flame, Extraction**: combo first.

**The combo: Shadowstep → Torment.** This is the loadout's signature, seen 28 times in 48 fights.
- Cast Shadowstep, then Torment while it's up.
- The opponent now pays 8–9 HP for every action for three exchanges, but its Flames pass through you.
- Its best reply is to Guard or Reclaim, which is exactly what you want.

**Answering a lead.**
| They lead | Answer | Why |
|---|---|---|
| Flame | **Ward** (55%) or **Shadowstep** (19%) | The tough doesn't race Flame for Flame. |
| Strike | **Mend** (36%), Flame (28%), Guard (17%) | Strike is cheap; use the time to heal. |
| Guard | **Reclaim** (57%) | The safe Reclaim. |
| Reclaim | **Flame** (43%) or **Torment** (20%) | Torment on a Reclaim means their next actions all cost HP. |

**Extraction timing.** Extract when their ready Mana is high: right after they Reclaim, or early, while they still hold their starting 65. Extracting a near-empty opponent wastes 8 Mana.

**Rime is the safety net.** It saved the tough 17 times in 48 fights (first used around exchange 14): it freezes on a lethal hit and thaws with 12 HP. Play the race closer than you otherwise would.

**Finishing.** 8 of the 34 wins ended on a Torment tick, with the tough itself on 1 HP. Keep Torment for the end too: a Torment on an opponent below 25 HP is a kill they can only stop by doing nothing.

**Ignore Glamour and Tailwind.** Glamour needs observers, and none of these fights has them. Tailwind never beat Flame for the action. Neither was cast once.

### A fight: Underground tough beats Duellist in 25

- **Setup (1–4).**
  - Both open with a Flame.
  - The tough **Extracts twice**, taking the Duellist's Mana from 65 to 24, and Wards in between.
  - It pays in HP: down to 1 against the Duellist's 48.
- **Combo (5–9).**
  - Both Mend. Then the tough sets **Shadowstep** and casts **Torment** under it.
  - The Duellist's next Flame passes through, and each of its actions costs it 9.
  - The Duellist drops from 66 to 26 while it Reclaims.
- **Mend war (10–20).**
  - The Duellist, now with Mana, Flames every exchange it can. The tough Mends almost every exchange and sits between 7 and 37 HP.
  - By exchange 20 both are out of Mana.
- **Finish (21–25).**
  - A third **Extraction** empties the Duellist again (to 3 Mana).
  - Then Shadowstep, then Torment. The Duellist Reclaims and Flames into the Shadowstep, and two Torment ticks take its last 18 HP.
  - The tough wins on 1 HP.

| Ex | Leads | Underground tough | Duellist | HP (Underground tough / Duellist) | Mana | What happened |
|---|---|---|---|---|---|---|
| 1 | Duellist | Flame | Flame | 47 / 48 | 65 / 65 | Flame hits Duellist 22; Flame hits Underground tough 23 |
| 2 | Underground tough | Extraction | Flame | 24 / 48 | 67 / 48 | Flame hits Underground tough 23 |
| 3 | Duellist | Ward | Flame | 24 / 48 | 60 / 41 |  |
| 4 | Underground tough | Extraction | Flame | 1 / 48 | 62 / 24 | Flame hits Underground tough 23 |
| 5 | Duellist | Mend | Mend | 19 / 66 | 55 / 17 |  |
| 6 | Underground tough | Shadowstep | Guard | 19 / 66 | 37 / 17 |  |
| 7 | Duellist | Torment | Flame | 19 / 57 | 23 / 10 | Torment costs Duellist 9 |
| 8 | Underground tough | Flame | Reclaim | 19 / 26 | 16 / 38 | Torment costs Duellist 9; Flame hits Duellist 22; Duellist reclaims 28 |
| 9 | Duellist | Mend | Mend | 37 / 35 | 9 / 31 | Torment costs Duellist 9 |
| 10 | Underground tough | Reclaim | Flame | 14 / 35 | 64 / 24 | Flame hits Underground tough 23; Underground tough reclaims 55 |
| 11 | Duellist | Ward | Flame | 14 / 35 | 57 / 17 |  |
| 12 | Underground tough | Mend | Flame | 9 / 35 | 50 / 10 | Flame hits Underground tough 23 |
| 13 | Duellist | Mend | Strike | 17 / 35 | 43 / 10 | Strike hits Underground tough 10 |
| 14 | Underground tough | Mend | Flame | 12 / 35 | 36 / 3 | Flame hits Underground tough 23 |
| 15 | Duellist | Flame | Reclaim | 12 / 13 | 29 / 27 | Flame hits Duellist 22; Duellist reclaims 23 |
| 16 | Underground tough | Mend | Flame | 7 / 13 | 22 / 20 | Flame hits Underground tough 23 |
| 17 | Duellist | Mend | Strike | 16 / 13 | 15 / 20 | Strike hits Underground tough 10 |
| 18 | Underground tough | Mend | Mend | 34 / 32 | 8 / 13 |  |
| 19 | Duellist | Flame | Strike | 24 / 10 | 1 / 13 | Flame hits Duellist 22; Strike hits Underground tough 10 |
| 20 | Underground tough | Strike | Mend | 24 / 18 | 1 / 6 | Strike hits Duellist 10 |
| 21 | Duellist | Reclaim | Reclaim | 24 / 18 | 43 / 20 | Underground tough reclaims 42; Duellist reclaims 14 |
| 22 | Underground tough | Extraction | Flame | 1 / 18 | 45 / 3 | Flame hits Underground tough 23 |
| 23 | Duellist | Shadowstep | Strike | 1 / 18 | 27 / 3 |  |
| 24 | Underground tough | Torment | Reclaim | 1 / 9 | 13 / 8 | Torment costs Duellist 9; Duellist reclaims 5 |
| 25 | Duellist | Ward | Flame | 1 / 0 | 64 / 58 | Torment costs Duellist 9 |

## 3. Hollow adept

**Kit:** Ward, Flame 3, Foresight 3, Shadowstep 3, Mend 3, Glamour 3, Index, Seal, Siphon, Eclipse.

**Record:** 36 won, 12 lost, no draws. Median 22 exchanges.
- Sweeps Showman and Illusionist; 5–1 against Scholar, Brawler and Prefect.
- Even with Healer (3–3).
- Beats Duellist over 12 fights (8–4); loses to Underground tough over 12 (5–7).

### How to play it

**Core loop: a Flame caster that makes attacking you expensive.** Flame is 40% of its actions and 91% of its damage. The forbidden spells shape when the opponent dares to act:
- **Eclipse**: for this exchange and the next, every HP of damage you take also gives you twice that in ready Mana.
- **Seal**: erases the opponent's flux (about 20 each time).

**Opening (exchanges 1–4).** Shadowstep first (around exchange 2), then Flame and Foresight. The most common opening is Shadowstep, Flame, Foresight, Flame.

**Eclipse is a deterrent.** In 91 exchanges that began under the adept's Eclipse, the opponent attacked in only 7.
- So cast Eclipse when you need time, not damage: to Mend up, or to let a Foresight land.
- It costs 6 Mana, and that Mana comes back as flux at the next Reclaim, so the stall is nearly free.
- The AI also uses it as an answer to a seen Strike (24% of answers to Strike).

**Seal on Reclaim.** Seal's best moment is a seen Reclaim lead (24% of answers to Reclaim): their Reclaim then returns nothing. The other good moment is when they Ward (24%), since they're not attacking that exchange.

**Answering a lead.**
| They lead | Answer | Why |
|---|---|---|
| Strike | **Flame** (41%) or **Eclipse** (24%) | Flame trades up; Eclipse turns their Strike into 20 Mana. |
| Flame | **Ward** (40%) or **Shadowstep** (25%) | |
| Guard | Flame, Mend or Reclaim | |
| Ward | **Reclaim** (35%) or **Seal** (24%) | |
| Reclaim | **Flame** (51%) or **Seal** (24%) | |

**Siphon, the third spell of its kit, is almost never cast** (one fight in 48). It costs 12 plus 6 per Hold and pays out only on Release, two exchanges later. At a 3-exchange horizon the AI can't see it pay. A human player may get more from it; the simulator can't say.

**Matchups.**
- **Against Duellist:** Eclipse while you rebuild, Seal its flux, and meet its Flames in the race with your own. The adept wins 8 of 12.
- **Against Underground tough:** Extraction takes the Mana that Eclipse is meant to protect, and Torment punishes the Eclipse stall. The adept loses 5–7.

### A fight: Hollow adept beats Duellist in 29

- **Setup (1–6).** Both sides set their tricks: Shadowstep and Foresight, then Guards and Reclaims. No damage for five exchanges. The first Flame lands at exchange 6.
- **Eclipse wall (7–14).**
  - The adept casts Eclipse five times and Seals once, down to 0 Mana.
  - The Duellist won't attack into Eclipse. It Mends and Wards, then sets up Haste.
  - The adept then Reclaims 43, so the whole wall cost it next to nothing.
- **Trade (15–22).** Each Flames and Mends; both reach 2 Mana by exchange 21.
- **Race (23–29).**
  - The adept Reclaims first, at the cost of a Flame (61 → 38).
  - Then it Flames in four of the last six exchanges, leading or answering. The Duellist is left Guarding on 2 HP and dies to a Flame at exchange 29.
  - The adept finishes on 13 HP.

| Ex | Leads | Hollow adept | Duellist | HP (Hollow adept / Duellist) | Mana | What happened |
|---|---|---|---|---|---|---|
| 1 | Hollow adept | Shadowstep | Foresight | 70 / 70 | 54 / 66 |  |
| 2 | Hollow adept | Guard | Reclaim | 70 / 70 | 54 / 70 | Duellist reclaims 4 |
| 3 | Hollow adept | Foresight | Guard | 70 / 70 | 48 / 70 |  |
| 4 | Duellist | Reclaim | Ward | 70 / 70 | 64 / 63 | Hollow adept reclaims 16 |
| 5 | Hollow adept | Shadowstep | Reclaim | 70 / 70 | 46 / 68 | Duellist reclaims 5 |
| 6 | Duellist | Flame | Guard | 70 / 55 | 39 / 68 | Flame hits Duellist 15 |
| 7 | Hollow adept | Eclipse | Mend | 70 / 70 | 33 / 61 |  |
| 8 | Duellist | Flame | Foresight | 70 / 48 | 26 / 55 | Flame hits Duellist 22 |
| 9 | Hollow adept | Eclipse | Mend | 70 / 66 | 20 / 48 |  |
| 10 | Hollow adept | Eclipse | Ward | 70 / 66 | 14 / 41 |  |
| 11 | Hollow adept | Seal | Guard | 70 / 66 | 6 / 41 |  |
| 12 | Hollow adept | Eclipse | Mend | 70 / 70 | 0 / 34 |  |
| 13 | Hollow adept | Reclaim | Haste | 70 / 70 | 43 / 29 | Hollow adept reclaims 43 |
| 14 | Hollow adept | Eclipse | Haste: Guard + Reclaim | 70 / 70 | 37 / 37 | Duellist reclaims 8 |
| 15 | Hollow adept | Flame | Haste: Guard | 70 / 55 | 30 / 37 | Flame hits Duellist 15 |
| 16 | Duellist | Flame | Haste: Guard | 70 / 40 | 23 / 37 | Flame hits Duellist 15 |
| 17 | Hollow adept | Strike | Flame | 47 / 30 | 23 / 30 | Strike hits Duellist 10; Flame hits Hollow adept 23 |
| 18 | Duellist | Mend | Mend | 66 / 48 | 16 / 23 |  |
| 19 | Hollow adept | Strike | Flame | 43 / 38 | 16 / 16 | Strike hits Duellist 10; Flame hits Hollow adept 23 |
| 20 | Duellist | Flame | Mend | 43 / 34 | 9 / 9 | Flame hits Duellist 22 |
| 21 | Hollow adept | Mend | Mend | 61 / 53 | 2 / 2 |  |
| 22 | Duellist | Strike | Reclaim | 61 / 43 | 2 / 25 | Strike hits Duellist 10; Duellist reclaims 23 |
| 23 | Hollow adept | Reclaim | Flame | 38 / 43 | 29 / 18 | Flame hits Hollow adept 23; Hollow adept reclaims 27 |
| 24 | Duellist | Flame | Mend | 38 / 39 | 22 / 11 | Flame hits Duellist 22 |
| 25 | Hollow adept | Mend | Flame | 33 / 39 | 15 / 4 | Flame hits Hollow adept 23 |
| 26 | Duellist | Flame | Strike | 23 / 17 | 8 / 4 | Flame hits Duellist 22; Strike hits Hollow adept 10 |
| 27 | Hollow adept | Flame | Guard | 23 / 2 | 1 / 4 | Flame hits Duellist 15 |
| 28 | Duellist | Reclaim | Guard | 23 / 2 | 20 / 4 | Hollow adept reclaims 19 |
| 29 | Hollow adept | Flame | Strike | 13 / 0 | 60 / 61 | Flame hits Duellist 2; Strike hits Hollow adept 10 |

## What the logs say about the design

Each finding below comes with an idea for fixing it. The ideas are untested.

1. **Flame is the game at level 80.** It does 87–91% of the damage for all three loadouts.
   - Flame 3 at 7 Mana for about 23 HP is the best rate in the kit.
   - Idea: cap Flame's level-3 price at 8 instead of 7, or keep it and give each loadout a second damage spell the AI actually casts.
2. **Long Mend wars.** Mend 3 heals about 18 for the price of a 23-HP Flame, so a Mend answers a Flame almost one for one. The middle of the fight drags.
   - This is the 85% rule of §2 working as written.
   - If fights feel long in play, the lever is Mend 3 at 16 instead of 17 base, not a change to Flame.
3. **Eclipse is a near-free stall.**
   - It covers two exchanges, yet the adept recasts it while it's still up, and its Mana returns as flux.
   - It also resets the decision-on-points clock, which only counts exchanges with no Mana spent.
   - Idea: forbid recasting Eclipse while it's active, or make its Mana not count as flux.
4. **Shadowstep → Torment is the strongest combo found.** The opponent must keep acting to fight back, and every action costs 9 HP.
   - It's fair while Underground tough sits at 63% overall (§11).
   - If it tops the tables again, the lever is that Shadowstep breaks on casting Torment, like it does on Reclaim.
5. **Spells nobody casts at level 80:** Siphon, Glamour, Tailwind and Index (and Moonwell, Starlight and the constructs in the other loadouts).
   - Glamour and Index need observers or a negotiation, so that's expected.
   - Siphon and Tailwind are the AI horizon problem: the plan for a deeper AI (Stage 3, selective extensions) is what would show whether they are weak or only unseen.
6. **Reflect is rare but decisive.** It was used in 9% of the Duellist's answers to Flame, and in the example fight its 22 returned HP was the margin. Its 16-Mana price looks right.

# Part 2: the weakest loadouts

Same setup as above: level 80, 48 fights each as side 0, the F4 engine, fallible AI on both sides.

| Loadout | Matrix overall (all levels) | Level 80 here | Median length | Best matchups at 80 | Worst at 80 |
|---|---|---|---|---|---|
| Healer | 36% | **12–36** | 16 | Underground tough 4–2, Hollow adept 3–3 | Duellist 0–6, Showman 0–6 |
| Brawler | 42% | **22–26** | 22 | Healer 6–0, Scholar and Prefect 4–2 | Duellist 0–6, Illusionist 1–5 |
| Illusionist | 47% | **25–23** | 20 | Scholar and Healer 6–0, Prefect 5–1 | Duellist and Hollow adept 0–6, Showman 1–5 |

## What the three have in common

**They lose by running out of Mana.** One exchange before a loss, the loser's median ready Mana is 3, for all three. In their wins it is 19–29.

**Their losses are set early.** In the Healer's losses it is already 19 HP behind after 6 exchanges, and 25 behind after 12. In its wins it is about level.

**Their wins are Flame races; their losses are everything else:**

| Loadout | Flame share in wins | Flame share in losses | What replaces Flame in losses |
|---|---|---|---|
| Healer | 48% | 18% | Ward (36%) and Mend (21%) |
| Brawler | 46% | 21% | Strike, Haste bundles, Mend |
| Illusionist | 60% | 25% | Mend, Strike, Guard |

The share is partly an effect, not a cause: a side that falls behind gets pushed into defending. But the per-exchange numbers below show some of these choices really are losing ones.

**Some actions lose HP every time they're led.** Here "swing" is my HP change minus theirs in that exchange, averaged over every time the loadout led with that action:

| Leading with | Healer | Brawler | Illusionist |
|---|---|---|---|
| Flame | +1.8 | +2.4 | +0.7 |
| Mend | −0.5 | +0.2 | −1.8 |
| Ward | −2.3 | −1.8 | −2.3 |
| Strike | −6.1 | −4.7 | −6.0 |
| Guard | −3.4 | −7.8 | −8.3 |
| Reclaim | −8.4 | **−17.5** | **−17.6** |
| Bramble | −11.4 | | |
| Distil | **−34.4** | | |

**Leading Reclaim is the commonest bad habit.** The opponent sees it and Flames for free. Reclaim as an answer to their Guard or Ward instead.

Answering is a different matter: Ward, Brace or Shadowstep against a Flame swings about 0, and Flame against their Reclaim swings +20.

## 4. Healer

**Kit at 80:** Ward, Flame 3, Mend 3, Foresight 3, Haste 3, Glamour 3, Bramble, Distil. Its hidden draws (Animate, Moonwell) didn't come up in these kits.

**Record:** 12 won, 36 lost. Median 16 exchanges, the shortest of any loadout.

### How it plays now

It's a turtle.
- **Ward is its first action** (31%), and 74% of its answers to a Flame.
- **Mend is its favourite lead** (30% of its leads).
- **It deals 74 damage a fight and takes 113.** The Duellist deals 148 and takes 99. Its Flame hits as hard as anyone's (about 20), but it lands less than half as many as the Duellist.
- **Haste and Glamour were never cast,** and Foresight only 3 times. In practice it fights with Ward, Flame, Mend, Bramble and Distil.

### How to play it better

The logs point at four habits:
1. **Flame at least every other exchange.** Its wins are 48% Flame. A Healer that stops attacking can only lose more slowly.
2. **Mend as an answer, not a lead.** Leading Mend invites a Flame (heal about 19, take 23). Mend when they lead Strike, Guard or Reclaim.
3. **Never Distil where they can punish it.** Distil costs 12 HP, and leading it gave the opponent a free Flame: a −34 swing.
   - Distil only as an answer to a Guard, Ward or Mend lead, and only above about 40 HP.
   - Better still, Reclaim behind a Haste bundle of Guard + Reclaim, as the Duellist does. Its unused Haste 3 is exactly this tool.
4. **Bramble early, as an answer.** Its thorns return about 7 per hit (14 HP a fight), but leading it costs a free Flame. Cast it when they lead Guard or Reclaim, or in exchange 1, when everyone is setting up.

**Ward is right against a Flame lead**, a swing of +0.9. The trap is the **Ward-lock**:
- At very low HP, every action but Ward loses on the spot, so the AI Wards until its Mana runs out.
- The fight below shows it: 8 Wards in a row at 2 HP.
- The way out is to Mend before reaching that point, not after.

**Matchups.**
- **Its best is Underground tough (4–2):** the tough spends exchanges on Extraction and Mend instead of attacking, and Bramble punishes its Haste Strikes.
- **Its worst are Duellist and Showman (0–6):** both out-Flame it from exchange 1.

### A fight: Healer loses to Duellist in 15

- **1–5:** they trade Flames. The Healer then leads Mend twice into Flames (+19 −23 each time) and Wards the Duellist's other Flames.
- **6:** at 38 HP the Healer leads **Distil**: −12 HP, plus a Flame for 23. It's on 2 HP.
- **7–14: the Ward-lock.** Eight Wards in a row. The Duellist doesn't even need to attack: it Mends to full and Reclaims 41 Mana.
- **15:** the Healer, out of Mana, has to Reclaim, and a Flame ends it.

| Ex | Leads | Healer | Duellist | HP (Healer / Duellist) | Mana | What happened |
|---|---|---|---|---|---|---|
| 1 | Duellist | Flame | Flame | 47 / 48 | 64 / 65 | Flame hits Duellist 22; Flame hits Healer 23 |
| 2 | Healer | Mend | Flame | 43 / 48 | 57 / 58 | Flame hits Healer 23 |
| 3 | Duellist | Ward | Flame | 43 / 48 | 50 / 51 |  |
| 4 | Healer | Mend | Flame | 38 / 48 | 43 / 44 | Flame hits Healer 23 |
| 5 | Duellist | Ward | Flame | 38 / 48 | 36 / 37 |  |
| 6 | Healer | Distil | Flame | 2 / 48 | 62 / 30 | Flame hits Healer 23 |
| 7 | Duellist | Ward | Flame | 2 / 48 | 55 / 23 |  |
| 8 | Healer | Ward | Foresight | 2 / 48 | 48 / 17 |  |
| 9 | Healer | Ward | Mend | 2 / 66 | 41 / 10 |  |
| 10 | Healer | Ward | Strike | 2 / 66 | 34 / 10 |  |
| 11 | Healer | Ward | Reclaim | 2 / 66 | 27 / 51 | Duellist reclaims 41 |
| 12 | Healer | Ward | Mend | 2 / 70 | 20 / 44 |  |
| 13 | Healer | Ward | Reclaim | 2 / 70 | 13 / 49 | Duellist reclaims 5 |
| 14 | Healer | Ward | Strike | 2 / 70 | 6 / 49 |  |
| 15 | Duellist | Reclaim | Flame | 0 / 70 | 70 / 67 | Flame hits Healer 2 |

### A fight: Healer beats Underground tough in 13

- **1–3:** the Healer opens with **Bramble**. Its thorns hit the tough twice for 7 while they trade Flames.
- **4–6:** the tough Extracts and then Mends. **The Healer Flames three times in a row** (22 each), taking the tough from 34 to 4.
- **7–12:** a second Bramble. The Healer Reclaims 37. The tough's Haste Strikes into Bramble cost it 5–7 per exchange.
- **13:** a Flame for the kill.

The winning Healer is an attacking Healer: 6 Flames and 3 Brambles in 13 exchanges, and only one Mend.

| Ex | Leads | Healer | Underground tough | HP (Healer / Underground tough) | Mana | What happened |
|---|---|---|---|---|---|---|
| 1 | Healer | Bramble | Flame | 49 / 63 | 61 / 65 | Flame hits Healer 21; Bramble hits Underground tough 7 |
| 2 | Underground tough | Ward | Flame | 49 / 56 | 54 / 58 | Bramble hits Underground tough 7 |
| 3 | Healer | Flame | Flame | 28 / 34 | 47 / 51 | Flame hits Underground tough 22; Bramble ends; Flame hits Healer 21 |
| 4 | Underground tough | Flame | Extraction | 28 / 12 | 30 / 53 | Flame hits Underground tough 22 |
| 5 | Healer | Flame | Mend | 28 / 8 | 23 / 46 | Flame hits Underground tough 22 |
| 6 | Underground tough | Flame | Mend | 28 / 4 | 16 / 39 | Flame hits Underground tough 22 |
| 7 | Healer | Bramble | Mend | 28 / 15 | 6 / 32 | Bramble hits Underground tough 7 |
| 8 | Underground tough | Reclaim | Mend | 28 / 26 | 43 / 25 | Healer reclaims 37; Bramble hits Underground tough 7 |
| 9 | Healer | Flame | Shadowstep | 28 / 26 | 36 / 7 |  |
| 10 | Underground tough | Mend | Haste | 47 / 26 | 29 / 2 | Bramble ends |
| 11 | Healer | Bramble | Haste: Strike + Strike | 29 / 19 | 19 / 2 | Strike hits Healer 9; Strike hits Healer 9; Bramble hits Underground tough 7 |
| 12 | Underground tough | Guard | Haste: Strike + Guard | 29 / 14 | 19 / 2 | Bramble hits Underground tough 5 |
| 13 | Healer | Flame | Haste: Strike + Reclaim | 20 / 0 | 63 / 68 | Flame hits Underground tough 14; Bramble ends; Strike hits Healer 9 |

### Design notes

- **At 80 the Healer is still the weakest loadout** (12–36), and only some of that is play. The rest is the kit:
  - it has no Shadowstep and no second damage spell (Bramble only reflects);
  - its Haste and Glamour are dead slots in a fight without observers.
- **Levers already named in the economy doc's §11:**
  - Animate before Moonwell at 70, so it gets a real second attacker;
  - or Mend at rank +1 for the Healer, as a prodigy.
- **A new one: a Ward-lock rule.** Ward at, say, half price when you're below 10% HP would break the lock. But that is an AI horizon problem as much as a rule problem, so try the deeper search first (see the search plan) before changing the rule.

## 5. Brawler

**Kit at 80:** Ward, Flame 3, Mend 3, Haste 3, Shadowstep 3, Foresight 3, Tailwind, Brace.

**Record:** 22 won, 26 lost. Median 22 exchanges.

### How it plays now

It's the physical fighter, and it plays like one:
- **Strike is 11% of its actions, plus Haste bundles at 7%:** the most physical play of any loadout here.
- **Strike does 19% of its damage**, against 11% for the Duellist.

But a Strike hits for about 10 and a Flame for about 20, for the same action. Vigor barely helps:
- The flatter level curve (§11, F2) gives the Brawler's +12 vigor only about 3% more Strike damage.
- **Tailwind, its own extra spell, was never cast.** Its bonus needs consecutive Strikes, and any other action ends it. The AI never found three Strikes in a row worth more than a Flame.

### How to play it better

1. **Flame first, like everyone else.** Its wins are 46% Flame, its losses 21%.
2. **Strike only where it beats a Flame:**
   - when you're out of Mana;
   - **Haste: Strike + Strike against a seen Guard**;
   - to finish a target already in Strike range.
3. **Its defensive answers are good; use them.** Against a Flame lead, Ward (31%), Brace (19%) and Shadowstep (18%) all swing about 0. Brace also leaves reduction for the next three hits.
4. **Never lead Reclaim** (−17.5). Reclaim when they Ward (40% of its answers to Ward), or inside Haste: Guard + Reclaim.
5. **Flame their Guard.** Flame against a seen Guard swings +15.

**Matchups.**
- **It beats Healer 6–0:** it out-attacks it.
- **It loses to Duellist 0–6 and Illusionist 1–5:** both Flame more efficiently and don't care about its Guard.

### A fight: Brawler beats Underground tough in 13

- **1–4:** the tough opens with its combo, **Shadowstep then Torment**, and the Brawler's first Flame passes through. The tough Torments twice: 9 HP from every Brawler action for six exchanges.
- **5–7:** the turn. The tough leads Torment, then **Extraction** twice. The Brawler answers each with a Flame, and the tough falls from 70 to 4.
- **8–10:** both recover. The Brawler Reclaims 34, then Flames the tough to 0.
- **11–13:** **Rime** catches the tough at 0 and brings it back on 12 HP. The Brawler Reclaims while it's frozen, then Flames it out.

Here the tough's habit of leading Extraction when the Brawler can answer with Flame cost it the fight: across the Brawler's logs, Flame against Extraction swings about +20.

| Ex | Leads | Brawler | Underground tough | HP (Brawler / Underground tough) | Mana | What happened |
|---|---|---|---|---|---|---|
| 1 | Brawler | Flame | Shadowstep | 70 / 70 | 65 / 54 |  |
| 2 | Underground tough | Foresight | Torment | 61 / 70 | 59 / 40 | Torment costs Brawler 9 |
| 3 | Underground tough | Mend | Guard | 61 / 70 | 52 / 40 | Torment costs Brawler 9 |
| 4 | Underground tough | Brace | Flame | 52 / 70 | 42 / 33 | Torment costs Brawler 9 |
| 5 | Underground tough | Flame | Torment | 43 / 48 | 35 / 19 | Torment costs Brawler 9; Flame hits Underground tough 22 |
| 6 | Underground tough | Flame | Extraction | 34 / 26 | 18 / 21 | Torment costs Brawler 9; Flame hits Underground tough 22 |
| 7 | Underground tough | Flame | Extraction | 25 / 4 | 1 / 23 | Torment costs Brawler 9; Flame hits Underground tough 22 |
| 8 | Underground tough | Reclaim | Mend | 25 / 22 | 35 / 16 | Brawler reclaims 34 |
| 9 | Brawler | Flame | Ward | 25 / 22 | 28 / 9 |  |
| 10 | Underground tough | Flame | Extraction | 25 / 0 | 12 / 10 | Flame hits Underground tough 22 |
| 11 | Brawler | Flame | Rime | 25 / 12 | 5 / 6 | Rime freezes Underground tough; Flame hits Underground tough 0 |
| 12 | Underground tough | Reclaim | (frozen) | 25 / 12 | 19 / 6 | Brawler reclaims 14 |
| 13 | Brawler | Flame | Reclaim | 25 / 0 | 60 / 71 | Flame hits Underground tough 12 |

### Design notes

- **The Brawler's identity doesn't pay at 80.** Its physical skills give it almost nothing over a caster, and its physical spell (Tailwind) is never chosen.
- Candidate levers:
  - **Tailwind no longer ends on a non-Strike action.** It would still need Strikes to pay, but no longer needs all of them in a row.
  - **Strike scales with vigor more steeply than spells do with their skills:** for example `0.85 + 0.005 × vigor`, a factor of 1.31 at vigor 92 instead of 1.13. The Brawler's Strike then hits about 11 instead of 10. That moves Strike's value, so re-check §3's turn price.

## 6. Illusionist

**Kit at 80:** Ward, Flame 3, Glamour 3, Shadowstep 3, Foresight 3, Mend 3, Rapport, Reflect.

**Record:** 25 won, 23 lost. Median 20 exchanges.
- At level 80 it is about even, but its matchups are all-or-nothing.
- It sweeps Scholar and Healer, 6–0.
- It loses every fight to Duellist and Hollow adept, 0–6 each.

### How it plays now

A plain Flame caster:
- **Flame 40%, Mend 18%, Strike 12%.** It deals 153 damage a fight, the most of any loadout here, and takes 118.
- **Its signature spells are idle.** Glamour and Rapport need observers, and these fights have none. Reflect was cast 5 times in 48 fights, and Shadowstep 10.
- **Its wins are short races** (17 exchanges, 60% Flame). **Its losses are long and starved** (25 exchanges, Mana down to single digits).

### How to play it better

1. **Race.** The most common opening is four Flames, and that's right for it. Get ahead by exchange 6: its wins are 11 HP up by then, its losses level.
2. **Foresight when they Ward** (a third of its answers to Ward), so the next Flame lands harder.
3. **Never lead Guard (−8.3) or Reclaim (−17.6).** Reclaim when they Guard or Ward.
4. **Use Reflect** when you can afford 16 Mana against a Flame lead. The AI almost never does, but it's the one tool that wins a Flame race outright.
5. **Against Hollow adept** (0–6), its Seal is the killer: Seal wipes your flux, so a Reclaim returns almost nothing. Reclaim small and often, before your flux gets big enough to be worth Sealing. Don't spend Mana into Eclipse.

### A fight: Illusionist loses to Hollow adept in 21

- **1–7:** an even start. The Illusionist Flames, Mends and Strikes. The adept **Seals** at exchange 6. The Illusionist's Foresighted Flame lands for 26 (57 → 31).
- **8–14:** the **Eclipse wall**.
  - The adept casts Eclipse four times. The Illusionist won't attack into it: it Mends to full and Reclaims.
  - But each Reclaim returns only 9: Seal has already taken its flux.
  - By exchange 15 the Illusionist has 5 Mana.
- **15–21:** the adept Seals again and Flames four times in a row. The Illusionist, stuck on 5 Mana, can only Guard and Strike, and dies from 70 HP in six exchanges.

| Ex | Leads | Illusionist | Hollow adept | HP (Illusionist / Hollow adept) | Mana | What happened |
|---|---|---|---|---|---|---|
| 1 | Illusionist | Flame | Flame | 48 / 48 | 65 / 65 | Flame hits Hollow adept 22; Flame hits Illusionist 22 |
| 2 | Hollow adept | Strike | Mend | 48 / 57 | 65 / 58 | Strike hits Hollow adept 10 |
| 3 | Illusionist | Mend | Flame | 44 / 57 | 58 / 51 | Flame hits Illusionist 22 |
| 4 | Hollow adept | Mend | Strike | 52 / 57 | 51 / 51 | Strike hits Illusionist 10 |
| 5 | Illusionist | Mend | Flame | 48 / 57 | 44 / 44 | Flame hits Illusionist 22 |
| 6 | Hollow adept | Foresight | Seal | 48 / 57 | 38 / 36 |  |
| 7 | Hollow adept | Flame | Reclaim | 48 / 31 | 31 / 60 | Flame hits Hollow adept 26; Hollow adept reclaims 24 |
| 8 | Hollow adept | Mend | Eclipse | 66 / 31 | 24 / 54 |  |
| 9 | Hollow adept | Reclaim | Mend | 66 / 49 | 33 / 47 | Illusionist reclaims 9 |
| 10 | Hollow adept | Foresight | Eclipse | 66 / 49 | 27 / 41 |  |
| 11 | Hollow adept | Mend | Mend | 70 / 67 | 20 / 34 |  |
| 12 | Hollow adept | Reclaim | Eclipse | 70 / 67 | 29 / 28 | Illusionist reclaims 9 |
| 13 | Hollow adept | Guard | Eclipse | 70 / 67 | 29 / 22 |  |
| 14 | Hollow adept | Shadowstep | Foresight | 70 / 67 | 11 / 16 |  |
| 15 | Illusionist | Foresight | Reclaim | 70 / 67 | 5 / 45 | Hollow adept reclaims 29 |
| 16 | Hollow adept | Strike | Seal | 70 / 53 | 5 / 37 | Strike hits Hollow adept 14 |
| 17 | Illusionist | Guard | Flame | 55 / 53 | 5 / 30 | Flame hits Illusionist 15 |
| 18 | Hollow adept | Strike | Flame | 33 / 43 | 5 / 23 | Strike hits Hollow adept 10; Flame hits Illusionist 22 |
| 19 | Illusionist | Guard | Flame | 18 / 43 | 5 / 16 | Flame hits Illusionist 15 |
| 20 | Hollow adept | Guard | Flame | 3 / 43 | 5 / 9 | Flame hits Illusionist 15 |
| 21 | Hollow adept | Strike | Flame | 0 / 33 | 58 / 63 | Strike hits Hollow adept 10; Flame hits Illusionist 3 |

### Design notes

- **In an unwatched fight, three of its eight slots are dead** (Glamour, Rapport, and Reflect in practice). It holds its own anyway because its Flame volume is the highest of the six.
- **With observers it may be a different loadout.** No fight here had observers, so this is untested; that panel is worth running before changing anything.
- **The 0–6 against Hollow adept** is the Seal + Eclipse lock again (see design note 3 in Part 1). Fixing Eclipse recasting would help the Illusionist most.

## What Part 2 adds to the design list

1. **Leading Reclaim is a trap for everyone** (−8 to −18 per lead). That's the rule working: Reclaim is meant to be punishable. But the weaker loadouts fall into it most, because they rarely use a safe Reclaim: Haste's Guard + Reclaim, or Reclaim behind a Ward or Shadowstep. A UI hint ("they can see this") may matter more than a number change.
2. **Distil is priced to be punished.** At 12 HP plus a free Flame for the opponent, it's the worst lead in the logs. Either it gets cheaper (8 HP), or it becomes a free action that doesn't use the exchange. Test the cheaper version first: the free action is a rule change.
3. **The flatter level curve flattened the Brawler too.** Vigor +12 is now worth about 3% on Strike. Strike, or Tailwind, needs a steeper slope of its own.
4. **Dead slots decide the weak loadouts:**
   - Healer: Haste and Glamour;
   - Brawler: Tailwind;
   - Illusionist: Glamour, Rapport and Reflect.

   Two causes: observer-only spells, and spells that pay off beyond the AI's 3-exchange horizon. The deeper search (the other agent's alpha-beta-2, which I have started porting into the F4 fork) is the way to tell which spells are weak and which are just unseen.

# Part 3: how strategies change with a deeper AI (D4) and a scarcer economy (V4)

Setup, from `spells-v2-economy.md` §12:
- **Engine:** the F4 engine with the optimized search.
- **D4:** a complete depth-4 search, one exchange deeper than §11.
- **V4:** the same AI with **Mana costs ×1.5 and max HP ×0.5**.

Four loadouts were traced at level 80. Each played 32 fights as side 0: the 8 other loadouts × 2 commit orders × 2 seeds.

| Loadout | D4 record | D4 median length | V4 record | V4 median length |
|---|---|---:|---|---:|
| Underground tough | **31–1** | 15 | **27–5** | 11 |
| Hollow adept | 25–7 | 23 | 21–10–1 | 16 |
| Duellist | 20–12 | 29 | 18–14 | 14 |
| Scholar | 8–24 | 25 | 10–22 | 14 |

## Underground tough: Mana denial in D4, Torment in V4

**D4: starve them, then bleed them.**
- Its plays: Flame 31%, **Extraction 16%** (2.7 a fight), **Torment 15%**.
- Torment costs the opponent about 65 HP a fight, as much as all its Flames together (68).
- Its opponents are down to 34 Mana by exchange 6; other loadouts' opponents still have 43–46.
- Against a Flame it Wards (35%) or Shadowsteps (30%). Shadowstep followed by Torment appeared 19 times.
- **A deeper AI Extracts much more readily, and pays for it in HP.**

**Fight: Underground tough beats Duellist in 22 (D4).**
- **1–5:** it opens with Torment, then Extracts four times in a row. The Duellist's Mana falls from 72 to 12, and the tough sinks to 4 HP doing it.
- **6–16:** the Duellist, with 2–7 Mana, can't Flame often enough to finish it. The tough Mends back up.
- **17–19:** a Reclaim of 65 refills the tough while it hangs on under 1 HP. Then Shadowstep and a second Torment.
- **20–22:** Torment ticks and two Flames end it.

| Ex | Leads | Underground tough | Duellist | HP (Underground tough / Duellist) | Mana | What happened |
|---|---|---|---|---|---|---|
| 1 | Duellist | Torment | Strike | 60 / 61 | 58 / 72 | Torment costs Duellist 9; Strike hits Underground tough 10 |
| 2 | Underground tough | Extraction | Flame | 37 / 52 | 60 / 55 | Torment costs Duellist 9; Flame hits Underground tough 23 |
| 3 | Duellist | Extraction | Mend | 37 / 61 | 62 / 38 | Torment costs Duellist 9 |
| 4 | Underground tough | Extraction | Flame | 14 / 61 | 63 / 22 | Flame hits Underground tough 23 |
| 5 | Duellist | Extraction | Strike | 4 / 61 | 65 / 12 | Strike hits Underground tough 10 |
| 6 | Underground tough | Shadowstep | Mend | 4 / 70 | 47 / 5 |  |
| 7 | Duellist | Mend | Reclaim | 22 / 70 | 40 / 24 | Duellist reclaims 19 |
| 8 | Underground tough | Mend | Reclaim | 40 / 70 | 33 / 24 |  |
| 9 | Duellist | Extraction | Flame | 17 / 70 | 35 / 7 | Flame hits Underground tough 23 |
| 10 | Underground tough | Flame | Strike | 7 / 48 | 28 / 7 | Flame hits Duellist 22; Strike hits Underground tough 10 |
| 11 | Duellist | Mend | Strike | 15 / 48 | 21 / 7 | Strike hits Underground tough 10 |
| 12 | Underground tough | Flame | Haste | 15 / 26 | 14 / 2 | Flame hits Duellist 22 |
| 13 | Duellist | Guard | Haste: Strike + Strike | 15 / 26 | 14 / 2 |  |
| 14 | Underground tough | Guard | Haste: Guard + Reclaim | 15 / 26 | 14 / 10 | Duellist reclaims 8 |
| 15 | Duellist | Guard | Haste: Strike + Strike | 15 / 26 | 14 / 10 |  |
| 16 | Underground tough | Mend | Flame | 10 / 26 | 7 / 3 | Flame hits Underground tough 23 |
| 17 | Duellist | Reclaim | Strike | 0 / 26 | 72 / 3 | Strike hits Underground tough 10; Underground tough reclaims 65 |
| 18 | Underground tough | Shadowstep | Reclaim | 0 / 26 | 54 / 7 | Duellist reclaims 5 |
| 19 | Duellist | Torment | Mend | 0 / 35 | 40 / 0 | Torment costs Duellist 9 |
| 20 | Underground tough | Mend | Reclaim | 18 / 26 | 33 / 5 | Torment costs Duellist 9; Duellist reclaims 5 |
| 21 | Duellist | Flame | Guard | 18 / 2 | 26 / 5 | Torment costs Duellist 9; Flame hits Duellist 15 |
| 22 | Underground tough | Flame | Guard | 18 / 0 | 68 / 58 | Flame hits Duellist 2 |

**V4: Torment is the whole plan.**
- **Extraction almost disappears** (0.4 a fight): at 1.5× its cost, 12 Mana for 9 stolen is a loss.
- **Torment rises to 19% of its actions and 24% of its leads.** Its HP cost isn't scaled, so 9 HP per action is now a quarter of a 35-HP opponent.
- The standard opening is Shadowstep, then Guard or Rime, then Torment, then Strike.
- **10 of its 27 wins end on a Torment tick.**

**Fight: Underground tough beats Duellist in 11 (V4).**
- The Duellist's Foresight makes the tough commit first every exchange, and that doesn't matter: a Torment works just as well when it's seen coming.
- Three Torments (exchanges 3, 7 and 10) cost the Duellist 9 HP for every action, Guard included.
- The tough never lands a hit: its one Flame passes through Shadowstep, and its Strike hits a Guard. Torment does all the damage.

| Ex | Leads | Underground tough | Duellist | HP (Underground tough / Duellist) | Mana | What happened |
|---|---|---|---|---|---|---|
| 1 | Underground tough | Shadowstep | Foresight | 35 / 35 | 45 / 63 |  |
| 2 | Underground tough | Rime | Reclaim | 35 / 35 | 39 / 69 | Duellist reclaims 6 |
| 3 | Underground tough | Torment | Guard | 35 / 26 | 18 / 69 | Torment costs Duellist 9 |
| 4 | Underground tough | Strike | Guard | 35 / 17 | 18 / 69 | Torment costs Duellist 9 |
| 5 | Underground tough | Reclaim | Flame | 12 / 8 | 54 / 59 | Torment costs Duellist 9; Flame hits Underground tough 23; Underground tough reclaims 36 |
| 6 | Underground tough | Mend | Mend | 30 / 26 | 44 / 48 |  |
| 7 | Underground tough | Torment | Foresight | 30 / 17 | 23 / 39 | Torment costs Duellist 9 |
| 8 | Underground tough | Flame | Shadowstep | 30 / 8 | 12 / 12 | Torment costs Duellist 9 |
| 9 | Underground tough | Reclaim | Mend | 30 / 17 | 40 / 2 | Torment costs Duellist 9; Underground tough reclaims 28 |
| 10 | Underground tough | Torment | Strike | 20 / 8 | 19 / 2 | Torment costs Duellist 9; Strike hits Underground tough 10 |
| 11 | Underground tough | Reclaim | Guard | 20 / 0 | 64 / 67 | Torment costs Duellist 9 |

## Hollow adept: a Flame caster behind a wall

**D4:**
- Its plays: Flame 29%, Reclaim 13%, Mend 12%, **Eclipse 9%**, **Seal 6%** (1.6 a fight).
- **A deeper AI uses Seal properly:** 40% of its answers to a seen Reclaim are a Seal, which wipes the flux before it's collected.
- **Its answers:** against a Strike, Guard (38%) or Eclipse (19%); against a Flame, Shadowstep (32%) or Ward (22%).
- Fights are long (median 23, up to 85).
- It loses only to Underground tough (1–3), whose Torment punishes the Eclipse stall.

**Fight: Hollow adept beats Duellist in 23 (D4).**
- **7–9:** Eclipse twice stops the Duellist attacking.
- **11–19:** a Reclaim of 47 funds a Flame-and-Mend war, and a Seal at 16 cuts the Duellist's flux.
- **21–23:** the adept wins the race with three Flames.

| Ex | Leads | Hollow adept | Duellist | HP (Hollow adept / Duellist) | Mana | What happened |
|---|---|---|---|---|---|---|
| 1 | Hollow adept | Strike | Foresight | 70 / 60 | 72 / 66 | Strike hits Duellist 10 |
| 2 | Hollow adept | Foresight | Strike | 56 / 60 | 66 / 66 | Strike hits Hollow adept 14 |
| 3 | Hollow adept | Mend | Flame | 47 / 60 | 59 / 59 | Flame hits Hollow adept 23 |
| 4 | Duellist | Shadowstep | Flame | 47 / 60 | 41 / 52 |  |
| 5 | Hollow adept | Mend | Reclaim | 66 / 60 | 34 / 65 | Duellist reclaims 13 |
| 6 | Duellist | Flame | Foresight | 66 / 38 | 27 / 59 | Flame hits Duellist 22 |
| 7 | Hollow adept | Eclipse | Mend | 66 / 56 | 21 / 52 |  |
| 8 | Duellist | Eclipse | Guard | 66 / 56 | 15 / 52 |  |
| 9 | Hollow adept | Foresight | Mend | 66 / 70 | 9 / 45 |  |
| 10 | Duellist | Flame | Guard | 66 / 52 | 2 / 45 | Flame hits Duellist 18 |
| 11 | Hollow adept | Reclaim | Flame | 43 / 52 | 49 / 38 | Flame hits Hollow adept 23; Hollow adept reclaims 47 |
| 12 | Duellist | Flame | Foresight | 43 / 30 | 42 / 32 | Flame hits Duellist 22 |
| 13 | Hollow adept | Mend | Strike | 47 / 30 | 35 / 32 | Strike hits Hollow adept 14 |
| 14 | Duellist | Flame | Mend | 47 / 26 | 28 / 25 | Flame hits Duellist 22 |
| 15 | Hollow adept | Flame | Ward | 47 / 26 | 21 / 18 |  |
| 16 | Hollow adept | Seal | Strike | 37 / 26 | 13 / 18 | Strike hits Hollow adept 10 |
| 17 | Hollow adept | Reclaim | Flame | 14 / 26 | 37 / 11 | Flame hits Hollow adept 23; Hollow adept reclaims 24 |
| 18 | Hollow adept | Mend | Flame | 9 / 26 | 30 / 4 | Flame hits Hollow adept 23 |
| 19 | Hollow adept | Mend | Reclaim | 28 / 26 | 23 / 14 | Duellist reclaims 9 |
| 20 | Duellist | Reclaim | Brace | 28 / 26 | 32 / 4 | Hollow adept reclaims 9 |
| 21 | Hollow adept | Flame | Reclaim | 28 / 7 | 25 / 10 | Flame hits Duellist 19; Duellist reclaims 7 |
| 22 | Duellist | Flame | Mend | 28 / 5 | 18 / 3 | Flame hits Duellist 20 |
| 23 | Hollow adept | Flame | Guard | 28 / 0 | 62 / 59 | Flame hits Duellist 5 |

**V4:**
- **Same plan, less Seal:** 0.6 a fight, as Mana is dearer.
- **More Guard and Ward,** and Guard is its first choice below 35% HP.
- **Even with Duellist (2–2)** instead of 4–0.

## Duellist: the honest fencer, slower to finish

**D4:**
- Its plays: Flame 34%, Mend 16%, Reclaim 14%, Strike 11%, **Foresight 7%** (4% in the depth-3 logs).
- **Its answers to a Flame:** Guard (28%), Ward (26%), Brace (12%), Reflect (9%).
- It has the longest fights (median 29).
- It loses to Showman 0–4, and to Underground tough and Hollow adept 1–3.

**V4: Strike becomes a real lead** (25% of its leads), since a 10-point Strike is now 29% of an opponent's HP.
- Fights shrink to a median of 14.
- It sweeps Healer and Brawler 4–0, but can't touch Underground tough (0–4).

## Scholar: a defensive caster that can't keep up

**D4:**
- **Mend is its main lead** (28% of its leads), and Starlight is rarely cast.
- It deals 114 damage a fight and takes 142.
- **It loses every fight to Duellist, Underground tough and Hollow adept** (0–4 each).

**V4:** Strike (28% of its leads) and Guard replace Mend, but the result is the same.

**Fight: Scholar loses to Underground tough in 12 (V4).**
- Three Torments (exchanges 2, 8 and 11) cost it 72 HP in ticks. Its Mends can't keep up, and it lands two Strikes in all.

| Ex | Leads | Scholar | Underground tough | HP (Scholar / Underground tough) | Mana | What happened |
|---|---|---|---|---|---|---|
| 1 | Scholar | Flame | Shadowstep | 35 / 35 | 61 / 45 |  |
| 2 | Underground tough | Foresight | Torment | 26 / 35 | 52 / 24 | Torment costs Scholar 9 |
| 3 | Underground tough | Ward | Flame | 17 / 35 | 41 / 14 | Torment costs Scholar 9 |
| 4 | Underground tough | Mend | Reclaim | 26 / 35 | 31 / 53 | Torment costs Scholar 9; Underground tough reclaims 39 |
| 5 | Underground tough | Reclaim | Strike | 16 / 35 | 58 / 53 | Strike hits Scholar 10; Scholar reclaims 27 |
| 6 | Underground tough | Mend | Strike | 24 / 35 | 47 / 53 | Strike hits Scholar 10 |
| 7 | Underground tough | Ward | Flame | 24 / 35 | 37 / 42 |  |
| 8 | Underground tough | Reclaim | Torment | 15 / 35 | 51 / 21 | Torment costs Scholar 9; Scholar reclaims 14 |
| 9 | Scholar | Shadowstep | Extraction | 6 / 35 | 14 / 19 | Torment costs Scholar 9 |
| 10 | Underground tough | Mend | Reclaim | 16 / 35 | 3 / 48 | Torment costs Scholar 9; Underground tough reclaims 29 |
| 11 | Scholar | Strike | Torment | 7 / 25 | 3 / 27 | Torment costs Scholar 9; Strike hits Underground tough 10 |
| 12 | Underground tough | Strike | Flame | 0 / 15 | 62 / 64 | Torment costs Scholar 9; Strike hits Underground tough 10 |

## What changes between D4 and V4

1. **The best loadout's tool changes, but it stays on top.**
   - D4's Underground tough wins by Extraction.
   - V4 makes Extraction too dear and makes Torment relatively twice as strong.
   - Halving HP needs Torment's price per action (and any other fixed HP amount) halved with it.
2. **V4 fights are short (11–16 exchanges) and more defensive:** Guard and Ward rise, and Mend falls.
3. **Seal and Eclipse fade in V4** because of the 1.5× Mana price, which is what brings Hollow adept down.
4. **Foresight is a double-edged spell:** making the opponent commit first is useless against a Torment that's as good seen as unseen.
