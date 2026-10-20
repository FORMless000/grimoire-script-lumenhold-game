# Negotiation prototype rulebook

Arguments 3 · Rust/WebAssembly core · 20 October 2026. Standalone simulator; no campaign integration or main-game commits.

## Play

Choose Early 20, Mid 50 or Late 80 in Setup, or play the opening level-20 meeting immediately. Random encounter chooses a different source scene for each new meeting; Replay seed repeats that resolved scene. The setup bench may scroll. The gameplay frame fits a phone; its flat spell tray scrolls internally and has no pages.

The opponent presents one argument. You may cast one learned, affordable spell, then **Confront** or **Deflect**. Casting does not consume the response. Every spell remains inspectable; unlearned, story-only, unaffordable and already-used-slot spells show the reason they cannot currently be cast. Irrelevant or hostile learned spells can still be cast, with their stated consequences. Select a spell and press Cast; selecting or receiving an engine suggestion never casts it.

The goal is full Agreement before Suspicion reaches its limit or Patience runs out. There are no dialogue clues and no hidden opponent decision to infer. Draws and checks are seeded random events.

## Limits and responses

- **Entry Patience: 8. Suspicion limit: 6.** Fixed at every level and in every scene. Starlight can restore Patience during play; it does not change these entry settings.
- **Every accepted card gives exactly 1 Agreement**, including explicit payment and knowledge requests. Reflect does not add Agreement.
- Default Agreement target: `clamp(round(4 + (DC − 20) × 6 / 80), 4, 10)`. DC 1–20 requires 4, DC 50 requires 6, DC 80 requires 9, DC 100 requires 10. The bench allows an explicit Agreement override for experiments.
- Confront succeeds at the displayed probability. Acceptance spends no Patience. Rejection loses the card’s Resolve, adds its Suspicion and costs its displayed 1 or 2 Patience.
- Deflect gives no Agreement. It costs 4 Resolve and 2 Patience. Its chance of adding 1 Suspicion is `min(90%, 12% + 18% × prior deflections)`. Every skip increments that counter, including a magically protected skip.
- You need positive Resolve and enough Resolve to pay for Deflect. At zero Resolve, you must confront, cast or leave. Low Resolve does not itself end the meeting.
- At the end of a response, reveal the next argument and refresh the spell slot. Temporary response effects expire; Foresight and the prior-Candour record have their own durations.

Suspicion failure resolves before Agreement victory. Reaching the Agreement goal with the last Patience wins. Patience exhaustion banks a partial agreement if you reached at least half the target; otherwise it loses. Ordinary Leave loses. Shadowstep can bank a partial agreement, but its casting Suspicion resolves first. A 40-response safety limit also settles existing progress.

## Exactly one check per card

An ordinary card checks only its named signal:

`p = clamp(0.50 + 0.015 × (signal − DC − card modifier) + spell support − Resolve penalty, 0.05, 0.95)`

There is **no Charm blend** on a Lore, preparation or relationship check. Charm dominates how often it is requested: its six ordinary cards have high base weights and a default ×3 skill multiplier. Changing Charm still changes Resolve slightly, but not the immediate probability of an unrelated check at full Resolve.

Signals cover all six skills; Renown; relationship with this audience; Lumen/Hollow alignment; nine courses including electives; four club/society records; four jobs, seven internships and generic work; and thesis progress. They are bench-normalized 0–100 values. Renown and relationship are clamped to that range; Lumen uses `50 + Alignment/2`, Hollow uses `50 − Alignment/2`. Setup aggregate controls fill a group; the JSON overrides can vary individual canonical track IDs.

Examples with the named signal equal to DC, full Resolve and no spells:

| Opponent lead | Acceptance | Agreement | Rejection: Resolve / Suspicion / Patience |
| --- | ---: | ---: | --- |
| Plainly, Please | 92% | 1 | 2 / 1 / 1 |
| What Do I Get? | 80% | 1 | 3 / 1 / 1 |
| A Very Long Silence | 56% | 1 | 4 / 2 / 1 |
| One Small Objection | 42.5% | 1 | 6 / 2 / 1 |
| That Does Not Follow | 29% | 1 | 8 / 2 / 2 |
| The Whole Case | 23% | 1 | 9 / 3 / 2 |

Course-preparation leads use −14 DC; clubs +5; work records +12. Their failure stakes also differ. These are prototype tuning, not inherent properties of those subjects. With every reward at one point, a dangerous lead needs a good personal signal or spell support to justify facing it. Skipping trades Resolve and the scarce eight-point Patience budget against that risk.

## Pools and encounter nature

The ordinary library contains 45 reusable cards written from the opponent’s viewpoint. Each has a source tag and a source/key tag, such as `skills:lore`, `relationship:undefined`, `preparation:artifice` or `job:tavern`. The relationship source tag is the readable group; its key is absent because it is one signal. Scene pool eligibility uses these tag kinds, never bespoke checks involving multiple signals. Both Lore arguments share eligibility; a weight can favour one over the other.

Research audiences retain the full ordinary library with different weights. Source scenes restrict tags: an intimate disagreement uses personal signals and skills, while a tavern inspection admits tavern work and technical evidence. Cards sharing an admitted tag remain eligible even if an earlier bespoke deck omitted one. Weights resolve most specifically by card ID, then source/key, then source, then 1. Charm’s default multiplier is 3 unless overridden by the audience. Every eligible card has positive weight.

Scenes have **no hidden DC offsets**. Their nature comes from tag eligibility and weights. The bench’s explicit DC controls difficulty and the default Agreement target. Safe/ambitious thesis and prepared/live interview variants differ by weights. Explicit requests are appended only when the source scene or test configuration specifies them.

Cards are drawn with replacement, excluding the current card to avoid consecutive repeats. Card draws and check/deflection rolls use separate Mulberry32 streams from the saved encounter seed. The next card is selected before the response. Spells never add, remove or reroll cards or change their weights.

## Explicit requests

Each request tests just one requirement and awards one Agreement:

| Request | Confront requirement | Payment |
| --- | --- | --- |
| Flag | Hold the specified flag | None |
| Spell knowledge | Know the specified spell | None; it does not cast the spell |
| Crown concession | Have the specified crowns | Paid only on acceptance |
| Blood price | Have the specified Health | Paid only on acceptance |

These checks are deterministic 0%/100%; ordinary checks are probabilistic. A failed gate remains faceable, even at zero Resolve, with the ordinary rejection penalties. Deflection is optional when you can afford it. Gold spent is spent gold. The authorization, known-spell and blood-price scenes are explicitly marked synthetic fixtures; the listed campaign scenes do not acquire arbitrary new gates.

## Resolve and resources

`full Resolve = round(12 + .22 × Guile + .08 × Charm + .05 × Lore)`

At entry Mood of at least 30%, start at that full cap. Below 30%, multiply the cap by `.4 + .6 × entry Mood / 30`, round, with a minimum of 1. Start full relative to the shortened cap.

Below 50% of that starting cap, ordinary checks lose up to 22 percentage points: `.22 × (1 − 2 × Resolve / starting cap)`. Hard gates and affordable payments remain 0%/100%.

When the meeting ends, charge Mood once:

`Mood hit = min(entry Mood, ceil(entry Mood × .4 × Resolve lost / starting Resolve cap))`

Low-Mood entrants therefore have less Resolve capacity but a proportionally smaller eventual Mood hit. Health matters only when an explicitly specified blood-price card uses it. Renown is a check signal here, not an extra universal action currency. Mana pays the frozen combat-schema spell costs. No Mana flux/reclamation exists in this minigame.

Mood, Mana, Health and Renown have independently configurable post-meeting rebates, default 50%. For each resource, refund `floor(max(0, entry − current) × ratio)`. Rebates never exceed the actual loss and cannot create a gain above entry. Crowns and Alignment are never rebated. Sleight can create real stolen-crown gains; those are recorded separately, not generated by a rebate.

## Spell adaptations

Costs, ranks, availability declarations and icons come from the frozen combat schema in `schema.mjs`; that file records its source hashes. Every cast uses that Mana cost. One spell per response, no casting modes.

Casting normally adds **1 Suspicion**. Glamour adds **2**. Candour directly removes Suspicion instead of adding it. Hostile or forbidden magic can end an ordinary meeting before any beneficial effect.

| Spell | Negotiation effect |
| --- | --- |
| Glamour | +14/18/22 percentage points on the current Charm/Guile check; +2 Suspicion. |
| Index | Use Lore alone for this ordinary check. Never bypasses a gate/payment. |
| Reflect | +12 percentage points on this ordinary check; rejection adds another Suspicion. Success is still +1 Agreement. |
| Candour | Remove 3 Suspicion, no casting increment; record this turn for Quickquill. |
| Quickquill | Rejection costs no Resolve. If Candour was used on the previous response, casting also gives 1 direct Agreement and costs 6 Alignment. This is a spell bonus, not an increase to card payout. |
| Rapport | This Deflect costs no Resolve and has no Suspicion roll; positive Resolve still required, Patience still paid. |
| Haste | This Deflect costs 1 Patience rather than 2. |
| Foresight | Reveal the preselected next card, rolling for the schema’s 3/4/5 responses. No pool manipulation. |
| Starlight | Restore 2 Patience, capped at entry Patience +4. |
| Shadowstep | Leave and bank progress, partial at half target; casting Suspicion happens first. |
| Sleight | Steal up to 5 actual crowns; uses the schema’s Alignment penalty. |
| Compel | Ordinary audiences immediately refuse forbidden coercion; underground test permission lets it give 1 direct Agreement. |
| Flame, Wildfire, Hoarfrost, Animate, Heartwood, Contraption, Bramble | Hostile magic immediately loses the meeting. |
| Other learned castable spells | Technically castable, but have no extra negotiation effect: Mana and Suspicion still apply. Forbidden spells still fail ordinary meetings. |

Toll is story-only and Gore creature-only in this schema; neither becomes a learned player cast by enabling the bench’s all-castable option.

## Engine suggestions and simulation policy

Gameplay has no AI turns or Watch AI. Engine analysis runs in a worker with a cooperative **50 ms budget**, attempting up to three response turns. It scores every legal root action, including harmful/irrelevant spells, and highlights its best suggestion. You remain in control. Background completion changes badges only, so it cannot clear a selection or execute an action. Stale results from a prior state are ignored.

The value labelled **E** is expected utility: terminal full win 1, partial .1, loss 0, less small Mana/crown/Health expenses. Nonterminal states use a heuristic race estimate, not a calibrated probability. Higher is better under that objective. Mood and Alignment are unpriced, so the suggestion is not an optimal campaign-resource policy.

Search is sampled expectimax, not alpha–beta: actual check/rejection probabilities are branched exactly; unknown next cards use three deterministic stratified samples of the public weighted distribution. Revealed Foresight information is used, hidden RNG and unrevealed cards are removed. Spells do not consume response depth. Useful-spell filtering applies in continuation nodes, not at the root. Iterative deepening retains values only when the whole root iteration completes, so displayed action scores have the same completed depth. A compact-position transposition cache avoids repeated states.

The core transitions, random outcomes, settlement and tree search run in `rust/src/lib.rs`, compiled to `negotiation.wasm` for both browsers and Node simulation. JS retains content, profile construction, initial seeded deck setup and UI. `reference-engine.mjs` and `reference-ai.mjs` are independent JavaScript golden oracles; runtime transitions/search do not fall back to them. A missing Wasm file is an error.

Simulation remains available separately through `study.mjs`, comparing always-Confront, one-response and up-to-three-response policies over paired seeds, level gaps and spell-access diagnostics. Frozen sources, Wasm, raw tapes and replay checks are retained. `fixedNodes: true` disables the deadline for deterministic fixed-node research runs; the gameplay worker always uses the timed cap. Reports must distinguish full wins from partial agreements and avoid calling this policy proven optimal.

## Build and short verification

```sh
node experiments/negotiation/build-core.mjs
node experiments/negotiation/golden.mjs
node --test experiments/negotiation/engine.test.mjs
~/.cargo/bin/cargo test --offline --release --manifest-path experiments/negotiation/rust/Cargo.toml
node experiments/negotiation/build.mjs /private/tmp/negotiation-preview-new
PORT=55918 node /private/tmp/negotiation-preview-new/server.mjs
```

The Rust builder uses the installed `wasm32-unknown-unknown` target and cached crates; no dependency installation is needed here. The build and Site remain separate from the main game. Golden tests compare seeded command tapes, every ordinary/request card’s success and failure, all castable spell ranks, settlement and short root-action search values against JavaScript.

## Source-scene adapter index

These are proposed test encounters, not campaign outcome replacements. Context remains in the referenced Grimoire event. Synthetic fixtures are labelled separately. All use entry Patience 8 / Suspicion 6; DC is supplied by the bench.

| Preset | Source event | Tagged pool | Explicit request |
| --- | --- | --- | --- |
| Full-pool calibration | Synthetic / research | `general` | None |
| The Defence · standard | `thesis_defence` (content/events/calendar_2b.grim) | `committee` | None |
| The Defence · safe topic | `thesis_defence` (content/events/calendar_2b.grim) | `committee` | None |
| The Defence · ambitious topic | `thesis_defence` (content/events/calendar_2b.grim) | `committee` | None |
| The Practical · teaching | `y3_interview_practical` (content/events/expansion_y3.grim) | `teaching` | None |
| The Appeal | `grade_appeal` (content/events/calendar_2b.grim) | `appeal` | None |
| The Disciplinary Board | `crisis_probation` (content/events/crisis.grim) | `accountability` | None |
| The Bursar Will See You | `aid_interview` (content/events/pools/money.grim) | `aid` | None |
| A Quiet Warning | `isolde_warning` (content/events/people_others.grim) | `accountability` | None |
| Someone Else’s Name | `intern_credit_taken` (content/events/pools/internships.grim) | `credit` | None |
| The Inspector Calls | `tavern_manager_inspector` (content/events/pools/upper_ranks.grim) | `inspection` | None |
| The Overdue Notice | `inc_library_fine` (content/events/incidents.grim) | `fine` | None |
| A Coin Short | `break_work_short_wages` (content/events/pools/plans_more.grim) | `wages` | None |
| The Spice Stall | `slice_market_haggle` (content/events/slice_2a.grim) | `broker` | gold: 8 |
| Errands for Upper-Years | `upper_year_errands` (content/events/pools/money.grim) | `errands` | None |
| The Last Copy | `grimsbys_last_copy` (content/events/pools/village_home.grim) | `last_copy` | gold: 2 |
| The Charm Seller | `home_market_charm_seller` (content/events/pools/village_home.grim) | `fakes` | None |
| The Ultimatum | `lyra_family_ultimatum` (content/events/people_students.grim) | `intimate` | None |
| Lady Vaneshade | `lyra_mother_visit` (content/events/expansion_people.grim) | `manners` | None |
| The Harvest Failed | `tobias_bad_harvest` (content/events/people_students.grim) | `harvest` | gold: 30 |
| Tobias and the Prefect | `tobias_bullied` (content/events/people_students.grim) | `crowd` | None |
| The Confiscation Vault | `corvin_confiscation_vault` (content/events/expansion_people.grim) | `risk` | None |
| Corvin’s Brother | `corvin_brother` (content/events/expansion_people.grim) | `boundary` | None |
| You’re in the Gossip Column | `nessa_gossip_column` (content/events/people_students.grim) | `press` | None |
| Red Ink | `lumen_ledger_red_ink` (content/events/pools/clubs_jobs.grim) | `editing` | None |
| The Impossible Interview | `nessa_headmistress_interview` (content/events/expansion_people.grim) | `access` | None |
| The Workshop Is Shut | `mir_workshop_closed` (content/events/people_students.grim) | `workshop` | None |
| Notes in the Margin | `thesis_margin_notes` (content/events/pools/plans_thesis.grim) | `committee` | None |
| Bram’s Father | `bram_father_visit` (content/events/expansion_people.grim) | `advocacy` | None |
| The End of Something | `soc_breakup` (content/events/social.grim) | `intimate` | None |
| Found Out | `soc_two_timing` (content/events/social.grim) | `apology` | None |
| Brother and Sister | `ilse_kael_reunion` (content/events/chain_ilse.grim) | `mediation` | None |
| The Sister | `hs_kael_sister` (content/events/chain_hollowstar.grim) | `mediation` | None |
| The Interview | `y3_interview` (content/events/expansion_y3.grim) | `interview` | None |
| Dinner With a Patron | `renown_patron_dinner` (content/events/pools/renown.grim) | `patron` | None |
| The Masked Night | `company_masked` (content/events/pools/night.grim) | `masked` | None |
| The Old Grudge | `intern_thornwick_rivalry` (content/events/pools/plans_thesis.grim) | `rivalry` | None |
| Deny Everything · live | `ledger_quill_interview` (content/events/club_spell_chains.grim) | `reporting` | None |
| Deny Everything · prepared | `ledger_quill_interview` (content/events/club_spell_chains.grim) | `reporting` | None |
| The Room Is Yours · story | `tavern_festival_room` (content/events/club_spell_chains.grim) | `tavern_room` | None |
| The Room Is Yours · first round | `tavern_festival_room` (content/events/club_spell_chains.grim) | `tavern_room` | gold: 8 |
| The Escaped Portrait | `life_portrait_escape` (content/events/expansion_life.grim) | `portrait` | None |
| The Water Spirit Race | `tide_water_spirit_race` (content/events/expansion_classes.grim) | `water_spirit` | None |
| The Man in the Tunnel | `hs_tunnel` (content/events/chain_hollowstar.grim) | `tunnel` | None |
| Blood-price bargain · synthetic | Synthetic / research | `covert` | health: 8 |
| Authorization · synthetic | Synthetic / research | `official` | flag: invitation |
| Known-spell requirement · synthetic | Synthetic / research | `scholarly` | spell: seal |
