# Lumenhold Academy

*Four years. Forty-eight moons. One apprentice.*

A swipe-card life simulation at a magical academy. Each month is one day: pick two places on the campus map, then swipe through the day's cards to choose. Enrol in courses, keep up with a club and a job, plan your breaks, keep your Health and Mood up and your purse from emptying, grow six skills and twelve spells, befriend, romance or feud with twelve characters (and get to know eight more: the professors, the healer, the shopkeepers and a moneylender), lean toward the Lumen or the Hollow, and decide what to do about the secret beneath the lake. At graduation your yearbook collects what you became: a headline, the Hollow Star's outcome, your bonds and how you're remembered. Playable in **English** and **简体中文** (Simplified Chinese).

## Play

Open **`index.html`** in a browser (double-click works; no server or install needed). The game autosaves to your browser after every card.

Or run the local server (Node 20+, no install needed): `npm start`, then open http://127.0.0.1:4173. With the server, saves (an autosave plus 3 slots), full run logs and your card ratings are stored in `data/`, and `/admin` shows runs and feedback by event.

To play from other devices on your network, run `./scripts/host.sh` (Linux, macOS), `scripts\host.cmd` or `scripts\host.ps1` (Windows). It serves on 0.0.0.0 and prints the links. Players need the link that includes `?token=…` for saves and run logs; the same token opens `/admin`, and save slots are shared by everyone on the server.

- **Swipe** the card, click a choice button, or press **← / →**. **Enter** continues.
- In menus, click a tile or press **1–9**.
- **Previews** on every choice show what it will change; a challenge shows its odds.
- The side panel shows your skills and conditions (**You**), relationships (**People**) and a log of every choice (**Journal**). On narrow screens it opens from the people icon.
- Pick a language on the title screen, or switch mid-game with the globe icon (your game is saved and resumed in the new language). `index.html?lang=zh-CN` forces one.
- The feather icon toggles the *Illustration:* notes, which are placeholder descriptions for future artwork. The scroll icon opens **Saved games**.
- **Playtest feedback:** the bar in the bottom-left corner rates the current and the previous card 👍 / 👎; **F** (or ✎) adds a comment. The Journal has the same controls for earlier cards.

## What's in it

- **About 740 events** in a custom scripting language: a four-year calendar of terms, breaks and festivals; 43 places on the campus map; 25 tracks (9 courses with three levels and exams, 4 clubs, 4 jobs, 7 internships and the thesis); 12 characters with personal arcs and 8 lighter ones (professors, staff, villagers); relationship events; a main mystery (*The Hollow Star*) in four acts with five outcomes; Ilse Dumont's chain and smaller chains.
- **Alignment:** choices with moral weight move you toward the Lumen or the Hollow, and the people and the Star notice.
- **Relationships:** each character has a relationship score, romance (for romanceable characters) and a status (friend, close, rival, nemesis, partner, ex). The more people you're close to, the more social cards each month brings.
- **25 endings**: 5 early game-overs, and a graduation yearbook built from headline, mystery, relationship and personal lines.
- **Localization:** every string (UI and content) is translatable through key-based `.lang` files in `locales/<lang>/`. Simplified Chinese is complete.

## Extending it

All content lives in `content/**/*.grim` (Grimoire Script). Read **`AGENTS.md`** for the principles and where everything lives (canon is in the worldbook, `content/world/`; the design in `docs/design-v0.3.md`), and **`docs/grimoire-script.md`** for the language. LLM agents should follow **`skills/write-academy-events/SKILL.md`**. To make it an auto-loaded Claude Code skill, copy that folder to `.claude/skills/write-academy-events/`.

The tools need [Node.js](https://nodejs.org) 20+ (the game doesn't):

```bash
npm run build     # or: node tools/grim.js build   — required after editing .grim files
npm run lint      # cross-reference check
npm run sim       # auto-play 300 games: coverage, endings, balance
npm run check     # build + lint + sim
node tools/grim.js i18n          # translation coverage per language
node tools/grim.js i18n zh-CN    # create / refresh the zh-CN .lang files after content changes
```

Preview any event in the browser with `index.html?event=<id>&debug`; `?debug` alone adds a content-debug panel.

## Layout

```
index.html            game entry
src/                  grimoire.js (parser), engine.js (rules), i18n.js (localization), ui.js + style.css, art.js (SVG placeholders)
content/              all game content (.grim, English source)
locales/zh-CN/        Simplified Chinese translation (.lang) + GLOSSARY.md
build/                generated content bundle — rebuild, don't edit
tools/grim.js         build / lint / sim / stats / show / ids / i18n
docs/                 language reference
AGENTS.md             guide for contributors and agents
```
