// server/ai/testEmbed.js
import { ai } from "../genkit.js";

async function test() {
  console.log("🧠 Checking embedding model...");
  try {
    const res = await ai.embed({
      embedder: "googleai/text-embedding-004",
      content: "This is a test sentence to verify embedding generation works correctly."
    });

    // נראה בדיוק מה חזר
    console.log("🔎 Raw response keys:", Object.keys(res));

    // חילוץ בטוח – מכסה כמה צורות אפשריות
    const vector =
      res?.embedding ??
      res?.vector ??
      res?.embeddings?.[0]?.embedding ??
      res?.output;

    if (Array.isArray(vector)) {
      console.log("✅ Embedding generated successfully! Length:", vector.length);
    } else {
      console.log("⚠️ Could not find vector array. Full response:");
      console.dir(res, { depth: null });
    }
  } catch (err) {
    console.error("❌ Error creating embedding:");
    console.error(err);
  }
}

test();
