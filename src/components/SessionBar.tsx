import { useSessionStore } from "../store/sessionStore";
import { exportSession } from "../lib/persist";
import { ThemeToggle } from "./ThemeToggle";

interface Props {
  onOpenSettings: () => void;
  onOpenSets: () => void;
  onOpenProgress: () => void;
  onImport: () => void;
  onOpenCameraSearch: () => void;
}

const btnClass =
  "rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700";

export function SessionBar({
  onOpenSettings,
  onOpenSets,
  onOpenProgress,
  onImport,
  onOpenCameraSearch,
}: Props) {
  const session = useSessionStore((s) => s.session);
  const setSessionName = useSessionStore((s) => s.setSessionName);

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
      <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Bricksort</h1>
      <input
        type="text"
        value={session.name}
        onChange={(e) => setSessionName(e.target.value)}
        className="min-w-[140px] flex-1 max-w-xs rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        aria-label="Session name"
      />
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {session.sets.length} set{session.sets.length !== 1 ? "s" : ""}
      </span>
      <div className="ml-auto flex flex-wrap gap-2">
        <ThemeToggle />
        <button type="button" onClick={onOpenCameraSearch} className={btnClass}>
          Camera
        </button>
        <button type="button" onClick={onOpenSets} className={btnClass}>
          Sets
        </button>
        <button type="button" onClick={onOpenProgress} className={btnClass}>
          Progress
        </button>
        <button type="button" onClick={() => exportSession(session)} className={btnClass}>
          Export
        </button>
        <button type="button" onClick={onImport} className={btnClass}>
          Import
        </button>
        <button type="button" onClick={onOpenSettings} className={btnClass}>
          Settings
        </button>
      </div>
    </header>
  );
}
