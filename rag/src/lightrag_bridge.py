"""Official LightRAG adapter. JSON stdin/stdout; no answer generation."""
import asyncio
import contextlib
import importlib.metadata
import json
from pathlib import Path
import sys
from lightrag_retry import insert_documents
from lightrag_transport import Transport


async def execute(data, transport=None):
    import numpy as np
    from lightrag import LightRAG, QueryParam
    from lightrag.base import DocStatus
    from lightrag.utils import EmbeddingFunc
    t = transport or Transport(data)
    models = data['models']
    version = importlib.metadata.version('lightrag-hku')
    if version != '1.5.7' or data.get('identity') and data['identity']['version'] != version:
        raise RuntimeError('LightRAG version changed; explicit migration required')
    if data.get('identity') and data['identity']['models']['embedding'] != models['embedding']:
        raise RuntimeError('Embedding configuration changed; synchronize vectors first')

    async def embed(texts):
        result = await t.request('/embeddings', {'model': models['embedding'], 'input': texts}, 'embedding')
        rows = sorted(result['data'], key=lambda r:r['index'])
        if [r['index'] for r in rows] != list(range(len(texts))):
            raise RuntimeError('Malformed embedding indices')
        values = np.array([r['embedding'] for r in rows])
        if values.ndim != 2 or not np.isfinite(values).all():
            raise RuntimeError('Malformed embedding values')
        return values

    def llm_for(role):
        model = models['keyword'] if role == 'keyword' else models['extract']
        async def llm(prompt, system_prompt=None, history_messages=None, **kwargs):
            messages = ([{'role':'system','content':system_prompt}] if system_prompt else []) + (history_messages or []) + [{'role':'user','content':prompt}]
            body = {'model':model,'messages':messages,'max_tokens':kwargs.get('max_tokens',4096 if model=='google/gemini-3.1-flash-lite' else 16384),
                    'reasoning': {'effort':'low'} if model.startswith('google/') else {'enabled':False}}
            if model=='google/gemini-3.1-flash-lite':
                body['temperature']=0
                body.pop('reasoning',None)  # Preserve the imported graph's original Lite transport settings.
            if kwargs.get('response_format'):
                body['response_format'] = kwargs['response_format']
            # Preserve stable native prefixes. Provider cache hits are observable,
            # never presumed; Qwen explicit caching is not claimed as supported.
            if model.startswith('google/') and system_prompt:
                body['messages'][0] = {'role':'system','content':[{'type':'text','text':system_prompt,'cache_control':{'type':'ephemeral'}}]}
            stage = 'keyword' if role == 'keyword' else ('extraction' if system_prompt else 'merge-summary')
            result = await t.request('/chat/completions',body,stage,batch=data.get('mode')=='batch' and data['action']=='index' and role!='keyword')
            content = result['choices'][0]['message']['content']
            if not isinstance(content,str) or not content.strip():
                raise RuntimeError('Empty LLM response')
            return content
        return llm

    async def rerank(query, documents, top_n=None, **kwargs):
        try:
            result = await t.request('/rerank',{'model':models['reranker'],'query':query,'documents':[{'text':d} for d in documents],'top_n':top_n or len(documents)},'rerank')
            rows = result.get('results',result.get('data'))
            if not isinstance(rows,list) or not rows or len({r['index'] for r in rows})!=len(rows) or any(
                not isinstance(r.get('index'),int) or not 0<=r['index']<len(documents) or not np.isfinite(r.get('relevance_score',float('nan'))) for r in rows):
                raise RuntimeError('Malformed rerank results')
            return rows
        except Exception as error:
            t.receipt(stage='rerank',status='failed',model=models['reranker'],error=type(error).__name__)
            t.rerank_failed = True
            raise

    directory = Path(data['directory'])
    directory.mkdir(parents=True,exist_ok=True)
    embedding_change = data.get('revector') and not (directory / 'vectors-rebuilt.json').exists()
    if embedding_change:
        for file in directory.glob('vdb_*.json'):
            file.unlink()
    dims = data.get('identity',{}).get('dimensions') if data.get('identity') else None
    if dims is None:
        dims = len((await embed(['embedding dimension probe']))[0])
    batch = data.get('mode') == 'batch'
    roles = {role:{'func':llm_for(role),'max_async':64 if batch and role=='extract' else 4,
                   'timeout':360000 if batch else 180,
                   'metadata':{'model':models['keyword'] if role=='keyword' else models['extract'], 'host':data.get('baseURL','https://openrouter.ai/api/v1')}} for role in ['extract','keyword']}
    rag = LightRAG(working_dir=str(directory), llm_model_name=models['extract'], llm_model_func=llm_for('extract'),role_llm_configs=roles,
        max_parallel_insert=32 if batch else 3, default_llm_timeout=360000 if batch else 180,
        default_embedding_timeout=150, embedding_func=EmbeddingFunc(embedding_dim=dims,max_token_size=8192,func=embed),
        rerank_model_func=rerank,kv_storage='JsonKVStorage',graph_storage='NetworkXStorage',vector_storage='NanoVectorDBStorage',doc_status_storage='JsonDocStatusStorage')
    await rag.initialize_storages()
    try:
        if data['action']=='index':
            # Retain completed per-document operations across interruption/resume.
            done_file = directory / 'sync-progress.json'
            done = json.loads(done_file.read_text()) if done_file.exists() else {'deleted':[],'inserted':[]}
            for key in data.get('deleted',[]):
                if key in done['deleted']:
                    continue
                outcome = await rag.adelete_by_doc_id(key)
                if outcome.status not in ('success','not_found'):
                    raise RuntimeError('Native deletion failed: '+str(outcome.status))
                done['deleted'].append(key)
                from lightrag_transport import write_json
                write_json(done_file,done)
            if embedding_change:
                from lightrag.tools.rebuild_vdb import rebuild_entities_vdb,rebuild_relationships_vdb,rebuild_chunks_vdb
                cfg = rag._build_global_config()
                await rebuild_entities_vdb(rag.chunk_entity_relation_graph,rag.entities_vdb,cfg)
                await rebuild_relationships_vdb(rag.chunk_entity_relation_graph,rag.relationships_vdb,cfg)
                await rebuild_chunks_vdb(rag.text_chunks,rag.chunks_vdb)
                from lightrag_transport import write_json
                write_json(directory/'vectors-rebuilt.json',{'embedding':models['embedding']})
            await insert_documents(rag,data['records'])
            if any(c.get('status')=='failed' for c in t.calls):
                raise RuntimeError('Indexing stage failed; partial native success cannot be published')
            processed = await rag.doc_status.get_docs_by_statuses([DocStatus.PROCESSED],strict=True)
            expected = set(data['expected'])
            if set(processed)!=expected:
                raise RuntimeError('Incomplete document coverage')
            # Keep durable markers through publication. The Node coordinator
            # removes inherited markers when creating the next staged revision.
            return {'backend':'lightrag','version':version,'models':models,'dimensions':dims,'processedIds':sorted(processed),'calls':t.calls}
        result = await rag.aquery_data(data['query'],param=QueryParam(mode='mix',chunk_top_k=40,top_k=40,enable_rerank=True))
        if t.rerank_failed or any(c.get('status')=='failed' for c in t.calls) or result.get('status')=='failure':
            raise RuntimeError('Retrieval failed; rerank fallback is forbidden')
        hits=[]
        for i,chunk in enumerate(result.get('data',{}).get('chunks',[])):
            key=chunk.get('file_path')
            if not isinstance(key,str) or ':' not in key:
                raise RuntimeError('Ambiguous parent source')
            hits.append({'key':key,'score':1/(i+1),'reason':'LightRAG mix retrieval (original parent)'})
        return {'hits':hits,'calls':t.calls,'stages':{'rerank':'succeeded-or-cached' if any(c.get('stage')=='rerank' and c['status'] in ('succeeded','cached') for c in t.calls) else 'not-applicable'}}
    finally:
        await rag.finalize_storages()


if __name__=='__main__':
    transport = None
    try:
        data=json.load(sys.stdin)
        transport=Transport(data)
        with contextlib.redirect_stdout(sys.stderr):
            result=asyncio.run(execute(data,transport))
        print(json.dumps(result))
    except Exception as error:
        # Structured failure preserves stage receipts even when native retrieval
        # catches a callback error. No prompt text or credential enters the error.
        print(json.dumps({'error':'LightRAG bridge failed: '+type(error).__name__+'. Inspect private receipts and pending update; no fallback.',
                          'calls':transport.calls if transport else []}))
