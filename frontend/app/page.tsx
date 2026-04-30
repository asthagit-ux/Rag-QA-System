"use client";

import { FormEvent, useState } from "react";
import { askQuestionStream, uploadPdf } from "../lib/api";

type Citation = { source: string; page: number | string };

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [status, setStatus] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [lastChunkCount, setLastChunkCount] = useState<number | null>(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingAsk, setLoadingAsk] = useState(false);

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setStatus("Please choose a PDF first.");
      return;
    }
    setLoadingUpload(true);
    setStatus("Uploading and indexing PDF...");
    try {
      const result = await uploadPdf(file);
      setUploadedFileName(result.filename || file.name);
      setLastChunkCount(result.chunks);
      setStatus(`${result.message} Created ${result.chunks} chunks.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setLoadingUpload(false);
    }
  }

  async function onAsk(e: FormEvent) {
    e.preventDefault();
    if (!question.trim()) {
      setStatus("Please ask a question.");
      return;
    }
    setLoadingAsk(true);
    setAnswer("");
    setCitations([]);
    setStatus("Searching document and streaming answer...");
    try {
      await askQuestionStream(question, {
        onToken: (token) => {
          setAnswer((prev) => prev + token);
        },
        onDone: ({ citations: resultCitations }) => {
          setCitations(resultCitations);
          setStatus("Answer ready.");
        },
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Question failed");
    } finally {
      setLoadingAsk(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero card">
        <p className="eyebrow">Portfolio-Ready GenAI Project</p>
        <h1>RAG Document Q&A System</h1>
        <p className="hero-text">
          Upload a PDF, ask natural-language questions, and get grounded answers with citations.
          Built with FastAPI, LangChain, Gemini, and ChromaDB.
        </p>
        <div className="hero-metrics">
          <div className="metric">
            <span className="metric-label">Status</span>
            <strong>{status || "Ready"}</strong>
          </div>
          <div className="metric">
            <span className="metric-label">Indexed Chunks</span>
            <strong>{lastChunkCount ?? "--"}</strong>
          </div>
          <div className="metric">
            <span className="metric-label">Citations</span>
            <strong>{citations.length}</strong>
          </div>
        </div>
      </section>

      <section className="grid">
        <section className="card panel">
          <h2>1) Upload PDF</h2>
          <p className="panel-text">Choose a text-based PDF and index it for semantic retrieval.</p>
          <form onSubmit={onUpload} className="stack">
            <label className="file-picker">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <span>{file ? file.name : "Select a PDF file"}</span>
            </label>
            <button className="btn-primary" disabled={loadingUpload} type="submit">
              {loadingUpload ? "Uploading..." : "Upload + Index"}
            </button>
          </form>
          {uploadedFileName ? (
            <p className="upload-meta">
              Latest indexed file: <strong>{uploadedFileName}</strong>
            </p>
          ) : null}
        </section>

        <section className="card panel">
          <h2>2) Ask Question</h2>
          <p className="panel-text">
            Ask in plain English. The response streams token-by-token for a live demo effect.
          </p>
          <form onSubmit={onAsk} className="stack">
            <textarea
              placeholder="Example: What are the key deliverables and deadlines in this document?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button className="btn-primary" disabled={loadingAsk} type="submit">
              {loadingAsk ? "Streaming..." : "Get Answer"}
            </button>
          </form>
        </section>
      </section>

      <section className="card panel result-card">
        <h2>Result</h2>
        <p className="status-pill">{status || "No activity yet."}</p>
        {answer ? (
          <>
            <h3>Answer</h3>
            <p className="answer-text">{answer}</p>
            <h3>Citations</h3>
            {citations.length ? (
              <ul className="citation-list">
                {citations.map((c, i) => (
                  <li key={`${c.source}-${c.page}-${i}`}>
                    <span className="source">{c.source}</span>
                    <span className="page">Page {c.page}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="panel-text">No citations were returned for this answer.</p>
            )}
          </>
        ) : (
          <p className="panel-text">Ask a question to see a streamed answer and source citations.</p>
        )}
      </section>
    </main>
  );
}
