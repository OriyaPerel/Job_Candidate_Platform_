// server/AI/genkit.js
import dotenv from "dotenv";
dotenv.config();

import path from "path";
import { fileURLToPath } from "url";
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// בדיקה שה־API key באמת קיים
if (!process.env.GEMINI_API_KEY) {
  console.error(" GEMINI_API_KEY is missing in environment variables");
  throw new Error("GEMINI_API_KEY is not set. Please add it to your .env file.");
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY }),
  ],
  model: 'googleai/gemini-2.5-flash',
  promptDir: path.join(__dirname, "prompts"),
});
