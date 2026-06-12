import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRebrickableApiKey } from "../../../server/config";
import { getSetsThatContainPart } from "../../../src/api/rebrickable";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const partNum = req.query.partNum;
  if (typeof partNum !== "string" || !partNum) {
    res.status(400).json({ error: "Part number is required" });
    return;
  }

  try {
    const urlsParam = req.query.rebrickableUrls;
    const rebrickableUrls =
      typeof urlsParam === "string" && urlsParam
        ? urlsParam.split(",").map((u) => decodeURIComponent(u))
        : [];

    const result = await getSetsThatContainPart(
      partNum,
      getRebrickableApiKey(req.headers),
      25,
      rebrickableUrls,
    );
    res.json(result);
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Failed to find sets",
    });
  }
}
