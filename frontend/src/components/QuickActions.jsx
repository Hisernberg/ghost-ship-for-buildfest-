import { AlertTriangle, Clock3, Download, Gauge, Upload } from "lucide-react";

export default function QuickActions({ setActiveView, onExport, onLaunchDemo }) {
  const actions = [
    { label: "Launch Demo Review", icon: Upload, onClick: onLaunchDemo, priority: "primary" },
    { label: "View High Risk Cases", icon: AlertTriangle, onClick: () => setActiveView("monitoring") },
    { label: "Export Result", icon: Download, onClick: onExport },
    { label: "Trigger Inspection", icon: Clock3, onClick: () => setActiveView("audit") },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quick Actions</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Operational Controls</h2>
        </div>
        <Gauge className="h-5 w-5 text-slate-400" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition hover:scale-[1.01] ${
              action.priority === "primary"
                ? "animate-pulse border-sky-200 bg-sky-50 text-sky-950 hover:bg-sky-100"
                : "border-slate-200 bg-slate-50 hover:bg-white"
            }`}
          >
            <span className={`text-sm font-medium ${action.priority === "primary" ? "text-sky-950" : "text-slate-800"}`}>{action.label}</span>
            <action.icon className={`h-4 w-4 ${action.priority === "primary" ? "text-sky-700" : "text-slate-500"}`} />
          </button>
        ))}
      </div>
    </section>
  );
}
