# Handoff: Lumenhold Academy, from a cloud chat session to Claude Code

This file is for the next agent, or person, picking up this project. It was written at the end of a long chat session (October 9–11, 2026) that built the game from scratch. Read this file first. Then read `AGENTS.md`, the standing guide, for the project map, world bible, balance table and conventions. This file covers only what `AGENTS.md` doesn't: the current state, the reasoning behind decisions, traps that were already found, and what's next.

Once you've taken this in, you can delete this file or fold its useful parts into `AGENTS.md`.

---

## 1. Where things stand (v0.2)

A swipe-card life sim set at a magical academy. It runs from `index.html` with no server and no install. Everything below is done and verified:

| Area | State |
|---|---|
| Engine | DOM-free and deterministic: seeded RNG stored in the save, so a save replays exactly. Parser for the custom content language, Grimoire Script (`.grim`). |
| UI | Swipe cards, menus, month and ending screens, a side panel (You / People / Journal), a `?debug` panel, and event previews. |
| Content | 354 events, 55 states, 12 NPCs, 19 endings (5 early, 14 at graduation), 11 hooks. |
| Localization | English source plus a **complete** Simplified Chinese translation (3,126 / 3,126 content strings and every UI string). Switchable in-game. |
| Tooling | `tools/grim.js`: build, lint, sim, stats, show, ids, check, i18n. `tools/e2e.js` runs browser smoke tests. |
| Docs | `README.md` (players), `AGENTS.md` (contributors), `docs/grimoire-script.md` (language and `.lang` format), `skills/write-academy-events/SKILL.md` (agent workflow), `PROGRESS.md` (roadmap), `locales/zh-CN/GLOSSARY.md` (translation terms). |

The project is **not a git repository yet.** Files were copied into this folder from the cloud session one by one.

## 2. First steps in Claude Code

```bash
git init && git add -A && git commit -m "Lumenhold Academy v0.2 (handoff from chat session)"
npm run check            # build + lint + sim 200. Expect: 0 errors, 0 warnings, 0 crashed
npm i -D playwright && npx playwright install chromium   # one-time, only for the browser tests
npm run e2e              # expect: 4x PASS (en game, zh-CN game, language switch, previews)
open index.html          # play it
```

Then, optionally, make the content-writing skill auto-load. The cloud session couldn't write to `.claude/`, so the skill is still at `skills/write-academy-events/`:

```bash
mkdir -p .claude/skills && cp -r skills/write-academy-events .claude/skills/
```

`CLAUDE.md` contains just `@AGENTS.md`, so the standing guide loads on its own.

## 3. How the pieces fit (things you'd otherwise rediscover the hard way)

**Pipeline.**
- `content/**/*.grim` and `locales/<lang>/**/*.lang` are bundled into `build/content.bundle.js` by `node tools/grim.js build`.
- The bundle is **committed on purpose**: `index.html` has to work from `file://`, where `fetch` of local files is blocked. Rebuild after every `.grim` or `.lang` edit. Never hand-edit the bundle.
- Script load order in `index.html`: `grimoire.js` → `engine.js` → `art.js` → `i18n.js` → `build/content.bundle.js` → `ui.js` (the UI boots last, once the content exists). The `src/` files are UMD, so `tools/grim.js` `require`s the same files in Node.

**Parser (`src/grimoire.js`).**
- A compiled definition stores its block type as **`def.block`**, not `def.kind`. `kind` is a real property (`kind: early` on endings); using it for the block type caused a "duplicate property" bug.
- `SCHEMA` lists the allowed properties per block. `NUM_PROPS` marks the numeric ones.
- `SYMBOLIC` functions take bare ids as arguments (`has(sick)`, not `has("sick")`).
- To add a language feature, follow the order in `AGENTS.md`: grimoire → engine → lint → docs.

**Building a month (`src/engine.js` `buildDeck`).** These are the actual rules. The docs summarise them.
- Queued cards come first, then auto cards (sorted by `priority`), then social cards, then random cards up to `cards_per_month` (3).
- `min_random_per_month: 1` (set in `@game`) forces at least one random card even when calendar beats fill every slot; the deck can then grow to `max_cards_per_month` (7). **Without this rule, the summer and year-3 random events never appeared.**
- Social card count: 1 base, +1 at 60% chance if any relationship is strong, and another +1 at 40% if you have 4 or more.
- `actor: any` events are **once per character**. `repeat: N` means a per-character cooldown of N months. All `any` events also share a 2-month global rest (`ANY_EVENT_REST`). Actors are picked weighted by relationship strength (affinity), so close friends star more often.
- Skill check odds: `clamp(50 + (skill − DC) × 3, 5, 95)`.

**Localization (`src/i18n.js`, `locales/`).**
- `I18n.extract(content)` walks every translatable field and assigns a stable key such as `opt.left.say.2`: the second `say:` in that option, counted through all branches in source order. **Reordering `say:` lines in an option changes its keys**, so run `i18n zh-CN` afterwards and re-check the translations.
- Each line carries a 6-hex FNV hash of the English it was translated from. When the English changes, the tool marks the line `# STALE`.
- `I18n.applyContent` rewrites the compiled content **in place** before the engine sees it, so the engine knows nothing about languages.
- Pronouns come from the `pronoun.*` keys in `ui.lang`. Chinese uses 她/他/TA, and `{are}` and `{s}` are intentionally empty. Empty pronoun values are treated as set, not missing.
- Inbox files in `locales/<lang>/_in/` merge **last** in sorted order, and an empty line never overrides a translation. Two batches of translations were once lost because inbox files sorted first and their blank lines wiped real ones.
- The journal stores `sayIds` (and `key`) rather than final text, so switching language re-renders past entries.
- Switching language saves, sets `lumenhold.resume` in localStorage, reloads, and resumes the game. `?lang=xx` forces a language. Chinese fonts load on demand.

**UI (`src/ui.js`).**
- `boot()` must stay at the **very end** of the IIFE. Calling it earlier hits the temporal dead zone of later `const`s ("Cannot access 'sceneNote' before initialization") on the preview and resume paths.
- Preview cards (`?event=`) are flagged `force`, so they skip their `when` condition.
- Saves live in localStorage under `lumenhold.save.v1`, with settings in `lumenhold.settings.v1`. The engine save has `version: 1`. If you change the save shape, bump the version and handle old saves.

**NPC names.** `{npc}` prints `short:` if set, otherwise the first word of `name` split on spaces or `·`. That is why the faculty have `short:` (`Professor Thorne`, `Old Maud`, `Headmistress Marrow`), and why the Chinese names use `·` (伊尔泽·杜蒙 → 伊尔泽).

## 4. Health snapshot (end of session)

| Check | Result |
|---|---|
| `lint` | 0 errors, 0 warnings (2 info) |
| `i18n` | zh-CN 100.0%, 0 stale |
| `sim 300` (random policy) | 0 crashes. 345/354 events seen. Endings: graduate 18%, alchemist 12%, scholar 12%, barely 10%, archmage 9%, hollow_keeper 9%, beloved 6%, … teacher 0.3% |
| `sim 300 --policy social` | beloved **52%** (see open issues), scholar 11%, alchemist 8%, archmage 7% |
| `sim 300 --policy cautious` | scholar 20%, hollow_keeper 18%, graduate 12%, alchemist 11% |
| `e2e` | 4/4 PASS. Full games in en and zh-CN with no page errors and no stray English. Language switch and previews work. |

Never seen under random play:
- **Events:** forbidden_section_3, grisk_favour, grisk_smuggling, lyra_rival_respect, lyra_rival_sabotage, tobias_picnic, corvin_runaway, soc_breakup, soc_two_timing.
- **Endings:** ending_sent_home, ending_runaway, ending_beloved_friends.

These are mostly deep chain steps or require specific bond states.

## 5. Open issues and suggested next work (in priority order)

> **The larger v0.3+ redesign** (4-year university, tracks, places, director, economy, spells, minigames, live LLM generation) is planned in **`docs/design-v0.3.md`**, including a phased implementation order. Its Phase 0 supersedes items 2–4 below: tune balance with the new balance tests rather than by hand.

1. **Put the project under git** (§2) before changing anything.
2. **The "beloved" ending is too strong for social players** (52%, against the guideline of at most 35%). Options:
   - Tighten its `when` in `content/endings.grim`.
   - Raise the priority of competing endings.
   - Add a "beloved + career" combination ending.
3. **Unreached content:** loosen the `when` conditions or raise the `weight` of the 9 never-seen events, or mark them as deliberately rare in a comment.
   - `ending_runaway` and `ending_sent_home` may need a sim policy that makes reckless choices to confirm they're reachable.
   - Use `node tools/grim.js show <id>` to trace each one.
4. **The teacher ending is rare** (0.3% random, 3.3% social). That may be fine, since it needs a faculty relationship of 25 or more, but check that it feels reachable in a deliberate run.
5. **Ilse's chain has no ending payoff.** Flags `ilse_saved`, `ilse_went_north`, `dumont_reunited` and `ilse_goodbye` are set but not read by any ending. Candidates: an epilogue line in existing endings via `{=…}`, or a dedicated ending.
6. **The Chinese has not been checked by a native speaker.** It was written to `GLOSSARY.md` by an LLM. A native read-through is worthwhile, especially for option labels (≤14 characters) and the tone of romance scenes.
7. **Roadmap ideas** (from `PROGRESS.md`):
   - Per-class exam marks.
   - Items and inventory (an `@item` block).
   - Relationship decay.
   - Multiple save slots.
   - Real art. Every event already has a `scene:` description ready for an artist or an image model.
   - Sound.
   - `grim new <kind>` scaffolding.
   - A "goal" sim policy.
   - A third language (`node tools/grim.js i18n fr` scaffolds it).

## 6. Rules of the road

- **After any content change:** run `build`, `lint`, `sim 300`, `sim 300 --policy social`, then `i18n zh-CN` and translate the new lines (the workflow is in `SKILL.md` §4b). Finish with `npm run e2e`.
- **Never rename existing ids.** Saves, flags, `.lang` keys and other events reference them.
- **Never edit translations inside `.grim` files.** English is the source. Translations live only in `locales/`.
- **New UI strings** go into `UI_EN` in `src/i18n.js`, are used via `t('key')`, and need a matching line in `locales/zh-CN/ui.lang`. Lint warns if one is missing or its placeholders differ.
- **Balance numbers** follow the table in `AGENTS.md`. Every option should cost or risk something.

## 7. How we got here (session history)

1. **Build request.**
   - The user asked for a fantasy-academy life-sim engine with:
     - two-choice swipe cards, resources, skills and occasional menus;
     - persistent states, a limited number of monthly turns, social and romance systems, and event chains;
     - SVG placeholder art;
     - an LLM-extensible scripting format with a skill or agent guide, and 200+ events.
   - Result: v0.1 with 254 events.
2. **Pause and resume.** The user paused to get a progress report, then resumed. Docs were polished, balance tuned (earlier fixes: generic events were once per game and became once per character; Standing drift was too harsh; Mood ran too high), and everything verified.
3. **Localization and expansion.**
   - The user asked for a localization module plus a full Simplified Chinese translation, then 100 more events.
   - Result: v0.2, covering the i18n module and tooling, the zh-CN translation, and the new files:
     - `expansion_y3` (careers → teacher and wanderer endings)
     - `expansion_summer`
     - `expansion_faculty`
     - `chain_ilse` (new NPC Ilse)
     - `expansion_people`
     - `expansion_social`
     - `expansion_life` (time-loop chain)
     - `expansion_classes`
     - new states `garden_plot`, `pen_pal`, `frost_ward`
4. **Handoff.** Moving the project from chat to Claude Code: this file, the portable `tools/e2e.js`, and `.gitignore`.

## 8. A first prompt to paste into Claude Code

> Read HANDOFF.md, then AGENTS.md. Initialise git and commit the current state. Run `npm run check` and `npm run e2e` and tell me whether both are green. Then propose a plan for open issue #2 (the beloved ending dominating social play) without changing anything yet.
