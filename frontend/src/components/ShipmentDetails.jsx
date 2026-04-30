export default function ShipmentDetails({ details, intakeMode }) {
  const entries =
    intakeMode === "csv"
      ? [
          ["Shipment ID", details.shipmentId],
          ...(details.containerId && details.containerId !== details.shipmentId ? [["Container ID", details.containerId]] : []),
          ["Commodity", details.commodity],
          ["Origin country", details.origin],
          ["Quantity", details.quantity],
          ["Declared Value", details.declaredValue],
          ["Data source", "CSV Manifest"],
        ]
      : [
          ["Container ID", details.containerId],
          ["Shipment ID", details.shipmentId],
          ["Commodity", details.commodity],
          ["Origin country", details.origin],
          ["Destination", details.destination],
          ["Quantity", details.quantity],
          ["Declared Value", details.declaredValue],
          ["Weight", details.weight],
          ["Volume", details.volume],
          ["Temperature", details.temperature],
        ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Shipment Details</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
        {intakeMode === "csv" ? "Primary Flagged Shipment" : "Cross-Document Shipment View"}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {intakeMode === "csv"
          ? "Showing the highest-risk shipment identified from the uploaded manifest."
          : "Showing the normalized shipment record assembled from the uploaded document set."}
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {entries.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
