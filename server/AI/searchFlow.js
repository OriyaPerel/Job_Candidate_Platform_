// server/ai/searchFlow.js
import { ai } from "./genkit.js";
import { getMongo, embedText, runVectorSearch } from "./vectorSearch.js";

// ----------------------------------------------------
// 1. ניתוב השאילתה (LLM + fallback פשוט)
// ----------------------------------------------------
async function routeQueryFreeText(message) {
  const sys = `You are a router for a recruitment platform.
Output STRICT JSON only with keys: target, query_text, topK.
- target is one of: "users","jobs","applications".
- query_text is a short semantic search text distilled from the user message.
- topK is an integer 1..20.
Examples:
"user: תני 5 מועמדים עם React ו-Node" -> {"target":"users","query_text":"React and Node.js developer","topK":5}
"jobs: תמצאי משרות פרונטאנד בתל אביב" -> {"target":"jobs","query_text":"frontend developer Tel Aviv","topK":5}`;

  try {
    const { text } = await ai.generate({
      model: "googleai/gemini-2.5-flash",   // מודל עדכני
      prompt: `${sys}\nUser: ${message}\nJSON:`,
      temperature: 0.2,
    });

    const jsonStr = (text || "").trim().replace(/```json|```/g, "");
    const parsed = JSON.parse(jsonStr || "{}");

    const target = ["users", "jobs", "applications"].includes(parsed?.target)
      ? parsed.target
      : guessTargetFromHeuristics(message);

    const topK = Math.min(
      Math.max(parseInt(parsed?.topK || 5, 10), 1),
      20
    );
    const query_text = (parsed?.query_text || message || "").slice(0, 4000);

    return { target, topK, query_text };
  } catch (e) {
    console.error("[routeQueryFreeText] fallback because of error:", e?.message);
    return {
      target: guessTargetFromHeuristics(message),
      topK: 5,
      query_text: (message || "").slice(0, 4000),
    };
  }
}

function guessTargetFromHeuristics(q) {
  const s = (q || "").toLowerCase();
  if (
    s.includes("candidate") ||
    s.includes("candidates") ||
    s.includes("user") ||
    s.includes("users") ||
    s.includes("מועמד") ||
    s.includes("מועמדים") ||
    s.includes("משתמש")
  )
    return "users";
  if (
    s.includes("job") ||
    s.includes("jobs") ||
    s.includes("משרה") ||
    s.includes("משרות")
  )
    return "jobs";
  if (
    s.includes("application") ||
    s.includes("applications") ||
    s.includes("הגשה") ||
    s.includes("הגשות")
  )
    return "applications";
  return "users"; // דיפולט סביר
}

const INDEX_BY_COLLECTION = {
  users: "vector_index_users",
  jobs: "vector_index_jobs",
  applications: "vector_index_applications",
};

// ----------------------------------------------------
// 1.5 חילוץ כישורים מהטקסט + מהפילטרים
// ----------------------------------------------------
function extractSkillsFromText(text, extraSkills) {
  const lower = (text || "").toLowerCase();

  // כל "מילה טכנית": אותיות/ספרות/+#.
  const tokens = lower.match(/[a-z0-9#+.]+/g) || [];

  const uiSkills = Array.isArray(extraSkills)
    ? extraSkills.map((s) => String(s).toLowerCase())
    : [];

  return Array.from(new Set([...tokens, ...uiSkills]));
}

// ----------------------------------------------------
// 2. חיפוש חופשי – נקודת הכניסה העיקרית
// ----------------------------------------------------
export async function searchFreeText(message, options = {}) {
  const { target: forcedTarget, topK: forcedTopK, filters = {} } = options;

  const routed = await routeQueryFreeText(message);
  const target = forcedTarget || routed.target;
  const topK = forcedTopK || routed.topK;
  const query_text = routed.query_text;

  const queryVector = await embedText(query_text);
  const { client, db } = await getMongo();

  try {
    const results = await runVectorSearch(db, {
      collection: target,
      index: INDEX_BY_COLLECTION[target],
      path: "embedding",
      queryVector,
      limit: topK,
    });

    // נזהר ממקרים שיחזור null / לא אובייקט
    const safeResults = Array.isArray(results) ? results.filter(Boolean) : [];

    const mapped = safeResults.map((r) => {
      // לפעמים ספריות וקטורים מחזירות { document, score }
      const doc = r.document || r; // תופס גם את המבנה הישן שעבד לך קודם

      if (!doc) return null;

      if (target === "users") {
        return {
          _id: doc._id,
          name: doc.fullName || doc.name,
          role: doc.role,
          skills: doc.skills || [],
          yearsExperience: doc.yearsExperience,
          score: r.score ?? doc.score,
        };
      }
      if (target === "jobs") {
        return {
          _id: doc._id,
          title: doc.title,
          company: doc.company,
          location: doc.location,
          employmentType: doc.employmentType,
          score: r.score ?? doc.score,
        };
      }
      return {
        _id: doc._id,
        candidate: doc.candidate,
        job: doc.job,
        status: doc.status,
        appliedAt: doc.appliedAt,
        score: r.score ?? doc.score,
      };
    }).filter(Boolean); // מסיר nullים אם היו

    // -------------------------------
    // סינון גנרי לפי skills (users)
    // -------------------------------
    let finalResults = mapped;
    let finalFilters = { ...(filters || {}) };

    if (target === "users") {
      const wantedSkills = extractSkillsFromText(message, finalFilters.skills);
      finalFilters.skills = wantedSkills;

      if (wantedSkills.length) {
        finalResults = mapped.filter((u) => {
          if (!u) return false;
          const userSkills = Array.isArray(u.skills)
            ? u.skills.map((s) => String(s).toLowerCase())
            : [];
          // לפחות כישור אחד חופף
          return wantedSkills.some((skill) => userSkills.includes(skill));
        });
      }
    }

    return {
      target,
      query_text,
      topK,
      filters: finalFilters,
      results: finalResults,
    };
  } finally {
    await client.close();
  }
}
