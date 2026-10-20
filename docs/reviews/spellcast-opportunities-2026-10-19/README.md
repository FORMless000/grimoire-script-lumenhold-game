# Spellcasting opportunities: focused half-critic report

Review date: 19 October 2026. This is a proposal report for choosing later content changes. No event, spell, localization, balance rule, or engine behavior is changed by this review. It is not an acceptance verdict for an authored batch.

## Recommendation

The shortlist contains **67 event proposals: 55 curriculum/Ward, ten relationship/club/job, and two hidden-course uses**. Five are formalizations of existing practice; 12 require a specific setup, scope, level, menu, or chain decision. The other 50 are candidates for outlining, not finished or approved edits.

Start with useful, ordinary applications of the six curriculum spells and Ward: mending a leaking boat, lighting a dark common room, catching the last barge, treating an ankle, or protecting a climber from one impact. These make learned magic useful beyond its classroom without making every conversation a magical shortcut.

Then add a smaller set of relationship, club, and job applications, especially Quickquill on actual transcription, Rapport in a tense room, and Hoarfrost in summer heat. Consider the three hidden-course spells after those. Keep the five hidden-pool and six forbidden-pool spells conditional on a separate acquisition decision. None currently has a campaign learning source.

The detailed event proposals, including the existing scene, suggested action, trade, and constraints, are in [candidates.md](candidates.md). The [spell roster](spell-roster.md) covers every current player spell and lists all existing casting options. The [file coverage table](coverage.md) and [screening index](screening.tsv) account for every event, including events with no recommended addition. [inventory.json](inventory.json) records the source snapshot and structural facts; [candidates.json](candidates.json) is the machine-readable proposal list.

## Suggested selection order

This is a compact starting set drawn from the full shortlist. Select a manageable subset; the list does not imply all should be added together. The rationale is reach across places and kinds of play, rather than a measured frequency ranking.

| Spell | Start with | Why these events |
|---|---|---|
| Flame | `life_storm_night`, `home_family_supper`, `verdant_cold_snap` | Local light, a family demonstration, and sustained warmth give the basic spell three useful roles. The seedling still needs an overnight commitment. |
| Foresight | `life_staircase`, `astro_moving_charts` | Both need information about the next movement, rather than knowledge of distant events. |
| Mend | `boathouse_green_boat`, `home_market_day`, `soc_injured_friend`, `alch_third_floor_still`, `tavern_broken_glass` | Concrete damage makes the reason for casting immediately readable. Keep injury complexity and the hot-still hazard meaningful. |
| Haste | `village_last_barge`, `courier_loft_dispatch_bell`, `flight_field_pickup_race` | Short deadlines and a short race burst distinguish speed from strength or navigation. |
| Shadowstep | `life_midnight_snack`, `life_bell_tower`, later `grisk_collectors` | Local movement past an obstacle, with detection or future collection still possible. Check the debt bookkeeping carefully. |
| Ward | `observatory_roof_ledge`, `stables_hippogriff`, `beast_manticore_rounds`, `intern_conclave_test_chamber` | Each has a real immediate injury to mitigate while the underlying task can still fail. |
| Quickquill, after those | `job_board_copying`, `letter_registrar_forms`, `intern_conclave_minutes` | These are actual transcription tasks; the player still supplies and checks the words. |
| Rapport and Hoarfrost, after those | `date_meet_friends`, `gig_newt_brawl`, `life_summer_heat` | Specific social tension or temperature makes these specializations useful without displacing the basic spell pass. |

Index at `library_assistant_reference_desk` and Candour at `lumen_ledger_editor_scoop` are later **setup rewrites**. Put the catalogue in the clerk's hand, or make the reporter available for a limited factual interview. Neither spell should replace the underlying research challenge or guarantee that a book exists or a story is true.

## Scope and evidence

The compiled working tree contains **1,093 events in 56 event files**, **35 campaign spells**, and **50 existing `up[]` casting options**. There are 1,039 swipe cards, 33 menus, and 21 single-choice story cards. These are observed counts from the current source, rather than the older counts in `PROGRESS.md`.

Three lower-cost scouts surveyed nonoverlapping batches of 348 everyday/place events, 368 academic/work events, and 377 character/calendar/story events. Their initial candidate retrieval was followed by bounded source reads, corrections, and consolidation. The parent review independently checked the current spell roster, acquisition, parser and casting behavior, and the retained proposals' source evidence. Some tempting initial matches were rejected after checking the actual scene; they are not carried forward as recommendations.

This is a focused opportunity review, not a fresh judgment of every card's voice, balance, canon, or literary quality. A screened-out event is not a claim that it can never support magic. It means this pass found no sufficiently useful addition without duplicating an existing action, changing the premise, or weakening the central choice. Candidate payoffs and costs below are design proposals, not measured results or completed `.grim` edits.

The authoritative inputs were:

- [Critic workflow](../../../skills/critic/SKILL.md) and [event-writing workflow](../../../skills/write-academy-events/SKILL.md).
- [Style](../../authoring/style.md), [checklist](../../authoring/checklist.md), [costs](../../authoring/costs.md), [checks](../../authoring/checks.md), [classes](../../authoring/classes.md), and [presets](../../authoring/presets.md).
- [Current worldbook spells](../../../content/world/spells.grim), [tracks](../../../content/world/tracks.grim), and relevant event/cast/place context.
- [Design §9.1](../../design-v0.3.md#91-spells), [spell redesign revision 2](../../spells-v2-list.md), [current combat roster](../../../combat/setup/roster.mjs), and the [language reference](../../grimoire-script.md).

The live worldbook and combat roster agree on campaign spell costs. Older figures in the redesign discussion are not the prices to copy. **Distil's executable ID is `purify`**. Tide, Mirror, and Beast-speech are retired; the three retired lessons remain in the source with `when: false`. The combat roster also contains a creature attack, Gore; it is not one of the 35 campaign spells and is not a player casting candidate.

## Rules for choosing an implementation batch

1. **Choose one spell per card.** The parser permits one `up[spell]` on a two-choice swipe card. It rejects duplicate `up` keys and `up[]` on menus or single-choice stories. Alternative spells in this report compete for that slot. Different cards may use the same spell. Keep the 50 occupied slots; they are not vacant opportunities. Follow each spell's current worldbook `verb:` when writing its casting label.
2. **Keep both ordinary choices useful and at least one unconditional.** A cast can spend Mana for a more controlled result while the ordinary route trains a skill, earns a different relationship moment, or accepts a risk. Mana alone can be an honest trade. Do not invent an injury, fine, or relationship loss merely to balance an option.
3. **A known spell is not an automatic solution to the entire scene.** Ward stops one harm, not a whole storm or swarm. Haste improves speed, not strength, steering, or hours of effortless labor. Shadowstep crosses a short distance; it does not unlock a ward, carry a boatload of passengers, or erase being heard. Foresight's practical use here concerns the next moments, not a whole future or a remote location.
4. **Mend repairs actual damage.** Cups, seams, hull cracks, wounds, and appropriately demanding bone/sprain treatment fit the curriculum's examples. Missing material, enchanted-wand function, disease, curses, memory, and relationships require separate justification. A cast treating this scene's injury must not casually remove an unrelated preexisting `injured` state.
5. **Keep the skill challenge when the obstacle remains difficult.** A named cast can still have a properly pitched challenge and partial/failure results. Use the obstacle and course standard, not the impressive name of the spell. Existing generic magic does not automatically rule out a named, Mana-spending alternative, but do not add a third route that merely repeats the same result.
6. **Treat relationships as relationships.** Glamour supports a disguise or small illusion; it does not grant affection. Rapport helps a joke land; it does not settle a dispute or create consent. Candour is a truthful answer, not obedience or an omniscient verdict. Quickquill records words; Index finds a page in a held book. Neither invents an argument, locates any lost object, or establishes that a source is true.
7. **Preserve each showing of repeat cards.** New says must match the source's sequence/cycle mode and part count. Conditional variants, origins, seasons, and final-year branches all need a valid casting action. Do not fix only one variant and silently invent an obstacle for the others.
8. **Preserve sources and chains.** Do not require a spell to learn itself, drop a teaching effect from one side, or award a preparation flag for work the cast did not do. A temporary steering aid is not automatically the properly trued broom required by the Tailwind chain. A spell that helps a story approach must preserve its queue, flags, clue permissions, and choice of allegiance.

## What casting actually charges

On a card, the engine hides `up[]` until the spell is known, disables it when Mana is short, and automatically charges the roster's Mana and any per-cast alignment. **The spell's other effects are not executed automatically.** Healing, protection, bodily costs, Mana gain, evidence, skill gains, and consequences must be authored in the option's effects and shown in its prose.

In particular:

- Haste does not automatically subtract Health or skip study on cards. If a proposed aftermath includes fatigue or a nap, write that consequence explicitly and use a cost the scene actually shows.
- Distil (`purify`) costs zero Mana; an authored bodily cost is essential. The current Distil options provide examples. Do not turn it into a free repeated preparation or Mana generator.
- Sleight automatically moves alignment toward Hollow by `tiny`; all six forbidden spells do so by `small`. Other spells do not automatically change alignment. Add moral movement when the particular use is dishonest, cruel, or genuinely selfless at a cost, rather than because magic was used.
- When adapting an existing generic spell choice, do not copy its manual Mana debit into `up[]` as well. That would charge twice unless a second, explicitly described effort is intended.

## Forbidden spells: prerequisites and concrete consequences

**Do not add standalone forbidden swipe-up options in the first implementation batch.** All six lack a learning source, and their consequence path needs explicit authorship before access opens.

`chargeCast()` charges Mana and alignment. The `forbidden_cast_report` handling is inside the combat-result bridge, not the card-casting path. Moreover, the current campaign has **no configured `@game forbidden_report` event**. A future author cannot assume that the engine already supplies disciplinary consequences for a forbidden cast, even in a witnessed fight. This is a prerequisite finding, not an implemented fix.

| Spell | Consequence that a future card must actually show | Required limit |
|---|---|---|
| Torment | The target is hurt; their trust or cooperation is lost. A witness objects or reports it, with an authored follow-up or immediate institutional penalty. | Do not turn torture into a consequence-free information or relationship reward. Keep the presentation non-explicit and nongraphic. |
| Extraction | A present, identified victim loses magic and remembers the violation; their reaction and any witness response persist beyond the Mana gain. | No draining an absent target, generic room, or ordinary object as if the spell were harmless recovery. |
| Siphon | Someone else loses life/strength while the caster benefits; the victim reacts and the scene's relationship, service, or institutional outcome worsens. | No free healing without a victim, and no graphic description. |
| Compel | The person visibly repeats their previous action against their will; the interaction loses trust or fails, with a clear report/retaliation route where witnessed. | It repeats an action; it does not grant arbitrary obedience, forgiveness, romance, a confession, or a cancelled debt. |
| Eclipse | The caster actually suffers the described harm before converting it into power; witnesses still treat the practice as forbidden. | Do not write damage prevention or immunity. The harm and gain both need explicit effects. |
| Heartprice | The caster visibly pays bodily strength for a specified, bounded magical act; the Health cost and witness response are explicit. | Zero Mana is not zero cost. The card engine does not automatically inherit the combat's continuing HP-payment mechanic. |

Automatic `alignment -small` is necessary but not a substitute for these outcomes. Use the existing scene's actual witnesses; do not conjure a prefect in an isolated room simply to fine the player. An unwitnessed harmful cast still has its victim's response and the intrinsic cost. A proposed new consequence scene should be clearly introduced as new content, with a reachable queue and a suitable return path. `night_suspicion` is not a universal daytime punishment: it belongs to the midnight sequence.

For a later pass that deliberately introduces forbidden acquisition, these are concrete **conditional matches**, outside the 67-event primary shortlist. They compete with that event's primary spell slot; they are not additional simultaneous buttons.

| Existing event | Possible forbidden use | Why it could fit, and the consequence that must remain |
|---|---|---|
| `grisk_collectors` | Eclipse | Accept an actual blow and convert that injury into power. The player still loses Health, may become injured, and still owes the debt; a cast cannot make the beating harmless or count as repayment. Any audience's response and a reachable disciplinary/retaliation outcome must be authored. Mana gained must be bounded by the harm actually taken. |
| `grisk_collectors` | Compel | Make the smaller collector repeat the knuckle-cracking action described in the setup, buying a moment to attempt escape. The other collector is still present: keep an escape challenge, the debt and return bookkeeping, and a concrete response to the coercion. This is repetition, not an order to forgive the loan or leave. |
| `infirmary_tonic_cupboard` | Extraction | A much darker Mana-refill route would confront and drain the healer instead of taking a bottle. It needs a rewritten setup with Amaranth present, her explicit recognition of the violation, a substantial trust loss, and authored disruption of favors/service or a disciplinary consequence. This changes the scene's tone substantially and should be selected deliberately, after the harmless recovery choices are established. No draining her through a wall or treating the cupboard as a victim. |

Torment and Siphon fit hostile encounters more naturally than a new assault option on a care, romance, or routine favor card. Prefer their combat use with proper settlement consequences over inserting cruelty just to fill a spell quota. Heartprice needs a specific worthwhile magical act with an explicit Health payment; the existing free generic magic choices do not automatically become valid applications of its continuing combat mechanic.

The debt collectors in `grisk_collectors` are a much better **basic Shadowstep** opportunity than a forbidden shortcut. Escape one immediate encounter while keeping the debt and the collectors' return intact. The tournament, rivalry fights, and ring bouts should continue to expose casting inside combat rather than receive instant-win `up[]` alternatives. Their future forbidden casts need the same authored consequence policy.

## Hidden spells and withheld matches

Animate, Starlight, and Seal are sourced hidden-course spells, with academic and discovery prerequisites. They are different from the five unsourced `pool: hidden` spells. Their proposals belong after the common curriculum and social/work applications, and must not become a requirement for ordinary success.

Of the unsourced hidden pool, **Moonwell at `infirmary_tonic_cupboard`** is a plausible later alternative to stealing a tonic: spend real quiet time gathering a modest amount of Mana rather than taking someone else's medicine. This would need a source, clear time/opportunity cost, a bounded gain, and repeat review; it is not a current addition. Rime, Reflect, and Lodestar are defensive techniques with no sufficiently distinct vacant everyday slot established by this pass. Toll has no specified practical card effect or acquisition; do not invent a bell-mystery solution for it.

Some specializations are credible alternatives to the primary spell, rather than extra buttons. These are selection notes for events already in the 67-row shortlist; the roster's proposal counts count only primary spells.

| Shortlisted event | Primary first | Later alternative and why | Limit |
|---|---|---|---|
| `broom_courier_morning_crossing`, `gig_post_storm_run` | Haste | Tailwind suits sustained flight and building speed, particularly once the courier has earned it. | Speed does not reveal a foggy shore or cancel a storm. Choose one spell for each card. |
| `gig_grounds_storm_damage` | Ward for the risky climb | Bramble could grow a barrier around the unsafe path while the rest is cleared. | This is the safer cordon approach, not holding up the broken branch or earning the dangerous climb's full reward. Introduce the vine barrier explicitly. |
| `duel_hall_dummies` | Flame | Wildfire could become an advanced control drill, with visible self-burn risk and a distinct training payoff. | It needs a deliberate supervised-practice rewrite and budget review. Do not turn ordinary dummies into a safe outlet for unlimited fire. |
| `life_storm_night` | Flame | Starlight can provide a small held light without a fire, if already learned. | It does not repair crystals or need to reveal a Hollow Star secret. The common spell already meets the basic need. |

The sourced spells without a new primary recommendation are deliberate omissions:

| Spell | Reason to keep its present coverage for now |
|---|---|
| Heartwood | The two existing storm/shelter options already fit it. A tree's shelter does not supply the warmth needed by the frost-sensitive seedling. |
| Omen | Its two existing prediction cards and lesson already establish it. Avoid adding unrelated foretold moments or allowing it to settle future choices and mysteries. |
| Sleight | The existing theft uses already have a practical purpose. Ordinary purse-keeping or snooping scenes often need no magical retrieval, so another paid theft button would add little. |
| Brace | Prefer Ward for the first ordinary one-hit protections. Brace already has two dedicated options and its combat role; a later addition should involve actually holding position. |
| Distil | Counting doses, curing illness, and generic water purification are not automatically concentration. The old `purify` ID is not permission to restore its retired meaning. Any new use needs an actual substance or self-extraction plus visible bodily cost. |

Bramble, Wildfire, Tailwind and Starlight appear in the alternative-selection table rather than receiving redundant primary slots. Rime, Reflect, Moonwell, Lodestar, Toll and the six forbidden spells retain their acquisition/consequence prerequisites above.

Specific attractive matches to reject or redesign:

| Event or group | Why it is not a straightforward addition |
|---|---|
| `home_cottage_list` | Its origin/sequence variants include accounts, letters, stock, herbs, bees, wood, a door, and a rope. There is no hearth-lighting chore. A single Flame option would invent its own premise. |
| `life_injury_stairs` | A stair has trapped a leg. Haste adds speed, not force. Do not use it to wrench the leg free without the actual escape problem being addressed. |
| `bram_sabotage`, `soc_lost_notes` | Index is not a locator for missing loose notes. A revised scene with a relevant held textbook could use it to reconstruct a passage, but that is a setup change, not recovery of the missing bundle. |
| `life_cursed_umbrella`, the curse chain, fever/sickness cards | No roster spell is a universal counter-curse or disease cure. Use the existing cure/choice structure. |
| `tobias_scarecrow` | Animate is an excellent one-task match, but it is a hidden-course spell, not a basic or peer spell. Keep the ordinary craft/cat routes valid. |
| `courier_fix_broom` | Contraption might make a temporary steering aid, but that does not automatically earn `tailwind_broom`. Any alternative has to satisfy the chain's actual safety requirement and preserve its remaining work. |
| `y3_interview_practical` | The Conclave variant asks for repairing a flawed ward. Baseline Ward stops the next harm; it is not established as general repair of another ward. The other career variants have different tasks. |
| `duelling_captain_injury` | Healing after stopping a bout is plausible, but an instant Mend-and-win route would erase the captain's safety decision. Keep that decision central. |
| `astro_far_glimpse`, other extended divination scenes | Some older prose reaches a season or week ahead, whereas the newer Foresight definition and start lesson emphasize moments. Resolve that scope conflict before treating it as a license for broad prophecy. |
| `bell_drowned`, Hollow Star finales, time-loop solution | Protection can support a physical attempt, but must not manufacture a clue, remove the central challenge, advance a clock, or solve the mystery just because the player knows a spell. No such shortcut is recommended here. |
| The 33 menus and 21 single-choice story cards | They have no legal `up[]` insertion. A worthwhile spell use needs an explicit structure proposal, not an extra option pasted into the current form. |

## Practice cards and implicit casting

The best first batch expands everyday uses. A later accounting pass can also make existing practice visibly use learned magic. For example, `pyro_candle`, `evo_first_spark`, `evo_lattice`, `alch_cracked_tray`, and the active `lesson_*` cards already describe casting without always presenting a formal `up[]` spend.

These are **formalization candidates**, not proof of 24 or more new everyday opportunities. Many already have two versions of the same spell action. Before adding a redundant third option, choose a genuinely different exercise or preserve an observation/coaching/manual route, then give the named cast a distinct Mana/payoff trade. Keep source lessons in `spell_sources.grim` and the club/job finals accessible while the spell is unknown. Do not convert their learning choice into an option hidden until after learning.

The active lesson roster and existing casts are included in the spell-roster appendix so this work can be selected deliberately rather than counted twice.

## Validation and limits

The current source compiles without errors. `node tools/grim.js build --check` reported both committed bundles current before the review check. `node tools/grim.js check` completed: lint reported **0 errors and 0 warnings**, and **200 random-policy games had 0 crashes**. The [baseline log](baseline-check.log) preserves that output. That simulation saw 1,019 of 1,083 events in its coverage denominator, with 64 never seen; the compiled inventory contains 1,093 definitions. These are different tool counts, not evidence that every event was exercised.

These checks validate the unchanged game baseline and the report's references. They do **not** validate hypothetical outcomes, their budget, UI, translation, reachability, or economy. No new gameplay balance result is claimed. The report records a hash of all content sources; recheck the proposed IDs and source lines if content changes before implementation.

After selecting a small batch, write its English options and outcome prose, preserve repeat variants and chain behavior, use a migration for bulk content edits, and run the required authoring checks. Rebuild the committed content bundle, update and complete zh-CN translations, inspect exact previews, and run the targeted simulations. For an actual gameplay change, inspect the golden diff and refresh the intended baseline in that later authorized change. This review does not refresh it.
