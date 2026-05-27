import { useEffect, useRef, useState } from "react";
import { SessionBar } from "./components/SessionBar";
import { MasterList } from "./components/MasterList";
import { RoutingPanel } from "./components/RoutingPanel";
import { LogForm } from "./components/LogForm";
import { SetManager } from "./components/SetManager";
import { SetProgress } from "./components/SetProgress";
import { SettingsModal } from "./components/SettingsModal";
import { BrickognizeSearch } from "./components/BrickognizeSearch";
import { isRebrickableReady } from "./api";
import { parseImportedSession } from "./lib/persist";
import { useSessionStore } from "./store/sessionStore";

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [setsOpen, setSetsOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const importSession = useSessionStore((s) => s.importSession);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isRebrickableReady().then((ok) => {
      if (!ok) setSettingsOpen(true);
    });
  }, []);

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const session = parseImportedSession(String(reader.result));
        importSession(session);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Import failed");
      }
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsText(file);
  }

  return (
    <div className="flex h-screen flex-col bg-white text-gray-900">
      <SessionBar
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSets={() => setSetsOpen(true)}
        onOpenProgress={() => setProgressOpen(true)}
        onImport={() => fileRef.current?.click()}
        onOpenCameraSearch={() => setCameraOpen(true)}
      />

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(200px,1fr)_2fr_minmax(220px,1fr)]">
        <div className="hidden min-h-0 lg:block">
          <RoutingPanel />
        </div>
        <div className="min-h-0 border-x border-gray-200">
          <MasterList />
        </div>
        <div className="min-h-0">
          <LogForm />
        </div>
      </main>

      <div className="border-t border-gray-200 lg:hidden">
        <RoutingPanel />
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={() => setSettingsOpen(false)}
      />
      <SetManager open={setsOpen} onClose={() => setSetsOpen(false)} />
      <SetProgress open={progressOpen} onClose={() => setProgressOpen(false)} />
      <BrickognizeSearch open={cameraOpen} onClose={() => setCameraOpen(false)} />
    </div>
  );
}
