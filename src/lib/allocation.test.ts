/**
 * Smoke tests for allocation logic (run with: npx tsx src/lib/allocation.test.ts)
 * Or import deriveMasterList / allocate via session store in dev.
 */
import type { LoadedSet } from "./types";

function allocatePieces(
  sets: LoadedSet[],
  partNum: string,
  colorId: number,
  quantity: number,
) {
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
  const allocations: { setNum: string; quantity: number }[] = [];

  for (const d of demands) {
    if (remaining <= 0) break;
    const alloc = Math.min(remaining, d.needed);
    if (alloc <= 0) continue;
    updatedSets[d.setIndex].parts[d.partIndex].found += alloc;
    remaining -= alloc;
    const existing = allocations.find((a) => a.setNum === d.setNum);
    if (existing) existing.quantity += alloc;
    else allocations.push({ setNum: d.setNum, quantity: alloc });
  }

  return { allocations, surplus: remaining };
}

function makeSet(
  setNum: string,
  name: string,
  totalParts: number,
  parts: LoadedSet["parts"],
): LoadedSet {
  return { setNum, name, year: 2020, totalParts, parts };
}

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) {
    passed++;
    console.log(`  OK: ${msg}`);
  } else {
    failed++;
    console.error(`  FAIL: ${msg}`);
  }
}

// Small set (100 parts) should get priority over large set (1000 parts)
const sets: LoadedSet[] = [
  makeSet("BIG-1", "Big Set", 1000, [
    {
      partNum: "3001",
      partName: "Brick 2x4",
      partImgUrl: "",
      colorId: 7,
      colorName: "Gray",
      required: 5,
      found: 0,
    },
  ]),
  makeSet("SMALL-1", "Small Set", 50, [
    {
      partNum: "3001",
      partName: "Brick 2x4",
      partImgUrl: "",
      colorId: 7,
      colorName: "Gray",
      required: 2,
      found: 0,
    },
  ]),
];

const r1 = allocatePieces(sets, "3001", 7, 3);
assert(
  r1.allocations[0]?.setNum === "SMALL-1" && r1.allocations[0].quantity === 2,
  "small set gets 2 first",
);
assert(
  r1.allocations[1]?.setNum === "BIG-1" && r1.allocations[1].quantity === 1,
  "large set gets remainder",
);
assert(r1.surplus === 0, "no surplus when fully allocated");

const r2 = allocatePieces(sets, "3001", 999, 5);
assert(r2.allocations.length === 0, "unknown color has no allocations");
assert(r2.surplus === 5, "all quantity is surplus");

// Black is Rebrickable color id 0 — must not be treated as falsy
const blackSets: LoadedSet[] = [
  makeSet("SET-1", "Test", 10, [
    {
      partNum: "60470b",
      partName: "Plate Clip",
      partImgUrl: "",
      colorId: 0,
      colorName: "Black",
      required: 1,
      found: 0,
    },
  ]),
];
const r3 = allocatePieces(blackSets, "60470b", 0, 1);
assert(
  r3.allocations[0]?.setNum === "SET-1" && r3.allocations[0].quantity === 1,
  "color id 0 (Black) allocates correctly",
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
