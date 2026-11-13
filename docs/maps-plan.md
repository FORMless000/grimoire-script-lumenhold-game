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
| C1 capital homes | done (2026-11-12) | `maps/capital_homes.grim`, 10 cards: the family townhouse (noble: dinner where every word is weighed, recurring; calling cards; a suitable tea; the family silver pawned between rents), the counting house (merchant: the old clerk's end desk, recurring; a damp cargo your mother wants signed for; your old room full of violets), the crew's loft (street: the card game that never ended, recurring; one job, like old times, sets `crew_job_done`; Jory's empty hammock). Soft lore `crew_loft` (Nan Merrow, Jory). The counting house's and the loft's placeholders rewritten as their quiet fallback scenes |
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
- **The lent don't come home** (K4). The plan had the lent return unaged after seven years; the cards needed the whole hall full of every guest ever lent and a crowd walking out when the bargain breaks, so the soft lore now makes "they come home" the keepers' own comfortable lie: the lent sit at the Tenant's supper for as long as the bargain holds.
- **A gap found on the way:** the noon, night and morning map questions (`map.q.*`) had no strings; the four-visit break days showed the raw key.

## Batch log

- 2026-11-10 F1: lint 0 errors, zh-CN 100%, tests pass; the golden games change (118 of 120: bots now sometimes travel, and capital-born ones go home to the capital), baseline refreshed.
- 2026-11-10 K1+K2 (`build/batches/K1K2-countryside`): the critic rejected round 1 (17 issues: repeat lines that assumed an earlier choice, night scenes without `slot:`, a hedge-born intern meeting her grandmother as a stranger, locals greeted as visitors, a duplicate market day, double field work, count contradictions), then round 2 (an `always:` group made the neighbours' favours open every fields visit); accepted round 3. The fix pattern for repeats: a flag set by the option, read by the line. Lint 0, zh-CN 100%, verify green; golden baseline refreshed.
- 2026-11-10 K3 (`build/batches/K3-moors`): the critic rejected round 1 (14 issues: the door's "Not yet" was another card's punchline, three spells used against their canon, repeats that went stale, summer scenes in winter, the moor's "drove road" confusable with the Marsh's haunted drovers' road, lines borrowed from the Whisperwood, band 2 able to run out of cards); accepted round 2 with two engine-confirmed bugs fixed before commit (a flag set before the say that read it; band 2 still one card short). Lint 0, zh-CN 100%, verify green; golden baseline refreshed (random bots sent home 10 → 12, social and cautious unchanged).

## Round 2: away is away, a bustling capital, a wide countryside, peers at home (2026-11-11)

The approved plan is at `~/.claude/plans/jaunty-gathering-galaxy.md`; its order is F2 (engine), P1 capital peers, P2 countryside peers, C1 capital homes, S1 bazaar and arcade, C2 club/theatre/gardens/bridges, C3 docks/fish market/coaching yard/cathedral/Printing Row/Undercroft/Rookery, C4 tide caves, C5 heists, K4 "The Good Year", K5 countryside places and counters, T1 region street cards, lodging nights and letters, then balance and a push. It folds in the rows above still open.

**Why.** An audit of 30 bot games found campus cards on the away maps: visits fell back to campus ambient cards through `draws:` tags; Hollow Star beats, intro beats, Maud's tea, Grisk's collectors and feud cards fired wherever you were; confessions came from peers back at the castle. Lyra and Tobias were `schedule_break: away` (gone even if you stayed); the other peers stayed at the castle even when you went to their city.

**Decisions.**
- Off campus a card plays only if it belongs (grimoire-script §6c, "Away is away"); a held queued or arc card waits a month, anything else is dropped. `abroad` (`@game abroad:`) marks the few that happen anywhere; migration 0053 tags them from the audit list: `night_sleep`, `break_plan`, `track_promotion`, `track_warning`, `job_term_review`, `grade_appeal`, `crisis_collapse`, `tamsin_second_letter`, `starfall_at_home`, `y3_offer_letter`, and the pools `year_recap`, `origin_funding_auto_story`, `career_letter`. It moves the four bloomer home cards from campus to `region: countryside`.
- Event `region:` (a card of a map with no single pin) and `@place home:` (the pin reads ⌂ Home; the arrival screen names it and who is here) are schema v1 additions.
- Break schedules span the maps: Lyra (Vaneshade House), Mir (the Ten Clockworks), Corvin (Ashby Lane), Seraphine (the Oracle's Rooms), Bram (Hollis House) in the capital; Tobias (the Fennick farm) and Nessa (the Almanac Printer's) in the countryside; Vey at the theatre, Brask at the Field Station. Kael, Ilse and Tamsin are at the castle if you stay, letters otherwise.
- Home pins: the townhouse (noble), the counting house (merchant), the crew's loft (street), the cottage (scholar), the Marsh (hedge).
- 18 new pins (11 capital, 7 countryside), each with a placeholder card until its batch.

| Step | State | Notes |
|---|---|---|
| F2 away is away | done (2026-11-11) | engine hold, map-aware schedules and `presentAt`, region pools, home pins, arrival "Home:" / "Also here:", migration 0053, 18 new pins and placeholders, landmark art, `test/away.test.js` |
| P1 capital peers | done (2026-11-11) | `maps/capital_peers.grim`, 21 cards: each home one recurring card in three showings and one-time scenes (Vaneshade House: the practice room, Mrs Callow's toast, a table for twenty, the grandmother's portrait; the Ten Clockworks: the long bench, the drawer marked M., Greta; Ashby Lane: the chair, the coins on the sill, the lost ring; the Oracle's Rooms: the window seat, an audience, the other ending; Hollis House: the inspection, the noon piano, Hester), five out in the city (`capital_peers_out`, the fish market, the cathedral). 13 facts; soft lore for the five families. `@pool` may carry `region:`. Cameos (Vey, Grimsby, Grisk) move to the batches of their places (C2, S1, C3) |
| P2 countryside peers | done (2026-11-11) | `maps/countryside_peers.grim`, 9 cards: the Fennick farm (Mrs Fennick's weather and tea, recurring; Gerald's relations; a man in good boots buying upland farms; the top field outside the valley's luck), the Almanac Printer's (the type case, recurring; Biscuit's notice; the almanac a page short every seventh year), out in the valley (Tobias's turnips, Nessa on the green). 8 facts; soft lore `fennick_farm` extended, `quill_press` new. Hooks for K4: flags `fennick_agent_refused`, `fennick_agent_card`, `almanac_pages_counted` |
| C1 capital homes | done (2026-11-12) | `maps/capital_homes.grim`, 10 cards: the family townhouse (noble: dinner where every word is weighed, recurring; calling cards; a suitable tea; the family silver pawned between rents), the counting house (merchant: the old clerk's end desk, recurring; a damp cargo your mother wants signed for; your old room full of violets), the crew's loft (street: the card game that never ended, recurring; one job, like old times, sets `crew_job_done`; Jory's empty hammock). Soft lore `crew_loft` (Nan Merrow, Jory). The counting house's and the loft's placeholders rewritten as their quiet fallback scenes |
| S1 bazaar and arcade | done (2026-11-12) | `maps/capital_markets.grim`, 14 cards. The bazaar's counter (reagents, the courier's oilskin, the duellist's silk, a lockpick roll, the pocket orrery, the storm-glass; a curio stall turning one rare piece per visit: ivory dice, a clockwork songbird, a sea-glass charm) and five scenes (Grimsby at the book stalls, a gentleman pickpocket, the brown bird, the hatter's bet, a coast nobody has sailed). The arcade's counter of services (physician, baths, portraitist, fortune-teller pointing to an offer's lead) with three counters of its own (the tutor: a chosen skill +medium; the scribe: letters to friends away from the capital, a forged letter of good character; the wandwright: glasscore and tidewood wands) and three scenes. 10 items; 13 item options written into existing cards (locks, rain, stars, card games, a duel, the infirmary) |
| C2 club, theatre, gardens, bridges | done (2026-11-12) | `maps/capital_society.grim`, 16 cards, each place a recurring card and three scenes: the club (the porter's lodge; a general who plays for favours; a blackball vote; the explorer in the reading room), the theatre (the gods; Vey's ghost has the mumps, fact `vey.season`; the boxes watch the boxes; the stage door), the gardens (the promenade; a dawn duel; the once-a-decade vine; Thornwick's dare at the bronze horse), the bridges (the lamplighters' guild jobs; busking; a duel of lights on the middle span; the mudlark's finds). Placeholders retired |
| C3 the rest of the capital | done (2026-11-12) | `maps/capital_port.grim`, 24 cards: the docks (day labour; a northern ship; word of the Undercroft; a roof-runner), the fish market (its dawn counter `shop_fish_market`; the auction; a gull war; the golden fish), the coaching yard (arrivals; the wrong trunk; a traveller's tale), the cathedral (under the Lamp; the crypt archive; the ringing chamber; sanctuary at midnight), Printing Row (broadsheets; your name in print; the jammed press), the Undercroft (dice, the pit, the fence) and the Rookery (rooftops, the crews' old marks, guiding the watch). New places `capital_undercroft` (found by word at the docks) and `capital_rookery` (street-born, or found by the roof-runner), soft lore for both. Five placeholders retired |
| C4 tide caves | done (2026-11-12) | `maps/tide_caves.grim`, 23 cards: found at the docks (`docks_sea_back_door`) or by a Port Calder childhood; open noon and afternoon (low water). The shore (rock pools, bait-diggers); the delve on the moors' pattern: the drowned stair (1–2), the smugglers' galleries (3–4), the sea's halls (5–6), the sea's door at 7 (a sight, or a swim round the headland). Grace +1 for Port Calder, +1 in the courier's oilskin; the tide ladder starts at depth 3. Two foes: the smugglers' lookout (Underground tough) and the conger (new creature, between the black dog and the barrow ram). Hooks for C5: `tide_bonded_drain`, `bonded_round_counted`. `test/tide.test.js` |
| C5 heists | done (2026-11-12) | C5b: the house on the Crescent (evening and night), a shipowner's weekly ball: found by a gala card down a club armchair or the Undercroft fence's tip; the ballroom (1–2), upstairs (3–4), the safe in the study at 5; the writing desk ties the shipowner to the warehouses' side door. The shared cards branch on `job_where`. C5a `maps/capital_heists.grim`, 19 cards: the shared city heist (`job_*`: the way out fences under the middle bridge or gives the loot away down Port Calder's lanes; the watch fines, doubled for a known face) and the bonded warehouses (night only): found at the docks, by the crew's job or the tide caves' culvert (starts on the floor); the yard (1–2), the floor (3–4), the crown's strongroom at 5 and the foreman's ledger, which frees Jory (`jory_freed`, `crew_loft_jory_home`) or buys the foreman's silence. `tools/grim.js` and `tools/reach.js` count plan `day:` visit slots. `test/capital-heists.test.js` |
| K4 The Good Year | done (2026-11-13) | `maps/good_year.grim`, 19 cards: the `story` thread `good_year` (closes at `gy_done`). The start at the market village (the seventh mark of seven on the harvest board) queues Ottilie Venn, a fern-hunter given room seven; clues in any order (the guest book, the scarecrows' collars, the miller's tally, the almanac's harvest page, the agent at the Drovers' Inn and his desk at the old hall); with Ottilie met and two clues she's gone and the inn denies her; the hedge-witch's truth opens the door in the hill (the moors delve's depth 7). The Tenant's table: walk out, fight (a new boss, between the conger and the elder oak), bargain (appeal adept+ unlikely, +1 for each of the guest book, the collars and the almanac page) or, with the agent's papers, his offer (Hollow, gold); an aftermath for each, and a thin summer harvest after a break. New place `old_hall` (home map, found through the agent), four leads, soft lore `good_year`, `the_tenant`, `old_hall`, `land_agent`, `ottilie_venn`. `moor_hill_door` waits while the door stands open, and after a break only turf (`gy_hill_turf`). `test/good-year.test.js` |
| K5 countryside places and counters | done (2026-11-12) | `maps/countryside_wide.grim`, 16 cards: two counters (the country market's back row: honey, oatcakes, the waxed cloak, the shepherd's crook; the hedge-witch's door at the Marsh: rue for the hedge-born, a poultice for an injury, a rosemary sprig, new state `hedge_sprig`), and each new place a recurring card in three showings plus scenes: the Ford (the ferryman's odd toll; the river in spate; which side he lives on), Hollin Coppice (the rides; the woodward who chalks every seventh tree; watching the mound), the Tarn (the still water; the angler), the Quarry (the face; an echo full of opinions; the last millstone), the Drovers' Inn (the long table; the tinker; the bear gets loose). Items `waxed_cloak`, `shepherds_crook` (one more fall on the moors). Five placeholders retired |
| T1 region cards, lodging nights, letters | done (2026-11-12), first pass | `maps/region_streets.grim`, 23 cards. Ten capital street cards (`capital_streets`, `region: capital`: the sea fog, a balloon ascent, a ballad about the academy, a chimney fire, the omnibus roof, a street preacher, hothouse violets, a downpour and a cellist, the writing automaton, the royal coach) and seven countryside lanes (`country_lanes`: the carrier's cart, a flock in the lane, a wedding, a summer thunderstorm on the stones, the milestone TO THE HILL, the well dressing, the barn owl). Region cards are a visit's fallback once a place's own cards are spent. Six lodging nights as the travel plans' morning cards (`plan: travel_city` / `travel_country`), one per tier: `lodged_rough()`, the new `lodged_decent()`, `lodged_fine()`. Letters: `letter_from_a_friend` already covers friends away, so none were added. Still short of the plan's ~30 + ~25 region cards: more to come |

- 2026-11-11 F2: lint 0 errors, zh-CN 100%, verify green. The golden games change (119 of 120: campus cards wait out the breaks away, so every run that leaves the castle reshuffles); the endings stay spread and the plot beats still play; baseline refreshed. The title screen's name pool lost "Tarn" (now a place) for "Teal".
- 2026-11-11 P1 (`build/batches/P1-capital-peers`): the critic rejected round 1 (15 issues: every card repeatable with no variation, the brother card and the supper card retelling existing premises, four facts against their cards, a fish-market card drawable at night in the lane); accepted round 2 with four polish fixes applied (an inspection gated on rel, a third showing that assumed earlier sparring, the ring card's discovery, a cost on the wrong person). Lint 0, zh-CN 100%; golden baseline refreshed (76 of 120 games change: the capital breaks now play the peers' cards).
- 2026-11-11 P2 (`build/batches/P2-country-peers`): the critic rejected round 1 (6 of 9 cards: recurring cards that stuck on their last showing or assumed an earlier choice, the buyer's "counting house" clashing with the merchant home, a fact saying more than its card, missing slots, a church tower canon lacks, a text over 400); accepted round 2. Lint 0, zh-CN 100%.
- 2026-11-12 C1 (`build/batches/C1-capital-homes`): the critic rejected round 1 (the end desk and the card game restaged the live placeholders; the loft's coin and job were bare chances; the end desk's cycle carried a payoff; the firm is the mother's in canon; "Nan Brack" too close to Brask); accepted round 2 (placeholders rewritten, checks, Nan Merrow), two polish fixes applied.
- 2026-11-12 S1 (`build/batches/S1-capital-markets`): the critic rejected round 1 (three item options replaced their card's check with a certain win: the exam cupboard, the stubborn telescope, Lyra's dawn duel; the scribe's letters could never reach the capital peers, stacked in one basket and reached Ilse while taken; the tidewood out-valued the hazel); accepted round 2. Negotiations were made research and appeal checks, since a new Crux encounter needs the Rust data rebuilt.
- 2026-11-12 C2 (`build/batches/C2-capital-society`): the critic rejected round 1 (the understudy repeated Vey's backstage emergency; the lamplighters copied `world_lamplighters_round`; a dangling favour flag; unshown costs; slots and repeat showings); accepted round 2 (the stage door; three different guild jobs), two polish fixes applied.
- 2026-11-12 C3 (`build/batches/C3-capital-port`): the critic rejected round 1 (both discovery cards could lock their place away; the watch card repeated the roof-runner and the jammed press a parcel run and Nessa's proofs; the dice weren't a wager; unshown costs); accepted round 2, three polish fixes applied (alignment on selling the golden fish and on refusing to sell someone out, a zh pun).
- 2026-11-12 K5 (`build/batches/K5-countryside-wide`): the critic rejected round 1 (the market counter repeated `market_day_stalls`; the quarry echo repeated the corridors' echo; the rosemary showed Maud's name; a poultice for an injury you may not have; a rue beat copied from K1; alignment on paying a fare; season and first-meeting assumptions; unshown spends); accepted round 2. `tools/reach.js` counts a map's `lodging:` states as gained (the arrival screen grants them).
- 2026-11-12 T1 (`build/batches/T1-region-streets`): the critic rejected round 1 (16 of 23 cards: a frost-on-the-pane sign that belongs to the Hollow Star; `study` costs that are free on a break; the pedlar repeating K5's tinker; season, hour and at-home assumptions; two risk-free lodging options; alignment on courtesy); accepted round 2, three polish fixes applied (slot gates on the fog, the violets and the carrier; a say over 300).
- 2026-11-12 follow-up (from the T1 critic): `study` costs nothing on a break (no course is enrolled after the exams), so a `study -tiny` on a break-only card leaves its option free: `capital_port.grim` (the bollard, under the Lamp, the Rookery ridge), `countryside_wide.grim` (the tarn, the angler's charm) and one in `breaks.grim`. Swept 2026-11-12: gold for the pies, candles and the choir's box, health for cold slates, stone and the tarn's wind, mood for the quarry's answer, and the long table's late night costs health while its "go and read" gains lore.
- 2026-11-12 C4 (`build/batches/C4-tide-caves`): the critic rejected round 1 (13 band cards paired a first meeting with an "again" line in cycle mode, so the third showing met the conger anew; again-lines assumed the last choice; the figurehead never lost her lamp; the swim ended on a payout card that climbs out of the caves; the docker's map-in-spilled-beer repeated the Undercroft card; robbing the beaten lookout carried no Hollow; a free lockpick); accepted round 2 (first/again by `seen()`, as the castle heists do), four polish fixes applied.
- 2026-11-12 C5a (`build/batches/C5a-bonded-warehouses`): the critic rejected round 1 (the old watchman told you the dogs and the round without setting either flag; cycle first/again pairs on the nine steps; the round counted twice; the strongroom's first opening could miss the ledger's drawer, and the lockpick was a free win of the hardest check; the framed man was "the docker" where canon makes him a crew boy; Jory's return read as a return to someone who'd never seen the empty hammock); accepted round 2, two polish fixes applied.
- 2026-11-12 C5b (`build/batches/C5b-crescent-house`): the critic rejected round 1 (the fence told the servants' hour on the option that didn't set it, in C5a's own words; "the fence said" for players who came by the club; caught "upstairs" with "jewels" from the ballroom; the foreman still writing letters from the cells; winter-only cold at a summer garden ball; calming a dog as a guile feat); accepted round 2, two wording notes applied.
- 2026-11-13 K4 (`build/batches/K4-good-year`): the critic rejected round 1 (19 issues: the lore had the lent come home yet the hall seated a hundred and freed a crowd; a bell at the end; the bargain the obvious best ending, below the fight's check and keeping the luck; clue cards dealing after the end; a double health loss; dominated options; repeat and history assumptions; winter harvests; the shut door back after the break); accepted round 2 (the lore changed, see Deviations; the bargain made adept+ unlikely with a step per clue), two remaining assumptions and the polish applied. Lint 0, zh-CN 100%, verify green; golden baseline refreshed (the K4 cards now deal in countryside breaks).
