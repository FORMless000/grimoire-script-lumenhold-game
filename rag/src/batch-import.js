'use strict';
// Freeze scan bytes, never an agent's completion report or a mutable game bundle.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const G = require('../../src/grimoire.js');
const C = require('./catalog.js');
const W = require('./workspaces.js');
const U = require('./util.js');

function parseSources(sources) {
  const blocks = [], errors = [];
  for (const source of sources) {
    try {
      const defs = G.parseFile(source.text, source.path), lines = source.text.split('\n');
      defs.forEach((def, i) => {
        const end = defs[i + 1] ? defs[i + 1].line - 1 : lines.length;
        const text = lines.slice(def.line - 1, end).join('\n');
        blocks.push({key: def.block + ':' + def.id, file: source.path, line: def.line,
          text, sourceHash: U.hash(text), def});
      });
    } catch (error) { errors.push({file: source.path, message: error.message, text: source.text}); }
  }
  const compiled = G.compile(sources);
  let catalog = null;
  if (!compiled.errors.length) catalog = C.fromCompiled(compiled.content, sources);
  return {blocks, parseErrors: errors, compileErrors: compiled.errors.map(e => ({file: e.file, line: e.line, message: e.message})), catalog};
}
function baseSources(experiment) {
  const initial = U.readJSON(path.join(experiment, '_operator/initial/baseline.json'));
  return initial.files.filter(f => /^content\/.*\.grim$/.test(f.file)).map(f => {
    const text = fs.readFileSync(U.inside(path.join(experiment, '_operator/snapshot'), f.file), 'utf8');
    if (U.hash(text) !== f.hash) throw new Error('Starting source mismatch: ' + f.file);
    return {path: f.file, text};
  }).sort((a,b) => Number(!a.path.startsWith('content/core/')) - Number(!b.path.startsWith('content/core/')) || a.path.localeCompare(b.path));
}
function changedSources(base, change) {
  const sources = new Map(base.map(s => [s.path, s.text]));
  for (const file of change.files.filter(f => /^content\/.*\.grim$/.test(f.file))) {
    if (file.change === 'deleted') sources.delete(file.file);
    else {
      if (typeof file.text !== 'string' || U.hash(file.text) !== file.after) throw new Error('Scan source bytes do not match recorded hash: ' + file.file + '. Scan again after the current edit.');
      sources.set(file.file, file.text);
    }
  }
  return [...sources].map(([file,text]) => ({path:file,text})).sort((a,b) => Number(!a.path.startsWith('content/core/')) - Number(!b.path.startsWith('content/core/')) || a.path.localeCompare(b.path));
}
function makeArtifact(base, changes) {
  const sources = changedSources(base, changes), parsed = parseSources(sources);
  const compiled=G.compile(sources).content;
  const byKey = new Map(parsed.blocks.map(b => [b.key,b]));
  for (const change of changes.blocks) {
    if (change.after && byKey.get(change.key)?.sourceHash !== change.after.hash) throw new Error('Scan block/source mismatch: ' + change.key + '. Obtain a fresh scan.');
  }
  const cards = changes.blocks.filter(b => b.key.startsWith('event:')).map(change => ({
    key: change.key, change: change.change, before: change.before,
    block: byKey.get(change.key) || null,
    compiledDef:compiled.events[change.after?.id]||null,
    raw: !change.after ? changes.parseErrors.find(e => e.file === change.before?.file)?.raw || null : null,
  }));
  // Preserve a new malformed event file even when no block identity could be parsed.
  for (const error of parsed.parseErrors) if (changes.files.some(f => f.file === error.file) && !cards.some(c => c.before?.file === error.file)) {
    cards.push({key: 'unparsed:' + U.hash(error.file).slice(0,12), change:'unresolved-parse-error', block:null, raw:error.text, before:null});
  }
  return {sources, ...parsed, cards, changes, hash: U.hash(sources)};
}
function localeSources(experiment,initial,changes) {
  const sources=new Map();
  const included=file=>/^locales\/zh-CN\/.*\.lang$/.test(file)&&!file.endsWith('/_obsolete.lang');
  for(const file of initial.files.filter(f=>included(f.file))) {
    const text=fs.readFileSync(U.inside(path.join(experiment,'_operator/snapshot'),file.file),'utf8');
    if(U.hash(text)!==file.hash)throw new Error('Starting translation hash mismatch: '+file.file);
    sources.set(file.file,text);
  }
  for(const file of changes?.files.filter(f=>included(f.file))||[]) {
    if(file.change==='deleted')sources.delete(file.file);
    else {
      if(typeof file.text!=='string'||U.hash(file.text)!==file.after)throw new Error('Translation bytes do not match scan hash: '+file.file);
      sources.set(file.file,file.text);
    }
  }
  return [...sources].sort(([a],[b])=>a.localeCompare(b)).map(([file,text])=>({path:file,text}));
}
function receiptCapture(project) {
  const file = path.join(project, 'rag/receipts/retrieval.jsonl');
  if (!fs.existsSync(file)) return {text:'', hash:U.hash(''), entries:0, incompleteLines:0};
  const text = fs.readFileSync(file,'utf8'); let entries=0, incompleteLines=0;
  for (const line of text.split('\n').filter(Boolean)) try {JSON.parse(line); entries++;} catch {incompleteLines++;}
  return {text,hash:U.hash(text),entries,incompleteLines};
}
function importWorkspaces(root, experiment, opts={}) {
  const manifest = W.load(experiment);
  const scanFile = opts.scan ? path.resolve(opts.scan) : W.scan(experiment).file;
  const scan = U.readJSON(scanFile);
  if (scan.snapshotHash !== manifest.snapshotHash) throw new Error('Scan does not match this experiment');
  const projectNames=Object.keys(manifest.projects || {});
  if(!projectNames.length)throw new Error('Preparation manifest has no projects');
  for (const name of projectNames) if (!scan.projects[name]) throw new Error('Incomplete workspace scan: '+name);
  const base = baseSources(experiment), baseline = parseSources(base);
  if (baseline.parseErrors.length || baseline.compileErrors.length) throw new Error('Starting snapshot cannot be compiled');
  if(baseline.catalog.corpusHash!==manifest.corpusHash)throw new Error('Starting corpus fingerprint does not match the preparation manifest');
  baseline.rules = [];
  const initial = U.readJSON(path.join(experiment,'_operator/initial/baseline.json'));
  baseline.locales=localeSources(experiment,initial);
  baseline.localeHash=U.hash(baseline.locales);
  for (const file of initial.files.filter(f => /^docs\/authoring\/.*\.md$/.test(f.file))) {
    const raw = fs.readFileSync(U.inside(path.join(experiment,'_operator/snapshot'),file.file),'utf8');
    const text = require('./workspace-projection.js').commonText(file.file,raw);
    if (U.hash(text)!==file.hash) throw new Error('Common authoring rule reconstruction mismatch: '+file.file);
    baseline.rules.push({file:file.file,text,sourceHash:file.hash});
  }
  const seed = String(opts.seed || 'batch-review-20261024'), random = U.rng(seed);
  const names = U.shuffle(projectNames, random), artifacts = {};
  // Validate all bytes before creating the review directory.
  for (const name of names) {
    artifacts[name]=makeArtifact(base,scan.projects[name]);
    artifacts[name].locales=localeSources(experiment,U.readJSON(path.join(experiment,'_operator/initial',name+'.json')),scan.projects[name]);
    artifacts[name].localeHash=U.hash(artifacts[name].locales);
  }
  const prompt = opts.prompt ? fs.readFileSync(path.resolve(opts.prompt),'utf8') : null;
  const id = new Date().toISOString().replaceAll(':','-') + '-' + crypto.randomUUID().slice(0,8);
  const dir = opts.out ? path.resolve(opts.out) : path.join(experiment,'_operator/reviews',id);
  if (fs.existsSync(dir)) throw new Error('Review destination exists; import into a new directory');
  fs.mkdirSync(dir,{recursive:true});
  const review = {kind:'workspace-batch-review',version:2,reviewEpoch:crypto.randomUUID(),at:new Date().toISOString(),seed,
    provisional:!opts.final, languages:['en','zh-CN'],prompt,promptHash:prompt ? U.hash(prompt) : null,
    promptProvenance:prompt ? 'Operator supplied at import; native transcript equivalence is not established.' : 'Unrecorded',
    snapshotHash:manifest.snapshotHash,corpusHash:manifest.corpusHash,scanHash:U.hash(scan),scanAt:scan.at,
    batches:[],mapping:{},judgments:{},revealed:false};
  U.writeJSON(path.join(dir,'base.json'),baseline,true);
  review.baseFileHash=U.hash(baseline);
  U.writeJSON(path.join(dir,'scan.json'),scan,true);
  let alias=0; const presentations=[];
  for (const [i,name] of names.entries()) {
    const batch='batch-'+String(i+1), artifact=artifacts[name], ids={}, paths={};
    for (const change of artifact.changes.blocks.filter(b => b.change==='added')) {
      const old = change.after.id;
      if (!ids[old]) ids[old]='draft_'+String(++alias).padStart(3,'0');
    }
    for (const [j,file] of artifact.changes.files.filter(f=>f.file.startsWith('content/')).entries()) paths[file.file]='submission/source-'+String(j+1)+'.grim';
    for (const [j,file] of artifact.changes.files.filter(f=>f.file.startsWith('locales/')).entries()) paths[file.file]='submission/translation-'+String(j+1)+'.lang';
    const receipt=receiptCapture(path.join(experiment,name));
    fs.mkdirSync(path.join(dir,'receipts'),{recursive:true});
    fs.writeFileSync(path.join(dir,'receipts',batch+'.jsonl'),receipt.text,{flag:'wx',mode:0o600});
    const exportsDir=path.join(experiment,'_operator/sessions',name);
    const exportFiles=fs.existsSync(exportsDir) ? fs.readdirSync(exportsDir).filter(f=>fs.statSync(path.join(exportsDir,f)).isFile()).map(f=>({file:f,hash:U.hash(fs.readFileSync(path.join(exportsDir,f)))})) : [];
    review.batches.push({id:batch,label:'Batch '+String.fromCharCode(65+i),project:name,backend:manifest.projects[name]?.backend||name,
      artifactHash:artifact.hash,fileHash:U.hash(artifact),file:batch+'.json',ids,paths,receiptHash:receipt.hash,receiptEntries:receipt.entries,
      receiptIncompleteLines:receipt.incompleteLines,nativeExports:exportFiles,
      trace:{status:'unverifiable',reason:exportFiles.length ? 'Native exports retained by operator; not yet audited against this frozen artifact.' : 'No native session exports imported; retrieval receipts alone cannot prove toolset adherence.'}});
    U.writeJSON(path.join(dir,batch+'.json'),artifact,true);
    for (const card of artifact.cards) presentations.push({batch,key:card.key});
  }
  const repeats=U.shuffle(presentations,random).slice(0,Math.max(1,Math.round(presentations.length*.1)));
  U.shuffle([...presentations,...repeats],random).forEach((p,i)=>review.mapping['Card '+String(i+1).padStart(3,'0')]=p);
  review.assets={};
  for(const file of ['src/style.css','src/art.js','src/grimoire.js','src/i18n.js'])review.assets[file]=U.hash(fs.readFileSync(path.join(root,file)));
  U.writeJSON(path.join(dir,'private.json'),review,true);
  U.writeJSON(path.join(experiment,'_operator/reviews/latest.json'),{directory:dir,at:review.at});
  return {directory:dir,provisional:review.provisional,events:presentations.length,presentations:Object.keys(review.mapping).length,
    batches:review.batches.length,scan:scanFile,promptHash:review.promptHash,note:'Frozen review copy only; author workspaces and production content were not modified.'};
}
function latest(experiment) {return U.readJSON(path.join(experiment,'_operator/reviews/latest.json')).directory;}
module.exports={parseSources,changedSources,makeArtifact,localeSources,importWorkspaces,latest};
