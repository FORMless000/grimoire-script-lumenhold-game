# Spell redesign v2: revision 2

Revision 2 holds only the current design. Your round-1 comments are kept word for word in §L, each with a reply. Every entry has an empty `Comment:` line for round 3.

**Units:**
- Combat amounts are **base** values, multiplied by combat scale 3 and by `clamp(1 + (skill − defence + prep)/100, 0.5, 1.5)` using the spell's own skill.
- Mana costs are **unscaled**: ×2 in the combat v2 simulator, and as v3 already does in negotiation.
- Mana *gains* are given in final Mana.

**Minigames:**
- **Combat v2** is the commitment prototype 0.2.2: `docs/minigame-prototype-v02.md` and `experiments/minigames/iterations/v02/rulebook.md`.
- **Negotiation v3** is the pressure prototype: `docs/minigame-negotiation-v03.md`.

## A. Minigame rule changes this design assumes

- **Spells take the action in combat.** In negotiation they don't: the one spell slot comes before the response, as in v3.
- **No time limit in combat.** A fight ends by knockout or by conceding. A stalemate in which neither side can do damage (no Mana, no flux, Strike always met by Guard) is a draw.
- **Flux is 2/3 of a cast's cost** (was 4/5).
- **Guard stops all Strike damage and 1/3 of spell damage** (was base 4 of Strike, with spells passing through). Strike is weak by design.
- **Channel** (replaces "channel for X turns"):
  - The start is your action, and it is public.
  - Each later exchange your action is **Hold** (which costs Mana) or **Release**, chosen under the normal commit order, so the timing can be faked.
  - There is no limit on holding. While channelling you can do nothing else.
- **Constructs:** see §D.
- **Observers:** a fight flag. With observers, some spells turn into Renown at settlement, and forbidden casts are reported (an event follows the fight).
- **Crowns:** each side brings Crowns into an encounter (v01 fixtures: standard 30, depleted 6).
- **Shadowstep** breaks when you deal damage or regain Mana.
- **Negotiation:**
  - Withdrawing becomes a loss in a future iteration.
  - Hostile spells (damage, constructs) fail the meeting.
  - The design stays generic: no practical-request matching and no argument types until opponents are developed.
- Comment:

## B. Spell rules

- **Skill.** Every spell has one skill. Animate has two; Ward has none. The skill:
  - gets XP when the spell is learned (course spells medium/large/huge by level; every other spell large);
  - adds to card checks on that skill (`spell_check`, keyed by the spell's skill);
  - scales amounts (damage, healing, Mana, reduction, thresholds). Durations and counts don't scale.
  - Negotiation amounts are fixed.
- **Verb.** Every spell has one verb on cards. Its `up[]` options use only that verb. Names are short, a single verb where possible.
- **Levels.**
  - The six course spells have 3 levels; every other spell has 1.
  - Courses will teach their spell when the course starts (a later change).
  - There are no head starts: Lyra's `slice_candle_flame` and the Vey, Brask and Amaranth milestones stop teaching spells.
- **Baselines.** The six course spells and Ward are the baselines; every other spell is lighter. A counter may only need baselines or basic actions.
- **Spells with no use are allowed.** A spell may do nothing in one minigame or both, or only gain resources.
- **Forbidden spells:**
  - They are very powerful, and each cast costs `alignment −small`.
  - They are illegal: everyone except the underground disapproves.
  - Seen by observers, they lead to an event after the fight.
  - In negotiation they fail the meeting with consequences, except with someone from the underground (effect to design later).
- **Search safety.** No effect may let the caster choose among the opponent's options, undo a turn, hide a commitment, or open a menu inside a cast.
- **Plot safety.** Learning or casting a spell never grants a key clue or moves an arc clock outside hard-canon story events.
- **Sources.** The hidden and forbidden pools (§H, §I) have no sources yet.
- Comment:

## C. The spells

### Course spells (3 levels) and Ward

1. **Flame** · Evocation · arcana · cost 10/9/7
   - Cards: burn, light, warm, frighten. Its cards hint that every duellist relies on it.
   - Combat: base 8/9/10; Guard stops a third. The core damage spell.
   - Negotiation: fails the meeting.
   - Comment:
2. **Foresight** · Astromancy & Divination · lore · cost 10/9/7
   - Cards: know what comes next.
   - Combat: the opponent commits first for 3/4/5 exchanges, plus one +10 preparation. Being forced to commit first also gives them the mutual-knockout tiebreak, as in v02.
   - Negotiation: for 3/4/5 turns you see the next request one turn ahead, rolling, with no choosing.
   - Comment:
3. **Mend** · Alchemy & Healing · alchemy · cost 10/9/7
   - Cards: heal bodies, repair things.
   - Combat: heal base 6/7/8, up to entry.
   - Negotiation: none.
   - Comment:
4. **Glamour** · Illusion & Glamour · charm · cost 9/7/5
   - Cards: seem, disguise, small illusions.
   - Combat: with observers, +2/3/4 Renown at settlement. No effect without them.
   - Negotiation: as in v03. Charm and Guile responses cost 6/8/10 less Mood, one less Renown and one less Suspicion; the cast adds +2 Suspicion.
   - Comment:
5. **Haste** · Beastcraft & Flight · vigor · cost 10/8/8, plus base 2 HP
   - Cards: be quicker, get there first.
   - Combat: the cast is your action. Next exchange you take **2/2/3 basic actions** (Strike, Guard, Reclaim), committed together as one public bundle. A second Guard or Reclaim in the bundle adds nothing.
   - Negotiation: the response costs 1/1/2 less Patience (at least 1).
   - Comment:
6. **Shadowstep** · Umbral Theory · guile · cost 12/10/8
   - Cards: slip away, be where you shouldn't.
   - Combat: evade every attack for 1/2/3 exchanges, counting the current one, so level 1 evades only the incoming action. Breaks when you deal damage or regain Mana.
   - Negotiation: the clean exit. Leave and settle the current progress (a partial if you have at least half), assuming withdrawing becomes a loss.
   - Comment:
7. **Ward** · orientation safety talk, before the electives · **no skill** · 1 level · cost 7 (about Flame 3)
   - Source: `slice_ward_lesson` is removed and rebranded as an orientation safety talk, to be written up as a full event later.
   - Cards: a pale shell that turns aside one harm.
   - Combat: blocks all damage of the next damaging action this exchange. A third of a Starlight beam still gets through.
   - Negotiation: none.
   - Comment:

### Hidden courses (1 level)

8. **Animate** · Artifice · alchemy + arcana · cost 14
   - Cards: make a made thing move by itself.
   - Combat: construct (§D). Strike base 3 each exchange.
   - Negotiation: later.
   - Comment:
9. **Starlight** · Starcalling · lore · cost 16 to start, 2 per Hold
   - Cards: light the Star can't swallow.
   - Combat: channel. Release after at least one Hold for a base 18 beam, or base 9 if released at once, so full power takes start, hold, release (3 exchanges). A third gets through Ward.
   - Negotiation: soothing, +2 Patience.
   - Comment:
10. **Seal** · Hollow Studies · guile · cost 10
    - Cards: close, lock away.
    - Combat: wipe all the opponent's flux.
    - Negotiation: none.
    - Comment:

### Peer capstones (1 level; stub events for now, §F)

11. **Wildfire** · Lyra · arcana · cost 10 to start, 2 per Hold
    - Cards: let fire run.
    - Combat: channel. Each Hold deals base 3 to them and base 1 to you; Release deals base 14. Ward blocks one tick or the release. Brace soaks the self-damage early on (§E).
    - Negotiation: fails the meeting.
    - Comment:
12. **Heartwood** · Tobias · vigor · cost 16
    - Cards: grow shelter.
    - Combat: construct (§D) that heals you base 2 each exchange.
    - Negotiation: none.
    - Comment:
13. **Omen** · Seraphine · lore · cost 16
    - Cards: foretell.
    - Combat: two exchanges after the cast, the opponent takes **base 24** spell damage. It is public, so Ward or Shadowstep can meet it, and you stay free to act meanwhile.
    - Negotiation: none.
    - Comment:
14. **Sleight** · Corvin · guile · cost 6 · `alignment −tiny` per cast
    - Cards: palm, swap, pocket.
    - Combat: steal 5 Crowns.
    - Negotiation: steal 5 Crowns.
    - Comment:
15. **Contraption** · Mir · alchemy · cost 12
    - Cards: improvise a machine.
    - Combat: construct (§D), a wilder Animate. Spark base 6 spell damage each exchange, no reduction, and it bursts for base 4 to both sides when it ends.
    - Negotiation: later.
    - Comment:
16. **Hoarfrost** · Kael · arcana · cost 10
    - Cards: freeze, cool, quench.
    - Combat: base 7 cold. If it meets their Flame, a Wildfire tick or a Wildfire release in the same exchange, both cancel and Hoarfrost deals 0.
    - Negotiation: fails the meeting.
    - Comment:
17. **Candour** · Nessa · charm · cost 6
    - Cards: get the honest answer.
    - Combat: none. Flavour only: they blurt out something true.
    - Negotiation: −3 Suspicion, so −2 after the cast's own +1. With Quickquill, see §E.
    - Comment:

### Club and job spells (1 level; chains in §G)

18. **Brace** · Duelling Circle · vigor · cost 10
    - Cards: hold firm.
    - Combat: a Ward this exchange, then a fading flat reduction of base 3, 2, 1 on every hit over the next 3 exchanges, scaled by skill.
    - Negotiation: none.
    - Comment:
19. **Quickquill** · Lumen Ledger · guile · cost 6
    - Cards: take it down word for word.
    - Combat: none.
    - Negotiation: fast notes, so your next Confront doesn't raise pressure.
    - Comment:
20. **Bramble** · Verdant Circle · alchemy · cost 10
    - Cards: grow a hedge or a vine, now.
    - Combat: construct (§D), thorns base 2 spell damage each exchange. It can grow beside Heartwood.
    - Negotiation: fails the meeting.
    - Comment:
21. **Index** · Library Assistant · lore · cost 6
    - Cards: find the page.
    - Combat: none.
    - Negotiation: answer the current request with Lore, whatever its skill.
    - Comment:
22. **Rapport** · Gilded Newt · charm · cost 6
    - Cards: win a room over.
    - Combat: with observers, spend up to 10 Crowns for 1 Renown per 2 Crowns. Less with fewer Crowns; nothing with none.
    - Negotiation: the right joke at the right moment, so your next Deflect costs no Mood and adds no Suspicion. Not a bribe, and nothing flaunted.
    - Comment:
23. **Distil** · Apothecary Clerk · alchemy · cost 0 (the cast is your action)
    - Keeps the `purify` id, renamed with `grim rename`.
    - Cards: draw out, concentrate.
    - Combat: lose base 4 HP, gain 24 ready Mana.
    - Negotiation: none.
    - Comment:
24. **Tailwind** · Broom Courier · vigor · cost 8
    - Cards: go fast.
    - Combat: for 3 exchanges, consecutive Strikes deal +2/+4/+6 base. It ends on any other action, and the opponent sees the run building.
    - Negotiation: none ("you feel fast, but you can't really leave").
    - Comment:

The Midnight Cartographers teach no spell.

## D. Constructs

- A construct is a lasting spell with **no HP of its own**, and it **can't be targeted**.
- It does **one fixed action** at the end of each exchange, in public, so the search gets no new branches.
- **It shares your damage:** each hit on you is reduced by a small flat amount.
- **It ends once you have taken a set amount of HP damage**, scaled by the spell's skill. That is its counter: hit the caster, which every baseline can do.
- Each side has **one construct**. Bramble may grow beside Heartwood (§E).

| Construct | Action each exchange | Reduction per hit | Ends after you take | On ending |
|---|---|---|---|---|
| Animate | Strike base 3 | base 1 | base 10 | — |
| Heartwood | heal you base 2 | base 2 | base 15 | — |
| Bramble | thorns, base 2 spell damage | base 1 | base 8 | — |
| Contraption | spark, base 6 spell damage | none | base 8 | bursts for base 4 to both sides |

- Comment:

## E. Synergy pairs (a peer's spell and the club or job they frequent)

Taken from each character's `schedule:` in `content/world/cast.grim`.

| Peer | Where they are often | Pair | Synergy |
|---|---|---|---|
| Lyra | Duel Hall, afternoon and evening | Wildfire + Brace | Brace soaks Wildfire's self-damage while you hold |
| Nessa | Ledger office, afternoon to night | Candour + Quickquill | Quickquill the turn after Candour prints what was said off the record: +1 Agreement, `alignment −small`, and a flag for a later Nessa event |
| Tobias | Greenhouses, morning and afternoon | Heartwood + Bramble | the only two constructs that can stand together: healing and thorns, with both reductions |
| Corvin | Gilded Newt, evenings | Sleight + Rapport | Sleight steals the Crowns that Rapport spends on the crowd |
| Mir | Workshop, afternoon to night | Contraption + Animate (Artifice, a course rather than a club) | proposal: Contraption may stand beside Animate, and its burst doesn't hurt Animate's caster |
| Seraphine | Observatory, evening and night | Omen + Foresight (a course) | Foresight makes them commit first, so you see whether they'll Ward when the Omen lands |
| Kael | Library, afternoon (60%) | Hoarfrost + Index | no natural pair: Index works in negotiation, Hoarfrost fails it. Left without one |

The Apothecary Clerk (Distil) and Broom Courier (Tailwind) have no regular peer.

- Comment:

## F. Peer capstones: stubs now, chains later

**Now:**
- Each peer has one stub milestone card that teaches their spell, at the "close" rung (rel 36, `soc_become_close`) or as their partner. Design §9.1's "rel ≥ 70" predates the halved friendship speed.
- The stub is a plain scene with a single teaching beat, to be replaced.

**Later:** each becomes a long chain (5–7 cards) that builds to the spell. Ideas drawn from their facts and existing cards:

- **Lyra (Wildfire).**
  - Her mother's letters and the burnt one (`lyra_family_ultimatum`); "she can incinerate a target at forty paces, she cannot make toast".
  - A chain about the fire she was told to keep small: a night she lets it run and something burns that shouldn't. You help her decide whether to hold it or let go.
  - The spell is the fire she stops apologising for. The backlash is the price she never admits to.
- **Tobias (Heartwood).**
  - Ma alone at harvest; the blight; the eleven-year moonflowers; the scarecrow with "just a little life"; the greenhouse storm (`tobias_storm_greenhouse`).
  - A chain about a seedling from home: planting it, a frost, a blight scare, then the night it shelters both of you.
- **Seraphine (Omen).**
  - The 41 conversations; "seers can't see themselves unless someone stands next to them"; her mother, the Oracle of Vell.
  - A chain where she foresees harm to you, and you are the person standing next to her when she finally sees herself.
  - The spell: saying the future out loud so that it lands.
- **Corvin (Sleight).**
  - His grandfather's lucky deck in the confiscation vault (`corvin_confiscation_vault`), his brother's debts, "it's lonely, knowing all the doors".
  - A chain of small thefts for good reasons: lifting a debt marker, returning a stolen thing, and the one trick he never shows.
- **Mir (Contraption).**
  - The padlocked workshop after three fires, the notebooks (`mir_lab_fire`), the forgotten name day, the ornithopter.
  - A chain building something together that keeps almost working, with a spectacular failure before it "probably" works.
- **Kael (Hoarfrost).**
  - Cold hands, the frost duel with Lyra (`slice_frost_duel`), the northern lights he called for you, "wanting is how they control you".
  - A chain about learning to want something, with the cold turned to defence: putting out a fire meant for someone else.
- **Nessa (Candour).**
  - The quill that invents the news, off the record, the red string around a black star, the paper threatened (`nessa_paper_threatened`).
  - A chain about one story she won't print, and teaching you to ask the question people want to answer.

- Comment:

## G. Club and job chains

Every chain follows the same shape:
- **Start:** a `track:` card at rank 2, weight about 8, drawn while the spell is unknown.
- **Middle:** 2–3 preparation cards. Each is either a skill challenge or a resource you spend (Crowns, Health, Mood, time as `perform`). Each one done leaves a flag worth a circumstance step (`+1 if …`) on the final check.
- **Final:** a milestone challenge on the spell's skill, pitched so that full preparation makes it trivial (an `even` check plus three steps is `certain`, per `docs/authoring/checks.md`). An underprepared player can still pay on the final card for extra steps (Crowns, Health or Mood, whatever the scene shows).
- **On failure:** the chain's retry card comes back later (queued). Preparation already done is kept.

1. **Duelling Circle → Brace**
   - Start: the eyepatched dummy starts throwing hexes back, from an old captain's charm in its stuffing.
   - Middle:
     - read the captain's notes (lore challenge);
     - stand in the chalk circle against Bram's hazing barrage (vigor challenge, or Health spent);
     - drill footwork with Lyra (spend `perform` time).
   - Final: hold firm inside the circle while the dummy empties its charm, `feat`.
   - On failure: the dummy waits at practice.
   - Comment:
2. **Lumen Ledger → Quickquill**
   - Start: a spare quill on the drying line finishes your sentences, then starts inventing them.
   - Middle:
     - teach it on the soup complaint (guile challenge);
     - buy proper ink (Crowns);
     - sit through deadline night (Mood).
   - Final: an interview where the subject will deny everything.
   - On failure: the quill sulks in the WILL NOT PRINT basket until your next front page.
   - Comment:
3. **Verdant Circle → Bramble**
   - Start: the far bed answers back, and a seed sprouts in your pocket.
   - Middle:
     - plant it with Tobias or in Maud's secret garden (a choice; both count);
     - feed it through a cold snap (Health);
     - quiet the mandrake choir around it (alchemy challenge).
   - Final: the night it bolts toward the moonflowers.
   - On failure: Maud keeps a cutting and offers it again in Stormbloom.
   - Comment:
4. **Library Assistant → Index**
   - Start: Footnote sits on one catalogue drawer and won't move.
   - Middle:
     - fish for Footnote (Crowns);
     - the hush round with the lamp (lore challenge);
     - follow a wandering section with string (Mood).
   - Final: find Thorne's book, eleven years overdue, while the shelves move, `research`.
   - On failure: lost on the seventh floor, Footnote leads you out; the card returns.
   - Comment:
5. **Gilded Newt → Rapport**
   - Start: the landlady taps the bar twice, and the room laughs instead of fighting.
   - Middle:
     - learn the barge-man's eel story well enough to tell it (charm challenge);
     - stand the regulars' corner a round (Crowns);
     - a double shift (Health).
   - Final: hold the room with a story on a festival night while she's away, `negotiate`.
   - On failure: broken glass and a fine; the next festival night retries.
   - Comment:
6. **Apothecary Clerk → Distil**
   - Start: Pell's oldest drawer holds a recipe for a draught "of your own strength".
   - Middle:
     - count drops with Pell all night (alchemy challenge);
     - buy moonwort (Crowns);
     - try the daughters' shortcut on yourself (Health).
   - Final: brew the draught, `brew`.
   - On failure: "Don't." on the drawer; the next term retries.
   - Comment:
7. **Broom Courier → Tailwind**
   - Start: a jar of wind on the dead-letter shelf.
   - Middle:
     - the fisherman who never waves finally waves, and once flew for the loft (charm challenge);
     - race the gulls (vigor challenge);
     - fix the broom that pulls left (Crowns).
   - Final: a storm delivery across the lake, `feat`.
   - On failure: ditched in the shallows; the next storm season retries.
   - Comment:

## H. Hidden pool (no sources yet)

- **Rime** (Ilse's theme: "a sliver of winter sewn into your collar") · cost 12
  - Combat: once per fight, the first knockout freezes you instead. You stay on 1 HP, unable to act or be hurt for one exchange, then thaw.
  - Negotiation: none.
  - Comment:
- **Reflect** · cost 16
  - Combat: a spell that hits you this exchange returns in full to its caster.
  - Negotiation: turn their words back, so this Confront gives +2 Agreement and +2 pressure.
  - Comment:
- **Moonwell** · cost 0, Holds free
  - Combat: channel. Each Hold banks 10 Mana; Release makes it ready.
  - Negotiation: none.
  - Comment:
- **Lodestar** · cost 8, 2 per Hold
  - Combat: channel. Each Hold adds base 6 absorb; Release sets it until the next attack.
  - Negotiation: none.
  - It overlaps Brace most, so it is the first to cut.
  - Comment:
- **Toll** · cards and story only (Edmund's wand, the bell's note).
  - Comment:
- Cut: Tide (clashes with Hoarfrost), Writ (banning actions), Waymark, Beast-speech (gone), Mirror (gone).

## I. Forbidden pool (no sources yet; the rules in §B apply)

- **Torment** · cost 14
  - Combat: for 3 exchanges, each opponent action costs them base 2 HP.
  - Negotiation (underground only): forces one argument type for the next turns (later).
  - Comment:
- **Extraction** · cost 6
  - Combat: move 16 of the opponent's ready Mana to yours.
  - Negotiation (underground only): reads their mind, so the next challenges are nullified (later).
  - Comment:
- **Siphon** · cost 12 to start, 12 per Hold
  - Combat: channel. The start and each Hold deal base 4; Release heals the total dealt.
  - Negotiation: later.
  - Comment:
- **Compel** · cost 20
  - Combat: cancel the opponent's current action and replace it with their last one, this exchange and the next (longer if balancing needs it). Their actions become fixed, so the search gets cheaper, not dearer.
  - Negotiation (underground only): force 1 Agreement with no Suspicion. The Mana cost keeps it from winning meetings by itself.
  - Comment:
- **Eclipse** · cost 6
  - Combat: the damage you take next exchange becomes ready Mana, 1:1. You still take it, so it is no better than Ward.
  - Negotiation: fails (none, underground).
  - Comment:
- **Heartprice** · cost 0
  - Combat: for the rest of the fight, your spells cost HP (1 HP per 2 Mana).
  - Negotiation: later.
  - Comment:

## J. Skill spread (the 24 sourced spells)

- arcana 4: Flame, Animate*, Wildfire, Hoarfrost
- lore 4: Foresight, Starlight, Omen, Index
- alchemy 5: Mend, Animate*, Contraption, Bramble, Distil
- charm 3: Glamour, Candour, Rapport
- vigor 4: Haste, Heartwood, Brace, Tailwind
- guile 4: Shadowstep, Seal, Sleight, Quickquill

Animate counts under both of its skills; Ward has no skill. Charm is light. Compel (forbidden) is the other charm spell.

- Comment:

## K. Changes from today, for the later implementation pass

**Implemented 2026-10-17**, except the fight wiring and card-side fight data, which wait for the loadouts. How it
landed, and where it differs:
- Format and engine as below, but with no channel or construct data in content: the minigame owns those, and the
  fight prices spells itself (content `cost:` is the card cost from §C).
- Course spells come at the start of each level, from the course's own start card (`@track start:`); passing is only
  the fallback. Every enrolment in 18 bot games learned its level's spell in the enrolment month.
- Saves: removed ids are dropped and levels clamped on load (`load()`), not mapped. Saves from before were already
  refused by `SAVE_VERSION`. The three cut lessons are retired by migration 0033.
- §G chains: the start is pushed (`trigger: auto`) once you reach rank 2, while the spell is unknown and before month
  45; preparations weigh 60 and the final 40 (§G's ~8 left most chains unfinished in a four-year run). The final opens
  two months after the start, with two preparations done, or after six months. Measured over 200 bot games: every member
  who reaches rank 2 by month 42 sees the start, and the bots take it up 40–85% of the time; of the chains taken up,
  about a third finish in a club (it meets twice a term) and 70% in a job. Clubs may want a third meeting or lighter
  preparations once humans have played it.
- Peer capstones are §F's stubs: `trigger: social`, close or partner, one beat.
- Exams are a rung harder (`exam_tiers`, design §7), since the course spell's XP now comes before the exam.

- **Removed or folded:**
  - Tide, Beast-speech and Mirror go. Purify becomes Distil (id kept).
  - Starlight moves to Starcalling.
  - Ward moves to orientation, with no skill and no levels.
- **Saves:** removed ids are mapped by a migration, never by hand.
- **Format additions** (schema v1, additive only):
  - `@spell skill:` (one or two skills, or none);
  - one-value `cost` and `power`;
  - optional `alignment:` per cast;
  - channel and construct data for the minigames.
- **Balance:** `spell_check` keyed by skill; a one-level entry in `spell_bonus`.
- **Simulators:** adding these spells to the combat v2 and negotiation v3 rosters is a separate task. `experiments/minigames/` belongs to a concurrent agent.
- Comment:

## L. Round-1 comments and replies

Your comments are verbatim, each followed by its reply.

**General (course spells):** "think about what new mechanics need to be added to the current minigame designs, and how would they play out and if there are actually enough new spells to support them. Consider basic course spells plus Ward the baselines and other spells should not be as intrusive. For combat spells I want to see more spells playing around with mana management, and for negotiation spells we need the corresponding opponent arguments to be more developed for many of them to actually work, so the v1 design would be better to be more generic. And let's tolerate spells that serve no point in one minigame or even both. Some may be used to gain resources (steal gold from opponent, entertain the crowd for renown), others might just do nothing or basically concede. I also fancy the "channel for X turns" idea in the alternate-telegraph rule and let's maybe do more of it. Course spells don't need headstarts. Specifically for flame, we need the event wordings to subtly hint that it's one of the bread and butter spells for combats."
- Reply: §A lists the new mechanics, and each one has several spells:
  - channel: Starlight, Wildfire, Siphon, Moonwell, Lodestar;
  - constructs: Animate, Heartwood, Bramble, Contraption;
  - observers: Glamour, Rapport, forbidden casts;
  - Crowns: Sleight, Rapport;
  - Mana: Seal, Distil, Moonwell, Extraction, Eclipse, Heartprice, and Hold costs.
- Negotiation uses only generic levers. Spells with no use are allowed. There are no head starts, and Flame's cards will hint.

**Flame:** "This should be the bread and butter for duels. In the future we are going to make core space spell learning at the start of the course instead of after the exam. In negotiations just fail the thing."
- Reply: done. Learning at the start of the course is noted in §B.

**Foresight:** "no need to choose and it should reveal the exchanges one by one instead of all three at a time to save our alphabeta search cost for AI. Level scaling should be 3, 4, 5 exchanges."
- Reply: done. Combat was already one exchange at a time. Negotiation is now a rolling one-ahead reveal, which also cuts the player AI's 8-sample fan-out.
- Expect it to stay weak in negotiation; that is accepted.

**Mend:** "elaborate on what "living specimen requests" means. I don't like the mood effect."
- Reply: it was v3's workshop request ("Mend living specimen: treat it, Alchemy"), and the Mood effect was its waiver of the Mood price. Both are gone; Mend only heals.

**Glamour:** "the absorption should be through wars instead of this. It should just give more renown in combats. Yes combat in the future will have observers that give you renown."
- Reply: done. Ward absorbs; Glamour gives Renown with observers. Until observers exist it does nothing in combat.

**Haste:** "just give you two extra turns in combat, reduce the patient cost in negotiations l."
- Reply: settled later. The cast is your action, then 2/2/3 **basic** actions. Casts are left out because Haste then Flame, Flame, Flame would kill in one exchange.

**Shadowstep:** "evasion in combat for 123 turns but breaks when you use any damaging abilities. It means at level 1 you just evade the oncoming action. In negotiation just forfeit: it's not good to abandon conversations midway."
- Reply: done. It also breaks on regaining Mana, which stops "evade and Reclaim" stalling. In negotiation it's the clean exit, given that withdrawing will become a loss.

**Animate:** "don't like the negotiation effect. Let's design this later in details. For duels we need to figure out how constructs/summons work in combat minigames first."
- Reply: constructs are in §D. Negotiation comes later.

**Starlight:** "in combat I shall let it strike a beam down after one turn of channel, dealing massive damage. In negotiations form it as some soothing effect that gains patience."
- Reply: done with the Hold/Release channel: start, hold, release for full power, with a third through Ward. +2 Patience.

**Seal:** "I don't like the idea of locking enemy spells, since we wanted to be focused on the players' play and very passive reactions to enemy spells, in negotiation seems too overpowered. Let's discuss."
- Reply: nothing is locked. Seal wipes the opponent's flux (your call). No negotiation effect.

**General (peers):** "we may redesign the peers' events so they currently should just be simple stub events. Do document as so that we could redesign them in the future. And also shed some inspirations for designing such events (they should also be long chains of events)."
- Reply: §F has the stubs now and chain ideas for each peer.

**Lyra:** "I want to make it a very strong fire spell since she is a fire prodigy but the spell may come with backlashes"
- Reply: Wildfire, a channel that burns them each Hold, burns you a little, and releases big. Brace is its partner.

**Tobias:** "in combat it should grow some big plant as a construct. Maybe change the spell name."
- Reply: renamed to Heartwood, a construct that heals you and shares your damage.

**Seraphine:** "maybe design something else because undoing is not very friendly for the alphabeta search AI."
- Reply: undo is gone. The redesign is Omen: huge, delayed, public damage.

**Corvin:** "just make the spell steal money in both encounters."
- Reply: done. A small alignment cost, since it's theft.

**Mir:** "I wanted to make it a wilder version of reanimate. Let's discuss."
- Reply: Contraption is a wilder Animate. Bigger damage, no reduction, and it bursts on both sides when it ends.

**Kael:** "he gets a cold-oriented spell, which deals damage while canceling out enemy flame, dealing no damage when it actually cancels out because flame is so common this spell may come in handy ."
- Reply: done (Hoarfrost). It also cancels a Wildfire tick or release: the Lyra–Kael rivalry in one rule.

**Nessa:** "in combat just give very inconsequential effects, like having the enemy spell the truth, which means very little in combat. Mostly flavor. Negotiation: let's discuss before overcomplicating the game design."
- Reply: flavour in combat. In negotiation, simply −3 Suspicion, now the one ordinary Suspicion relief.

**General (synergy):** "relationship-gained spells would be better to synergize with club/job spells if the corresponding characters appear often on those club/job locations. Identify such pairs."
- Reply: §E, taken from the schedules. Lyra–Duelling, Nessa–Ledger, Tobias–Verdant and Corvin–Newt are strong; Mir and Seraphine pair with courses; Kael has no natural pair.

**General (chains):** "make the chains longer with 2-3 middle events to prepare: either take skill challenges or spend resources. At full preparation the final challenge should be trivial. Basically, allow underprepared players get through by spending more."
- Reply: §G. Each preparation is a circumstance step, so full preparation makes the final check certain, and an underprepared player can pay on the final card.

**Duelling Circle (was Riposte):** "negotiation: for one turn, having the confrontation have more positive effects, like actually progressing the agreement. In combat the idea is good but it seems a bit overpowered. I wanted it to actually reflect spells with some detriment in return. I also want it to somewhat synergize with Lyra's spell since Lyra appear at the club often."
- Reply: Riposte became Reflect, in the hidden pool, keeping the +2 Agreement and +2 pressure Confront. The club's spell is now Brace, which soaks Wildfire's self-damage.

**Lumen Ledger:** "in combat, just do nothing with some flavor text. Education: it should accentuate the effect that you are taking fast notes. From there we can design something more generically usable without having to account for repetitive requests like a passive effect. I also want this to have synergy with Nessa's spell, since Nessa shows up in this club often."
- Reply: done. Fast notes mean your next Confront doesn't raise pressure. With Candour it prints the off-the-record answer, at a moral cost.

**Verdant Circle:** "Treat it as a construct in combat. Make this spell synergize with Tobias'. Another instafail for negotiation I assume."
- Reply: done. A thorn construct that can stand beside Heartwood; it fails a negotiation.

**Midnight Cartographers:** "we probably don't need this spell at all."
- Reply: cut. The society teaches no spell.

**Library Assistant:** "do nothing in combat. In negotiation this seems too repetitive with Quick Quill so maybe both Quick Quill and this one should be some things more interesting"
- Reply: separated. Index changes the request's skill to Lore; Quickquill stops the pressure rising.

**Gilded Newt:** "accentuate the effect of making you seem charming. For this spell it should maybe just be charm or some synonym. In combat it should gain renown. In negotiation it should act similarly to glamour. Also make it synergize with Corvin's spell somewhat? Since he's there often."
- Reply: Rapport. Combat is Crowns into Renown (1 per 2). Negotiation is a free Deflect: charm, not a bribe. It isn't Glamour-like, so as not to duplicate a baseline. Sleight funds it.

**Apothecary Clerk:** "There are no much status effects to cleanse at all, so need a full redesign."
- Reply: Distil, which turns Health into Mana. Seraphine's spell was redesigned to avoid the overlap.

**Broom Courier:** "Make the effect focusing on "go super fast" and design it more interestingly. Maybe do nothing on negotiation ("you feel fast but you couldn't really leave") and"
- Reply: Tailwind builds momentum. Each Strike in a row hits harder, and the opponent sees the run coming. Nothing in negotiation.

**Ward:** "Note this along with flame is the "bread and butter" for combat RPS-like gameplay, so make sure it would be gained early and forced. Internship can give it a 1-level boost.  Propose more candidates first."
- Reply: the orientation safety talk, with no skill and no levels (your later call, which replaces the internship boost). It blocks one damaging action for about Flame 3's cost.

**Tide:** "Move such hidden spells into somewhere else and for now don't specify where to get them. Propose more candidates first. Currently don't specify how to gain them. And also tide would clash with kael's spell's redesign of canceling out flames."
- Reply: Tide is cut. The hidden pool (§H) has no sources.

**Rime:** "I like the mana disruption idea. For negotiation since casting already gives suspicion this would be questionable."
- Reply: the flux disruption moved to Seal. Rime became Ilse's freeze in place of a knockout. No negotiation effect.

**Writ:** "Again I don't like the idea of banning actions."
- Reply: cut.

**Toll:** "No spell effect yet to clean."
- Reply: cards and story only.

**Forbidden (on Eclipse):** "For forbidden spells, also do not yet specify where they will be found. Propose more candidates first. Forbidden spells generally should be very powerful, but moves alignment when cast, and should have event consequences after the combat with certain (most) observer conditions. See it like everyone except underground people would disapprove of them, and they should be illegal. They should also instafail negotiations with consequences except interacting with someone from underground, which the effect we would redesign. This one, for combat it's too overpowered compared to ward, and for negotiation it may as well just do nothing."
- Reply: these rules are in §B. Eclipse now turns damage you take into Mana, so it doesn't beat Ward. Its negotiation effect is the forbidden failure.

**Compel:** "No need to remember the lie, just force agreement without invoking suspicion, while have high mana cost so it couldn't be used to force win negotiations. Choosing opponent action would also potentially be harmful for alphabeta search: think wisely."
- Reply: done. In combat it replaces their action with their last one, so their actions are fixed and the search gets cheaper.

**General (forbidden):** "add spells like torment (make every action of combat opponent cost health, in negotiation it forces some certain argument for opponent for next turns) and extraction (siphon mana in combat and nullify challenges in negotiation (as if mind-reading))."
- Reply: both added (§I). Siphon also became a channel.

**Counters:** "See above. I don't like counter ideas for spells hard or very optional to get."
- Reply: §B rule: a counter may only need baselines or basic actions.
