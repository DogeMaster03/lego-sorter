import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  hasRebrickableApiKey,
  isServerKeyEnvOnly,
  setRebrickableApiKey,
} from "../../server/config";
import { testApiKey } from "../../src/api/rebrickable";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    res.json({ configured: hasRebrickableApiKey(), envOnly: isServerKeyEnvOnly() });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (isServerKeyEnvOnly()) {
    res.status(400).json({
      error:
        "This deployment uses REBRICKABLE_API_KEY from server environment variables. Set it in your Vercel project settings.",
    });
    return;
  }

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
}
