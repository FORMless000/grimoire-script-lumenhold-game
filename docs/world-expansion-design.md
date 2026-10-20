# World expansion: design (sections 4–6)

Status: **draft, saved as brainstormed on 2026-10-19.** This is the second half of the world-expansion brainstorm. Sections 0–3, and the academy's condensation (5a), are still being refined in plan mode and are not in this file:

- **0.** The intro sequence
- **1.** Whisperwood delves
- **2.** Character voices (`specializes:`, facts)
- **3.** Services and upgrades
- **5a.** The academy condensed, with E6 (multi-track places)

They are referred to below where these sections depend on them: delve #2 reuses section 1's delve pattern, and the city and countryside counters come from section 3's catalogue.

Nothing here is implemented. Numbers and lore follow `docs/design-v0.3.md` and the worldbook (`content/world/`). Where this doc proposes to change either, it says so.

## Context

- **Breaks** are a plan card plus two visits. The design's §4.3 "Travel (port city / the North)" was never built.
- **Maps.** The world is spread over 9 maps (campus, home and 7 single-place internship maps).
- **Characters** don't appear at work, outside the jobs the player holds.
- **Clubs.** There are three clubs and one society. Three legacy clubs (the Choir of the Spheres, the Skyrace Squad and the Stargazers) exist only as dead states.

### Lore check for the three maps (to confirm)

- **Port Calder** is soft canon as "a rough harbour town on the coast".
  - Making it the capital's downtown means revising that soft `@lore` entry: *"the old harbour town at the river mouth that the capital grew down to swallow. Locals still call it Port Calder, and still steal your trunk only once."*
  - Nothing in hard canon objects. The capital is unnamed, the Guild works are "by the river", and the street origin's "the streets of Port Calder" still reads right.
- **Three internships are canonically outside the city:**
  - the Expedition camp, "a high plateau";
  - the Field Station, "on the moors";
  - Thornwick, "across the hills".

  All three fit the **Countryside** map naturally, as its wild edges. The other four (the Royal Library, the Conclave, the Unseen Office and the Guild works) are canonically in the capital or by its river, so they go on the **City** map.
- **The capital needs a name.** It's a new proper noun, so it needs a soft `@lore` entry. That's your call.

---

## 4. Named characters at work

Each character gets `schedule:` entries, a discovery card cast `where around(x)`, and co-worker cards in the job's track pool.

| Character | Job | What it opens |
|---|---|---|
| **Bram** | A secret dawn shift at the bakery. His father's allowance comes with conditions. | Keep the secret or use it: alignment plus rival leverage |
| **Corvin** | Barback at the Gilded Newt | A co-worker if you work tavern. Cover for him at the tip jar? |
| **Tobias** | Delivers herbs for Pell | A co-worker on apothecary shifts |
| **Mir** | The repair bench in the village square on market days | Section 3's owl and lamp; the padlocked-workshop arc |
| **Seraphine** | Reads fortunes at the Newt on Friday nights | Refuses to read yours unless you stand next to her |
| **Nessa** | Courier runs | A co-worker on courier shifts; scoops and their ethics |
| **Kael** | Grounds work with Maud over breaks | The grounds gig; a quiet break thread |
| **Lyra** | Tutors duelling for coin, only after her mother cuts her off (a fact) | A conditional storyline she's too proud to admit |

**Budget: ~35 cards.**

---

## 5. Three maps

**Before:** campus, home and 7 internship maps (9 in all). **After:** **Academy** (`campus`), **Countryside** (the `home` map id, kept), and **City** (new).

**The places principle.** As few places as the lore needs, with every archetype a player would expect still present. Origin homes and hidden places are gated, so they never dilute anyone else's pools.

### 5a. The Academy (moved to the first plan)

The academy's condensation (33 campus pins down to 18 open plus 5 gated) and E6 (multi-track places) now belong to the first plan, alongside sections 0–3. This doc assumes those merges: the Stables & Flight Field (with the courier loft), the Great Hall (with the refectory), the Library (with the Ledger office), and the Village Square (with the bakery).

### 5b. Breaks, homes and lodging

**The break menu** (`break_plan`, reworked):
- **Stay at the castle.** Board as now, or the Newt's room upstairs if you have the arrangement.
- **Go home** (free). It takes you to your origin's map and home place. The street origin's "home" is the crew's loft: free, but rough.
- **Travel.** Pick Countryside or City, pay the fare (a gold tier; cheaper with the coach pass), then pick lodging.
- **Work.** Pick a gig on campus, in the City or in the Countryside. Gigs include board.
- **Internship** (summer). Your host's map; lodging is provided.

Add **break-time castle cards** (~15): who stays over the break (Kael, Corvin, Nessa), the empty halls, the kitchens.

**Homes by origin:**

| Origin | Map | Home place | Staying home means |
|---|---|---|---|
| Noble | City (uptown) | **The family townhouse** (origin-only) | The best sleep, free board, family obligations (mood or strings), uptown access |
| Merchant | City (by the wharf) | **The counting house** (origin-only) | Good sleep, free board, and you're put on the ledgers (gold or skill against free time) |
| Street | City (Port Calder) | **The crew's loft** in the Salt Stair (origin-only) | Free, rough sleep; crew favours; no theft |
| Scholar (provincial) | Countryside | **The family cottage** (the existing `home_cottage`, scholar only) | Home sleep, and the "everyone asks how school is" cards |
| Hedge-born | Countryside | **The Marsh**: a public place, and home only to the hedge-born | Home sleep, hedge lessons, the marsh's own cards |

**Lodging tiers** (picked on arrival when you aren't home; a state lasting the break):

| Tier | City | Countryside | Effect (needs E5 for the sleep) |
|---|---|---|---|
| **Rough** | A hammock in a Salt Stair doss-house | A hayloft (free if you work the fields) | Cheap; the weakest sleep; a theft card can fire |
| **Decent** | The Sailors' Rest | The coaching inn, Market Town | Ordinary sleep; tavern cards at night |
| **Fine** | A hotel on the Crescent, uptown | The inn's best room | Home-level sleep; uptown invitations; mood |

**Format additions for breaks:**
- **E2: `day:` on plan states.** Free plans (castle, home, travel) get three visits (`morning=plan:0-1 noon=visit afternoon=visit evening=visit night=world:1`). Work keeps the current shape.
- **E3: `due_break: N` on a job track.** Gigs become tracks you work by visiting their place, counted per break. Every other visit is free. The six existing gigs already have campus places, so they migrate.
- **E5: `rest: <preset>` on states.** The `sleep` statement uses the best active state's rest tier (rough, ordinary, home or fine). This covers lodging, origin homes and the tower room. Today `sleep` only knows "at home on a break".
- **Maps:**
  - Origin homes are content only: `plan_home_city` and `plan_home_country`, picked by `has(origin_x)`.
  - Internships keep `map_id: internship`; their host places simply move maps.
  - Retired maps: the 7 internship SVGs.

### 5c. The Countryside map (id `home`, re-drawn)

The valley country beyond the lake: farms and a crossroads town, with the moors, the ridge and Thornwick at the edges.

| Place | Archetype | Notes |
|---|---|---|
| **The Market Town** (`home_market`) | Town, inn, market, post | The coaching inn (lodging), the charm seller. The town halfway to Thornwick, where Tamsin's spring meetings with biscuits happen. |
| **The Fields** (`home_fields`) | Farm | Harvest gig (E3); the Fennick farm (Tobias's mother, at harvest) |
| **The Marsh** (new) | Wilds; hedge-born home | Foraging, marsh-lights, hedge lessons |
| **The Moors** (`field_station`, moved) | Wild moorland; internship | The Beastcraft Field Station. For everyone else, moor walks and moor-drakes. |
| **The High Ridge** (`observatory_camp`, moved) | Mountain; internship | The expedition camp. For everyone else, a stargazing climb (a later delve candidate). |
| **Thornwick** (`thornwick_lab`, moved) | The rival school | Interns and visit days only (the exchange chain already goes there) |
| **The Family Cottage** (`home_cottage`) | Home | Scholar only |

**Pins:** 5 open, 2 gated.

**Budget: ~45 cards.**

| Part | Cards |
|---|---|
| The Marsh (new) | 6 |
| Moors and Ridge as public places | 5 + 5 |
| Market Town and Fields top-ups | 4 + 4 |
| Gigs | 2 × 4 |
| Travel, arrival and lodging | 6 |
| Tamsin's meeting | 3 |
| Thornwick visit day | 2 |
| Counters | 2 |

### 5d. The City map: the capital uptown and midtown, Port Calder downtown

A river runs from the Conclave's towers down to the sea. Money flows uphill and everything else flows down.

| District | Place | Archetype | Notes |
|---|---|---|---|
| Uptown | **The Royal Library** (`royal_library_archives`, moved) | Great library; internship | A public reading room for everyone else |
| Uptown | **The Conclave Towers** (`conclave_laboratory`, moved) | Government of magic; internship | The public gallery; receptions need "a name in the Crescent" |
| Uptown | **The Office of Unseen Affairs** (`unseen_office`, moved) | The secret service | Gated: interns only. "No sign, no address" stays true. |
| Uptown | **The family townhouse** | Noble home | Origin-only |
| Midtown | **The Grand Market & Bridges** | Market and shops | The counting house (bank), the uptown tailor, the river fair (already in content) |
| Midtown | **The Theatre** | Theatre | Vey's season (she's here every break); the Travelling Circus wintering |
| Midtown | **The Guild Works** (`alchemists_works`, moved) | Industry; internship | "By the river"; a hiring hall for gigs |
| Downtown | **The Quay** | Docks, customs, ships | Arrival by river barge, the sea-witch's stall, dock gigs, smuggling choices |
| Downtown | **The Salt Stair** | Slums, old town | The street crowd, pickpockets, the doss-house, the fence |
| Downtown | **The Sailors' Rest** | Tavern and inn | Lodging, a job, shanties and bets |
| Downtown | **The Calder Light & the Strand** | Lighthouse and beach | Grimsby on holiday (a fact); rock pools; the sea serpent at sunset |
| Downtown | **The Tide Caves** | Dungeon | Delve #2, gated by discovery. Open only at low tide (morning and afternoon slots). |
| Downtown | **The counting house** | Merchant home | Origin-only, on the wharf |

**Pins:** 9 open, 4 gated. Each new proper noun gets a soft `@lore` entry.

**Cameos** (`schedule_break:` when you're in the City):
- Lyra at a regatta on her mother's yacht, miserable. Rescue her for an afternoon.
- Nessa chasing a smuggling story.
- Mir selling the family's clockwork at the market.
- Grimsby at the lighthouse.
- Vey at the theatre.
- Marisol out in a winter storm on the Strand.

**Budget: ~120 cards.**

| Part | Cards |
|---|---|
| 9 open places × 5 | 45 |
| 3 origin homes × 5 | 15 |
| Tide-cave delve | 22 |
| Gigs (dock, Sailors' Rest, Guild hiring hall) | 3 × 4 |
| Arrival, lodging, theft | 8 |
| Cameos | 12 |
| Night and letters | 6 |

The map SVG is drawn from the existing internship art where possible.

---

## 6. Three clubs from the legacy list

| Club | Place | Lead | Signature event | Spell chain |
|---|---|---|---|---|
| **The Skyrace Squad** | Stables & Flight Field | **Bram**, as captain. He yells at you, then steps between you and a Thornwick flyer. | **The Skyrace Cup** vs Thornwick in spring. Tamsin trash-talks it by letter. | Haste |
| **The Choir of the Spheres** | Great Hall | **Seraphine**. The choir loft is dark, and that's where she hides from loud futures. | Sings at **the Midwinter Ball and Starfall** (`replaces:`) | Glamour or Mind |
| **The Tinkers' Bench** | Workshop | **Mir**. The first arc is getting the faculty's padlock off. | **The Exhibition**, which may or may not catch fire | Mirror |

**Budget: ~27 cards a club, about 80 in all.** The existing cast leads all three; side characters are unnamed archetypes, so they need no new portraits. The Stargazers wait until the Hollow Star's sky is settled.

---

## Later

- The North as a destination (plot-heavy).
- The Night Market as a recurring pop-up.
- The castle's forgotten corridors, as delve #3 (Isolde's student portrait).
- The High Ridge climb, as delve #4.
- E4 (states that modify check odds) and T2 (items), with the minigame rework.
- Memory recall in specializations.

---

## Waves (for these sections)

**Every wave:**
- passes `grim check`, then `npm run verify`;
- runs `grim balance` and `grim analyze` per style, and updates the bots where needed;
- refreshes the golden baseline in the same commit;
- runs `grim i18n zh-CN`;
- gets a critic pass and a `PROGRESS.md` entry.

| Wave | Contents | Cards | Format additions |
|---|---|---|---|
| **A** | Named characters at work (section 4), alongside section 3's academy counters. Needs the first plan's academy condensation (the bakery in the square). | ~35 | — |
| **B** | The break framework: `day:` on plans, break shifts, `rest:` on states; the break menu, lodging and homes; break-time castle cards; the Countryside map with its three internships | ~65 | E2, E3, E5 |
| **C** | The City map: Port Calder and the capital, four internships moved, origin homes, the tide caves (needs section 1's delve pattern), the city counters (section 3); the 7 internship maps retired | ~125 | — |
| **D** | The three clubs. Needs the academy condensation and E6 from the first plan (Skyrace shares the Stables & Flight Field with a course and a job). | ~80 | — |

Each format addition follows the AGENTS.md order: `src/grimoire.js`, then `engine.js` and `director.js`, lint, `format.js` and `query.js`, `docs/grimoire-script.md`, then `schema --update`.

## Decisions open

1. **Port Calder as the capital's downtown.** This revises one soft `@lore` line.
2. **The capital's name.**
3. **Format additions** E2 (`day:` on plans), E3 (`due_break:`) and E5 (`rest:` on states). All are additive.
4. **Club leads.** Bram for Skyrace, Seraphine for the Choir, Mir for the Tinkers.

## Verification (per wave)

- `grim check`, then `npm run verify` (lint, reach, golden diff, quick e2e).
- After the internship hosts move maps, `grim reach` shows no orphaned place events, and the schedules still resolve.
- `tools/economy.js --by event`, against `docs/playtest-2-flows.md`, for lodging, fares and gigs.
- `grim analyze` per style: break cards a month, and gold at the end.
- Preview cards with `index.html?event=<id>&debug`, and play one break per map in the browser preview.
