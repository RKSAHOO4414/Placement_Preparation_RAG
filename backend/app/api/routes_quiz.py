import json
from fastapi import APIRouter, Request
from pydantic import BaseModel
from app.config import settings
from app.rag.retrieve import build_filter

router = APIRouter(prefix="/quiz", tags=["quiz"])

class QuizRequest(BaseModel):
    collections: list[str]
    num_questions: int = 5
    difficulty: str = "medium"  # easy, medium, hard

@router.post("/generate")
async def generate_quiz(req: QuizRequest, request: Request):
    """Generate quiz questions from collection materials."""
    core = request.app.state.core
    qdrant = core.qdrant
    embedder = core.embedder
    llm = core.llm
    
    # 1. Retrieve diverse chunks from collections using random keywords
    flt = build_filter(req.collections)
    keywords = ["concept", "definition", "algorithm", "data structure", "key point"]
    
    all_chunks = []
    for keyword in keywords:
        res = qdrant.query_points(
            collection_name=settings.qdrant_collection,
            query=embedder.embed([keyword])[0],
            query_filter=flt,
            limit=req.num_questions * 2,
            with_payload=True,
        )
        all_chunks.extend([p.payload.get("text", "") for p in res.points])
    
    # Remove duplicates and get unique chunks
    unique_chunks = list(set(all_chunks))[:req.num_questions * 2]
    
    # 2. Generate questions via LLM
    system_prompt = """You are an expert in generating multiple-choice placement preparation quiz questions. 
Generate technically accurate, well-structured questions with clear options."""
    
    user_prompt = f"""Generate {req.num_questions} {req.difficulty} placement exam prep quiz questions from these materials:

{chr(10).join(f'- {c[:250]}' for c in unique_chunks[:req.num_questions * 2])}

Return ONLY valid JSON (no markdown, no explanation), format exactly as:
[{{"question": "What is...", "options": ["A) option1", "B) option2", "C) option3", "D) option4"], "correct_option": 0, "explanation": "Brief explanation..."}}]"""
    
    questions_json = await llm.get_completion(system_prompt, user_prompt, temperature=0.7)
    
    # Parse and clean JSON
    try:
        questions = json.loads(questions_json)
        return questions
    except json.JSONDecodeError:
        # Try to extract JSON if wrapped in markdown
        import re
        match = re.search(r"\[.*\]", questions_json, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise