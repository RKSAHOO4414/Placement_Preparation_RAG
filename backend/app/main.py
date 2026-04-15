import os, uuid, tempfile
import json
from fastapi import FastAPI, UploadFile, File, Form, Request
from qdrant_client.http import models as qm
from dataclasses import dataclass
from qdrant_client import QdrantClient

from app.config import settings
from app.rag.qdrant_store import get_client, ensure_collection
from app.rag.embeddings import Embedder
from app.rag.loaders import load_pdf_pages
from app.rag.chunking import chunk_text
from app.rag.retrieve import build_filter
from app.models.schemas import RetrieveRequest, RetrievedChunk
from app.api.cors import add_cors
from fastapi.responses import StreamingResponse
from app.rag.llm_clients import OpenAICompatClient
from app.rag.prompts import ANSWER_SYSTEM, build_answer_user_prompt
from app.models.schemas import ChatRequest
from app.api import routes_quiz

@dataclass
class AppState:
    qdrant: QdrantClient
    embedder: Embedder
    llm: OpenAICompatClient

app = FastAPI()
add_cors(app)

# Register routers
app.include_router(routes_quiz.router)

client = get_client(settings.qdrant_url)
embedder = Embedder(settings.embedding_model)
ensure_collection(client, settings.qdrant_collection, embedder.dim)

llm = OpenAICompatClient(
    base_url=settings.llm_base_url,
    api_key=settings.llm_api_key,
    model=settings.llm_model,
)

app.state.core = AppState(qdrant=client, embedder=embedder, llm=llm)

@app.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    collections: str = Form(...),  # comma-separated
):
    doc_id = str(uuid.uuid4())
    cols = [c.strip() for c in collections.split(",") if c.strip()]
    if not cols:
        return {"error": "No collections provided."}

    suffix = os.path.splitext(file.filename)[1].lower()
    with tempfile.TemporaryDirectory() as td:
        path = os.path.join(td, file.filename)
        with open(path, "wb") as f:
            f.write(await file.read())

        points = []
        payloads = []
        texts = []

        if suffix == ".pdf":
            for page_num, page_text in load_pdf_pages(path):
                for ci, ch in enumerate(chunk_text(page_text)):
                    texts.append(ch)
                    payloads.append({
                        "doc_id": doc_id,
                        "collection": cols[0],  # NOTE: keep MVP simple: one primary collection per doc
                        "source_name": file.filename,
                        "source_type": "pdf",
                        "page": page_num,
                        "chunk_index": ci,
                        "text": ch
                    })
        else:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                txt = f.read()
            for ci, ch in enumerate(chunk_text(txt)):
                texts.append(ch)
                payloads.append({
                    "doc_id": doc_id,
                    "collection": cols[0],
                    "source_name": file.filename,
                    "source_type": "text",
                    "page": None,
                    "chunk_index": ci,
                    "text": ch
                })

        vectors = embedder.embed(texts)
        for i, (vec, pl) in enumerate(zip(vectors, payloads)):
            points.append(qm.PointStruct(id=str(uuid.uuid4()), vector=vec, payload=pl))

        client.upsert(collection_name=settings.qdrant_collection, points=points)

    return {"doc_id": doc_id, "chunks": len(points), "collection": cols[0]}

@app.post("/debug/retrieve")
def debug_retrieve(req: RetrieveRequest):
    qvec = embedder.embed([req.question])[0]
    flt = build_filter(req.collections)

    hits = client.query_points(
        collection_name=settings.qdrant_collection,
        query=qvec,
        query_filter=flt,
        limit=req.top_k,
        with_payload=True,
    ).points

    out = []
    for h in hits:
        pl = h.payload or {}
        out.append(RetrievedChunk(
            score=float(h.score),
            source_name=str(pl.get("source_name", "")),
            page=pl.get("page"),
            collection=str(pl.get("collection", "")),
            text=str(pl.get("text", "")),
        ))
    return out


def _payload_from_hit(hit):
    pl = hit.payload or {}
    return {
        "score": float(hit.score),
        "source_name": str(pl.get("source_name", "")),
        "page": pl.get("page"),
        "collection": str(pl.get("collection", "")),
        "text": str(pl.get("text", "")),
    }

@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    # 1) retrieve
    qvec = embedder.embed([req.question])[0]
    flt = build_filter(req.collections)

    hits = client.query_points(
        collection_name=settings.qdrant_collection,
        query=qvec,
        query_filter=flt,
        limit=req.top_k,
        with_payload=True,
    ).points

    chunks = [_payload_from_hit(h) for h in hits]

    # 2) refusal if retrieval is weak
    if not chunks:
        async def gen_empty():
            yield f"event: token\ndata: {json.dumps('Not found in your materials.')}\n\n"
            yield "event: done\ndata: [DONE]\n\n"
        return StreamingResponse(gen_empty(), media_type="text/event-stream")

    # crude threshold: tune later
    if chunks[0]["score"] < 0.25:
        async def gen_low():
            yield f"event: token\ndata: {json.dumps('Not found in your materials.')}\n\n"
            yield "event: done\ndata: [DONE]\n\n"
        return StreamingResponse(gen_low(), media_type="text/event-stream")

    user_prompt = build_answer_user_prompt(req.question, chunks)

    # 3) stream tokens
    async def event_stream():
        # first send sources early (so UI can show them)
        sources_min = [
            {"source_name": c["source_name"], "page": c["page"], "collection": c["collection"], "score": c["score"]}
            for c in chunks
        ]
        yield f"event: sources\ndata: {json.dumps(sources_min)}\n\n"

        async for tok in llm.stream_chat_completions(system=ANSWER_SYSTEM, user=user_prompt):
            # IMPORTANT: SSE data must be single-line or JSON encode it
            yield f"event: token\ndata: {json.dumps(tok)}\n\n"

        yield "event: done\ndata: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.get("/documents")
def get_docs(request: Request):
    return request.app.state.core.qdrant.get_collections()
