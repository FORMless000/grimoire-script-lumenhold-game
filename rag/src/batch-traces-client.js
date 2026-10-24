'use strict';
let report,language=new URL(location.href).searchParams.get('lang')==='en'?'en':'zh-CN';
const $=s=>document.querySelector(s),T=(en,zh)=>language==='en'?en:zh;
function el(tag,text,parent,cls){const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;if(parent)parent.append(n);return n;}
function details(parent,title,value){const d=el('details',null,parent);el('summary',title,d);if(value!=null)el('pre',typeof value==='string'?value:JSON.stringify(value,null,2),d);return d;}
function options(selector,values){const node=$(selector),old=node.value;node.replaceChildren();for(const [key,label] of values){const o=el('option',label,node);o.value=key;}if(values.some(v=>v[0]===old))node.value=old;}
function show(){
 const run=report.runs.find(r=>r.project===$('#run').value),s=run.summary;$('#trace-detail').replaceChildren();$('#trace-calls').replaceChildren();
 const box=el('section',null,$('#trace-detail'),'panel-section');el('h2',run.project,box);el('p',T('Model: ','模型：')+run.model.join(', ')+' · Claude Code '+run.harnessVersions.join(', ')+' · '+run.firstAt+' → '+run.lastAt,box);el('p',T('Adherence: unverifiable. Original tools and file reads were allowed. Local logs, compound shells and background output need manual resolution.','合规性：无法完全验证。原有查询工具与文件读取在本次工作区中允许使用；本地日志、复合 shell 命令与后台输出仍需人工核实。'),box);el('p',T('Raw task bytes match review prompt: ','原始任务字节与评审提示一致：')+run.rawTaskMatchesReview+' · '+T('Normalized task text matches: ','去除粘贴包装、空白和列表符号差异后任务一致：')+run.normalizedTaskMatchesReview,box,'muted');
 const observations=[];
 if(!s.completedRag.neighbors&&!s.completedRag.brief&&run.project!=='baseline')observations.push(T('No retrieve neighbors or retrieve brief receipt was recorded during authoring.','创作期间没有 retrieve neighbors 或 retrieve brief 的执行回执。'));
 if(s.unreceiptedRagSites.length)observations.push(T('Some RAG command sites have no matching completion receipt; inspect the errors below.','部分 RAG 命令位置没有完成回执，请查看下方错误与尝试。'));
 if(run.calls.some(c=>/pkill\s+-f/.test(c.input.command||'')))observations.push(T('A process-name kill command occurred; it was not scoped to a recorded PID. This does not prove another run was killed.','出现按进程名称终止的命令，未限定为已记录的 PID；这不能证明其他运行受到影响。'));
 if(run.prompts.length>1)observations.push(T('Translation was a later human follow-up, not part of the first authoring prompt.','翻译来自之后的人类追加指令，并非首次创作提示的一部分。'));
 for(const o of observations)el('p',o,box);
 if(run.issues.length)details(box,T('Unresolved receipt issues','待解决的回执问题'),run.issues).open=true;
 details(box,T('Source hashes, session and completeness','来源指纹、会话与完整性'),{source:run.source,session:run.session,cwd:run.cwd,stopMarkers:run.stopMarkers,firstWrite:run.firstWrite,missingToolResults:s.missingToolResults,crossWorkspaceLiteralAccesses:run.crossWorkspaceLiteralAccesses,unreceiptedRagSites:s.unreceiptedRagSites});
 details(box,T('Human prompts','实际人类提示'),run.prompts);details(box,T('Excluded setup receipts','排除的准备阶段回执'),run.excluded);
 const category=$('#category').value,phase=$('#phase').value,q=$('#search').value.toLowerCase();
 const calls=run.calls.filter(c=>(category==='all'||category==='retrieval'&&c.operations.length||c.categories.includes(category))&&(phase==='all'||phase==='before'&&c.at<run.firstWrite||phase==='after'&&c.at>=run.firstWrite&&c.phase==='authoring'||phase==='follow-up'&&c.phase==='follow-up')&&(!q||JSON.stringify(c).toLowerCase().includes(q)));
 el('p',T('Matching native calls: ','匹配的原生工具调用：')+calls.length,$('#trace-calls'),'muted');
 for(const c of calls){const row=el('section',null,$('#trace-calls'),'panel-section');el('h3',c.tool+' · '+c.at+' · L'+c.line,row);el('p',c.categories.join(' / ')+' · '+c.id+' · '+T('recorded output characters: ','记录的输出字符数：')+(c.outputChars??'?'),row,'muted');el('pre',c.input.command||JSON.stringify(c.input,null,2),row);if(c.errorSignals.length)el('pre',c.errorSignals.join('\n'),row,'trace-error');
  for(const r of run.receipts.filter(r=>r.nativeCallId===c.id)){const receipt=details(row,T('Completed RAG receipt: ','完成的 RAG 回执：')+r.operation+' · '+(r.elapsedMs/1000).toFixed(2)+'s · '+r.returnedChars+' chars',{at:r.at,argv:r.argv,ids:r.ids,corpusHash:r.corpusHash,indexIdentity:r.indexIdentity,indexHash:r.indexHash,outputHash:r.outputHash,outputDigestMatches:r.outputDigestMatches,stages:r.stages,calls:r.calls,error:r.error});details(receipt,T('Full structured retrieval result','完整结构化检索结果'),r.result);}
  details(row,T('Recorded tool output · may contain filtering or background notices','记录的工具输出 · 可能已过滤或仅为后台通知'),c.output??T('No result recorded','未记录结果'));
 }
}
function chrome(){
 document.documentElement.lang=language;$('#language').value=language;$('#heading').textContent=T('Author tool traces','工具轨迹分析');$('#review-link').textContent=T('Blind card review','卡片盲评');$('#review-link').href='/?lang='+language;
 $('#scope').textContent=T('Native Claude Code tool calls and frozen retrieval receipts. This operator view shows backend identities separately from blind card judgments.','原生 Claude Code 工具调用与冻结检索回执。本操作者视图展示后端身份，与卡片盲评独立。');
 $('#qualification').textContent=T('Original-tool counts are literal command sites; RAG counts are completed receipt-recorded invocations. Setup probes are excluded. Backend-emitted characters precede shell filtering; native output may be mixed, truncated or read repeatedly. Do not add these measures or interpret them as context tokens, quality or causal effects.','原有工具计数为命令位置数量；RAG 计数为有回执的完成调用数，排除准备阶段探测。后端输出字符数位于 shell 过滤之前，原生输出可能混合、截断或重复读取。两者不能相加，也不能视为上下文 token、内容质量或因果效果。');
 for(const [id,en,zh] of [['run-label','Run','运行'],['category-label','Tools','工具类别'],['phase-label','Phase','阶段'],['search-label','Search commands / outputs','搜索命令／输出']])$('#'+id).textContent=T(en,zh);
 options('#run',report.runs.map(r=>[r.project,r.project]));options('#category',[['retrieval',T('Original + RAG','原有工具 + RAG')],['original',T('Original tools','原有查询工具')],['rag','RAG'],['file-read',T('File reads / searches','文件读取／搜索')],['validation',T('Validation','验证')],['all',T('All tools','所有工具')]]);options('#phase',[['all',T('All phases','所有阶段')],['before',T('Before first write','首次写入前')],['after',T('After first write','首次写入后')],['follow-up',T('Human follow-up','人类追加指令后')]]);
 const summary=$('#trace-summary');summary.replaceChildren();const wrap=el('div',null,summary,'trace-table'),table=el('table',null,wrap),head=el('tr',null,table);for(const h of [T('Workflow','工作流'),T('Original sites','原有工具位置'),T('Completed RAG','完成的 RAG'),T('Cumulative RAG seconds','累计 RAG 秒数'),T('Backend chars','后端输出字符'),T('Unique source IDs','不同来源 ID')])el('th',h,head);
 for(const r of report.runs){const tr=el('tr',null,table);for(const v of [r.project,JSON.stringify(r.summary.originalSites),JSON.stringify(r.summary.completedRag),(r.summary.ragElapsedMs/1000).toFixed(2),r.summary.ragEmittedChars,r.summary.uniqueReturnedIds])el('td',v,tr);}
 show();
}
for(const id of ['run','category','phase'])$('#'+id).onchange=show;$('#search').oninput=show;$('#language').onchange=()=>{language=$('#language').value;chrome();};
fetch('/api/traces').then(async r=>{const value=await r.json();if(!r.ok)throw new Error(value.error);report=value;chrome();}).catch(e=>$('#error').textContent=e.message);
