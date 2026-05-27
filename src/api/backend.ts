import type { LoadedSet } from "../lib/types";
import type { RebrickableSetListItem } from "./rebrickable";

const API = "/api";

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof body === "object" && body && "error" in body
        ? String((body as { error: string }).error)
        : res.statusText;
    throw new Error(msg);
  }
  return body as T;
}

export async function isRebrickableConfigured(): Promise<boolean> {
  const data = await apiJson<{ configured: boolean }>(
    "/settings/rebrickable-key",
  );
  return data.configured;
}

export async function configureRebrickableKey(key: string): Promise<void> {
  await apiJson("/settings/rebrickable-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
}

export async function loadSet(input: string): Promise<LoadedSet> {
  return apiJson<LoadedSet>(`/sets/${encodeURIComponent(input)}`);
}

export async function getSetsThatContainPart(
  partNum: string,
  _apiKey: string,
  _limit = 25,
  rebrickableUrls: string[] = [],
): Promise<{
  sets: RebrickableSetListItem[];
  resolvedPartNum: string;
  usedBaseMoldFallback: boolean;
}> {
  const q =
    rebrickableUrls.length > 0
      ? `?rebrickableUrls=${encodeURIComponent(rebrickableUrls.join(","))}`
      : "";
  return apiJson(
    `/parts/${encodeURIComponent(partNum)}/sets${q}`,
  );
}

export async function brickognizePredictParts(
  imageBytes: ArrayBuffer,
): Promise<unknown> {
  const res = await fetch(`${API}/brickognize/predict-parts`, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: imageBytes,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof body === "object" && body && "error" in body
        ? String((body as { error: string }).error)
        : res.statusText;
    throw new Error(msg);
  }
  return body;
}
