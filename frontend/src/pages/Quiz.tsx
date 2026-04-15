import { useState } from "react";

const COLLECTIONS = ["DSA", "OS", "DBMS", "CN", "Aptitude"];

type Question = {
  question: string;
  options: string[];
  correct_option: number;
  explanation: string;
};

export default function Quiz() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(["DSA"]));
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onGenerate() {
    if (selected.size === 0) return;
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collections: Array.from(selected),
          num_questions: 5,
        }),
      });
      const data = await res.json();
      setQuestions(data);
      setAnswers(new Array(data.length).fill(null));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit() {
    setShowResults(true);
  }

  const score = answers.filter(
    (a, i) => a === questions[i]?.correct_option
  ).length;

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", fontFamily: "system-ui" }}>
      <h1>🎯 Quiz Mode</h1>

      {!showResults && questions.length === 0 && (
        <div style={{ padding: 20, background: "#f5f5f5", borderRadius: 8 }}>
          <h3>Select Topics</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
            {COLLECTIONS.map((col) => (
              <label key={col} style={{ display: "flex", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={selected.has(col)}
                  onChange={() => {
                    const next = new Set(selected);
                    if (next.has(col)) next.delete(col);
                    else next.add(col);
                    setSelected(next);
                  }}
                />
                {col}
              </label>
            ))}
          </div>
          <button
            onClick={onGenerate}
            disabled={loading || selected.size === 0}
            style={{
              padding: "12px 24px",
              background: "#0066cc",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {loading ? "Generating..." : "Generate Quiz"}
          </button>
        </div>
      )}

      {questions.length > 0 && !showResults && (
        <div>
          {questions.map((q, idx) => (
            <div key={idx} style={{ marginBottom: 30, padding: 20, background: "#f9f9f9", borderRadius: 8 }}>
              <h3>{idx + 1}. {q.question}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {q.options.map((opt, optIdx) => (
                  <label key={optIdx} style={{ display: "flex", gap: 10 }}>
                    <input
                      type="radio"
                      name={`q${idx}`}
                      checked={answers[idx] === optIdx}
                      onChange={() => {
                        const next = [...answers];
                        next[idx] = optIdx;
                        setAnswers(next);
                      }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={onSubmit}
            style={{
              padding: "12px 24px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Submit Quiz
          </button>
        </div>
      )}

      {showResults && (
        <div style={{ padding: 20, background: "#e8f5e9", borderRadius: 8 }}>
          <h2>Score: {score} / {questions.length}</h2>
          {questions.map((q, idx) => (
            <div key={idx} style={{ marginBottom: 20, padding: 15, background: "white", borderRadius: 6 }}>
              <h4>{q.question}</h4>
              <p style={{ color: answers[idx] === q.correct_option ? "green" : "red" }}>
                Your answer: {q.options[answers[idx] ?? -1] || "Not answered"}
              </p>
              <p>Correct: {q.options[q.correct_option]}</p>
              <p style={{ color: "#666", fontSize: 14 }}>{q.explanation}</p>
            </div>
          ))}
          <button onClick={() => { setQuestions([]); setShowResults(false); }} style={{ padding: "12px 24px" }}>
            Generate New Quiz
          </button>
        </div>
      )}
    </div>
  );
}