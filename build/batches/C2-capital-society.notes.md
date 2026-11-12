# C2 the club, the theatre, the gardens and the bridges: author's notes

Batch: `content/events/maps/capital_society.grim` (16 cards), one fact (`vey.season`), and the four places' placeholders retired (`when: false` in `placeholders.grim`). Each place has a pool with one **recurring** card (`repeat`, three cycled showings: the old placeholder's premise, grown) and three once-only scenes:

- **The Members' Club** (`capital_club_life`): `club_porter` (recurring: talk your way in as somebody's guest, a deceive check; or sit in the lodge and hear everyone's secrets), `club_card_room` (a retired general plays for favours; losing sets `club_general_favour` for later), `club_blackball` (a guest's vote on a self-made shipbuilder: alignment against renown), `club_reading_room` (an old explorer, whispering).
- **The Theatre** (`capital_theatre_life`): `theatre_the_gods` (recurring: the cheap gallery, or sneak in at the interval), `theatre_vey_ghost` (Professor Vey, who spends breaks on the theatre's season per her `schedule_break`; `slot: evening`, unlocks `vey.season`), `theatre_opera_glasses` (the boxes watch the boxes), `theatre_understudy` (run lines, or an unethical calming glamour).
- **The Royal Gardens** (`capital_gardens_life`, morning to afternoon): `gardens_promenade` (recurring: being seen), `gardens_dawn_duel` (`slot: morning`: witness, or ward between them), `gardens_night_vine` (the once-a-decade bloom, or a cutting under the counter), `gardens_thornwick_dare` (Thornwick students dare you to animate the bronze king's horse).
- **The Lamplighters' Bridges** (`capital_bridges_life`): `bridges_lamplighters` (recurring, evening: the guild's paid round, the night job the plan asked for), `bridges_busking` (recurring: perform for the hat), `bridges_span_duel` (`slot: night`: a duel of lights by custom, a spell check, not a fight), `bridges_mudlark` (a bottled letter, or a ring taken home).

No fights (a fight needs a foe in `combat/`); duels are spell checks or are avoided.

## Retrieval

`retrieve search` per premise (14 queries). `retrieve related --draft` per card, then rework: the wishing-coin card shared both options with `life_wishing_well` and `courtyard_fountain_wishes`; it is now the mudlark's finds. The card-room dowager was too near `company_card_widow`; now a retired general playing for favours. Kept apart: `world_lamplighters_round` (helping the castle's old lamplighter; here, paid guild work on the bridges), `between_seconds` (your friends' duel; here, strangers), `life_village_busking` (village; here the bridges' recurring pitch), `vey_revue` / `vey_rehearsal` (campus).

## Round 2 (after the critic's rejection)

- `theatre_understudy` is gone (it repeated the Vey card's backstage emergency); in its place `theatre_stage_door`: the leading lady wants to get home past a viscount's son with a poem (a glamour disguise, or keep him talking). No "eleven hundred", no "rules Vey taught".
- `bridges_lamplighters` is reworked so it is not `world_lamplighters_round`: each showing is a different guild job (the founder's lamp that keeps going out, fog with barges coming, the guild's boat under the arches). No spare pole and no showing that assumes the last.
- `club_card_room`: the general collects at once (reading his memoirs aloud till closing: mood, health); no flag, no alignment on losing. The general's marks are a magistrate, a shipowner and an alderman (the porter keeps the minister and bankers; his second list is a general and an archdeacon).
- `club_blackball`: white costs mood (the recount and the stare); black's renown is shown (asked to dine, your name told to the room).
- `bridges_span_duel`: the challenger is a sailor off a ship (not Thornwick); walking round costs renown, not alignment.
- `bridges_busking`: text and win variants no longer assume an earlier show; the ribbon-seller moves her stall rather than charging.
- `club_porter`: "hours" not "the evening"; the second lodge showing doesn't assume a first. `theatre_the_gods`: `time: evening night`. `gardens_promenade`: `time: morning noon`; the third walk is tied to that showing (a stranger asks if you're the academy student). `gardens_night_vine`: queueing costs health -small; "Queue to see it". Vey's line is her own ("I was watching for the join all night").
