import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasRebrickableApiKey } from "../server/config";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    ok: true,
    rebrickableConfigured: hasRebrickableApiKey(req.headers),
  });
}
