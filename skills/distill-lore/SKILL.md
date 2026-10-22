---
name: distill-lore
description: Distil worldbook entries (characters' facts, voice, schedules and relations; places; lore; timeline) for Lumenhold Academy from the existing events, or extend the worldbook after new content. Use when asked to seed, update or curate content/world/, to add facts for a character, or when canon lint reports unknown names.
---

# Distilling the worldbook

The worldbook (`content/world/`) is the canon every author relies on (design §3). Distillation reads the events and writes down what they already establish; it never invents. Entries you add are **soft canon** until a human promotes them.

## 0. Context

Read `docs/authoring/README.md` (canon rules) and `schema.md` (worldbook blocks), then `content/world/vocabulary.grim` (allowed traits, interests, roles, tones, slots).

## 1. Per character

1. Read every event involving them:
   ```bash
   node tools/grim.js query event 'actor == "<id>"'
   node tools/grim.js show <event_id>
   node tools/grim.js query say --grep <Name>
   ```
2. In `content/world/cast.grim`, make sure the `@npc` has `age` (18+ for every character), `role`, `traits` and `interests` (from `@vocab`), `stats`, a `schedule` over existing `@place`s, `relations`, and a one-line `voice` that a writer can imitate.
3. In `content/world/facts/<id>.grim`, write 5–8 `@fact`s: one or two `surface` (known on meeting), several `personal` (unlocked by closeness or by having seen an event), one or two `secret`. Each `unlock:` must name the event or condition that actually reveals it (`seen(<event>) > 0`, `rel(<id>) >= 30`, `flag(<flag>)`). Facts state what the events show; don't extrapolate.

## 2. Places

For each place events mention, add a `@place` in `content/world/places.grim`: region, `map: campus x,y` (the castle on the north shore of the lake, the village to the south-east, the Whisperwood to the west; see `docs/map-concept.png`), kind, opening slots, `discover` (omit for places open from the start), a `hint` for hidden ones, and a short description in the game's voice.

## 3. Lore and timeline

Write `@lore` entries in `content/world/lore/soft/<topic>.grim` with `canon: soft`: the main plot, recurring world details, institutions, families, minor figures. `keys:` are the names and phrases a brief will search for (comma-separated, proper nouns first). Dated history goes in `content/world/timeline.grim` (`kind: history`, dates as years before the first year). While you read, note numbers of years and ages that disagree with the timeline or with a fact ("forty years of the Ledger" against its founding). When the worldbook is right, fix the event and its translation; don't bend the worldbook to the event.

## 4. Check

```bash
node tools/grim.js fmt && node tools/grim.js lint    # worldbook references, vocabularies, ages
node tools/grim.js canon                             # 0 unknown proper nouns in player-visible text
node tools/grim.js diff                              # worldbook data never changes gameplay
node tools/grim.js i18n zh-CN                        # translate new names, place/track/spell text and facts
node tools/grim.js brief --cast <id> --topic "…"     # read the result as an author would
```

If canon lint reports a name, decide: a real part of the world gets a `@lore` entry (or a place, faction…); a small prop (a book title, a potion, a headline) goes in `@vocab canon_allowlist`; a genuine mistake (e.g. a real-world month name) gets fixed in the event, and its translation updated.

## 5. Hand over for curation

Report what you added per file and anything uncertain. A human reviews the git diff and promotes entries to `canon: hard` (moving them to `content/world/lore/hard/`).
