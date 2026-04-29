from __future__ import annotations

import json
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.rag import RAGService

load_dotenv()

app = FastAPI(title="RAG Document Q&A API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_dir = Path("uploads")
upload_dir.mkdir(exist_ok=True)

rag_service = RAGService()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)) -> dict:
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    file_path = upload_dir / file.filename
    data = await file.read()
    file_path.write_bytes(data)

    chunks = rag_service.index_pdf(str(file_path))
    return {"message": "File indexed successfully.", "chunks": chunks, "filename": file.filename}


@app.post("/ask")
async def ask_question(payload: dict) -> dict:
    question = payload.get("question", "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")

    answer, citations = rag_service.answer(question=question)
    return {"answer": answer, "citations": citations}


@app.post("/ask/stream")
async def ask_question_stream(payload: dict) -> StreamingResponse:
    question = payload.get("question", "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")

    stream, citations = rag_service.stream_answer(question=question)

    def event_stream():
        for token in stream:
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield f"data: {json.dumps({'done': True, 'citations': citations})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
