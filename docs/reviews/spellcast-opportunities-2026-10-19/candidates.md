# Event-by-event casting proposals

67 shortlisted event proposals: 55 curriculum/safety, 10 peer/club/job, 2 hidden-course. 5 are formalizations of existing practice; 12 need a named design decision. Counts are proposals, not implemented or tested edits.

Each event has one primary spell. Any later choice of an alternative must use that same single up[] slot. Exact source text and current gates/choices are preserved in [candidates.json](candidates.json). Read [the main report](README.md) for global constraints, forbidden consequences, and excluded matches. All Mana charges below are automatic; other effects and costs require authored prose/effects.

## P1 · Curriculum and Ward

### align_cold_candles — Flame

[`align_cold_candles`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/alignment.grim:14) · **Outline candidate** · content/events/alignment.grim · repeat 12 months

- **Scene:** Candles bend away from a Hollow-aligned student; the present caring route relights one by hand.
- **Cast and fit:** Offer Flame to relight one candle deliberately, then let the rest keep leaning.
- **Trade:** Spend level-appropriate Mana for one controlled light; the hand-relighting option remains free and slower.
- **Guardrail:** Keep the effect to one candle; do not make Flame alter the alignment, cause, or all candles.

### fox_injured — Mend

[`fox_injured`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/chains_minor.grim:345) · **Outline candidate** · content/events/chains_minor.grim · once per game or cast role

- **Scene:** A fox is caught in a rusted snare; helping frees it and bandages its paw.
- **Cast and fit:** Free the fox, then Mend its injured paw instead of applying a bandage.
- **Trade:** Mana buys actual healing practice and immediate comfort for the fox; preserve the rescue’s bodily risk and modest moral reward.
- **Guardrail:** Keep fox_met and queue fox_returns in 2 on the helping path. Do not remove a bite that occurs while freeing it, cure an unrelated injury state, or command the animal’s loyalty.

### pyro_candle — Flame

[`pyro_candle`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/classes.grim:9) · **Existing-practice formalization** · content/events/classes.grim · once per game or cast role

- **Scene:** Thorne asks students to light a distant candle; an earlier attempt burned a sleeve.
- **Cast and fit:** Burn a measured Flame at the far candle as a deliberate known-spell drill.
- **Trade:** Spend Mana for a controlled, modest result; retain cautious improvisation and the ambitious risky demonstration.
- **Guardrail:** This is an existing magical exercise, not a new scene. Decide whether a distinct third route is worthwhile; avoid repeating evo_first_spark without a different teaching purpose.

### heal_first_patient — Mend

[`heal_first_patient`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/classes.grim:607) · **Choose level / setup** · content/events/classes.grim · once per game or cast role

- **Scene:** A first-year arrives with a badly bent wrist while Amaranth is busy.
- **Cast and fit:** Mend the wrongly bent wrist with a properly pitched clinical check.
- **Trade:** Spend Mana for a specific learned treatment, while fetching Amaranth remains the sound free alternative and failure still brings her intervention.
- **Guardrail:** Use the curriculum’s bone-work example to choose level and supervision. Do not auto-pass a serious fracture or grant the full reputation payoff merely for knowing Mend.

### verdant_cold_snap — Flame

[`verdant_cold_snap`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/club_spell_chains.grim:321) · **Outline candidate** · content/events/club_spell_chains.grim · repeat 2 months

- **Scene:** A young seedling needs warmth and company through an overnight frost.
- **Cast and fit:** Burn a small, steady warming Flame beside the lantern while staying with the seedling.
- **Trade:** Mana can replace part of the bodily strain, but the player still spends the night caring for it; the preparation flag is earned by that care.
- **Guardrail:** Prefer this basic application to Heartwood. Shelter is not heat. One brief ignition does not warm a greenhouse all night; preserve an overnight cost and the existing bramble_fed requirement.

### sky_crash — Mend

[`sky_crash`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/clubs.grim:206) · **Outline candidate** · content/events/clubs.grim · once per game or cast role

- **Scene:** After a broom crash the player has an injured ankle and must choose whether to keep going.
- **Cast and fit:** Mend the newly injured ankle as a bounded treatment, with a suitable check or level requirement.
- **Trade:** Mend can close a cut or set a small crack, while not erasing broader harm, with mana cost against help/rest.
- **Guardrail:** An odd-shaped ankle is a serious physical injury, not automatic permission to fly again. Preserve help/rest and do not erase unrelated persistent injuries.

### grisk_collectors — Shadowstep

[`grisk_collectors`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/crisis.grim:148) · **Outline candidate** · content/events/crisis.grim · once per game or cast role

- **Scene:** Debt collectors block the dormitory door; the existing escape delays collection without forgiving the loan.
- **Cast and fit:** Step between nearby shadows past the doorway, then escape the immediate collection attempt.
- **Trade:** Pay Mana for a local escape rather than paying the collectors; keep the debt, missed-payment bookkeeping, and prospect of their return.
- **Guardrail:** Match the existing escape state rather than clearing in_debt or debt_paid. No long rooftop teleport, arbitrary wall crossing, or cancelled loan.

### life_library_cat — Ward

[`life_library_cat`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/expansion_life.grim:193) · **Outline candidate** · content/events/expansion_life.grim · once per game or cast role

- **Scene:** Footnote sleeps on the only needed book; moving the cat can earn a scratch.
- **Cast and fit:** Ward against one scratch while making the existing attempt to move Footnote.
- **Trade:** Pay Mana to mitigate one injury while still risking failure to obtain the book; moving the cat normally and paying for a sardine stay distinct.
- **Guardrail:** Do not bypass the move-cat check or guarantee the book. Ward is one-harm protection.

### life_bell_tower — Shadowstep

[`life_bell_tower`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/expansion_life.grim:346) · **Outline candidate** · content/events/expansion_life.grim · once per game or cast role

- **Scene:** The dare is to ring the midnight bell and get away before the prefects arrive.
- **Cast and fit:** Cross a short, visible shadow gap on the ascent or return.
- **Trade:** Mana buys a shortcut; the loud bell and patrol can still lead to detention.
- **Guardrail:** Shadowstep is short distance; it does not teleport to the top or guarantee stealth.

### life_double_trouble — Glamour

[`life_double_trouble`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/expansion_life.grim:452) · **Rewrite setup** · content/events/expansion_life.grim · once per game or cast role

- **Scene:** An old illusion of the player is making commitments and causing mistaken identity.
- **Cast and fit:** Glamour your own appearance so people can distinguish you from the wandering double.
- **Trade:** Mana buys a temporary way to reduce mistaken identity, rather than dismissing the copy; the double’s outstanding commitments still require handling.
- **Guardrail:** The source does not establish that an illusion follows bait. Do not claim Glamour controls or dispels the existing double. Define this narrower outcome before authoring.

### soc_injured_friend — Mend

[`soc_injured_friend`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/expansion_social.grim:171) · **Outline candidate** · content/events/expansion_social.grim · repeat 10 months

- **Scene:** A friend has twisted an ankle far from the infirmary at dusk.
- **Cast and fit:** Mend the sprain enough to reach care, then take them to the infirmary.
- **Trade:** Mana for reduced pain; still spend time and preserve the infirmary route / relationship payoff.
- **Guardrail:** A sprain is within the established Mend example (sprained wrist); do not make Mend cure Lake Fever or eliminate the need for care.

### inc_broken_wand — Mend

[`inc_broken_wand`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/incidents.grim:33) · **Resolve scope** · content/events/incidents.grim · repeat 1 months

- **Scene:** A wand has snapped on the stairs; expert rebinding competes with a risky string repair.
- **Cast and fit:** Offer Mend for a visible structural join only.
- **Trade:** Mana for a limited repair attempt; preserve uncertainty, cost, and the option of expert repair.
- **Guardrail:** Do not imply restoration of the magical core/function or erase the repair economy; gate to an established Mend skill if needed.

### tavern_broken_glass — Mend

[`tavern_broken_glass`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/jobs.grim:156) · **Outline candidate** · content/events/jobs.grim · repeat 6 months

- **Scene:** Broken tankards cover the tavern floor and a dog is approaching.
- **Cast and fit:** Mend broken tankards before handling the loose shards.
- **Trade:** Pay Mana for material repair and a safer cleanup, while preserving pay and the broom route’s lost time.
- **Guardrail:** Do not heal a cut before it exists or assume one cast clears every shard on the floor. Bound the repair and keep any remaining cleanup/dog handling visible.

### stables_hippogriff — Ward

[`stables_hippogriff`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/jobs.grim:271) · **Outline candidate** · content/events/jobs.grim · once per game or cast role

- **Scene:** A hippogriff guards its feed trough; a failed respectful approach knocks the player down.
- **Cast and fit:** Ward against one blow while making the respectful approach and bow.
- **Trade:** Ward can absorb one sudden blow while retreating/handling it, with mana cost and animal behaviour unresolved.
- **Guardrail:** Keep the gaze/approach challenge. Protection is not a successful introduction, feeding, taming, or immunity to repeated attacks.

### broom_courier_bad_landing — Mend

[`broom_courier_bad_landing`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/jobs.grim:521) · **Outline candidate** · content/events/jobs.grim · repeat 6 months

- **Scene:** A wet courier landing injures the ankle before the round is finished.
- **Cast and fit:** Mend or stabilize the injured ankle before deciding how the remaining deliveries are handled.
- **Trade:** Mend can address a limited sprain/crack while leaving shift completion and flight safety unresolved, trading mana against paid rest/hand-off.
- **Guardrail:** Do not reverse the earlier crash, restore all Health or remove an unrelated injured state. Retain a bodily consequence if full repair is beyond the known spell level.

### life_staircase — Foresight

[`life_staircase`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/life.grim:9) · **Outline candidate** · content/events/life.grim · once per game or cast role

- **Scene:** A moving stair approaches an unfamiliar floor while the player is late for class.
- **Cast and fit:** Cast to glimpse the next few moments and time a jump for the nearest visible landing.
- **Trade:** Mana for a better-timed move; preserve the existing chance of being deposited elsewhere and late.
- **Guardrail:** Only immediate visible timing, not knowledge of the castle route.

### life_midnight_snack — Shadowstep

[`life_midnight_snack`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/life.grim:182) · **Outline candidate** · content/events/life.grim · once per game or cast role

- **Scene:** The kitchens are three floors away, with a prefect’s post on the route.
- **Cast and fit:** Cross one nearby shadowed corridor to bypass the post on the way to the kitchen.
- **Trade:** Mana for a shortcut; detection/detention remains possible, while going hungry remains available.
- **Guardrail:** Strictly short distance, never three floors in one cast.

### life_storm_night — Flame

[`life_storm_night`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/life.grim:340) · **Outline candidate** · content/events/life.grim · once per game or cast role

- **Scene:** The dormitory crystals are out during a storm; the generic lighting attempt can set the sofa alight.
- **Cast and fit:** Offer a controlled fingertip Flame as a small, local light source.
- **Trade:** Mana buys a small, controlled source of light and warmth; the ordinary storytelling route and riskier full-room floating-light attempt remain useful.
- **Guardrail:** The source has no ordinary candle-lighting choice. Use the fingertip flame established by the roster; do not claim it relights the crystals or the whole room.

### maud_chickens — Haste

[`maud_chickens`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/people_others.grim:350) · **Outline candidate** · content/events/people_others.grim · once per game or cast role

- **Scene:** Maud’s chickens have escaped and the speckled ringleader is the immediate target.
- **Cast and fit:** Hasten a short dash to catch the speckled ringleader.
- **Trade:** Spend Mana for speed rather than relying only on the ordinary tackle; keep the chance of being pecked and the actual introduction to Maud.
- **Guardrail:** This often appears before Beastcraft opens. Keep the ordinary route and meet maud on a casting route too; do not change the event gate just to guarantee spell availability.

### job_board_message_run — Haste

[`job_board_message_run`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/castle_halls.grim:706) · **Outline candidate** · content/events/pools/castle_halls.grim · repeat 4 months

- **Scene:** Notes must reach seven towers before the bell, through moving stairs.
- **Cast and fit:** Hasten through the urgent delivery round.
- **Trade:** Saves some of the ordinary leg strain at a fatigue cost; preserve the honest fee and ordinary run.
- **Guardrail:** Do not guarantee the moving staircases cooperate; show the nap/fatigue consequence in flavor.

### observatory_roof_ledge — Ward

[`observatory_roof_ledge`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/castle_towers.grim:58) · **Outline candidate** · content/events/pools/castle_towers.grim · repeat 5 months

- **Scene:** The roof ledge has loose tiles, frost or gusts, and skinned-palm failure outcomes.
- **Cast and fit:** Ward before stepping onto the narrow ledge so the shell can turn aside the next harm if footing slips or a gust catches the climber.
- **Trade:** Modest protection while retaining the climb challenge and ordinary injury risk; normal spell costs apply.
- **Guardrail:** Does not grant balance or guarantee the view; preserve the ordinary routes.

### ledger_office_drying_line — Glamour

[`ledger_office_drying_line`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/castle_towers.grim:257) · **Rewrite setup** · content/events/pools/castle_towers.grim · repeat 5 months

- **Scene:** Reading tomorrow’s gossip proof risks being caught or bringing down the line.
- **Cast and fit:** Glamour your own appearance while taking an unauthorized look at the proofs.
- **Trade:** Mana buys a disguise, not immunity to being caught or to a falling drying line. A dishonest pretext should retain moral and reputation stakes.
- **Guardrail:** Specify how the disguise helps and its limits. Do not make the text vanish, erase evidence, or automatically succeed at the existing deception challenge.

### duelling_dummy_mending — Mend

[`duelling_dummy_mending`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/clubs_jobs.grim:38) · **Outline candidate** · content/events/pools/clubs_jobs.grim · repeat 5 months

- **Scene:** After practice, battered dummies need stitching and available parts reattached.
- **Cast and fit:** Mend torn seams and reattach available pieces of a practice dummy.
- **Trade:** Mana reduces some late stitching, while ordinary repair retains its club work/rank practice and leaving still costs performance.
- **Guardrail:** Do not regrow burned straw or a missing arm from nothing. Show available parts and retain real work for badly damaged dummies.

### broom_courier_morning_crossing — Haste

[`broom_courier_morning_crossing`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/clubs_jobs.grim:735) · **Outline candidate** · content/events/pools/clubs_jobs.grim · repeat 4 months

- **Scene:** A quick lake crossing faces headwind, gulls or fog; the shore route is slower.
- **Cast and fit:** Use Haste for a brief fast passage, paying through exhaustion and keeping the weather risk; preserve the safe shore route. Preserve current choices: Fly straight across / Take the long way round.
- **Trade:** Pay Mana automatically and retain the existing meaningful non-cast route.
- **Guardrail:** Do not guarantee arrival or remove visibility risk.

### broom_courier_broom_scramble — Haste

[`broom_courier_broom_scramble`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/clubs_jobs.grim:763) · **Outline candidate** · content/events/pools/clubs_jobs.grim · repeat 4 months

- **Scene:** Everyone wants the one sound broom; shouldering someone aside has a moral cost.
- **Cast and fit:** Use Haste to reach or mount the sound broom first, trading the spell’s exhaustion for the rough-broom handling route. Preserve current choices: Shoulder in for the good broom / Take the difficult one.
- **Trade:** Pay Mana automatically and retain the existing meaningful non-cast route.
- **Guardrail:** Haste gives speed, not ownership or a permanent repair.

### astro_moving_charts — Foresight

[`astro_moving_charts`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/courses_a.grim:313) · **Outline candidate** · content/events/pools/courses_a.grim · repeat 5 months

- **Scene:** The stars printed on an advanced chart physically drift as it is read.
- **Cast and fit:** Foresee the chart’s next physical movement, then sketch one brief, stable segment.
- **Trade:** Foresight can give a brief next-moment glimpse to compare with the moving ink, not resolve the whole chart. Preserve the manual tracing alternatives and charge mana.
- **Guardrail:** Do not read a season of the future from a short glimpse. Keep interpretation of the chart and its existing academic gates as work.

### alch_bandage_round — Mend

[`alch_bandage_round`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/courses_a.grim:416) · **Outline candidate** · content/events/pools/courses_a.grim · repeat 5 months

- **Scene:** Amaranth supervises infirmary practice on a burn, scraped knee or sprained wrist.
- **Cast and fit:** Mend the selected physical injury under Amaranth’s supervision.
- **Trade:** Mend offers a limited physical-injury treatment under Amaranth’s watch, not a disease cure, with mana cost and the slower bandage route retained.
- **Guardrail:** Choose a level/check that fits the burn, scrape and wrist variants. Keep bandaging/observation useful; no disease cure or automatic final-exam credit.

### beast_manticore_rounds — Ward

[`beast_manticore_rounds`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/courses_b.grim:327) · **Outline candidate** · content/events/pools/courses_b.grim · repeat 4 months

- **Scene:** One student holds the manticore’s twitching tail while another hums.
- **Cast and fit:** Ward against one tail strike while assisting Brask with the check-up.
- **Trade:** Ward can protect the student while holding it, with mana cost and no change to the animal’s behavior or the lullaby option.
- **Guardrail:** Keep the physical tail-handling challenge and the humming alternative; the spell does not pacify the manticore or last through unlimited blows.

### alch_third_floor_still — Mend

[`alch_third_floor_still`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/courses_upper.grim:307) · **Outline candidate** · content/events/pools/courses_upper.grim · repeat 5 months

- **Scene:** A hot copper still cracks and vapour curls toward the next bench.
- **Cast and fit:** Mend the crack directly before vapour spreads, with mana cost and heat exposure
- **Trade:** retain the manual hot repair versus evacuation choice.
- **Guardrail:** Do not make Mend a cure for vapour exposure or broader alchemical damage.

### duel_hall_dummies — Flame

[`duel_hall_dummies`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/grounds.grim:64) · **Outline candidate** · content/events/pools/grounds.grim · repeat 5 months

- **Scene:** Ordinary hex practice spends Mana, while restuffing the dummies is physical work.
- **Cast and fit:** Shape a candle-small, controlled Flame against one dummy as a specific practice drill.
- **Trade:** A named spell action beside the generic hex routine; preserve mana cost and scorch risk.
- **Guardrail:** Keep the effect small and practice-focused; do not replace training with a powerful attack.

### flight_field_pickup_race — Haste

[`flight_field_pickup_race`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/grounds.grim:234) · **Outline candidate** · content/events/pools/grounds.grim · repeat 5 months

- **Scene:** An informal broom race has a short finish and unpredictable gusts.
- **Cast and fit:** Hasten for a short speed burst near the finish.
- **Trade:** Improves the chance of placing well but carries Haste's fatigue; preserve collision/injury stakes.
- **Guardrail:** Foresight could be a mutually exclusive alternative to read the next gust, but do not offer both spells on this card.

### boathouse_green_boat — Mend

[`boathouse_green_boat`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/grounds.grim:381) · **Outline candidate** · content/events/pools/grounds.grim · repeat 5 months

- **Scene:** The old green boat repeatedly leaks despite tar patches.
- **Cast and fit:** Mend one visible crack/seam in the hull instead of making another temporary tar patch.
- **Trade:** Saves the manual effort but consumes spell costs; nonmagical patching remains a valid repair route.
- **Guardrail:** Mend covers cracks, but should fix only the visible leak; don't make the old boat permanently maintenance-free.

### secret_garden_silver_bees — Ward

[`secret_garden_silver_bees`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/grounds.grim:603) · **Outline candidate** · content/events/pools/grounds.grim · repeat 5 months

- **Scene:** Taking a little honeycomb risks one silver sting; following a bee is the other route.
- **Cast and fit:** Ward before taking only a thumb-width of comb, turning aside one sting.
- **Trade:** A single protective margin for the harvest, not a way to secure more honey for free.
- **Guardrail:** Preserve the bees' objection and non-harvesting route; Ward does not command them.

### courier_loft_dispatch_bell — Haste

[`courier_loft_dispatch_bell`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/grounds.grim:671) · **Outline candidate** · content/events/pools/grounds.grim · repeat 5 months

- **Scene:** A dispatch rush sends the visitor running a parcel to the lecture tower.
- **Cast and fit:** Hasten the campus crossing and deliver the parcel in time.
- **Trade:** Spell fatigue replaces some physical exertion, not a free source of gold.
- **Guardrail:** Keep the ordinary run's health cost/tip and the polite refusal choice.

### intern_alchemists_safety — Mend

[`intern_alchemists_safety`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/internships.grim:127) · **Outline candidate** · content/events/pools/internships.grim · once per game or cast role

- **Scene:** The neglected seventh vat is cracked and leaking dangerous steam.
- **Cast and fit:** Use Mend on the actual crack as a named route beside the sealant-and-brew check
- **Trade:** make the cast consume Mana and keep the failure hazard and whistleblower route.
- **Guardrail:** Mend closes the vessel crack only; it does not neutralize steam or erase the foreman/worker consequences.

### favour_amaranth_shift — Mend

[`favour_amaranth_shift`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/money.grim:98) · **Choose level / setup** · content/events/pools/money.grim · once per game or cast role

- **Scene:** The paid night shift includes a fever patient, a broken wrist and someone needing company.
- **Cast and fit:** Mend the broken wrist under Amaranth’s supervision as part of the night shift.
- **Trade:** Mana buys supervised clinical practice; keep the shift’s pay, sleeplessness, other patients, and the daytime bandaging alternative.
- **Guardrail:** The wrist appears in the current shift outcome, so introduce this patient before the new choice. Choose an appropriate Mend level/check for bone work. Do not cure the fever patient or finish the whole shift instantly.

### newt_high_table — Foresight

[`newt_high_table`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/night.grim:55) · **Redesign menu** · content/events/pools/night.grim · once per game or cast role

- **Scene:** The four-option high-table menu includes a knife-between-fingers wager called bone-dice.
- **Cast and fit:** Foresee the next knife movement during the bone-dice game before attempting it.
- **Trade:** Mana could mitigate one immediate hand injury, with the wager, moral cost, and table consequences preserved.
- **Guardrail:** The source is a four-option menu; up[] is illegal here. The bone-dice branch is a knife-between-fingers game, not a normal dice-outcome prediction. Any separate casting card is new structure and must return to the right wager outcome.

### gig_grounds_storm_damage — Ward

[`gig_grounds_storm_damage`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/plans_gigs.grim:91) · **Outline candidate** · content/events/pools/plans_gigs.grim · repeat 4 months

- **Scene:** A cracked branch hangs over a path that must be cleared after a storm.
- **Cast and fit:** Raise a Ward before climbing to limit the immediate impact if the limb shifts, spending Mana and retaining the danger and work.
- **Trade:** Keep the rope-off alternative and do not make Ward remove the limb or guarantee a safe climb.
- **Guardrail:** Ward protects the climber narrowly; it does not secure the branch or protect future walkers.

### gig_grounds_hive_check — Ward

[`gig_grounds_hive_check`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/plans_gigs.grim:115) · **Outline candidate** · content/events/pools/plans_gigs.grim · repeat 4 months

- **Scene:** Maud asks for a hive inspection; even the polite method earns one sting.
- **Cast and fit:** Raise a close Ward for the inspection, paying Mana and risking that bees resist the barrier; preserve the unshielded manners route. Preserve current choices: Introduce yourself properly / Get it done quickly.
- **Trade:** Pay Mana automatically and retain the existing meaningful non-cast route.
- **Guardrail:** Ward protects the student narrowly; it cannot control bees or complete the hive check.

### gig_newt_fire — Flame

[`gig_newt_fire`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/plans_gigs.grim:370) · **Outline candidate** · content/events/pools/plans_gigs.grim · repeat 3 months

- **Scene:** The landlady’s long-burning hearth is low, with damp fuel and a troublesome draught.
- **Cast and fit:** Use a controlled Flame to revive the banked coals, with Mana and a risk of flaring the chimney; preserve sitting up and ordinary banking. Preserve current choices: Sit up with it all night / Bank it and trust it.
- **Trade:** Pay Mana automatically and retain the existing meaningful non-cast route.
- **Guardrail:** Keep the hearth’s long tradition and consequences intact; do not make the spell automatically safe.

### gig_post_storm_run — Haste

[`gig_post_storm_run`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/plans_gigs.grim:461) · **Outline candidate** · content/events/pools/plans_gigs.grim · repeat 5 months

- **Scene:** A stormy ridge route promises quick delivery; the valley road is slower and safe.
- **Cast and fit:** Use Haste for one burst over the ridge, gaining time but carrying the spell’s exhaustion cost and the weather risk
- **Trade:** retain the valley-road alternative.
- **Guardrail:** Do not guarantee early delivery or cancel storm damage.

### break_home_mending_chair — Mend

[`break_home_mending_chair`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/plans_more.grim:155) · **Rewrite setup** · content/events/pools/plans_more.grim · repeat 5 months

- **Scene:** Broken household things accumulate on a chair, with season and showing-specific repairs.
- **Cast and fit:** Use Mend as a named, controlled repair route with the spell’s Mana cost
- **Trade:** the existing hand repair remains slower and material-based.
- **Guardrail:** The chair holds household items; the chair itself is not broken. A stuck hot-weather window, a missing doll eye, and a thirteen-striking clock are not all straightforward cracks. Give every showing an actually damaged object and available material; do not promise universal repair.

### intern_royal_library_mending — Mend

[`intern_royal_library_mending`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/plans_thesis.grim:543) · **Outline candidate** · content/events/pools/plans_thesis.grim · repeat 4 months

- **Scene:** A fragile manuscript must be restored one surviving flake at a time.
- **Cast and fit:** Offer a known Mend cast to join the fragile paper at a controlled pace, paying Mana while preserving the careful tweezer route and risk of losing a flake.
- **Trade:** Offer a known Mend cast to join the fragile paper at a controlled pace, paying Mana while preserving the careful tweezer route and risk of losing a flake.
- **Guardrail:** Do not restore missing words, undo the crossed-out name, or replace conservation skill.

### intern_conclave_test_chamber — Ward

[`intern_conclave_test_chamber`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/plans_thesis.grim:573) · **Outline candidate** · content/events/pools/plans_thesis.grim · repeat 4 months

- **Scene:** An experimental spell is tested in a scorched chamber while researchers watch behind glass.
- **Cast and fit:** Raise a Ward before the trial to reduce immediate exposure, spending Mana while leaving the experimental spell’s outcome uncertain
- **Trade:** preserve the behind-glass observation option.
- **Guardrail:** Ward turns aside one damaging discharge. Keep the actual test challenge and any failed performance or odd non-injury outcome; it does not identify the spell or automatically fix enchanted robes.

### intern_thornwick_rivalry — Glamour

[`intern_thornwick_rivalry`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/plans_thesis.grim:833) · **Outline candidate** · content/events/pools/plans_thesis.grim · repeat 5 months

- **Scene:** Thornwick interns trade school-rivalry barbs and occasionally imitate the player.
- **Cast and fit:** Use mild Glamour to land one barb with extra poise, paying Mana
- **Trade:** leave wit and the option to disengage intact.
- **Guardrail:** Charm only affects the player’s impression; it cannot compel agreement or rewrite the exchange.

### renown_ice_rescue — Flame

[`renown_ice_rescue`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/renown.grim:112) · **Rewrite outcome** · content/events/pools/renown.grim · once per game or cast role

- **Scene:** A first-year is through the lake ice, with onlookers and a ladder rescue available.
- **Cast and fit:** Call for the prefects and ladders, then Burn a warming flame for the rescued first-year on shore.
- **Trade:** Spend Mana to provide practical aftercare, forgoing the dangerous solo rescue and its large public reward; retain the ordinary call-for-help route.
- **Guardrail:** Replace the scout’s Ward suggestion: Ward does not prevent immersion or hypothermia. The spell does not rescue someone through the ice, create a bridge, or ensure the solo rescue check succeeds.

### lesson_mend — Mend

[`lesson_mend`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/spell_lessons.grim:86) · **Existing-practice formalization** · content/events/pools/spell_lessons.grim · once per game or cast role

- **Scene:** An already-known Mend lesson practices physical repairs and discusses treating bones.
- **Cast and fit:** Formalize the current cup-mending practice as a named Mend cast with its Mana cost, rather than inventing a new repair effect.
- **Trade:** Pay Mana automatically and retain the existing meaningful non-cast route.
- **Guardrail:** This already describes casting a known spell. Rework the existing practice/observation structure rather than adding an identical third choice; avoid copying a manual Mana debit into up[] as well.

### lesson_ward — Ward

[`lesson_ward`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/spell_lessons.grim:232) · **Existing-practice formalization** · content/events/pools/spell_lessons.grim · once per game or cast role

- **Scene:** An already-known Ward lesson uses thrown chalk, with an observational alternative.
- **Cast and fit:** Formalize the current ward-holding action as a named Ward cast with its Mana cost, not a new defensive shortcut.
- **Trade:** Pay Mana automatically and retain the existing meaningful non-cast route.
- **Guardrail:** This already describes casting a known spell. Rework the existing practice/observation structure rather than adding an identical third choice; avoid copying a manual Mana debit into up[] as well.

### injured_on_the_stairs — Mend

[`injured_on_the_stairs`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/statuses.grim:178) · **Outline candidate** · content/events/pools/statuses.grim · repeat 2 months

- **Scene:** An already bandaged ankle makes a moving-stair gap difficult before a lecture.
- **Cast and fit:** Mend the sprained ankle before attempting the moving-stair route, then take the gap carefully.
- **Trade:** Could reduce injury pressure and make attendance possible at spell cost; preserve the feat risk and the slower recovery route's study cost.
- **Guardrail:** Do not guarantee a safe landing or erase the deadline; keep to the established sprain-healing scope.

### courier_chief_urgent_crossing — Foresight

[`courier_chief_urgent_crossing`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/upper_ranks.grim:350) · **Localize benefit** · content/events/pools/upper_ranks.grim · repeat 3 months

- **Scene:** A chief courier must cross a mountain pass overnight in threatening weather.
- **Cast and fit:** Foresee the next gust at one immediate dangerous gap in the pass, then attempt the crossing.
- **Trade:** Mana helps with one maneuver while the expert flight challenge, fatigue, and route consequences remain.
- **Guardrail:** Localize the benefit in the prose. A few moments of foresight do not provide a safe forecast for an overnight mountain flight.

### village_last_barge — Haste

[`village_last_barge`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/village_home.grim:56) · **Outline candidate** · content/events/pools/village_home.grim · repeat 5 months

- **Scene:** The last barge is leaving as the bell rings; staying risks a fare or a night outdoors.
- **Cast and fit:** Hasten the final dash to catch the departing barge.
- **Trade:** Avoids the ordinary exhausted arrival but incurs the spell's long-nap fatigue.
- **Guardrail:** Keep the ordinary run and stay/overnight-fare outcomes; no free route.

### evo_first_spark — Flame

[`evo_first_spark`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/slice_2b.grim:12) · **Existing-practice formalization** · content/events/slice_2b.grim · once per game or cast role

- **Scene:** Evocation-I students choose a tiny warming effect or an overbold flame.
- **Cast and fit:** Burn a small, controlled Flame rather than only warming the palm or making an excessive blaze.
- **Trade:** Spend Mana for a practiced result instead of the daring attempt’s larger possible training reward.
- **Guardrail:** This level-I practice may be adjacent to the actual course-start lesson. Keep learning in evo_first_flame and do not require knowledge before teaching it.

### evo_lattice — Flame

[`evo_lattice`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/slice_2b.grim:99) · **Existing-practice formalization** · content/events/slice_2b.grim · once per game or cast role

- **Scene:** A fire-weaving practical rewards precision or an ambitious, risky lattice.
- **Cast and fit:** Burn one compact lattice as a known-spell precision exercise.
- **Trade:** Mana buys deliberate practice rather than the larger ambitious weave; keep a challenge if precision is the obstacle.
- **Guardrail:** Do not let Flame I automatically perform advanced lattice work. This is optional formalization of an existing spell practical.

### home_family_supper — Flame

[`home_family_supper`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/slice_2b.grim:610) · **Outline candidate** · content/events/slice_2b.grim · once per game or cast role

- **Scene:** At home, the family asks to see a spell; the current demonstration lights every candle in the room.
- **Cast and fit:** Burn a small, controlled flame to light a candle in the family demonstration.
- **Trade:** Pay Mana for focused Flame practice with a different skill payoff, rather than the ordinary display’s larger shared amusement. Listening retains its comfort payoff.
- **Guardrail:** Do not charge Mana for the same or worse payoff as the current free candle demonstration. Give the controlled practice its own modest Arcana-versus-mood trade; no forced affection or rare spell is needed.

### home_market_day — Mend

[`home_market_day`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/slice_2b.grim:646) · **Outline candidate** · content/events/slice_2b.grim · once per game or cast role

- **Scene:** A village stallholder asks for a paid magical fix to a leaky roof; the other route is to buy sweets.
- **Cast and fit:** Use Mend on the leaking roof section as the precise repair route.
- **Trade:** Spend level-appropriate Mana to repair the roof and earn the agreed payment; the sweets route still spends crowns for mood.
- **Guardrail:** Limit to the roof/object and only one repairable leak; do not imply a large building or general restoration.


## P2 · Relationship, club and job spells

### courier_fix_broom — Contraption

[`courier_fix_broom`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/club_spell_chains.grim:861) · **Redesign chain** · content/events/club_spell_chains.grim · repeat 2 months

- **Scene:** Your loft broom pulls left, always has. With the jar's wind behind it, it would pull you into the lake. The broom-maker in the village can true it, for a price.
- **Cast and fit:** A broom that pulls left needs repair
- **Trade:** a Contraption could build a temporary steering aid, not permanently repair the broom, trading mana and failure risk against paying a maker.
- **Guardrail:** A temporary Contraption steering aid does not automatically satisfy tailwind_broom. Do not award that flag, skip payment, or open the final without a lasting, safe truing solution supported by the scene.

### life_summer_heat — Hoarfrost

[`life_summer_heat`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/life.grim:797) · **Outline candidate** · content/events/life.grim · once per game or cast role

- **Scene:** The dormitory is an oven; a generic cooling charm competes with sleeping on the roof.
- **Cast and fit:** Cool the room briefly with Hoarfrost.
- **Trade:** Mana for temporary comfort, preserving the roof-sleep option and a distinct failed-cast mishap.
- **Guardrail:** Peer capstone, so P2 after course spells. Do not imply permanent climate control.

### job_board_copying — Quickquill

[`job_board_copying`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/castle_halls.grim:685) · **Outline candidate** · content/events/pools/castle_halls.grim · repeat 3 months

- **Scene:** A sick student pays for fair copies of lecture notes; careful handwriting takes two evenings.
- **Cast and fit:** Read the notes aloud and let Quickquill Scribble the fair copy, then proofread it.
- **Trade:** Spend Mana to spare handwriting strain, forgoing some of the slow copying route’s learning or accepting time spent checking the work.
- **Guardrail:** It records spoken words; it does not silently read or compose notes. Do not award full pay, saved time, and the slow-study Lore gain together without a corresponding trade.

### library_assistant_reference_desk — Index

[`library_assistant_reference_desk`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/clubs_jobs.grim:460) · **Rewrite setup** · content/events/pools/clubs_jobs.grim · repeat 5 months

- **Scene:** Readers ask for vaguely described or possibly nonexistent books, and the clerk must research them.
- **Cast and fit:** Recall a relevant page in a catalogue the clerk is holding, then use it to continue the book search.
- **Trade:** Mana reduces some catalogue work, while the research challenge and the reader’s vague description still matter. The guessed-direction route remains quick and less helpful.
- **Guardrail:** Place the catalogue in hand before the choice. Index does not locate an unknown book remotely, determine an unnamed title, or make the nonexistent bee book exist. Keep synthesis and physical retrieval as work.

### date_meet_friends — Rapport

[`date_meet_friends`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/dating.grim:76) · **Outline candidate** · content/events/pools/dating.grim · once per game or cast role

- **Scene:** A partner and friend are painfully polite to each other at supper.
- **Cast and fit:** Use Rapport's well-timed joke to break the tension and get them laughing together.
- **Trade:** A social opening at spell cost; preserve the ordinary negotiation check and possible awkward silence.
- **Guardrail:** Do not imply compulsion or guaranteed friendship.

### letter_registrar_forms — Quickquill

[`letter_registrar_forms`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/letters.grim:227) · **Outline candidate** · content/events/pools/letters.grim · once per game or cast role

- **Scene:** Three identical sets of registrar forms require an afternoon of copying.
- **Cast and fit:** Dictate identical form answers for Quickquill to copy across the three copies.
- **Trade:** Reduces repetitive copying but the player still chooses answers and handles the cramped box.
- **Guardrail:** Alternative to Quickquill in letter_nessa_deadline, not an additional proposal to add both to one card.

### letter_nessa_deadline — Quickquill

[`letter_nessa_deadline`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/letters.grim:496) · **Outline candidate** · content/events/pools/letters.grim · once per game or cast role

- **Scene:** Nessa urgently needs a short holiday article; writing it competes with a personal reply.
- **Cast and fit:** Dictate a draft for Quickquill to transcribe, then revise it before sending.
- **Trade:** Saves copying time but not the work of thinking/editing; preserve effort and the editor's cuts.
- **Guardrail:** Quickquill transcribes spoken words; it cannot compose the essay or guarantee a winning entry.

### gig_newt_brawl — Rapport

[`gig_newt_brawl`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/plans_gigs.grim:343) · **Outline candidate** · content/events/pools/plans_gigs.grim · repeat 4 months

- **Scene:** Two crews, or a farmer and fisherman, are about to fight over a song.
- **Cast and fit:** Use Rapport to turn the room together before a punch lands, paying Mana and risking the spell failing to catch
- **Trade:** preserve stepping between them and buying a round.
- **Guardrail:** Do not make it coercive or erase the cost of a free round.

### intern_conclave_minutes — Quickquill

[`intern_conclave_minutes`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/plans_thesis.grim:602) · **Outline candidate** · content/events/pools/plans_thesis.grim · repeat 5 months

- **Scene:** Nine committee members argue while the intern records the minutes.
- **Cast and fit:** Scribble the audible committee discussion word for word with Quickquill, while checking names and votes.
- **Trade:** Pay Mana to reduce handwriting strain, preserving the choice between contributing an opinion and concentrating on the minutes.
- **Guardrail:** The quill cannot untangle inaudible simultaneous speech or invent the vote. Ask speakers to repeat themselves when needed; proofread its opinions and factual transcription.

### lumen_ledger_editor_scoop — Candour

[`lumen_ledger_editor_scoop`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/pools/upper_ranks.grim:63) · **Rewrite setup** · content/events/pools/upper_ranks.grim · repeat 3 months

- **Scene:** A reporter brings a dangerous story with a dawn deadline; one wrong fact can cost the paper dearly.
- **Cast and fit:** Confess: ask the reporter which facts they personally verified and get an honest account of that limited knowledge.
- **Trade:** Spend Mana and time on a candid interview before deciding whether to publish. Keep the research challenge, deadline, and consequences of an inaccurate story.
- **Guardrail:** Make the reporter present in every showing. Do not compel a source to reveal their identity, establish objective truth from honest belief, or automatically make the governor resign. This is a setup/outcome proposal, not an evidence-verification spell.


## P3 · Sourced hidden-course spells

### tobias_scarecrow — Animate

[`tobias_scarecrow`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/expansion_people.grim:82) · **Outline candidate** · content/events/expansion_people.grim · once per game or cast role

- **Scene:** Tobias wants a handmade scarecrow to do one thing: wave at the crows.
- **Cast and fit:** Animate the completed scarecrow so it repeats one simple waving motion to deter crows.
- **Trade:** Pays Animate’s Mana; gets a predictable working scarecrow, while the cat is free and immediately effective.
- **Guardrail:** Animate is in a hidden course, so this is conditional on that course becoming learnable. One task only; do not add extra sentience or claim it learns/responds beyond waving.

### lib_biting_book — Seal

[`lib_biting_book`](/Users/accessair/Desktop/Workspaces/lifesim/content/events/jobs.grim:8) · **Outline candidate** · content/events/jobs.grim · once per game or cast role

- **Scene:** A book already clamps a finger; muzzling it or reading it has further consequences.
- **Cast and fit:** Free the trapped finger, then Seal the book shut for reshelving.
- **Trade:** Pay Mana to prevent further bites and complete the job, giving up the belt route’s Vigor or the reading route’s Lore.
- **Guardrail:** The initial bite has already happened; do not undo it. Closing the book must not trap the finger. Seal contains the book; it does not make the text safe or teach its contents.


## Rejected after checking source or spell scope

- `seventh_tower_stair_count`: A next-footfall glimpse is possible flavor, but adds little to the choice between counting the uncanny stair and trusting it. No substantial new casting trade established.
- `lakeshore_cold_swim`: The source danger is exposure to winter water. Ward does not provide warmth, air, flotation, or protection from sustained cold; no discrete impact is established.
- `egg_hatches`: Ward can stop one burn but does not create a distinct third resolution between handing over the firedrake and hiding it. The safe handover already costs no injury.
- `pyro_dragon_breath`: Controlling a sample of genuine dragonfire is not established as an application of ordinary Flame. Keep the specific challenge or propose Ward as a separately designed protective approach.
- `intern_alchemists_no_flame`: An explicit naked-Flame violation could be written, but a high-risk tea shortcut is a weak first-batch addition beside the existing flameless experiment; do not add punishment merely to create another spell button.
