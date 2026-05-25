import { useState } from "react";
import { useSessionStore } from "../store/sessionStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SetProgress({ open, onClose }: Props) {
  const session = useSessionStore((s) => s.session);
  const getSetProgress = useSessionStore((s) => s.getSetProgress);
  const [selectedSetNum, setSelectedSetNum] = useState(
    () => session.sets[0]?.setNum ?? "",
  );

  if (!open) return null;

  const selected = session.sets.find((s) => s.setNum === selectedSetNum);
  const prog = selectedSetNum ? getSetProgress(selectedSetNum) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold">Set progress</h2>
          {session.sets.length > 0 && (
            <select
              value={selectedSetNum}
              onChange={(e) => setSelectedSetNum(e.target.value)}
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {session.sets.map((s) => (
                <option key={s.setNum} value={s.setNum}>
                  {s.name} ({s.setNum})
                </option>
              ))}
            </select>
          )}
          {prog && (
            <div className="mt-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-green-600 transition-all"
                  style={{ width: `${prog.percent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-600">
                {prog.complete} / {prog.total} parts ({prog.percent}%)
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {!selected ? (
            <p className="p-4 text-sm text-gray-500">Add sets to view progress.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-100 text-xs text-gray-600">
                <tr>
                  <th className="px-3 py-2 w-10"></th>
                  <th className="px-3 py-2">Part</th>
                  <th className="px-3 py-2">Color</th>
                  <th className="px-3 py-2 w-16 text-right">Need</th>
                  <th className="px-3 py-2 w-16 text-right">Found</th>
                </tr>
              </thead>
              <tbody>
                {selected.parts.map((part, i) => {
                  const done = part.found >= part.required;
                  return (
                    <tr
                      key={`${part.partNum}-${part.colorId}-${i}`}
                      className={`border-b border-gray-100 ${done ? "bg-green-50/60" : ""}`}
                    >
                      <td className="px-3 py-1.5">
                        {part.partImgUrl ? (
                          <img
                            src={part.partImgUrl}
                            alt=""
                            className="h-7 w-7 object-contain"
                          />
                        ) : null}
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="font-mono text-xs text-gray-500">
                          {part.partNum}
                        </div>
                        <div className="line-clamp-1">{part.partName}</div>
                      </td>
                      <td className="px-3 py-1.5">{part.colorName}</td>
                      <td className="px-3 py-1.5 text-right">{part.required}</td>
                      <td className="px-3 py-1.5 text-right font-medium">
                        {part.found}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
