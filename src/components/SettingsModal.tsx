import { useEffect, useState } from "react";
import {
  clearColorsCache,
  getRebrickableKeyStatus,
  testApiKey,
  useNodeBackend,
} from "../api";
import { loadApiKey } from "../lib/persist";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const inputClass =
  "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

const secondaryBtnClass =
  "rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800";

export function SettingsModal({ open, onClose, onSaved }: Props) {
  const [key, setKey] = useState(loadApiKey);
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [envOnly, setEnvOnly] = useState(false);

  useEffect(() => {
    if (!open || !useNodeBackend) {
      setEnvOnly(false);
      return;
    }
    getRebrickableKeyStatus()
      .then((data) => setEnvOnly(data.envOnly))
      .catch(() => setEnvOnly(false));
  }, [open]);

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
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Rebrickable API Key</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Get a free key at{" "}
          <a
            href="https://rebrickable.com/api/"
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline dark:text-blue-400"
          >
            rebrickable.com/api
          </a>
          .{" "}
          {envOnly
            ? "Configured via REBRICKABLE_API_KEY on the server."
            : useNodeBackend
              ? "Stored on the Node server (not in the browser)."
              : "Stored only in your browser."}
        </p>
        {envOnly ? (
          <p className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
            API key is set in your deployment environment. Update it in your Vercel
            project settings if needed.
          </p>
        ) : (
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Paste API key"
            className={`mt-4 ${inputClass}`}
          />
        )}
        {message && (
          <p
            className={`mt-2 text-sm ${status === "error" ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}
          >
            {message}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={secondaryBtnClass}>
            {envOnly ? "Close" : "Cancel"}
          </button>
          {!envOnly && (
            <button
              type="button"
              onClick={handleSave}
              disabled={!key.trim() || status === "testing"}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {status === "testing" ? "Verifying…" : "Save & verify"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
