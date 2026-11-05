# Card coverage recount — October 29, 2026

Inventory only; no critique has been started.

- **1809 compiled cards**, up from 1743: **66 added**, 0 removed.
- **1795 active definitions**; 14 explicitly retired/disabled definitions excluded. Active is a static source definition, not measured gameplay reachability.
- **0 active cards lack a recorded critic verdict not labeled self-review**: 0 have no matched verdict, 0 have author self-review only.
- **123 previously reviewed active definitions changed** relative to the last pass (114 were among its 574 reviewed cards). They are separate re-review candidates, not first-review gaps. A later report may cover some changes; a change is not a finding.

[Exact IDs, locations and evidence](inventory.json) include all current definitions, review coverage, excluded definitions and changed reviewed cards. Review evidence was joined by ID across local batch verdicts and the older external archive. The three old reports without explicit scopes are listed as a limitation; their current content was covered by later scoped verdicts. Existing acceptance does not certify a changed current definition.

## New-card review coverage

All 66 additions already have recorded T1–T5 critic verdicts. These reports lack reviewer identity metadata; the inventory distinguishes explicit self-review labels but does not independently establish who performed each pass.

| File | New cards | Recorded critic batch |
|---|---:|---|
| [content/events/cartographers.grim](../../../content/events/cartographers.grim) | 12 | T3-cartographers |
| [content/events/contraband.grim](../../../content/events/contraband.grim) | 17 | T2-elixirs |
| [content/events/detention.grim](../../../content/events/detention.grim) | 8 | T1-detention |
| [content/events/heists/shared.grim](../../../content/events/heists/shared.grim) | 3 | T4-stacks |
| [content/events/heists/stacks.grim](../../../content/events/heists/stacks.grim) | 13 | T4-stacks |
| [content/events/heists/tower.grim](../../../content/events/heists/tower.grim) | 13 | T5-tower-spells |

[Changed previously reviewed cards and locations](changed-reviewed.md) are listed separately.

## Unreviewed locations

None found in the recorded coverage join.



## Validation

Current and prior source compilations returned zero errors. Coverage partitions and unique IDs passed consistency assertions. Current content hash: `6b9497`. The comparison uses prior HEAD `ff25b51b302c92edb12de9e347cffcda49eafcf0` and excludes source locations when detecting compiled-definition changes. No cards, historical verdicts, localization, bundle or retrieval index were changed; no retrieval or gameplay simulation was run.
