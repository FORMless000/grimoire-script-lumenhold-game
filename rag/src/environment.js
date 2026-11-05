'use strict';
const R=require('./retrieval.js'),B=require('./backends.js'),U=require('./util.js');
async function inspect(config,execute=B.run){
 const cfg=R.config({value:config});
 if(cfg.backend==='grim')return {node:process.version,backend:'grim',configHash:U.hash(cfg),at:new Date().toISOString()};
 const light=JSON.parse(await execute(cfg.lightrag?.python||'python3',['-c','import importlib.metadata as m,json,sys; print(json.dumps({"python":sys.version,"lightrag":m.version("lightrag-hku")}))']));
 return {node:process.version,light,configHash:U.hash(cfg),at:new Date().toISOString()};
}
module.exports={inspect};
