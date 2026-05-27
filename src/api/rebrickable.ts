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

export type RebrickableSetListItem = {
  set_num: string;
  name: string;
  year: number;
  num_parts: number;
};

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
  const res = await fetchRaw(url, apiKey);
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
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}${text ? `: ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

async function fetchRaw(url: string, apiKey: string): Promise<Response> {
  await throttle();
  return fetch(url, { headers: authHeaders(apiKey) });
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

interface RbPartSummary {
  part_num: string;
  name: string;
  print_of?: string | null;
  num_sets?: number;
}

interface RbPartColorRow {
  color_id?: number;
  num_sets: number;
  color?: { id: number };
}

function partColorId(row: RbPartColorRow): number | null {
  if (row.color_id != null) return row.color_id;
  if (row.color?.id != null) return row.color.id;
  return null;
}

/** Extract Rebrickable part id from a brickognize/rebrickable URL if present. */
export function partNumFromRebrickableUrl(url: string): string | null {
  const match = url.match(/rebrickable\.com\/parts\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]) : null;
}

function basePartNum(partNum: string): string {
  return partNum.replace(/(?:pb|pr|pat|p\d+b)\d+$/i, "");
}

/** True if part id is a printed/pattern variant (e.g. 6082pb01, 30303pr0001). */
export function isPrintedPartNum(partNum: string): boolean {
  return /(?:pb|pr|pat|p\d+b)\d+$/i.test(partNum);
}

/** Build candidate Rebrickable part numbers for a Brickognize id. */
function candidatePartNums(
  brickognizeId: string,
  rebrickableUrls: string[] = [],
): string[] {
  const candidates: string[] = [];
  const add = (id: string) => {
    const t = id.trim();
    if (t && !candidates.includes(t)) candidates.push(t);
  };

  add(brickognizeId);
  for (const url of rebrickableUrls) {
    const fromUrl = partNumFromRebrickableUrl(url);
    if (fromUrl) add(fromUrl);
  }

  // Only add base-mold fallback when Brickognize identified a printed part.
  if (isPrintedPartNum(brickognizeId)) {
    const base = basePartNum(brickognizeId);
    if (base !== brickognizeId) add(base);
  }

  return candidates;
}

/** Printed ids first, then base mold (only when query was a print). */
function orderedPartCandidates(candidates: string[], originalId: string): string[] {
  if (!isPrintedPartNum(originalId)) {
    return [originalId, ...candidates.filter((c) => c !== originalId)];
  }
  const base = basePartNum(originalId);
  const exact = candidates.filter((c) => c !== base);
  const fallback = candidates.filter((c) => c === base);
  return [...exact, ...fallback];
}

function isLikelyProductCollection(set: RebrickableSetListItem): boolean {
  if ((set.num_parts ?? 0) <= 0) return true;
  const name = set.name.toLowerCase();
  if (
    /\b(collection|bundle|kit|ultimate|value pack|combo|super pack|complete.*collection)\b/.test(
      name,
    )
  ) {
    return true;
  }
  if (/^K\d/i.test(set.set_num)) return true;
  if (/^500\d{4}/.test(set.set_num)) return true;
  return false;
}

async function setContainsAnyPartNum(
  setNum: string,
  partNums: string[],
  apiKey: string,
): Promise<boolean> {
  const wanted = new Set(partNums.map((p) => p.toLowerCase()));
  const inventory = await fetchAllSetParts(setNum, apiKey);
  return inventory.some((row) => wanted.has(row.part.part_num.toLowerCase()));
}

async function filterVerifiedSets(
  sets: RebrickableSetListItem[],
  verifyPartNums: string[],
  apiKey: string,
  maxVerify = 30,
): Promise<RebrickableSetListItem[]> {
  const filtered = sets.filter((s) => !isLikelyProductCollection(s));
  const verified: RebrickableSetListItem[] = [];

  for (const set of filtered.slice(0, maxVerify)) {
    if (await setContainsAnyPartNum(set.set_num, verifyPartNums, apiKey)) {
      verified.push(set);
    }
  }

  return verified;
}

/** Related part for search enrichment — never pull prints when query is plain. */
function isRelatedPartNum(query: string, partNum: string): boolean {
  const q = query.toLowerCase();
  const p = partNum.toLowerCase();
  if (p === q) return true;
  if (!isPrintedPartNum(query)) return false;
  const base = basePartNum(query).toLowerCase();
  if (p === base) return true;
  return false;
}

async function fetchPartSetsPage(
  partNum: string,
  apiKey: string,
): Promise<RebrickableSetListItem[] | null> {
  const results: RebrickableSetListItem[] = [];
  let url: string | null = `${BASE}/lego/parts/${encodeURIComponent(partNum)}/sets/?page_size=1000`;

  while (url) {
    const res = await fetchRaw(url, apiKey);
    if (res.status === 404) return null;
    if (res.status === 401) throw new Error("Invalid API key");
    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      const detail =
        typeof body === "object" && body && "detail" in body
          ? String((body as { detail: string }).detail)
          : "Rate limited — wait a moment and try again";
      throw new Error(detail);
    }
    if (!res.ok) throw new Error(`API error ${res.status}`);

    const page = (await res.json()) as PagedResponse<RebrickableSetListItem>;
    results.push(...page.results);
    url = page.next;
  }

  return results;
}

async function fetchPartSetsViaColors(
  partNum: string,
  apiKey: string,
  maxColors = 8,
): Promise<RebrickableSetListItem[] | null> {
  const colorsUrl = `${BASE}/lego/parts/${encodeURIComponent(partNum)}/colors/`;
  const res = await fetchRaw(colorsUrl, apiKey);
  if (res.status === 404) return null;
  if (!res.ok) return null;

  const colorsPage = (await res.json()) as PagedResponse<RbPartColorRow>;
  const colors = colorsPage.results
    .filter((c) => c.num_sets > 0)
    .sort((a, b) => b.num_sets - a.num_sets)
    .slice(0, maxColors);

  if (colors.length === 0) return [];

  const merged: RebrickableSetListItem[] = [];
  const seen = new Set<string>();

  for (const color of colors) {
    const colorId = partColorId(color);
    if (colorId == null) continue;
    let url: string | null = `${BASE}/lego/parts/${encodeURIComponent(partNum)}/colors/${colorId}/sets/?page_size=1000`;
    while (url) {
      const pageRes = await fetchRaw(url, apiKey);
      if (pageRes.status === 404) break;
      if (!pageRes.ok) break;
      const page = (await pageRes.json()) as PagedResponse<RebrickableSetListItem>;
      for (const s of page.results) {
        if (!seen.has(s.set_num)) {
          seen.add(s.set_num);
          merged.push(s);
        }
      }
      url = page.next;
    }
  }

  return merged;
}

async function enrichCandidatesFromPartNumsParam(
  partNums: string[],
  apiKey: string,
  candidates: string[],
  originalId: string,
): Promise<void> {
  if (partNums.length === 0) return;
  try {
    const list = partNums.slice(0, 10).join(",");
    const data = await fetchJson<PagedResponse<RbPartSummary>>(
      `${BASE}/lego/parts/?part_nums=${encodeURIComponent(list)}&inc_part_details=1`,
      apiKey,
    );
    for (const part of data.results) {
      if (!isRelatedPartNum(originalId, part.part_num)) continue;
      if (!candidates.includes(part.part_num)) candidates.push(part.part_num);
      if (
        isPrintedPartNum(originalId) &&
        part.print_of &&
        !candidates.includes(part.print_of)
      ) {
        candidates.push(part.print_of);
      }
    }
  } catch {
    // best-effort
  }
}

async function enrichCandidatesFromSearch(
  query: string,
  apiKey: string,
  candidates: string[],
): Promise<void> {
  if (!isPrintedPartNum(query)) return;
  try {
    const data = await fetchJson<PagedResponse<RbPartSummary>>(
      `${BASE}/lego/parts/?search=${encodeURIComponent(query)}&inc_part_details=1&page_size=10`,
      apiKey,
    );
    for (const part of data.results) {
      if (!isRelatedPartNum(query, part.part_num)) continue;
      if (!candidates.includes(part.part_num)) candidates.push(part.part_num);
      if (part.print_of && !candidates.includes(part.print_of)) {
        candidates.push(part.print_of);
      }
    }
  } catch {
    // search is best-effort
  }
}

async function enrichCandidatesFromPartDetail(
  partNum: string,
  apiKey: string,
  candidates: string[],
  originalId: string,
): Promise<void> {
  if (!isPrintedPartNum(originalId)) return;
  try {
    const detail = await fetchJson<RbPartSummary>(
      `${BASE}/lego/parts/${encodeURIComponent(partNum)}/?inc_part_details=1`,
      apiKey,
    );
    if (detail.print_of && !candidates.includes(detail.print_of)) {
      candidates.push(detail.print_of);
    }
  } catch {
    // detail lookup is best-effort
  }
}

export async function getSetsThatContainPart(
  partNum: string,
  apiKey: string,
  limit = 25,
  rebrickableUrls: string[] = [],
): Promise<{
  sets: RebrickableSetListItem[];
  resolvedPartNum: string;
  usedBaseMoldFallback: boolean;
}> {
  const candidates = candidatePartNums(partNum, rebrickableUrls);
  await enrichCandidatesFromPartNumsParam(candidates, apiKey, candidates, partNum);
  await enrichCandidatesFromSearch(partNum, apiKey, candidates);
  for (const c of [...candidates]) {
    await enrichCandidatesFromPartDetail(c, apiKey, candidates, partNum);
  }

  const ordered = orderedPartCandidates(candidates, partNum);
  const base = basePartNum(partNum);
  const strictPlain = !isPrintedPartNum(partNum);

  async function collectRawSets(
    candidate: string,
  ): Promise<RebrickableSetListItem[]> {
    const merged = new Map<string, RebrickableSetListItem>();
    const direct = await fetchPartSetsPage(candidate, apiKey);
    if (direct) {
      for (const s of direct) merged.set(s.set_num, s);
    }
    const viaColors = await fetchPartSetsViaColors(candidate, apiKey);
    if (viaColors) {
      for (const s of viaColors) merged.set(s.set_num, s);
    }
    return Array.from(merged.values());
  }

  // 1) Try candidates in order; verify inventory contains that exact part id.
  const primaryIds = strictPlain
    ? ordered.filter((c) => !isPrintedPartNum(c))
    : ordered.filter((c) => c !== base);

  for (const candidate of primaryIds) {
    const raw = await collectRawSets(candidate);
    const verified = await filterVerifiedSets(raw, [candidate], apiKey);
    if (verified.length > 0) {
      const list = verified
        .sort((a, b) => (a.num_parts ?? 0) - (b.num_parts ?? 0))
        .slice(0, limit);
      return {
        sets: list,
        resolvedPartNum: candidate,
        usedBaseMoldFallback: false,
      };
    }
  }

  // 2) Fall back to base mold only when Brickognize identified a printed part.
  if (!strictPlain && base !== partNum && ordered.includes(base)) {
    const raw = await collectRawSets(base);
    const verified = await filterVerifiedSets(raw, [base], apiKey);
    if (verified.length > 0) {
      const list = verified
        .sort((a, b) => (a.num_parts ?? 0) - (b.num_parts ?? 0))
        .slice(0, limit);
      return {
        sets: list,
        resolvedPartNum: base,
        usedBaseMoldFallback: true,
      };
    }
  }

  throw new Error(
    `No official LEGO sets found containing "${partNum}" (bundles/collections were excluded). Add a set manually if you know which one you are rebuilding.`,
  );
}
