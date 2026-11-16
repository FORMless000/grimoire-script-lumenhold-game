# Independent critic findings

270 findings from the completed 644-card pass. Shared findings are written once and list the other affected cards. These are review requests; no source repairs have been applied.

Scope and validation: [review ledger](progress.json), [completion audit](completion-audit.json), [method and evidence](README.md). The project has 2,147 active definitions, or 2,187 including 40 retired/disabled definitions.

## maps-peer-fallbacks-2026-11-15

**Revise** · 7 cards · 5 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/maps-peer-fallbacks-2026-11-15.critic.json)

Rejected on a dominated option, an unshown cost and seasonal/time continuity. All seven cards were read; required similarity review is complete.

### [vaneshade_house_quiet_hour](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/placeholders.grim:264) — class rules / dominated choice

Leaving your name grants Mood +tiny and loses Renown -tiny; walking on grants the identical Mood +tiny with no loss. Neither route has a check, follow-up or other benefit. The right option is strictly better. The placeholder tag exempts this from automatic budget lint, not the routine trade rule.

**Fix:** Give leaving a name its own distinct benefit shown in the outcome, or change the outcomes so the two options trade different things. Retiring the fallback after replacing its function is also an option.

### [ten_clockworks_quiet_hour](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/placeholders.grim:377) — unshown cost

Look at the clocks always costs Mood -tiny. Both outcomes are pleasant discoveries: a backwards hobby clock and a working thimble clock. Neither outcome shows embarrassment, boredom, worry or another loss of spirits.

**Fix:** Show the frustration or disappointment that costs Mood in each variant, or remove the unshown cost; the alternative already offers a different gain.

### [fennick_farm_quiet_hour](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/placeholders.grim:441) — unshown cost

The second Lend a hand outcome only says you stake tomatoes in the wind and your hands smell green. It still deducts Health -tiny, but shows no exertion, cold, injury or tiredness. The first variant has a chase; that does not cover the second.

**Fix:** Add the physical cost to the second outcome, such as aching arms from working the row, or choose a cost the outcome actually depicts.

### [fennick_farm_quiet_hour](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/placeholders.grim:441) — season continuity

The random second outcome has you staking tomatoes in the outdoor rows in any season. The card has no seasonal gate or winter replacement, and countryside breaks include winter. The scene establishes an exposed windy upland farm, not a greenhouse.

**Fix:** Use a winter-appropriate job through a seasonal conditional, or gate this tomato-growing version to its growing season and preserve a winter fallback.

### [hollis_house_quiet_hour](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/placeholders.grim:294) — time continuity

The first Knock outcome says the family is at luncheon. The card has no time restriction and Hollis House is open at noon, afternoon and evening, so this answer can appear on an evening visit. The piano is also specifically a noon habit in the family lore.

**Fix:** Gate this version with slot: noon, or make the meal/piano details conditional on the actual slot and write an evening variant.

## maps-capital-fallbacks-2026-11-15

**Revise** · 3 cards · 2 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/maps-capital-fallbacks-2026-11-15.critic.json)

Rejected on afternoon wording without slot gating and a Mood cost described as physical neck strain. All three cards were read; required similarity review is complete.

### [capital_townhouse_quiet_hour](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/placeholders.grim:27) — time continuity

The fixed text says this afternoon, but the card has no slot or time gate. The townhouse is open through night and its away-day recipe supplies visits at noon, afternoon, evening and night. It can describe an afternoon during the night slot.

**Fix:** Use slot: afternoon for the specific scene, or remove/condition the afternoon wording and the warm sun detail for later visits.

### [capital_library_quiet_hour](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/placeholders.grim:12) — cost/resource mismatch

Read a while deducts Mood -tiny. Its first outcome shows an aching neck and a head full of new knowledge, a physical cost and positive discovery, without a loss of spirits. The second outcome has the librarian coughing you out, but that does not show the first variant paying its Mood cost.

**Fix:** Show boredom, embarrassment or another actual Mood cost in the first variant; alternatively use a physical cost with matching prose in every variant.

## between-generic-2026-11-15

**Revise** · 15 cards · 4 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/between-generic-2026-11-15.critic.json)

Rejected. Four cards have concrete defects: a mismatched boot-hex scene, missing promised detention, a dishonest reconciliation with no moral cost, and unshown variant costs. All 15 cards and required similarity checks are complete.

### [between_boot_hex](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between.grim:107) — linked-variant continuity

The fixed scene describes boots jigging along the flagstones in all three variants. Variant 2 only makes the boots squelch and variant 3 ties the laces together; their outcomes continue those distinct hexes without dancing. The displayed scene contradicts two of the three matched text/outcome sets.

**Fix:** Use a scene that covers all three boot hexes, or give the scene three matched random variants.

### [between_cover_roll](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between.grim:309) — promised consequence missing

The failed impersonation says It's a detention for you, but applies only relationship changes, Mood loss and Alignment. It never gains detention. A forced seed-7 loss reproduces the sentence while the player has no detention state.

**Fix:** Apply the promised detention using the existing state conventions, or describe the actual lesser consequence instead.

### [between_falling_out](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between.grim:388) — alignment and check/action mismatch

The successful appeal reconciles the friends by sending each a false note saying the other has apologized. The player gains both friendships through that lie, with no Hollow movement. The action actually described is deception, despite the option testing appeal.

**Fix:** Make the invitation honest and keep an appeal, or describe and test the deceptive scheme as deception with the appropriate moral cost.

### [between_inside_joke](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between.grim:288) — unshown variant costs

Laugh along loses relationship with a even in the variants where only b pats your shoulder kindly, or a is delighted to discover you do not know the joke. Neither shows a becoming cooler. The final explanation variant also charges Mood for a successful reenactment that ends You're in it now, with no adverse feeling shown.

**Fix:** Show a's actual disappointment in each affected laugh variant, and show the emotional cost of the explanation where charged; otherwise remove the unshown costs and preserve an honest choice between distinct gains.

## between-known-a-2026-11-15

**Revise** · 15 cards · 5 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/between-known-a-2026-11-15.critic.json)

Rejected on concrete continuity, cost and consequence defects. All source events, variants and required similarity checks are complete.

### [corvin_between_debt](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_known.grim:247) — promised repayment missing

Pay it yourself removes Gold -small, and the outcome says Corvin pays you back three weeks later in coins. There is no refund, queued repayment or remembered obligation in this branch, so the promised returned principal never reaches the player.

**Fix:** Implement the promised repayment through a queued follow-up with matching Gold, or explicitly describe an unpaid loan/gift rather than a completed repayment.

### [kael_between_kindness](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_known.grim:89) — unshown cost

Bring them both to the boathouse always charges Mood -tiny. Its three outcomes show a quiet acceptance, a new stone-skipping friendship, and Kael sharing a Northern snow word. None shows the player feeling embarrassed, worried, bored or otherwise paying a loss of spirits.

**Fix:** Show the player's social strain or another actual Mood cost in each outcome, or remove the charge and preserve a real trade against the other option.

### [bram_between_coaching](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_known.grim:194) — time continuity

The scene says late at night and the text says you enter the hall late, but this social card has neither a slot restriction nor conditional timing. Social cards can be spread through the day, so this late-night discovery can display at noon or another earlier slot.

**Fix:** Use slot: night for this scene, or rewrite the setup and scene so an earlier showing fits.

### [nessa_between_match](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_known.grim:344) — alignment

Nominate o publishes a friend's private crush without consent and earns Renown and Nessa's approval while costing the friend's trust, but makes no Hollow movement. This is exploitation of another person for social gain under costs.md.

**Fix:** Add the appropriate moral cost to the nonconsensual nomination, or change the setup so the friend has authorized publication and adjust the trade accordingly.

### [mir_between_blunt](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_known.grim:396) — unshown study cost

Translate for Mir always deducts study -tiny, but all three outcomes describe explaining Mir's behaviour and the resulting friendship. None says the player missed revision, a lecture or other academic work. The card can also show on a castle break when no course is enrolled.

**Fix:** If skipped study is the intended price, show it in every variant and make the academic cost meaningful when the card shows; otherwise use a cost actually depicted in the scene or a different honest trade.

## between-known-b-2026-11-15

**Revise** · 12 cards · 8 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/between-known-b-2026-11-15.critic.json)

Rejected: several costs are not shown by the player's outcomes, including costs attributed to another character's embarrassment and academic costs that can do nothing on breaks. All source events, variants and required similarity checks are complete.

### [seraphine_between_warning](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_known_2.grim:9) — unshown or ineffective cost

Take the south stair deducts player Mood -tiny, but its outcome describes the classmate feeling silly, avoiding trouble, and becoming closer to Seraphine. No loss of the player's spirits is shown; the classmate's feeling is not the player's cost.

**Fix:** Show what the player finds worrying or upsetting, or remove the unshown Mood charge and keep the options trading their different relationship gains.

### [seraphine_between_sentences](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_known_2.grim:31) — unshown or ineffective cost

Ask Seraphine to stay in today loses relationship with o in every variant, but no outcome shows o disapproving. The request is being made on o's behalf. The first and third variants also deduct player Mood while only showing Seraphine pleased or managing a conversation, without showing the player's loss.

**Fix:** Show o's actual reaction to your intervention and the player's emotional cost in every charged variant, or replace/drop the effects that do not follow from the scene.

### [tobias_between_sulking](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_known_2.grim:105) — unshown or ineffective cost

Helping o apologise to the ferns deducts player Mood -tiny. The outcome calls o mortified while the player holds a watering can and Tobias coaches. It does not show the player sharing that embarrassment or otherwise paying a Mood cost.

**Fix:** Give the player a concrete awkward or frustrating part in the apology that shows the charge, or remove it; do not use the other character's embarrassment as the player's cost.

### [maud_between_soup](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_known_2.grim:130) — unshown or ineffective cost

Sitting with the sick classmate deducts study -small, but the outcome names no missed lecture, revision or academic obligation. This card is also not term-gated, so it can play during a castle break when there is no enrolled course for that study cost to affect.

**Fix:** Show the academic work actually sacrificed and restrict the academic-cost version appropriately, or use a meaningful cost that the visit depicts in term and on breaks.

### [maud_between_beans](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_known_2.grim:152) — unshown or ineffective cost

Re-staking the beans deducts study -tiny, but its outcome places the job at dawn before Maud is up and never says any academic work was missed. It can also play on a castle break when study has no enrolled course to affect.

**Fix:** Show and gate the skipped academic work, or use the physical exertion of re-staking the row as the trade, with matching prose.

### [thorne_between_hard](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_known_2.grim:205) — unshown or ineffective cost

Read the red ink with o deducts study -tiny, yet the outcome describes working through and understanding Thorne's academic feedback, and gives Arcana. Nothing says the player misses their own revision, lecture or deadline to do this.

**Fix:** Show the player neglecting their own actual academic obligation while helping o, or remove the unexplained preparation loss.

### [isolde_between_complaint](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_known_2.grim:277) — unshown or ineffective cost

Helping rewrite the complaint deducts study -tiny, but the outcome only describes trimming the letter and the classmate's successful appointment. No academic work the player gives up is identified.

**Fix:** Name the player's missed revision or other academic obligation in the outcome, or choose a different trade that the scene shows.

### [tobias_between_sayings](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_known_2.grim:54) — duplicate premise

This repeats tobias_bullied's specific encounter: a classmate publicly mocks Tobias's farm accent while others laugh and Tobias tries to hide how much it hurts, leaving the player to intervene. Bram can even fill the new mocking role because he is an eligible peer who does not get along with Tobias. The new way to redirect the mockery does not replace the already-used setup or the confrontation option.

**Fix:** Use a different Tobias-and-classmate conflict, or consolidate the new redirection option into the existing accent-mocking encounter instead of keeping two versions of that scene.

## maps-travel-mornings-2026-11-15

**Accepted** · 2 cards · 0 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/maps-travel-mornings-2026-11-15.critic.json)

Accepted. Both quiet travel mornings offer distinct gains and fit the travel-plan morning recipe. Related-card retrieval found shared regional props and food motifs, without the same decision and payoff.

## between-stories-2026-11-15

**Revise** · 12 cards · 7 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/between-stories-2026-11-15.critic.json)

Rejected: two queued follow-ups can leave ongoing stories with no continuation, a failed lock-in is remembered as a completed hour, and the picnic choice loses its trade on breaks. All source events, variants and required similarity checks are complete.

### [circle_newcomer](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_stories.grim:309) — lost follow-up / unresolved story

The start queues this card within 1..2 months, but this step has when: term and no break deferral. If it comes due in month 5 or 6, it is discarded rather than postponed. The begun flag prevents restarting, no later step is queued, and the Thursday Circle stays ongoing in the Journal. A month-5 queue fixture reproduces this.

**Fix:** Defer this follow-up through breaks, or resolve/close the story explicitly when declining that continuation; do not silently lose its only queued step.

### [tm_invitation](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_stories.grim:178) — unresolved story after eligibility changes

If the player starts courting/partnering either character after beginning the engine story but before this invitation shows, fancy_free becomes false and the queued invitation is discarded. Stopping the matchmaking is reasonable, but neither tm_together nor tm_friends is set and the Journal remains ongoing with no next step. A summer-month fixture with Mir partnered reproduces the lost continuation.

**Fix:** Provide an explicit friendship/let-go resolution when player courtship supersedes the invitation, so cancellation closes the story instead of stranding it.

### [feud_vault](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_stories.grim:76) — false outcome memory

The failed Lock them in outcome says Corvin opens the lock before the player lets go, but it still sets feud_locked_in. The Journal then says the player locked them in for an hour, contradicting the actual failed attempt. The same flag is used for success and failure.

**Fix:** Only record the completed-hour flag on success, and give failure an accurate attempt entry or a separate existing-resolution path.

### [tm_end](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_stories.grim:233) — choice loses its trade on breaks

This finale can show in the summer break (winter alone is deferred). Its leave option rewards study +tiny, which affects no enrolled course on a break. In a month-11 fixture, staying gives Mood +8 and +2 relationship with each character; leaving gives only +1 with each. Both resolve identically at the same pair-affinity threshold, so staying is strictly better and leaving loses its intended benefit.

**Fix:** Give leaving a meaningful alternative benefit in break months, or make the academic payoff conditional on actual enrollment and supply an appropriate break alternative.

### [circle_newcomer](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_stories.grim:309) — alignment

The player chooses whether a disliked, struggling classmate may join the study circle. Making room incurs discomfort; falsely saying the group is full excludes them and buys extra study. Neither option moves Alignment, unlike the same knowingly exclusionary choice in between_closed_table and the costs.md moral rule.

**Fix:** Give the exclusion for personal academic gain its appropriate Hollow weight, and any genuinely costly inclusion its fitting Lumen weight, or rewrite the setup so the refusal has an honest capacity reason.

### [circle_newcomer](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_stories.grim:309) — duplicate premise

This repeats between_closed_table's central scene: a disliked outsider asks to join the player's established clique, the other members wait for the player's decision, and the options are make room at social discomfort or falsely claim the group is full and keep the group cosy. The welcome path ends with the outsider becoming valuable to the group in both cards. Moving the table to a study circle changes the resource rewards but not that admission/exclusion decision. The open/closed flags only supply Journal entries; later steps do not distinguish those choices.

**Fix:** Replace the newcomer step with a different study-circle conflict, or give the admission a materially different decision and continuing consequence rather than replaying the refectory clique scene.

### [circle_founded](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_stories.grim:285) — duplicate premise

The opening repeats soc_study_session: a classmate drops a stack of books at the player's library seat, says they cannot study alone, and asks to work together; the player accepts for academic/relationship gains or says they work better alone for solitary study and a small relationship loss. Making it the start of a longer thread does not give this opening a different immediate premise or decision.

**Fix:** Start the circle with a different group-forming decision, or let an accepted existing study-session encounter lead into the circle rather than replaying that invitation as another card.

## between-hearts-2026-11-15

**Revise** · 16 cards · 9 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/between-hearts-2026-11-15.critic.json)

Rejected on duplicated supper/rumour scenes, unguarded prior-history/year assertions, missing moral weight, unshown academic costs and incompatible generic casting. All 16 scoped cards, variants and similarity comparisons are complete.

### [between_match_made](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_hearts.grim:142) — alignment

The grateful friend explicitly asks the player not to tell anyone. Tell just a few people breaks that confidence for Renown, while costing no Alignment. This is using a private relationship for the player's social gain.

**Fix:** Give the deliberate breach of confidence its appropriate moral cost, or obtain consent and rewrite the payoff as an authorized announcement.

### [between_matchmaker](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_hearts.grim:181) — year continuity

The first random opening says the classmate wants an introduction to someone in the year below. All eligible classmates are the player's own starting cohort, but this card can unlock after a match succeeds during year 1 and has no later-year gate. There is no lower academy year then.

**Fix:** Make that variant depend on year > 1, use a first-year-compatible description, or restrict the card to a later year.

### [between_matchmaker](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_hearts.grim:181) — unshown academic cost

Taking the case always deducts study -tiny, but its three outcomes describe arranging a meeting, replying to a note, or discussing a list without naming the player's missed academic work. There is also no term gate, so an academic cost may affect no enrolled course on a castle break.

**Fix:** Show the revision or deadline sacrificed in every relevant variant and keep that cost meaningful when dealt, or use a cost the matchmaking actually shows.

### [between_partner_meets_ex](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_hearts.grim:227) — unsupported history

The fixed text asserts the partner and ex have never properly met, but the cast filters only check their relationships to the player and current availability. Corvin and Nessa, for example, already have positive mutual affinity, and prior between cards can explicitly have shown any eligible pair socializing together. The card can erase that established acquaintance.

**Fix:** Describe the awkward current partner/ex situation without asserting they are strangers, or condition introductions on evidence of their existing relationship and use an already-acquainted variant otherwise.

### [between_secret_about](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_hearts.grim:311) — cost contradicts described work

Quietly helping the classmate deducts study -small, while the outcome shows the player revising with their own notes and says the practical gets easier for both of you. It gives no missed lecture, neglected revision or other academic sacrifice to explain losing preparation.

**Fix:** Show the player's own academic work actually being neglected while helping, or replace/drop the preparation loss to match the beneficial revision described.

### [between_rumour_from_you](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_hearts.grim:360) — alignment

Let it run knowingly leaves a false romance story about two friends circulating for the player's amusement, despite their discomfort and loss of trust, but has no Hollow movement. In the same file, passing gossip and exploiting the betting book are treated as moral choices.

**Fix:** Give knowingly sustaining the harmful false rumour the appropriate moral cost, or change the action and consequences so it is not the player exploiting that rumour.

### [between_overheard](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_hearts.grim:385) — cast / character continuity

The malicious speaker role accepts any present classmate. Tobias can therefore lead a crowd in knowingly false personal attacks about Nessa's family, spells or hair despite his kind, gentle, loyal characterization; neutral pair affinity suffices. The source provides no character-specific motivation or alternate voice for this behaviour.

**Fix:** Constrain the malicious role to suitable characters or an established serious feud, or write speaker-specific variants that fit the kind/protective characters rather than giving everyone the same deliberate cruelty.

### [between_setup_supper](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_hearts.grim:109) — duplicate premise

This repeats date_meet_friends' player-arranged awkward refectory meeting: two socially important people are painfully polite over supper, the player can steer them toward common ground or let them find their own way, and the successful outcome is shared laughter that leaves the mediator outside it. The gates intend matchmaking, but the page's obstacle and choice remain that same dinner mediation scene.

**Fix:** Give the matchmaking supper a different specific conflict and decision, or consolidate it with the existing awkward-introduction encounter rather than repeating that setup.

### [between_overheard](/Users/accessair/Desktop/Workspaces/lifesim/content/events/between_hearts.grim:385) — duplicate premise

This repeats soc_rumour's false-gossip encounter: classmates laugh over unkind, untrue talk about a friend, and the player either challenges the rumour at social cost or keeps walking and feels guilty. Assigning a name to the speaker adds relationship bookkeeping but does not change that immediate conflict or decision.

**Fix:** Give overhearing a known speaker a genuinely different decision or consequence, or add that named-speaker variant to the existing rumour encounter instead of keeping two versions.

## knowing-a-2026-11-15

**Revise** · 25 cards · 13 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/knowing-a-2026-11-15.critic.json)

Rejected on repeated one-time payoffs and concrete continuity/cost defects, including repeated editorial/book/spirits premises. All scoped cards and their first three non-self retrieval candidates were read in full.

### [know_kael_thaw](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:23) — one-time scene repeats

The knowing pool describes one-time payoffs, but repeat: 1 permits another showing after a month. These 15 cards have fixed scenes and no completion gate. They can stage the same problem and resolution again, including with the same classmate when per: x is used.

**Fix:** Remove the cooldown from the shared pool through the project migration workflow for one-time payoffs. Give any intentionally recurring card a suitable cooldown and variation that accounts for prior outcomes.

**Also affects:** [know_ilse_useless](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:43), [know_ilse_stitch](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:68), [know_isolde_chess](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:87), [know_nessa_off_record](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:112), [know_nessa_planted](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:131), [know_seraphine_too_loud](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:154), [know_thorne_hands](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:172), [know_tamsin_failed](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:190), [know_grimsby_nose](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:212), [know_pell_counting](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:231), [know_amaranth_truth](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:250), [know_marisol_spirits](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:269), [know_vey_smell](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:293), [know_brask_asking](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:312).

### [know_kael_thaw](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:23) — unsupported callback

The opening says Kael told the player the Northern goodbye custom once, but only met/relationship/month are required. A month-4 state with no kael_until_the_thaw showing and no kael.thaw knowledge passes the gate.

**Fix:** Gate the explicit recollection on the source scene/known fact, or use an unfamiliar-behaviour opening when that conversation has not happened.

### [know_ilse_stitch](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:68) — season and character continuity

The card finds a ward in courtyard snow and later hands it to Ilse beside Kael, yet there is no winter or Ilse-availability gate. It remains a candidate in spring after ilse_taken, when she cannot receive it.

**Fix:** Require the appropriate season and available named characters, or write separate season/absence outcomes that respect the existing story flags.

### [know_ilse_stitch](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:68) — unshown academic cost

Mending deducts study -tiny, but the outcome describes careful needlework and the siblings recognizing their mother’s stitch without any missed academic work. It can also occur on a break without courses.

**Fix:** Name the revision/homework actually sacrificed and make it meaningful in the eligible window, or use a cost the mending shows.

### [know_isolde_chess](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:87) — promised payment missing

Both a successful explanation and the chess route end with “Pay for the glass,” yet neither success path deducts gold or queues a payment. Only the failed explanation charges the purse.

**Fix:** Apply the promised glass payment on both success paths, or change the instruction/outcome so it does not promise an unimplemented payment.

### [know_nessa_off_record](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:112) — duplicate premise

This repeats nessa_between_story’s conflict: Nessa wants to print a nonconsensual account of a friend’s trouble, and the player intervenes to protect the friend. The known quill rule supplies another solution to the same editorial/privacy choice.

**Fix:** Add the known-fact solution to the existing card, or give this payoff a different interview conflict rather than another unwanted story about a friend.

### [know_nessa_planted](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:131) — duplicate premise

This repeats nessa_fact_check: Nessa hands over proofs containing planted errors; the player searches them and earns editorial approval. The earlier card already includes finding the planted one first and then fixing the others.

**Fix:** Put the knowledge-dependent approach into the existing fact-check card, or use the planted-error knowledge in a genuinely different problem.

### [know_grimsby_nose](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:212) — duplicate premise

This repeats grimsbys_by_the_nose’s request for a particular book and its existing success variant where describing the book by smell finds it immediately. The essay deadline does not change that encounter’s obstacle, action or punchline.

**Fix:** Fold the deadline/knowledge variant into the existing book request, or make the smell knowledge solve a different kind of problem.

### [know_grimsby_nose](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:212) — time continuity

The fixed opening reaches Grimsby at closing time and the ordinary search ends at ten, but the event has no slot/time restriction. Its bookshop can deal it at noon with full timeFit.

**Fix:** Constrain delivery to the appropriate closing-time slot, or make the prose fit ordinary shop hours.

### [know_amaranth_truth](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:250) — alignment

The stairs story is explicitly a prepared false account, and choosing it conceals the true injury cause while obtaining treatment. It costs Mood but no Alignment, despite the rule that deliberate dishonesty has moral weight.

**Fix:** Give choosing the known lie its Hollow movement, or make the alternative an honest refusal to discuss the cause.

### [know_marisol_spirits](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:269) — duplicate premise

This repeats tide_water_spirit_race’s two solutions and payoff: compete physically against cheating water spirits, or ask politely and be carried across as a raft while Marisol approves. A storm and boat replace the class swim without changing that decision.

**Fix:** Give the storm crossing a different conflict/solution, or add the knowledge payoff to the established spirit-race encounter.

### [heard_grimsby_mabel](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:475) — promised purchase missing

The right outcome explicitly says Grimsby sells the player a lighthouse book and “You buy it,” but no gold changes. Mood is the only purse-independent cost.

**Fix:** Charge for the purchase or make it an explicit gift/declined offer.

### [scandal_secret_out](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing.grim:523) — alignment

Winning “Say the printer is lying” falsely discredits a printer who is telling the truth, but Hollow movement happens only on a failed check. Successful dishonesty for reputational gain carries none.

**Fix:** Apply the moral cost to choosing the deception regardless of check result, while retaining outcome-specific social consequences.

## knowing-b-2026-11-15

**Revise** · 15 cards · 8 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/knowing-b-2026-11-15.critic.json)

Rejected on repeated one-time payoffs and concrete continuity/cost defects. All scoped cards and their first three non-self retrieval candidates were read in full.

### [know_grisk_collectors](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:5) — one-time scene repeats

The knowing pool describes one-time payoffs, but repeat: 1 permits another showing after a month. These 15 cards have fixed scenes and no completion gate. They can stage the same problem and resolution again, including with the same classmate when per: x is used.

**Fix:** Remove the cooldown from the shared pool through the project migration workflow for one-time payoffs. Give any intentionally recurring card a suitable cooldown and variation that accounts for prior outcomes.

**Also affects:** [know_grisk_newt](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:26), [know_grisk_favours](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:52), [know_amaranth_book](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:74), [know_amaranth_rounds](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:96), [know_pell_not_yet](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:118), [know_vey_own_face](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:136), [know_marisol_margins](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:157), [know_mabel_tins](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:179), [know_mabel_fourth_cake](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:200), [know_isolde_mercy](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:224), [know_grimsby_upper_floor](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:246), [know_grimsby_parcels](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:267), [know_ilse_frost](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:288), [know_tamsin_backdrop](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:308).

### [know_grisk_newt](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:26) — reward contradicts transaction

The successful advance-purchase branch adds gold +medium after charging the discounted price, but the say only says the bought supplies last the term. It describes avoided later spending, not receiving a payment or refund.

**Fix:** Describe an actual refund/resale/payment if the purse should grow, or model the successful bargain without minting an unexplained cash reward.

### [know_amaranth_book](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:74) — unshown academic cost

The option deducts study while describing a week persuading a friend and watching Amaranth copy their remedy. Its say does not identify the player’s skipped lecture, neglected revision or unfinished coursework. Time spent on the activity alone does not identify an academic loss.

**Fix:** Show the particular academic work sacrificed in each affected outcome, or use a cost the described activity actually shows. Keep an academic cost meaningful on any eligible break.

### [know_marisol_margins](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:157) — unshown academic cost

The option deducts study while describing three dawns productively drilling tidecalling line by line. Its say does not identify the player’s skipped lecture, neglected revision or unfinished coursework. Time spent on the activity alone does not identify an academic loss.

**Fix:** Show the particular academic work sacrificed in each affected outcome, or use a cost the described activity actually shows. Keep an academic cost meaningful on any eligible break.

### [know_mabel_tins](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:179) — unshown academic cost

The option deducts study while describing sitting with a friend during supper. Its say does not identify the player’s skipped lecture, neglected revision or unfinished coursework. Time spent on the activity alone does not identify an academic loss.

**Fix:** Show the particular academic work sacrificed in each affected outcome, or use a cost the described activity actually shows. Keep an academic cost meaningful on any eligible break.

### [know_ilse_frost](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:288) — unshown academic cost

The option deducts study while describing patching a warming ward from a textbook. Its say does not identify the player’s skipped lecture, neglected revision or unfinished coursework. Time spent on the activity alone does not identify an academic loss.

**Fix:** Show the particular academic work sacrificed in each affected outcome, or use a cost the described activity actually shows. Keep an academic cost meaningful on any eligible break.

### [know_tamsin_backdrop](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:308) — unshown academic cost

The option deducts study while describing painting the backdrop, with or without a correspondent’s advice. Its say does not identify the player’s skipped lecture, neglected revision or unfinished coursework. Time spent on the activity alone does not identify an academic loss.

**Fix:** Show the particular academic work sacrificed in each affected outcome, or use a cost the described activity actually shows. Keep an academic cost meaningful on any eligible break.

### [know_mabel_fourth_cake](/Users/accessair/Desktop/Workspaces/lifesim/content/events/knowing_2.grim:200) — cost paid by wrong character

The experimental-cake option deducts the player’s Health, but its outcome only has the birthday friend eat the cake and proudly survive it. The player is never shown tasting it or suffering any physical cost.

**Fix:** Show the player sharing and physically paying for the experiment, or remove/replace their Health deduction.

## full-picture-2026-11-15

**Revise** · 9 cards · 7 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/full-picture-2026-11-15.critic.json)

Rejected because the one-time milestones can recur and six unlock without the current worldbook's full fact sets. Some choices also assert a recorded history the game does not require.

### [picture_lyra](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:16) — one-time milestone repeats

The shared full_picture pool describes a one-time acknowledgment but sets repeat: 1. Its gates remain true after resolution, so the same intimate first-time scene is eligible the following month. The same wiring governs all nine milestones.

**Fix:** Remove the cooldown from the shared pool to use the default once-per-run behavior, or gate each payoff on its own prior resolution.

**Also affects:** [picture_corvin](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:34), [picture_tobias](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:52), [picture_seraphine](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:70), [picture_mir](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:88), [picture_bram](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:106), [picture_maud](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:124), [picture_thorne](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:142), [picture_brask](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:160).

### [picture_lyra](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:16) — outdated fact gates

Six milestones say the player knows the whole character while their gates omit later worldbook entries. The compiled condition allows Lyra with camp_bed, cook and grandmother still unknown, and the same check found omissions for Corvin, Tobias, Seraphine, Mir and Bram. The exact IDs are in milestone-validation.json.

**Fix:** Bring all six gates up to the current fact list, or explicitly scope each milestone and its dialogue to a defined subset of facts.

**Also affects:** [picture_corvin](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:34), [picture_tobias](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:52), [picture_seraphine](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:70), [picture_mir](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:88), [picture_bram](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:106).

### [picture_seraphine](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:70) — unsupported player history

The calendar claims the player talked Seraphine back into today forty-one times. The gate only requires knowing that she slips, which can come from seeing Lost Day and choosing to ask about tomorrow instead of helping her. Neither a single showing nor that alternative establishes the claimed history.

**Fix:** Tie the marks to help actually given, or make the calendar thank the player for knowing what a slip is without counting past interventions.

### [picture_bram](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:106) — unsupported player history

Bram says the player never used any of his secrets. The sell_a_secret route can publish his exam cheating and only changes relationship and reputation. The milestone checks current relationship and known facts, so later reconciliation can leave the assertion intact.

**Fix:** Record or read a durable betrayal branch before asserting discretion, or give the milestone an alternate acknowledgment when the player exposed the cheating.

### [picture_bram](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:106) — promised penalty missing

Bram gives the player a demerit for insulting the painting, but the outcome has only positive relationship and Mood effects and no demerit or scolding effect.

**Fix:** Make the demerit explicitly a joke he never writes down, or apply the appropriate existing penalty if it is meant to count.

### [picture_maud](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:124) — repeated payoff

The soup option offers an initial hands-on lesson in Maud's recipe with the same ban on writing it down, even though the milestone requires knowing maud.soup from the earlier lesson offer. Players who accepted the original lesson can be taught the soup from scratch again.

**Fix:** Make this a shared second cooking session or use a different gesture of trust. Account for whether the player already learned the recipe.

### [picture_thorne](/Users/accessair/Desktop/Workspaces/lifesim/content/events/full_picture.grim:142) — time continuity

The cutting and basket scene takes place at dawn, but around(thorne) can hold in his noon or afternoon schedule and the event defines no required slot. The earlier rose scene establishes dawn as his garden habit.

**Fix:** Require the dawn-equivalent morning slot with compatible availability, or move the text to a time-neutral garden visit.

## journal-cards-2026-11-15

**Revise** · 9 cards · 10 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/journal-cards-2026-11-15.critic.json)

Rejected on recap choices whose study effects vanish during the summer break and lead reminders that can recur or misstate the player's progress.

### [recap_year_one](/Users/accessair/Desktop/Workspaces/lifesim/content/events/journal_cards.grim:24) — study effects vanish in summer

All three recaps run on break turns 12, 24 and 36. With no enrolled course, both study effects have no target. Preview shows only a Mood gain for rereading and a Mood loss for planning, so the intended mechanical trade vanishes.

**Fix:** Use a preparation reward that persists and has a target in the next term, or give planning a benefit that is meaningful on the summer turn.

**Also affects:** [recap_year_two](/Users/accessair/Desktop/Workspaces/lifesim/content/events/journal_cards.grim:39), [recap_year_three](/Users/accessair/Desktop/Workspaces/lifesim/content/events/journal_cards.grim:54).

### [recap_year_one](/Users/accessair/Desktop/Workspaces/lifesim/content/events/journal_cards.grim:24) — promised purchase missing

The reread result explicitly buys the next journal, but no crowns change. Year two already assumes it exists regardless of the first choice.

**Fix:** Treat the next journal as a free or previously owned notebook in both recaps, or show and apply its purchase where it occurs.

### [recap_year_two](/Users/accessair/Desktop/Workspaces/lifesim/content/events/journal_cards.grim:39) — unsupported relationship history

Any current partner produces the line that their name was absent last summer. The player could already be their partner in year one and stay together throughout year two. The current count says nothing about when the bond started.

**Fix:** Describe the current partner's presence without claiming a start date, or require a recorded change since the first recap.

### [recap_year_three](/Users/accessair/Desktop/Workspaces/lifesim/content/events/journal_cards.grim:54) — unsupported relationship history

The reread result assumes someone saved the player a seat, even when the book's opening says the player largely kept to themselves. No seat scene is required.

**Fix:** Use a memory keyed to a scene that occurred, with a fallback for a solitary run.

### [nudge_quickquill](/Users/accessair/Desktop/Workspaces/lifesim/content/events/journal_cards.grim:71) — one-time reminder repeats

The nudge pool describes a one-time reminder but gives it a one-month cooldown and the six gates remain open while their leads are stalled. The same unvaried advice and elapsed-time line can recur. The red-ink fixture confirms the gate and eligibility hold after a previous showing.

**Fix:** Remove the shared repeat cooldown to make these nudges once-only, or write state-aware successive reminders with a deliberate interval.

**Also affects:** [nudge_footnote](/Users/accessair/Desktop/Workspaces/lifesim/content/events/journal_cards.grim:89), [nudge_two_taps](/Users/accessair/Desktop/Workspaces/lifesim/content/events/journal_cards.grim:105), [nudge_brace](/Users/accessair/Desktop/Workspaces/lifesim/content/events/journal_cards.grim:121), [nudge_red_ink](/Users/accessair/Desktop/Workspaces/lifesim/content/events/journal_cards.grim:139), [nudge_wind_jar](/Users/accessair/Desktop/Workspaces/lifesim/content/events/journal_cards.grim:154).

### [nudge_quickquill](/Users/accessair/Desktop/Workspaces/lifesim/content/events/journal_cards.grim:71) — quest continuity and cost

The reminder gives the 'proper ink first' instruction even after quickquill_ink is set, and charges Study for receiving advice without showing any missed work. The half-year line is fixed even after more than six months.

**Fix:** Read the known steps to give current advice, make the elapsed time approximate, and show the academic cost or remove it.

### [nudge_footnote](/Users/accessair/Desktop/Workspaces/lifesim/content/events/journal_cards.grim:89) — quest continuity

Footnote is said to still guard the drawer, but library_fish_footnote can already have him step off and give the player the card. This nudge also assumes he has guarded it for eleven and a half years, while the initial scene says he has sat there for a week and the book has been overdue eleven years.

**Fix:** Distinguish the overdue age from the time the cat has been guarding it, and acknowledge the bribe or card already recovered.

### [nudge_two_taps](/Users/accessair/Desktop/Workspaces/lifesim/content/events/journal_cards.grim:105) — quest continuity and cost

The advice always says to start with the corner table and proceeds through all three steps, even if the related flags are already set. The Study loss covers a short conversation with the landlady, with no missed work shown. The fixed half-year phrasing also applies at any later month.

**Fix:** Point to the first unfinished step and use time wording that fits later delivery. Show the work given up or drop the academic penalty.

### [nudge_brace](/Users/accessair/Desktop/Workspaces/lifesim/content/events/journal_cards.grim:121) — unshown cost and unsupported consequence

The left outcome contains an agreement and advice, but no physical exertion to account for Health loss. The right removes the player's name and says Lyra says nothing more, while writing no state to prevent the advice or name-on-board premise from returning.

**Fix:** Give the choice the consequence it shows, and persist the decision to withdraw or allow the lead to remain open without saying the name is erased.

### [nudge_red_ink](/Users/accessair/Desktop/Workspaces/lifesim/content/events/journal_cards.grim:139) — promised story continuation missing

Writing and delivering the next draft sounds like restarting the correspondence, but it grants Lore and costs Study without setting an appropriate progress flag or queuing a story step. The original chain's steps are queued, so an absent next step stays absent after this branch.

**Fix:** When the thread has stalled, restore the appropriate next beat using the existing flags and avoid duplicating an existing queue entry, or describe a reflective draft that makes no claim to resume the thread.

## scandals-2026-11-15

**Revise** · 14 cards · 12 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/scandals-2026-11-15.critic.json)

Rejected because several scandals contradict their own setup, omit the moral cost of deliberate lies, or promise penalties the game does not apply.

### [scandal_ledger_lie](/Users/accessair/Desktop/Workspaces/lifesim/content/events/scandals.grim:38) — callback and dishonesty

The public correction has the player confess there was no dragon, but the callback is queued by the profile's winning embellishment, whose account never establishes a dragon. The losing profile branch mentions a dragon that Nessa catches before publication. The successful continued lie also escapes Alignment loss.

**Fix:** Establish the printed dragon claim on the queued profile branch or name an actual embellishment from it. Apply the moral cost to knowingly insisting on the false account regardless of check outcome.

### [scandal_memoir_book](/Users/accessair/Desktop/Workspaces/lifesim/content/events/scandals.grim:92) — unsupported callback premise

The callback assumes the player signed a book they never read. The contract offer promises ghostwriting, and its queueing branch describes the book already selling, but neither says the player never got or reviewed a draft. Even the retraction and spin options have to inherit the unestablished negligence.

**Fix:** Establish in the memoir contract or queued setup that the player signed away final approval, or have the scandal focus on an unapproved chapter rather than claiming the player signed unread pages.

### [scandal_flourish_hurt](/Users/accessair/Desktop/Workspaces/lifesim/content/events/scandals.grim:118) — contradictory callback

The only branch that queues the injury explicitly has the player perform the flourish to cheers in the yard. Winning the lie says they never once did it and presents the statement as reasonable. The losing branch treats that same witnessed performance as proof of deception.

**Fix:** Let a successful denial distinguish who invented the flourish from who performed it, or make it a knowingly false denial and charge its moral cost on both outcomes.

### [scandal_flourish_hurt](/Users/accessair/Desktop/Workspaces/lifesim/content/events/scandals.grim:118) — unshown academic cost

The player visits and teaches practice-yard students for a week. The study loss has no missed lecture, assignment or revision in that outcome.

**Fix:** Name the academic work given up to teach the students or apply a cost that the visit and practice actually show.

### [scandal_wrong_notes](/Users/accessair/Desktop/Workspaces/lifesim/content/events/scandals.grim:144) — contradictory facts

The opening says the error is on a page of the player's notes they never corrected. Winning research then proves the copyist introduced it. The narration has already settled the fact the check is meant to discover.

**Fix:** Present ownership of the error as an allegation or open question, then establish the actual source separately in each research outcome.

### [scandal_wrong_notes](/Users/accessair/Desktop/Workspaces/lifesim/content/events/scandals.grim:144) — unshown academic cost

The refund and tutoring outcome shows where the crowns go but never describes the player's coursework being skipped in the three tutoring evenings.

**Fix:** Name the work the player sacrifices to tutor the first-year, or remove the extra Study penalty.

### [scandal_ex_tells_all](/Users/accessair/Desktop/Workspaces/lifesim/content/events/scandals.grim:273) — alignment

The denial calls private events made up even though the narrator and the later letters establish that they happened. The player publicly discredits the ex for social gain without an Alignment cost on either check outcome.

**Fix:** Apply the moral cost to choosing the false denial or make the defense a truthful objection to publishing private events.

### [scandal_curfew_column](/Users/accessair/Desktop/Workspaces/lifesim/content/events/scandals.grim:303) — promised consequences missing

Owning up says the prefects give detention, but the engine leaves detention absent. A successful alibi says the player buys the friends supper for a month but charges no crowns.

**Fix:** Apply detention and the supper expense where promised, or rewrite those outcomes around consequences the choices actually apply.

### [scandal_curfew_column](/Users/accessair/Desktop/Workspaces/lifesim/content/events/scandals.grim:303) — alibi does not cover the incident

The column places the sighting at two in the morning. The successful witnesses say the player played cards until one, leaving an hour before the sighting unaccounted for. The losing branch also reveals that the room was locked at midnight.

**Fix:** Have the successful proof cover two in the morning and be possible in that room, or give the two branches genuinely different alibis.

### [scandal_snubbed](/Users/accessair/Desktop/Workspaces/lifesim/content/events/scandals.grim:326) — alignment tied to getting caught

The option invents an infirmary alibi despite the player's uncertainty. Its only Alignment penalty is on failure. Winning still falsely claims an affirmative alibi to protect the player's reputation.

**Fix:** Apply the penalty when the player chooses to manufacture the alibi, or let the successful branch present real corroboration.

### [scandal_thornwick_defection](/Users/accessair/Desktop/Workspaces/lifesim/content/events/scandals.grim:351) — contradictory facts

The opening states the player never said the quoted words. Losing the research check then says the player probably did. Failing to prove the quote was lifted cannot establish a memory that contradicts the opening.

**Fix:** Keep the doubt in other people's minds on failure, or leave the player's memory genuinely uncertain in the opening.

### [scandal_leaked_letter](/Users/accessair/Desktop/Workspaces/lifesim/content/events/scandals.grim:223) — repeat continuity

The monthly appointment can draw the same scandal the following month. The same fixed exposure, culprit and three responses then replay even if the player already identified the thief or took responsibility. Similar one-off disclosures are presented by the ex and forged-letter cards, whose per-person cooldown still allows repeats with the same classmate.

**Fix:** Make each specific exposure once per run or once per affected character. If successive leaks are intended, vary the new incident and carry over the action previously taken.

**Also affects:** [scandal_ex_tells_all](/Users/accessair/Desktop/Workspaces/lifesim/content/events/scandals.grim:273), [scandal_forged_love_letter](/Users/accessair/Desktop/Workspaces/lifesim/content/events/scandals.grim:376).

## season-and-society-2026-11-15

**Revise** · 11 cards · 10 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/season-and-society-2026-11-15.critic.json)

Rejected because the Season can stall on a required cast, its Journal misattributes a prior rivalry outcome, and several fame scenes assert untracked histories.

### [season_friends](/Users/accessair/Desktop/Workspaces/lifesim/content/events/society.grim:153) — required story step can drop

The invitation can start on fame alone, but the queued return scene requires a present classmate at relationship 25. If no one qualifies, advance drops the step and only that step queues season_price. The Journal stays begun with neither ending reachable through the queue.

**Fix:** Provide a return scene that works without a qualifying friend or bypass this optional cast beat to the patron request. Exercise both routes through the resolution flags.

**Also affects:** [season_price](/Users/accessair/Desktop/Workspaces/lifesim/content/events/society.grim:175), [season_end](/Users/accessair/Desktop/Workspaces/lifesim/content/events/society.grim:198).

### [season_rival](/Users/accessair/Desktop/Workspaces/lifesim/content/events/society.grim:104) — journal records the wrong event

Winning the salon storytelling contest sets season_ball_star and the other branches set season_ball_shared before the ball. The Journal reads those flags as a claim about what the player did on the dance floor, including during the month before it happens. The base ball choices never replace those flags with an actual ball outcome.

**Fix:** Use the flags to remember who the room favored at the supper, or record what actually happened when the ball resolves.

### [season_ball](/Users/accessair/Desktop/Workspaces/lifesim/content/events/society.grim:132) — unshown monetary cost

Staying until dawn deducts gold, but the say only shows dancing and tired feet. The coat expense was already paid on accepting the original invitation.

**Fix:** Show what the extra crowns buy during the ball or remove that duplicate unexplained charge.

### [season_lady_vaneshade](/Users/accessair/Desktop/Workspaces/lifesim/content/events/society.grim:81) — unshown monetary reward

Sponsorship adds crowns immediately but its outcome only describes new access and social rules. The offer does not name a stipend or gift.

**Fix:** Have Lady Vaneshade hand over or send the named stipend or remove the purse gain.

### [season_end](/Users/accessair/Desktop/Workspaces/lifesim/content/events/society.grim:198) — unshown monetary reward

Writing back to accept a standing invitation gives gold even though the card and reply promise future access and contain no payment.

**Fix:** Add a concrete purse or material benefit, or let continued access and Renown be what the choice grants.

### [fame_rivals_for_you](/Users/accessair/Desktop/Workspaces/lifesim/content/events/society.grim:227) — presentation hides one of the two stated invitations

The player hears simultaneous invitations and both rivals are awaiting a response, but the card only permits going with the first randomly cast person or declining both. Reversing the cast can offer the other choice in a different draw but not in the present scene.

**Fix:** Offer both invitations and a refusal as a menu, or make the premise explain why only one invitation can be accepted.

### [fame_wedge](/Users/accessair/Desktop/Workspaces/lifesim/content/events/society.grim:251) — unshown academic cost

Thanking the friend and watching for the other person's behavior deducts Study. The outcome shows observing and choosing seats, without any missed coursework.

**Fix:** Name the study time the player spends investigating, or use a consequence that the observation and change of company show.

### [fame_wedge](/Users/accessair/Desktop/Workspaces/lifesim/content/events/society.grim:251) — premise assumed across arbitrary cast history

The opening says the two were friends for years and that one never sat with the player before fame. The gates measure current relationships and pair affinity. They can hold early in the first academy year or after many previous social encounters with either friend.

**Fix:** Describe their current closeness and change of behavior without asserting a timeline, or use actual history to select that accusation.

### [fame_best_friend_claims](/Users/accessair/Desktop/Workspaces/lifesim/content/events/society.grim:297) — relationship effects contradict outcome

Winning the letter raises both relationships with the player while both friends are described as furious with the player. Staying quiet says the two are finally united but lowers both player relationships without a reaction toward the player and does not move their mutual relationship.

**Fix:** Show who is upset with whom after each response and apply the changes to those relationships.

### [fame_after_you](/Users/accessair/Desktop/Workspaces/lifesim/content/events/society.grim:326) — unsupported named-pair history

The opening says both named classmates used to compete for the player while the player was famous. The right branch says the player introduced them. The gate checks two current relationships and their mutual affinity, so a pair who were friendly from the beginning can be cast without either earlier scene.

**Fix:** Bind the same pair from a witnessed earlier rivalry/meeting, or only describe what the player sees now and what changes after the player is no longer famous.

## spotlight-known-2026-11-15

**Revise** · 19 cards · 10 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/spotlight-known-2026-11-15.critic.json)

Rejected on a repeated seating premise, untracked claims about the player's relationships, and concrete gaps between outcomes and effects. The two tier milestones are distinct from one another.

### [spot_ledger_profile](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight.grim:98) — alignment tied to getting away with a lie

Polish the story invents a dragon claim even on the failed branch where Nessa catches the player. Only a successful lie moves Alignment.

**Fix:** Apply the moral cost on choosing to embellish and keep check results for credibility, relationships and the later scandal.

### [spot_village_recognised](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight.grim:141) — promised purchase and unshown academic cost

The right result explicitly buys a bun without deducting gold. The left deducts Study while describing staying out later than expected, with no class or study session missed.

**Fix:** Charge for the bun or make it a gift. Make the missed work concrete in the lingering route or use a consequence the visit actually shows.

### [spot_village_recognised](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight.grim:141) — age rule

The crowd explicitly includes children who gather around the player. The project style and critic checklist require adult characters, and the encounter only needs local admirers of the Ledger profile.

**Fix:** Use adult villagers, apprentices or academy students for the crowd.

### [spot_signature](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight.grim:174) — cost and moral framing

The autograph is a harmless favor in the written outcome but incurs Hollow. The instructional choice incurs Study loss without the cast setting aside coursework or revision.

**Fix:** Show signing as knowingly encouraging a false claim for social gain if Hollow is intended. Make the cost of giving a lesson visible, or use an effect that matches the short lesson.

### [spot_saved_seats](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight.grim:253) — duplicate premise and assumed friends

The refectory scene repeats refectory_house_tables: walk past alternatives to your familiar table for comforting company, or join a table of strangers at the cost of mild awkwardness. It also promises the player has a whole regular table of friends even if none are established.

**Fix:** Combine the recognition variants with the existing seating card, using the player's actual relationships and a different immediate decision if both cards are retained.

### [spot_shop_window](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight.grim:270) — purse reward without payment

Drinking free tea adds crowns to the purse. The story describes a waived price, no stipend or payment for attracting customers.

**Fix:** Put a concrete advertising fee on the table, or represent complimentary tea without increasing gold.

### [spot_name_dropped](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight.grim:311) — relationship score is not appearance history

The cast gate accepts any current classmate with relationship 4–19. The opening calls them a four-conversation acquaintance. Someone can reach that band after substantial contact or after losing relationship.

**Fix:** Make the boast about closeness or advice concretely false in this scene without claiming a meeting count, or require an actual limited acquaintance.

### [spot_three_invitations](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight.grim:348) — incomplete offered choice and unshown purchase

Three incompatible invitations are the central dilemma. The left choice always goes to the Newt and the right always plays cards, with no way to choose the observatory. The Newt branch also spends gold without showing who the player pays.

**Fix:** Offer the observatory as a distinct menu route or remove it from the stated decision. Show the supper bill or the drink the player buys.

### [spot_family_tour](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight.grim:365) — age rule

The youngest visitor takes part in the encounter by wanting to see a dragon and is explicitly a small child in the scene. This conflicts with the authoring rule for adult characters.

**Fix:** Make the youngest visitor an adult sibling, or let the adult applicant ask about dragons.

### [spot_owl_mail](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight.grim:382) — linked variants and unshown academic cost

The drawing introduced by the third opening is specifically answered in the second outcome, while the third outcome thanks eleven writers, a count supplied in the second opening. All three charge Study without showing which work was put aside.

**Fix:** Pair the drawing and eleven-letter outcomes with their corresponding openings. In each answer variant, show what reading or assignment the evening of letters replaces.

## spotlight-famous-2026-11-15

**Revise** · 16 cards · 11 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/spotlight-famous-2026-11-15.critic.json)

Rejected on missing consequences, a dance-partner choice that never occurs, and repeats that erase earlier outcomes. The 16 scoped IDs exclude the previously reviewed Newt drink scene.

### [spot_endorsement](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_famous.grim:8) — royalties asserted in the setup only

Both endorsement outcomes increase gold, but neither shows the promised royalty coming back to the player. The successful say shows candles arriving every month. The failure describes the smell and public ridicule.

**Fix:** Show the chandler paying the agreed cut in each branch, including the smaller payout from the bad batch.

### [spot_impostor](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_famous.grim:53) — inverted cash outcomes

The embarrassing catch says the player pays the account but does not deduct gold. The successful catch adds gold although the impostor pays the shopkeepers and the player only gets supper.

**Fix:** Debit the account payment where it happens and make the successful reward a meal, or explicitly pay the player a bounty for exposing the fraud.

### [spot_memoir](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_famous.grim:31) — one-time premise replay

A single repeatable contract creates ‘your memoir’ without acknowledging a previous refusal or a book that has already gone to print. The Famous pool's one-month cooldown can also set the same chapter scandal up again.

**Fix:** Make it a single contract offer or use prior outcomes to distinguish subsequent editions, and keep the chapter follow-up bound to the edition that caused it.

### [spot_fan_circle](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_famous.grim:74) — one-time premise replay

The inherited repeat permits the announcement of the same new society to return after the player signed its minutes or sent it off to run a study table. It can re-queue the initiation scandal as if the response never occurred.

**Fix:** Make introducing the named society once-only, or add variants that follow the recorded first meeting and outcome.

### [spot_lecture_crowds](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_famous.grim:190) — unshown academic cost

The unsuccessful question hour gives Study loss. Its outcome adds a decorum essay, but does not show the player losing preparation or skipping their own work.

**Fix:** Show the decorum essay displacing specific class work, or use a social consequence fitting the interruption.

### [spot_routine_known](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_famous.grim:233) — unimplemented restriction

The unsuccessful appearance says the librarians bar the player from the library for a week, but the outcome only changes Study and Renown. It leaves visits and the revision card available.

**Fix:** Implement a library consequence at the game's time scale or describe being sent away in that moment, with the existing lost work.

### [spot_guest_flyer](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_famous.grim:255) — age rule

Hordes of small children imitate the player with brooms in the success outcome. The authoring rule requires adult characters, and academy newcomers can make the same joke work.

**Fix:** Use adult first-years or other adult spectators for the imitations.

### [spot_petition](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_famous.grim:277) — unimplemented persistent change

The signature success says the library stays open all night during exam weeks. The event grants Study and Renown only, and the library's place configuration lacks midnight access. The player cannot use the change the petition says they won.

**Fix:** Wire an exam-week opening with a success condition, or limit the narrative and reward to a one-off supervised study session.

### [spot_party_host](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_famous.grim:299) — promised detention missing

The bad party branch says the player serves a week of evenings in detention, but changes Renown, Health and Mood only.

**Fix:** Apply the established detention state with the matching duration language, or narrate a single reprimand that matches the existing effects.

### [spot_ball_opening](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_famous.grim:323) — missing partner and conflicting Ball outcomes

The opening acknowledges that an unpartnered player must pick someone, then the dance occurs without a bound person or a choice. The separate Midwinter Ball card can still be declined or pick another person in the same month.

**Fix:** Run the dance opening as a follow-up carrying the chosen dance companion, with an alternative for a player who attends alone and no scene that contradicts skipping the Ball.

### [spot_friend_strain](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_famous.grim:363) — unshown academic cost

Meeting the friend in quieter places gives up public invitations in the say, but also deducts Study without mentioning missed academic work. The existing Renown loss already reflects turning down invitations.

**Fix:** Make the extra academic sacrifice explicit or remove the Study loss.

## spotlight-legend-and-fallen-2026-11-15

**Revise** · 17 cards · 11 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/spotlight-legend-and-fallen-2026-11-15.critic.json)

Rejected on explicit child characters, false callbacks, repeating one-time outcomes, and missing costs. Deliberate reversals between fame and the fall are distinct episodes when their history is gated.

### [spot_tavern_song](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_legend.grim:9) — missing purchase

The right payoff buys the fiddler a drink, but the player's gold never changes.

**Fix:** Charge for the drink in that branch or let the player encourage the song with a toast or another free gesture.

### [spot_flourish_named](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_legend.grim:62) — contradiction on repeat

One branch explicitly has the player perform the signature flourish before a cheering crowd. The inherited repeat cooldown lets the same card return and state that the player has never done it in their life.

**Fix:** Make first discovery of the named flourish one-time, or condition the opening on whether the player performed it.

### [spot_named_child](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_legend.grim:84) — age rule and missing payment

The newborn is the active focus of the naming scene, and the left branch has the player hold the baby. That conflicts with the authoring rule that characters be adults. The left result also has the player buy an unaffordable silver spoon without charging for it, unlike the right result.

**Fix:** Use an adult family's choice to name a shop or another honor whose central characters can all be adults. If a gift is still bought on both routes, reflect the purchase on both.

### [spot_disguise_day](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_legend.grim:101) — age rule and missing payment

A small child is the speaking character who recognizes and exposes the player on failure. On success the player buys and eats bread without spending gold.

**Fix:** Let an adult shopper recognize the player and apply or remove the stated bread purchase.

### [spot_history_essay](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_legend.grim:144) — unshown academic cost

A week of interviews deducts Study but the outcome does not show a particular class assignment or revision session displaced by the interviews.

**Fix:** Show what the player had planned to study that week and what falls behind, or use a cost shown in the scene.

### [spot_villain_play](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_legend.grim:161) — missing purchase

The successful attendance branch buys the entire cast supper but changes Mood and Renown only.

**Fix:** Apply the supper expense or have the cast invite the player to share their supper.

### [spot_guest_lecture](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_legend.grim:201) — cost belongs to the wrong people

Telling stories deducts the player's Study, while the only academic loss shown is the audience learning little of its syllabus.

**Fix:** Name the player's own academic work lost in preparing or covering the hour, or apply a consequence of failing the lecturer's request.

### [spot_legend_burden](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_legend.grim:223) — false one-time promise

The practice branch explicitly says a public failure never happens again. The same unvaried event can draw again and open on precisely that failure.

**Fix:** Describe improvement for this attempt or term, or make the card a one-time turning point.

### [renown_fallen_entry](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_legend.grim:243) — untracked publicity history

A fall from Famous alone is enough to claim there was a Ledger front page with the player's face and that they could not buy bread without autographing it. The player can have reached Famous through other activities without either piece of publicity.

**Fix:** Refer to the general change in attention, or condition the newspaper and bakery memories on how the player became known.

### [fallen_unrecognised](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_legend.grim:302) — unsupported callback and age rule

Falling from fame alone is enough to say this specific baker used to call out the player's name and that children used to follow. The matching recognition card may never have appeared. The adult-only authoring rule also applies to the local admirers.

**Fix:** Use a callback variant only if the earlier bakery scene happened, and use adult admirers in both versions.

### [fallen_friends](/Users/accessair/Desktop/Workspaces/lifesim/content/events/spotlight_legend.grim:340) — untracked routine and unshown academic cost

A high current relationship can cast a peer who never shared this regular Thursday game. Staying for it also deducts Study with no academic task shown as foregone.

**Fix:** Use current invitation language unless a regular game was established. Show the unfinished work when the player stays late or remove the Study loss.

## hollowstar-grey-return-2026-11-15

**Revise** · 1 cards · 2 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/hollowstar-grey-return-2026-11-15.critic.json)

Rejected because the errand repeats a published offer and the follow-up can remember the opposite answer to the first visit.

### [hs_grey_return](/Users/accessair/Desktop/Workspaces/lifesim/content/events/chain_hollowstar.grim:283) — duplicate errand premise

A Quiet Job already asks the player to carry an unopened envelope to the boathouse at night for money, in exchange for taking a Hollow step. The Grey follow-up alters the sender, hiding place and added spell, but repeats the immediate decision and action.

**Fix:** Give the Grey follow-up a task that tests loyalty to this plot and has a different action from delivering an unread letter at the boathouse.

### [hs_grey_return](/Users/accessair/Desktop/Workspaces/lifesim/content/events/chain_hollowstar.grim:283) — wrong callback after refusal

The follow-up uses hollow_tempted to decide what the player said at the first offer. That flag can already be true from other scenes. In a fixture with prior temptation, telling the man to get out still produces ‘You liked what you tasted’ at the next visit.

**Fix:** Branch on chosen(hs_grey_offer, right) or store the specific prior answer.

## hollowstar-convergence-2026-11-15

**Accepted** · 2 cards · 1 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/hollowstar-convergence-2026-11-15.critic.json)

The two scenes pay off different decisions, with one polish issue in the early descent's fallback for a player who has not learned who is coming.

### [hs_go_down_early](/Users/accessair/Desktop/Workspaces/lifesim/content/events/hollowstar/convergence.grim:33) — ungated identity cue

The fallback deliberately says ‘Someone is coming’ when the letter and summons have not occurred. The following line immediately says ‘Her circle’ in that same fallback.

**Fix:** Keep the subsequent line neutral until the player's available clues establish her identity.

## hollowstar-escalation-2026-11-15

**Revise** · 3 cards · 3 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/hollowstar-escalation-2026-11-15.critic.json)

Rejected because a key recovery option selects Ilse after she has left and some payoffs assert unestablished knowledge or companionship.

### [hs_key_recover](/Users/accessair/Desktop/Workspaces/lifesim/content/events/hollowstar/escalation.grim:107) — absent advisor

The family option treats ilse_saved as sufficient and picks Ilse over Kael whenever that flag is set. The northern-letter choice can leave ilse_saved set while ilse_went_north makes her absent. The option still renders Ilse speaking and standing lookout.

**Fix:** Choose Ilse only when she is available, fall back to an eligible Kael, and lock the option if neither can help.

### [hs_shadow_late](/Users/accessair/Desktop/Workspaces/lifesim/content/events/hollowstar/escalation.grim:9) — unearned prior knowledge

The Seraphine choice grants meet seraphine, so this can be the first encounter. The outcome starts with ‘Yours too’ and stages her opening her bedroom door before the knock without establishing how a stranger found her private room or why she expects the player there.

**Fix:** Use an available shared place or add an introduction variant for a player who has not met Seraphine.

### [hs_grey_daylight](/Users/accessair/Desktop/Workspaces/lifesim/content/events/hollowstar/escalation.grim:30) — Kael moved without setup

When the man comes for Kael, the hide success declares the player escaped with Kael. The only Kael condition is met(kael), and the opening has the man ask where he is. The call branch instead places him at a window. An unallied or absent Kael can appear as the fleeing party without explanation.

**Fix:** Establish a present Kael before running together. In other cases let the successful evasion protect his whereabouts while the player escapes alone.

## hollowstar-night-2026-11-15

**Revise** · 9 cards · 7 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/hollowstar-night-2026-11-15.critic.json)

Rejected for contradictory solo and companion narration, an ungated setup callback, and aftermath prose that collapses the elapsed month. The alternate endings remain distinct.

### [hs_night_company](/Users/accessair/Desktop/Workspaces/lifesim/content/events/hollowstar/night.grim:37) — solo branch talks to absent companions

The unconditional alone option is the only enabled choice when nobody follows. It still has the player tell people to guard the towers and close the hatch on their protests. The fixture renders both contradictory statements.

**Fix:** Use the protest outcome only if a companion was present, with a solo narration for the unaccompanied descent.

### [hs_night_cult](/Users/accessair/Desktop/Workspaces/lifesim/content/events/hollowstar/night.grim:78) — missed Maud confrontation

The approach includes paired dialogue for Kael, Ilse and Isolde. With Maud selected, it falls to the solo line and never lets the woman revisiting the door speak to the cult leader. The early branch also still counts twelve chanting figures when the fight hint says half the circle is absent.

**Fix:** Give Maud a line that ties this confrontation to her history with the door. Match the early count or visible incomplete ritual to exactly what the early branch changes.

### [hs_night_shadow](/Users/accessair/Desktop/Workspaces/lifesim/content/events/hollowstar/night.grim:210) — callback assumes an unseen warning

The combat win always says the shadow is a beat late ‘the way it was on the stairs’. The card explicitly permits a player who never saw hs_shadow_late. The win also says it uses the player's spell order without conditioning that description on what the fight used.

**Fix:** Gate the stairs callback on the earlier sighting. On an unseen route make the player notice and exploit the delayed motion for the first time.

### [hs_aftermath_bargain](/Users/accessair/Desktop/Workspaces/lifesim/content/events/hollowstar/night.grim:260) — prior spell and deferred reward

The bargain always describes Eclipse as a spell the player never studied even if the Grey errand or Northern visit already taught it. The actual rewards are applied at the door, while this announcement queues for the next month.

**Fix:** Condition the description on prior Eclipse knowledge and announce the reward in the bargain itself or deliver the aftermath immediately. Use the next-month card for continuing consequences.

### [hs_aftermath_quiet](/Users/accessair/Desktop/Workspaces/lifesim/content/events/hollowstar/night.grim:286) — aftereffects report the previous month as yesterday

All four scoped aftermaths queue in 1 month from hs_beneath. The quiet route says nobody knows where you were ‘last night’, the freed route opens on the midnight-to-dawn blackout, and fleeing frames the Wardens' first response as immediate. The early descent can shift seasons within these replayed aftermaths.

**Fix:** Deliver next-morning scenes immediately after the door, or frame each queued card as later reflection and condition seasonal language on the current season.

**Also affects:** [hs_aftermath_bargain](/Users/accessair/Desktop/Workspaces/lifesim/content/events/hollowstar/night.grim:260), [hs_aftermath_freed](/Users/accessair/Desktop/Workspaces/lifesim/content/events/hollowstar/night.grim:316), [hs_aftermath_fled](/Users/accessair/Desktop/Workspaces/lifesim/content/events/hollowstar/night.grim:339).

### [hs_aftermath_freed](/Users/accessair/Desktop/Workspaces/lifesim/content/events/hollowstar/night.grim:316) — single injury has no aftermath cost

A single night_hurt is settled as a Health loss by the other successful seal aftermaths. This route charges Health only for two or more despite the stated Night contract to settle earlier injuries at the conclusion.

**Fix:** Handle one injury as on the quiet seal route, or explicitly show the Star's liberation healing that injury if the exemption is intentional.

### [hs_aftermath_fled](/Users/accessair/Desktop/Workspaces/lifesim/content/events/hollowstar/night.grim:339) — warden role promised without state

The apology grants a silver ring and a shift rota in the story, yet only changes Mood and Isolde's relationship. The worldbook makes the ring a sign of trusted Warden recruitment.

**Fix:** Record induction or an explicitly temporary assignment if she offers one, or replace the ring and rota with a smaller sign of forgiveness.

## cartographers-2026-11-15

**Revise** · 12 cards · 6 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/cartographers-2026-11-15.critic.json)

Rejected because the Master Map's completed test remains eligible, some choices imply unrecorded outcomes, and costs are missing from the midnight search variants. The two heist introductions and their shortcuts remain distinct from the heists they unlock.

### [carto_map_keeper](/Users/accessair/Desktop/Workspaces/lifesim/content/events/cartographers.grim:165) — resolved finale can return

The finale's two terminal answers set carto_map_done, and the Journal uses that flag for resolution. The inherited final condition checks the start and preparation or give-up timing, but never reads carto_map_done. After the cooldown, the fixture can select the test again after the player already told Corvin to keep the map.

**Fix:** Gate the final on not flag(carto_map_done). Keep the unexplored heist routes available separately so finishing the test does not remove the other heist.

### [carto_map_blanks](/Users/accessair/Desktop/Workspaces/lifesim/content/events/cartographers.grim:41) — ungated time reference

Corvin says the last Keeper handed over the map ‘this summer’ on the first showing. The offer has a lower turn bound and can first occur much later if the player joins in a later year. His canon fact describes the original handover, not a fresh handover in whatever year the card first draws.

**Fix:** Refer to the handover without a relative date, or tie ‘this summer’ to its actual year.

### [carto_tower_chimney](/Users/accessair/Desktop/Workspaces/lifesim/content/events/cartographers.grim:139) — unshown mood and health costs

The failed sentence shows a tight fit and soot, but no physical injury, serious exertion, or emotional price to account for losing both Health and Mood.

**Fix:** Name the bodily strain or scrape and the panic or embarrassment, or charge only the cost that the failed climb demonstrates.

### [carto_recruit](/Users/accessair/Desktop/Workspaces/lifesim/content/events/cartographers.grim:247) — promised recruit never persists

Success names a particular classmate, says they came in under the gargoyle, and calls this the player's turn to bring a member. The only durable effects concern relationship and suspicion. The recruited classmate's membership is neither recorded nor reflected in another scene.

**Fix:** If this completes recruitment, record the invitee so later appearances can recognize it. Otherwise describe a first visit or invitation without implying a settled membership.

### [gargoyle_midnight_one_short](/Users/accessair/Desktop/Workspaces/lifesim/content/events/cartographers.grim:269) — unshown Health loss in variants

All three failed searches deduct Health. They show being turned around, narrowly missing a prefect, and looking in the wrong passages, respectively. None clearly shows the bodily toll or lost sleep the penalty is meant to represent.

**Fix:** Show cold, injury, exhaustion or missed sleep in each failed search variant, or apply a fitting nonphysical cost.

### [gargoyle_midnight_lost_map](/Users/accessair/Desktop/Workspaces/lifesim/content/events/cartographers.grim:294) — redrawing does not invalidate the stolen information

In the coat-pocket variant the club redraws everything the map showed and the result claims the missing copy is worth nothing. Redrawing the same routes leaves the original usable. The kitchen and boathouse variants at least describe abandoning routes.

**Fix:** Show the club blocking, changing or giving up the routes recorded on that missing map, or acknowledge that the disclosure still stands.

## contraband-2026-11-15

**Revise** · 17 cards · 8 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/contraband-2026-11-15.critic.json)

Rejected on bottle management gates, a purchase that charges without adding a bottle, and a repeated Grisk encounter. The two elixirs' withdrawal scenes have distinguishable pressures.

### [elixir_trunk](/Users/accessair/Desktop/Workspaces/lifesim/content/events/contraband.grim:12) — disposal inaccessible during an active dose

Pouring only requires holding the bottle, but the event itself requires a bottle whose same-type effect is inactive. A player under Brightwater who holds only a spare Brightwater bottle cannot get this card to pour it away. The same holds for Ink.

**Fix:** Let the trunk appear whenever a bottle is held and keep the active-effect restriction on drinking, or add a disposal route that works while dosed.

### [elixir_borrowed_bag](/Users/accessair/Desktop/Workspaces/lifesim/content/events/contraband.grim:79) — receipt at the one-bottle cap

The borrowed-bag theft, first-year purchase and Grisk sample can resolve with an existing bottle of the same type, but the state stores one bottle at most. The first-year fixture charges the player despite leaving the inventory at one bottle. The other two narrate taking a second bottle with no such object retained.

**Fix:** Gate acquisition options on not holding that bottle, or explicitly handle a replacement, refusal, or disposal when already carrying one. Keep the help and decline choices available.

**Also affects:** [elixir_first_year](/Users/accessair/Desktop/Workspaces/lifesim/content/events/contraband.grim:102), [grisk_elixir_offer](/Users/accessair/Desktop/Workspaces/lifesim/content/events/contraband.grim:176).

### [elixir_finals_spare](/Users/accessair/Desktop/Workspaces/lifesim/content/events/contraband.grim:126) — fifth-year outside the academy calendar

The third opening says they bought the bottles from a fifth-year at the Newt. The academy's game and design have years one through four, with graduation after the fourth. No exceptional fifth year is identified here.

**Fix:** Use a fourth-year or an alumnus if the seller should no longer be a current student.

### [grisk_elixir_favour](/Users/accessair/Desktop/Workspaces/lifesim/content/events/contraband.grim:201) — third favor uses a different action from its check

The first two variants involve concealing an activity or object, while the third is putting in a kind word with a prefect. On success it ‘lands’ without a deception being shown. All three test Deceive at the same difficulty.

**Fix:** Give the third favor an actual cover story the player must maintain, or match its check to persuading the prefect.

### [contraband_caught](/Users/accessair/Desktop/Workspaces/lifesim/content/events/contraband.grim:257) — singular outcome confiscates both bottles

When both elixirs are held the opening says there is a bottle. Either confiscation path narrates handing over or discovering one bottle, while both inventory states are removed and both vault recovery flags are set.

**Fix:** Name both bottles in the opening and both confiscation lines when both are held, or only remove and record what the prefects actually found.

### [wd_bright_grisk](/Users/accessair/Desktop/Workspaces/lifesim/content/events/contraband.grim:393) — duplicate bedside premise

Grisk Is Not Pleased already begins ‘Grisk is sitting on your bed. You didn't leave the window open.’ Both require the player to take his costly deal or send him away, and he leaves by the window. The player's craving changes his leverage but the scene repeats the same entrance, choice and exit.

**Fix:** Use a different point of contact and show how he detects and exploits the craving, or combine the conditional offer with the existing bedside scene.

### [wd_ink_blank](/Users/accessair/Desktop/Workspaces/lifesim/content/events/contraband.grim:416) — unsupported elapsed time

‘Two months ago you could have recited them back’ is fixed, but the four-month craving can deal more than two months after the original dose. The current state supplies no exact date to the text.

**Fix:** Refer to the period when the elixir was active, or vary the line with elapsed time since the dose.

### [amaranth_quit](/Users/accessair/Desktop/Workspaces/lifesim/content/events/contraband.grim:492) — unshown physical cost

The cure deducts Health and Mood. Its outcome describes bitter mornings and surrendering spare bottles but does not describe physical discomfort or weakness caused by the cure.

**Fix:** Describe what the regimen costs the player's body or remove the Health loss.

## detention-2026-11-15

**Revise** · 8 cards · 6 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/detention-2026-11-15.critic.json)

Rejected on variant-level outcome mismatches and a demerit choice that promises to remove more than the outcome erases. The eight assignments have distinct subjects and trade-offs.

### [det_vault_catalogue](/Users/accessair/Desktop/Workspaces/lifesim/content/events/detention.grim:14) — Mood cost absent in the first two outcomes

Cataloguing charges Mood throughout. The first two outcomes describe sore eyes or a wrist ache and useful knowledge, while the third explicitly calls the work dull.

**Fix:** Give each variant a visible reason for the Mood loss, or use a consistent cost for the physical labor the outcomes show.

### [det_prefects_room](/Users/accessair/Desktop/Workspaces/lifesim/content/events/detention.grim:32) — one entry versus a whole name

Two openings say there are multiple demerits for the named classmate. The option offers to leave their name out and the first success calls the whole week quiet, but every win only removes one line. In the multiple-entry setup, the other entries are still there.

**Fix:** Make the option and outcomes say which one entry the player suppresses, or remove all of the entries when that is the intended risk.

### [det_apology](/Users/accessair/Desktop/Workspaces/lifesim/content/events/detention.grim:57) — health loss missing from first failure

The first failed apology says the student stays until the lamps go out. Since detention itself can be in the evening, that does not establish fatigue, injury or unusual exertion. The other failures show cramped hands and cold feet.

**Fix:** Show the first failed attempt keeping the student up or causing the same strain as the other failures.

### [det_great_lens](/Users/accessair/Desktop/Workspaces/lifesim/content/events/detention.grim:104) — unshown Health loss in one variant

The first two cleaning outcomes show numb fingers or cold, but the third only shows an hour of polishing and a cleaner lens. The same Health cost applies.

**Fix:** Add a physical cost to the third variant or move its cost to one the outcome shows.

### [det_flight_divots](/Users/accessair/Desktop/Workspaces/lifesim/content/events/detention.grim:121) — unshown costs in two variants

The third filling outcome has the field ruined again but shows no strain to justify Health loss. The second failed flight only has the prefect notice and order the player to fill the divot, although all failures cost Renown.

**Fix:** Show the third filling result tiring or injuring the player and give the second failure a witness or a public reprimand, or make the effects match each result.

### [det_gargoyle_scrub](/Users/accessair/Desktop/Workspaces/lifesim/content/events/detention.grim:167) — missing physical charge in multiple outcomes

The clean-row version of the left result has no fatigue or physical discomfort, and the right results focus on the marks, passage and prefect's joke. Both routes always deduct Health.

**Fix:** Write the cold or effort into all branches that charge Health, including the Cartographer and nonmember variants, or give those variants effects that match what happens.

## heists-shared-2026-11-15

**Revise** · 3 cards · 3 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/heists-shared-2026-11-15.critic.json)

The shared heist resolutions communicate the drop in cover and the cost of being caught. The exit offers loot decisions when there is no loot, and the escape outcome reads the bag after it has been cleared.

### [heist_way_out](/Users/accessair/Desktop/Workspaces/lifesim/content/events/heists/shared.grim:18) — choice legibility

When no loot was brought out, both buttons still ask what to do with loot. For the deck-only trip the sell button also follows a vault outcome that already gave the tin to Corvin at breakfast, while the exit brings the same tin back out before dawn.

**Fix:** Use an empty-haul exit with a meaningful choice or a neutral acknowledgement. For the tin, let one card own the delivery and keep it in chronological order.

### [heist_slip](/Users/accessair/Desktop/Workspaces/lifesim/content/events/heists/shared.grim:70) — cost in the fiction

On-show always deducts Health, but four of the six opening variants describe losing nerve or hiding, with no bodily price. Both final choices inherit the same damage.

**Fix:** Add a scrape or other physical toll to the variant that applies Health loss, or move the cost to variants where it occurs.

### [heist_caught](/Users/accessair/Desktop/Workspaces/lifesim/content/events/heists/shared.grim:99) — continuity

The successful escape zeroes heist_loot before rendering the line that tests it, making the carrying-loot outcome unreachable. The opening also says the prefect has already taken the loot, so dropping it during escape would require changing the opening too.

**Fix:** Choose whether the prefect takes the loot before or during the choice. Put the relevant state test before the reset or use one line consistent with advance confiscation, and show the physical cost of the successful run.

## hollowstar-agents-2026-11-15

**Revise** · 10 cards · 3 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/hollowstar-agents-2026-11-15.critic.json)

The two sides use recognizable voices and their small overtures remain ancillary to the arc. The Grey refund can conflict with unpaid board and two outcomes omit what their choice or cost implies.

### [ga_grey_board](/Users/accessair/Desktop/Workspaces/lifesim/content/events/hollowstar/agents.grim:44) — state and cost

board_missed is reset to zero when a second missed payment queues Grisk's debt offer. The Grey refund can then describe paid board and give 11 crowns although no board payment was collected and Hunger remains. The scene description also calls for a signature that the prose explicitly replaces with a frosted thumbprint.

**Fix:** Gate the refund on actually having paid this month, or write and apply a distinct settlement for an unpaid month. Use a thumbprint in the scene.

### [ga_grey_witness](/Users/accessair/Desktop/Workspaces/lifesim/content/events/hollowstar/agents.grim:64) — cost in the fiction

Silencing the witness deducts Renown, but the confrontation happens quietly and the result only shows the witness avoiding you. No one reacts to the intimidation or to what the witness tells them.

**Fix:** Show a third party seeing the threat or the resulting change in how people treat the player, or use a cost the private outcome shows.

### [wa_maud_lantern](/Users/accessair/Desktop/Workspaces/lifesim/content/events/hollowstar/agents.grim:212) — choice legibility

The prompt offers a lantern. “Thank her, and go” reads as leaving without taking it, but the player brings it home, burns it all night and returns it. The other option explicitly says to take it and gives it back immediately.

**Fix:** Name the choices for what they do, such as walking her in with the lantern or borrowing the lantern overnight.

## fixtures-middle-rungs-2026-11-15

**Revise** · 13 cards · 6 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/fixtures-middle-rungs-2026-11-15.critic.json)

The middle rungs put recognizable character habits into small social decisions. Several callbacks, scene props and costs depend on facts the encounter has not established.

### [mabel_empty_hook](/Users/accessair/Desktop/Workspaces/lifesim/content/events/fixtures_2.grim:52) — scene continuity

The empty hook is the title and the scene focal point, but the opening explicitly says the missing regular's cup is still on its hook, and the left result has Mabel take it down only after your visit.

**Fix:** Use the cup left on its hook as the opening image, or establish who removed it and when.

### [mabel_wrong_pot](/Users/accessair/Desktop/Workspaces/lifesim/content/events/fixtures_2.grim:31) — unsupported callback

This can be the first normal tea service with Mabel after reaching the relationship gate, but it states that she always brings the calm blend before the player sits and that she was reading last year's player. Existing tea orders have several possible blends.

**Fix:** Describe her making a confident guess this time. Gate the habitual blend on a specific established order if the previous routine is part of the scene.

### [vey_lunch_dare](/Users/accessair/Desktop/Workspaces/lifesim/content/events/fixtures_2.grim:174) — promised follow-up

The professor makes the favor the explicit stakes of the first challenge and in one win says it is owed, but no win grants a favor or a way to claim it. The repeated card can accumulate the same promise.

**Fix:** Make the wager immediate, or award a callable favor when the trick succeeds.

### [brask_half_sentences](/Users/accessair/Desktop/Workspaces/lifesim/content/events/fixtures_2.grim:225) — variant continuity

In the linked second variant the griffin has a thorn in its paw, but the ask-for-a-full-sentence outcome removes a splinter, which is the first variant's hippogriff injury. The owl loss also deducts the same Health as the bite and griffin strike without describing an injury.

**Fix:** Keep the correct animal and injury in each linked outcome and show the physical price of the owl scramble if it retains the Health loss.

### [brask_laugh](/Users/accessair/Desktop/Workspaces/lifesim/content/events/fixtures_2.grim:253) — canon

One story she tells ends with a bite and explicitly no moral, although the opening, her worldbook voice and her stories fact all say the bite and moral are her fixed form.

**Fix:** Let the owl story end with a moral, or make the missing one clearly an exercise she expects the player to complete.

### [amaranth_tea_break](/Users/accessair/Desktop/Workspaces/lifesim/content/events/fixtures_2.grim:280) — cost in the fiction

The third sitting variant says the conversation lasted longer than intended but never says it displaced study, unlike the other two. The same Study penalty applies.

**Fix:** Mention the reading or notes left undone in that variant, or change its cost.

## heist-restricted-stacks-2026-11-15

**Revise** · 13 cards · 6 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/heist-restricted-stacks-2026-11-15.critic.json)

The descent uses distinct obstacles and keeps the forbidden spell lessons within canon. Several repeat and reward branches contradict what the player saw or brought out.

### [st_dead_end](/Users/accessair/Desktop/Workspaces/lifesim/content/events/heists/stacks.grim:80) — cost in the fiction

Failing to search deducts Health even when the goblin merely notices you and you leave the crates alone, or the aisle closes and you jump back unharmed.

**Fix:** Tie the failed search cost to a described scrape, strain or injury, including the vault-depth line.

### [st2_charging_book](/Users/accessair/Desktop/Workspaces/lifesim/content/events/heists/stacks.grim:220) — unsupported callback

The repeat opening assumes the book remembers what you owe even after the retreat variant that explicitly says you left it owed nothing.

**Fix:** On a repeat, describe the waiting book without claiming an outstanding debt, or record and gate the debt on the previous result.

### [st3_no_lamp](/Users/accessair/Desktop/Workspaces/lifesim/content/events/heists/stacks.grim:326) — reward in the fiction

Both successful variants add one unit of loot, but the second variant only reaches a door and names nothing picked up.

**Fix:** Show what the player takes while following the shelves by touch, or omit the loot increment from that outcome.

### [st3_glass_case](/Users/accessair/Desktop/Workspaces/lifesim/content/events/heists/stacks.grim:351) — repeat feedback

After a successful theft the text says the charm is rewoven tighter, but the card repeats the same check at the same difficulty.

**Fix:** Give the rewoven charm a distinct check modifier, or describe the repair without implying a harder lock.

### [st_vault](/Users/accessair/Desktop/Workspaces/lifesim/content/events/heists/stacks.grim:382) — unsupported callback

The second crate victory says you go straight to the shelf you catalogued in detention even without vault_catalogued. The card can explicitly say beforehand that you have no idea where anything is.

**Fix:** Gate the catalogued-shelf line on vault_catalogued and give an unfamiliar player a search that matches their opening.

### [st_vault](/Users/accessair/Desktop/Workspaces/lifesim/content/events/heists/stacks.grim:382) — reward in the fiction

The opening and bottle option are singular even when both confiscated bottles are restored. The second victory also says you took only what was yours, but both variants add one extra unit of loot to fence or read.

**Fix:** Use conditional or number-neutral language for the confiscated belongings and align the extra loot with the branch where the player takes something besides the bottles.

## heist-seventh-tower-2026-11-15

**Revise** · 13 cards · 5 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/heist-seventh-tower-2026-11-15.critic.json)

The climb builds out the abandoned classrooms without stepping into the main plot's room. Its repeat logic lets the player retake unique objects, and several routes omit or contradict their haul.

### [tw_dead_end](/Users/accessair/Desktop/Workspaces/lifesim/content/events/heists/tower.grim:78) — cost in the fiction

At the study end, the failed search deducts Health when desks shift and the player simply leaves them alone.

**Fix:** Show why the shifting desks hurt or move this loss to a variant with a bodily consequence.

### [tw2_exam_cupboard](/Users/accessair/Desktop/Workspaces/lifesim/content/events/heists/tower.grim:189) — state continuity

The leave option sometimes says you go downstairs with nothing in your hands even if you gathered loot on the earlier climb and take it to the exit.

**Fix:** Phrase that exit as leaving the papers behind, or condition the empty-hands line on the loot carried.

### [tw2_class_register](/Users/accessair/Desktop/Workspaces/lifesim/content/events/heists/tower.grim:259) — repeat continuity

The player can steal the unique last register and return next month to find and steal that same register still open to its last day. The repeat opening never checks that it was taken.

**Fix:** Record a successful theft and substitute a different object on later trips or make the register encounter unavailable while it is gone.

### [tw3_orrery](/Users/accessair/Desktop/Workspaces/lifesim/content/events/heists/tower.grim:314) — repeat continuity

After the first theft, the text says the orrery is missing the only pearl, but the identical button can steal it again for another two loot. The earlier theft flag currently governs only the opening.

**Fix:** Lock out taking the pearl once taken, or add a different moving part with a grounded new reward on later visits.

### [tw_masters_study](/Users/accessair/Desktop/Workspaces/lifesim/content/events/heists/tower.grim:372) — reward in the fiction

Learning Extraction grants two loot, but that branch says the player reads and closes the notebook and takes nothing. The already-knows branch describes the inkstand and medals for the same haul.

**Fix:** Name the two objects carried out after reading, or reserve the loot for the branch that actually takes them.

## port-calder-heists-2026-11-15

**Revise** · 34 cards · 14 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/port-calder-heists-2026-11-15.critic.json)

The two city jobs have distinct objectives and useful links through the warehouse foreman's accounts. The shared recovery card repeats its academy counterpart, and the first band of each job can send the player back to a room its prose already left.

### [job_way_out](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_heists.grim:22) — choice legibility

The no-haul opening says you escaped with nothing, but still asks whether to fence or donate goods. Neither branch delivers its listed return in that state, including the branch whose story implies a public reception.

**Fix:** Use an empty-haul acknowledgement or give the empty-haul choices labels and consequences the player can actually receive.

### [job_slip](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_heists.grim:67) — duplicate premise

This is nearly a line-for-line copy of heist_slip. It has the same lantern, hiding beat, duplicated buttons, almost identical narration and the same cover, Health and loot changes. The city location rarely changes the decision.

**Fix:** Keep the recovery function and give the city jobs their own immediate dilemma and consequences. Ground the choice in the warehouse or the gala and account for the Health cost in the result.

### [job_caught](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_heists.grim:95) — continuity

With loot, the opening says the Watch has taken everything. The successful escape then says you drop the same goods before running.

**Fix:** Let the opening describe the Watch demanding the goods. Use the player outcome to say who takes or drops them.

### [job_caught](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_heists.grim:95) — unsupported callback

A successful escape sets job_watch_record because the sergeant saw you. On the player's first arrest after that escape, the record alone produces another night in the cells and the same magistrate, although neither was part of the previous encounter.

**Fix:** Keep the recognized-face fine if intended. Track an earlier booking separately for the cells and magistrate callbacks, or refer only to the Watch recognizing the player.

### [bonded_enter](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_heists.grim:200) — journal continuity

The culvert route reaches the floor from underneath at depth 3. The Journal records going over the customs wall on every entry.

**Fix:** Use the actual route recorded on entry, or use a route-neutral Journal line.

### [bonded_dead_end](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_heists.grim:241) — cost in the fiction

A failed search always deducts Health, including the variant where a crate merely shifts and the player freezes and leaves.

**Fix:** Include physical strain or injury in that variant, or remove the deduction there.

### [bonded1_loading_door](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_heists.grim:347) — room continuity

The win puts the player inside the warehouse among the crates. When it draws at depth 1, the next card still draws from the yard and can put the clerk's window between the player and the door they just used.

**Fix:** Keep the successful band-one scene on the yard side of the threshold, or advance to the interior band when it crosses the doorway.

### [bonded_strongroom](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_heists.grim:503) — reward in the fiction

Both ways of succeeding grant three loot. The initial narration only lists what is on the shelves, and the repeat tool-assisted win stops at opening the door. The ledger follows as its own decision.

**Fix:** Show the player taking something before the loot increment pays out or before the ledger scene starts.

### [crescent_enter](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_heists.grim:669) — journal continuity

The Journal always says the player entered with nobody's invitation, including a run where they hand over the gilt guest card. Mews entry also still sets up a possible follow-up that treats access to the ballroom as unresolved.

**Fix:** Use a route-neutral Journal entry and give the footman a clear role at an interior checkpoint, or route an entrance that bypasses him to a different obstacle.

### [crescent1_conservatory](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_heists.grim:810) — room continuity

Both wins bring the player onto the upper floor. At depth 1 this only increments to 2, so the next card can return them to the ballroom with the stairs still ahead. The first quadrille victory can likewise say the player went up while leaving the next draw in the ballroom.

**Fix:** Keep the band-one success text on the ballroom level until the threshold, or make the upward routes enter the upstairs band.

**Also affects:** [crescent1_quadrille](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_heists.grim:762).

### [crescent1_supper_table](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_heists.grim:789) — choice legibility

The retreat button promises an ice, but on every later appearance the outcome gives an oyster instead.

**Fix:** Use a food-neutral label or vary it to match the repeat outcome.

### [crescent2_back_stairs](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_heists.grim:831) — timing continuity

The servants' route admits the player through the mews at eleven. The same heist can then draw the back stairs with the clock still nearly at eleven.

**Fix:** Describe the changeover as ongoing here, or time the upstairs line after the arrival.

### [crescent2_writing_desk](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_heists.grim:910) — choice legibility

The button offers to read the letters. Every success also takes one to sell or give away, which matters when the correspondence is evidence.

**Fix:** Make the taking explicit on the option or let the player read without pocketing evidence.

### [crescent_safe_card](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_heists.grim:972) — check in the fiction

Having read the foreman's correspondence gives a safe-opening bonus, but the letters concern the side door and stolen cargo. Neither card shows how that improves the dial check.

**Fix:** Give the letters a concrete detail the player can use at the safe, then acknowledge it in the hint or result.

## capital-origin-homes-2026-11-15

**Revise** · 10 cards · 4 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/capital-origin-homes-2026-11-15.critic.json)

The townhouse, counting house and loft each have a recognizable family economy. Some outcomes claim changes to future funds or assume earlier choices that the cards never record.

### [townhouse_dinner](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_homes.grim:15) — state continuity

The honest answer takes money from the purse immediately, but every outcome reduces a later allowance. Suitable Tea describes future bank drafts in both outcomes while changing current cash. The recurring noble letter still pays the same allowance plus its independently rolled gift.

**Fix:** Describe an immediate family debit or gift in the outcomes, or have the decisions adjust the next actual bank draft.

**Also affects:** [townhouse_suitable_tea](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_homes.grim:49).

### [counting_house_end_desk](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_homes.grim:95) — unsupported callback

The third left outcome says the player finds the error faster than last time. It can be the first time they attempt a ledger because they chose the wharf door on the previous two visits.

**Fix:** Praise the speed on this ledger alone, or show the comparison only if the player did the ledger earlier.

### [counting_house_end_desk](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_homes.grim:95) — reward in the fiction

The third wharf-door outcome ends with sending away the rival and the clerk smiling, but it grants the same coin as the other two, which name the tip or cut.

**Fix:** Name the third payment, or remove it from that outcome.

### [crew_loft_long_game](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_homes.grim:157) — unfunded wager

A player with zero crowns can put a coin in and lose. Gold stays at zero and the outcome still claims a paid stake.

**Fix:** Require enough gold to put the wager in, or add a stake-free alternative with an outcome that reflects it.

## capital-markets-2026-11-15

**Revise** · 13 cards · 6 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/capital-markets-2026-11-15.critic.json)

The counters and their side scenes establish what each market sells. Some transactions promise stock, payment or correspondence that the available choices and current game state do not support.

### [shop_bazaar](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_markets.grim:9) — stock continuity

The opening always says there is a rare item on the curio cloth. On a visit whose scheduled curio the player already owns, all three curio choices disappear.

**Fix:** Give the cloth a sold-out or display-only line for those visits, or rotate to an unowned item when one remains.

### [bazaar_grimsby_book_stalls](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_markets.grim:89) — promised follow-up

When the player makes up the price difference, Grimsby says he will pay them back. There is no repayment in the branch or later hook. The round-two author notes say the promise was removed, but it is present in the frozen source.

**Fix:** Have him thank the player for a gift, or arrange for him to repay the difference later.

### [bazaar_hat_bet](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_markets.grim:144) — unfunded wager

A player with zero crowns can accept the bet and lose. The outcome says they paid full price and received the hat even though they paid nothing.

**Fix:** Gate the wager on being able to pay the quoted price, or charge the price as a stake and return it on a win.

### [bazaar_map_dealer](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_markets.grim:166) — moral feedback

Copying the chart is Hollow, but the seller watches, smiles, and says everyone copies it. The branch gives no reason that copying a chart he openly shares should carry a moral cost.

**Fix:** Show the player violating a clear condition of seeing the chart, or give copying a cost the shop encounter actually establishes.

### [arcade_tutor](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_markets.grim:251) — price continuity

The Guile lesson claims the tutor charges extra, but its cost is the same as every other lesson in the menu.

**Fix:** Remove the surcharge claim or put the intended fee in the option price.

### [arcade_scribe](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_markets.grim:296) — canon

Kael's paid reply is described as coming from the North. His break schedule specifically keeps him by the lake and observatory at the academy because he cannot go home.

**Fix:** Have the letter find him at the academy. Keep the frost as something he does to the envelope.

## capital-peers-2026-11-15

**Revise** · 21 cards · 5 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/capital-peers-2026-11-15.critic.json)

The visits distinguish the peers' private homes and public manners. Recurring options still remember choices the player may never have taken, and one permanent sequence step keeps calling a family conversation its first.

### [clockworks_long_bench](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_peers.grim:99) — unsupported callback

The second cupboard outcome says the player is back and hits their head again. It can be the first cupboard visit if the player worked at the bench on the first showing. The third bench outcome also calls the father's explanation the first ever, and that sequence step repeats indefinitely.

**Fix:** Track the relevant choice for a return line, or describe the cupboard without the earlier visit. Change the final bench line so subsequent explanations remain plausible.

### [oracle_window_seat](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_peers.grim:226) — unsupported callback

The second painting outcome says the player does the banisters slightly better this time, although their first choice may have been asking about a petitioner. The sequence follows card appearances, so it cannot establish painting experience.

**Fix:** Describe the current attempt alone or gate the improvement on an earlier painting choice.

### [hollis_inspection](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_peers.grim:288) — repeat continuity

The final sequence step says Mr Hollis tells a story Bram has never heard, and the right outcome repeats that claim on the fourth and every later showing.

**Fix:** Give the final sequence step a reusable recollection or record the one-time revelation and substitute later talk.

### [mir_capital_brass](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_peers.grim:366) — choice legibility

The button offers a loan, and the narration calls it a loan, but the player pays permanently. Mir sends a beetle later, with no indication that they have agreed to repay in kind.

**Fix:** Offer to cover the fare as a gift, or explicitly make the beetle the agreed repayment.

### [bram_capital_no_sash](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_peers.grim:384) — unsupported callback

The pigeon outcome says this is the first time the player has ever seen Bram laugh. A prior won bram_rival_race can already show him laughing.

**Fix:** Describe this laugh without claiming it is the player's first, or gate the callback on the relevant earlier outcomes.

## capital-society-2026-11-15

**Revise** · 16 cards · 4 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/capital-society-2026-11-15.critic.json)

The club, theatre, gardens and bridges provide different social pressures. A dawn event has no visit slot, the public promenade can occur after luncheon, and a favor wager leaves the win unfulfilled.

### [club_card_room](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_society.grim:36) — promised follow-up

The advertised stake is the general owing a favor on a win. He records the player's name and says he owes them, but the effects only grant Renown and gold and no later favor is available.

**Fix:** Have him discharge the favor immediately through a specific act that explains the reward, or record a favor the player can call in.

### [gardens_promenade](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_society.grim:189) — time continuity

The scene always takes place before luncheon, but time: morning noon only weights the draw. It still has positive eligibility on an afternoon visit.

**Fix:** Use a required visit slot or vary the before-luncheon wording for the actual slot.

### [gardens_dawn_duel](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_society.grim:207) — unreachable visit

The card requires slot: morning at the Royal Gardens. Both capital break plans make morning a plan slot and offer visits only at noon, afternoon, evening and night, so normal garden visits can never draw it.

**Fix:** Give the event a scheduled route into the morning, or adapt the scene and required slot to a visit that the capital plans support.

### [bridges_busking](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_society.grim:295) — safety

The second failed show puts a child in the live audience. The project's tone and safety checklist requires every character to be an adult.

**Fix:** Replace the spectator with an adult whose reaction fits the failed act.

## capital-port-2026-11-15

**Revise** · 24 cards · 6 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/capital-port-2026-11-15.critic.json)

The working city supplies recognizable occupations, discovery leads and civic settings. Its dawn auction is unreachable through ordinary visits, and several scenes claim costs or chronology their effects do not support.

### [docks_northern_ship](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_port.grim:33) — choice legibility

The left button only asks to see the goods, but it immediately pays for a lump of ice and takes it home. The old sailor says it is expensive but never names the item before the purchase.

**Fix:** Let the player inspect before committing, or label the option as buying what he offers and describe the cold object before the choice.

### [docks_undercroft_word](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_port.grim:50) — alignment

Asking directions moves Hollow before the player has agreed to gamble, work for the house or commit any crime. The other option obtains the same place knowledge with no moral move.

**Fix:** Put the moral weight on an actual commitment made here, or use an ordinary curiosity trade and leave the later illegal activity to its own decisions.

### [shop_fish_market](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_port.grim:90) — time continuity

The shop's first gossip and its look outcome refer to before breakfast and smelling of fish till noon. The first normal capital visit is noon. The golden-fish scene and its illustration likewise require dawn without a scheduled dawn route.

**Fix:** Make these lines and scenes fit a later market visit, or provide an actual dawn appointment.

**Also affects:** [fish_market_golden_fish](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_port.grim:173).

### [fish_market_auction](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_port.grim:129) — unreachable visit

The auction requires slot: morning. Both capital plans offer visits only from noon onward, so the player cannot reach this place card at its required time.

**Fix:** Schedule the auction as a morning outing or adapt it to a supported visit slot.

### [fish_market_auction](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_port.grim:129) — unfunded wager

If the auction is presented with zero gold, the player can bid and lose. The story then says the cargo sold for less than they paid, although the purse remains at zero and there is no debt.

**Fix:** Require a deposit or ability to cover the possible purchase before accepting the bid, or represent the unpaid obligation.

### [rookery_rooftops](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/capital_port.grim:482) — cost in the fiction

The second failed run lands in washing and causes a dyer to shout, while the third ends with a careful climb down from a held chimney-pot. Both deduct the same Health as the first variant's explicit bruising, without naming an injury or bodily toll.

**Fix:** Show the strain or injury from each failed route that retains the Health loss.

## countryside-homes-2026-11-15

**Revise** · 6 cards · 4 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/countryside-homes-2026-11-15.critic.json)

The Marsh has a recognizable household and unsettling public paths. Some repeating choices assume a prior action, and the supper and remedy choices need clearer time or purchase language.

### [marsh_stilt_house_supper](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/countryside_homes.grim:32) — time continuity

The supper scene takes place at dusk, with the marsh going quiet outside and lamplight at the shutter. It has no required slot and can be drawn on a noon visit.

**Fix:** Require an evening visit for the supper or change the opening to match the visit slot.

### [marsh_witch_stranger](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/countryside_homes.grim:50) — choice legibility

Asking what the woman means immediately spends gold on rue. The button asks a question and the only quoted price appears after the choice has been made.

**Fix:** Offer to buy the rue in the label and establish the price before the decision, or make the exchange a separate choice after the question.

### [marsh_lights_on_the_drovers_road](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/countryside_homes.grim:67) — unsupported callback

The second left outcome says the player goes further this time even if they watched from the bank on the first showing. The second and third left outcomes also retain the Health loss without showing the wet, cold or strain that the first one describes.

**Fix:** Use route-neutral progression unless an earlier walk is recorded, and show the bodily toll in each outcome that charges Health.

### [marsh_drowned_chapel](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/countryside_homes.grim:84) — unsupported callback

The second sketch outcome says the player sketches it again from the same tussock. It can be the first sketch if they waded out on the first showing.

**Fix:** Describe the new drawing without assuming a previous one, or record the earlier sketch choice.

## countryside-peers-2026-11-15

**Accepted** · 9 cards · 1 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/countryside-peers-2026-11-15.critic.json)

The farm and print shop give Tobias and Nessa home scenes with their own work and family voices. One seasonal detail in the top field needs adjustment.

### [fennick_top_field](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/countryside_peers.grim:72) — season continuity

The top field can first appear during a winter break. It always shows standing golden barley on the valley side and patchy barley at the Fennicks' side, with no seasonal variant.

**Fix:** Contrast the winter fields, stored crop or yields in winter, and keep the standing golden barley for harvest season.

## countryside-public-places-2026-11-15

**Revise** · 12 cards · 3 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/countryside-public-places-2026-11-15.critic.json)

The village clues and paid work lead into the valley story without revealing its full explanation. Some ordinary scenes ignore the bargain's later outcome, and the skipping scene uses children in a project whose live cast is adults only.

### [market_harvest_board](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/countryside_places.grim:35) — aftermath continuity

Even after the bargain is broken and the later thin-harvest scene has put a cross on the board, the ordinary board still says every year is good. The inn still beams and gives the player free food despite its later cold reception. The dry wheel also keeps its unexplained turning with no changed outcome.

**Fix:** Gate the old welcome and prosperity scenes on the bargain remaining intact, or add aftermath variants for the board, inn and mill.

**Also affects:** [market_inn_welcome](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/countryside_places.grim:17), [mill_dry_wheel](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/countryside_places.grim:114).

### [mill_skipping_rhyme](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/countryside_places.grim:97) — safety

The whole encounter is a group of children skipping, including a girl teaching the player and a mother calling them in. The project's live-cast checklist requires adults.

**Fix:** Recast the counting custom with adult villagers and adapt the rhyme's performance and responses to that group.

### [market_harvest_board](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/countryside_places.grim:35) — safety

The third response puts a boy on the green and has his mother call him indoors mid-answer. It reads as a child, against the adult-cast requirement.

**Fix:** Use an adult respondent and a different interruption, such as being called back to a stall.

## countryside-wide-2026-11-15

**Revise** · 16 cards · 5 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/countryside-wide-2026-11-15.critic.json)

The wider valley offers varied work and folklore at distinct places. Some costs describe the body while deducting spirits, and night scenes still have daytime eligibility.

### [coppice_rides](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/countryside_wide.grim:163) — cost in the fiction

Charcoal work deducts Mood, but the three variants describe stacking, bundling and turfing, payment, sausage, singing, raw shoulders and getting wet. They show bodily exertion without the boredom, resentment or distress that would explain a Mood loss.

**Fix:** Show the emotional cost in each work outcome or use the bodily cost already described.

### [coppice_charcoal_night](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/countryside_wide.grim:196) — time continuity

The night watch has only a time preference for evening, so it can appear on an open noon visit while the scene shows the camp in darkness. The Drovers' long table and loose bear similarly favor evening or night but retain positive noon eligibility while their openings or outcomes specify night.

**Fix:** Use required slots or conditions for the night scenes, or vary their current time references to fit the slot.

**Also affects:** [drovers_long_table](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/countryside_wide.grim:337), [drovers_loose_bear](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/countryside_wide.grim:377).

### [quarry_face](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/countryside_wide.grim:268) — cost in the fiction

Searching the scree deducts Mood, but the variants show an aching back, cold gritty hands, fingers that stopped working and a sunburnt neck. Their discoveries are described positively, with no corresponding disappointment or frustration.

**Fix:** Align the cost with the body in these lines or show why the search lowers the player's spirits.

### [quarry_echo](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/countryside_wide.grim:290) — safety

The companion is repeatedly a shepherd boy who dares the player and laughs on the rim. The adult-only live-cast rule needs the shepherd to be clearly an adult.

**Fix:** Make him an adult shepherd and retain his amusement at the echo.

### [quarry_echo](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/countryside_wide.grim:290) — time continuity

The player calls Good morning, and the question outcome refers to the only pause all morning. The card can draw on an ordinary afternoon visit.

**Fix:** Use time-neutral greetings and duration, or give the encounter a supported time gate.

## good-year-2026-11-15

**Revise** · 18 cards · 7 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/good-year-2026-11-15.critic.json)

The optional side story has distinct clues and three coherent resolutions, but successful endings erase collected moor loot, some scenes assume unestablished visits or the wrong time, and the climax conflicts with the cast and alignment rules. Its custom clue counter also needs an explicit design exception or the prescribed arc representation.

### [gy_after_broken](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:421) — continuity

All three resolved aftermaths set moor_haul to zero on show and end the delve without the usual sell/study settlement. A player who carried three finds to the Tenant loses all three even after a successful rescue or negotiation; no ending describes dropping, paying or losing them. The fixture reproduces this reset for each ending.

**Fix:** Preserve the haul and offer its settlement after the story aftermath, or narrate and signal an intentional forfeiture before the player commits to the ending. Do not silently erase the accumulated finds.

**Also affects:** [gy_after_renewed](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:445), [gy_after_sold](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:469).

### [gy_miller_tally](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:153) — continuity

The mill clue can be the first visit to the dry wheel and first clue, yet opens with the wheel turning on the dry race again and compares the book to the landlord’s. The normal success in gy_hall_papers likewise calls its ledgers the guest book’s twin without requiring that book to have been seen. Clues are intentionally obtainable in any order.

**Fix:** Use first-visit wording unless the wheel has actually been seen; condition comparisons to the guest book on its discovery, and give an independently understandable description otherwise.

**Also affects:** [gy_hall_papers](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:255).

### [gy_scarecrow_names](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:131) — time gating

Afternoon eligibility is positive for the collar clue written in dusk, the agent option that walks out into night, Room Seven’s taproom evening, and the witch scene explicitly depicted at dusk. The fern hunt also remains eligible in the evening but says the player spends the afternoon with Ottilie. Their story gates do not supply those time restrictions.

**Fix:** Gate the relevant scenes to an available matching slot or make the opening, art scene and outcomes adapt to the actual visit time. Preserve daytime access where it is needed for the optional investigation.

**Also affects:** [gy_agent_drovers](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:204), [gy_ottilie_gone](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:296), [gy_witch_truth](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:322), [gy_fern_hunter](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:79).

### [gy_tenant_hall](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:372) — safety

The successful replacement bargain explicitly includes children among the people the player promises to bring to the Tenant’s table. This conflicts with the project checklist’s requirement that every character be an adult, and with this file’s own adults-only premise.

**Fix:** Make the offered company explicitly adult: for example keepers, neighbours and fiddlers. Update the bargain success text consistently with its hint and aftermath.

### [gy_tenant_hall](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:372) — alignment

Breaking the bargain and successfully replacing the captive tithe free the accumulated prisoners, at real risk, but neither success moves alignment. Taking those rescued guests to the inn also gives no alignment, so that entire protective route has no Lumen consequence; only selecting the Marsh aftermath does. Selling the guests already has explicit Hollow effects.

**Fix:** Put the appropriate protective alignment change on the successful rescue/renegotiation itself, so it does not depend on the later destination. Reassess any additional aftermath alignment to avoid counting the same moral act twice.

### [gy_ottilie_gone](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:296) — plot progress

The disappearance gate uses gy_clues >= 2, a hand-maintained counter incremented by five clue cards. The authoring costs rule and AGENTS.md explicitly require plot engagement to use arc clues rather than a custom counter. The maps plan approves an independent side story but records no exception for this representation. This is a rules deviation, not a failed counter increment.

**Fix:** Represent this optional story’s engagement using its own arc/clue state and gate the disappearance on that engagement, preserving independence from the Hollow Star. If the custom-counter representation is intentional, explicitly approve and record that design deviation in PROGRESS.md.

**Also affects:** [gy_guest_book](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:103), [gy_scarecrow_names](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:131), [gy_miller_tally](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:153), [gy_almanac_page](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:180), [gy_hall_papers](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:255).

### [gy_tenant_hall](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/good_year.grim:372) — continuity

The winning bargain checks gy_guest_book OR gy_coats, then says the player names the guests from the book AND the collars. Success with only the book therefore claims a collar discovery that never happened, and the reverse case invents a read guest book. The fixture wins with the book flag alone and reproduces the combined-source claim.

**Fix:** Choose the source phrase from the actual flags: book, collars, or both. Keep the existing separate clue bonuses and the fallback wording when neither clue was found.

## moors-2026-11-15

**Revise** · 21 cards · 4 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/moors-2026-11-15.critic.json)

The moor route, shortcuts and foes work, and the finite bands retain progress cards after failed checks. Revision is needed for a warm occupied hill after the bargain is broken, inaccurate or unshown haul losses, and a noon outcome available on later visits.

### [moor3_warm_turf](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/moors_delve.grim:520) — continuity

After gy_broken, this card remains eligible at depths 5–6 and describes warm breathing turf, a fiddle and a table being laid. At depth 7 the resolved gy_hill_turf explicitly makes the same hill cold and its hall empty. The fixture shows both texts in the broken-bargain state.

**Fix:** Gate the occupied warm-hill card off after gy_broken, or supply a resolved version with cold ordinary turf and outcomes consistent with the empty hall. Keep enough progress cards in the band after changing the gate.

### [moor_stumble](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/moors_delve.grim:138) — continuity

The conditional on_show loss correctly leaves moor_haul at zero, but every opening variant still says an object or part of the carried finds was lost. This can be the first failed obstacle, before anything was collected; the zero-haul fixture reproduces it.

**Fix:** Remember whether a find was actually lost before changing the haul and use that state for the loss wording. When there was no find, describe the injury and escape without inventing lost possessions.

### [moor_lost](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/moors_delve.grim:161) — unshown cost

The rescue sets moor_haul to zero, confiscating the whole accumulated payout, but neither the shepherd account nor the grandmother account mentions the bag or losing its contents. The three-find fixture ends with zero finds and only a rescue narrative.

**Fix:** Describe the bag being lost or abandoned during the failed expedition in both rescue variants, or preserve the finds if only injury is intended. Make the loss visible when it occurs.

### [moor_peat_cutters](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/moors_delve.grim:27) — time continuity

One cutting outcome says the player’s back aches by noon, although the routine can be chosen on afternoon and evening visits. Unlike the winter wording, that endpoint does not adapt to the visit.

**Fix:** Replace by noon with an elapsed-work description such as after a while, or condition the endpoint on the actual slot. Keep the same visible physical cost.

## tide-caves-2026-11-15

**Revise** · 23 cards · 3 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/tide-caves-2026-11-15.critic.json)

The tide-cave routes, one-time shortcuts, warehouse connection and final swim are coherent and pass their existing tests. The rock-pool child conflicts with the adults-only rule, and the fall/rescue narration does not consistently match the carried finds that are actually lost.

### [tide_rock_pools](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/tide_caves.grim:49) — safety

The scene and third linked variant explicitly cast a small boy with a jam-jar; the player compares jars with him and hears his warning. This is an active child character, contrary to the project’s adults-only cast checklist.

**Fix:** Use an explicitly adult shore collector throughout the scene, opening and both corresponding outcomes, preserving the jar comparison and mussel warning.

### [tide_soaked](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/tide_caves.grim:159) — continuity

The first obstacle can fail with tide_haul still zero. The effects correctly subtract a find only if the haul is positive, but all three openings nevertheless claim a lost object, lighter bag or lost contents. The zero-haul fixture reproduces a wave taking something from an empty bag.

**Fix:** Capture whether a find was lost before the decrement and condition all loss descriptions on that result. Use a physical fall/soaking description without a lost object when the bag was empty.

### [tide_fished_out](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/tide_caves.grim:182) — unshown cost

The rescue resets tide_haul to zero regardless of the accumulated salvage, but neither Nan’s rope rescue nor the lighterman’s boat account says that the bag or all its contents were lost. The fixture silently removes three finds.

**Fix:** Show the bag being abandoned or washed away in both rescue variants, or retain its contents if this failure is meant to cost health alone. The player should be told when the whole salvage payout is lost.

## region-streets-2026-11-15

**Revise** · 23 cards · 4 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/region-streets-2026-11-15.critic.json)

The street and lodging scenes have distinct decisions and use their regional pools coherently. Four findings cover an omitted stated fare, an unfunded wager, time-specific wording outside its slot, and children in the procession cast.

### [streets_omnibus](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/region_streets.grim:88) — missing consequence

The opening explicitly prices a full ride at a penny. Both choices take that ride, seated or standing, but neither has a gold cost or a stated free-fare exception. The fixture starts at 70 gold and finishes at 70 on both routes.

**Fix:** Charge the stated fare on the riding options and show payment, or establish why this particular ride is free and remove the unsupported price promise.

### [streets_automaton](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/region_streets.grim:159) — time gating

The automaton can show at night but always writes Good afternoon on the waiting option. The owl card’s evening time preference likewise still gives positive noon fit, and following it then describes crossing the field in half-dark. Both mismatches are reproduced in the fixture.

**Fix:** Adapt the greeting to the actual slot or omit the time-specific greeting. Restrict the owl scene to dusk/evening/night as appropriate, or supply daylight text and art for other slots; a time preference is not a guard.

**Also affects:** [lanes_barn_owl](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/region_streets.grim:311).

### [streets_procession](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/region_streets.grim:175) — safety

The royal procession explicitly includes children on shoulders in its spectator cast. The project critic checklist requires every character to be an adult.

**Fix:** Make the elevated spectators explicitly adult or describe hats, flags and obstructed views without introducing children.

### [lodging_sailors_inn_night](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/region_streets.grim:358) — unfunded wager

The right option stakes a coin but has no funds condition. It remains available with decent lodging and zero gold; a forced loss says You pay up while the balance stays zero. Success can still produce winnings, so the wager is risk-free when broke.

**Fix:** Require an affordable stake for this option and keep the other choice unconditional, or make the challenge explicitly nonmonetary when the purse is empty. Match both win and loss text to the chosen form.

## region-streets-2-2026-11-15

**Revise** · 37 cards · 5 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/region-streets-2-2026-11-15.critic.json)

These additional city and country encounters have distinct settings and decisions. Revision is needed for explicit or strongly child-coded cast, unfunded wagers, a false stage-history claim, failed deceit with no moral consequence, and a coin stolen from an empty purse.

### [streets_water_cart](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/region_streets_2.grim:25) — safety

The water-cart scene, the lost child explicitly aged about five, the strawberry-sharing outcome and the rainbow chase all put children directly into the current action. The shoeblack is described as a small boy, and the signpost pranksters are boys whose mothers are told on them; those two are strongly child-coded rather than explicitly aged. The project requires every character to be an adult.

**Fix:** Recast the explicit children as adults and adapt the rescue/action to fit: for example a disoriented adult needing reunion, and adult companions or farmhands sharing the outing. Establish the shoeblack and pranksters as adults in their wording and outcomes instead of relying on an ambiguous boy label.

**Also affects:** [streets_lost_child](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/region_streets_2.grim:109), [streets_shoeblack](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/region_streets_2.grim:307), [lanes_strawberries](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/region_streets_2.grim:399), [lanes_signpost](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/region_streets_2.grim:623), [lanes_rainbow](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/region_streets_2.grim:640).

### [streets_pieman](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/region_streets_2.grim:143) — unfunded wager

Both the pie toss and chess game promise a monetary stake on losing, but charge only inside the random/check branch. Automatic affordability checks therefore see no price, and both play options remain enabled with zero gold. The fixture forces each loss: one says You pay double and the other deposits a coin, while neither balance falls below zero.

**Fix:** Require funds covering the possible loss before offering either wager, retaining the unconditional observation option. Alternatively make the empty-purse game explicitly nonmonetary and adapt both possible outcomes.

**Also affects:** [streets_chess_hustler](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/region_streets_2.grim:204).

### [streets_mistaken](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/region_streets_2.grim:243) — continuity

The option labelled Tell her the truth says the player has never been on a stage in their life. It can follow actual stage performances such as the successful theatre_vey_ghost; the fixture performs that role and then reproduces the supposedly truthful denial.

**Fix:** Say the player was not this woman’s villain, without asserting a lifelong absence of stage experience, or condition any broader stage-history statement on actual performance history.

### [streets_mistaken](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/region_streets_2.grim:243) — alignment

Play along is an attempted impersonation for tea, cake and attention. Alignment decreases only on success. On failure the player has already lied about the trapdoor and is exposed, yet takes only embarrassment/renown costs. The fixture confirms unchanged alignment on that lying branch.

**Fix:** Apply the moral effect to choosing the dishonest impersonation, outside its success branch, while leaving the additional social rewards and embarrassment dependent on the check.

### [streets_monkey](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/region_streets_2.grim:87) — continuity

The purse theft is eligible at zero gold. If the chase fails, the grinder returns the purse lighter by a coin and the effects try to deduct that coin, even though there was no money to take. The fixture starts and ends at zero while reproducing that loss claim.

**Fix:** Gate the paid-purse version on actually carrying a coin, or give an empty-purse branch with the monkey/grinder’s reaction and consequences consistent with no monetary loss.

## remaining-quiet-hours-2026-11-15

**Revise** · 2 cards · 1 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/remaining-quiet-hours-2026-11-15.critic.json)

The two active quiet fallbacks are distinct from their homes’ principal scenes. The counting-house fallback needs an actual evening/night condition for its after-hours porter round.

### [capital_counting_house_quiet_hour](/Users/accessair/Desktop/Workspaces/lifesim/content/events/maps/placeholders.grim:139) — time gating

This fallback has time: evening night but no slot condition. At noon its fit is still 0.3, while the opening says After hours and describes the night porter lighting a lantern for his round. The fixture reproduces that noon combination.

**Fix:** Add an evening/night guard, or provide a daytime quiet-hour version whose desks, porter and light fit the actual visit. Keep the fallback reachable in its intended slots.

## night-market-2026-11-15

**Accepted** · 9 cards · 1 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/night-market-2026-11-15.critic.json)

Accepted with one linked-pronoun fix. The market’s discovery, counter, bargains and departure scenes differ in premise and choices, and the fixed-shop visit ordering already places the dawn epilogue last.

### [nm_thornwick_shopper](/Users/accessair/Desktop/Workspaces/lifesim/content/events/night_market.grim:143) — linked variants

The third opening introduces a female Thornwick student raising a toffee apple, but the third secret-trade outcome begins He tells you and continues with him. Seed 10 reproduces that linked mismatch.

**Fix:** Use she/her in the third trade outcome, or revise that linked opening and both outcomes consistently if a different student is intended.

## offer-hints-2026-11-15

**Accepted** · 7 cards · 1 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/offer-hints-2026-11-15.critic.json)

Accepted with one small cost-clarity edit. The five shop leads and two gift reminders point to real, distinct offers; their acquisition conditions and the named speakers’ voices match the associated content.

### [hint_ashwood_bite](/Users/accessair/Desktop/Workspaces/lifesim/content/events/offer_hints.grim:71) — cost clarity

Finding salve costs study -tiny. The outcome shows an hour spent treating Mir, but does not name the reading, revision or class work that hour displaced, as the authoring rule for an academic cost requires. The social-versus-information trade already works; this is a small clarity edit.

**Fix:** Mention the player’s postponed revision or reading in the salve outcome, or remove the academic deduction if no study was actually interrupted.

## headmistress-dictation-2026-11-15

**Accepted** · 1 cards · 0 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/headmistress-dictation-2026-11-15.critic.json)

Accepted. The dictated letter gives the headmistress a specific difficult decision and the player a modest intervention, with her voice, the postponed reading and the emotional burden present on the page.

## grounds-additions-2026-11-15

**Accepted** · 2 cards · 0 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/grounds-additions-2026-11-15.critic.json)

Accepted. A broom’s retirement and a one-time thank-you from the barge crew are distinct small social scenes, with appropriate public payoffs and noncompetitive alternatives.

## pushers-2026-11-15

**Revise** · 19 cards · 4 findings · [JSON verdict](/Users/accessair/Desktop/Workspaces/lifesim/build/batches/pushers-2026-11-15.critic.json)

The rival specializations, debt contacts and fox visits have distinct roles and fit their cast. Four findings concern a short full-payment refund, a stale queued friend after capture, a fixed demonstration check claiming to outperform Lyra, and two costs without the corresponding loss on the page.

### [grisk_kind_month](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pushers.grim:264) — refund continuity

The offer says this month Grisk will take nothing and returns the unopened payment envelope. The debt tick takes 12 crowns, but gold +small and +tiny return 8 + 3 = 11. The fixture pays from 50 to 38, accepts the month off and finishes at 49. This is a mismatch against the full-refund promise, not a proposal to retune the loan.

**Fix:** Use a tier combination or named preset that refunds the actual 12-crown payment, or explicitly state a retained charge and make the offer’s wording honest about it.

### [grisk_regards_friend](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pushers.grim:348) — queued cast continuity

Fresh casting excludes a captured friend, but an already bound monthly card still checks only peer status and relationship. If Ilse is captured after that binding and before this card plays, the ordinary queued card survives and says the player tells her that evening, followed by her spoken reply. The fixture reproduces this transition without debug force; no natural frequency is claimed.

**Fix:** Add an availability predicate such as around(friend) to the friend role so its queued cast recheck rejects a newly absent person, or provide a deliberately remote alternative with appropriate wording. Preserve the engine’s general policy of keeping queued story continuations.

### [lyra_rival_signed_up](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pushers.grim:166) — check pitch

The choice is staged directly after the pyromancy prodigy and a win says the player is better than her, or matches her flame for flame. Yet it checks only a fixed apprentice+ spell difficulty, independent of Lyra’s ability. The stated opposing comparison is stronger than merely completing an assigned apprentice demonstration.

**Fix:** If this is a contest with Lyra, resolve the comparative performance against her relevant stat. If it is the ordinary assigned demonstration, keep that check and rewrite its success to mean performing the assignment well, without asserting an untested win over her.

### [ember_old_coin](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pushers.grim:457) — unshown costs

Selling the coin deducts mood even though its outcome only describes authentication, a good price and the pawnbroker recording the fox explanation; no loss, regret or embarrassment is shown. Searching for Ember at dawn separately deducts study, but its return scene never says a lesson, reading or other academic work was missed.

**Fix:** Show the corresponding emotional cost in the coin sale or remove it; different gains already make selling and keeping trade. In the search outcome name the reading or lecture the search displaced, or remove that academic deduction.

**Also affects:** [ember_out_till_dawn](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pushers.grim:422).

