import { useMemo, useState } from "react";
import { getSessionColors, partAppearsInColor } from "../lib/partColors";
import { useSessionStore } from "../store/sessionStore";

export function MasterList() {
  const session = useSessionStore((s) => s.session);
  const masterList = useSessionStore((s) => s.masterList);
  const selectedPartNum = useSessionStore((s) => s.selectedPartNum);
  const selectPart = useSessionStore((s) => s.selectPart);
  const [search, setSearch] = useState("");
  const [colorFilter, setColorFilter] = useState<number | "">("");

  const sessionColors = useMemo(
    () => getSessionColors(session.sets),
    [session.sets],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return masterList.filter((p) => {
      if (colorFilter !== "" && !partAppearsInColor(session.sets, p.partNum, colorFilter)) {
        return false;
      }
      if (!q) return true;
      return (
        p.partNum.toLowerCase().includes(q) ||
        p.partName.toLowerCase().includes(q)
      );
    });
  }, [masterList, search, colorFilter, session.sets]);

  if (masterList.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-gray-500 dark:text-gray-400">
        <p>
          Add Lego sets to build a master parts list sorted by how many you need
          most.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-3 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Master list</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          By part type (all colors combined). Filter by color or search, then click a row.
        </p>
        <div className="mt-2 space-y-2">
          <select
            value={colorFilter}
            onChange={(e) => {
              const value = e.target.value;
              setColorFilter(value === "" ? "" : Number(value));
            }}
            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            aria-label="Filter by color"
          >
            <option value="">All colors</option>
            {sessionColors.map((c) => (
              <option key={c.colorId} value={c.colorId}>
                {c.colorName} ({c.partCount} part{c.partCount !== 1 ? "s" : ""})
              </option>
            ))}
          </select>
          <input
            type="search"
            placeholder="Search parts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        {(colorFilter !== "" || search.trim()) && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Showing {filtered.length} of {masterList.length} parts
          </p>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
            No parts match this filter.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-gray-100 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="w-12 px-2 py-2"></th>
                <th className="px-2 py-2">Part</th>
                <th className="w-20 px-2 py-2 text-right">Need</th>
                <th className="w-20 px-2 py-2 text-right">Found</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((part) => {
                const selected = part.partNum === selectedPartNum;
                const done = part.totalFound >= part.totalRequired;
                return (
                  <tr
                    key={part.partNum}
                    onClick={() => selectPart(part.partNum)}
                    className={`cursor-pointer border-b border-gray-100 hover:bg-blue-50 dark:border-gray-800 dark:hover:bg-blue-950/40 ${
                      selected
                        ? "bg-blue-100 dark:bg-blue-900/40"
                        : done
                          ? "bg-green-50/50 dark:bg-green-950/30"
                          : ""
                    }`}
                  >
                    <td className="px-2 py-1.5">
                      {part.partImgUrl ? (
                        <img
                          src={part.partImgUrl}
                          alt=""
                          className="h-8 w-8 object-contain"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-700" />
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
                        {part.partNum}
                      </div>
                      <div className="line-clamp-2 text-gray-900 dark:text-gray-100">
                        {part.partName}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right font-medium">
                      {part.totalRequired}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <span
                        className={
                          part.totalFound >= part.totalRequired
                            ? "text-green-700 dark:text-green-400"
                            : "text-gray-700 dark:text-gray-300"
                        }
                      >
                        {part.totalFound}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
