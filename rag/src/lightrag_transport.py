"""OpenRouter transport with durable request receipts and resumable batch waves.

LightRAG still owns extraction/merging. A completed transport cache entry is not
an assertion that a document has been successfully indexed.
"""
import asyncio
import hashlib
import json
import os
from pathlib import Path
import time
import urllib.request
import urllib.error
import re


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def write_json(file, value):
    file = Path(file)
    file.parent.mkdir(parents=True, exist_ok=True)
    temp = file.with_suffix(file.suffix + '.tmp')
    with open(temp, 'w', encoding='utf-8') as f:
        json.dump(value, f, ensure_ascii=False)
    os.chmod(temp, 0o600)
    os.replace(temp, file)


class OpenRouterHTTPError(RuntimeError):
    def __init__(self,status,message):
        self.status=status
        self.safe_message=re.sub(r'\bsk-[A-Za-z0-9_-]+','[REDACTED]',str(message))[:600]
        super().__init__('OpenRouter HTTP '+str(status)+': '+self.safe_message)


class Transport:
    def __init__(self, data, sender=None, poll_seconds=60):
        self.data = data
        self.sender = sender or self.http
        self.directory = Path(data['directory']) / 'request-cache'
        self.jobs = Path(data.get('jobDirectory') or self.directory / 'batches')
        self.calls = []
        self.pending = {}
        self.inflight = {}
        self.worker = None
        self.poll_seconds = poll_seconds
        self.rerank_failed = False
        self.fatal_error = None
        self.blocked_reported = False

    async def http(self, method, endpoint, body=None):
        key = os.environ.get('OPENROUTER_API_KEY')
        if not key:
            raise RuntimeError('OPENROUTER_API_KEY is required')
        def send():
            req = urllib.request.Request(self.data.get('baseURL', 'https://openrouter.ai/api/v1') + endpoint,
                data=json.dumps(body).encode() if body is not None else None, method=method,
                headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
            try:
                with urllib.request.urlopen(req, timeout=120) as response:
                    return json.load(response)
            except urllib.error.HTTPError as error:
                try:
                    payload=json.loads(error.read());detail=payload.get('error',{});message=detail.get('message',str(error)) if isinstance(detail,dict) else str(detail)
                except Exception:
                    message=str(error.reason)
                raise OpenRouterHTTPError(error.code,message) from None
        return await asyncio.to_thread(send)

    def receipt(self, **row):
        row['at'] = time.time()
        self.calls.append(row)
        file = Path(self.data['directory']) / 'api-calls.jsonl'
        file.parent.mkdir(parents=True, exist_ok=True)
        with open(file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(row) + '\n')
        os.chmod(file, 0o600)

    def validate(self, body, result):
        if not isinstance(result, dict) or result.get('error'):
            raise RuntimeError('Malformed or failed OpenRouter response')
        actual = result.get('model')
        aliases = json.loads((Path(__file__).parent / 'model-aliases.json').read_text())
        expected = body['model']
        if actual and actual.lower() != expected.lower() and not any(
            x['model'].lower() == actual.lower() and x['provider'].lower() == str(result.get('provider', '')).lower()
            for x in aliases.get(expected.lower(), [])):
            raise RuntimeError('Unexpected model substitution')
        if body.get('messages') and (not result.get('choices') or not isinstance(result['choices'][0].get('message',{}).get('content'),str) or not result['choices'][0]['message']['content'].strip()):
            raise RuntimeError('Missing LLM content')
        for choice in result.get('choices', []):
            if choice.get('finish_reason') in ('length', 'content_filter'):
                raise RuntimeError('Incomplete LLM response')

    def trip(self,error):
        status=getattr(error,'status',getattr(error,'code',None))
        if status in (400,401,402,403,404,413,422):
            self.fatal_error=error

    async def request(self, endpoint, body, role, batch=False):
        if self.fatal_error:
            if not self.blocked_reported:
                self.receipt(stage='circuit',status='blocked',error=str(self.fatal_error))
                self.blocked_reported=True
            raise RuntimeError('OpenRouter circuit is open; fix the recorded billing/access/request error before explicit resume')
        body = dict(body)
        if self.data.get('provider'):
            body['provider'] = self.data['provider']
        key = fingerprint({'endpoint': endpoint, 'body': body, 'baseURL': self.data.get('baseURL')})
        file = self.directory / (key + '.json')
        self.receipt(stage=role, status='attempted', model=body['model'], requestHash=key, transport='batch' if batch else 'sync')
        if file.exists():
            result = json.loads(file.read_text())
            self.validate(body, result)
            self.receipt(stage=role, status='cached', model=body['model'], actualModel=result.get('model'), provider=result.get('provider'), savedUsage=result.get('usage'), localCost=0, requestHash=key)
            return result
        try:
            if batch:
                if key not in self.inflight:
                    self.inflight[key] = asyncio.get_running_loop().create_future()
                    self.pending[key] = (body, self.inflight[key])
                future = self.inflight[key]
                if self.worker is None or self.worker.done():
                    self.worker = asyncio.create_task(self.flush())
                result = await asyncio.shield(future)
            else:
                result = await self.sender('POST', endpoint, body)
            self.validate(body, result)
            write_json(file, result)
            self.receipt(stage=role, status='succeeded', endpoint=endpoint, model=body['model'], actualModel=result.get('model'),
                         provider=result.get('provider'), usage=result.get('usage'), requestHash=key)
            return result
        except Exception as error:
            self.trip(error)
            self.receipt(stage=role, status='failed', model=body['model'], requestHash=key, error=type(error).__name__, httpStatus=getattr(error,'status',getattr(error,'code',None)), detail=getattr(error,'safe_message',None))
            raise
        finally:
            if key in self.inflight and self.inflight[key].done():
                self.inflight.pop(key, None)

    async def flush(self):
        # Coalesce concurrently outstanding native extraction/merge calls. Later
        # gleaning and merge dependencies naturally create subsequent waves.
        while self.pending:
            await asyncio.sleep(0.25)
            wave = dict(list(self.pending.items())[:64])
            for key in wave:
                self.pending.pop(key)
            wave_hash = fingerprint(sorted(wave))
            journal = self.jobs / (wave_hash + '.json')
            fresh={}
            try:
                if self.fatal_error:raise self.fatal_error
                # Individual request anchors survive a restart whose scheduling
                # groups the same requests into different waves.
                anchored = []
                for key in wave:
                    anchor = self.jobs / ('request-' + key + '.json')
                    if anchor.exists():
                        previous = json.loads(anchor.read_text())
                        if previous.get('status') in ('failed','rejected') and self.data.get('resume'):
                            anchor.unlink()  # Only an explicitly resumed, definitively failed row may be retried.
                        else:
                            anchored.append(previous)
                batch_ids = {a.get('id') for a in anchored if a.get('id')}
                if any(not a.get('id') for a in anchored):
                    raise RuntimeError('Ambiguous batch submission; operator reconciliation required, no automatic resubmission')
                fresh = {k:v for k,v in wave.items() if not (self.jobs / ('request-' + k + '.json')).exists()}
                if fresh:
                    for key in fresh:
                        write_json(self.jobs / ('request-' + key + '.json'), {'status': 'submitting'})
                    first = next(iter(fresh.values()))[0]
                    payload = {'endpoint': '/v1/chat/completions', 'model': first['model'],
                               'requests': [{'custom_id': key, 'body': body} for key, (body, _) in fresh.items()]}
                    if self.data.get('provider'):
                        payload['provider'] = {k:v for k,v in self.data['provider'].items() if k in ('only','allow_fallbacks')}
                    result = await self.sender('POST', '/batches', payload)
                    if not result.get('id'):
                        raise RuntimeError('Batch submission returned no ID')
                    batch_ids.add(result['id'])
                    for key in fresh:
                        write_json(self.jobs / ('request-' + key + '.json'), {'id': result['id']})
                    write_json(journal, {'id': result['id'], 'requests': list(fresh)})
                for batch_id in batch_ids:
                    terminal = self.jobs / (batch_id + '-results.json')
                    if terminal.exists():
                        result = json.loads(terminal.read_text())
                    else:
                        while True:
                            result = await self.sender('GET', '/batches/' + batch_id)
                            self.receipt(stage='batch', status=result.get('status'), batchId=batch_id, requestCounts=result.get('request_counts'))
                            if result.get('status') in ('completed', 'failed', 'expired', 'cancelled'):
                                if result.get('status') != 'completed' or result.get('results') is not None:
                                    break
                            await asyncio.sleep(self.poll_seconds)
                        write_json(terminal, result)
                    rows = {row['custom_id']: row for row in result.get('results', [])}
                    for key, (body, future) in wave.items():
                        anchor = self.jobs / ('request-' + key + '.json')
                        if not anchor.exists() or json.loads(anchor.read_text()).get('id') != batch_id:
                            continue
                        row = rows.get(key)
                        try:
                            if row is None or row.get('error'):
                                raise RuntimeError('Batch row failed or was omitted: ' + key)
                            response = row.get('response', {}).get('body')
                            self.validate(body, response)
                            write_json(self.directory / (key + '.json'), response)
                            if not future.done():
                                future.set_result(response)
                        except Exception as error:
                            write_json(anchor, {'id':batch_id, 'status':'failed', 'error':str(error)})
                            if not future.done():
                                future.set_exception(error)
                if any(not future.done() for _,future in wave.values()):
                    raise RuntimeError('Batch omitted request results')
            except Exception as error:
                self.trip(error)
                if getattr(error,'status',getattr(error,'code',None)) in (400,401,402,403,404,413,422):
                    for key in fresh:
                        anchor=self.jobs / ('request-'+key+'.json')
                        if anchor.exists() and not json.loads(anchor.read_text()).get('id'):
                            write_json(anchor,{'status':'rejected','httpStatus':getattr(error,'status',getattr(error,'code',None))})
                for _,future in wave.values():
                    if not future.done():
                        future.set_exception(error)
