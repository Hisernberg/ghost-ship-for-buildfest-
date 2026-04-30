import { Container } from "lucide-react";

export default function FutureModules() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Future Modules</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Platform Expansion Track</h2>
        </div>
        <Container className="h-5 w-5 text-slate-400" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[26px] border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Global Intelligence</p>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Coming Soon</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Route risk overlay</li>
            <li>Country risk scoring</li>
            <li>Congestion level tracking</li>
          </ul>
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Relationship Mapping</p>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Coming Soon</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Linked entities</li>
            <li>Shared-director relationships</li>
            <li>Watchlist cluster overlays</li>
          </ul>
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-slate-50 px-4 py-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Entity History</p>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Coming Soon</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Past shipments</p>
              <p className="mt-2 text-sm text-slate-700">36 filings in trailing quarter</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Risk trend</p>
              <p className="mt-2 text-sm text-slate-700">Document deviations rising on this trade lane</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Inspection outcomes</p>
              <p className="mt-2 text-sm text-slate-700">Historical inspection archive pending live sync</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
