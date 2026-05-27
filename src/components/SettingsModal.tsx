import { useState } from "react";
import { clearColorsCache, testApiKey, useNodeBackend } from "../api";
import { loadApiKey } from "../lib/persist";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function SettingsModal({ open, onClose, onSaved }: Props) {
  const [key, setKey] = useState(loadApiKey);
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!open) return null;

  async function handleSave() {
    setStatus("testing");
    setMessage("");
    try {
      await testApiKey(key.trim());
      clearColorsCache();
      setStatus("ok");
      setMessage("API key saved and verified.");
      onSaved();
      setTimeout(onClose, 600);
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Failed to verify key");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Rebrickable API Key</h2>
        <p className="mt-2 text-sm text-gray-600">
          Get a free key at{" "}
          <a
            href="https://rebrickable.com/api/"
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            rebrickable.com/api
          </a>
          .{" "}
          {useNodeBackend
            ? "Stored on the local Node server (not in the browser)."
            : "Stored only in your browser."}
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Paste API key"
          className="mt-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
        {message && (
          <p
            className={`mt-2 text-sm ${status === "error" ? "text-red-600" : "text-green-700"}`}
          >
            {message}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!key.trim() || status === "testing"}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {status === "testing" ? "Verifying…" : "Save & verify"}
          </button>
        </div>
      </div>
    </div>
  );
}
