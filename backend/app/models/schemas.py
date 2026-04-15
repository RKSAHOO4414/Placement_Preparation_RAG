from pydantic import BaseModel
from typing import List, Optional

class RetrieveRequest(BaseModel):
    question: str
    collections: List[str]
    top_k: int = 6

class RetrievedChunk(BaseModel):
    score: float
    source_name: str
    page: Optional[int] = None
    collection: str
    text: str

class ChatRequest(BaseModel):
    question: str
    collections: List[str]
    top_k: int = 6

class ChatResponse(BaseModel):
    answer: str
    sources: List[RetrievedChunk]