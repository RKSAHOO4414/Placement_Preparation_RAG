from dataclasses import dataclass
from qdrant_client import QdrantClient
from app.rag.embeddings import Embedder
from app.rag.llm_clients import OpenAICompatClient

@dataclass
class AppState:
    qdrant: QdrantClient
    embedder: Embedder
    llm: OpenAICompatClient