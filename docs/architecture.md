# RAG System Architecture

```mermaid
flowchart LR
    A[User in Next.js UI] --> B[FastAPI backend]
    B --> C[PDF Upload Endpoint]
    C --> D[PyMuPDF parse by page]
    D --> E[LangChain splitter]
    E --> F[Gemini Embeddings text-embedding-004]
    F --> G[ChromaDB local vector store]

    A --> H[Ask Question]
    H --> B
    B --> I[Similarity search top-k chunks]
    I --> J[Gemini 2.0 Flash]
    J --> K[Answer with citations]
    K --> A
```

## Notes

- Upload flow stores PDF in `uploads/`, parses page text, chunks it, then indexes embeddings in ChromaDB.
- Ask flow retrieves relevant chunks, builds context, and asks Gemini for a grounded answer.
- Streaming flow returns SSE tokens first, then final citation metadata.
