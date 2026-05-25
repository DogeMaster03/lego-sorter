import type { LoadedSet, RebrickableColor, SetPart } from "../lib/types";
import { candidateSetNums } from "../lib/normalizeSetNum";

const BASE = "https://rebrickable.com/api/v3";

let lastRequestAt = 0;
const MIN_INTERVAL_MS = 1100;

async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastRequestAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

interface PagedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface RbSet {
  set_num: string;
  name: string;
  year: number;
  num_parts: number;
}

interface RbInventoryPart {
  part: {
    part_num: string;
    name: string;
    part_img_url: string | null;
  };
  color: {
    id: number;
    name: string;
    rgb: string;
  };
  quantity: number;
}

function authHeaders(apiKey: string): HeadersInit {
  return { Authorization: `key ${apiKey}` };
}

async function fetchJson<T>(url: string, apiKey: string): Promise<T> {
  await throttle();
  const res = await fetch(url, { headers: authHeaders(apiKey) });
  if (res.status === 401) throw new Error("Invalid API key");
  if (res.status === 404) throw new Error("Not found");
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    const detail =
      typeof body === "object" && body && "detail" in body
        ? String((body as { detail: string }).detail)
        : "Rate limited — wait a moment and try again";
    throw new Error(detail);
  }
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

export async function testApiKey(apiKey: string): Promise<boolean> {
  await fetchJson<PagedResponse<RebrickableColor>>(
    `${BASE}/lego/colors/?page_size=1`,
    apiKey,
  );
  return true;
}

let colorsCache: RebrickableColor[] | null = null;

export async function fetchColors(apiKey: string): Promise<RebrickableColor[]> {
  if (colorsCache) return colorsCache;
  const all: RebrickableColor[] = [];
  let pageNum = 1;
  let next: string | null = `${BASE}/lego/colors/?page_size=1000&page=${pageNum}`;

  while (next) {
    const res: PagedResponse<RebrickableColor> =
      await fetchJson<PagedResponse<RebrickableColor>>(next, apiKey);
    all.push(...res.results);
    next = res.next;
    pageNum++;
    if (!res.next) break;
    if (pageNum > 20) break;
  }

  colorsCache = all.sort((a, b) => a.name.localeCompare(b.name));
  return colorsCache;
}

export function clearColorsCache(): void {
  colorsCache = null;
}

async function resolveSetNum(
  input: string,
  apiKey: string,
): Promise<RbSet> {
  const candidates = candidateSetNums(input);
  let lastError: Error | null = null;

  for (const setNum of candidates) {
    try {
      return await fetchJson<RbSet>(
        `${BASE}/lego/sets/${encodeURIComponent(setNum)}/`,
        apiKey,
      );
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (lastError.message !== "Not found") throw lastError;
    }
  }

  throw lastError ?? new Error(`Set not found: ${input}`);
}

async function fetchAllSetParts(
  setNum: string,
  apiKey: string,
): Promise<RbInventoryPart[]> {
  const all: RbInventoryPart[] = [];
  let url: string | null =
    `${BASE}/lego/sets/${encodeURIComponent(setNum)}/parts/?inc_part_details=1&page_size=1000`;

  while (url) {
    const res: PagedResponse<RbInventoryPart> =
      await fetchJson<PagedResponse<RbInventoryPart>>(url, apiKey);
    all.push(...res.results);
    url = res.next;
  }

  return all;
}

export async function loadSet(
  input: string,
  apiKey: string,
): Promise<LoadedSet> {
  const meta = await resolveSetNum(input, apiKey);
  const inventory = await fetchAllSetParts(meta.set_num, apiKey);

  const parts: SetPart[] = inventory.map((row) => ({
    partNum: row.part.part_num,
    partName: row.part.name,
    partImgUrl: row.part.part_img_url ?? "",
    colorId: row.color.id,
    colorName: row.color.name,
    required: row.quantity,
    found: 0,
  }));

  const totalParts = parts.reduce((sum, p) => sum + p.required, 0);

  return {
    setNum: meta.set_num,
    name: meta.name,
    year: meta.year,
    totalParts,
    parts,
  };
}

export async function searchSets(
  query: string,
  apiKey: string,
): Promise<RbSet[]> {
  const q = encodeURIComponent(query.trim());
  const data = await fetchJson<PagedResponse<RbSet>>(
    `${BASE}/lego/sets/?search=${q}&page_size=20`,
    apiKey,
  );
  return data.results;
}
