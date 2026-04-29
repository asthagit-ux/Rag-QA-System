from __future__ import annotations
from pathlib import Path
from typing import Iterable
import fitz
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI


class RAGService:
    def __init__(self, persist_dir: str = "chroma_db") -> None:
        self.persist_dir = persist_dir
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
        self.vector_store = Chroma(
            collection_name="rag_documents",
            embedding_function=self.embeddings,
            persist_directory=self.persist_dir,
        )
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.2)
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=900,
            chunk_overlap=150,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def parse_pdf(self, file_path: str) -> list[Document]:
        pdf = fitz.open(file_path)
        pages: list[Document] = []
        try:
            for idx, page in enumerate(pdf):
                text = page.get_text().strip()
                if not text:
                    continue
                pages.append(
                    Document(
                        page_content=text,
                        metadata={
                            "source": Path(file_path).name,
                            "page": idx + 1,
                        },
                    )
                )
        finally:
            pdf.close()
        return pages

    def index_pdf(self, file_path: str) -> int:
        docs = self.parse_pdf(file_path)
        chunks = self.splitter.split_documents(docs)
        if not chunks:
            return 0
        self.vector_store.add_documents(chunks)
        return len(chunks)

    def _build_context(self, docs: list[Document]) -> str:
        lines: list[str] = []
        for i, doc in enumerate(docs, start=1):
            source = doc.metadata.get("source", "unknown")
            page = doc.metadata.get("page", "N/A")
            lines.append(f"[Chunk {i} | {source} p.{page}]\n{doc.page_content}")
        return "\n\n".join(lines)

    def answer(self, question: str, k: int = 4) -> tuple[str, list[dict]]:
        docs = self.vector_store.similarity_search(question, k=k)
        context = self._build_context(docs)
        prompt = (
            "You are a precise document QA assistant.\n"
            "Answer ONLY from the context below.\n"
            "If not found, say: 'I could not find this in the uploaded documents.'\n\n"
            f"Question: {question}\n\n"
            f"Context:\n{context}\n\n"
            "Return concise answer with bullet points when useful."
        )
        response = self.llm.invoke(prompt)
        citations = [
            {"source": d.metadata.get("source", "unknown"), "page": d.metadata.get("page", "N/A")}
            for d in docs
        ]
        return response.content, citations

    def stream_answer(self, question: str, k: int = 4) -> tuple[Iterable[str], list[dict]]:
        docs = self.vector_store.similarity_search(question, k=k)
        context = self._build_context(docs)
        prompt = (
            "You are a precise document QA assistant.\n"
            "Answer ONLY from the context below.\n"
            "If not found, say: 'I could not find this in the uploaded documents.'\n\n"
            f"Question: {question}\n\n"
            f"Context:\n{context}\n\n"
            "Return concise answer with bullet points when useful."
        )
        citations = [
            {"source": d.metadata.get("source", "unknown"), "page": d.metadata.get("page", "N/A")}
            for d in docs
        ]

        def token_stream() -> Iterable[str]:
            for chunk in self.llm.stream(prompt):
                if chunk.content:
                    yield chunk.content

        return token_stream(), citations