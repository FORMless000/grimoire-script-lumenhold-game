# New maps: the countryside and the capital (tracker)

## Context

Threads 2 is done and pushed (0.3.266). Next, from `docs/world-expansion-design.md` §5, come two new maps for breaks, with the origins and most internship hosts distributed across them. Today:
- Breaks happen on the campus map, one generic `home` map (cottage, fields, market town, the same for every origin), or seven one-place internship maps.
- The map comes from the break plan's `map_id:` (`src/director.js` `mapView`, about line 129).

**Decisions (2026-11-03 and 2026-11-10):**
- **The countryside** replaces the generic `home` map. The map id `home` is kept for saves; it is renamed in display only.
  - It is mostly wilds, with two small villages joined by roads.
  - It leans eerie: places to investigate, an adventure delve on the moors, and a sneaky plot under its calm.
- **The capital**, a new map `city`, holds the city and its harbour quarter. The capital grew down the river and swallowed Port Calder, which is already canon and is kept as the quarter's old name.
  - It has two markets (unique goods, good services), a members' club for schmoozing (negotiation), places for renown, a delve to venture into, and places to plunder at midnight.
- **Names stay vague:** "the capital" and "the countryside", with descriptive place names (the market village, the docks).
- **Origins:**
  - Capital: noble (the townhouse), merchant (the counting house), street (the crew's loft).
  - Countryside: scholar (the family cottage), hedge (the Marsh).
- **Internships:**
  - Capital: Royal Library, Conclave, Guild works, Office of Unseen Affairs.
  - Countryside: Field Station (the moors), Expedition camp (the ridge).
  - Thornwick keeps its own map.
- **Travel:** a break plan that goes to the other map, for a fare, with lodging (rough, decent or fine).
- **Loose work is found, not chosen.** Work is offered only when you visit the place that has it, never from the break menu. The arrival screen hints where it is.
- **A dedicated arrival screen** when you reach a new map, and a return screen when you get back to the castle.
- **No card budgets:** each place gets what its activities need, measured only for reachability.

## The capital (map `city`)

The river runs from the uptown towers down through midtown to Port Calder's docks. A pin marked † is visible only to its own audience: an origin, interns, or after discovery.

| Place | What there is to do |
|---|---|
| **The Royal Library** (host; public reading room) | Research checks; look up lore the campus library lacks, including the countryside plot's old records; interns' shifts |
| Conclave towers † (interns only) | Internship shifts; nothing public, which is the point |
| Office of Unseen Affairs † (interns only) | "No sign, no address" |
| **The townhouse** † (noble home) | Family obligations against the best sleep; invitations to the club; a sibling's season; strings attached to money |
| **The grand bazaar** (unique goods) | A `type: shop` of wares found nowhere else: city items, rare reagents, a curio stall that turns over each visit, special offers with their hint cards as in threads 2 |
| **The arcade of services** | A `type: shop` of services, not things: a physician (cure a status), a tutor (study), a bathhouse (mood and health), a scribe (letters home, a forged pass), a portraitist (renown), a fortune-teller |
| **The members' club** (schmoozing; renown) | Get in by renown, a patron's card or a bribe. Negotiation checks (`challenge negotiate`, the Crux minigame) with patrons, collectors and rivals' parents: patronage, introductions, a sponsor for the Career Fair. Renown is spent and earned here; scandals catch up with you here |
| **The theatre** (renown) | Vey's season (canon); be seen in a box; an understudy night (a performance check for renown); a scandal staged or quashed |
| **The Guild works** (host; the hiring hall) | Interns' shifts; for everyone else, the hiring hall offers a day's work when you visit |
| **The docks** | Arrival by barge and coach; dock work offered when you visit; smugglers' offers; the tide-cave entrance at low tide; rumours that lead to the night's plunder |
| **The counting house** † (merchant home) | Put on the ledgers (gold or skill against free time); the family business's trouble; a clerk who knows where the bodies are buried, figuratively |
| **The crew's loft** † (street home) | Free, rough sleep, with no theft; old crew favours; the way into the heists |
| **The tide caves** † (a delve, found at the docks) | A mini-delve on the Whisperwood's pattern (`content/events/whisperwood/delve.grim`): drowned stair, smugglers' galleries, the sea's door. Morning and afternoon only (low tide). Fights, finds, a way out at every step |
| **The bonded warehouses** † (midnight plunder) | A heist on the heists' pattern (`content/events/heists/shared.grim`): guile against watchmen, customs seals and dogs; loot fenced at the crew's loft or the docks |
| **A house on the Crescent** † (midnight plunder) | A heist during a gala: a rich house's upper floors, guests on the stairs, the safe in the study. Opened by a club invitation or a crew tip |

**Cut from the earlier plan:**
- the lighthouse and strand (Grimsby's cameo goes to the docks);
- the market and bridges (replaced by the two markets);
- the sailors' inn as a pin. Decent lodging becomes a lodging state; its songs and bets become night cards for lodgers.
- The Conclave galleries were not interesting as a public place, so the Conclave is a host only.

## The countryside (map `home`, renamed)

Two villages on a road through fen, moor and ridge. Everything looks fine.

| Place | What there is to do |
|---|---|
| **The market village** (the coaching inn) | Arrival; decent and fine lodging at the inn; market day; the inn's keeper, who is far too welcoming; the harvest board that counts years; odd jobs when you visit |
| **The mill village** | The mill, whose wheel turns on dry nights; the chapel and its bell with no clapper; the miller's work when you visit; children's rhymes |
| **The family cottage** † (scholar home, `home_cottage`) | Family, neighbours, everyone asking how school is; the neighbours' silences about the seventh year |
| **The Marsh** (hedge home; public) | The hedge-witch who raised you (hedge origin) or who won't meet your eye (others); hedge lessons; the drowned chapel under the reeds; wisps |
| **The fields** (`home_fields`) | Harvest work when you visit; the scarecrows dressed in travellers' coats |
| **The moors** (Field Station host; a delve) | Interns' shifts; for everyone, a mini-delve on the Whisperwood's pattern: the cairns, the bog roads, the hollow hill, and the deepest step, the Tenant's hall. Fights, finds, fog |
| **The ridge** (Expedition host) | Interns' shifts; the standing stones and the stargazing climb; the stones are counted, and they are one more than last year |
| **The old hall** † (found through the plot) | A shut manor bought by a land agent from the capital; investigate it by day, break in at midnight |

The generic `home_market` becomes the market village and `home_fields` the fields; both keep their ids and change `name:` only.

### The plot: "The Good Year" (a side storyline, not the Hollow Star)

**The surface.** Seven good harvests running, and everyone is cheerful.

**The truth.** An old fen bargain. Every seventh year the villages "lend" a stranger to the thing under the moors (the Tenant), and the harvests stay good.
- The lent come back seven years later, unaged and remembering nothing. That keeps it eerie, not grim.
- **The keepers of the custom:** the coaching inn's keeper and the miller.
- **The one who opposes it quietly:** the Marsh's hedge-witch.
- **The schemer:** a land agent from the capital is buying farms cheaply. He knows that if a tithe fails, the bargain lapses and the land goes cheap, or he means to sell the Tenant a better tithe.
- **This is the seventh year,** and travellers are the usual tithe.

**Beats** (a `@thread` from the `story` template, with leads in the Journal and steps gated by countryside visits):
1. A welcome that is too good: the inn upgrades your room for free.
2. **Clues across the places,** in any order. Each is a side lead:
   - the guest book, whose names stop each seventh year;
   - the harvest board's tally;
   - the scarecrows' coats;
   - the clapperless bell;
   - the rhyme;
   - the agent's purchases (at the Royal Library's land rolls, which ties the two maps together).
3. **Midway:** a fellow traveller you met is gone, and the village says they never came.
4. **The climax,** at the harvest supper or in the moors delve's deepest step:
   - break the bargain: a fight in the Tenant's hall; next year's harvest fails, and the consequence cards follow;
   - renegotiate: a negotiation with the Tenant, offering something else;
   - take the agent's side: Hollow, and gold.
5. **Afterwards:**
   - someone lent seven years ago comes home, if you broke or renegotiated the bargain;
   - the hedge origin gets a line from the witch who raised them;
   - the scholar origin's neighbours change.

**Rules:**
- It is optional, and it starts on your first countryside stay.
- It never touches Hollow Star canon: no frost, no star, no key clues, no arc clocks.
- Adults only, and no gore.
- The canon goes in as soft lore through `skills/distill-lore`: the Tenant, the custom, the agent, the keepers.

## Breaks: going, arriving, coming back

- **The break menu** (`content/events/calendar_2b.grim` `break_plan`):
  - Castle, as now.
  - Go home: to your origin's map and home place, free.
  - Work on campus, as now; the campus gigs stay.
  - Travel to the capital or the countryside: a fare as a gold tier, shown only when that map isn't home, and locked with a reason when you can't pay.
  - Internship, in summer.
- **Plan states** (`content/states/states.grim` about 680):
  - `plan_home_city` (`tags: away`, `map_id: city`, the four-visit `day:`);
  - `plan_travel_city` and `plan_travel_country`;
  - lodging states `lodging_rough`, `lodging_decent` and `lodging_fine` (`group: lodging`).
  - A `@cond at_home` (`has(plan_home) or has(plan_home_city)`), applied by a migration to every bare `has(plan_home)` read.
- **Sleep:** the `sleep` preset (`content/core/balance.grim` 112) gains lodging branches: home and fine give the home amount, decent the ordinary one, rough less. A rough night can draw a theft card. No `rest:` format is needed.
- **Loose work:** each work place's `always:` card is a day's-work card tagged `work`: work for pay at a cost the scene shows, or pass. It is offered only on a visit there, and never in the break menu.
- **The arrival screen** is new UI (`src/arrival-ui.js`, with one dispatch line in `src/ui.js`, which is shared).
  - **When it shows:** the first time the map shows a different map than last time (engine: `s.lastMap`, `eng.arrival()`, `eng.confirmArrival()`; DOM-free, and saved).
  - **What it shows:**
    - the map's art, name and an arrival line;
    - where you are staying (home, the lodging chosen, or the host's quarters);
    - for travellers, the lodging pick inside the screen, priced, with the fare already paid;
    - "Work to be had": discovered places whose `always:` card is tagged `work` (the docks, the guild's hiring hall, the fields);
    - a Confirm button.
  - **The return screen** shows on the first term day back at the castle: the campus art, a return line, and what the break left you (crowns earned and spent, items, leads), drawn from the history.
  - Bots confirm at once. With no RNG involved, the golden games shouldn't change from the screen itself.
- **Format additions** (schema v1, additive), in the AGENTS.md order: `src/grimoire.js`, engine, lint, `format.js`/`query.js`, `docs/grimoire-script.md`, `schema --update`.
  - **`@map <id>`:** `name:`, `region:`, `desc:`, `arrival:` and `return:` lines, `art:`, and `lodging:` (the lodging states offered and their prices as tier words). The atlas tabs use `@map name:` in place of region names.
  - **`plan:` as a list** (`plan: home home_city`), so family cards are shared across homes. Skip it if a `@pool` with `plan:` already does this.
- **Internship hosts** move to the new maps (`map:`, `region:`). As E6 multi-track public places with `track:` and `on_shift()`, interns get their shifts and everyone else gets the public pool. Retire the six moved hosts' SVGs.
- **Maps:**
  - Draw `content/world/maps/city.svg`: river, towers, bridges, docks.
  - Redraw `home.svg`: two villages, fen, moor, ridge, the hall.
  - Both at 960×680, in `campus.svg`'s style, with no labels.

## Order

1. **Tracker:** `docs/maps-plan.md` (decisions, the places tables above, the plot, ledger, batch log) and a memory pointer.
2. **F1, the framework,** as one verified commit:
   - `@map` and the `plan:` list;
   - the plan and lodging states and the `at_home` migration;
   - the break menu and sleep;
   - the arrival and return screens;
   - the regions and i18n (`src/i18n.js` and zh `ui.lang`);
   - the two maps and every place pin, each with a placeholder card so nothing is empty;
   - the hosts moved;
   - `test/maps.test.js`: each origin's home map; travel and lodging; the sleep amounts; an intern's map; hidden origin homes; the arrival and return state across save and reload.
3. **Content batches,** each through the full loop: retrieval `search` and `related --draft`, lint and check, zh-CN, the critic.
   - **K1 countryside homes:** the cottage, scholar only (audit `content/events/pools/village_home.grim` 424+ and its origin variants); the Marsh.
   - **K2 countryside places:** the two villages, the fields and the ridge, with the work cards.
   - **K3 the moors delve.**
   - **K4 "The Good Year":** the plot thread, its soft lore and its leads; the old hall.
   - **C1 capital homes:** the townhouse, the counting house, the crew's loft.
   - **C2 the two markets:** the bazaar's wares (`@item`s) and the services shop.
   - **C3 the club and the theatre:** negotiation, patrons, renown, scandals.
   - **C4 the Library, the Guild works and the docks:** work cards, rumours, cameos (Vey, Grimsby, Mir).
   - **C5 the tide-caves delve.**
   - **C6 the two heists.**
   - **T1 travel and lodging:** night cards and theft.
4. **After the batches:**
   - balance (`grim analyze` per style, `balance --quick`, `tools/economy.js --by event` for fares, lodging, work, the markets and heist loot against `docs/playtest-2-flows.md`, and `tools/hs-funnel.js` unchanged);
   - `snapshot --out test/golden/baseline.json`;
   - design §4.3 and §5, and `world-expansion-design.md` status;
   - PROGRESS, committing shared files as HEAD plus my changes;
   - `npm run grim -- retrieve index`;
   - push.

## Critical files

- `content/states/states.grim`, `content/events/calendar_2b.grim`, `content/core/balance.grim` and `conds.grim`
- `content/world/places.grim`, `vocabulary.grim`, `lore/soft/`, `content/world/maps/{city,home}.svg`, and new `content/world/maps.grim` (the `@map` blocks)
- `src/grimoire.js`, `src/engine.js`, `src/director.js`, new `src/arrival-ui.js`, one line in `src/ui.js`, `src/i18n.js`
- `tools/grim.js` lint, `tools/format.js`, `tools/migrations/`, `tools/policies.js` (bots confirm the arrival screen and may travel)
- `test/maps.test.js`
- new `content/events/maps/{countryside,capital}/*.grim` and `content/events/good_year.grim`
- `locales/zh-CN/…`

## Verification

- `grim check`, `npm run verify`, `grim reach` (no orphans; every pin has a card), and `grim equiv` for the `at_home` migration.
- `test/maps.test.js`, and the delve and heist tests on the existing pattern.
- In the browser preview, a break per origin, a travel break with each lodging tier, and an internship: the arrival screen shows the right map, stay and work hints; the return screen shows; the atlas tabs read right.
- `balance --quick` and the economy flows.

## Ledger

| Step | State | Notes |
|---|---|---|
| F1 framework | done (2026-11-10) | `@map` (schema v1 addition), `plan:` lists, `plan_home_city`, travel plans and lodging states, `at_home()` (migration 0052), `city_born()`, `lodged_rough()`/`lodged_fine()`, the break menu, sleep by lodging, the arrival and return screens (`src/arrival-ui.js`), the two maps' art, 21 pins (the delve, heist and old-hall pins wait for their batches), six hosts moved and their one-place maps retired, one placeholder per new place, `test/maps.test.js` |
| K1 countryside homes | done (2026-11-10) | The Marsh (`countryside_homes.grim`, 6 cards): the hedge origin's grandmother at home (lesson, supper); for everyone else the hedge-witch as a stranger (rue, `marsh_rue`), the drovers' road lights, the drowned chapel, the eel-catcher. The cottage keeps `pools/village_home.grim` (at home only) |
| K2 countryside places | done (2026-11-10) | `countryside_places.grim`, 12 cards: the market village (for visitors), the mill village, the fields for travellers, the ridge; the work cards `market_inn_hands`, `mill_miller_sacks`, `fields_harvest_day` (the last serves locals too). Retired: `home_fields_harvest_help`, `home_fields_neighbours` (the fixed field-work card carries their premise); `home_market_day` gated to `at_home()` |
| K3 the moors delve | done (2026-11-10) | `moors_delve.grim`, 22 cards: two moorland cards (peat-cutters, bilberries), the edge past the third cairn, the way home (sold at the inn or kept for study), falls; bands the cairns (1–2), the bog roads (3–4), the hollow hill (5–6); depth 7 the door in the hill, shut until K4. Grace +1 for the hedge-witch's rue and +1 at home; the shepherds' trod (rescuing the ewe) starts at depth 3. Three foes in `combat/setup` (the adders' knot, the black dog, the barrow ram), tuned with `creature-study`. Flags for K4: `moor_inn_key` (room seven), `moor_new_cairn`, `moor_hill_door`, `moor_bronze_taken`. `test/moors.test.js` |
| K4 "The Good Year" | | |
| C1 capital homes | | |
| C2 the two markets | | |
| C3 the club and the theatre | | |
| C4 Library, Guild works, docks | | |
| C5 the tide-caves delve | | |
| C6 the two heists | | |
| T1 travel and lodging | | |

## Deviations from the plan

- **Hosts as their own pins.** The Field Station and the Expedition camp are intern-only pins beside the public moors and ridge (one place can't be both an internship and a delve's entry cleanly). The Conclave and the Office are intern-only too; the Royal Library and the Guild works stay one pin each, public to everyone (their own cards for visitors, the track's for interns).
- **Arrival rides on the map view** (`mapView().arrival`) instead of a new screen kind, so every simulator and test loop that handles `kind: 'map'` keeps working; picking a place confirms it with the default lodging.
- **The confirm button** reads "Settle in" (lodging names are phrases like "A hayloft").
- **Placeholders first.** One quiet card per new place (`content/events/maps/placeholders.grim`), retired as each place gets its own cards.
- **A gap found on the way:** the noon, night and morning map questions (`map.q.*`) had no strings; the four-visit break days showed the raw key.

## Batch log

- 2026-11-10 F1: lint 0 errors, zh-CN 100%, tests pass; the golden games change (118 of 120: bots now sometimes travel, and capital-born ones go home to the capital), baseline refreshed.
- 2026-11-10 K1+K2 (`build/batches/K1K2-countryside`): the critic rejected round 1 (17 issues: repeat lines that assumed an earlier choice, night scenes without `slot:`, a hedge-born intern meeting her grandmother as a stranger, locals greeted as visitors, a duplicate market day, double field work, count contradictions), then round 2 (an `always:` group made the neighbours' favours open every fields visit); accepted round 3. The fix pattern for repeats: a flag set by the option, read by the line. Lint 0, zh-CN 100%, verify green; golden baseline refreshed.
- 2026-11-10 K3 (`build/batches/K3-moors`): the critic rejected round 1 (14 issues: the door's "Not yet" was another card's punchline, three spells used against their canon, repeats that went stale, summer scenes in winter, the moor's "drove road" confusable with the Marsh's haunted drovers' road, lines borrowed from the Whisperwood, band 2 able to run out of cards); accepted round 2 with two engine-confirmed bugs fixed before commit (a flag set before the say that read it; band 2 still one card short). Lint 0, zh-CN 100%, verify green; golden baseline refreshed (random bots sent home 10 → 12, social and cautious unchanged).
