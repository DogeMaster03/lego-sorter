import type { LoadedSet } from "./types";

export interface PartColorOption {
  colorId: number;
  colorName: string;
  stillNeeded: number;
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
