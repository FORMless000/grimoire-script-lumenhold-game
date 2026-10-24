"""Offline verification/cleanup of a copied official LightRAG 1.5.7 store.

Never invokes models or alters the original experiment. Removes only failed
'dup-*' ingestion receipts with no document/chunk contributions, using the
installed package's storage API. Real source deletions stay in the normal API.
"""
import asyncio
import contextlib
import importlib.metadata
import json
from pathlib import Path
import socket
import sys

def forbidden(*args,**kwargs):
    raise RuntimeError('Network is disabled during graph migration')
socket.create_connection=forbidden
_original_connect=socket.socket.connect
def connect(self,address):
    if self.family in (socket.AF_INET,socket.AF_INET6):return forbidden()
    return _original_connect(self,address)
socket.socket.connect=connect

async def run(data):
    from lightrag import LightRAG
    from lightrag.utils import EmbeddingFunc
    from lightrag.base import DocStatus
    if importlib.metadata.version('lightrag-hku')!='1.5.7':raise RuntimeError('Wrong native version')
    async def no_model(*args,**kwargs):raise RuntimeError('Model calls are disabled during migration')
    rag=LightRAG(working_dir=data['directory'],llm_model_func=no_model,
        embedding_func=EmbeddingFunc(embedding_dim=data['dimensions'],max_token_size=8192,func=no_model),
        kv_storage='JsonKVStorage',graph_storage='NetworkXStorage',vector_storage='NanoVectorDBStorage',doc_status_storage='JsonDocStatusStorage')
    await rag.initialize_storages()
    try:
        expected=set(data['expected'])
        processed=await rag.doc_status.get_docs_by_statuses([DocStatus.PROCESSED],strict=True)
        failed=await rag.doc_status.get_docs_by_statuses([DocStatus.FAILED],strict=True)
        if set(processed)!=expected:raise RuntimeError('Processed source coverage differs')
        for key,row in failed.items():
            if not key.startswith('dup-') or row.chunks_count or row.file_path not in expected:
                raise RuntimeError('Unrecognized failed row; cannot discard')
            if await rag.full_docs.get_by_id(key):raise RuntimeError('Failed row owns a document')
            if 'File name already exists.' not in (row.error_msg or ''):raise RuntimeError('Not a duplicate-ingress receipt')
        if failed:
            await rag.doc_status.delete(list(failed))
            await rag.doc_status.index_done_callback()
        return {'processed':len(processed),'retiredDuplicateReceipts':len(failed),'modelCalls':0}
    finally:
        await rag.finalize_storages()

if __name__=='__main__':
    with contextlib.redirect_stdout(sys.stderr):result=asyncio.run(run(json.load(sys.stdin)))
    print(json.dumps(result))
