import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasRebrickableApiKey } from "../server/config";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({
    ok: true,
    rebrickableConfigured: hasRebrickableApiKey(),
  });
}
