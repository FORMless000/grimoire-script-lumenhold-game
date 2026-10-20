import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url)),out=path.resolve(process.argv[2]??'');
if(!process.argv[2])throw Error('Usage: node build-browser.mjs <temporary directory>');
fs.mkdirSync(out,{recursive:true});
for(const file of ['index.html','style.css','app.mjs','engine.mjs','roster.mjs','ai.mjs','ai-worker.mjs','server.mjs'])fs.copyFileSync(path.join(source,file),path.join(out,file));
console.log(out);
