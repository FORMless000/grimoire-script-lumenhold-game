# Negotiation v03: confront, deflect, and pressure

This replaces the previous v03 Conversation prototype in place. The live preview remains <http://127.0.0.1:55918/?quickstart=20>; use Setup for skill 20, 50, or 80. Browser files are copied to `/private/tmp/lumenhold-negotiation-v03-ojlv605q`. Durable source: `experiments/minigames/iterations/v03/`. Prior source and rulebook were backed up to `/private/tmp/lumenhold-v03-before-redesign-7r4mltmw/`; historical result directories retain their own immutable engine/AI snapshots. Production campaign behavior and combat are outside this experiment.

## Quickstart and reproduction

```sh
node --test experiments/minigames/iterations/v03/engine.test.mjs experiments/minigames/harness.test.mjs
node experiments/minigames/iterations/v03/build-browser.mjs /private/tmp/negotiation-pressure-new
node /private/tmp/negotiation-pressure-new/server.mjs
node experiments/minigames/run-v03.mjs --episodes 30 --seed 20261018 --out /private/tmp/pressure-run-new
node experiments/minigames/validate-v03-run.mjs /private/tmp/pressure-run-new
```

Node 20+, no new dependencies. The server prints its loopback URL. Keep output directories fresh; simulation results are never overwritten. The existing live server remains running for testplay.

## Objective, observation, and turn order

Secure **4 Agreement** before **8 Patience** runs out. **6 Suspicion** ends the meeting. Pressure starts at zero, capped at three. The opponent shows the exact current request. There are only two contextual responses, Confront and Deflect, plus voluntary withdrawal. Their skill, difficulty, resource price, time price, Suspicion change and resulting pressure are shown before choosing. No dialogue clues or player success rolls are used.

1. Optionally cast one spell. Spend Mana, resolve its effect and casting Suspicion immediately; do not spend Patience, change the current request or advance the turn. The spell slot is now used.
2. Choose Confront or Deflect. Pay its visible price, resolve Agreement, Suspicion, Patience and pressure.
3. Suspicion failure takes precedence over victory. Reaching the Agreement target on the last Patience succeeds. Otherwise, exhausted Patience ends the meeting: at least half the target gives a partial result; less gives a loss.
4. If continuing, expose the next request, clear this turn's spell effects and refresh the spell slot.

Withdrawal costs no resources and settles existing progress. Shadowstep is a magical alternative, with its normal cost and risk. Mood zero does not itself end the meeting; affordable alternatives and withdrawal remain available. Health is not used because this minigame currently has no meaningful Health interaction.

## Skills and response prices

The source of skill meanings is `content/core/rules.grim`: Lore is scholarship/theory/history/languages; Charm is persuasion/warmth/wit; Guile includes lying and noticing discrepancies. Arcana, Alchemy and Vigor arise only in compatible practical requests.

| Request | Confront | Deflect |
| --- | --- | --- |
| Explain your reasoning | Reason, Lore | Bluff, Guile |
| Establish common ground | Persuade, Charm | Reframe, Lore |
| Put your standing behind it | Vouch, Renown; Charm affects price | Make it personal, Charm |
| Explain a discrepancy | Explain, Guile; remove 2 Suspicion | Ask for goodwill, Charm |
| Controlled heat | Demonstrate, Arcana; Flame can help | Feign expertise, Guile |
| Handle a spill | Handle it, Alchemy; Tide can help | Feign expertise, Guile |
| Repair apparatus | Repair, Alchemy; Shape can help | Feign expertise, Guile |
| Mend living specimen | Treat it, Alchemy; Restoration can help | Feign expertise, Guile |
| Physical disturbance | Steady it, Vigor; Ward/Hush can help | Change the subject, Charm |
| Contribution of crowns | Pay the requested crowns | Bargain, Charm |

**Confront:** +1 Agreement, −1 Patience, pressure +1 capped at three. For ordinary skill requests, `difficulty = opponent level + skill trait + 15 × pressure`; Mood price is `max(1, 4 + ceil((difficulty − player skill) / 5))`. Thus each pressure level adds three Mood before spell effects.

A guarantee instead costs `max(1, 1 + floor(pressure / 2) + ceil((opponent level + Charm trait − player Charm) / 25))` Renown. A crown contribution costs `6 + 2 × pressure` crowns. A successful discrepancy explanation reduces Suspicion by two, floor zero. Guarantees, contributions and explanations all grant the same one Agreement; they differ in what they consume and what they prepare you for.

**Deflect:** no Agreement, −2 Patience, pressure −2 floored at zero. Its difficulty uses `opponent level + escape-skill trait + 4 × pressure`. Guile deflections spend no Mood but add `clamp(1 + floor((difficulty − Guile) / 15), 0, 3)` Suspicion and record a deception. Other deflections cost `max(1, 2 + ceil((difficulty − escape skill) / 10))` Mood and no Suspicion. Deflection advances past the current request; there is no hidden debt or unfinished-request queue.

These are preliminary prototype numbers, held in `engine.mjs`; they are not changes to campaign balance presets.

## Spell effects

All twelve spells are selectable in every encounter, subject only to Mana and the one-cast slot. Costs are twice the frozen prototype roster's rank cost, paid immediately. No Mana flux or reclaim exists. Every cast adds one Suspicion, except Glamour adds two. Suspicion is checked after the spell's full effect; Starlight can therefore relieve it on the casting turn.

| Spell | Effect |
| --- | --- |
| Foresight | Reveal and bind the next three requests, excluding the current one. Player responses remain free. Recasting on a later turn preserves existing forecasts and extends to three; it never rerolls them. Future pressure and resulting prices still depend on your choices. |
| Glamour | This turn, Charm/Guile responses cost `6 + 2 × (rank − 1)` less Mood, one less Renown and cause one less response Suspicion; each reduced cost floors at zero. Casting still adds two Suspicion. Does not improve Lore/other skill responses. |
| Attune | Restore up to `8 + 2 × (rank − 1)` encounter-spent Mood, capped at entry Mood. |
| Haste | This response costs one less Patience, minimum one. Primarily helps deflection. Cannot grant another cast. |
| Starlight | Remove three Suspicion after casting. Expose prior deceptive deflections: add back up to two Suspicion, lose up to one Renown, and clear the deception record. |
| Flame / Tide / Shape / Restoration | For the matching practical request, confrontation costs no Mood. They do not directly grant Agreement. Flame/Tide in a formal debate or broker meeting cause immediate failure after payment. Other irrelevant casts have no useful effect. |
| Ward / Hush | Handle the current physical disturbance, making confrontation cost no Mood. Otherwise no useful effect. |
| Shadowstep | Depart and settle the current result. Casting Suspicion can still cause failure. |

Except the forecast itself, spell benefits expire after the response. Harmful and irrelevant spells remain castable; the player AI filters clearly pointless or dominated casts from its own candidate set only.

## Opponents, kits, and randomness

Balanced starts with Mood 24, Renown 3 and Mana `40 + floor(player level / 2)`. The broker encounter starts with 18 crowns, other contexts zero. Setup permits explicit resource overrides and existing level-seeded player kits. All spells are available; signature spells can have stronger ranks. Skill 20/50/80 presets also set the opponent to the same level. Opponent level defaults to the player level but is independently editable.

The opponent has six skill difficulty offsets in [−4, +4], generated deterministically from its level alone. Default encounter RNG seed is the opponent level; an explicit seed permits additional reproducible encounters. No per-response randomness exists. The seeded state machine selects requests with these base weights:

| Profile | Theory | Motives | Guarantee | Scrutiny |
| --- | ---: | ---: | ---: | ---: |
| Debater | 4 | 3 | 1 | 1 |
| Scholar | 6 | 2 | 1 | 2 |
| Social operator | 2 | 5 | 3 | 1 |
| Skeptic | 3 | 2 | 1 | 4 |
| Official | 3 | 2 | 4 | 2 |

Workshop adds each of the five practical requests at weight two. Broker adds contributions at weight three, or five for an Official; bribery never appears in other encounters. Theory encourages a motives request next (+3 weight) and motives encourages theory (+3). Guarantees, contributions and scrutiny cannot repeat consecutively; guarantees/contributions also cannot recur within the next two requests. No request can appear three times consecutively. Normalize remaining positive weights to probabilities.

Request history controls the distribution, while player pressure controls request prices. Keeping these separate makes exact three-request Foresight binding without forcing player precommitment or secretly changing revealed requests. This is an intentional limitation: Suspicion does not currently alter future request weights.

## Economy and settlement

Each resource has its own configurable post-meeting rebate: default Mood/Renown/Mana 50%; practice 80%; public context Mood/Mana 80%, Renown 20%. Crowns are always zero, even if an API caller requests otherwise.

The rebate is `floor((entry − pre-settlement balance) × ratio)`, applied once and capped at entry. This uses remaining depletion after Attune recovery, rather than refunding gross repeated expenditure. The result table shows gross Spent, Recovered, Rebate and Net loss. Replaying the same encounter resets entry resources; Carry balances explicitly uses the settled balances as the next entry.

## Player AI and reusable simulations

The opponent is never a searching player. The simulated player uses iterative expectimax up to four response turns, with casts as additional decisions that do not decrement response depth. A 50 ms cooperative budget, a two-millisecond return reserve and 50,000-node ceiling retain the last fully completed search iteration. The browser runs search in a worker. An AI turn completes its response even when it first chooses a spell; that involves a fresh search after observing the actual cast result.

Ordinary chance nodes are expanded exactly. Foresight's three-request fan-out uses eight deterministic samples keyed to public state, not the encounter seed. Public observations remove live RNG state and seed. This is approximate search, not exhaustive optimal play. Evaluation values success first and charges net post-rebate resource loss; Mood 3, Renown 12, Mana 0.65, crowns 2. Nonterminal evaluation also values progress/Patience and penalizes pressure/Suspicion. Terminal utilities: win 10000, partial −1800, loss −10000, minus resource expense.

`harness.runMatch` remains the common driver. Policies are search, greedy with spells (best immediate cast-plus-response), confront without spells, and a fixed rhythm without spells (deflect at pressure two). A `reason` alias preserves old CLI invocations. CLI options include kit, fixture, opponent level and each entry resource. Runs freeze exact sources/hashes, configs, episode seeds, command tapes, ledgers and timings. The validator replays the frozen engine and commands; elapsed-time search decisions are not claimed to reproduce across machines.

## Preliminary observations, not a depth claim

The current validation `results/v03-pressure-20261018-validation/` uses 30 paired episode seeds per policy, level-20 Balanced versus level-20 Debater:

| Policy | Full wins | Partial | Mean net Mood / Mana loss |
| --- | ---: | ---: | --- |
| Search | 30/30 | 0 | 3.73 / 19.67 |
| Greedy, spells enabled | 30/30 | 0 | 9.77 / 13.33 |
| Always confront, no spells | 3/30 | 27 | 10.50 / 0 |
| Fixed rhythm, no spells | 17/30 | 13 | 10.17 / 0 |

Search used 59 Attunes across 30 games; no other spell was selected. This indicates Attune dominance and an easy reference fixture, not established tactical depth or achievement of the proposed ~90% difficulty target. The prior pilot used a greedy baseline without spells; its apparent search win-rate advantage was misleading and is not the comparison above. All historical raw outputs remain intact.

A further 75-game smoke matrix (five seeds × three levels × five NPC profiles) completed legally and won every game. It is a smoke test, not a cross-kit or skill-difference balance study. Higher levels used Glamour as well as Attune. All 195 games in these two current-policy runs passed frozen-source command-tape and ledger replay audits. Search timings in the 30-game reference sample: 227 decisions, max 49.47 ms, none above 50. The concurrently loaded 75-game matrix had nine decisions above 50 ms (max 63.80 ms). The budget is cooperative; desktop timings and phone viewport checks do not establish performance on phone hardware.

Nineteen targeted rule/search/replay tests plus seven shared harness tests pass. Browser checks cover manual casting, binding forecasts, the one-spell slot, full AI meetings and phone-sized layouts. `node tools/grim.js check` passed. Full `npm run verify` passed after granting its server tests loopback access: 101 production tests, balance with zero invariant failures (five alarms), 120 unchanged golden games and browser checks. The initial sandboxed attempt failed six server tests with listen EPERM. The verification log is `/private/tmp/lumenhold-v03-pressure-verify.log`. This implementation deliberately exposes the requested design for human testing; balance and spell diversity still need refinement.

## Notes for the game: who sits across the table, and what you carry (world expansion 1)

Not implemented; ideas for when this prototype becomes the game's negotiation minigame.

- **Who and where.** Every `challenge negotiate` in content has an entry in `src/negotiation.js` (`PARLEYS["event/option"] = {profile, context}`), using this prototype's profiles (Debater, Scholar, Social operator, Skeptic, Official; a Committee is a panel of three) and contexts (workshop, broker, formal, public, practice). Until the minigame arrives the engine decides a negotiation with a stub (charm, lore and guile, with mood and renown).
- **Items.** Owned items will never change a negotiation's numbers on a card; in the minigame a few could open one small move each:
  - *Midnight-blue robes*: officials take you seriously; an Official's opening patience is one higher.
  - *Pocket almanac*: precedent at hand; once per negotiation, a Reason request is answered with Lore at no cost.
  - *Honey tin*: sweetening the talk; Patience lasts a turn longer once.
- **Tonics** (`boost:` states) never touch a negotiation.
