// server/ai/testSearchUsersByText.js
import { getMongo, embedText, runVectorSearch } from "../vectorSearch.js";

const queryText = process.argv.slice(2).join(" ") || "candidate with React Node.js experience";

async function main() {
  console.log("🔎 Query:", queryText);
  const queryVector = await embedText(queryText);

  const { client, db } = await getMongo();
  try {
    const results = await runVectorSearch(db, {
      collection: "users",
      index: "vector_index_users",
      path: "embedding",
      queryVector,
      limit: 5
    });
    console.log("✅ Top results:", results.map(r => ({
      _id: r._id,
      fullName: r.fullName || r.name,
      role: r.role,
      skills: r.skills,
      score: r.score
    })));
  } finally {
    await client.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
