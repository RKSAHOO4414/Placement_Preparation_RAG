# RAG Placement Coach

An AI-powered placement preparation system using **Retrieval-Augmented Generation (RAG)** to generate practice materials and quizzes from student-uploaded PDFs.

---

## Features

### 1. **Context-Aware Chat**
- Ask questions about uploaded study materials
- Answers grounded in documents (no hallucination)
- Real-time streaming responses via SSE
- Source citations (document name, page, relevance score)

### 2. **AI-Generated Quizzes**
- 5-question quizzes generated from selected topics
- Multiple choice with explanations
- Immediate feedback on answers
- Score tracking

### 3. **Document Management**
- Upload PDFs by collection (DSA, OS, DBMS, CN, Aptitude)
- Automatic chunking & embedding
- Vector indexing in Qdrant

---

## Architecture

```
PDF Upload
   ↓
Chunking (recursive, 512 tokens)
   ↓
Embedding (all-MiniLM-L6-v2)
   ↓
Qdrant (Vector Database)
   ↓
---
Query
   ↓
Embed Query
   ↓
Semantic Search (top-k retrieval)
   ↓
LLM Generation (Groq API)
   ↓
Stream Response + Citations
```

---

## Tech Stack

**Backend:**
- FastAPI (async Python)
- Qdrant (vector DB)
- Sentence Transformers (all-MiniLM-L6-v2, 384-dim)
- Groq API (LLM inference)
- PyPDF2 (PDF extraction)

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Server-Sent Events (streaming)
- Fetch API

---

## Setup

### 1. Install Qdrant (local)

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

Or download: https://qdrant.tech/documentation/quick-start/

### 2. Backend Setup

```bash
cd backend

# Create virtual env
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

**Environment variables** (`backend/.env`):
```
GROQ_API_KEY=gsk_your_key_here
QDRANT_HOST=127.0.0.1
QDRANT_PORT=6333
LLM_MODEL=mixtral-8x7b-32768
```

**Run backend:**
```bash
uvicorn app.main:app --reload --port 8000
```

Backend runs at: `http://127.0.0.1:8000`

### 3. Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Usage

### Chat Mode
1. Upload PDFs (select collection: DSA, OS, DBMS, etc.)
2. Select topic checkboxes
3. Ask questions in natural language
4. Get answers with source citations

### Quiz Mode
1. Select topics
2. Click "Generate Quiz"
3. Answer 5 questions
4. See score and explanations

---

## Project Structure

```
rag-placement-coach/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry
│   │   ├── config.py               # Settings (LLM, Qdrant)
│   │   ├── api/
│   │   │   ├── routes_chat.py      # POST /chat/stream
│   │   │   ├── routes_upload.py    # POST /upload (PDF ingestion)
│   │   │   └── routes_quiz.py      # POST /quiz/generate
│   │   └── rag/
│   │       ├── retrieve.py         # Semantic search + filtering
│   │       ├── chunk.py            # PDF → chunks
│   │       └── embed.py            # Embedding wrapper
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Main app (Chat/Quiz nav)
│   │   ├── pages/
│   │   │   ├── Chat.tsx            # Chat interface
│   │   │   └── Quiz.tsx            # Quiz interface
│   │   ├── api/
│   │   │   └── client.ts           # Fetch + SSE streaming
│   │   └── main.tsx                # React entry
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## API Endpoints

### Chat
```
POST /chat/stream
{
  "question": "what is binary search?",
  "collections": ["DSA"],
  "top_k": 6
}

Response (Server-Sent Events):
event: sources
data: [{"source_name": "...", "page": 5, "score": 0.84}]

event: token
data: "Binary"

event: token
data: " search"
...

event: done
data: [DONE]
```

### Quiz
```
POST /quiz/generate
{
  "collections": ["DSA", "OS"],
  "num_questions": 5,
  "difficulty": "medium"
}

Response:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correct_option": 1,
    "explanation": "..."
  }
]
```

### Upload
```
POST /upload
multipart/form-data:
  file: <PDF>
  collection: "DSA"

Response:
{"message": "Uploaded and indexed 45 chunks"}
```

---

## Known Issues & Solutions

### "Not found in your materials"
- **Cause:** Collection name mismatch or weak retrieval
- **Fix:** Verify collection name matches in UI and backend

### SSE Stream hangs
- **Cause:** JSON parsing error in React
- **Fix:** Ensure tokens are JSON.parse() wrapped

### Qdrant connection error
- **Cause:** Qdrant not running
- **Fix:** Start Qdrant: `docker run -p 6333:6333 qdrant/qdrant`

---

## Future Roadmap

- [ ] Performance analytics (score trends, weak topics)
- [ ] Quiz history & retry
- [ ] Timed quiz mode
- [ ] User authentication (JWT)
- [ ] Hybrid search (keyword + semantic)
- [ ] Reranking with cross-encoder
- [ ] Docker Compose deployment
- [ ] Conversation memory (multi-turn chat)

---

## Performance

- **Embedding:** ~10ms per query (GPU: <5ms)
- **Search:** ~50ms for top-10 retrieval
- **LLM Generation:** ~2-5s (Groq API)
- **Total Response:** ~7-10s (streaming in real-time)

---

## License

MIT

---

## Author

Built by RKSAHOO4414
