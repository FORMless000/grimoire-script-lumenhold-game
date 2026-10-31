# Threads 2: before the new maps

Approved 2026-10-30. This file holds the plan as approved, with a ledger, a batch log and "Next up". Update it after every step. Status lives here, not in AGENTS.md.

## Next up

M4, the Night Market (its stalls are the first new shop).

## Scope and decisions (2026-10-30)

What goes in before the new maps and origin homes (`docs/world-expansion-design.md` §5) waits for this:

- **Toll is removed.** Nothing taught it, and the user's call was "it barely matters". `combat/` is the other agent's area: its roster keeps a dormant `toll` that no card can reach.
- **The minor cast:** more cards for the minor characters whose ladders are thin. The never-seen fixture cards become reachable.
- **The four placeholder places** (the courier loft, the headmistress's tower, the ledger office, the flight field) get real cards, and their quiet-hour placeholders retire.
- **The Night Market:** a midnight place in a field outside the village, open every term month, found through a rumour.
- **Pushers.** Each is an appointment, with no engine code:
  - rivals provoking you;
  - Grisk dunning you while you owe him;
  - Ember bringing you things;
  - the arc's agents: the man in grey courting a Hollow player and the Wardens watching a Lumen one. These are hard-canon story cards, with no `find` or `advance`.
- **Shops** become `type: shop`. You can buy several wares at once (optionally), on a dedicated shop screen. Each option's role is read from what it already does, so a counter changes one line.
- **Hints toward the seven special offers:** a hint card that leaves a Journal lead, and a line on the shop's counter while its offer is open.

Not chosen, kept for later:
- characters at work (§4);
- the peer capstone chains;
- the three clubs (§6);
- friends' yearbook lines;
- origin family letters.

## Batches

| Batch | Contents | Planned |
|---|---|---:|
| A | Toll removed | edits |
| S1 | the shop engine and UI, with tests | engine |
| M4 | the Night Market (its stalls are a shop) | 12 |
| M1 | minor cast, part 1 (Mabel, Grimsby, Marisol, Vey, Brask, Amaranth, Pell) | 20 |
| M2 | minor cast, part 2 (Maud, Isolde, Ilse, Tamsin) | 12 |
| M3 | placeholders | 18 |
| M5 | pushers: rivals, Grisk, Ember | 22 |
| M6 | pushers: the arc's agents | 10 |
| S2 | offer hints | 10 |

Each batch goes through the full loop:
- retrieval `search` before drafting and `related --draft` after;
- lint and check;
- zh-CN;
- the critic subagent;
- a commit through a temp index.

## Budget ledger

| Batch | Planned | Written | Critic | zh-CN |
|---|---:|---:|---|---|
| A Toll removed | edits | done (c7506be) | — | 100% |
| S1 shops | engine | done | — | 100% |

## Batch log

- **A** (c7506be, 0.3.264): Toll's `@spell` removed, with its translations, its glossary entry and the design-doc mentions. The combat minigame keeps an uncastable `toll`: its Rust core panics without it, and there is no cargo here to rebuild it. `test/world2b.test.js` allows that one dormant id; the minigame's own label is translated (鸣钟).
- **S1:**
  - **Engine:** `type: shop` compiles to a menu with `shop: true`. `Engine.shopRole` reads each option's role: a ware has an up-front price or sale and starts nothing; options that start a challenge, a visit or a card now, or cost nothing, are taken alone; an option with no `when` that only speaks is the way out. `chooseMany` buys a basket whole, in shelf order, if it fits the purse. `chosen()` sees inside a shop's basket.
  - **UI:** `src/shop-ui.js`, plus four lines in `src/ui.js`, styles, and UI strings in English and zh-CN.
  - **Lint:** a shop needs exactly one way out and at least one ware; options taken alone are info.
  - **Tests:** `test/shop.test.js`.
  - **Content:** the six village counters are shops, each with a one-line change.
  - **Checks:** all tests, the slow ones too; the golden diff is unchanged; `balance --quick` has 0 invariant failures and the same 5 alarms as before.
  - **Browser:** checked headless. A two-ware basket (buns and the duelling coat) buys both, records `buns+coat`, and shows one receipt.
  - **Deviation:** the basket shows its total against the purse, but not a summed meter preview. Each ware's own preview shows on hover.

