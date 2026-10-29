# New threads 1: tracker

Approved 2026-10-29. This file is the plan as approved, with a ledger, a batch log and "Next up". Update it after every
step. Status lives here, not in AGENTS.md.

## Next up

Done: every batch and the balance step are in; the records are in the design doc (§4.2 detention and heists, §9.1 spell sources, §9.3 the Owl's Ink deviation) and PROGRESS.md. Next: a human playtest of heist pacing and how often a craving lands. Toll still has no source (it had none before threads 1).

## Balance (October 29, against the commit before threads 1, same seeds)

- `hs-funnel` 40 games each, balanced/hollow/plot: every act opens in 100% of games; Eclipse is now taught by the man in grey.
- `grim analyze --styles quick --games 30` and `economy.js --by event`: GPA and skills hold. Gold within noise (nightlife +919 → +854 a game, sleuth +428 → +481 with `heist_way_out` at about 21 gold a night over 1.65 heists). Alignment drifts Hollow by about 10 a game (balanced −28 → −38, social +34 → +25) from the elixirs' −tiny a dose, and by 24 for sleuths (heists). Kept: these are the player's choices.
- Detention months in 48: social 1.2, random 1.6, balanced 1.9, truant 2.4, sleuth 3.5, nightlife 4.8.
- `balance --quick`: 0 invariant failures. 4 alarms, all there before; balanced's tight-month alarm cleared. Never-seen cards 104 → 158 (heists and the Cartographers' quest need the club; the quick styles don't join it).

## Budget ledger

| Batch | Planned | Written | Critic | zh-CN |
|---|---:|---:|---|---|
| T1 detention | 12 | 8 new + 2 moved | accepted (round 2) | 100% |
| T2 elixirs | 26 | 17 | accepted (round 2; 4 polish fixes applied) | 100% |
| T3 cartographers | 14 | 12 | accepted (round 3) | 100% |
| T4 Restricted Stacks + shared heist | 20 | 16 | accepted (round 2; 3 polish fixes applied) | 100% |
| T5 seventh tower | 16 | 14 | accepted (round 2; 2 polish fixes applied, the familiarity one to the stacks too) | 100% |
| T6 spell moves, Eclipse, retirements | edits | 5 cards edited | with T5 | 100% |

## Batch log

- **Engine** (6cd4273): a state's day in term, a pool as a recipe source, a sized boost; `test/threads1.test.js`.
- **T1 detention:** 8 new cards in `content/events/detention.grim`, plus `detention_cauldrons` and `detention_lines` moved into `@pool detention`; `night_suspicion`'s second catch gives one month and keeps the lockout. Detention months a game: cautious 1.1, balanced 2.0, nightlife 4.4. Critic: rejected in round 1 (9 issues), accepted in round 2 with 2 polish fixes, both applied. Notes: `build/batches/T1-detention.notes.md`.
- **T2 elixirs:** 17 cards in `content/events/contraband.grim` and 6 states in `content/states/contraband.grim`, plus the Brightwater and Owl's Ink lore, `@cond before_finals`, `boost_sizes` and the clue `lead_grisk_bottles`. Critic: round 1 rejected (12 issues), round 2 accepted with 4 polish fixes, all applied. Reach over 30 games a style: a craving in 12 of 30 nightlife games and 9 of 30 balanced. `amaranth_quit` and `elixir_finals_buyers` stay rare with bots; look again in the balance step. Notes: `build/batches/T2-elixirs.notes.md`.
- **T4 Restricted Stacks:** `content/events/heists/shared.grim` (the way out, the slip, the catch) and `heists/stacks.grim`.
  - The entry, a teaser, 10 steps, a dead-end fallback and the confiscation vault (crates, your own bottle back, Corvin's deck).
  - It teaches Torment (a book that charges its reader) and Reflect (the mirror desk).
  - It retires `midnight_restricted_stacks` and `restricted_page_buyer`.
  - The shelf is pinned to the east stacks, away from the founders' drafts.
  - Critic: round 1 rejected (11 continuity issues), round 2 accepted with 3 polish fixes.
  - Notes: `build/batches/T4-stacks.notes.md`.
- **T5 seventh tower, with T6:** `heists/tower.grim`, ending at the duelling master's study (Extraction), never past the desks. The tower opens at midnight.
  - T6:
    - the Outcast teaches Heartprice only;
    - `ww3_other_sky` no longer teaches Reflect;
    - the man in grey teaches Eclipse (`hs_grey_return` and `hs_grey_invitation`, left options);
    - `hs_seventh_tower`'s text puts the wards on the hollow.
  - Critic: round 1 rejected; the blocker was the study dating a forbidden notebook to the closing, which hinted at why the tower was locked.
  - Notes: `build/batches/T5-tower-spells.notes.md`.
- **T3 cartographers:** `content/events/cartographers.grim`.
  - The Master Map quest: Corvin inherited the map this summer. It has two great blanks (the stacks stair and the tower's wall stair, which open the heists), plus a gated shortcut inside each, and a final where you keep the map with him.
  - 4 society cards and 2 midnight cards at the third gargoyle.
  - Clues `lead_master_map`, `lead_deep_stacks`, `lead_tower_stair`; lore `master_map`.
  - The places are also discovered through the heist flags.
  - Critic: round 1 rejected (12 issues, among them Corvin's canon as a first-year), round 2 rejected (one plot-safety variant, the boathouse tunnel), round 3 accepted.
  - Notes: `build/batches/T3-cartographers.notes.md`.

## Deviations and open questions

- T2 dropped three planned sources (a dare at the Newt, a night-market pedlar, Bram smelling it). The trunk, the search and the friend carry those beats, and fewer cards keep the thread rare.
- Detention has 8 new cards, not about 10: the retrieval pass dropped 16 ideas as too close to existing cards (see the T1 notes).
- **Seventh tower (found while planning T3):** the day card `seventh_tower_dust_room` already enters the top room and sees the star-shaped hollow. So the wards are on the hollow, not on the tower or room door. T6 rewords `hs_seventh_tower` to say so ("the moment you reach for it"). The T5 heist may reach the top room but never touches the hollow.
- **Heist cover:** the plan's "+1 as a cartographer" is redundant, because every heist player is one. Cover is +1 with `prefect_rota`, plus +1 with `forbidden_rounds` (stacks) or with knowing the tower by day (tower).
- **Bots and the new content:** nightlife and balanced bots never visit the third gargoyle, so they never get the map. Social bots chart the stacks in 20 of 30 games but enter about twice. The forbidden spells (Torment, Reflect, Extraction) are now behind the map, so bots seldom learn them; Eclipse comes from the man in grey in 13–16 of 30 Hollow-leaning games.
- Owl's Ink's `exam:large` is 12 (`boost_sizes: small 4 medium 8 large 12`). On balanced bots at turn 10 it moves A grades from 81% to 96%. Re-check it on weaker styles in the balance step.

---

## The approved plan: New threads 1: detention, contraband elixirs, midnight heists, the cartographers

## Context

The user asked for four things, in one plan:
1. **Detention as real events.** Today detention is a one-month state that only ticks `mood -3`, plus two cards in the statuses pool.
2. **Contraband elixirs** with addiction. Grisk becomes their steady supplier.
3. **Stealing mini-delves** at midnight in the Restricted Section and the seventh tower. They use guile checks and have no fights or negotiations; some spells move out of the forest into them.
4. **An expansion of the Midnight Cartographers.** They unlock the heists.

**Decisions (2026-10-28/29):**
- **Detention** takes **both** of the month's visits (afternoon and evening). Each becomes a punishment card with no map pick, and those cards replace the monthly debuff. It is cleared at the start of a break.
- **Caught at midnight a second time:** 1 month of detention, **and the 3-month lockout stays**.
- **Elixirs** last **2 months**. **Owl's Ink boosts exam results directly and aggressively**, so it's in demand (and sold) before finals.
- **Seventh tower:** the cartographers' map opens its midnight delve even without the main plot. The tower's plot role is checked first (below).
- **Spells:**

  | Spell | New source |
  |---|---|
  | Torment, Reflect | the Restricted Stacks |
  | Extraction | the seventh tower |
  | Eclipse | the main plot (the man in grey) |
  | Heartprice | the Outcast, now his only lesson |

How this stays inside the project's rules:
- The format is frozen at schema v1, so additions only.
- Amounts are tier words.
- Moral weight goes on alignment.
- No arc clue and no clock outside hard-canon plot cards.
- Every batch goes through the full loop: retrieval, critic and zh-CN.

## Engine additions (frozen-format-safe; one step before the content)

Each follows the AGENTS.md order: `src/grimoire.js` → `src/engine.js` / `src/director.js` → `tools/grim.js` lint → `tools/format.js` / `tools/query.js` if touched → `docs/grimoire-script.md` → `grim schema --update`. Each gets a unit test in `test/`.

1. **A state's day in term.** Today `day:` is honoured only on a `kind: plan` state during a break (`src/director.js` `recipe()` / `planDay()`). Now `day:` on any other state replaces `@game day_term` while it holds, **in term only**. The break plan's day still rules a break, and the last day rules over both.
2. **A recipe slot may name a `@pool`** (`afternoon=detention`), drawing that pool's cards. This lands in `poolOf()` in `src/director.js` (~line 605). The parse of `day_term` / `day` checks the name; an unknown name is an error. No slot of source `visit` means no map pick, so the UI should need nothing. Check it in `src/ui.js`, which is shared with the other agent, and touch it only if needed.
3. **A sized boost.**
   - A `boost:` entry may carry a size: `boost: exam:large`. A bare kind stays one rung (`@balance tonic`).
   - Sizes come from a new `@balance boost_sizes` line (`content/core/balance.grim`); for example, large is about three rungs, roughly a full grade.
   - `boost(kind)` (`src/engine.js` ~406) returns the largest boost held, so `examOdds()` (~877) and plain checks read it as before.
   - Tune the number with `tools/exam-odds.js`.

## Part A: Detention as a day

- **`content/states/states.grim` `@state detention`:**
  - Drop `tick: mood -3`.
  - Add `day: morning=courses noon=social:1-2 afternoon=detention evening=detention night=world:1-2 midnight=special:0-1`.
  - Add `tick: if break: lose detention`, which clears it on vacations. A detention gained during a break never takes a day, since breaks keep their plan day.
- **`@pool detention`:**
  - `class: routine`, `when: has(detention)`.
  - `detention_cauldrons` and `detention_lines` join it (a migration; `grim equiv` shows only the pool change).
  - **About 10 new punishment cards**, each a trade with costs the scene shows (canon `lore demerits`: "scrubbing pans or cataloguing contraband"). Ideas:
    - cataloguing the confiscation vault (sets `vault_catalogued`, a Restricted heist opportunity);
    - the trophy hall;
    - the owlery;
    - kitchen pans;
    - reshelving with Footnote;
    - shadowing Bram's round;
    - an apology letter;
    - sorting lost property;
    - weeding with Maud;
    - copying the demerit ledger.
- **`night_suspicion`** (`content/events/night.grim`), second catch: `gain locked_out` + `gain detention` (1 month) instead of `gain detention 3`. The say line changes, so zh-CN is redone.
- **The 31 existing `gain detention` sources stay.** An explicit `gain detention N` keeps its N.
- **Obligations are not excused:** a lost shift or practice is part of the punishment. Measure it in the balance step and soften it there if needed.

## Part B: Contraband elixirs

**Worldbook:**
- Soft `@lore` entries (`content/world/lore/soft/academy.grim`): **Brightwater** (body and spirits) and **Owl's Ink** (magic and a sharp head before exams). These are working names; check them with canon lint and retrieval.
- A line that Grisk deals both.

**States** (`content/states/states.grim`, a new "Contraband" section):

| State | What it does |
|---|---|
| `brightwater` | buff, `group: elixir`, **duration 2**. Tick `health +small`, `mood +small`. `on_add: lose brightwater_want`. `on_expire`: the addiction roll, `chance <word rising with elixir_doses>: gain brightwater_want` |
| `owls_ink` | buff, `group: elixir`, **duration 2**. `on_add: mana +medium`, tick `mana +small`, **`boost: exam:large`**. Same addiction shape |
| `brightwater_want`, `owls_ink_want` | debuff, `duration: 4`. Tick `queue any in withdrawal_<x> chance unlikely` (the occasional punishing events). Ends when it expires or with another dose |
| `brightwater_bottle`, `owls_ink_bottle` | the stash: a visible neutral state, at most one bottle of each |

**Cards (about 26):**
- **Taking a dose:** an auto card at month start while you hold a bottle ("The Bottle in Your Trunk"): drink it, not yet, or pour it away. Drinking:
  - loses the bottle;
  - gains the effect;
  - adds `alignment -tiny`;
  - `queue contraband_caught chance unlikely` (every dose is a risk).
- **The finals market** (a `@cond before_finals` for months 3–4 and 9–10 in term):
  - Owl's Ink sources weight up then.
  - A classmate offers a bottle at a premium.
  - Desperate classmates ask to buy yours: sell for `gold +medium`, `alignment -small`, with a caught risk.
  - Grisk's price rises before finals.
- **Other random sources (about 5):**
  - a bottle in a borrowed bag;
  - a dare upstairs at the Newt;
  - a pedlar at the night market;
  - the confiscation vault (heist loot);
  - a homesick first-year's "tonic from home".
- **Grisk's steady supply (about 4)** at the boathouse at midnight, drawn after the ring card like `grisk_pickup`:
  - his offer, once you've had a bottle and know him;
  - a bottle for a favour (lookout, keeping a crate, a word in a prefect's ear);
  - a dearer price when you're hooked;
  - cutting him off.
  - The existing `grisk_cross` / `grisk_gone` exits are reused.
- **Caught (about 3):**
  - `contraband_caught` (a dormitory search): detention, bottles confiscated to the vault, `watched`;
  - Bram smells it on you;
  - a friend notices (`rel`).
- **Withdrawal (about 8, 4 per elixir)**, pools `withdrawal_brightwater` / `withdrawal_owls_ink`:
  - Brightwater: the shakes, a black mood, a craving that Grisk prices.
  - Owl's Ink: a blank head in lectures, Mana that won't come, a nightmare.
  - Each offers a way through, or a dose if you hold one.
- **The way back (1–2):** Sister Amaranth at the infirmary helps you quit (ends `_want`, at a cost in mood and rel).

**Design deviation to record:** §9.3 says tonics are the only check bonuses you can buy. Owl's Ink is a second, illicit and stronger one.

## Part C: Midnight heists (two mini-delves)

**Shape.** Copy the Whisperwood scene (`content/events/whisperwood/delve.grim`: `ww_edge`, `ww_way_home`, `ww_stumble`, `ww_lost`, `@thread ww_delve from: scene`; steps with `thread:`, a band in `when:`, and `next`).

Counters, reset on entry:

| Counter | Meaning |
|---|---|
| `heist_depth` | how deep or high you are |
| `heist_loot` | what you carry |
| `heist_cover` | slips you can survive: 1; +1 as a cartographer; +1 Restricted only, with `forbidden_rounds`; +1 tower only, with Corvin's chalk marks |

Persistent: `heist_stacks_deepest`, `heist_tower_highest`.

**How a step resolves:**
- Checks are mostly `deceive` (slipping past someone) or `feat using guile` (locks, sills, creaking boards). Occasionally `research` or `spell`.
- No `combat` or `negotiate`.
- Each step: go on (`heist_depth += 1`, maybe loot, `next`), or slip away with the loot (`queue heist_way_out now`).
- A lost check with cover left queues `heist_slip`: cover −1, health or loot −1, and a `night_suspicion` roll.
- A lost check without cover, or a ⚠ hazard, queues `heist_caught`: loot confiscated, detention, `queue night_suspicion now`.
- Taking moves `alignment -tiny`.

**The Restricted Stacks** (`restricted_section`, midnight). Three bands going down: the chained shelves, the breathing stacks, the deep stacks. At the bottom is **the confiscation vault** (canon): steal back a confiscated bottle; `vault_catalogued` opens a quick way in.
- Teaches **Torment** (a chained grimoire).
- Teaches **Reflect** (a reading desk of mirrored glass, research).
- About 12 steps.

**The seventh tower: what the plot needs (checked).**
- **Act III's beat `hs_seventh_tower`** (`chain_hollowstar.grim`, `slot: evening`, needs `clue(lead_seventh_tower)`): you climb through shrieking wards to the top room. Lifting the star key puts out every candle, and `hs_key_breakfast` follows with the headmistress.
- **Canon** (soft `lore star_key`, `seventh_tower`): the key sits in a star-shaped hollow at the top, "behind wards that shriek".
- **The lead** `lead_seventh_tower` is a hollowstar arc clue, granted only by plot cards.
- **The tower is already public and open by day.** Its routine cards climb halfway (stair count, candle landing, the desks on the stair). It can be discovered off-plot (`castle_empty_halls` → `discover seventh_tower`).

**So the tower delve:**
- climbs three bands of the lower and middle tower (the stair, the old classrooms, the abandoned observatory floor);
- caps at **the warded landing**: the wards hum, you go no further;
- never sees, names or takes the key, and never reaches the top room;
- grants no hollowstar clue (the cartographers' unlock is its own lead, not `lead_seventh_tower`);
- is tagged without `hollowstar`;
- after `star_key` / `gave_star_key` / `key_taken`, varies the landing's text without saying why.

It teaches **Extraction** (a century-old duelling master's notes in a locked classroom), in about 12 steps.

**One continuity fix to the plot card:** `hs_seventh_tower`'s text has the wards shriek "the moment you touch the door". Reword it to the top room's door, so it agrees with the day cards and the heist. This changes text only, so redo zh-CN for that line. Plot logic is untouched.

**Shared cards:**
- an entry card per place;
- `heist_way_out`: fence the loot to the page buyer (gold, `alignment -tiny`), or keep it and read it (lore);
- `heist_slip`;
- `heist_caught`;
- `@thread heist_stacks` / `heist_tower` (`from: scene`) with journal lines.

**Places** (`content/world/places.grim`):
- `seventh_tower`: `open:` adds `midnight`; `discover:` adds `or flag(heist_tower_known)`.
- `restricted_section` is already open at midnight.

**Replacing the old midnight cards there:** `midnight_restricted_stacks` and `restricted_page_buyer` are retired with `when: false` (ids kept); the page buyer returns as the fence. The `forbidden` storyline's `time: evening midnight` cards stay.

## Part D: Spell moves

| Card | Change |
|---|---|
| `ww3_other_sky` (`whisperwood/delve.grim`) | stops teaching Reflect; becomes a plain band-3 step with lore or loot, same id; the `spell_level(reflect)` gate goes |
| `ww_outcast_table` (`whisperwood/hush.grim`) | teaches **Heartprice** only (then `lore +medium`, as now) |
| **Eclipse → the man in grey** (`chain_hollowstar.grim`) | `hs_grey_return`'s Hollow option ("Take the letter to the jetty", which "pays in what he promised") adds `if spell_level(eclipse) < 1: learn_spell eclipse` and a say line; `hs_grey_invitation`'s "Go to the boathouse" teaches it too, if not yet known. These are hard-canon story cards, so teaching a spell there is plot-safe. Simulation checks it's reachable |

Lesson cards (`pools/spell_lessons.grim`) key on `spell_level`, so they need no change.

## Part E: The Midnight Cartographers, expanded

Today the cartographers are a society (no ranks or dues) of about 18 cards. They are the only club without a capstone quest.
- **`@thread carto_master_map from: quest`** (about 6 cards). The club's Master Map has blank regions.
  - **Start:** Corvin unrolls it.
  - **Parts**, in any order:
    - chart the deep stacks (`heist_stacks_known`, lead `lead_deep_stacks`);
    - find the tower's stair (`heist_tower_known`, lead `lead_tower_stair`);
    - the book-lift shaft (a deeper start in the Stacks);
    - the old bell rope (skips the tower's first band).
  - **Final:** your name inked on the Master Map (rel Corvin, guile, a soft `@lore` line).
  - The first two parts are what unlock the heists. Like `carto_hush_margin`, each is a lead in the Journal.
- **About 6 new routine cards** in the gargoyle passage and track pools, with peers cast `tagged(here, student)`. Ideas:
  - the initiation;
  - a rival map that's wrong on purpose;
  - a prefect who knows and says nothing;
  - the map that redraws itself;
  - chalk codes;
  - a member who wants out.
  - Plus **2 midnight cards** at the gargoyle passage, so its midnight pick is no longer one card deep.

## Order, tracking, checks

1. **Tracker:** a new `docs/threads-1-plan.md` (decisions, budget ledger, batch log, "Next up"), plus a memory pointer.
2. **Engine** (the three additions) and tests, then `npm run verify`.
3. **Batches**, each with the full loop:
   - retrieval `search` before drafting, `related --draft` after (`rag/AUTHORING.md`);
   - `grim lint` / `check`;
   - zh-CN via `grim i18n zh-CN`;
   - a critic subagent (`skills/critic/SKILL.md`).

   | Batch | Contents |
   |---|---|
   | T1 | detention (≈12) |
   | T2 | elixirs (≈26) |
   | T3 | cartographers (≈14) |
   | T4 | Restricted Stacks with the shared heist cards (≈20) |
   | T5 | seventh tower (≈16) |
   | T6 | spell moves, Eclipse, retirements, the `hs_seventh_tower` text |

   About 110 cards.
4. **Balance:**
   - `tools/economy.js --by event` against `docs/playtest-2-flows.md`;
   - `grim analyze` per style;
   - `grim balance --quick`;
   - `tools/exam-odds.js` with Owl's Ink;
   - `tools/hs-funnel.js`: the plot is unchanged, and Eclipse is taught.
   - Watch:
     - detention months per game, and the missed shifts and practices;
     - how often addiction happens and how long it lasts;
     - grades and GPA with Owl's Ink;
     - heist gold against the forest delve.
5. **Records:**
   - the golden diff confirmed as intended, then `snapshot --out test/golden/baseline.json`;
   - `npm run verify:full` (no browser e2e);
   - design doc §4.2 (the midnight catch, the detention day), §9.3 (elixirs), a heist note next to the Whisperwood one, §9.1 (spell sources);
   - PROGRESS.md (shared files staged as HEAD-plus-my-hunk blobs);
   - `npm run grim -- retrieve index` at session end.

**Critical files:**
- `src/director.js`, `src/engine.js`, `src/grimoire.js`
- `tools/grim.js`
- `docs/grimoire-script.md`
- `content/core/balance.grim`
- `content/states/states.grim`
- `content/events/night.grim`
- `content/events/pools/statuses.grim`, `pools/night.grim`
- `content/events/chain_hollowstar.grim`
- `content/events/whisperwood/delve.grim`, `hush.grim`
- `content/world/places.grim`, `clues.grim`, `lore/soft/academy.grim`
- new files: `content/events/detention.grim`, `contraband.grim`, `cartographers.grim`, `heists/stacks.grim`, `heists/tower.grim`

**Reuse:**
- the `scene` and `quest` templates (`content/core/templates.grim`);
- `boost()`;
- `queue … chance`;
- `defer: off_campus`;
- `night_suspicion`;
- `grisk_cross` / `grisk_gone`;
- `carto_hush_margin` as the unlock pattern.
