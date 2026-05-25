import { create } from "zustand";
import type {
  Allocation,
  FoundEntry,
  LoadedSet,
  MasterPart,
  RoutingResult,
  Session,
} from "../lib/types";
import {
  createEmptySession,
  loadSession,
  saveSession,
} from "../lib/persist";

function deriveMasterList(sets: LoadedSet[]): MasterPart[] {
  const map = new Map<string, MasterPart>();

  for (const set of sets) {
    for (const part of set.parts) {
      const existing = map.get(part.partNum);
      if (existing) {
        existing.totalRequired += part.required;
        existing.totalFound += part.found;
        if (!existing.partImgUrl && part.partImgUrl) {
          existing.partImgUrl = part.partImgUrl;
        }
      } else {
        map.set(part.partNum, {
          partNum: part.partNum,
          partName: part.partName,
          partImgUrl: part.partImgUrl,
          totalRequired: part.required,
          totalFound: part.found,
        });
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.totalRequired - a.totalRequired,
  );
}

function allocatePieces(
  sets: LoadedSet[],
  partNum: string,
  colorId: number,
  quantity: number,
): { allocations: Allocation[]; surplus: number; updatedSets: LoadedSet[] } {
  const updatedSets = sets.map((s) => ({
    ...s,
    parts: s.parts.map((p) => ({ ...p })),
  }));

  type Demand = {
    setIndex: number;
    setNum: string;
    setName: string;
    totalParts: number;
    partIndex: number;
    needed: number;
  };

  const demands: Demand[] = [];

  updatedSets.forEach((set, setIndex) => {
    set.parts.forEach((part, partIndex) => {
      if (
        part.partNum === partNum &&
        part.colorId === colorId &&
        part.found < part.required
      ) {
        demands.push({
          setIndex,
          setNum: set.setNum,
          setName: set.name,
          totalParts: set.totalParts,
          partIndex,
          needed: part.required - part.found,
        });
      }
    });
  });

  demands.sort((a, b) => a.totalParts - b.totalParts);

  let remaining = quantity;
  const allocations: Allocation[] = [];

  for (const d of demands) {
    if (remaining <= 0) break;
    const alloc = Math.min(remaining, d.needed);
    if (alloc <= 0) continue;

    const part = updatedSets[d.setIndex].parts[d.partIndex];
    part.found += alloc;
    remaining -= alloc;

    const existing = allocations.find((a) => a.setNum === d.setNum);
    if (existing) {
      existing.quantity += alloc;
    } else {
      allocations.push({
        setNum: d.setNum,
        setName: d.setName,
        quantity: alloc,
      });
    }
  }

  return { allocations, surplus: remaining, updatedSets };
}

function touchSession(session: Session): Session {
  return { ...session, updatedAt: new Date().toISOString() };
}

interface SessionState {
  session: Session;
  masterList: MasterPart[];
  selectedPartNum: string | null;
  lastRouting: RoutingResult | null;
  isLoadingSet: boolean;
  loadError: string | null;

  initSession: () => void;
  setSessionName: (name: string) => void;
  importSession: (session: Session) => void;
  addSet: (set: LoadedSet) => void;
  removeSet: (setNum: string) => void;
  selectPart: (partNum: string | null) => void;
  logFoundPieces: (
    partNum: string,
    partName: string,
    colorId: number,
    colorName: string,
    quantity: number,
  ) => RoutingResult;
  getSetProgress: (setNum: string) => {
    complete: number;
    total: number;
    percent: number;
  };
  persist: () => void;
  setLoadingSet: (loading: boolean, error?: string | null) => void;
}

export const useSessionStore = create<SessionState>((set, get) => {
  const initial = loadSession() ?? createEmptySession();

  return {
    session: initial,
    masterList: deriveMasterList(initial.sets),
    selectedPartNum: null,
    lastRouting: null,
    isLoadingSet: false,
    loadError: null,

    initSession: () => {
      const saved = loadSession();
      if (saved) {
        set({
          session: saved,
          masterList: deriveMasterList(saved.sets),
        });
      }
    },

    setSessionName: (name) => {
      const session = touchSession({ ...get().session, name });
      set({ session });
      saveSession(session);
    },

    importSession: (session) => {
      const s = touchSession(session);
      set({
        session: s,
        masterList: deriveMasterList(s.sets),
        selectedPartNum: null,
        lastRouting: null,
      });
      saveSession(s);
    },

    addSet: (loadedSet) => {
      const { session } = get();
      if (session.sets.some((s) => s.setNum === loadedSet.setNum)) {
        set({ loadError: `Set ${loadedSet.setNum} is already loaded` });
        return;
      }
      const sets = [...session.sets, loadedSet];
      const updated = touchSession({ ...session, sets });
      set({
        session: updated,
        masterList: deriveMasterList(sets),
        loadError: null,
      });
      saveSession(updated);
    },

    removeSet: (setNum) => {
      const sets = get().session.sets.filter((s) => s.setNum !== setNum);
      const updated = touchSession({ ...get().session, sets });
      set({
        session: updated,
        masterList: deriveMasterList(sets),
        lastRouting: null,
      });
      saveSession(updated);
    },

    selectPart: (partNum) => set({ selectedPartNum: partNum }),

    logFoundPieces: (partNum, partName, colorId, colorName, quantity) => {
      const { session } = get();
      const { allocations, surplus, updatedSets } = allocatePieces(
        session.sets,
        partNum,
        colorId,
        quantity,
      );

      const entry: FoundEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        partNum,
        partName,
        colorId,
        colorName,
        quantity,
        allocations,
        surplus,
      };

      const updated = touchSession({
        ...session,
        sets: updatedSets,
        log: [entry, ...session.log],
      });

      const routing: RoutingResult = {
        partNum,
        partName,
        colorId,
        colorName,
        quantity,
        allocations,
        surplus,
      };

      set({
        session: updated,
        masterList: deriveMasterList(updatedSets),
        lastRouting: routing,
      });
      saveSession(updated);
      return routing;
    },

    getSetProgress: (setNum) => {
      const set = get().session.sets.find((s) => s.setNum === setNum);
      if (!set) return { complete: 0, total: 0, percent: 0 };
      const total = set.parts.reduce((s, p) => s + p.required, 0);
      const complete = set.parts.reduce((s, p) => s + Math.min(p.found, p.required), 0);
      const percent = total > 0 ? Math.round((complete / total) * 100) : 0;
      return { complete, total, percent };
    },

    persist: () => saveSession(get().session),

    setLoadingSet: (loading, error = null) =>
      set({ isLoadingSet: loading, loadError: error }),
  };
});

export { deriveMasterList };
