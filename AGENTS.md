# AGENTS.md — working on Lumenhold Academy

Lumenhold Academy is a card-swipe life sim set at a magical academy, played in the browser (`index.html` from `file://`, or `npm start` for the local server with saves, run logs and `/admin`). Content is written in Grimoire Script (`.grim`), a data language agents extend without touching the engine.

This file holds only the standing principles and where to look. It carries no lore, no numbers and no status: those live in the files below and change; when this file and they disagree, they win.

## Where things are

| You need | Read |
|---|---|
| The design: systems, rules, numbers, phases | `docs/design-v0.3.md` |
| Current status, known gaps, next steps | `PROGRESS.md` |
| Canon (characters, places, tracks, spells, arcs, factions, lore) | the worldbook, `content/world/`, via `node tools/grim.js brief …`, `lorebook`, `query lore …` |
| How to write a good card | `skills/write-academy-events/SKILL.md` (the workflow), built from `docs/authoring/`: style, costs (how a choice trades), checks (how a check or roll is pitched), classes, presets (generated from `balance.grim`), checklist, pools, examples; batches are reviewed with `skills/critic/SKILL.md` |
| Existing cards to learn from or extend | `node tools/grim.js brief …` (every card already at that place or track, and the most similar ones in full; `--like` names more), `query event …`, `show <id>`, `graph <id>` (what leads to a card and what it leads to), `dupes <files>` |
| Whether a card is balanced | `docs/authoring/costs.md` and `classes.md` (the rules the lint checks); `node tools/grim.js balance` (invariants and alarms); `tools/economy.js --by event` (each card's flow and frequency) against the measured monthly flows in `docs/playtest-2-flows.md`; `tools/hs-funnel.js` for the main plot; `tools/exam-odds.js` for exam grades; `grim analyze` for how runs unfold month by month, per play style (`grim styles` says what each plays for) |
| How to extend canon | `skills/distill-lore/SKILL.md` |
| The language and the `.lang` format | `docs/grimoire-script.md` |
| Rules, resources, skills, hooks | `content/core/rules.grim`; tiers, presets, weights and the E(turn) curve in `content/core/balance.grim` |
| Every tool and its options | the header of `tools/grim.js` (`node tools/grim.js` prints it); `tools/economy.js` and `tools/hs-funnel.js` for balance |
| The combat minigame (every fight is played in it) | `combat/HANDOFF.md` (how it's wired in), `combat/README.md` (building and testing it alone); design §9.2 |
| Translation terms | `locales/<lang>/GLOSSARY.md` |
| Playtesting | `docs/playtest-2.md`; feedback with `node tools/grim.js feedback` |

Code: `src/grimoire.js` (parser), `src/engine.js` and `src/director.js` (DOM-free game logic), `src/ui.js` / `src/map.js` / `src/art.js` / `src/combat-ui.js` (presentation), `src/combat.js` (the bridge to the combat minigame in `combat/`), `src/i18n.js`, `src/net.js`, `server/`, `tools/`, `test/`. `build/content.bundle.js` and `build/combat.bundle.js` are generated.

## Principles

**Design**
- The design doc is the source of truth for systems and numbers; the content serves it. If you find content or code that contradicts it, fix the content or code, or record the deviation (with its reason) in `PROGRESS.md`.
- Every choice trades something: no option is free or obviously best. Amounts are always tier words and presets, never raw numbers, so `@balance` stays the one place to retune.
- Moral weight goes on `alignment` (Lumen ↔ Hollow); plot progress reads the arc (`clock(arc)`, `clues(arc)`), never a home-made counter.
- The main plot is optional: ignoring it is a valid way to play.
- Never soft-lock: a menu always has an option without `when`; a card never locks both sides.

**Canon and safety**
- The worldbook is the only canon. Read the canon you touch before writing; never copy lore into prompts, skills or docs, point to it. A new proper noun needs a soft `@lore` entry (canon lint enforces it).
- Plot safety: only hard-canon story events grant key clues (`find`) or move arc clocks (`advance`). Everyday events may be eerie but never reveal or confirm the main mystery's secrets.
- Adults only, nothing explicit, no gore (lint checks ages).

**The format and the engine**
- The engine is content-agnostic. Touch `src/` only for a new language feature, and then update, in order: `src/grimoire.js` (syntax, `SCHEMA` / `FUNCS`), `src/engine.js`, `tools/grim.js` (lint), `tools/format.js` and `tools/query.js`, `docs/grimoire-script.md`.
- The format is frozen at schema v1: features may be added, never removed or changed in meaning. Record an addition with `node tools/grim.js schema --update`.
- Never rename existing ids (saves, flags and translations reference them); use `grim rename` if you must. Change content in bulk through `tools/migrations/` (`grim migrate`), not by hand.

**Checks**
- Every change passes `node tools/grim.js check`; a larger change passes `npm run verify` before you finish.
- `grim diff` fails when the golden games play differently. For refactors that is the point. When a change is meant to alter gameplay, confirm the diff is what you intended and refresh the baseline in the same commit (`node tools/grim.js snapshot --out test/golden/baseline.json`).
- Simulated players are crude: `balance` catches gross errors and regressions; human playtests are the judge.

**Localization**
- English in `content/` is the source of truth; never translate inside `.grim` files. After English changes, run `node tools/grim.js i18n <lang>` and fill the new or STALE lines (bulk: `locales/<lang>/_in/`). Keep `{tokens}` intact and follow the glossary. New UI strings go in `UI_EN` in `src/i18n.js`.

## Traps (found the hard way)

- `build/content.bundle.js` is committed on purpose: `index.html` must work from `file://`, where local `fetch` is blocked. Rebuild after every `.grim` or `.lang` edit; never edit it by hand.
- A compiled block's type is `def.block`; `kind` is a real property (`kind: early`, track kinds).
- Translation keys count `say:` lines in source order through all branches (`opt.left.say.2`): reordering `say:` lines moves their translations. Add new branches after existing ones, then check `i18n` for STALE.
- Inbox files (`locales/<lang>/_in/`) merge last; an empty line never overwrites a translation.
- `build/combat.bundle.js` is committed too (the minigame with its wasm inlined): rebuild it after any change in `combat/` (`node combat/tools/bundle.mjs`; the wasm needs cargo, `--no-wasm` reuses the built one). `grim check` fails when it's stale.
- `boot()` must stay at the very end of `src/ui.js` (earlier calls hit the temporal dead zone of later `const`s).
- `{npc}` prints `short:` or the first word of `name` (split on spaces or `·`), hence the faculty's `short:` and the `·` in Chinese names.
- Preview cards (`index.html?event=<id>&debug`) are forced past their `when`.
