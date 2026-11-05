// Classic-script bundle for file:// and Node. Every module is shared with the standalone host.
'use strict';
const fs = require('fs'), path = require('path');
const { CRUX, BUNDLE, MODULES, sourcesHash } = require('./bundle-hash.cjs');
const { execFileSync } = require('child_process');
for (const script of ['build-spells.js', 'build-encounters.js', 'build-wasm.js', 'tools/messages.js']) execFileSync(process.execPath, [path.join(CRUX, script), '--check'], { stdio: 'inherit' });
const body = MODULES.map((f) => fs.readFileSync(path.join(CRUX, f), 'utf8')).join('\n');
const rules = (fs.readFileSync(path.join(CRUX, 'crux-wasm.js'), 'utf8').match(/sources ([a-f0-9]+)/) || [])[1];
fs.writeFileSync(BUNDLE, `// GENERATED — Crux sources ${sourcesHash()}; node crux/tools/bundle.js\n(function(root) {\nconst self = {}; let module;\n${body}\nconst api = {core:self.CruxCore,cards:self.CruxCards,spells:self.CruxSpells,encounters:self.CruxEncounters,voices:self.CruxVoices,setup:self.CruxSetup,ui:self.CruxUI,text:self.CruxText,rules:${JSON.stringify(rules)}};\nif(typeof exports==='object') Object.assign(exports,api); else root.LumenholdCrux=api;\n})(typeof globalThis!=='undefined'?globalThis:this);\n`);
console.log('built build/crux.bundle.js');
