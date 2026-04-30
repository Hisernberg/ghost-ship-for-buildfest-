import { useEffect, useMemo, useRef, useState } from "react";

const SHIP_SVG = (
  <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Hull */}
    <path d="M6 26 L10 34 L54 34 L58 26 Z" fill="currentColor" opacity="0.9" />
    {/* Deck */}
    <rect x="12" y="18" width="40" height="8" rx="1" fill="currentColor" />
    {/* Bridge */}
    <rect x="28" y="10" width="16" height="8" rx="1" fill="currentColor" opacity="0.8" />
    {/* Funnel */}
    <rect x="36" y="4" width="5" height="7" rx="1" fill="currentColor" opacity="0.7" />
    {/* Containers */}
    <rect x="14" y="19" width="7" height="6" rx="0.5" fill="white" opacity="0.2" />
    <rect x="23" y="19" width="7" height="6" rx="0.5" fill="white" opacity="0.2" />
    {/* Water line */}
    <path d="M4 36 Q16 33 28 36 Q40 39 52 36 Q58 34 62 36" stroke="currentColor" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
  </svg>
);

function riskColor(status) {
  if (status === "HIGH") return { text: "text-red-500", bg: "bg-red-50", border: "border-red-300", glow: "shadow-red-200", badge: "bg-red-100 text-red-700" };
  if (status === "MEDIUM") return { text: "text-amber-500", bg: "bg-amber-50", border: "border-amber-300", glow: "shadow-amber-200", badge: "bg-amber-100 text-amber-700" };
  return { text: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-300", glow: "shadow-emerald-200", badge: "bg-emerald-100 text-emerald-700" };
}

// Generate stable placeholder ships for the queue
function buildQueue(results, analysis, intakeMode, hasAnalysis) {
  if (intakeMode === "csv" && results.length > 0) {
    return results.slice(0, 6).map((r) => ({
      id: r.shipment_id || r.container_id || String(Math.random()),
      label: r.shipment_id || "SHP",
      status: r.classification || "LOW",
      riskScore: r.risk_score ?? 0,
      done: true,
    }));
  }

  const queue = [
    { id: "q-1", label: "SHP-001", status: null, done: false },
    { id: "q-2", label: "SHP-002", status: null, done: false },
    { id: "q-3", label: "SHP-003", status: null, done: false },
    { id: "q-4", label: "SHP-004", status: null, done: false },
  ];

  if (hasAnalysis) {
    queue[0] = {
      id: analysis.shipmentDetails?.containerId || "q-1",
      label: analysis.shipmentDetails?.containerId || "SHP-001",
      status: analysis.status,
      riskScore: analysis.riskScore,
      done: true,
    };
  }

  return queue;
}

export default function InspectionQueue({ loading, analysis, results, intakeMode }) {
  const hasAnalysis =
    analysis?.shipmentDetails?.containerId &&
    analysis.shipmentDetails.containerId !== "Pending" &&
    analysis.shipmentDetails.containerId !== "Unknown";

  const queue = useMemo(
    () => buildQueue(results, analysis, intakeMode, hasAnalysis),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [results, intakeMode, hasAnalysis, analysis?.shipmentDetails?.containerId, analysis?.status, analysis?.riskScore]
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [inspecting, setInspecting] = useState(false);
  const [dockShip, setDockShip] = useState(null);
  const prevLoading = useRef(false);

  // When loading starts: move first ship into dock
  useEffect(() => {
    if (loading && !prevLoading.current) {
      setInspecting(true);
      setDockShip({ id: "active", label: "Incoming", status: null, done: false });
    }
    if (!loading && prevLoading.current && hasAnalysis) {
      setDockShip({
        id: analysis.shipmentDetails.containerId,
        label: analysis.shipmentDetails.containerId,
        status: analysis.status,
        riskScore: analysis.riskScore,
        done: true,
      });
      setInspecting(false);
      setActiveIdx(0);
    }
    prevLoading.current = loading;
  }, [loading, hasAnalysis, analysis]);

  const colors = dockShip?.done ? riskColor(dockShip.status) : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Live Inspection Queue</p>
          <h2 className="mt-0.5 text-lg font-semibold text-slate-800">Vessel Processing Lane</h2>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${loading ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${loading ? "bg-blue-500 animate-pulse" : "bg-slate-400"}`} />
          {loading ? "Inspecting" : "Standby"}
        </span>
      </div>

      {/* Water track */}
      <div className="relative mb-5 overflow-hidden rounded-lg border border-slate-100 bg-gradient-to-b from-slate-50 to-blue-50 px-4 py-5">
        {/* Animated water lines */}
        <div className="absolute inset-x-0 bottom-3 flex flex-col gap-1 opacity-20 pointer-events-none">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-px bg-blue-400 animate-pulse"
              style={{ animationDelay: `${i * 0.3}s`, marginLeft: `${i * 10}%`, marginRight: `${(2 - i) * 8}%` }}
            />
          ))}
        </div>

        {/* Ship lane */}
        <div className="flex items-end gap-4 overflow-x-auto pb-1 hide-scrollbar">
          {queue.map((ship, idx) => {
            const c = ship.done ? riskColor(ship.status) : null;
            const isActive = idx === activeIdx && loading;
            return (
              <button
                key={ship.id}
                onClick={() => setActiveIdx(idx)}
                className={`group flex flex-col items-center gap-1.5 flex-shrink-0 transition-all duration-300
                  ${isActive ? "scale-110 -translate-y-1" : "hover:scale-105 hover:-translate-y-0.5"}
                `}
              >
                {/* Risk badge */}
                {ship.done && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.badge}`}>
                    {ship.riskScore ?? ship.status}
                  </span>
                )}
                {isActive && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 animate-pulse">
                    SCANNING
                  </span>
                )}
                {!ship.done && !isActive && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                    QUEUED
                  </span>
                )}

                {/* Ship */}
                <div
                  className={`h-12 w-20 transition-all duration-500
                    ${ship.done ? c.text : isActive ? "text-blue-500" : "text-slate-300"}
                    ${isActive ? "drop-shadow-lg" : ""}
                  `}
                >
                  {SHIP_SVG}
                </div>

                {/* Label */}
                <span className={`text-[11px] font-mono font-semibold ${ship.done ? c.text : "text-slate-400"}`}>
                  {ship.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Direction arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-200 text-xl pointer-events-none select-none">→</div>
      </div>

      {/* Inspection Dock */}
      <div className={`rounded-lg border-2 transition-all duration-500 p-4
        ${inspecting ? "border-blue-300 bg-blue-50" : dockShip?.done ? `${colors?.border} ${colors?.bg} shadow-md ${colors?.glow}` : "border-dashed border-slate-200 bg-slate-50"}
      `}>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Inspection Dock</p>

        {!dockShip && !loading && (
          <p className="text-sm text-slate-400 italic">Awaiting next shipment — upload documents and run analysis</p>
        )}

        {inspecting && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-16 text-blue-500 animate-pulse">{SHIP_SVG}</div>
            <div>
              <p className="text-sm font-semibold text-blue-700">Scanning documents…</p>
              <div className="mt-1.5 flex gap-1">
                {["Invoice", "Packing List", "BOL"].map((doc, i) => (
                  <span
                    key={doc}
                    className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-600 animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  >
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {dockShip?.done && colors && (
          <div className="flex items-start gap-4">
            <div className={`h-12 w-20 flex-shrink-0 ${colors.text}`}>{SHIP_SVG}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-bold text-slate-700">{dockShip.label}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${colors.badge}`}>
                  {dockShip.status} — {dockShip.riskScore}/100
                </span>
              </div>
              {analysis?.shipmentDetails && (
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                  {analysis.shipmentDetails.commodity && analysis.shipmentDetails.commodity !== "Unknown" && (
                    <span>📦 {analysis.shipmentDetails.commodity}</span>
                  )}
                  {analysis.shipmentDetails.origin && analysis.shipmentDetails.origin !== "Unknown" && (
                    <span>🛫 {analysis.shipmentDetails.origin} → {analysis.shipmentDetails.destination}</span>
                  )}
                  {analysis.shipmentDetails.company && analysis.shipmentDetails.company !== "Unknown" && (
                    <span>🏢 {analysis.shipmentDetails.company}</span>
                  )}
                </div>
              )}
              <div className="mt-2 flex gap-2 flex-wrap">
                {["Invoice ✓", "Packing List ✓", "BOL ✓"].map((doc) => (
                  <span key={doc} className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${colors.badge}`}>{doc}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
