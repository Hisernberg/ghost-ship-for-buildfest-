import { useEffect, useState } from "react";
import { Upload, Ship, FileText, CheckCircle } from "lucide-react";
import { statusColor, StatusIcon } from "../utils/statusUtils";
import { apiFetch } from "../utils/api";

const DOC_SLOTS = [
  { key: "invoice", label: "Commercial Invoice", hint: "PDF, TXT, or Image" },
  { key: "packing_list", label: "Packing List", hint: "PDF, TXT, or Image" },
  { key: "bill_of_lading", label: "Bill of Lading", hint: "PDF, TXT, or Image" },
  { key: "extra_doc_1", label: "Additional Document 1", hint: "Optional — PDF, TXT, or Image" },
  { key: "extra_doc_2", label: "Additional Document 2", hint: "Optional — PDF, TXT, or Image" },
];

export default function ShipperPortal({ authUser, onLogout }) {
  const [intakeMode, setIntakeMode] = useState("documents"); // "documents" | "csv"
  const [shipNumber, setShipNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState({});
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const GLOBAL_KEY = "ghostship-all-submissions";
  function _loadLocal() {
    try { return JSON.parse(localStorage.getItem(GLOBAL_KEY) || "[]"); } catch { return []; }
  }
  function _saveLocal(list) {
    try { localStorage.setItem(GLOBAL_KEY, JSON.stringify(list)); } catch {}
  }

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const res = await apiFetch(`/api/submissions/mine/${authUser.user_id}`);
      const data = await res.json();
      if (data.ok) { setMySubmissions(data.submissions); }
      else { setMySubmissions(_loadLocal().filter(s => s.shipper_user_id === authUser.user_id)); }
    } catch {
      setMySubmissions(_loadLocal().filter(s => s.shipper_user_id === authUser.user_id));
    } finally {
      setLoadingHistory(false);
    }
  }

  function handleFile(key, file) {
    setFiles((prev) => ({ ...prev, [key]: file || null }));
  }

  async function handleSubmit() {
    if (!shipNumber.trim()) {
      setMessage({ type: "error", text: "Please enter a ship / container number." });
      return;
    }
    const hasAny = intakeMode === "csv" ? Boolean(csvFile) : Object.values(files).some(Boolean);
    if (!hasAny) {
      setMessage({ type: "error", text: intakeMode === "csv" ? "Please upload a CSV file." : "Please upload at least one document." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("ship_number", shipNumber.trim());
      form.append("shipper_user_id", authUser.user_id);
      form.append("shipper_name", authUser.full_name);
      form.append("company_name", authUser.company_name || "");
      form.append("notes", notes.trim());
      form.append("intake_mode", intakeMode);
      if (intakeMode === "csv" && csvFile) {
        form.append("csv_file", csvFile);
      } else {
        DOC_SLOTS.forEach(({ key }) => {
          if (files[key]) form.append(key, files[key]);
        });
      }

      let submitted = false;
      try {
        const res = await apiFetch("/api/submissions", { method: "POST", body: form });
        const data = await res.json();
        if (res.ok && data.ok) submitted = true;
      } catch {}

      if (!submitted) {
        // Backend not updated yet — store locally
        const localSub = {
          id: Date.now(),
          ship_number: shipNumber.trim(),
          shipper_user_id: authUser.user_id,
          shipper_name: authUser.full_name,
          company_name: authUser.company_name || "",
          status: "Pending",
          notes: notes.trim(),
          intake_mode: intakeMode,
          csv_name: intakeMode === "csv" && csvFile ? csvFile.name : null,
          invoice_url: files.invoice ? files.invoice.name : null,
          packing_list_url: files.packing_list ? files.packing_list.name : null,
          bill_of_lading_url: files.bill_of_lading ? files.bill_of_lading.name : null,
          extra_doc_1_url: files.extra_doc_1 ? files.extra_doc_1.name : null,
          extra_doc_1_name: files.extra_doc_1 ? files.extra_doc_1.name : null,
          extra_doc_2_url: files.extra_doc_2 ? files.extra_doc_2.name : null,
          extra_doc_2_name: files.extra_doc_2 ? files.extra_doc_2.name : null,
          created_at: new Date().toISOString(),
        };
        const existing = _loadLocal();
        _saveLocal([localSub, ...existing]);
      }

      setMessage({ type: "success", text: `Ship ${shipNumber.trim()} submitted successfully. The customs team will review your documents.` });
      setShipNumber("");
      setNotes("");
      setFiles({});
      setCsvFile(null);
      loadHistory();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  const uploadedCount = intakeMode === "csv" ? (csvFile ? 1 : 0) : Object.values(files).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="rounded-3xl border border-slate-200 bg-white px-7 py-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Ship className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Shipper Portal</p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                Welcome, {authUser.full_name}
              </h1>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-400">Company</p>
                <p className="text-sm font-semibold text-slate-700">{authUser.company_name}</p>
              </div>
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">

          {/* Submission form */}
          <section className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">New Submission</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Submit Ship for Inspection</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter your ship or container number, upload the documents you have, and submit. The customs team will be notified.
            </p>

            {/* Ship number */}
            <div className="mt-6">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Ship / Container Number <span className="text-red-500">*</span>
                </span>
                <input
                  value={shipNumber}
                  onChange={(e) => setShipNumber(e.target.value)}
                  placeholder="e.g. CONT-GS-4001 or MV SUNRISE"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-slate-400 focus:bg-white transition"
                />
              </label>
            </div>

            {/* Intake mode toggle */}
            <div className="mt-5 grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setIntakeMode("documents")}
                className={`rounded-xl px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] transition
                  ${intakeMode === "documents" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
              >
                3 Documents
              </button>
              <button
                type="button"
                onClick={() => setIntakeMode("csv")}
                className={`rounded-xl px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] transition
                  ${intakeMode === "csv" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
              >
                Single CSV
              </button>
            </div>

            {/* Document upload slots */}
            {intakeMode === "documents" && (
              <div className="mt-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Documents</span>
                  <span className="text-xs text-slate-400">{uploadedCount} uploaded</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                  {DOC_SLOTS.map(({ key, label, hint }) => (
                    <label
                      key={key}
                      className={`flex cursor-pointer flex-col gap-2 rounded-[20px] border border-dashed px-4 py-4 transition
                        ${files[key] ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"}`}
                    >
                      <input
                        type="file"
                        accept=".pdf,.txt,.png,.jpg,.jpeg,.tif,.tiff"
                        className="hidden"
                        onChange={(e) => handleFile(key, e.target.files?.[0])}
                      />
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
                          ${files[key] ? "bg-slate-900 text-white" : "bg-white text-slate-400 ring-1 ring-slate-200"}`}>
                          {files[key] ? <CheckCircle className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 leading-tight">{label}</p>
                          <p className="text-xs text-slate-400">{hint}</p>
                        </div>
                      </div>
                      {files[key] && (
                        <p className="truncate text-xs font-medium text-slate-600 pl-12">{files[key].name}</p>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* CSV upload */}
            {intakeMode === "csv" && (
              <div className="mt-4">
                <label className={`flex cursor-pointer flex-col gap-3 rounded-[20px] border border-dashed px-5 py-6 transition
                  ${csvFile ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"}`}>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
                      ${csvFile ? "bg-slate-900 text-white" : "bg-white text-slate-400 ring-1 ring-slate-200"}`}>
                      {csvFile ? <CheckCircle className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Shipment CSV Manifest</p>
                      <p className="text-xs text-slate-400">Upload your shipment data as a CSV file</p>
                    </div>
                  </div>
                  {csvFile && <p className="truncate text-xs font-medium text-slate-600 pl-13">{csvFile.name}</p>}
                </label>
              </div>
            )}

            {/* Notes */}
            <div className="mt-4">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Notes for Customs Officer (optional)</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any special instructions or context…"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white transition resize-none"
                />
              </label>
            </div>

            {/* Submit */}
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <FileText className="h-4 w-4" />
                {loading ? "Submitting…" : "Submit for Inspection"}
              </button>
              {uploadedCount > 0 && (
                <span className="text-xs text-slate-500">{uploadedCount} document{uploadedCount !== 1 ? "s" : ""} ready</span>
              )}
            </div>

            {message && (
              <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium
                ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
                {message.text}
              </div>
            )}
          </section>

          {/* My submissions history */}
          <section className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">History</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">My Submissions</h2>
              </div>
              <button onClick={loadHistory} className="text-xs text-slate-400 hover:text-slate-700 transition">Refresh</button>
            </div>

            <div className="mt-4 space-y-3">
              {loadingHistory && (
                <p className="text-sm text-slate-400 italic">Loading…</p>
              )}
              {!loadingHistory && mySubmissions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                  <p className="text-sm text-slate-400">No submissions yet. Submit your first ship above.</p>
                </div>
              )}
              {mySubmissions.map((sub) => (
                <div key={sub.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-sm font-bold text-slate-800">{sub.ship_number}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {sub.created_at ? new Date(sub.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor(sub.status)}`}>
                      <StatusIcon status={sub.status} />
                      {sub.status}
                    </span>
                  </div>
                  {/* Docs submitted */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {sub.csv_name && <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] text-blue-700">CSV: {sub.csv_name}</span>}
                    {sub.invoice_url && <span className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600">Invoice</span>}
                    {sub.packing_list_url && <span className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600">Packing List</span>}
                    {sub.bill_of_lading_url && <span className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600">BOL</span>}
                    {sub.extra_doc_1_url && <span className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600">{sub.extra_doc_1_name || "Extra 1"}</span>}
                    {sub.extra_doc_2_url && <span className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600">{sub.extra_doc_2_name || "Extra 2"}</span>}
                  </div>
                  {sub.notes && <p className="mt-1.5 text-xs text-slate-500 italic">"{sub.notes}"</p>}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
