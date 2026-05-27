/** In-memory Rebrickable API key for the Node server (local use only). */
let rebrickableApiKey = process.env.REBRICKABLE_API_KEY ?? "";

export function getRebrickableApiKey(): string {
  const key = rebrickableApiKey.trim();
  if (!key) {
    throw new Error("Rebrickable API key not configured. Add it in Settings.");
  }
  return key;
}

export function setRebrickableApiKey(key: string): void {
  rebrickableApiKey = key.trim();
}

export function hasRebrickableApiKey(): boolean {
  return rebrickableApiKey.trim().length > 0;
}
