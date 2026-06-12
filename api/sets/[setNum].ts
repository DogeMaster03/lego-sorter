import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRebrickableApiKey } from "../../server/config";
import { loadSet } from "../../src/api/rebrickable";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const setNum = req.query.setNum;
  if (typeof setNum !== "string" || !setNum) {
    res.status(400).json({ error: "Set number is required" });
    return;
  }

  try {
    const set = await loadSet(setNum, getRebrickableApiKey(req.headers));
    res.json(set);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load set";
    const status = msg === "Not found" ? 404 : 400;
    res.status(status).json({ error: msg });
  }
}
