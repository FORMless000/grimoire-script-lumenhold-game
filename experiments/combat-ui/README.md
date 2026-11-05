# Combat UI prototypes

Forks of the fight screen (`src/combat-ui.js` + `src/combat.css`), for trying new layouts before anything ships. Nothing here is loaded by the game. The combat bench loads a fork into the game's own page in place of the live screen.

**B · Arena shipped on 2026-11-02:** it is now the game's fight screen (`src/combat-ui.js`, `src/combat.css`, classes renamed `pf-` → `fl-`). The forks here stay for trying the next idea; port a change made here by hand.

Each fork targets the same four problems:
- **What just happened.** Both moves of the last exchange, what each did to the other, and the defence that met it ("Parried", "Warded −4", "Blocked 7"). Also everything else that landed: summons, blows that were on their way, poison, Haste's extra Impulse, an ally.
- **Less text.** Coloured numbers and short labels. The full rules text is one tap away in a sheet.
- **Buffs and debuffs.** They are chips under each fighter, showing exchanges left. Tapping a chip explains it in plain words, then gives the core's full text.
- **Constructs explained.** A summon chip shows what it does each exchange. Its sheet lists the damage or heal, how much it blunts each hit, how much damage to its owner breaks it, its last exchange, and its burst.

## Iteration 3 (feedback 2026-10-29: Arena)

Arena reworked; the shared pieces changed for every fork:
- **No scrolling region of its own.** The fight renders in panels. On a tablet or a full window everything fits, and only the engine's analysis can push the page past the screen. On a phone the whole fight scrolls as one page. The timeline scrolls sideways only when it is wider than the screen.
- **The exchange in the middle.** On a stage 600px or wider, the last exchange stands between the two fighters. Narrower, it drops under them. The fight's text stays under the face-off.
- **A compact timeline**, as the live track: 28px columns, the whole fight so far and six exchanges ahead, scrolled to now. Lasting effects are thin bars in their status's colour.
- **Compact status chips:** the icon and one number (exchanges left, a summon's strength or a value), in the status's colour. Tap one for the rest.
- **Each status lights the outline its own way.** Haste runs a fast light round the edge; Tailwind runs two. A channel or a summon circles slowly. Ward breathes gold; Parry flashes. Brace is a thick amber band, Reflect a silver sheen, Shadowstep a dashed flicker. Poison throbs green, Torment beats red, Bind is a striped band and a freeze is pale and still. The second status adds its colour as a glow.
- **A faster, harder exchange.** Everything happens inside about 0.6s, the leader's move first:
  - the tiles slam in and a spark bursts where they meet;
  - each side's line wipes in from its side and the numbers pop;
  - each fighter jolts and flashes by how hard it was hit (red for a hit, gold for a blow kept off, green for a heal), with the number or "Parried" popping over the portrait;
  - a heavy hit shakes the whole face-off.

  The render keeps any piece that did not change in place (`data-k`), so a running animation is never restarted.
- **Nothing moves when you act.**
  - A picked move's rules and Cast sit under the move grid.
  - Arena holds room for what an exchange can bring: a chip row under each fighter, the exchange panel's usual tallest height (with its text), three status bars on the timeline, and a telegraph with its flavour line. A rare, fuller exchange still grows.
- **No room stands empty.**
  - On a wide stage, each move's line of fight text sits in its fighter's panel; the lines that close an exchange sit at the foot of the exchange panel. On a phone, all of the text is in the exchange panel.
  - Before the first exchange, the exchange panel shows the fight's stakes in full and the spells the opponent can cast (public: their sheet lists them). Your panel says how to pick and read a move; theirs says who opens and what that means.
- **The timeline fills its row.** On a wide stage, this exchange's telegraph sits beside the timeline and the timeline's columns widen to fill the rest. It keeps one height (room for three status bars) and fills it: each fighter's half shares the room. Only more bars than that make it taller. Once the fight is over, the timeline goes.
- **A mutual knockout is said plainly** (rules F5.11-plan.1b, `combat/HANDOFF.md`): both fell in one exchange, so the side that committed first wins and keeps its HP.
  - The result reads "Won on initiative" or "Lost on initiative", with why.
  - In the last exchange, the loser's blow is "Never landed", and the winner's portrait pops "Struck first".
  - The fight's own text tells it too.
- **Sheets overlay the screen**, as the live screen's do: a bottom sheet on a narrow screen, a centred card on a wide one. Picking a move keeps the fight's scroll and focus.
- **Foresight is its caster's buff,** shown under the caster.
- **Compact names.** A generic foe's descriptive name ("the unbeaten fourth-year") is shortened in the UI only; the full name stays in titles, sheets and the fight's text:
  - a heading drops the article ("Unbeaten fourth-year");
  - the timeline and an exchange's lines use a short name, or "Them".
- **The engine's analysis is ported.** Its toggle and time budget sit under the moves. Each move gets a score on its tile, the best move is outlined, and the top three lines are shown.

## Iteration 2 (feedback 2026-10-29: Arena first, Clash second)

Arena and Clash now share these pieces from `proto/base.js`:
- **Compact moves.** A wrapping grid of small tiles. Each tile shows its icon, name, price and its brief: the number and what it is. A brief that only repeats the move's name gets its role instead ("Stops Impact"). The grid scrolls only past four rows.
- **The last exchange as a ledger.** Each side's move and what it did for itself, then one line each way: "You ▶ them", "them ▶ You". Each line carries everything that side did to the other (its move, summon, delayed blow, poison) and the defence that met it. The fight's own text follows.
- **This exchange in one line.** Their move is "Hidden" (they answer you), "They committed" (with its brief and fight text), or "Compelled to". A blow landing now gets its own pulsing line.
- **Glowing outlines.** The ring shows the most pressing status (pink for a debuff, gold for a defence, blue for a buff, violet for a summon), with a second colour as a glow. A blow landing now pulses red.
- **Short vertical bars,** with the numbers beside them.
- **A denser timeline.** The last three exchanges (both moves, with ♥ lost under each), now, and the next three (who commits first, their move, blows landing). Each lasting effect is a coloured span under its side.
- **A split screen** (Clash only since iteration 3). Fixed at the top: the fighters and statuses. Fixed at the bottom: this exchange and the moves. The last exchange and the timeline scroll between them when the screen is short. On a phone the game's own header and meters leave the fight about 600px.

## The forks

| Fork | Idea |
|---|---|
| `a-clash` | Stacked in the live screen's order: them, then the clash (a row a side: its move, then what it did to the other), then the timeline, then you, this exchange and the moves. |
| `b-arena` | A face-off: both fighters side by side, the last exchange as two tiles plus a line each way and the fight text, then the timeline, this exchange and the moves. |
| `c-feed` | The fastest to play: one tap acts. A feed of exchanges sits right above the moves, ending in what is coming now. ⓘ or a long press reads a move first. The moves are docked at the bottom. |

All forks have number keys 1–9 (and 0) to pick a move. In A and B, Enter then commits the picked move; in C a number key acts at once.

## Layout

- `proto/base.js`: the controller and model every fork shares. It is `src/combat-ui.js`'s controller, with its engine analysis, plus three additions:
  - `recap`: what an exchange did, from the core's hit and apply events.
  - `statuses`: what is on each side.
  - `constructParts`: a summon's numbers.

  `FightProto.define(view)` returns a `CombatUI` with the game's own `open()` contract, so a fork drops into the stage as is.
- `proto/base.css`: shared pieces (bars, chips, pills, sheet, result), scoped under `.pf-layer`.
- `<fork>/fork.json` (name and summary for the bench), `<fork>/ui.js` (the view), `<fork>/ui.css`.

A new fork is a new folder with those three files. The bench lists it on its next build.

## Trying them

The combat bench plays every fight in the main game's own page: `index.html` as a card preview, with its header, meters and stage. The bench's **Fight screen** menu picks the live screen, one of these forks, or the bench's older screen (engine dock, journal, log).

- **Standalone bench (framed beside the setup, Phone / Tablet / Fill):** rebuild the site with `node combat/tools/build.mjs`, or without cargo by calling `siteFiles({game: true})` from `combat/tools/site.mjs`. Then run `node combat/out/site/server.mjs`.
- **The game's server at `/bench/`:** the server sends `X-Frame-Options: DENY`, so the game opens in its own tab instead, driven the same way.

## Before one ships

- Its new strings (`EN` in `proto/base.js`) need to go into `UI_EN` and `locales/zh-CN/ui.lang`. Until then they show in English in every language.
- Move it into `src/combat-ui.js` + `src/combat.css` and rerun the e2e (`tools/e2e.js` drives the live screen's selectors).
