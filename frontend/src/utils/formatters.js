/**
 * Formatting utilities for GhostShip frontend
 */

export function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "Unknown";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return `USD ${numeric.toLocaleString()}`;
}

export function formatMetric(value, suffix) {
  if (value === null || value === undefined || value === "") return "Unknown";
  return `${value} ${suffix}`;
}

export function formatLooseValue(value) {
  if (value === null || value === undefined || value === "") return "Unknown";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  const hasFraction = Math.abs(numeric % 1) > 0.001;
  return numeric.toLocaleString(undefined, {
    maximumFractionDigits: hasFraction ? 2 : 0,
  });
}

export function parseCurrencyNumber(valueText) {
  const numeric = Number(String(valueText ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

export function deriveExpectedRange(valueText) {
  const numeric = parseCurrencyNumber(valueText);
  if (!numeric) {
    return { declared: valueText || "Unknown", expected: "Unavailable" };
  }
  const lower = Math.round(numeric * 1.22);
  const upper = Math.round(numeric * 1.58);
  return {
    declared: `USD ${numeric.toLocaleString()}`,
    expected: `USD ${lower.toLocaleString()} - USD ${upper.toLocaleString()}`,
  };
}

export function classifyRiskScore(score) {
  if (score <= 30) return "LOW";
  if (score <= 70) return "MEDIUM";
  return "HIGH";
}

export function actionForStatus(status) {
  if (status === "LOW") return "Direct clearance";
  if (status === "MEDIUM") return "Secondary inspection";
  return "Full inspection";
}

export function severityTone(status) {
  const s = (status || "").toUpperCase();
  if (s === "CRITICAL") return "bg-red-100 text-red-800 ring-red-300";
  if (s === "HIGH") return "bg-red-50 text-red-700 ring-red-200";
  if (s === "MEDIUM") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (s === "LOW") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (s === "CLEARED") return "bg-green-100 text-green-800 ring-green-300";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

export function toPolyline(points) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 100 - ((point - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

export function mapBreakdown(breakdown) {
  return {
    Physics: breakdown?.Physics ?? breakdown?.physics ?? 0,
    Document: breakdown?.Document ?? breakdown?.document ?? 0,
    Behavior: breakdown?.Behavior ?? breakdown?.behavior ?? 0,
    Network: breakdown?.Network ?? breakdown?.network ?? 0,
  };
}

export function deriveConfidence(engineBreakdown, fallback) {
  const max = Math.max(...Object.values(engineBreakdown));
  return fallback ?? Math.max(60, Math.min(97, Math.round(68 + max * 25)));
}

export function buildContributionSegments(engineBreakdown) {
  const entries = [
    { key: "Document", label: "Declaration Verification", color: "#2563eb", value: engineBreakdown.Document ?? 0 },
    { key: "Physics", label: "Cargo Integrity", color: "#f97316", value: engineBreakdown.Physics ?? 0 },
    { key: "Behavior", label: "Entity Profile", color: "#14b8a6", value: engineBreakdown.Behavior ?? 0 },
    { key: "Network", label: "Relationship Analysis", color: "#8b5cf6", value: engineBreakdown.Network ?? 0 },
  ];

  const total = entries.reduce((sum, entry) => sum + entry.value, 0) || 1;
  let cursor = 0;
  const segments = entries.map((entry) => {
    const percentage = Math.round((entry.value / total) * 100);
    const start = cursor;
    cursor += (entry.value / total) * 100;
    return {
      ...entry,
      percentage,
      start,
      end: cursor,
    };
  });

  const gradient = segments
    .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
    .join(", ");

  return { segments, gradient };
}

export function buildMismatchMatrix(analysis) {
  if (Array.isArray(analysis.mismatchMatrix) && analysis.mismatchMatrix.length) {
    return analysis.mismatchMatrix;
  }
  const mismatch = analysis.riskFactors.some((factor) => /deviation|mismatch|variance|inconsistency/i.test(factor));
  const cargo = analysis.riskTags.some((tag) => tag.includes("CARGO"));
  const states = {
    igm_bol: mismatch ? "variance" : "aligned",
    bol_invoice: mismatch ? "variance" : "aligned",
    igm_invoice: cargo ? "review" : mismatch ? "variance" : "aligned",
  };

  return [
    { label: "IGM vs BOL", left: "Review required", right: "Field variance", state: states.igm_bol },
    { label: "BOL vs Invoice", left: "Review required", right: "Field variance", state: states.bol_invoice },
    { label: "IGM vs Invoice", left: "Review required", right: "Field variance", state: states.igm_invoice },
  ];
}

export function deriveRiskTags(engineBreakdown, anomalies) {
  const tags = [];
  if (engineBreakdown.Document >= 0.35) tags.push("DOCUMENT DISCREPANCY");
  if (engineBreakdown.Physics >= 0.35) tags.push("CARGO ANOMALY DETECTED");
  if (anomalies.some((row) => row.type.toLowerCase().includes("missing"))) tags.push("DATA COMPLETENESS");
  return tags.length ? tags : ["CLEARANCE READY"];
}

export function titleCaseEngine(engine) {
  return engine.charAt(0).toUpperCase() + engine.slice(1).toLowerCase();
}

export function engineLabelFromCategory(category) {
  if (category === "physics") return "VERIFY";
  if (category === "document") return "DOC";
  if (category === "behavior") return "ENTITY";
  if (category === "network") return "REL";
  return "DOC";
}

export function formatAuditTimestamp(value, index = 0) {
  if (value && !String(value).includes("ago")) return String(value);
  const date = new Date(Date.now() - index * 60000);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
