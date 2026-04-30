import { ShieldCheck } from "lucide-react";

export default function SystemStatus({ items }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">System Status</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Platform Health</h2>
        </div>
        <ShieldCheck className="h-5 w-5 text-slate-400" />
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm text-slate-600">{item.label}</span>
            <strong className="text-sm font-semibold text-slate-900">{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
