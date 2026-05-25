import type { Session } from "./types";
import { SESSION_VERSION } from "./types";

const SESSION_KEY = "lego-sorter:session:v1";
const API_KEY_KEY = "lego-sorter:api-key";

export function loadApiKey(): string {
  return localStorage.getItem(API_KEY_KEY) ?? "";
}

export function saveApiKey(key: string): void {
  if (key) {
    localStorage.setItem(API_KEY_KEY, key);
  } else {
    localStorage.removeItem(API_KEY_KEY);
  }
}

export function loadSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    if (parsed.version !== SESSION_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function exportSession(session: Session): void {
  const blob = new Blob([JSON.stringify(session, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `lego-session-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportedSession(text: string): Session {
  const parsed = JSON.parse(text) as Session;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid session file");
  }
  if (parsed.version !== SESSION_VERSION) {
    throw new Error(`Unsupported session version: ${parsed.version}`);
  }
  if (!Array.isArray(parsed.sets) || !Array.isArray(parsed.log)) {
    throw new Error("Session file is missing required fields");
  }
  return parsed;
}

export function createEmptySession(name = "My session"): Session {
  return {
    version: SESSION_VERSION,
    id: crypto.randomUUID(),
    name,
    updatedAt: new Date().toISOString(),
    sets: [],
    log: [],
  };
}
