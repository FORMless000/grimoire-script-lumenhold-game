'use strict';
const R=require('./retrieve.js'),B=require('./backends.js'),U=require('./util.js');
async function inspect(config,execute=B.run){
 const cfg=R.config({value:config});
 const light=JSON.parse(await execute(cfg.lightrag?.python||'python3',['-c','import importlib.metadata as m,json,sys; print(json.dumps({"python":sys.version,"lightrag":m.version("lightrag-hku")}))']));
 return {node:process.version,light,configHash:U.hash(cfg),at:new Date().toISOString()};
}
module.exports={inspect};
