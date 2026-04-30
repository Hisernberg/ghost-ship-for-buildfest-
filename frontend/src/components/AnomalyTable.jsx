import { FileSearch } from "lucide-react";
import { severityTone, formatAuditTimestamp, engineLabelFromCategory } from "../utils/formatters";

export default function AnomalyTable({ rows, analysis }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Flagged Anomalies</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Shipment Anomaly Log</h2>
        </div>
        <FileSearch className="h-5 w-5 text-slate-400" />
      </div>

      <div className="mb-4 grid gap-3 rounded-[28px] border border-slate-200 bg-slate-50/80 px-4 py-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Shipment</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{analysis.shipmentDetails.shipmentId}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Company</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{analysis.shipmentDetails.company || "Unknown"}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Route</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{analysis.shipmentDetails.origin} {"->"} {analysis.shipmentDetails.destination}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Commodity / Value</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{analysis.shipmentDetails.commodity} - {analysis.shipmentDetails.declaredValue}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <th className="pb-2">Type</th>
              <th className="pb-2">Engine</th>
              <th className="pb-2">Severity</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.type}-${index}`} className="rounded-2xl bg-slate-50">
                <td className="rounded-l-2xl px-4 py-3 font-medium text-slate-900">{row.type}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                    {row.engine || "DOC"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ring-1 ${severityTone(row.severity)}`}>
                    {row.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{row.status}</td>
                <td className="rounded-r-2xl px-4 py-3 text-slate-500">
                  <div className="flex flex-col">
                    <span>{row.timestamp}</span>
                    <span className="text-xs text-slate-400">{row.absoluteTimestamp || formatAuditTimestamp(row.timestamp, index)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
