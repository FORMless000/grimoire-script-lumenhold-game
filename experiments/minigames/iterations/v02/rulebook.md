# Combat testplay 0.2.2

Choose an archetype and the Early (20), Mid (50), or Late (80) preset. By default the opponent has the same kit and level. Advanced setup can change its kit, level, AI, starting resources, encounter context, and per-resource rebates.

## Commit and respond

Each exchange has two actions. The first actor commits publicly; the other sees that action before choosing a response. Both actions then resolve. Normal first-committer order alternates in the background. Combat lasts at most eight exchanges.

Defensive preparations apply before attacks. Ordinary attacks land together. If both actors are knocked out, the **telegraphed actor wins on initiative**. Both attacks still land and pay their costs. Initiative only breaks mutual knockouts; it does not replace the time-limit adjudication.

## Basic actions

- **Strike:** attack using Vigor; base damage 6 before combat scale and skill adjustment.
- **Guard:** block base 4 damage from Strike this exchange. Spells bypass Guard.
- **Reclaim:** recover all your flux as ready Mana after the exchange.

All basics have zero resource cost. Leave encounter is a separate control and concedes the fight.

## Mana and Health

Casting spends ready Mana; 80% of that cost becomes flux. Flux cannot pay for a spell until recovered with Reclaim. Reclaim takes your action and cannot fund a cast in the same exchange.

The standard budget starts with 70 Health and Mana equal to kit capacity. The depleted budget starts with 35 Health and at most 30 Mana. In the default model, entry Health is the HP bar. The optional offset model instead uses:

`entry HP = entry Health + 40 + floor((Arcana + Vigor) / 4)`

With the offset model, damage reduces local HP and Health independently. Health reaching zero does not defeat an actor with HP remaining. Restoration recovers each up to its own entry cap.

## Spells

Each learned spell has one Cast action. Checking “Learn all twelve spells” makes every spell available to both kits, subject to ready Mana. Extra learned spells retain the existing rank rules. No accuracy rolls or casting modes apply.

| Spell | Effect |
|---|---|
| Flame | Base `8 + rank − 1` damage; destroys Shape |
| Tide | Base `5 + rank − 1` damage; Wet weakens the next Flame |
| Starlight | Base `4 + rank − 1` damage; removes Glamour |
| Restoration | Restore base `6 + rank − 1` HP/Health, capped at entry |
| Shape | Block base `8 + rank − 1` from the next Strike; Flame destroys it |
| Glamour | Absorb base `4 + rank − 1` from the next attack |
| Hush | Reduce the next offensive spell by base `4 + rank − 1` |
| Ward | Absorb base `10 + 2 × (rank − 1)` from the next attack |
| Foresight | Force early opponent commitment for three subsequent exchanges; one +10 power preparation |
| Haste | Pay base 2 Health/HP; next exchange your attack resolves first |
| Attune | One +10 Strike preparation and base `3 + rank − 1` Strike protection |
| Shadowstep | Move near and gain base `3 + rank − 1` evasion |

Default combat scale is 3. Strike uses Vigor, attacking spells use Arcana, and opposing defence is mean Arcana/Vigor. Damage is rounded after scaling by:

`clamp(1 + (acting skill − opposing defence + preparation) / 100, 0.5, 1.5)`

Mana costs use the displayed spell rank and setup multiplier (default 2). Ward's rank costs at that multiplier are 20/16/12; protection is 30/36/42. Protection retains its existing consumption and current/next-exchange expiry rules.

Foresight starts the exchange after casting. Its target chooses one action at a time but must reveal first. If both actors are affected, normal alternation applies while both durations tick down. Recasting refreshes to three exchanges without stacking, capped by exchanges remaining. Forcing an opponent to reveal first also gives that opponent the mutual-knockout tiebreaker.

Haste affects the following exchange only; using a non-attack consumes the opportunity. If both actors have Haste, attacks remain simultaneous.

## Ending and rebates

Defeat ends the fight. At the eight-exchange limit, the existing HP-percentage thresholds decide full, partial, or failed outcomes; a 25-point HP-percentage lead qualifies for a full win.

Remaining flux is collected once at settlement. The selected Health and Mana rebate ratios then apply to remaining net loss, with integer flooring and a cap at entry resources. Practice duels return 80%; real conflicts return 50%. Public-duel and rehearsal contexts use their existing Health/Mana ratios. Setup can adjust each resource separately. Rebates never leave you with more than you started with.

## AI and debug

Full AI uses alpha–beta search up to three resolved exchanges and 5,000 nodes. Shallow AI searches one exchange. Fallible profiles attempt a plausible bounded weaker choice with a separate seed; exact alternative ranking can spend another 5,000 nodes. Spell outcomes stay deterministic, and kit generation is seeded by level.

Debug shows completed search depths, timings, accepted weaker choices, kits, ledgers, and exchange history. Export saves the current combat log. Setup and Debug are separate from the compact gameplay view.
