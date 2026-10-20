# Combat spell redesign v2 — implementation checkpoint

**Current economy: 0.4.6.** The [economy and pacing report](minigame-combat-v04-economy-findings.md) supersedes the historical scaling/prices below. Final amounts use `0.75 + skill/200`, HP is current Health + 10 + 2 × encounter level, Guard blocks two thirds of physical damage, and constructs have finite lifetimes. The current rulebook has the full roster.

Implemented for the standalone combat prototype on 2026-10-16. Live preview: <http://127.0.0.1:61040/>. Quickstart presets: `?quickstart=20`, `50`, or `80`. Durable source is `experiments/minigames/iterations/v04/`; the previous combat iteration and its immutable result/source snapshots remain available.

The supplied roster replaces the old twelve-spell combat roster: **24 named spells, five hidden-pool entries and six forbidden spells**. Toll is story-only, so there are **34 legal combat casts**. The six course spells have three levels; all others have one. Ward is included in every preset kit. Extra acquisition sources, card verbs, learning-XP assignments and supplied negotiation effects are recorded in spell metadata, without migrating the campaign or the separate negotiation prototype.

The [combat rulebook](../experiments/minigames/iterations/v04/rulebook.md) is the detailed specification of the implementation. It distinguishes supplied mechanics from provisional skill assignments, scaling and edge-case ordering. In particular, unspecified pool skills are provisional; amount scaling uses `0.5 + skill/100`, physical scale 3, damage multiplier **0.5**, and Mana prices ×1. Damage rounds up before and after defenses; displayed spell damage includes skill/scaling before defenses. Healing/shields and voluntary HP prices are unchanged. These choices were exposed for user feedback and can be revised without treating them as canon.

## Reclaim exposure (0.4.4)

Reclaim now breaks Shadowstep before the current exchange's attacks when flux can actually restore Mana. This includes Haste bundles containing Reclaim; other defenses still apply. Empty flux, a full Mana pool, or flux erased by Seal does not break evasion. Mana collection retains its existing post-primary-damage timing.

The [random-loadout study](minigame-combat-v04-random-findings.md) runs 320 fights on four worker threads, audits 33,308 decisions, and benchmarks sequential AI latency. It records substantial defensive/resource cycling and tests deeper/fallible continuations without changing gameplay rules. Reusable runners and frozen evidence are linked there.

The combat interface also embeds the supplied action artwork: Strike/Guard/Reclaim, Cast/Concede, and ten spell-specific Hold/Release icons. Haste bundles compose their basic-action SVGs. Artwork follows `docs/spells-v2-icons.md`; rules and simulation results are unchanged.

## Fixed spell gains (0.4.3)

The latest rule replaces spell-acquisition rolls with a fixed ladder. Ward unlocks at 1; Flame at `max(1, ceil(25 × (1 − flameBase)))`, universally by 25. Generic course slots are 1/15/40/65, extras 45/70, underground forbidden slots 35/80. Named guarantees, place spells and study-year promotions remain. Preferences choose a permanent order, with zero weights prohibited. Skill jitter alone remains level-seeded. `unlockLevels` is exported; exhaustive checks confirm no preset loses spells as level or year rises, including low levels. The new rule supersedes the stochastic/nested acquisition details in the historical 0.4.2 notes below. Final checks: **94 unit tests**, **77 browser cases**, **189 layout checks**, zero page errors. All preset level/year transitions retain learned spells. The twelve short AI smoke games replayed all 144 legal decisions from frozen sources; all were unfinished at their explicit 12-decision work budget, with no fake draw or settlement. Final functional evidence is in `experiments/minigames/results/v04-20261016-fixed-gains-check/`, with simulation traces in `v04-20261016-fixed-gains-smoke/`. Final `grim check` passed in an isolated copy. Full project verification also passed during the loadout migration, including 122 campaign tests, 120 unchanged golden games and its browser playthrough; subsequent spell-ladder refinements were checked with the focused tests and `grim check`.

## Loadouts and supplied artwork (historical 0.4.2 migration)

Applied `docs/spells-v2-loadouts.md`: nine generic and 22 named presets, deterministic generation with preset salts, independent skill shapes, level-gated weighted spell picks, course ranks at 44/68, underground restrictions, named guarantees, prodigies, study years and Ilse's fixture flag. Controls, configuration, generator API, adapter metadata and exported kit IDs now use **loadout**. Random selects from the nine generic presets.

Growing named characters use the design's optional nested ordering because fresh level rerolls caused spells to disappear as level/year rose. Canon stat ratios are preserved in the bench, using the named encounter stat as the level reference; fixed faculty/villagers use worldbook skills and the mean of their two best skills as level. The worldbook stat snapshot is explicit and hash-tested. The man in grey has no NPC stat block, so neutral L-valued skills are marked provisional; faculty preference lists without weights use equal weight 1. See the rulebook for these fixture assumptions and the exact sampling rules.

All 35 supplied SVG spell icons are embedded from `docs/spell-icons/`, with the dark preview stroke replaced by currentColor. Inner shapes, special fills, opacity and dashes are preserved. Distil maps to `purify`; basic actions retain temporary monograms. The full picker still fits 320×568.

The older validation sections below describe their named versions. New loadout/icon checks are in `experiments/minigames/results/v04-20261016-loadout-design-check/`; earlier rename-only checks and simulations remain separate.

## Implemented mechanics

- Unlimited exchanges; knockout or concession ends the fight. A structural inability to damage on both sides draws. Repeated Guard choices alone do not draw. Simulation work limits censor unfinished fights without settlement.
- Two-thirds flux; Guard blocks all Strike damage and one third of spell damage. Ward covers the next damaging action, including an entire Haste bundle, with one-third Starlight penetration.
- Public channel starts with unrestricted Hold/Release timing, ongoing costs and banks; ordinary commands are unavailable while channeling. Haste commits a unique basic-action bundle rather than creating extra turns.
- Skill-scaled damage, healing, Mana amounts and reductions; fixed durations/counts/economic conversion ratios. Mend, Distil (`purify` id retained), Tailwind and the new resource spells use their assigned skills.
- Untargetable constructs, deterministic exchange-end actions, reduction per hit, cumulative actual-damage expiry, Heartwood/Bramble coexistence and Contraption ending bursts. No construct commands or target menus are added.
- Public Omen scheduling; Shadowstep's damage/Mana breaks; Rime's once-per-fight freeze; one-bounce spell reflection; deterministic public-history Compel; forbidden HP/Mana economy and alignment costs.
- Observer-dependent Renown, independent starting Crowns, theft conservation, nonrefundable Crowns/alignment and actual capped gains in settlement ledgers. Witnessed forbidden casts export post-fight follow-up records. No story scenes, plot clues or arc progress are invented.
- One shared basic/spell icon grid with Mana badges, single-click previews and repeat-click execution of the selected action/spell; a dedicated last-opponent-action display and separate action-history Log; seeded Random opponent archetype/loadout; public channel/construct/Omen status, Hold/Release controls, Haste bundles, observer/wallet setup and four AI profiles in the compact combat interface.

## Damage/UI adjustment (0.4.1)

The current build halves outgoing damage globally before rounding up, including Torment but excluding voluntary HP prices. Setup exposes the multiplier. Every attack preview uses the resolved scaled amount; Guard and other defenses then apply and round remaining damage up. Reflections do not apply scaling twice. Channel Hold/Release and construct bursts have numerical previews too. Names remain accessible through selection, labels and tooltips while mobile icons use monograms.

The older 0.4 simulation results below are preserved as historical evidence. They do **not** measure balance under the new 0.5 multiplier. The new checks live in `experiments/minigames/results/v04-20261016-damage-ui-check/`; the frozen earlier release snapshot remains unchanged.

## Validation

Current 0.4.1 checks: **87 unit tests** across the shared harness and inherited combat suites, including **44 v04 tests**, passed. New tests check all affected damage sources, post-defense ceiling, reflection without double scaling, unchanged healing/prices, final numerical previews and deterministic Random opponents. **45 browser cases and 158 layout checks** passed with no page errors. They cover every cast, full 38-icon view, native double-click casting exactly once, last-opponent-action display, channel names, long history scrolling and fixed-seed loadout replay. A 320×568 screenshot is preserved with the checks. These are functional checks, not a new balance experiment.

Project `grim check` and **full `npm run verify` passed** in a fresh isolated copy for 0.4.1. Verification includes 122 campaign tests, zero balance invariant failures (five advisories), 120 unchanged golden games, and the English campaign browser playthrough plus event previews. The browser played 48 months and stored all 649 cards with no unresolved entries. Logs are preserved with the current checks; shared campaign build outputs were not written.

### Historical 0.4 release validation

The inherited harness/v01/v02 plus v04 suites pass **84 tests**. New tests cover every cast, cross-spell interactions, uncapped exchanges, resource conservation, legal/forced actions, state isolation, exact small-tree minimax values and bounded reproducible AI degradation. Small source trees are compared against unpruned minimax for normal, channel, Haste and Foresight decisions.

The browser suite exercises all 34 combat casts, every channel Hold/Release flow, Haste, observer reports, every preset and all four actual AI profiles. It also checks the complete 35-entry catalog in a stressed gameplay state with two constructs, Foresight, observers and alignment visible. It checks 320×568 and 375×667 viewports, keeping debug separate. **42 browser cases and 139 layout checks passed with no page errors**. Full catalog/interaction views fit 320×568; the actual-AI profile views also pass at 375×667.

The small integration panel uses all three presets, both initial commitment orders and kit/all-spell access, with mirrored Evoker kits and observers. Search is deliberately bounded at **2 exchanges / 1,500 nodes** for this smoke panel, distinct from the UI's default **3 / 5,000**. It is not a cross-kit balance experiment. Source hashes, exact configurations, actions, executed Compel replacements and replay audits are preserved in `experiments/minigames/results/v04-20261016-release-check/`. All 412 committed decisions replay legally from frozen sources, and all 96 settled resource rows reconcile. Those frozen core hashes identify the previous 0.4 source, before the damage/UI adjustment. Browser source snapshots, checks and project verification logs are preserved beside that run. Early intermediate smoke directories remain unchanged rather than being overwritten.

The release-check panel recorded eight knockout endings and four fights unfinished at the 48-decision work budget. Unfinished all-spell cases fell into alternating Strike/Guard play after spending heavily on opposing Compels. They still had damage/resource options, so the engine correctly did not declare a structural draw. This exposes conservative policy/resource cycling for future balance work; it is not evidence that all optimal-play stalemates have been solved. No claim of final balance or human-equivalent AI is made.

Project `grim check` passed in an isolated copy. The full project verification passed lint/format/docs checks, **122 campaign tests**, balance with **zero invariant failures** (five advisories), and **120 unchanged golden games**. Its final campaign browser playthrough timed out waiting for `#beginMonth` to become stable. That is a limitation of this verification run: it does not constitute a full `npm run verify` pass. The campaign files and generated shared build outputs were not changed for this implementation.

## Reproduce

From the project root:

```sh
node --test experiments/minigames/harness.test.mjs experiments/minigames/iterations/v01/engine.test.mjs experiments/minigames/iterations/v02/engine.test.mjs experiments/minigames/iterations/v02/ai-degradation.test.mjs experiments/minigames/iterations/v04/engine.test.mjs experiments/minigames/iterations/v04/ai.test.mjs experiments/minigames/iterations/v04/adapter.test.mjs
node experiments/minigames/iterations/v04/build-browser.mjs /private/tmp/combat-spells-v2-new
node experiments/minigames/run-v04.mjs --out /private/tmp/combat-spells-v2-smoke-new
node experiments/minigames/validate-v04-run.mjs /private/tmp/combat-spells-v2-smoke-new
```

Run `node server.mjs` inside the generated directory, then pass its localhost URL to `iterations/v04/browser-smoke.mjs --url ... --out <new-json-path>`. No results are silently overwritten. The separate negotiation and campaign learning/story work can consume the roster's metadata in their own iterations.
