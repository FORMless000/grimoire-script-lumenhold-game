'use strict';
const fs=require('fs'),path=require('path');
const {spawnSync}=require('child_process');
const U=require('./src/util.js');
const ROOT=path.resolve(__dirname,'..');
function invoke(bin,args,options={}){const r=spawnSync(bin,args,{cwd:ROOT,stdio:'inherit',...options});if(r.error||r.status!==0)throw new Error('Setup command failed: '+bin);return r.stdout?.trim();}
function pythonExecutable(explicit,execute=invoke){for(const bin of explicit?[explicit]:['python3.12','python3.11','python3.13','python3','python']){try{const v=JSON.parse(execute(bin,['-c','import sys,json; print(json.dumps(list(sys.version_info[:2])))'],{stdio:['ignore','pipe','pipe'],encoding:'utf8'}));if(v[0]===3&&v[1]>=10)return bin;}catch{}}throw new Error('Python >=3.10 required; install Python 3.12 or pass --python-bin PATH');}
function setup(opts={},execute=invoke){
 for(const key of Object.keys(opts))if(!['python','python-bin','directory','help'].includes(key))throw new Error('Unknown setup option: --'+key);
 if(opts.help)return {usage:'./rag/setup.sh [--python-bin PATH] [--directory PATH]',indexBuilt:false};
 if(Number(process.versions.node.split('.')[0])!==24)throw new Error('Node 24 required');
 const directory=path.resolve(opts.directory||path.join(ROOT,'rag/envs')),venv=path.join(directory,'lightrag'),python=path.join(venv,process.platform==='win32'?'Scripts/python.exe':'bin/python');
 fs.mkdirSync(directory,{recursive:true});
 if(!fs.existsSync(python))execute(pythonExecutable(opts['python-bin'],execute),['-m','venv',venv]);
 execute(python,['-m','pip','install','-r',path.join(__dirname,'requirements-lightrag.txt')]);
 execute(python,['-c','from lightrag import LightRAG; print("LightRAG imports OK")']);
 const freeze=execute(python,['-m','pip','freeze'],{stdio:['ignore','pipe','inherit'],encoding:'utf8'}),lock=path.join(directory,'lightrag-requirements-'+U.hash(freeze).slice(0,12)+'.txt');
 if(!fs.existsSync(lock))fs.writeFileSync(lock,freeze+'\n',{flag:'wx'});
 const file=path.join(directory,'retrieval.json'),config=fs.existsSync(file)?U.readJSON(file):{};
 delete config.qmd;Object.assign(config,{backend:'lightrag',profile:'full',lightrag:{python}});U.writeJSON(file,config);
 return {lightrag:true,indexBuilt:false,configFile:file};
}
if(require.main===module)try{console.log(JSON.stringify(setup(U.args(process.argv.slice(2)).opts),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
module.exports={setup,pythonExecutable};
