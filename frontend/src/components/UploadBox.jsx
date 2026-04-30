import { Upload } from "lucide-react";

const documentFields = [
  { key: "invoice", label: "Commercial Invoice" },
  { key: "packing_list", label: "Packing List" },
  { key: "bill_of_lading", label: "Bill of Lading" },
];

const intakeModes = [
  { key: "documents", label: "3 Documents" },
  { key: "csv", label: "Single CSV" },
];

export default function UploadBox({
  intakeMode,
  setIntakeMode,
  documents,
  csvFile,
  csvSettings,
  onCsvSettingChange,
  loading,
  error,
  onFileChange,
  onCsvChange,
  onUseDemoDocuments,
  demoDocumentLoading,
  demoDocumentMessage,
  onUseDemoCsv,
  demoCsvLoading,
  demoCsvMessage,
  handleAnalyze,
}) {
  const ready = intakeMode === "documents" ? Object.values(documents).every(Boolean) : Boolean(csvFile);
  const uploadedCount = intakeMode === "documents" ? Object.values(documents).filter(Boolean).length : csvFile ? 1 : 0;
  const totalRequired = intakeMode === "documents" ? 3 : 1;
  const workflowText =
    intakeMode === "documents"
      ? "Upload all 3 documents. We compare, score, and flag the highest-risk issues."
      : "Upload your CSV. We scan every row and surface the riskiest shipments first.";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Document Intake</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-slate-950">
            {intakeMode === "documents" ? "Upload Shipment Document Set" : "Upload Shipment Manifest"}
          </h2>
        </div>
        <div className="flex w-full flex-col gap-3 xl:w-auto xl:min-w-[420px] xl:items-end">
          <div className="grid w-full grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100 p-1 xl:max-w-[440px]">
            {intakeModes.map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => setIntakeMode(mode.key)}
                className={`rounded-xl px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  intakeMode === mode.key
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
            {intakeMode === "documents" ? "PDF / TXT / Image" : "CSV"}
          </span>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-700">
            {uploadedCount} of {totalRequired} {intakeMode === "documents" ? "documents" : "files"} uploaded
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {ready ? "Ready for review" : "Awaiting upload"}
          </p>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-slate-900 transition-all duration-700"
            style={{ width: `${(uploadedCount / totalRequired) * 100}%` }}
          />
        </div>
      </div>

      {intakeMode === "documents" ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {documentFields.map((field) => (
              <label
                key={field.key}
                className="block min-w-0 rounded-[28px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-6 transition hover:border-slate-400 hover:bg-white"
              >
                <input
                  type="file"
                  accept=".pdf,.txt,.png,.jpg,.jpeg,.tif,.tiff"
                  className="hidden"
                  onChange={(event) => onFileChange(field.key, event.target.files?.[0])}
                />
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm ring-1 ring-slate-200">
                    <Upload className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-semibold text-slate-900">{field.label}</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">Upload the supporting document for this shipment.</p>
                    <p
                      className={`mt-4 text-sm font-medium ${
                        documents[field.key]?.name ? "break-all text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {documents[field.key]?.name || "No file selected"}
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="rounded-[28px] border border-blue-200 bg-blue-50/80 px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Demo Mode</p>
                <h3 className="mt-2 text-base font-semibold text-slate-900">Load a prepared 3-document set</h3>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Instantly populate invoice, packing list, and bill of lading with a guided 4-second demo review.
                </p>
              </div>
              <button
                type="button"
                onClick={onUseDemoDocuments}
                disabled={loading || demoDocumentLoading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300 lg:w-auto"
              >
                {demoDocumentLoading ? "Preparing Demo..." : "Use Demo 3 Documents"}
              </button>
            </div>
            {demoDocumentMessage ? (
              <p className="mt-3 text-sm font-medium text-blue-900">{demoDocumentMessage}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block min-w-0 rounded-[28px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-6 transition hover:border-slate-400 hover:bg-white">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(event) => onCsvChange(event.target.files?.[0])}
            />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Upload className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-base font-semibold text-slate-900">Shipment CSV Manifest</h3>
                <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                  Upload your shipment manifest. We&apos;ll scan every row for discrepancies and shipment anomalies.
                </p>
                <p className="mt-3 truncate text-sm font-medium text-slate-900">
                  {csvFile?.name || "Drop your CSV here, or click to browse"}
                </p>
              </div>
            </div>
          </label>

          <div className="rounded-[28px] border border-blue-200 bg-blue-50/80 px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Demo Mode</p>
                <h3 className="mt-2 text-base font-semibold text-slate-900">Use the prepared manifest instantly</h3>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Load `DATASHEET-01.csv` and run a guided demo analysis without browsing for a file.
                </p>
              </div>
              <button
                type="button"
                onClick={onUseDemoCsv}
                disabled={loading || demoCsvLoading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300 lg:w-auto"
              >
                {demoCsvLoading ? "Preparing Demo..." : "Use Demo CSV"}
              </button>
            </div>
            {demoCsvMessage ? (
              <p className="mt-3 text-sm font-medium text-blue-900">{demoCsvMessage}</p>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Analysis Settings</p>
                <h3 className="mt-2 text-base font-semibold text-slate-900">CSV Risk Threshold Controls</h3>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Operator
              </span>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Low risk max</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={csvSettings.low_risk_max}
                  onChange={(event) => onCsvSettingChange("low_risk_max", event.target.value)}
                  className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none"
                />
              </label>
              <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Medium risk max</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={csvSettings.medium_risk_max}
                  onChange={(event) => onCsvSettingChange("medium_risk_max", event.target.value)}
                  className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none"
                />
              </label>
              <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Quantity mismatch threshold</span>
                <input
                  type="number"
                  min="0.01"
                  max="1"
                  step="0.01"
                  value={csvSettings.quantity_mismatch_threshold}
                  onChange={(event) => onCsvSettingChange("quantity_mismatch_threshold", event.target.value)}
                  className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none"
                />
              </label>
              <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Value mismatch threshold</span>
                <input
                  type="number"
                  min="0.01"
                  max="1"
                  step="0.01"
                  value={csvSettings.value_mismatch_threshold}
                  onChange={(event) => onCsvSettingChange("value_mismatch_threshold", event.target.value)}
                  className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none"
                />
              </label>
              <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Density threshold</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={csvSettings.density_threshold}
                  onChange={(event) => onCsvSettingChange("density_threshold", event.target.value)}
                  className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none"
                />
              </label>
              <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Perishable Temperature Minimum</span>
                <input
                  type="number"
                  min="-20"
                  max="40"
                  step="1"
                  value={csvSettings.banana_temperature_floor}
                  onChange={(event) => onCsvSettingChange("banana_temperature_floor", event.target.value)}
                  className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 xl:max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Workflow</p>
          <p className="mt-2 text-sm leading-7 text-slate-700">{workflowText}</p>
        </div>
        <button
          type="button"
          disabled={!ready || loading}
          onClick={handleAnalyze}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.01] hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none xl:w-auto"
        >
          {loading ? "Documents received. Analyzing..." : "Run Analysis"}
        </button>
      </div>

      {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
    </section>
  );
}
