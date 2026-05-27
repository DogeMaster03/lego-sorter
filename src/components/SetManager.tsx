import { useState } from "react";
import { getApiKeyForClient, isRebrickableReady, loadSet } from "../api";
import { useSessionStore } from "../store/sessionStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SetManager({ open, onClose }: Props) {
  const session = useSessionStore((s) => s.session);
  const addSet = useSessionStore((s) => s.addSet);
  const removeSet = useSessionStore((s) => s.removeSet);
  const isLoadingSet = useSessionStore((s) => s.isLoadingSet);
  const loadError = useSessionStore((s) => s.loadError);
  const setLoadingSet = useSessionStore((s) => s.setLoadingSet);
  const getSetProgress = useSessionStore((s) => s.getSetProgress);

  const [input, setInput] = useState("");

  if (!open) return null;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!(await isRebrickableReady())) {
      setLoadingSet(false, "Add your Rebrickable API key in Settings first.");
      return;
    }
    const apiKey = getApiKeyForClient();
    const trimmed = input.trim();
    if (!trimmed) return;

    setLoadingSet(true, null);
    try {
      const loaded = await loadSet(trimmed, apiKey);
      addSet(loaded);
      setInput("");
    } catch (err) {
      setLoadingSet(false, err instanceof Error ? err.message : "Failed to load set");
      return;
    }
    setLoadingSet(false, null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold">Sets in session</h2>
          <p className="text-sm text-gray-600">
            Enter a set number (e.g. 6030 or 10261-1). Parts load from Rebrickable.
          </p>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 border-b border-gray-200 p-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Set number"
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
            disabled={isLoadingSet}
          />
          <button
            type="submit"
            disabled={isLoadingSet || !input.trim()}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoadingSet ? "Loading…" : "Add"}
          </button>
        </form>

        {loadError && (
          <p className="px-4 py-2 text-sm text-red-600">{loadError}</p>
        )}

        <ul className="flex-1 overflow-auto p-4">
          {session.sets.length === 0 ? (
            <li className="text-sm text-gray-500">No sets loaded yet.</li>
          ) : (
            session.sets.map((set) => {
              const prog = getSetProgress(set.setNum);
              return (
                <li
                  key={set.setNum}
                  className="mb-2 flex items-start justify-between rounded border border-gray-200 p-3"
                >
                  <div>
                    <div className="font-medium">{set.name}</div>
                    <div className="text-xs text-gray-500">
                      {set.setNum} · {set.year} · {set.totalParts} parts
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      Progress: {prog.percent}% ({prog.complete}/{prog.total})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSet(set.setNum)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              );
            })
          )}
        </ul>

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
