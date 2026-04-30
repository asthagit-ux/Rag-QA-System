from __future__ import annotations

import json
from pathlib import Path
from uuid import uuid4

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
    filename = (file.filename or "").strip()
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    safe_name = f"{uuid4().hex}_{Path(filename).name}"
    file_path = upload_dir / safe_name
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    file_path.write_bytes(data)

    chunks = rag_service.index_pdf(str(file_path))
    if chunks == 0:
        raise HTTPException(
            status_code=400,
            detail="No readable text found in this PDF. Please try a text-based PDF.",
        )

    return {"message": "File indexed successfully.", "chunks": chunks, "filename": Path(filename).name}


@app.post("/ask")
async def ask_question(payload: dict) -> dict:
    question = payload.get("question", "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")

    try:
        answer, citations = rag_service.answer(question=question)
        return {"answer": answer, "citations": citations}
    except HTTPException:
        raise
    except Exception as exc:
        message = str(exc)
        if "RESOURCE_EXHAUSTED" in message or "quota" in message.lower():
            raise HTTPException(
                status_code=429,
                detail="Gemini API quota exceeded. Please wait and retry, or use a key with available quota.",
            ) from exc
        raise HTTPException(status_code=500, detail=f"Question failed: {message}") from exc


@app.post("/ask/stream")
async def ask_question_stream(payload: dict) -> StreamingResponse:
    question = payload.get("question", "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")

    try:
        stream, citations = rag_service.stream_answer(question=question)
    except HTTPException:
        raise
    except Exception as exc:
        message = str(exc)
        if "RESOURCE_EXHAUSTED" in message or "quota" in message.lower():
            raise HTTPException(
                status_code=429,
                detail="Gemini API quota exceeded. Please wait and retry, or use a key with available quota.",
            ) from exc
        raise HTTPException(status_code=500, detail=f"Streaming failed: {message}") from exc

    def event_stream():
        for token in stream:
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield f"data: {json.dumps({'done': True, 'citations': citations})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
