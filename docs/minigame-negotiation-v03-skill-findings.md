# Negotiation skill scaling and strategy findings

The current pressure prototype has useful tactical resource decisions, but its strategic variety is still too narrow. The AI reliably outlevels the reference Debater by 15 points with the level 20 preset, and by 25 points with the level 50 preset in the tested matchups. Beyond those points, success drops sharply. The level 80 preset wins every tested matchup up to the level 100 cap, including under greedy play.

These findings cover the unchanged browser prototype and its 50 ms player AI. They do not establish optimal human play. The experiment ran 8,360 games across 130 conditions, retained every command tape and resource ledger, and replay-validated all games using frozen source snapshots.

## Reference win rates

Each row below uses 100 seeded encounters with a Balanced player, Debater opponent, formal debate, Mood 24, Renown 3, full preset Mana and default rebates. A win requires full Agreement; partial agreements are separate. Opponent level is its difficulty, not its AI intelligence. All opponents use the same state machine logic, with profile weights and level-seeded difficulty traits.

| Player level | Opponent level | Search full wins | 95% interval | Greedy full wins |
| ---: | ---: | ---: | --- | ---: |
| 20 | 20 | 100% | 96–100% | 100% |
| 20 | 30 | 100% | 96–100% | 77% |
| 20 | 35 | 100% | 96–100% | 72% |
| 20 | 40 | 51% | 41–61% | 30% |
| 20 | 50 | 28% | 20–37% | 18% |
| 20 | 60 | 3% | 1–8% | 6% |
| 20 | 80 | 0% | 0–4% | 0% |
| 20 | 100 | 0% | 0–4% | 0% |
| 50 | 50 | 100% | 96–100% | 100% |
| 50 | 60 | 100% | 96–100% | 100% |
| 50 | 70 | 100% | 96–100% | 87% |
| 50 | 75 | 100% | 96–100% | 96% |
| 50 | 80 | 45% | 36–55% | 32% |
| 50 | 90 | 35% | 26–45% | 22% |
| 50 | 100 | 8% | 4–15% | 2% |
| 80 | 80 | 100% | 96–100% | 100% |
| 80 | 90 | 100% | 96–100% | 100% |
| 80 | 100 | 100% | 96–100% | 100% |

Additional level 20 versus 32 and level 50 versus 72 samples also won 100/100. The highest *tested* reliable opponents are therefore 35, 75 and 100 respectively; the exact transition between those points and the next harder tested opponent remains unresolved. A 100/100 result is not a guarantee: its Wilson lower bound is approximately 96%. Traits are generated separately for each opponent level, so rates need not be monotonic at adjacent levels.

The reference fixture is easier than the intended roughly 90% equal-level target. Failure to secure full Agreement is usually a partial result: level 20 versus 40 had 51 wins and 49 partials; level 50 versus 80 had 45 wins and 55 partials. At level 20 versus 80, the results were 0 full wins, 53 partials and 47 losses. Withdrawal is often an intentional way to preserve resources once a full win looks unlikely.

## What changes with player level

These presets change more than Lore, Charm and Guile. They also change Arcana and other practical skills, Mana capacity, and spell ranks. Balanced level 20 has 50 Mana, level 50 has 65, and level 80 has 80. Attune restores 8/10/12 Mood per cast while costing 20/18/14 Mana. Consequently, higher-level players buy more Mood recovery per encounter as well as facing lower relative response prices.

A smaller 20-seed sample around rank boundaries illustrates the resulting discontinuities. At level 35 against 55, search won 13/20; level 36 against 56 won 20/20. At level 70 against 100 it won 18/20; level 71 against the same 100 opponent won 20/20. These are small samples, and the first comparison changes opponent traits too; they suggest a rank effect rather than isolating its exact size.

Zero-Mana controls on the same first 20 encounter seeds won 16/20 at 20 versus 20, 16/20 at 50 versus 50, and 14/20 at 80 versus 80. All three presets won 0/20 against opponents 20 levels higher without Mana. Full-Mana search won all corresponding first-20 encounters at 50 versus 70 and 80 versus 100, and 11/20 at 20 versus 40. Magic is mechanically central, although the AI mostly uses it to replenish Mood.

## Common strategies

**Confront at low pressure, then reset.** In the main grid, the two most common winning response sequences were `C C D C C` and `C C D C D C`, accounting for 727 of 970 wins, or 75%. C means Confront and D means Deflect; spells can be inserted before the response. These patterns use a pressure reset after two confrontations, then finish with one or two further resets depending on the upcoming requests and budget. Four confrontations plus two ordinary deflections exactly consume the eight starting Patience, leaving no slack for an additional ordinary deflection.

**Recover Mood with Attune before the next payment.** Across all 1,600 search games in the main grid, Attune accounted for 2,964 of 3,669 casts, or 81%. It appeared in 1,502 games. At equal level 20, search cast it 197 times across 100 games and selected no other spell. Attune is inexpensive in the AI's utility relative to the value of restored Mood, and it does not cost Patience. Repeated Attune plus deflection is the primary engine of both reliability and resource conservation.

**Use Glamour for a costly social response.** Glamour was the second most common cast, 623 times in the main grid. It discounts Charm/Guile responses and becomes stronger at higher ranks. It usually supplements the Attune strategy rather than replacing it. Theory confrontations use Lore, so Glamour cannot discount them.

**Spend reputation or crowns to avoid Mood expenditure.** A guarantee offers an alternative resource budget, while a contribution does the same only in a broker encounter. Which request appears at which pressure can determine whether the player can finish. Renown and crowns are not freely interchangeable with Mood; a demanded resource can itself become unaffordable.

**Use scrutiny as a suspicion release.** Confronting a discrepancy removes two Suspicion. This can make a Guile confrontation valuable after spells or bluffs. It is a situational benefit, not an independent route to Agreement.

**Use matching magic in practical encounters.** In the workshop, matching spells allow the player to confront at high pressure without paying the ordinary Mood price. Search used Flame, Tide, Shape, Restoration, Ward and Hush there. Across 60 workshop games, it won 52; level 20 against 40 won 12/20, while the level 50 and 80 presets won 20/20 against opponents 20 levels higher. This is the encounter type with the widest observed spell use.

Foresight, Haste and Starlight do not currently carry comparable strategic weight. In the main grid's 970 winning games, Foresight was cast only twice; 53 of its 55 total casts occurred in games without a full win. Search selected no Haste at all. Starlight appeared 27 times, including 11 casts in winning games. These observations concern this search policy: they do not prove those spells have no useful human applications. Ward and Hush also duplicate the same current practical-response benefit, making their differing Mana prices the principal distinction.

## How much search matters

Against level 30, the level 20 search player won 100/100 while greedy won 77/100. Against level 40 the rates were 51% versus 30%. At level 50 against 80 they were 45% versus 32%. Thus there are states where planning beyond the immediate response has value.

Search is not consistently superior in every sample: at level 20 against 60 it won 3/100 versus greedy's 6/100, and several other conditions contain individual greedy-only wins. Search sometimes spends Mana on a route that ends in withdrawal. It has a four-response depth limit, a hand-tuned utility and sampled Foresight branches; neither the algorithm nor these results establish optimal play.

At equal levels, both search and greedy won all reference games. The difference was resource selection. For level 20, search spent an average 4.17 net Mood and 19.70 net Mana, versus greedy's 10.11 Mood and 13.70 Mana. Search saved roughly six Mood by spending six more Mana, which matches its utility weights. Whether that is better for campaign play depends on how valuable those resources actually are outside this prototype.

Always confronting without spells won only 5%, 14% and 5% at equal levels 20, 50 and 80. A fixed no-spell rhythm that deflects at pressure two won 51%, 55% and 28%. These controls establish that neither attacking every request nor following a fixed rhythm without magic is sufficient. They are not fair estimates of the benefit of search alone, because they also exclude spells; the greedy-with-spells comparison is the relevant planning baseline.

## Variety across opponents and kits

At level 20 against 40, small 20-seed samples gave Scholar 45%, Social operator 80%, Skeptic 60%, and Official 100%. Profiles materially change which resources are demanded. In this setup, more frequent guarantees can make the Official easier by allowing Renown to substitute for otherwise scarce Mood; a more formal opponent is not automatically harder.

The six non-Balanced player kits won 60–75% at level 20 against 40 in 20-seed samples. At level 50 against 70, five kits won 20/20 and Illusionist won 18/20. At level 80 against 100, all six won 20/20. The samples are too small to rank kits confidently, but their cast records show a shared strategy: every kit relies heavily on Attune, then sometimes Glamour. School identity does not yet produce distinct negotiation plans.

The workshop broadens the spell selection, but its core choice often becomes another immediate match: cast the spell corresponding to the physical request when affordable. Ten different spells appearing across the workshop sample does not mean ten distinct strategies. The broker changes the payment budget but retains the same pressure-reset and Mood-recovery loop.

## Design assessment

There is enough structure for a short resource puzzle, but not enough variety for a frequently repeated minigame. The strongest evidence is the concentration of winning response patterns, Attune's dominance, lack of a competing Foresight plan, similar kit behavior and the ceiling reached by late-game presets. Harder opponents mainly increase prices until a familiar resource plan stops fitting; they rarely force a different kind of plan.

The next useful changes should be small and tested separately:

1. Reduce repeated Attune's dominance while preserving its role. Candidate experiments include diminishing recovery within one meeting or accumulating Suspicion from repeated recovery. This should create a real choice against Glamour, practical solutions and accepting a higher Mood loss.
2. Give deflection different future consequences by request. A bluff could increase later scrutiny; a reframing could alter the request mix. Revealed Foresight requests must remain binding. This would make response order more than a generic pressure reset.
3. Revisit Foresight and Haste only after alternate plans exist. Information is valuable when several future routes compete; revealing a sequence is of limited use when the same recovery loop handles most of it.
4. Calibrate encounter level against the resulting whole kit, including ranks and entry resources. A smooth skill-price formula alone cannot prevent the observed rank and resource cliffs.

No gameplay, AI utility or browser changes were made for this experiment.

## Reproduction and evidence

All paths below are relative to `experiments/minigames/results/`:

| Run | Games | Purpose |
| --- | ---: | --- |
| `v03-skills-20261015-presets` | 6,400 | 16 matchups × 100 seeds × four policies |
| `v03-skills-20261015-boundaries` | 800 | Four closer matchups × 100 seeds × search/greedy |
| `v03-skills-20261015-variety` | 560 | 28 conditions × 20 seeds across kits, profiles and encounters |
| `v03-skills-20261015-ranks` | 360 | 18 conditions × 20 seeds, including levels 1, 10 and rank boundaries |
| `v03-skills-20261015-no-mana` | 240 | Six conditions × 20 seeds × search/greedy |

Base seed is 20261015. Seeds are paired across policies using the shared harness's episode-seed function. The primary conditions use 100 seeds; supplemental conditions use the same first 20. This is a common-random-stream comparison, not independent samples between policies. Wilson intervals describe seed sampling conditional on the recorded AI decisions, not search-timing uncertainty or variation across all possible NPC traits.

Every run has its own `manifest.json`, frozen source hashes, `matches.json`, incremental `matches.ndjson`, and replay `audit.json`. No original source or result was overwritten. The analysis is in `v03-skills-20261015-analysis/summary.json` and `table.md`; it also retains its analysis source. The game/AI/roster hashes matched the live temporary browser's files.

```sh
node experiments/minigames/benchmark-v03-skills.mjs --mode presets --episodes 100 --out /private/tmp/v03-skills-presets-new
node experiments/minigames/validate-v03-run.mjs /private/tmp/v03-skills-presets-new
node experiments/minigames/analyze-v03-skills.mjs /private/tmp/v03-skills-presets-new --out /private/tmp/v03-skills-analysis-new
```

Other modes are `boundaries`, `variety`, `ranks`, and `no-mana`. Run timed experiments sequentially to limit CPU contention. Timed AI choices can vary by machine; replaying the retained commands reproduces outcomes and settlement exactly.

There were 22,427 recorded search decisions: median 44.87 ms, p95 48.02 ms, p99 48.15 ms. Sixty-three decisions exceeded 50 ms, with a maximum of 139.59 ms. The time budget is cooperative rather than a hard real-time guarantee. Average completed response depth was 3.15. Nineteen prototype tests and seven shared harness tests passed before analysis; all 8,360 match replays and ledger audits passed. `node tools/grim.js check` also passed with zero lint errors, six content warnings and zero simulation crashes. The added benchmark and analysis scaffolding does not change the game rules.
