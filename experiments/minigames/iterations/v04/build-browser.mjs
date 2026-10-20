import {readSpellIcons,readActionIcons} from './icon-source.mjs';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),target=process.argv[2];if(!target)throw Error('Pass a temporary browser directory');
fs.mkdirSync(target,{recursive:true});
for(const file of ['index.html','app.mjs','style.css','server.mjs','rulebook.md','README.md'])fs.copyFileSync(path.join(root,file),path.join(target,file));
const sources=['economy.mjs','cast-stats.mjs','loadouts.mjs','roster.mjs','engine.mjs','search-state.mjs','search-cache.mjs','ai.mjs'].map(f=>fs.readFileSync(path.join(root,f),'utf8').replace(/^import .*;\n/gm,'').replace(/^export \{[^}]+\};\n/gm,''));
fs.writeFileSync(path.join(target,'engine.mjs'),'// Generated from experiments/minigames/iterations/v04; edit those sources.\n'+sources.join('\n')+'\nexport const SPELL_ICONS='+JSON.stringify(readSpellIcons())+';\nexport const ACTION_ICONS='+JSON.stringify(readActionIcons())+';\n');
