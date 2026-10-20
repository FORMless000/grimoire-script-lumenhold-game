import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),target=process.argv[2];if(!target)throw Error('Pass a temporary browser directory');
fs.mkdirSync(target,{recursive:true});
for(const file of ['index.html','app.mjs','style.css','server.mjs','rulebook.md'])fs.copyFileSync(path.join(root,file),path.join(target,file));
const sources=['roster.mjs','engine.mjs','ai.mjs'].map(f=>fs.readFileSync(path.join(root,f),'utf8').replace(/^import .*;\n/gm,'').replace(/^export \{ARCHETYPES,SPELLS,CONTEXTS,RESOURCES,generateKit\};\n/m,''));
fs.writeFileSync(path.join(target,'engine.mjs'),'// Generated from experiments/minigames/iterations/v02; edit those sources.\n'+sources.join('\n'));
