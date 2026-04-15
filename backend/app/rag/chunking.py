def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200):
    text = text.replace("\x00", " ").strip()
    if not text:
        return []
    chunks = []
    i = 0
    while i < len(text):
        j = min(len(text), i + chunk_size)
        chunks.append(text[i:j])
        if j == len(text):
            break
        i = max(0, j - overlap)
    return chunks