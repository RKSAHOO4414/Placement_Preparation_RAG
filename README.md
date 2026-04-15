# Placement Prep RAG

An AI-powered placement preparation system built using **Retrieval-Augmented Generation (RAG)** to deliver context-aware answers and adaptive quizzes from user-provided study materials.

---

## What This Project Does

* Ingests PDFs (DSA, OS, DBMS, CN, Aptitude)
* Converts content into embeddings
* Stores them in a vector database
* Retrieves relevant chunks for each query
* Generates grounded answers using an LLM with citations

---

## Core Features

* **Context-Aware Chat**
  Answers are generated strictly from uploaded documents

* **AI-Generated Quizzes**
  Dynamic question generation with explanations

* **Document Ingestion Pipeline**
  Upload → chunk → embed → index

* **Source Attribution**
  Includes document name, page number, and relevance score

* **Streaming Responses**
  Real-time token streaming using SSE

---

## Tech Stack

### Backend

* FastAPI (Python)
* Qdrant (Vector Database)
* Sentence Transformers (`all-MiniLM-L6-v2`)
* LangChain
* PyPDF2
* OpenAI-compatible APIs (Groq / Ollama)

### Frontend

* React + TypeScript (Vite)
* Server-Sent Events (SSE)
* Minimal CSS

---

## Architecture

```
User Query
   ↓
Embedding Model
   ↓
Qdrant (Vector Search)
   ↓
Relevant Chunks Retrieved
   ↓
LLM (Answer Generation)
   ↓
Response with Citations
```

---

## Setup Instructions

### Prerequisites

* Python 3.9+
* Node.js 16+
* Qdrant running

---

### Backend Setup

```
cd backend

python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
```

Set environment variables:

```
GROQ_API_KEY=your_api_key
QDRANT_HOST=localhost
QDRANT_PORT=6333
```

Run backend:

```
uvicorn app.main:app --reload
```

---

### Frontend Setup

```
cd frontend
npm install
npm run dev
```

---

## Project Structure

```
backend/
  app/
  requirements.txt

frontend/
  src/
  package.json
```

---

## What This Project Demonstrates

* RAG architecture implementation
* Semantic search with vector DB
* LLM integration with grounding
* Full-stack development
* Real-time streaming (SSE)

---

## Limitations

* Retrieval depends on chunking quality
* No authentication (if not implemented)
* No evaluation metrics for answer quality

---

## Future Improvements

* Add authentication (JWT)
* Improve retrieval (hybrid search / reranking)
* Add evaluation pipeline
* Deploy using Docker + cloud

---
