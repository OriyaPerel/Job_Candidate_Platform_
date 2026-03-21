// client/src/components/ApplicationList/AiAssistant/AiChatPanel.jsx
import { useState } from "react";
import { aiChat } from "../../../services/ai";
import "./ai.css";

export default function AiChatPanel({ open, onClose }) {
  if (!open) return null;

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  
  const [items, setItems] = useState([]);

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    // מוסיפים את הודעת המשתמש להיסטוריה
    setItems((prev) => [...prev, { type: "user", text: trimmed }]);
    setMessage("");
    setLoading(true);
    setError("");

    try {
      const data = await aiChat({ message: trimmed, topK: 5 });

      const meta = {
        target: data.target,
        query_text: data.query_text,
        filters: data.filters,
      };
      const results = Array.isArray(data.results) ? data.results : [];

      
      setItems((prev) => [
        ...prev,
        {
          type: "assistant",
          reply: data.reply || "",
          meta,
          results,
        },
      ]);
    } catch (err) {
      let msg = err?.message || "AI error";
      if (msg.includes("503 Service Unavailable")) {
        msg = "המודל של גוגל כרגע עמוס (503). נסי שוב עוד כמה שניות 🙂";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function renderAssistantResults(results, meta) {
    if (!results || !results.length) return null;

    if (meta?.target === "users") {
      return (
        <div className="ai-grid">
          {results.map((r) => (
            <div key={r._id} className="ai-card">
              <div className="ai-title">{r.name || "(ללא שם)"}</div>
              <div className="ai-sub">Role: {r.role || "—"}</div>
              <div className="ai-line">
                Skills: {Array.isArray(r.skills)
                  ? r.skills.join(", ")
                  : r.skills || "—"}
              </div>
              <div className="ai-line">
                Experience: {r.yearsExperience ?? "N/A"}
              </div>
              <div className="ai-score">
                Score: {typeof r.score === "number"
                  ? r.score.toFixed(3)
                  : "N/A"}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (meta?.target === "jobs") {
      return (
        <div className="ai-grid">
          {results.map((r) => (
            <div key={r._id} className="ai-card">
              <div className="ai-title">{r.title || "(ללא כותרת)"}</div>
              <div className="ai-sub">
                {r.company || ""} — {r.location || ""}
              </div>
              <div className="ai-line">
                Type: {r.employmentType || "—"} | Remote:{" "}
                {String(r.remote ?? "—")}
              </div>
              <div className="ai-score">
                Score: {typeof r.score === "number"
                  ? r.score.toFixed(3)
                  : "N/A"}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // applications
    return (
      <div className="ai-grid">
        {results.map((r) => (
          <div key={r._id} className="ai-card">
            <div className="ai-title">Application</div>
            <div className="ai-line">Candidate: {r.candidate}</div>
            <div className="ai-line">Job: {r.job}</div>
            <div className="ai-line">Status: {r.status || "—"}</div>
            <div className="ai-line">
              Applied: {r.appliedAt ? String(r.appliedAt) : "—"}
            </div>
            <div className="ai-score">
              Score: {typeof r.score === "number"
                ? r.score.toFixed(3)
                : "N/A"}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="ai-backdrop">
      <div className="ai-panel">
        <div className="ai-header">
          <div>Ask AI</div>
          <button className="ai-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="ai-content">
          {error && <div className="ai-error">{error}</div>}

          {/* כל ההודעות הקודמות */}
          {items.map((item, idx) => {
            if (item.type === "user") {
              return (
                <div key={idx} className="ai-user-msg">
                  {item.text}
                </div>
              );
            }
            // assistant
            return (
              <div key={idx} className="ai-assistant-block">
                {item.reply && (
                  <pre className="ai-reply">{item.reply}</pre>
                )}

                {item.meta?.query_text && (
                  <div className="ai-meta">
                    Target: <b>{item.meta.target || "—"}</b> &nbsp;|&nbsp; Query:{" "}
                    <code>{item.meta.query_text}</code>
                  </div>
                )}

                {renderAssistantResults(item.results, item.meta)}
              </div>
            );
          })}

          {/* אינדיקציה קטנה לטעינה */}
          {loading && (
            <div className="ai-reply">טוען תשובה…</div>
          )}
        </div>

        <form className="ai-input-row" onSubmit={handleSend}>
          <input
            className="ai-input"
            placeholder=""
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className="ai-send" disabled={loading}>
            {loading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
