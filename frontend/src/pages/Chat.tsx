import { useState } from "react";
import { streamChat, uploadDocument, type Source } from "../api/client";

const COLLECTIONS = ["DSA", "OS", "DBMS", "CN", "Aptitude"];

const loaderStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .upload-loader {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .spinner {
    border: 8px solid #f3f3f3;
    border-top: 8px solid #0066cc;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: spin 1s linear infinite;
  }
  .loader-text {
    position: absolute;
    color: white;
    font-size: 18px;
    font-weight: bold;
    margin-top: 100px;
    text-align: center;
  }
`;

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingCollections, setUploadingCollections] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  function toggleCollection(col: string) {
    const next = new Set(selected);
    if (next.has(col)) next.delete(col);
    else next.add(col);
    setSelected(next);
  }

  function toggleUploadCollection(col: string) {
    const next = new Set(uploadingCollections);
    if (next.has(col)) next.delete(col);
    else next.add(col);
    setUploadingCollections(next);
  }

  async function onUpload() {
    if (!selectedFile) return;

    setUploading(true);
    setUploadMessage("");

    try {
      await uploadDocument(selectedFile, Array.from(uploadingCollections));
      setUploadMessage("✅ Document uploaded successfully!");
      setSelectedFile(null);
      setUploadingCollections(new Set());
      setTimeout(() => setUploadMessage(""), 3000);
    } catch (e: any) {
      setUploadMessage("❌ Upload failed: " + (e?.message || String(e)));
    } finally {
      setUploading(false);
    }
  }

  async function onAsk() {
    if (!question.trim()) return;

    setAnswer("");
    setSources([]);
    setBusy(true);

    try {
      await streamChat(
        question,
        Array.from(selected),
        (s) => setSources(s),
        (t) => setAnswer((prev) => prev + t),
        () => setBusy(false),
      );
    } catch (e: any) {
      setBusy(false);
      setAnswer("ERROR: " + (e?.message || String(e)));
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", fontFamily: "system-ui" }}>
      <style>{loaderStyle}</style>
      
      {uploading && (
        <div className="upload-loader">
          <div style={{ textAlign: "center" }}>
            <div className="spinner"></div>
            <div className="loader-text">Uploading document...</div>
          </div>
        </div>
      )}

      <h1>📚 Placement Prep RAG</h1>

      <div style={{ marginBottom: 20, padding: 15, background: "#fffacd", borderRadius: 8, border: "1px solid #ddd" }}>
        <h3>📤 Upload Document</h3>
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 10 }}>
            Select file (PDF):
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              style={{ marginLeft: 10 }}
              disabled={uploading}
            />
          </label>
          {selectedFile && <p style={{ margin: "5px 0", fontSize: 13, color: "#333" }}>Selected: {selectedFile.name}</p>}
        </div>

        <div style={{ marginBottom: 15 }}>
          <p style={{ margin: "0 0 10px 0" }}>Choose collection(s) <span style={{ fontSize: 12, color: "#666" }}>(optional - defaults to DSA)</span>:</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {COLLECTIONS.map((col) => (
              <label key={`upload-${col}`} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={uploadingCollections.has(col)}
                  onChange={() => toggleUploadCollection(col)}
                  disabled={uploading}
                />
                {col}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={onUpload}
          disabled={uploading || !selectedFile}
          style={{
            padding: "10px 20px",
            fontSize: 14,
            background: uploading ? "#999" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: uploading ? "default" : "pointer",
          }}
        >
          {uploading ? "Uploading..." : "Upload Document"}
        </button>

        {uploadMessage && (
          <p style={{ marginTop: 10, fontSize: 14, color: uploadMessage.includes("✅") ? "#28a745" : "#c00" }}>
            {uploadMessage}
          </p>
        )}
      </div>

      <div style={{ marginBottom: 20, padding: 15, background: "#f5f5f5", borderRadius: 8 }}>
        <h3>Select Topics</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {COLLECTIONS.map((col) => (
            <label key={col} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={selected.has(col)}
                onChange={() => toggleCollection(col)}
              />
              {col}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        <input
          style={{
            flex: 1,
            padding: 12,
            fontSize: 14,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAsk()}
          placeholder="Ask a question..."
          disabled={busy}
        />
        <button
          onClick={onAsk}
          disabled={busy || !question.trim()}
          style={{
            padding: "12px 24px",
            fontSize: 14,
            background: busy ? "#999" : "#0066cc",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {busy ? "Thinking..." : "Ask"}
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h3>Answer</h3>
        <pre
          style={{
            background: "#111",
            color: "#0f0",
            padding: 15,
            borderRadius: 6,
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            maxHeight: 400,
            overflow: "auto",
            fontFamily: "monospace",
          }}
        >
          {answer || "(waiting for answer...)"}
        </pre>
      </div>

      <div>
        <h3>Sources</h3>
        {sources.length === 0 ? (
          <p style={{ color: "#999" }}>(no sources)</p>
        ) : (
          <ul style={{ lineHeight: 1.8 }}>
            {sources.map((s, idx) => (
              <li key={idx}>
                <strong>{s.collection}</strong> — {s.source_name}
                {s.page && ` (page ${s.page})`}
                <br />
                <span style={{ fontSize: 12, color: "#666" }}>relevance: {s.score.toFixed(3)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}