# RAG Document Q&A System

Upload PDFs -> ask questions -> get answers with page citations.

This is a beginner-friendly, portfolio-ready GenAI project using a fully free stack:

- LLM: Gemini 2.0 Flash
- Embeddings: `text-embedding-004`
- Vector DB: ChromaDB (local)
- Backend: FastAPI + LangChain
- Frontend: Next.js
- PDF parser: PyMuPDF

## Why this project matters

This is one of the most practical GenAI interview projects for fresher roles. It demonstrates:

- document processing
- retrieval augmented generation (RAG)
- vector search
- grounded answers with citations
- full-stack deployment thinking

## Project Structure

```bash
Rag-QA-System/
  backend/
    app/
      main.py
      rag.py
    requirements.txt
    .env.example
  frontend/
    app/
      layout.tsx
      page.tsx
      globals.css
    lib/
      api.ts
    package.json
    tsconfig.json
    .env.local.example
```

## 1) Backend Setup (FastAPI)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Add your Google API key in `backend/.env`:

```env
GOOGLE_API_KEY=your_real_key_here
```

Run backend:

```bash
uvicorn app.main:app --reload --port 8000
```

Health check: `http://127.0.0.1:8000/health`

## 2) Frontend Setup (Next.js)

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open: `http://localhost:3000`

## 3) How to use

1. Upload a PDF from the UI.
2. Ask a question in plain English.
3. Get an answer plus source citations (`filename + page`).

## API Endpoints

- `POST /upload` -> upload and index one PDF
- `POST /ask` -> answer with citations
- `POST /ask/stream` -> token streaming (SSE) with citations at end
- `GET /health` -> health check

## Resume Bullet (Use this)

Built a RAG Document Q&A System using LangChain + Gemini 2.0 Flash + ChromaDB with page-level citations and streaming-ready backend endpoints. Developed FastAPI backend and Next.js frontend and prepared deployment flow for Render (API) and Vercel (UI).

## GitHub Showcase Checklist

- [ ] Add architecture diagram in `docs/architecture.png`
- [ ] Add sample questions and screenshots in `README`
- [ ] Record a 60-90 second demo video
- [ ] Add deployment links (Vercel + Render)
- [ ] Pin this repository on your GitHub profile

## Next upgrades (good for interviews)

- multi-file upload and file management
- citation highlighting in PDF viewer
- conversation memory
- hybrid search (keyword + vector)
- auth + per-user document spaces

---

If you are new, start by getting local upload + question answering working first. That alone is a strong project.
