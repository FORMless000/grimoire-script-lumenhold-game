# Crux: win rate by level with level-by-level kits and the new Rapport

Every encounter (61) at its own level, with the player at that level, 10 below and 20 below (at least level 1), with each of the 10 kits: 1830 cells.
- **Engine** (the smart AI): its search's forecast at the first move (depth 4), averaged over 4 shuffles a cell; **played**: 2 meetings a cell played out by it.
- **Bot** (the usual player): the smart bot over 16 meetings a cell. A win scores 1, a partial deal ½.

## Findings (against `sim-gaps-2026-11-03.md`, the preset kits and the old Rapport)

What changed: a kit at every level, as the duels build it (spells at their level gates, course ranks by the loadout's weighted-random curriculum, skills jittered by level), in place of the nearest of three presets; Rapport now trades 1 of their Patience for 2 Suspicion cleared (was +2 Agreement once a meeting).

| | Before: engine played · bot | Now |
|---|---|---|
| Same level | 83% · 60% | 87% · 63% |
| You 10 below | 65% · 39% | 66% · 37% |
| You 20 below | 58% · 31% | 46% · 22% |

- **The curve no longer zigzags.** The 36–45 jump (a player handed the level-50 kit early) and the 46–55 cliff are gone; at the same level the engine wins 78–93% and the bot 59–73% everywhere but the 56–65 encounters (61% · 45%), which stay the hardest.
- **Twenty levels below is harsher now** (bot 31% → 22%): a low-level player has a really low-level kit instead of the level-20 floor. Ten below costs about 21–26 points, the next ten about another 15–20.
- **Rapport is no longer overpowered.** It was worth 19 points to the bot; now leaving it out *helps* the bot by 4 (its rule of thumb spends Patience it needs), and the engine casts it in a quarter of meetings. The Illusionist went from best kit (+7.4) to average (+0.7).
- **No kit dominates.** The kits sit within 13 points (Scholar +5.8 to Sailor −7.5). Scholar leads on Glamour, Foresight, Starlight from 30 and Index/Quickquill.
- **The three kits without Foresight early are weak at low levels**: Brawler, Sailor and Underground tough win 23% at player levels 1–25, against 33–39% for the others; from 26 up they catch up. Foresight is worth 13 points to the bot at levels 1–25.
- **Starlight is the one to watch.** The engine casts it in every meeting it holds it and rates it +19 (the bot +6); the four kits with it are all in the top half. Not yet clearly overpowered.
- **Still dead weight**: Lodestar, Seal, Brace, Reflect, Ward (and the exits Shadowstep and Flame). The engine still misreads Ward (−21 when left out), an eval artefact.

## Overall

| | Engine forecast | Engine played | Smart bot |
|---|---|---|---|
| Same level | 76% | 87% | 63% |
| You 10 below | 57% | 66% | 37% |
| You 20 below | 46% | 46% | 22% |

## The curve: win rate by the encounter's level

Engine played · smart bot (engine forecast in brackets). The player is at the encounter's level, or 10 or 20 below it.

| Encounter level | Encounters | Same level | You 10 below | You 20 below |
|---|---|---|---|---|
| 1–15 | 2 | 78% · 73% (71%) | 51% · 28% (44%) | 46% · 27% (43%) |
| 16–25 | 13 | 93% · 65% (75%) | 78% · 41% (57%) | 54% · 28% (48%) |
| 26–35 | 23 | 92% · 65% (74%) | 57% · 33% (50%) | 39% · 16% (39%) |
| 36–45 | 10 | 86% · 59% (77%) | 73% · 37% (58%) | 44% · 18% (45%) |
| 46–55 | 5 | 80% · 60% (80%) | 70% · 43% (68%) | 56% · 30% (55%) |
| 56–65 | 3 | 61% · 45% (78%) | 50% · 31% (71%) | 38% · 17% (51%) |
| 66–75 | 5 | 79% · 61% (80%) | 75% · 51% (73%) | 56% · 35% (63%) |

## The same curve by the player's level

Smart bot · engine played, by the player's own level (1–25, 26–50, 51 and up).

| Your level | Same level | You 10 below | You 20 below |
|---|---|---|---|
| 1–25 | 66% · 91% (n 150) | 35% · 64% (n 380) | 20% · 44% (n 480) |
| 26–50 | 63% · 90% (n 340) | 39% · 71% (n 160) | 28% · 51% (n 110) |
| 51+ | 56% · 74% (n 120) | 44% · 68% (n 70) | 33% · 59% (n 20) |

## Kits

Smart bot · engine forecast, over every encounter. *Δ* is the kit's bot score minus the average kit's.

| Kit | Same level | You 10 below | You 20 below | Δ bot, all gaps |
|---|---|---|---|---|
| Scholar | 70% · 85% | 44% · 64% | 26% · 52% | +5.8 |
| Hollow adept | 66% · 74% | 43% · 56% | 27% · 45% | +4.4 |
| Prefect | 65% · 73% | 42% · 55% | 26% · 45% | +4.0 |
| Showman | 64% · 81% | 43% · 64% | 27% · 52% | +3.8 |
| Duellist | 61% · 76% | 41% · 58% | 27% · 46% | +2.5 |
| Illusionist | 63% · 79% | 37% · 61% | 23% · 48% | +0.7 |
| Healer | 60% · 72% | 37% · 54% | 20% · 43% | −1.6 |
| Underground tough | 59% · 74% | 29% · 55% | 16% · 43% | −6.0 |
| Brawler | 59% · 71% | 29% · 53% | 15% · 43% | −6.3 |
| Sailor | 59% · 72% | 27% · 54% | 14% · 42% | −7.5 |

By the player's level (smart bot, all gaps):

| Kit | 1–25 | 26–50 | 51+ |
|---|---|---|---|
| Scholar | 37% | 58% | 57% |
| Hollow adept | 38% | 55% | 50% |
| Prefect | 38% | 54% | 50% |
| Showman | 39% | 51% | 54% |
| Duellist | 38% | 48% | 55% |
| Illusionist | 34% | 50% | 50% |
| Healer | 33% | 45% | 49% |
| Underground tough | 23% | 49% | 48% |
| Brawler | 23% | 49% | 46% |
| Sailor | 23% | 47% | 40% |

## Spells

*Worth* is what leaving the spell out costs, where the kit has it: the engine's forecast (depth 3, 2 shuffles a cell) and the smart bot's score (16 meetings), in points of win rate. *Casts* are per meeting where the kit has it.

| Spell | Kits with it | Worth to engine | Worth to bot | Bot, level 1–25 / 26–50 / 51+ | Engine casts | Bot casts |
|---|---|---|---|---|---|---|
| starlight | 4 | +18.7 | +6.0 | — / +5.7 / +6.2 | 1.00 | 0.27 |
| rapport | 2 | +7.5 | −4.1 | — / −5.8 / −2.2 | 0.25 | 0.55 |
| quickquill | 1 | +4.9 | +0.3 | — / +0.4 / +0.3 | 0.80 | 0.04 |
| foresight | 10 | +3.9 | +9.7 | +13.3 / +7.6 / +5.3 | 0.63 | 0.82 |
| lodestar | 3 | +3.0 | +0.0 | — / +0.0 / +0.0 | 0.34 | 0.00 |
| glamour | 6 | +2.7 | +0.6 | +1.8 / −0.2 / +0.3 | 0.65 | 0.18 |
| haste | 10 | +1.9 | +0.6 | +2.2 / −0.3 / −0.0 | 0.45 | 0.07 |
| index | 3 | +1.0 | +0.6 | — / +1.0 / −0.1 | 0.70 | 0.22 |
| shadowstep | 10 | +0.3 | +0.0 | +0.0 / +0.0 / +0.0 | 0.00 | 0.00 |
| flame | 10 | +0.3 | +0.0 | +0.0 / +0.0 / +0.0 | 0.00 | 0.00 |
| brace | 7 | +0.0 | −0.6 | — / −0.2 / −1.0 | 0.35 | 0.03 |
| reflect | 3 | −0.4 | +0.6 | — / +0.3 / +1.3 | 0.08 | 0.09 |
| seal | 4 | −0.5 | +0.1 | — / +0.1 / +0.0 | 0.02 | 0.03 |
| ward | 10 | −21.0 | +0.3 | +0.4 / +0.1 / −0.1 | 0.01 | 0.07 |

## By encounter

Engine forecast · smart bot, averaged over the kits.

| Encounter | Level | Same level | You 10 below | You 20 below | Best · worst kit (bot, same level) |
|---|---|---|---|---|---|
| intro_wrong_tower/right | 8 | 70% · 81% | 41% · 40% | 41% · 40% | Duellist 84% · Sailor 75% |
| tobias_bullied/right | 14 | 72% · 65% | 48% · 15% | 46% · 14% | Healer 75% · Illusionist 50% |
| break_work_short_wages/left | 16 | 78% · 49% | 51% · 25% | 48% · 19% | Underground tough 63% · Showman 44% |
| ww1_hollow_whisper/right | 16 | 78% · 66% | 64% · 51% | 62% · 49% | Duellist 69% · Underground tough 56% |
| ww1_pixie_toll/right | 16 | 75% · 61% | 61% · 53% | 60% · 57% | Duellist 63% · Underground tough 56% |
| crisis_probation/left | 18 | 72% · 61% | 42% · 21% | 40% · 10% | Scholar 69% · Sailor 44% |
| tobias_bad_harvest/left | 18 | 72% · 55% | 60% · 32% | 56% · 33% | Brawler 63% · Hollow adept 50% |
| bram_father_visit/left | 20 | 74% · 71% | 63% · 57% | 48% · 22% | Duellist 81% · Underground tough 44% |
| home_market_charm_seller/left | 20 | 74% · 71% | 52% · 43% | 39% · 14% | Duellist 81% · Sailor 56% |
| ilse_kael_reunion/left | 20 | 74% · 69% | 63% · 40% | 49% · 14% | Duellist 69% · Hollow adept 69% |
| life_portrait_escape/left | 20 | 77% · 61% | 67% · 57% | 53% · 49% | Duellist 63% · Underground tough 56% |
| lyra_family_ultimatum/left | 20 | 75% · 68% | 64% · 46% | 50% · 22% | Duellist 75% · Sailor 50% |
| tide_water_spirit_race/right | 20 | 78% · 73% | 68% · 57% | 54% · 39% | Duellist 75% · Brawler 63% |
| upper_year_errands/right | 20 | 75% · 71% | 46% · 21% | 36% · 10% | Scholar 75% · Brawler 63% |
| slice_market_haggle/left | 24 | 73% · 66% | 43% · 36% | 33% · 23% | Scholar 72% · Sailor 56% |
| ledger_quill_interview/right | 26 | 70% · 53% | 32% · 3% | 24% · 3% | Scholar 56% · Sailor 50% |
| tavern_festival_room/right | 26 | 78% · 63% | 53% · 11% | 40% · 17% | Duellist 63% · Hollow adept 63% |
| aid_interview/left | 28 | 70% · 69% | 39% · 25% | 29% · 0% | Scholar 88% · Brawler 50% |
| corvin_brother/left | 28 | 77% · 75% | 66% · 48% | 51% · 28% | Illusionist 81% · Scholar 69% |
| corvin_honest_once/left | 28 | 76% · 68% | 65% · 45% | 49% · 16% | Scholar 75% · Sailor 63% |
| hs_kael_sister/left | 28 | 74% · 69% | 63% · 47% | 48% · 31% | Scholar 75% · Healer 50% |
| isolde_warning/right | 28 | 71% · 65% | 40% · 20% | 30% · 9% | Scholar 69% · Sailor 56% |
| lyra_mother_visit/left | 28 | 78% · 71% | 52% · 29% | 40% · 12% | Duellist 75% · Showman 63% |
| lyra_not_second/left | 28 | 74% · 71% | 62% · 46% | 47% · 24% | Healer 75% · Hollow adept 69% |
| nessa_headmistress_interview/left | 28 | 72% · 64% | 43% · 24% | 32% · 14% | Healer 69% · Prefect 56% |
| nessa_not_a_story/left | 28 | 66% · 56% | 31% · 8% | 23% · 6% | Scholar 81% · Brawler 38% |
| offer_pocket_almanac/right | 28 | 73% · 62% | 42% · 28% | 32% · 17% | Duellist 63% · Underground tough 56% |
| soc_breakup/left | 28 | 73% · 63% | 61% · 47% | 47% · 15% | Duellist 69% · Hollow adept 56% |
| ww2_embers_kin/right | 28 | 78% · 69% | 67% · 54% | 54% · 34% | Scholar 75% · Sailor 63% |
| ww2_grumpy_oak/right | 28 | 78% · 78% | 68% · 64% | 53% · 34% | Scholar 88% · Sailor 69% |
| hs_key_recover/family | 30 | 78% · 66% | 65% · 53% | 51% · 21% | Scholar 81% · Showman 50% |
| inc_library_fine/right | 30 | 75% · 68% | 41% · 34% | 32% · 15% | Scholar 81% · Healer 56% |
| lumen_ledger_red_ink/left | 30 | 69% · 54% | 27% · 12% | 22% · 3% | Scholar 75% · Brawler 38% |
| nessa_gossip_column/left | 30 | 71% · 57% | 29% · 13% | 23% · 3% | Hollow adept 75% · Brawler 44% |
| intern_credit_taken/left | 32 | 71% · 64% | 39% · 19% | 29% · 10% | Scholar 81% · Showman 50% |
| ww2_thornwitch/right | 32 | 80% · 64% | 67% · 49% | 56% · 34% | Scholar 69% · Brawler 56% |
| soc_two_timing/left | 34 | 77% · 65% | 62% · 42% | 49% · 16% | Scholar 75% · Underground tough 56% |
| grimsbys_last_copy/right | 35 | 75% · 61% | 43% · 29% | 34% · 18% | Scholar 75% · Healer 38% |
| company_masked/left | 36 | 80% · 64% | 57% · 36% | 46% · 16% | Showman 75% · Hollow adept 50% |
| intern_thornwick_rivalry/left | 36 | 82% · 62% | 60% · 36% | 47% · 13% | Showman 81% · Duellist 50% |
| ledger_quill_interview/left | 36 | 69% · 46% | 30% · 16% | 24% · 7% | Underground tough 56% · Showman 38% |
| tavern_festival_room/left | 36 | 79% · 73% | 56% · 42% | 44% · 12% | Duellist 75% · Sailor 69% |
| corvin_confiscation_vault/right | 38 | 75% · 57% | 63% · 48% | 49% · 19% | Sailor 75% · Underground tough 44% |
| tavern_manager_inspector/left | 40 | 76% · 51% | 45% · 18% | 30% · 4% | Scholar 63% · Prefect 44% |
| ww3_elder_oak/right | 40 | 81% · 71% | 71% · 53% | 57% · 34% | Showman 88% · Underground tough 56% |
| ww3_shadow_stag/right | 40 | 79% · 59% | 69% · 43% | 54% · 33% | Scholar 88% · Duellist 44% |
| ww3_wisps/right | 40 | 79% · 69% | 69% · 57% | 53% · 38% | Prefect 81% · Healer 50% |
| y3_interview/right | 40 | 72% · 41% | 62% · 21% | 45% · 7% | Scholar 63% · Brawler 19% |
| ww4_last_witch/right | 48 | 81% · 64% | 71% · 53% | 57% · 48% | Showman 81% · Healer 50% |
| ilse_grey_returns/talk | 52 | 81% · 69% | 69% · 51% | 55% · 23% | Prefect 81% · Showman 63% |
| renown_patron_dinner/left | 52 | 79% · 60% | 58% · 29% | 45% · 20% | Showman 94% · Prefect 31% |
| ww_spinner_meet/right | 52 | 82% · 74% | 74% · 60% | 62% · 44% | Scholar 94% · Healer 56% |
| y3_interview_practical/left | 52 | 79% · 35% | 70% · 24% | 57% · 16% | Scholar 50% · Sailor 19% |
| mir_workshop_closed/left | 60 | 79% · 59% | 71% · 40% | 41% · 13% | Illusionist 75% · Underground tough 38% |
| grade_appeal/left | 62 | 78% · 32% | 72% · 26% | 58% · 24% | Scholar 75% · Sailor 19% |
| thesis_defence/left | 62 | 77% · 46% | 70% · 26% | 56% · 13% | Scholar 75% · Brawler 28% |
| hs_night_cult/family | 70 | 79% · 68% | 71% · 59% | 61% · 34% | Healer 81% · Hollow adept 56% |
| hs_night_ilse/reach | 70 | 80% · 61% | 72% · 56% | 61% · 36% | Showman 75% · Illusionist 44% |
| hs_tunnel/talk | 70 | 81% · 73% | 74% · 53% | 63% · 40% | Duellist 88% · Scholar 56% |
| ww_outcast_table/left | 72 | 79% · 66% | 73% · 58% | 64% · 39% | Brawler 78% · Scholar 53% |
| thesis_margin_notes/right | 74 | 80% · 36% | 75% · 27% | 67% · 27% | Scholar 63% · Sailor 19% |
