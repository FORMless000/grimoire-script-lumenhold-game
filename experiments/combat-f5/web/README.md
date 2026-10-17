# Combat test bench (spells-v2 F5)

Pick a level preset and loadouts, then begin. Select an action or spell for its details, and click it again to commit. The engine view (toggle *Engine*) streams the AI's evaluation of every move by search depth, with each side's expected replies.

The rules and the AI run in WebAssembly, compiled from the Rust core in `../rust`. `core.mjs` is their JS interface. Build with `node tools/build.mjs` from `experiments/combat-f5/`, then serve with `node out/site/server.mjs`. The rules are written up in `rulebook.md`.
