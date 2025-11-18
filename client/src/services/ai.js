// client/src/services/ai.js

// נקבע בסיס לשרת בצורה עמידה לכל סביבת בנדלר (Vite/CRA/רגיל)
const API_BASE =
  // Vite (.env: VITE_SERVER_URL=http://localhost:5001)
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_SERVER_URL) ||
  // CRA (.env: REACT_APP_SERVER_URL=http://localhost:5001)
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_SERVER_URL) ||
  // fallback חכם: אם הדף על localhost:3002 ננחש שהשרת 5001
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : `${window.location.origin}`);

export async function aiChat({ message, topK = 5, target = null, filters = null }) {
  const res = await fetch(`${API_BASE}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ message, topK, target, filters }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AI chat failed (${res.status}): ${detail}`);
  }
  return res.json();
}
