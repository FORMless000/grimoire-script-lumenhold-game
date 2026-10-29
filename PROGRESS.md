## Phase 4 started: the Journal, facts, NPCs among themselves, renown (October 27)

The plan, budgets (about 228 new cards in 14 batches), decisions, ledger and "Next up" live in `docs/phase4-plan.md`; archetypes, spawned characters and memory recall are deferred.

- **Step 1, engine and UI (done):**
  - **The Journal tab** takes in the Clues tab. Its sections are the main story (each arc's act, opened by `act_clock:`, with that act's `act_rumours:` line; an `epilogue:` once closed), Stories (a `@thread`'s `name:`, `premise:` and `journal:` lines, each stamped the turn its condition first holds, and a `status:`), Leads to follow, and the Diary (the choice log, collapsed; the ending screen opens it).
  - **The People panel** lists the facts you know by tier, newest first, with a gold dot until you open the row. The unknown ones show as their `hint:` or one count line per tier. Whom each person gets on with and can't stand appears once an `npc_rel` effect has moved the pair; "friends since" shows too. Facts unlocked at a month's start are announced.
  - **Renown** shows its tier (`tiers: 30 Known, 60 Famous, 85 Legend`), with a notice on reaching a higher one.
  - Schema v1 additions: `@thread premise/journal/status`, `@arc act_rumours/epilogue/act_clock`, `@fact hint`, `@resource tiers`. Tests: `test/phase4.test.js`. The golden games are unchanged.
- **Steps 2–4, content (done, October 27–28):**
  - **Journal lines** for 20 threads and the 5 arcs; renown fades by tier (a fifth below Known, 15% while Known, 12% from Famous).
  - **210 new cards in 14 batches** (P4-01..14): people among themselves, renown spotlights by tier, scandals and the fall, the Season (`the_season`), facts that matter (27 new facts, `knows()` cards and 28 `if knows(...)` branches in older cards), the Journal's year recaps and nudges. zh-CN is complete.
  - **Review:** the critic accepted every batch (P4-01 and P4-10 on round two). On the new retrieval backend every card was rechecked against the others; five overlaps across batches were reworked (`build/batches/P4-recheck.notes.md`).
- **Balance pass (done, October 28):** 0 invariant failures. Of the 19 alarms, 16 are the ones from before phase 4's cards; the other three sit just past their lines (balanced's windfalls at 0.8 a year against a floor of 1, and homebody's and spender's archmage headline at 37% and 36% against 35%). The cards no style sees are rare by design. Legend's fade stays at 12%: a month begins at Legend only from 97 before the fade, so the renown-chaser holds it a month or three, after winning the Spring Tournament while Famous. A skill rusted or injured below 1 no longer crashes a fight (the combat bridge clamps to 1–100). Details and the deviations: `docs/phase4-plan.md`. `verify:full` passed except the browser e2e, which was skipped.
- **Next:** a human playtest of the four systems. Still deferred: archetypes, spawned characters, memory recall.

## Feedback round: careers, the last day, the Hollow Star, the ring (October 25–26)

The 13 open notes of the longest run's playtest (turns 35–46) and five requests that came with them: `docs/feedback-2026-10-25-plan.md` (what each note became), `docs/plots/hollowstar-v2.md` (the plot's outline and decisions). zh-CN complete.
- **Language** (schema v1 additions): `close <arc>` and `closed(<arc>)` (a closed arc deals nothing, drops its queued cards, finds nothing); `bond_months(x)`; `advance <arc> to N` (raises a clock, never lowers it); `challenge combat … with <who>` (an ally in the fight). Lint: a card that finds an arc's clue belongs to the arc or tests `closed()`; queued cards may carry `with npc`.
- **Allies in fights:** an ally throws their damaging iconic spell (Kael: Hoarfrost) free every 3–4 exchanges, at half its base damage; EVENTS `assist:{spell}` names another (Ilse's Rime does no damage, so the Night names Hoarfrost).
- **Careers** (design §7.7): every job is an offer a card left (the fair's interview, a return letter, a job asking you to stay on, a head-hunting letter); the last call in month 47 always holds a sure post; the last day signs one offer or none (Still Looking / Back in Your Old Room). Every yearbook line is told and chosen on a month-48 card, and `grim finale <save>` replays the last day's every choice (a slow test runs it on two sims).
- **The Hollow Star, v2:** four acts, each a story thread; an act's finds raise the clock to its climax, so a player who pushes opens the next act early, and the beats are deadlines for one who doesn't. Climaxes on the page: the man in grey at the gate, the frost-thing on the lake, a strike in the courtyard at noon. The key can be lost there and won back four ways, three without a fight. Act IV: Madame Dumont's letter, and going down early (her circle half-formed, only the allies who promised). The Night is a scene: who comes with you, the cult's circle, the man in grey, Ilse, your shadow, the founders' wall, the door; every clue pays off there; every outcome closes the arc and has its aftermath, and the bargain pays at once. Every fight in the plot sits beside a way that isn't one (test).
- **The ring:** wizards all (one rogue caster a bout), a crowd that never reports a forbidden cast (the alignment cost stays), and now and then a cameo between bouts by someone who'd fight there (Corvin, Lyra, Bram, Ilse).
- **Card fixes:** Bram fought in the chalk circle; your own Ward at the Conclave; stargazing's cold is a chance; the collapse's cure climbs (30 → 60 → 120 crowns); jealousy ignores exes; anniversaries come on the year; a partial check's chip is purple in both themes. Style: `docs/authoring/style.md`, "Conflict and climax", with a critic check.

Measured (`tools/hs-funnel.js`, 40 games a style): untouched or pushed, the acts open by their deadlines (p50: clock 4 at turn 9, 7 at 21, 10 at 31, the Night at 45), and the arc closes in every game that reaches the Night. The plot style goes down in 37 of 40 (sealed 15, failed 6, bargained 16); with `--no-fights` it still goes down in all 40 (sealed 10, failed 10, bargained 20), breaking the cult's circle in half of them. The balanced style is never called in 58% and watches the Night from above (the bystander line); the lumen style always goes down alone and seals half the time. The bots always hand the key to the headmistress, so they never lose it or go down early; `test/hollowstar-v2.test.js` plays both.

Review: the critic rejected the plot's first draft (a second "Ilse arrives", Isolde shouting, and continuity holes across the Night: who holds Edmund's wand, the man in grey's "first" surprise, ungated callbacks, an early descent in autumn, Ilse's fate unsaid) and accepted the second (`build/batches/hollowstar_v2.critic.json`). From it: the early descent is spring only (Stormbloom or Greenrise) and starts the Night at its second card; the seal is always reachable; a new `hs_aftermath_quiet` for a sealed door without Kael. The sleuth style (`tools/policies.js`) goes out at night only for a story card meant for the night: an evening card waiting at a midnight place had it out every night, as often as the nightlife regular (21.5 → 26 nights; now 21.75).

Deviations from the plan, with reasons:
- *Files:* the plot's old cards were rewritten in place (`chain_hollowstar*.grim`, ids kept, as the rules require), and only the new cards live in `content/events/hollowstar/`, not one file per act.
- *Investigations are story threads*, not quests: the parts already wait on leads at places, and a quest's fixed part count didn't fit acts whose parts come from several characters' cards. An act's progress is a preset (`hs_<act>_progress`) the parts call.
- *The ring's cameos are an extra bout between bouts*, not a swapped foe: a cameo is a card of its own with the character's scene, and the bout after it is unchanged. Grisk is not among them (canon makes him a moneylender, not a fighter).
- *No fight at the door* (plan §4.2 had one against the Star's herald): your shadow is the Star's champion, a scene earlier, and the seal is one check whose odds come from how the Night went (the cult broken, the shadow beaten, the key, who came down, hurt).

## Everyday spell uses (October 25)

Twenty-one repeatable routine cards in `content/events/spell_uses.grim`, three for each first-year course spell and Ward, at places across the campus and the village; zh-CN complete. Each resolves without the spell, and has an `up[spell]` option once you know it. A known spell's cards are drawn more often (each spell's pool: `weight: 10 + spell_known(<spell>) * 15`, `@cond spell_known` in `conds.grim`), and a visit appointment per spell (`<spell>_in_use`, `chance: unlikely`) now and then opens a visit on one of them. Engine: a visit appointment now deals only cards for the place being visited, and rolls its chance only when it has one (no built-in appointment is affected; they all have `use:`).

Measured (80 games a style, the same seeds with the boost off): once a spell is known, its cards come about 2.2 times as often (balanced: 0.2–0.7 → 0.5–1.25 a year per spell), about 60% of them through the appointment; windfalls stay at a median of 1 a year. Retrieval replaced one duplicate premise (tomorrow's Ledger page, `ledger_office_drying_line`) and reworded lines echoing eight existing cards. Two cards at places simulated players almost never visit (the Gargoyle Passage, the Headmistress's Tower) were moved to new premises at the library and the courtyard; the queries and rework are in `build/batches/spell_uses_2026_10.notes.md`. Found and fixed while gating: a fight's preview dropped an outcome the estimate put at 0%, though the played fight can still end that way (`balance` reported a preview miss on `duel_fixture`); a played fight's preview now keeps every outcome the card has.

## Mini-plots, batch 1 (October 25)

Three plot-safe storylines in `content/events/miniplots_2026_10.grim`, each a `@thread … from: story` with a side lead (`content/world/clues.grim`) and zh-CN complete. Each starts at a place whose term visits often came up empty, then pushes its next beats, so a started storyline finishes:
- `missed_round` (5 cards): Sister Amaranth misses her evening round. You cover the ward and get the truth out of bed six, who is covering for friends hiding Lake Fever. When Amaranth comes back to work too soon, you order her to bed in her own word.
- `red_ink` (4): someone re-marks your essays in red ink. The marker is a first-year who can't speak in class, and the finale is her seminar.
- `late_bloomer` (6, at home across breaks): the sweet shop's grown daughter boils the sugar on a cold stove. Then come lessons on stony ground, her father at the door, the charm seller's glass bead (a fake that works if she believes in it), ice in the square, and a flame that stays. Pushed beats wait for a home break (`defer: not has(plan_home)`).

Measured (40 games a style): once started, the first two finish in every plot and social game; the home one in 32 of 40 homebody games. The balanced sim player always bins the first red-ink essay (mood now against lore later), so it never sees that thread. `test/styles.test.js`'s homebody check now uses the median final Health: two of its eight fixed seeds tipped into Grisk's debt spiral; over 40 fresh seeds the homebody's final Health is unchanged (87.8 vs 89.1, same debt rate). Retrieval: the batch was first written without it, because the index read as unbuilt; a `rag/src/catalog.js` edit had orphaned it. After a full rebuild, retrieval on the batch found two duplicate finales (`amaranth_trust`, `thorne_recommendation`), a canon contradiction (the home charm seller sells fakes), an image echoing a Hollow Star omen, and repeated punchlines. All were reworked; the queries and rework are in `build/batches/miniplots_2026_10.notes.md`. Found: `grim report --gaps` maps a home day's four visits onto `day_break`'s two visit slots, so home places read as empty when they aren't.

## Card-wiring framework (October 25)

**Card order in a slot (October 25):** a new card property, `order: last` (a schema addition), deals a card after the other cards of its slot. It uses no random number, so which cards are drawn doesn't change. It is set once on the Whisperwood delve's start pool (`whisperwood_routine_repeat1`), so on a forest visit the routine cards play first and the delve they start comes last. Measured over 200 games a style: start cards and delves come up as often as before (balanced 1.39 → 1.47 start cards a game, delves 0.66 → 0.66; random 2.90 → 2.98, 1.52 → 1.61). A start card now comes before a routine card in 0 of 609 such visits; before, it did in all 583. `rag/src/catalog.js` doesn't index the new property: that file is hashed into the retrieval index, so editing it would force a rebuild.

The language has five wiring blocks (`docs/grimoire-script.md` §9; schema v1 additions): `@pool` (properties a group of cards shares, `from:` to build on another), `@thread` (a storyline with members, clues and a clock; with `params:` a template), `@cond` (a named condition), `@preset` (now scoped to a template, `quest.next`), and `@appointment` (when cards are dealt). Plus `queue any in <pool|thread>` and the template macros `$x`, `count(role: expr)` and `first role … where …:`. Libraries: `content/core/templates.grim` (story, quest, scene; the course pool templates), `content/core/appointments.grim` (the game's 16 appointments, in the order they deal) and `content/core/conds.grim`. Which group a card joins is `docs/authoring/pools.md`, "Where a card lives".

Conversion was by script (`tools/convert/`, reports in `build/convert/`), each migration gated by `grim equiv` (every block compiles to the same meaning as at HEAD; `grim migrate` now refuses any migration that changes it unless it says `changesMeaning`):
- 0046 conds: `courting(x)` (29 uses), `partner_here(x)` (7).
- 0047 quests: six club and job capstones are `from: quest` threads (the routing is `next`); bramble's later parts wait on the first, so it is a plain thread.
- 0048 scenes: the Whisperwood delve (49 cards) and the night upstairs (9) are `from: scene` threads.
- 0049 threads: every `chain:` is a `@thread` (forbidden and curse are stories); `chain:` lines read `thread:`; clues owned by threads. Five leads are found outside any storyline (`build/convert/threads.json`: lead_grisk_jetty, lead_sky_championship, lead_second_timetable, lead_newt_upstairs, lead_spinner_silk), left for a writer.
- 0050 pools: 95 pools over 449 cards; course pools build on `course_routine` / `course_routine_repeat4`. About 600 lines fewer.
- 0051 appointments: `@game exam / appeal / off_shift / spark_cooldown` are their appointments' cards (the keys still work).

The director and engine read `content.appointments`: the month's pushes (forced, beats, milestones, and any new appointment `at: month`), the course slot, a visit's first cards and takes (festivals, the off-shift hint, `always:`), letters, and the notices (intro, start, exam, appeal, warning, review, promotion, spark cooldown). New appointments need no engine code at `month`, `courses`, `visit` and the notices. Golden games, the full test suite and a 780-game trace comparison over 13 styles against HEAD are unchanged.

Deviations from plan v5, with reasons: the built-in appointments keep their own rules behind `use:` (their exact draws and random order); the day's slots stay the `@game day_term` / `day_break` recipe, which is already data, rather than becoming appointments (step 4 of the plan, stopped: no gain worth the risk to the slot order); `night`, `meet lead` and `enrol` have only their built-in appointment.

## LightRAG graph and five-card adoption (October 24)

The main LightRAG index is ready with 1,905 blocks, imported from the verified
experiment graph and synchronized incrementally. It reuses 1,871 documents;
changes are five adopted cards, 29 prior live-repo edits/context changes and one
prior removal. No full re-index was run. Original experiments/reviews remain intact.

Graph helper and keywords now use Gemini 3.1 Flash Lite. Qwen3 embedding 8B is
retained; Voyage rerank-3-lite is live-tested with its exact provider alias. Billing
and access errors open a circuit breaker rather than allowing repeated API calls.
Unchanged synchronization makes zero model calls. Details and receipts:
`rag/runs/card-adoption-result-2026-10-24.md` (local, ignored).

Adopted source: `content/events/expansion_lightrag_2026_10.grim` and matching zh-CN
translations. Two stables routines, two courtyard routines and one Newt encounter
were copied; rivalry cards and the Reflect chain were excluded. Lint and translation
coverage pass, game check has zero crashes, balance has zero invariant failures,
and focused/offline retrieval checks pass. The expected gameplay diff from added
cards is recorded; the existing golden checkpoint was not overwritten.

## LightRAG lifecycle update (October 24)

Current retrieval uses official LightRAG 1.5.7 only; setup and maintenance are in `rag/README.md` and `rag/AUTHORING.md`. Earlier backend-readiness notes below are historical. The new real-corpus graph is intentionally unbuilt; implementation validation uses offline fixtures only. Existing experiment copies and reviewer archives are preserved.

# Status & roadmap

**v0.3, phase 3 of 4: at the stop point, human playtest #2** (`docs/playtest-2.md`). The plan is `docs/design-v0.3.md`; how to work on the project is in `AGENTS.md`.

## Where things stand (October 15, 2026)

| | |
|---|---|
| Content | 989 events (lint's count), 69 states, 21 characters (12 core, 8 fixtures, Tamsin of Thornwick), 43 places, 25 tracks, 35 spells, 35 endings (5 game-overs + yearbook lines) |
| Format | schema v1, frozen; 0 lint errors, **0 legacy constructs** left in content |
| Reachability | `grim reach`: every event, option, ending, place and track can be reached; each key clue has ≥ 2 sources |
| Translation | zh-CN 100% (8,802 strings), 0 stale |
| Checks | `npm run verify` passes: build, lint, format, docs, 100+ unit tests, `balance --quick`, golden diff, browser runs from file:// and the server |
| A run | 48 months (the last two are the wrap-up), about 630–720 cards (15 a term month, 9.4 a break month; about half pushed rather than drawn); in `grim analyze` (100 games a style, 2026-10-17), random play leaves early 30–40% of the time, social 27–30%, aggressive 18–29% and cautious 10–17%; the other 23 styles finish 98–100% |

## Review reading groups and story order (October 24)

The author-workspace review queue now groups stables routines, courtyard routines,
Lyra rivalry, the Newt midnight gig and library spell discovery. Standalone
events mix across submissions within each theme using the existing recorded seed.
Each author's connected story stays together: queue references, positive flag
prerequisites and prior-event conditions supply a static reading order, with
source order as a documented fallback. The four library stories each appear as
three consecutive steps, including flag-gated scenes without queue links.

English and Chinese show the same order, with category and anonymous chain/step
headings. Consistency presentations remain after their category's primary story
sequences. No labels, ratings, review epochs, frozen source artifacts or tool
traces were reset or rewritten. Source-order grouping is not proof of runtime
reachability. See `rag/WORKSPACES.md`.

Validation: 58 focused tests and the bilingual autosave browser fixture passed.
A read-only browser check verified all five real groups, four intact library
chains, language-independent ordering, mobile layout and preserved review data.
`grim check` also passed 200 games without crashes, with seven existing warnings.

## Simple autosaving card review (October 24)

The batch review now asks only for one 1–5 rating, world fit (yes / partial /
conflicted), and optional comments. Choices save immediately; comments autosave
after a short typing pause or on blur/navigation. Writes are serialized, pending
edits stay in browser storage, and failures are shown explicitly. The earlier
initial/final judgments, finding forms, manual save buttons and paired comparison
flow are removed. Ratings remain editable after workflow identities are revealed.

All three imported review versions were reset to format 2 with new review epochs;
old judgment/comparison state and verdict-history files were cleared. There were
no stored judgments at reset. Older tabs and browser drafts cannot reintroduce
deleted records. Cards, agent translations, source fingerprints and tool traces
are retained. Operator instructions are in `rag/WORKSPACES.md`.

Validation: 55 focused tests passed. Browser fixtures verified rapid ordered
autosaves, optional Chinese comments, reload persistence, failed-save recovery,
stale-tab/reset protection, bilingual previews, blinding/reveal and mobile layout.
A read-only check confirmed the real 44-presentation review is blank, has no Save
buttons, and retains all four tool traces. `grim check` passed 200 games with zero
crashes and seven existing warnings. The full gameplay verification was not
repeated after the preceding run stalled in the style simulation; no golden
refresh was made.

## Author-workspace tool traces (October 24)

`grim author-eval workspaces traces --experiment DIR` now discovers the matching
Claude interactive sessions and compares their recorded tool calls with frozen
RAG receipts. New immutable JSON/Markdown reports live outside author projects;
the review server's separate `/traces` page supports Chinese/English, command and
phase filters, full recorded outputs, source IDs, stage provenance and errors.
Native inputs are fingerprinted; assistant reasoning is excluded and recognizable
credentials are redacted. Blinded quality state and judgments are unchanged.

Observed author calls: baseline used four briefs, five queries and one show;
Grim completed six RAG searches and one read alongside five query sites; QMD
completed six searches alongside three queries, two shows and one graph; LightRAG
completed five searches and two reads alongside four queries. QMD and LightRAG
also checked status once. Six preparation receipts per RAG project were excluded.
All completed author RAG operations preceded the first content write; none used
explicit retrieval neighbors or briefs. This does not imply that LightRAG's
internal graph retrieval was disabled. All four logs identify Claude Code 2.1.299
and `claude-opus-5-5`. Prompt formatting differs; normalized task wording matches.
These are exploratory mixed-tool workflows, not strict byte-identical trials or
proof that all accesses were confined to the assigned inputs.

Validation: 54 focused tests and the real read-only bilingual trace browser check
passed, including source/output hashes, setup exclusion, redaction, safe exports,
mobile overflow and preservation of quality judgments. `grim check` passed 200
games without crashes (seven existing warnings). Broader verification was stopped
after about nine minutes, while `test/styles.test.js` was still running; its
interruption is not a gameplay assertion failure. No golden refresh was made.

## Compact choices, the floating window and the combat bench (October 24)

- **Choices stay compact**: the label (the only line that wraps), the roll's kind, and one line per outcome (at most three),
  cut short rather than wrapped; `hint:` text and a fight's foe and level left the button. Left and right always share the
  row, on a phone too; while the card is dragged one way, that way's button takes the whole row.
- **The floating window** replaced the hover / long-press / selected-tile expansion: it follows the mouse (or opens at the
  finger on a long-press) over a choice or menu tile, with the description, lock reason, fight foe, every outcome with
  each change named, and the "…" spelled out (design §8.3).
- **Partial outcomes** read apart from the beige card (a saturated amber chip); outcome labels on buttons are coloured.
- **Spell levels** show only for three-level spells (the You panel, notes, the ↑ button, the fight's action buttons).
- **Intro**: the three lessons lost their `hint:` descriptions; the Grisk card (`intro_purse`) is gone (Vey's tea leads to
  your room). A save made on that card exactly skips the rest of the orientation (the deck drops unknown ids).
- **Android swipes**: `.card-body` is a scroll container, so its default `touch-action` let the browser take the gesture
  and cancel the swipe; it is now `none`, or `pan-y` when its text overflows.
- **Combat bench** on the title screen: the server builds the bench site in memory from `combat/` (`combat/tools/site.mjs`,
  shared with `combat/tools/build.mjs`) and serves it at `/bench/`; no cargo needed (it uses the core in
  `build/combat.bundle.js` when `combat/web/core.wasm` is absent). From `file://` the button says it needs the server.

## Batch review translations and inspection controls (October 24)

The latest frozen author-workspace import has complete agent-written zh-CN
translations for all 40 new events (zero missing or stale fields), presented as
44 blinded review items including consistency repeats. Older snapshots and
judgments remain separate. The loopback review uses the game's text-variation
renderer with synchronized alternative controls, selectable choices and outcome
branches, and nominal stat/XP amounts from the frozen balance rules. Complete
compiled attributes, original parsed properties, flags, queues, effect trees and
`.grim` blocks remain inspectable. See `rag/WORKSPACES.md`.

Validation: 49 focused tests and bilingual browser fixtures passed; all 44 real
presentations passed read-only browser checks, including mobile overflow and
unchanged verdicts. `grim check` passed (200 games, zero crashes, seven existing
warnings). Full verification passed 288/289 tests and stopped on the previously
observed homebody-health assertion at `test/styles.test.js:118`; its later
balance/golden/browser stages therefore did not run. No golden refresh or
experimental content adoption was performed.

## Everyday RAG and evaluation handoffs (October 23)

Normal event writing now follows `rag/AUTHORING.md` and the explicit selection in
`rag/authoring.json`: QMD/full is the provisional everyday default, not a confirmed
quality winner. Frozen trial assignments override it. `retrieve status` checks
source/index integrity without model calls; the current 1,901-block QMD index and
real hybrid search passed. External search provenance now returns a digest instead
of the complete parent mapping: the two-hit readiness JSON shrank from 131,419 to
4,133 characters while retaining the full mapping in the manifest.

`author-eval handoff` prepares exact Codex/Claude invocations, a tool policy,
expected-value attestation template and a manual launch script. It starts no model.
Native JSONL, stderr, version and exit status are captured outside author inputs;
automatic retrieval receipts supplement the native trace. Optional local-key
copying creates only a private runtime file, outside frozen inputs. The initial
author stops before validation so the operator can preserve the first draft;
repairs continue only that trial's session. Audits expose a per-access ledger,
reject wrong backends and premature validation, and leave uncertain shell source
scope or incomplete traces unverifiable. This is observed adherence, not hard
filesystem/tool isolation. The evaluation guide explains sole-reviewer blinding
limits and a separately predeclared source-service/container option.

Validation: 33 authoring fixtures passed, including fake native-harness capture,
source-scope checks, default/trial separation, compact search provenance and local
review/browser persistence. Skill and generated-doc checks passed; `grim check`
passed 200 games without crashes. The broader `npm run verify` run reached 270/271
passing tests and stopped at the existing homebody-health assertion in
`test/styles.test.js:118`; downstream balance/golden/browser checks did not run.
The final focused suite includes one additional source-scope fixture. No scored
author/critic sessions, full paid corpus indexing, gameplay changes or golden
refreshes were performed. Prepare new studies after these tool/instruction changes.

## Live RAG smoke test (October 23)

All three backends passed indexing, ranked retrieval, complete original/branch
reads, strict budgets, bounded static neighbors and evidence briefs on nine real
source blocks. LightRAG processed every document, built 50 entities/51 relations,
and successfully used live reranking. QMD's full 1,901-block index was refreshed,
and the CLI `related` operation passed against it. The paid Grim/LightRAG full
corpus was not indexed. This is a functionality smoke test, not evidence of
comparative authoring quality.

Live responses exposed valid provider model names rejected by strict checks.
Both adapters now compare full IDs without case differences and accept only the
documented Fireworks reranker alias from Fireworks. The shared alias table is
fingerprinted in indexes; no alternative models were selected. All 28 authoring
fixtures, Python identity checks and `grim check` (200 games, no crashes) passed.
Recorded API usage: $0.02478361 across 60 requests, including initial probes.
Raw failures, final evidence, usage and reproduction scripts are in the ignored
`rag/runs/smoke-2026-10-23T19-14-14-051Z/` workspace.

## RAG containment (October 23)

Retrieval/evaluation code, setup, dependency locks, installed QMD packages/models,
local credentials, caches and trial inputs now live under `rag/`. Authoring docs
and discoverable skills point there. Setup/retrieval: `rag/README.md`; the frozen
trial and sole-reviewer protocol: `rag/EVALUATION.md`. Historical cache manifests
retain their old paths; current QMD indexes were explicitly rebuilt.

Validation: all 26 authoring fixtures pass, including snapshot isolation in Git
and non-Git workspaces; `grim check` passed 200 games without crashes. QMD hybrid
search and complete source reads passed after relocation; all 1,901 indexed source
hashes match. Documentation links and credential ignores passed. Full `verify`
also reproduced the existing homebody-health failure at `test/styles.test.js:118`;
its newly exposed non-Git ignore-file fixture issue was fixed and the authoring
suite rerun successfully. The checks after the full unit suite did not run.
No paid model calls, gameplay changes or golden refreshes were made.

Preparation entry points: `rag/setup.sh` and `rag/setup.ps1` prepare both frameworks
with the same installer. Windows uses Node-based QMD/npm entry points, and Python
discovery also accepts `python`. Validation: shell syntax/help from a different
working directory, all 27 authoring tests (including launcher argument/exit-code
fixtures), and `grim check` passed. PowerShell/native Windows setup was not run
because PowerShell is unavailable here. No dependency installation was launched
for this wrapper change; the local QMD index identity was refreshed explicitly.

## Node 24 and retrieval setup (October 23)

The project targets Node 24; npm scripts select it even when the parent shell
defaults to an older runtime. QMD 2.8.3 and its three local models are installed
through `npm run setup:authoring`, with a separate committed dependency lock.
Live fixture indexing and hybrid search passed; the current 1,901-block corpus
is indexed locally, and a real-corpus hybrid search passed. QMD's named-index URL suffix is now mapped back to original
blocks. Local configuration is loaded automatically.
`npm run setup:python` creates the optional pinned LightRAG venv, or `--all` on
authoring setup prepares both in one execution. Python setup was exercised with
mock commands; no live LightRAG or OpenRouter calls were made in this change.

A-RAG investigation: `rag/A-RAG.md`. The recommendation is an explicit
future interface adaptation in the existing coding-agent harness, not another
author agent or an unannounced change to the four-workflow screening.

Validation: Node 24 `grim check` passed (200 games, no crashes), and all 25
authoring fixtures passed. `npm run verify` reached 264/265 passing tests, then
stopped at `test/styles.test.js:118` (homebody final health). That failure was
already reproduced on Node 20 and Node 24 before this migration. No gameplay
baseline was refreshed and no remote deployment was performed.

## Authoring retrieval experiments (October 21)

Auxiliary `grim retrieve` tools now catalog original blocks, search with contextual
BM25/vectors/reranking, inspect static dependencies, and export to isolated QMD or
LightRAG adapters. `grim author-eval` prepares frozen manual harness trials,
preserves drafts and failures, imports/audits native traces, and serves a separate
loopback review page with blind judgments, findings, panels and reports.
Protocol/setup: `rag/EVALUATION.md`; retrieval/configuration:
`rag/README.md`. Production content acceptance is unchanged.

Validation: `grim check`, `npm run verify` (including golden games and browser
checks), fixture tests and a real-corpus lexical smoke test. External API and
framework protocols use mocks in tests. QMD/LightRAG dependencies and weights
still need isolated setup and live compatibility checks before actual trials;
no paid indexing, authoring or judging runs have been started.

## Combat F5.11-plan.1 (October 21)

The plan is `docs/minigame-combat-f5.11-plan.1-2026-10-21.md`, implemented in the combat core. What the main game carries
over is in `combat/HANDOFF.md` ("F5.11-plan.1").
- **Rules:**
  - The basics are renamed Impulse, Parry and Refocus, plus Breaking Free; physical damage is now Impact.
  - Haste is Countertempo: no more bundles.
  - One hostile-application rule covers both sides.
  - The redesigned spells are Bramble (Bind), Wildfire, Omen, Lodestar, Compel, Tailwind, Brace and the reward tranches.
- **Kits** (feedback 2026-10-21): club and job capstones come from level 30, one club and one job, three at most. Hidden
  spells come from 30, one every 10 levels.
- **Tests:** the frozen goldens are retired; `combat/tools/parity.mjs` checks native against wasm.
- **Balance, humans** (`combat/tools/human-study.mjs`, engine against engine at depth 5, tiers 20/45/70 ±4):
  - Changes (feedback 2026-10-21): Mend heals 18/20/22, Bramble does 4 damage for 12 Mana (migration 0042), Tailwind
    does 10 + 15 a chained cast, Moonwell banks 10, and the Showman takes Tailwind as its job.
  - The class win-rate spread went from sd 20 to 14 (L20 27–65%, L45 16–92%, L70 19–82%).
  - Still open: the Healer (92% at 45), the Hollow adept (82% at 70), the Scholar (16% at 45) and the Illusionist (19% at
    70). Number changes alone haven't closed these gaps; mechanic proposals are pending the user's choice.
  - Next balance pass (feedback 2026-10-24): Haste gives a free Parry to actions without its Impulse (7 Mana, 2/3/4 exchanges; migration 0044);
    Tailwind hits 9 +15, costs 4 +1 a chained cast (migration 0043); the Scholar and Illusionist get Omen and Hoarfrost as
    stand-ins for their combat-less capstones.
  - Named characters (`human-study.mjs --subjects named`): Corvin, Nessa and Tamsin win under 15% in every mode; their
    signature, club and job spells do nothing in combat (stand-ins pending the user's choice). Lyra, Kael, Seraphine and
    Ilse are strong at 20 and fade by 70.
  - Creatures, pass 1 (`combat/HANDOFF.md`): the oaks and the Spinner can now be beaten; the critters are still trivial.

## World expansion 1 (October 20)

The plan was wide-but-thin to deep (the approved plan, rev. 4; `docs/world-expansion-design.md` stays out of scope). **284 new cards** (1,100 → 1,384), 21 items, all additive to schema v1 (`schema` intact; additions recorded). zh-CN 100% (12,805 strings).
- **Format** (E1–E11, `docs/grimoire-script.md`): `specializes:` (a character's own version of a generic card); `day:` on plan states (4 free visits a castle or home break day, 3 working, 2 interning); `@item` with `give`/`take`, `has_item()`/`worn()`, `up[item:x]`, `legacy:`/`bound:`; `on_shift()`; `opts.flags` and *Skip introductions*; `MINIGAME_KINDS`, the negotiation stub and `PARLEYS` (`src/negotiation.js`); the plain kinds `appeal`, `perform`, `soothe`; tonics (`boost:`); `deprecated:` on places and states with load-time remapping; the `cast_as()` fix.
- **Negotiations** (migration 0037): about 40 real ones are bound to the future minigame and registered by profile and room; the trivial asks are `appeal`, `perform` or `soothe`. Until the minigame ships the stub rolls on charm, lore and guile. Minigames happen freely (design §T1's one-a-month is superseded).
- **The kit:** owned items open their own options (`up[item:x]`, one per card, so hoarding never stacks); worn items (a wand, a robe, a trinket) count only in fights, as flat modifiers. The Kit panel and the fight's kit picker. Six shop counters with special offers, tonics and selling (`content/events/kit/`); the old buying events stay flavour and the vendors take them in exchange. Old gifts became items through `legacy:` (Edmund's wand, the black-star coin, Ilse's frost-ward).
- **Combat** (`combat/HANDOFF.md`): creature races scale HP and Mana and never heal; aliases reuse rules; new rules bind, drain, poison, multi-hit and telegraphed channels; eleven new foes; tutorial fights with "Skip the lesson"; `stakes: none`.
- **The academy, condensed** (migration 0038): the refectory, infirmary, flight field, orchard and bakery merged into neighbours (33 campus pins → 28); old saves load (`test/fixtures/save-before-expansion1.json`). **Partly undone** (migration 0043, the user's decision on 2026-10-23): the refectory, infirmary and flight field are their own places again, with their cards, the alchemy course's infirmary lessons and the schedules restored from before the merge (31 pins); the orchard stays in Maud's cottage and the bakery on the square. Saves made in between gain the three places on load; their visits stay counted at the Great Hall, the Alchemy Laboratory and the Stables.
- **Breaks:** 21 castle and home cards for the extra visits.
- **The intro** (`content/events/intro.grim`): a new game opens on a prologue: the arrival, then the Sorting Mirror, where the origin is picked (its answers name the crowns each origin really gives), and month 1 begins after it (feedback 2026-10-20; the origin had its own screen before the game). Then the orientation, one condensed run of cards before the registrar's list:
  - **The Welcome** asks first: left skips it, right plays it through. Skipping never skips Ward: the safety talk then comes after enrolment.
  - **Marrow's question** "What is just?" is remembered, and on the eve of graduation she asks again (`isolde_asks_again`), saying whether your alignment kept to it. It has no other effect.
  - **The tour** meets Bram at once, with no warm-up (his own `bram_intro` still plays later, as a second encounter). Following him names the places with the most uses: Job Board, Library, Infirmary, the village shops (`intro_places`).
  - **The lessons:**
    - The wrong tower and Vey's tea are fair checks (about even for a first-year), worth a tiny Mood either way.
    - Then the safety talk (Ward) and the practice circle.
    - The practice circle is a fight with no way out. The mannequin plays idle, Strike, Flame, Guard and Reclaim, telegraphed, with a line of Thorne's for each; you commit first on the 6th exchange. EVENTS `script` in `combat/setup/foes.mjs`, `CombatBridge.scriptedMove`, the core's idle `cancel` for an `idle: true` kit. Since October 25 it has Mana for its Flame (it had 9 for a 10-Mana Flame, so it struck instead and its Refocus took back nothing), and after the script it plays a drill (EVENTS `loop`: Flame, Refocus, Strike; it Parries an Impulse it sees in place of a drilled Strike) instead of searching, which had stalled the fight in Impulse-into-Parry. Thorne's last line says how to win.
  - **The kit** card closes the orientation.
  - **The Registrar's List** hints Evocation I for fighters, Illusion I for talkers.
  - Plus 15 just-in-time cards (`jit_*`), off with *Skip the introductions*.
  - Menus with several picks (electives, applications) confirm only with Confirm, never by clicking a pick again.
- **The Whisperwood delve** (`content/events/whisperwood/`, 90 cards): four bands by depth, grace and the way home, the Hush at midnight only, the Spinner (Maud's old pet) and the optional Outcast; 13 fights and 11 negotiations; the talking trees; 10 of the 11 sourceless spells taught (`pools/spell_lessons.grim`).
- **Character voices:** romance sets for the seven romanceables (`content/events/romance/`, 65 cards: spark beats, partner beats, an ex card, their own versions of generic cards); friendship and rivalry (`content/events/bonds/`, 50 cards: fact-based friendship, the close milestones of Lyra, Bram and Ilse, seven new rivalry cards for Lyra and nine for Bram, two each for a soured Corvin and Ilse). Migrations 0039 and 0040 stop generic social cards casting characters who have their own, keep the generic truce from pre-empting the written rivalries, and keep `bram_turns` from undoing a close bond.
- **Measured** (`grim analyze`, 12 games a style, `build/analysis/expansion1-c.md`): the explorer ends with a median of about 335 crowns (325 at the delve's milestone; 3× the median style, info); the romantic's first partner comes at month 10.5 (10 before); the social style is sent home in 5 of 12 runs (the health alarm recorded under "Bedtime, measured"); BALANCE_LINE
- **Deviations from the plan** (with reasons):
  - `intro_kit` is Thorne's card, straight after his practice circle (the plan gave it to Mir).
  - The tutorial negotiation is `intro_wrong_tower` (a house steward and her list), not the East Staircase hall tax, so Bram's hall tax stays his own card.
  - The hazel wand is the "Hazelwood Wand"; Mir's stall is on the square's counter whenever you've met Mir, not only on market days.
  - The Hush is reached by a midnight edge card (`ww_edge_night`, opened by `ww_midnight_known`) rather than by adding the wood to the midnight pick: the place was already open at midnight.
  - An angry Spinner (you freed her hippogriff) won't bargain and gives no yield, instead of fighting a rung harder: a check's rung can't depend on a flag.
  - The lost first-year in band 1 is unnamed: Pim is a fourth-year's mentee in canon. The Outcast is Absalom Vrell (the plan's placeholder name clashed); the briar maze is "The Thorn Maze" (the name pool has Briar).
  - The plan's premonitions that named a door under the lake were softened to the lake humming (plot safety).
  - Beast-speech is a retired spell, so those delve options take the honey tin or Rapport.
  - Confessions are gated on not being an ex, but not on having no partner: that would make `soc_two_timing` (a designed incident) unreachable.
  - Tamsin's letters stay her own seven cards; the generic letter no longer casts her (a character has at most one version of a generic card).
  - The lumen alchemist alarm predates the delve, but the delve feeds it a little (alchemy through the haul and the infirmary).
- **Fixed after review** (feedback 2026-10-20): picking the Whisperwood at midnight before the Hush was known played nothing (its midnight edge waits for `ww_midnight_known`), and the empty midnight slot ended the month. The first midnight visit now has its own card (`ww_night_first`, grouped with `ww_edge_night`): it finds the silence (`ww_midnight_known`, the Hush lead) and can go straight down. The map now opens a place in an opened slot only if one of its cards there can play (`playsOpened` in `src/director.js`), so no midnight pick is ever empty.
- **Critic pass** (`docs/reviews/new-cards-2026-10-20/`): an independent read of the 285 new cards found 46 problems. 45 are fixed, including the delve payout, which always said the bag was empty. #38 is declined, since a prank war moves no alignment (`life_prank_war`). The lint now errors on a skill used as a cost. It awaits a re-review.
- **Gaps:** the negotiation minigame itself (the stub decides); the race HP and Mana numbers are placeholders for a simulator sweep; Toll has no source; the close milestones of Lyra, Bram and Ilse and the soured Corvin and Ilse cards are rare or unseen in simulation (covered by `test/bonds.test.js`); a browser pass over the intro, the Kit panel and a midnight delve is still to do by hand.

## Feedback notes (October 20)

October 20, 2026 (design §6.3, §7.4, §5.5, §8.3; the midnight turn):
- **Jobs:** joining mid-term asks one shift fewer than the months left; no job can be taken in a term's last month. The job board says why and offers one evening's odd job instead (`job_board_odd_job`).
- **Clubs:** every visit in term counts, and the map shows no count. The Duelling Circle, the Ledger and the Verdant Circle still expect one visit a term (`due: 1`, unshown). A member who never comes gets the term-end warning in the club's words (new function `kind_is(track, club)`). The Cartographers expect none.
- **Spark:** friendship carries spark only from spark 12 (`spark_follow from`). Until the "do you want this?" card has come (or you're partners), the spark it carries is applied but shown neither in outcomes nor on the People bar.
- **Spark and hostility:** friend jealousy (`soc_jealous_friend`) is retired; jealousy is for romance. 16 spark cards now need friendship ≥ 0 (migration `0036`). Story cards keep their scene and gate only the spark line.
- **Rivalry** bottoms out at −50 (`relFloor()`); a rival's bar is full there. Friendship losses are not rescaled.
- **The Newt:** a purse won at the high table leads to `newt_high_table_raise`, then `newt_high_table_last`. Each hand is dearer and harder, and walking away is always open. A company night can run into a second party (`company_late_hour`), and two new parties join the pool (`company_wedding`, `company_poets`).
- **Content fixes:**
  - the lake's whisper raises Arcana as well as Mana;
  - the curfew card no longer says Starfall is coming after it;
  - the friend's gift reads as a friend's;
  - funding Nessa's print gives more Renown;
  - the lantern card's charm option needs Glamour;
  - the washed-up lantern comes weeks later.
- **UI:**
  - the map button (top bar) shows the maps you know, to look at;
  - a roll on a button names the skill only, since the outcome lines give the chance, and a luck roll shows the dice alone;
  - an option's spelled-out "…" opens below its outcome lines;
  - courses use the exam-preparation icon;
  - jobs say "work", not "shifts";
  - a locked menu tile shows one lock.

## Fights: Health in and out, the setting on screen

October 20, 2026, from feedback (design §9.2):
- **Health into a fight:** from Health 30 up you start at full HP; below 30 the start falls in a straight line to 70% at Health 0.
- **Health out of a fight:** Health is lost only when a fight ends below 30 HP: the stake (40) × (30 − HP left) / 30, less the setting's rebate. In 24 simulated games a fight cost 4.2 Health on average (was 5.8), and 40% cost none (was 5%).
- **The setting on screen:** the fight's top line names the situation and what comes back afterwards, that Health is lost only below 30 HP, and whether a crowd watches. For a fighter who knows a forbidden spell, it also says whether anyone would report one.
- **Forbidden casts** cost 2 alignment, on a card and in a fight (`@balance forbidden_cast`; was 6).
- **Build:** the fight bundle was built from a clean checkout so that the combat agent's unfinished F5.10 work stays out of it. The minigame's goldens were refreshed for the new rules.

## Fight opponents (F5.10)

October 20, 2026, from feedback that fights were too hard even on Easy. The experiments are in `combat/lab/` and `combat/tools/lab.mjs`; their reports are in `combat/out/lab/` (not committed).
- **Easy and Medium are persona opponents** (`combat/rust/core/src/persona.rs`, `algorithm: 'persona'`).
  - A small MCTS whose priors lean towards the character's favourite moves (PERSONAS in `combat/setup/foes.mjs`).
  - Channel plans (cast, hold, release) for attacking channels and the persona's own, with a cooldown after each Release.
  - A veto on moves whose payoff the next exchange punishes, and on lines that end in its own knockout within 3 exchanges.
  - Budgets are in nodes (moves simulated), not ms, so a slow device plays the same opponent: Easy 1,000, Medium 4,500 at level 50.
  - **The budget follows the fight's level** (`PERSONA_LEVEL_SCALE` in `combat/setup/roster.mjs`). It is 1× up to level 10, 4.5× at 20, 4.3× at 35, 1× at 50, 1.6× at 65 and 2× from 80.
    - Without it, the same budget played worse at levels 20–35 and above 50. This was measured against a depth-4 oracle at levels 5–80: the regret as a share of the oracle's best-to-worst spread. The neutral twin dips the same way, so the cause isn't the persona.
    - With it, that share stays at 27–31% for Easy and 21–26% for Medium at every level (was 27–37% and 22–31%).
    - The most it costs is Medium at levels 20–35, about 20k nodes, or 40 ms a decision natively.
    - Branching (legal moves on both sides) was tried first and rejected: the needed multiplier isn't monotone in it.
- **Hard** is F5.9's Easy. **Engine** is the alpha-beta search with LMR and the Engine eval. Engine analysis uses the same.
- **The bots** (`tools/combat-sim.js`): their own side keeps F5.9's skill levels by value, and their foe is the new Easy. In the 120 golden games fewer runs are sent home (social 23 → 16, cautious 12 → 10); the baseline is refreshed.
- **The Engine eval** (`neural.rs`) is a 16-unit MLP over the hand eval's terms plus 12 more. It is antisymmetric by construction and distilled from deeper searches (weights: `tools/export-mlp.mjs`). At 10 ms a decision it is about +110–140 Elo over the hand eval. It scored 7.5/10 in mirror games at depth 5 and at depth 6.
- **Measured** against simulated players: all 10 kits, 200 fights a cell, equal level / player 10 levels below. Novice: depth 1 with wide slack. Decent: depth 2. Reader: models the opponent's habits.

  | Opponent | Novice wins | Decent wins | Reader wins |
  |---|---:|---:|---:|
  | Easy | 70% / 54% | 94% / 87% | 91% / 75% |
  | Medium | 34% / 26% | 78% / 70% | 68% / 56% |
  | F5.9 Easy (now Hard) | 12% / 6% | | |

  - The persona shows: the favoured-action share is +16 points (Easy) and +14 (Medium) above a neutral twin.
  - Lyra holds Wildfire about 2.7 times a cast.
  - Fights over within 4 exchanges: 8% (Easy) and 4% (Medium).
- **Not done:**
  - Fight length (median 19 exchanges, p90 39 against F5.9 Easy) isn't fixed by the opponent alone; it needs rules-side pacing.
  - Hard and Engine were not re-measured against the simulated players.
  - Simulated players are crude; a human playtest is the judge.

## UI pass

October 19, 2026, from feedback:
- **Menus and the map** take the card's place in the stage, as a fight does: there is no backdrop and no cards behind them, and the top bar and side panel stay usable. A click picks and a click on the pick confirms, with no time limit. With several to pick, the last pick confirms and a click on an earlier one takes it back. Map markers carry no slot numbers. The map has no box: one toolbar (title, question, status, buttons) sits above it and the map fills the rest of the stage, never under 600 px wide (a phone pans it). Dots scale with the map, and each caption takes a free spot around its dot, so none overlap; a caption with no room shows on hover or focus, and a picked place always shows its caption.
- **Previews** show amounts past a cap, for example a Health gain at full Health. The outcome shows what actually changed. Lint now counts large changes it used to miss in its test state: 7 romance milestones have 3 (cap 2), which leaves 7 warnings for a content pass.
- **The "…" reveal** never repeats what the preview already shows. For example, the exam card no longer lists one grade note per outcome. Each option has a single "…".
- **Rolls on a button** show only the skill and the chance. A roll of pure luck shows the dice and its chance.
- **Spell descriptions** name the skill the spell scales with.
- **The month summary** shows fading sparks as one line in words.
- **The journal** names people: entries keep their card's cast, track and place. Entries from older saves fall back to the text they were saved with.
- **Scene descriptions:** the "Illustration:" prefix is gone, and the setting is renamed. No other card art is planned.
- **Club and job spell chains** play two beats a visit (migration 0035).

## Manageable exams

October 19, 2026: exam preparation now comes mostly from routine sources, so passing is predictable (design §7.3):
- **Class:** each course gives +3 in each of the three term months before its exam, or +5 when a check in that class is won. It counts once a month per course, and nothing is added in the exam month (`@balance study`).
- **Library:** the revision card (`library_revision`) gives +3 to every course, once a term. It is the library's first card on a term visit before exam month, and the enrolment card points to it.
- **Floors:** being prepared lifts the low end smoothly. 12 makes a pass certain and 15 makes at least a B certain. The careful exam's σ went from 12 to 16 (`@balance exam_bands`).
- **Cards:** card study gains dropped one size (migration 0034: 120 gains in 103 cards). The cards' net gain is now about +2 per course per term, down from 4–6.
- **Measured** (25 games per style):

  | | Pass rate, levels I / II / III | GPA |
  |---|---|---|
  | Balanced, before | 90 / 72 / 72% | 2.7 |
  | Balanced, after | 96 / 94 / 92% | 3.2 |

  The higher GPAs make the scholar ending, the internship GPA gates and probation easier to reach or avoid. Watch them in playtests.

## NPC portraits

October 18, 2026: the 21 minimal PNG portraits are the default NPC art on every surface (card and menu actors, People, map pins, ending), per [the handoff](docs/portrait-integration-handoff.md). Settings → Portrait art → Original restores the procedural SVGs, which also stand in for a missing or broken PNG and are archived in `art/characters/original-svg/`. After a crop edit in the workshop, run `node tools/portraits.js sync`.

## Online hosting

October 18, 2026: the server is ready to host online ([docs/hosting.md](docs/hosting.md), design §1).
- **Players.** Each browser gets a player code that is also its sync code: Saved games → Play on another device shares the saves. With `INVITE_CODE` set, new players need the invite link.
- **Admin.** `/admin` needs `ADMIN_TOKEN`, also behind a reverse proxy (`PUBLIC=1`), and shows Notes, Players (with revoke), client errors and Export runs.
- **Logs.** Every finished, replaced or offline run waits in the browser's outbox until the server has it.
- **Deploys.** Every `git push` of `main` goes to GitHub and deploys to the EC2 server through `deploy/` (git hooks and systemd; a self-test gates each release); `deploy/doctor.sh` checks and installs the server's dependencies. Set up on October 19, 2026 (Node 24 LTS in `/opt/node`). Public at https://lumenhold.duckdns.org (the server's Caddy forwards it to 127.0.0.1:4173).
- **Old data.** Saves from before player codes (`data/saves/`, `data/seen.json`) are no longer read; old run logs stay readable.

## Frequency and economy audit

October 15, 2026: [the frequency and economy review](/Users/accessair/Desktop/Workspaces/lifesim-reviews/event-economy-2026-10-15/README.md) measures a preserved 963-event snapshot over 1,050 games and additional validation runs. Unresolved design deviations include midnight character cards appearing after Sleep or before unlock, incompatible schedule and slot requirements on `gargoyle_passage_parapet_cards`, and the probation hook ignoring an exactly zero GPA. The review also records mana and mood saturation, uneven relationship access, slow specialization in five disciplines, and scarce senior-job opportunities. No gameplay retuning was applied; the report includes per-event frequencies, resource flows and reproduction commands.

## The combat minigame

October 19, 2026: every `challenge combat` and `challenge duel` is a fight in the combat minigame (`combat/`, its hand-over `combat/HANDOFF.md`; design §9.2). None is rolled, for players and bots alike. The bots play both sides with the minigame's AI (`tools/combat-sim.js`).
- **The connection.**
  - `build/combat.bundle.js` (committed; works from file://).
  - The engine's fight requests and results (`eng.fights`, `fightAhead`, `choose(key, {fights})`); outcome `health` lines are skipped.
  - Max Mana is the fight's capacity, and a spell costs the same on a card and in a fight. The monthly exam-nerves drain is gone.
  - The fight screen sits in place of the card. The fight text is in English and Chinese.
- **Settings.** The opponent's difficulty (Easy by default) changes only its decisions. Engine analysis is a cheat, off by default.
- **Rules F5.9d.** Glamour and Rapport stack up to a cap. An opponent grows an urge to deal damage when it deals none. A side destined to lose goes down dealing the most damage it can.
- **A play style for fight testing:** `combatmaxx`.
- **Measured** (`grim analyze`, 40 games a style, against the run before fights were played; `build/analysis/combat-f59d.md`).
  - Fights cost Health. Early endings rise for the careless styles: random 33 → 65%, cautious 10 → 25%, social 31 → 40%, aggressive 16 → 23%. The other styles still finish.
  - Health at the end falls for every style that fights (aggressive 63 → 35, sleuth 65 → 42, explorer 71 → 50, balanced 100 → 85).
  - Mana at the end is lower everywhere (about 70 → 46), as the one scale meant.
  - `combatmaxx` never leaves early, fights about 50 times a run and wins about three in four, and ends with about 770 Crowns (fights pay).
  - Not yet retuned: these are the fight balance pass's numbers.

## Phases

- **0 · Platform and safety net: done.** Local server (saves, run logs, feedback, `/admin`), play styles, balance invariants, golden snapshots, `migrate`, `rename`, browser tests.
- **1 · Worldbook and authoring spec: done.** `content/world/` is the only canon (cast, facts, places, tracks, spells, arcs, factions, lore), with canon lint, briefs and the lorebook. **Your step:** promote soft lore to hard canon.
- **2a · Numbers and options: done.** Tiers and presets, the E(turn) curve, exact previews, challenges, spells, text variation.
- **2b · The world loop: done.** Four years of month-days, the map with two visits, the director, tracks (courses with exams and GPA, clubs, jobs, internships, the thesis), arcs with clocks and beats. Playtest #1 was skipped by decision and schema v1 frozen.
- **3 · Migration, balance, content: done up to playtest #2.**
  - *Migration* (`tools/migrations/` 0001–0012): `actor: any` → casting, `love` → spark, `check` → challenges, raw numbers → tiers, class/tone everywhere, v0.2 electives/clubs/jobs → the new tracks and places, rel thresholds rescaled, the `hollow` counter and Standing retired.
  - *New content* (writers plus a critic pass each): baseline pools for every place, course level, club, job, break plan and slot; course levels II–III; incidents and money sinks; the Hollow Star restructured into four acts with redundant clue sources; alignment events.
  - *Systems pulled forward from phase 4:* **yearbook endings** (headline, mystery, relationships and personal lines) and **alignment reactions** (Lumen ↔ Hollow).
  - *Balance:* `tools/economy.js` (sources and sinks per resource and style), the monthly baseline (board, tuition, coursework, rest, loneliness, hungry months, probation), per-style invariants and alarms.
- **4 · Narrative systems: next.** Fact discovery in the People panel, memory recall, NPC-to-NPC behaviour, archetype side characters, renown spotlights and scandals, the arc Journal tab.

## This round (after the pause)

- **Playtest #2, mechanics (step 2, under way):** the origin screen (origins apply before month 1's charges); 48 months, with year 4's last break as the wrap-up and the last month only resolving the run; the combat stub (fights cost mana, read condition and spells), swing on checks, renown checks, and exams as cards; the day played slot by slot (the map opens for each visit as it comes; festivals marked, not forced), most places open for both visits, social and world cards spread through the day, `time:` and `slot:` on 79 events, a time-of-day tint, and an alignment meter that fills from the bottom; jobs paid through their shift cards (`wage`), holiday gigs for working on campus (stub), a term-end keep-or-resign card per job, prorated dues, promotions that reset performance, the club fair's stay/resign/switch, menus that hide gated options unless they state a prerequisite (`locked:`), internships applied for in bulk and won by interview, one summer each and away from campus, and Grisk's debt escalating through a reminder and the collectors; schedules with a chance per entry and break schedules, letters off campus (halved drift, no campus pools), milestones pushed on a ramp, warmth that counts only seeking, and one relationship bar with spark that follows friendship; the midnight turn (a night card each on-campus month, a midnight pick, suspicion and lockouts) and the Cartographers as a society. Step 2 (M) is complete. Step 3 (L, balance) is done (see below and `docs/playtest-2-plan.md`). Interim fixes (step 2b) are done: a job's dues are fixed shifts (later visits and break visits are ordinary ones, with a once-a-run "not your shift" hint), a place is visited at most once a day (midnight exempt), and night suspicion is a card queued at odds (`queue … chance N`), with no hidden `spotted` state. Its review added I5–I10, also done: festival places wait for their festival, suspicion waits until you're back on campus (`defer:`), placeholder cards at four thin places, odds-aware heuristics for queued penalties, and no "take no courses" at enrolment (`offered()`). Step 2c (tooling and audits) is done: A1, A2, A3 and A4 — one bot driver with record and replay (bots on their own RNG), an engine fix (previewing "Go out" opened the midnight pick even after "Sleep", which also skewed every balance run since M-F), `grim graph`, flows per event and per month with a reconciliation check (`docs/playtest-2-flows.md`), an origin × style matrix, seed sweeps and two scenario styles. A3 replaced the routine budget's "must cost or risk something" with "no option obviously best" (alignment counts as a direction; the lint's stand-in game now counts cast relationships and wages), read the 414 single-token costs one by one (migration 0029: 124 dropped, 14 swapped for a cost the scene shows, alignment at stake on 10 more options) and added `docs/authoring/costs.md` to the writing guide. Step 3 (L) is done: jobs pay by hazard (with four hazard incident cards); friendships grow at about half the old speed; odds run 5–95% with no forced fail on milestones and exams, exams are easy/medium/hard by course level, exam preparation comes from choices more than attendance, and course levels make card checks harder; health and mood swing about a quarter wider; learning a spell gives skill XP in its discipline; five event retunes; skill growth and the expected-skill curve refitted; 37 "windfalls" that were everyday trades are routine cards. The bots now value joining clubs and jobs, exam preparation, performance and thesis progress. New `@balance` keys: `odds`, `study`, `spell_check`, `spell_bonus`, `exam_tiers`.
- **Playtest #2, step 5 (X, the major content) is done except X1 and X5**, which wait for the minigames (`docs/playtest-2-plan.md`, step 5):
  - *X7* term and break schedules by character; *X11* the Hollow Star as rumours, leads and clues (`@clue`, the Journal's threads, act names), forced lead-in beats, clue routes you have to go after, and a finale with seal tiers that can fail (`hollow_failed`, its own ending);
  - *X13* the midnight pools (the Newt upstairs, the ring under the boathouse, the kitchens, Grisk's pick-ups and deliveries, harmless nights) and *X14* money outside jobs (aid, favours, errands, the pawnbroker, a hardship grant and a bursar's loan);
  - *X15* holiday notices and a holiday version of each term job at its top rank; *X12* an internship backbone plus cards for each host; *X2* rank-3 pools; `rank()` and `performance()` take a track kind;
  - *X4* generic and per-character dates; *X9* Tamsin Reed (they/them), the Thornwick pen pal, with a four-year rivalry (letters, a secret asked and offered, a confession, the return visit, the contest, the last match, a farewell, an ending); *X8* the time loop as a hub of exploits, dares and clues with a fix that eases each loop and a cap; *X3* a twice-yearly chance to be noticed and renown stakes;
  - *X6/X16* Starfall and the Midwinter Ball as chains, with festival visits (`replaces:`), follow-ups, and Starfall at home or on an internship; *X10* the career fair without skill gates, the interview and the thesis defence as three-stage processes with tiered results, and month 48 as a closing sequence (the last morning, the final lists, what comes next, the lake, friends, partner, rival, the speech, the last Starfall, the eve).
- **Playtest #2, step 5.0 (UI) is done:** Crowns are a plain number in the middle of the top row (`display: number`), and each enrolled course shows its exam preparation, months to the exam and today's pass chance.
- **Playtest #2, step 4 (N, minor additions) is done** (`docs/playtest-2-plan.md`): three frozen-format additions (`intro:` on a track, `@game appeal`, `regrade track C`), month-end lines on every hook and state tick, and about 70 cards: intros for Vey, Brask and Pell's first shift, queued when you enrol or join; lead-ins for enrolment, the club fair and the job board; the appeal after an F; cards for hunger, detention, probation, sickness and injury, and an empty purse; the familiars as cards instead of monthly ticks; a lesson card for each of the 12 spells; three spell options and a spell from `life_invent_spell`; three jealousy cards; two errand follow-ups; three job board stories; 22 letters; and each year's opening foreshadows what's new.
- **Playtest #2, bugfix and content sessions** (`docs/playtest-2-triage.md` B and C, plan in `docs/playtest-2-plan.md`):
  - no daily card cap (`max_cards_per_day` is optional; absent means none); break days have an evening visit, and break visits don't count toward term quotas;
  - the thesis is chosen at the start of year 4 (design §4.1, §7.6), and the defence ends the thesis track;
  - migration 0019 reroutes the 124 costs the budget migrations inserted (0013/0015/0016) by what the scene costs (mood, health, clear spending, or a failure outcome); the routine budget still holds;
  - crown amounts in prose match their gold tier everywhere, and lint warns on a mismatch;
  - named partner endings (`ending_beloved_<npc>`);
  - content tweaks (triage C): four years throughout, the last-year speech moved to year four, a Duelling Circle card for the Spring Tournament, the moonpetal fetched at the Whisperwood, no new sparks while partnered, challenge labels without skill suffixes, and rewrites of confusing cards;
  - UI: the result card survives a language switch, spells learned show as a banner, challenge buttons name their skills, grade notes show score against bar, spark has its own icon, bars draw against the real maximum.
- **Linked text variation** (`docs/variation-linking-plan.md`): within a card, state or hook, every variation group uses one mode and one part count, and all groups pick the same position, so setup *k* meets payoff *k*. The engine shares one random index per card, and the journal shows the text that was shown. Cards that mixed sequence framing with random flavour are full sequence (migration 0032). Short groups are padded in English and zh-CN, and payoffs are paired with their setups. The `variants` lint is an error.
- **Feedback 2026-10-15** (`docs/feedback-2026-10-15-plan.md`):
  - *UI:* menus open with a lead-in card and each pick has a line of its own (`@track picked:`); amounts show as size marks, numbers or icons (a setting); slot background colours; the top row groups the meters and shows next month's charges (`engine.upcoming()`); a Clues tab with side threads (`@clue thread:`, `grim leads`);
  - *world:* the Job Board always offers a gig (`@place always:`, 8 new gigs); Tamsin only writes (`@npc distant:`); Corvin, Nessa and Bram are first-years, and classmates' stats grow with E(turn) (`@balance npc_growth`);
  - *numbers:* no standing mood from love or loneliness; coursework XP every month for each course, equal by level (`coursework`, `@balance coursework`); exam grades on the bell, with "go for top marks" a fair gamble (`@balance exam_bands`, `tools/exam-odds.js`); level II and III exams and course cards are harder (`course_standard`, `course_drift`): balanced players pass about 87 / 75 / 70% by level.
  - Still open: course cards at a fixed rung keep getting easier as the player grows (their odds are flat by level only on average); social play is sent home by a health crisis in about a third of games (it predates this round).
- **Feedback 2026-10-16** (`docs/feedback-2026-10-16-plan.md`; 18 notes from run `rmvae7z5x-3zqd`):
  - *engine:* a pushed card rechecks its cast roles' `where:` as well as its `when` (a confession pushed in the morning drops once the spark is cooled that day); a midnight visit is never a shift (no attendance, pay or off-shift hint); a rival bond shows the plain bond note;
  - *format* (schema v1 additions): `@place always:` takes a list in order, with `a|b` groups (one plays, the others sit the visit out) and slot filtering (an event with `slot:` only in that slot, midnight included; one without only by day); `queue any tagged <tag> …` draws one queued event of a pool when it falls due (lint, `reach` and `graph` know the pool); `grim leads --queued` lists the timed follow-ups (53, 23 marked "act"; worklist in `build/worklists/queued-leads.md`);
  - *the Newt at night:* the company offer first (`newt_company`, then `newt_company_regular` once you're a regular; a refusal rests it 3 months), one of six company nights (`company_night`: gold +large against health, mood, renown, alignment or suspicion), then the high table; `midnight_newt_cards` is retired;
  - *the ring:* a ring card first on every boathouse night, then one drawn card (Grisk's parcel no longer replaces the fight); wins lead to bouts 2–4 (adept → expert-, bigger purses, harder losses); "last standing" nights (rolled on show, said up front) make stepping out a forfeit (`ring_forfeit`: gold, renown and mood), never a locked menu; "Not tonight" leads to `ring_side_bets`;
  - *cards:* `crisis_despair` says it's low mood and reaching out brings a breakdown (one of four, at random) before the comfort; `lesson_glamour` easier with a grand win; the ward line is a spell check; the umbral candle has a ward option; the renown notice and its stages say what's at stake; `hs_grey_offer` raises every skill, gives a timed taste of the Star (or, refused, he remembers) and a follow-up service (`hs_grey_return`, Lumen or Hollow);
  - *narrative:* the silver key is a lead and the Restricted Section chain is played by going there after hours (plus Odile Varn's notebook, her last week and Bram's watch on the door); the Bell has echoes at the lakeshore, the boathouse and Maud's cottage, Maud's answer and a second dive are leads, and the bell is silenced at the lakeshore, by name or rope; Lantern Night has a lantern to make, three real wishes and three follow-ups.
- **Bedtime** (2026-10-17): recovery is a night's sleep. Every ordinary month ends with one bedtime card (night_out's "Sleep", else the new `night_sleep`): +8 Health and +4 Mood, +20 and +10 at home on a break (preset `sleep`), whatever the conditions. Going out costs nothing at the door and rests nothing. The month-start `natural_recovery` hook is removed. Tests: `test/bedtime.test.js`.
- **Strategy play styles** (2026-10-17): six simulated players with a goal, each exercising one system the older styles miss (`tools/policies.js`; `grim styles` prints what each plays for): `scholar` (scholarship origin, study first, exam approach by expected grade points), `nightlife` (out every night: the Newt's company and the ring, fighting on above 40 health), `sleuth` (routes each visit to the place with the most eligible story cards; out at night only for one), `romantic` (always "Let it grow", seeks its favourite), `homebody` (always sleeps, home every break, risk −8), `explorer` (least-visited places, a different answer on repeat cards). The full `grim balance` runs them with an alarm each; tests: `test/styles.test.js`.
- **Trajectory analysis** (2026-10-17): `grim analyze` (`tools/analyze.js`) plays any set of styles in worker threads and reports, per style, every resource and skill by month (p10–p90, mean skill against E(turn)), survival and early endings, cards a month by source, run time, milestones, check calibration, flows and origins, as JSON, Markdown and an HTML page with charts. `--baseline` reports only changes that are large and significant (p < 0.001): two seed sets of the same content differ past the plain thresholds 115 times, and twice with the tests. Findings in `docs/sim-analysis-2026-10-17.md`; tests: `test/analyze.test.js`.
- **Spells v2** (2026-10-17; `docs/spells-v2-list.md`, §K says how it landed): 35 spells with the combat minigame's ids (`combat/HANDOFF.md`, step 1), each with a `skill:`, a `verb:`, a card cost, and one level or three; `pool:` hidden or forbidden for the 11 with no source yet, `alignment:` per cast for Sleight and the forbidden. Tide, Mirror and Beast-speech are gone (their lessons retired, migration 0033; saves drop them on load). Sources: the safety talk (Ward, month 1); each course's start card (`@track start:`, one spell a course, a level at the start of each course level; passing is only the fallback); seven close-friend stubs (§F); seven five-card club and job chains from rank 2 (§G); and a lesson card plus two or more spell options on existing cards for each new spell. The head starts on fixture trusts and Lyra's duel give skills instead. Exams are a rung harder (`exam_tiers: standard+2 standard+3 standard+3`), since the course spell's XP now comes before the exam. The engine-side fight wiring (`fightPlayer`, forced outcomes, pacing) and card-side fight data wait for the loadouts. Tests: `test/engine2a.test.js`, `test/world2b.test.js`.
- **Title screen names and pronouns** (2026-10-17): a dice button rolls a name, and she/her, he/him and they/them are chosen there (remembered in settings, kept on the run as `s.pronouns`; nothing reads them yet). The name follows the pronouns: own pool or now and then a they/them one; they/them only those; one roll in five from world pools. 220 names, none a name the content uses (`test/names.test.js`), zh-CN transliterated.
- **Unreachable content:** `grim reach` is a static fixpoint over everything content can produce (flags, states, clues, tracks, places, met characters, queues). It is part of lint and has a test. It found 0 unreachable events once its own model was complete; the rare events are a balance matter.
- **Hollow Star steering:** every run reached the finale because about 50 statements, half of them in everyday events, raised a hidden `hollow` counter. The counter is gone (migration 0011). Plot gates read the arc (`clock()`, the new `clues()`), the Night comes only to those who engaged, and the outcome is now a yearbook line, so it no longer replaces the career headline.
- **Lumen and Hollow:**
  - Alignment was a dead bar. Now about 60 choices move it: Star temptations, cruelty, theft, cheating, exploiting someone, or honesty and protection at a cost.
  - 14 new events open at ±30 and ±60: temptations, Maud's way back, reactions from characters tagged `virtuous` / `ruthless`, the man in grey courting both sides, and the headmistress noticing.
  - The finale reads alignment. A Lumen player seals the door more easily. At ≤ −30 the bargain opens, and at ≤ −60 opening the door frees the Star (the new *freed* outcome) instead of ending the run.
  - Measured: the lumen style ends around +61, the hollow style around −65, random play around +13.
- **Bugs:** a policy reading of size tiers, joining a club without revealing its place, hidden places open only at night, and an autosave race (0e3f00b). Also a bot bug that counted a queued scene once per branch, and plot pacing (an auto event already in the deck was not counted).
- **Design consistency:**
  - Standing retired in favour of GPA.
  - Unpaid board means a hungry month; twice in a row brings Grisk, once a run.
  - Probation below 1.5 from the end of year 1; the board after two terms below 1.0.
  - The thesis distinction and resubmit feed the headline.
  - Ilse's chain now reaches the yearbook.
  - Corvin's runaway is reachable.
- **Readiness audit (design vs. build):**
  - The routine budget is now a lint error (migrations 0013–0015; two cards fixed by hand).
  - Challenges apply the §9.2 modifiers: +3 per known spell of a tested discipline and study points on exams (each capped at 15). An exam inside a course card tests that course's skill.
  - The thesis has a safe/ambitious choice, a crunch card and a Hollow Star thesis line.
  - Exam nerves drain mana in exam months. The Midwinter Ball moved to month 4.
  - Map art exists for every place map, checked by lint.
  - Student intros now carry milestone weight (median first meeting moved from turn 10–29 to turn 8–12).
  - The `social:<npc>` bot seeks out the places where its character is.
- **People come by two tracks** (design §5.5):
  - *You find them:* at places where their schedule puts them, and at lunch.
  - *They find you:* each character's own monthly roll, driven by warmth (recent contact you chose to warm to).
  - Character events no longer depend on winning the shared social draw. A bot courting one character now reaches 50–100 by month 24 (it was 0–40), and every student is met in year 1.
- **Bigger numbers:**
  - every tier row is about 1.5× larger (lore, mana and gold kept as they were: 68 cards name crown amounts that match the gold row);
  - stronger term stress, gloom and loneliness, and faster recovery below 70 health;
  - friendship decay −2 and spark decay 15%, as designed;
  - spells cost 1.75× as much;
  - random windfalls are niche (migration 0017);
  - the skill headlines are rescaled to the refitted curve (balanced players end around 60, not 42).
- **Fixtures:** eight background names promoted to characters (design §5.5): Sister Amaranth; Professors Brask, Vey and Marisol; Mabel, Mr Grimsby, Old Pell and Grisk.
  - **What they have:** facts, schedules and 25 events; lighter ladders, a milestone each (four teach a spell), and no romance.
  - **`seeks: rarely`:** they come to you only once you've been going to them.
  - **Leads:** courses and the apothecary job name their professor or employer as `lead:`. Enrolling or joining queues the track's `intro:` card, where you meet them (N1); grades and performance move their regard, which is the §9.2 advisor modifier.
  - **Results:** a player who seeks one out reaches their milestone in 9–20 of 20 runs; others rarely see them.
- **Casting by premise** (migration 0018): 33 generic social events now cast peers, classmates or teachers instead of "not faculty", so shopkeepers and staff never get student premises. Encounters replace a card of the visit instead of adding one.
- **Novelty within one run only:** earlier runs and other players no longer make cards rarer.
- **Hosting on the local network:** `scripts/host.sh`, `host.ps1`, `host.cmd`.
- **Docs:** `PROGRESS.md`, `README.md`, the AGENTS.md traps (folded in from the retired HANDOFF.md), `docs/playtest-2.md` (replacing playtest-1), the language reference (yearbook, `clues()`, the alignment recipe), the authoring checklist and skill, regenerated sample briefs and examples.

- **The event critique, reports 01–23 (October 15):** all 166 findings on 158 reviewed cards are fixed (`docs/review-fixes-plan.md`; per card in the critique's `handoff/fixes-2026-10-15.md`).
  - Two format additions: `@game afford: gold` locks an option whose up-front crown cost you can't pay, never every option; `@npc gone_when:` keeps an absent character off the map and out of casting.
  - A lint rule: a non-incident card can't make crown loss unavoidable.
  - Migration 0031 scopes `study` in course cards to their own course.
  - Card fixes: alignment on costly kindness and on theft or cheating; absent people's relationship changes, private renown and five- or six-year students removed; term, slot and month gates; continuity flags (Tobias away, Bram's sash, Mir's padlock, Maud's tea, Ilse gone, facts tied to the branch that tells them); wages and prices that match their text; variants for repeats.
  - The critic has a mechanical audit of its 659 unreviewed cards to read next.
  - Second batch (reports 24–40): 80 more findings fixed. `around(n)` and `apart(n)` check presence and per-person contact; repeat cards no longer assume history the player never made; stakes are gated; the thesis defence reads progress.
- **The event critique, reports 41–159 and the rechecks (October 15):** the 9 recheck failures and the 251 findings on 508 cards are acted on, in five commits (`2fba618` … `8244797`; per card in the critique's `handoff/checks-wave2-2026-10-15.md`).
  - One function, `bonds_around(status)`: bonds of a kind among the people present.
  - Card fixes: presence for every in-person cast and cameo; night and dawn scenes either slotted or framed as the morning's plan for tonight; holiday work branches on the gig actually held; stakes paid up front and empty purses handled where a cost is nested; amounts in the text match the tiers moved; alignment on the decision, not the dice, and off ordinary acts; adults throughout; once-only lifecycles (the Thornwick exchange); the bursar's loan repays exactly sixty.

## Known gaps and deviations from the design

- **Balance after L** (full `balance`, 100 games a style): random play ends early in about 31% of its runs, mostly by taking "the next barge" at its second despair crisis (the other styles never choose to leave); cautious 11%, social 4%, aggressive 15%, the rest 0–1%. Several milestones can ramp in the same month. The holiday versions of term jobs (X15) and the rank-3 pools (X2) need a job's top rank, which few simulated players reach, so the bots rarely see them (`test/world2b.test.js` deals each holiday gig directly). Scoring styles that ignore alignment drift Hollow (balanced p50 about −23, plot −60): the tempting options pay, which is the intended trade, but worth a look in playtests.
- **Spells v2 chains:** of the club and job chains the bots take up, about a third finish in a club (meetings twice a term) and 70% in a job; the hidden and forbidden pools are taught in the Whisperwood (world expansion 1; Toll still has no source); the peer capstones are one-beat stubs (§F has chain ideas).
- **Placeholder cards** (I7): the courier loft, the headmistress's tower, the ledger office and the flight field (now part of the stables, world expansion 1) have too few ordinary cards, so each has a quiet `placeholder` card (lint lists them) until X writes real ones. The internships' pick-6 menu keeps "Not this year" (decided: internships are optional).
- **Finale allies** come by promise or standing (`kael_ally`, Ilse saved and rel ≥ 15, Edmund's wand, the Wardens' trial), not the design's friendship ≥ 50. Ilse, Isolde and Maud still have few personal events.
- **Card text and crown amounts:** many cards name a crown amount ("fifteen crowns"). Lint checks them against the gold row (3 8 15 30 60); retuning gold means rewriting them (or a `{=…}` amount token).
- **Relationship lines** in the yearbook: partners have a named line each; friends are still generic (three friends; Ilse's chain), not one line per bond (§10.5).
- **Skill checks (design §8.6, the check ladder):** every challenge and roll in content is on the ladder (rungs, odds by nature, luck, drift, circumstance steps, course standards, `chance <word>`, `queue … chance <word>`). No legacy tier or raw percentage is left, though the parser still reads them. Exams: about 82% pass, GPA about 2.96. Balanced bots win 65% of their checks (81% before the ladder) and 9% sit at the cap (was 36%); all styles span 48–69%.
  - **The cost:** the bots that take every check leave early more often. In `grim balance` random leaves 68% of the time (47% after wave 1) and aggressive 38% (32%), mostly through `crisis_despair`: they lose more of their checks, and many losses cost a little mood. The careful and focused styles are unaffected.
  - Feat stays the hardest kind (52%) because vigor lags.
  - (The combat stub is retired: fights are played in the minigame, 2026-10-19.)
  - Details and levers: `docs/skill-checks-2026-10-15.md`, section 7.
- **Feedback 2026-10-16 deviations:**
  - *The careless-player floor:* reaching out at `crisis_despair` now gives mood +huge and health +small with a breakdown (was mood +huge plus a rest, about +43). At 120 games, random play leaves early in 66% of runs (55% before); social play 19% (25%), since the breakdowns spare health. Putting `rest` back restores random to about 58%, at the cost of the "too much mood" the note asked to remove.
  - *Bots and the spark:* the bots always choose "Let it cool" on `spark_cooldown`, so with the cast recheck their pushed confessions are now dropped (50 dropped against 9 shown over 29 social games). Their romance numbers fall for that reason; players choose.
  - *The taste of the Star* can't give an edge on checks (states don't modify checks), so it gives a point of practice in every skill each month for three months, against cold dreams (mood −4 a month).
  - Bots that ignore alignment drift further Hollow (balanced alignment about −90 in `balance --quick`, was −40): Lantern Night's "read other people's wishes" and the grey man's errand pay, which is the intended trade.
- **Bedtime, measured** (2026-10-17, against the commit before it; 120 games a style, `tools/economy.js`; no retuning, as asked):
  - *early endings:* random 66% → about 35% (quiet departure 56% → 17%, sent home 8% → 18%); aggressive 52% → 22%; cautious 13% → 8%; balanced 0% both; social 19% → 37%, all of it sent home by a health crisis.
  - *health:* social p50 42 → 27 and cautious 46 → 38: these bots go out on about half their nights on campus and so skip half their sleeps, where the old hook gave +10 a month below 70 whatever they did. Balanced p50 75 → 100 and aggressive 58 → 66: they always sleep.
  - *mood:* random p50 0 → 93, aggressive 39 → 85. The aggressive style's mood now lasts about 28 term months (design: breaks by 5), a new alarm; the random and aggressive quiet-departure alarms are gone. A new truant alarm: shadow is 40% of headlines.
  - Sleep is about +230–310 Health a game for every style that sleeps, against about +340 from the old hook for social play.
- **Strategy styles, measured** (2026-10-17; `grim balance --games 12`, and 10 seeds against balanced; no retuning):
  - *the night pays best:* `nightlife` ends with a median of about 1,300 crowns against moneymaxx's 307 and balanced's 190 (alarm). The ring makes about 620 a game (bouts 2–4, the self-bet, the purse) and Grisk's deliveries 130; health ends near 30, and no run ends early.
  - *the scholarship:* a study-first scholar is paid the stipend in about 4.6 of 7 terms (66%) and ends with GPA 2.96 against balanced's 2.82; the scholar headline in 5 of 6 runs.
  - *leads:* `sleuth` follows about 85% of its leads (12 of 14; balanced 4.5 of 10), finds 24 clues to 17, and silences the bell in every run (balanced half).
  - *romance:* `romantic` finds a first partner at a median of month 10 (balanced 17); every style ends with at least one partner, often several (design D2).
  - *bedtime:* `homebody` never ends early and ends at about 96 health; `explorer` visits 33 places to balanced's 24 and sees about 448 different cards to 409.
- **Simulated play, analysed** (2026-10-17; 27 styles × 100 games × 2 seed sets; `docs/sim-analysis-2026-10-17.md`; no retuning):
  - *skill:* every style's mean skill follows E(turn) within ±3 (random included; aggressive alone ends higher, 76): choices move skill between skills, not add to it. Vigor is starved (balanced ends it at 45 against 67–73).
  - *bars:* health and mood sit at the cap for every style that sleeps (health 100 from month 6, mood 97–100 from month 3; 19 of 27 styles start ≥ 61% of term months at health 95+); only health-blind and night-going styles feel them.
  - *early endings:* aggressive breaks in year 1 (month ~8) or never; social is sent home for health-blind choices, not nights out (nightowl goes out 27 nights and leaves 2%).
  - *pace:* half of each month's cards are pushed (term: drawn 6.9 of 15.1; auto 3.6, friend 1.7, queued 1.4); break months draw 4.7 of 9.4 (design: 6–7 cards in all).
  - *money and alignment:* the night out-earns every job (nightlife takes in 2,016 crowns a run, moneymaxx 936); homebody, romantic and scholar hold 20–50 crowns for four years; every style without an alignment weight drifts Hollow, steeply after month 24 (balanced −25 → −84). Merchants end with about 3× the hedge-born's crowns at equal skill.
  - *renown* is flat at 12–17 from month 9 to 42; *GPA* settles at 2.6–2.8 for every style (aggressive 3.2, scholar 2.9); *checks* are won within 1.4 points of the odds shown, in every style.
- **Tamsin's letters** are `trigger: letter` cards of her own (`chain_thornwick.grim`), and since world expansion 1 the generic `letter_from_a_friend` no longer casts her (migration 0040): a character can have only one version of a generic card, and she has seven letters.
- **Advisor relationship** (a §9.2 challenge modifier) has nothing to read: no track names an advisor character.
- **The thesis (§7.6) is simplified:** `thesis_setup` picks an ambition only; there is no discipline choice (level III passed) and no named advisor (Thorne sets the topics, but his standing doesn't modify the thesis), and a player with no courses still qualifies. Progress does count: at the defence, 70+ adds a point to the score and under 30 takes one away (event critique, report 27). Reason: the discipline and advisor systems need menus, a track lead and modifier wiring that would land with the minigames' rework of checks; the bounded version keeps the thesis playable and its work meaningful until then.
- **Friendship growth** (L-2: the `rel` row is 1 2 4 6 9): courting one character reaches 100 around month 24 for most (Kael, Tobias, Seraphine, Corvin; Nessa ~90); Lyra's median at month 24 is ~63 and Mir's ~43, because their early ladders are thin (content, for X). The minor characters' trust cards open at rel 20 (were 30).
- **Skill growth** (L: `xp_cost 1 0.04` with the spell bonus): a balanced player ends near a mean of 59 (design 35–65); a focused skill reaches 64–76 by month 24 (design ~85). The two targets pull against each other with one cost curve, because a focused player trains the other skills too; a stronger mastery bonus helped the balanced player as much.
- **Spells are scarce in content:** 17 swipe-up options (3 added in N12), and Mirror and Haste still have none, so mana stays high (the caster alarm). Spells need a content batch, not a price change; the minigames may rework them.
- **Tuned on purpose** (design numbers are marked tunable):
  - board 8 instead of 10, tuition 16 instead of 40, paid by noble and merchant families (L24);
  - hungry −3 health and −4 mood instead of −4/−4 (L-4);
  - course fees 8 a term at enrolment, not per course;
  - confessions at spark 30, not 60.
- **Balance alarms after X** (full `balance`, 120 games a style; 0 invariant failures, 13 alarms). New since L: the balanced style sees about 3.5 incidents a year (design 1–3; the X incident cards add about 0.1 a year, the rest moves between runs); the money-maxxer's year-4 climb sits at 5.4–6.1 against 5, from the courier job's top rank and the harvest festival rather than X's cards; the aggressive style's mood lasts 12 term months (9 before 5.6; festivals give a little mood); the aggressive archmage share rose to about 55% as the interview became a real test (fewer teacher and wanderer headlines). The never-seen events are the ones listed below plus the Newt's three holiday-gig cards.
- **Balance alarms after L** (full `balance` after L; 0 invariant failures, 11 alarms):
  - the aggressive style's mood breaks by term month 10 (was 27; design 5): the design's drain assumes "always grinding", but the `grind` preset is used by 3 events, so it needs skill options that cost mood in content;
  - the money-maxxer still gains about 6 crowns a month in year 4 (alarm above 5) and ends a merchant 37% (above 35%): it never takes the optional sinks, by design of the bot;
  - caster mana, focused skills and Lyra (63 at month 24), as above;
  - `ending_beloved` is reached by no style: every romanceable character has a named partner ending that outranks it, so it's a fallback only;
  - 7 events are never seen: `choose_origin` (the origin screen, not drawn), `crisis_probation` (bots keep their GPA; N2's two probation cards, `probation_advisor` and `probation_letter`, are unseen for the same reason), Marisol's storm and trust cards, `mabel_cup` and `grimsby_mind_the_shop` (minor characters with few cards; gates lowered to rel 15), `gargoyle_passage_parapet_cards` (the place is found only by Cartographers).
- **Deferred phase 3 steps:**
  - the engine's track `legacy:` grants (§13 step 7; three tracks still use them). The unused legacy syntax (`check`, `love`, `actor: any`) was removed on 2026-10-24;
  - `memory:` / `lesson:` annotations;
  - the `tune-events` skill and the `grim report` telemetry signals of §11.2 (routine picks, eligible-but-never-drawn, decision times);
  - the first path-1 batch accepted through the full loop (§13 exit).

## Next

1. **After the check rewrite:** the critic rechecks reports 41–159 (`handoff/checks-wave2-2026-10-15.md`). Then decide the careless-player floor (`docs/skill-checks-2026-10-15.md` §7: soften losing's mood cost on routine cards, or give `crisis_despair` a route without friends).
2. **Queued follow-ups into leads** (feedback 2026-10-16, §6): convert the "act" rows of `grim leads --queued` (`build/worklists/queued-leads.md`) the way the silver key was converted: the setter leaves a lead, and the payoff becomes a card at the place, slot or track where the player goes.
3. **Human playtest #2** (`docs/playtest-2.md`): a full run in each language, then `grim feedback`.
4. Address its notes; then a spell-options batch, skill growth, the finale allies' ladders, and the aggressive and windfall alarms.
5. The fight balance pass (the numbers above: early endings, fight costs against card odds, low-level fight length, the authoring guideline in `combat/EVENTS.md` §8); then social spells (X1) and the final pass (L28 economy re-check, C4, baseline). Combat wiring (X5) is done.
6. Phase 4, starting with what playtest #2 says matters most.
