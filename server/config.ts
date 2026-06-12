/** In-memory Rebrickable API key for local Node server (optional fallback). */
let rebrickableApiKey = "";

const envKey = () => process.env.REBRICKABLE_API_KEY?.trim() ?? "";

type HeaderMap = Record<string, string | string[] | undefined>;

function headerValue(headers: HeaderMap, name: string): string | undefined {
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Read a Rebrickable key from request headers (browser localStorage flow). */
export function rebrickableKeyFromHeaders(headers: HeaderMap): string | null {
  const auth = headerValue(headers, "authorization");
  if (auth) {
    const match = auth.match(/^key\s+(\S+)$/i);
    if (match?.[1]) return match[1].trim();
  }

  const direct = headerValue(headers, "x-rebrickable-key");
  if (direct?.trim()) return direct.trim();

  return null;
}

export function isServerKeyEnvOnly(): boolean {
  return !!process.env.VERCEL && !!envKey();
}

export function getRebrickableApiKey(headers?: HeaderMap): string {
  const fromHeader = headers ? rebrickableKeyFromHeaders(headers) : null;
  const key = fromHeader || envKey() || rebrickableApiKey.trim();
  if (!key) {
    throw new Error(
      "Rebrickable API key not configured. Add it in Settings (stored in your browser).",
    );
  }
  return key;
}

export function setRebrickableApiKey(key: string): void {
  if (process.env.VERCEL) return;
  rebrickableApiKey = key.trim();
}

export function hasRebrickableApiKey(headers?: HeaderMap): boolean {
  try {
    getRebrickableApiKey(headers);
    return true;
  } catch {
    return false;
  }
}
