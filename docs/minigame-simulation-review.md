# Minigame baseline evidence and fetched inspirations

Status: research checkpoint, 2026-10-14. **Design selection is paused at the user's request.** This records observations and questions for the next discussion, not replacement rules or a v02 implementation. The existing [prototype rulebook](minigame-prototype-rulebook.md) remains the v01 reference; the production design's minigames remain tentative.

## Observed baseline

The [simulation bench](../experiments/minigames/README.md) completed **54,912 matches**, covering 1,218 case configurations with 32 episode seeds each and both combat seats where appropriate. Recorded sources, raw matches and tables are in `experiments/minigames/results/v01-20261014-benchmark/`. Episode randomness changes checks only; encounter kits and archetype variation stay level-seeded.

At level 50, aggregating the six mirrored archetypes:

| Focal policy versus opponent policy | Full win | Partial | Eight-round timeout |
|---|---:|---:|---:|
| Scripted versus scripted | 14.1% | 63.0% | 97.4% |
| Greedy versus scripted | 76.3% | 20.6% | 87.5% |
| Reactive versus scripted | 55.7% | 36.2% | 97.9% |
| Rush versus rush | 49.7% | 0.5% | 0.5% |
| Greedy versus greedy | 37.8% | 24.5% | 33.3% |

Interpretation: v01's scripted play frequently stalls, and a simple immediate-value heuristic substantially outperforms it. Many wins are timeout adjudications. This supports investigating the offensive/defensive tempo and end condition before adding further actions. It does not establish that greedy play is optimal or that tells themselves cause shallowness.

For mirrored level-50 kits and greedy policies, shifting all six focal skills while preserving ranks, capacity and budgets:

| Skill advantage | Full win | Partial | 95% episode-cluster interval for full win |
|---:|---:|---:|---|
| −10 | 0.3% | 0.8% | 0.0–0.8% |
| −5 | 5.2% | 14.1% | 2.9–7.8% |
| 0 | 37.8% | 24.5% | 34.4–40.9% |
| +5 | 80.7% | 14.1% | 75.0–86.5% |
| +10 | 99.0% | 0.8% | 97.4–100.0% |

The accuracy-only diagnostic, keeping initiative unchanged, still gives greedy full-win rates of 0.3%, 6.0%, 37.8%, 79.9% and 99.0% at those respective gaps. The main cliff therefore survives removing the initiative change. Rush is more sensitive to initiative: at +5, full-win rate falls from 93.8% with all skills shifted to 83.1% when only checks change. The current 2.5-percentage-point check slope and repeated checks warrant review; no replacement coefficient has been selected.

Actual level changes are a separate test. Level-50 greedy focal actors versus mirrored archetypes five levels lower win 71.1%, compared with 80.7% in the isolated +5 skill shift. Seeded differences can materially change results, so a level is not simply a scalar difficulty modifier.

In the information panel, greedy full-win rate is 79.2% blind and 80.2% with native tells or exact intent; reactive is 61.5% in all three information conditions, although its timeout rate changes. These policies do not demonstrate a large payoff from more detailed current tells. This is limited evidence about these heuristics, not a general finding about hidden information.

Negotiation also responds strongly to audience policy and fixture. At level 50 in the formal petition, the deceiver policy wins 34.6% against the skeptic and 62.0% against the impatient audience. These groups include two persuader kits and six audience kits. They support keeping asymmetric audience behavior in the test scaffold; dialogue clues are absent. They do not measure deception's intrinsic superiority.

Archetypes are not interchangeable. With greedy play at level 50, Evoker's full-win rate is 7.8% against Restorer and 45.3% against Seer. All 6×6 matrices at 20/50/80 are in `summary.json`. The matrices combine kit effects with the selected heuristic's ability to use each kit; they are not a roster balance verdict.

## Inspirations fetched from primary sources

| Game | Source mechanic | Possible relevance to this project |
|---|---|---|
| Yomi | Simultaneous hidden choices; attack/block/throw/dodge have different rewards, and public resources influence likely choices. | A small basic-action set can support prediction when payoffs change with state. Hiding intentions alone would not establish depth. |
| Skull | Players add face-down discs or initiate a bid; the highest bidder must reveal its own discs first. Revealing a skull costs a disc. | Escalating commitment can create danger with very few moves. A negotiation could test willingness to stand behind accumulated claims. |
| Into the Breach | Enemy attacks are telegraphed; defending civilian buildings creates a second objective. | Tells can coexist with depth when several outcomes compete. Our one-opponent sandbox currently lacks that kind of competing objective. |
| Shogun Showdown | The developer-authored store description emphasizes position, timing, upgrading and combining attack tiles. | A short preparation/commitment cycle is another possible layer. Position and a queue together may be too intrusive for this prototype. |

Sources: [Sirlin's Designing Yomi](https://www.sirlin.net/articles/designing-yomi), [Asmodee's Skull description](https://www.asmodeenordics.com/product/skull/), [Subset Games' Into the Breach page](https://subsetgames.com/itb.html), [Shogun Showdown's Steam page](https://store.steampowered.com/app/2084000/Shogun_Showdown/). The relevance column is our inference, not a claim made by those developers. Skull is a multiplayer bluffing game: its human table-reading does not automatically transfer to a deterministic NPC encounter.

## Constraints carried into the discussion

- Greatly reduce basic actions; spells have one **Cast** operation, no player-selected casting modes. Retain technical access to every learned spell in both minigames, even if its fixed contextual outcome is irrelevant or catastrophic. Ordinary negotiations should allow casting Flame and then fail as a consequence.
- Add one tactical layer with consequences across exchanges. Candidate families for discussion are accumulating exposure/commitment, a short preparation cycle, or competing objectives. No family or associated action pair has been finalized.
- Keep Health and Mana meaningful. Other campaign resources belong in a minigame only when they contribute a relevant interaction, including a spell. Separate per-resource context rebates remain configurable and must never create a net gain over entry.
- Preserve 1–100 encounter levels, level-seeded kits and behavior, mirrored combat defaults, asymmetric negotiations and player archetype presets at 20/50/80.
- Keep negotiation fixtures and mechanical risks explicit; no inference from dialogue wording is required for testplay.
- Gameplay must fit a phone viewport. Setup and debug can be separate, scrollable views; selecting spells must not require scrolling down a long page.

### Health clarification to retain

The user's latest suggestion is **combat HP = a skill-based offset + current Health**. This makes Health contribute directly while leaving a viable buffer at low Health. We should evaluate that family rather than wholly disconnecting HP from Health.

For illustration only, `entry HP = 40 + floor((Arcana + Vigor) / 4) + entry Health` would produce:

| Mean of Arcana and Vigor | Health 10 | Health 70 |
|---:|---:|---:|
| 20 | 60 HP | 120 HP |
| 50 | 75 HP | 135 HP |
| 80 | 90 HP | 150 HP |

Those coefficients are **unselected and untested**. Spell damage and encounter length would need to be assessed at the same time. Compute the offset once at entry; repeatedly reducing maximum HP when campaign Health falls would charge the same injury twice. The campaign injury ledger, local HP recovery and post-game rebates need separate, explicit definitions. A weighted Health contribution is a sensitivity test, not an accepted change to the user's additive suggestion.

Before selecting new rules, resolve what continuing pressure risks, how defensive play eventually advances or loses the encounter, what a zero-Mana actor can always do, how spells differ without extra targeting modes, and whether a low-health victory is realistically attainable. The frozen v01 results and adapter contract provide the starting comparison.

## Validation at this checkpoint

The 19 engine/scaffold tests pass, including deterministic replays, observation isolation, skill/accuracy ablations and legal policy play. Recorded source hashes, all 54,912 raw rows and every case's sample count were checked. A further 3,432-match small run exercised the shared RNG extraction; its streams exactly match the recorded baseline RNG.

The temporary browser prototype now separates phone Setup/Play/Debug views and uses compact action/spell grids. Chromium checks passed 324 action/application/result previews at 390×844, 375×667 and 320×568, plus 84 round previews with active spells across both games and all three skill presets. Desktop playthroughs at 20/50/80 also pass. This changes presentation only; v01 mechanics, casting applications and direct Health-as-HP remain until a new design is selected. Physical phone browsers have not been tested.

`node tools/grim.js check` and `npm run verify` passed in an isolated snapshot of the shared project, avoiding generated-file writes in the working checkout. Verification included 85 campaign tests, unchanged outcomes in 120 golden games and the server/browser checks. The campaign balance report emitted eight alarms and zero invariant failures; these minigame experiments do not retune the campaign economy.
