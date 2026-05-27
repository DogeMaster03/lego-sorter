import * as backend from "./backend";
import * as rebrickable from "./rebrickable";
import {
  isServerKeyConfigured,
  loadApiKey,
  markServerKeyConfigured,
  saveApiKey,
} from "../lib/persist";

export const useNodeBackend = import.meta.env.VITE_BACKEND === "node";

export type { RebrickableSetListItem } from "./rebrickable";
export { isPrintedPartNum, partNumFromRebrickableUrl } from "./rebrickable";
export { clearColorsCache } from "./rebrickable";

export async function isRebrickableReady(): Promise<boolean> {
  if (useNodeBackend) return backend.isRebrickableConfigured();
  return !!loadApiKey();
}

export async function testApiKey(key: string): Promise<boolean> {
  if (useNodeBackend) {
    await backend.configureRebrickableKey(key);
    markServerKeyConfigured();
    return true;
  }
  await rebrickable.testApiKey(key);
  saveApiKey(key);
  return true;
}

export async function loadSet(
  input: string,
  apiKey?: string,
): Promise<import("../lib/types").LoadedSet> {
  if (useNodeBackend) return backend.loadSet(input);
  return rebrickable.loadSet(input, apiKey ?? loadApiKey());
}

export async function getSetsThatContainPart(
  partNum: string,
  apiKey: string,
  limit?: number,
  rebrickableUrls?: string[],
) {
  if (useNodeBackend) {
    return backend.getSetsThatContainPart(
      partNum,
      apiKey,
      limit,
      rebrickableUrls,
    );
  }
  return rebrickable.getSetsThatContainPart(
    partNum,
    apiKey,
    limit,
    rebrickableUrls,
  );
}

export async function brickognizePredictParts(
  imageBytes: ArrayBuffer,
): Promise<unknown> {
  if (useNodeBackend) return backend.brickognizePredictParts(imageBytes);
  if (!window.electronAPI?.brickognizePredictParts) {
    throw new Error("Brickognize requires the Electron app or Node server.");
  }
  return window.electronAPI.brickognizePredictParts(imageBytes);
}

export function getApiKeyForClient(): string {
  if (useNodeBackend) return "";
  return loadApiKey();
}

export { isServerKeyConfigured };
