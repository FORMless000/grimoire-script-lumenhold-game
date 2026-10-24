"""Explicit native failed-document retry; no direct status edits or model changes.

LightRAG 1.5.7 intentionally does not retry FAILED rows on an ordinary ainsert.
Use its fenced manual-retry operation and preserve ainsert's fixed-token options.
"""
from uuid import uuid4


async def insert_documents(rag, records):
    from lightrag.kg.shared_storage import (
        commit_manual_retry_request, get_namespace_data, get_namespace_lock,
        get_pipeline_ingress,
    )
    from lightrag.parser.routing import resolve_chunk_options

    missing = await rag.full_docs.filter_keys({r["key"] for r in records})
    fresh = [r for r in records if r["key"] in missing]
    if fresh:
        options = resolve_chunk_options(
            rag.addon_params, split_by_character=None, split_by_character_only=False
        )
        await rag.apipeline_enqueue_documents(
            [r["text"] for r in fresh], ids=[r["key"] for r in fresh],
            file_paths=[r["key"] for r in fresh], chunk_options=options,
        )
    status = await get_namespace_data("pipeline_status", workspace=rag.workspace)
    lock = get_namespace_lock("pipeline_status", workspace=rag.workspace)
    ingress = await get_pipeline_ingress(rag.workspace)
    state = {"committed": False}
    refusal = await commit_manual_retry_request(status, lock, ingress, uuid4().hex, state)
    if refusal is not None or not state["committed"]:
        raise RuntimeError("Native failed-document retry was refused")
    await rag.apipeline_process_enqueue_documents()
