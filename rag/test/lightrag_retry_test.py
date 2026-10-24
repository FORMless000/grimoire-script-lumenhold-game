"""Mock the native scheduling API; no model/network calls or native install needed."""
import asyncio
import importlib.util
import sys
import types
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("retry", Path(__file__).parent.parent / "src/lightrag_retry.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RetryTests(unittest.IsolatedAsyncioTestCase):
    async def test_retry_uses_native_fence_and_enqueues_only_missing_sources(self):
        calls = []
        async def missing(keys):
            self.assertEqual(keys, {"event:old", "event:new"})
            return {"event:new"}
        async def enqueue(texts, **kwargs):
            calls.append(("enqueue", texts, kwargs))
        async def process():
            calls.append(("process",))
        async def data(*args, **kwargs):
            return {"native": True}
        async def ingress(*args):
            return "native-ingress"
        async def commit(status, lock, queue, request, state):
            self.assertEqual(queue, "native-ingress")
            state["committed"] = True
            calls.append(("commit",))
        shared = types.ModuleType("lightrag.kg.shared_storage")
        shared.get_namespace_data = data
        shared.get_namespace_lock = lambda *a, **kw: "native-lock"
        shared.get_pipeline_ingress = ingress
        shared.commit_manual_retry_request = commit
        routing = types.ModuleType("lightrag.parser.routing")
        routing.resolve_chunk_options = lambda addon, **kw: {"fixed_token": True, **kw}
        sys.modules[shared.__name__] = shared
        sys.modules[routing.__name__] = routing
        rag = types.SimpleNamespace(
            full_docs=types.SimpleNamespace(filter_keys=missing), addon_params={},
            workspace="fixture", apipeline_enqueue_documents=enqueue,
            apipeline_process_enqueue_documents=process,
        )
        await module.insert_documents(rag, [{"key": "event:old", "text": "old"}, {"key": "event:new", "text": "new"}])
        self.assertEqual([r[0] for r in calls], ["enqueue", "commit", "process"])
        self.assertEqual(calls[0][1], ["new"])
        self.assertEqual(calls[0][2]["file_paths"], ["event:new"])
        self.assertEqual(calls[0][2]["chunk_options"]["split_by_character_only"], False)
        async def refused(*args):
            return "native fence refused"
        shared.commit_manual_retry_request = refused
        with self.assertRaisesRegex(RuntimeError, "refused"):
            await module.insert_documents(rag, [{"key": "event:old", "text": "old"}, {"key": "event:new", "text": "new"}])
        self.assertEqual([r[0] for r in calls].count("process"), 1)


if __name__ == "__main__":
    unittest.main()
