# Placement Prep RAG

An AI-powered placement preparation system built using **Retrieval-Augmented Generation (RAG)** to deliver context-aware answers and adaptive quizzes from user-provided study materials.

---

## What This Project Does

This is not just a chatbot.

- Ingests PDFs (DSA, OS, DBMS, CN, Aptitude)
- Converts content into embeddings
- Stores them in a vector database
- Retrieves relevant chunks at query time
- Uses an LLM to generate **grounded answers with citations**

---

## Core Features

- **Context-Aware Chat**  
  Ask questions and get answers strictly grounded in your uploaded documents

- **AI-Generated Quizzes**  
  Dynamically generates questions from your material with explanations

- **Document Ingestion Pipeline**  
  Upload PDFs → chunking → embedding → indexing

- **Source Attribution**  
  Every response includes:
  - document reference
  - page number
  - relevance score

- **Streaming Responses**  
  Token-level streaming using SSE for real-time interaction

---

## Tech Stack

### Backend
- FastAPI (Python)
- Qdrant (Vector Database)
- Sentence Transformers (`all-MiniLM-L6-v2`)
- LangChain
- PyPDF2
- OpenAI-compatible APIs (Groq / Ollama)

### Frontend
- React + TypeScript (Vite)
- Server-Sent Events (SSE)
- Minimal styling

---

## Architecture (High-Level)

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


---

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 16+
- Qdrant running

---

### Backend Setup

```bash
cd backend

python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
