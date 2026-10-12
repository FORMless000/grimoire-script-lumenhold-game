# Lumenhold Academy

*Three years. Thirty-six moons. One apprentice.*

A swipe-card life simulation at a magical academy. Each month brings a handful of cards: swipe left or right to choose. Some moments open a menu: choosing your elective, club, part-time job or summer plans. Keep your Health, Mood, Gold and Standing above zero, grow six skills, befriend, romance or feud with twelve characters, uncover the secret beneath the lake, and see which of 19 endings you earn. Playable in **English** and **简体中文** (Simplified Chinese).

## Play

Open **`index.html`** in a browser (double-click works; no server or install needed). The game autosaves to your browser after every card.

- **Swipe** the card, click a choice button, or press **← / →**. **Enter** continues.
- In menus, click a tile or press **1–9**.
- **Glowing dots** above the meters show which resources a choice will touch. A dice line on a button shows a skill check and its odds.
- The side panel shows your skills and conditions (**You**), relationships (**People**) and a log of every choice (**Journal**). On narrow screens it opens from the people icon.
- Pick a language on the title screen, or switch mid-game with the globe icon (your game is saved and resumed in the new language). `index.html?lang=zh-CN` forces one.
- The feather icon toggles the *Illustration:* notes, which are placeholder descriptions for future artwork.

## What's in it

- **354 events** in a custom scripting language: calendar beats, 10 electives, 7 clubs, 6 jobs, 12 characters with personal arcs (including faculty arcs), 35 generic relationship events, summer recess and final-year careers, a main mystery (*The Hollow Star*) with three finales, Ilse Dumont's chain, and seven smaller chains.
- **55 persistent states**: origins, classes, clubs, jobs, illnesses, curses, debts, familiars.
- **Relationships:** each character has a relationship score, romance (for romanceable characters) and a status (friend, close, rival, nemesis, partner, ex). The more people you're close to, the more social cards each month brings.
- **19 endings**: 5 early game-overs and 14 graduation outcomes.
- **Localization:** every string (UI and content) is translatable through key-based `.lang` files in `locales/<lang>/`. Simplified Chinese is complete.

## Extending it

All content lives in `content/**/*.grim` (Grimoire Script). Read **`AGENTS.md`** for the project map, world bible and balance rules, and **`docs/grimoire-script.md`** for the language. LLM agents should follow **`skills/write-academy-events/SKILL.md`**. To make it an auto-loaded Claude Code skill, copy that folder to `.claude/skills/write-academy-events/`.

The tools need [Node.js](https://nodejs.org) 18+ (the game doesn't):

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
