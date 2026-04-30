import { Radar } from "lucide-react";

export default function IntelligencePanel({ analysis, intakeMode }) {
  const actionSteps =
    analysis.status === "HIGH"
      ? [
          "Review submitted invoice, bill of lading, and declaration values immediately.",
          "Place the shipment on hold pending compliance and cargo verification.",
          "Escalate the case to inspection control for physical examination.",
        ]
      : analysis.status === "MEDIUM"
        ? [
            "Review IGM, BOL, and invoice fields for cross-document mismatch.",
            "Verify company KYC and ownership details within 24 hours.",
            "Route the shipment to secondary inspection before release.",
          ]
        : [
            "Clear the shipment for standard processing.",
            "Retain the audit record for routine post-clearance review.",
            "Continue passive monitoring for related filings.",
          ];

  const narrativeBadges = [
    analysis.engineBreakdown.Document > 0.2 ? { label: "DOC", title: "Declaration verification and value comparison" } : null,
    analysis.engineBreakdown.Physics > 0.2 ? { label: "VERIFY", title: "Cargo integrity and commodity profile checks" } : null,
    analysis.engineBreakdown.Behavior > 0.2 ? { label: "ENTITY", title: "Submission patterns and entity history checks" } : null,
    analysis.engineBreakdown.Network > 0.2 ? { label: "REL", title: "Relationship analysis and network mapping checks" } : null,
  ].filter(Boolean);

  const narrativeCards =
    intakeMode === "csv"
      ? [
          {
            title: "Manifest review",
            body: "Row-level comparison of declared values, quantities, origins, and entity identifiers across the uploaded manifest.",
          },
          {
            title: "Pattern checks",
            body: "The current manifest shows a measurable quantity gap, a declared-value shortfall, and linked-entity history that warrant inspection.",
          },
          {
            title: "Data completeness",
            body: "Document completeness remains acceptable, allowing the review to focus on declaration variance instead of missing-data exceptions.",
          },
        ]
      : [
          {
            title: "Document review",
            body: "Invoice, IGM, and bill of lading records show a measurable quantity variance and a declaration-value gap.",
          },
          {
            title: "Cargo integrity",
            body: "Cargo integrity checks remain within tolerance, but the file set still presents a declaration inconsistency requiring review.",
          },
          {
            title: "Entity history",
            body: "The submitting entity is linked to two prior anomaly reviews on comparable electronics filings.",
          },
        ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">System Narrative</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Why the Shipment is Risky</h2>
        </div>
        <Radar className="h-5 w-5 text-slate-400" />
      </div>

      <ul className="space-y-3 text-sm leading-7 text-slate-700">
        {analysis.riskFactors.slice(0, 3).map((factor) => (
          <li key={factor} className="flex items-start gap-3">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-500" />
            <span>{factor}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        {narrativeBadges.map((badge) => (
          <span
            key={badge.label}
            title={badge.title}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700"
          >
            {badge.label}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {narrativeCards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{card.title}</p>
            <p className="mt-2 text-sm text-slate-700">{card.body}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Recommended Action</p>
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">{analysis.recommendedAction}</p>
            {actionSteps.map((step) => (
              <p key={step}>{step}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
