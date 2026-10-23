# Proposed second mechanics iteration (not yet active)

Historical design note: response effort and the Gold trail were subsequently implemented. The Ward strain proposal was tried and then superseded by the user's explicit no-benefit Ward constraint. Read `STATUS.md` for current rules and evidence.

Observed after 20 seeded parameter/effect proposals and expanded screens: proposal 7 has sensible ordinary win rates (98/144, 68.1%) and broad-access wins 18/24, but ordinary spell use is 73.4% Ward. Its effective ordinary spell count is only 2.24, so it fails the variety goal. Full screening traces remain in `results/variety-tune-01/`.

Next changes should create missing tradeoffs rather than inflate entropy by renaming equivalent spells:

1. Add configurable response Resolve effort (0/1/2 in automatic proposals). This creates a reason to preserve/restore Resolve even in successful meetings; personal presentations already restore it on acceptance. Continue to allow zero-Resolve play with fatigue, and never let a cast underpay a declared Resolve cost.
2. Add configurable rejection Resolve surcharge to Ward. It can protect Suspicion by accepting strain, allowing Brace or recovery to matter. Search must compare that trade rather than receive free rejection insurance. Screen surcharges 0/2/4; keep the free-insurance version as an explicit control, not an undisclosed baseline change.
3. Explicit crown concessions add one Suspicion on acceptance (a visible bribe trail). Sleight conceals that trail but itself raises the usual one casting Suspicion, while halving payment. Therefore all-out can pay directly and Frugal can spend Mana to save crowns at comparable Suspicion. Other ordinary cards and payment availability remain unchanged. Test these are configured concession cards, not universal bribery.
4. Include source-specific audiences, unequal player signals, low entry resources, and conditional payment encounters in expanded testing. General-pool equal-stat screens alone cannot show whether Index, Animate or Sleight have situational value.

Before further balance conclusions, inspect the in-progress deeper-search audit of the frozen first-round champion. Separate value-estimation error and uncompleted depths from mechanical dominance. Do not select final parameters on independent validation seeds.
