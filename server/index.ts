import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getRebrickableApiKey,
  hasRebrickableApiKey,
  setRebrickableApiKey,
} from "./config.js";
import { predictParts } from "./brickognize.js";
import {
  getSetsThatContainPart,
  loadSet,
  testApiKey,
} from "../src/api/rebrickable.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === "production";

const app = express();
app.use(cors());
app.use(express.json({ limit: "12mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    rebrickableConfigured: hasRebrickableApiKey(),
  });
});

app.get("/api/settings/rebrickable-key", (_req, res) => {
  res.json({ configured: hasRebrickableApiKey() });
});

app.post("/api/settings/rebrickable-key", async (req, res) => {
  try {
    const key = String(req.body?.key ?? "").trim();
    if (!key) {
      res.status(400).json({ error: "API key is required" });
      return;
    }
    await testApiKey(key);
    setRebrickableApiKey(key);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Invalid API key",
    });
  }
});

app.get("/api/sets/:setNum", async (req, res) => {
  try {
    const set = await loadSet(req.params.setNum, getRebrickableApiKey());
    res.json(set);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load set";
    const status = msg === "Not found" ? 404 : 400;
    res.status(status).json({ error: msg });
  }
});

app.get("/api/parts/:partNum/sets", async (req, res) => {
  try {
    const urlsParam = req.query.rebrickableUrls;
    const rebrickableUrls =
      typeof urlsParam === "string" && urlsParam
        ? urlsParam.split(",").map((u) => decodeURIComponent(u))
        : [];

    const result = await getSetsThatContainPart(
      req.params.partNum,
      getRebrickableApiKey(),
      25,
      rebrickableUrls,
    );
    res.json(result);
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Failed to find sets",
    });
  }
});

app.post(
  "/api/brickognize/predict-parts",
  express.raw({ type: ["image/jpeg", "image/png", "application/octet-stream"], limit: "12mb" }),
  async (req, res) => {
    try {
      const buffer = Buffer.from(req.body);
      if (!buffer.length) {
        res.status(400).json({ error: "Empty image" });
        return;
      }
      const result = await predictParts(buffer);
      res.json(result);
    } catch (e) {
      res.status(400).json({
        error: e instanceof Error ? e.message : "Brickognize request failed",
      });
    }
  },
);

if (isProd) {
  const dist = path.join(__dirname, "..", "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Bricksort API http://localhost:${PORT}`);
  if (process.env.REBRICKABLE_API_KEY) {
    console.log("Rebrickable API key loaded from REBRICKABLE_API_KEY");
  }
});
