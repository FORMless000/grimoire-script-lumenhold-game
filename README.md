# Grimoire Script · Lumenhold Academy

An experiment in letting language models write a game. **Grimoire Script** is a small scripting language invented for this project, together with the tools and skills that let LLM agents author content in it. **Lumenhold Academy** is the game they are writing.

Inspired by *Reigns*, *Princess Maker* and storylet-driven narrative, with minigames that owe a debt to *Griftlands* and chess engines.

## Ambitions

- **A script simple enough for an LLM to write well.** A card is a few lines of plain text: who is there, what happens, two choices and what each one trades. Amounts are words (`mood +small`, `challenge negotiate hard`), not numbers, so the numbers live in one balance file and the whole game can be retuned without touching a card. The engine knows nothing about the academy: everything in the game is Grimoire Script ([`docs/grimoire-script.md`](docs/grimoire-script.md)).
- **Skills that do the writing.** Humans don't write events. They curate the worldbook (the canon, kept as data), playtest, and delete what doesn't belong. Agents work from skills: [`write-academy-events`](skills/write-academy-events/SKILL.md) writes a batch around a brief, [`critic`](skills/critic/SKILL.md) reviews it with a separate agent, and [`distill-lore`](skills/distill-lore/SKILL.md) grows the canon. All three read one authoring spec ([`docs/authoring/`](docs/authoring/)).
- **Checks instead of trust.** Every batch passes the same validators before it counts. The lint checks syntax, canon (a new name needs a lore entry), safety (adults only, nothing explicit) and the cost of every choice. Thousands of simulated players in a dozen play styles catch balance drift, golden games catch unintended changes, and a duplicate check flags lookalike cards. The goal is to accept a batch automatically when everything passes, with humans spot-checking a sample.
- **A loop closed by players.** Run logs and 👍/👎 ratings come back from playtests. The tools turn them into reports: a choice nobody takes, a card nobody sees, text that confuses. Agents then rebalance, rewrite or retire the cards those reports point to.
- **Next: a harness, then live generation.** The same pipeline is meant to run without a person driving the session:
  - plan the content;
  - retrieve the context;
  - write it as schema-constrained output;
  - validate it with the same code;
  - critique it with a separate model;
  - repair it, at most twice;
  - translate it.

  At first this harness would write batches on a schedule. Later it would write cards during play, shaped by how each player plays and delivered a month or two ahead, so the game never waits. Generated cards run in a sandbox: tier words only, their own flags, no touching the main mystery. They are kept for one run or saved to a shared library with their provenance. This part is a plan, not built yet ([design §T3](docs/design-v0.3.md)).

## Lumenhold Academy

*Four years. Forty-eight moons. One apprentice.*

A card-swipe life sim at a magical academy. Each month is one day. Pick two places on the campus map, then swipe through the day's cards to choose. Along the way you can:
- enrol in courses with exams, keep up with a club and a job, and plan your breaks and internships;
- keep your Health and Mood up and your purse from emptying;
- grow six skills and learn spells;
- befriend, romance or feud with the people around you;
- lean toward the Lumen or the Hollow;
- decide what to do about the secret beneath the lake.

Fights are played, not rolled. Every duel and brawl opens a turn-based combat minigame in place of the cards, against an AI opponent that plays its character. At graduation your yearbook collects what you became: a headline, the Hollow Star's outcome, your bonds and how you're remembered. Playable in **English** and **简体中文** (Simplified Chinese).

### Play

Open **`index.html`** in a browser. Double-clicking it works, with no server or install needed. The game autosaves to your browser after every card.

Or run the local server (Node 20+, no install needed): `npm start`, then open http://127.0.0.1:4173. The server keeps saves (an autosave plus 3 slots), full run logs and your card ratings in `data/`, and `/admin` shows runs and feedback by event.

- **Your local network:** run `./scripts/host.sh` (Linux, macOS), `scripts\host.cmd` or `scripts\host.ps1` (Windows). It prints the links. Each browser gets its own player code.
- **Another device:** Saved games → **Play on another device** carries your saves over.
- **Hosting online:** see [`docs/hosting.md`](docs/hosting.md). Every `git push` updates GitHub and deploys to a small server, and every playtester's browser gets its own player code.

**Controls:**
- **Swipe** the card, click a choice button, or press **← / →**. **Enter** continues. In menus, click a tile or press **1–9**.
- **Previews** on every choice show what it will change. A challenge shows its odds, and a fight shows your opponent and their level.
- **The side panel** shows your skills and conditions (**You**), relationships (**People**) and a log of every choice (**Journal**). On narrow screens it opens from the people icon.
- **Settings** has the opponents' difficulty. Difficulty changes how well the AI plays, never the numbers. Settings also has an optional *engine analysis* for your own fights, marked as cheating.
- **Language:** pick one on the title screen, or switch mid-game with the globe icon. `index.html?lang=zh-CN` forces one.
- **Playtest feedback:** the bar in the bottom-left corner rates the current and the previous card 👍 / 👎. **F** (or ✎) adds a comment. The Journal has the same controls for earlier cards.

### What's in it

- **About 1,090 events** in Grimoire Script. They cover:
  - a four-year calendar of terms, breaks and festivals;
  - 43 places on the campus map and beyond;
  - 25 tracks: 9 courses with three levels and exams, clubs, jobs, 7 internships and the thesis;
  - personal arcs;
  - a main mystery, *The Hollow Star*, in four acts.
- **21 characters**, 7 of them romanceable. Each has a relationship score and a status (friend, close, rival, nemesis, partner, ex). The places and tracks have their own regulars.
- **35 spells.** They're used on cards and in fights at one Mana price.
- **The combat minigame:** rules and AI written in Rust and compiled to WebAssembly, bundled so the game still runs from `file://`.
- **Alignment:** choices with moral weight move you toward the Lumen or the Hollow, and people notice.
- **35 endings:** 5 early game-overs, and a graduation yearbook assembled from the rest.
- **Localization:** every string, UI and content alike, is translated through key-based `.lang` files in `locales/<lang>/`. Simplified Chinese is complete.

## Extending it

All content lives in `content/**/*.grim`. Start with **[`AGENTS.md`](AGENTS.md)**, which holds the principles and says where everything lives. The canon is the worldbook in `content/world/`, the design is [`docs/design-v0.3.md`](docs/design-v0.3.md), and the language is [`docs/grimoire-script.md`](docs/grimoire-script.md). LLM agents follow the skills in [`skills/`](skills/). To have Claude Code load one automatically, copy its folder to `.claude/skills/`.

The tools need [Node.js](https://nodejs.org) 20+; the game doesn't. `node tools/grim.js` lists every command.

```bash
npm run build                      # rebuild build/content.bundle.js — required after editing .grim files
node tools/grim.js check           # build + lint + 200 simulated games: every change must pass
node tools/grim.js brief --place <id>   # what a writer needs before adding cards at a place (or --track, --cast, --arc)
node tools/grim.js balance         # simulated players: invariants and alarms
node tools/grim.js i18n zh-CN      # refresh the Chinese .lang files after content changes
npm run verify                     # the full pre-commit suite
```

Preview any event with `index.html?event=<id>&debug`. `?debug` alone adds a content-debug panel.

## Layout

```
index.html            game entry (works from file://)
content/              the game, in Grimoire Script (English source); content/world/ is the worldbook
locales/zh-CN/        Simplified Chinese (.lang) + GLOSSARY.md
src/                  grimoire.js (parser), engine.js + director.js (rules, no DOM), ui.js, combat-ui.js, i18n.js, net.js
combat/               the combat minigame: Rust rules and AI → wasm, setup, bridge (see combat/HANDOFF.md)
build/                generated bundles (content, combat) — rebuild, don't edit
skills/               agent skills: write events, critique a batch, distill lore
docs/                 design, language reference, authoring spec, hosting
tools/                grim.js (build, lint, brief, balance, analyze, i18n, …) and the balance tools
server/, deploy/      the optional server (saves, run logs, /admin) and push-to-deploy
AGENTS.md             the standing guide for contributors and agents
```

## License

© 2026 FORMless000. Released under the [WTFPL](LICENSE): do what you want with it.
