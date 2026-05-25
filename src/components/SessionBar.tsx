import { useSessionStore } from "../store/sessionStore";
import { exportSession } from "../lib/persist";

interface Props {
  onOpenSettings: () => void;
  onOpenSets: () => void;
  onOpenProgress: () => void;
  onImport: () => void;
}

export function SessionBar({
  onOpenSettings,
  onOpenSets,
  onOpenProgress,
  onImport,
}: Props) {
  const session = useSessionStore((s) => s.session);
  const setSessionName = useSessionStore((s) => s.setSessionName);

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
      <h1 className="text-lg font-bold text-gray-900">Lego Sorter</h1>
      <input
        type="text"
        value={session.name}
        onChange={(e) => setSessionName(e.target.value)}
        className="min-w-[140px] flex-1 rounded border border-gray-300 px-2 py-1 text-sm max-w-xs"
        aria-label="Session name"
      />
      <span className="text-xs text-gray-500">
        {session.sets.length} set{session.sets.length !== 1 ? "s" : ""}
      </span>
      <div className="ml-auto flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpenSets}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-100"
        >
          Sets
        </button>
        <button
          type="button"
          onClick={onOpenProgress}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-100"
        >
          Progress
        </button>
        <button
          type="button"
          onClick={() => exportSession(session)}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-100"
        >
          Export
        </button>
        <button
          type="button"
          onClick={onImport}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-100"
        >
          Import
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-100"
        >
          Settings
        </button>
      </div>
    </header>
  );
}
