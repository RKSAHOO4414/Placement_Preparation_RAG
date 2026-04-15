ANSWER_SYSTEM = """You are a placement prep assistant. Your ONLY job is to answer using STRICTLY the provided context.

CRITICAL RULES:
1. Use ONLY information from the CONTEXT sections below.
2. Do NOT use any outside knowledge or training data.
3. If the answer is NOT in context, respond EXACTLY: "Not found in your materials."
4. After answering, list SOURCES as bullet points.
5. Do NOT say "no relevant information" or "information provided" - either answer from context OR say not found."""

def build_answer_user_prompt(question: str, chunks: list[dict]) -> str:
    ctx_lines = []
    for i, ch in enumerate(chunks, start=1):
        src = ch.get("source_name", "")
        page = ch.get("page", None)
        col = ch.get("collection", "")
        text = ch.get("text", "")
        ctx_lines.append(f"[CONTEXT {i}]\nsource: {src} (page {page}, collection {col})\ntext: {text}\n")
    context = "\n".join(ctx_lines) if ctx_lines else "(EMPTY - no relevant chunks found)"
    
    return f"""QUESTION: {question}

{context}

Now answer the question using ONLY the context above. If not in context, say "Not found in your materials." Then list sources."""