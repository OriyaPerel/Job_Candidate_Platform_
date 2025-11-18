// server/AI/chatFlow.js
import { ai } from "./genkit.js";
import { searchFreeText } from "./searchFlow.js";

const chatPrompt = ai.prompt("chat");

/**
 * message: מחרוזת חופשית מהמשתמש
 * options: { target?, topK?, filters?, history? }
 *  - target: "users" | "jobs" | "applications" (לא חובה; אם אין – הזיהוי אוטומטי)
 *  - topK: מספר תוצאות (דיפולט 5)
 *  - filters: { location, skills[], minYears, remote, company, title, employmentType, seniority }
 *  - history: [{role:"user"|"assistant", content:"..."}] (לא חובה)
 */
export async function chatTurn(message, options = {}) {
  const { target, topK = 5, filters, history = [] } = options;

  const s = (message || "").toLowerCase();
  const looksLikeSearch =
    /(find|search|show|get|bring|ת(ני|ביאי|ראה|ציגי|מצאי|חפשי)|תחפשי|תמצאי|חיפוש|מועמד(ים)?|משרה(ות)?|הגשה(ות)?)/.test(
      s
    );

  const historyText = history
    .map((h) => `${h.role}: ${h.content}`)
    .join("\n");

  // 🔎 מצב של חיפוש – מביאים נתונים אמיתיים מהמערכת, וה-AI רואה אותם
  // בתוך chatTurn, במקום הבלוק הזה:

if (looksLikeSearch) {
  const searchResult = await searchFreeText(message, { target, topK, filters });

  const normalized = {
    target: searchResult.target || target || "users",
    query_text: searchResult.query_text || message,
    filters: searchResult.filters || filters || {},
    results: searchResult.results || [],
  };

  const searchJson = JSON.stringify(normalized, null, 2);

  let replyText;

  try {
    const { text } = await chatPrompt({
      message,
      history: historyText,
      search: searchJson,
    });
    replyText = text;
  } catch (e) {
    console.error("[chatTurn] chatPrompt failed, fallback to summary:", e?.message);
    // אם גוגל נפלו / המודל עמוס – לפחות נחזיר סיכום טקסטואלי משלנו
    replyText = buildResultSummary(normalized);
  }

  const reply = replyText || buildResultSummary(normalized);

  return {
    reply,
    target: normalized.target,
    query_text: normalized.query_text,
    filters: normalized.filters,
    results: normalized.results,
  };
}


  // 💬 שיחה כללית – בלי חיפוש
  const { text } = await chatPrompt({
    message,
    history: historyText,
  });

  return { reply: text || "סבבה 😊" };
}

// בונה סיכום טקסטואלי נחמד מהתוצאות, להצגה בצ'אט או כפולבק
function buildResultSummary({ target, query_text, results = [], filters }) {
  const titleMap = {
    users: "מועמדים",
    jobs: "משרות",
    applications: "הגשות",
  };
  const label = titleMap[target] || "תוצאות";
  const count = results.length;
  const filtersDesc =
    filters && Object.keys(filters).length
      ? `\nסינון: ${Object.entries(filters)
          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
          .join(", ")}`
      : "";

  let lines = [`מצאתי ${count} ${label} עבור: "${query_text}"${filtersDesc}`];

  for (let i = 0; i < Math.min(results.length, 5); i++) {
    const r = results[i];
    if (target === "users") {
      lines.push(
        `• ${r.name || "(ללא שם)"} — ${r.role || ""} — ניסיון: ${
          r.yearsExperience ?? "N/A"
        } — ציון: ${fmt(r.score)}`
      );
    } else if (target === "jobs") {
      lines.push(
        `• ${r.title || "(ללא כותרת)"} @ ${r.company || ""} — ${
          r.location || ""
        } — ${r.employmentType || ""} — ציון: ${fmt(r.score)}`
      );
    } else {
      lines.push(
        `• מועמד: ${r.candidate} | משרה: ${r.job} | סטטוס: ${
          r.status || ""
        } — ציון: ${fmt(r.score)}`
      );
    }
  }
  if (results.length > 5)
    lines.push(`…ועוד ${results.length - 5} תוצאות נוספות`);

  return lines.join("\n");
}

function fmt(x) {
  if (typeof x !== "number") return "N/A";
  return (Math.round(x * 1000) / 1000).toFixed(3);
}
