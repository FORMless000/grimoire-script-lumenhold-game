# K3: the moors delve (new maps)

Tracker: `docs/maps-plan.md`. File: `content/events/maps/moors_delve.grim` (21 cards). Fights: `combat/setup/foes.mjs` (three new foes and their EVENTS entries), `loadouts.mjs` and `flavor.mjs` (three creature loadouts built from the Whisperwood creatures' moves, with defeat lines). Test: `test/moors.test.js`.

## Context

- The moors (`countryside_moors`, the countryside map, open by day) are the countryside's adventure place, on the Whisperwood delve's pattern (`content/events/whisperwood/delve.grim`), shorter: three bands (the cairns 1–2 apprentice, the bog roads 3–4 journeyman, the hollow hill 5–6 adept), and depth 7, the door in the hill, shut.
- **The valley's secret** (batch K4, "The Good Year", still to be written): an old bargain in which every seventh year the villages lend a stranger to something under the hollow hill, and the harvests stay good. The delve only plants details: the seventh turf the cutters mark, the ewe with a seven on her fleece, a traveller's satchel with an inn room key, seven cairns with one built this year, a harvest supper heard under the hill, the door that says "Not yet". K4 will open the door. Nothing here explains it, and nothing touches the Hollow Star.
- Grace: 1, +1 with the hedge-witch's rue (`marsh_rue`, K1), +1 for someone at home in the valley. The drove road (rescuing the ewe) starts later delves at depth 3. The way home sells to the coaching inn's landlord (who pays too well and asks where you found it) or keeps the haul for study.
- Two moorland routine cards (peat-cutters, bilberries) so a visit isn't only the delve. The third-cairn placeholder is retired; the edge card carries the shepherd's warning.

## Creatures (combat/tools/creature-study.mjs, classes at foe level −10)

- The adders' knot (critter): wins like the bramble ferret (band 1).
- The black dog (beast, fades into the fog): tuned to sit between the bristleback and the stag beetle (band 2).
- The barrow ram (monster, charges): about the stag beetle's strength at level 50, harder below (band 3).

## Retrieval

- `search` before drafting: black dog in fog, adders, cairn offerings, a ram guarding a hill, a satchel in peat, a lost ewe, a door in a hill, a shepherd's hut, voices in fog, a warm hill with music under it, seven cairns, flints in peat. Nearest: `life_fog_maze` (a voice calling for help in castle fog: here the fog is about keeping count of the cairns), `world_door_that_wasnt_there` (a door appears in a castle corridor: here a turf door with a sheaf knocker), `marisol_lost_satchel`.
- `related --draft` per card: `moor1_cairn` copied `ww2_waystone`'s steal-the-offerings option (up[sleight]); dropped. `moor2_fog`'s lose copied `ww2_fog_wall` (the fog puts you back at the edge); it's a fall now. `moor3_barrow_ram`'s "It's waiting" echoed `ww3_shadow_stag`; reworded. `moor2_satchel` sits near the Hollow Star's key cards (`hs_key_recover`): this is an ordinary inn room key, plot-safe.

## Checks

`grim batch` passes build, lint, dupes and canon; zh-CN (cards and the three combat names and defeat lines) is filled after the critic.
