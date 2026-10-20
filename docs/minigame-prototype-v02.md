# Commitment prototype 0.2.2

Research implementation, 2026-10-14. This replaces the temporary browser prototype, not the academy's production minigames. The frozen v01 rules and benchmarks remain in `experiments/minigames/iterations/v01/`. The runnable v02 engine, search, tests and simulation adapter are in `experiments/minigames/iterations/v02/`.

## What changed

- Commitment alternates: one actor chooses publicly, the other responds, then effects resolve. First commitment defaults to the opponent; setup can reverse it. Normal commitment order alternates in the background; active Foresight can force who leads.
- Only three basic actions remain: **Strike, Guard, Reclaim**. All cost zero Mana, Health, Mood, Renown and Crowns. No accuracy purchases, stakes or casting modes remain.
- No action success rolls or random damage. Level remains the seed for the existing kit generator and deterministic search ordering. Optional AI degradation samples bounded weaker choices with a separate reproducible seed.
- Casting transfers 80% of the paid Mana into **flux**. Reclaim consumes the exchange's action and transfers all flux into ready Mana. The other 20% remains spent.
- Foresight forces the target to commit first for three exchanges, beginning **the exchange after the cast**. Each actor still chooses one action per exchange.
- Simultaneous mutual defeat is awarded to the telegraphed actor. This is an outcome tiebreaker; both actions still land and pay their costs.
- Alpha–beta minimax is the normal opponent policy. Search is performed in a browser worker.

Spell names, standard/depleted entry resources, most existing spell effects, contexts, per-resource rebates, the eight-exchange limit and negotiation thresholds remain from [v01](minigame-prototype-rulebook.md). Ward's prices and protection were changed in 0.2.1 as specified below. Necessary deterministic translations are specified below. Channeling is not implemented in this iteration.

## Commitment and resolution

One choice is a **commitment**; two commitments form one **exchange**. Committing first does not cause ordinary damage to resolve first. Costs are paid after both actions are fixed. Defensive/preparation effects apply for both actors before attacks; ordinary attacks then land together, including mutual lethal hits. If both actors are defeated, the exchange’s first committer wins on **telegraphed initiative**. Both HP bars can reach zero; damage, resource spending and settlement are unchanged. The tiebreaker uses the actual first committer, including a Foresight-forced actor. Ordinary partial negotiation agreements and time-limit adjudications retain their rules.

Haste retains its existing identity as an explicit timing exception: pay `2 × combatScale` Health/HP when cast; the following exchange's attack resolves before the opponent's ordinary attack. Both actors having Haste restores simultaneous attacks. Choosing a non-attack on that following exchange uses the opportunity without attacking. This exception is independent of who commits first.

Leave encounter is an external terminal control, not a fourth basic action. The AI does not search that control. Combat departure loses; negotiation departure banks the current Agreement result. Shadowstep retains its paid negotiation departure effect.

## Mana accounting

For a cast costing `C`, ready Mana decreases by `C`, flux increases by `0.8C`, and permanent expenditure increases by `0.2C`. Flux cannot pay for a cast. Reclaim occurs after the exchange's attacks and never funds another action in that same exchange. It creates no Mana and cannot be banked twice.

On ending an encounter, remaining flux is collected automatically. Then apply the configured resource rebate to the remaining net loss, capped at entry. The ledger records gross spending, actual restoration, flux collected at settlement, rebate and final loss separately. Fractions are retained during play; rebates use integer flooring, as before.

This makes lasting Mana losses small: before rounding, the practice-duel rebate leaves 4% of gross casting expenditure spent, while real-conflict context leaves 10%. The prototype deliberately retains the existing prices for this comparison; it does not silently compensate with higher costs.

## Foresight: three exchanges of early commitment

Starting the exchange after casting, the target must choose and publicly commit its action first for the next **three exchanges**. The caster sees that action before choosing a response. Actions resolve together under the ordinary rules. No future command is selected, queued, reserved or locked in advance; both actors choose anew each exchange using current resources.

Normal first-committer order continues alternating in the background. With only one actor affected, that actor leads. If both actors are affected, normal alternation applies while both durations tick down. When only one effect remains, that target leads until it expires; once neither remains, background alternation determines the leader. There are always exactly two commitments per exchange.

Each completed exchange consumes one existing duration. A fresh cast refreshes the target to three subsequent exchanges without stacking; casting never retroactively changes the current exchange’s order. Late casts cover only exchanges remaining before the eight-exchange limit. Foresight retains its existing one-time +10 power preparation and Mana/flux costs.

Telegraphed initiative is the corresponding risk: forcing an opponent to reveal first also gives that opponent the mutual-defeat tiebreaker. Seeing an incoming lethal spell allows a response, but answering with another mutually lethal spell loses that tie.

## Deterministic skill effects and spell mappings

Combat damage uses the old successful-hit base amounts, multiplied by `combatScale = 3` and:

`clamp(1 + (acting skill − opposing defence + preparation) / 100, 0.5, 1.5)`

Strike uses Vigor; attacking spells use Arcana; opposing defence is the mean of Arcana/Vigor. Round final outgoing damage to the nearest integer before protection. The former +10 accuracy preparations become +10 points in this deterministic power comparison. There are no misses.

| Action/spell | Combat cast |
|---|---|
| Strike | Base 6 damage, skill-scaled, near range |
| Guard | Block base 4 from Strike this exchange; spells bypass it |
| Reclaim | Transfer all flux into ready Mana |
| Flame | Base `8 + rank − 1` damage; destroys Shape |
| Tide | Base `5 + rank − 1` damage; Wet reduces the next Flame hitting the target |
| Starlight | Base `4 + rank − 1` damage; removes Glamour |
| Restoration | Restore base `6 + rank − 1` HP/Health, capped at entry |
| Shape | Block base `8 + rank − 1` from the next Strike; Flame destroys it |
| Glamour | Absorb base `4 + rank − 1` from the next attack; Starlight removes it |
| Hush | Reduce the next offensive spell by base `4 + rank − 1`; casting remains legal |
| Ward | Absorb base `10 + 2 × (rank − 1)` from the next attack |
| Foresight | Three exchanges of forced early opponent commitment, plus one +10 power preparation |
| Haste | Existing Health fatigue and next-exchange speed exception |
| Attune | One +10 Strike preparation and base `3 + rank − 1` Strike protection |
| Shadowstep | Fixed step to near range and base `3 + rank − 1` evasion |

All base damage, healing, protection and fatigue numbers in the table use the existing combat scale. Buffs retain their current/next-exchange expiry and consumption rules. Each spell has one fixed cast; no application menu exists. Every learned spell can be cast in either minigame, subject to ready Mana, even with no relevant target.

Ward's unscaled rank costs are now **10/8/6**, previously 14/10/9. At default Mana scale 2 and combat scale 3, it costs **20/16/12 Mana** and blocks **30/36/42 damage**, previously 28/20/18 Mana and 24/27/30 damage. It still absorbs one attack with the existing expiry/consumption rules. Its negotiation fixture effect is unchanged.

Negotiation keeps Agreement 18 for a full result, 10 for partial, Patience 8, Suspicion 6, and the workshop's exchange-3 scattering/exchange-5 noise. An approach is selected in setup: Reason, Appeal or Bluff. Player Strike makes that argument; Guard reduces Suspicion by one; Reclaim recovers Mana. The audience's Strike objects, or scrutinizes an existing false claim instead; Guard listens. Scrutiny succeeds deterministically when its effective Lore meets player Guile. Argument/objection magnitude uses the same bounded skill multiplier with the existing relevant skills.

Player Glamour prepares Appeal/Bluff, costs Renown and adds Suspicion; audience Glamour prepares Authority. Attune prepares argument/objection with consent. Foresight forces early commitment for either role. Haste waives the player's next base Patience loss or accelerates the audience's next objection by one extra Patience. Starlight removes opposing Glamour. Workshop Shape/Ward/Hush protect the same fixture events; demonstrations retain their one-time credit. Formal-petition Flame/Tide are catastrophic for the caster. Audience casts without a useful mechanical target remain available and spend Mana. No dialogue clues are required.

## Health model

The default retains **Health as HP** to keep the requested comparison against the current rules. Setup also exposes the earlier proposed experimental alternative:

`entry HP = entry Health + 40 + floor((Arcana + Vigor) / 4)`.

With that alternative, max HP is fixed at entry. Damage reduces local HP and campaign Health independently; reaching zero campaign Health does not end combat while local HP remains. Restoration can recover each up to its own entry cap. These injury coefficients are a test fixture, not a finalized campaign rule. The two primary balance runs use the default direct model and do not validate this alternative's economy.

## Search implementation and limits

The tree stores both pending commands, actual and background commitment order, both early-commit durations, effects and Mana/flux. All of these order/duration fields are included in transposition keys. MAX/MIN selection follows the actual decision owner. Consecutive decisions by one actor are supported; there is no unconditional sign flip after each commitment.

Iterative deepening searches up to **three resolved exchanges**, with **5,000 nodes total per decision**. Alpha–beta pruning, deterministic move ordering and a per-decision transposition table reduce work. Only a completed iteration replaces the previous choice; an interrupted search retains the completed result. If no full iteration fits, a deterministic legal heuristic choice is returned and `completedDepth: 0` is recorded. No wall-clock cutoff changes behavior across machines.

### Independent AI degradation controls

`config.ai[side]` can set `maxDepth`, `mistakeChance`, `maxRegret` and `seed` independently for each actor. Setup exposes four profiles: Full (depth 3, no errors), Shallow (depth 1), Fallible (depth 3, 30% attempt chance), and Shallow + fallible (depth 1, 30%). A lower depth keeps the same node ceiling; it intentionally sees fewer resolved exchanges. This changes policy strength without changing the actor's skills or kit.

The mistake chance triggers an **attempt**, not an unconditional random action. After normal search, an attempted error obtains exact full-window scores for every legal root action at the same completed depth, using up to 5,000 additional nodes. Shared alpha-beta root bounds are not used as exact alternative values. If ranking cannot complete that depth, the error is declined.

Candidates must score strictly below the best move by at most **35 utility points**, roughly nine HP of the ordinary combat position heuristic or two Agreement increments before other terms. This is a heuristic bound, not a guarantee about distant play. Explicit filters reject known visible immediate defeats, hostile formal casts, paid exits, empty Reclaim and clearly irrelevant casts. Early commitment uses the same policy and leaves all affordable learned actions available. No bounded weaker candidate means no mistake, so the realised error rate is below the configured attempt rate.

Policy draws are pure functions of the separate AI seed, actor and exchange. Repeating a seed reproduces decisions; previews/search forks do not consume random draws. Kits remain seeded only by level. Search still models ideal adversarial responses rather than solving an expectiminimax tree of the opponent's mistake probability.

Win/loss dominate negotiation's terminal utility. Combat utility is symmetric in defeat and decisive HP lead; an undecided timeout is not treated as a free NPC victory merely because the retained v01 result labels can classify both sides as failures. Cutoff evaluation includes HP position, ready Mana, flux, and active effects. Simultaneous-defeat terminal utility follows the initiative winner rather than valuing both-zero HP as a draw. This is bounded approximate play, not a solved game or a learned model of the human player.

Historical 0.2.1 timing results used binding three-command queues and exposed depth-0 planning fallbacks. Those results describe the retired queue mechanic. Version 0.2.2 removes the extra planning nodes; it retains the same search/node settings and still reports any budget fallback. Browser-debug stats and exported logs expose search depth, nodes and timing.

## Reproduce and inspect

```sh
node --test experiments/minigames/iterations/v02/engine.test.mjs
node experiments/minigames/run-v02.mjs --suite policy --out /private/tmp/lumenhold-v02-policy-new
node experiments/minigames/run-v02.mjs --suite balance --out /private/tmp/lumenhold-v02-balance-new
node experiments/minigames/run-v02.mjs --suite latency --out /private/tmp/lumenhold-v02-latency-new
node experiments/minigames/iterations/v02/build-browser.mjs /private/tmp/lumenhold-testplay-tymsimxd
```

Output directories must be new. Each run preserves case definitions, source snapshots and hashes, raw matches, search measurements and a readable report. The shared match harness dispatches v02's actual commitment owner rather than forcing v01's opponent-first structure. Mechanics are deterministic; fallible policies add reproducible AI-choice randomness. Repeating the same scenario and AI seed is not an independent trial.

```sh
node --test experiments/minigames/iterations/v02/ai-degradation.test.mjs
node experiments/minigames/run-v02-degradation.mjs --episodes 4 --seed 20261014 --out /private/tmp/ward-ai-new
node experiments/minigames/validate-v02-run.mjs /private/tmp/ward-ai-new
```

## 0.2.2 validation checkpoint

The inherited harness/v01/v02 suites pass **43 tests**, plus **3** checks against the generated browser bundle. The new browser smoke checks pass **22 cases** at 320×568: twelve Foresight ownership/order combinations across both minigames, two initiative-tie directions and eight real-AI mode/profile playthroughs. All twelve spell buttons fit, including active Foresight status; no page errors occurred. Scripted worker fixtures exercise specific mechanics, while the final eight cases use the actual AI.

A short all-spell panel at levels 20/50/80 measured **432 Node decisions**, with a **288-decision browser subset** at 50/80. There were **no depth-0 fallbacks**; full AI completed depth 2 or 3 and shallow AI completed depth 1. Browser full-AI p95 was **25.8 ms combat / 16.1 ms negotiation**; fallible p95 was **56.0 / 26.0 ms**. Desktop Apple M3 measurements remain preliminary; no new balance/win-rate sweep or phone-hardware measurement is claimed. The old exact-queue timings are not measurements of this ruleset.

Raw states, seeds, source snapshots, timings, browser sources and UI smoke results are preserved in `experiments/minigames/results/v022-20261014-early-commit-latency/`. Current reproduction commands are in [the simulation README](../experiments/minigames/README.md#early-commit-foresight-and-initiative-prototype-022).

Project `grim check` also passed in an isolated checkout copy. Initial `npm run verify` stopped at an already-stale generated `docs/authoring/schema.md` from concurrent campaign work. Regenerating that document **only in the isolated copy** allowed full verification to pass: 100 campaign tests, 120 unchanged golden games and server/browser checks. Four campaign balance advisories remain, with zero invariant failures. Both original and successful logs are preserved beside the prototype results; shared campaign files were not regenerated by this task.
