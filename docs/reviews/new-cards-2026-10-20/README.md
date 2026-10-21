# New-card critic pass — October 20, 2026

**285 new cards in 13 files. Verdict: not accepted. 46 findings affecting 50 new cards.**

New means an event ID in the working tree that is absent from Git HEAD `0e4641a5dd8b6cf3607322b971c7bfb1d7647986`, including untracked files. HEAD has 1,100 events; the working tree has 1,385; none were removed. Existing IDs are outside this pass, including the many modified older cards.

The roadmap's 284 count predates the added `ww_night_first`; the Whisperwood group now has 91 cards.

| Group | New cards | Cards with findings |
|---|---:|---:|
| Introductions | 23 | 2 |
| Kit | 25 | 6 |
| Breaks and home | 21 | 3 |
| Whisperwood | 91 | 11 |
| Romance | 65 | 15 |
| Friendship and rivalry | 50 | 10 |
| Spell lessons | 10 | 3 |
| **Total** | **285** | **50** |

## Review and validation

Read every new event in full using [the critic workflow](../../../skills/critic/SKILL.md), the authoring checklist/style/cost/check/class/preset references, worldbook briefs and character facts. Compared possible repeated premises with existing cards. The prior group verdicts describe author self-review; they are not treated as independent acceptance.

- `node tools/grim.js check`: exit 0; 0 lint errors, seven warnings located on older cards (outside the pass); 200 random-policy games, 0 crashes.
- `node --test test/expansion1.test.js test/bonds.test.js test/whisperwood.test.js`: 29 passed, 0 failed.
- `node tools/grim.js balance --quick`: interrupted after several minutes without output during preview enumeration; no balance result is claimed. The pre-existing balance report is byte-for-byte preserved.
- New-card zh-CN: 2,218/2,218 extracted strings translated; 0 missing, 0 stale (read-only inspection; localization was not regenerated).
- Duplicate-text detector: 0 pairs at the default 0.6 five-word-shingle Jaccard threshold touching a new card. This does not detect the semantic repetitions recorded below.
- New-card plot-effect scan: no arc-clock advance or key-clue grants. This does not by itself establish every line is plot-safe; prose was also read.
- Controlled seed-7 engine fixtures reproduce the main state-dependent findings in [validation.json](validation.json). Forced delivery isolates outcomes; these are not run-frequency estimates. Mir's two variant indices were explicitly selected.
- The random simulation saw 225 of 285 new cards; 60 were not observed. This is coverage evidence, not a claim that the latter are unreachable. Boss, rivalry and ex paths need targeted playtests.

No card source was edited. No earlier critic verdict was overwritten. The canonical verdict is [build/batches/new-cards-2026-10-20.critic.json](../../../build/batches/new-cards-2026-10-20.critic.json); [inventory.json](inventory.json) lists every reviewed ID and its source. Full verification was not run because this is a review-only change.

## Findings

The batch fails the critic's canon/class-rule acceptance criteria even though the completed automated checks pass. Fixes below are proposals only, scoped to the new cards; references to older cards are evidence, not requests to revise them. P3 marks small clarification/polish findings.

### 1. ww_way_home — outcome continuity (P2)

[content/events/whisperwood/delve.grim:107](../../../content/events/whisperwood/delve.grim#L107)

Both options reset ww_haul to zero before interpolating their say. A haul of five pays thirty crowns or grants alchemy/lore, but the outcome invariably says the bag was empty or there was nothing to keep. The actual reward is correct; the text denies the main reward of every successful delve.

**Fix:** Move each haul-dependent say before ww_haul is cleared, keeping the existing reward and cleanup logic.

Evidence: validation.json: ww_way_home/left and ww_way_home/right; src/engine.js run() interpolates say at the statement.

### 2. item_spoon_daughters — items (P2)

[content/events/kit/item_stories.grim:268](../../../content/events/kit/item_stories.grim#L268)

Returning the spoon executes take measuring_spoon, then explicitly says Pell sends a new spoon next week. There is no give or queued replacement, so the player permanently loses the promised tool.

**Fix:** Either make the replacement arrive through a new queued item-grant card, or remove the replacement promise and present surrendering the tool as the actual trade.

Evidence: validation.json: item_spoon_daughters/left

### 3. corvin_goat_clause — money (P2)

[content/events/romance/seraphine_corvin_mir.grim:278](../../../content/events/romance/seraphine_corvin_mir.grim#L278)

Lend it removes fifteen crowns and says he pays them back in three weeks. No money is returned and no repayment is queued; the generic card this specializes normally queues soc_loan_repaid.

**Fix:** Queue the existing repayment with Corvin, and phrase the current say before repayment; alternatively describe a gift or an unpaid loan rather than a completed repayment.

Evidence: validation.json: corvin_goat_clause/left; content/events/social.grim:37 soc_borrow_money and soc_loan_repaid.

### 4. corvin_bad_odds — money (P2)

[content/events/bonds/rivals.grim:442](../../../content/events/bonds/rivals.grim#L442)

Bet on yourself removes eight crowns, but the say asserts that you pass an exam and Corvin pays out every coin. No payout, exam resolution or follow-up exists, so the supposed winning wager is only an expense.

**Fix:** Either pay the stated winnings as part of this self-contained vignette and avoid implying it resolves a scheduled exam, or defer the settlement to a new follow-up that actually reads the exam result.

Evidence: validation.json: corvin_bad_odds/left

### 5. ww2_waystone — choices (P2)

[content/events/whisperwood/delve.grim:661](../../../content/events/whisperwood/delve.grim#L661)

Leave an offering can be chosen with an empty haul. It then charges nothing, grants extra grace and passage, and says you left the best thing in the empty bag.

**Fix:** Branch on ww_haul: spend an actual find when present, and give an empty-bag alternative with its own visible sacrifice or different payoff.

Evidence: validation.json: ww2_waystone/empty-bag

### 6. ww_spinner_meet — canon (P2)

[content/events/whisperwood/hush.grim:11](../../../content/events/whisperwood/hush.grim#L11) · Also: `ww_spinner_fight_weak`

The Spinner is described as older than the oaks, and ww_spinner_fight_weak calls her the oldest thing in the wood. Canon says Maud raised her as a hand-sized hatchling during Maud's first winter as groundskeeper; Maud is eighty-one, whereas the elder oak and heartwood explicitly predate the castle.

**Fix:** Describe her size, authority or long rule of the Hush without making her older than its ancient trees.

Evidence: content/world/lore/soft/places.grim:90 the_spinner; content/world/facts/maud.grim: maud.age and maud.tuppence; ww3_elder_oak and ww3_heartwood_hush.

### 7. corvin_lucky_deck — canon and gating (P2)

[content/events/romance/seraphine_corvin_mir.grim:210](../../../content/events/romance/seraphine_corvin_mir.grim#L210)

This card puts Corvin's grandfather's lucky deck in his hands at rel 9, before the existing vault scene can appear at rel 12. Canon explicitly keeps that deck in the confiscation vault until its recovery. Seeing this new card first makes the later recovery nonsensical.

**Fix:** Use an ordinary deck before recovery, with the grandfather's deck only in a branch whose condition genuinely establishes retrieval; do not use merely knowing the fact as proof of a successful recovery.

Evidence: validation.json: corvin_lucky_deck/before-vault; content/world/facts/corvin.grim: corvin.grandfather; content/events/expansion_people.grim:234.

### 8. mir_padlock — continuity and duplication (P2)

[content/events/bonds/friends.grim:367](../../../content/events/bonds/friends.grim#L367)

knows(mir.workshop) establishes that the old closure scene was seen, not that the workshop remains closed. That scene can already end with Thorne reopening it. The new card nevertheless says it is still padlocked and offers the same petition-or-find-another-room resolution again.

**Fix:** Require the unresolved-closure flag for the still-padlocked version, then give this follow-up a consequence distinct from repeating the old reopening/secret-room choice.

Evidence: validation.json: mir_padlock/reopened-workshop; content/events/people_students.grim:849 mir_workshop_closed.

### 9. mir_family_clocks — duplication and continuity (P2)

[content/events/bonds/friends.grim:393](../../../content/events/bonds/friends.grim#L393) · Also: `mir_family_summons`

mir_family_clocks and mir_family_summons both replay the family-clockworks summons with the same two solutions: write back together or take an invention/go home. mir_family_business already presents and resolves that choice, and both new cards require its fact, so a run can resolve essentially the same disagreement three times without acknowledging the previous outcome.

**Fix:** Keep one new follow-up for the consequences of the earlier reply or visit, and give the other a distinct family problem; branch on the established response rather than replaying the initial ultimatum.

Evidence: content/events/people_students.grim:930 mir_family_business; both new events in the inventory.

### 10. seraphine_dark_room — duplication (P2)

[content/events/romance/seraphine_corvin_mir.grim:52](../../../content/events/romance/seraphine_corvin_mir.grim#L52)

This repeatable card repeats seraphine_overwhelmed almost beat for beat: a dark storeroom, everyone's futures being too loud, sitting silently together, and the revelation that your future is quiet. That is already the old card's defining scene and romantic payoff.

**Fix:** Make this a callback with a different shared activity or problem after the earlier episode, and acknowledge whether she has already explained the quiet future; preserve the old scene.

Evidence: content/events/people_students.grim:523 seraphine_overwhelmed.

### 11. seraphine_stand_next — canon clarity (P3)

[content/events/romance/seraphine_corvin_mir.grim:7](../../../content/events/romance/seraphine_corvin_mir.grim#L7)

The worldbook's seer rule comes from failing to paint her own future unless someone stands next to her. Here ordinary physical self-reflection is treated as something she has never been able to see: she discovers what she looks like and says she is taller than she thought. That extends a limit on foresight into unexplained mirror-blindness.

**Fix:** Make the mirror reveal a future image of her beside you, so the discovery uses the established exception without inventing inability to see her present appearance.

Evidence: content/events/expansion_people.grim:186 seraphine_painting; content/world/facts/seraphine.grim: seraphine.self.

### 12. tobias_ex — continuity (P2)

[content/events/romance/lyra_tobias.grim:359](../../../content/events/romance/lyra_tobias.grim#L359)

The ex encounter assumes the player owns a sunflower Tobias gave them months ago. A breakup can happen before tobias_seed_month appears, and even its other variant gives a herb instead. The specialization has no condition establishing that particular gift.

**Fix:** Use a conditional sunflower callback only after a recorded sunflower gift, or change the scene to watering an existing plant without asserting that specific earlier gift.

Evidence: tobias_seed_month; soc_ex_encounter only requires an ex bond.

### 13. mir_tinkering_evenings — linked variants (P2)

[content/events/romance/seraphine_corvin_mir.grim:513](../../../content/events/romance/seraphine_corvin_mir.grim#L513)

Variant 0 sets up a backwards music box but the reading outcome finishes a kettle. Variant 1 sets up a kettle but the tools outcome finishes the music box. The variants share an index, so these are reproducible object swaps, not independent decorative details.

**Fix:** Align each outcome at index 0 with the music box and each at index 1 with the kettle.

Evidence: validation.json: mir_tinkering_evenings/0/right and /1/left

### 14. lyra_second_place — linked variants (P2)

[content/events/romance/lyra_tobias.grim:10](../../../content/events/romance/lyra_tobias.grim#L10)

The second showing has Lyra already one mark ahead and the third has an exact tie, but the fixed dialogue still says she will have one mark back. The setup no longer supplies the deficit she is responding to.

**Fix:** Put the deficit/ahead/tie response in the same three-position sequence as the rankings.

### 15. lyra_not_second — linked variants (P2)

[content/events/romance/lyra_tobias.grim:101](../../../content/events/romance/lyra_tobias.grim#L101)

The skipped commitment varies between a study group, a club meeting and a friend's crisis, while Lyra's fixed complaint always calls it a study group. The losing outcome also calls every reason an excuse, including helping a friend in crisis.

**Fix:** Match the complaint and response to each setup variant, and let the crisis version acknowledge the actual competing obligation.

### 16. brk_holiday_edition — continuity and repeats (P2)

[content/events/breaks.grim:184](../../../content/events/breaks.grim#L184)

Give her a real one reports the cook's pie or the snowball fight as established events without requiring either to have happened. The snowball outcome can be selected in a summer break even though brk_snowball_bram is winter-only.

**Fix:** Use season-appropriate news that exists independently of another player choice, or gate the specific callbacks on the corresponding witnessed events.

### 17. jit_real_negotiation — choice memory (P2)

[content/events/intro.grim:299](../../../content/events/intro.grim#L299)

The follow-up only requires seeing intro_wrong_tower, but Remember how the steward folded states that she corrected the list when asked about its line. The player may have carried the trunk without negotiating, lost the negotiation, or reached only the porter compromise.

**Fix:** Branch the recollection on the earlier choice and result, or use a neutral label and lesson that remains true for all four paths.

### 18. jit_long_break — gating (P2)

[content/events/intro.grim:249](../../../content/events/intro.grim#L249)

This auto card can appear while plan_home makes off_campus true, but its scene and both outcomes place the player in the empty castle, walking its halls and talking to its cook.

**Fix:** Give home and castle plans their own context-appropriate outcomes, or show the card before the player departs.

Evidence: validation.json: jit_long_break/home

### 19. ww3_always_midnight — gating (P2)

[content/events/whisperwood/delve.grim:1081](../../../content/events/whisperwood/delve.grim#L1081)

The clearing is described as a pocket of midnight with real daylight behind it, and retreat says it becomes afternoon again. Its when accepts both daytime and ww_hush == 1 midnight descents, so an actual midnight visit can return the player to an afternoon that does not exist.

**Fix:** Use ww_hush to branch the surrounding time and retreat prose, or keep the daylight illusion on daytime descents and supply an appropriate midnight counterpart.

### 20. ww_spinner_hoard — choice memory (P2)

[content/events/whisperwood/hush.grim:101](../../../content/events/whisperwood/hush.grim#L101)

The only outcome says you do not yet know who the girl is when the Spinner asks after Maud. The player may already know maud.tuppence, including via the earlier Maud card or an earlier cocoon rescue.

**Fix:** Branch on knows(maud.tuppence): recognize Maud when known and retain the mystery only when it is not.

### 21. ww4_moonpetal_bloom — items and continuity (P2)

[content/events/whisperwood/delve.grim:1433](../../../content/events/whisperwood/delve.grim#L1433)

After the player finds the locket and sells it, has_item(moonpetal_locket) is false but ww_locket_found remains true. The setup promises something glinting on a root again, while Gather refuses to grant it because the persistent flag is set.

**Fix:** Use ww_locket_found as well as current ownership when deciding whether the setup contains the glint; reserve that setup for the first actual find.

### 22. tobias_plants_vote — costs (P2)

[content/events/bonds/friends.grim:149](../../../content/events/bonds/friends.grim#L149)

Do what the seedling says subtracts lore for taking advice. The prose shows neither loss of knowledge nor missed coursework, and costs.md explicitly forbids skill XP as a choice cost.

**Fix:** Remove the lore decrement; the options already trade mood against Tobias's relationship gain.

Evidence: validation.json: tobias_plants_vote/left; docs/authoring/costs.md skill row.

### 23. kael_frost_fern — costs (P2)

[content/events/bonds/friends.grim:463](../../../content/events/bonds/friends.grim#L463)

Drawing something silly subtracts arcana even though the scene is a successful magical trick and shared joke. Skill XP is explicitly never a choice cost.

**Fix:** Remove the arcana decrement and retain the mood-versus-arcana/relationship choice, or show a permitted resource cost if one is needed.

Evidence: validation.json: kael_frost_fern/left; docs/authoring/costs.md skill row.

### 24. item_hazel_tuned — costs (P2)

[content/events/kit/item_stories.grim:50](../../../content/events/kit/item_stories.grim#L50)

Let them tinker spends the player's mana, but its say only describes waiting while Mir adjusts the wand. Neither the player casting nor the wand drawing their magic is shown.

**Fix:** Show the tuning drawing magic through the player, or remove the mana charge and retain a trade grounded in the scene.

### 25. lyra_allies_thornwick — costs (P2)

[content/events/bonds/rivals.grim:88](../../../content/events/bonds/rivals.grim#L88)

Stand with her loses health although the visitors immediately leave without a fight or exertion. Let her handle it grants substantial study even though the outcome never says the player goes to study. Both sides have effects unsupported by their scenes.

**Fix:** Remove the invented injury/exertion cost or show one, and show the player using the time for study if the study reward remains.

### 26. bram_steps_in — costs and alignment (P2)

[content/events/bonds/rivals.grim:368](../../../content/events/bonds/rivals.grim#L368)

Standing beside Bram loses health even though the bullies leave as soon as you arrive. The other option describes Bram getting hurt, but his injury cannot justify charging the player on this one. Directly risking yourself to protect the first-year also has no alignment movement, unlike running for help.

**Fix:** Make the direct-protection cost visible or drop it, and apply the protection choice's moral effect consistently with its actual risk.

### 27. mir_notebooks — choice memory (P2)

[content/events/romance/seraphine_corvin_mir.grim:469](../../../content/events/romance/seraphine_corvin_mir.grim#L469)

Mir says nobody has read the notebooks, but item_hazel_tuned can already have ended with Mir taking the player through every page. Neither card excludes or acknowledges that earlier visit.

**Fix:** Use knows(mir.notebooks) or the earlier chosen option to distinguish a first invitation from returning to a notebook already shared.

Evidence: item_hazel_tuned right outcome in content/events/kit/item_stories.grim.

### 28. item_borrowed_initials — class rules (P2)

[content/events/kit/item_stories.grim:7](../../../content/events/kit/item_stories.grim#L7)

Ask him about her gives lore, relationship and a fact with no loss. Ask if it is worth anything only loses mood. Both are deterministic, so the second choice offers no compensating benefit or distinct route. The fact grant should not hide an otherwise dominated routine choice.

**Fix:** Give the valuation question a distinct useful result grounded in the wand's history, or make the choice trade two different discoveries instead of a reward against pure shame.

### 29. ww2_briar_maze — class rules and items (P2)

[content/events/whisperwood/delve.grim:569](../../../content/events/whisperwood/delve.grim#L569) · Also: `ww2_grumpy_oak`, `ww2_fog_wall`

The lodestone option grants the checked route's entire success result, passage to the next depth, with no cost or risk. The same issue occurs with heartwood at the grumpy oak (including the acorn haul) and the tine at the fog wall. Owning the item should pay off, but these options leave no reason to choose the ordinary route while the item is owned. Plain checks grant no automatic XP to supply a hidden trade.

**Fix:** Keep the item route safe and distinguish its reward from the checked route: for example, bypass the oak without its acorn, or give solving the maze/parting the fog an explicit learning reward the shortcut forgoes.

Evidence: docs/authoring/classes.md; skills/critic/SKILL.md Items and recipes; src/engine.js challenge execution.

### 30. nessa_corrections_column — player pronouns (P2)

[content/events/romance/kael_nessa.grim:307](../../../content/events/romance/kael_nessa.grim#L307)

The first Write one back outcome calls the player She. The game supports he, she and they, and this wording is used for all of them.

**Fix:** Use first person inside the submitted correction, or remove the pronoun rather than adding an unsupported player-token syntax.

Evidence: validation.json: nessa_corrections_column/he; src/ui.js PRONOUN_KEYS; src/engine.js newGame pronouns.

### 31. lyra_teach_spell — checks (P2)

[content/events/romance/lyra_tobias.grim:431](../../../content/events/romance/lyra_tobias.grim#L431)

Learning a family flourish is resolved by bare chance likely, independent of the player's arcana or spell knowledge. This is explicitly a coached skill exercise, so it fails the checks.md rule that skill-sensitive attempts are not pure chance.

**Fix:** Use a plain spell check pitched at the flourish itself, with the same successful lesson and singed-sleeve outcomes.

### 32. corvin_takes_the_blame — checks and canon (P2)

[content/events/bonds/friends.grim:293](../../../content/events/bonds/friends.grim#L293)

Corvin talking past Vey is a bare coin toss even though deception and their relationship are central to the scene. On failure, the promised final detention also becomes his last but one, contradicting the card's opening and corvin.last_warning.

**Fix:** Use an appropriate deception/appeal check and make failure honor the stated final-warning stakes, or rewrite the new scene's setup to describe a lesser penalty it can actually deliver.

Evidence: content/world/facts/corvin.grim: corvin.last_warning.

### 33. nessa_argument — checks (P2)

[content/events/romance/kael_nessa.grim:412](../../../content/events/romance/kael_nessa.grim#L412)

Argue for the record flips chance even between losing the argument publicly and turning it into an affectionate exchange. That outcome is plausibly affected by persuasion and the relationship, but neither can affect this roll.

**Fix:** Use an appropriately pitched plain social check and, if relevant, a relationship circumstance step; retain the two distinct outcomes.

### 34. home_fields_harvest_help — alignment (P2)

[content/events/breaks.grim:358](../../../content/events/breaks.grim#L358)

Quietly using lift and warmth to help neighbours finish their work moves the player Hollow. No theft, deceit, coercion or exploitation is described; the neighbours being wary of magic does not supply a moral wrong.

**Fix:** Remove the Hollow shift, or describe an actual ethically costly shortcut if that is the intended tempting alternative.

Evidence: docs/authoring/checklist.md Alignment; docs/authoring/costs.md.

### 35. item_robes_copied — alignment (P2)

[content/events/kit/item_stories.grim:113](../../../content/events/kit/item_stories.grim#L113)

A free compliment to a first-year grants Lumen alignment. The scene shows ordinary kindness with no sacrifice, so it moralizes politeness contrary to the requirement that positive alignment reflect generosity/protection/honesty at a real cost.

**Fix:** Drop the alignment reward and keep the reputation outcome, or make a genuine costly act the choice.

### 36. corvin_last_warning — alignment (P2)

[content/events/romance/seraphine_corvin_mir.grim:233](../../../content/events/romance/seraphine_corvin_mir.grim#L233)

Tell him to stop being stupid grants Lumen despite being cost-free advice. No sacrifice or moral risk is shown, and the more supportive promise on the other side is not itself a moral failing.

**Fix:** Remove the alignment change from this ordinary relationship choice.

### 37. nessa_quill_loose — alignment (P2)

[content/events/bonds/friends.grim:536](../../../content/events/bonds/friends.grim#L536)

Leaving a headline up specifically because its false claims benefit the player grants renown and only costs Nessa's regard. The outcome explicitly confirms the player knows it is fabricated; lying for gain is a stated Hollow choice.

**Fix:** Add the appropriate Hollow direction to knowingly exploiting the false headline, keeping the concrete editorial consequence.

### 38. lyra_sabotage_returned — alignment (P2)

[content/events/bonds/rivals.grim:34](../../../content/events/bonds/rivals.grim#L34)

Escalate wins renown by secretly tampering with Lyra's next spell and publicly humiliating her, but neither outcome moves alignment. This is deliberate cheating for gain, not ordinary rivalry practice.

**Fix:** Apply the Hollow movement to choosing the sabotage, before the check, so getting caught does not determine its moral weight.

### 39. shop_grimsbys — repeats (P2)

[content/events/kit/shops.grim:188](../../../content/events/kit/shops.grim#L188)

On the second showing, the sequence says Grimsby remembers what you bought last year. The counter repeats every month and can be visited twice in the first year; the first visit can also have been browsing without buying.

**Fix:** Make the second showing refer to a previous visit without asserting either a purchase or a completed year, or gate those details on actual history.

### 40. ww_spinner_fight — costs (P3)

[content/events/whisperwood/hush.grim:46](../../../content/events/whisperwood/hush.grim#L46)

The second Yield variant says the Spinner takes half the haul, but the code always removes two units (or empties a smaller bag). For a haul of eight that is a quarter, and for one it is the whole bag.

**Fix:** Say a toll or a share consistently with the fixed deduction, or implement a genuinely proportional toll if that is the intended choice.

### 41. shop_newt — gating and repeats (P2)

[content/events/kit/shops.grim:254](../../../content/events/kit/shops.grim#L254)

The always counter has no time restriction, while the Newt opens at night and midnight. Its setup and title insist it is by day/in the afternoon, including sunlight through the windows, so it narrates daylight on midnight visits.

**Fix:** Make the counter's prose valid for the current slot, or restrict this daytime version and supply night-appropriate counter wording.

Evidence: content/world/places.grim:337 gilded_newt open and always fields.

### 42. lesson_rime — gating (P2)

[content/events/pools/spell_lessons.grim:632](../../../content/events/pools/spell_lessons.grim#L632)

This auto lesson requires only knowing Rime, term and meeting Kael. It always places ordinary snow in the courtyard and makes the player stand in it, even in a summer term; only the separate Hush hollow is canonically always winter.

**Fix:** Gate the snowy version to winter, or write a season-independent demonstration using the frost Kael actually creates.

### 43. kael_bakery_window — gating (P2)

[content/events/romance/kael_nessa.grim:74](../../../content/events/romance/kael_nessa.grim#L74)

The setup infers how long Kael has been waiting from accumulated snow on his shoulders, but the repeatable card has no winter gate or seasonal alternative. It can present falling snow at the temperate academy in any season.

**Fix:** Use seasonal weather variants or require winter for this snow-specific setup.

### 44. home_fields_night_sky — gating (P2)

[content/events/breaks.grim:398](../../../content/events/breaks.grim#L398)

The card and scene are explicitly set at night under visible stars, but there is no time restriction and home_fields is open in morning, afternoon and evening. It can be dealt in broad daylight.

**Fix:** Restrict this card to the evening visit and describe waiting for dark, or move the nighttime viewing to a home place open at night.

Evidence: content/world/places.grim:498 home_fields.

### 45. lesson_siphon — gating (P2)

[content/events/pools/spell_lessons.grim:654](../../../content/events/pools/spell_lessons.grim#L654)

The lesson always says an exam is tomorrow morning, but it is an auto card in any term month after learning Siphon. Most eligible months are not exam months, and the card does not require a night slot.

**Fix:** Use a general next-day obligation that fits any eligible term month, or gate the exam-specific lesson to the actual exam timing and night context.

### 46. lesson_heartprice — gating (P2)

[content/events/pools/spell_lessons.grim:754](../../../content/events/pools/spell_lessons.grim#L754)

The setup explicitly tells the player their Mana is spent, but eligibility reads only knowing Heartprice and term. A player at full Mana gets the same claim, weakening the choice's stated reason to pay in health.

**Fix:** Gate the depleted-Mana version on the actual resource, or describe choosing to conserve Mana rather than falsely saying none remains.

## Resolution (October 20, 2026)

Each finding was checked against the source before fixing. 45 are fixed; #38 is declined. The critic's verdict above stands as written; these fixes await a re-review.

**Declined: #38 `lyra_sabotage_returned`.** A prank war is not a moral choice in this game: `life_prank_war`'s Retaliate moves no alignment, and this card escalates the same donkey-smoke rivalry. Adding Hollow here would make the two disagree.

**Partly taken:**
- **#11:** the card quoted the canon fact word for word. It now reads it as the critic does: she sees herself *ahead* only beside someone.
- **#32:** the canon half is fixed: failure gives no detention, since one more would send him home. The check stays a `chance`, because it is Corvin talking, not the player.

| # | Card | Fix |
|---|---|---|
| 1 | `ww_way_home` | each `say` runs before the haul is emptied; regression test in `test/whisperwood.test.js` |
| 2 | `item_spoon_daughters` | no replacement spoon promised; giving it back is the trade |
| 3 | `corvin_goat_clause` | queues `soc_loan_repaid` with Corvin; he *promises* three weeks |
| 4 | `corvin_bad_odds` | a self-contained wager on a mock paper: a research check pays out or keeps your coin |
| 5 | `ww2_waystone` | an empty bag offers a coin from your purse (`gold -tiny`), with its own text |
| 6 | `ww_spinner_meet`, `ww_spinner_fight_weak` | "queen of the Hush", "the biggest thing in the wood" |
| 7 | `corvin_lucky_deck` | only after `corvin_confiscation_vault` |
| 8 | `mir_padlock` | reads `flag(mir_workshop_shut)`; a later beat: give up your desk, or ward the room (a win reopens it) |
| 9 | `mir_family_clocks`, `mir_family_summons` | clocks is the aftermath of `mir_family_business` (the prize, or the father's letter); summons is a different problem (the family wants to meet you) |
| 10 | `seraphine_dark_room` | after `seraphine_overwhelmed`; a callback: sorting paints by feel in the dark |
| 12 | `tobias_ex` | "the plant on your sill", no assumed gift |
| 13 | `mir_tinkering_evenings` | outcome variants realigned: 0 is the music box, 1 the kettle |
| 14 | `lyra_second_place` | her line follows the ranking (back / make it two / break the tie) |
| 15 | `lyra_not_second` | complaint and loss follow the variant; the crisis isn't called an excuse |
| 16 | `brk_holiday_edition` | break-neutral news (the cook's habit, a portrait that moved) |
| 17 | `jit_real_negotiation` | the recap is true on every path |
| 18 | `jit_long_break` | home and castle versions (`off_campus`) |
| 19 | `ww3_always_midnight` | daytime descents only (`ww_hush == 0`) |
| 20 | `ww_spinner_hoard` | names Maud when `maud.tuppence` is known |
| 21 | `ww4_moonpetal_bloom` | no glint once the locket was found |
| 22, 23 | `tobias_plants_vote`, `kael_frost_fern` | skill decrement removed |
| 24 | `item_hazel_tuned` | the say shows the wand drawing on you |
| 25 | `lyra_allies_thornwick` | a parting jinx shown; the study is shown |
| 26 | `bram_steps_in` | a shove shown; `alignment +tiny` for standing in |
| 27 | `mir_notebooks` | `not knows(mir.notebooks)` |
| 28 | `item_borrowed_initials` | asking its worth sells him your old maps (`gold +small`, `rel grimsby -tiny`) |
| 29 | `ww2_grumpy_oak`, `ww2_briar_maze`, `ww2_fog_wall` | the heartwood skips the acorn; solving the maze or fog teaches (`lore`/`arcana +tiny`), the item shortcut doesn't |
| 30 | `nessa_corrections_column` | "The reader was delighted" |
| 31 | `lyra_teach_spell` | `challenge spell apprentice+ likely` |
| 33 | `nessa_argument` | `challenge appeal vs nessa.charm` |
| 34 | `home_fields_harvest_help` | Hollow becomes `mood -tiny` (the neighbours' wariness) |
| 35 | `item_robes_copied` | alignment removed |
| 36 | `corvin_last_warning` | alignment removed; both sides learn the fact; the promise costs a sleepless night |
| 37 | `nessa_quill_loose` | `alignment -tiny` for keeping the false headline |
| 39 | `shop_grimsbys` | "like an old customer", no purchase or year |
| 40 | `ww_spinner_fight` | "her share", matching the fixed toll |
| 41 | `shop_newt` | "The Newt's Counter"; day or night lines by slot |
| 42 | `lesson_rime` | winter snow, or frost he lays on the flagstones |
| 43 | `kael_bakery_window` | snow in winter, rain otherwise |
| 44 | `home_fields_night_sky` | `slot: evening`; you wait for dark |
| 45 | `lesson_siphon` | "lectures at eight"; `slot: night` |
| 46 | `lesson_heartprice` | the Mana line reads `mana`; `slot: night` |

**A guard for next time.** The lint now errors on a skill lowered by an option (`tools/grim.js`; `costs.md`: a skill is never a cost). It found one older card, `tutor_hopeless`, whose contraption now costs its parts (`gold -tiny`).
