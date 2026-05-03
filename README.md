# RAG Document Q&A System

Upload PDFs -> ask questions -> get answers with page citations.

This is a beginner-friendly, portfolio-ready GenAI project using a fully free stack:

- LLM: Gemini 2.0 Flash
- Embeddings: `gemini-embedding-001`
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

## Architecture

See `docs/architecture.md` for the system flow diagram.

## Sample Questions

Try these after uploading a document:

- What is the main objective of this document?
- List the key deliverables and deadlines.
- What risks or constraints are mentioned?
- Summarize responsibilities by stakeholder/team.
- Which section discusses payment terms or pricing?


## Deployment Links

Replace placeholders after deployment:

- Frontend (Vercel): `https://your-frontend.vercel.app`
- Backend (Render): `https://your-backend.onrender.com`
- API health check: `https://your-backend.onrender.com/health`

## Deployment (Render + Vercel)

### Backend on Render

This repo includes `render.yaml` for one-click setup.

Manual service config:

- Runtime: Python
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment variable: `GOOGLE_API_KEY=<your_key>`

### Frontend on Vercel

- Import this repo in Vercel
- Set root directory to `frontend`
- Framework preset: Next.js
- Environment variable:
  - `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`

After deploy, verify:

- `GET /health` on backend returns `{"status":"ok"}`
- Frontend can upload a PDF and call `/ask` or `/ask/stream`

## Troubleshooting

- If upload works but answer fails with `Gemini API quota exceeded`, your key has no available generation quota.
- Wait for quota reset or switch to a key/project with active Gemini quota and billing.


## Next upgrades 

- multi-file upload and file management
- citation highlighting in PDF viewer
- conversation memory
- hybrid search (keyword + vector)
- auth + per-user document spaces

---

If you are new, start by getting local upload + question answering working first. That alone is a strong project.
