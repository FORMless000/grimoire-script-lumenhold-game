# T2: contraband elixirs (threads 1)

**Files:**
- `content/events/contraband.grim`: 17 cards and two withdrawal pools.
- `content/states/contraband.grim`: 6 states.
- `content/world/lore/soft/academy.grim`: `@lore brightwater`, `@lore owls_ink` (soft).
- `content/core/conds.grim`: `@cond before_finals` (term months 3–4 and 9–10).
- `content/core/balance.grim`: `boost_sizes: small 4 medium 8 large 12` (the sized boost of 6cd4273).

## The rule (the user's, 2026-10-28/29)

- **Two banned elixirs.**
  - **Brightwater:** health and mood.
  - **Owl's Ink:** Mana, and a large exam boost (`boost: exam:large`, about a full grade).
- **A dose lasts two months.** Each has a chance of addiction when it wears off, rising with the doses taken: unlikely, then even, then likely.
- **Addiction (`*_want`) lasts four months:**
  - each month it costs a little (mood, or Mana);
  - it may queue an occasional punishing card (`withdrawal_*` pools, `chance unlikely`);
  - another dose ends it, and so does Sister Amaranth's remedy.
- **Every dose risks being caught:** `queue contraband_caught chance slim`. The search is at dawn, deferred off campus.
- **Sources:**
  - random cards: a classmate's offer, a borrowed bag, a first-year's "tonic", and the finals seller;
  - later, a steady supply from Grisk at the boathouse at midnight, in exchange for favours (a deceive check). He charges more before finals and when you are hooked.
- **Owl's Ink sells before finals:** `elixir_finals_buyers` (weight 10) asks for your bottle; selling pays well and costs alignment.

Calibration (`tools/exam-odds.js`-style, 8 balanced games at turn 10, 16 courses):

| Owl's Ink boost | A | B | C |
|---|---|---|---|
| none | 81% | 13% | 6% |
| large 12 | 96% | 4% | 0% |

That is "directly and aggressively", as asked. Re-check it on weaker styles in the balance step.

## Cards

| Card | Shape | Left / options | Right |
|---|---|---|---|
| `elixir_trunk` | auto menu while a bottle waits and its effect isn't running | drink Brightwater / drink Owl's Ink (each: effect, alignment −tiny, caught risk) | pour away (alignment +tiny, mood −small) / not yet |
| `elixir_offered_bright` | once; a met student | keep it (bottle, alignment −tiny) | give it back (rel −tiny) |
| `elixir_borrowed_bag` | once; a met student's satchel | keep it (Owl's Ink, alignment −small) | give it back and say why (rel +small, mood −tiny) |
| `elixir_first_year` | once | buy it off them (gold −small, Brightwater) | walk them to the infirmary (meet Amaranth, rel, alignment +tiny, health −tiny) |
| `elixir_finals_spare` | before finals, repeat 4; a met student with a spare | take it at cost (gold −small, Owl's Ink, alignment −tiny) | tell them to pour both away (rel −tiny, alignment +tiny) |
| `elixir_finals_buyers` | before finals while you hold Owl's Ink | sell (gold +medium, alignment −small, caught risk) | keep it (rel −tiny) |
| `grisk_elixir_offer` | the Gilded Newt in the evening (his own schedule), once you have kept a bottle (`elixir_kept`) | shake (the supply, a free Brightwater, alignment −small; he names the jetty) | not interested |
| `grisk_elixir_favour` | boathouse midnight menu, on supply | Owl's Ink or Brightwater for a favour: deceive apprentice; gold −small dearer before finals and when hooked; a loss is `watched` and mood | tell him you're done (ends the supply) / not this month |
| `contraband_caught` | queued, morning, deferred off campus | bluff (deceive journeyman; a loss confiscates, detention, watched) | own up (confiscated, a warning) |
| `contraband_friend_notices` | social, `per: friend`, a friend (rel ≥ 15) while dosed or craving | tell the truth (rel +small, mood −small) | laugh it off (rel −small, alignment −tiny) |
| `wd_bright_grey`, `wd_bright_shakes`, `wd_bright_grisk` | withdrawal (Brightwater), queued menus | a way through at a cost | a dose, if you hold one / Grisk sells one dear |
| `wd_ink_blank`, `wd_ink_empty_well`, `wd_ink_dreams` | withdrawal (Owl's Ink), queued menus | a way through at a cost | a dose, if you hold one |
| `amaranth_quit` | infirmary, while craving | the remedy: ends the craving, takes any bottle, health and mood −small, alignment +tiny | "just a cold" |

**Flags:**
- `elixir_confiscated`: set when the prefects bag a bottle for the confiscation vault. The Restricted heist (T4) can steal it back.
- `elixir_known` and `grisk_supply` gate the sources.

**Not built from the plan:** "a dare upstairs at the Newt", "a pedlar at the night market" and "Bram smells it on you". The trunk, the search and the friend already carry those beats, and fewer cards keep the thread rare. The vault source is T4.

## Retrieval

`related --draft` on every card. The nearest premises, all kept:
- `grisk_elixir_offer` / `grisk_elixir_favour` against `grisk_offer` (a loan), `grisk_names_favour` and `know_grisk_favours` (a debt's favour). Kept: bottles for favours is a new trade with him.
- `elixir_borrowed_bag` against `world_something_in_your_bag` (a creature). Kept.
- `elixir_trunk` / `elixir_first_year` against `infirmary_tonic_cupboard` (the infirmary's legal tonics). Kept.
- `wd_bright_grey` against `crisis_despair` (The Grey). **Reworked:** retitled "The First Thought" and refocused on the trunk and the first thought of the morning.
- `wd_ink_blank` against `hollow_reading_the_blank` (a blank page with hidden writing). Kept: here the page is blank because you can't follow.
- `contraband_caught` against `night_suspicion` and `bram_inspection`. Kept: a dawn search of trunks for a bottle.

## Checks

- `grim lint`: 0 errors, no new warnings.
- `sim 300`: 0 crashes. Every card is seen. Rare (<3% of random games), as designed since they need addiction or a held bottle before finals: `elixir_finals_buyers` 1, `amaranth_quit` 2, and the withdrawal cards 3–8 each out of 300.
- zh-CN: translated after the critic.
- Design deviation, to be recorded in §9.3: tonics are no longer the only check bonus you can buy. Owl's Ink is a second one, illicit and much stronger.

## Round 2 (after the critic's round 1: reject, 12 issues; all fixed)

- **Finals seller → `elixir_finals_spare`:** it repeated `life_stolen_answers`. Now a met classmate bought two bottles in a panic and sells one at cost, or you tell them to pour both. The text has no sequence.
- **Grisk's offer:**
  - It moves to his own place and slot (Gilded Newt, evening).
  - It is gated on `elixir_kept` (set only by keeping or buying a bottle), so abstinent players never hear "a taste".
  - It no longer sets `grisk_contact`.
  - His line is now "Not only for money. Between friends, favours keep better", and he names the jetty himself.
- **`grisk_elixir_favour`:**
  - The favours are a cycle `{&…}`, with matched win and lose lines for each favour.
  - The surcharge is paid on delivery only (in the win) and is shown in the text ("a few crowns on delivery").
- **`contraband_caught`:**
  - It confiscates, and sets `elixir_confiscated`, only when a bottle is held.
  - On a clean trunk it is a warning (`watched`).
  - The text fits drinking and selling alike.
- **`contraband_friend_notices`:** random variants, no "again". The opener depends on the state: shaking when craving, too bright while dosed. The friend points to the infirmary.
- **Withdrawal pools:** `defer: off_campus or break`. `wd_bright_grisk` and `wd_ink_dreams` have `slot: night`, and `wd_ink_dreams` no longer names the hour. `wd_bright_grisk` needs `met(grisk)`, and its price line depends on `grisk_supply`. `wd_bright_shakes` gives study, not alchemy.
- **`elixir_trunk`:** one pour option per bottle, and a text line when you hold both.
- **`elixir_first_year`:** buying moves alignment −tiny; the infirmary costs mood (the worry), not health. Amaranth's line is new.
- **`elixir_finals_buyers`:** "doesn't haggle"; no literal pronoun.
- **`amaranth_quit`:** signposted in both craving descs ("Sister Amaranth, they say, has seen this before") and by the friend. Her line is new.
- zh-CN redone for every changed line.
