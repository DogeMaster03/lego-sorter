import type { LoadedSet } from "./types";

export interface PartColorOption {
  colorId: number;
  colorName: string;
  stillNeeded: number;
}

export interface SessionColor {
  colorId: number;
  colorName: string;
  partCount: number;
}

/** All colors used across loaded sets, with how many part types appear in each. */
export function getSessionColors(sets: LoadedSet[]): SessionColor[] {
  const map = new Map<number, { colorName: string; parts: Set<string> }>();

  for (const set of sets) {
    for (const part of set.parts) {
      const existing = map.get(part.colorId);
      if (existing) {
        existing.parts.add(part.partNum);
      } else {
        map.set(part.colorId, {
          colorName: part.colorName,
          parts: new Set([part.partNum]),
        });
      }
    }
  }

  return Array.from(map.entries())
    .map(([colorId, { colorName, parts }]) => ({
      colorId,
      colorName,
      partCount: parts.size,
    }))
    .sort((a, b) => a.colorName.localeCompare(b.colorName));
}

/** Whether a part appears in the given color in any loaded set. */
export function partAppearsInColor(
  sets: LoadedSet[],
  partNum: string,
  colorId: number,
): boolean {
  for (const set of sets) {
    for (const part of set.parts) {
      if (part.partNum === partNum && part.colorId === colorId) return true;
    }
  }
  return false;
}

/** Colors required for this part across all loaded sets (from set data, no API). */
export function getColorsForPart(
  sets: LoadedSet[],
  partNum: string | null,
): PartColorOption[] {
  if (!partNum) return [];

  const map = new Map<number, PartColorOption>();

  for (const set of sets) {
    for (const part of set.parts) {
      if (part.partNum !== partNum) continue;
      const needed = Math.max(0, part.required - part.found);
      const existing = map.get(part.colorId);
      if (existing) {
        existing.stillNeeded += needed;
      } else {
        map.set(part.colorId, {
          colorId: part.colorId,
          colorName: part.colorName,
          stillNeeded: needed,
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.colorName.localeCompare(b.colorName),
  );
}
