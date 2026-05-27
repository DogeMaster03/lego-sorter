import type { Session } from "./types";
import { SESSION_VERSION } from "./types";

const SESSION_KEY = "bricksort:session:v1";
const API_KEY_KEY = "bricksort:api-key";
const SERVER_KEY_FLAG = "bricksort:server-key-configured";

const LEGACY_SESSION_KEY = "lego-sorter:session:v1";
const LEGACY_API_KEY_KEY = "lego-sorter:api-key";
const LEGACY_SERVER_KEY_FLAG = "lego-sorter:server-key-configured";

function migrateLegacyStorage(): void {
  const legacySession = localStorage.getItem(LEGACY_SESSION_KEY);
  if (legacySession && !localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, legacySession);
    localStorage.removeItem(LEGACY_SESSION_KEY);
  }

  const legacyKey = localStorage.getItem(LEGACY_API_KEY_KEY);
  if (legacyKey && !localStorage.getItem(API_KEY_KEY)) {
    localStorage.setItem(API_KEY_KEY, legacyKey);
    localStorage.removeItem(LEGACY_API_KEY_KEY);
  }

  const legacyFlag = localStorage.getItem(LEGACY_SERVER_KEY_FLAG);
  if (legacyFlag && !localStorage.getItem(SERVER_KEY_FLAG)) {
    localStorage.setItem(SERVER_KEY_FLAG, legacyFlag);
    localStorage.removeItem(LEGACY_SERVER_KEY_FLAG);
  }
}

let storageMigrated = false;

function ensureStorageMigrated(): void {
  if (storageMigrated) return;
  migrateLegacyStorage();
  storageMigrated = true;
}

export function markServerKeyConfigured(): void {
  ensureStorageMigrated();
  localStorage.setItem(SERVER_KEY_FLAG, "1");
}

export function isServerKeyConfigured(): boolean {
  ensureStorageMigrated();
  return localStorage.getItem(SERVER_KEY_FLAG) === "1";
}

export function loadApiKey(): string {
  ensureStorageMigrated();
  return localStorage.getItem(API_KEY_KEY) ?? "";
}

export function saveApiKey(key: string): void {
  ensureStorageMigrated();
  if (key) {
    localStorage.setItem(API_KEY_KEY, key);
  } else {
    localStorage.removeItem(API_KEY_KEY);
  }
}

export function loadSession(): Session | null {
  ensureStorageMigrated();
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
  ensureStorageMigrated();
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
  a.download = `bricksort-session-${date}.json`;
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
