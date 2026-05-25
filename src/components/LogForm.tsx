import { useEffect, useMemo, useState } from "react";
import { getColorsForPart } from "../lib/partColors";
import { useSessionStore } from "../store/sessionStore";

export function LogForm() {
  const session = useSessionStore((s) => s.session);
  const masterList = useSessionStore((s) => s.masterList);
  const selectedPartNum = useSessionStore((s) => s.selectedPartNum);
  const logFoundPieces = useSessionStore((s) => s.logFoundPieces);

  const [colorId, setColorId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [colorSearch, setColorSearch] = useState("");
  const [error, setError] = useState("");

  const selected = masterList.find((p) => p.partNum === selectedPartNum);

  const partColors = useMemo(
    () => getColorsForPart(session.sets, selectedPartNum),
    [session.sets, selectedPartNum],
  );

  const filteredColors = useMemo(() => {
    const q = colorSearch.trim().toLowerCase();
    if (!q) return partColors;
    return partColors.filter((c) => c.colorName.toLowerCase().includes(q));
  }, [partColors, colorSearch]);

  useEffect(() => {
    setColorId(null);
    setColorSearch("");
    setError("");
  }, [selectedPartNum]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selected) {
      setError("Select a part from the master list first.");
      return;
    }
    if (colorId === null) {
      setError("Select a color.");
      return;
    }
    if (quantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }
    const color = partColors.find((c) => c.colorId === colorId);
    logFoundPieces(
      selected.partNum,
      selected.partName,
      colorId,
      color?.colorName ?? `Color ${colorId}`,
      quantity,
    );
    setQuantity(1);
  }

  return (
    <div className="flex h-full flex-col border-l border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-3">
        <h2 className="text-sm font-semibold text-gray-800">Log found pieces</h2>
        <p className="text-xs text-gray-500">
          Select a part, then pick a color your sets need.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-3 p-3">
        {selected ? (
          <div className="rounded border border-blue-200 bg-blue-50 p-3">
            {selected.partImgUrl && (
              <img
                src={selected.partImgUrl}
                alt=""
                className="mb-2 h-16 w-16 object-contain"
              />
            )}
            <div className="font-mono text-xs text-gray-600">
              {selected.partNum}
            </div>
            <div className="text-sm font-medium">{selected.partName}</div>
            <div className="mt-1 text-xs text-gray-600">
              Need {selected.totalRequired} total · Found {selected.totalFound}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Click a row in the master list to auto-fill the part.
          </p>
        )}

        <div className="flex min-h-0 flex-1 flex-col">
          <label className="text-xs font-medium text-gray-700">Color</label>
          {!selected ? (
            <p className="mt-2 text-sm text-gray-500">Select a part first.</p>
          ) : partColors.length === 0 ? (
            <p className="mt-2 text-sm text-amber-700">
              No colors for this part in your loaded sets.
            </p>
          ) : (
            <>
              <input
                type="search"
                placeholder="Filter colors…"
                value={colorSearch}
                onChange={(e) => setColorSearch(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
              <div
                className="mt-2 flex-1 overflow-y-auto rounded border border-gray-300"
                role="listbox"
                aria-label="Color options"
              >
                {filteredColors.length === 0 ? (
                  <p className="p-3 text-sm text-gray-500">
                    No colors match &ldquo;{colorSearch}&rdquo;.
                  </p>
                ) : (
                  filteredColors.map((c) => {
                    const active = colorId === c.colorId;
                    return (
                      <button
                        key={c.colorId}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => setColorId(c.colorId)}
                        className={`flex w-full items-center justify-between border-b border-gray-100 px-3 py-2 text-left text-sm last:border-b-0 ${
                          active
                            ? "bg-blue-100 font-medium text-blue-900"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <span>{c.colorName}</span>
                        {c.stillNeeded > 0 && (
                          <span className="text-xs text-gray-500">
                            need {c.stillNeeded}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              {colorId !== null && (
                <p className="mt-1 text-xs text-gray-600">
                  Selected: {partColors.find((c) => c.colorId === colorId)?.colorName}
                </p>
              )}
            </>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
            }
            className="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!selected || partColors.length === 0}
          className="rounded bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Add pieces
        </button>
      </form>
    </div>
  );
}
