// One build after any rule or data change: spell data → Rust, the native simulator, the WebAssembly core, the browser site.
//   node tools/build.mjs [site=out/site]   then: node out/site/server.mjs (PORT=61095)
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),rust=path.join(root,'rust'),site=path.resolve(process.argv[2]??path.join(root,'out/site'));
const run=(cmd,args,cwd=root)=>execFileSync(cmd,args,{cwd,stdio:'inherit'});
run('node',['tools/export-data.mjs']);
run('cargo',['build','--release'],rust);
run('cargo',['build','--profile','wasm','-p','combat-wasm','--target','wasm32-unknown-unknown'],rust);
fs.copyFileSync(path.join(rust,'target/wasm32-unknown-unknown/wasm/combat_wasm.wasm'),path.join(root,'web/core.wasm'));
// The site: UI files as they are, and one engine.mjs made of the JS setup/data modules and the core glue (tools/site.mjs,
// which the main game's server also serves at /bench/).
const {siteFiles}=await import('./site.mjs');
const files=await siteFiles();
for(const [name,data]of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(site,name)),{recursive:true});fs.writeFileSync(path.join(site,name),data);}
const kb=f=>(fs.statSync(path.join(site,f)).size/1024).toFixed(0)+' KB';
console.log(`site → ${site}: engine.mjs ${kb('engine.mjs')}, core.wasm ${kb('core.wasm')}`);
