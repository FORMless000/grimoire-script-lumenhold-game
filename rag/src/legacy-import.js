'use strict';
// Explicitly adopt a verified frozen native store. Never relabel its old inputs
// as newly extracted: each retained document carries its original input hash.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=require('./retrieve'),C=require('./catalog'),U=require('./util'),P=require('./process');
async function adopt(root,sourceProject,cfg){
 const cache=path.join(sourceProject,'rag/cache/lightrag');
 const candidates=fs.readdirSync(cache).map(name=>path.join(cache,name,'index.json')).filter(fs.existsSync);
 if(candidates.length!==1)throw new Error('Select exactly one completed legacy manifest');
 const sourceFile=candidates[0],old=U.readJSON(sourceFile),sourceHash=U.hash(fs.readFileSync(sourceFile));
 if(old.version!==1 || old.config.backend!=='lightrag' || old.backendIdentity.version!=='1.5.7')throw new Error('Unsupported legacy graph');
 if((old.config.baseURL||'https://openrouter.ai/api/v1')!==(cfg.baseURL||'https://openrouter.ai/api/v1') || U.hash(old.config.provider||null)!==U.hash(cfg.provider||null))throw new Error('Provider configuration differs from the imported graph');
 if(old.config.models.embedding!==cfg.models.embedding || old.config.models.helper!==cfg.models.extract)throw new Error('Graph extraction/embedding models differ; do not relabel or rebuild automatically');
 if(old.indexHash!==U.hash({identity:old.identity,corpusHash:old.corpusHash,records:old.records,backendIdentity:old.backendIdentity}))throw new Error('Legacy manifest digest differs');
 const cat=C.catalog(path.join(sourceProject,'rag/frozen')),canonical=R.recordsFor(cat),byKey=new Map(canonical.map(r=>[r.key,r]));
 if(cat.corpusHash!==old.corpusHash || canonical.length!==old.records.length)throw new Error('Frozen source coverage mismatch');
 const sourceStorage=path.join(path.dirname(sourceFile),old.corpusHash,'storage');
 const docs=U.readJSON(path.join(sourceStorage,'kv_store_full_docs.json'));
 const records=old.records.map(r=>{
  const current=byKey.get(r.key);
  if(!current || current.sourceHash!==r.sourceHash || r.description || docs[r.key]?.content!==r.searchText.trim())throw new Error('Source/index input mismatch: '+r.key);
  return {...current,searchText:docs[r.key].content,inputKey:U.hash(docs[r.key].content),inputProvenance:{format:'legacy-block-prose-v1',canonicalInputKey:current.inputKey,indexedInputHash:U.hash(docs[r.key].content),sourceManifestHash:sourceHash,extractionModel:old.config.models.helper}};
 });
 const engine=R.create(root,cfg),file=path.join(engine.dir,'index.json');
 if(fs.existsSync(file)||fs.existsSync(path.join(engine.dir,'pending.json')))throw new Error('Destination already contains work; refusing to overwrite');
 const revision='legacy-import-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomUUID().slice(0,8),storage=path.join('revisions',revision),destination=path.join(engine.dir,storage);
 fs.mkdirSync(path.dirname(destination),{recursive:true});
 fs.cpSync(sourceStorage,destination,{recursive:true,mode:fs.constants.COPYFILE_FICLONE});
 const migration=JSON.parse(await P.run(cfg.lightrag?.python||'python3',[path.join(__dirname,'legacy_storage.py')],{directory:destination,dimensions:old.dimensions,expected:records.map(r=>r.key)}));
 for(const name of ['graph_chunk_entity_relation.graphml','vdb_chunks.json','vdb_entities.json','vdb_relationships.json']){
  if(U.hash(fs.readFileSync(path.join(sourceStorage,name)))!==U.hash(fs.readFileSync(path.join(destination,name))))throw new Error('Graph/vector bytes changed during metadata migration: '+name);
 }
 const backendIdentity={backend:'lightrag',version:'1.5.7',models:{...cfg.models,reranker:old.config.models.reranker},dimensions:old.dimensions,processedIds:records.map(r=>r.key).sort(),
   provenance:{sourceProject,sourceManifest:sourceFile,sourceManifestHash:sourceHash,sourceIndexHash:old.indexHash,originalConfig:old.config,migration,inputPolicy:'Keep verified legacy inputs until source/context changes; new or edited documents use current inputs.'},calls:[]};
 const m={version:2,identity:R.identity(cfg),corpusHash:old.corpusHash,config:cfg,records,revision,storage,dimensions:old.dimensions,backendIdentity,at:new Date().toISOString()};
 m.indexHash=R.digest(m);
 fs.copyFileSync(sourceFile,path.join(engine.dir,'legacy-source-index.json'),fs.constants.COPYFILE_EXCL);
 U.writeJSON(file,m,true);
 U.writeJSON(path.join(engine.dir,'legacy-import.json'),{sourceManifest:sourceFile,sourceManifestHash:sourceHash,migration,revision,indexHash:m.indexHash},true);
 return {directory:engine.dir,records:records.length,migration,changes:R.create(root,cfg).status().changes};
}
module.exports={adopt};

// A query-only alias registration changes the conservative implementation hash,
// but not extraction inputs. Rebind only with a captured before/after proof;
// preserve the original manifest and every native byte/revision via rename.
function rebindRerankerAlias(root,cfg,proof){
 const aliases=U.readJSON(path.join(__dirname,'model-aliases.json'));
 const withoutRank=value=>Object.fromEntries(Object.entries(value).filter(([k])=>k!==cfg.models.reranker));
 if(U.hash(withoutRank(proof.aliases))!==U.hash(withoutRank(aliases)))throw new Error('Only the selected reranker alias may change');
 for(const [file,hash] of Object.entries(proof.implementationHashes))if(file!=='model-aliases.json'&&U.hash(fs.readFileSync(path.join(__dirname,file)))!==hash)throw new Error('Non-alias implementation changed: '+file);
 const oldDir=proof.directory,destination=R.create(root,cfg).dir;
 if(path.dirname(oldDir)!==path.dirname(destination)||oldDir===destination)throw new Error('Invalid alias migration paths');
 if(fs.existsSync(destination)||fs.existsSync(path.join(oldDir,'pending.json'))||fs.existsSync(path.join(oldDir,'writer.lock')))throw new Error('Alias migration requires an idle completed graph and an unused destination');
 const file=path.join(oldDir,'index.json'),m=U.readJSON(file),cat=C.catalog(root);
 if(m.identity!==proof.identity||m.indexHash!==R.digest(m)||m.corpusHash!==cat.corpusHash)throw new Error('Source or prior identity differs');
 if(U.hash(m.config)!==U.hash(cfg))throw new Error('Model/build configuration changed');
 const records=R.recordsFor(cat,m.records);
 if(records.length!==m.records.length||R.changes(m,records).modified.length||R.changes(m,records).added.length||R.changes(m,records).deleted.length)throw new Error('Index inputs changed');
 const originalHash=m.indexHash;
 U.writeJSON(path.join(oldDir,'index-before-reranker-alias.json'),m,true);
 m.identity=R.identity(cfg);m.backendIdentity.compatibilityUpdates=[...(m.backendIdentity.compatibilityUpdates||[]),{
  reason:'Register the selected reranker provider alias; extraction/embedding and indexed inputs unchanged',priorIdentity:proof.identity,priorIndexHash:originalHash,model:cfg.models.reranker,at:new Date().toISOString()}];
 m.indexHash=R.digest(m);
 fs.renameSync(oldDir,destination);U.writeJSON(path.join(destination,'index.json'),m);
 U.writeJSON(path.join(destination,'reranker-alias-migration.json'),{proof,aliases,priorIndexHash:originalHash,indexHash:m.indexHash,modelCalls:0},true);
 return {directory:destination,indexHash:m.indexHash,records:m.records.length,modelCalls:0};
}
module.exports.rebindRerankerAlias=rebindRerankerAlias;
