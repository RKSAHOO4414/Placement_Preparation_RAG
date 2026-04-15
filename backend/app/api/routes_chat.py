import json
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest
from app.rag.prompts import ANSWER_SYSTEM, build_answer_user_prompt
from app.rag.retrieve import build_filter
from app.config import settings

router = APIRouter(prefix="/chat", tags=["chat"])

def sse(event: str, data) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"

def payload_from_point(p):
    pl = p.payload or {}
    return {
        "score": float(p.score),
        "source_name": str(pl.get("source_name", "")),
        "page": pl.get("page"),
        "collection": str(pl.get("collection", "")),
        "text": str(pl.get("text", "")),
    }

@router.post("/stream")
async def chat_stream(req: ChatRequest, request: Request):
    core = request.app.state.core
    qdrant = core.qdrant
    embedder = core.embedder
    llm = core.llm

    qvec = embedder.embed([req.question])[0]
    flt = build_filter(req.collections)

    # Use query_points (since you already fixed your client mismatch)
    res = qdrant.query_points(
        collection_name=settings.qdrant_collection,
        query=qvec,
        query_filter=flt,
        limit=req.top_k,
        with_payload=True,
    )

    chunks = [payload_from_point(p) for p in res.points]

    # guardrails
    if not chunks or chunks[0]["score"] < 0.25:
        async def gen_refuse():
            yield sse("sources", [])
            yield sse("token", "Not found in your materials.")
            yield sse("done", "[DONE]")
        return StreamingResponse(gen_refuse(), media_type="text/event-stream")

    sources = [
        {k: c[k] for k in ("source_name", "page", "collection", "score")}
        for c in chunks
    ]
    user_prompt = build_answer_user_prompt(req.question, chunks)

    async def gen():
    yield sse("sources", sources)
    async for tok in llm.stream_chat_completions(...):
        # Important: JSON-encode the token so parser can safely JSON.parse it
        yield sse("token", tok)  # sse() already JSON.dumps, so this is correct
    yield sse("done", "[DONE]")

    return StreamingResponse(gen(), media_type="text/event-stream")

async def gen():
    yield sse("sources", sources)
    full_answer = ""
    async for tok in llm.stream_chat_completions(...):
        full_answer += tok
        yield sse("token", tok)
    
    # SAFETY: if model still ignores instructions, catch it
    if "not found" in full_answer.lower() and len(sources) > 0 and sources[0]["score"] > 0.3:
        # Model is confused; force override
        yield sse("token", "\n\n[NOTE: Retrieval found relevant chunks but model is uncertain. Check sources above.]")
    
    yield sse("done", "[DONE]")

@router.get("")
def list_documents(request: Request):
    """List all uploaded documents with collection info."""
    core = request.app.state.core
    qdrant = core.qdrant
    
    # Scroll through all points to get unique docs
    seen = {}
    offset = 0
    limit = 100
    
    while True:
        res = qdrant.scroll(
            collection_name=settings.qdrant_collection,
            limit=limit,
            offset=offset,
            with_payload=True,
        )
        
        if not res[0]:
            break
        
        for p in res[0]:
            pl = p.payload or {}
            doc_id = pl.get("doc_id")
            if doc_id and doc_id not in seen:
                seen[doc_id] = {
                    "doc_id": doc_id,
                    "source_name": str(pl.get("source_name", "")),
                    "collection": str(pl.get("collection", "")),
                    "source_type": str(pl.get("source_type", "")),
                }
        
        offset += limit
    
    return list(seen.values())