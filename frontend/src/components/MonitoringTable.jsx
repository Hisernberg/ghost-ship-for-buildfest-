import { Boxes } from "lucide-react";
import { severityTone } from "../utils/formatters";

const filters = [
  { key: "ALL", label: "All" },
  { key: "HIGH", label: "High Risk" },
  { key: "MEDIUM", label: "Medium" },
  { key: "LOW", label: "Low" },
];

export default function MonitoringTable({ results, riskFilter, setRiskFilter }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Risk Monitoring</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Flagged Shipment Register</h2>
        </div>
        <Boxes className="h-5 w-5 text-slate-400" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setRiskFilter(filter.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${
              riskFilter === filter.key
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <th className="pb-2">Shipment</th>
              <th className="pb-2">Engine</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Risk Score</th>
              <th className="pb-2">Action</th>
              <th className="pb-2">Summary</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.shipment_id} className="rounded-2xl bg-slate-50">
                <td className="rounded-l-2xl px-4 py-3 font-medium text-slate-900">{result.shipment_id}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {result.engineBadges.map((badge) => (
                      <span
                        key={`${result.shipment_id}-${badge}`}
                        title={badge}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ring-1 ${severityTone(result.classification)}`}>
                    {result.classification}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{result.risk_score}</td>
                <td className="px-4 py-3 text-slate-700">{result.action}</td>
                <td className="rounded-r-2xl px-4 py-3 text-slate-500">{result.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
