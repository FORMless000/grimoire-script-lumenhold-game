# Decision-variety balance research

Active user objective: expand meaningful spell uses (Flame remains a comic forced failure), compare three resource objectives, and automatically tune the standalone negotiation game until measured strategy variety and decision difficulty are convincing. No main-game edits or commits.

## Evidence before changes

Arguments 3, frozen `results/tuned-rust-20261020`: 1,536 games; ordinary search responds Confront 78.5% / Deflect 21.5%. Same-level wins 50.0/37.5/21.9% at levels 20/50/80. Expanded spell access wins 90.6% at 50, with Candour–Quickquill contributing 89.9% of casts. Most spells lack any negotiation benefit. This contradicts satisfactory variety/cross-level balance; the goal is not complete.

## Method and predeclared evaluation

Keep the current playable rules as an independent regression fixture while a research rules version is opt-in. Build public presentation variants with different success benefits and failure liabilities, retaining one named check and one Agreement per accepted card. Neither spells nor AI may change the argument distribution. Resource spending and repeatable recovery must remain bounded and correctly settled.

Three objectives: Frugal (substantial normalized net-spend penalties), Prudent (small penalties), All-out (maximize full-win chance, partials as tie-break only). Normalize Gold by entry wallet (floor 10), Mana by capacity, Health/Renown/Mood by 100. Frugal/Prudent may select a cheaper action only within 6/2 percentage points of the best estimated win chance at that node. Costs credit actual rebates, cap resource-gain utility at entry and avoid rewarding theft/farming. These are search objectives, not learned RL models.

Measure more than action entropy: response shares; effective spell count and top-spell/pair concentration; close meaningful alternatives; first-response versus deeper-search disagreement/regret; whether the same acceptance chance leads to different decisions in different public states; resource preservation versus wins. Do not count arbitrary tie rotation or cosmetic spell swaps as strategic variety.

Screen candidate parameters on fixed training seeds, progressively expand promising configurations, then evaluate on distinct held-out seeds. Preserve every candidate and output. Tune check slope/bias/spread, tag/lead/frame weights, spell strengths/costs, Resolve and Agreement scaling, and resource economics. Do not select on held-out results and then call the same seeds independent validation.

Provisional acceptance ranges, chosen before the new run: same-level ordinary full wins roughly 60–85% across 20/50/80, with a clear DC-gap curve; Deflect 15–45% in varied contexts; at least four materially used support spells in ordinary kits collectively and effective count ≥5 with broad access; no single spell >35% or pair >60% of broad-access casts; deeper planning should change ≥12% of sampled decisions and improve expected utility rather than merely entropy. Check these across objective presets and contexts, not only pooled totals. Resource-aware policies should demonstrably save resources without a large collapse in win rate.

These are screening targets, not proof of optimality. Validate convergence with deeper/broader fixed-work searches, and exact small endgames where all future card outcomes are enumerated. If search is not converged, report it and continue instead of describing the policy as optimal. Final judgment also requires readable rules and a working phone-size UI, not only fitness scores.

## Completion evidence still required

- New effects are executable, bounded and tested for every castable spell; Flame has the promised funny loss.
- Three objectives measured on paired samples with resource losses and win tradeoffs.
- Reproducible automatic search, preserved candidates/traces, independent validation.
- Convergence/exact-endgame evidence and decision-variety analysis.
- Promoted playable configuration, rulebook and final report; periodic progress updates until then.

## User steering · Ward

Ward must have no negotiation effect: a spell shield in conversation makes little canonical sense. It remains technically castable with Mana cost and casting Suspicion. This is an explicit exception to the broad spell-adaptation objective alongside Flame’s forced comic failure. Stale effect overrides must not re-enable a Ward benefit. All previous Ward-dependent results are retained as historical controls, not evidence for the final model. Rebalance and validate without Ward.
