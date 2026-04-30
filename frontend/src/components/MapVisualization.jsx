import { Globe } from "lucide-react";

export default function MapVisualization({ details }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Global Risk Visualization</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Route and Region Intelligence</h2>
        </div>
        <Globe className="h-5 w-5 text-slate-400" />
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
        <svg viewBox="0 0 760 320" className="h-auto w-full">
          <rect x="0" y="0" width="760" height="320" rx="24" fill="#f8fafc" />
          <path d="M78 118c38-36 84-49 122-40 28 7 54 5 83-6 35-14 73-10 102 9 35 23 58 18 83 2 34-22 75-25 126-8 40 13 64 12 97-6v102c-36 22-67 23-104 9-45-18-76-15-112 7-35 21-69 24-111 0-28-16-49-19-82-5-45 19-81 16-117-8-27-18-58-21-87-9V118Z" fill="#dbeafe" />
          <path d="M86 232c32-10 59-6 82 9 33 22 68 24 112 6 30-12 54-11 81 5 41 24 70 22 103 2 38-23 73-25 117-8 33 13 63 11 98-7" fill="none" stroke="#cbd5e1" strokeWidth="16" strokeLinecap="round" />
          <circle cx="520" cy="120" r="30" fill="#fee2e2" />
          <circle cx="612" cy="138" r="26" fill="#fed7aa" />
          <circle cx="662" cy="102" r="22" fill="#dcfce7" />
          <path d="M470 102C525 78 566 98 611 139C626 152 640 168 670 188" fill="none" stroke="#0f4c81" strokeWidth="4" strokeDasharray="8 7" />
          <circle cx="470" cy="102" r="9" fill="#0f4c81" />
          <circle cx="611" cy="139" r="10" fill="#f97316" />
          <circle cx="670" cy="188" r="9" fill="#0f4c81" />
          <g transform="translate(611 139)">
            <circle r="18" fill="#fff7ed" stroke="#fb923c" strokeWidth="3" />
            <text textAnchor="middle" y="5" fontSize="18" fontWeight="700" fill="#c2410c">!</text>
          </g>
          <text x="452" y="88" fill="#0f172a" fontSize="13" fontWeight="600">{details.origin}</text>
          <text x="646" y="212" fill="#0f172a" fontSize="13" fontWeight="600">{details.destination}</text>
          <text x="556" y="116" fill="#9a3412" fontSize="12" fontWeight="600">Transit node anomaly</text>
        </svg>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">High-risk regions highlighted in red</div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Medium-risk transit nodes in orange</div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Low-risk clearance regions in green</div>
      </div>

      <p className="mt-4 text-sm text-slate-600">
        Route overlay: {details.origin} to {details.destination}. The marker indicates the point where the document set diverges from expected transit behavior.
      </p>
    </section>
  );
}
