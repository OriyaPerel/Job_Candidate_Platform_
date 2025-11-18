// server/ai/testMatchCandidatesForJob.js
import { getMongo, embedText, runVectorSearch, textFromDoc } from "../vectorSearch.js";
import { ObjectId } from "mongodb";

const jobId = process.argv[2];  // שימוש: node testMatchCandidatesForJob.js <jobId>
const topK = Number(process.argv[3] || 5);

async function main() {
  if (!jobId) throw new Error("Usage: node testMatchCandidatesForJob.js <jobId> [topK]");
  const { client, db } = await getMongo();

  try {
    const job = await db.collection("jobs").findOne({ _id: new ObjectId(jobId) });
    if (!job) throw new Error("Job not found");

    // אם יש embedding מוכן נשתמש בו; אחרת נבנה מחרוזת מהשדות ונאמד
    let queryVector = Array.isArray(job.embedding) ? job.embedding : await embedText(textFromDoc(job));

    const results = await runVectorSearch(db, {
      collection: "users",
      index: "vector_index_users",
      path: "embedding",
      queryVector,
      limit: topK
    });

    console.log(`✅ Best ${topK} candidates for job ${jobId}:`);
    for (const r of results) {
      console.log({ _id: r._id, fullName: r.fullName || r.name, role: r.role, score: r.score });
    }
  } finally {
    await client.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
