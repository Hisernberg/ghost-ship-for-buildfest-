import { useEffect, useMemo, useState } from "react";
import { Eye, AlertTriangle, ZoomIn, ZoomOut, FileSearch } from "lucide-react";

const zonePalette = {
  critical: { color: "#ef4444", label: "Critical" },
  suspicious: { color: "#f97316", label: "Suspicious" },
  warning: { color: "#eab308", label: "Warning" },
  clear: { color: "#22c55e", label: "Clear" },
};

const fieldDefinitions = [
  { key: "container_id", label: "Container ID", y: 22, height: 8 },
  { key: "shipment_id", label: "Shipment ID", y: 31, height: 8 },
  { key: "commodity", label: "Commodity", y: 42, height: 9 },
  { key: "quantity", label: "Quantity", y: 55, height: 8 },
  { key: "declared_value", label: "Declared Value", y: 66, height: 8 },
  { key: "origin", label: "Origin", y: 77, height: 8 },
  { key: "destination", label: "Destination", y: 86, height: 7 },
];

function buildEstimatedZones(riskFactors, parsedFields) {
  const normalizedFactors = (riskFactors || []).map((factor) => String(factor).toLowerCase());
  const zones = [];

  fieldDefinitions.forEach((field, index) => {
    const value = parsedFields?.[field.key];
    if (value == null || value === "") return;

    let tone = "clear";
    let reason = `${field.label} extracted from the uploaded document.`;

    if (field.key === "quantity" && normalizedFactors.some((factor) => /quantity|mismatch|variance/.test(factor))) {
      tone = "critical";
      reason = "Quantity should be reviewed because document comparison detected a mismatch.";
    } else if (field.key === "declared_value" && normalizedFactors.some((factor) => /value|amount|invoice/.test(factor))) {
      tone = "suspicious";
      reason = "Declared value should be reviewed because pricing or value consistency was flagged.";
    } else if ((field.key === "origin" || field.key === "destination") && normalizedFactors.some((factor) => /origin|country|destination/.test(factor))) {
      tone = "warning";
      reason = "Route and country fields should be checked against the other uploaded documents.";
    } else if (field.key === "container_id" && normalizedFactors.some((factor) => /container|document manipulation|differs across uploaded documents/.test(factor))) {
      tone = "critical";
      reason = "Container identity appears inconsistent across the uploaded document set.";
    }

    zones.push({
      id: index + 1,
      field: field.key,
      label: field.label,
      value: String(value),
      tone,
      confidence: tone === "critical" ? 92 : tone === "suspicious" ? 84 : tone === "warning" ? 78 : 72,
      x: 16 + (index % 2) * 34,
      y: field.y,
      width: index % 2 === 0 ? 46 : 38,
      height: field.height,
      reason,
    });
  });

  if (!zones.length) {
    zones.push({
      id: 999,
      field: "overview",
      label: "Review Summary",
      value: "Parsed document content is available, but no specific review fields were extracted.",
      tone: "warning",
      confidence: 60,
      x: 18,
      y: 46,
      width: 56,
      height: 12,
      reason: "Use the extracted text excerpt and cross-document comparison to complete the review.",
    });
  }

  return zones;
}

const documentTabs = [
  { key: "invoice", label: "Commercial Invoice" },
  { key: "packing_list", label: "Packing List" },
  { key: "bill_of_lading", label: "Bill of Lading" },
];

export default function DocumentVision({ documentType, documentData, riskFactors, documents }) {
  const [zoom, setZoom] = useState(1);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [activeDocument, setActiveDocument] = useState(documentType || "invoice");

  useEffect(() => {
    setActiveDocument(documentType || "invoice");
  }, [documentType]);

  const activeData = documents?.[activeDocument] || documentData || {};

  const parsedFields = activeData?.parsed_fields || {};
  const textExcerpt = activeData?.text_excerpt || "No extracted text available.";

  const zones = useMemo(() => buildEstimatedZones(riskFactors, parsedFields), [parsedFields, riskFactors]);
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) || zones[0];
  const highlightedCount = zones.filter((zone) => zone.tone !== "clear").length;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-slate-600" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Document Review Overlay</p>
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Estimated Review Zones</h2>
          <p className="mt-2 text-sm text-slate-600">
            This view uses parsed document fields and extracted text to suggest where an officer should review the document. Exact OCR coordinates are not enabled in the current build.
          </p>
        </div>
        {highlightedCount > 0 ? (
          <div className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">{highlightedCount} flagged review zones</span>
          </div>
        ) : null}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {documentTabs.map((tab) => {
          const fileName = documents?.[tab.key]?.file_name;
          const active = activeDocument === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveDocument(tab.key);
                setSelectedZoneId(null);
              }}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-800"
              }`}
            >
              <p className={`text-sm font-semibold ${active ? "text-white" : "text-slate-900"}`}>{tab.label}</p>
              <p className={`mt-1 truncate text-xs ${active ? "text-slate-200" : "text-slate-500"}`}>
                {fileName || "No file selected"}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          <div className="absolute right-3 top-3 z-10 flex gap-2">
            <button onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))} className="rounded-lg bg-white p-2 shadow-sm hover:bg-slate-50">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="rounded-lg bg-white px-3 py-2 text-sm font-medium shadow-sm">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((value) => Math.min(2, value + 0.25))} className="rounded-lg bg-white p-2 shadow-sm hover:bg-slate-50">
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-[420px] overflow-auto p-8">
            <div className="mx-auto w-[560px]" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
              <div className="relative rounded-sm bg-white p-8 shadow-lg">
                <div className="mb-6 border-b-2 border-slate-800 pb-4">
                  <h3 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
                    {documentTabs.find((tab) => tab.key === activeDocument)?.label || "Document"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">Reference {parsedFields?.shipment_id || parsedFields?.container_id || "REF-001"}</p>
                </div>

                <div className="grid gap-3">
                  {fieldDefinitions.map((field) => (
                    <div key={field.key} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{field.label}</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{parsedFields?.[field.key] ?? "Not extracted"}</p>
                    </div>
                  ))}
                </div>

                {zones.map((zone) => {
                  const palette = zonePalette[zone.tone];
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setSelectedZoneId(zone.id)}
                      className="absolute cursor-pointer rounded-md transition-all hover:scale-[1.01]"
                      style={{
                        left: `${zone.x}%`,
                        top: `${zone.y}%`,
                        width: `${zone.width}%`,
                        height: `${zone.height}%`,
                        border: `3px solid ${palette.color}`,
                        backgroundColor: `${palette.color}18`,
                        boxShadow: selectedZone?.id === zone.id ? `0 0 0 4px ${palette.color}20` : "none",
                      }}
                    >
                      <span
                        className="absolute -top-6 left-0 rounded px-2 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: palette.color }}
                      >
                        {zone.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 p-3 shadow-sm backdrop-blur">
            <p className="mb-2 text-xs font-semibold text-slate-600">Zone meaning:</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.values(zonePalette).map((tone) => (
                <span key={tone.label} className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded" style={{ backgroundColor: tone.color }} />
                  {tone.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Review Zones ({zones.length})</p>
            <div className="mt-3 space-y-3">
              {zones.map((zone) => {
                const palette = zonePalette[zone.tone];
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={`w-full rounded-xl border-2 p-4 text-left transition ${selectedZone?.id === zone.id ? "border-slate-800 bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{zone.label}</p>
                        <p className="mt-1 text-sm text-slate-600">{zone.reason}</p>
                        <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Extracted value</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{zone.value}</p>
                      </div>
                      <span className="rounded px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: palette.color }}>
                        {zone.confidence}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-slate-600" />
              <p className="text-sm font-semibold text-slate-900">Extracted Text Snippet</p>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{textExcerpt}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <StatCard value={zones.length} label="Zones Shown" tone="text-slate-900" />
        <StatCard value={`${Math.round(zones.reduce((sum, zone) => sum + zone.confidence, 0) / zones.length)}%`} label="Avg Review Confidence" tone="text-red-600" />
        <StatCard value={highlightedCount} label="Flagged Zones" tone="text-amber-600" />
        <StatCard value={documentTabs.find((tab) => tab.key === activeDocument)?.label || activeDocument} label="Document Type" tone="text-slate-900" />
      </div>
    </section>
  );
}

function StatCard({ value, label, tone }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      <p className="text-xs text-slate-600">{label}</p>
    </div>
  );
}
