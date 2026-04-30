const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const error = (await res.json()) as { detail?: string; message?: string };
      return error.detail || error.message || fallback;
    }
    const text = await res.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

export type AskResponse = {
  answer: string;
  citations: Array<{ source: string; page: number | string }>;
};

export type StreamDonePayload = {
  done: true;
  citations: Array<{ source: string; page: number | string }>;
};

export async function uploadPdf(
  file: File
): Promise<{ message: string; chunks: number; filename?: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, "Upload failed");
    throw new Error(message);
  }

  return res.json();
}

export async function askQuestion(question: string): Promise<AskResponse> {
  const res = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, "Question failed");
    throw new Error(message);
  }

  return res.json();
}

export async function askQuestionStream(
  question: string,
  handlers: {
    onToken: (token: string) => void;
    onDone: (payload: StreamDonePayload) => void;
  }
): Promise<void> {
  const res = await fetch(`${API_URL}/ask/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, "Streaming question failed");
    throw new Error(message);
  }

  if (!res.body) {
    throw new Error("Streaming response body is unavailable.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const line = event
        .split("\n")
        .find((part) => part.startsWith("data: "));
      if (!line) continue;

      const payload = JSON.parse(line.slice(6)) as
        | { token?: string; done?: boolean; citations?: Array<{ source: string; page: number | string }> }
        | undefined;

      if (payload?.token) {
        handlers.onToken(payload.token);
      }

      if (payload?.done) {
        handlers.onDone({
          done: true,
          citations: payload.citations ?? [],
        });
      }
    }
  }
}
