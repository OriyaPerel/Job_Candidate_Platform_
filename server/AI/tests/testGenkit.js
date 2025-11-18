import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { ai } from "../genkit.js";


// --- טוען את קובץ הסביבה (.env) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// --- בודק שהמפתח נטען ---
console.log("🔑 GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Loaded ✅" : "❌ Not Found");

async function main() {
  // מוודא שיש מפתח לפני שנמשיך
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY. Please check your .env file path.");
  }

  // --- קריאה לבדיקה מול מודל Gemini ---
  const { text } = await ai.generate({
    model: "googleai/gemini-2.5-flash", // 👈 שם המודל הנכון
    prompt: "Hello from Oriya's Job Platform AI!"
  });

  console.log("✅ Gemini Response:");
  console.log(text);
}

main().catch(err => console.error("❌ Error:", err));
