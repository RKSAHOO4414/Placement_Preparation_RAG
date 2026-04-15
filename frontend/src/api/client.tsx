export type Source = {
  source_name: string;
  page: number | null;
  collection: string;
  score: number;
};

const DEFAULT_COLLECTIONS = ["DSA", "OS", "DBMS", "CN", "Aptitude"];

export async function uploadDocument(
  file: File,
  collections: string[],
) {
  const formData = new FormData();
  formData.append("file", file);
  
  // Default to first collection if none selected
  const collectionsToUpload = collections.length > 0 ? collections : [DEFAULT_COLLECTIONS[0]];
  formData.append("collections", collectionsToUpload.join(", "));

  const res = await fetch("http://127.0.0.1:8000/documents/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Upload failed");
  }

  return await res.json();
}

export async function streamChat(
  question: string,
  collections: string[],
  onSources: (s: Source[]) => void,
  onToken: (t: string) => void,
  onDone: () => void,
) {
  const res = await fetch("http://127.0.0.1:8000/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, collections, top_k: 6 }),
  });

  if (!res.ok || !res.body) throw new Error("Stream failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE events (separated by double newline)
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || ""; // keep incomplete line in buffer

    for (const part of parts) {
      if (!part.trim()) continue;

      const lines = part.split("\n");
      let event = "";
      let data = "";

      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data = line.slice(5).trim();
      }

      if (!event || !data) continue;

      try {
        if (event === "sources") {
          // sources ARE JSON
          const srcs = JSON.parse(data);
          onSources(srcs);
        } else if (event === "token") {
          // tokens are NOT JSON—they're plain strings already
          // The backend wrapped them in JSON for transport, so parse once to unwrap
          const token = JSON.parse(data);
          onToken(token);
        } else if (event === "done") {
          onDone();
        }
      } catch (e) {
        console.error(`Failed to parse ${event}:`, data, e);
      }
    }
  }
}