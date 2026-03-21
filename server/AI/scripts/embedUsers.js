// server/ai/embedUsers.js  (ESM)
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import { ai } from "../genkit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// טוען .env ממספר מיקומים אפשריים
const candidates = [
  path.resolve(__dirname, "../.env"),     // server/.env
  path.resolve(__dirname, "../../.env"),  // Project/.env
  path.resolve(process.cwd(), ".env"),
];
let loadedFrom = null;
for (const p of candidates) {
  if (fs.existsSync(p)) { dotenv.config({ path: p }); loadedFrom = p; break; }
}
console.log("Loaded .env from:", loadedFrom || "(none)");

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.ATLAS_URI;
const dbName = process.env.MONGODB_DB || process.env.DB_NAME || "projectDB";
if (!uri) { console.error(" Missing Mongo URI"); process.exit(1); }

// ---- בניית טקסט רקורסיבית מכל שדה אפשרי (כולל אובייקטים/מערכים) ----
function collectPrimitives(value, chunks, keyPath = [], skipKeys = new Set(["_id","embedding","passwordHash","__v"])) {
  if (value == null) return;
  if (Array.isArray(value)) {
    for (const item of value) collectPrimitives(item, chunks, keyPath, skipKeys);
    return;
  }
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

function autoTextDeep(doc) {
  const chunks = [];
  collectPrimitives(doc, chunks);
  // מסיר כפילויות קצרות ומחבר
  const uniq = Array.from(new Set(chunks.map(s => s.trim()).filter(Boolean)));
  return uniq.join(" | ").slice(0, 4000); // חותך לגודל סביר
}

async function embedText(text) {
  const res = await ai.embed({
    embedder: "googleai/text-embedding-001",
    content: text,
  });

  // נרמל את התוצאה – לפעמים זה אובייקט, לפעמים מערך עם איבר ראשון
  const vec = Array.isArray(res)
    ? res[0]?.embedding
    : (res?.embedding ?? res?.vector ?? res?.embeddings?.[0]?.embedding);

  if (!Array.isArray(vec)) {
    throw new Error("Embed returned no vector array");
  }
  return vec;
}


async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const col = client.db(dbName).collection("users");

  // כל מי שחסר לו embedding (או לא מערך)
  const filter = {
    $or: [
      { embedding: { $exists: false } },
      { embedding: null },
      { embedding: { $not: { $type: "array" } } }
    ]
  };

  const totalMissing = await col.countDocuments(filter);
  console.log(`🔎 users missing embeddings: ${totalMissing}`);

  const cursor = col.find(filter).batchSize(20);

  let done = 0, shownExamples = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();

    // טקסט עמוק מכל השדות (כולל מקוננים). אם עדיין ריק – fallback קל.
    let text = autoTextDeep(doc);
    if (!text || !text.trim()) {
      text = `user:${doc?._id} status:${doc?.status ?? ""} role:${doc?.role ?? ""} name:${doc?.name ?? doc?.fullName ?? ""}`;
    }

    if (shownExamples < 3) {
      console.log("🧩 example text for", String(doc._id), "=>", text.slice(0, 200));
      shownExamples++;
    }

    try {
      const emb = await embedText(text);
      await col.updateOne({ _id: doc._id }, { $set: { embedding: emb } });
      done++;
      if (done % 10 === 0) console.log(`users: indexed ${done}/${totalMissing}...`);
    } catch (err) {
      console.error(`❌ Error embedding user ${doc._id}:`, err?.message || err);
      await col.updateOne({ _id: doc._id }, { $set: { embedding: null } });
    }
  }

  console.log(`✅ users: indexed ${done} (out of ${totalMissing})`);
  await client.close();
}

main().catch((e) => { console.error("❌ embedUsers:", e); process.exit(1); });
