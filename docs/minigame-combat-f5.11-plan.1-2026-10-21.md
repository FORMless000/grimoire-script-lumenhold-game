# Combat F5.11-plan.1 — duel terminology and spell redesign

- **Date:** 2026-10-21 (America/New_York).
- **Plan version:** **F5.11-plan.1**, appended to the inspected combat bench version **spells-v2 F5.11** (runtime source dated 2026-10-20).
- **Status:** design decisions finalized for implementation handoff; **not implemented and not balance-validated**. Creature numbers are initial values to tune in the balance pass.
- **Runtime version:** unchanged. This document does not claim an F5.12 release or modify `RULES_VERSION`.
- **Scope:** the current combat bench in [combat/](../combat/README.md), its existing shared Rust core and campaign bridge. Historical v04 documents are not the implementation target.

## Reading order and authority

The author supplied these decisions in chat, finalized on 2026-10-21. This is a standalone handoff: no temporary review files are needed. Unmodified mechanics remain as in the current F5.11 sources. The planned tables and detailed rules below override the old spell descriptions only for the named changes; do not introduce optional roster expansions or framework work. Update the design documentation alongside a later implementation, rather than treating this plan as already-shipped behavior.

Start with [combat/HANDOFF.md](../combat/HANDOFF.md), [combat/README.md](../combat/README.md), [the existing bench rulebook](../combat/web/rulebook.md), [roster](../combat/setup/roster.mjs), [loadouts](../combat/setup/loadouts.mjs), [rules](../combat/rust/core/src/rules.rs), [descriptions](../combat/rust/core/src/text.rs), [flavor](../combat/setup/flavor.mjs) and design §9 in [design-v0.3.md](design-v0.3.md). Some old rulebook passages describe earlier versions; inspect the actual source before editing.

Most spells serve combat and negotiation; some intentionally serve only one. Limited combat utility and Charm's small tactical role are deliberate. Keep known no-effect combat actions visible, and keep Quickquill negotiation-only. No implicit buffs to Candour, Index or Glamour beyond the specified Haste/reward rules.

## Final decisions closing the discussion

| Item | Final decision |
|---|---|
| Web / Threads | Bind 2 / 1 starting **next exchange**, no cancellation of the casting exchange's committed action. |
| Haste | Countertempo; **2/3/4 future exchanges**, **5/5/5 Mana**. Rank III gains duration, not a discount. |
| Roar | **8 base spell damage, scatter 4 ready Mana, cost 4 Mana**; Vigor-scaled. |
| Beetle Flame | **10 base spell damage, cost 6 Mana**; Arcana-scaled, Stag beetle only. |
| Lodestar | **One pending instance per caster in a fight**; cannot recast while pending, may recast after maturity. |
| Overlapping Omen | Same-date contributions become **one combined hit**: two 20-base contributions give 40 base before Lore scaling. Apply per-hit defense/reduction once. |

These settle the previous open gameplay questions. Retained baseline behavior and narrow implementation conventions below are not permission for unrelated redesigns. Where an edge case is not specified, preserve existing behavior; do not silently add a new mechanism.

## Basic duel language and flavor

**Strike → Impulse; Guard → Parry; physical damage → Impact damage; Reclaim → Refocus.** Keep internal/save-facing IDs. English Distil becomes **Distill**, but keeps `purify` and its existing Chinese name.

Impulse combines bodily strength and sheer magical force: a blunt magical punch driven through a wand. **Parry is a magic parry**, turning force aside rather than physically catching a weapon. Its name is deliberately distinct from Reflect, which returns hostile spellwork. Keep Vigor's current explanation: stamina, reflexes, dueling and broom-flight. Treat minuscule basic-technique Mana as untracked flavor: basics remain available at zero Mana and generate no flux.

| Defense | Ordinary Impact | Ordinary spell damage |
|---|---|---|
| Parry | Stops it; repeated Parry stops only half | Halves it |
| Ward | Halves it | Stops it |
| Brace | Reduces by 80% | Reduces by 80%, except Omen |

Poison/Torment and Lodestar have their explicit higher-priority rules below. Named existing piercers remain unless changed in a later balance revision. Ward disrupts formed spellwork but only softens a direct shove of force; do not promise universal immunity to all magic.

No location-aware flavor. Animate can use furniture everywhere. Starlight is a piercing beam called down from the sky, even indoors, without checking. Use only actor/foe and already-present practice/real/public/ring contexts. Magical acorns remain visibly enchanted; Long Wait explicitly combines magical silk and bodily force.

Retain the compatible prose work: visible Wildfire self-burn; distinctive material/rhythm for each spell; non-gory yielding/lowered wands for school duels; accurate attack outcomes rather than unconditional claims of contact; no bare-arm fireball blocking. Examples:

- Impulse: “You drive your wand forward; a blunt pulse of force strikes toward your opponent.”
- Parry: “You set your feet and turn the force aside with a sharp motion of your wand.”
- Refocus: “You turn your wand inward; the loose light gathers at its tip.”
- Omen describes misfortunes gathering, never an inevitable fate; exact dates belong in the timeline.

## Complete roster directions

The following covers every original F5.11 roster ID; the weaker beetle Flame is the one explicitly selected additional data profile. Numerical details and cross-spell precedence follow in the next section.

| Spell / ID | Existing creature owners | Planned direction |
|---|---|---|
| **Flame** (`flame`) | Practice mannequin | Set base damage to 20 at every rank; Mana 10/9/8. Preserve existing Arcana scaling. |
| **Foresight** (`foresight`) | — | Keep current effect; retain the clearer attentive-reading flavor and commitment explanation. |
| **Mend** (`mend`) | — | Set base healing to 24/27/30; Mana 10/9/8 (+1 from current costs). Preserve Alchemy scaling and damage-interrupt condition. |
| **Glamour** (`glamour`) | — | Base Renown 4/6/8, Charm-scaled and rounded up. Independent full/half/zero tranches; second payout rounds up. Earlier even-final-payout/no-scaling directions are superseded. |
| **Haste** (`haste`) | — | Countertempo: eligible non-damaging, non-damage-scheduling, non-channeling spells add one automatic Impulse. Duration 2/3/4 future exchanges; Mana stays 5/5/5. Basics do not trigger it. |
| **Shadowstep** (`shadowstep`) | — | Evade for 1/2/3 exchanges by rank, including cast exchange; Compel no longer bypasses it. Retain existing attack/Mana-recovery break rules. |
| **Ward** (`ward`) | — | Keep present ordinary spell block and half Impact defense. Update named exceptions for the redesigned spells; base cost remains 7. |
| **Animate** (`animate`) | — | Keep the current summon and non-location-aware furniture imagery. Correct duration and owner-damage-threshold descriptions; no scenery logic. |
| **Starlight** (`starlight`) | — | Keep existing channel numbers; describe a piercing starlight beam called from the sky. Charged release still pierces Ward fully. No indoor checks. |
| **Seal** (`seal`) | — | Keep flux denial and present numbers; improve resource/blocked-result explanation without changing the effect. |
| **Wildfire** (`wildfire`) | — | Cast and every Hold deal 15, bank 15; self-damage 2, then 4, 6, etc. Release is 15 plus bank. Entire release passes half of Ward; remove embers and Guard piercing. |
| **Heartwood** (`heartwood`) | — | Keep the current healing summon. Bramble’s explicit redesign retires its former summon pairing; other summons remain. |
| **Omen** (`omen`) | — | Ward/evade-counterable application schedules base 20 spell damage at t+2 and t+3. Merge overlapping same-date Omen damage into one combined hit, e.g. 40 base; reduce/reflect that combined hit once. Omen bypasses Brace only. |
| **Sleight** (`sleight`) | — | Base 15 Crowns, Guile-scaled; round full and half tranches upward. At Guile 50: 15 then 8, total 23. Independent 1.5× limit rounded consistently upward; keep theft alignment consequence. |
| **Contraption** (`contraption`) | — | Keep the present summon and mutual end burst; clarify duration, owner damage and replacement-triggered explosion. No extra detonate action. |
| **Hoarfrost** (`hoarfrost`) | — | Base 20 damage; Mana 8, equal to revised Flame rank III. Keep Arcana scaling and existing fire cancellation. |
| **Candour** (`candour`) | — | Keep negotiation focus and zero combat effect. Remain visible when known; no automatic information-effect buff. |
| **Brace** (`brace`) | Shadow stag | Reduce damage by 80% for two exchanges including cast; Omen ignores it. Burrow/Hide inherit the shared rule; no skill scaling of 80%/duration. |
| **Quickquill** (`quickquill`) | — | Keep negotiation-only effect. No ink-volley or quill-summon expansion; known no-effect action stays visible in combat. |
| **Bramble** (`bramble`) | — | Replace its summon with base 10 spell damage plus Bind 1 for the next exchange. Ward stops both; use shared evade/Reflect rules. Explicit exception to “keep current summons.” |
| **Index** (`index`) | — | Keep negotiation/world purpose and no combat effect; do not hide the known action. |
| **Rapport** (`rapport`) | — | Base 8 Renown, Charm-scaled and rounded up; Crowns payment remains 10 without scaling. Independent full/half/zero tranches; second payout rounds up. |
| **Distill** (`purify`) | — | English display name becomes Distill; keep internal purify ID and Chinese name. Retain HP-for-Mana effect; remove poison cure completely. |
| **Tailwind** (`tailwind`) | Shadow stag | Replace Strike buff with a Vigor-scaled 20-Impact attack; add base 10 per consecutive recast (20/30/40…). Other actions reset the sequence. |
| **Rime** (`rime`) | — | One cast per encounter, with the existing rescue/freeze. Heartprice explicitly permits Rime restoration; poison/Torment still bypass the frozen interval’s ordinary damage immunity. |
| **Reflect** (`reflect`) | — | Current exchange only, all directly incoming hostile spells and spell damage including scheduled spell damage. Never Impact, attached poison ticks or attached Torment tolls. No one-spell consumption limit. |
| **Moonwell** (`moonwell`) | — | Keep existing free Mana channel, bank/capacity behavior and clearer descriptions. |
| **Lodestar** (`lodestar`) | — | One pending Lodestar per caster in the fight; unavailable while pending, recastable after maturity. At t+7 negate ANY damage at highest priority, apply Ward and heal base 20 scaled with Lore. Keep Mana 4; HP payments remain costs. |
| **Toll** (`toll`) | — | Keep story/card-only purpose. No invented combat effect; retain existing castability rule and do not confuse it with hidden known no-op actions. |
| **Torment** (`torment`) | — | Keep three-exchange duration; toll is 2× actual voluntary opponent Mana payment, no skill scaling. Application can be blocked; ongoing toll cannot be blocked except by mature Lodestar. |
| **Extraction** (`extraction`) | — | Keep ready-Mana-to-flux denial, current limits and numbers. Update effect reflection/defense ordering consistently with other hostile spells. |
| **Siphon** (`siphon`) | — | Keep damage channel and healing bank; show the Release payoff. Heartprice suppresses its healing, not damage. |
| **Compel** (`compel`) | — | Capture the opponent’s actual current move and force that same move for the following three exchanges. Do not overwrite the capture exchange. Ward/Shadowstep block application. |
| **Eclipse** (`eclipse`) | — | Gain 1 ready Mana per actual damage taken, for three exchanges including cast; preserve capacity cap. |
| **Heartprice** (`heartprice`) | — | Exchange all ready Mana for HP on activation, then prevent healing except Rime; keep existing HP spell-payment conversion. Rime’s rescue is explicitly allowed. |
| **Gore** (`gore`) | Shadow stag | Keep base attack, rename category Impact; retain creature charge imagery and existing counters. |
| **Nip** (`nip`) | Bramble ferret | Keep current attack for now, with Impact category; retain the flagged comparison against free Impulse as a later balance check. |
| **Filch** (`filch`) | Bramble ferret | Keep Mana theft; describe ready Mana accurately and display amount lost versus retained. Optional spell-damage addition remains unselected (see detailed mechanics). |
| **Roar** (`roar`) | Bristleback | Bristleback’s Roar: base 8 spell damage + scatter 4 ready Mana, Mana cost 4; Vigor scaling. Values chosen for the first implementation, balance tuning later. |
| **Swarm** (`swarm`) | Spiderling swarm | Keep multi-hit behavior, category Impact; fix split-hit totals/wording. Do not add new creature actions. |
| **Root** (`root`) | Grumpy oak; Elder oak | Inherits the shared full-action Bind redesign; its distinct duration/cost/next-exchange onset otherwise remain. Warn about oak control power. |
| **Web** (`web`) | The Spinner; weakened Spinner | Bind 2 starting NEXT exchange, unscaled; keep Mana 6. Two forced Breaking Free exchanges prevent incoming Bind. Does not cancel the casting exchange’s committed action. |
| **Threads** (`threads`) | Spiderling swarm | Bind 1 starting NEXT exchange, unscaled; keep Mana 3. Forced Breaking Free prevents incoming Bind; no same-exchange cancellation. |
| **Venom** (`venom`) | The Spinner; weakened Spinner | Uncurable poison: base 6 on the casting exchange and 6 next exchange, preserving original base total 12 (formerly 3×4) and Alchemy scaling. Inevitable ticks bypass every damage defense except active Lodestar. |
| **Pinch** (`pinch`) | Stag beetle | Keep present attack, category Impact; consistent pincers/mandibles prose without a nonexistent grip status. |
| **Acorns** (`acorns`) | Grumpy oak; Elder oak | Replace simultaneous hits with base 10 spell damage now and 10 next exchange. Magical-acorn prose; preserve Lore scaling. No extra action. |
| **Skitter** (`skitter`) | Bramble ferret; Spiderling swarm | Keep shared evade copy; use holder-neutral flavor without a ferret-only tail/nose. No new spell names. |
| **Fade** (`fade`) | Shadow stag | Keep the stag’s existing evade copy and supernatural fading image; spell-specific duration unchanged unless explicitly retuned. |
| **Burrow** (`burrow`) | Bramble ferret; Spiderling swarm | Keep generic defense; inherit Brace’s two-exchange 80% rule. No location-detection logic. |
| **Hide** (`hide`) | Bristleback | Keep generic defense; inherit Brace’s two-exchange 80% rule and quilled-hide imagery. |
| **Bark** (`bark`) | Grumpy oak; Elder oak | Keep Ward-copy defense, with magical bark cue and honest piercing exceptions; no additional creature defense spell. |
| **Carapace** (`carapace`) | Stag beetle; The Spinner; weakened Spinner | Keep shared Ward-copy defense on beetle/Spinner; current holder-specific naming is enough. |
| **Maul** (`maul`) | Bristleback | Base 30 scheduled Impact damage, current one-exchange delay/cost retained. Bristleback is the current owner. |
| **Charge** (`charge`) | Stag beetle | Change scheduled damage to Impact, keep current delay/base 24 and Guard-piercing property unless changed in a later balance revision. Stag beetle is the owner. |
| **Bough** (`bough`) | Grumpy oak | Change to Impact: it belongs to Grumpy oak, distinct from Maul’s Bristleback. Keep existing two-exchange delay/base 32/cost. |
| **Slow Fall** (`slow_fall`) | Elder oak | Physical falling-bough move becomes Impact; keep base 40, two-exchange delay and Brace piercing. Keep its current display name; prior alternative names were not selected. |
| **The Long Wait** (`the_long_wait`) | The Spinner; weakened Spinner | Keep scheduled timing; split hit into base 24 spell plus 24 Impact damage. Show magical silk explicitly. Guarantee is limited by Web timing and existing protections; resolve in the detailed mechanics. |
| **Brood** (`brood`) | The Spinner; weakened Spinner | Keep current Spinner summon, physical ticks become Impact. Preserve lifetime/reduction/threshold and clearer descriptions. |
| **Thicket** (`thicket`) | Elder oak | Keep current elder-oak spell-damage summon. Do not convert it into Bind or add terrain mechanics. |

## Detailed mechanics and implementation boundaries

### 1. Scope boundary and accepted interpretation

- Impulse is direct magical force driven with bodily follow-through. Parry is a **magical deflection**, not a physical block; the distinct name avoids confusion with Reflect. Keep the current Vigor definition and actual scaling. Refocus gathers luminous flux into ready Mana.
- Preserve the existing zero-cost basics: no tracked basic-action cost, no generated flux, and availability at zero ready Mana. Adding a measured cost would be a substantive resource-design change, not just new flavor.
- Numbers called “base” retain their current skill factor unless explicitly made unscaled. Thus Flame has base 20 at all ranks but still follows Arcana; Mend follows Alchemy; both parts of Omen follow Lore; Tailwind follows Vigor; both Long Wait parts retain its current Lore factor. Preserve the existing scaling unless explicitly overridden.
- Shared Mana costs stay equal between card uses and combat as the project requires. Account for changed costs in negotiation's existing input/roster consumption; do not redesign negotiation effects in this task. Renown limits and encounter cast counters apply to combat encounters unless a later negotiation design explicitly adopts them.
- Keep known no-effect actions visible. They can say “No combat effect”; do not turn that into a reason to buff Charm or add damage to negotiation spells. No need to force useless spells into every generated enemy kit. Player visibility and AI pruning are separate decisions.
- No location-aware prose. Animate can use furniture everywhere; Starlight descends from the sky without checking for a roof. Reuse existing actor/foe/context only. Do not create environmental tags or a flavor routing framework.
- Keep the current summons **except Bramble, explicitly replaced below**. That means Animate, Heartwood, Contraption, Brood and Thicket keep their profiles. Construct flat damage reduction stays; removing absorb means removing finite absorb pools, not erasing these reductions.
- Generic creature defenses are sufficient. Do not add new defense IDs/icons just to distinguish animals.

### 2. Numbers and local rules now chosen

| Spell | Planned rule | Unchanged details / limits |
|---|---|---|
| Flame | Base 20 at every rank; Mana **10/9/8**. | Arcana scaling and ordinary spell defenses remain. More expensive than base Ward 7 at every rank; item discounts can still create exceptions. |
| Mend | Base **24/27/30**; Mana **10/9/8**. | Alchemy scaling, end-of-exchange timing, no healing if damaged. |
| Shadowstep | **1/2/3 exchanges**, including cast. | Costs 8/10/12; attack or successful Mana recovery breaks it. Blocks Compel again. |
| Hoarfrost | Base **20**, Mana **8**, equal to revised Flame III. | Keep Arcana scaling and mutual Flame/Wildfire cancellation; no longer a 6-Mana full-power alternative. |
| Brace | **80% reduction, two exchanges including cast; Omen bypasses it.** | No immunity to hostile non-damage effects; current Mana 10. Burrow/Hide copies share the revised curve, preserving their existing shared-rule relationship. |
| Bramble | **10 base spell damage now + Bind 1 next exchange**. | Ward stops the damage and application; Shadowstep/Reflect follow shared hostile-spell defenses. Keep current Mana 10 and Alchemy scaling of damage; Bind duration is unscaled. No construct remains, so the old Heartwood coexistence bonus ends. |
| Distill (`purify`) | Existing HP-for-ready-Mana conversion, **no poison cure**. | English display spelling only; no Chinese-name change. Keep base HP price 20/Mana gain 24 and current Alchemy scaling. Do not rename the save-facing ID. |
| Tailwind | **20 base Impact damage; +10 base on each consecutive recast**. | Vigor scales the whole 20/30/40… sequence. Keep Mana 5. No inherited three-turn limit or Guard-piercing bonus from the removed Strike buff. Any different selected action resets it. Whether an unaffordable/canceled forced recast resets should match actual executed action; test it. |
| Rime | **At most one cast per encounter; explicitly permitted by Heartprice**. | Preserve rescue at 24 HP/frozen interval; unavailable after casting even before trigger. No skill scaling of fixed rescue value. Inevitable poison/Torment bypass frozen immunity. |
| Eclipse | **1× actual damage taken becomes ready Mana; three exchanges including cast**. | Capacity cap; no gain from damage prevented. Keep Mana 6. |
| Acorns | **10 base spell damage now + 10 next exchange**, Lore-scaled. | Keep Mana 3. Two magical acorns rather than the old simultaneous multi-hit mechanic. Newly cast Ward can stop each ordinary hit on its own exchange. |
| Web / Threads | **Bind 2 / Bind 1 from NEXT exchange, unscaled**. | Keep Mana 6/3. Full-action Bind and breaking-free immunity below; application is not a free uncounterable stun. |
| Maul | **30 base scheduled Impact damage**, one exchange later. | Keep Mana 5 and Vigor scaling. |
| Bough | Current **32 base**, two exchanges later; **Impact**. | Grumpy oak owns Bough; Bristleback owns Maul, so the requested different-owner condition is satisfied. Keep cost/scaling. |
| Charge | Current **24 base**, one exchange later; **Impact**. | Keep its explicit Parry/Guard-piercing property unless the author changes it; category change alone does not remove it. |
| Slow Fall | Current physical falling-bough attack becomes **Impact**. | Keep base 40, two-exchange delay, Lore scaling, Brace-piercing flag and current name. |
| The Long Wait | **24 base spell + 24 base Impact**, same scheduled landing. | Both use the existing Lore skill factor. Keep current Mana 8 and three-exchange delay; Long Wait at t plus Web at t+1 covers its landing. Retain existing Parry piercing on both components and explain it. |

Ordinary creature blows, Nip, Gore, Pinch, Swarm, Brood ticks and the existing basic attack become Impact in the interface. Category and scaling skill remain separate. Magical Acorns and Thicket remain spell damage; Long Wait explicitly combines magical constricting silk and bodily force. Roar’s 8 spell damage / 4 Mana scatter / cost 4 and beetle Flame’s 10 spell damage / cost 6 are chosen initial values. Other optional creature additions remain unselected.

### 3. Poison: decided timing, power and priority

**Two ticks: casting exchange and next exchange, each before Mend.** At t it can spoil Mend like Flame; at t+1 it spoils one additional Mend; at t+2 it has expired. There is no cure, including Distill.

**Base 6 per tick**, preserving the original Venom base total of **12 = 3 × 4 = 2 × 6**. Keep the same Alchemy skill factor. This interprets “originally planned total damage” as the observed original three 4-point ticks, not the unchosen 10+10 proposal from the preceding discussion. Equal base total and scaling are preserved; integer rounding can make the final totals differ by a small amount at particular skill values because there are now two rounded hits rather than three. Do not invent uneven remainder ticks or alter the scaling formula to force equality at every possible rounding boundary.

Ward/Shadowstep/Reflect can prevent or return the hostile **application**. Once poison has attached, its damage is inevitable: it bypasses Ward, Parry, Brace, evasion, Reflect, construct/worn reduction and Rime's ordinary frozen immunity. **Only active Lodestar negates the damage.** No defense removes the poison or pauses its timer. A prevented tick does not spoil Mend. Rime can still rescue a lethal hit under its one-rescue rule; restoring HP is different from negating that hit.

Recasting refreshes the existing poison effect instead of adding a stack. The initial tick must be processed after application exactly once, in the same end-of-exchange poison phase, so the new immediate tick is not accidentally duplicated or delayed. Both Spinner variants own Venom.

### 4. Glamour, Rapport and Sleight: scaled, separate, rounded upward

**Latest decision supersedes “unscaled / all-even payouts.”** Glamour has base Renown **4/6/8** by rank and scales with Charm. Rapport has base Renown **8**, also Charm-scaled; its **10-Crown payment does not scale**. Sleight has base theft **15**, Guile-scaled. Each keeps its own full/half/zero encounter tranches: two positive payouts at most, independent of the other spells.

For each spell, let **A = ceil(base × existing skill factor)**. First allowance is **A**, second is **ceil(A/2)**, later allowances zero. Thus the integer cap is **A + ceil(A/2) = ceil(1.5 × A)**. Using the same already-rounded full allowance for the cap and half tranche avoids contradictory independent rounding. Actual transfers are still limited by available funds/resource caps. Rounding upward permits a total half a unit above an exact unrounded 1.5× limit when A is odd; that is intentional under the latest rounding instruction, not fractional currency.

| Reference case, skill 50 | First payout | Second payout | Encounter cap |
|---|---:|---:|---:|
| Glamour I | 4 | 2 | 6 |
| Glamour II | 6 | 3 | 9 |
| Glamour III | 8 | 4 | 12 |
| Rapport | 8 | 4 | 12 |
| Sleight | 15 | 8 | 23 |

Away from skill 50, both Renown and the half payouts may be odd; the even base values no longer promise even final results. This upward rounding decision applies to these rewards/theft, not an unrequested change to all existing combat damage rounding.

Keep Glamour's Mana costs 9/7/5, Rapport's Mana cost 4 and Sleight's Mana cost 4 plus tiny alignment cost. Rapport payment is **10 Crowns on each positive-payout cast**, including its half-return second cast; require the full payment. Third-plus actions remain visible with zero reward. Do not automatically spend Crowns for zero return unless the author chooses that explicitly; ordinary cast Mana costs follow the normal action rule.

Initial edge accounting: no audience/failed application should not consume a reward tranche; successful partial theft may consume its cast tranche. Use these bounded conventions for the initial implementation and report any conflicting existing behavior; do not invent a reward framework. Use only small per-spell encounter counters/amounts, existing ledgers and the required search hash/serialization updates. AI pruning and player visibility remain separate.

Flavor: a first flourish wins attention, a second wins less, further repetition no longer impresses. Rapport's warmth/generosity should match its fixed cash expense; neither spell buys a combat surrender.

### 5. Wildfire: one repeated growth rule

**Accepted sequence**, before Arcana scaling of offensive power:

| Beat | Damage to opponent now | Self-damage now | Damage bank after beat | Release if chosen next |
|---|---:|---:|---:|---:|
| Cast | 15 | 2 | 15 | 30 |
| First Hold | 15 | 4 | 30 | 45 |
| Second Hold | 15 | 6 | 45 | 60 |
| Further Holds | 15 each | Increase by 2 each time | Add 15 each time | 15 + bank |

Keep Mana 8 to cast and 2 per Hold for the first implementation. The initial cast does everything a Hold does: hits, hurts the caster and banks power. Self-damage is a fixed 2/4/6… sequence, not automatically multiplied by Arcana. The release is **one spell hit**, entirely ordinary against Parry and Reflect; Ward prevents half, so half gets through. Brace takes 80% off the remaining applicable damage. There is no separate ember hit or Guard-piercing tranche.

Flavor: fire grows increasingly fierce and harder to hold; the caster visibly suffers its growing heat. The initial description can be one rule plus a release amount; show the live bank and next self-damage on Hold. Active Lodestar negates Wildfire self-damage under the highest-priority ANY-damage rule; HP prices remain payable. Preserve Hoarfrost’s existing fire-cancellation behavior, including its current treatment of Wildfire self-burn; do not introduce a separate change beyond the selected Wildfire redesign. Test this interaction explicitly.

### 6. Omen and scheduled damage

A successful Omen application at t schedules **20 base spell damage at t+2 and another 20 at t+3**. Ward and Shadowstep can prevent application; Parry and Brace cannot prevent it. Reflect returns the hostile application under the final reflection contract. The opponent still gets a normal current action unless some independent control effect applies.

Each arriving hit is ordinary spell damage: Ward fully blocks it, Parry halves it, Shadowstep evades it and current-exchange Reflect can return its spell damage. **Brace does not reduce Omen**, per the explicit Brace decision. Omen no longer bypasses Ward or requires only evade/Reflect. A due hit can be countered even if its original application was not.

Overlapping casts **merge into one Omen hit on a shared due exchange**. Cast at t and t+1: arrivals are 20 at t+2, **one combined 40-damage hit at t+3**, and 20 at t+4 before Lore scaling. Sum the scheduled powers for the same caster/spell/due date, then apply defenses, flat per-hit reductions and reflection once to that combined hit. Display one timeline entry with its total. This aggregation is chosen for the UI as well as gameplay.

The existing fixed-capacity pending-hit list holds only six entries. Use the chosen same-date Omen aggregation and verify capacity under Omen, Acorns and creature delayed moves; narrowly adjust the fixed capacity only if required. Do not build a general event queue. Pending entries must snapshot power and carry only enough information for the existing damage category/attribution. No random prophecy branch is needed.

Flavor describes bad things gathering or being scheduled, never certainty: “You speak of two small misfortunes; the light around your opponent falters.” The timeline gives exact dates. Result lines report whether each misfortune actually landed.

### 7. Bind, Bramble, Web and Threads — finalized

All Bind starts **next exchange**. A cast at t does not cancel, replace or refund the opponent's committed action at t. Bramble/Root/Threads Bind 1 forces Breaking Free at t+1; Web Bind 2 forces it at t+1 and t+2. Durations do not scale. Application remains counterable by Ward/Shadowstep/Reflect in the casting exchange; Parry and Brace do not stop application.

Breaking Free is the only combat action while bound. Each affected exchange consumes one bind beat. It blocks incoming Bind for that exchange, including same-exchange application that would otherwise schedule a new Bind for the following exchange. Thus neither refreshing the timer nor queuing Bind behind the current effect can form an infinite chain. Bind 2 still consumes two exchanges rather than being completely cleared by the first Breaking Free. Concession remains a separate terminal control.

Frozen actors cannot act; Bound forces Breaking Free before Compel or channel/Haste choices. Existing timers continue; a channel can remain paused rather than introducing a new cancel/resume mechanism. Existing summons and scheduled attacks continue while their owner is bound. No immediate-action rewrite, payment refund, interrupt stack or same-exchange control-priority framework is needed.

**Spinner sequence:** cast Long Wait at t, cast Web at **t+1**; Web binds t+2 and t+3, and Long Wait lands at t+3 while Breaking Free is forced. A successfully Webbed target then cannot choose a fresh defense on the landing exchange. Show these dates in the existing timeline. Lodestar's highest-priority damage negation still wins, and already-active ordinary immunity such as Rime's frozen interval retains its specified behavior against Long Wait. Do not add an immunity-bypass tag. Failed/blocked Web does not guarantee the follow-up.

Capture/replay of Breaking Free under Compel must not produce free permanent bind immunity after actual Bind ends: treat that action as legal only in its intended forced state and retain the normal illegal-replay fallback. Test both actor sides and commitment orders.

### 8. Reflect and Compel

**Reflect is decided:** one exchange, without a one-spell consumption limit. Return directly incoming hostile spells (including non-damage applications) and incoming spell damage, including **scheduled spell damage**, to their source. Do not return Impact damage, already-applied poison ticks or already-applied Torment tolls. The caster pays their own cost; only the hostile portion returns, not self-buffs or self-burn. Returned effects cannot bounce again.

Recommended player description: **“This exchange, return incoming hostile spells and spell damage to their source, including scheduled spell damage. Does not reflect Impact damage, poison ticks or Torment tolls.”** Saying only “returns spells/scheduled damage” is insufficient: scheduled Maul, Charge and Bough are Impact and must not reflect. If a shorter button phrase is needed, use **“Return spells this exchange”**, with the complete explanation in the existing selected-action description.

Reflect can return Web/Bramble Bind, Omen's initial application, and poison/Torment applications before they attach. It can return an arriving Omen/Acorns spell hit; it cannot clear or return an old ongoing curse. Pure denial/transfer effects (Extraction, Filch, Roar, Seal and a literal all-hostile-spells interpretation of Sleight) require explicit finite branch handling; no arbitrary effect-execution framework. Long Wait's spell component returns; its Impact component still lands unless another defense stops it. Lodestar negates damage before reflection; the agreed priority ladder in the detailed rules governs.

**Compel, accepted direction:** at resolution capture the target's **current committed action**, let it resolve normally, then force that exact action on the following **three exchanges**. Ward or Shadowstep blocks application; Reflect can return it. Current Mana 18 stays unless retuned. The previous-action replay, immediate rewrite and old Ward-ending-compulsion special case are superseded.

Store the captured action in a small typed spell-specific payload and update serialization/search hashing; do not keep rereading lastAction. Preserve lost-action fallback for illegal/unaffordable replays. Hold/Release/Haste captures need fixtures because a move becoming illegal can lead to three lost turns. Until the author explicitly changes it, retain the existing first-exchange Compel restriction; allowing first-exchange capture remains only a suggestion.

### 9. Lodestar, damage priority, Torment and Heartprice

**Priority is now explicit**, without adding a configurable priority framework:

1. **Active Lodestar: negate ANY damage.** Check first, including direct/scheduled spell or Impact hits, returned damage, poison, Torment, Wildfire self-damage and Contraption's mutual burst. No reflected payload or damage-triggered Mana gain is produced from negated damage. Its Ward also prevents hostile non-damage effects.
2. **Attached poison/Torment damage: inevitable.** If Lodestar is absent, bypass every ordinary defense, reflection, reduction and frozen immunity. Rime may subsequently rescue a lethal result, but does not negate the damage.
3. **Ordinary damage and hostile spells:** apply the existing frozen/evasion/Reflect/Parry/Ward/Brace/reduction rules and named piercing exceptions consistently. Reflected damage still cannot bounce twice.

Voluntary **HP prices are not damage**. Lodestar does not make Distill or Heartprice-funded casting free. This distinction avoids giving a damage-negation action an unrequested resource-payment exemption.

**Lodestar's skill is Lore.** Single cast at t, maturity at **t+7**: full damage negation plus Ward for that exchange, followed by base **20 Lore-scaled healing**. Protection starts before that exchange's damage/effect resolution. Scale healing, not the seven-exchange wait or 100% protection. Keep Mana 4 unless retuned. This is non-channeling, with the explicit one-pending limit below.

Allow **one pending Lodestar per caster in a fight**. Another cast is unavailable while pending; after maturity it may be recast. This is a pending limit, not one cast per encounter. Use the existing future-start effect slot and one explicit handler, not a general event dispatcher. Ensure five quiet exchanges cannot settle before a meaningful pending t+7 event. Its payoff exceeds common five-exchange search horizons: update existing evaluation/ordering and validate, without a search rewrite, mandatory depth increase or new model training.

**Torment:** keep three exchanges including application. Toll is **2 × actual voluntary Mana paid to execute the victim's action**, including channel Holds. Exclude stolen/scattered Mana, Refocus, flux and Heartprice's whole-pool activation conversion. HP-paid spell costs generate zero Mana toll. Application is counterable by Ward/Shadowstep/Reflect; attached toll follows priority 2 and only Lodestar prevents it. Actual toll interrupts Mend and counts for Eclipse's 1× damage-to-Mana rule. These existing interactions need tests, not a new resource system.

**Heartprice:** convert all ready Mana to HP at 1:1 on activation, capped by max HP, then retain the existing long-lived **1 HP per 2 nominal Mana** spell-payment conversion. No activation flux. Later ordinary healing is disabled, **but Rime is explicitly allowed**. Rime's one-cast/one-rescue/frozen behavior remains; poison/Torment can still hurt during the frozen interval because their priority is higher. Mend, Heartwood healing, Siphon healing and Lodestar healing remain suppressed. Lodestar protection is unaffected by the healing lock.

Make repeat Heartprice unavailable so the one activation healing conversion cannot be repeated. Existing interpretation still empties ready Mana once rather than enforcing permanent zero Mana; existing flux is not erased. Refocus/Distill/Eclipse can restore Mana later, although HP funding continues. This preserves a one-time activation depletion rather than introducing a permanent resource lock. Creature no-healing policy remains intact.

### 10. Haste: Countertempo selected

**During active Haste, casting any spell with no inherent damage, no scheduled damage and no channel requirement adds exactly one automatic Impulse.** Keep ordinary single-action choices. There is no second selection, arbitrary action bundle, additional spell or increased action branching. The added hit is normal Vigor-scaled Impact and uses normal counters.

Classify the spell's inherent payload, including its lasting/summoned effects, **before** adding the Haste hit or incidental equipment damage. A damaging spell remains ineligible when blocked, and a failed/no-op qualifying spell does not become ineligible merely because its normal effect changes nothing. Otherwise Ward, resource caps and opponents' choices would unpredictably change Haste's menu promises. The attached Impulse never recursively triggers Haste.

| Classification under the planned rules | Entries |
|---|---|
| Qualifies: no inherent damage or damage schedule, not a channel | Foresight, Mend, Glamour, Haste recast while already active, Shadowstep, Ward, Heartwood, Seal, Sleight, Candour, Brace, Quickquill, Index, Rapport, Distill, Rime, Reflect, Extraction, Compel, Eclipse, Heartprice, redesigned Lodestar. |
| Qualifying creature spells if a creature actually has Haste | Filch, Root, Web, Threads, Skitter, Fade, Burrow, Hide, Bark, Carapace. No new Haste grants are implied. |
| Does not qualify: direct, inevitable, scheduled or summon damage | Flame, Bramble, Hoarfrost, Tailwind, Omen, Acorns, Venom, Torment, Animate, Contraption, Brood, Thicket, damaging creature attacks and redesigned Roar. |
| Does not qualify: channeling | Starlight, Wildfire, Moonwell, Siphon, and their Hold/Release actions. |
| Not castable | Toll keeps its story-only restriction and cannot trigger Haste. |

**Spell-only trigger:** Impulse, Parry and Refocus are basic actions and do not trigger Countertempo. Use the eligibility rule above rather than the abandoned earlier basic-action whitelist.

Haste lasts **2/3/4 future exchanges** by rank; keep its Mana costs **5/5/5**. Rank III gains duration instead of a discount. The initial cast does not trigger itself; a recast while Haste is already active may trigger once. Heartwood qualifies; offensive summons do not. Redesigned Lodestar qualifies when cast, not again on maturity.

An automatic Impulse is an attack, so it breaks Shadowstep before hits, even when attached to Mend or a defensive spell. Thus Haste plus Shadowstep/Mend no longer grants a protected heal without exposure: a real consequence to explain, not a bug to conceal. Reflect qualifies because it returns incoming damage rather than carrying its own damaging payload; Distill's HP price is a cost, not offensive damage. Poison/Torment remain ineligible even if no damage happens on a particular cast. No final scaling adjustment, HP surcharge or setup Parry from the unchosen Haste alternatives is added.

Implementation remains local: a single eligibility helper for the finite roster, ordinary legal action selection during Haste, and one existing basic hit appended to the attack queue. No general trait system or programmable spell framework. Search hashing can keep using the existing timed Haste effect; update move ordering/evaluation/no-op pruning so eligible casts are not discarded merely because their original spell effect is capped or irrelevant. Test both commitment orders and interactions with a blocked/replayed cast, Compel, same-exchange new Shadowstep and gear-triggered hits.

### 11. Creature ownership and planned spell-damage coverage

The existing ownership columns come from current **fixed creature kits**; the weaker Flame addition is explicitly marked as planned. Numbers in parentheses are unlock levels, not ranks or newly proposed tuning. Human special foes—Thornwitch, Masked circle and the Outcast—are not creatures and already have ordinary spell offense/defense.

| Creature | Owned moves | Existing defensive spell(s) | Planned spell-damage coverage / decision |
|---|---|---|---|
| Shadow stag | Gore, Fade; Brace (15), Tailwind (30) | Fade; later Brace | Gore/Tailwind are Impact; no additional spell selected. |
| Practice mannequin | Flame; scripted basics | No defensive spell; scripted Parry is a basic | Keep tutorial script. Do not add a spell solely to complete a defense checklist. |
| Bramble ferret | Nip, Skitter; Filch (5), Burrow (10) | Skitter; later Burrow | Keep Mana theft and Impact Nip; no extra damage component selected. |
| Bristleback | Maul, Hide; Roar (10) | Hide | **Chosen:** **8 base spell damage + scatter 4 ready Mana**, Mana cost 4, Vigor scaling. Tune later in the balance pass. |
| Stag beetle | Charge, Carapace, Pinch; weaker Flame planned | Carapace | **Chosen:** weaker Flame, **10 base spell damage for 6 Mana**, Arcana-scaled. Reuse Flame label/art and magical mandible-discharge flavor; Charge/Pinch remain Impact. Tune later in the balance pass. |
| Grumpy oak | Root, Bough, Bark; Acorns (10) | Bark | Bough Impact; magical Acorns gives spell pressure from level 10. Keep unlocks. |
| Elder oak | Root, Slow Fall, Bark, Acorns; Thicket (10) | Bark | Slow Fall becomes Impact; Acorns and the unchanged Thicket already give spell damage. No addition needed. |
| Spiderling swarm | Swarm, Skitter, Threads; Burrow (10) | Skitter; later Burrow | Impact swarm pressure plus magical Bind is enough; do not force spell HP damage into every small creature. |
| The Spinner | Venom, Web, Brood, The Long Wait, Carapace | Carapace | Poison and Long Wait's explicit magical-silk half provide spell damage; Brood is Impact. Timing/guarantee choice above is more valuable than another move. |
| The Spinner, weakened | Same moves as the Spinner, starts at 60% HP | Carapace | Same changes; preserve story handicap and all moves. |

**No ordinary non-tutorial creature currently lacks a defensive spell.** Therefore no defensive additions are necessary now. Future missing-defense kits should reuse Ward/Brace/Shadowstep or existing copies at an appropriately inefficient cost; do not add low-cost universal defenses merely because a creature has a large HP pool. Current Bark/Carapace are cheap at 3 Mana; the author's comment does not automatically authorize repricing every existing defense, so preserve them until a balance decision.

**Creature numbers are chosen for implementation:** Roar is 8 damage + 4 Mana scatter at cost 4; beetle Flame is 10 damage at cost 6. They will be revisited in the balance pass, not treated as measured balanced values. No additional creature spell/defense expansion is selected. Record any new magical trait through the existing worldbook.

A weaker beetle Flame needs its own numbers without weakening player Flame. The current kit modifiers do not expose a simple per-spell power reduction. Prefer **one creature-only data entry using the existing generic direct spell-hit path**, reusing Flame’s displayed name/icon/flavor as appropriate. This adds a roster row, not a new mechanism; avoid building a per-kit spell-variant framework or silently weakening every beetle spell/skill. No new proper spell name or icon art is required. A hypothetical internal ID remains an implementation choice, not an existing API.

### 12. Local implementation boundaries and later verification

This is not all roster editing, but it need not become a framework project:

| Change | Bounded work allowed by this plan | Excluded expansion |
|---|---|---|
| Costs, base values, durations, names | Existing roster/content numbers, generated data, text and i18n paths; content changes through project migrations. | New tuning DSL, renamed save-facing IDs, different card/combat Mana scales. |
| Rewards / one-cast Rime | Small per-spell encounter counters and proper hash/serialization; existing resource transfers. | General achievement/reward engine. |
| Full-action Bind | One Breaking Free action, existing timed Bound effect, local control ordering and immunity. | Interrupt stack, input minigame, speed/initiative subsystem. |
| Reflect hostile effects | Explicit target handling for current finite hostile branches, one-bounce guard, existing hit reflection. | Arbitrary effect execution/copying framework. |
| Omen/Acorns and mixed creature hits | Existing pending-hit list, bounded entries and damage-category information, due-hit accounting/UI. | General timeline/event scheduler. |
| Lodestar | Future-start existing effect, one explicit maturity case, common local damage-negation check including toll/poison. | Generic programmable scheduled effects. |
| Wildfire/Tailwind/Compel | Existing channel count/bank, small consecutive-use state, fixed captured-action payload and move hashing. | New combo language, arbitrary action sequences. |
| Haste | Selected Countertempo: finite intrinsic-eligibility helper and one automatic basic hit from a normal single spell action. | Selecting or composing multiple arbitrary spell actions, a general trait framework, or extra bonus-spell menus. |
| AI | Update impacted ordering, no-op rules, hashing and evaluation features within existing search. | Algorithm rewrite, mandatory deeper searches, new model training. |
| Flavor/UI | Existing names, actors, context, timelines, spell briefs and locale tooling. | Indoor/location detection or new environmental context wiring. |

If a requested edge case would require one of the excluded expansions, leave it unresolved and choose a bounded alternative in discussion; do not relabel a framework rewrite as a bug fix. The concrete defense-order asymmetry, stale descriptions, inconsistent hit totals, copied spell attribution and premature quiet settlement are the kinds of narrow bugs that do remain in scope.

Later fixtures should check both actor sides and both commitment orders; cost equality; full/half/zero reward limits and partial theft; poison at t/t+1 versus Mend; Brace exclusion for Omen; no Bind refresh during Breaking Free; next-exchange Web/Threads timelines; mixed Long Wait impact/spell defenses; Ward/Shadowstep/Reflect against application and later hits; Wildfire cast=Hold and growing self-damage; Rime one-cast; Heartprice against every restoration path; mature Lodestar versus toll/poison and quiet settlement; and AI/native/wasm consistency. Golden snapshots must represent intended gameplay changes, not conceal accidental differences.

**Validation status:** this plan has been checked for roster coverage, arithmetic examples, ownership and internal consistency. Its revised gameplay has not been implemented, simulated or balance-validated. Run the focused fixtures and project checks below during implementation.

## Compatible clarity fixes and delivery checks

- Fix side-dependent same-exchange Ward/Shadowstep/Reflect application order. New defensive commitments must work symmetrically against statuses and Mana denial.
- State construct lifetimes, immediate/final ticks, replacement and the fact that break thresholds measure damage to the summoner, not separately targetable minion HP. Keep every unchanged summon’s profile. Bramble’s old summon pairing is retired.
- Report actual blocked/reflected/landed results; a scheduled attack arriving does not establish that it hit. Attribute every delayed move under its own name/icon.
- Use “exchange” consistently, fix singular/plural templates and split-hit totals, and distinguish associated skill from actual scaling. Rime’s fixed rescue remains 24, not obsolete 1-HP event prose.
- Show independent reward limits/rounding, current Wildfire bank and next self-damage, pending Lodestar maturity, and current Compel capture/repeats. Keep no-effect actions visible and player text separate from AI pruning.
- Preserve all unchanged costs, skills, content IDs, forbidden-cast consequences, creature no-healing policy, worldbook canon and existing integration contexts. Do not create new location-aware text or mechanically implied statuses.
- Apply content changes through existing migrations; synchronize English/Chinese using the normal locale tools, except Distill explicitly keeps its Chinese name. Rebuild generated bundles after actual implementation.
- Run meaningful focused combat fixtures, native/wasm parity checks and integration tests first. Before delivery, follow the project-required `node tools/grim.js check` and `npm run verify`; inspect intended golden changes before refreshing baselines. Use existing balance tools for a separately scoped tuning pass. No unsolicited commits, pushes, deployments or costly sweeps.

**Remaining implementation choices** are bounded engineering details, such as the internal ID of the beetle-only Flame data row and exact serialization defaults for new local state. They are not invitations to reopen the accepted gameplay. If an unforeseen contradiction cannot be resolved without changing that gameplay or adding a framework, report it before proceeding.
