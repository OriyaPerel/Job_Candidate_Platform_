// server/ai/aiRoute.js
import express from "express";
import { searchFreeText } from "./searchFlow.js";
import { chatTurn } from "./chatFlow.js";

const router = express.Router();

router.get("/health", (_req, res) => res.json({ ok: true, service: "ai" }));


router.post("/query", async (req, res) => {
  try {
    const q = (req.body?.query || "").trim();
    const topK = req.body?.topK;
    const target = req.body?.target;
    const filters = req.body?.filters;

    if (!q) return res.status(400).json({ error: "Missing 'query' in body" });

    const data = await searchFreeText(q, { topK, target, filters });
    res.json(data);
  } catch (err) {
    console.error("AI /query error:", err);
    res.status(500).json({ error: "AI query failed", detail: err?.message || String(err) });
  }
});


router.post("/chat", async (req, res) => {
  try {
    const message = (req.body?.message || "").trim();
    if (!message) return res.status(400).json({ error: "Missing 'message' in body" });

    const options = {
      target: req.body?.target,
      topK: req.body?.topK,
      filters: req.body?.filters,
      history: Array.isArray(req.body?.history) ? req.body.history : []
    };

    const data = await chatTurn(message, options);
    res.json(data);
  } catch (err) {
    console.error("AI /chat error:", err);
    res.status(500).json({ error: "AI chat failed", detail: err?.message || String(err) });
  }
});

export default router;
