'use strict';
const path=require('path');
const {run}=require('../process.js');
const {openRouterKey}=require('../credentials.js');
async function light(action,records,query,dir,config,identity,execute=run,update={}) {
 const input={action,records:records.map(r=>({key:r.key,text:r.searchText})),query,directory:dir,models:config.models,baseURL:config.baseURL,provider:config.provider,identity,...update};
 const result=JSON.parse(await execute(config.lightrag?.python||'python3',[path.join(__dirname,'../lightrag_bridge.py')],input,{env:{OPENROUTER_API_KEY:openRouterKey()}}));
 if(result.error)throw Object.assign(new Error(result.error),{calls:result.calls||[]});
 return result;
}
module.exports={files:['adapters/lightrag.js','process.js','credentials.js','model-aliases.json','lightrag_bridge.py','lightrag_retry.py','lightrag_transport.py'],
 service:()=>({calls:[]}),index:(records,dir,cfg,execute,update)=>light('index',records,'',dir,cfg,null,execute,update),search:(query,dir,id,cfg,execute)=>light('search',[],query,dir,cfg,id,execute)};
