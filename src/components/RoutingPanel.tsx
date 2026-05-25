import { useSessionStore } from "../store/sessionStore";

export function RoutingPanel() {
  const lastRouting = useSessionStore((s) => s.lastRouting);

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-gray-50">
      <div className="border-b border-gray-200 p-3">
        <h2 className="text-sm font-semibold text-gray-800">Set routing</h2>
        <p className="text-xs text-gray-500">
          After logging pieces, smaller sets are listed first.
        </p>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {!lastRouting ? (
          <p className="text-sm text-gray-500">
            Log found pieces on the right to see which sets need them.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="rounded border border-gray-200 bg-white p-3 text-sm">
              <div className="font-mono text-xs text-gray-500">
                {lastRouting.partNum}
              </div>
              <div className="font-medium">{lastRouting.partName}</div>
              <div className="mt-1 text-gray-600">
                {lastRouting.quantity}× {lastRouting.colorName}
              </div>
            </div>

            {lastRouting.allocations.length === 0 ? (
              <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <strong>Not needed</strong> — this color is not required by any
                set in your session. Set these pieces aside.
                {lastRouting.surplus > 0 && (
                  <div className="mt-1">
                    Surplus: {lastRouting.surplus} piece
                    {lastRouting.surplus !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            ) : (
              <ul className="space-y-2">
                {lastRouting.allocations.map((a) => (
                  <li
                    key={a.setNum}
                    className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm"
                  >
                    <div className="font-medium text-green-900">{a.setName}</div>
                    <div className="text-xs text-green-800">{a.setNum}</div>
                    <div className="mt-1 text-lg font-bold text-green-900">
                      {a.quantity}
                    </div>
                  </li>
                ))}
                {lastRouting.surplus > 0 && (
                  <li className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    +{lastRouting.surplus} surplus (not assigned)
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
