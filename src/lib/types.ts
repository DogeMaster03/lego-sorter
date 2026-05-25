export const SESSION_VERSION = 1;

export interface SetPart {
  partNum: string;
  partName: string;
  partImgUrl: string;
  colorId: number;
  colorName: string;
  required: number;
  found: number;
}

export interface LoadedSet {
  setNum: string;
  name: string;
  year: number;
  totalParts: number;
  parts: SetPart[];
}

export interface FoundEntry {
  id: string;
  timestamp: string;
  partNum: string;
  partName: string;
  colorId: number;
  colorName: string;
  quantity: number;
  allocations: Allocation[];
  surplus: number;
}

export interface Allocation {
  setNum: string;
  setName: string;
  quantity: number;
}

export interface Session {
  version: number;
  id: string;
  name: string;
  updatedAt: string;
  sets: LoadedSet[];
  log: FoundEntry[];
}

export interface MasterPart {
  partNum: string;
  partName: string;
  partImgUrl: string;
  totalRequired: number;
  totalFound: number;
}

export interface RebrickableColor {
  id: number;
  name: string;
  rgb: string;
  is_trans: boolean;
}

export interface RoutingResult {
  partNum: string;
  partName: string;
  colorId: number;
  colorName: string;
  quantity: number;
  allocations: Allocation[];
  surplus: number;
}
