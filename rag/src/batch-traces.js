'use strict';
// Exploratory batch traces use the workspace contract, not the stricter independent-trial audit.
const fs=require('fs'),path=require('path'),os=require('os');
const U=require('./util.js'),I=require('./batch-import.js'),R=require('./batch-review.js');
const {render}=require('./presentation.js');
function redact(text){return String(text??'').replace(/\bsk-(?:or-v1-)?[A-Za-z0-9_-]{16,}/g,'[REDACTED KEY]').replace(/(Bearer\s+)[A-Za-z0-9._-]{16,}/gi,'$1[REDACTED]').replace(/((?:OPENROUTER_API_KEY|ANTHROPIC_API_KEY|OPENAI_API_KEY)\s*[=:]\s*["']?)[^\s"';]+/gi,'$1[REDACTED]');}
const clean=value=>JSON.parse(redact(JSON.stringify(value)));
function textContent(value){return typeof value==='string'?value:(value||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n');}
function taskText(value){return String(value||'').replace(/^\s*<pasted_content\b[^>]*>\s*([\s\S]*?)\s*<\/pasted_content\b[^>]*>\s*$/,'$1').split('\n').map(s=>s.trim().replace(/^[*-]\s+/,'- ')).filter(Boolean).join('\n');}
function native(text){
  const rows=[],calls=[],prompts=[],unknown=[],models=new Set(),versions=new Set(),results=new Map();let session=null,cwd=null,stopMarkers=0;
  const ids=new Set(),resultIds=new Set();
  for(const [i,line] of text.split('\n').entries()){
    if(!line.trim())continue;let row;try{row=JSON.parse(line);}catch{unknown.push('Malformed JSONL line '+(i+1));continue;}
    rows.push(row);if(row.version)versions.add(row.version);session=session||row.sessionId;cwd=cwd||row.cwd;
    const content=row.message?.content;
    if(row.message?.model)models.add(row.message.model);
    if(row.type==='system'&&row.subtype==='stop_hook_summary')stopMarkers++;
    if(row.type==='user'){
      const value=textContent(content);
      // Background notifications and tool results are not additional human prompts.
      if(value.trim()&&!value.trimStart().startsWith('<task-notification>'))prompts.push({line:i+1,at:row.timestamp,text:value,hash:U.hash(value)});
    }
    for(const b of Array.isArray(content)?content:[]){
      if(b.type==='tool_use'&&!ids.has(b.id)){ids.add(b.id);calls.push({id:b.id,line:i+1,at:row.timestamp,tool:b.name,input:b.input||{},phase:prompts.length>1?'follow-up':'authoring'});}
      if(b.type==='tool_result'&&!resultIds.has(b.tool_use_id)){resultIds.add(b.tool_use_id);results.set(b.tool_use_id,{output:textContent(b.content),isError:!!b.is_error,resultLine:i+1,resultAt:row.timestamp});}
    }
  }
  for(const call of calls){Object.assign(call,results.get(call.id)||{output:null,isError:null});call.outputChars=call.output?.length??null;}
  return {session,cwd,models:[...models],harnessVersions:[...versions],prompts,calls,stopMarkers,unknown,firstAt:rows[0]?.timestamp,lastAt:rows.filter(r=>r.timestamp).at(-1)?.timestamp,lines:rows.length};
}
function operations(command){
  // Count literal call sites, not shell-loop iterations. Completed RAG invocations come from receipts.
  const result=[],alias=[];
  if(/\bg\s*\(\)\s*\{\s*node tools\/grim\.js/.test(command))alias.push('g');
  if(/\bG=["']node tools\/grim\.js["']/.test(command))alias.push('\\$G');
  const start='(?:\\bnode\\s+tools/grim\\.js|\\bnpm\\s+run\\s+grim\\s+--'+(alias.length?'|'+alias.join('|'):'')+')';
  const re=new RegExp(start+'\\s+(retrieve\\s+(?:search|read|neighbors|brief|related|status|index)|query|brief|show|graph)\\b','g');
  for(const m of command.matchAll(re))result.push({family:m[1].startsWith('retrieve ')?'rag':'original',operation:m[1].replace(/^retrieve /,''),site:m[0]});
  return result;
}
function callKind(call){
  const command=call.input.command||'';call.operations=call.tool==='Bash'?operations(command):[];
  const read=/\b(?:cat|sed|grep|rg|head|tail|awk)\b/.test(command);
  call.categories=[...new Set([...call.operations.map(o=>o.family),...(['Read','Grep','Glob'].includes(call.tool)||read?['file-read']:[]),...(['Write','Edit','MultiEdit'].includes(call.tool)||/(?:\bsed\s+-i\b|\bcat\s*>>?|\bwriteFileSync\b)/.test(command)?['write']:[]),...(/grim\.js\s+(?:check|lint|build|fmt|sim|balance|dupes|odds|reach|leads|i18n)\b/.test(command)?['validation']:[])])];
  if(!call.categories.length)call.categories=['other'];
  call.errorSignals=(call.output||'').split('\n').filter(l=>/unknown function|command not found|no such file or directory|^Error:|SIGTERM|killed by signal/i.test(l)).map(l=>l.slice(0,500));
  call.background=/moved to the background|running in.*background/i.test(call.output||'');
  return call;
}
function chooseSession(experiment,name,prompt,opts={}){
  const explicit=opts.sessions&&path.join(opts.sessions,name+'.jsonl');
  const folder=path.join(opts.claudeProjects||path.join(os.homedir(),'.claude/projects'),path.join(experiment,name).replace(/[^a-zA-Z0-9-]/g,'-'));
  const files=explicit?[explicit]:fs.existsSync(folder)?fs.readdirSync(folder).filter(f=>f.endsWith('.jsonl')).map(f=>path.join(folder,f)):[];
  const candidates=files.filter(fs.existsSync).map(file=>{const text=fs.readFileSync(file,'utf8');return {file,text,parsed:native(text)};}).filter(c=>taskText(c.parsed.prompts[0]?.text)===taskText(prompt));
  if(candidates.length!==1)throw new Error('Expected one matching native Claude session for '+name+'; found '+candidates.length+'. Supply --sessions DIR containing '+name+'.jsonl to disambiguate.');
  return candidates[0];
}
function summarize(parsed,receiptText,expectedCorpus){
  const calls=parsed.calls.map(callKind),receipts=[],excluded=[],issues=[...parsed.unknown];let firstWrite=null;
  for(const c of calls)if(!firstWrite&&(c.tool==='Write'&&/(?:^|\/)content\/.*\.grim$/.test(c.input.file_path||'')||c.categories.includes('write')&&/content\//.test(c.input.command||'')))firstWrite=c.at;
  const from=parsed.prompts[0]?.at,to=parsed.lastAt;
  for(const [i,line] of receiptText.split('\n').entries()){
    if(!line.trim())continue;let row;try{row=JSON.parse(line);}catch{issues.push('Malformed receipt line '+(i+1));continue;}
    if(!from||!row.at||row.at<from||row.at>to){excluded.push({line:i+1,at:row.at,operation:row.operation,reason:'Outside observed author session window'});continue;}
    const args=row.argv||[],pos=args.slice(1).filter((arg,j,all)=>!arg.startsWith('--')&&!(j&&all[j-1].startsWith('--')));
    const matches=calls.filter(c=>c.at<=row.at&&c.operations.some(o=>o.family==='rag'&&o.operation===row.operation)&&pos.every(arg=>(c.input.command||'').includes(arg))).sort((a,b)=>b.at.localeCompare(a.at));
    const matched=matches[0];
    let outputDigestMatches=null;try{outputDigestMatches=U.hash(render(row.result,row.operation,args.includes('--json')))===row.outputHash;}catch{ /* Older receipts may omit results. */ }
    const ids=row.result?.ids||row.result?.results?.map(r=>r.key)||[];
    receipts.push({line:i+1,at:row.at,operation:row.operation,argv:args,ids,error:row.error||null,elapsedMs:row.elapsedMs,returnedChars:row.returnedChars,corpusHash:row.corpusHash,indexHash:row.indexHash,indexIdentity:row.indexIdentity,stages:row.stages||[],calls:row.calls||[],outputHash:row.outputHash,outputDigestMatches,nativeCallId:matched?.id||null,nativeLine:matched?.line||null,completedAt:new Date(Date.parse(row.at)+(row.elapsedMs||0)).toISOString(),phase:firstWrite?(Date.parse(row.at)+(row.elapsedMs||0)<=Date.parse(firstWrite)?'before-first-write':'after-first-write'):'no-first-write-observed',result:row.result});
    if(!matched)issues.push('Receipt line '+(i+1)+' has no matching native command site');
    if(row.corpusHash!==expectedCorpus)issues.push('Receipt corpus mismatch on line '+(i+1));
    if(outputDigestMatches===false)issues.push('Receipt output digest mismatch on line '+(i+1));
  }
  const original={},rag={},tools={};
  for(const c of calls){tools[c.tool]=(tools[c.tool]||0)+1;for(const o of c.operations)if(o.family==='original')original[o.operation]=(original[o.operation]||0)+1;}
  for(const r of receipts)if(!r.error)rag[r.operation]=(rag[r.operation]||0)+1;
  const unreceipted=calls.filter(c=>c.operations.some(o=>o.family==='rag')&&!receipts.some(r=>r.nativeCallId===c.id)).map(c=>({id:c.id,line:c.line,errorSignals:c.errorSignals,background:c.background}));
  return {firstWrite,calls,receipts,excluded,issues,summary:{tools,originalSites:original,completedRag:rag,totalToolCalls:calls.length,originalSitesTotal:Object.values(original).reduce((a,b)=>a+b,0),completedRagTotal:receipts.filter(r=>!r.error).length,ragElapsedMs:receipts.reduce((n,r)=>n+(r.elapsedMs||0),0),ragEmittedChars:receipts.reduce((n,r)=>n+(r.returnedChars||0),0),uniqueReturnedIds:new Set(receipts.flatMap(r=>r.ids)).size,nativeToolOutputChars:calls.reduce((n,c)=>n+(c.outputChars||0),0),missingToolResults:calls.filter(c=>c.output==null).map(c=>c.id),errorCalls:calls.filter(c=>c.isError||c.errorSignals.length).map(c=>c.id),unreceiptedRagSites:unreceipted},qualification:'RAG counts use receipts in the observed session window, linked to native command sites. Original counts are literal command sites; shell programs are not executed by the analyzer. Emitted characters are before head/grep filtering and are not context tokens. Native tool output sizes include mixed and repeated outputs; do not add the two measures.'};
}
function build(experiment,opts={}){
  experiment=path.resolve(experiment);const review=path.resolve(opts.review||I.latest(experiment)),m=R.load(review),manifest=U.readJSON(path.join(experiment,'_operator/manifest.json'));
  const PROJECTS=Object.keys(manifest.projects || {});
  if(!PROJECTS.length)throw new Error('Preparation manifest has no projects');
  if(!m.prompt)throw new Error('Record the author prompt before matching native sessions');
  const runs=[];
  for(const name of PROJECTS){
    const batch=m.batches.find(b=>b.project===name);if(!batch)throw new Error('Review does not contain '+name);R.artifact(review,batch);
    const source=chooseSession(experiment,name,m.prompt,opts),receiptText=fs.readFileSync(path.join(review,'receipts',batch.id+'.jsonl'),'utf8');
    if(U.hash(receiptText)!==batch.receiptHash)throw new Error('Frozen receipt hash mismatch: '+name);
    const parsed=source.parsed,analysis=summarize(parsed,receiptText,manifest.corpusHash);
    const writes=analysis.calls.filter(c=>['Write','Edit','MultiEdit'].includes(c.tool)).map(c=>c.input.file_path).filter(Boolean);
    const crossReads=analysis.calls.filter(c=>{const s=JSON.stringify({command:c.input.command,file:c.input.file_path,path:c.input.path});return PROJECTS.some(other=>other!==name&&s.includes(experiment+'/'+other+'/'));}).map(c=>c.id);
    runs.push({project:name,session:parsed.session,model:parsed.models,harnessVersions:parsed.harnessVersions,source:{file:source.file,sha256:U.hash(source.text),lines:parsed.lines},cwd:parsed.cwd,firstAt:parsed.firstAt,lastAt:parsed.lastAt,prompts:parsed.prompts,rawTaskMatchesReview:parsed.prompts[0]?.hash===m.promptHash,normalizedTaskMatchesReview:taskText(parsed.prompts[0]?.text)===taskText(m.prompt),stopMarkers:parsed.stopMarkers,writeTargets:writes,crossWorkspaceLiteralAccesses:crossReads,traceStatus:'unverifiable',traceReason:'Observed local interactive transcript, not an independently attested complete session. Shell compositions, background output delivery and implicit instructions require manual resolution. Ordinary query/show/graph/file reads are allowed in these exploratory workspaces; the stricter independent-trial bypass rule is not applied.',...analysis});
  }
  const at=new Date().toISOString(),out=path.resolve(opts.out||path.join(experiment,'_operator/trace-analysis',at.replace(/[:.]/g,'-')));
  if(fs.existsSync(out))throw new Error('Trace output already exists');
  const report=clean({kind:'workspace-tool-trace-analysis',version:1,at,reviewAt:m.at,promptHash:m.promptHash,review,sourceCorpusHash:manifest.corpusHash,analyzerHash:U.hash(fs.readFileSync(__filename,'utf8')),rendererHash:U.hash(fs.readFileSync(path.join(__dirname,'presentation.js'),'utf8')),runs,scope:'Tool invocations, recorded results and human prompts only. Assistant reasoning is not exported. Preparation probes are excluded. This is descriptive process analysis, not a quality verdict or a causal comparison.'});
  fs.mkdirSync(out,{recursive:true,mode:0o700});
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
  fs.writeFileSync(path.join(out,'REPORT.md'),markdown(report),{flag:'wx',mode:0o600});
  // Pointer changes only operator trace presentation; no review judgments or artifacts are changed.
  U.writeJSON(path.join(review,'trace-latest.json'),{directory:out,reportHash:U.hash(report),at});
  return {directory:out,review,viewPath:'/traces?lang=zh-CN',runs:runs.map(r=>({project:r.project,...r.summary,issues:r.issues}))};
}
function read(review){const p=U.readJSON(path.join(review,'trace-latest.json')),r=U.readJSON(path.join(p.directory,'report.json'));if(U.hash(r)!==p.reportHash)throw new Error('Trace report changed');return r;}
function markdown(report){
  const lines=['# Author tool traces','',report.scope,'','Original counts below are literal command sites; RAG counts are completed receipt-recorded operations. Setup probes are excluded.','', '| Workflow | Original tools | RAG operations | RAG emitted chars | Cumulative RAG seconds |','|---|---|---|---:|---:|'];
  for(const r of report.runs)lines.push('| '+r.project+' | '+JSON.stringify(r.summary.originalSites)+' | '+JSON.stringify(r.summary.completedRag)+' | '+r.summary.ragEmittedChars+' | '+(r.summary.ragElapsedMs/1000).toFixed(2)+' |');
  const ragRuns=report.runs.filter(r=>r.project!=='baseline');
  if(ragRuns.every(r=>r.receipts.length&&r.receipts.every(e=>e.phase==='before-first-write')))lines.push('','All receipt-recorded RAG operations completed before the first content write. This observed batch used RAG for initial source discovery rather than repeated retrieval during drafting/repair.');
  if(ragRuns.every(r=>!r.summary.completedRag.neighbors&&!r.summary.completedRag.brief))lines.push('','No author called retrieve neighbors or retrieve brief. This does not mean that LightRAG internal graph retrieval was disabled; explicit dependency inspection and backend retrieval are different components.');
  if(report.runs.some(r=>!r.rawTaskMatchesReview))lines.push('','Raw author prompt bytes differ from the operator-recorded prompt. Normalized formatting equivalence is reported separately and does not establish the byte-identical control required by a strict trial.');
  lines.push('','All runs remain **unverifiable** for full toolset adherence. Ordinary tools are allowed in these exploratory batches. Character totals are not token counts or proof of author exposure.','');
  for(const r of report.runs){lines.push('## '+r.project,'','Model: '+r.model.join(', ')+'. Harness versions: '+r.harnessVersions.join(', ')+'. Native session: `'+r.session+'`. Transcript SHA-256: `'+r.source.sha256+'`.','',r.traceReason,'','Raw task bytes match recorded review prompt: '+r.rawTaskMatchesReview+'. Normalized task text matches: '+r.normalizedTaskMatchesReview+'. Stop-hook markers: '+r.stopMarkers+'.','', '### Recorded RAG operations','');for(const e of r.receipts)lines.push('- '+e.at+' · '+e.operation+' · '+JSON.stringify(e.argv)+' · '+e.elapsedMs+' ms · native line '+e.nativeLine+' · IDs: '+e.ids.join(', '));lines.push('','### Relevant native tool calls','');for(const c of r.calls.filter(c=>c.operations.length))lines.push('Line '+c.line+' · '+c.at+' · '+c.id,'','```sh',c.input.command,'```','',c.errorSignals.length?'Observed errors: '+c.errorSignals.join('; '):'Recorded output: '+c.outputChars+' characters.','');}
  return lines.join('\n')+'\n';
}
module.exports={redact,taskText,native,operations,summarize,build,read,markdown};
