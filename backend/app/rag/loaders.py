import fitz  # pymupdf

def load_pdf_pages(file_path: str):
    doc = fitz.open(file_path)
    pages = []
    for idx in range(len(doc)):
        page = doc[idx]
        txt = page.get_text("text")
        pages.append((idx + 1, txt))
    return pages