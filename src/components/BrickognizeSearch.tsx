import { useEffect, useMemo, useRef, useState } from "react";
import { getSetsThatContainPart, loadSet } from "../api/rebrickable";
import { loadApiKey } from "../lib/persist";
import { useSessionStore } from "../store/sessionStore";

type BrickognizeItem = {
  id: string;
  name: string;
  img_url: string;
  category?: string | null;
  type: "part" | "set" | "fig" | "sticker";
  score: number;
  external_sites?: { name: string; url: string }[];
};

type BrickognizeResponse = {
  listing_id: string;
  items: BrickognizeItem[];
};

async function captureFrame(video: HTMLVideoElement): Promise<ArrayBuffer> {
  const w = Math.max(640, video.videoWidth || 640);
  const h = Math.max(480, video.videoHeight || 480);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(video, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode image"))),
      "image/jpeg",
      0.9,
    );
  });

  return blob.arrayBuffer();
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BrickognizeSearch({ open, onClose }: Props) {
  const session = useSessionStore((s) => s.session);
  const selectPart = useSessionStore((s) => s.selectPart);
  const addSet = useSessionStore((s) => s.addSet);
  const setLoadingSet = useSessionStore((s) => s.setLoadingSet);
  const isLoadingSet = useSessionStore((s) => s.isLoadingSet);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");
  const [results, setResults] = useState<BrickognizeItem[]>([]);
  const [activePart, setActivePart] = useState<BrickognizeItem | null>(null);
  const [candidateSets, setCandidateSets] = useState<
    { setNum: string; name: string; year: number; numParts: number }[]
  >([]);
  const [setsError, setSetsError] = useState<string>("");
  const [setsBusy, setSetsBusy] = useState(false);
  const [resolvedPartNum, setResolvedPartNum] = useState<string | null>(null);
  const [usedBaseMold, setUsedBaseMold] = useState(false);
  const [manualSetNum, setManualSetNum] = useState("");

  const loadedPartNums = useMemo(() => {
    const set = new Set<string>();
    for (const s of session.sets) {
      for (const p of s.parts) set.add(p.partNum);
    }
    return set;
  }, [session.sets]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setResults([]);
    setActivePart(null);
    setCandidateSets([]);
    setSetsError("");
    setResolvedPartNum(null);
    setUsedBaseMold(false);

    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        setStream(s);
        const el = videoRef.current;
        if (el) {
          el.srcObject = s;
          await el.play();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to access camera");
      }
    })();

    return () => {
      setStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return null;
      });
    };
  }, [open]);

  if (!open) return null;

  async function handleCapture() {
    setError("");
    setBusy(true);
    try {
      const video = videoRef.current;
      if (!video) throw new Error("Camera not ready");
      if (!window.electronAPI?.brickognizePredictParts) {
        throw new Error("Brickognize is only available in the Electron app.");
      }

      const bytes = await captureFrame(video);
      const raw = await window.electronAPI.brickognizePredictParts(bytes);
      const parsed = raw as BrickognizeResponse;

      const items = Array.isArray(parsed?.items) ? parsed.items : [];
      setResults(items.filter((i) => i.type === "part"));
      setActivePart(null);
      setCandidateSets([]);
      setSetsError("");
      setResolvedPartNum(null);
      setUsedBaseMold(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Brickognize request failed");
    } finally {
      setBusy(false);
    }
  }

  function handleUsePart(partNum: string) {
    selectPart(partNum);
    onClose();
  }

  async function handleFindSets(item: BrickognizeItem) {
    setSetsError("");
    setResolvedPartNum(null);
    setUsedBaseMold(false);
    setSetsBusy(true);
    setActivePart(item);
    setCandidateSets([]);
    try {
      const apiKey = loadApiKey();
      if (!apiKey) {
        throw new Error("Add your Rebrickable API key in Settings first.");
      }
      const rebrickableUrls =
        item.external_sites
          ?.filter((s) => /rebrickable/i.test(s.name) || /rebrickable\.com/i.test(s.url))
          .map((s) => s.url) ?? [];

      const { sets, resolvedPartNum: resolved, usedBaseMoldFallback } =
        await getSetsThatContainPart(item.id, apiKey, 25, rebrickableUrls);
      setResolvedPartNum(resolved);
      setUsedBaseMold(usedBaseMoldFallback);
      setCandidateSets(
        sets.map((s) => ({
          setNum: s.set_num,
          name: s.name,
          year: s.year,
          numParts: s.num_parts,
        })),
      );
    } catch (e) {
      setSetsError(e instanceof Error ? e.message : "Failed to fetch sets");
    } finally {
      setSetsBusy(false);
    }
  }

  async function handleAddSet(setNum: string) {
    const apiKey = loadApiKey();
    if (!apiKey) {
      setSetsError("Add your Rebrickable API key in Settings first.");
      return;
    }
    setLoadingSet(true, null);
    try {
      const loaded = await loadSet(setNum, apiKey);
      addSet(loaded);
      if (activePart) {
        const master = useSessionStore.getState().masterList;
        const id = activePart.id;
        const resolved = resolvedPartNum ?? id;
        const pick = master.some((p) => p.partNum === id)
          ? id
          : master.some((p) => p.partNum === resolved)
            ? resolved
            : id;
        selectPart(pick);
      }
    } catch (e) {
      setSetsError(e instanceof Error ? e.message : "Failed to load set");
    } finally {
      setLoadingSet(false, null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold">Camera search (Brickognize)</h2>
          <p className="text-sm text-gray-600">
            Point your webcam at a single part on a plain background, then click
            Capture. Results are best with good lighting and no occlusion.
          </p>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 md:grid-cols-2">
          <div className="min-h-0 border-b border-gray-200 p-4 md:border-b-0 md:border-r">
            <div className="aspect-video w-full overflow-hidden rounded border border-gray-200 bg-black">
              <video ref={videoRef} className="h-full w-full object-contain" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCapture}
                disabled={busy || !!error}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {busy ? "Capturing…" : "Capture & identify"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {!error && !stream && (
              <p className="mt-2 text-sm text-gray-500">Starting camera…</p>
            )}
          </div>

          <div className="min-h-0 overflow-auto p-4">
            <h3 className="text-sm font-semibold text-gray-800">Results</h3>
            <p className="text-xs text-gray-500">
              Only parts are shown. Items already present in your loaded sets are
              highlighted.
            </p>

            {results.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                No results yet. Capture an image to search.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {results.slice(0, 10).map((item) => {
                  const inSession = loadedPartNums.has(item.id);
                  return (
                    <li
                      key={item.id}
                      className={`flex items-center gap-3 rounded border p-3 ${
                        inSession
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <img
                        src={item.img_url}
                        alt=""
                        className="h-14 w-14 object-contain"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-xs text-gray-500">
                          {item.id} · score {item.score.toFixed(2)}
                        </div>
                        <div className="truncate text-sm font-medium">
                          {item.name}
                        </div>
                        {item.category ? (
                          <div className="text-xs text-gray-500">
                            {item.category}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleUsePart(item.id)}
                          disabled={!inSession}
                          className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                          title={
                            inSession
                              ? "Select this part in the master list"
                              : "Load a set that contains this part first"
                          }
                        >
                          Use
                        </button>
                        {!inSession && (
                          <button
                            type="button"
                            onClick={() => handleFindSets(item)}
                            className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            disabled={setsBusy || isLoadingSet}
                          >
                            {activePart?.id === item.id && setsBusy
                              ? "Searching…"
                              : "Find sets"}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {activePart && (
              <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3">
                <div className="text-sm font-semibold text-gray-800">
                  Load a set that contains:{" "}
                  <span className="font-mono">{activePart.id}</span>
                </div>
                <div className="text-xs text-gray-600">{activePart.name}</div>
                {usedBaseMold && (
                  <div className="mt-1 text-xs text-amber-800">
                    Showing sets with the base mold{" "}
                    <span className="font-mono">{resolvedPartNum}</span>, not
                    this exact print. The piece shape matches, but color/print
                    may differ.
                  </div>
                )}
                {resolvedPartNum &&
                  resolvedPartNum !== activePart.id &&
                  !usedBaseMold && (
                    <div className="mt-1 text-xs text-gray-500">
                      Rebrickable lookup used part id:{" "}
                      <span className="font-mono">{resolvedPartNum}</span>
                    </div>
                  )}
                {candidateSets.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Verified against set inventories (bundles excluded).
                  </p>
                )}

                {setsError && (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-red-600">{setsError}</p>
                    <p className="text-xs text-gray-600">
                      If you know which set this part belongs to, add it by number:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualSetNum}
                        onChange={(e) => setManualSetNum(e.target.value)}
                        placeholder="e.g. 6030-1"
                        className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => manualSetNum.trim() && handleAddSet(manualSetNum.trim())}
                        disabled={!manualSetNum.trim() || isLoadingSet}
                        className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                    {activePart && (
                      <a
                        href={`https://rebrickable.com/parts/${encodeURIComponent(activePart.id)}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 underline"
                      >
                        View part on Rebrickable
                      </a>
                    )}
                  </div>
                )}

                {candidateSets.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {candidateSets.slice(0, 8).map((s) => (
                      <li
                        key={s.setNum}
                        className="flex items-center justify-between gap-3 rounded border border-gray-200 bg-white px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {s.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {s.setNum} · {s.year} · {s.numParts} parts
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddSet(s.setNum)}
                          disabled={isLoadingSet}
                          className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {isLoadingSet ? "Loading…" : "Add set"}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">
                    Click “Find sets” on a result to fetch sets from Rebrickable.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

