// server/ai/testSearchJobsByText.js
import { getMongo, embedText, runVectorSearch } from "../vectorSearch.js";

const queryText = process.argv.slice(2).join(" ") || "React Node.js full-stack developer";

async function main() {
  console.log("🔎 Query:", queryText);
  const queryVector = await embedText(queryText);

  const { client, db } = await getMongo();
  try {
    const results = await runVectorSearch(db, {
      collection: "jobs",
      index: "vector_index_jobs",   // ודאי שזה השם באטלס
      path: "embedding",
      queryVector,
      limit: 5
    });
    console.log("✅ Top results:", results.map(r => ({
      _id: r._id,
      title: r.title,
      company: r.company,
      location: r.location,
      score: r.score
    })));
  } finally {
    await client.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });

