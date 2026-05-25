import { useMemo, useState } from "react";
import { useSessionStore } from "../store/sessionStore";

export function MasterList() {
  const masterList = useSessionStore((s) => s.masterList);
  const selectedPartNum = useSessionStore((s) => s.selectedPartNum);
  const selectPart = useSessionStore((s) => s.selectPart);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return masterList;
    return masterList.filter(
      (p) =>
        p.partNum.toLowerCase().includes(q) ||
        p.partName.toLowerCase().includes(q),
    );
  }, [masterList, search]);

  if (masterList.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-gray-500">
        <p>
          Add Lego sets to build a master parts list sorted by how many you need
          most.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-3">
        <h2 className="text-sm font-semibold text-gray-800">Master list</h2>
        <p className="text-xs text-gray-500">
          By part type (all colors combined). Click a row to select.
        </p>
        <input
          type="search"
          placeholder="Search parts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-2 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-gray-100 text-xs text-gray-600">
            <tr>
              <th className="px-2 py-2 w-12"></th>
              <th className="px-2 py-2">Part</th>
              <th className="px-2 py-2 w-20 text-right">Need</th>
              <th className="px-2 py-2 w-20 text-right">Found</th>
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
                  className={`cursor-pointer border-b border-gray-100 hover:bg-blue-50 ${
                    selected ? "bg-blue-100" : done ? "bg-green-50/50" : ""
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
                      <div className="h-8 w-8 rounded bg-gray-200" />
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="font-mono text-xs text-gray-500">
                      {part.partNum}
                    </div>
                    <div className="text-gray-900 line-clamp-2">
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
                          ? "text-green-700"
                          : "text-gray-700"
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
      </div>
    </div>
  );
}
