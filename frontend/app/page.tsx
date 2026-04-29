"use client";

import { FormEvent, useState } from "react";
import { askQuestion, uploadPdf } from "../lib/api";

type Citation = { source: string; page: number | string };

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [status, setStatus] = useState("");
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
    setStatus("Searching document...");
    try {
      const result = await askQuestion(question);
      setAnswer(result.answer);
      setCitations(result.citations);
      setStatus("Answer ready.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Question failed");
    } finally {
      setLoadingAsk(false);
    }
  }

  return (
    <main>
      <h1>RAG Document Q&A System</h1>
      <p>Upload PDFs, ask questions, and get grounded answers with citations.</p>

      <section className="card">
        <h2>1) Upload PDF</h2>
        <form onSubmit={onUpload}>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div style={{ marginTop: 12 }}>
            <button disabled={loadingUpload} type="submit">
              {loadingUpload ? "Uploading..." : "Upload + Index"}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>2) Ask Question</h2>
        <form onSubmit={onAsk}>
          <textarea
            placeholder="Ask in plain English. Example: What are the key deliverables in this contract?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div style={{ marginTop: 12 }}>
            <button disabled={loadingAsk} type="submit">
              {loadingAsk ? "Asking..." : "Get Answer"}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Result</h2>
        <p>{status || "No activity yet."}</p>
        {answer && (
          <>
            <h3>Answer</h3>
            <p>{answer}</p>
            <h3>Citations</h3>
            <ul>
              {citations.map((c, i) => (
                <li key={`${c.source}-${c.page}-${i}`}>
                  {c.source} - page {c.page}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}
