/** Normalize user input like "10261" or "10261-1" for Rebrickable lookups. */
export function normalizeSetNumInput(input: string): string {
  return input.trim().toUpperCase();
}

/** If input has no variant suffix, try common -1 variant first. */
export function candidateSetNums(input: string): string[] {
  const normalized = normalizeSetNumInput(input);
  if (!normalized) return [];
  if (/-\d+$/.test(normalized)) return [normalized];
  return [normalized, `${normalized}-1`];
}
