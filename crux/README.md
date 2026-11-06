# Crux · a negotiation prototype

The negotiation minigame, promoted from `experiment/parley-cards` at `74ab2ce` on 2026-11-04. Canonical source lives here; new experiments must use a separate location. It replaces the earlier experiments (Arguments, in `experiments/negotiation`, and Parley, in `experiments/parley`), which are retired: their history is in git. You react to their arguments with Confront or Deflect, and Patience and Suspicion are the meters you watch. Agreement is hidden and feeds one main argument, **the crux**, which is how you win. It plays every negotiation the game binds (`encounters.js`, generated from the game's content by `build-encounters.js`), and the campaign calls the same Rust core and table renderer. See `HANDOFF.md` for the bridge and campaign-specific inputs.

The rules, the bots and the engine are Rust (`rust/`), the one implementation: compiled to WebAssembly for the page (`crux-wasm.js`, inlined so `file://` works) and run natively for the tools. The JavaScript files left are data (`cards.js`, `spells.js`, `encounters.js`), the words the page speaks in (`voices.js`) and the page (`ui.js`, `core.js`).

## Campaign integration

Canonical source lives in `crux/`, beside `combat/`. The retired `experiment/parley-cards` worktree contains a redirect and a Claude notice; future experiments must use separate locations and import the canonical runtime and renderer. Do not maintain a second implementation.

Campaign meetings use actual skills, spell ranks, Mana capacity, Renown, relevant relationships and track values. They pay resource costs during play at `@balance parley_scale` (initially 0.5), with no refunds. The standalone presets retain their original prices unless given campaign setup. `encounters.js` is generated bench metadata; the live challenge supplies its own difficulty, branch and satisfied conditions. `src/parley-ui.js` is only a host: the table and its styling remain here.

## Building

```sh
node crux/build-wasm.js          # after any change in rust/ or the data files: the page's crux-wasm.js
cd crux/rust && cargo test        # the goldens and the rules' invariants
```

`build-wasm.js` first runs `rust/export-data.js`, which writes the cards, spells and encounters the core embeds (`rust/core/data/*.json`); `--check` says whether `crux-wasm.js` is stale. It needs cargo with the `wasm32-unknown-unknown` target.

- **`rust/core`**: `rules.rs` (the game), `bot.rs` (the crude players), `engine.rs` (the search and its eval), `view.rs` (everything the page reads from a game, as JSON), `data.rs`, and `js.rs` (the few JavaScript number semantics the port keeps: `Math.round`, mulberry32, and fdlibm's `exp` and `tanh`, so every platform computes the same bits).
- **`rust/cli`** (`cargo run --release -- sim|duel|train …`): the balance sim, the engine against the smart bot, and the eval's training. Each runs on every core.
- **`rust/wasm`**: the browser build, behind a small C ABI as the duels' is; `core.js` wraps it, and runs the engine in a Web Worker.
- **The goldens** (`golden/golden.json.gz`) were recorded from the JavaScript rules, bots and engine just before they were retired (at commit 365fd5b; the recorder, `golden.js`, went with them). `rust/core/tests/golden.rs` replays all 404 games, 2,830 moves, comparing everything the page reads and every log line after each, and the engine's search at depths 1–3 on 196 positions: values, best moves, lines and node counts. Values agree to 1e-9: V8's `exp` on arm64 is fdlibm with fused multiply-adds, so it differs from x86's, and from the core's, in the last bit now and then. Rapport has changed since (it was +2 Agreement once a meeting): its own spell entry is compared only for what didn't change, and a game or engine position whose kit holds Rapport and plays differently because of it is counted apart. Ward and Reflect have changed too (a countered spell's place is dealt again at once; it waited for the end of the action): a game that first differs at or after a counter, or a position that differs where the kit could counter one of their spells, is counted apart. That is 100 games and 77 positions for Rapport, 16 games and 4 positions for the counters; the other 288 games and 115 positions still match. `rust/core/tests/rules.rs` keeps what the goldens can't pin down: every encounter's deck, the shuffle, no soft-locks, and the engine's promises (legal moves, every roll weighed, nothing hidden used).

## Play it

Open `index.html` from `file://` (after `node crux/build-wasm.js`, if `rust/` changed), or serve this folder:

```sh
python3 -m http.server 8795 --directory crux
```

Then open `http://localhost:8795/`. URL options: `?scene=<event>/<option>&level=1–100&loadout=<a duels loadout, e.g. Scholar>&seed=N&mana=N&crowns=N&health=N&renown=N`.

## The rules

- **Their Patience: 6** (7 in a tutorial). It sits on their side, beside the crux, with their Suspicion.
  - **Answering a small argument costs 1**, whether you Confront or Deflect.
  - **Pushing for the crux costs 1, then 2, then 3, and so on**, rising with each push. A push may **overdraw** Patience: if it lands, you win even below zero.
  - When Patience reaches zero (or below) without a win, the meeting ends. Where the game's card allows a partial deal, a crux at 45% or better earns one.
- **The crux.** You may push for it at any time, at the chance shown, and it is the only way to win. A miss costs that push's Patience and nothing more. The game is about when to stop building and go all-in.
- **Small arguments** come 3 at a time from a 12-card deck drawn for this meeting. Answered, an argument leaves the table and the next is dealt. Each card shows an icon for what it tests or asks, its chance, its title, its stakes, and its own **Confront** and **Deflect** buttons.
  - **Confront**: a check at the chance shown. A win raises the crux by **exactly** what the card says (▲ crux +10%): each card is worth 1, 2 or 3 hidden Agreement, and the crux is 10% an Agreement, so the gain is known in advance.
  - **A failure costs what the card says** (✕), and it differs by argument, in keeping with what was argued:

    | Failure | Cost | Cards |
    | --- | --- | --- |
    | Suspicion | +1 or +2 Suspicion | 17 |
    | Cools | −1 or −2 Agreement: the crux drops | 26 |
    | Tires | −1 more Patience | 21 |
    | Rallies | The others on the table −15% | 8 |
    | Grudge | It comes back later, harder | 8 |
    | Drain · Cost · Wound | Mana, crowns or Health, by the encounter's tier | 14 |

  - **Deflect**: 1 Patience and nothing else.
  - **Neglect an argument too long and it lands**: you take its failure's cost anyway. Each card says how long it will wait (*neglected in 3*, then *neglected next*). Most wait 3 to 5 of your actions, 4 on average; 12 **Urgent** ones wait only 1 or 2 (The Hourglass, The Walk Away, The Door, The Deadline, The Threat…). The wait is the card's own (`cards.js` URGENT, else picked from its id), so a card always waits as long. This is why Deflect matters: a hard card you can't win is deflected before it lands, and an easy one is confronted.
- **Difficulty varies by card**, from near-certain to long shots (dc −18 to +30 against the base 58%). A long shot often carries a big gain, so it's a real choice between gambling on it and deflecting it.
- **A check**: 58%, +0.75% for each point of your skill over their level, −1.5% for each point of the card's dc (`TUNE.perPoint`, `perDc`). Your skill counts half what the card does, so who you are matters less than which argument you take on and what you cast on it; a meeting 20 levels above you is about half as much harder as it was.
- **Every chance is a 5% step**, from 5% to 95%: each check, two rolls, and the crux (`TUNE.step`). What you see is what is rolled.
- **Difficulty scales with level.** A card's dc is written for a level-50 meeting. Below that it shrinks with the encounter's level, down to 40% of itself (`TUNE.dcScale`), as skills do, so a hard argument is as hard for its level rather than harder at level 20. From level 50 up it holds.
- **Demands** ask for something rather than test you. Meet one and Confronting it is certain: you pay, and it counts as a big win. If you can't meet it, Confronting fails. Deflecting is as cheap as ever.
  - The kinds: pay crowns, give Health, have Renown, or cast a spell for them (one you know, paying its Mana). No demand gates on a skill: what you know is tested by ordinary checks (Credentials, A Real Promise, Know Your Subject, Prove Your Power are hard checks now). A spell is asked for only where seeing magic is the point: at a hearing (Show Me the Spell) and in the wild (Show Me Your Magic). They ask for a visible spell you know, if you know one.
  - Amounts follow the game's tier sizes by the encounter's level: crowns 8/15/30, Health 5/10/16. You bring 30/60/120 crowns (by level band), 70 Health, and Renown 0.6 × your level (`crowns=`, `health=`, `renown=` change these).
  - A deck holds up to two of its circumstance's demands, and **one is always in the opening table**.
- **4 Suspicion** and they end the meeting. Failures and spells both add to it.
- **Icons** are the game's own (`src/art.js`): the mask for Charm, the book for Lore, the eye for Guile, and so on; crowns the coin, Health the heart, Renown the star. A spell demand shows the spell's own icon.

## Circumstances: who you're facing, and what they argue

Each negotiation is filed under a **circumstance** (`cards.js` CIRCUMSTANCES, by event id, else by the encounter's group). Each has its own crux, its own 11–12 arguments and its own demands, written for that kind of scene. A handful of common arguments (6) can turn up anywhere.

| Circumstance | Leans on | Crux | Demands | Encounters |
| --- | --- | --- | --- | --- |
| A hearing | Lore | Not Yet Proven | Show Me the Spell | 5 |
| Authority | Lore | The Rule Stands (standing) | A Fee, Who Are You? | 9 |
| A deal | Guile | Their Price | Cash on the Table, A Reference | 5 |
| A matter of the heart | Charm | What It Means (bond) | Help, Not Words | 9 |
| In front of a crowd | Charm | The Room | Who Are You?, A Round for the Room | 8 |
| On the record | Lore | The Story | A Byline | 5 |
| In the wild | Charm | The Old Courtesy | Show Me Your Magic, A Toll, A Drop of Blood | 12 |
| In the shadow | Guile | The Grip | A Price in Blood | 8 |

`deckFor` draws by weight: the circumstance's own cards weigh 4, common ones 1. Three **signature** arguments, picked from the encounter's key, count triple, so the same meeting tends to bring the same few every time. Cards on the encounter's `using` skill count ×1.5. Most cards test Lore, Charm or Guile. The weights choose *which* cards; their **order is a uniform shuffle** (Fisher–Yates), so a signature card is as likely to come late as early. Then the first demand goes somewhere in the opening table and their spell, if any, anywhere after it, each place equally likely; their spell takes one of the 12 places.

### Arguments that do more

About one card in six (17 of 98) has an effect. Each changes a rule rather than a number, and the card shows it on a coloured banner under its title. The design notes for each effect and spell are in a commentable doc: [Crux: spells and card effects](https://claude.ai/artifact/BiWH531YC4NG9tATakMRKW).

| Effect | What it does |
| --- | --- |
| Tell | Win it and you see their next three arguments, and may send the first to the bottom |
| An opening | Win it and your next push costs no Patience |
| Clears the air | Win it and Suspicion falls back to 0 |
| Linked | Win it and the hardest other argument falls too, counted as won |
| High stakes | Win it and it counts double; fail it and the cost is double too |
| Sore point | While it stands, you can't push for the crux |
| Watchful | While it stands, every spell costs 1 more Suspicion |

## Spells: the duels' spells at the duels' prices

`spells.js` is generated from `combat/setup/roster.mjs` and `combat/web/icon-source.mjs` (`node crux/build-spells.js`; `--check` says whether it's stale). It copies each spell's cost by rank, its icon, and the Mana capacity formula, which the main game's `@resource mana` shares.

- **You are one of the duels' loadouts** (Duellist, Scholar, Healer, Illusionist, Brawler, Prefect, Showman, Underground tough, Sailor, Hollow adept), built as the duels build it (`combat/setup` generateLoadout) at your own level, any from 1 to 100 (the setup screen's slider, or `?level=`). As in the duels, a kit grows level by level: each course, capstone and hidden spell is learned at its level gate, the course spells' ranks come from the loadout's weighted-random curriculum (a fixed draw per loadout, so a kit never loses a spell or a rank as its level rises), and the skills are jittered by level. `build-spells.js` copies each kit at every level into `spells.js` (each spell as the levels it reaches each rank); at 20, 50 and 80 they are the kits the three presets were.
  - **Skills**: the kit's six skills are your checks; standing, bond and record, which the duels don't track, sit at your level.
  - **Mana**: the kit's capacity (or `?mana=`).
  - **Spells, at the kit's ranks**: the kit's spells that do something at the table, so most players don't have them all. A level-20 Brawler has four; a level-37 Illusionist eight; a level-50 one eleven.
  - **Negotiation spells added back.** The duels leave out Glamour, Index, Quickquill, Rapport and Sleight (`COMBAT_EXCLUDED`), and a class that would have learned one plays a stand-in in duels. Crux runs the same picks with them allowed, so a class gets back what it would have learned, at the same level, in place of the stand-in: the Scholar Glamour, Index and Quickquill (not Omen); the Illusionist Glamour and Rapport (from 30); the Prefect Index; the Showman Glamour and later Rapport. A Duellist, Brawler or Sailor gets none.
  - **Lodestar**, from the duels' hidden pool, is in the Duellist's, the Prefect's and the Sailor's kits from level 50.
  - Omen, Sleight, Candour and Compel are in no class's kit, so they don't come up.
- **Prepared:** every kit spell is prepared by default; tap one on the setup screen to leave it out.
- **One spell an action, and every cast is seen: +1 Suspicion** (Foresight and Haste 2; Candour, Shadowstep, Compel and Flame none). A cast that would make them walk out can't be made. With the walk-out at 4, that's three casts at most from a calm table, and about one or two in practice. Mana runs out second.
- **Each spell breaks one rule, over the whole table**: none is aimed at one argument. What a spell leaves on an argument (a fate, two rolls, Lore) stays on it, as a chip, until it leaves the table. Haste and Seal are your action (they spend the Patience, and the clocks tick); the rest come before one. Pick a spell to see exactly what it would do in the commit bar, with its Mana and Suspicion; pick it again, or Cast.

| Kind | Spell | At the table |
| --- | --- | --- |
| Fate | Foresight | Roll the dice now for every argument on the table, and the next 0/1/2 dealt (by rank): each shows ✓ or ✗. 2 Suspicion |
| Checks | Glamour | Two rolls, the better kept, on every Charm and Guile argument on the table, and the next 0/1/2 of them dealt |
| | Index | Every argument on the table is answered with Lore; those that already tested Lore get two rolls |
| | Quickquill | Your next Confront counts triple if it wins; win or fail, that spends it |
| The crux | Starlight | The next push costs 1 Patience less, and +1 Patience, once a meeting |
| Their deck | Omen | An Omen goes in 3 deep: free to answer, easy, worth 3 Agreement |
| | Lodestar | A Lodestar goes to the bottom: answer it (free, certain) and your Patience is full again |
| Protection | Brace | For 2 turns, what you neglect leaves without landing (not their spells) |
| | Ward · Reflect | Counter every spell of theirs on the table, each place dealt again at once · and +1 Patience for each |
| | Candour | −2 Suspicion |
| | Rapport | Win back their trust with their time: 1 of their Patience for 2 Suspicion cleared. Shows no Suspicion; not with their last Patience |
| The whole table | Haste | Confront every argument on the table: your action. 2 Suspicion |
| | Seal | Every argument on the table is gone, harmless and unanswered: your action |
| Other | Sleight · Shadowstep | Lift 5/10/20 crowns, once (−1 Alignment) · leave: a loss |
| Ends badly | Compel (forbidden) · Flame | Every argument on the table won; after your next action, lost unless it won (−3 Alignment) · lose |

**The Lodestar was tested at full strength first** (Patience to the full *and* the crux certain): a player who casts it at once and digs for it with Seal and Haste reaches it in about a quarter of meetings, which made a meeting 20 levels above you about 31% to win whatever its difficulty, double what normal play gets there (15%). So it refills Patience only (`TUNE.lodestar`), and then digging for it never beats playing normally: a backup, not a plan.

### Their spells

In a few informal meetings (`cards.js` HEXES), one of their arguments is a spell they're working on you, marked with a red glow and a *Their spell* banner. It **can't be deflected**: **resist** it (Confront: an Arcana check; if you fail, it stays) or **counter** it with Ward or Reflect, which deals a new argument into its place straight away. Left until its clock runs out, it lands:

| Spell | Who | If it lands |
| --- | --- | --- |
| Compulsion | the man in grey, always | you lose the meeting |
| Bewitched | the wild, the shadow | −3 Agreement |
| A Hush | the wild, the shadow | no more spells this meeting |
| Light Fingers | a deal | crowns (twice the tier's cost) and 6 Mana |

Only meetings whose circumstance lists them (a deal, the wild, the shadow) and that aren't in a formal room, half of those (`rules.rs` `hex_of`), plus every meeting with the man in grey: about 17% of meetings in all. One is shuffled into the deck after the opening table.

## The engine (a cheat)

**Engine**, in the card stub, turns on the engine's evaluation, as the duels' Engine view does (`rust/core/src/engine.rs`):

- an **eval bar** beside you: your chance to win from here, played well;
- a **score on every move**: each argument's Confront and Deflect, Push for crux, and each spell;
- **the best move outlined**, and the **top five moves** listed under the commit bar.

It's an **expectimax search** with iterative deepening, as the duels' engine is an alpha-beta search:

- **Your moves are max nodes; the rolls are chance nodes**, every outcome weighed exactly by its chance: a check lands or holds, a push wins or misses, Foresight fixes ✓ or ✗. The rules take their dice through one hook (`Game::dice` in `rules.rs`), which the engine sets to branch on each roll; without it the game rolls as before.
- **Depth counts your actions.** A spell, or burying after a Tell, comes free with the action after it; Haste and Seal are actions themselves.
- **It knows only what you know** (`mask`). Every card of their deck you haven't seen is a blank: it knows one is coming, and nothing about it, not even a guess from the circumstance's pool. A refill in the search deals a blank, which it can't plan on (no moves on it) and which never lands; the eval, fitted on such positions, knows what an unseen argument is worth on average. It does know the cards a Tell showed you, the one you sent to the bottom, and the Omen and Lodestar you put in. Their Agreement is hidden too: it takes the least the crux's shown chance allows. A test checks that two games differing only in what you can't see get the same scores. Seeing every line of play is the only cheat left.
- **At the horizon, an eval** scores the position as a chance to win: a small network (one hidden layer of 16) over what you can see, such as the press-out (your chance if you only pushed from here), the crux, Patience, Suspicion, each argument's worth, and which spells your Mana affords (`features`). As the duels distil their eval from deep searches, this one is fitted by `crux train` (weights in `rust/core/data/weights.json`):
  1. first to how often the smart player wins from positions of real meetings (`--bot`);
  2. then three times to the engine's own depth-1 search with the eval before it (`--td`). Each round teaches the eval one more step of lookahead, until its forecast meets what the engine actually scores.

  Labelling positions by how the engine's own meetings ended (`--self`) was tried and played worse: one game's outcome is too noisy a label, and the search finds the eval's mistakes.
- **To keep it quick:**
  - Star1 pruning cuts a chance node once its outcomes so far settle it.
  - A position reached twice is looked up rather than searched again.
  - Only the three spells the eval rates best are searched below the root.
- **When a depth never reaches the horizon, the values are exact** ("solved to the end"), and the search stops.

The panel shows the depth reached and the positions searched. Each line follows the best move after the likelier roll (✓ lands, ✗ holds or misses). The search runs in a Web Worker, a depth at a time, each depth painted as it finishes, for up to 8 s or until it is solved; a new position stops it and starts another. The setting is remembered in this browser.

How well it plays: `cargo run --release -- duel` (in `rust/`) plays the same meetings by the engine and by the smart bot, and prints the engine's forecast at its first move beside its result.

`--gap N` sets every encounter N levels above you (`--even` is `--gap 0`); `--depth` sets the engine's depth. The same 300 meetings at each depth, the engine knowing only what you can see (natively, every core busy; the JavaScript engine's times in brackets):

| Depth | Level 20, even | Level 50, even | Level 50, they're 20 above |
| --- | --- | --- | --- |
| 1 | 76% (0.2 ms a move; 6) | 74% (0.5 ms; 8) | 43% (0.9 ms; 9) |
| 2 | 81% (1 ms; 20) | 80% (5 ms; 41) | 49% (9 ms; 50) |
| 3 | 81% (7 ms; 51) | 83% (25 ms; 124) | 55% (61 ms; 182) |
| 4 | 80% (17 ms; 101) | 84% (87 ms; 401) | 57% (~250 ms; 395) |
| 5 | 81% (26 ms; 181) | 87% (217 ms; 623) | 58% (224 ms; 572) |
| 6 | 81% (38 ms) | 87% (650 ms) | 57% (457 ms) |
| Smart bot | 66% | 66% | 35% |

The Rust engine plays exactly as the JavaScript one did (the same scores, game for game), 3–16 times faster. Depth keeps paying where there is something to plan: at level 50, where kits hold a dozen spells, each step to depth 5 adds a few points (13 in all even, 15 when they're 20 above); depth 6 adds nothing more. At level 20, with four or five spells, depth 2 is all it takes. Since it doesn't branch on what a refill draws (a blank is a blank), the search is cheap: depth 5 in about 0.2 s, well inside the 8 s the table gives it. The forecast reads high at depth 1 (84% against 74% even at level 50) and low at depth 5 (79% against 87%): the eval knows less than the search finds.

Before the engine lost its sight of the deck and the exact Agreement, depth 1 won 78% and depth 2 84% even at level 50: what it knew was worth about 4 points.

## The scene: every meeting dressed by what it already is

Nothing here is a new parameter: a meeting is dressed from what the game already says of it. Its **circumstance** (`cards.js`), its **room**, the `context` the game's own registry already gives the negotiation (`src/negotiation.js` PARLEYS: formal, broker, public, workshop; read as a register, not a place, so a formal elder oak is still in a wood; any other gets no layer), the entry's `note` for who is across the table (else a name for its profile: *The panel*, *The skeptic*…), and its scene and intro. `voices.js` holds the words; the page holds the look. `HANDOFF.md` plans how both move into the game.

- **Straight to the table** (2026-11-05: the scene card that had to be dismissed first is gone): the meeting starts dealt. In the campaign, where Standing, Bond and Record come from is a fine line under what you came for, and a lesson's "Skip the lesson" sits on the card's tab until the first move. In the game (2026-11-06) the table has no panel behind it (`src/parley.css`: the circumstance keeps its colours and motes, not its glows, lights or star), no scrollbar, and comes in as a fight does (`.parley-enter`, full motion only). A demand's number says what kind it is: a price paid is "−5" (crowns, Health, a spell's Mana), a level you must have is "≥20" (Renown). The description shown while an argument is swiped is localised like the table.
- **The meeting's own verbs**: Confront, Deflect and Push become *Answer · Set aside · Rest your case* at a hearing, *Haggle · Wave it off · Make your offer* in trade, *Reassure · Let it go · Say it plainly* with someone you care for, *Hold firm · Give ground · Break their grip* in the shadow… Tooltips and the rules keep the plain names, and the rules say which verb is which here. The engine's lines use the same verbs.
- **Their mood in words**: the crux's band is a mood of that circumstance (a hearing goes from *Unconvinced* to *Reaching for the seal*, a bargain from *Not for sale* to *Reaching to shake*, the wild from *Unmoved* to *Willing*).
- **A voice strip**: the last thing that happened, said the way that room would say it, picked from several lines by the seed (so the same shuffle says the same things). The rules log neutral text with a code (`say` on a line, `why` on the ending: won, held, deflect, neglect, give, hold; persuaded, patience, suspicion, walked, slip, flame, compel, doom), and the page voices the code. A won argument's line grows with what it won.
- **Onlookers** in a public room: an audience strip that cheers or mutters, and a line from the crowd.
- **The look of the place**: each circumstance has a palette, a table, a paper, a heading face and an ambience behind the page (dust in a window's shaft at a hearing, tall windows for an authority, lamplight in trade, a candle at the heart, a sweeping spot for a crowd, newsprint for the ink, fireflies in the wild, a slow Hollow Star in the shadow). Each room adds its layer: a wax seal and ruled cards on ceremony, ledger margins in a bargain, the audience in public, cards set slightly askew at close quarters. All motion stops under `prefers-reduced-motion`.
- **Cards dealt, not shown**: arguments slide in from a deck whose backs carry the motif, and the deck says what it holds (*8 more trials in the wood*). The crux's % bumps when it moves.
- **An ending stamped**: the circumstance's emblem, its own head and line (*Passed, with corrections*), and what you came for marked met, partly met or missed; the rules' plain reason stays as fine print. It is shown inside the table (2026-11-05), frozen at the last move: the panel takes the arguments' place and the whole meeting's log the spells'.

## The table

It follows the duels' layout (combat/web), in two columns sized to fit a laptop screen without scrolling; below 820px wide it becomes one column.

- A parchment card stub with the circumstance's name, over one compact panel.
- **You**: a vertical Mana gauge, with your crowns, Health and Renown beside it.
- **Them**: the crux (its %, how far it last moved, a mood word), their Patience and Suspicion as dots (Patience above their usual rings dashed), and **Push for crux** with its chance and price.
- The three arguments in one row, drawn as the game's cards (parchment and ink under a band in the scene's colour) and handled as they are: **swipe right to Confront, left to Deflect**, the way's label fading in as the card leans, and a short drag springs back. Nothing is selected: while a card is dragged, its full description shows in a panel pinned above the table. Under each card are the game's two choices, icons and odds only (←, and the chance →; the verbs are in the tooltips), and a ★ to spend a fact on that card when you have one.
- An argument's effect is a coloured banner under its title (green helps you, red doesn't); a spell left on it is a chip; a fated one shows ✓ or ✗ in place of its chance.
- One of their spells glows red, with a *Their spell* banner saying what happens if it lands; its Deflect is disabled, with the reason.
- Every percentage is set in Inter with lining, equal-width figures, so 38% and 88% read apart at a glance; titles keep the display serif.
- Each spell tile shows its Mana price and, under it, its Suspicion price.
- The spells as square tiles on the right, with the commit bar under them.

## Gross balance (crude bots, `cargo run --release -- sim --games 10` in `rust/`)

- **Smart** weighs each argument's worth: its chance × the crux gain, minus the failure's cost (by rough weights per kind). It confronts the best if worth it, else deflects the worst, and answers a card about to land first. It pushes once the crux's chance beats 20% + 12% × that push's price, or once Patience is down to the price. It casts by rule of thumb and reads only what you see.
- **No spells** plays the same way but never casts.
- **Naive** confronts the first argument and pushes once Patience is down to the next push's price.

The bots live in `rust/core/src/bot.rs`. Each game deals the loadouts in turn.

| | Smart | No spells | Naive |
| --- | --- | --- | --- |
| Even match, levels 20 / 50 / 80 | 65 / 64 / 67% | 57 / 50 / 50% | 44 / 37 / 36% |
| They're 10 above, levels 20 / 50 / 80 | 41 / 53 / 60% | 35 / 40 / 41% | |
| They're 20 above, levels 20 / 50 / 80 | 23 / 32 / 33% | 18 / 19 / 19% | |
| Campaign, level 20 | 35% | 31% | 26% |
| Campaign, level 50 | 75% | 65% | 51% |
| Campaign, level 80 | 88% | 81% | 71% |

"Campaign" means each encounter at its real level; most sit above a level-20 player. A meeting runs about 4.5 actions with about 1.3 pushes. Patience running out is the commonest loss (about a third of even matches); walk-outs are rare (2–5%). Spells are worth 14–17 points to the smart bot at levels 50 and 80 (8 at level 20, where kits are thin), against 6–10 with the first round of rule-breaking spells. It casts about 1.2 a meeting, Foresight half of them, and spends about 9 of a level-50 kit's 43 Mana: Suspicion, not Mana, is what limits its casting. Alone (every other spell left out), Foresight is worth about 15 points, Haste 7.5, Glamour, Rapport and Ward 4–6, the rest under 4.

Since your skill counts half what a card's difficulty does (and the crux is 10% an Agreement, with 6 Patience to keep even matches where they were), a gap of 20 levels costs the bot about 30 points, against about 45 before. The smart bot deflects about 0.6–0.9 arguments a meeting (0.3 with the fixed 3-action timer) and lets about 0.8–1 land. With the level scaling, checks alone are now a little easier at level 20 than at 50 (no spells: 53% against 46%). What's left of the smart player's gap at level 20 is its kit's few spells. Campaign level 20 stays hard because most encounters sit above a level-20 player.

## What to look for in a playtest

- Does Deflect feel worth it now? Is *neglected in N* a clear enough pressure, and do Urgent cards feel urgent?
- Do the different failure costs read as fitting the argument, and change which ones you take on?
- Does each circumstance feel like its own scene: a hearing, a deal, a matter of the heart?
- Is choosing when to go all-in a real decision, now that each win's gain is exact?
- Does overdrawing for a last push feel like a fair gamble?
- Mana is shared with duels. Does spending it here feel like a real trade?
- Does playing your loadout's hand, rather than every spell, make classes feel different at the table?
- Level 20 against the game's above-level encounters is harsh. Is it fair?
- With the Engine on, do its picks match your instincts? Where they don't, is the engine or the instinct wrong?
- The engine wins about 20–28 points more often than the smart bot. Is that skill a player can learn at the table?

`cargo test` (in `rust/`) replays the goldens and checks the rules' invariants (see Building).
