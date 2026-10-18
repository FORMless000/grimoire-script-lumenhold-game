import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const allowed=new Set(['index.html','app.mjs','brief.mjs','art.mjs','engine.mjs','core.wasm','style.css','rulebook.md','README.md']);
const portrait=/^portraits\/[a-z0-9_]+\.png$/;
const types={'.png':'image/png','.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.md':'text/plain; charset=utf-8','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{
  let file;
  try{file=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';}catch{res.writeHead(400);res.end('Bad request');return;}
  if(!allowed.has(file)&&!portrait.test(file)){res.writeHead(404);res.end('Not found');return;}
  try{res.writeHead(200,{'Content-Type':types[path.extname(file)]??'text/plain','Cache-Control':'no-store'});res.end(fs.readFileSync(path.join(root,file)));}catch{res.writeHead(404);res.end('Not found');}
});
server.listen(Number(process.env.PORT??0),'127.0.0.1',()=>console.log('TESTPLAY_URL=http://127.0.0.1:'+server.address().port));
