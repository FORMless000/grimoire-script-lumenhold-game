"""Test-only subprocess: real LightRAG, scripted model outputs, no network."""
import asyncio
import hashlib
import json
from pathlib import Path
import re
import socket
import sys
import contextlib
sys.path.insert(0,str(Path(__file__).parents[1]/'src'))

def forbidden(*args,**kwargs):
    raise AssertionError('External network access is forbidden in offline smoke tests')
socket.create_connection=forbidden
# asyncio needs local socketpairs; only Internet sockets are forbidden.
_original_connect=socket.socket.connect
def connect(self,address):
    if self.family in (socket.AF_INET,socket.AF_INET6):
        return forbidden()
    return _original_connect(self,address)
socket.socket.connect=connect
from lightrag_bridge import execute
from lightrag_transport import Transport

async def run(data):
    counts={'extractionCalls':0,'mergeSummaryCalls':0,'embeddedInputs':0,'extractedIds':[],'rerankCalls':0}
    import importlib
    native=importlib.import_module('lightrag.lightrag')
    rebuild=native.rebuild_knowledge_from_chunks
    counts['reconstructedEntities']=[];counts['reconstructedRelationships']=[]
    async def measured_rebuild(*args,**kwargs):
        counts['reconstructedEntities'].extend(sorted(kwargs.get('entities_to_rebuild',{})))
        counts['reconstructedRelationships'].extend([list(pair) for pair in kwargs.get('relationships_to_rebuild',{})])
        return await rebuild(*args,**kwargs)
    native.rebuild_knowledge_from_chunks=measured_rebuild
    batches={}
    async def sender(method,endpoint,body=None):
        if endpoint=='/batches':
            batch_id='fixture_batch_'+str(len(batches))
            rows=[{'custom_id':r['custom_id'],'response':{'body':await sender('POST','/chat/completions',r['body'])}} for r in reversed(body['requests'])]
            batches[batch_id]={'status':'completed','results':rows}
            return {'id':batch_id}
        if endpoint.startswith('/batches/'):
            return batches[endpoint.rsplit('/',1)[-1]]
        if endpoint=='/embeddings':
            counts['embeddedInputs']+=len(body['input'])
            def vector(text):
                d=hashlib.sha256(text.encode()).digest()
                return [(x+1)/256 for x in d[:16]]
            return {'model':body['model'],'data':[{'index':i,'embedding':vector(text)} for i,text in enumerate(body['input'])]}
        if endpoint=='/rerank':
            counts['rerankCalls']+=1
            if data.get('failRerank'):
                raise RuntimeError('Injected reranker failure')
            return {'model':body['model'],'results':[{'index':i,'relevance_score':0.9} for i in range(len(body['documents']))]}
        if endpoint!='/chat/completions':
            raise AssertionError('Unexpected endpoint '+endpoint)
        text=body['messages'][-1]['content']
        if isinstance(text,list):text='\n'.join(x['text'] for x in text)
        names=sorted(set(re.findall(r'SIGNAL_[A-Z]+',text)))
        ids=re.findall(r'"key":\s*"(event:[^"]+)"',text)
        system=body['messages'][0]['content'] if body['messages'][0]['role']=='system' else ''
        if system:
            counts['extractionCalls']+=1
            counts['extractedIds'].extend(ids)
            from lightrag.prompt import PROMPTS
            sep=PROMPTS['DEFAULT_TUPLE_DELIMITER'];end=PROMPTS['DEFAULT_COMPLETION_DELIMITER']
            content='\n'.join([sep.join(['entity','Shared','person','Shared is present.'])]+[sep.join(['entity',n,'concept',n+' is present.']) for n in names]+[sep.join(['relation','Shared',n,'association','Shared encounters '+n+'.']) for n in names]+[end])
        elif data['action']=='search':
            content=json.dumps({'high_level_keywords':['association'],'low_level_keywords':['Shared']})
        else:
            counts['mergeSummaryCalls']+=1
            content='Shared has source-supported associations.'
        return {'model':body['model'],'choices':[{'message':{'content':content},'finish_reason':'stop'}]}
    transport=Transport(data,sender=sender,poll_seconds=0)
    result=await execute(data,transport)
    import networkx as nx
    graph=nx.read_graphml(Path(data['directory'])/'graph_chunk_entity_relation.graphml')
    result['graphSnapshot']={'nodes':sorted(graph.nodes),'edges':sorted([sorted(e) for e in graph.edges])}
    from nano_vectordb.dbs import load_storage
    vectors=load_storage(str(Path(data['directory'])/'vdb_chunks.json'))
    result['chunkVectors']={row['__id__']:hashlib.sha256(vectors['matrix'][i].tobytes()).hexdigest() for i,row in enumerate(vectors['data'])}
    result['smokeCounts']=counts
    counts['cacheHits']=sum(c['status']=='cached' for c in transport.calls)
    counts['extractedIds']=sorted(set(counts['extractedIds']))
    return result
if __name__=='__main__':
    try:
        with contextlib.redirect_stdout(sys.stderr):
            result=asyncio.run(run(json.load(sys.stdin)))
        print(json.dumps(result))
    except Exception:
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
