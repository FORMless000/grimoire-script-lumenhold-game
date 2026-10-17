# Origin design — final scope

Finalized 2026-10-16. Implemented 2026-10-16: presets in `content/core/balance.grim`, origin states in `content/states/states.grim`, funding cards in `content/events/origin_funding.grim`, `term_gpa` in the language; final amounts still need a playtest. This replaces the broader origin ideas discussed in chat. Keep the five existing origins, their IDs, and the shared home map. Add only money-related events; no new obligation, reputation, family, or home storylines.

## Starting profiles

Numbers below are actual starting skill levels, not XP bonuses. Unlisted skills keep the base values in `content/core/rules.grim`. Preserve the existing noble Renown and hedge Mood bonuses. Add no other starting penalties or mechanics.

| Existing origin | Starting skill overrides | Total starting crowns, before charges |
|---|---|---:|
| Noble (`origin_noble`) | Charm 25, Lore 12 | 90 |
| Scholarship (`origin_scholar`) | Lore 28, Arcana 12 | 60 |
| Witch-raised (`origin_hedge`) | Alchemy 30, Arcana 15, Lore 6 | 45 |
| Street-raised (`origin_street`) | Guile 30, Vigor 18 | 38 |
| Trading heir (`origin_merchant`) | Charm 25, Guile 15 | 150 |

Cap starting skills at 30. Calibrate origin XP grants to reach these levels within the engine's two-decimal precision; do not mistake an XP amount for a level increase or change general skill growth/check difficulty. Witch-raised practical expertise and limited formal theory are represented by skills and description only. Street-raised obligations and past-related scenes are outside this scope.

The existing `choose_origin` event supplies the initial money, before first-term charges. With the current base purse of 30, its additions are respectively 60, 30, 15, 8 and 120 crowns. Starting totals are inclusive, not extra grants on top of today's origin gold. Remove origin gold from state `on_add` and monthly `tick` effects. Remove the scholarship's initial `study` grant, which currently runs before enrolment and prepares no courses.

## Money after the first term

All origins pay the ordinary 16-crown tuition. Remove noble/merchant exemptions and the scholarship half-price rule; support is visible cash supplied by events. Other fees and board rules remain unchanged.

| Origin | One funding event per incoming term, terms 2–8 |
|---|---|
| Noble | Guaranteed 60 crowns, regardless of grades or response. Independent 30% chance of an additional 15-crown family gift. The accompanying expectations cost Mood `small` (currently 8), including when a gift arrives. |
| Scholarship | Most recently completed term GPA below 3.0: zero. GPA 3.0 to below 3.5: 60 crowns. GPA 3.5 or higher: 68 crowns, including an 8-crown `small` merit bonus. A qualifying later term restores support automatically. |
| Witch-raised | No recurring origin payment. |
| Street-raised | No recurring origin payment. |
| Trading heir | 70% chance of 120 crowns; otherwise zero because the trading period went badly. Independent rolls each term. No guaranteed tuition payment outside this event. |

Noble support is dependable with emotional pressure; company support is larger but unreliable. Expected support is 64.5 crowns per term for noble and 84 for the trading heir, before noble Mood costs. Scholarship support reaches 68 when earned. These are arithmetic expectations, not simulation results. A standard four-month term currently costs 56 crowns in tuition, board and course fees, excluding personal spending; first-term and later-course-fee exceptions still apply.

## Timing and event format

Use three recurring scheduled funding events, one each for noble, scholarship and trading heir. Each resolves once per incoming term, with automatic receipt and a single continue option. Payment must not depend on choosing a response or returning home. Resolve the merchant/gift roll once and retain the result across save/reload.

Pay in the last break month before the funded term: turns 6, 12, 18, 24, 30, 36 and 42. This precedes the next term's automatic tuition and board charges; new-term card priority cannot outrun those hooks. Do not pay at final graduation or introduce another first-term payment.

Use the same money event for failed/suspended awards, so the player sees why no money arrived. Noble expectations appear only in its payment letter. Each payment outcome needs at least three matching text/outcome variations, plus early-/late-year phrasing. Variations must fit the actual award and must not imply inventory items or an additional storyline.

## GPA and implementation boundaries

Scholarship renewal uses the latest **completed term**, including its appeals; never the cumulative `gpa` identifier. A completed term with no graded courses does not qualify. Preserve cumulative GPA for all existing systems. First-term support is unconditional through the starting package.

The existing engine has cumulative GPA only. Implementation therefore needs a small generic language addition for completed-term GPA, with term-associated grade records and appeal handling. Do not substitute a character-specific engine rule or a change in the meaning of `gpa`. Follow the existing schema-v1 addition workflow in `AGENTS.md`.

Keep payout amounts, odds and starting grants in named presets/balance definitions; author event effects with tiers and presets. Update origin descriptions, money summaries and hints to match. Preserve existing IDs, translate changed/new strings, and rebuild the committed bundle. This design does not change the existing generic home/letter cards or add any other events.

## Acceptance checks for implementation

- Assert initial skill levels/purses after origin selection and before charges; verify no duplicated monthly or tuition support.
- Check all seven funding dates, off-campus delivery, save/reload, and no graduation payment.
- Check scholarship boundaries below/at 3.0 and 3.5, no grades, suspension/recovery, latest-term versus cumulative GPA, and appeals.
- Check both merchant outcomes and noble gift outcomes; a bad trading period really pays zero, while noble base support stays unconditional.
- Run the existing content checks and origin economy comparison, including a consecutive merchant payout failure scenario. Review the intended gameplay diff and refresh its baseline only during implementation. Final amounts require playtest confirmation.
