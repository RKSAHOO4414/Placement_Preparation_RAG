from qdrant_client import QdrantClient
from qdrant_client.http import models as qm

def get_client(qdrant_url: str) -> QdrantClient:
    return QdrantClient(url=qdrant_url)

def ensure_collection(client: QdrantClient, name: str, vector_size: int):
    existing = [c.name for c in client.get_collections().collections]
    if name in existing:
        return
    client.create_collection(
        collection_name=name,
        vectors_config=qm.VectorParams(size=vector_size, distance=qm.Distance.COSINE),
    )