import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readRawBody } from "../_lib/readBody";
import { predictParts } from "../../server/brickognize";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const buffer = await readRawBody(req);
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
}
