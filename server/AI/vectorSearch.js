// server/ai/vectorSearch.js
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import { ai } from "./genkit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// טוען .env מכמה מיקומים סבירים
const candidates = [
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(process.cwd(), ".env"),
];
for (const p of candidates) if (fs.existsSync(p)) { dotenv.config({ path: p }); break; }

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.ATLAS_URI;
const dbName = process.env.MONGODB_DB || process.env.DB_NAME || "projectDB";
if (!uri) throw new Error("Missing Mongo URI");

// איסוף טקסט רקורסיבי מכל שדה (כולל אובייקטים/מערכים)
function collectPrimitives(value, chunks, keyPath = [], skipKeys = new Set(["_id","embedding","passwordHash","__v"])) {
  if (value == null) return;
  if (Array.isArray(value)) { for (const item of value) collectPrimitives(item, chunks, keyPath, skipKeys); return; }
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") {
    const k = keyPath[keyPath.length - 1];
    if (!k || !skipKeys.has(k)) chunks.push(String(value));
    return;
  }
  if (t === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (skipKeys.has(k)) continue;
      collectPrimitives(v, chunks, [...keyPath, k], skipKeys);
    }
  }
}
export function textFromDoc(doc) {
  const chunks = [];
  collectPrimitives(doc, chunks);
  const uniq = Array.from(new Set(chunks.map(s => s.trim()).filter(Boolean)));
  return uniq.join(" | ").slice(0, 4000);
}

// נרמול תשובת האמבדינג (לפעמים זה אובייקט, לפעמים מערך של אובייקט אחד)
function normalizeEmbeddingResponse(res) {
  return Array.isArray(res)
    ? res[0]?.embedding
    : (res?.embedding ?? res?.vector ?? res?.embeddings?.[0]?.embedding);
}

export async function embedText(query) {
  const res = await ai.embed({
    embedder: "googleai/text-embedding-001",
    content: query,
  });
  const vec = normalizeEmbeddingResponse(res);
  if (!Array.isArray(vec)) throw new Error("Embed returned no vector array");
  return vec;
}

export async function getMongo() {
  const client = new MongoClient(uri);
  await client.connect();
  return { client, db: client.db(dbName) };
}

// הרצת $vectorSearch גנרית
export async function runVectorSearch(db, {
  collection, index, path = "embedding", queryVector, limit = 5, numCandidates = 100,
  project = {}
}) {
  const pipeline = [
    {
      $vectorSearch: {
        index,
        path,
        queryVector,
        numCandidates,
        limit
      }
    },
    { $addFields: { score: { $meta: "vectorSearchScore" } } },
    { $project: { embedding: 0, ...project } }
  ];
  return db.collection(collection).aggregate(pipeline).toArray();
}
