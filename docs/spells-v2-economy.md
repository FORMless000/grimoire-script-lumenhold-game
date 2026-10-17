# Spell economy (spell redesign v2)

What a turn, a point of Mana and a point of healing are worth in combat, and every spell priced against that. It's a paper model: each number below is derived by hand from the rules. A fork of the combat simulator was used only to check the result (§8). The repo's simulator, roster and content are unchanged.

Spells are those of `docs/spells-v2-list.md` (revision 2). The combat rules are those of the v04 combat prototype **0.4.4** (`experiments/minigames/iterations/v04/`), which implements that list. Every "now" below means 0.4.4. Since then the repo has moved to 0.4.5, which applies the other agent's economy draft (§9); this doc doesn't measure 0.4.5.

**Contents**
1. Units (and two scale fixes)
2. The exchange rates: a turn, Mana, everything else
3. The basic numbers, now and proposed
4. Why fights stall, in these units
5. Every spell, priced
6. Rule changes the numbers need
7. Negotiation rates
8. Simulator check (forked)
9. Open questions
10. Hybrid trials (mixing this doc with the other agent's draft)
11. Class and level balance

---

## 1. Units

**Par** means a caster with every skill at 50, fighting with standard resources: **70 HP, 65 Mana** (capacity is 40 + arcana/2), flux 2/3. Every amount below is **par HP**: what a skill-50 caster actually deals, heals or absorbs. Mana is listed as paid (no ×2).

**Fix U1: one HP scale.** v04 0.4.4 multiplies damage by 1.5 per base point (scale 3 × damage multiplier 0.5) but healing, absorb, construct reductions, thresholds and HP prices by 3. So one base point of healing is worth **twice** one base point of damage:
- Mend lv1 heals 18 for 10 Mana, while Flame lv1 deals 12 for the same price.
- Brace's lingering reduction is 9/6/3 per hit, which wipes out a Strike.
- Heartwood's construct needs 45 HP of damage before it ends.

The proposal: every HP amount uses the same scale. The simplest form is that bases *are* par HP (combat scale 1, damage multiplier 1), so the numbers in this doc go straight into the roster.

**Fix U2: a gentler skill curve.** v04 scales amounts by `0.5 + skill/100`, so skill 20 gives ×0.7 and skill 80 gives ×1.3. A 20-point gap is a 20% swing on every hit, heal and Mana gain; together with the higher capacity and course ranks, level 60 beat level 40 in 34 of 36 fights. The proposal is `0.75 + skill/200`: ×0.85 at 20, ×1.15 at 80. Levels still matter through course ranks and more spells, and the economy below stays true across the whole range (§3 shows why that matters for low levels).

---

## 2. The exchange rates

### A turn is worth 9 HP

Each exchange, one side commits first in public (the **leader**) and the other answers having seen it (the **responder**). Strike and Guard are free, and Guard stops all of a Strike. The default exchange between two careful players is therefore:

> The leader Strikes; the responder Guards. Nothing happens.

Call this the **null exchange**. Striking as leader costs nothing and forces the answer: the responder must Guard or take 9.

So **any action other than Guard costs you a Strike**:
- As responder, you take the leader's Strike.
- As leader, the responder answers your non-defensive action with a free Strike.

That Strike is the price of the turn: **T = 9 HP** (Strike at par).

Two consequences:
- **Strike and Guard are exactly par:** they cost a turn and give a turn's worth.
- **A non-damaging action has to earn 9 HP before its Mana is counted.** That covers setup, buffs, channel Holds and Reclaim.

### Mana: 0.6 HP to pay, 1.1 HP to own

Paying Mana isn't losing it all: 2/3 comes back as flux, which Reclaim turns back into ready Mana at the price of one turn.

| Step | Rate | Why |
|---|---|---|
| **Ready Mana** is worth **r ≈ 1.1 HP** | design target | A full tank (65) should be worth about one HP bar (70): Mana is how fights get won, since Strikes are always Guarded. |
| **Flux** is worth **r − T/F ≈ 0.75 HP** | F ≈ 27 | Flux becomes ready Mana only through Reclaim, which costs a turn (9 HP). Reclaiming about 27 flux at a time (after spending about 40) taxes each point by 9/27 ≈ 0.33. |
| **Paying c Mana** costs **c × (r − ⅔ × 0.75) ≈ 0.6 HP per Mana** | | You lose c ready Mana and get ⅔c flux back. |

The **price of an action** follows: **P = 9 × actions + 0.6 × Mana paid**, plus any HP it costs.

Reclaim breaks even at about 15 flux. It's worth reclaiming when ready Mana is low or the turn is cheap, which is what players do.

### Other currencies

| Currency | Worth (par HP) | Source |
|---|---|---|
| **Initiative**: answering instead of leading for one exchange | **I ≈ 5** | the Flame surplus (§3) of both sides, capped by Mana |
| An **extra basic action** (a Haste bundle) | ≈ 7 per hasted exchange | the average of a safe Reclaim (9) and an extra Strike that lands half the time |
| **Renown** | ≈ 1 | `balance.grim` weights: 8 Renown (medium) × 0.8 ≈ 10 Health (medium) × 1; combat HP is Health before rebates |
| **Crowns** | ≈ ⅓ | 15 Crowns (medium) × 0.5 ≈ 5 Health |
| **Alignment** | not priced | it's a direction, not a cost (`costs.md`); forbidden spells get a power premium instead (below) |

### Targets

A spell's **surplus** = its value − its price, in HP per cast at par. The targets:

| Kind | Surplus at par | Why |
|---|---|---|
| Strike, Guard | 0 | the null exchange |
| Course spells | **+3 / +5 / +7** by level | +3 at level 1 keeps them at about +1 even at skill 20 (damage shrinks with skill, the Mana price doesn't). Without it, novices never cast (§8). |
| One-level spells (hidden, peer, club and job) | **+5 to +7 per action** *when their situation holds* | They arrive from about level 45, when Flame is level 2 (+4.6). Anything below that is never picked over Flame (§8). |
| Forbidden spells | **+6 to +10** | very powerful, paid for with alignment, illegality and observers |
| **Healing and absorb** | **85% of the damage the same price buys** | Healing can't be Guarded or Warded, and if defence is as efficient as offence, fights stall (§4). Mend = floor(0.85 × same-level Flame). |

**Per action, not per cast.** While you can afford Flame, an action's real opportunity cost is the 9 HP Strike *plus* Flame's surplus (≈ 13.6 at par). So a spell that occupies n actions (a channel's start, Holds and Release) must earn about n times what a Flame would, or nobody will cast it. That's why the channels below have big releases.

Two ways to value a spell:
- **Proactive** (the default): cast in place of the null exchange. You take the 9 HP Strike unless the spell stops it. Damage lands in full, because the leader committed a Strike, not a Guard.
- **Reactive:** cast in answer to an attack you've seen. The free alternative is Guard, so the value is the damage stopped beyond what Guard stops (Guard lets 2/3 of a spell through). The price is the Mana alone, since Guard would have used the turn too.

---

## 3. The basic numbers

**Now (v04 0.4.4)** at par:

| Action | Mana | Effect | What Mana buys |
|---|---|---|---|
| Strike | 0 | 9 | — (Guarded: 0) |
| Guard | 0 | stops Strike, 1/3 of spells | — |
| Flame 1/2/3 | 10/9/7 | 12/14/15 | **0.3 HP/Mana** over Strike on an open target; 0.8 through Guard |
| Mend 1/2/3 | 10/9/7 | 18/21/24 | **1.8 HP/Mana** |
| Ward | 7 | blocks one action | 1.1 HP/Mana against Flame lv1 |
| Distil | 0 + 12 HP | +24 Mana | |

Mana buys two to six times more as healing than as damage, so the healer can't lose and the attacker can't win. The surpluses:

| | Now | Proposed |
|---|---|---|
| Flame (proactive): damage − (9 + 0.6c) | **−3 / −0.4 / +1.8** | 18/19/20 → **+3 / +4.6 / +6.8** |
| Mend (proactive) | **+3 / +6.6 / +10.8** | 15/16/17 → **0 / +1.6 / +3.8** |
| Ward, answering a Flame lv1 lead | +3.8 | +7.8 (Flame is bigger) |

**Proposed core:**
- **Strike 9.** **Flame 18/19/20** for 10/9/7. **Mend 15/16/17** for 10/9/7: exactly 3 below Flame at each level, about 85%.
- **Ward 7**, unchanged: it still costs what Flame lv3 does.
- At skill 20 (×0.85), Flame lv1 deals 15 against a 13.7 price, still **+1.6**. At 16, as first tried, it was 0, and level-20 fights froze into Strike against Guard (§8).

The model also predicts how fights look:
- **Leading with Flame is bad**, because it walks into Ward (7 Mana stops 12 HP). Damage is cast as the responder.
- **Leading with Guard is bad**, because it hands the responder a covered turn: Flame through Guard is +6.
- So the leader Strikes, and the responder chooses between Guard (0) and Flame (+3 and up). Fights move forward at about one Flame per responder turn while Mana lasts: a tank is roughly one HP bar, so **12–20 exchanges** at par.

---

## 4. Why fights stall, in these units

Stalls (39% of v04's random panel never finished) come from three places, all visible in the numbers:

1. **Spending loses to the null exchange.** Now, Flame lv1 as responder is −3. A player with Mana still does better to Guard. At level 20, 79% of v04 actions were Strike or Guard.
2. **Defence out-earns offence:**
   - Mend (1.8 HP/Mana) out-heals Flame (0.8 through Guard).
   - Heartwood's construct heals 6 a turn and needs 45 damage before it ends.
   - Shadowstep lv3 buys 3 exchanges of immunity for 8 Mana.

   Every exchange of immunity hands *both* sides a free turn. Time is neutral, so cheap immunity is a free pass: at level 80, Shadowstep and Reclaim made up 49% of v04 actions.
3. **Late in a fight, Reclaim costs a turn you can't afford.** At 6 HP, taking a Strike to Reclaim is fatal, so two dry players Strike and Guard forever.

Points 1 and 2 are pricing, fixed in §5. Point 3 is structural; the economy only makes it rarer by ending fights before both tanks run dry. In §8 it's gone at level 80 but still holds 10 of 36 fights at level 20, where it shows as sudden death. §9 lists the options.

---

## 5. Every spell, priced

P = 9 × actions + 0.6 × Mana (+ HP paid). Surplus = value − P, per cast, at par. "Now" uses v04's actual par numbers.

### Course spells and Ward

| Spell | Proposed | Value − price, now → proposed | Notes |
|---|---|---|---|
| **Flame** | 10/9/7 Mana · **18/19/20** | −3 / −0.4 / +1.8 → **+3 / +4.6 / +6.8** | the bread and butter: always worth casting as responder |
| **Foresight** | **8/7/6** · they commit first for **4/5/6** exchanges · your next damaging hit **+4** | −6 / −2.9 / +0.8 → **+0.2 / +3.3 / +6.4** | Worth ≈ I × (exchanges ÷ 2) + the prep bonus. "+10 prep" was +10% of one hit (≈ +1.5); a flat +4 makes it count. |
| **Mend** | 10/9/7 · **15/16/17** | +3 / +6.6 / +10.8 → **0 / +1.6 / +3.8** | 85% rule: always 3 below Flame |
| **Glamour** | 9/7/5 · with observers **+3/5/8 Renown, once per fight** | (in a covered turn) −3.4 / −1.2 / +1 → **−2.4 / +0.8 / +5** | A victory lap: worth it only when you aren't punished for the turn. Once per fight, so it can't be farmed. |
| **Haste** | **6/6/5**, **no HP cost** · two basic actions each exchange for the next **2/3/3** exchanges | −14 / −12.8 / −8.3 → **+1.4 / +8.4 / +9** | See below. |
| **Shadowstep** | **12/15/18** · 1/2/3 exchanges (unchanged) | reactive: +0.8 / +4 / +7.2 → **+4.8 / +5 / +5.2** | See below. |
| **Ward** | 7 (unchanged) | reactive, against a Flame lv1 lead: **+7.8**; against a Strike: −4.2 | Never lead with damage into an open Ward. That is the counter's job, and it only needs a baseline. |

**Haste.** Casting Haste costs a turn, and two actions next exchange only win it back, so 2/2/3 actions is a net 0 / 0 / +1. Worse, a bundle's Strikes meet a free Guard. The only reliable gain of a hasted exchange is doing something *while* Guarding, worth about 7 HP. The cast itself always costs 9, so one hasted exchange can never pay (0.0% use in v04). Two hasted exchanges (three from level 2) can.

**Shadowstep.** Its first exchange is a Ward that also covers several hits (constructs, Omen, bundles) and lets nothing through: about 12 HP against a Flame lead. Each further exchange gives *both* sides a free turn, worth about +2 net to the caster. So durations 2 and 3 are priced as time, not as protection.

### Hidden courses

| Spell | Proposed | Now → proposed | Notes |
|---|---|---|---|
| **Animate** | 14 · Strike **10**, reduction **1**, ends after **20** | ≈ +10 → **+7** | A physical tick lands about 55% of the time (Guard stops it). Lifetime ≈ threshold ÷ 5 per exchange ≈ 4 exchanges. |
| **Starlight** | **12**, Hold 2 · Release **30**, or **48** after a Hold · ⅓ through Ward | ≈ −9 / −11 → **+3.8 / +5.6** against Guard, **+14 / +22** if it lands clean (2 or 3 actions) | Three actions cost 27 HP of Strikes, so the release must be big. Per action it stays under Flame: it's a finisher that pierces Ward, and while you hold it the opponent must Guard-lead, which is its real pressure. |
| **Seal** | **8** | ≈ 0 → **+1.2** at 20 flux, **+6.5** at 27 | worth 0.75 × their flux |

### Peer capstones

| Spell | Proposed | Now → proposed | Notes |
|---|---|---|---|
| **Wildfire** (Lyra) | **8**, Hold 2 · each Hold **17** to them, **2** to you · Release **36** | ≈ −8 → **+15** with one Hold (3 actions), +4.8 per further Hold | Each Hold is a 2-Mana Flame you can't Guard during. Brace soaks the 2. |
| **Heartwood** (Tobias) | **14** · heal **3**, reduction **2**, ends after **24** | ≈ +60 (!) → **+3.6** | Now: heals 6, reduces 6, ends after 45 HP, all on the ×3 scale. Proposed: about 89% of Bramble's return per HP of price, by the healing rule. |
| **Omen** (Seraphine) | **10** · **40**, two exchanges later | −3 → **+2** on average; **+11.7** against Guard, −7.8 against Shadowstep | A public clock. Against Ward it still lands, because your Strike that exchange takes the Ward first. |
| **Sleight** (Corvin) | **4** · steal **8** Crowns | (covered) −0.3 → **+2.9** | combat: a swing of 2 × 8/3 HP; mostly a negotiation and story spell |
| **Contraption** (Mir) | 12 · spark **8**, no reduction, ends after **16**, then bursts **6** to both | ≈ +21 → **+7** | Now: 9 a tick and a 24 threshold, which is why Mir won 12 of 12 in v04. |
| **Hoarfrost** (Kael) | **9** · **18** · still cancels Flame and Wildfire | −4 → **+3.6**, plus the cancel | A little under Flame lv2 in raw damage; its edge is the cancel. |
| **Candour** (Nessa) | 6 (unchanged) | no combat use | negotiation (§7) |

### Club and job spells

| Spell | Proposed | Now → proposed | Notes |
|---|---|---|---|
| **Brace** | 10 · Ward now, then **3/2/1** per hit | reactive: +12.8 → **+9.6** | now 9/6/3 on the ×3 scale; Ward alone is +7.8, so Brace is Ward plus about 2 |
| **Quickquill** | **4** | — | negotiation only (§7) |
| **Bramble** | 10 · thorns **6**, reduction 1, ends after **20** | ≈ +6.5 → **+7.3** | spell thorns, about 83% after Guard |
| **Index** | **4** | — | negotiation only |
| **Rapport** | **4** · 1 Renown per 2 Crowns, up to 10 | (covered) −1.9 → **−0.7** | 5 Renown (5) for 10 Crowns (3.3); combat is never its home |
| **Distil** | 0 · lose 12 HP, gain 24 Mana (unchanged; now in par HP) | **+5.4** | Gained Mana is worth 1.1 each, but the cast is a turn. Distil then Mend is an HP pump against a passive opponent; the turn price is what stops it. |
| **Tailwind** | 8 · consecutive Strikes **+3/+6/+9**, and **the bonus gets through Guard** | −4.8 → **+4.2** | Without the rule, Guard stops every Tailwind Strike for free (0.1% use). See §6. |

### Hidden pool

| Spell | Proposed | Now → proposed | Notes |
|---|---|---|---|
| **Rime** | **4** · thaw with **12** HP | −11 → **≈ +2.6** (more in close fights) | Thawing on 1 HP only buys an exchange; 12 HP survives one more Strike. |
| **Reflect** | 16 (unchanged) | reactive, against a Flame lead: **+20** | Rare but huge (it also turns Omen or a construct's spell back), so its price can stay high. |
| **Moonwell** | 0 · the start **and** each Hold bank **12** | three Holds: −12 → **+7.8** | It costs an action per 10 Mana now (11 HP), below the 9 HP a turn costs. Capacity caps it. |
| **Lodestar** | **6**, Holds free · the start and each Hold **+16** absorb · Release turns on a **pool used up across hits** | −17 → **−3.4 / +1.2 / +5.8** (one, two, three Holds) | "Until the next attack" caps it at one hit, so further Holds are worthless. Absorb is valued at 85%, like healing. |

### Forbidden pool (target +6 to +10; plus alignment −small and the observer report)

| Spell | Proposed | Now → proposed | Notes |
|---|---|---|---|
| **Torment** | 14 · each opponent action costs them **8** HP for 3 exchanges | −8.4 → **+6.6** | 24 HP that nothing blocks |
| **Extraction** | 6 · steal **10** ready Mana | +22.6 → **+9.4** | the swing counts twice (their loss, your gain) |
| **Siphon** | 12, Hold **6** · the start and each Hold deal **14** · Release heals the total | −19 → **+14** with one Hold (3 actions), +27 with two | heal valued at 85% |
| **Compel** | **12** · this exchange and the **next two** | −8.5 → **+8.8** | the agreed "more turns if balancing calls" |
| **Eclipse** | 6 · **this exchange and the next**, damage you take also gives **twice** that in ready Mana | −8.6 → **+7.2** | "Next exchange only" lets them simply not attack. Covering this one lets you answer a seen Strike. |
| **Heartprice** | 0 · spells cost 1 HP per 2 Mana · **healing still costs Mana** | par per cast | At 1 HP per 2 Mana, Mend lv3 costs 3.5 HP to heal 17, an endless pump. Its real value is never running dry. |

---

## 6. Rule changes the numbers need

Most of §5 is numbers. These items change what a spell does, because no number could fix them. They're listed so you can veto them one by one.

1. **One HP scale and the gentler skill curve** (U1, U2).
2. **Haste** lasts 2/3/3 exchanges, with no HP cost.
3. **Foresight's** preparation is a flat +4 on your next damaging hit.
4. **Tailwind's** bonus gets through Guard. The base Strike doesn't.
5. **Lodestar's** absorb is a pool used up across hits.
6. **Eclipse** covers this exchange and the next, and pays 2 Mana per HP.
7. **Heartprice** can't pay for healing.
8. **Rime** thaws with 12 HP.
9. **Compel** runs for 3 exchanges.
10. **Glamour's** Renown is once per fight.
11. **For the simulator's AI, not the game:** its evaluation should value ready Mana and flux as the economy does (1.1 and 0.75 HP). Today it values 10 Mana at about 0.3 HP, so it spends early and starves late. On its own, this changes almost nothing on the current numbers (§8).

---

## 7. Negotiation rates

Negotiation has no flux and no turn price for spells (the slot is free), so it gets its own rates, from `docs/minigame-negotiation-v03.md` at par (skill = their level):

| Currency | Worth | Why |
|---|---|---|
| **Mood** | the unit (≈ 0.8 Health) | Confront and Deflect are priced in Mood |
| **Patience** | ≈ 3 Mood | 8 Patience for 4 Confronts leaves 2 Deflects; a Deflect saves about 9 Mood of pressure for 2 Patience and 3 Mood |
| **Pressure** | ≈ 3 Mood on each later Confront (≈ 6) | +3 Mood per level, per Confront |
| **Suspicion** | ≈ 3 Mood | 6 ends the meeting; a Guile Deflect trades 1 Suspicion for its Mood |
| **Agreement** | ≈ 12 Mood | a Confront: 1 Patience + ~6 Mood + 1 pressure |
| **Mana** | ≈ 0.5 Mood | campaign weights (Mana 0.4 a point, Mood 1 per 13) |

**A negotiation cast costs 1 Suspicion (3) + Mana ÷ 2 Mood**, so a 6-Mana spell is about 6 Mood. The checks, with the proposed costs:

| Spell | Effect | Value − price |
|---|---|---|
| Foresight 8/7/6 | rolling one-ahead reveal, 3/4/5 turns | ≈ −1 / +1.5 / +4 (unchanged effect) |
| Glamour 9/7/5 | Charm and Guile responses cost **8/10/12** less Mood (was 6/8/10); +2 Suspicion | −4.5 / −1.5 / +1.5 → **−2.5 / +0.5 / +3.5** |
| Haste 6/6/5 | the response costs **1/2/2** less Patience (was 1/1/2) | **−3 / 0 / +0.5**; at levels 2–3, a free Deflect |
| Starlight 12 | **+3 Patience** (was +2) | −3 → **0** |
| Candour 6 | −3 Suspicion | **+3** (unchanged) |
| Quickquill 4 | the next Confront raises no pressure | **+1** |
| Index 4 | answer with Lore | ≈ 0 (depends on the Lore gap) |
| Rapport 4 | the next Deflect costs no Mood and no Suspicion | **≈ −2**: slightly under; watch it |
| Reflect 16 | this Confront +2 Agreement, +2 pressure | ≈ −5; it's a combat spell first |
| Compel 12 (underground) | 1 Agreement, no Suspicion | **+6** (forbidden premium) |

Hostile spells still fail the meeting; Shadowstep is the exit. Nothing else changes.

---

## 8. Simulator check (forked)

The v04 engine, roster and AI were copied to a scratch folder and patched. The repo's simulator is unchanged.

**The panel:**
- The nine generic loadouts each meet two others at levels 20, 50 and 80, with both initial commit orders: 108 fights per arm.
- Full alpha–beta search (depth 3, 5,000 nodes).
- A fight counts as **unfinished** after 80 exchanges.

**Arms:**
- **Now** is v04 0.4.4.
- **Proposed** is every number in §5 and every rule in §6.
- The AI (search depth and budget unchanged) values Mana as §2 does in every arm marked "economy AI".

### Generic loadouts

| Arm | Finished by knockout | Unfinished | Median length (exchanges) | Strike + Guard share of actions | Most-cast spells (% of actions) |
|---|---|---|---|---|---|
| Now | 66 / 108 | 42 (39%) | 33 | 58% | Shadowstep 9.6, Flame 7.6, Mend 5.8 |
| Now, economy AI | 61 / 108 | 47 | 29 | 67% | Shadowstep 7.1, Mend 6.1, Flame 5.8 |
| First try (Flame 16, Mend 13), economy AI | 92 / 108 | 16 | 16 | 58% | Flame 19.9, Ward 8.4, Mend 5.7 |
| **Proposed, economy AI** | **95 / 108** | **13** | **16** | **45%** | **Flame 26.6, Ward 11.5, Mend 6.2** |

By level, now → proposed:

| Level | Finished | Median length | Notes |
|---|---|---|---|
| 20 | 13 → **24** of 36 | 26 → **12** | |
| 50 | 23 → **35** of 36 | 31 → **17** | |
| 80 | 30 → **36** of 36 | 45 → **19** | Shadowstep fell from 28% of actions to 3.9% |

### Named characters

Ten named characters (the seven peers, Bram, Ilse and Tamsin) each face generic opponents at levels 20, 50 and 80, in both commit orders.

| Arm | Opponents | Finished | Unfinished | Median length |
|---|---|---|---|---|
| Now | Duellist, Prefect | 80 / 120 | 40 | 31 |
| **Proposed** | Duellist, Prefect | **113 / 120** | **7** | **14** |
| Now | Healer, Brawler, Illusionist | 106 / 180 | 74 | 31 |
| **Proposed** | Healer, Brawler, Illusionist | **166 / 180** | **14** | **14** |

Wins / losses / unfinished against Healer, Brawler and Illusionist (18 fights each), now → proposed:

| Character | Now | Proposed |
|---|---|---|
| Lyra | 3/6/9 | 12/6/0 |
| Kael | 0/8/10 | 10/6/2 |
| Seraphine | 2/13/3 | 9/9/0 |
| Mir | 16/1/1 | 7/11/0 |
| Ilse | 1/8/9 | 5/6/7 |
| Tamsin | 0/8/10 | 5/10/3 |
| Bram | 4/6/8 | 4/12/2 |
| Nessa | 0/11/7 | 2/16/0 |
| Corvin | 0/11/7 | 2/16/0 |
| Tobias | 8/0/10 | 0/18/0 |

### What it shows

1. **Fights end.**
   - Unfinished fights drop from 39% to 12%, and the median from 33 exchanges to 16.
   - The Shadowstep–Reclaim loop is gone.
   - Flame and Ward, the baselines, do most of the work.
2. **The economy, not the AI, is what changed.** Giving today's numbers the economy AI makes stalls slightly *worse* (47 unfinished). It's the prices that move the fights.
3. **Low skill needs the +3 margin.** In the first try, every unfinished level-20 fight was Strike against Guard from the first exchange, at full HP and about 50 Mana: Flame 16 at skill 20 was exactly break-even. Flame 18 fixed it.
4. **What's left unfinished** is two cases:
   - **Sudden death** (10 of the 12 at level 20). Both sides are below one Strike's damage, so anything but Guard is fatal, and both Guard forever.
   - **Two vigor-heavy brawlers** (Brawler against Underground tough at level 20). Neither's Flame beats the other's Strike, so neither ever casts.

   See §9.
5. **Constructs and channels aren't tested by this AI.**
   - **Tobias** never casts Heartwood or Bramble and loses all 18.
   - **Mir** casts Animate (12 times) but Contraption only twice.
   - **Lyra** casts Wildfire three times; she wins on Flame.

   The search sees three exchanges, and its static evaluation values a standing construct at about 1 HP, so anything that pays off later loses to a Flame now. The paper prices in §5 stand. Judging them needs an AI that values constructs and channels in HP (§9).
6. **Nessa and Corvin lose.** That's expected: they aren't duellists, and their spells are for negotiation and story.

**Correction:** every run in this section stole 16 Mana with Extraction instead of §5's 10, which flattered Underground tough. It is fixed in §10's runs. Otherwise, the fork matches §5 and §6, except for two things a fight without observers never touches: Foresight lv3 ran 7 exchanges instead of 6, and Sleight still stole 5 Crowns. The scratch scripts are not part of the repo. To reproduce, apply §5 and §6 to a copy of `experiments/minigames/iterations/v04/`, and set the AI's Mana and flux weights to 1.1 and 0.75 of its HP weight.

---

## 9. Open questions

- **Sudden death.** When both sides are below one Strike's damage, any action but Guard is fatal, so both Guard forever. Late in a fight, the same goes for Reclaim when both are dry. The options, in order of preference:
  1. A **practical stalemate**: a draw after, say, 10 exchanges with no HP change. It's in the spirit of the agreed "a stalemate is a draw", and costs nothing in search.
  2. A **flux trickle**: each side recovers 1/4 of its flux at the end of each exchange. It helps the dry case, not the sudden-death one.
  3. **Chip damage**: a Guarded Strike still deals 1. This ends everything, but it bends your Guard rule.
- **Brawlers can't fight each other.** Since Guard stops all of a Strike, a vigor-heavy kit makes no progress until Tailwind arrives (level 45+ extras). That's acceptable if brawlers are meant to lean on Tailwind and Haste. If not, give the Brawler loadout a higher `flameBase`.
- **The AI should value constructs and channels in HP:**
  - for a construct, its tick × the exchanges it can expect to last (about 3);
  - for a channel, the release it's holding.

  Until it does, simulated win rates understate Tobias, Mir, Lyra and Seraphine.
- **Initiative (I ≈ 5)** is the least certain rate, and Foresight and Haste hang on it. It's worth a dedicated probe: the same fight with and without a forced commit order.
- **Constructs' lifetime** is assumed to be threshold ÷ 5 exchanges. If a turtling caster keeps one alive much longer, add a lifetime cap of about 5 exchanges rather than cutting the per-tick numbers.
- **Relation to `experiments/minigames/economy-draft-1.json`** (another agent's accounting draft). It also prices a turn at 9 HP, and its Mana price (9 + 3 + 0.5c) lands within 1–2 HP of this one for 10–12 Mana spells. It differs in three ways:
  - Guard stops only 2/3 of a Strike there. That reverses your rule; here Guard stays as agreed and spells do the progressing.
  - Flame costs a flat 12 there.
  - Healing is 80% there, 85% here.

---

## 10. Hybrid trials (mixing this doc with the other agent's draft)

**The panel:** every pairing of the nine generic loadouts at levels 20, 50 and 80, with both commit orders: 216 fights per row. Fights were cut off after 120 exchanges.

**Spread** is the standard deviation of the nine classes' win rates (lower is fairer). **Finished** counts knockouts, plus "decisions" where that rule exists.

| Row | What changed | Finished | Draws | Unfinished | Median length | Spread |
|---|---|---|---|---|---|---|
| Mine | §5 and §6, with Extraction fixed | 191 | 0 | 25 | 18 | 21 |
| Theirs | 0.4.5 as shipped (Strikes chip through Guard; 120/180/240 HP) | 216 | 0 | 0 | 27 | 23 |
| M1 | mine + their AI scoring | 174 | 0 | 42 | 18 | — |
| R1 | mine + **capacity from all six skills** + Extraction 8 Mana / 9 stolen + their construct lifetime caps | 175 | 0 | 41 | 17 | **16** |
| R2 | R1 + a **draw** after 10 exchanges with no HP change | 163 | 53 | 0 | 17 | 16 |
| R3 | R1 + a **decision on points** after 10 quiet exchanges: higher HP share wins; a tie is a draw | 185 | 31 | 0 | 17 | **15** |
| R4 | R3 + max HP + 1.5 × (vigor − own mean skill), either sign | 200 | 16 | 0 | 16 | 25 |
| R5 | R3 + max HP + ½ × (vigor above own mean skill), never negative | 192 | 24 | 0 | 17 | **14** |

**What held up:**
- **Mana capacity from all six skills** (`40 + mean skill / 2`, not `40 + arcana / 2`) is the biggest single gain. In both versions the arcana classes (Duellist, Hollow adept) won 76–88%, because Arcana paid twice: Flame's damage *and* the Mana to cast it. Spread 21 → 16; Duellist 83% → 76%.
- **A decision on points beats a plain draw.** With a draw, the losing side learned to stall for it (53 draws). With a decision, the side behind has to act; every fight ends, and the remaining draws are matches that never started (below).
- **Extraction at 8 Mana for 9 stolen** sits in the forbidden band (+6). With the bug fixed, Underground tough went from 67% to about 46–51%.
- **Lifetime caps on constructs** changed nothing measurable (generic kits rarely have constructs). They're worth adopting anyway, because a finite window is easier to price.

**What didn't:**
- **Their AI scoring on full-Guard rules makes play passive** (unfinished 25 → 42). It values held Mana low and was tuned for a Guard that leaks. Keep this doc's Mana weights.
- **HP is a very strong lever.** About +7 max HP took Brawler from 22% to 71%, and the signed version (R4) dropped Scholar to 5%. A vigor HP bonus could give Strike classes an identity, but at a quarter of R5's size, untested.

**Still open:**
- **Healer stays at about 28–35% in every row.** Healing at 85% can't carry a class alone. It needs Bramble used (AI horizon), or an alchemy-scaled damage tool earlier.
- **23–28 of the draws happen at full HP.** Some level-50 matchups never engage: both sides find a first cast worse than waiting. A decision rule ends them, but the cause (probably Ward and Shadowstep looming within the 3-exchange search) is unexamined.
- **The per-class rates move ±15 points on small changes.** The AI is deterministic and many pairings mirror each other. Trust the spread and finish counts more than single cells.

---

## 11. Class and level balance

### Method

**Two panels per variant:**
- **Class matrix:** every pairing of the nine generic loadouts at levels 20, 30, …, 80, in both commit orders: 504 fights.
- **Level gaps:** each loadout against itself at +5, +10 and +20 levels, from bases 30 and 55, with the higher side in either seat and two seeds: 144 fights per gap.

**The AI is the v04 "fallible" profile.** It makes seeded mistakes, a third of the time at most, and always within 35 points of the best move. The deterministic search turns every mirror into "whoever has any edge wins": +5 levels won 83% deterministically, but 65% with mistakes. Class spreads shrink the same way (14 → 9 points). Only fallible-AI numbers are used below.

**Targets** (mine, to be confirmed):
- Every class between 40% and 60% in the matrix.
- A level gap matters, but isn't hopeless: +5 ≈ 60%, +10 ≈ 70%, +20 ≈ 85%.

### What was tried, cumulatively

| Step | Change | Class spread | Lowest / highest class | +5 | +10 | +20 |
|---|---|---|---|---|---|---|
| F1 | §10's R3, with two fixes: the decision clock now ticks only when nobody's HP changes **and nobody spends Mana**; the AI values a standing construct in HP | 9 | Healer 36% / Hollow adept 66% | 65% | 82% | 98% |
| F2 | + flatter level curve: skill factor `0.85 + 0.003 × skill` (±15%), capacity `52 + mean skill / 4` | 10 | Healer 29% / Hollow adept 63% | 68% | 72% | 95% |
| F3 | + damage rounds to the nearest point, not up | — | — | 62% | 74% | 97% |
| **F4** | + presets: **Healer** offsets +2, +2, +8, +2, −4, −10, flameBase 0.6, Bramble before Distil; **Hollow adept** offsets +6, +6, −4, −6, −6, +4 | **7** | **Healer 36% / Underground tough 63%** | **63%** | **73%** | **98%** |

F4 by class: Duellist 57, Scholar 48, Healer 36, Illusionist 47, Brawler 42, Prefect 52, Showman 50, Underground tough 63, Hollow adept 54 (% of decided fights). Draws fell to 3 of 504.

**Head to head (F4).** Each cell is the row class's win rate against the column class, counting a draw as half. Each pair has 14 fights (7 levels × 2 commit orders), so a single cell is good to about ±13 points; read patterns, not cells.

| Row vs column | Due | Sch | Hea | Ill | Bra | Pre | Sho | Und | Hol | Overall |
|---|---|---|---|---|---|---|---|---|---|---|
| **Duellist** | — | 57 | 68 | 57 | 57 | 61 | 71 | 43 | 43 | 57% |
| **Scholar** | 43 | — | 71 | 36 | 71 | 36 | 50 | 43 | 36 | 48% |
| **Healer** | 32 | 29 | — | 50 | 36 | 36 | 29 | 18 | 64 | 36% |
| **Illusionist** | 43 | 64 | 50 | — | 36 | 50 | 57 | 29 | 50 | 47% |
| **Brawler** | 43 | 29 | 64 | 64 | — | 36 | 36 | 36 | 29 | 42% |
| **Prefect** | 39 | 64 | 64 | 50 | 64 | — | 50 | 50 | 36 | 52% |
| **Showman** | 29 | 50 | 71 | 43 | 64 | 50 | — | 36 | 57 | 50% |
| **Underground tough** | 57 | 57 | 82 | 71 | 64 | 50 | 64 | — | 57 | 63% |
| **Hollow adept** | 57 | 64 | 36 | 50 | 71 | 64 | 43 | 43 | — | 54% |

- **Underground tough beats everyone** (50–82%). Its worst matchup is an even split with the Prefect.
- **Healer loses to everyone except Hollow adept (64%) and Illusionist (50%).** Its worst is Underground tough (18%): Extraction empties the Mana a healer lives on.
- **There are some natural counters,** and they read sensibly:
  - Scholar beats Healer and Brawler (71%) but loses to Illusionist, Prefect and Hollow adept (36%).
  - Brawler beats Healer and Illusionist (64%).
  - Hollow adept beats Brawler (71%) but loses to Healer (36%).

### Findings

- **The decision rule needed the Mana condition.** Without it, many level-30 and level-40 "draws" were really Flame-against-Ward exchanges. Those drain Mana but not HP, and the clock cut them off (109 draws → 24, then 3).
- **Rounding up was a hidden level multiplier.** A 1.5% skill edge turned Strike 9 into 10 and Flame 18 into 19. Rounding to the nearest point took +5 levels from 68% to 62%.
- **Capacity from all six skills plus the flatter curve** bring +10 levels from 82% to about 73%.
- **+20 levels is almost always decisive, and that's structural.** A 20-level gap crosses a course rank, a course slot or an extra-spell slot almost every time. With the same skill gap but only a fourth course slot crossed (46 against 66), the higher side won 86%; when a rank and an extra slot were crossed as well, 96%. To make +20 beatable, shrink the rank-ups (for example Flame and Mend level 3 at 8 Mana, not 7) or space the unlock levels further apart.
- **Healer stays lowest.** Healing at 85% can't win fights; its damage now comes from Flame at 10 and Bramble at 45, but at levels 70 and up it still loses (6 of 31). Next lever, if wanted: Animate before Moonwell at 70, or the Healer's Mend as a prodigy (rank +1).
- **Underground tough is a little high (63%),** from Extraction and Torment at Mid and Top. Next lever: Torment before Extraction, or vigor and guile offsets of +7 instead of +8.

### Status

**Adopted into the docs:**
- In `spells-v2-loadouts.md`: the Healer and Hollow adept presets and the capacity formula.

**Proposed, here only:**
- The skill-factor slope, nearest-point rounding and the decision rule.
- Extraction 8 Mana for 9 stolen.
- The construct lifetime caps (4, 4, 4, 3 exchanges).

The AI construct valuation is a simulator matter, not a game rule.

## 12. A deeper AI, and a scarcer economy

### Setup

**Engine.** It's §11's F4 engine with the faster search grafted in:
- the other agent's alpha-beta-2;
- my further optimizations (identical decisions, about 1.8× faster);
- pruning of spells that would do nothing this exchange.

Two fork fields (the decision-on-points counter and `glamourDone`) are now set at fight start, so reused search buffers can't carry stale values.

**Panels.** Each suite runs the same panels as §11:
- the 504-fight class matrix, levels 20–80;
- the 432-fight level-gap panel.

**AI.** Every suite uses the fallible AI.

**Suites:**
- **F4:** §11's results. Old search, with a 5,000-node cap; it reached depth 2.8–3.
- **D3:** a complete depth-3 search.
- **D4:** a complete depth-4 search, one exchange deeper.
- **V4:** depth 4 with **Mana costs ×1.5 and max HP ×0.5**.

**Sample sizes.** Each class has 112 matrix fights, good to about ±9 points. Each band cell has 32–48 fights, good to about ±15.

### Class win rate by level band (draws count half)

| Class | F4 20–30 | F4 40–50 | F4 60–80 | **F4 all** | D3 20–30 | D3 40–50 | D3 60–80 | **D3 all** | D4 20–30 | D4 40–50 | D4 60–80 | **D4 all** | V4 20–30 | V4 40–50 | V4 60–80 | **V4 all** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Duellist | 58 | 45 | 65 | **57** | 53 | 44 | 60 | **54** | 52 | 41 | 54 | **50** | 58 | 53 | 64 | **59** |
| Scholar | 59 | 53 | 38 | **48** | 56 | 47 | 33 | **44** | 56 | 41 | 21 | **37** | 50 | 48 | 35 | **43** |
| Healer | 39 | 42 | 31 | **37** | 31 | 41 | 23 | **30** | 44 | 44 | 35 | **40** | 38 | 50 | 35 | **40** |
| Illusionist | 56 | 28 | 54 | **47** | 52 | 28 | 48 | **43** | 44 | 16 | 48 | **38** | 45 | 30 | 57 | **46** |
| Brawler | 50 | 44 | 35 | **42** | 66 | 38 | 27 | **41** | 47 | 50 | 29 | **40** | 66 | 47 | 33 | **46** |
| Prefect | 58 | 53 | 48 | **52** | 56 | 56 | 46 | **52** | 59 | 53 | 31 | **46** | 59 | 56 | 46 | **53** |
| Showman | 44 | 50 | 54 | **50** | 39 | 53 | 54 | **50** | 42 | 38 | 56 | **47** | 48 | 55 | 58 | **54** |
| Underground tough | 39 | 78 | 69 | **63** | 38 | 81 | 90 | **72** | 47 | 84 | 94 | **78** | 38 | 52 | 67 | **54** |
| Hollow adept | 47 | 56 | 56 | **54** | 59 | 63 | 69 | **64** | 59 | 84 | 81 | **76** | 48 | 59 | 54 | **54** |
| *spread (sd)* | *8* | *13* | *12* | ***7*** | *11* | *15* | *20* | ***12*** | *6* | *21* | *23* | ***15*** | *9* | *8* | *12* | ***6*** |

### Fights

| Suite | Fights | Knockouts | Decisions on points | Draws | Unfinished | Median length | Median length L20 / L50 / L80 | Mean search depth | CPU per fight |
|---|---:|---:|---:|---:|---:|---:|---|---:|---:|
| F4 | 504 | 466 | 35 | 3 | 0 | 18 | 20 / 18 / 18 | ≈2.8–3 | — |
| D3 | 504 | 476 | 26 | 2 | 0 | 19 | 19 / 19 / 19 | 3.00 | 2.0 s |
| D4 | 504 | 490 | 13 | 1 | 0 | 19 | 19 / 18 / 21 | 4.00 | 15.6 s |
| V4 | 504 | 446 | 44 | 14 | 0 | 13 | 13 / 14 / 13 | 4.00 | 8.6 s |

### Level gaps: how often the higher-level side wins (draws half)

| Suite | +5 | +10 | +20 | +5 / +10 / +20 from base 30 | from base 55 |
|---|---:|---:|---:|---|---|
| F4 | 63% | 73% | 98% | 65 / 71 / 96 | 60 / 75 / 100 |
| D3 | 65% | 65% | 96% | 72 / 69 / 94 | 58 / 60 / 97 |
| D4 | 63% | 72% | 99% | 72 / 74 / 100 | 53 / 69 / 99 |
| V4 | 71% | 78% | 99% | 84 / 89 / 100 | 58 / 68 / 99 |

### Level gaps by class (+10, higher side wins %)

| Suite | Duellist | Scholar | Healer | Illusionist | Brawler | Prefect | Showman | Underground tough | Hollow adept |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| F4 | 63 | 63 | 69 | 81 | 56 | 81 | 63 | 88 | 94 |
| D3 | 56 | 56 | 75 | 63 | 44 | 69 | 50 | 88 | 81 |
| D4 | 69 | 81 | 75 | 63 | 56 | 81 | 50 | 94 | 75 |
| V4 | 75 | 75 | 94 | 94 | 69 | 63 | 81 | 81 | 75 |

### Findings

**A stronger AI favours the forbidden loadouts, at mid and top levels.**
- From F4 to D3 to D4, Underground tough goes 63 → 72 → 78%, and Hollow adept 54 → 64 → 76%.
- At levels 60–80, Underground tough wins 94% at depth 4.
- The losers are the plain casters: Scholar (48 → 37%, and 21% at 60–80), Illusionist and Prefect.
- §11's balance was tuned against an AI that misplayed Extraction, Torment, Eclipse and Seal. Played better, they're too strong.

**The imbalance grows with level.**
- At levels 20–30 the classes are close: spread 6 at depth 4.
- At 40–50 and 60–80 the spread is 21–23, because that's where the forbidden spells unlock.
- Some identities flip with level:
  - Scholar and Brawler are strong at low level and fade.
  - Underground tough is weak at low level (38–47%) and dominant at high level.
  - Duellist stays roughly level (41–54% at depth 4).

**Deeper search didn't bring the dead spells to life.**
- At levels 60–80, depth 4 still almost never casts Siphon, Tailwind or Moonwell, and casts Haste less (1.3% → 0.4% of actions).
- So these spells are weak or awkward, not just unseen by a short horizon.
- One extra exchange costs about 8× the CPU (2.0 s → 15.6 s per fight).

**Level gaps hardly change with depth:**
- +5 levels: 63–65%;
- +10: 65–73%;
- +20: 96–99%.

**The scarce economy (V4) is the most balanced result so far:**
- every class is between 40% and 59%, with a spread of 6 overall and 8–12 within each band;
- Underground tough and Hollow adept fall to 54%;
- Healer stays at 40%, as at depth 4 (30% at depth 3).

Fights are shorter (median 13 exchanges instead of 19). More of them end on points (44) or in a draw (14), but none goes unfinished. HP is scarce, so Mend appears less and Guard more.

**V4 makes levels matter more, mostly at low level:**
- +5 levels win 71%, and +10 win 78%;
- from base 30, the figures are 84% and 89%.

With half the HP, a level's extra skill shortens the fight faster. At base 55 it's close to D4: 58% and 68%.

### Time per AI turn

The same 27 fights were played under each setup: each loadout against the one four places on, at levels 20, 50 and 80. The figures are CPU time for one side's decision, including the fallible AI's ranking search, on an Apple M3 under light load.

| Setup | median per turn L20 | L50 | L80 | mean per turn (all) | 95th percentile | slowest | exchanges per fight |
|---|---:|---:|---:|---:|---:|---:|---:|
| F4 | 43 ms | 102 ms | 128 ms | 111 ms | 297 ms | 0.8 s | 20 |
| D3 | 29 ms | 23 ms | 44 ms | 67 ms | 262 ms | 0.8 s | 19 |
| D4 | 66 ms | 147 ms | 329 ms | 354 ms | 1458 ms | 6.8 s | 21 |
| V4 | 37 ms | 65 ms | 192 ms | 212 ms | 864 ms | 4.1 s | 13 |

- F4 is the old search, capped at 5,000 nodes.
- D3 searches deeper than F4 yet is faster, because of the optimized search and pruning.
- D4 averages about 3× F4, with occasional turns of several seconds at level 80. On a phone it would need the time-capped live profile.
- V4 is cheaper than D4: fights are shorter, and fewer spells are affordable at once.

### Status

- **Exploratory.** None of this is adopted.
- **Next steps for a scarcer economy:**
  1. Try the two halves separately: Mana ×1.5 alone, and HP ×0.5 alone.
  2. Make the low-level gap less decisive, for example a flatter skill factor below level 40.
- **If the economy stays as it is:** depth-4 results argue for tightening Extraction and Torment, and Eclipse's recasting (see `spells-v2-playstyles.md`), before trusting the class matrix.

## 13. Problem spells, from the D4 and V4 traces

**Sources:**
- **Use:** the D4 and V4 class matrices (all levels), with each loadout's kit regenerated per level.
- **Value per cast:** the 256 level-80 traces. A cast's value is the HP and Mana swing (caster minus opponent, as a share of max HP and capacity) over its exchange and the next two. Context biases this: Reclaim and Guard are cast when behind, for example. Read it as a ranking, not a price.
- **Search cost:** an ablation on 155–182 positions replayed from the traces. Each spell was removed from both kits, and depth 3 was re-searched. The figure is the ratio of nodes with the spell to nodes without it.

### Overpowered

| Spell | Evidence | Fix to try |
|---|---|---|
| **Torment** | Cast in every fight it's available (2.7 a fight at D4). +15% (D4) and +19% (V4) of max HP per cast over 3 exchanges, Mana-positive. Led 71–84% of the time: it works just as well when seen. Its owner wins 81–94%, and 8–10 of its wins end on a tick. In V4 its unscaled charge is a quarter of a 35-HP opponent. | Charge a share of the target's max HP (about 12%), not a fixed 8. And Shadowstep breaks when you cast Torment. |
| **Extraction** (D4) | 3.5 casts a fight, cast in 93% of fights. −19% HP but +29% of capacity in Mana per cast (about +13 to +23 HP at §2's rates). Four in a row drained a Duellist from 72 to 12 Mana. V4's Mana price makes it a loss (0.8 a fight). | Steal 7 instead of 9, or once per three exchanges. |
| **Shadowstep** | +11.5% (D4) and +21% (V4) HP per cast over 3 exchanges, in 7 loadouts. It enables Torment and Extraction safely. | Breaks on any spell you cast, not only Reclaim and damage. |
| **Reflect** | Rare, but +21% (D4) and +62% (V4) per cast: in V4 a returned Flame is two thirds of a life bar. | Fine at D4. Under V4, scale damage together with HP rather than HP alone. |
| **Eclipse** | A stall rather than damage: −5% / −16% HP per cast, but Mana-positive, and opponents stop attacking. Recast while active. | No recast while active. |

### Rarely used (in kit, but seldom cast)

| Spell | Casts per fight with it in the kit (D4 / V4) | Why |
|---|---|---|
| Glamour, Index, Rapport | 0 / 0 (400, 128 and 128 kit-slots) | No combat effect without observers. They're dead slots in a fight. |
| **Haste** | 0.19 / 0.05, in **6 loadouts** | −19% / −12% per cast. It's weak, not unseen: depth 4 uses it less than depth 3. |
| Tailwind | 0.09 / 0.03 | Ends on any non-Strike. |
| Lodestar, Starlight | 0.13 / 0.13–0.16 | Lodestar's owner won 0 of the fights it was cast in. |
| Siphon | 1.05 / 0.15 | Useful at D4 (+21% per cast). V4's Mana price on the start and each Hold kills it. |
| Distil | 0.53 / 0.16 | −20% / −33% HP per cast. |
| Reflect | 0.25 / 0.07 | 16 Mana (24 in V4) for a payoff that needs a Flame to be coming. |
| Foresight | 0.70 / 0.32 | −5% / −6% per cast, yet the most expensive state to search (below). |

### What makes the search slow

| Spell or state | Nodes with it / without it at depth 3 | Median decision time with it active (D4 / V4, overall 297 / 202 ms) |
|---|---|---|
| Flame, Ward | ×1.5–1.9 | — (the core moves: always viable, so fewer cutoffs) |
| **Reflect** | **×1.47–1.57** | — |
| **Shadowstep** | **×1.38–1.46** | 376 / 363 ms |
| **Eclipse** | **×1.37–1.41** | **497 / 368 ms** |
| **Foresight** | ×1.24–1.27 | **642 / 439 ms** (the slowest state) |
| Brace | ×1.17–1.24 | 463 / 240 ms |
| Torment, Extraction, Seal, Haste, Tailwind | ×0.97–1.16 | Haste active: 177 / 130 ms (bundles narrow the menu) |
| Channels, constructs, Glamour, Index, Rapport | ×1.02–1.10 | Channels: 31–196 ms (only Hold or Release) |

**The number of legal moves dominates.** With 12 or more, a decision takes a median of 411–446 ms; with fewer than 9, 19–40 ms.

The expensive spells are the reactive and tempo ones:
- **Reflect, Shadowstep, Eclipse and Ward** give the responder a strong answer to most leads, so the leader's lines need deeper refutation.
- **Foresight** changes who leads for several exchanges.

**Search-side fixes, rules unchanged:**
- **Prune no-op answers.** Reflect against a lead that deals no spell damage does nothing, and so does Ward against a lead that deals no damage with nothing pending (no construct, Omen or Torment). Both are as safe to prune as the current no-op list.
- **Order reactive spells last when leading.**

## 14. F5: defence, Mend, Wildfire, Extraction and the stat curve reworked

F5 is the depth-4 engine of §12 with the changes below. It's a scratch fork, not adopted. The hosted build is labelled **spells-v2 F5.2 · 2026-10-17**. F5.1 nerfed Brace. F5.2 fixed a bug present in every earlier fork, including §11–§13's runs: Shadowstep broke only after the hits of the exchange its owner attacked, so it still evaded that exchange's incoming damage. Now any committed attack breaks it before the hits land, as Reclaim already did.

### Rules

**Shields:**
- **Ward** (this exchange) blocks **every opposing spell effect**: all spell damage (Starlight's third no longer passes), and the application of Torment, Extraction, Seal and Compel. It also blocks Torment's charge for that exchange.
- Ward halves **physical** hits (Strike, Tailwind's bonus, Animate's strike).
- **Shadowstep** evades the same spell effects while it's active, and still evades physical hits. Its break rules are unchanged.

**Guard** halves spell damage (it let 2/3 through before). It still stops all of a Strike.

**Brace** stops damage only, not spell effects. It blocks **100%** of opposing damage on the exchange it's cast, then **50%, 25% and 25%** over the next three (first tried at 75/50/25%, nerfed before the suite ran). It no longer includes a Ward.

**Mend:**
- heals **24/26/28** at par (it was 15/16/17), about 1.3× a same-level Flame;
- the heal lands at the end of the exchange, and only if the caster took **no damage** that exchange. Hits, Torment charges and the caster's own Wildfire all count.

**Wildfire:**
- each Hold deals **14** (was 17), scaled with skill;
- the self-cost is a **fixed 4** per Hold (was 2, skill-scaled), and nothing mitigates it;
- the Release deals **36 + 5 per Hold**: 3 moved from each Hold, plus 2 for the higher self-cost.

**Extraction** steals up to 9 (skill-scaled) of the target's ready Mana **into the caster's flux**. The caster's Mana plus flux can't exceed capacity. Ward and Shadowstep stop it.

**Combat kits** drop **Glamour, Rapport and Sleight**: their only effect is Renown or Crowns.
- Course slots and extra slots fall to the next preference.
- With Glamour gone, every generic loadout with four course slots now gets Foresight, Mend, Haste and Shadowstep.
- Index, Quickquill and Candour (no combat effect) stay. They're negotiation spells.

### Stats

**Skill curve:** a 30-point skill gap now does what 20 points did. The skill factor becomes `0.9 + 0.002 × skill` (1.0 at skill 50, ±6% at 20 and 80). Loadout spell unlocks and ranks are unchanged.

**HP scaling is back, but subtle:** max HP = Health × (0.9 + 0.002 × mean of arcana and vigor). That gives about 65 at skill 20, 70 at 50 and 75 at 80.

**Mana capacity** comes from all six skills, with arcana counted twice, at **two thirds of F4's tank**:
- `round(43 + (w − 50) / 9)`, where `w = (2 × arcana + sum of skills) / 7`;
- that gives about 40 at level 20, 44 at 50 and 48 at 80, against F4's 64–72;
- spell prices are unchanged, so this works like a 1.5× Mana price without touching the economy table.

### AI evaluation
- **Crowns and Renown are removed.**
- **Constructs** are valued by what they will still contribute, not as an HP pool: remaining ticks × (power × 0.75 for damage, or the heal, plus reduction). Remaining ticks are capped both by lifetime and by how soon the threshold breaks. That's (threshold − damage taken) ÷ 12, the expected damage to the master per exchange, which the construct copies.
- **Brace** is valued at the damage its remaining shares can stop, at 12 a hit.
- **Mana and flux** keep their HP prices (1.1 and 0.75) whatever the max HP: the points-per-HP factor is now computed from the encounter's HP.
