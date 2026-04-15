import { useState } from "react";
import Chat from "./pages/Chat";
import Quiz from "./pages/Quiz";
import "./App.css";

export default function App() {
  const [activePage, setActivePage] = useState<"chat" | "quiz">("chat");

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* Navigation */}
      <nav style={{
        background: "#fff",
        borderBottom: "1px solid #e0e0e0",
        padding: "0 20px",
        display: "flex",
        gap: "20px",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
      }}>
        <h1 style={{ margin: "0 20px 0 0", fontSize: "24px", color: "#333" }}>
          📚 RAG Placement Coach
        </h1>
        <button
          onClick={() => setActivePage("chat")}
          style={{
            padding: "12px 20px",
            background: activePage === "chat" ? "#0066cc" : "transparent",
            color: activePage === "chat" ? "white" : "#333",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: activePage === "chat" ? "bold" : "normal",
            transition: "all 0.2s"
          }}
        >
          💬 Chat
        </button>
        <button
          onClick={() => setActivePage("quiz")}
          style={{
            padding: "12px 20px",
            background: activePage === "quiz" ? "#0066cc" : "transparent",
            color: activePage === "quiz" ? "white" : "#333",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: activePage === "quiz" ? "bold" : "normal",
            transition: "all 0.2s"
          }}
        >
          🎯 Quiz
        </button>
      </nav>

      {/* Page Content */}
      <div style={{ minHeight: "calc(100vh - 80px)" }}>
        {activePage === "chat" && <Chat />}
        {activePage === "quiz" && <Quiz />}
      </div>
    </div>
  );
}