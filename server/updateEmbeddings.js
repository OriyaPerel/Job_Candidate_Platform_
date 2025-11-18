// server/updateEmbeddings.js  (Node 22+, ESM)
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// נטען .env משני מיקומים אפשריים: ../.env (שורש הפרויקט) ואז fallback ל- server/.env
const rootEnv = path.resolve(__dirname, "../.env");
const serverEnv = path.resolve(__dirname, ".env");

// נסי לטעון קודם מהשורש, ואם לא נמצא—מהתיקייה הנוכחית
let loaded = dotenv.config({ path: rootEnv });
if (loaded.error) {
  loaded = dotenv.config({ path: serverEnv });
}

function pick(...keys) {
  for (const k of keys) {
    if (process.env[k] && String(process.env[k]).trim() !== "") return process.env[k];
  }
  return undefined;
}

// תומך בשמות שונים למשתנים:
const uri = pick("MONGODB_URI", "MONGO_URI", "ATLAS_URI");
const dbName = pick("MONGODB_DB", "DB_NAME") || "projectDB";

// לוג דיבאג קצר להבין מה נטען
console.log("ENV loaded from:", loaded.error ? "(none)" : loaded.parsed ? "file" : "process");
console.log("Resolved .env paths:", { rootEnv, serverEnv });
console.log("Has URI?", Boolean(uri), "| DB:", dbName);

if (!uri) {
  console.error("❌ Missing Mongo URI. Please set MONGODB_URI (or MONGO_URI / ATLAS_URI) in your .env");
  process.exit(1);
}

async function addEmbeddingField(collectionName) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection(collectionName);

    console.log(`🔹 Updating ${collectionName} in DB "${dbName}"...`);

    const filter = {
      $or: [
        { embedding: { $exists: false } },
        { embedding: null },
        { embedding: { $not: { $type: "array" } } }
      ]
    };

    const res = await col.updateMany(filter, { $set: { embedding: null } });
    console.log(`✅ ${collectionName}: matched=${res.matchedCount}, modified=${res.modifiedCount}`);
  } finally {
    await client.close();
  }
}

(async () => {
  try {
    for (const name of ["users", "jobs", "applications"]) {
      await addEmbeddingField(name);
    }
    console.log("🎉 All collections updated successfully!");
  } catch (e) {
    console.error("❌ Error updating collections:", e?.message || e);
    process.exit(1);
  }
})();
