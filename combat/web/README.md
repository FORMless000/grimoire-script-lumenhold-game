# Combat test bench (spells-v2 F5)

Pick a level preset and loadouts, then begin. Select an action or spell for its details, and click it again to commit. The engine view (toggle *Engine*) streams the AI's evaluation of every move by search depth, with each side's expected replies.

The rules and the AI run in WebAssembly, compiled from the Rust core in `../rust`. `core.mjs` is their JS interface. Build with `node tools/build.mjs` from `combat/`, then serve with `node out/site/server.mjs`. The rules are written up in `rulebook.md`.

The bench mirrors the main game around a fight. *Main-game card* sets up any played combat card (`EVENTS` in `setup/foes.mjs`) as the bridge (`src/combat.js`) does: its foe and persona, the context, observers, witnesses, who leads, a lesson's coach marks, and "Walk away" when nothing is at stake. *Entering from the main game* takes Health, Mana, the purse and the worn kit (`content/world/items.grim`). The result shows what the main game would apply (`settle` in `setup/campaign.mjs`), and *Next bout* carries it into the entry fields. The main game's English fight text, items and cast names are read from the repository at build time; creatures and special foes are in both loadout pickers, and the pools are in the opponent's.
