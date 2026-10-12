# AGENTS.md — working on Lumenhold Academy

Lumenhold Academy is a card-swipe life sim set at a magical academy. It runs locally in the browser by opening `index.html`; there is no server and no install. Content lives in a custom scripting language, Grimoire Script (`.grim`), which agents can extend without touching the engine.

**Adding events, characters, states or chains?** Follow `skills/write-academy-events/SKILL.md` and use `docs/grimoire-script.md` as the language reference. Every change must pass `node tools/grim.js check`. Content is written in English; translations live in `locales/` (see **Localization** below).

---

## Project map

```
index.html                 entry point; loads src/* and build/content.bundle.js
src/grimoire.js            parser + expression compiler (UMD: browser + Node)
src/engine.js              DOM-free game logic (turns, deck, effects, states, relationships, endings)
src/i18n.js                 localization: .lang parser, string extraction, applyContent, UI string table (UI_EN), t()
src/art.js                 SVG icon library, card scene composer, procedural portraits
src/ui.js, src/style.css   presentation only: swipe cards, menus, month & ending screens, side panel, ?debug panel
tools/grim.js              CLI: build | lint | sim | stats | show | ids | check | i18n
build/content.bundle.js    GENERATED — all .grim sources + .lang files as one JS file (so file:// works). Never edit by hand.
content/core/rules.grim    @game, resources, skills, global hooks (rent, drift, start)
content/npcs/cast.grim     the 12 characters
content/states/states.grim origins, electives, clubs, jobs, conditions
content/endings.grim       early (game-over) and graduation endings
content/events/*.grim      events, grouped by theme (see below)
docs/grimoire-script.md    language reference (includes the .lang format)
locales/<lang>/            translations: one .lang per .grim file, plus ui.lang and GLOSSARY.md
```

The engine is content-agnostic. Only touch `src/` when you need a new language feature (a new statement, function or block property). When you do, update `src/grimoire.js` (syntax plus `SCHEMA` / `FUNCS`), `src/engine.js` (semantics), `tools/grim.js` (lint), and `docs/grimoire-script.md`, in that order.

### Event files

| File | Contents | Triggers |
|---|---|---|
| `calendar.grim` | The year's fixed beats: intro, origin, elective/club/job menus, festivals, exams, summer, graduation | mostly `auto` |
| `classes.grim` | 3 events per elective, gated on `has(class_x)` | random, weight 16 |
| `clubs.grim` | 3 per club, gated on `has(club_x)` | random, weight 14 |
| `jobs.grim` | 3 per job, gated on `has(job_x)` | random, weight 14 |
| `people_students.grim` | Per-character arcs for Lyra, Tobias, Seraphine, Corvin, Mira, Nessa | intros `random`, rest `social` |
| `people_others.grim` | Kael (outside the main chain), Bram, Thorne, Maud, Isolde | same |
| `social.grim` | Generic `actor: any` relationship events (friendship, romance, rivalry, decay) | `social` |
| `chain_hollowstar.grim` | The main mystery and its finale | mixed |
| `chains_minor.grim` | Forbidden section, curse cure, Grisk's debt, Ember the fox, the ghost | mixed |
| `life.grim` | Everyday academy life, money, seasons | random |
| `crisis.grim` | What happens when a resource hits zero | queued |
| `expansion_y3.grim` | Final year: Career Fair menu → interview → offer (`career_*` flags feed the teacher / wanderer endings), thesis, portrait, farewells | auto + random |
| `expansion_summer.grim` | `sum_*` summer-recess events (castle, home, travel) | random, months 11–12 |
| `expansion_faculty.grim` | Short arcs for Thorne, Maud and the headmistress | social |
| `expansion_people.grim` | More per-character events for the student cast | social |
| `expansion_social.grim` | More generic `actor: any` relationship events | social |
| `expansion_life.grim` | More everyday life, incl. the `timeloop` chain | random |
| `expansion_classes.grim` | One more event per elective, plus compulsory broom flight | random |
| `chain_ilse.grim` | Ilse Dumont's chain (flags `ilse_saved`, `ilse_taken`, `dumont_reunited`, …) | social |

---

## Workflow

```bash
node tools/grim.js build      # regenerate build/content.bundle.js — required after any .grim change
node tools/grim.js lint       # cross-reference check; 0 errors required, read the warnings
node tools/grim.js sim 300    # auto-play: crashes, soft-locks, coverage, ending distribution
node tools/grim.js check      # build + lint + sim 200 — run before you finish
node tools/grim.js show <id>  # print a block's source and everywhere it's referenced
node tools/grim.js ids flag   # list existing ids (event|state|npc|ending|resource|skill|flag|var)
node tools/grim.js stats      # counts by file / trigger / tag / actor / chain
```

To preview a single event in the browser, open `index.html?event=<id>&debug`; add `&actor=<npc>` for `actor: any` events. With `?debug`, a panel lets you play any event now, skip the month, or run an effect line (`gold = 200`, `rel lyra +40`, `gain class_umbral`).

Node is only needed for the tools. The game itself is plain static files.

---

## World bible (keep new content consistent)

**Setting.** Lumenhold Academy is seven towers joined by bridges of light, standing above a mirror-still lake. A village lies below, reached by barge. The Whisperwood forest is nearby. Rival school: Thornwick Academy. Currency: crowns (`gold`). The tone is warm, witty and slightly melancholy, like a cosy fantasy novel. Humour comes from specifics, not from winking at the reader. There is no gore, and nothing explicit.

**Calendar** (`month` 1–12; 3 years = 36 turns):

| # | Month | Fixed beats |
|---|---|---|
| 1 | Harvestmoon | new year, elective menu, Harvest Feast |
| 2 | Emberwane | Club Fair, Lantern Night |
| 3 | Mistveil | Job Board |
| 4 | Frostcall | Winter Trials (exam) |
| 5 | Deepwinter | Midwinter Ball |
| 6 | Thawmoon | second-term elective menu |
| 7 | Stormbloom | — |
| 8 | Greenrise | Spring Tournament |
| 9 | Blossomtide | Job Board; year-3 Hollow Star finale |
| 10 | Highsun | Grand Examinations |
| 11 | Goldenhaze | summer recess, summer plans menu |
| 12 | Starfall | Starfall festival; graduation eve in year 3 |

**Player.** Five resources (top meters): `health`, `mood`, `gold`, `grades` (shown as "Standing"), `renown`. Six skills: `arcana lore alchemy charm vigor guile`. Origins (`origin_*` states) are picked at the start.

**Cast.**

| id | Who | Romance | Hooks |
|---|---|---|---|
| lyra | Lyra Vaneshade, noble pyromancy prodigy; proud, lonely | yes | rivalry → respect; her mother's pressure |
| tobias | Tobias Fennick, farm boy on a scholarship; gentle, talks to plants | yes | homesick; family harvest; Gerald the mandrake |
| seraphine | Seraphine Hale, seer; dreamy, half in other times | yes | prophecies; drawn to the lake |
| corvin | Corvin Ashby, charming thief; in debt, on last warning | yes | Midnight Cartographers; may ask you to run away |
| mira | Mira Ten (they/them), chaotic artificer | yes | inventions; the clockwork owl; family pressure |
| kael | Kael Dumont, transfer from the frozen North; cold hands | yes | **main mystery**: his family serve the Hollow Star |
| nessa | Nessa Quill, editor of the Lumen Ledger | yes | scoops, gossip columns, press freedom |
| bram | Bram Hollis, bullying prefect | no | demerits, sabotage; a possible redemption arc |
| thorne | Professor Aldric Thorne, Arcana; severe mentor | no | office hours; recommendation letter |
| maud | Old Maud, groundskeeper and hedge-witch | no | remedies, secret garden, knew the last Hollow night |
| isolde | Headmistress Isolde Marrow | no | knows everything; recruits you as a Warden |
| ilse | Ilse Dumont, Kael's younger sister, raised by the Hollow cult | no | appears from year 2 once you know of her; can be saved from the man in grey |

Faculty (`thorne maud isolde`) carry `tags: faculty`. Exclude them from peer events with `not tagged(npc, faculty)`.

Minor named figures you may reuse: Professor Marisol (Tidecalling), Professor Vey (Illusion), Professor Brask (Beastcraft), Sister Amaranth (infirmary), Grisk (goblin moneylender), the man in grey (Hollow cult), Pim (your first-year mentee), Footnote (library cat), Bartholomew (Maud's goat), Edmund (Maud's lost friend), the Duchess of Ambry (escaped portrait), the Oracle of Vell (Seraphine's mother), Prudence Ashworth (ghost), Pell & Daughters (apothecary), the Gilded Newt (tavern), Mabel's tea shop, Grimsby's Books.

**The Hollow Star (main chain).** A light-eating star sleeps beneath the lake, sealed by the founders (seven towers, seven locks, a star-shaped key). Clue events set flags and add `hollow +1`. At `hollow >= 3` the headmistress gets involved; in year 3, month 9, the lake freezes (`hs_the_night`), and `hs_beneath` decides between `hollow_sealed`, `hollow_bargain`, ending claimed, or fleeing. New clue events should `hollow +1` and be gated with sensible `when`s.

---

## Balance guidelines

| Change | Small | Typical | Big (rare, earned) |
|---|---|---|---|
| health / mood | ±2–4 | ±5–8 | ±10–20 |
| gold | ±5 | ±10–25 | ±30–60 |
| grades (Standing) | ±1–3 | ±4–6 | ±10–16 (exams) |
| renown | ±1–2 | ±3–5 | ±8–15 |
| skill | +1 | +2 | +3–4 |
| rel | ±2–4 | ±5–8 | ±10–20 (milestones, betrayals) |
| love | +2–4 | +5–8 | +12–15 (confessions) |

- **Skill check DCs:** 10 is easy early on, 15 moderate, 20 hard, 25+ heroic. Starting skills are about 6–15 and reach 30–60 by graduation. Scale with year when it matters: `12 + year * 8`.
- **Monthly baseline:** every month draws at least one random card (`min_random_per_month: 1`) even when calendar cards fill the slots; rent −10 gold, term stress −1 mood (−4 in exam months), coursework −1 Standing every other month. Jobs pay 10–18 a month.
- **Every option should cost or risk something.** A choice between two good things or two bad things beats an obvious one. The best cards trade one resource for another.
- **Weights:** default 10. Gated class, club and job events use 14–16. Milestone events (friendship, confession) use 18–30 so they show up soon after unlocking. Very niche events use 6–8.
- After adding content, run `sim 300` and `sim 300 --policy social`. No single graduation ending should exceed about 35% under random play, and your new events should not appear in "never seen" unless they are deliberately rare. If one is, loosen its `when` or raise its `weight`.

## Conventions

- **Event ids** are prefixed by area: `pyro_`, `tide_`, `duel_`, `lib_`, `lyra_`, `soc_`, `life_`, `hs_` (Hollow Star), `fox_`. Use `<chain>_<step>` for chains.
- **Flags** are past-tense facts (`kael_told`, `fox_met`). Custom counters are nouns (`hollow`, `debt_paid`).
- **Every event** has `title`, `text`, `art`, `tags`, `scene`. Option labels stay under about 36 characters, imperative or first-person ("Open the book", "I'll be there.").
- **Every option** has at least one effect, and almost always a `say:` so the player sees a consequence.
- **Never soft-lock:** menus need at least one option without `when`, and cards must not lock both sides.
- **Don't edit** `build/content.bundle.js` by hand, and don't rename existing ids (saves and flags reference them).

---

## Localization

English in `content/**/*.grim` is the source of truth. Each language has a folder `locales/<lang>/` mirroring `content/` (`events/life.lang` translates `events/life.grim`), plus `ui.lang` for interface strings and `GLOSSARY.md` for names and terms.

- **Never translate inside `.grim` files.** Write the English, then run `node tools/grim.js i18n zh-CN`. It rewrites every `.lang` file: new strings appear as empty `key [hash] = ` lines under a `# en:` comment, removed strings move to `_obsolete.lang`, and lines whose English changed are marked `# STALE`.
- **Translate** by filling the text after `=`. For bulk work, drop files into `locales/<lang>/_in/` containing just `@event id` headers and `key = text` lines; the next `i18n` run merges them into the canonical files (an empty line never overwrites a translation) and deletes the inbox file.
- **Keep tokens:** `{npc}`, `{player}`, `{lyra}`, `{=expr}` must survive (lint errors otherwise). Pronoun tokens are filled from `ui.lang` `pronoun.*` keys; in Chinese, `{s}` and `{are}` are simply dropped.
- **Follow `locales/zh-CN/GLOSSARY.md`** for names, places, resources and tone; add new proper nouns there.
- `node tools/grim.js i18n` prints coverage; `lint` warns about untranslated or stale strings and token mismatches; `sim --lang zh-CN` plays with the translation applied.
- New UI strings go in `UI_EN` in `src/i18n.js` and are used via `t('key')` in `ui.js`.
