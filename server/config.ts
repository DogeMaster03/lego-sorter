/** In-memory Rebrickable API key for local Node server (not used on Vercel). */
let rebrickableApiKey = "";

const envKey = () => process.env.REBRICKABLE_API_KEY?.trim() ?? "";

export function isServerKeyEnvOnly(): boolean {
  return !!process.env.VERCEL && !!envKey();
}

export function getRebrickableApiKey(): string {
  const key = envKey() || rebrickableApiKey.trim();
  if (!key) {
    throw new Error("Rebrickable API key not configured. Add it in Settings.");
  }
  return key;
}

export function setRebrickableApiKey(key: string): void {
  if (process.env.VERCEL) {
    throw new Error(
      "On Vercel, set REBRICKABLE_API_KEY in project environment variables.",
    );
  }
  rebrickableApiKey = key.trim();
}

export function hasRebrickableApiKey(): boolean {
  return !!(envKey() || rebrickableApiKey.trim());
}
