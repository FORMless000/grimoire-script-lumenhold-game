"""Offline transport contracts; never uses credentials or external sockets."""
import asyncio
import json
from pathlib import Path
import tempfile
import unittest
import sys
sys.path.insert(0,str(Path(__file__).parents[1]/'src'))
from lightrag_transport import Transport, fingerprint, write_json
import socket
socket.create_connection=lambda *a,**k: (_ for _ in ()).throw(AssertionError('Network forbidden'))
_original=socket.socket.connect
def blocked(self,address):
    if self.family in (socket.AF_INET,socket.AF_INET6):raise AssertionError('Network forbidden')
    return _original(self,address)
socket.socket.connect=blocked

MODEL='google/gemini-3.8-flash'
def body(value):return {'model':MODEL,'messages':[{'role':'user','content':value}]}
def response(value):return {'model':MODEL,'choices':[{'message':{'content':value},'finish_reason':'stop'}],'usage':{'cost':0,'prompt_tokens_details':{'cached_tokens':4}}}

class Tests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.data={'directory':self.tmp.name,'resume':False}

    async def test_batch_partial_out_of_order_and_resume(self):
        submitted=[]; stored={}
        async def sender(method,endpoint,payload=None):
            if method=='POST':
                submitted.append(payload);bid='batch_'+str(len(submitted))
                stored[bid]={'status':'completed','results':[{'custom_id':r['custom_id'], 'error':{'message':'test failure'}} if len(submitted)==1 and r['body']['messages'][0]['content']=='bad' else {'custom_id':r['custom_id'],'response':{'body':response('ok')}} for r in reversed(payload['requests'])]}
                return {'id':bid}
            return stored[endpoint.rsplit('/',1)[-1]]
        t=Transport(self.data,sender,0)
        results=await asyncio.gather(t.request('/chat/completions',body('good'),'extraction',True),t.request('/chat/completions',body('bad'),'extraction',True),return_exceptions=True)
        self.assertIsInstance(results[0],dict);self.assertIsInstance(results[1],RuntimeError)
        t=Transport({**self.data,'resume':True},sender,0)
        values=await asyncio.gather(t.request('/chat/completions',body('good'),'extraction',True),t.request('/chat/completions',body('bad'),'extraction',True))
        self.assertEqual(len(values),2);self.assertEqual(len(submitted),2);self.assertEqual(len(submitted[1]['requests']),1)
        self.assertEqual(submitted[1]['requests'][0]['body']['messages'][0]['content'],'bad')
        self.assertTrue(any(c['status']=='cached' for c in t.calls))
        self.assertEqual(values[1]['usage']['prompt_tokens_details']['cached_tokens'],4)

    async def test_ambiguous_submission_is_never_duplicated(self):
        submissions=[]
        async def sender(method,endpoint,payload=None):
            submissions.append(payload);raise TimeoutError('accepted status unknown')
        t=Transport(self.data,sender,0)
        with self.assertRaises(TimeoutError):await t.request('/chat/completions',body('x'),'extraction',True)
        t=Transport({**self.data,'resume':True},sender,0)
        with self.assertRaisesRegex(RuntimeError,'Ambiguous'):await t.request('/chat/completions',body('x'),'extraction',True)
        self.assertEqual(len(submissions),1)

    async def test_restart_recovers_batch_id_without_resubmitting(self):
        b=body('x');key=fingerprint({'endpoint':'/chat/completions','body':b,'baseURL':None})
        write_json(Path(self.tmp.name)/'request-cache/batches'/('request-'+key+'.json'),{'id':'existing'})
        async def sender(method,endpoint,payload=None):
            self.assertEqual(method,'GET')
            return {'status':'completed','results':[{'custom_id':key,'response':{'body':response('saved')}}]}
        result=await Transport({**self.data,'resume':True},sender,0).request('/chat/completions',b,'extraction',True)
        self.assertEqual(result['choices'][0]['message']['content'],'saved')

    async def test_cache_model_provider_and_failure_boundaries(self):
        sent=[]
        async def sender(method,endpoint,payload=None):
            sent.append(payload);return {'model':payload['model'],'data':[]}
        t=Transport(self.data,sender)
        await t.request('/embeddings',{'model':'embedding-a','input':['x']},'embedding')
        await t.request('/embeddings',{'model':'embedding-a','input':['x']},'embedding')
        await t.request('/embeddings',{'model':'embedding-b','input':['x']},'embedding')
        await Transport({**self.data,'provider':{'only':['Other']}},sender).request('/embeddings',{'model':'embedding-a','input':['x']},'embedding')
        self.assertEqual(len(sent),3)
        for invalid in [{'error':{'message':'bad'}},{'model':'wrong'},{'model':MODEL,'choices':[{'finish_reason':'length'}]}]:
            with self.assertRaises(RuntimeError):t.validate(body('x'),invalid)

    async def test_permanent_http_failure_opens_circuit_without_retries(self):
        from lightrag_transport import OpenRouterHTTPError
        count=0
        async def sender(*args):
            nonlocal count
            count+=1
            raise OpenRouterHTTPError(402,'Insufficient balance')
        t=Transport(self.data,sender)
        with self.assertRaises(OpenRouterHTTPError):await t.request('/embeddings',{'model':'embedding-a','input':['x']},'embedding')
        for _ in range(4):
            with self.assertRaisesRegex(RuntimeError,'circuit'):await t.request('/embeddings',{'model':'embedding-a','input':['y']},'embedding')
        self.assertEqual(count,1)
        self.assertEqual(sum(r['status']=='blocked' for r in t.calls),1)

    async def test_voyage_alias_accepts_only_the_exact_model_and_provider(self):
        t=Transport(self.data)
        b={'model':'voyageai/rerank-3-lite'}
        t.validate(b,{'model':'rerank-3-lite','provider':'VoyageAI by MongoDB'})
        with self.assertRaisesRegex(RuntimeError,'substitution'):
            t.validate(b,{'model':'rerank-3-lite','provider':'Other'})
        with self.assertRaisesRegex(RuntimeError,'substitution'):
            t.validate(b,{'model':'rerank-3','provider':'VoyageAI by MongoDB'})

if __name__=='__main__':unittest.main()
