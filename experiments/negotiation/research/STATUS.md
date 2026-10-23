# Negotiation experiment · current iteration 8

The current task expands spell kits/ranks, restores combat Mana prices, adds resource-restricted simulation policies, and halves named-signal versus opponent-DC check sensitivity. No automatic effect tuning has been resumed. The earlier broad research goal remains paused and is not claimed solved.

- Default source: Arguments 8 / gentler-gap-8. Twelve / twenty-four / thirty-four spells at levels 20 / 50 / 80; late game includes every player-castable spell.
- Mana costs/capacity/rank thresholds: research/combat-canon.mjs; root schema.mjs stays the legacy oracle snapshot. Do not silently refresh either during a study.
- Probability: .58 + .013 * (.5 * (signal - opponent DC) - argument DC) + spells - fatigue. Card spread and Agreement targets retain their previous scaling.
- New policy variants: dumb (compulsory affordable Health/Gold requests, no spells); hyper-frugal (unlimited Mana with canonical virtual bills, no Health/Gold); ignorant (neither spells nor Health/Gold). Ordinary choices still use All-out search. The play UI retains its three existing resource objectives.
- Runtime: Rust/Wasm; native batched simulation and full-tape replay. Every completed main-study final state is compared exactly with replay.
- Current benchmark: results/gentler-gap8-main-01/; stronger paired subset gentler-gap8-strong-01/; 50 ms timings gentler-gap8-timing-01.json. Previous complete canonical-progression v7 results and report remain preserved. canonical-progression-main-01 is stopped and excluded.
- New final report: REPORT-gap-8.md; paired comparison: GAP-COMPARISON-8.md; standalone rulebook: rulebook.md, generated with write-rulebook.mjs.
- Live preview metadata is authoritative in ../hosting-local.json. Remote preview was not updated; the user explicitly chose local hosting.
- Validation: 23 research tests and 28 legacy tests; 1605 transition, 102 spell-rank and 12 search goldens. New regression proves the skill/DC gradient is halved while argument-DC sensitivity stays unchanged. No main-game files/commits are part of this work.

Treat bounded sampled search as a reference policy, not a global optimum. Spell availability does not establish equal spell value; use the action and spell tables and stronger-search comparison. Loss-ending Flame casts can be alphabetical surrender ties; flame-audit.mjs checks them against Withdraw. The cooperative 50 ms browser search has setup/serialization overhead; host Wasm timings do not measure a physical phone.

Completed: 6,912 main games plus 384 stronger-search games. Every main tape replayed to an identical full state. The paired config check confirms all 6,912 setups differ from v7 only by the level-gap factor and version label. Final local server session 26983 serves results/testplay-gentler-gap8-20261021/ on port 55918; keep it running. Archive and file hashes are recorded with the build. Phone proof: gap8-phone.png (320x568, 34 learned spells and selected Compel). Viewport reset; browser5/tab2 marked deliverable at quickstart20. All benchmarks have finished.
