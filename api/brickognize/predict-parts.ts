import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readImageBuffer } from "../_lib/imagePayload";
import { predictParts } from "../../server/brickognize";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const buffer = await readImageBuffer(req);
    const result = await predictParts(buffer);
    res.json(result);
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Brickognize request failed",
    });
  }
}
