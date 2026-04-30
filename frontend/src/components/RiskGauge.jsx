import { buildContributionSegments, buildMismatchMatrix, parseCurrencyNumber, severityTone } from "../utils/formatters";

export default function RiskGauge({ analysis, onEscalate, escalatorSaving, escalatorMessage }) {
  const circumference = 2 * Math.PI * 58;
  const strokeDashoffset = circumference * (1 - analysis.riskScore / 100);
  const hasActiveAnalysis = analysis.shipmentDetails.shipmentId !== "Pending";
  const scoreTone =
    analysis.riskScore > 70 ? "#be123c" : analysis.riskScore > 30 ? "#f59e0b" : "#15803d";
  const statusHeadline = hasActiveAnalysis
    ? `${analysis.status} RISK — ${analysis.recommendedAction.toUpperCase()}`
    : "AWAITING REVIEW — UPLOAD REQUIRED";
  const declaredNumber = parseCurrencyNumber(analysis.comparisonInsight.declared);
  const expectedNumbers = String(analysis.comparisonInsight.expected)
    .split("-")
    .map((value) => parseCurrencyNumber(value));
  const expectedHigh = Math.max(...expectedNumbers, 0);
  const valueScale = Math.max(declaredNumber, expectedHigh, 1);
  const declaredWidth = `${Math.max((declaredNumber / valueScale) * 100, declaredNumber ? 8 : 0)}%`;
  const expectedWidth = `${Math.max((expectedHigh / valueScale) * 100, expectedHigh ? 8 : 0)}%`;
  const { segments, gradient } = buildContributionSegments(analysis.engineBreakdown);
  const mismatchMatrix = buildMismatchMatrix(analysis);
  const auditStamp = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="mb-5 grid gap-3 rounded-[28px] border border-slate-200 bg-slate-50/80 px-4 py-4 md:grid-cols-2 2xl:grid-cols-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Shipment ID</p>
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Audit Timestamp</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{auditStamp}</p>
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Risk Analysis</p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.08em]" style={{ color: scoreTone }}>
            {statusHeadline}
          </p>
          <div className="mt-5 flex flex-col items-center justify-center">
            <div className="relative">
              <svg viewBox="0 0 160 160" className="h-44 w-44 -rotate-90">
                <circle cx="80" cy="80" r="58" stroke="#dbe4ef" strokeWidth="14" fill="none" />
                <circle
                  cx="80"
                  cy="80"
                  r="58"
                  stroke={scoreTone}
                  strokeWidth="14"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: "stroke-dashoffset 1s ease, stroke 0.4s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-semibold tracking-tight text-slate-950">
                  {hasActiveAnalysis ? analysis.riskScore : "--"}
                </span>
                <span className="text-sm font-medium text-slate-500">/ 100</span>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">
              System Certainty:{" "}
              <span className="font-semibold text-slate-900">
                {analysis.confidenceScore == null ? "--" : `${analysis.confidenceScore}%`}
              </span>
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Engine Contribution</p>
                <p className="mt-1 text-sm text-slate-600">Current review weighting by detection stream.</p>
              </div>
              <div
                className="h-20 w-20 rounded-full"
                style={{ background: `conic-gradient(${gradient})` }}
              >
                <div className="m-[10px] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700">
                  4 streams
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {segments.map((segment, index) => (
                <div
                  key={segment.key}
                  className="opacity-0"
                  style={{ animation: `fadeIn 0.45s ease forwards`, animationDelay: `${index * 120}ms` }}
                >
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <span>{segment.label}</span>
                    <span>{segment.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{ width: `${segment.percentage}%`, backgroundColor: segment.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recommended Action</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{analysis.recommendedAction}</h3>
            {hasActiveAnalysis ? (
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                <button
                  type="button"
                  onClick={onEscalate}
                  disabled={escalatorSaving}
                  className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  {escalatorSaving ? "Escalating..." : "Escalate To Audit Queue"}
                </button>
                {escalatorMessage ? <p className="text-sm text-slate-600">{escalatorMessage}</p> : null}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {analysis.riskTags.map((tag) => (
                <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Detected Anomalies</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              {analysis.riskFactors.map((factor, index) => (
                <li
                  key={factor}
                  className="flex gap-3 opacity-0"
                  style={{ animation: "fadeIn 0.45s ease forwards", animationDelay: `${index * 120}ms` }}
                >
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-500" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 3xl:grid-cols-[1.05fr_1.15fr]">
            <div className="min-w-0 rounded-[28px] border border-slate-200 bg-slate-50/80 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mismatch Matrix</p>
              <div className="mt-4 grid gap-3">
                {mismatchMatrix.map((cell) => {
                  const tone =
                    cell.state === "variance"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : cell.state === "review"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700";
                  const label = cell.state === "variance" ? "X" : cell.state === "review" ? "!" : "Check";
                  return (
                    <div key={cell.label} className={`rounded-2xl border px-4 py-4 ${tone}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">{cell.label}</p>
                          <p className="mt-2 text-sm font-medium">{cell.left}</p>
                          <p className="mt-1 text-sm font-medium">{cell.right}</p>
                        </div>
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                          {label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="min-w-0 rounded-[28px] border border-slate-200 bg-slate-50/80 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Comparison Insight</p>
              <div className="mt-3 grid gap-3">
                <div>
                  <p className="text-sm text-slate-500">Declared</p>
                  <p className="break-words text-base font-semibold text-slate-950">{analysis.comparisonInsight.declared}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Expected range</p>
                  <p className="max-w-[260px] text-base font-semibold leading-8 text-slate-950">{analysis.comparisonInsight.expected}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Declared value</p>
                    <div className="mt-2 h-3 rounded-full bg-slate-200">
                      <div className="h-3 rounded-full bg-slate-900 transition-all duration-700" style={{ width: declaredWidth }} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Expected range ceiling</p>
                    <div className="mt-2 h-3 rounded-full bg-slate-200">
                      <div className="h-3 rounded-full bg-amber-500 transition-all duration-700" style={{ width: expectedWidth }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="min-w-0 rounded-[28px] border border-slate-200 bg-slate-50/80 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Clearance Status</p>
            <div className="mt-3 grid gap-3 xl:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Risk value</p>
                <p className="break-words text-base font-semibold text-slate-950">{analysis.operationalImpact.riskValue}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Inspection requirement</p>
                <p className="break-words text-base font-semibold text-slate-950">{analysis.operationalImpact.inspectionRequirement}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
