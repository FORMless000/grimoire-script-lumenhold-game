# Plan: the 2026-10-25 feedback round (run `rmvolph34-3zqd`, "Wren"): careers and the last month, the Hollow Star, the ring

## Context

The longest "Wren" run is `data/runs/rmvolph34-3zqd.ndjson` (street origin, zh-CN, v0.3.230, 48 months, 664 cards, forked six times; `rmvkhfhqs` is the same save under an older version; its finished parent `rmvfg0hza` ended *archmage / hollow_keeper / beloved_mir / dumonts_reunited*). `grim feedback` reports 31 notes. The 18 from 2026-10-16 (turns 7–27) were handled by `docs/feedback-2026-10-16-plan.md`; **13 notes from 2026-10-19/20 (turns 35–46) are open**, plus the user's pasted requests: a career pipeline that can't hand out an unannounced job, a last month whose cards describe and *decide* every yearbook line, a cinematic Hollow Star finale that resolves every clue and closes the arc, a louder style for conflicts in plots, and a wizards-only ring with cameos.

Root causes found:
- **Career fair "not yet" never returns:** `y3_career_fair` (`content/events/expansion_y3.grim:9`, `when: final_year and month == 2`) queues itself `in 1`; `advance()` rechecks `when` (`src/engine.js:1911`) and drops it in month 3.
- **A job with no foreshadowing:** headline endings are stat checks (`ending_archmage` = arcana ≥ 80 and gpa ≥ 2.5, `content/endings.grim:80`; shadow, scholar, alchemist, merchant likewise); only teacher/wanderer read fair flags. The Night's bargain (`arcana +huge`) pushed arcana to 100 → archmage, while `last_career` (`content/events/last_day.grim:40`) said "no letter". Internship return letters die too: `intern_asked_back` has `when: year <= 3` (`calendar_2b.grim:553`) but the year-3 assessment lands in year 4; `thornwick_offer` is read by nothing; jobs feed no ending.
- **Month 48 decides nothing:** the yearbook (`src/engine.js:2186` `yearbook()`) reads stats; month-48 cards (`last_day.grim`) only mirror them, with mismatched conditions (`last_partner` vs `beloved_*`'s mood ≥ 60; `last_friends` rel ≥ 15 vs 3 bonds). `hollow_fled`/`held_line` fall to `ending_bystander`, which contradicts `last_lake`. Design §4.1 (line 306) already says month 48 is "one resolution card per ending, whose choices decide how each ending resolves".
- **The Night:** `hs_the_night → hs_tunnel → hs_threshold → hs_beneath` (`content/events/chain_hollowstar.grim:459–775`) is one fight (the man in grey), one check and a door. Of 9 clues, `second_shadow`, `kael_family`, `codex_names`, `founders_ledger` and Edmund's wand are never read. Nothing closes the arc: `hs_seventh_tower` (no `arc:`, no outcome check) and its queued `hs_key_breakfast` fired in months 46–47. The bargain's `arcana +huge` hit the cap, `star_mark` was already held, no aftermath follows, and its `health -large` took Health to 0 (hence `crisis_collapse` straight after). Kael is only an odds word.
- **`ilse_grey_returns`** (`chain_ilse.grim:58`): `combat journeyman likely` on a story card (no drift) = foe level 23 at any month.
- **The ring** (`night.grim:139`, `pools/night.grim:483–657`, foes `combat/setup/foes.mjs:77,93–103`): brawlers, sailors, toughs; no characters.
- Small cards: see the coverage table.

User decisions (this session):
- **Ally assists:** an ally throws in a spell once in a while (Kael: Hoarfrost), through one minimal reusable framework.
- **The ring:** no forbidden cast is reported; the alignment cost stays; the ring's prose says so. Its prose is rewritten for the new wizard foes. Cameos come only from characters who fit, by chance in some bouts, never the last.
- **Month 48: choices decide.** Replaying month 48 from one save must reach every ending that run can reach.
- **The main plot:** a full, high-energy rewrite with fewer fixed-time events, built on the wiring framework (§9 of `docs/grimoire-script.md`).

**Order of work:**
1. Engine and language (1).
2. Assists (2).
3. Careers and the last month (3).
4. Card fixes (6).
5. The ring (5).
6. The plot: outline checkpoint (4.0b), then the acts in order, ending with the Night.
7. Guidance (7).
8. Localization, review and records (8).

Each step is committed separately once `grim check` passes, and pushed only at a working state (a push goes live).

Rules for every step (AGENTS.md): amounts are tiers/presets; every choice trades; no id renamed or deleted (retired cards keep their block with `when: false`); new `say:` branches go after existing ones; only hard-canon story events `find`/`advance`; read canon with `grim brief` first; new proper nouns get soft `@lore`; `grim retrieve status` before drafting (rebuild if unbuilt), `retrieve related --draft` on each new card, `retrieve index` at the end. First step of implementation: copy this plan to `docs/feedback-2026-10-25-plan.md`.

## Coverage

| # | Card (turn) | Note | Item |
|---|---|---|---|
| 1 | `intern_conclave_your_ward` (35) | Upgrade the wards here? | 6.1 |
| 2 | `ilse_grey_returns` (37) | Challenge far too low | 4.5 |
| 3 | `duel_bram_barrage` (42) | Make it a fight against Bram | 6.2 |
| 4 | `soc_stargazing` (43) | Forced Health loss | 6.3 |
| 5 | `hs_the_night` (45) | Evolve into several events in a row | 4.2 |
| 6 | `hs_tunnel` (45) | Co-op fights: Kael dealing some damage | 2, 4.2 |
| 7 | `hs_threshold` (45) | One dedicated card saying Kael is with you | 4.2 |
| 8 | `hs_beneath` (45) | Bargain gives nothing immediate | 4.3 |
| 9 | `crisis_collapse` (45) | Price climbs 30 → 60 → 120 (recurring), narrated as worsening | 6.4 |
| 10 | `y3_career_fair` (38) | Didn't come back next month | 3.1 |
| 11 | `jealousy_seen_together` (45) | Fired with Lyra as an ex | 6.5 |
| 12 | `thesis_defence` (46) | Yellow on mellow yellow; use the purple of courses/payouts | 6.6 |
| 13 | `soc_partner_anniversary` (46) | Make it a real anniversary | 1.2, 6.7 |
| P1 | ending (pasted) | Guaranteed interview/return offer by month 47; permissive options; no offer → "still searching" / "back home" by performance; choose among offers in month 48 | 3 |
| P2 | ending (pasted) | Every ending line described and chosen through month-48 cards | 3.4 |
| P3 | Hollow Star (pasted, then revised) | A full high-energy rewrite with fewer fixed-time events, on the wiring framework; cinematic finale with encounters beyond the man in grey; every clue resolved; no clue after the Night | 1.1, 4 |
| P4 | all plots (pasted) | Inter-character conflicts louder and more cinematic; guidance for future plots | 4.4, 7 |
| P5 | the ring (pasted, then revised) | All opponents wizards, sometimes rogue/forbidden casters, with prose rewritten for them; no report; cameos only by fitting characters, by chance in some bouts, never the last | 5 |

## 1. Language and engine additions (schema v1, additions only)

Order for each: `src/grimoire.js` (SCHEMA/FUNCS) → `src/engine.js`/`src/director.js` → lint in `tools/grim.js` → `tools/format.js`, `tools/query.js` → `docs/grimoire-script.md` → `node tools/grim.js schema --update`, with unit tests in `test/`.

**1.1 Closing an arc.** New statement `close <arc>` and function `closed(<arc>)`. Once closed: the director deals no card with `arc: <arc>` (pools, places, auto), and `advance()` drops queued/pushed ones at their recheck (the same spot as the `when` recheck, `engine.js:1911`), so a chain like `hs_key_breakfast` dies too. Lint: an option or branch that `find`s one of an arc's clues/leads must be on a card with `arc: <arc>` or under a `when` that tests `closed(<arc>)`, so every clue source is covered by one rule. Content then: `hs_the_night` runs `close hollowstar` on both "go down" and "stay above"; `arc: hollowstar` is added to the hs_* cards that lack it (`hs_seventh_tower`, `hs_key_breakfast`, …); the everyday clue sources (`umbral_last_lecture`, `astro_eclipse`, `maud_tea_tells`, `maud_old_student`, `forbidden_section_2/3`, `ilse_grey_returns`, `hs_kael_sister`) get the arc or a `not closed(hollowstar)` guard on the clue option, whichever keeps their pacing (`arc:` counts toward the plot cap, `director.js:342`; check with `tools/hs-funnel.js`). Also, the arc closes at its last deadline even for a player who never qualified for the Night, through the bystander's own card (the lake freezes without you).

**1.2 A bond's age.** The `bond` statement (`engine.js:1568`) records the turn it set the bond (`n.bondAt`); new function `bond_months(x)` = months since the current bond was set (−1 if unknown, e.g. old saves). The `%` operator already exists, so anniversaries read `bond_months(npc) >= 12 and bond_months(npc) % 12 == 0`.

**1.3 Tooling fix found on the way:** `grim graph` reports flags read only by endings as "nothing reads it" (`career_teaching`); make the graph's reader scan endings too.

## 2. Ally assists in fights (`combat/`, the bridge, EVENTS)

One framework for every "fights beside you": an EVENTS entry may declare `assist: {by: '<npc>', spell: '<spell>', every: [min, max]}` (or `chance`). Every few exchanges (deterministic from the fight seed) the ally casts that spell at the foe for free: no Mana or action of yours, its normal damage/effect at the ally's power, resolved where scheduled hits already resolve (`combat/rust/core/src/rules.rs` step 5, "scheduled hits and construct ticks").
- Rust: one small export (`assist_cast(state, side, spell, power)` or a scheduled-hit entry), plus a text line ("Kael throws Hoarfrost", `rust/core/src/text.rs`, and the zh-CN text in `combat/setup/text.mjs`).
- Bridge: `src/combat.js` reads `assist` from the setting (next to `script`/`loop`, line ~80) and schedules it; the fight's top line names the ally; the bench (`combat/web`) mirrors it.
- First users: `hs_tunnel/fight` (Kael, Hoarfrost, when `kael_ally` or `winter_kael`, replacing the odds-word stand-in) and the Night's other fights where an ally is with you (4.2).
- Rebuild `build/combat.bundle.js` with `node combat/tools/bundle.mjs` (cargo for the wasm); refresh the minigame's goldens; record it in `combat/HANDOFF.md` and design §9.2. Another agent has uncommitted work in `combat/` (HANDOFF, `tools/site.mjs`, `web/app.mjs`, `web/index.html`) and `src/ui.js`: build from a clean state as before, and stage only this work's paths (`git commit -- <paths>`).

## 3. Careers, offers and the last month

Design first: a new **§7.7 Careers and offers** and updates to §4.1 (months 47–48), §7.5 (the return letter), §10.5 (headline = the career you sign; `barely` moves to personal) in `docs/design-v0.3.md`.

**The model:** an offer is a flag `offer_<career>`; signing sets `took_<career>`; each headline ending reads its `took_` flag. Stat thresholds no longer hand out jobs: they make an employer send a letter. Offers come only through cards, so every job is foreshadowed.

| Career | Offer sources | Headline ending |
|---|---|---|
| Conclave | fair; Conclave internship return letter; head-hunt letter at arcana ≥ 80, gpa ≥ 2.5 | `ending_archmage` (existing id, condition becomes `took_conclave`) |
| Royal Library | fair; archives return letter; library-assistant job | new `ending_librarian` |
| Junior fellowship | head-hunt at the scholar thresholds | `ending_scholar` |
| Guild of Alchemists | fair; Guild return letter; apothecary-clerk job | new `ending_guild` |
| Own shop | head-hunt (a lease) at alchemy ≥ 72 | `ending_alchemist` |
| Unseen Office | fair; Unseen return letter; head-hunt at guile ≥ 75 | `ending_shadow` |
| Trading house | head-hunt at gold ≥ 180 | `ending_merchant` |
| Teaching | fair (Thorne/Maud/Isolde rel ≥ 15) | `ending_teacher` |
| Circus | fair | `ending_wanderer` |
| Observatory, Beastcraft station, Thornwick lab | their return letters (`thornwick_offer` finally read) | new endings, one each |
| Tavern, broom courier | their job, at a good last term review | new endings, one each |
| none | — | new `ending_still_searching` (gpa ≥ 2.5 or renown ≥ 30, tunable) / `ending_back_home` (else) |

**3.1 The fair:** `y3_career_fair` `when: final_year and month >= 2 and month <= 3`, with a second-visit text in month 3. Its interviews (`y3_interview…verdict`) set `offer_<career>` instead of `career_offered`; `y3_offer_letter` keeps "sign now" as an early `took_`. Existing flags stay read for old saves.

**3.2 Return offers:** `intern_assessment` (`calendar_2b.grim:511`) stores `return_<host>` at performance ≥ 80; `intern_asked_back` allows year 4 and becomes the host's return letter (offer). A job's last `job_term_review` at good performance queues "stay on full time" (offer). Head-hunt letters: one auto card per employer in year 4 (months 5–10, after the thresholds hold), class `windfall`/`milestone` and spread so at most one arrives a month.

**3.3 Month 47, the last call** (new `career_last_call`, auto at `wrapup and month == 11`, when no `offer_` flag): a menu that always holds at least one permissive option. Every old employer or host the player worked for takes them back (an easy interview); the registrar's open list (a village clerk's post or similar, `likely`); one long shot at a fair employer they skipped (a hard interview); "not now" (no offer). Each win sets the offer.

**3.4 Month 48, the decisions** (all `trigger: auto, when: turn == max_turns`, in `last_day.grim` order). Each card describes its ending line in the ending's own words, and its options set the flags the endings read:
- `last_results`: GPA and thesis. Describes `barely` (now personal, automatic).
- `last_career` (menu): one option per held offer (`when: flag(offer_x)`) → `took_x`; plus "keep looking" (→ still searching / back home by performance). With no offers, only that option, whose text names which.
- `last_lake`: the mystery outcome, one text per outcome; new mystery endings for `hollow_fled` and `hollow_held_line` (no more bystander contradiction).
- `last_partner`: one card per partner (dealt for each, through a thread template if a single card can't repeat per cast). Options: "stay together" → `kept_<npc>` (the `beloved_<npc>` ending reads it instead of mood ≥ 60) or "part at the gate".
- `last_friends`: matches `beloved_friends`' condition; "keep in touch" sets its flag, "let it fade" doesn't.
- New `last_dumonts` (reunited / Ilse taken) and `last_tamsin`: describe their lines; options keep or let go.
- New `last_remembered` (menu, pick up to two): one option per personal line the run qualifies for (celebrity, lumen, hollow_touched, thesis_hollowstar); the picks are the personal lines.
- `y3_speech`, `last_rival`, `last_starfall`, `graduation_eve` stay.

**3.5 The replay guarantee:** a new `grim finale <save>` (in `tools/grim.js`) loads a month-48 state, explores every option combination of the month-48 cards (both outcomes of any check), and prints the reachable yearbooks. Test (`test/finale.test.js`): on the golden runs' month-48 states, every ending whose earned precondition holds (offer held, partner bond, qualifying stat) appears in at least one branch, and no headline appears without a card that offered it.

## 4. The Hollow Star, rewritten in full

Today the plot is 40 cards (`chain_hollowstar.grim` 23, `chain_hollowstar_acts.grim` 11, `chain_ilse.grim` 6). 12 of them are beat cards on a fixed calendar (`content/world/arcs.grim:16`, `beats: 1@y1m3 … 12@y4m9`), and the rest are auto cards pinned to months (`hs_isolde_summons` months 3–7, `hs_last_winter`, `hs_the_night` at `month == 9`) or quiet one-off checks. The rewrite replaces the whole arc with high-energy storylines built on the wiring framework (`docs/grimoire-script.md` §9: `@thread … from: story|quest|scene`, `@pool`, `@cond`, `@appointment`).

Read first: `grim brief hollowstar`, the soft lore in `content/world/lore/soft/hollowstar.grim` (Star, seal, key, seventh tower, round door, drowned bell, ledger, codex names, star mark, man in grey, Hollow cult, Dumonts, Wardens, Edmund, starcalling, star herald), the arcs `kael_thaw` and `ilse_dumont`, cast facts for Kael, Ilse, Isolde, Maud and Seraphine, and design §10.6. Canon facts stay; scenes and pacing change. Lore the rewrite adds (a cult leader, the shadow, new places of confrontation) goes in as soft `@lore` via `skills/distill-lore/SKILL.md`, and the worldbook's timeline entry about the Night's date is updated.

**4.0 The shape.**
- **Fewer fixed dates.** The arc's `beats:` become deadlines: the latest month each act can open. The engine already takes the higher of the scheduled clock and the current clock, so hard-canon cards that `advance hollowstar` when the player pushes the investigation open the next act early. The world still moves without you: an untouched plot opens each act by its deadline (design §10.6's rule).
- **Act openers find you.** Each act opens with one card dealt by the `beats` appointment (`limit: plot`). It is placed or cast so it lands when you're at a relevant place or with a relevant person, not on a set morning.
- **Investigations are quests the player chases.** In each act a `quest`-template thread offers parts in any order at places, through leads (`clue(lead_…)`). Each part pays a clue and a key moment, and the final comes once enough parts are done. No part waits on the calendar.
- **Confrontations are scenes.** The man in grey, the cult, Kael and Ilse act against you or each other on screen, in `scene`-template threads: several cards in one sitting, rising stakes, fights in the minigame with ally assists (2), and choices made under pressure.
- **The finale comes when you're ready or when time runs out.** From year 4 the player who holds the star key, or enough key clues, can choose to go down early (a card at the lake); otherwise the Night falls at the arc's last deadline (year 4, by Blossomtide). Either way it is one scene thread (4.2), and it closes the arc (1.1).
- **Antagonists escalate.** The man in grey hunts you: each act he comes back stronger, in a scene and a fight pitched with drift so it keeps up. Ilse is torn between the cult and her brother. The Wardens and the Dumonts clash in the open. Lost confrontations cost something real (a clue taken, an ally hurt, the clock advanced).

**4.0a The storylines** (proposed names, `@thread` blocks in a new `content/events/hollowstar/` folder, one file per act):

| Act (deadline) | Opener | Threads (template) | Pays |
|---|---|---|---|
| I Omens (y1) | the lake breathes, at the shore | `hs_dreams` (story): the black-star dreams; `hs_bell` (quest): the drowned bell, the boathouse, the frozen note; `hs_archive` (quest): the founders' records, library and restricted section | `lake_bell`, `founders_ledger`, `knows_founders_seal`, leads |
| II Investigation (y2) | the man in grey on campus, face to face | `hs_grey_hunt` (scene, recurring): he tests, tempts and attacks; `hs_kael_secret` (story → scene): you corner Kael, and the truth comes out in a shouted confrontation; `hs_ilse` (story, absorbs `chain_ilse.grim`): Ilse arrives, and the siblings collide | `kael_family`, `ilse_truth`, `codex_names`, `hollow_tempted` / `grey_watching` |
| III Escalation (y3) | the cult strikes: a tower goes dark, the lake half-freezes | `hs_sides` (scene): Isolde and the Dumonts face off, and you pick a side with wands drawn; `hs_locks` (quest): Maud's seven locks and Edmund's wand; `hs_shadow` (story): Seraphine and the second shadow; `hs_tower` (quest): the seventh tower and the star key | `seven_locks`, `second_shadow`, `star_key`, `sided_*` |
| IV Convergence (y4, by Blossomtide) | the last winter: allies choose to stand with you | `hs_ready` (story): what each ally promises, plus going down early; `hs_night` (scene): the finale (4.2) | outcome flags |

Every clue keeps its id, and each key clue keeps ≥ 2 reachable sources (design invariant; `tools/hs-funnel.js` and the canon lint check it). Old cards are retired with `when: false` (ids are never deleted); their flags (`kael_ally`, `sided_*`, `hollow_tempted`, `ilse_saved`/`taken`, `winter_*`, `star_key`, …) keep their meaning, so a save mid-plot carries on in the new threads. Effects stay tier words and presets; moral weight goes on `alignment`; progress reads `clock(hollowstar)` and `clues(hollowstar)`.

**4.0b Outline checkpoint.** Before any card is drafted, the act-by-act outline (each thread's cards, one line each, with what they pay and where they're dealt) goes in `docs/plots/hollowstar-v2.md` and is shown to the user for approval.

**4.1 Every clue resolves.** Each clue gets a beat in the Night that pays off if found and still happens if not (the truth revealed at worse odds and with a higher cost), so the finale explains the whole mystery either way:

| Clue | Where it resolves |
|---|---|
| `lake_bell` | the bell rings as the lake freezes: you know the note (intro; better odds on the ice) |
| `codex_names` | you name the cult's leader and break their circle (cult scene: a skip-the-fight option) |
| `kael_family`, `ilse_truth` | Kael and Ilse face the man in grey, in an open, shouted confrontation (tunnel; Ilse scene) |
| `second_shadow` | your own shadow rises as the Star's champion (shadow scene: forewarned odds) |
| `seven_locks`, `founders_ledger`, `knows_founders_seal`, Edmund's wand | the founders' wall: each one opens a lock or lowers the cost (threshold) |
| `star_key` | the key turns in the round door (the seal option; without it, a harder seal) |

**4.2 The Night as a scene thread** (`hs_night`, `from: scene`; it is entered by going down early or at the deadline; all cards `arc: hollowstar`, played in one sitting; ids kept for the four existing cards):
1. `hs_the_night` (rewritten): the lake freezes, the bell, the academy wakes; go down or hold the line above (`close hollowstar` on both).
2. **New** `hs_night_company`: one dedicated card saying who comes with you (Kael when `kael_ally`/`winter_kael`; otherwise the `winter_*` ally or no one). It sets the ally for the whole chain, so the later cards just name them.
3. **New** `hs_night_cult`: the Hollow cult's circle on the ice. A fight against their leader (a Hollow adept foe, ally assist), or `codex_names` to break the circle.
4. `hs_tunnel` (rewritten, harder): the man in grey. Kael (or Ilse) confronts him for their family out loud. A fight with Kael's Hoarfrost assist, or talk (`ilse_truth`, `kael_family`), or slip past (`lake_bell`).
5. **New** `hs_night_ilse`: if Ilse was taken, she stands with the man in grey and the siblings clash (reach her with a negotiation, or fight her); if she was saved, she breaks his compulsion beside you. This resolves `ilse_taken`/`dumont_reunited` on screen.
6. **New** `hs_night_shadow`: your shadow as the Star's champion, a fight against a Hollow mirror foe (`second_shadow` gives the forewarned odds).
7. `hs_threshold` (rewritten): the founders' wall and its locks (4.1).
8. `hs_beneath` (rewritten): the Star speaks. The seal is a last fight against its herald plus the seal check (preparation as now, `chain_hollowstar.grim:641`); bargain, open and flee as now, each made loud.
9. **New aftermath cards for every outcome** (`hs_aftermath`/`_lost` exist for the seal): bargain, freed, fled and held-the-line each get one.

Fight pitch: `master-`/`master` with odds from preparation, drift `none`, checked with `node tools/grim.js odds <id>` against `docs/authoring/checks.md`. New foes (cult leader, the shadow, the Star's herald) go in `combat/setup/foes.mjs` FOES/PERSONAS/loadouts with EVENTS entries (`witnesses: false`).

Health over the chain: the scene fights settle Health themselves; card Health costs move to the aftermath, so no `crisis_collapse` interrupts the Night.

**4.3 The bargain pays at once:** rewards that don't sit at a cap. Learn a Hollow spell from canon (starcalling, if the spellbook has it or gains it), Mana and gold now, a lasting condition with a real edge and a price, and `star_mark` given only if not already held (else it deepens: a named second effect). It is announced in its own aftermath card.

**4.4 Louder conflicts:** the whole plot is written in the new style (7). Characters confront each other on the page: Kael and Ilse shouting across the ice, Isolde and the Dumonts with wands drawn, the man in grey striking in daylight. The earlier notes on `hs_grey_offer` (more significant) and the silver key (make leads proactive) are met by the quest structure.

**4.5 Ilse's man in grey** (`ilse_grey_returns`, folded into `hs_ilse`): his fights use `drift mid` from a rung pitched with `grim odds` (an `expert` floor, not a fixed level 23), so he is a real threat at every act; he gets stronger each time he returns.

**4.6 Tools and checks:** update `tools/hs-funnel.js` for the new threads (reach of each act, of the early descent and of each outcome, per play style); `grim reach` / `graph` on every new thread; the plot cap (`director.js:342`) and `grim analyze` (how runs unfold month by month) confirm that plot cards are spread out and not bunched at the deadlines.

## 5. The underground ring

- **Opponents all wizards:** the ring's foes (`POOLS.ring` and `ring_*` in `combat/setup/foes.mjs:77,93–103`) are replaced by wizard foes with wizard kits: a dropout duellist, a stage illusionist, a moonlighting Conclave clerk, a disgraced prefect, a Thornwick exchange student and so on. About one per bout tier is a rogue caster whose loadout holds forbidden spells (as `ring_bookmaker`'s does). Each is written for who they are.
- **Prose rewritten for the new foes:** every ring card (`midnight_boathouse_ring`, `ring_on_yourself`, `ring_bout_2..4`, `ring_side_bets`; `night.grim:139`, `pools/night.grim:483–657`) gets new text. The `{~a|b|c}` descriptions name and introduce each new foe in the same order as the foe lists (`src/combat.js:33`), with win/lose `say:` lines to match. New foe names get soft `@lore`.
- **No report:** every ring EVENTS entry gets `witnesses: false`; the alignment cost of a forbidden cast stays. The prose says so on the entry cards (nobody in the ring reports what's cast there), and the fight's top line already shows it.
- **Cameos, only by fitting characters and never in the last bout:**
  - A `@cond ring_fighter(x)` names the characters whose traits fit an illegal night ring: Corvin (reckless, in debt), Lyra (proud, fights to win where nobody can see her lose), Bram (a prefect with something to prove, out of uniform), Ilse (ruthless, raised to fight) and Grisk (already an underground fighter). It's read from their cast entries; others, such as Tobias, Seraphine, Mir, Nessa or the faculty, never appear.
  - In bouts 1–3, a luck branch (`chance unlikely`, so roughly one night in several) swaps the drawn foe for a new queued card `ring_cameo`. It is cast with a met `ring_fighter`, fought with `challenge combat vs <role>.<stat>` (the existing `peer` fallback, `src/combat.js:36`, so their level follows their own skill), and has a scene of its own for each fighter (their reason to be there, and what it means if you beat them or they beat you). It then continues to the next bout as usual.
  - Bout 4 always has a ring foe.

## 6. Card fixes

- **6.1** `intern_conclave_your_ward` (`pools/internships.grim:99`): add `> up[ward]:` (cast your own Ward: a bigger performance and renown, for the Mana), following `spell_uses.grim:562`.
- **6.2** `duel_bram_barrage` (`club_spell_chains.grim:84`): `challenge duel vs bram.vigor`, EVENTS `'duel_bram_barrage/left': {play: 'bram', context: 'practice_duel', witnesses: true}` (precedent `duel_bram_hazing`); drop the lose branch's ignored Health line.
- **6.3** `soc_stargazing` (`expansion_social.grim:77`): remove the unconditional `health -tiny` on both sides; the cold becomes a luck branch on the option that stays out longer.
- **6.4** `crisis_collapse` (`crisis.grim:7`): a `collapse_cures` counter; the cure costs large (30), then huge (60), then a new preset at 120 (`balance.grim`, e.g. `cure_dire`) every time after. Label and text vary with the counter, narrated as the condition worsening.
- **6.5** `jealousy_seen_together`, `jealousy_two_invitations`, `jealousy_cold_supper` (`social.grim:718–768`) and `soc_stargazing`: casts use `courting(x)` (`content/core/conds.grim:5`), so exes are excluded.
- **6.6** `thesis_defence`: the yellow is the partial-result chip (`.chip.check-part`, `src/style.css:387`; dark theme yellow on mellow yellow). Confirm in the browser (`index.html?event=thesis_defence&debug`), then restyle the partial chip in the note purple (`style.css:172/180`) in both themes.
- **6.7** `soc_partner_anniversary` (`expansion_social.grim:216`): cast `bond(npc) == "partner" and bond_months(npc) >= 12 and bond_months(npc) % 12 == 0` (1.2); text names the years.

## 7. Guidance for future plots

`docs/authoring/style.md` gets a **Conflict and climax** section: confrontations between characters happen on the page, out loud and in the moment (accusations, raised wands, a choice under pressure), not in hints; a climax is a run of scenes with stakes rising; every planted clue pays off; one card names the companions once. Mirror it in `skills/critic/SKILL.md` (a check) and point to it from `skills/write-academy-events/SKILL.md`. Principles only, no lore (memory rule).

## 8. Localization, review, balance, records

- zh-CN for every new/changed line: `node tools/grim.js i18n zh-CN`, fill new and STALE lines (the tester plays in zh-CN); the fight text and ally line in `combat/setup/text.mjs`; glossary terms in `locales/zh-CN/GLOSSARY.md`.
- Critic pass on the new and rewritten cards (`skills/critic/SKILL.md`); `retrieve related --draft` before review; `grim dupes`.
- Balance: `tools/hs-funnel.js` (the Night's reach and outcomes), `tools/exam-odds.js` unaffected, `grim balance` (headline mix: every style still lands a career or one of the two no-offer endings), `tools/economy.js --by event` for the ring.
- Records:
  - `PROGRESS.md`: a section for this round, plus deviations.
  - `docs/design-v0.3.md`: §4.1, §7.5, §7.7, §9.2 and §10.5, and §10.6 rewritten (deadline beats, act threads, the early descent, the closed arc).
  - `docs/grimoire-script.md`, `combat/HANDOFF.md`, and `docs/plots/hollowstar-v2.md` (the outline).

## Verification

1. `node tools/grim.js check` after each step; `npm run test` for the new unit tests (arc closing drops dealt/queued arc cards; `bond_months`; ally assist schedules and resolves; finale reachability).
2. `node tools/grim.js finale` on a forked month-48 save (fork Wren at turn 44 from `data/runs/rmvolph34-3zqd.ndjson`'s save), confirming that every ending the run qualifies for is reachable and that a missed fair still yields `career_last_call`.
3. Play by hand: preview `index.html?event=<id>&debug` for each new card. Play the Night from a fork at turn 44 with `npm start`: the companion card, Kael's Hoarfrost in the fight log, no plot card or clue afterwards. Also play the early descent from a sim save that holds the star key. Check with `tools/hs-funnel.js` and `grim analyze` that an untouched plot still opens each act by its deadline and ends as bystander. Play the ring's bouts, including a cameo for a fitting character in bouts 1–3 (none in bout 4), and check the thesis chip colour in both themes (`run` skill or the browser).
4. `npm run verify:full` (engine, UI, combat and balance all change); `grim diff`, then confirm the golden diff is the intended change and refresh `test/golden/baseline.json` in the same commit; `grim build --check` (content and combat bundles).
5. `npm run grim -- retrieve index` at the end.
