"""JSON stdin/stdout bridge; dependencies belong in an isolated LightRAG venv.

Only original parent IDs leave this process. Extracted relation descriptions are
search aids, never authoritative evidence or generated answers.
"""
import asyncio
import contextlib
import importlib.metadata
import json
import os
import sys
import urllib.request


async def main(data):
    import numpy as np
    from lightrag import LightRAG, QueryParam
    from lightrag.utils import EmbeddingFunc

    models = data["models"]
    calls = []
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        raise ValueError("OPENROUTER_API_KEY is required")

    async def request(endpoint, body):
        if data.get("provider"):
            body["provider"] = data["provider"]
        def send():
            req = urllib.request.Request(
                data.get("baseURL", "https://openrouter.ai/api/v1") + endpoint,
                data=json.dumps(body).encode(),
                headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=120) as response:
                return json.load(response)
        result = await asyncio.to_thread(send)
        if result.get("error"):
            raise ValueError("OpenRouter returned an error")
        if result.get("model") and result["model"] != body["model"]:
            raise ValueError("Unexpected model substitution")
        calls.append({"endpoint": endpoint, "model": body["model"], "actualModel": result.get("model"), "provider": result.get("provider"), "usage": result.get("usage")})
        return result

    async def embed(texts):
        result = await request("/embeddings", {"model": models["embedding"], "input": texts})
        rows = sorted(result["data"], key=lambda r: r["index"])
        if len(rows) != len(texts) or [r["index"] for r in rows] != list(range(len(texts))):
            raise ValueError("Malformed embedding response")
        return np.array([r["embedding"] for r in rows])

    async def llm(prompt, system_prompt=None, history_messages=None, **kwargs):
        messages = ([{"role": "system", "content": system_prompt}] if system_prompt else []) + (history_messages or []) + [{"role": "user", "content": prompt}]
        result = await request("/chat/completions", {"model": models["helper"], "messages": messages, "temperature": 0, "max_tokens": 4096})
        return result["choices"][0]["message"]["content"]

    async def rerank(query, documents, top_n=None, **kwargs):
        result = await request("/rerank", {"model": models["reranker"], "query": query, "documents": [{"text": d} for d in documents], "top_n": top_n or len(documents)})
        return result.get("results", result.get("data"))

    version = importlib.metadata.version("lightrag-hku")
    if data.get("identity") and (data["identity"]["version"] != version or data["identity"]["models"] != models):
        raise ValueError("LightRAG runtime/model identity changed; rebuild the index")
    dims = data.get("identity", {}).get("dimensions") if data.get("identity") else None
    if dims is None:
        dims = len((await embed(["embedding dimension probe"]))[0])
    rag = LightRAG(working_dir=data["directory"], llm_model_func=llm,
                   embedding_func=EmbeddingFunc(embedding_dim=dims, max_token_size=8192, func=embed),
                   rerank_model_func=rerank, kv_storage="JsonKVStorage", graph_storage="NetworkXStorage",
                   vector_storage="NanoVectorDBStorage", doc_status_storage="JsonDocStatusStorage")
    await rag.initialize_storages()
    try:
        if data["action"] == "index":
            await rag.ainsert([r["text"] for r in data["records"]], ids=[r["key"] for r in data["records"]], file_paths=[r["key"] for r in data["records"]])
            return {"backend": "lightrag", "version": version, "models": models, "dimensions": dims, "calls": calls}
        result = await rag.aquery_data(data["query"], param=QueryParam(mode="mix", chunk_top_k=40, top_k=40, enable_rerank=True))
        if result.get("status") == "failure":
            raise ValueError("LightRAG retrieval failed")
        chunks = result.get("data", {}).get("chunks", [])
        hits = []
        for i, chunk in enumerate(chunks):
            parent = chunk.get("file_path")
            if not isinstance(parent, str) or ":" not in parent:
                raise ValueError("LightRAG chunk has no unambiguous parent source")
            hits.append({"key": parent, "score": 1 / (i + 1), "reason": "LightRAG mix retrieval (source parent)"})
        return {"hits": hits, "calls": calls}
    finally:
        await rag.finalize_storages()


if __name__ == "__main__":
    try:
        payload = json.load(sys.stdin)
        with contextlib.redirect_stdout(sys.stderr):
            answer = asyncio.run(main(payload))
        print(json.dumps(answer))
    except Exception as error:
        # Never include HTTP bodies or environment credentials in exported logs.
        print("LightRAG bridge failed: " + type(error).__name__ + ". Check the isolated installation and API configuration.", file=sys.stderr)
        sys.exit(1)
