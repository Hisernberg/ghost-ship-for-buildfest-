import { Bell, AlertTriangle, Siren } from "lucide-react";
import { severityTone } from "../utils/formatters";

export default function AlertFeed({ alerts }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live Risk Alert Feed</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Recent Detection Events</h2>
        </div>
        <Bell className="h-5 w-5 text-slate-400" />
      </div>

      <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
        {alerts.map((alert, idx) => (
          <div key={`${alert.shipmentId}-${idx}`} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${
                    alert.severity === "HIGH"
                      ? "bg-red-50 text-red-600"
                      : alert.severity === "MEDIUM"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-sky-50 text-sky-600"
                  }`}
                >
                  {alert.severity === "HIGH" ? <Siren className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{alert.shipmentId}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1 ${severityTone(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{alert.message}</p>
                  {alert.origin && alert.destination ? (
                    <p className="text-xs text-slate-500">{alert.origin} to {alert.destination}</p>
                  ) : null}
                </div>
              </div>
              <span className="text-xs font-medium text-slate-400">{alert.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
